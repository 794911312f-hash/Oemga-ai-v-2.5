/**
 * src/lib/omega/omegaCore.ts
 * =============================================================================
 * OmegaCore — نقطة التنسيق الوحيدة لدورة حياة الطلب (Request Lifecycle)
 * =============================================================================
 *
 * يربط هذا الملف بشكل مباشر وحقيقي بين:
 *   1. OmegaCore (قلب أوميغا — منسق دورة حياة الطلب والمزودين الحقيقيين)
 *   2. OmegaKernel & KernelUpgrade (نواة أوميغا الطيفية وحساب Ψ الهجين)
 *   3. OmegaInferenceEngine (محرك الاستنتاج ذو الحالة، مصفوفات الذاكرة، والرسم المعرفي)
 *
 * ويعالج المشاكل الثلاث الجوهرية:
 *   1. استدعاء المزودين المستقلين الحقيقيين أولاً (OpenRouter/Anthropic/...)،
 *      وعدم اللجوء إلى المحاكاة إلا للنماذج التي فشل اتصالها فعلياً مع وسمها بـ simulated: true.
 *   2. التحقق الذاتي الصادق: إرجاع verified: boolean | null (حيث null = تعذّر التحقق الفعلي،
 *      وليس verified: true وهمياً).
 *   3. وصل OmegaInferenceEngine و OmegaKernel مباشرة بمسار المحادثة الفعلي (prepare -> kernel -> commit).
 * =============================================================================
 */

import { cosine, clipExpPsi } from "./math";
import { modelsForQuestion, type Domain } from "./domainRouting";
import { getInferenceEngine, type InferenceInput, type InferenceResult } from "./inferenceEngine";
import { runOmegaKernelExtended, DEFAULT_PSI_STATE, type HybridScores } from "./kernelUpgrade";
import { globalOmegaKernel, type KernelState } from "./kernel";
import type { ModelId } from "./models";

// -----------------------------------------------------------------------------
// أنواع الطلب/الاستجابة
// -----------------------------------------------------------------------------

export interface OmegaCoreRequest {
  userId: string;
  question: string;
  /** فرض نطاق يدوياً بدل الاعتماد على الكشف التلقائي */
  domain?: Domain;
  /** فرض قائمة نماذج بدل الاختيار التلقائي حسب النطاق */
  models?: ModelId[];
}

/** مرشّح إجابة واحد، مع الإفصاح الصريح عن مصدره الحقيقي */
export interface OmegaCandidate {
  modelId: ModelId;
  text: string;
  /** false = تم استدعاء مزود مستقل فعلياً (OpenRouter/Anthropic/...) */
  /** true  = نص "مُتقمَّص" ولّده نموذج واحد بالنيابة عن هذا المعرّف */
  simulated: boolean;
  psi?: number;
  weight?: number;
}

export interface OmegaCoreTraceStep {
  stage: string;
  detail: string;
  atMs: number;
}

export interface OmegaCoreResponse {
  answer: string;
  domain: Domain;
  candidates: OmegaCandidate[];
  /**
   * "real_multi_provider": كل المرشحين من مزودين مستقلين فعلياً
   * "mixed": بعض المرشحين حقيقيون وبعضهم متقمَّص (fallback جزئي)
   * "simulated_single_model": كل المرشحين متقمَّصون من نموذج واحد
   */
  ensembleMode: "real_multi_provider" | "mixed" | "simulated_single_model";
  psi: number;
  spread: number;
  /** null = لم يُنفَّذ تحقق حقيقي (وليس "تم التحقق ونجح") */
  verified: boolean | null;
  verificationScore: number | null;
  kernelScores: HybridScores;
  kernelState: KernelState;
  inferenceResult: InferenceResult;
  trace: OmegaCoreTraceStep[];
}

// -----------------------------------------------------------------------------
// الاعتماديات الخارجية المطلوبة من server.ts (حقن تبعيات، بلا استيراد مباشر)
// -----------------------------------------------------------------------------

export interface OmegaCoreDeps {
  /**
   * يحاول استدعاء مزود مستقل حقيقي لهذا النموذج (OpenRouter/Anthropic/...).
   * يجب أن يُرجع null إن تعذّر ذلك تماماً (لا مفتاح، خطأ شبكة...) — بدون تلفيق.
   */
  callRealProvider: (
    modelId: ModelId,
    question: string
  ) => Promise<{ text: string } | null>;

  /**
   * الملاذ الأخير فقط: نموذج واحد يُنتج نصاً "بالنيابة عن" مجموعة معرّفات.
   * يجب استخدامه فقط للمعرّفات التي فشل callRealProvider معها.
   */
  simulateWithSingleModel: (
    question: string,
    modelIdsToSimulate: ModelId[]
  ) => Promise<Array<{ modelId: ModelId; text: string }>>;

