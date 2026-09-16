/**
 * src/lib/omega/models.ts
 * Model catalog and provider configuration definitions for Omega V2/V2.5.
 */

export type ModelId =
  | "gemini-3.8-flash"
  | "gemini-3.1-pro-preview"
  | "deepseek-r1-compat"
  | "claude-3-5-sonnet-compat"
  | "gpt-4o-compat"
  | "llama-3-3-compat"
  | "qwen-2-5-compat"
  | "omega-kernel-c1"
  | "omega-kernel-c2";

export interface ProviderKeys {
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  openrouterApiKey?: string;
  groqApiKey?: string;
  dashscopeApiKey?: string;
  deepseekApiKey?: string;
  ollamaBaseUrl?: string;
}

export interface ModelSpec {
  id: ModelId;
  name: string;
  family: "Google Gemini" | "DeepSeek" | "Anthropic" | "OpenAI" | "Meta" | "Alibaba" | "Omega Core";
  tier: "flagship" | "reasoning" | "speed" | "kernel";
  description: string;
  serverType: "direct" | "bridged" | "kernel";
  avatarColor: string;
  accentHex: string;
  contextWindow: string;
  defaultTemp: number;
}

export const OMEGA_MODELS: Record<ModelId, ModelSpec> = {
  "gemini-3.8-flash": {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    family: "Google Gemini",
    tier: "speed",
    description: "نموذج فائق السرعة والكفاءة للمهام العامة والتحليل السريع",
    serverType: "direct",
    avatarColor: "bg-amber-500",
    accentHex: "#f59e0b",
    contextWindow: "1M tokens",
    defaultTemp: 0.3,
  },
  "gemini-3.1-pro-preview": {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    family: "Google Gemini",
    tier: "flagship",
    description: "محرك الاستدلال العميق للبرمجة المتقدمة وحل المعضلات المنطقية",
    serverType: "direct",
    avatarColor: "bg-blue-500",
    accentHex: "#3b82f6",
    contextWindow: "2M tokens",
    defaultTemp: 0.2,
  },
  "deepseek-r1-compat": {
    id: "deepseek-r1-compat",
    name: "DeepSeek R1 (Reasoning Server)",
    family: "DeepSeek",
    tier: "reasoning",
    description: "نمط سلاسل التفكير المنطقية والاستنباط الرياضي الصارم",
    serverType: "direct",
    avatarColor: "bg-cyan-500",
    accentHex: "#06b6d4",
    contextWindow: "64k tokens",
    defaultTemp: 0.4,
  },
  "claude-3-5-sonnet-compat": {
    id: "claude-3-5-sonnet-compat",
    name: "Claude 3.5 Sonnet (Synthesis Server)",
    family: "Anthropic",
    tier: "flagship",
    description: "صياغة فكرية راقية ودقة لغوية وبلاغية عالية",
    serverType: "direct",
    avatarColor: "bg-orange-500",
    accentHex: "#f97316",
    contextWindow: "200k tokens",
    defaultTemp: 0.3,
  },
  "gpt-4o-compat": {
    id: "gpt-4o-compat",
    name: "GPT-4o (Omni Server)",
    family: "OpenAI",
    tier: "flagship",
    description: "تغطية شاملة للحقائق والتفاصيل الموسوعية متعددة المجالات",
    serverType: "direct",
    avatarColor: "bg-emerald-500",
    accentHex: "#10b981",
    contextWindow: "128k tokens",
    defaultTemp: 0.4,
  },
  "llama-3-3-compat": {
    id: "llama-3-3-compat",
    name: "Llama 3.3 70B (Meta Open Engine)",
    family: "Meta",
    tier: "speed",
    description: "خادم معالجة حرة مباشرة ومفتوحة للأفكار والنصوص",
    serverType: "direct",
    avatarColor: "bg-indigo-500",
    accentHex: "#6366f1",
    contextWindow: "128k tokens",
    defaultTemp: 0.5,
  },
  "qwen-2-5-compat": {
    id: "qwen-2-5-compat",
    name: "Qwen 2.5 72B (Alibaba Compute Server)",
    family: "Alibaba",
    tier: "reasoning",
    description: "خادم متخصص في الخوارزميات والمعادلات الرياضية والشفرات البرمجية",
    serverType: "direct",
    avatarColor: "bg-violet-500",
    accentHex: "#8b5cf6",
    contextWindow: "128k tokens",
    defaultTemp: 0.3,
  },
  "omega-kernel-c1": {
    id: "omega-kernel-c1",
    name: "Omega Kernel α (Spectral Consensus)",
    family: "Omega Core",
    tier: "kernel",
    description: "نواة أوميغا الأولى لحساب مسقطات فضاء الحالة ومصفوفة اليقين",
    serverType: "kernel",
    avatarColor: "bg-purple-600",
    accentHex: "#9333ea",
    contextWindow: "Unlimited",
    defaultTemp: 0.2,
  },
  "omega-kernel-c2": {
    id: "omega-kernel-c2",
    name: "Omega Kernel β (Orthogonal Verifier)",
    family: "Omega Core",
    tier: "kernel",
    description: "نواة أوميغا الثانية للتدقيق المتعامد ورصد التناقضات الداخلية",
    serverType: "kernel",
    avatarColor: "bg-rose-600",
    accentHex: "#e11d48",
    contextWindow: "Unlimited",
    defaultTemp: 0.2,
  },
};

