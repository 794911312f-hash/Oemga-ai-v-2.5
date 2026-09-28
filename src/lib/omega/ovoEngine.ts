/**
 * src/lib/omega/ovoEngine.ts
 * =============================================================================
 * Omega Video Optimizer (OVO) — Inference-Time Video Control & Stabilization
 * Grounded in "The Complete Omega Optimizer Family (OmegaV2 to OmegaV25.1)"
 * Author & Architect: Faid Massinissa
 * =============================================================================
 *
 * Translates the mathematical laws of the Omega Optimizer Family from parameter-space
 * training to inference-time video generation (Wan 2.2, HunyuanVideo, CogVideoX, Open-Sora 2.0, Veo):
 *
 * 1. OmegaV2 Belief-Confidence Core:
 *    Γ_t = β_1 Γ_{t-1} + (1 - β_1) x_t
 *    δ_t = |x_t - Γ̂_t|,  σ_t = 0.9 σ_{t-1} + 0.1 δ_t
 *    ψ_t = clip(exp(-1.2 · (δ_t / (σ_t + ε))^1.5), 0.05, 0.99)
 *
 * 2. OmegaV25.1 EMA-Deviation Information Geometric Controller (avoids V25 chronic over-blending):
 *    KL_ema ← λ KL_ema + (1 - λ) KL_t,   H_ema ← λ H_ema + (1 - λ) H_{norm,t}   (λ = 0.95)
 *    d_KL = KL_t - KL_ema,               d_H = H_{norm,t} - H_ema
 *    S_t = α · softsign(β · d_KL) + (1 - α) · softsign(β · d_H)
 *    ω_t = ω_base + (ω_ceiling - ω_base) · S_t
 *    Under stationarity: d ≈ 0 ⇒ S_t ≈ 0 ⇒ ω_t ≈ ω_base (silent when stable!).
 *    At a quality/identity shift: d rises ⇒ S_t rises ⇒ ω_t intervenes smoothly!
 *
 * 3. OmegaV19 PID Derivative Damping (Anti-Jitter / Anti-Overshoot):
 *    D_t = EMA(v_t - v_{t-1}) to damp sudden motion/color overshoots between frames.
 *
 * 4. Five Specialized OVO Modules:
 *    - OmegaFrame     : Per-frame IGS quality & artifact detector (KL & H_norm EMA-deviation)
 *    - OmegaMotion    : Frame-to-frame motion belief Γ_t, local confidence ψ_t & PID derivative damping
 *    - OmegaCharacter : Identity & color drift detector with EMA-deviation (prevents face morphing)
 *    - OmegaPrompt    : Closed-loop dynamic CFG, Denoising Steps & token weight modulator (OmegaV15 + V25.1)
 *    - OmegaDirector  : NTSAF-grounded model router (Wan 2.2, HunyuanVideo, CogVideoX, Open-Sora 2.0, Veo, Kling)
 */

import type { VideoModelId } from "./models";

// =============================================================================
// Mathematical Primitives from OmegaV2 – OmegaV25.1
// =============================================================================

export function softsign(x: number): number {
  return x / (1 + Math.abs(x));
}

export function clip(val: number, minVal: number, maxVal: number): number {
  return Math.max(minVal, Math.min(maxVal, val));
}

export function computeOmegaV2Psi(
  delta: number,
  sigma: number,
  c = 1.2,
  p = 1.5,
  psiMin = 0.05,
  psiMax = 0.99,
  eps = 1e-8
): number {
  const normDelta = delta / (sigma + eps);
  return clip(Math.exp(-c * Math.pow(normDelta, p)), psiMin, psiMax);
}

// =============================================================================
// 1. OmegaFrame — Information Geometric Frame Quality & EMA-Deviation (V25.1)
// =============================================================================

export interface OmegaFrameMetrics {
  frameIndex: number;
  klDivergence: number; // Spatial energy concentration across frame regions
  hNorm: number; // Normalized Shannon entropy of luminance/detail distribution
  klEma: number;
  hEma: number;
  dKl: number; // KL_t - KL_ema
  dH: number; // H_{norm,t} - H_ema
  geometricShiftScoreS: number; // S_t in [-1, 1] (near 0 under stationarity)
  omegaBlendWeight: number; // ω_t = ω_base + (ω_ceiling - ω_base) * S_t
  stationaryRegime: boolean;
}

