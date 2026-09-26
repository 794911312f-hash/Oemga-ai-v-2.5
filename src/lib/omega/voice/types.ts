export enum VoiceTaskCategory {
  DOCUMENTARY = "documentary",
  NEWS = "news",
  SCIENTIFIC = "scientific",
  STORYTELLING = "storytelling",
  CONVERSATION = "conversation",
  EDUCATION = "education",
  CHILDREN = "children",
  ANIME = "anime",
}

export type VoiceProviderId =
  | "elevenlabs"
  | "openai-tts"
  | "openai"
  | "gemini-tts"
  | "xtts-v2"
  | "kokoro-tts"
  | "cartesia"
  | "playht";

export interface VoicePersona {
  id: string;
  name: string;
  nameEn?: string;
  provider: VoiceProviderId;
  voiceId: string;
  category: VoiceTaskCategory;
  description: string;
  language?: "ar" | "en" | "multilingual";
  stylePrompt?: string;
  speed?: number;
  pitch?: number;
}

export interface VoiceSynthesisOptions {
  text: string;
  category?: VoiceTaskCategory;
  personaId?: string;
  provider?: VoiceProviderId;
  voiceId?: string;
  language?: "ar" | "en";
  speed?: number;
  stylePrompt?: string;
}

export interface VoiceSynthesisResult {
  audioBuffer: Buffer;
  mimeType: "audio/mpeg" | "audio/wav";
  providerUsed: VoiceProviderId;
  personaId: string;
  voiceId: string;
  category: VoiceTaskCategory;
}

export interface VoiceProviderAdapter {
  readonly id: VoiceProviderId;
  readonly name: string;
  isAvailable(): boolean;
  generate(
    text: string,
    voiceId: string,
    options?: {
      speed?: number;
      language?: "ar" | "en";
      stylePrompt?: string;
    }
  ): Promise<{ buffer: Buffer; mimeType: "audio/mpeg" | "audio/wav" }>;
}

