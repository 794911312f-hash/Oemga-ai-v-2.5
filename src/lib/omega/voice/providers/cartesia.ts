import type { VoiceProviderAdapter } from "../types";

export class CartesiaAdapter implements VoiceProviderAdapter {
  readonly id = "cartesia" as const;
  readonly name = "Cartesia Sonic";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = (apiKey ?? process.env.CARTESIA_API_KEY ?? "").trim();
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey || (process.env.CARTESIA_API_KEY ?? "").trim());
  }

  async generate(
    text: string,
    voiceId: string,
    options?: { speed?: number; language?: "ar" | "en"; stylePrompt?: string }
  ): Promise<{ buffer: Buffer; mimeType: "audio/wav" }> {
    const key = this.apiKey || (process.env.CARTESIA_API_KEY ?? "").trim();
    if (!key) {
      throw new Error("Cartesia API key is not configured.");
    }

    const effectiveVoiceId = voiceId || "a0e99841-438c-4a64-b679-ae501e7d6091";
    const isArabic = /[\u0600-\u06FF]/.test(text) || options?.language === "ar";

    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "Cartesia-Version": "2024-06-10",
        "X-API-Key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_id: "sonic-multilingual",
        transcript: text,
        voice: {
          mode: "id",
          id: effectiveVoiceId,
        },
        output_format: {
          container: "wav",
          encoding: "pcm_s16le",
          sample_rate: 24000,
        },
        language: isArabic ? "ar" : "en",
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`Cartesia TTS error (${response.status}): ${errText}`);
    }

    const arrayBuf = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuf),
      mimeType: "audio/wav",
    };
  }
}
