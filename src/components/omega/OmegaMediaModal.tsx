import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Film,
  Loader2,
  Wand2,
  Check,
  Video,
  Cpu,
  Atom,
  Workflow,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Radio,
  Download,
} from "lucide-react";
import {
  OMEGA_VIDEO_MODELS,
  HISTORICAL_SCIENTISTS,
  type VideoModelId,
  type HistoricalScientist,
} from "../../lib/omega/models";
import {
  OMEGA_VOICE_ENGINES,
  OMEGA_VOICE_PERSONAS,
  type VoicePersona,
  type VoiceCategory,
  speakWithOmega,
  stopSpeaking,
  subscribeSpeechState,
} from "../../lib/omega/speech";
import {
  synthesizeSpeechToWavBlob,
  triggerAudioFileDownload,
} from "../../lib/omega/audioExporter";

export interface OmegaMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate?: (data: {
    type: "image" | "video" | "pipeline" | "voice";
    prompt: string;
    aspectRatio?: string;
    style?: string;
    videoModel?: string;
    scientistId?: string;
    pipelineMode?: "flagship" | "open_source";
    tools?: Record<string, string>;
    originalUserPrompt?: string;
    voicePersonaId?: string;
    voiceEngineId?: string;
  }) => Promise<void> | void;
  onSubmit?: (data: {
    type: "image" | "video" | "pipeline" | "voice";
    prompt: string;
    aspectRatio?: string;
    style?: string;
    videoModel?: string;
    scientistId?: string;
    pipelineMode?: "flagship" | "open_source";
    tools?: Record<string, string>;
    originalUserPrompt?: string;
    voicePersonaId?: string;
    voiceEngineId?: string;
  }) => Promise<void> | void;
}

const PROMPT_SUGGESTIONS = [
  {
    type: "pipeline" as const,
    label: "إسحاق نيوتن: قانون الجاذبية والتفاحة والتفاضل",
    prompt: "نيوتن يشرح الجاذبية وسقوط التفاحة وحساب التفاضل والتكامل في باحة كامبريدج",
    scientistId: "newton",
  },
  {
    type: "pipeline" as const,
    label: "ألبرت أينشتاين: انحناء نسيج الزمكان وتكافؤ الكتلة والطاقة",
    prompt: "أينشتاين يشرح النسبية العامة وكيف تحني الكتلة نسيج الزمكان ومعادلة E=mc²",
    scientistId: "einstein",
  },
  {
    type: "pipeline" as const,
    label: "نيكولا تيسلا: التيار المتردد والمجالات الكهرومغناطيسية",
    prompt: "تيسلا يستعرض أسرار التيار المتردد والرنين الكهرومغناطيسي في مختبر كولورادو",
    scientistId: "tesla",
  },
  {
    type: "pipeline" as const,
    label: "الحسن ابن الهيثم: تشريح العين وانكسار الضوء والمنهج العلمي",
    prompt: "ابن الهيثم يشرح علم المناظر (البصريات) وانعكاس أشعة الضوء نحو العين",
    scientistId: "ibn_al_haytham",
  },
  {
    type: "pipeline" as const,
    label: "ماري كوري: النشاط الإشعاعي واكتشاف الراديوم",
    prompt: "ماري كوري تشرح فيزياء النشاط الإشعاعي وتفكك ذرات الراديوم والبولونيوم",
    scientistId: "curie",
  },
  {
    type: "pipeline" as const,
    label: "ريتشارد فاينمان: فيزياء الكم ومخططات الجسيمات الأولية",
    prompt: "فاينمان يبسط سلوك الفوتونات والإلكترونات ومخططات فاينمان وتراكب الحالات الكمية",
    scientistId: "feynman",
  },
  {
    type: "video" as const,
    label: "رحلة سينمائية في الفضاء الكوني (Veo / Runway)",
    prompt: "Cinematic cosmic journey traversing through a luminous spiral galaxy with interstellar dust clouds and glowing newborn stars, photorealistic camera sweep.",
  },
  {
    type: "video" as const,
    label: "حقل الطاقة الكمومي والوعي (Luma / Hunyuan)",
    prompt: "Dynamic visualization of quantum energy field oscillations and harmonious particle wave resonance in fluid motion.",
  },
  {
    type: "video" as const,
    label: "رسوم متحركة إبداعية خيالية (Pika / PixVerse)",
    prompt: "Vibrant fantasy animation of a glowing mythical creature gracefully soaring above an enchanted floating crystal citadel.",
  },
  {
    type: "image" as const,
    label: "لوحة فلسفية: شجرة المعرفة والوجود (FLUX.1)",
    prompt: "A profound surrealist oil painting depicting the tree of knowledge and existence, roots intertwining with ancient sacred geometry, luminous celestial light, 8k resolution, cinematic.",
  },
  {
    type: "image" as const,
    label: "صورة علمية: انحناء الزمكان وثقب أسود دوار",
    prompt: "Photorealistic visualization of spacetime curvature around a rotating black hole, gravitational lensing, quantum light emission, deep cosmic purple and cyan hues.",
  },
];

