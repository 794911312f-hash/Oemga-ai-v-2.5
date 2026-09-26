import { ElevenLabsClient } from "elevenlabs";
import type { VoiceProviderAdapter } from "../types";

export class ElevenLabsAdapter implements VoiceProviderAdapter {
  readonly id = "elevenlabs" as const;
  readonly name = "ElevenLabs Voice AI";
  private client: ElevenLabsClient | null = null;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = (apiKey ?? process.env.ELEVENLABS_API_KEY ?? "").trim();
    if (this.apiKey) {
      this.client = new ElevenLabsClient({ apiKey: this.apiKey });
    }
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.client);
  }

  async generate(
    text: string,
    voiceId: string,
    options?: { speed?: number; language?: "ar" | "en"; stylePrompt?: string }
  ): Promise<{ buffer: Buffer; mimeType: "audio/mpeg" }> {
    if (!this.client || !this.apiKey) {
      throw new Error("ElevenLabs API key is not configured.");
    }

    const effectiveVoiceId = voiceId || "pNInz6obpgDAGcFmaO6f";
    const audioStream = await this.client.generate({
      voice: effectiveVoiceId,
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.65,
        similarity_boost: 0.8,
        style: options?.stylePrompt ? 0.35 : 0.2,
        use_speaker_boost: true,
      },
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return {
      buffer: Buffer.concat(chunks),
      mimeType: "audio/mpeg",
    };
  }
}