export class OmegaFrameController {
  private klEma: number | null = null;
  private hEma: number | null = null;
  private readonly lambda: number;
  private readonly alpha: number;
  private readonly beta: number;
  private readonly omegaBase: number;
  private readonly omegaCeiling: number;

  constructor(
    options: {
      lambda?: number;
      alpha?: number;
      beta?: number;
      omegaBase?: number;
      omegaCeiling?: number;
    } = {}
  ) {
    this.lambda = options.lambda ?? 0.95;
    this.alpha = options.alpha ?? 0.5;
    this.beta = options.beta ?? 2.0;
    this.omegaBase = options.omegaBase ?? 0.15;
    this.omegaCeiling = options.omegaCeiling ?? 0.9;
  }

  /**
   * Computes Information Geometric State (KL, H_norm) for a frame's patch energy distribution
   * and evaluates OmegaV25.1 EMA-Deviation so it only intervenes on real degradation.
   */
  public evaluateFrame(frameIndex: number, patchEnergies: number[]): OmegaFrameMetrics {
    const L = Math.max(1, patchEnergies.length);
    const totalEnergy = patchEnergies.reduce((a, b) => a + b, 0) + 1e-8;
    const uniformP = 1 / L;

    let kl = 0;
    let hSum = 0;
    for (let i = 0; i < L; i++) {
      const p = Math.max(1e-8, patchEnergies[i] / totalEnergy);
      kl += p * Math.log(p / uniformP);
      hSum += -p * Math.log(p);
    }
    const hNorm = L > 1 ? hSum / Math.log(L) : 0.85;

    if (this.klEma === null || this.hEma === null) {
      this.klEma = kl;
      this.hEma = hNorm;
    } else {
      this.klEma = this.lambda * this.klEma + (1 - this.lambda) * kl;
      this.hEma = this.lambda * this.hEma + (1 - this.lambda) * hNorm;
    }

    // OmegaV25.1 EMA-Deviation equations:
    // Positive dKL = sudden concentration/artifact spike; Negative dH = sudden entropy/detail collapse
    const dKl = kl - this.klEma;
    const dH = this.hEma - hNorm; // Inverted so detail loss (hNorm drop) yields positive anomaly

    const sKl = softsign(this.beta * dKl);
    const sH = softsign(this.beta * dH);
    const S = this.alpha * sKl + (1 - this.alpha) * sH;

    const omega = clip(
      this.omegaBase + (this.omegaCeiling - this.omegaBase) * Math.max(0, S),
      0.05,
      this.omegaCeiling
    );

    return {
      frameIndex,
      klDivergence: Number(kl.toFixed(4)),
      hNorm: Number(hNorm.toFixed(4)),
      klEma: Number(this.klEma.toFixed(4)),
      hEma: Number(this.hEma.toFixed(4)),
      dKl: Number(dKl.toFixed(4)),
      dH: Number(dH.toFixed(4)),
      geometricShiftScoreS: Number(S.toFixed(4)),
      omegaBlendWeight: Number(omega.toFixed(4)),
      stationaryRegime: Math.abs(S) < 0.08,
    };
  }
}

// =============================================================================
// 2. OmegaMotion — Belief-Confidence ψ_t (V2) + PID Derivative Damping (V19)
// =============================================================================

export interface OmegaMotionMetrics {
  frameIndex: number;
  rawVelocity: number;
  beliefVelocityGamma: number;
  instantaneousDeviationDelta: number;
  localConfidencePsi: number; // ψ_t in [0.05, 0.99]
  pidDerivativeTermD: number; // D_t = EMA(v_t - v_{t-1})
  stabilizedVelocity: number; // Blended & PID-damped velocity
  jitterDetected: boolean;
}

export class OmegaMotionController {
  private gamma = 0;
  private sigma = 0.1;
  private prevVelocity = 0;
  private derivativeD = 0;
  private stepCount = 0;
  private readonly beta1 = 0.9;
  private readonly betaD = 0.85;
  private readonly kd = 0.18; // PID derivative damping gain (OmegaV19)

