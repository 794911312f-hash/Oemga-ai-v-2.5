/**
 * src/lib/omega/models.ts
 * Model catalog and provider configuration definitions for Omega V2/V2.5.
 */

export type ModelId =
  | "gemini-3.8-flash"
  | "gemini-3.1-pro-preview"
  | "deepseek-r1-compat"
  | "claude-3-5-sonnet-compat"
  | "gpt-4o-compat"
  | "llama-3-3-compat"
  | "qwen-2-5-compat"
  | "omega-kernel-c1"
  | "omega-kernel-c2";

export interface ProviderKeys {
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  openrouterApiKey?: string;
  groqApiKey?: string;
  dashscopeApiKey?: string;
  deepseekApiKey?: string;
  ollamaBaseUrl?: string;
}

export interface ModelSpec {
  id: ModelId;
  name: string;
  family: "Google Gemini" | "DeepSeek" | "Anthropic" | "OpenAI" | "Meta" | "Alibaba" | "Omega Core";
  tier: "flagship" | "reasoning" | "speed" | "kernel";
  description: string;
  serverType: "direct" | "bridged" | "kernel";
  avatarColor: string;
  accentHex: string;
  contextWindow: string;
  defaultTemp: number;
}

export const OMEGA_MODELS: Record<ModelId, ModelSpec> = {
  "gemini-3.8-flash": {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    family: "Google Gemini",
    tier: "speed",
    description: "نموذج فائق السرعة والكفاءة للمهام العامة والتحليل السريع",
    serverType: "direct",
    avatarColor: "bg-amber-500",
    accentHex: "#f59e0b",
    contextWindow: "1M tokens",
    defaultTemp: 0.3,
  },
  "gemini-3.1-pro-preview": {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    family: "Google Gemini",
    tier: "flagship",
    description: "محرك الاستدلال العميق للبرمجة المتقدمة وحل المعضلات المنطقية",
    serverType: "direct",
    avatarColor: "bg-blue-500",
    accentHex: "#3b82f6",
    contextWindow: "2M tokens",
    defaultTemp: 0.2,
  },
  "deepseek-r1-compat": {
    id: "deepseek-r1-compat",
    name: "DeepSeek R1 (Reasoning Server)",
    family: "DeepSeek",
    tier: "reasoning",
    description: "نمط سلاسل التفكير المنطقية والاستنباط الرياضي الصارم",
    serverType: "direct",
    avatarColor: "bg-cyan-500",
    accentHex: "#06b6d4",
    contextWindow: "64k tokens",
    defaultTemp: 0.4,
  },
  "claude-3-5-sonnet-compat": {
    id: "claude-3-5-sonnet-compat",
    name: "Claude 3.5 Sonnet (Synthesis Server)",
    family: "Anthropic",
    tier: "flagship",
    description: "صياغة فكرية راقية ودقة لغوية وبلاغية عالية",
    serverType: "direct",
    avatarColor: "bg-orange-500",
    accentHex: "#f97316",
    contextWindow: "200k tokens",
    defaultTemp: 0.3,
  },
  "gpt-4o-compat": {
    id: "gpt-4o-compat",
    name: "GPT-4o (Omni Server)",
    family: "OpenAI",
    tier: "flagship",
    description: "تغطية شاملة للحقائق والتفاصيل الموسوعية متعددة المجالات",
    serverType: "direct",
    avatarColor: "bg-emerald-500",
    accentHex: "#10b981",
    contextWindow: "128k tokens",
    defaultTemp: 0.4,
  },
  "llama-3-3-compat": {
    id: "llama-3-3-compat",
    name: "Llama 3.3 70B (Meta Open Engine)",
    family: "Meta",
    tier: "speed",
    description: "خادم معالجة حرة مباشرة ومفتوحة للأفكار والنصوص",
    serverType: "direct",
    avatarColor: "bg-indigo-500",
    accentHex: "#6366f1",
    contextWindow: "128k tokens",
    defaultTemp: 0.5,
  },
  "qwen-2-5-compat": {
    id: "qwen-2-5-compat",
    name: "Qwen 2.5 72B (Alibaba Compute Server)",
    family: "Alibaba",
    tier: "reasoning",
    description: "خادم متخصص في الخوارزميات والمعادلات الرياضية والشفرات البرمجية",
    serverType: "direct",
    avatarColor: "bg-violet-500",
    accentHex: "#8b5cf6",
    contextWindow: "128k tokens",
    defaultTemp: 0.3,
  },
  "omega-kernel-c1": {
    id: "omega-kernel-c1",
    name: "Omega Kernel α (Spectral Consensus)",
    family: "Omega Core",
    tier: "kernel",
    description: "نواة أوميغا الأولى لحساب مسقطات فضاء الحالة ومصفوفة اليقين",
    serverType: "kernel",
    avatarColor: "bg-purple-600",
    accentHex: "#9333ea",
    contextWindow: "Unlimited",
    defaultTemp: 0.2,
  },
  "omega-kernel-c2": {
    id: "omega-kernel-c2",
    name: "Omega Kernel β (Orthogonal Verifier)",
    family: "Omega Core",
    tier: "kernel",
    description: "نواة أوميغا الثانية للتدقيق المتعامد ورصد التناقضات الداخلية",
    serverType: "kernel",
    avatarColor: "bg-rose-600",
    accentHex: "#e11d48",
    contextWindow: "Unlimited",
    defaultTemp: 0.2,
  },
};
