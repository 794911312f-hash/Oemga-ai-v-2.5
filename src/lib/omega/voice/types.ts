export enum VoiceTaskCategory {
  DOCUMENTARY = "documentary",
  NEWS = "news",
  SCIENTIFIC = "scientific",
  STORYTELLING = "storytelling",
  CONVERSATION = "conversation",
}

export interface VoicePersona {
  id: string;
  name: string;
  provider: "elevenlabs" | "openai" | "playht";
  voiceId: string;
  category: VoiceTaskCategory;
  description: string;
}

export const OMEGA_VOICE_CATALOG: VoicePersona[] = [
  {
    id: "doc-nature-01",
    name: "وثائقي الطبيعة العميق",
    provider: "elevenlabs",
    voiceId: "pNInz6obpgDAGcFmaO6f", // Example ID
    category: VoiceTaskCategory.DOCUMENTARY,
    description: "صوت وثائقي عميق ووقور مناسب للطبيعة والكون",
  },
  {
    id: "news-anchor-01",
    name: "مذيع الأخبار الرسمي",
    provider: "elevenlabs",
    voiceId: "CYw3kZ02Q0J6c9vXm6uX", // Example ID
    category: VoiceTaskCategory.NEWS,
    description: "صوت واثق ورسمي مناسب للأخبار العاجلة",
  },
];
