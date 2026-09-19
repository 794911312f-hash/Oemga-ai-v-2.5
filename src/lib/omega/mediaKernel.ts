/**
 * Omega Multimodal Media Kernel
 * -----------------------------
 * يدمج قدرات توليد الصور والفيديو والصوت داخل نواة أوميغا
 * ويحولها إلى أدوات يمكن للنواة استدعاؤها بذكاء حسب نوع الطلب.
 */

// ============================================================
// 1. أنواع الوسائط
// ============================================================

export type MediaType = "image" | "video" | "audio" | "voice" | "music";

export interface MediaRequest {
  type: MediaType;
  prompt: string;
  negativePrompt?: string;
  style?: "realistic" | "anime" | "cinematic" | "artistic" | "documentary";
  durationSec?: number;          // للفيديو والصوت
  resolution?: string;           // e.g. "1024x1024", "1280x720"
  referenceImageUrl?: string;    // لـ image-to-video أو image-to-image
  voiceId?: string;              // لصوت معين (البروفيسور، عجوز، إلخ)
  language?: "ar" | "en" | "fr";
  seed?: number;
}

export interface MediaResult {
  type: MediaType;
  success: boolean;
  url?: string;                  // رابط الملف الناتج
  base64?: string;               // أو بيانات مباشرة
  durationSec?: number;
  width?: number;
  height?: number;
  provider?: string;             // أي محرك تم استخدامه
  error?: string;
  metadata?: Record<string, any>;
}

// ============================================================
// 2. واجهة موحدة لمحركات الوسائط الموجودة في أوميغا
// ============================================================

/**
 * هذه الواجهة تمثل البرامج الموجودة لديك أصلاً.
 * كل محرك حقيقي (ComfyUI, Wan, LTX, Voice engine...) 
 * يُغلف ليطابق هذا الشكل.
 */
export interface MediaEngine {
  id: string;
  supported: MediaType[];
  styles?: string[];
  generate(req: MediaRequest): Promise<MediaResult>;
}

// ============================================================
// 3. سجل المحركات (يمكن تسجيل كل برامجك هنا)
// ============================================================

export class MediaRegistry {
  private engines: Map<string, MediaEngine> = new Map();

  register(engine: MediaEngine) {
    this.engines.set(engine.id, engine);
  }

  getEngine(id: string): MediaEngine | undefined {
    return this.engines.get(id);
  }

  findBestEngine(type: MediaType, style?: string): MediaEngine | undefined {
    const candidates = [...this.engines.values()].filter(e =>
      e.supported.includes(type)
    );
    if (candidates.length === 0) return undefined;

    // تفضيل بسيط حسب الأسلوب
    if (style === "anime") {
      return candidates.find(e => e.id.includes("anime") || e.id.includes("wan")) ?? candidates[0];
    }
    if (style === "realistic" || style === "cinematic") {
      return candidates.find(e => e.id.includes("ltx") || e.id.includes("wan") || e.id.includes("hunyuan")) ?? candidates[0];
    }
    return candidates[0];
  }

  list(): MediaEngine[] {
    return [...this.engines.values()];
  }
}

// ============================================================
// 4. محركات وهمية (Placeholder) – استبدلها بمحركاتك الحقيقية
// ============================================================

/** مثال: محرك صور */
export const imageEngine: MediaEngine = {
  id: "omega-image-v1",
  supported: ["image"],
  styles: ["realistic", "anime", "artistic"],
  async generate(req) {
    // استبدل هذا باستدعاء محرك الصور الحقيقي لديك
    return {
      type: "image",
      success: true,
      url: `https://omega-media.local/image/${Date.now()}.png`,
      provider: "omega-image-v1",
      width: 1024,
      height: 1024,
      metadata: { prompt: req.prompt, style: req.style },
    };
  },
};

/** مثال: محرك فيديو (Wan / LTX / Hunyuan...) */
export const videoEngine: MediaEngine = {
  id: "omega-video-wan",
  supported: ["video"],
  styles: ["realistic", "anime", "cinematic"],
  async generate(req) {
    return {
      type: "video",
      success: true,
      url: `https://omega-media.local/video/${Date.now()}.mp4`,
      provider: "omega-video-wan",
      durationSec: req.durationSec ?? 5,
      width: 1280,
      height: 720,
      metadata: { prompt: req.prompt, style: req.style },
    };
  },
};

/** مثال: محرك صوت / صوت البروفيسور */
export const voiceEngine: MediaEngine = {
  id: "omega-voice",
  supported: ["audio", "voice"],
  async generate(req) {
    return {
      type: "voice",
      success: true,
      url: `https://omega-media.local/voice/${Date.now()}.mp3`,
      provider: "omega-voice",
      durationSec: req.durationSec ?? 8,
      metadata: { voiceId: req.voiceId ?? "professor", language: req.language ?? "ar" },
    };
  },
};

// ============================================================
// 5. مدير الوسائط داخل النواة
// ============================================================

export class OmegaMediaKernel {
  private registry: MediaRegistry;

  constructor(registry?: MediaRegistry) {
    this.registry = registry ?? new MediaRegistry();
    // تسجيل المحركات الافتراضية (استبدلها بالحقيقية)
    this.registry.register(imageEngine);
    this.registry.register(videoEngine);
    this.registry.register(voiceEngine);
  }

