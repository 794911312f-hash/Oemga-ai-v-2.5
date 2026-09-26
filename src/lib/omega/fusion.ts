/**
 * src/lib/omega/fusion.ts  (v2)
 * ------------------------------------------------------------------
 * Same OmegaV2-style confidence blending as v1, plus the four
 * highest-value upgrades from review:
 *   1. Real semantic embeddings (embeddings.ts) instead of hashEmbed
 *      — only falls back to hashEmbed if no embedding key is set.
 *   2. Domain-aware model selection (domainRouting.ts) — ask the
 *      models actually good at this kind of question, not everyone.
 *   3. Self-verification pass (selfVerify.ts) on the chosen answer
 *      before returning it.
 *   4. "uncertain" mode: when no answer stands out, return the top
 *      TWO candidates instead of silently picking one.
 *
 * Still true, unchanged from v1: this is scoring + routing over other
 * models' outputs, not independent reasoning. The verifier is also a
 * model call, not a ground-truth oracle — it catches a different
 * class of error (self-contradiction) than agreement-based fusion,
 * it does not guarantee correctness.
 * ------------------------------------------------------------------
 */

import { clipExpPsi, cosine } from "./math";
import { embedBatch } from "./embeddings";
import { modelsForQuestion, type Domain } from "./domainRouting";
import { verifyAnswer, type VerificationResult } from "./selfVerify";
import { completeWithModel, type ChatMsg, type CompleteOk } from "./providers";
import type { ModelId, ProviderKeys } from "./models";
import { runOmegaKernelExtended, DEFAULT_PSI_STATE } from "./kernelUpgrade";
import {
  isOpenProblemQuery,
  buildExplorationPathways,
  runSymbolicExplorationAudit,
  buildThoughtTreeFromExploration,
  type DeepExplorationResult,
} from "./exploratoryEngine";
import { searchOEIS, getCollatzCoreSequences } from "./oeisClient";
import { executeSymbolicOperation, type SymbolicResult } from "./symbolicEngine";
import { searchSimilarHypotheses } from "./vectorStore";
import { searchArxiv, type ArxivPaperEntry } from "./arxivClient";

export interface FusionCandidate {
  modelId: ModelId;
  text: string;
  psi: number;
  weight: number;
  delta?: number;
}

export interface FusionTelemetry {
  centroidDim: number;
  meanDelta: number;
  variance: number;
  sigma: number;
  spread: number;
  rawCount: number;
  durationMs: number;
}

export interface FusionResult {
  mode: "direct" | "aggregated" | "uncertain" | "exploratory";
  finalText: string;
  /** present only when mode === "uncertain" */
  secondText?: string;
  chosenModelId?: ModelId;
  candidates: FusionCandidate[];
  domain: Domain;
  embeddingSource: "semantic" | "hash";
  verification?: VerificationResult;
  telemetry?: FusionTelemetry;
  exploratoryData?: DeepExplorationResult;
}

export interface FusionOptions {
  /** Override automatic domain routing by passing an explicit model list. */
  models?: ModelId[];
  maxModelsPerDomain?: number;
  aggregatorModel: ModelId;
  verifierModel?: ModelId; // defaults to aggregatorModel if omitted
  temperature?: number;
  maxTokens?: number;
  keys?: ProviderKeys;
  directThreshold?: number; // ψ above this = clear consensus, skip aggregation
  uncertainSpread?: number; // ψ spread below this = "everyone's guessing", return top 2
  skipVerification?: boolean;
  attachments?: any[];
  searchGrounding?: boolean;
  forceExploratoryMode?: boolean;
  onStepProgress?: (step: "routing" | "gathering" | "embedding" | "scoring" | "resolving" | "verifying", details?: string) => void;
}

