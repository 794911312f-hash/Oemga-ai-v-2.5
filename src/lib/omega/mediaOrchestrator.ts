/**
 * Omega Media Orchestration Engine v2
 * --------------------------------
 * Intelligent orchestration engine for image, video, voice and scientific demos.
 * Uses Omega-family local confidence ψ for tool selection and ranking.
 *
 * Compatible with:
 *  - OMEGA_VIDEO_MODELS / HISTORICAL_SCIENTISTS (models.ts)
 *  - OMEGA_VOICE_ENGINES / OMEGA_VOICE_PERSONAS (speech.ts)
 *  - Existing OmegaMediaModal UI
 */

import {
  OMEGA_VIDEO_MODELS,
  HISTORICAL_SCIENTISTS,
  type VideoModelId,
  type HistoricalScientist,
} from "./models";
import {
  OMEGA_VOICE_ENGINES,
  OMEGA_VOICE_PERSONAS,
  type VoicePersona,
} from "./speech";

// ============================================================
// 1. Core media types
// ============================================================

export type MediaType = "image" | "video" | "audio" | "voice" | "music";

export interface MediaRequest {
  type: MediaType;
  prompt: string;
  negativePrompt?: string;
  style?: "realistic" | "anime" | "cinematic" | "artistic" | "documentary";
  durationSec?: number;
  resolution?: string;
  referenceImageUrl?: string;
  voiceId?: string;
  language?: "ar" | "en" | "fr";
  seed?: number;
}

