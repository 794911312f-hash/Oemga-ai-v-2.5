import type { VoiceProviderAdapter } from "../types";

export class KokoroTtsAdapter implements VoiceProviderAdapter {
  readonly id = "kokoro-tts" as const;
  readonly name = "Kokoro TTS (82M Open Source)";
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = (baseUrl ?? process.env.KOKORO_API_URL ?? "").trim();
    this.apiKey = (apiKey ?? process.env.KOKORO_API_KEY ?? "").trim();
  }

  isAvailable(): boolean {
    return Boolean(this.baseUrl || (process.env.KOKORO_API_URL ?? "").trim());
  }

  async generate(
    text: string,
    voiceId: string,
    options?: { speed?: number; language?: "ar" | "en"; stylePrompt?: string }
  ): Promise<{ buffer: Buffer; mimeType: "audio/mpeg" | "audio/wav" }> {
    const endpoint =
      this.baseUrl ||
      (process.env.KOKORO_API_URL ?? "http://localhost:8880/v1/audio/speech").trim();

    const selectedVoice = voiceId || "am_adam";
    const speed = Math.max(0.5, Math.min(2.0, options?.speed ?? 1.0));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "kokoro",
        input: text,
        voice: selectedVoice,
        response_format: "mp3",
        speed,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`Kokoro TTS error (${response.status}): ${errText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const arrayBuf = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuf),
      mimeType: contentType.includes("wav") ? "audio/wav" : "audio/mpeg",
    };
  }
}