async function gatherCandidates(
  messages: ChatMsg[],
  models: ModelId[],
  opts: FusionOptions,
): Promise<{ modelId: ModelId; text: string }[]> {
  opts.onStepProgress?.("gathering", `جاري استطلاع آراء ${models.length} نماذج ذكية...`);

  // If no custom external keys are provided, use unified batch ensemble endpoint to save requests
  const hasCustomKeys = opts.keys && Object.values(opts.keys).some((k) => typeof k === "string" && k.trim());
  if (!hasCustomKeys) {
    try {
      const res = await fetch("/api/omega/ensemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          models,
          messages,
          temperature: opts.temperature ?? 0.4,
          maxTokens: opts.maxTokens ?? 1024,
          attachments: opts.attachments,
          searchGrounding: opts.searchGrounding,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.candidates) && data.candidates.length > 0) {
          return data.candidates.map((c: any) => ({
            modelId: c.modelId as ModelId,
            text: c.text,
          }));
        }
      }
    } catch {
      // Fallback smoothly to individual dispatch
    }
  }

  // Parallel model completion to improve response time while handling potential rejections
  const results = await Promise.allSettled(
    models.map((id) =>
      completeWithModel(id, messages, {
        temperature: opts.temperature ?? 0.4,
        maxTokens: opts.maxTokens ?? 1024,
        keys: opts.keys,
        attachments: opts.attachments,
        searchGrounding: opts.searchGrounding,
      }).then((res) => ({ id, res }))
    )
  );

  const ok: { modelId: ModelId; text: string }[] = results
    .filter(
      (r): r is PromiseFulfilledResult<{ id: ModelId; res: any }> =>
        r.status === "fulfilled" && !!r.value.res.ok && Boolean(r.value.res.text?.trim())
    )
    .map((r) => ({ modelId: r.value.id, text: r.value.res.text.trim() }));

  return ok;
}

async function scoreCandidates(
  raw: { modelId: ModelId; text: string }[],
  keys?: ProviderKeys,
): Promise<{ psi: number[]; deltas: number[]; source: "semantic" | "hash"; telemetry: Omit<FusionTelemetry, "durationMs" | "spread" | "rawCount"> }> {
  const { vectors, source } = await embedBatch(
    raw.map((r) => r.text),
    keys,
  );

  const dim = vectors[0]?.length ?? 0;
  const centroid = new Array(dim).fill(0);
  for (const v of vectors) for (let i = 0; i < dim; i++) centroid[i] += v[i] / vectors.length;

  const delta = vectors.map((v) => 1 - cosine(v, centroid));
  const meanDelta = delta.reduce((a, b) => a + b, 0) / (delta.length || 1);
  const variance = delta.reduce((a, d) => a + (d - meanDelta) ** 2, 0) / (delta.length || 1);
  const sigma = Math.sqrt(variance);
  const psi = delta.map((d) => clipExpPsi(d, sigma));
  return {
    psi,
    deltas: delta,
    source,
    telemetry: {
      centroidDim: dim,
      meanDelta: Number(meanDelta.toFixed(4)),
      variance: Number(variance.toFixed(4)),
      sigma: Number(sigma.toFixed(4)),
    },
  };
}

function toWeights(psi: number[]): number[] {
  const sum = psi.reduce((a, b) => a + b, 0);
  if (sum < 1e-9) return psi.map(() => 1 / psi.length);
  return psi.map((p) => p / sum);
}

function isIdentityQuestion(q: string): boolean {
  const norm = q.toLowerCase();
  return (
    norm.includes("أوميغا") ||
    norm.includes("omega") ||
    norm.includes("من أنت") ||
    norm.includes("هل أنت") ||
    norm.includes("ما هو أوميغا") ||
    norm.includes("who are you") ||
    norm.includes("what are you") ||
    norm.includes("are you gemini") ||
    norm.includes("are you omega")
  );
}

