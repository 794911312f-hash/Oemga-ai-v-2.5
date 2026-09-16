/**
 * src/lib/omega/speech.ts
 * Omega Voice Synthesis Engine & Multi-Model Voice Catalog
 * Supports Scientist voices, Celebrity & Iconic voices, Documentary voices,
 * and browser/server-driven Text-To-Speech for Omega AI.
 */

export interface VoiceEngineSpec {
  id: string;
  name: string;
  company: string;
  tagline: string;
  badge: string;
  latency: string;
  qualityRating: string;
  isOpenSource: boolean;
  isFlagship: boolean;
  accentColor: string;
}

export const OMEGA_VOICE_ENGINES: Record<string, VoiceEngineSpec> = {
  elevenlabs: {
    id: "elevenlabs",
    name: "ElevenLabs Voice AI",
    company: "ElevenLabs",
    tagline: "المعيار الذهبي للأصوات البشرية فائقة الواقعية والعمق النفسي والتنفسي",
    badge: "Flagship Hollywood Quality",
    latency: "~220ms",
    qualityRating: "9.9/10",
    isOpenSource: false,
    isFlagship: true,
    accentColor: "#a855f7",
  },
  cartesia: {
    id: "cartesia",
    name: "Cartesia Sonic",
    company: "Cartesia AI",
    tagline: "أسرع محرك صوتي في العالم بزمن استجابة أقل من 90ms للمحادثات الحية الفورية",
    badge: "Ultra-Low Latency <90ms",
    latency: "85ms",
    qualityRating: "9.7/10",
    isOpenSource: false,
    isFlagship: true,
    accentColor: "#06b6d4",
  },
  "kokoro-tts": {
    id: "kokoro-tts",
    name: "Kokoro TTS (82M)",
    company: "Hexgrad Open Source",
    tagline: "نموذج صوتي مفتوح المصدر فائق الخفة والكفاءة بجودة أجهزة الاستوديو",
    badge: "Open Source 100% Local",
    latency: "110ms",
    qualityRating: "9.4/10",
    isOpenSource: true,
    isFlagship: false,
    accentColor: "#10b981",
  },
  "xtts-v2": {
    id: "xtts-v2",
    name: "XTTS v2 (Coqui)",
    company: "Coqui Open Source",
    tagline: "استنساخ نبرة وتطبيع الأصوات عبر 17 لغة مع ضبط العاطفة والإيقاع",
    badge: "Cross-Lingual Clone",
    latency: "280ms",
    qualityRating: "9.3/10",
    isOpenSource: true,
    isFlagship: false,
    accentColor: "#f59e0b",
  },
  "openai-tts": {
    id: "openai-tts",
    name: "OpenAI TTS-1-HD",
    company: "OpenAI",
    tagline: "أصوات أونكس وشيمر وألوي فائقة النقاء للبودكاست والردود التفاعلية",
    badge: "Studio 48kHz HD",
    latency: "170ms",
    qualityRating: "9.5/10",
    isOpenSource: false,
    isFlagship: true,
    accentColor: "#10b981",
  },
  "gemini-tts": {
    id: "gemini-tts",
    name: "Google Gemini Neural TTS",
    company: "Google DeepMind",
    tagline: "توليد صوتي عصبي ذكي يتناغم مع المنطق وسياق الحوار بطلاقة عربية وعالمية",
    badge: "DeepMind Multimodal",
    latency: "140ms",
    qualityRating: "9.8/10",
    isOpenSource: false,
    isFlagship: true,
    accentColor: "#38bdf8",
  },
};

export type VoiceCategory = "scientists" | "celebrities" | "documentary";

export interface VoicePersona {
  id: string;
  nameAr: string;
  nameEn: string;
  category: VoiceCategory;
  titleAr: string;
  descriptionAr: string;
  gender: "male" | "female";
  recommendedEngine: string;
  pitch: number; // 0.5 - 1.5
  rate: number;  // 0.5 - 1.5
  avatarEmoji: string;
  accentColor: string;
  sampleQuoteAr: string;
  tags: string[];
}