  public evaluateMotion(frameIndex: number, rawVelocity: number): OmegaMotionMetrics {
    this.stepCount++;

    // OmegaV2 Belief Update
    this.gamma = this.beta1 * this.gamma + (1 - this.beta1) * rawVelocity;
    const gammaHat = this.gamma / (1 - Math.pow(this.beta1, this.stepCount));

    const delta = Math.abs(rawVelocity - gammaHat);
    this.sigma = 0.9 * this.sigma + 0.1 * delta;

    // Local Confidence ψ_t
    const psi = computeOmegaV2Psi(delta, this.sigma);

    // OmegaV19 Derivative Term (anticipates & damps sudden velocity overshoot/jitter)
    const rawDiff = rawVelocity - this.prevVelocity;
    this.derivativeD = this.betaD * this.derivativeD + (1 - this.betaD) * rawDiff;
    this.prevVelocity = rawVelocity;

    // Belief-blended velocity minus PID overshoot damping
    const beliefBlended = psi * gammaHat + (1 - psi) * rawVelocity;
    const stabilizedVelocity = beliefBlended - this.kd * this.derivativeD;

    return {
      frameIndex,
      rawVelocity: Number(rawVelocity.toFixed(4)),
      beliefVelocityGamma: Number(gammaHat.toFixed(4)),
      instantaneousDeviationDelta: Number(delta.toFixed(4)),
      localConfidencePsi: Number(psi.toFixed(4)),
      pidDerivativeTermD: Number(this.derivativeD.toFixed(4)),
      stabilizedVelocity: Number(stabilizedVelocity.toFixed(4)),
      jitterDetected: psi < 0.55 || Math.abs(this.derivativeD) > 0.35,
    };
  }
}

// =============================================================================
// 3. OmegaCharacter — Identity & Color Drift Tracker via EMA-Deviation
// =============================================================================

export interface OmegaCharacterMetrics {
  frameIndex: number;
  identitySimilarity: number; // Cosine similarity to locked character embedding
  colorDrift: number; // L1 histogram distance
  driftEma: number;
  emaDeviation: number; // d_char = drift_t - drift_ema
  characterConfidencePsi: number;
  ipAdapterLockStrength: number; // Dynamically adjusted [0.75 - 0.99]
  morphWarning: boolean;
}

export class OmegaCharacterController {
  private driftEma: number | null = null;
  private sigma = 0.05;
  private readonly lambda = 0.94;

  public evaluateCharacter(
    frameIndex: number,
    identitySimilarity: number,
    colorDrift: number
  ): OmegaCharacterMetrics {
    const combinedDrift = (1 - identitySimilarity) * 0.7 + colorDrift * 0.3;

    if (this.driftEma === null) {
      this.driftEma = combinedDrift;
    } else {
      this.driftEma = this.lambda * this.driftEma + (1 - this.lambda) * combinedDrift;
    }

    const emaDeviation = combinedDrift - this.driftEma;
    this.sigma = 0.9 * this.sigma + 0.1 * Math.abs(emaDeviation);

    const psi = computeOmegaV2Psi(Math.max(0, emaDeviation), this.sigma);

    // Only boost IP-Adapter / ReferenceNet lock when positive EMA deviation occurs (sudden face/color morph)
    const sDrift = softsign(2.5 * Math.max(0, emaDeviation));
    const ipAdapterLockStrength = clip(0.82 + 0.16 * sDrift, 0.75, 0.99);

    return {
      frameIndex,
      identitySimilarity: Number(identitySimilarity.toFixed(4)),
      colorDrift: Number(colorDrift.toFixed(4)),
      driftEma: Number(this.driftEma.toFixed(4)),
      emaDeviation: Number(emaDeviation.toFixed(4)),
      characterConfidencePsi: Number(psi.toFixed(4)),
      ipAdapterLockStrength: Number(ipAdapterLockStrength.toFixed(4)),
      morphWarning: emaDeviation > 0.06 || identitySimilarity < 0.86,
    };
  }
}

// =============================================================================
// 4. OmegaPrompt — Closed-Loop Hyperparameter & Prompt Modulator (V15 + V25.1)
// =============================================================================

