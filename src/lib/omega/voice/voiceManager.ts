import { ElevenLabsAdapter } from "./providers/elevenLabs";
import { OpenAITtsAdapter } from "./providers/openaiTts";
import { OpenRouterTtsAdapter } from "./providers/openRouterTts";
import { GeminiTtsAdapter } from "./providers/geminiTts";
import { XttsV2Adapter } from "./providers/xttsV2";
import { KokoroTtsAdapter } from "./providers/kokoroTts";
import { CartesiaAdapter } from "./providers/cartesia";
import { PlayHTAdapter } from "./providers/playHT";
import {
  OMEGA_VOICE_CATALOG,
  VoiceTaskCategory,
  type VoicePersona,
  type VoiceProviderAdapter,
  type VoiceProviderId,
  type VoiceSynthesisOptions,
  type VoiceSynthesisResult,
} from "./types";

// صوت Gemini مميّز لكل شخصية عند تعذّر مزودها الأصلي (بدل الانهيار إلى صوتين فقط)
const GEMINI_VOICE_BY_PERSONA: Record<string, string> = {
  "doc-arabic-fusha": "Charon",
  "professor-omega": "Algieba",
  "newton": "Rasalgethi",
  "einstein": "Fenrir",
  "tesla": "Orus",
  "ibn-alhaytham": "Iapetus",
  "ibn-al-haytham": "Iapetus",
  "curie": "Aoede",
  "feynman": "Puck",
  "morgan-freeman": "Gacrux",
  "david-attenborough": "Sadaltager",
  "carl-sagan": "Enceladus",
  "news-anchor-01": "Kore",
  "storyteller-01": "Sulafat",
  "cyber-ai-omega": "Zephyr",
};

// صوت OpenRouter Audio مميّز لكل شخصية
const OPENROUTER_VOICE_BY_PERSONA: Record<string, string> = {
  "doc-arabic-fusha": "onyx",
  "professor-omega": "sage",
  "newton": "ash",
  "einstein": "ballad",
  "tesla": "echo",
  "ibn-alhaytham": "onyx",
  "ibn-al-haytham": "onyx",
  "curie": "nova",
  "feynman": "verse",
  "morgan-freeman": "onyx",
  "david-attenborough": "fable",
  "carl-sagan": "ballad",
  "news-anchor-01": "alloy",
  "storyteller-01": "coral",
  "cyber-ai-omega": "shimmer",
};

export class VoiceManager {
  private providers: Map<VoiceProviderId, VoiceProviderAdapter> = new Map();
  private playHT: PlayHTAdapter;

  constructor() {
    const elevenLabs = new ElevenLabsAdapter();
    const openRouterTts = new OpenRouterTtsAdapter();
    const openaiTts = new OpenAITtsAdapter();
    const geminiTts = new GeminiTtsAdapter();
    const xttsV2 = new XttsV2Adapter();
    const kokoroTts = new KokoroTtsAdapter();
    const cartesia = new CartesiaAdapter();

    this.providers.set("elevenlabs", elevenLabs);
    this.providers.set("openrouter-tts", openRouterTts);
    this.providers.set("openrouter", openRouterTts);
    this.providers.set("openai-tts", openaiTts);
    this.providers.set("openai", openaiTts);
    this.providers.set("gemini-tts", geminiTts);
    this.providers.set("xtts-v2", xttsV2);
    this.providers.set("kokoro-tts", kokoroTts);
    this.providers.set("cartesia", cartesia);

    this.playHT = new PlayHTAdapter(
      process.env.PLAYHT_API_KEY || "",
      process.env.PLAYHT_USER_ID || ""
    );
  }

  /**
   * Automatically classifies the prompt/text into the appropriate VoiceTaskCategory
   * (e.g., "اصنع فيديو عن الثقوب السوداء" -> DOCUMENTARY)
   */
  detectCategory(text: string): VoiceTaskCategory {
    const q = text.toLowerCase();
    if (
      /وثائقي|طبيعة|كون|فضاء|ثقوب سوداء|ثقب أسود|مجرة|نجوم|كوكب|ناشيونال|تاريخ|حضارة|documentary|cosmos|black hole|universe|nature/i.test(
        q
      )
    ) {
      return VoiceTaskCategory.DOCUMENTARY;
    }
    if (/خبر|أخبار|عاجل|تقرير|نشرة|موجز|الجزائر|العالم|news|breaking|report/i.test(q)) {
      return VoiceTaskCategory.NEWS;
    }
    if (
      /علم|فيزياء|رياضيات|معادلة|ذرة|كموم|جاذبية|نيوتن|أينشتاين|تيسلا|كوري|ابن الهيثم|بروفيسور|science|physics|math|quantum/i.test(
        q
      )
    ) {
      return VoiceTaskCategory.SCIENTIFIC;
    }
    if (/قصة|رواية|حكاية|كان يا ما كان|أسطورة|ملحمة|story|novel|tale/i.test(q)) {
      return VoiceTaskCategory.STORYTELLING;
    }
    if (/شرح|درس|تعليم|تبسيط|كيف يعمل|ما هو|explain|lesson|tutorial/i.test(q)) {
      return VoiceTaskCategory.EDUCATION;
    }
    if (/أنمي|انمي|كرتون|أطفال|anime|kids/i.test(q)) {
      return VoiceTaskCategory.ANIME;
    }
    return VoiceTaskCategory.CONVERSATION;
  }

