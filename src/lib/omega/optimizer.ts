/**
 * src/lib/omega/optimizer.ts
 * Hyperparameter manager and real-time benchmark tuner for Omega V2/V2.5.
 */

import type { ModelId } from "./models";

export interface OmegaConfig {
  directThreshold: number; // Psi above this = direct consensus (e.g. 0.85)
  uncertainSpread: number; // Psi spread below this = uncertain dual-response (e.g. 0.10)
  temperature: number; // 0.0 to 1.0
  maxTokens: number;
  maxModelsPerDomain: number;
  aggregatorModel: ModelId;
  verifierModel: ModelId;
  skipVerification: boolean;
  forcedEmbeddingSource: "auto" | "semantic" | "hash";
}

export interface OptimizerPreset {
  id: string;
  name: string;
  description: string;
  config: OmegaConfig;
}

export const DEFAULT_OMEGA_CONFIG: OmegaConfig = {
  directThreshold: 0.85,
  uncertainSpread: 0.10,
  temperature: 0.35,
  maxTokens: 550,
  maxModelsPerDomain: 3,
  aggregatorModel: "qwen-2-5-compat",
  verifierModel: "llama-3-3-compat",
  skipVerification: false,
  forcedEmbeddingSource: "auto",
};

export const OPTIMIZER_PRESETS: OptimizerPreset[] = [
  {
    id: "v2-balanced",
    name: "إعداد أوميغا V2 القياسي (Balanced)",
    description: "توازن مثالي بين سرعة الحسم ودقة التوليف والتدقيق الذاتي.",
    config: {
      ...DEFAULT_OMEGA_CONFIG,
    },
  },
  {
    id: "strict-verification",
    name: "التدقيق الصارم (Strict Verification)",
    description: "عتبة توافق مرتفعة جداً (0.90) مع فحص صارم للتناقضات.",
    config: {
      ...DEFAULT_OMEGA_CONFIG,
      directThreshold: 0.90,
      uncertainSpread: 0.14,
      temperature: 0.2,
      verifierModel: "llama-3-3-compat",
    },
  },
  {
    id: "high-throughput",
    name: "الاستجابة الفورية (Speed Throughput)",
    description: "تخفيض عتبة الإجماع المباشر لتسريع الردود مع تجاوز التوليف غير الضروري.",
    config: {
      ...DEFAULT_OMEGA_CONFIG,
      directThreshold: 0.78,
      uncertainSpread: 0.06,
      temperature: 0.4,
      aggregatorModel: "qwen-2-5-compat",
      verifierModel: "llama-3-3-compat",
    },
  },
  {
    id: "creative-synthesis",
    name: "التوليف الإبداعي الشامل (Creative Ensemble)",
    description: "تشجيع دمج وتأليف عدة وجهات نظر متقاربة مع درجة حرارة إبداعية.",
    config: {
      ...DEFAULT_OMEGA_CONFIG,
      directThreshold: 0.94, // Forces aggregation unless agreement is extreme
      uncertainSpread: 0.05,
      temperature: 0.6,
      maxModelsPerDomain: 4,
      aggregatorModel: "qwen-2-5-compat",
    },
  },
];