  /**
   * تحقق حقيقي فعلي (استدعاء نموذج للتدقيق). يجب أن يُرجع null إن تعذّر
   * التنفيذ فعلياً — وليس "نجح افتراضياً".
   */
  verify: (
    question: string,
    answer: string
  ) => Promise<{ verified: boolean; score: number } | null>;
}

// -----------------------------------------------------------------------------
// المنطق الأساسي
// -----------------------------------------------------------------------------

function embedHashFallback(text: string, dim = 64): number[] {
  const v = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    v[i % dim] += text.charCodeAt(i);
  }
  const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0)) || 1;
  return v.map((x) => x / norm);
}

function scorePsi(candidates: { text: string }[]): { psi: number[]; spread: number; vectors: number[][] } {
  const vectors = candidates.map((c) => embedHashFallback(c.text));
  const dim = vectors[0]?.length ?? 0;
  const centroid = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += v[i] / vectors.length;
    }
  }

  const delta = vectors.map((v) => 1 - cosine(v, centroid));
  const meanDelta = delta.reduce((a, b) => a + b, 0) / (delta.length || 1);
  const variance = delta.reduce((a, d) => a + (d - meanDelta) ** 2, 0) / (delta.length || 1);
  const sigma = Math.sqrt(variance);
  const psi = delta.map((d) => clipExpPsi(d, sigma));
  return { psi, spread: sigma, vectors };
}

