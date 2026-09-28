import type { VoiceProviderAdapter } from "../types";

const VALID_OPENROUTER_AUDIO_VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "onyx",
  "nova",
  "sage",
  "shimmer",
  "verse",
]);

/**
 * OpenRouter Audio / TTS Adapter (uses openai/gpt-4o-audio-preview via OpenRouter API)
 */
export class OpenRouterTtsAdapter implements VoiceProviderAdapter {
  readonly id = "openrouter-tts" as const;
  readonly name = "OpenRouter Audio (GPT-4o Audio)";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = (apiKey ?? process.env.OPENROUTER_API_KEY ?? "").trim();
  }

  isAvailable(): boolean {
    const key = this.apiKey || (process.env.OPENROUTER_API_KEY ?? "").trim();
    if (key) {
      this.apiKey = key;
    }
    return Boolean(this.apiKey);
  }

  async generate(
    text: string,
    voiceId: string,
    options?: { speed?: number; language?: "ar" | "en"; stylePrompt?: string }
  ): Promise<{ buffer: Buffer; mimeType: "audio/wav" | "audio/mpeg" }> {
    const key = this.apiKey || (process.env.OPENROUTER_API_KEY ?? "").trim();
    if (!key) {
      throw new Error("OpenRouter API key is not configured for OpenRouter TTS.");
    }

    const selectedVoice = VALID_OPENROUTER_AUDIO_VOICES.has(voiceId) ? voiceId : "onyx";
    const styleInstruction =
      options?.stylePrompt ||
      "Speak the user's text verbatim with natural, expressive, authoritative delivery. Do not add commentary; only read the provided text.";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": process.env.APP_URL || "https://omega-ai.app",
        "X-Title": "Omega AI Consensus System",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-audio-preview",
        modalities: ["text", "audio"],
        audio: {
          voice: selectedVoice,
          format: "wav",
        },
        messages: [
          {
            role: "system",
            content: `${styleInstruction}\nRead the following text aloud accurately without adding or omitting words.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`OpenRouter TTS HTTP ${response.status}: ${errText.slice(0, 160)}`);
    }

    const data = (await response.json()) as any;
    const base64Audio = data?.choices?.[0]?.message?.audio?.data;
    if (!base64Audio) {
      throw new Error("OpenRouter Audio model did not return audio data.");
    }

    return {
      buffer: Buffer.from(base64Audio, "base64"),
      mimeType: "audio/wav",
    };
  }
}