export type VideoModelId =
  | "veo-google"
  | "runway-gen4"
  | "kling-ai"
  | "luma-dream-machine"
  | "pika"
  | "pixverse-ai"
  | "wan-2-2-alibaba"
  | "hunyuan-video-tencent"
  | "cogvideox";

export interface VideoModelSpec {
  id: VideoModelId;
  name: string;
  company: string;
  tagline: string;
  badge: string;
  accentColor: string;
  resolution: string;
  fps: number;
  physicsRating: string;
  description: string;
  strengths: string[];
}

export const OMEGA_VIDEO_MODELS: Record<VideoModelId, VideoModelSpec> = {
  "veo-google": {
    id: "veo-google",
    name: "Veo (Google)",
    company: "Google DeepMind",
    tagline: "من أقوى مولدات الفيديو الواقعية",
    badge: "واقعية سينمائية فائقة 4K",
    accentColor: "#3b82f6",
    resolution: "1080p / 4K Ultra HD",
    fps: 60,
    physicsRating: "9.9/10",
    description: "من أقوى مولدات الفيديو الواقعية عالمياً، يتميز بفهم استثنائي للفيزياء البصرية وحركة الضوء والعدسات السينمائية.",
    strengths: ["دقة واقعية تحاكي الكاميرات الاحترافية", "فهم عميق للضوء والانعكاسات", "حركات كاميرا انسيابية"],
  },
  "runway-gen4": {
    id: "runway-gen4",
    name: "Runway Gen-4",
    company: "Runway",
    tagline: "ممتاز لتحويل النص أو الصور إلى فيديو",
    badge: "تحويل النص والصور إلى فيديو",
    accentColor: "#8b5cf6",
    resolution: "4K Cinematic",
    fps: 30,
    physicsRating: "9.7/10",
    description: "ممتاز لتحويل النص أو الصور إلى فيديو بتحكم إخراجي دقيق وسيطرة كاملة على الكاميرا وتتابع المشاهد.",
    strengths: ["تحويل فائق الدقة من صورة إلى فيديو (Image-to-Video)", "تحكم بزوايا الكاميرا ومسار الحركة", "توليد مشاهد متسلسلة بدقة"],
  },
  "kling-ai": {
    id: "kling-ai",
    name: "Kling AI",
    company: "Kuaishou Technology",
    tagline: "جودة حركة واقعية ومحاكاة فيزيائية دقيقة للشخصيات",
    badge: "محاكاة فيزياء سينمائية متقدمة",
    accentColor: "#ec4899",
    resolution: "1080p / 4K UHD",
    fps: 30,
    physicsRating: "9.8/10",
    description: "نموذج رائد في المحاكاة الفيزيائية لحركة الأجسام المعقدة والملامح البشرية ومطابقة قوانين الحركة الكلاسيكية.",
    strengths: ["محاكاة فائقة للفيزياء الحركية", "توليد مقاطع طويلة حتى دقيقتين", "استقرار عالي في تفاصيل الشخصيات والوجوه"],
  },
  "luma-dream-machine": {
    id: "luma-dream-machine",
    name: "Luma AI Dream Machine",
    company: "Luma AI",
    tagline: "سريع وجودة عالية",
    badge: "توليد سريع وفيزياء متناسقة",
    accentColor: "#06b6d4",
    resolution: "High-FPS Dynamic",
    fps: 60,
    physicsRating: "9.6/10",
    description: "سريع وجودة عالية مع انسيابية ملحوظة في حركة الأجسام وسرعة استجابة مذهلة لمعالجة الحركة السريعة.",
    strengths: ["سرعة توليد قياسية", "اتساق حركي عالي جداً للمشاهد الديناميكية", "محاكاة واقعية للأجسام سريعة الحركة"],
  },
  "pika": {
    id: "pika",
    name: "Pika",
    company: "Pika Labs",
    tagline: "مناسب للفيديوهات القصيرة والرسوم",
    badge: "رسوم متحركة ومؤثرات",
    accentColor: "#f43f5e",
    resolution: "Full HD Animated",
    fps: 30,
    physicsRating: "9.3/10",
    description: "مناسب للفيديوهات القصيرة والرسوم والتأثيرات الخيالية المبتكرة وتعديل أجزاء المشهد بدقة عالية.",
    strengths: ["إبداع استثنائي في عوالم الرسوم والأنمي", "تأثيرات بصرية متغيرة (Visual Effects)", "مناسب لمحتوى السوشيال ميديا القصير"],
  },
  "pixverse-ai": {
    id: "pixverse-ai",
    name: "PixVerse AI",
    company: "PixVerse",
    tagline: "جيد للمشاهد السينمائية",
    badge: "إخراج سينمائي وعدسات",
    accentColor: "#10b981",
    resolution: "4K Cinematic Widescreen",
    fps: 30,
    physicsRating: "9.5/10",
    description: "جيد للمشاهد السينمائية وضبط عمق الميدان والعدسات الدرامية وإضاءة المشاهد الطبيعية والحضرية.",
    strengths: ["زوايا سينمائية احترافية", "تحكم عالي في حركة العدسة والتركيز", "ألوان وإضاءة درامية"],
  },
  "wan-2-2-alibaba": {
    id: "wan-2-2-alibaba",
    name: "Wan 2.2 (Alibaba)",
    company: "Alibaba Cloud",
    tagline: "نموذج مفتوح يمكن تشغيله محليًا إذا كانت لديك عتاد قوي",
    badge: "مفتوح المصدر وتشغيل محلي",
    accentColor: "#f59e0b",
    resolution: "Up to 1080p Multi-Frame",
    fps: 30,
    physicsRating: "9.6/10",
    description: "نموذج مفتوح يمكن تشغيله محليًا إذا كانت لديك عتاد قوي، من أقوى النماذج المفتوحة عالمياً في دقة التفاصيل الحركية والنصوص.",
    strengths: ["أوزان مفتوحة قابلة للنشر والتشغيل المحلي", "أداء فائق على بطاقات الرسوميات القوية", "توليد نص وصورة إلى فيديو بكفاءة"],
  },
  "hunyuan-video-tencent": {
    id: "hunyuan-video-tencent",
    name: "HunyuanVideo (Tencent)",
    company: "Tencent",
    tagline: "نموذج سينمائي مفتوح وفائق الدقة بدعم دقة عالية وحركة سلسة",
    badge: "استقرار سينمائي فائق مفتوح",
    accentColor: "#0284c7",
    resolution: "Cinema 4K High-Res",
    fps: 60,
    physicsRating: "9.8/10",
    description: "نموذج سينمائي مفتوح وفائق الدقة من Tencent، يوفر استقراراً فيزيائياً فائقاً للمشاهد الطويلة وجودة بصرية تتفوق في حركة الكاميرا المتعددة.",
    strengths: ["معمارية ترانسفورمر هجينة فائقة الدقة", "استقرار بصري ممتد عبر الإطارات", "مرونة عالية في تمثيل المشاهد المعقدة"],
  },
  "cogvideox": {
    id: "cogvideox",
    name: "CogVideoX (THUDM)",
    company: "Zhipu AI & THUDM",
    tagline: "نموذج مفتوح المصدر متخصص في التحويل النصي البصري المكثف",
    badge: "مفتوح المصدر 3D VAE",
    accentColor: "#6366f1",
    resolution: "1080p Transformer Native",
    fps: 30,
    physicsRating: "9.5/10",
    description: "نموذج مفتوح المصدر بمعمارية Expert Transformer و3D VAE يوفر استمرارية مكانية وزمانية استثنائية.",
    strengths: ["أوزان مفتوحة ومجانية بالكامل", "ترميز زماني مكاني 3D VAE متقدم", "دقة في نمذجة الحركة المعقدة"],
  },
};

