import PlayHT from "playht";

export class PlayHTAdapter {
  private client: any;
  private initialized: boolean = false;

  constructor(apiKey: string, userId: string) {
    if (apiKey && userId) {
      PlayHT.init({ apiKey, userId });
      this.client = PlayHT;
      this.initialized = true;
    } else {
      console.warn("PlayHT credentials missing; skipping initialization.");
    }
  }

  async generate(text: string, voiceId: string): Promise<Buffer> {
    if (!this.initialized) {
      throw new Error("PlayHT not initialized due to missing credentials.");
    }
    const stream = await this.client.stream(text, {
      voiceEngine: "PlayHT2.0",
      voiceId: voiceId,
    });

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