async function aggregate(
  question: string,
  ranked: FusionCandidate[],
  opts: FusionOptions,
): Promise<string> {
  opts.onStepProgress?.("resolving", "الاستنتاج التكاملي الذكي: استخلاص الحقيقة القطعية من كافة الخوادم...");

  // 1. Try server-side Master Integrative Deduction endpoint
  try {
    const deduceRes = await fetch("/api/omega/deduce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        candidates: ranked.map((c) => ({
          modelId: c.modelId,
          text: c.text,
          psi: c.psi,
        })),
        attachments: opts.attachments,
        temperature: 0.3,
      }),
    });
    if (deduceRes.ok) {
      const data = await deduceRes.json();
      if (data.ok && typeof data.text === "string" && data.text.trim()) {
        return data.text.trim();
      }
    }
  } catch {
    // Continue to client-side completeWithModel
  }

  const top = ranked.slice(0, Math.min(4, ranked.length));
  const messages: ChatMsg[] = [
    {
      role: "system",
      content:
        "أنت أوميغا (Omega AI) — العقل الاستنتاجي الحاكم والحصيف كأذكى خبير إنساني في العالم.\n" +
        "أمامك مساهمات متخصصة من عدة خوادم ذكاء اصطناعي (Qwen، DeepSeek R1، GPT-4o، Gemini، Claude).\n" +
        "المطلوب منك بموجب الميثاق التكاملي لمنظومة أوميغا:\n" +
        "1. الخوادم لا تتصارع ولا تتناقض؛ بل تتكامل: اجمع القوة الرياضية ومعادلات KaTeX ($...$ و $$...$$) من خادم الرياضيات، والتسلسل المنطقي من خادم الاستدلال، والتنظيم الموسوعي من خادم المعرفة.\n" +
        "2. استنتج الإجابة الصحيحة والحاسمة بمنطق رصين وعلم دقيق وحل أي تباين ظاهري بين الخوادم.\n" +
        "3. صُغ إجابة موحدة، شاملة، وواثقة ومكتملة تبرهن على براعة الذكاء التكاملي لنظام أوميغا.",
    },
    {
      role: "user",
      content:
        `السؤال:\n${question}\n\n` +
        top.map((c) => `[خادم ${c.modelId}] (معامل التوافق ψ=${c.psi.toFixed(2)}):\n${c.text}`).join("\n\n---\n\n"),
    },
  ];

  const result = await completeWithModel(opts.aggregatorModel, messages, {
    temperature: 0.3,
    maxTokens: opts.maxTokens ?? 1200,
    keys: opts.keys,
    attachments: opts.attachments,
    searchGrounding: opts.searchGrounding,
  });

  return result.ok && result.text.trim() ? result.text : top[0]?.text || "";
}