// ==========================================
// SCIENTIFIC VIDEO PRODUCTION PIPELINE TYPES
// ==========================================

export type PipelineStage =
  | "scriptwriting"
  | "image_generation"
  | "video_generation"
  | "portrait_animation"
  | "lip_sync"
  | "voice_synthesis"
  | "sfx_composition"
  | "video_editing";

export interface PipelineTool {
  id: string;
  name: string;
  provider: string;
  stage: PipelineStage;
  tagline: string;
  isOpenSource: boolean;
  isFlagship: boolean;
  recommendedFor: string;
}

export const SCIENTIFIC_PIPELINE_TOOLS: Record<string, PipelineTool> = {
  // 1. Scriptwriting
  "gpt-5": {
    id: "gpt-5",
    name: "GPT-5 / GPT-4o",
    provider: "OpenAI",
    stage: "scriptwriting",
    tagline: "صياغة سيناريوهات علمية موسوعية ومحاور حوارية درامية متقنة",
    isOpenSource: false,
    isFlagship: true,
    recommendedFor: "السيناريوهات التاريخية المركبة وسرد المفاهيم المعقدة",
  },
  "claude-3-5": {
    id: "claude-3-5",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    stage: "scriptwriting",
    tagline: "صياغة لغوية وفلسفية رفيعة ودقة في السرد الأكاديمي",
    isOpenSource: false,
    isFlagship: true,
    recommendedFor: "الشرح الإنساني والتأملي للعلماء وتاريخ العلوم",
  },
  "gemini-3": {
    id: "gemini-3",
    name: "Google Gemini 3.8 / 3.1",
    provider: "Google DeepMind",
    stage: "scriptwriting",
    tagline: "دقة علمية فائقة، سرعة استدلال، وربط متعدد الأنماط",
    isOpenSource: false,
    isFlagship: true,
    recommendedFor: "المعادلات الرياضية والفيزيائية الدقيقة وتاريخ الاكتشافات",
  },
  "qwen-2-5": {
    id: "qwen-2-5",
    name: "Qwen 2.5 (Alibaba)",
    provider: "Alibaba Cloud (Open Weights)",
    stage: "scriptwriting",
    tagline: "أقوى نموذج مفتوح في الرياضيات، العلوم، والترميز العلمي",
    isOpenSource: true,
    isFlagship: false,
    recommendedFor: "خطوط الإنتاج المفتوحة كلياً والمعالجة المحلية",
  },

  // 2. Image Generation
  "flux-1": {
    id: "flux-1",
    name: "FLUX.1 (Black Forest Labs)",
    provider: "Black Forest Labs",
    stage: "image_generation",
    tagline: "المعيار الذهبي لتوليد البورتريهات التاريخية بدقة تشريحية وواقعية خيالية",
    isOpenSource: true,
    isFlagship: true,
    recommendedFor: "توليد صورة الشخصية (نيوتن، أينشتاين...) وأدوات المختبر القديمة",
  },
  "sdxl": {
    id: "sdxl",
    name: "Stable Diffusion XL",
    provider: "Stability AI",
    stage: "image_generation",
    tagline: "نموذج مفتوح المصدر مع دعم واسع للـ LoRAs والتحكم الدقيق",
    isOpenSource: true,
    isFlagship: false,
    recommendedFor: "التشغيل المحلي وتخصيص الأزياء والبيئات التاريخية",
  },
  "imagen-3": {
    id: "imagen-3",
    name: "Google Imagen 3",
    provider: "Google DeepMind",
    stage: "image_generation",
    tagline: "إضاءة فوتوغرافية وتفاصيل مجهرية فائقة الدقة",
    isOpenSource: false,
    isFlagship: true,
    recommendedFor: "الإضاءة السينمائية للمختبرات والتجارب الفيزيائية",
  },
  "recraft": {
    id: "recraft",
    name: "Recraft V3",
    provider: "Recraft AI",
    stage: "image_generation",
    tagline: "توليد تصاميم متجهة ومخططات هندسية علمية واضحة",
    isOpenSource: false,
    isFlagship: false,
    recommendedFor: "المخططات التوضيحية والرسوم التخطيطية للأجهزة",
  },

  // 3. Video Generation
  "veo": {
    id: "veo",
    name: "Veo (Google DeepMind)",
    provider: "Google DeepMind",
    stage: "video_generation",
    tagline: "من أقوى مولدات الفيديو الواقعية 4K مع إدراك فيزيائي عميق",
    isOpenSource: false,
    isFlagship: true,
    recommendedFor: "أعلى جودة واقعية لمشاهد المختبر وسقوط الأجسام وحركة الكواكب",
  },
  "runway-gen4": {
    id: "runway-gen4",
    name: "Runway Gen-4",
    provider: "Runway",
    stage: "video_generation",
    tagline: "تحويل النص والصور إلى فيديو سينمائي بتحكم كاميرا دقيق",
    isOpenSource: false,
    isFlagship: true,
    recommendedFor: "حركات الكاميرا المعقدة والانتقال بين زوايا الشرح",
  },
  "kling-ai": {
    id: "kling-ai",
    name: "Kling AI",
    provider: "Kuaishou Technology",
    stage: "video_generation",
    tagline: "محاكاة واقعية لحركة الشخصيات والتفاعل مع الأدوات العلمية",
    isOpenSource: false,
    isFlagship: true,
    recommendedFor: "تفاعل نيوتن مع التفاحة أو كتابة أينشتاين على السبورة",
  },
  "luma-dream": {
    id: "luma-dream",
    name: "Luma AI Dream Machine",
    provider: "Luma AI",
    stage: "video_generation",
    tagline: "سرعة توليد عالية وحركات كاميرا انسيابية وسلسة",
    isOpenSource: false,
    isFlagship: true,
    recommendedFor: "المشاهد التفاعلية السريعة وتدفق الظواهر الطبيعية",
  },
  "wan-2-2": {
    id: "wan-2-2",
    name: "Wan 2.2 (Alibaba)",
    provider: "Alibaba Cloud",
    stage: "video_generation",
    tagline: "أقوى نموذج فيديو مفتوح المصدر يمكن تشغيله محلياً",
    isOpenSource: true,
    isFlagship: false,
    recommendedFor: "الإنتاج العلمي المحلي ومفتوح المصدر بالكامل",
  },
  "hunyuan-video": {
    id: "hunyuan-video",
    name: "HunyuanVideo (Tencent)",
    provider: "Tencent",
    stage: "video_generation",
    tagline: "نموذج فيديو مفتوح المصدر بدقة عالية وثبات بصري طويل المدى",
    isOpenSource: true,
    isFlagship: false,
    recommendedFor: "المشاهد السينمائية الطويلة دون تشوه في الهندسة",
  },
  "cogvideox": {
    id: "cogvideox",
    name: "CogVideoX (THUDM)",
    provider: "Zhipu AI & THUDM",
    stage: "video_generation",
    tagline: "نموذج مفتوح المصدر بمعمارية Expert Transformer",
    isOpenSource: true,
    isFlagship: false,
    recommendedFor: "خطوط الإنتاج المفتوحة خفيفة الوزن على كروت RTX",
  },
  "pika": {
    id: "pika",
    name: "Pika Labs",
    provider: "Pika",
    stage: "video_generation",
    tagline: "رسوم متحركة وتأثيرات بصرية حيوية ومبتكرة",
    isOpenSource: false,
    isFlagship: false,
    recommendedFor: "التبسيط الكرتوني للظواهر المعقدة لجمهور المدارس",
  },

  // 4. Portrait & Character Animation
  "liveportrait": {
    id: "liveportrait",
    name: "LivePortrait (Kuaishou)",
    provider: "Kuaishou AI (Open Source)",
    stage: "portrait_animation",
    tagline: "تحريك دقيق لمفاصل الوجه، رمش العين، ونظرات الحماس العلمي بدقة 512D",
    isOpenSource: true,
    isFlagship: true,
    recommendedFor: "نقل تعبيرات الاندهاش والتفكير العميق لوجه نيوتن وأينشتاين",
  },
  "hallo": {
    id: "hallo",
    name: "Hallo (Fudan University)",
    provider: "Fudan University (Open Source)",
    stage: "portrait_animation",
    tagline: "تحريك متزامن صوتياً وهرمياً للرأس والكتفين والملامح الدقيقة",
    isOpenSource: true,
    isFlagship: false,
    recommendedFor: "حركات الرأس الطبيعية أثناء إلقاء المحاضرات العلمية",
  },
  "sadtalker": {
    id: "sadtalker",
    name: "SadTalker",
    provider: "Open Source Community",
    stage: "portrait_animation",
    tagline: "تحريك رؤوس الشخصيات ثلاثي الأبعاد من صورة واحدة",
    isOpenSource: true,
    isFlagship: false,
    recommendedFor: "التشغيل السريع والخفيف للصور التاريخية الثابتة",
  },

  // 5. Lip Sync
  "musetalk": {
    id: "musetalk",
    name: "MuseTalk (Tencent Music)",
    provider: "Tencent (Open Source)",
    stage: "lip_sync",
    tagline: "مزامنة شفاه فورية بسرعة تتجاوز 30 FPS بدقة عالية وتطابق صوتي دقيق",
    isOpenSource: true,
    isFlagship: true,
    recommendedFor: "مزامنة الشفاه مفتوحة المصدر بالكامل مع اللغة العربية والإنجليزية",
  },
  "sync-labs": {
    id: "sync-labs",
    name: "Sync Labs (Sync.1)",
    provider: "Sync Labs",
    stage: "lip_sync",
    tagline: "أعلى جودة تجارية سينمائية لمزامنة الشفاه لأي لغة دون تشويه للوجه",
    isOpenSource: false,
    isFlagship: true,
    recommendedFor: "جودة هوليوود في تناغم مخارج الحروف مع حركة الفم",
  },

  // 6. Voice Synthesis
  "elevenlabs": {
    id: "elevenlabs",
    name: "ElevenLabs Voice AI",
    provider: "ElevenLabs",
    stage: "voice_synthesis",
    tagline: "محاكاة طبقات الصوت التاريخية الوقورة مع عمق تنفسي وانفعالي فائق",
    isOpenSource: false,
    isFlagship: true,
    recommendedFor: "صوت نيوتن الرصين، أينشتاين الهادئ، وتيسلا الحماسي",
  },
  "xtts-v2": {
    id: "xtts-v2",
    name: "XTTS v2 (Coqui)",
    provider: "Coqui / Open Source",
    stage: "voice_synthesis",
    tagline: "استنساخ صوتي مفتوح المصدر بـ 17 لغة مع الحفاظ على بصمة الصوت",
    isOpenSource: true,
    isFlagship: false,
    recommendedFor: "الإنتاج المحلي وحرية تعديل نبرة الصوت دون تكاليف API",
  },
  "kokoro-tts": {
    id: "kokoro-tts",
    name: "Kokoro TTS (82M)",
    provider: "Hexgrad (Open Source)",
    stage: "voice_synthesis",
    tagline: "نموذج صوتي مفتوح المصدر فائق الصغر والخفة بجودة تنافس النماذج الضخمة",
    isOpenSource: true,
    isFlagship: false,
    recommendedFor: "توليد فوري فائق السرعة على الأجهزة الشخصية",
  },
  "cartesia": {
    id: "cartesia",
    name: "Cartesia Sonic",
    provider: "Cartesia",
    stage: "voice_synthesis",
    tagline: "زمن استجابة فائق الصغر (Sub-100ms) مع نطق طبيعي شديد الواقعية",
    isOpenSource: false,
    isFlagship: true,
    recommendedFor: "التفاعل الصوتي الفوري والحي للشخصيات العلمية",
  },

  // 7. SFX & Video Editing
  "elevenlabs-sfx": {
    id: "elevenlabs-sfx",
    name: "ElevenLabs SFX & Foley",
    provider: "ElevenLabs",
    stage: "sfx_composition",
    tagline: "توليد مؤثرات صوتية فيزيائية للمختبر (تكات الساعة، سقوط التفاحة، الرعد)",
    isOpenSource: false,
    isFlagship: true,
    recommendedFor: "المؤثرات الصوتية البيئية المتزامنة مع الأحداث العلمية",
  },
  "stable-audio": {
    id: "stable-audio",
    name: "Stable Audio (Stability AI)",
    provider: "Stability AI",
    stage: "sfx_composition",
    tagline: "مؤثرات صوتية وخلفيات موسيقية أوركسترالية ملحمية للاكتشافات",
    isOpenSource: true,
    isFlagship: false,
    recommendedFor: "الموسيقى التصويرية التصاعدية مع لحظة 'وجدتها!'",
  },
  "ffmpeg": {
    id: "ffmpeg",
    name: "FFmpeg Video Pipeline Core",
    provider: "FFmpeg Project (Open Source)",
    stage: "video_editing",
    tagline: "المحرك العالمي لدمج المسارات الصوتية، الفيديو، الترميز، وإضافة شارة التوضيح",
    isOpenSource: true,
    isFlagship: true,
    recommendedFor: "المونتاج النهائي، مزج الصوت، وتثبيت شعار الشفافية الأكاديمية",
  },
  "remotion": {
    id: "remotion",
    name: "Remotion (Code-as-Video)",
    provider: "Remotion Dev",
    stage: "video_editing",
    tagline: "تركيب الرسوم المتحركة البرمجية، المعادلات الرياضية، والطبقات البصرية",
    isOpenSource: true,
    isFlagship: true,
    recommendedFor: "إبراز المعادلات الرياضية KaTeX المتحركة بجانب وجه العالم",
  },
};