export const OMEGA_VOICE_PERSONAS: VoicePersona[] = [
  // ==========================================
  // Category 1: أصوات العلماء (Scientists)
  // ==========================================
  {
    id: "professor-omega",
    nameAr: "البروفيسور أوميغا (صوت رجل عجوز حكيم)",
    nameEn: "Professor Omega (Wise Elder)",
    category: "scientists",
    titleAr: "كبير علماء نواة أوميغا والمشرف على فيزياء الكونيات",
    descriptionAr: "صوت رجل عجوز حكيم ووقور، بنبرة دافئة رصينة تتخللها بحة الحكمة وسنوات البحث الطويلة، مع إيقاع متأنٍ وتفخيم هادئ للألفاظ العلمية.",
    gender: "male",
    recommendedEngine: "gemini-tts",
    pitch: 0.70, // Old man lower, warm, gravelly pitch
    rate: 0.86, // Deliberate, scholarly elder cadence
    avatarEmoji: "👨‍🔬",
    accentColor: "#06b6d4",
    sampleQuoteAr: "أهلاً بك يا بني في مختبر أوميغا.. بعد عقود من البحث في أسرار الكون، أؤكد لك أن الجاذبية والزمكان أعظم سيمفونية صاغتها الطبيعة!",
    tags: ["رجل عجوز", "بروفيسور", "حكمة", "فيزياء", "وقار", "مختبر"],
  },
  {
    id: "newton",
    nameAr: "السير إسحاق نيوتن",
    nameEn: "Sir Isaac Newton",
    category: "scientists",
    titleAr: "عالم الرياضيات والفيزياء ومكتشف الجاذبية",
    descriptionAr: "وقار أكاديمي كلاسيكي، نبرة رصينة متأنية تعكس الحكمة والصرامة الرياضية.",
    gender: "male",
    recommendedEngine: "elevenlabs",
    pitch: 0.92,
    rate: 0.88,
    avatarEmoji: "🍎",
    accentColor: "#ef4444",
    sampleQuoteAr: "إذا كنت قد رأيت أبعد من غيري، فذلك لأني وقفت على أكتاف العمالقة. في السقوط الشاقولي، التسارع ثابت لجميع الكتل.",
    tags: ["فيزياء", "جاذبية", "رياضيات", "كلاسيكي"],
  },
  {
    id: "einstein",
    nameAr: "ألبرت أينشتاين",
    nameEn: "Albert Einstein",
    category: "scientists",
    titleAr: "واضع النسبية وفيزياء الزمكان",
    descriptionAr: "نبرة فلسفية هادئة وتأملية، عميقة وبطيئة تنضح بالدهشة الكونية والتساؤل.",
    gender: "male",
    recommendedEngine: "elevenlabs",
    pitch: 0.86,
    rate: 0.85,
    avatarEmoji: "🌌",
    accentColor: "#38bdf8",
    sampleQuoteAr: "الخيال أكثر أهمية من المعرفة، فالمعرفة محدودة، بينما الخيال يطوق هذا الكون الفسيح ويفكك أسرار الزمكان.",
    tags: ["نسبية", "كونيات", "فلسفة", "كموم"],
  },
  {
    id: "tesla",
    nameAr: "نيكولا تيسلا",
    nameEn: "Nikola Tesla",
    category: "scientists",
    titleAr: "رائد الكهرباء والتيار المتردد والمستقبل",
    descriptionAr: "نبرة كهربائية سريعة ومركزة، مليئة بالشغف للمستقبل والرنين الطاقي.",
    gender: "male",
    recommendedEngine: "cartesia",
    pitch: 1.04,
    rate: 1.06,
    avatarEmoji: "⚡",
    accentColor: "#eab308",
    sampleQuoteAr: "إذا أردت أن تكتشف أسرار الكون الحقيقية، ففكر دوماً من منظور الطاقة والتردد والاهتزاز الكهرومغناطيسي.",
    tags: ["كهرباء", "طاقة", "مستقبل", "اختراعات"],
  },
  {
    id: "ibn-alhaytham",
    nameAr: "الحسن ابن الهيثم",
    nameEn: "Al-Hasan Ibn al-Haytham",
    category: "scientists",
    titleAr: "مؤسس علم البصريات والمنهج التجريبي",
    descriptionAr: "فصاحة عربية جزلة رنانة، هدوء المنهج الاستقرائي الصارم ومخارج حروف واضحة.",
    gender: "male",
    recommendedEngine: "gemini-tts",
    pitch: 0.94,
    rate: 0.90,
    avatarEmoji: "👁️",
    accentColor: "#10b981",
    sampleQuoteAr: "الحق مطلوب لذاته، والباحث عن الحقيقة لا يحسن الظن بما نقله السلف، بل يتعقب حججه بالبرهان والتجريب الصارم.",
    tags: ["بصريات", "منهج علمي", "فصاحة", "تراث"],
  },
  {
    id: "curie",
    nameAr: "ماري كوري",
    nameEn: "Marie Curie",
    category: "scientists",
    titleAr: "رائدة النشاط الإشعاعي والحائزة على نوبلين",
    descriptionAr: "نبرة هادئة، دقيقة وصادقة تنضح بالإصرار العلمي والشجاعة المعرفية.",
    gender: "female",
    recommendedEngine: "elevenlabs",
    pitch: 1.12,
    rate: 0.92,
    avatarEmoji: "☢️",
    accentColor: "#22c55e",
    sampleQuoteAr: "لا شيء في هذا الوجود يستحق أن نخشاه، بل كل ظاهرة في الطبيعة تستحق منا أن نفهمها بروية وعلم.",
    tags: ["إشعاع", "كيمياء", "نووي", "ملهم"],
  },
  {
    id: "feynman",
    nameAr: "ريتشارد فاينمان",
    nameEn: "Richard Feynman",
    category: "scientists",
    titleAr: "عبقري ميكانيكا الكم والتبسيط الفيزيائي",
    descriptionAr: "نبرة عفوية، مرحة ومتحمسة تبسط أعقد أسرار فيزياء الجسيمات بابتسامة آسرة.",
    gender: "male",
    recommendedEngine: "cartesia",
    pitch: 1.10,
    rate: 1.12,
    avatarEmoji: "🥁",
    accentColor: "#f97316",
    sampleQuoteAr: "إذا كنت تعتقد أنك تفهم ميكانيكا الكم، فأنت لا تفهم ميكانيكا الكم! لا يهم مدى جمال نظريتك، إن لم تطابق التجربة فهي خاطئة.",
    tags: ["كموم", "تبسيط", "عفوي", "مرح"],
  },

  // ==========================================
  // Category 2: أصوات المشاهير والرواد (Celebrities & Icons)
  // ==========================================
  {
    id: "morgan-freeman",
    nameAr: "مورغان فريمان",
    nameEn: "Morgan Freeman",
    category: "celebrities",
    titleAr: "الصوت الأسطوري العالمي الرخيم",
    descriptionAr: "باريتون دافئ، عميق، موثوق ومفعم بالهيبة؛ يعطي لكل كلمة وزناً تاريخياً وكونياً.",
    gender: "male",
    recommendedEngine: "elevenlabs",
    pitch: 0.76,
    rate: 0.86,
    avatarEmoji: "🎙️",
    accentColor: "#d97706",
    sampleQuoteAr: "نحن هنا، نتأمل في هذا الامتداد الكوني اللانهائي، باحثين عن قبس من الحقيقة في رحلتنا الطويلة عبر الزمن.",
    tags: ["أسطوري", "باريتون", "عميق", "هيبة"],
  },
  {
    id: "david-attenborough",
    nameAr: "ديفيد أتينبورو",
    nameEn: "David Attenborough",
    category: "celebrities",
    titleAr: "صوت كوكب الأرض وعجائب الطبيعة",
    descriptionAr: "نبرة وثائقية هامسة، دافئة ومشوقة، تحبس الأنفاس إجلالاً لروائع الحياة البرية والكون.",
    gender: "male",
    recommendedEngine: "elevenlabs",
    pitch: 1.00,
    rate: 0.84,
    avatarEmoji: "🌿",
    accentColor: "#059669",
    sampleQuoteAr: "هنا، في هذه البقعة الساحرة من كوكبنا، تتجلى واحدة من أروع قصص التناغم والصمود التي عرفتها الحياة البرية.",
    tags: ["طبيعة", "وثائقي", "مشوق", "دافئ"],
  },
  {
    id: "neil-degrasse-tyson",
    nameAr: "نيل ديغراس تايسون",
    nameEn: "Neil deGrasse Tyson",
    category: "celebrities",
    titleAr: "صوت الشغف الكوني والفيزياء الفلكية",
    descriptionAr: "نبرة تعبيرية حماسية، إيقاعية وجذابة، تنقل سحر المجرات والانفجار العظيم للجميع.",
    gender: "male",
    recommendedEngine: "cartesia",
    pitch: 0.94,
    rate: 1.04,
    avatarEmoji: "🔭",
    accentColor: "#6366f1",
    sampleQuoteAr: "الذرات التي تؤلف أجسادنا صُنعت في قلوب النجوم المتفجرة.. نحن لسنا مجرد سكان في هذا الكون، بل الكون يعيش فينا!",
    tags: ["فلك", "حماسي", "نجوم", "كون"],
  },
  {
    id: "carl-sagan",
    nameAr: "كارل ساغان",
    nameEn: "Carl Sagan",
    category: "celebrities",
    titleAr: "فيلسوف النجوم وصاحب النقطة الزرقاء الباهتة",
    descriptionAr: "صوت شاعري رقيق ومؤثر، يفيض بالتأمل الروحي والعلمي في مكانة الإنسان بالكون.",
    gender: "male",
    recommendedEngine: "elevenlabs",
    pitch: 0.90,
    rate: 0.85,
    avatarEmoji: "🪐",
    accentColor: "#8b5cf6",
    sampleQuoteAr: "تأمل في هذه النقطة الزرقاء الباهتة.. ذلك هو موطننا، وذلك هو كل من تحبه وكل من سمعت عنه في تاريخ الوجود البشري.",
    tags: ["شاعري", "كوزموس", "سلام", "تأمل"],
  },
  {
    id: "steve-jobs",
    nameAr: "ستيف جوبز",
    nameEn: "Steve Jobs",
    category: "celebrities",
    titleAr: "رائد الابتكار وصانع الثورة الرقمية",
    descriptionAr: "نبرة مقنعة، ملهمة، مركزة وتخاطب المتمردين والشغوفين بإعادة تشكيل المستقبل.",
    gender: "male",
    recommendedEngine: "cartesia",
    pitch: 0.98,
    rate: 0.95,
    avatarEmoji: "💡",
    accentColor: "#64748b",
    sampleQuoteAr: "أولئك المجانين الذين يعتقدون أنهم قادرون على تغيير هذا العالم، هم وحدهم من يفعلون ذلك في نهاية المطاف.",
    tags: ["ابتكار", "إلهام", "ريادة", "ثورة"],
  },

  // ==========================================
  // Category 3: أصوات الأفلام الوثائقية والرواة (Documentary Narrators)
  // ==========================================
  {
    id: "doc-arabic-fusha",
    nameAr: "الراوي الوثائقي العربي (ناشيونال جيوغرافيك)",
    nameEn: "Arabic Documentary Master",
    category: "documentary",
    titleAr: "الصوت الوثائقي العربي الفخم والاستكشافي",
    descriptionAr: "فصاحة عربية ساحرة، نبرة استكشافية ملحمية ومخارج حروف واثقة تأسر الأسماع.",
    gender: "male",
    recommendedEngine: "gemini-tts",
    pitch: 0.85,
    rate: 0.88,
    avatarEmoji: "🌍",
    accentColor: "#f59e0b",
    sampleQuoteAr: "في هذا التحقيق الاستكشافي المثير، نغوص في أعماق الطبيعة وأسرار الحضارات الإنسانية التي حيرت عقول المؤرخين عبر العصور.",
    tags: ["وثائقي", "فصحى", "ملحمي", "فخم"],
  },
  {
    id: "epic-cinema-trailer",
    nameAr: "راوي السينما والإثارة الملحمي",
    nameEn: "Epic Cinema & Trailer Narrator",
    category: "documentary",
    titleAr: "صوت التشويق والمقاطع الدعائية السينمائية",
    descriptionAr: "صوت سينمائي جهوري فائق العمق (Movie Trailer Bass) يبعث على الرهبة والترقب.",
    gender: "male",
    recommendedEngine: "elevenlabs",
    pitch: 0.70,
    rate: 0.82,
    avatarEmoji: "🎬",
    accentColor: "#dc2626",
    sampleQuoteAr: "في عالم يلفه الغموض.. لم يتبق بين الحقيقة وسراديب الظلام إلا إرادة أولئك الذين أصروا على استكشاف المجهول.",
    tags: ["سينمائي", "تشويق", "دراما", "جهوري"],
  },
  {
    id: "cyber-ai-omega",
    nameAr: "صوت أوميغا السيبراني المستقبلي",
    nameEn: "Omega Cybernetic Synthesizer",
    category: "documentary",
    titleAr: "الصوت الرقمي الخوارزمي لنواة أوميغا",
    descriptionAr: "صوت رقمي نقي كالبلور، فائق الذكاء وسلس يعكس دقة التوليف العصبي والتوافق الإدراكي.",
    gender: "male",
    recommendedEngine: "cartesia",
    pitch: 1.05,
    rate: 1.00,
    avatarEmoji: "⚡",
    accentColor: "#06b6d4",
    sampleQuoteAr: "أهلاً بك، أنا أوميغا. تم تفعيل منظومة الاستدلال المعرفي والتحليل الطيفي للإجابة على تساؤلاتك بدقة متناهية.",
    tags: ["أوميغا", "سيبراني", "ذكاء فائق", "نقي"],
  },
  {
    id: "historical-chronicles",
    nameAr: "راوي الملاحم والتواريخ العتيقة",
    nameEn: "Ancient Historical Chronicler",
    category: "documentary",
    titleAr: "سرد المخطوطات والقرون الذهبية",
    descriptionAr: "سرد تراثي عريق ودافئ، يأخذ المستمع في رحلة بين صفحات المخطوطات وخبايا التاريخ.",
    gender: "male",
    recommendedEngine: "gemini-tts",
    pitch: 0.88,
    rate: 0.88,
    avatarEmoji: "📜",
    accentColor: "#b45309",
    sampleQuoteAr: "تخبرنا المخطوطات الأثرية أنه في تلك الليالي من عام ستمائة واثنان، توقفت عجلة الزمن لتشهد ولادة أعظم اكتشاف إنساني.",
    tags: ["تاريخ", "تراث", "مخطوطات", "حكائي"],
  },
];