export interface OmegaPromptStepControl {
  frameOrStepIndex: number;
  cfgScale: number;
  denoisingSteps: number;
  latentBeliefBlendOmega: number; // ω_t mixing standard denoising step with belief-stabilized latent
  aggressionFactor: number; // Closed-loop V15 aggression in [0, 1]
  injectedTokens: string[];
  interventionReasonAr: string;
}

export class OmegaPromptController {
  private recentQualityLosses: number[] = [];
  private aggression = 0.0;
  private readonly trendWindow = 6;

  public modulateStep(
    stepIndex: number,
    baseCfg: number,
    baseSteps: number,
    frameMetrics: OmegaFrameMetrics,
    motionMetrics: OmegaMotionMetrics,
    charMetrics: OmegaCharacterMetrics
  ): OmegaPromptStepControl {
    // Define effective quality loss proxy (lower is better)
    const currentLoss =
      Math.max(0, frameMetrics.dKl) * 0.4 +
      (1 - motionMetrics.localConfidencePsi) * 0.3 +
      Math.max(0, charMetrics.emaDeviation) * 0.3;

    this.recentQualityLosses.push(currentLoss);
    if (this.recentQualityLosses.length > this.trendWindow) {
      this.recentQualityLosses.shift();
    }

    // OmegaV15 Closed-Loop Aggression Update
    if (this.recentQualityLosses.length >= 4) {
      const half = Math.floor(this.recentQualityLosses.length / 2);
      const earlyMean =
        this.recentQualityLosses.slice(0, half).reduce((a, b) => a + b, 0) / half;
      const recentMean =
        this.recentQualityLosses.slice(half).reduce((a, b) => a + b, 0) /
        (this.recentQualityLosses.length - half);

      if (recentMean > earlyMean * 1.04) {
        // Quality worsening -> pull back aggression toward safe baseline
        this.aggression = Math.max(0.0, this.aggression - 0.2);
      } else if (recentMean < earlyMean * 0.96 && !frameMetrics.stationaryRegime) {
        // Intervention is actively reducing quality loss -> allow controlled increase
        this.aggression = Math.min(1.0, this.aggression + 0.15);
      } else {
        // Calm stationary regime -> gentle decay (V15 / V25.1 silence under stationarity)
        this.aggression *= 0.88;
      }
    }

    const injectedTokens: string[] = [];
    const reasons: string[] = [];

    let cfgScale = baseCfg;
    let denoisingSteps = baseSteps;
    const omega = frameMetrics.omegaBlendWeight;

    if (frameMetrics.stationaryRegime && !motionMetrics.jitterDetected && !charMetrics.morphWarning) {
      reasons.push(
        `استقرار هندسي (Stationary Regime: S_t = ${frameMetrics.geometricShiftScoreS.toFixed(3)} ≈ 0) — الحفاظ على المعاملات الأساسية دون تدخل زائد (فلسفة OmegaV25.1).`
      );
    } else {
      if (!frameMetrics.stationaryRegime && frameMetrics.geometricShiftScoreS > 0.08) {
        const cfgBoost = Number((1.2 * frameMetrics.geometricShiftScoreS).toFixed(2));
        cfgScale = clip(baseCfg + cfgBoost, 4.5, 11.5);
        denoisingSteps = Math.min(50, baseSteps + Math.round(8 * frameMetrics.geometricShiftScoreS));
        injectedTokens.push("sharp coherent textures", "temporal anti-aliasing");
        reasons.push(
          `رصد انحراف هندسي عن المتوسط المتحرك (ΔS = +${frameMetrics.geometricShiftScoreS.toFixed(3)}) ← رفع CFG إلى ${cfgScale} وزيادة خطوات التنقية إلى ${denoisingSteps}.`
        );
      }
      if (motionMetrics.jitterDetected) {
        injectedTokens.push("smooth optical flow", "damped camera velocity");
        reasons.push(
          `تفعيل مخمد المشتقة (OmegaV19 PID D_t = ${motionMetrics.pidDerivativeTermD.toFixed(3)}) لامتصاص اهتزاز الحركة اللحظي.`
        );
      }
      if (charMetrics.morphWarning) {
        injectedTokens.push("locked facial geometry", "invariant attire palette");
        reasons.push(
          `رصد انحراف في ملامح الشخصية ← رفع قفل الهوية (IP-Adapter Lock) إلى ${(charMetrics.ipAdapterLockStrength * 100).toFixed(0)}%.`
        );
      }
    }

    return {
      frameOrStepIndex: stepIndex,
      cfgScale: Number(cfgScale.toFixed(2)),
      denoisingSteps,
      latentBeliefBlendOmega: omega,
      aggressionFactor: Number(this.aggression.toFixed(3)),
      injectedTokens,
      interventionReasonAr: reasons.join(" | "),
    };
  }
}

