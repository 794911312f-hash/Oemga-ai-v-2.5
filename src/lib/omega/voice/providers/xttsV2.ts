import type { VoiceProviderAdapter } from "../types";

export class XttsV2Adapter implements VoiceProviderAdapter {
  readonly id = "xtts-v2" as const;
  readonly name = "XTTS v2 (Coqui Open Source)";
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl ?? process.env.XTTS_API_URL ?? "").trim();
  }

  isAvailable(): boolean {
    return Boolean(this.baseUrl || (process.env.XTTS_API_URL ?? "").trim());
  }

  async generate(
    text: string,
    voiceId: string,
    options?: { speed?: number; language?: "ar" | "en"; stylePrompt?: string }
  ): Promise<{ buffer: Buffer; mimeType: "audio/wav" }> {
    const base = (this.baseUrl || process.env.XTTS_API_URL || "http://localhost:8020").replace(/\/+$/, "");
    const isArabic = /[\u0600-\u06FF]/.test(text) || options?.language === "ar";

    const response = await fetch(`${base}/tts_to_audio/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        speaker_wav: voiceId || "Claribel Dervla",
        language: isArabic ? "ar" : "en",
        speed: options?.speed ?? 1.0,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`XTTS v2 error (${response.status}): ${errText}`);
    }

    const arrayBuf = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuf),
      mimeType: "audio/wav",
    };
  }
}