export const DEFAULT_OMEGA_VOICE_ID = "doc-arabic-fusha";

/**
 * Text cleaner: Strips markdown, code blocks, LaTeX notations, URLs, and asterisks
 * so speech synthesis pronounces human words gracefully without reading syntax artifacts.
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // Remove code blocks entirely (```...```)
  text = text.replace(/```[\s\S]*?```/g, " [شفرة برمجية] ");

  // Remove inline code (`...`)
  text = text.replace(/`([^`]+)`/g, "$1");

  // Remove markdown images and links: ![alt](url) -> alt, [text](url) -> text
  text = text.replace(/!\[(.*?)\]\(.*?\)/g, "$1");
  text = text.replace(/\[(.*?)\]\(.*?\)/g, "$1");

  // Remove raw URLs
  text = text.replace(/https?:\/\/\S+/g, "");

  // Remove math blocks: $$...$$ or $...$
  text = text.replace(/\$\$[\s\S]*?\$\$/g, " [معادلة رياضية] ");
  text = text.replace(/\$([^\$]+)\$/g, "$1");

  // Remove markdown headers (#, ##, ###)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Remove markdown bold/italics
  text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1");

  // Remove blockquotes (> ...)
  text = text.replace(/^>\s+/gm, "");

  // Remove horizontal rules (--- or ***)
  text = text.replace(/^[-*_]{3,}\s*$/gm, "");

  // Remove bullet points and numbering markers (e.g. "1. ", "* ", "- ")
  text = text.replace(/^(\s*[-*+]\s+|\s*\d+\.\s+)/gm, "");

  // Normalize multiple newlines and spaces
  text = text.replace(/\n+/g, "، ");
  text = text.replace(/\s{2,}/g, " ");

  return text.trim();
}

/**
 * Active Speech Controller State
 */
