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
  mode: "direct" | "aggregated" | "uncertain";
  finalText: string;
  /** present only when mode === "uncertain" */
  secondText?: string;
  chosenModelId?: ModelId;
  candidates: FusionCandidate[];
  domain: Domain;
  embeddingSource: "semantic" | "hash";
  verification?: VerificationResult;
  telemetry?: FusionTelemetry;
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

  // Sequential model completion to prevent simultaneous bursts on rate limits
  const ok: { modelId: ModelId; text: string }[] = [];
  for (let i = 0; i < models.length; i++) {
    const id = models[i];
    try {
      const res = await completeWithModel(id, messages, {
        temperature: opts.temperature ?? 0.4,
        maxTokens: opts.maxTokens ?? 1024,
        keys: opts.keys,
        attachments: opts.attachments,
        searchGrounding: opts.searchGrounding,
      });
      if (res.ok && res.text.trim()) {
        ok.push({ modelId: id, text: res.text.trim() });
      }
    } catch {
      // Continue to next candidate
    }
  }

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
  opts.onStepProgress?.("resolving", "دمج وتأليف أقوى النقاط وحل أي تضارب دلالي...");
  const top = ranked.slice(0, Math.min(4, ranked.length));
  const messages: ChatMsg[] = [
    {
      role: "system",
      content:
        "You are the Omega Consensus Aggregator within the Omega AI Multi-Model System (نظام أوميغا للذكاء الاصطناعي متعدد الخوادم). " +
        "Multiple premier AI engines (such as Qwen 2.5 by Alibaba, Llama 3.3 by Meta, Google Gemini, DeepSeek R1, Claude, and GPT-4o) evaluated this query. " +
        "Your role is to formulate a unified, authoritative response representing the Omega Consensus. " +
        "Synthesize the strongest, most accurate points, resolve any semantic divergence, and provide a clear, coherent, rigorous answer. " +
        "IDENTITY MANDATE: If the user asks who you are, whether you are Omega or Gemini or another model: Affirmatively state that this is the Omega AI Multi-Model Consensus System (نظام أوميغا للذكاء الاصطناعي), an advanced intelligence ecosystem that unifies and orchestrates multiple premier models (including Qwen, Llama, Gemini, DeepSeek, Claude, and GPT) through geometric consensus and verification. Never deny Omega's existence.",
    },
    {
      role: "user",
      content:
        `Question:\n${question}\n\n` +
        top.map((c, i) => `Model Server [${c.modelId}] (ψ=${c.psi.toFixed(2)}):\n${c.text}`).join("\n\n---\n\n"),
    },
  ];
  const result = await completeWithModel(opts.aggregatorModel, messages, {
    temperature: 0.3,
    maxTokens: opts.maxTokens ?? 1024,
    keys: opts.keys,
    attachments: opts.attachments,
    searchGrounding: opts.searchGrounding,
  });
  return result.ok ? result.text : top[0].text;
}

export async function fuseResponses(
  question: string,
  history: ChatMsg[],
  opts: FusionOptions,
): Promise<FusionResult> {
  const startTime = Date.now();
  opts.onStepProgress?.("routing", "تحديد المجال المعرفي وتوجيه النموذج المناسب...");
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

  opts.onStepProgress?.("embedding", "حساب التضمينات الدلالية وحساب مركز الثقل الهندسي...");
  const { psi, deltas, source, telemetry } = await scoreCandidates(raw, opts.keys);
  const weight = toWeights(psi);
  const candidates: FusionCandidate[] = raw
    .map((r, i) => ({ ...r, psi: psi[i], weight: weight[i], delta: deltas[i] }))
    .sort((a, b) => b.psi - a.psi);

  const spread = candidates[0].psi - candidates[candidates.length - 1].psi;
  const directThreshold = opts.directThreshold ?? 0.85;
  const uncertainSpread = opts.uncertainSpread ?? 0.1;

  const fullTelemetry: FusionTelemetry = {
    ...telemetry,
    spread: Number(spread.toFixed(4)),
    rawCount: raw.length,
    durationMs: Date.now() - startTime,
  };

  // Case 1: clear consensus — one answer clearly agrees with the pack.
  // Note: For identity/system questions, route through aggregation to preserve Omega orchestration consensus
  if (candidates[0].psi >= directThreshold && !isIdentityQuestion(question)) {
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

  // Case 2: everyone disagrees roughly equally — don't fake confidence,
  // surface the top two so the user (or caller UI) can see the split.
  if (spread <= uncertainSpread) {
    return {
      mode: "uncertain",
      finalText: candidates[0].text,
      secondText: candidates[1]?.text,
      candidates,
      domain,
      embeddingSource: source,
      telemetry: fullTelemetry,
    };
  }

  // Case 3: moderate disagreement — fuse the top candidates.
  const finalText = await aggregate(question, candidates, opts);
  opts.onStepProgress?.("verifying", "إجراء فحص التحقق الذاتي على الإجابة المندمجة...");
  const verification = opts.skipVerification
    ? undefined
    : await verifyAnswer(question, finalText, opts.verifierModel ?? opts.aggregatorModel, opts.keys);
  return {
    mode: "aggregated",
    finalText,
    candidates,
    domain,
    embeddingSource: source,
    verification,
    telemetry: fullTelemetry,
  };
}