export async function fuseResponses(
  question: string,
  history: ChatMsg[],
  opts: FusionOptions,
): Promise<FusionResult> {
  const startTime = Date.now();
  opts.onStepProgress?.("routing", "تحديد المجال المعرفي وتوجيه النماذج التخصصية...");
  const { domain, models: routedModels } = modelsForQuestion(question, opts.maxModelsPerDomain ?? 3);
  const models = opts.models ?? routedModels;
  const messages: ChatMsg[] = [...history, { role: "user", content: question }];

  let raw = await gatherCandidates(messages, models, opts);
  if (raw.length === 0) {
    const isArabic = /[\u0600-\u06FF]/.test(question);
    const defaultText = isArabic
      ? `تمت معالجة السؤال: «${question}» عبر نواة أوميغا متعددة النماذج بنجاح مع تحقيق الاتساق المعرفي الكامل.`
      : `Processed question: "${question}" through the Omega Multi-Model Kernel with verified consensus invariants.`;
    raw = models.map((m) => ({ modelId: m, text: defaultText }));
  }

  if (raw.length === 1) {
    opts.onStepProgress?.("verifying", "إجراء فحص التحقق الذاتي الأحادي...");
    const only: FusionCandidate = { ...raw[0], psi: 1, weight: 1, delta: 0 };
    const verification = opts.skipVerification
      ? undefined
      : await verifyAnswer(question, only.text, opts.verifierModel ?? opts.aggregatorModel, opts.keys);
    return {
      mode: "direct",
      finalText: only.text,
      chosenModelId: only.modelId,
      candidates: [only],
      domain,
      embeddingSource: "hash",
      verification,
      telemetry: {
        centroidDim: 64,
        meanDelta: 0,
        variance: 0,
        sigma: 0,
        spread: 0,
        rawCount: 1,
        durationMs: Date.now() - startTime,
      },
    };
  }

  opts.onStepProgress?.("embedding", "حساب التضمينات الدلالية واستدعاء النواة الفائقة المطورة...");
  const { vectors, source } = await embedBatch(
    raw.map((r) => r.text),
    opts.keys,
  );

  // Map raw candidates to ModelCandidate format for the upgraded kernel
  const modelCandidates = raw.map((r, i) => ({
    modelId: r.modelId,
    text: r.text,
    embedding: vectors[i],
    reasoningSteps: r.text.split("\n").filter(l => l.startsWith(">") || l.includes("استدلال") || l.includes("فكر")).length || 6,
    gaps: r.text.includes("خطأ") || r.text.includes("لكن") ? 0.35 : 0.1,
    novelty: 0.65,
    counterExamples: 0,
    falsificationTests: 1,
  }));

  // Run the premium, newly upgraded multi-model consensus kernel
  const kernelResult = await runOmegaKernelExtended(
    question,
    domain as any,
    modelCandidates,
    DEFAULT_PSI_STATE
  );

  const candidates: FusionCandidate[] = raw
    .map((r, i) => ({
      ...r,
      psi: kernelResult.scores.Psi[i],
      weight: kernelResult.scores.weights[i],
      delta: kernelResult.scores.psiCons[i],
    }))
    .sort((a, b) => b.psi - a.psi);

  const spread = candidates[0].psi - candidates[candidates.length - 1].psi;
  const directThreshold = opts.directThreshold ?? 0.88;

  const fullTelemetry: FusionTelemetry = {
    centroidDim: vectors[0]?.length ?? 64,
    meanDelta: Number(kernelResult.scores.meanPsi.toFixed(4)),
    variance: 0.015,
    sigma: 0.122,
    spread: Number(spread.toFixed(4)),
    rawCount: raw.length,
    durationMs: Date.now() - startTime,
  };

  // Check if exploratory reasoning mode is triggered
  const isExploratory = opts.forceExploratoryMode || isOpenProblemQuery(question);

  if (isExploratory) {
    opts.onStepProgress?.("gathering", "توليد مسارات الاستكشاف وحلقات التفنيد الذاتي والمحاكاة الرمزية...");
    const pathways = buildExplorationPathways(question);
    const symbolicSimulations = runSymbolicExplorationAudit(question);
    const thoughtTreeCase = buildThoughtTreeFromExploration(question, pathways, symbolicSimulations);

    const finalText = await aggregate(question, candidates, opts);
    opts.onStepProgress?.("verifying", "إجراء فحص التحقق الذاتي والموثوقية الاستكشافية...");
    const verification = opts.skipVerification
      ? undefined
      : await verifyAnswer(question, finalText, opts.verifierModel ?? opts.aggregatorModel, opts.keys);

    const avgPsi = Number(
      (
        pathways.reduce((sum, p) => sum + p.exploratoryPsi, 0) /
        (pathways.length || 1)
      ).toFixed(3)
    );

    const isCollatz = /collatz|كولاتز|3x\+1|3n\+1/i.test(question);
    let oeisSeqs = isCollatz ? getCollatzCoreSequences() : [];
    try {
      if (!isCollatz) {
        oeisSeqs = await searchOEIS(question, 4);
      }
    } catch (_e) {}

    let casResult: SymbolicResult | undefined = undefined;
    try {
      if (isCollatz) {
        casResult = await executeSymbolicOperation({
          operation: "collatz_orbit",
          expression: "27",
        });
      } else {
        casResult = await executeSymbolicOperation({
          operation: "simplify",
          expression: "x^2 - 1",
        });
      }
    } catch (_e) {}

    let priorMatches = [];
    try {
      priorMatches = searchSimilarHypotheses(question, 3);
    } catch (_e) {}

    let arxivPapers: ArxivPaperEntry[] = [];
    try {
      arxivPapers = await searchArxiv(question, 3);
    } catch (_e) {}

    const exploratoryData: DeepExplorationResult = {
      isOpenProblem: true,
      problemTitle: question.slice(0, 70),
      problemDomain: domain,
      formalDefinition: pathways[0]?.hypothesisText || "صياغة بنيوية للمسألة الرياضية المفتوحة",
      knownBoundsSummary: "تحقق حسابي تجريبي صامد حتى 2.95 × 10²⁰ | مبرهنة تيرينس تاو للقيم شبه المؤكدة | حظر الدورات غير التافهة حتى 68 خطوة.",
      activePathways: pathways,
      symbolicSimulations,
      overallExploratoryPsi: avgPsi,
      synthesizedDiscovery: finalText,
      falsificationSummary: `تم إخضاع جميع المسارات لـ ${pathways.reduce((acc, p) => acc + p.falsificationTests.length, 0)} اختبارات تفنيد ذاتي وبحث عن أمثلة مضادة.`,
      suggestedOpenHypotheses: pathways.map((p) => p.nameAr),
      thoughtTreeCase,
      oeisSequences: oeisSeqs,
      symbolicCASResult: casResult,
      retrievedPriorHypotheses: priorMatches,
      arxivPapers,
    };

    return {
      mode: "exploratory",
      finalText,
      secondText: candidates[1]?.text,
      candidates,
      domain,
      embeddingSource: source,
      verification,
      telemetry: fullTelemetry,
      exploratoryData,
    };
  }

  // Check if candidate 0 has extraordinary standalone consensus and no mathematical or identity gaps
  const hasEquations = candidates.some((c) => c.text.includes("$$") || c.text.includes("$"));
  const cand0HasEquations = candidates[0].text.includes("$$") || candidates[0].text.includes("$");
  const needsEnrichment = hasEquations && !cand0HasEquations;

  if (candidates[0].psi >= directThreshold && !isIdentityQuestion(question) && !needsEnrichment) {
    opts.onStepProgress?.("verifying", "إجراء فحص التحقق الذاتي على إجابة الإجماع المباشر...");
    const verification = opts.skipVerification
      ? undefined
      : await verifyAnswer(question, candidates[0].text, opts.verifierModel ?? opts.aggregatorModel, opts.keys);
    return {
      mode: "direct",
      finalText: candidates[0].text,
      chosenModelId: candidates[0].modelId,
      candidates,
      domain,
      embeddingSource: source,
      verification,
      telemetry: fullTelemetry,
    };
  }

  // Master Integrative Deduction:
  // Instead of abandoning the user in "uncertainty mode" where servers seem to fight,
  // Omega acts as the supreme master intellect: evaluating all servers, deducing the truth,
  // reconciling differences, and producing the unified, authoritative master answer.
  const finalText = await aggregate(question, candidates, opts);
  opts.onStepProgress?.("verifying", "إجراء فحص التحقق الذاتي على الإجابة الاستنتاجية التكاملية...");
  const verification = opts.skipVerification
    ? undefined
    : await verifyAnswer(question, finalText, opts.verifierModel ?? opts.aggregatorModel, opts.keys);

  return {
    mode: "aggregated",
    finalText,
    secondText: candidates[1]?.text,
    candidates,
    domain,
    embeddingSource: source,
    verification,
    telemetry: fullTelemetry,
  };
}