interface SpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string;
  currentPersonaId: string;
  progress: number; // 0 to 1
  onStateChange?: (state: { isPlaying: boolean; isPaused: boolean; currentPersonaId: string; currentText: string }) => void;
}

const state: SpeechState = {
  isPlaying: false,
  isPaused: false,
  currentText: "",
  currentPersonaId: DEFAULT_OMEGA_VOICE_ID,
  progress: 0,
};

let activeUtteranceChunks: string[] = [];
let activeChunkIndex = 0;
let stateListeners: Array<(s: { isPlaying: boolean; isPaused: boolean; currentPersonaId: string; currentText: string }) => void> = [];

export function subscribeSpeechState(listener: (s: { isPlaying: boolean; isPaused: boolean; currentPersonaId: string; currentText: string }) => void) {
  stateListeners.push(listener);
  listener({
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    currentPersonaId: state.currentPersonaId,
    currentText: state.currentText,
  });
  return () => {
    stateListeners = stateListeners.filter((l) => l !== listener);
  };
}

function notifyStateListeners() {
  const current = {
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    currentPersonaId: state.currentPersonaId,
    currentText: state.currentText,
  };
  stateListeners.forEach((l) => l(current));
}

/**
 * Plays a subtle, elegant Web Audio API acoustic signature tone
 * that characterizes each persona (e.g. Newton's 432Hz Cambridge tuning fork chime)
 */