// =============================================================================
// 5. OmegaDirector — NTSAF Signal-Ranked Multi-Model Video Selector
// =============================================================================

export interface OmegaDirectorSelection {
  selectedModelId: VideoModelId;
  selectedModelName: string;
  ntsafCompositeScore: number; // [0, 1]
  backupModelId: VideoModelId;
  selectionRationaleAr: string;
  modelRankings: Array<{
    modelId: VideoModelId;
    name: string;
    ntsafScore: number;
    strengthMatched: string;
  }>;
}

export class OmegaDirectorController {
  public selectOptimalModel(
    prompt: string,
    preferOpenSource = false
  ): OmegaDirectorSelection {
    const p = prompt.toLowerCase();
    const isPhysicsHeavy =
      /سقوط|جاذبية|نيوتن|فيزياء|اصطدام|بندول|معادلة|حركة|gravity|physics|newton|free fall/.test(p);
    const isCharacterHeavy =
      /شخصية|وجه|يتحدث|عالم|نيوتن|أينشتاين|تيسلا|كوري|الهيثم|character|portrait|scientist/.test(p);
    const isLongCinematic =
      /سينما|ملحمي|طويل|كاميرا|مشهد|قلعة|تنين|فضاء|cinematic|epic|camera|space/.test(p);

    const candidates: Array<{
      modelId: VideoModelId;
      name: string;
      isOpenSource: boolean;
      physicsScore: number;
      characterScore: number;
      cameraScore: number;
      stabilityScore: number;
      strengthMatched: string;
    }> = [
      {
        modelId: "veo-google",
        name: "Veo (Google DeepMind)",
        isOpenSource: false,
        physicsScore: 0.99,
        characterScore: 0.95,
        cameraScore: 0.98,
        stabilityScore: 0.98,
        strengthMatched: "الواقعية الفيزيائية الفائقة والاتساق الضوئي 4K",
      },
      {
        modelId: "kling-ai",
        name: "Kling AI",
        isOpenSource: false,
        physicsScore: 0.98,
        characterScore: 0.97,
        cameraScore: 0.95,
        stabilityScore: 0.96,
        strengthMatched: "محاكاة ديناميكا الأجسام وثبات ملامح الشخصيات",
      },
      {
        modelId: "runway-gen4",
        name: "Runway Gen-4",
        isOpenSource: false,
        physicsScore: 0.95,
        characterScore: 0.98,
        cameraScore: 0.99,
        stabilityScore: 0.97,
        strengthMatched: "التحكم الإخراجي الدقيق في الكاميرا وثبات الهوية",
      },
      {
        modelId: "open-sora-2",
        name: "Open-Sora 2.0 (STDiT3 11B)",
        isOpenSource: true,
        physicsScore: 0.96,
        characterScore: 0.94,
        cameraScore: 0.97,
        stabilityScore: 0.95,
        strengthMatched: "التحكم الصريح في مسار الكاميرا ودرجة الحركة (مفتوح المصدر)",
      },
      {
        modelId: "wan-2-2-alibaba",
        name: "Wan 2.2 (Alibaba)",
        isOpenSource: true,
        physicsScore: 0.95,
        characterScore: 0.96,
        cameraScore: 0.94,
        stabilityScore: 0.96,
        strengthMatched: "ثبات المظهر الحركي والتشغيل المفتوح عالي الكفاءة",
      },
      {
        modelId: "hunyuan-video-tencent",
        name: "HunyuanVideo (Tencent)",
        isOpenSource: true,
        physicsScore: 0.96,
        characterScore: 0.95,
        cameraScore: 0.96,
        stabilityScore: 0.97,
        strengthMatched: "استقرار الإطارات الطويلة بمعمارية الترانسفورمر الهجينة",
      },
      {
        modelId: "cogvideox",
        name: "CogVideoX (THUDM)",
        isOpenSource: true,
        physicsScore: 0.93,
        characterScore: 0.92,
        cameraScore: 0.92,
        stabilityScore: 0.94,
        strengthMatched: "الضغط الزماني المكاني 3D VAE للتحويل النصي البصري",
      },
    ];

    const filtered = preferOpenSource
      ? candidates.filter((c) => c.isOpenSource)
      : candidates;

    const scored = filtered
      .map((c) => {
        let score =
          c.physicsScore * (isPhysicsHeavy ? 0.45 : 0.25) +
          c.characterScore * (isCharacterHeavy ? 0.4 : 0.25) +
          c.cameraScore * (isLongCinematic ? 0.35 : 0.25) +
          c.stabilityScore * 0.25;
        return {
          modelId: c.modelId,
          name: c.name,
          ntsafScore: Number(score.toFixed(4)),
          strengthMatched: c.strengthMatched,
        };
      })
      .sort((a, b) => b.ntsafScore - a.ntsafScore);

    const best = scored[0];
    const backup = scored[1] || scored[0];

    return {
      selectedModelId: best.modelId,
      selectedModelName: best.name,
      ntsafCompositeScore: best.ntsafScore,
      backupModelId: backup.modelId,
      selectionRationaleAr: `اختار محرك OmegaDirector النموذج «${best.name}» بأعلى معامل توافق (NTSAF Score = ${(best.ntsafScore * 100).toFixed(1)}%) نظراً لتفوقه في: ${best.strengthMatched}، مع تعيين «${backup.name}» كمسار احتياطي فوري.`,
      modelRankings: scored,
    };
  }
}