  /**
   * Returns status of all registered voice engines
   */
  getProvidersStatus(): Array<{ id: VoiceProviderId; name: string; available: boolean }> {
    const unique: VoiceProviderId[] = [
      "elevenlabs",
      "openrouter-tts",
      "gemini-tts",
      "openai-tts",
      "cartesia",
      "kokoro-tts",
      "xtts-v2",
    ];
    return unique.map((id) => {
      const adapter = this.providers.get(id)!;
      return {
        id,
        name: adapter.name,
        available: adapter.isAvailable(),
      };
    });
  }

  getCatalog(): VoicePersona[] {
    return OMEGA_VOICE_CATALOG;
  }

  /**
   * Resolves the best persona and available provider for a synthesis request.
   * Falls back to available providers (such as OpenRouter TTS or Gemini TTS) if the primary provider's API key is not set.
   */
  async synthesize(options: VoiceSynthesisOptions): Promise<VoiceSynthesisResult> {
    const cleanText = (options.text || "").trim();
    if (!cleanText) {
      throw new Error("Text is required for voice synthesis.");
    }

    const category = options.category || this.detectCategory(cleanText);

    // 1. Find requested persona or best persona matching category
    let persona: VoicePersona | undefined;
    if (options.personaId) {
      persona = OMEGA_VOICE_CATALOG.find((p) => p.id === options.personaId);
    }
    if (!persona) {
      persona =
        OMEGA_VOICE_CATALOG.find((p) => p.category === category) ||
        OMEGA_VOICE_CATALOG[0];
    }

    const requestedProvider: VoiceProviderId = options.provider || persona.provider;
    const targetSpeed = options.speed ?? persona.speed ?? 1.0;
    const stylePrompt = options.stylePrompt ?? persona.stylePrompt;

    // Ordered cascade: try requested provider first, then available fallbacks (prioritize Kokoro for speed)
    const fallbackOrder: VoiceProviderId[] = [
      requestedProvider,
      "kokoro-tts",
      "elevenlabs",
      "openrouter-tts",
      "gemini-tts",
      "openai-tts",
      "cartesia",
      "xtts-v2",
    ];
    const uniqueOrder = Array.from(new Set(fallbackOrder));

    let lastError: any = null;

    for (const providerId of uniqueOrder) {
      if (providerId === "playht") {
        try {
          const buf = await this.playHT.generate(
            cleanText,
            options.voiceId || persona.voiceId
          );
          return {
            audioBuffer: buf,
            mimeType: "audio/mpeg",
            providerUsed: "playht",
            personaId: persona.id,
            voiceId: options.voiceId || persona.voiceId,
            category,
          };
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      const adapter = this.providers.get(providerId);
      if (!adapter || !adapter.isAvailable()) {
        continue;
      }

      try {
        // Choose provider-appropriate voiceId if falling back to another engine
        const effectiveVoiceId =
          providerId === requestedProvider
            ? options.voiceId || persona.voiceId
            : providerId === "gemini-tts" && GEMINI_VOICE_BY_PERSONA[persona.id]
              ? GEMINI_VOICE_BY_PERSONA[persona.id]
              : (providerId === "openrouter-tts" || providerId === "openrouter") &&
                OPENROUTER_VOICE_BY_PERSONA[persona.id]
                ? OPENROUTER_VOICE_BY_PERSONA[persona.id]
                : this.getDefaultVoiceForProvider(providerId, category);

        const { buffer, mimeType } = await adapter.generate(cleanText, effectiveVoiceId, {
          speed: targetSpeed,
          language: options.language,
          stylePrompt,
        });

        return {
          audioBuffer: buffer,
          mimeType,
          providerUsed: providerId,
          personaId: persona.id,
          voiceId: effectiveVoiceId,
          category,
        };
      } catch (err) {
        lastError = err;
      }
    }

    throw new Error(
      lastError?.message ||
        "No configured voice synthesis provider succeeded. Check your API keys in .env."
    );
  }

  private getDefaultVoiceForProvider(
    providerId: VoiceProviderId,
    category: VoiceTaskCategory
  ): string {
    switch (providerId) {
      case "gemini-tts":
        return category === VoiceTaskCategory.DOCUMENTARY ||
          category === VoiceTaskCategory.SCIENTIFIC
          ? "Charon"
          : "Kore";
      case "openrouter-tts":
      case "openrouter":
      case "openai-tts":
      case "openai":
        return category === VoiceTaskCategory.DOCUMENTARY ||
          category === VoiceTaskCategory.NEWS
          ? "onyx"
          : "echo";
      case "elevenlabs":
        return "pNInz6obpgDAGcFmaO6f";
      case "cartesia":
        return "a0e99841-438c-4a64-b679-ae501e7d6091";
      case "kokoro-tts":
        return "am_adam";
      case "xtts-v2":
        return "Claribel Dervla";
      default:
        return "default";
    }
  }

  /**
   * Backward-compatible method returning raw audio Buffer
   */
  async generateVoice(
    text: string,
    category?: VoiceTaskCategory,
    personaId?: string,
    provider?: VoiceProviderId
  ): Promise<Buffer> {
    const res = await this.synthesize({
      text,
      category,
      personaId,
      provider,
    });
    return res.audioBuffer;
  }
}

export const globalVoiceManager = new VoiceManager();