function playPersonaAcousticTone(personaId: string) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (personaId === "newton") {
      // Newton: 432Hz Cambridge Royal Society Harmonic Tuning Chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(432, now);
      osc.frequency.exponentialRampToValueAtTime(216, now + 0.35);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    } else if (personaId === "professor-omega") {
      // Professor Omega: Warm Antique Grandfather Pendulum & Vintage Cello Resonance (A3 to E3 warm wood decay)
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(164.81, now + 0.25);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    } else if (personaId === "einstein") {
      // Einstein: Warm Cosmic Interval
      osc.type = "sine";
      osc.frequency.setValueAtTime(528, now);
      osc.frequency.exponentialRampToValueAtTime(264, now + 0.4);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    } else if (personaId === "tesla") {
      // Tesla: Electromagnetic Ping
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    } else if (personaId === "curie") {
      // Curie: Pure Crystal Sine
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.3);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    } else {
      // Documentary / Default: Soft Low Resonant Chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(165, now + 0.3);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);

    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 500);
  } catch {
    // AudioContext autoplay restrictions are handled gracefully
  }
}

/**
 * Intelligent voice selector that distinguishes Newton, Einstein, Curie, etc.
 * Even on platforms with limited voices, it scores and ranks distinct voices.
 */
function findVoiceForPersona(
  persona: VoicePersona,
  voices: SpeechSynthesisVoice[],
  isArabicText: boolean,
  langPref?: "ar" | "en"
): { voice: SpeechSynthesisVoice | undefined; targetLang: string; pitchMod: number; rateMod: number } {
  if (voices.length === 0) {
    return { voice: undefined, targetLang: isArabicText ? "ar-SA" : "en-US", pitchMod: persona.pitch, rateMod: persona.rate };
  }

  const useEnglishVoice = langPref === "en" || (!isArabicText && langPref !== "ar");

  if (useEnglishVoice) {
    // English Voice Match
    let enVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
    if (enVoices.length === 0) enVoices = voices;

    if (persona.id === "professor-omega") {
      // Old man voice: prefer mature, elder, venerable male voice (e.g. Arthur, George, Guy, Daniel, Oliver)
      const oldManVoice =
        enVoices.find((v) =>
          /arthur|george|oliver|daniel|guy|charles|elder|grandpa|male/i.test(v.name)
        ) ||
        enVoices.find((v) => /en-gb/i.test(v.lang)) ||
        enVoices[0];

      return {
        voice: oldManVoice,
        targetLang: oldManVoice?.lang || "en-US",
        pitchMod: 0.70, // Old man deep, warm lower pitch
        rateMod: 0.86,  // Deliberate venerable pace
      };
    }

    if (persona.id === "newton") {
      // Prefer British / UK classical male voice for Sir Isaac Newton
      const ukMale = enVoices.find((v) =>
        /uk|british|great britain|en-gb/i.test(v.lang + v.name) &&
        /george|daniel|oliver|arthur|male/i.test(v.name)
      ) || enVoices.find((v) => /en-gb/i.test(v.lang)) || enVoices.find((v) => /male|david/i.test(v.name));

      return {
        voice: ukMale || enVoices[0],
        targetLang: ukMale?.lang || "en-GB",
        pitchMod: 0.88,
        rateMod: 0.86,
      };
    }

    if (persona.gender === "female") {
      const female = enVoices.find((v) => /female|zira|samantha|victoria|karen|susan|fiona/i.test(v.name));
      return {
        voice: female || enVoices[0],
        targetLang: female?.lang || "en-US",
        pitchMod: Math.max(1.15, persona.pitch),
        rateMod: persona.rate,
      };
    }

    const male = enVoices.find((v) => /male|david|george|alex|daniel/i.test(v.name));
    return {
      voice: male || enVoices[0],
      targetLang: male?.lang || "en-US",
      pitchMod: persona.pitch,
      rateMod: persona.rate,
    };
  }

  // Arabic Voice Matching
  const arVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("ar"));

  if (arVoices.length === 0) {
    // Fallback if OS has no Arabic voice: return best available default voice
    return {
      voice: voices.find((v) => v.default) || voices[0],
      targetLang: "ar-SA",
      pitchMod: persona.pitch,
      rateMod: persona.rate,
    };
  }

  if (arVoices.length === 1) {
    // If only ONE Arabic voice is available on system, we apply pronounced pitch and rate shifts
    // to distinguish Professor Omega (elderly man), Newton (deep baritone), Curie (higher), etc.
    let pitchMod = persona.pitch;
    let rateMod = persona.rate;

    if (persona.id === "professor-omega") {
      pitchMod = 0.70; // Old man deep, warm, gravelly lower pitch
      rateMod = 0.86;  // Deliberate, scholarly elder cadence
    } else if (persona.id === "newton") {
      pitchMod = 0.78; // Deep academic baritone
      rateMod = 0.84;  // Deliberate, scholarly pace
    } else if (persona.id === "morgan-freeman") {
      pitchMod = 0.68; // Very deep resonance
      rateMod = 0.82;
    } else if (persona.gender === "female" || persona.id === "curie") {
      pitchMod = 1.25; // Higher pitch
      rateMod = 0.95;
    } else if (persona.id === "tesla") {
      pitchMod = 1.08;
      rateMod = 1.10; // Faster electric tempo
    } else if (persona.id === "einstein") {
      pitchMod = 0.88;
      rateMod = 0.88;
    }

    return { voice: arVoices[0], targetLang: arVoices[0].lang || "ar-SA", pitchMod, rateMod };
  }

  // Multiple Arabic voices exist! Distribute them to specific personas!
  if (persona.id === "professor-omega") {
    // Old man voice: prioritize mature, deep, authoritative adult male voice
    const elderArVoice =
      arVoices.find((v) => /tarik|naayf|maged|hamed|male|adult|standard-b|wavenet-b|wavenet-d/i.test(v.name)) ||
      arVoices[0];
    return {
      voice: elderArVoice,
      targetLang: elderArVoice.lang || "ar-SA",
      pitchMod: 0.70, // Old man lower frequency
      rateMod: 0.86,  // Deliberate venerable pace
    };
  }
  if (persona.gender === "female" || persona.id === "curie") {
    const femaleVoice = arVoices.find((v) => /female|laila|zeina|salma|hoda|mariam|fatima|zira/i.test(v.name));
    return {
      voice: femaleVoice || arVoices[arVoices.length - 1],
      targetLang: femaleVoice?.lang || "ar-SA",
      pitchMod: 1.2,
      rateMod: 0.95,
    };
  }

  if (persona.id === "newton") {
    // Deepest Male voice for Sir Isaac Newton
    const newtonVoice =
      arVoices.find((v) => /tarik|naayf|maged|hamed|male|standard-b|wavenet-b/i.test(v.name)) ||
      arVoices[0];
    return {
      voice: newtonVoice,
      targetLang: newtonVoice.lang || "ar-SA",
      pitchMod: 0.80,
      rateMod: 0.84,
    };
  }

  if (persona.id === "morgan-freeman") {
    const deepVoice =
      arVoices.find((v) => /naayf|tarik|standard-b/i.test(v.name)) ||
      arVoices[0];
    return {
      voice: deepVoice,
      targetLang: deepVoice.lang || "ar-SA",
      pitchMod: 0.70,
      rateMod: 0.80,
    };
  }

  // Default distribution
  const idx = Math.abs(persona.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % arVoices.length;
  return {
    voice: arVoices[idx] || arVoices[0],
    targetLang: arVoices[idx]?.lang || "ar-SA",
    pitchMod: persona.pitch,
    rateMod: persona.rate,
  };
}

