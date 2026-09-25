import { ElevenLabsAdapter } from "./providers/elevenLabs";
import { OMEGA_VOICE_CATALOG, VoiceTaskCategory, VoicePersona } from "./types";

export class VoiceManager {
  private elevenLabs: ElevenLabsAdapter;

  constructor() {
    this.elevenLabs = new ElevenLabsAdapter(process.env.ELEVENLABS_API_KEY || "");
  }

  async generateVoice(text: string, category: VoiceTaskCategory): Promise<Buffer> {
    const persona = OMEGA_VOICE_CATALOG.find((p) => p.category === category) || OMEGA_VOICE_CATALOG[0];
    
    if (persona.provider === "elevenlabs") {
      return await this.elevenLabs.generate(text, persona.voiceId);
    }
    
    throw new Error(`Provider ${persona.provider} not implemented yet.`);
  }
}
