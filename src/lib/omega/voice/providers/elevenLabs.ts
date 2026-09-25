import { ElevenLabsClient } from "elevenlabs";

export class ElevenLabsAdapter {
  private client: ElevenLabsClient;

  constructor(apiKey: string) {
    this.client = new ElevenLabsClient({ apiKey });
  }

  async generate(text: string, voiceId: string): Promise<Buffer> {
    const audioStream = await this.client.generate({
      voice: voiceId,
      text: text,
      model_id: "eleven_multilingual_v2",
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