/**
 * Splits long text into natural punctuation-delimited phrases
 * to prevent browser TTS 15-second cutoff and improve natural cadence.
 */
function splitIntoSentences(text: string, maxChunkLength = 160): string[] {
  // Split on periods, exclamation marks, question marks, commas, semicolons, Arabic punctuation (؟ ، ؛)
  const regex = /([^.!?؛؟،\n]+[.!?؛؟،\n]+)/g;
  const rawParts = text.match(regex) || [text];
  const chunks: string[] = [];

  let current = "";
  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if ((current + " " + trimmed).length > maxChunkLength) {
      if (current) chunks.push(current.trim());
      current = trimmed;
    } else {
      current = current ? current + " " + trimmed : trimmed;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Speaks the given text using the designated Voice Persona and Web Speech API.
 */
export function speakWithOmega(
  textToSpeak: string,
  options?: {
    personaId?: string;
    rate?: number;
    rateMultiplier?: number;
    pitch?: number;
    pitchMultiplier?: number;
    customPitch?: number;
    customVoiceName?: string;
    langPref?: "ar" | "en";
    playAcousticIntro?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("[Omega Speech]: Speech Synthesis not supported in this browser environment.");
    options?.onError?.(new Error("Speech Synthesis not supported"));
    return;
  }

  // Cancel any ongoing speech first
  stopSpeaking();

  const cleaned = cleanTextForSpeech(textToSpeak);
  if (!cleaned) {
    options?.onEnd?.();
    return;
  }

  const personaId = options?.personaId || state.currentPersonaId || DEFAULT_OMEGA_VOICE_ID;
  const persona =
    OMEGA_VOICE_PERSONAS.find((p) => p.id === personaId) ||
    OMEGA_VOICE_PERSONAS[0];

  // Optional subtle acoustic persona signature tone
  if (options?.playAcousticIntro !== false) {
    playPersonaAcousticTone(personaId);
  }

  activeUtteranceChunks = splitIntoSentences(cleaned);
  activeChunkIndex = 0;

  state.isPlaying = true;
  state.isPaused = false;
  state.currentText = cleaned;
  state.currentPersonaId = personaId;
  notifyStateListeners();
  options?.onStart?.();

  const voices = window.speechSynthesis.getVoices();
  const isArabic = /[\u0600-\u06FF]/.test(cleaned);

  const { voice: detectedVoice, targetLang, pitchMod, rateMod } = findVoiceForPersona(
    persona,
    voices,
    isArabic,
    options?.langPref
  );

  const customVoice = options?.customVoiceName
    ? voices.find((v) => v.name === options.customVoiceName)
    : undefined;
  const selectedVoice = customVoice || detectedVoice;

  const rateMult = options?.rateMultiplier ?? options?.rate ?? 1.0;
  const targetRate = Math.max(0.55, Math.min(1.8, rateMod * rateMult));
  
  const pitchMult = options?.pitchMultiplier ?? 1.0;
  const basePitch = options?.customPitch ?? options?.pitch ?? pitchMod;
  const targetPitch = Math.max(0.40, Math.min(1.8, basePitch * pitchMult));

  function playNextChunk() {
    if (!state.isPlaying) return;

    if (activeChunkIndex >= activeUtteranceChunks.length) {
      state.isPlaying = false;
      state.isPaused = false;
      notifyStateListeners();
      options?.onEnd?.();
      return;
    }

    const chunk = activeUtteranceChunks[activeChunkIndex];
    activeChunkIndex++;

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = targetRate;
    utterance.pitch = targetPitch;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = targetLang;

    utterance.onend = () => {
      playNextChunk();
    };

    utterance.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") {
        console.warn("[Omega Speech Chunk Error]:", e.error);
      }
      if (activeChunkIndex < activeUtteranceChunks.length) {
        playNextChunk();
      } else {
        state.isPlaying = false;
        notifyStateListeners();
        options?.onEnd?.();
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  // If voices aren't loaded yet in Chrome, wait for voiceschanged
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      playNextChunk();
    };
  } else {
    playNextChunk();
  }
}

/**
 * Stop any current speech playback.
 */
export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  state.isPlaying = false;
  state.isPaused = false;
  activeUtteranceChunks = [];
  activeChunkIndex = 0;
  notifyStateListeners();
}

/**
 * Pause speech playback.
 */
export function pauseSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.pause();
  }
  state.isPaused = true;
  notifyStateListeners();
}

/**
 * Resume speech playback.
 */
export function resumeSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.resume();
  }
  state.isPaused = false;
  notifyStateListeners();
}

/**
 * Checks if speech is currently active.
 */
export function isSpeaking(): boolean {
  return state.isPlaying && !state.isPaused;
}
