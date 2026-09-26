import OpenAI from "openai";
import type { VoiceProviderAdapter } from "../types";

const VALID_OPENAI_VOICES = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]);

export class OpenAITtsAdapter implements VoiceProviderAdapter {
  readonly id = "openai-tts" as const;
  readonly name = "OpenAI TTS-1-HD";
  private client: OpenAI | null = null;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = (apiKey ?? process.env.OPENAI_API_KEY ?? "").trim();
    if (this.apiKey) {
      this.client = new OpenAI({ apiKey: this.apiKey });
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
      throw new Error("OpenAI API key is not configured.");
    }

    const selectedVoice = VALID_OPENAI_VOICES.has(voiceId) ? voiceId : "onyx";
    const speed = Math.max(0.5, Math.min(2.0, options?.speed ?? 1.0));

    const mp3 = await this.client.audio.speech.create({
      model: "tts-1-hd",
      voice: selectedVoice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
      speed,
    });

    return {
      buffer: Buffer.from(await mp3.arrayBuffer()),
      mimeType: "audio/mpeg",
    };
  }
}

export { OpenAITtsAdapter as OpenAIAdapter };