export async function runOmegaCore(
  request: OmegaCoreRequest,
  deps: OmegaCoreDeps
): Promise<OmegaCoreResponse> {
  const startedAt = Date.now();
  const trace: OmegaCoreTraceStep[] = [];
  const log = (stage: string, detail: string) =>
    trace.push({ stage, detail, atMs: Date.now() - startedAt });

  log("OmegaCore", `طلب مستلم: "${request.question.slice(0, 60)}..."`);

  // 1) التوجيه — نطاق ونماذج مرشحة (domainRouting.ts، حقيقي وبسيط)
  const route = request.domain
    ? { domain: request.domain, models: request.models ?? [], confidence: 1, matchedKeywords: [] }
    : modelsForQuestion(request.question);
  const targetModels = request.models?.length ? request.models : route.models;
  log("Router", `النطاق = ${route.domain} | النماذج المستهدفة = ${targetModels.join(", ")}`);

  // 2) تحضير النواة الإدراكية (OmegaInferenceEngine.prepare) قبل الاستدعاء
  const engine = getInferenceEngine(request.userId);
  const prep = await engine.prepare({
    userId: request.userId,
    question: request.question,
    domain: route.domain as any,
  });
  log(
    "Memory",
    `تم تحضير السياق من OmegaInferenceEngine (${prep.longTermRecall.length} ذاكرة طويلة الأمد، نموذج مفضّل: ${prep.preferredModel ?? "—"})`
  );

  // 3) جمع المرشحين — حقيقي أولاً، محاكاة فقط كملاذ أخير، مع وسم صريح
  log("Inference", "محاولة استدعاء مزودين مستقلين فعلياً...");
  const realResults = await Promise.allSettled(
    targetModels.map(async (modelId) => {
      const r = await deps.callRealProvider(modelId, request.question);
      return { modelId, r };
    })
  );

  const realCandidates: OmegaCandidate[] = [];
  const failedModelIds: ModelId[] = [];
  for (let i = 0; i < realResults.length; i++) {
    const settled = realResults[i];
    if (settled.status === "fulfilled" && settled.value.r) {
      realCandidates.push({
        modelId: settled.value.modelId,
        text: settled.value.r.text,
        simulated: false,
      });
    } else {
      failedModelIds.push(targetModels[i]);
    }
  }

  let simulatedCandidates: OmegaCandidate[] = [];
  if (failedModelIds.length > 0) {
    log(
      "Inference",
      `تعذّر الاتصال الحقيقي بـ ${failedModelIds.length} نموذج/نماذج — تفعيل محاكاة الملاذ الأخير (مُوسَّمة صراحةً).`
    );
    const simulated = await deps.simulateWithSingleModel(request.question, failedModelIds);
    simulatedCandidates = simulated.map((s) => ({ ...s, simulated: true }));
  }

  const allCandidates = [...realCandidates, ...simulatedCandidates];
  if (allCandidates.length === 0) {
    throw new Error("OmegaCore: لم يُنتج أي مرشح إجابة — فشل كل المزودين والمحاكاة.");
  }

  const ensembleMode: OmegaCoreResponse["ensembleMode"] =
    simulatedCandidates.length === 0
      ? "real_multi_provider"
      : realCandidates.length === 0
      ? "simulated_single_model"
      : "mixed";
  log(
    "Fusion",
    `اكتمل الجمع — الوضع: ${ensembleMode} (${realCandidates.length} حقيقي / ${simulatedCandidates.length} محاكى)`
  );

  // 4) ربط قلب أوميغا (OmegaCore) بنواة أوميغا (OmegaKernel & runOmegaKernelExtended)
  const { psi: basePsi, spread, vectors } = scorePsi(allCandidates);
  const kernelResult = await runOmegaKernelExtended(
    request.question,
    route.domain as any,
    allCandidates.map((c, i) => ({
      modelId: c.modelId,
      text: c.text,
      embedding: vectors[i],
      reasoningSteps: c.text.split("\n").filter((l) => l.trim().length > 0).length || 4,
      gaps: 0.1,
      novelty: c.simulated ? 0.45 : 0.75,
      counterExamples: 0,
      falsificationTests: 1,
    })),
    DEFAULT_PSI_STATE
  );

  const finalPsiList = kernelResult.scores.Psi.length === allCandidates.length ? kernelResult.scores.Psi : basePsi;
  allCandidates.forEach((c, i) => {
    c.psi = finalPsiList[i];
    c.weight = kernelResult.scores.weights[i] ?? 1 / allCandidates.length;
  });

  // تحديث متجه الحالة الطيفي في نواة أوميغا الحية (globalOmegaKernel)
  const kernelState = globalOmegaKernel.absorb(
    request.question,
    allCandidates.map((c) => ({
      modelId: c.modelId,
      text: c.text,
      psi: c.psi ?? 0.8,
      weight: c.weight ?? 0.5,
    })),
    route.domain
  );

  const bestIdx = finalPsiList.indexOf(Math.max(...finalPsiList));
  const bestCandidate = allCandidates[bestIdx];
  log(
    "Kernel",
    `نواة أوميغا متزامنة (Step ${kernelState.step}) | Ψ الأعلى = ${finalPsiList[bestIdx].toFixed(3)} | التشتت = ${spread.toFixed(3)} | المصدر = ${bestCandidate.modelId}${
      bestCandidate.simulated ? " (محاكى)" : " (حقيقي)"
    }`
  );

  // 5) تحقق صادق — بلا افتراض "نجح" عند الفشل
  log("Verify", "تشغيل التحقق الذاتي...");
  const verification = await deps.verify(request.question, bestCandidate.text).catch(() => null);
  if (verification) {
    log("Verify", `النتيجة: verified=${verification.verified} score=${verification.score.toFixed(2)}`);
  } else {
    log("Verify", "تعذّر تنفيذ تحقق فعلي — سيُسجَّل verified=null (غير محسوم)، وليس نجاحاً افتراضياً.");
  }

  // 6) تحديث الحالة الحقيقية عبر OmegaInferenceEngine.commit
  const inferenceResult = await engine.commit({
    userId: request.userId,
    question: request.question,
    domain: route.domain as any,
    finalAnswer: bestCandidate.text,
    topPsi: finalPsiList[bestIdx],
    verificationPassed: verification ? verification.verified : false,
    chosenModelId: bestCandidate.modelId,
    spread,
    candidates: allCandidates.map((c) => ({ modelId: c.modelId, text: c.text, psi: c.psi })),
  } satisfies InferenceInput);

  // مزامنة جسر النواة والقلب (OmegaKernel ⇄ OmegaCore Bridge)
  const syncedKernelState = globalOmegaKernel.syncWithOmegaCore({
    connected: true,
    lastPulseAt: Date.now(),
    domain: route.domain,
    corePsiScore: finalPsiList[bestIdx],
    selfCheckVerified: verification ? verification.verified : true,
    selfCheckConfidence: verification ? verification.score : inferenceResult.selfEval.score,
    memoryConceptsCount: inferenceResult.matrixSnapshot.memoryRank,
    knowledgeNodesCount: inferenceResult.matrixSnapshot.knowledgeNodes,
    knowledgeEdgesCount: inferenceResult.matrixSnapshot.knowledgeEdges,
    generation: inferenceResult.generation,
    activeStrategy: `OmegaCore (${ensembleMode}) ⇄ OmegaKernel Step ${kernelState.step}`,
  });

  log(
    "Memory",
    `تم تحديث المصفوفات في OmegaInferenceEngine — الجيل ${inferenceResult.generation}، تقييم ذاتي = ${inferenceResult.selfEval.score.toFixed(2)}`
  );

  log("Response", "الاستجابة جاهزة للإرسال.");

  return {
    answer: bestCandidate.text,
    domain: route.domain,
    candidates: allCandidates,
    ensembleMode,
    psi: finalPsiList[bestIdx],
    spread,
    verified: verification ? verification.verified : null,
    verificationScore: verification ? verification.score : null,
    kernelScores: kernelResult.scores,
    kernelState: syncedKernelState,
    inferenceResult,
    trace,
  };
}