export const OMEGA_VOICE_CATALOG: VoicePersona[] = [
  {
    id: "doc-arabic-fusha",
    name: "الراوي الوثائقي العربي (ناشيونال جيوغرافيك)",
    nameEn: "Arabic Documentary Master",
    provider: "elevenlabs",
    voiceId: "pNInz6obpgDAGcFmaO6f", // Adam / Deep Documentary
    category: VoiceTaskCategory.DOCUMENTARY,
    description: "صوت وثائقي عميق ووقور بأسلوب البرامج العلمية والكونيات (ناشيونال جيوغرافيك)",
    language: "multilingual",
    stylePrompt: "Deep, authoritative, awe-inspiring National Geographic documentary narrator in eloquent Arabic",
    speed: 0.92,
  },
  {
    id: "professor-omega",
    name: "البروفيسور أوميغا (رجل عجوز حكيم)",
    nameEn: "Professor Omega (Wise Elder)",
    provider: "gemini-tts",
    voiceId: "Charon",
    category: VoiceTaskCategory.SCIENTIFIC,
    description: "صوت رجل عجوز حكيم ووقور، بنبرة دافئة رصينة تتخللها بحة الحكمة وسنوات البحث العلمي",
    language: "multilingual",
    stylePrompt: "Wise, warm, venerable elderly physics professor speaking deliberately with deep scholarly gravitas",
    speed: 0.88,
  },
  {
    id: "newton",
    name: "السير إسحاق نيوتن",
    nameEn: "Sir Isaac Newton",
    provider: "elevenlabs",
    voiceId: "onwK4e9ZLuTAKqWW03F9", // Daniel - British authoritative
    category: VoiceTaskCategory.SCIENTIFIC,
    description: "وقار أكاديمي كلاسيكي، نبرة رصينة متأنية تعكس الحكمة والصرامة الرياضية",
    language: "multilingual",
    stylePrompt: "Classical, composed, formal aristocratic scholar explaining mathematical laws",
    speed: 0.9,
  },
  {
    id: "einstein",
    name: "ألبرت أينشتاين",
    nameEn: "Albert Einstein",
    provider: "gemini-tts",
    voiceId: "Fenrir",
    category: VoiceTaskCategory.SCIENTIFIC,
    description: "نبرة فلسفية هادئة وتأملية، عميقة وبطيئة تنضح بالدهشة الكونية والتساؤل",
    language: "multilingual",
    stylePrompt: "Gentle, philosophical, reflective scientist marveling at the mysteries of spacetime",
    speed: 0.88,
  },
  {
    id: "tesla",
    name: "نيكولا تيسلا",
    nameEn: "Nikola Tesla",
    provider: "cartesia",
    voiceId: "a0e99841-438c-4a64-b679-ae501e7d6091",
    category: VoiceTaskCategory.SCIENTIFIC,
    description: "نبرة كهربائية سريعة ومركزة، مليئة بالشغف للمستقبل والرنين الطاقي",
    language: "multilingual",
    stylePrompt: "Focused, intense, visionary inventor speaking with electric passion",
    speed: 1.05,
  },
  {
    id: "ibn-alhaytham",
    name: "الحسن ابن الهيثم",
    nameEn: "Al-Hasan Ibn al-Haytham",
    provider: "gemini-tts",
    voiceId: "Charon",
    category: VoiceTaskCategory.SCIENTIFIC,
    description: "فصاحة عربية جزلة رنانة، هدوء المنهج الاستقرائي الصارم ومخارج حروف واضحة",
    language: "ar",
    stylePrompt: "Classical eloquent Arabic scholar speaking with calm empirical rigor and clarity",
    speed: 0.9,
  },
  {
    id: "curie",
    name: "ماري كوري",
    nameEn: "Marie Curie",
    provider: "openai-tts",
    voiceId: "nova",
    category: VoiceTaskCategory.SCIENTIFIC,
    description: "نبرة هادئة، دقيقة وصادقة تنضح بالإصرار العلمي والشجاعة المعرفية",
    language: "multilingual",
    stylePrompt: "Calm, precise, determined female scientist",
    speed: 0.94,
  },
  {
    id: "feynman",
    name: "ريتشارد فاينمان",
    nameEn: "Richard Feynman",
    provider: "openai-tts",
    voiceId: "echo",
    category: VoiceTaskCategory.EDUCATION,
    description: "نبرة عفوية، مرحة ومتحمسة تبسط أعقد أسرار فيزياء الجسيمات",
    language: "multilingual",
    stylePrompt: "Enthusiastic, charismatic, curious physics teacher making complex ideas fun",
    speed: 1.06,
  },
  {
    id: "morgan-freeman",
    name: "مورغان فريمان",
    nameEn: "Morgan Freeman",
    provider: "elevenlabs",
    voiceId: "pNInz6obpgDAGcFmaO6f",
    category: VoiceTaskCategory.DOCUMENTARY,
    description: "باريتون دافئ، عميق، موثوق ومفعم بالهيبة؛ يعطي لكل كلمة وزناً تاريخياً وكونياً",
    language: "multilingual",
    stylePrompt: "Deep, resonant, velvety baritone narrator with timeless cosmic wisdom",
    speed: 0.86,
  },
  {
    id: "david-attenborough",
    name: "ديفيد أتينبورو",
    nameEn: "David Attenborough",
    provider: "elevenlabs",
    voiceId: "onwK4e9ZLuTAKqWW03F9",
    category: VoiceTaskCategory.DOCUMENTARY,
    description: "نبرة وثائقية هامسة، دافئة ومشوقة، تحبس الأنفاس إجلالاً لروائع الطبيعة",
    language: "multilingual",
    stylePrompt: "Hushed, fascinated, warm natural history documentary narrator",
    speed: 0.86,
  },
  {
    id: "carl-sagan",
    name: "كارل ساغان",
    nameEn: "Carl Sagan",
    provider: "openai-tts",
    voiceId: "onyx",
    category: VoiceTaskCategory.DOCUMENTARY,
    description: "صوت شاعري رقيق ومؤثر، يفيض بالتأمل الروحي والعلمي في مكانة الإنسان بالكون",
    language: "multilingual",
    stylePrompt: "Poetic, awe-struck cosmic philosopher speaking gently about the universe",
    speed: 0.88,
  },
  {
    id: "news-anchor-01",
    name: "مذيع الأخبار الرسمي",
    nameEn: "Official News Anchor",
    provider: "openai-tts",
    voiceId: "onyx",
    category: VoiceTaskCategory.NEWS,
    description: "صوت واثق ورسمي مناسب للأخبار العاجلة والتقارير الإخبارية",
    language: "multilingual",
    stylePrompt: "Clear, authoritative, professional breaking news anchor",
    speed: 1.0,
  },
  {
    id: "storyteller-01",
    name: "الراوي القصصي والملحمي",
    nameEn: "Epic Storyteller",
    provider: "xtts-v2",
    voiceId: "Claribel Dervla",
    category: VoiceTaskCategory.STORYTELLING,
    description: "سرد تراثي وروائي دافئ يأخذ المستمع في رحلة عبر القصص والروايات",
    language: "multilingual",
    stylePrompt: "Expressive, warm, immersive literary storyteller",
    speed: 0.92,
  },
  {
    id: "cyber-ai-omega",
    name: "صوت أوميغا التفاعلي السريع",
    nameEn: "Omega Interactive Assistant",
    provider: "kokoro-tts",
    voiceId: "am_adam",
    category: VoiceTaskCategory.CONVERSATION,
    description: "صوت رقمي نقي وسلس للمحادثات المباشرة والإجابات الفورية",
    language: "multilingual",
    stylePrompt: "Clear, articulate, intelligent conversational AI assistant",
    speed: 1.0,
  },
];
