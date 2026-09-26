import { GoogleGenAI } from "@google/genai";
import type { VoiceProviderAdapter } from "../types";

const VALID_GEMINI_VOICES = new Set(["Puck", "Charon", "Kore", "Fenrir", "Zephyr"]);

/**
 * Wraps raw 24kHz 16-bit mono PCM audio bytes in a standard 44-byte RIFF WAV header
 * so standard browser <audio> elements and players can play it directly.
 */
function wrapPcm24kMonoToWav(pcmBuffer: Buffer, sampleRate = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

export class GeminiTtsAdapter implements VoiceProviderAdapter {
  readonly id = "gemini-tts" as const;
  readonly name = "Google Gemini Neural TTS";
  private apiKey: string;
  private ai: GoogleGenAI | null = null;

  constructor(apiKey?: string) {
    this.apiKey = (apiKey ?? process.env.GEMINI_API_KEY ?? "").trim();
    if (this.apiKey) {
      this.ai = new GoogleGenAI({
        apiKey: this.apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }

  isAvailable(): boolean {
    const key = this.apiKey || (process.env.GEMINI_API_KEY ?? "").trim();
    if (key && !this.ai) {
      this.apiKey = key;
      this.ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return Boolean(this.ai);
  }

  async generate(
    text: string,
    voiceId: string,
    options?: { speed?: number; language?: "ar" | "en"; stylePrompt?: string }
  ): Promise<{ buffer: Buffer; mimeType: "audio/wav" }> {
    if (!this.isAvailable() || !this.ai) {
      throw new Error("Gemini API key is not configured for Gemini TTS.");
    }

    const voiceName = VALID_GEMINI_VOICES.has(voiceId) ? voiceId : "Charon";
    const style =
      options?.stylePrompt ||
      "Deep, clear, eloquent documentary and scientific narrator";

    const response = await this.ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text,
              speechMetadata: {
                style,
              },
            } as any,
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const base64Audio = inlineData?.data;
    if (!base64Audio) {
      throw new Error("Gemini TTS returned empty audio data.");
    }

    const rawBuffer = Buffer.from(base64Audio, "base64");
    // Check if already WAV header ("RIFF"), otherwise wrap 24kHz PCM in WAV header
    const isAlreadyWav =
      rawBuffer.length > 12 &&
      rawBuffer.toString("ascii", 0, 4) === "RIFF" &&
      rawBuffer.toString("ascii", 8, 12) === "WAVE";

    const wavBuffer = isAlreadyWav ? rawBuffer : wrapPcm24kMonoToWav(rawBuffer, 24000);

    return {
      buffer: wavBuffer,
      mimeType: "audio/wav",
    };
  }
}