  /** تسجيل محرك إضافي من برامجك الموجودة */
  registerEngine(engine: MediaEngine) {
    this.registry.register(engine);
  }

  /** كشف تلقائي لنوع الوسائط المطلوبة من نص السؤال */
  detectMediaIntent(question: string): MediaType[] {
    const q = question.toLowerCase();
    
    // Explicit priority: if video is mentioned, prefer video over image
    // unless explicitly asked for both.
    const isVideo = /(فيديو|مقطع|video|animate|حرك)/i.test(q);
    const isImage = /(صورة|صور|ارسم|ولد صورة|generate image|draw)/i.test(q);
    
    const types: MediaType[] = [];

    if (isVideo) {
      types.push("video");
    } else if (isImage) {
      types.push("image");
    }

    if (/(صوت|تكلم|اقرأ|voice|speak|audio|narrat)/i.test(q)) types.push("voice");
    if (/(موسيقى|music|لحن)/i.test(q)) types.push("music");

    return [...new Set(types)];
  }

  /** توليد وسائط واحدة */
  async generate(req: MediaRequest): Promise<MediaResult> {
    const engine = this.registry.findBestEngine(req.type, req.style);
    if (!engine) {
      return {
        type: req.type,
        success: false,
        error: `لا يوجد محرك متاح لنوع: ${req.type}`,
      };
    }
    return engine.generate(req);
  }

  /** توليد سلسلة وسائط (مثلاً: صورة → فيديو → صوت) */
  async generatePipeline(
    steps: MediaRequest[]
  ): Promise<MediaResult[]> {
    const results: MediaResult[] = [];
    let lastImageUrl: string | undefined;

    for (const step of steps) {
      // إذا كان فيديو ولم يُحدد reference، استخدم آخر صورة
      if (step.type === "video" && !step.referenceImageUrl && lastImageUrl) {
        step.referenceImageUrl = lastImageUrl;
      }

      const result = await this.generate(step);
      results.push(result);

      if (result.success && result.type === "image" && result.url) {
        lastImageUrl = result.url;
      }
    }
    return results;
  }
}

// ============================================================
// 6. دمج الوسائط مع نواة أوميغا الرئيسية
// ============================================================

import { Domain } from "./kernelUpgrade";   // من الملف السابق

export interface MediaAwareKernelResult {
  textAnswer?: string;
  mediaResults: MediaResult[];
  mediaUsed: MediaType[];
  pipeline?: string[];
}

/**
 * دالة عالية المستوى: تحلل السؤال وتقرر هل يحتاج وسائط
 * ثم تستدعي النواة النصية + محركات الوسائط معاً
 */
export async function runOmegaWithMedia(
  question: string,
  domain: Domain,
  mediaKernel: OmegaMediaKernel,
  // يمكن تمرير نتائج النواة النصية أيضاً
  textKernelResult?: { synthesizerPrompt?: string; mode?: string }
): Promise<MediaAwareKernelResult> {
  const detected = mediaKernel.detectMediaIntent(question);
  const mediaResults: MediaResult[] = [];
  const pipeline: string[] = [];

  // ---- توليد صورة ----
  if (detected.includes("image")) {
    const imgReq: MediaRequest = {
      type: "image",
      prompt: question,
      style: detectStyle(question),
      resolution: "1024x1024",
    };
    const img = await mediaKernel.generate(imgReq);
    mediaResults.push(img);
    pipeline.push("image");
  }

  // ---- توليد فيديو ----
  if (detected.includes("video")) {
    const vidReq: MediaRequest = {
      type: "video",
      prompt: question,
      style: detectStyle(question),
      durationSec: 5,
      resolution: "1280x720",
      // إذا وُلدت صورة قبلها يمكن ربطها هنا
      referenceImageUrl: mediaResults.find(r => r.type === "image" && r.url)?.url,
    };
    const vid = await mediaKernel.generate(vidReq);
    mediaResults.push(vid);
    pipeline.push("video");
  }

  // ---- توليد صوت ----
  if (detected.includes("voice") || detected.includes("audio")) {
    const voiceReq: MediaRequest = {
      type: "voice",
      prompt: question,
      voiceId: "professor",      // أو "عجوز" حسب نظامك
      language: "ar",
      durationSec: 10,
    };
    const voice = await mediaKernel.generate(voiceReq);
    mediaResults.push(voice);
    pipeline.push("voice");
  }

  return {
    textAnswer: textKernelResult?.synthesizerPrompt, // أو الإجابة النهائية لاحقاً
    mediaResults,
    mediaUsed: detected,
    pipeline,
  };
}

/** كشف أسلوب بسيط من النص */
function detectStyle(question: string): MediaRequest["style"] {
  const q = question.toLowerCase();
  if (/(أنمي|انمي|anime|manga)/i.test(q)) return "anime";
  if (/(سينما|سينمائي|cinematic|realistic|واقعي)/i.test(q)) return "cinematic";
  if (/(فني|رسم|artistic)/i.test(q)) return "artistic";
  return "realistic";
}