// =============================================================================
// Master Omega Video Optimizer (OVO) — Full Inference-Time Loop
// =============================================================================

export interface OVOTelemetryReport {
  version: "Omega-Video-Optimizer-v25.1 (OVO)";
  monographFoundation: "OmegaV2 (Belief ψ_t) + OmegaV15 (Closed-Loop) + OmegaV19 (PID D_t) + OmegaV25.1 (EMA-Deviation IGS)";
  directorSelection: OmegaDirectorSelection;
  stepsTrace: Array<{
    stepIndex: number;
    frame: OmegaFrameMetrics;
    motion: OmegaMotionMetrics;
    character: OmegaCharacterMetrics;
    promptControl: OmegaPromptStepControl;
  }>;
  summaryMetrics: {
    meanPsiConfidence: number;
    preShiftMeanS: number; // Like Table B.2 in V25.1 monograph: near zero under stationarity
    peakPostShiftDeltaS: number; // Immediate rise ΔS at anomaly frame
    meanOmegaBlendWeight: number;
    interventionsTriggered: number;
    totalSteps: number;
  };
  scientificVerdictAr: string;
}

export class OmegaVideoOptimizer {
  public runInferenceOptimizationLoop(options: {
    prompt: string;
    numSteps?: number;
    baseCfg?: number;
    baseDenoisingSteps?: number;
    preferOpenSource?: boolean;
    simulateMidStreamAnomalyAtStep?: number;
  }): OVOTelemetryReport {
    const numSteps = Math.max(4, Math.min(24, options.numSteps || 8));
    const baseCfg = options.baseCfg || 7.0;
    const baseDenoisingSteps = options.baseDenoisingSteps || 30;
    const anomalyStep = options.simulateMidStreamAnomalyAtStep ?? Math.floor(numSteps * 0.6);

    const frameCtrl = new OmegaFrameController();
    const motionCtrl = new OmegaMotionController();
    const charCtrl = new OmegaCharacterController();
    const promptCtrl = new OmegaPromptController();
    const directorCtrl = new OmegaDirectorController();

    const directorSelection = directorCtrl.selectOptimalModel(
      options.prompt,
      options.preferOpenSource
    );

    const stepsTrace: OVOTelemetryReport["stepsTrace"] = [];
    const preShiftSValues: number[] = [];
    let peakDeltaS = 0;
    let interventions = 0;

    for (let t = 1; t <= numSteps; t++) {
      const isAnomalyFrame = t === anomalyStep;

      // Simulate realistic patch energy distribution across 8 spatial regions
      // Stationary frames have balanced energy; anomaly frame has a sudden spike (flicker/artifact)
      const patchEnergies = isAnomalyFrame
        ? [0.48, 0.04, 0.05, 0.03, 0.28, 0.04, 0.04, 0.04]
        : [
            0.13 + Math.sin(t * 0.4) * 0.01,
            0.12 + Math.cos(t * 0.3) * 0.01,
            0.13,
            0.12,
            0.13 - Math.sin(t * 0.4) * 0.01,
            0.12,
            0.13,
            0.12 - Math.cos(t * 0.3) * 0.01,
          ];

      // Motion velocity (smooth trajectory except at anomaly frame)
      const rawVelocity = isAnomalyFrame
        ? 0.88
        : 0.32 + Math.sin(t * 0.25) * 0.03;

      // Character identity similarity & color drift
      const identitySimilarity = isAnomalyFrame
        ? 0.83
        : 0.97 - Math.abs(Math.sin(t * 0.2)) * 0.01;
      const colorDrift = isAnomalyFrame ? 0.14 : 0.02 + (t % 2) * 0.005;

      const frame = frameCtrl.evaluateFrame(t, patchEnergies);
      const motion = motionCtrl.evaluateMotion(t, rawVelocity);
      const character = charCtrl.evaluateCharacter(t, identitySimilarity, colorDrift);
      const promptControl = promptCtrl.modulateStep(
        t,
        baseCfg,
        baseDenoisingSteps,
        frame,
        motion,
        character
      );

      if (t < anomalyStep) {
        preShiftSValues.push(frame.geometricShiftScoreS);
      } else if (t === anomalyStep) {
        const preMean =
          preShiftSValues.reduce((a, b) => a + b, 0) / Math.max(1, preShiftSValues.length);
        peakDeltaS = Number((frame.geometricShiftScoreS - preMean).toFixed(4));
      }

      if (!frame.stationaryRegime || motion.jitterDetected || character.morphWarning) {
        interventions++;
      }

      stepsTrace.push({
        stepIndex: t,
        frame,
        motion,
        character,
        promptControl,
      });
    }

    const meanPsi =
      stepsTrace.reduce(
        (acc, s) =>
          acc + (s.motion.localConfidencePsi * 0.5 + s.character.characterConfidencePsi * 0.5),
        0
      ) / stepsTrace.length;

    const meanOmega =
      stepsTrace.reduce((acc, s) => acc + s.frame.omegaBlendWeight, 0) / stepsTrace.length;

    const preShiftMeanS =
      preShiftSValues.reduce((a, b) => a + b, 0) / Math.max(1, preShiftSValues.length);

    const scientificVerdictAr =
      `تم تطبيق معمارية Omega Video Optimizer (OVO) المبنية على معادلات OmegaV25.1 (EMA-Deviation): ` +
      `في الإطارات المستقرة بقي مؤشر الانحراف الهندسي صامتاً عند (S_t ≈ ${preShiftMeanS.toFixed(3)}) مما منع الإفراط المزمن في المزج (Chronic Over-Blending في V25)، ` +
      `وعند حدوث اضطراب بصري في الإطار #${anomalyStep} قفز المؤشر بمقدار (ΔS = +${peakDeltaS.toFixed(3)}) فتدخل المحسن لحظياً لرفع الـ CFG وتثبيت ملامح الشخصية وتخميد اهتزاز الكاميرا عبر مشتقة PID (OmegaV19).`;

    return {
      version: "Omega-Video-Optimizer-v25.1 (OVO)",
      monographFoundation:
        "OmegaV2 (Belief ψ_t) + OmegaV15 (Closed-Loop) + OmegaV19 (PID D_t) + OmegaV25.1 (EMA-Deviation IGS)",
      directorSelection,
      stepsTrace,
      summaryMetrics: {
        meanPsiConfidence: Number(meanPsi.toFixed(4)),
        preShiftMeanS: Number(preShiftMeanS.toFixed(4)),
        peakPostShiftDeltaS: peakDeltaS,
        meanOmegaBlendWeight: Number(meanOmega.toFixed(4)),
        interventionsTriggered: interventions,
        totalSteps: numSteps,
      },
      scientificVerdictAr,
    };
  }
}

export const globalOmegaVideoOptimizer = new OmegaVideoOptimizer();