export const OmegaMediaModal: React.FC<OmegaMediaModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  onSubmit,
}) => {
  const [mediaType, setMediaType] = useState<"pipeline" | "voice" | "video" | "image">("pipeline");
  const [selectedScientistId, setSelectedScientistId] = useState<string>("newton");
  const [pipelineMode, setPipelineMode] = useState<"flagship" | "open_source">("open_source");
  const [selectedVoiceCategory, setSelectedVoiceCategory] = useState<VoiceCategory>("scientists");
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("newton");
  const [selectedVoiceEngineId, setSelectedVoiceEngineId] = useState<string>("elevenlabs");
  const [isVoiceTesting, setIsVoiceTesting] = useState(false);
  const [prompt, setPrompt] = useState<string>(
    HISTORICAL_SCIENTISTS[0].defaultTopicAr
  );
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [style, setStyle] = useState("cinematic");
  const [selectedVideoModel, setSelectedVideoModel] = useState<VideoModelId>("wan-2-2-alibaba");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const unsub = subscribeSpeechState((s) => {
      setIsVoiceTesting(s.isPlaying && !s.isPaused);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const selectedScientist =
    HISTORICAL_SCIENTISTS.find((s) => s.id === selectedScientistId) ||
    HISTORICAL_SCIENTISTS[0];

  const selectedPersona: VoicePersona =
    OMEGA_VOICE_PERSONAS.find((p) => p.id === selectedPersonaId) ||
    OMEGA_VOICE_PERSONAS[0];

  const selectedVoiceEngine =
    OMEGA_VOICE_ENGINES[selectedVoiceEngineId] || OMEGA_VOICE_ENGINES.elevenlabs;

  const filteredPersonas = OMEGA_VOICE_PERSONAS.filter(
    (p) => p.category === selectedVoiceCategory
  );

  const handleSelectScientist = (sc: HistoricalScientist) => {
    setSelectedScientistId(sc.id);
    setPrompt(sc.defaultTopicAr);
  };

  const handleSelectPersona = (persona: VoicePersona) => {
    setSelectedPersonaId(persona.id);
    setSelectedVoiceEngineId(persona.recommendedEngine);
    setPrompt(persona.sampleQuoteAr);
  };

  const handleToggleVoicePreview = () => {
    if (isVoiceTesting) {
      stopSpeaking();
      setIsVoiceTesting(false);
    } else {
      speakWithOmega(prompt || selectedPersona.sampleQuoteAr, {
        personaId: selectedPersona.id,
        onEnd: () => setIsVoiceTesting(false),
        onError: () => setIsVoiceTesting(false),
      });
      setIsVoiceTesting(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const handler = onGenerate || onSubmit;
    if (!handler) {
      console.error("No generator handler provided to OmegaMediaModal");
      return;
    }

    setIsGenerating(true);
    try {
      await handler({
        type: mediaType,
        prompt: prompt.trim(),
        aspectRatio,
        style,
        videoModel: selectedVideoModel,
        scientistId: selectedScientist.id,
        pipelineMode,
        voicePersonaId: selectedPersona.id,
        voiceEngineId: selectedVoiceEngine.id,
      });
      onClose();
    } catch (err) {
      console.error("Media generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const videoModelEntries = Object.values(OMEGA_VIDEO_MODELS);
  const currentModelSpec = OMEGA_VIDEO_MODELS[selectedVideoModel];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#0b101d] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 via-emerald-600 to-cyan-500 text-white shadow-lg shadow-purple-900/40">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>استوديو وخطوط إنتاج الوسائط المرئية والصوتية</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  Omega AI Studio
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                إنتاج فيديوهات علمية تعليمية، أصوات العلماء والمشاهير والرواة الوثائقيين، ومقاطع سينمائية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-right">
          {/* Main 4 Modes Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              اختر مسار الإنتاج المطلوب:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Pipeline Mode */}
              <button
                type="button"
                onClick={() => {
                  setMediaType("pipeline");
                  setPrompt(selectedScientist.defaultTopicAr);
                }}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  mediaType === "pipeline"
                    ? "bg-purple-950/90 border-purple-400 text-white shadow-lg shadow-purple-950/60 ring-1 ring-purple-400/50"
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Atom className="w-3.5 h-3.5 text-purple-400" />
                    <span>خط إنتاج علمي</span>
                  </div>
                  <span className="text-[8.5px] px-1 py-0.5 rounded bg-purple-900/80 text-purple-200 font-mono">
                    متعدد
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  محاكاة علمية (نيوتن، أينشتاين...) تجمع بين النص والصوت والفيديو
                </p>
              </button>

              {/* Voice Studio Mode */}
              <button
                type="button"
                onClick={() => {
                  setMediaType("voice");
                  setPrompt(selectedPersona.sampleQuoteAr);
                }}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  mediaType === "voice"
                    ? "bg-emerald-950/90 border-emerald-400 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/50"
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <span>استوديو الأصوات</span>
                  </div>
                  <span className="text-[8.5px] px-1 py-0.5 rounded bg-emerald-900/80 text-emerald-200 font-mono">
                    15 صوتاً
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  أصوات العلماء، المشاهير، والرواة الوثائقيين بمحركات متطورة
                </p>
              </button>

              {/* Video Model Direct */}
              <button
                type="button"
                onClick={() => {
                  setMediaType("video");
                  setPrompt("مشهد سينمائي فائق الواقعية في الفضاء الكوني يوضح حركة الكواكب والنجوم...");
                }}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  mediaType === "video"
                    ? "bg-cyan-950/90 border-cyan-400 text-white shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400/50"
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <Film className="w-3.5 h-3.5 text-cyan-400" />
                    <span>فيديو سينمائي</span>
                  </div>
                  <span className="text-[8.5px] px-1 py-0.5 rounded bg-cyan-900/80 text-cyan-200 font-mono">
                    7 نماذج
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  توليد فيديو بمحركات عالمية (Veo, Runway, Kling, Wan...)
                </p>
              </button>

              {/* Image Direct */}
              <button
                type="button"
                onClick={() => {
                  setMediaType("image");
                  setPrompt("لوحة فلسفية فوتوغرافية بدقة 8K تعكس انحناء نسيج الزمكان...");
                }}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  mediaType === "image"
                    ? "bg-pink-950/90 border-pink-400 text-white shadow-lg shadow-pink-950/60 ring-1 ring-pink-400/50"
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-pink-300">
                    <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                    <span>صورة فائقة الدقة</span>
                  </div>
                  <span className="text-[8.5px] px-1 py-0.5 rounded bg-pink-900/80 text-pink-200 font-mono">
                    FLUX.1
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  توليد صور فوتوغرافية ولوحات فلسفية وعلمية 8K واقعية
                </p>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* VOICE STUDIO CONTROLS (WHEN VOICE IS SELECTED)                */}
          {/* ============================================================== */}
          {mediaType === "voice" && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-950/80 border border-emerald-900/50 shadow-inner">
              {/* Category Tabs: العلماء / المشاهير / الرواة */}
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-2">
                  اختر فئة الصوت المطلوبة:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVoiceCategory("scientists");
                      const first = OMEGA_VOICE_PERSONAS.find((p) => p.category === "scientists");
                      if (first) handleSelectPersona(first);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedVoiceCategory === "scientists"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <span>🔬 أصوات العلماء</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVoiceCategory("celebrities");
                      const first = OMEGA_VOICE_PERSONAS.find((p) => p.category === "celebrities");
                      if (first) handleSelectPersona(first);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedVoiceCategory === "celebrities"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-900/40"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <span>🎙️ المشاهير والرواد</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVoiceCategory("documentary");
                      const first = OMEGA_VOICE_PERSONAS.find((p) => p.category === "documentary");
                      if (first) handleSelectPersona(first);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedVoiceCategory === "documentary"
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-900/40"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <span>🌍 الأفلام الوثائقية والرواة</span>
                  </button>
                </div>
              </div>

              {/* Voice Program / Engine Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    برنامج / محرك التوليد الصوتي (Voice Engine):
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedVoiceEngine.latency} • تقييم الجودة: {selectedVoiceEngine.qualityRating}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(OMEGA_VOICE_ENGINES).map((eng) => (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => setSelectedVoiceEngineId(eng.id)}
                      className={`p-2 rounded-lg border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        selectedVoiceEngineId === eng.id
                          ? "bg-slate-900 border-emerald-400 text-white ring-1 ring-emerald-400/40"
                          : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-zinc-100">{eng.name}</span>
                        <span
                          className="text-[9px] px-1 rounded font-mono"
                          style={{ color: eng.accentColor, backgroundColor: `${eng.accentColor}15` }}
                        >
                          {eng.isOpenSource ? "مفتوح" : "Flagship"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{eng.tagline}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Persona Cards Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اختر الشخصية / نبرة الإلقاء:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredPersonas.map((persona) => {
                    const isSelected = persona.id === selectedPersona.id;
                    return (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => handleSelectPersona(persona)}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-emerald-950/80 border-emerald-400 ring-1 ring-emerald-400/40 text-white"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border"
                          style={{
                            backgroundColor: `${persona.accentColor}20`,
                            borderColor: isSelected ? persona.accentColor : "transparent",
                          }}
                        >
                          {persona.avatarEmoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold text-slate-100">{persona.nameAr}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{persona.nameEn}</span>
                          </div>
                          <div className="text-[10px] text-emerald-400 font-medium mb-1 truncate">
                            {persona.titleAr}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                            {persona.descriptionAr}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instant Audio Preview & Direct Audio File Download */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: `${selectedPersona.accentColor}25` }}
                  >
                    {selectedPersona.avatarEmoji}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate">
                      صوت: {selectedPersona.nameAr}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      محرك: {selectedVoiceEngine.name} • نبرة: {selectedPersona.pitch}x
                    </div>
                  </div>
                </div>

                {/* Waveform indicator */}
                <div className="flex items-center gap-1 h-6 px-2">
                  {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5, 0.7].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isVoiceTesting ? "bg-emerald-400 animate-pulse" : "bg-slate-700 h-2"
                      }`}
                      style={{
                        height: isVoiceTesting ? `${Math.max(6, 16 * h)}px` : "4px",
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { blob, filename } = await synthesizeSpeechToWavBlob(
                          prompt || selectedPersona.sampleQuoteAr,
                          {
                            personaId: selectedPersona.id,
                            speed: 1.0,
                          }
                        );
                        triggerAudioFileDownload(blob, filename);
                      } catch (err) {
                        console.error("[Download voice error]:", err);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-950/90 hover:bg-purple-900 text-purple-200 border border-purple-500/40 shadow-sm transition-all cursor-pointer"
                    title="تحميل ملف صوتي حقيقي (WAV)"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    <span>تحميل ملف الصوت (WAV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleVoicePreview}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isVoiceTesting
                        ? "bg-red-600 hover:bg-red-500 text-white"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30"
                    }`}
                  >
                    {isVoiceTesting ? (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>إيقاف الصوت</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>استمع الآن</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PIPELINE SPECIFIC CONTROLS (WHEN PIPELINE IS SELECTED)        */}
          {/* ============================================================== */}
          {mediaType === "pipeline" && (
            <div className="space-y-4 p-3.5 rounded-xl bg-slate-950/70 border border-purple-900/50 shadow-inner">
              {/* Preset Mode Choice: Flagship vs Open Source */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>توليفة نماذج خط الإنتاج (Pipeline Architecture):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    أفضل توليفة حسب قدرات العتاد والدقة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Flagship */}
                  <button
                    type="button"
                    onClick={() => setPipelineMode("flagship")}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                      pipelineMode === "flagship"
                        ? "bg-purple-950/80 border-purple-400 ring-1 ring-purple-400/40 text-white"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>1. أعلى جودة ممكنة (Flagship)</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 font-mono">
                        4K Cinematic
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 space-y-0.5">
                      <div>• السيناريو: <strong>GPT-5 / Claude 3.5 / Gemini</strong></div>
                      <div>• الصور والفيديو: <strong>FLUX.1 Pro + Veo (Google) / Runway Gen-4 / Kling</strong></div>
                      <div>• الصوت ومزامنة الشفاه: <strong>ElevenLabs + Sync Labs</strong></div>
                    </div>
                  </button>

                  {/* Open Source */}
                  <button
                    type="button"
                    onClick={() => setPipelineMode("open_source")}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                      pipelineMode === "open_source"
                        ? "bg-emerald-950/80 border-emerald-400 ring-1 ring-emerald-400/40 text-white"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                        <span>2. مفتوح المصدر بالكامل ومحلي (Open Source)</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                        Self-Hosted
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 space-y-0.5">
                      <div>• السيناريو: <strong>Qwen 2.5 (Alibaba)</strong></div>
                      <div>• الفيديو: <strong>Wan 2.2 / HunyuanVideo / CogVideoX</strong></div>
                      <div>• تحريك الملامح والصوت: <strong>LivePortrait + MuseTalk + XTTS v2 + FFmpeg</strong></div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Historical Scientist Selection */}
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-2">
                  اختر الشخصية العلمية المراد محاكاتها:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {HISTORICAL_SCIENTISTS.map((sc) => {
                    const isSelected = selectedScientistId === sc.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => handleSelectScientist(sc)}
                        className={`p-2 rounded-xl border text-right transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? "bg-slate-900 border-cyan-400 ring-1 ring-cyan-400/50 text-white shadow-md shadow-cyan-950/40"
                            : "bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-900/80 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <div>
                            <div className="font-bold text-xs text-white">{sc.nameAr}</div>
                            <div className="text-[9px] text-slate-400 font-mono">{sc.nameEn}</div>
                          </div>
                          {isSelected && (
                            <span className="p-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-purple-300 line-clamp-1 mb-1">
                          {sc.specialtyAr}
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                          <span>{sc.era}</span>
                          <span className="text-cyan-400 truncate max-w-[80px]">
                            $${sc.keyEquation}$$
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7-Stage Pipeline Blueprint Visual */}
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-purple-400" />
                  <span>مراحل خط الإنتاج العلمي التكاملي المعتمد (Multi-Model Pipeline):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-purple-400 font-semibold block">1. كتابة السيناريو</span>
                    <span className="text-slate-300">
                      {pipelineMode === "open_source" ? "Qwen 2.5" : "GPT-5 / Gemini"}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-pink-400 font-semibold block">2. إنشاء الصور</span>
                    <span className="text-slate-300">
                      {pipelineMode === "open_source" ? "FLUX.1 schnell" : "FLUX.1 Pro / Imagen"}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-cyan-400 font-semibold block">3. توليد الفيديو</span>
                    <span className="text-slate-300">
                      {pipelineMode === "open_source" ? "Wan 2.2 / Hunyuan" : "Veo / Runway / Kling"}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-emerald-400 font-semibold block">4. تحريك الملامح</span>
                    <span className="text-slate-300">LivePortrait (512D)</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-amber-400 font-semibold block">5. مزامنة الشفاه</span>
                    <span className="text-slate-300">
                      {pipelineMode === "open_source" ? "MuseTalk" : "Sync Labs"}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-indigo-400 font-semibold block">6. الصوت والمؤثرات</span>
                    <span className="text-slate-300">
                      {pipelineMode === "open_source" ? "XTTS v2 / Kokoro" : "ElevenLabs"}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 col-span-2">
                    <span className="text-violet-400 font-semibold block">7. المونتاج والشارة الإلزامية</span>
                    <span className="text-slate-300">FFmpeg + Remotion (معادلات KaTeX وشارة المحاكاة)</span>
                  </div>
                </div>
              </div>

              {/* Mandatory Academic Transparency & Ethics Disclaimer */}
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-amber-300">ميثاق الشفافية والأمانة العلمية:</strong>{" "}
                  يقوم النظام بإدراج علامة مائية دائمة توضح صراحةً أن الفيديو هو <strong>محاكاة علمية تفاعلية بالذكاء الاصطناعي</strong> وليست تسجيلاً حقيقياً، لمنع تضليل الجمهور مع صون القيمة التعليمية.
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIDEO SPECIFIC CONTROLS (WHEN VIDEO DIRECT IS SELECTED)       */}
          {/* ============================================================== */}
          {mediaType === "video" && (
            <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  <span>اختر نموذج الذكاء الاصطناعي المولد للفيديو:</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {videoModelEntries.length} نماذج سينمائية متقدمة
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {videoModelEntries.map((m) => {
                  const isSelected = selectedVideoModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedVideoModel(m.id)}
                      className={`text-right p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                        isSelected
                          ? "bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50"
                          : "bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: m.accentColor }}
                            />
                            <span className="font-bold text-xs text-white">{m.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">
                            {m.company}
                          </span>
                        </div>

                        {isSelected && (
                          <span className="p-1 rounded-full bg-cyan-500/20 text-cyan-400">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] text-cyan-200/90 leading-tight font-medium">
                          {m.tagline}
                        </p>
                        <div className="flex items-center gap-1 pt-0.5">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {m.badge}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {m.fps}fps
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {currentModelSpec && (
                <div className="mt-2 p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-slate-300 flex items-start gap-2">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cyan-300">{currentModelSpec.name}:</strong>{" "}
                    {currentModelSpec.description}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prompt Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {mediaType === "pipeline"
                ? "موضوع الدرس العلمي أو الظاهرة المراد شرحها:"
                : mediaType === "voice"
                ? "النص أو الشرح المراد نطقه بصوت الشخصية (Text to Speech):"
                : mediaType === "video"
                ? "وصف المشهد المراد إنشاؤه في الفيديو (Prompt):"
                : "وصف تفاصيل الصورة بدقة (Prompt):"}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mediaType === "pipeline"
                  ? "مثال: نيوتن يشرح الجاذبية الكونية وسقوط التفاحة والتفاضل والتكامل..."
                  : mediaType === "voice"
                  ? "اكتب النص أو السؤال أو المقال العلمي ليقوم أوميغا بنطقه بهذا الصوت..."
                  : mediaType === "video"
                  ? "صف حركة الكاميرا والظاهرة الفيزيائية أو السينمائية..."
                  : "صف تفاصيل المشهد بدقة عالية وألوان وتكوين فني..."
              }
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              required
            />
          </div>

          {/* Prompt Suggestions */}
          <div>
            <span className="block text-[11px] text-slate-400 mb-1.5 font-medium">
              اقتراحات سريعة جاهزة:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.filter((s) => s.type === (mediaType === "voice" ? "pipeline" : mediaType)).map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(s.prompt);
                    if ("scientistId" in s && s.scientistId) {
                      setSelectedScientistId(s.scientistId);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors cursor-pointer text-right"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio & Style (For Video and Image only) */}
          {(mediaType === "video" || mediaType === "image") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  نسبة العرض والأبعاد:
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="16:9">أفقي سينمائي (16:9 Landscape)</option>
                  <option value="1:1">مربع مثالي (1:1 Square)</option>
                  <option value="9:16">طولي للهاتف (9:16 Portrait)</option>
                  <option value="4:3">قياسي (4:3 Standard)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الأسلوب الفني:
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="cinematic">واقعي سينمائي (Cinematic Realistic)</option>
                  <option value="digital_art">فن رقمي ثلاثي الأبعاد (3D Digital Art)</option>
                  <option value="sacred_geometry">هندسة مقدسة وفلسفية (Sacred Geometry)</option>
                  <option value="cyberpunk">خيال علمي سريالي (Cyberpunk Surreal)</option>
                  <option value="oil_painting">لوحة زيتية كلاسيكية (Oil Painting)</option>
                </select>
              </div>
            </div>
          )}

          {/* Footer Submit Button */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {mediaType === "pipeline"
                  ? "تكامل 7 مراحل • شارة المحاكاة العلمية نشطة"
                  : mediaType === "voice"
                  ? `برنامج صوتي نشط: ${selectedVoiceEngine.name} • ${selectedPersona.nameAr}`
                  : "توليد فوري ومحاكاة فيزيائية حركية"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {mediaType === "pipeline"
                        ? `جاري تشغيل خط إنتاج محاكاة ${selectedScientist.nameAr}...`
                        : mediaType === "voice"
                        ? `جاري تهيئة الصوت...`
                        : `جاري التوليد...`}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {mediaType === "pipeline"
                        ? `بدء خط إنتاج محاكاة ${selectedScientist.nameAr}`
                        : mediaType === "voice"
                        ? `تفعيل وإرسال بصوت ${selectedPersona.nameAr}`
                        : mediaType === "video"
                        ? `توليد الفيديو (${currentModelSpec?.name})`
                        : "توليد الصورة الفائقة"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