export interface MediaResult {
  type: MediaType;
  success: boolean;
  url?: string;
  base64?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  provider?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface MediaEngine {
  id: string;
  supported: MediaType[];
  styles?: string[];
  generate(req: MediaRequest): Promise<MediaResult>;
}

// ============================================================
// 2. Intelligent planning types
// ============================================================

export type MediaDomain =
  | "scientific_demo"
  | "cinematic_video"
  | "character_voice"
  | "high_fidelity_image"
  | "motion_effects"
  | "mixed_pipeline";

export type CostTier = "free" | "cheap" | "premium";

export interface ScoredTool {
  id: string;
  name: string;
  type: MediaType | "sync" | "avatar" | "post";
  psi: number;
  costTier: CostTier;
  reason: string;
}

export interface ExecutionStep {
  step: number;
  action: "generate_image" | "generate_video" | "generate_voice" | "lip_sync" | "compose" | "enhance_prompt";
  toolId: string;
  toolName: string;
  payload: Record<string, any>;
  description: string;
  dependsOn?: number[]; 
}

export interface MediaPlan {
  domain: MediaDomain;
  confidence: number;
  needs: string[];
  character?: HistoricalScientist;
  voicePersona?: VoicePersona;
  primaryTools: ScoredTool[];
  effects: string[];
  pipelineSteps: string[];
  promptEnhancement: string;
  estimatedCostTier: CostTier;
  rationale: string;
  execution: ExecutionStep[];
}

// ============================================================
// 3. Omega-style local confidence ψ
// ============================================================

function clipExpPsi(delta: number, sigma = 1.15, c = 1.2, p = 1.5): number {
  const effectiveSigma = Math.max(sigma, 1e-6);
  const raw = Math.exp(-c * Math.pow(delta / effectiveSigma, p));
  return Math.max(0.05, Math.min(0.99, raw));
}

// ============================================================
// 4. Tool catalog derived from OMEGA_MODELS
// ============================================================

interface InternalTool {
  id: string;
  name: string;
  type: MediaType | "sync" | "avatar" | "post";
  strengths: string[];
  costTier: CostTier;
  latency: "fast" | "medium" | "slow";
}

const INTERNAL_TOOLS: InternalTool[] = [
  { id: "runway-gen4", name: "Runway Gen-4", type: "video", strengths: ["cinematic", "image-to-video", "camera", "character", "high_quality"], costTier: "premium", latency: "medium" },
  { id: "veo-google", name: "Veo (Google)", type: "video", strengths: ["realistic", "4k", "physics", "cinematic", "long_form"], costTier: "premium", latency: "slow" },
  { id: "kling-ai", name: "Kling AI", type: "video", strengths: ["motion", "character", "physics", "dynamic"], costTier: "cheap", latency: "medium" },
  { id: "luma-dream-machine", name: "Luma Dream Machine", type: "video", strengths: ["fast", "creative", "dreamy"], costTier: "cheap", latency: "fast" },
  { id: "pixverse-ai", name: "PixVerse", type: "video", strengths: ["stylized", "anime", "fast"], costTier: "cheap", latency: "fast" },
  { id: "wan-2-2-alibaba", name: "Wan 2.2", type: "video", strengths: ["open_source", "character", "consistent"], costTier: "free", latency: "medium" },
  { id: "hunyuan-video-tencent", name: "HunyuanVideo", type: "video", strengths: ["open_source", "high_motion", "long_form"], costTier: "free", latency: "medium" },
  { id: "cogvideox", name: "CogVideoX", type: "video", strengths: ["open_source", "text-to-video"], costTier: "free", latency: "medium" },
  { id: "flux1", name: "FLUX.1", type: "image", strengths: ["photoreal", "8k", "detail", "portrait", "text_render"], costTier: "cheap", latency: "fast" },
  { id: "elevenlabs", name: "ElevenLabs", type: "voice", strengths: ["arabic", "character", "emotion", "high_quality"], costTier: "premium", latency: "fast" },
  { id: "cartesia", name: "Cartesia Sonic", type: "voice", strengths: ["fast", "low_latency", "natural"], costTier: "cheap", latency: "fast" },
  { id: "kokoro-tts", name: "Kokoro TTS", type: "voice", strengths: ["open_source", "lightweight", "fast"], costTier: "free", latency: "fast" },
  { id: "xtts-v2", name: "XTTS v2", type: "voice", strengths: ["open_source", "voice_clone", "multilingual"], costTier: "free", latency: "medium" },
  { id: "gemini-tts", name: "Gemini Neural TTS", type: "voice", strengths: ["natural", "multilingual", "arabic"], costTier: "cheap", latency: "fast" },
  { id: "openai-tts", name: "OpenAI TTS-1-HD", type: "voice", strengths: ["high_quality", "clear"], costTier: "premium", latency: "fast" },
  { id: "sync-labs", name: "Sync Labs", type: "sync", strengths: ["lip_sync", "character", "talking_head"], costTier: "premium", latency: "medium" },
  { id: "liveportrait", name: "LivePortrait", type: "avatar", strengths: ["open_source", "portrait_animation", "talking_head"], costTier: "free", latency: "medium" },
];

// ============================================================
// 5. Intent classification
// ============================================================

export function classifyMediaIntent(prompt: string): {
  domain: MediaDomain;
  confidence: number;
  needs: string[];
  characterId?: string;
  voicePersonaId?: string;
} {
  const p = prompt.toLowerCase();
  const scores: Record<MediaDomain, number> = {
    scientific_demo: 0,
    cinematic_video: 0,
    character_voice: 0,
    high_fidelity_image: 0,
    motion_effects: 0,
    mixed_pipeline: 0,
  };
  const needs: string[] = [];

  if (/نيوتن|أينشتاين|تسلا|كوري|بن الهيثم|فاينمان|فيزياء|قانون|شرح|تجربة|محاكاة|درس|علماء/.test(p)) {
    scores.scientific_demo += 3.5;
    needs.push("educational", "clear", "character");
  }

  if (/ساحر|قلعة|شرير|تنين|معركة|سينما|دراما|مشهد|كاميرا|ظلام|رعب|خيالي|evil|sorcerer|castle/.test(p)) {
    scores.cinematic_video += 3.5;
    needs.push("cinematic", "character", "atmosphere", "detail");
  }

  if (/صورة|لوحة|رسم|فوتوغراف|8k|ثابت/.test(p) && !/فيديو|يتحرك|حركة|video|متحرك/.test(p)) {
    scores.high_fidelity_image += 3.2;
    needs.push("photoreal", "detail", "8k");
  }

  if (/صوت|يتحدث|يقول|راوي|اسمع|نطق|voice|speak|tts/.test(p)) {
    scores.character_voice += 2.5;
    needs.push("arabic", "emotion", "character");
  }

  if (/حركة|تحليق|انفجار|مطر|رياح|ضباب|سحر|ناري|جليد|animate|متحرك/.test(p)) {
    scores.motion_effects += 2.2;
    needs.push("motion", "effects");
  }

  let characterId: string | undefined;
  if (/نيوتن|newton/.test(p)) characterId = "newton";
  else if (/أينشتاين|einstein/.test(p)) characterId = "einstein";
  else if (/تسلا|tesla/.test(p)) characterId = "tesla";
  else if (/كوري|curie/.test(p)) characterId = "curie";
  else if (/بن الهيثم|ibn.?al.?haytham|الهيثم/.test(p)) characterId = "ibn_al_haytham";
  else if (/فاينمان|feynman/.test(p)) characterId = "feynman";

  if (characterId) {
    scores.scientific_demo += 1.5;
    scores.character_voice += 1.2;
    needs.push("character", "educational");
  }

  let voicePersonaId: string | undefined;
  if (characterId && OMEGA_VOICE_PERSONAS.some((v) => v.id === characterId)) {
    voicePersonaId = characterId;
  } else if (/بروفيسور|professor.?omega|أوميغا/.test(p)) {
    voicePersonaId = "professor-omega";
  }

  const strongCount = Object.values(scores).filter((s) => s >= 2).length;
  if (strongCount >= 2) scores.mixed_pipeline += 2.2;

  const sorted = (Object.entries(scores) as [MediaDomain, number][]).sort((a, b) => b[1] - a[1]);
  const best = sorted[0];
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const confidence = Math.min(0.96, 0.35 + best[1] / total);

  if (needs.length === 0) needs.push("cinematic", "detail");

  return {
    domain: best[0],
    confidence,
    needs: [...new Set(needs)],
    characterId,
    voicePersonaId,
  };
}

// ============================================================
// 6. Execution & Pipeline
// ============================================================

export function buildMediaPlan(
  userPrompt: string,
  options: { preferFree?: boolean; maxTools?: number } = {}
): MediaPlan {
  const preferFree = options.preferFree ?? true;
  const maxTools = options.maxTools ?? 5;

  const { domain, confidence, needs, characterId, voicePersonaId } =
    classifyMediaIntent(userPrompt);

  const character = characterId
    ? HISTORICAL_SCIENTISTS.find((c) => c.id === characterId)
    : undefined;

  const voicePersona = voicePersonaId
    ? OMEGA_VOICE_PERSONAS.find((v) => v.id === voicePersonaId)
    : characterId
    ? OMEGA_VOICE_PERSONAS.find((v) => v.id === characterId)
    : undefined;

  // Score tools
  const scored: ScoredTool[] = INTERNAL_TOOLS.map((tool) => {
    const matchCount = tool.strengths.filter((s) =>
        needs.some((n) => s.includes(n) || n.includes(s))
    ).length;
    const mismatch = Math.max(0, needs.length - matchCount);
    let psi = clipExpPsi(mismatch);
    
    if (domain === "cinematic_video" && tool.type === "video") psi *= 1.18;
    if (preferFree && tool.costTier === "free") psi *= 1.15;
    
    return {
      id: tool.id,
      name: tool.name,
      type: tool.type,
      psi,
      costTier: tool.costTier,
      reason: `ψ=${psi.toFixed(3)}`,
    };
  })
    .filter((s) => s.psi > 0.2)
    .sort((a, b) => b.psi - a.psi);

  const primary = scored.slice(0, maxTools);

  return {
    domain,
    confidence,
    needs,
    character,
    voicePersona,
    primaryTools: primary,
    effects: ["volumetric_fog", "dramatic_lighting"],
    pipelineSteps: ["توليد صورة", "تحويل إلى فيديو", "إضافة صوت"],
    promptEnhancement: userPrompt,
    estimatedCostTier: "free",
    rationale: "خطة تنفيذ أوميغا المحسنة",
    execution: [{
        step: 1,
        action: "generate_image",
        toolId: primary[0]?.id || "flux1",
        toolName: primary[0]?.name || "FLUX.1",
        payload: { prompt: userPrompt },
        description: "توليد المشهد الأساسي"
    }]
  };
}

export function isMediaRequest(text: string): boolean {
  return /فيديو|صورة|صوت|مشهد|ساحر|قلعة|نيوتن|أينشتاين|تسلا|كوري|توليد|إنشاء|ارسم|صنع لي|فيديو ل|صورة ل|محاكاة|متحرك/.test(
    text.toLowerCase()
  );
}