export interface HistoricalScientist {
  id: string;
  nameAr: string;
  nameEn: string;
  era: string;
  specialtyAr: string;
  defaultTopicAr: string;
  keyEquation: string;
  quoteAr: string;
  avatarPrompt: string;
}

export const HISTORICAL_SCIENTISTS: HistoricalScientist[] = [
  {
    id: "newton",
    nameAr: "إسحاق نيوتن",
    nameEn: "Sir Isaac Newton",
    era: "1643 - 1727م",
    specialtyAr: "الميكانيكا الكلاسيكية، البصريات، والتفاضل والتكامل",
    defaultTopicAr: "شرح قانون الجاذبية الكونية وسقوط التفاحة والتفاضل والتكامل",
    keyEquation: "F = G \\frac{m_1 m_2}{r^2}",
    quoteAr: "إذا كنت قد رأيت أبعد من غيري، فذلك لأني وقفت على أكتاف العمالقة.",
    avatarPrompt: "Photorealistic portrait of Sir Isaac Newton in his 17th century Cambridge study, holding a glass prism, antique books, falling green apple on wooden desk, volumetric candlelight, 8k, ultra-detailed by FLUX.1.",
  },
  {
    id: "einstein",
    nameAr: "ألبرت أينشتاين",
    nameEn: "Albert Einstein",
    era: "1879 - 1955م",
    specialtyAr: "النسبية العامة والخاصة، التأثير الكهروضوئي، وفيزياء الكم",
    defaultTopicAr: "شرح النسبية العامة وكيف تنحني نسيج الزمكان بوجود الكتلة والطاقة",
    keyEquation: "G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}",
    quoteAr: "الخيال أكثر أهمية من المعرفة، فالمعرفة محدودة، في حين أن الخيال يطوق العالم بأسره.",
    avatarPrompt: "Photorealistic portrait of Albert Einstein standing in front of a blackboard covered in tensor equations and differential geometry, warm dramatic sunlight, highly detailed facial textures by FLUX.1.",
  },
  {
    id: "tesla",
    nameAr: "نيكولا تيسلا",
    nameEn: "Nikola Tesla",
    era: "1856 - 1943م",
    specialtyAr: "الكهرومغناطيسية، التيار المتردد (AC)، ونقل الطاقة اللاسلكي",
    defaultTopicAr: "شرح مبدأ عمل التيار المتردد والمجال المغناطيسي الدوار وموجات الراديو",
    keyEquation: "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}",
    quoteAr: "إذا أردت أن تجد أسرار الكون، ففكر في الطاقة والتردد والاهتزاز.",
    avatarPrompt: "Photorealistic cinematic portrait of Nikola Tesla in his Colorado Springs laboratory surrounded by luminous electrical arcs, holding a glowing wireless lightbulb, 8k resolution.",
  },
  {
    id: "curie",
    nameAr: "ماري كوري",
    nameEn: "Marie Curie",
    era: "1867 - 1934م",
    specialtyAr: "النشاط الإشعاعي، اكتشاف الراديوم والبولونيوم، والفيزياء النووية",
    defaultTopicAr: "شرح ظاهرة النشاط الإشعاعي التلقائي وتفكك النوى الذرية",
    keyEquation: "N(t) = N_0 e^{-\\lambda t}",
    quoteAr: "لا شيء في الحياة يستحق أن يُخشى، بل كل شيء يستحق أن يُفهم.",
    avatarPrompt: "Photorealistic historical portrait of Marie Curie in her Parisian laboratory, examining a glowing green-blue vial of radium, glass beakers, vintage scientific instruments, hyper-detailed.",
  },
  {
    id: "ibn-alhaytham",
    nameAr: "الحسن بن الهيثم",
    nameEn: "Al-Hasan Ibn al-Haytham",
    era: "965 - 1040م",
    specialtyAr: "علم البصريات (المناظر)، المنهج العلمي التجريبي، وتشريح العين",
    defaultTopicAr: "شرح كيفية انتقال أشعة الضوء وانعكاسها وانكسارها وتشريح آلية الرؤية بالعين",
    keyEquation: "n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)",
    quoteAr: "الحق مطلوب لذاته، وكل ما يطلب لذاته فليس يعنى بوجوده سوى وجوده.",
    avatarPrompt: "Photorealistic portrait of Muslim polymath Ibn al-Haytham in 11th-century Cairo, inside a dark camera obscura room studying a pinhole light beam illuminating optical lenses, detailed parchment.",
  },
  {
    id: "feynman",
    nameAr: "ريتشارد فاينمان",
    nameEn: "Richard Feynman",
    era: "1918 - 1988م",
    specialtyAr: "الكهروديناميكا الكمية (QED)، ومخططات فاينمان، وحوسبة الكم",
    defaultTopicAr: "شرح ميكانيكا الكم وتفاعل الجسيمات الأولية عبر مخططات فاينمان التفاعلية",
    keyEquation: "\\langle x_f, t_f | x_i, t_i \\rangle = \\int \\mathcal{D}[x(t)] e^{\\frac{i}{\\hbar} S[x]}",
    quoteAr: "إذا كنت تعتقد أنك تفهم ميكانيكا الكم، فأنت لا تفهم ميكانيكا الكم!",
    avatarPrompt: "Photorealistic portrait of young Richard Feynman gesturing enthusiastically at Caltech chalkboard drawn with Feynman diagrams, holding chalk, warm vibrant lighting.",
  },
];
