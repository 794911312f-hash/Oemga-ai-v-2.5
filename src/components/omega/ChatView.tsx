import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  Brain,
  BookmarkPlus,
  Sliders,
  Scale,
  Code2,
  Atom,
  Clock,
  CloudSun,
  Newspaper,
  Share2,
  Sigma,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  History,
  Wand2,
  Film,
  BarChart3,
  Download,
  Workflow,
  Mic,
  MicOff,
  Activity,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Radio,
  X,
  GitBranch,
  BookOpen,
  Compass,
  Cpu,
  Server,
} from "lucide-react";
import type { ChatMessage, ChatAttachment } from "../../lib/omega/types";
import { fuseResponses, type FusionResult } from "../../lib/omega/fusion";
import { isOpenProblemQuery } from "../../lib/omega/exploratoryEngine";
import { ExploratoryReasoningCard } from "./ExploratoryReasoningCard";
import { SignalMeter } from "./SignalMeter";
import { globalOmegaMemory } from "../../lib/omega/memory";
import { globalOmegaLineage } from "../../lib/omega/lineage";
import { globalOmegaKernel } from "../../lib/omega/kernel";
import type { OmegaConfig } from "../../lib/omega/optimizer";
import { MathRenderer } from "./MathRenderer";
import { AttachmentPicker } from "./AttachmentPicker";
import { OmegaCapabilityModal, type CapabilityTab } from "./OmegaCapabilityModal";
import { OmegaVoicePlayer } from "./OmegaVoicePlayer";
import { AudioFrequencyVisualizer } from "./AudioFrequencyVisualizer";
import { LiveVoiceInteractionModal } from "./LiveVoiceInteractionModal";
import { useVoiceInteraction } from "../../lib/omega/useVoiceInteraction";
import {
  OMEGA_VOICE_PERSONAS,
  OMEGA_VOICE_ENGINES,
  speakWithOmega,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  subscribeSpeechState,
  type VoicePersona,
  type VoiceCategory,
} from "../../lib/omega/speech";
import {
  synthesizeSpeechToWavBlob,
  triggerAudioFileDownload,
} from "../../lib/omega/audioExporter";

class SafeBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[SafeBoundary caught subcomponent render error]:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs my-2">
            عذراً، حدث استثناء طفيف في بطاقة العرض الجانبية ولكن الواجهة ومحادثتك تعمل بشكل كامل ومستمر.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
import { OmegaMediaModal } from "./OmegaMediaModal";
import { ChatHistoryDrawer } from "./ChatHistoryDrawer";
import { OmegaVideoPlayer } from "./OmegaVideoPlayer";
import { OmegaProfessor3D } from "./OmegaProfessor3D";
import { InteractivePhysicsLab } from "./InteractivePhysicsLab";
import {
  TreeOfThoughtVisualizer,
  createThoughtTreeFromFusion,
  type ProblemCase,
} from "./TreeOfThoughtVisualizer";
import { OmegaNotebookModal } from "./OmegaNotebookModal";
import { OmegaCodeSandbox } from "./OmegaCodeSandbox";
import { ComplexOperationsLab } from "./ComplexOperationsLab";
import { RealEngineConnectorModal } from "./RealEngineConnectorModal";
import { OmegaProviderManagerTab } from "./OmegaProviderManagerTab";
import {
  loadSessions,
  createSession,
  updateSession,
  deleteSession,
  renameSession,
  clearAllSessions,
  findRelevantPastContext,
  generateSessionTitle,
  type ChatSession,
} from "../../lib/omega/chatHistory";

interface ChatViewProps {
  config: OmegaConfig;
  onOpenKernelWithResult?: (result: FusionResult) => void;
  onOpenOptimizer?: () => void;
}

const SAMPLE_PROMPTS = [
  {
    label: "فيديو علمي: نيوتن يشرح السقوط الشاقولي الحر (Pipeline)",
    icon: Workflow,
    domain: "science_factual",
    prompt: "أنتج فيديو علمي تعليمي لنيوتن يشرح قانون السقوط الشاقولي الحر للكتل وتسارع الجاذبية الأرضية بواسطة خط إنتاج النماذج المتعددة",
  },
  {
    label: "فيديو علمي: أينشتاين يشرح انحناء الزمكان (Pipeline)",
    icon: Atom,
    domain: "science_factual",
    prompt: "أنتج فيديو علمي تعليمي لأينشتاين يشرح النسبية العامة وانحناء الزمكان ومعادلة E=mc² بواسطة خط إنتاج النماذج المتعددة",
  },
  {
    label: "نطق صوتي: تحدث بصوت أينشتاين ونيوتن (Omega Voice)",
    icon: Mic,
    domain: "science_factual",
    prompt: "تحدث بصوت أينشتاين واشرح لنا كيف يتمدد النسيج الكوني وانحناء الضوء حول الثقوب السوداء",
  },
  {
    label: "فلسفة ومقارنة أديان ومعضلة الشر",
    icon: Brain,
    domain: "philosophy_theology",
    prompt: "قارن بين الرؤية الفلسفية للشر والعدالة الإلهية في الإسلام والمسيحية، مع تفكيك أطروحات كانط ونيتشه وسارتر وحرية الإرادة.",
  },
  {
    label: "مخطط بياني تفاعلي (Interactive Chart)",
    icon: BarChart3,
    domain: "math_logic",
    prompt: "أنشئ مخططاً بيانياً تفاعلياً يقارن بين كفاءة وسرعة ودقة نماذج الذكاء الاصطناعي المختلفة في الاستدلال المعرفي.",
  },
  {
    label: "توليد صورة فنية بالذكاء الاصطناعي",
    icon: ImageIcon,
    domain: "general",
    prompt: "ولد صورة سينمائية فائقة الدقة 8K لمدينة ذكية مستقبلية بهندسة كونية وأضواء نيون أرجوانية وسماوات زرقاء متلألئة.",
  },
  {
    label: "توليد فيديو متحرك تفاعلي (Motion Video)",
    icon: Film,
    domain: "science_factual",
    prompt: "أنشئ فيديو سينمائي متحرك لحركة النجوم والمجرات وتدفق موجات الطاقة الكمومية في الفضاء السحيق.",
  },
  {
    label: "برمجة وهندسة",
    icon: Code2,
    domain: "code",
    prompt: "اكتب دالة بلغة TypeScript لتطبيق خوارزمية البحث الثنائي Binary Search مع معالجة الحالات الحدية وأنواع البيانات الصارمة.",
  },
  {
    label: "فيزياء ومعادلات كمومية (LaTeX)",
    icon: Atom,
    domain: "science_factual",
    prompt: "اشرح معادلة شرودنغر الزمنية $$i\\hbar \\frac{\\partial}{\\partial t}\\Psi(\\vec{r}, t) = \\hat{H}\\Psi(\\vec{r}, t)$$ وكيف تصف تراكب الحالات الكمية في الكيوبت؟",
  },
  {
    label: "توقيت وتاريخ لحظي",
    icon: Clock,
    domain: "general",
    prompt: "ما هو الوقت والتاريخ الدقيق الآن بالتوقيتين الهجري والميلادي ويوم الأسبوع وفق ساعة النظام؟",
  },
  {
    label: "طقس وأحوال جوية",
    icon: CloudSun,
    domain: "general",
    prompt: "ما هي أحوال الطقس وتوقعات درجات الحرارة والرياح في الرياض والقاهرة اليوم؟",
  },
];

export const ChatView: React.FC<ChatViewProps> = ({
  config,
  onOpenKernelWithResult,
  onOpenOptimizer,
}) => {
  // Session management state
  const [sessions, setSessionsState] = useState<ChatSession[]>(() => {
    try {
      const loaded = loadSessions();
      console.log(`[ChatView] Initializing sessions state with ${loaded?.length || 0} loaded sessions.`);
      if (Array.isArray(loaded) && loaded.length > 0) return loaded;
      const initial = createSession("محادثة جديدة");
      return [initial];
    } catch (err) {
      console.error("[ChatView] Exception during initial sessions load:", err);
      return [createSession("محادثة رئيسية")];
    }
  });

  // Guard setSessions so that sessions is NEVER set to null, undefined, or []
  const setSessions = (action: React.SetStateAction<ChatSession[]>) => {
    setSessionsState((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      if (!Array.isArray(next) || next.length === 0) {
        console.warn("[ChatView] setSessions attempted to set empty/invalid sessions array. Preserving previous non-empty state.");
        return prev && prev.length > 0 ? prev : [createSession("محادثة رئيسية")];
      }
      return next;
    });
  };

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const loaded = loadSessions();
      return loaded[0]?.id || "default";
    } catch {
      return "default";
    }
  });

  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Active messages
  const activeSession = (Array.isArray(sessions) && sessions.length > 0)
    ? (sessions.find((s) => s && s.id === activeSessionId) || sessions[0])
    : null;

  const [messages, setMessages] = useState<ChatMessage[]>(() => activeSession?.messages || []);

  // Sync messages when activeSessionId changes
  useEffect(() => {
    console.log(`[ChatView] activeSessionId changed to: ${activeSessionId}`);
    if (!activeSessionId || !Array.isArray(sessions)) return;
    const current = sessions.find((s) => s && s.id === activeSessionId);
    if (current && Array.isArray(current.messages)) {
      console.log(`[ChatView] Switching messages to activeSessionId ${activeSessionId} (${current.messages.length} messages)`);
      setMessages(current.messages);
    }
  }, [activeSessionId]);

  // Persist messages to active session whenever messages change
  const isFirstMountRef = useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (!activeSessionId || !Array.isArray(messages)) return;
    try {
      console.log(`[ChatView] Persisting ${messages.length} messages for activeSessionId: ${activeSessionId}`);
      const title = generateSessionTitle(messages);
      const updatedSessions = updateSession(activeSessionId, (s) => ({ ...s, messages, title }));
      if (Array.isArray(updatedSessions) && updatedSessions.length > 0) {
        setSessions(updatedSessions);
      }
    } catch (err) {
      console.error("[ChatView] Error persisting messages in useEffect:", err);
    }
  }, [messages, activeSessionId]);

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [savedMemorySuccess, setSavedMemorySuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Voice & Speech State (Scientists, Celebrities, Documentaries)
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("doc-arabic-fusha");
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [autoSpeakResponses, setAutoSpeakResponses] = useState<boolean>(false);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [currentSpeakingMessageId, setCurrentSpeakingMessageId] = useState<string | null>(null);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState<boolean>(false);
  const [voiceCategoryFilter, setVoiceCategoryFilter] = useState<VoiceCategory>("scientists");

  // 3D Avatar, Interactive Physics Sandbox, Tree of Thought, Notebooks, and Code Sandbox States
  const [showProfessor3D, setShowProfessor3D] = useState<boolean>(true);
  const [isProfessorFloating, setIsProfessorFloating] = useState<boolean>(true);
  const [showInteractiveLab, setShowInteractiveLab] = useState<boolean>(false);
  const [showTreeOfThought, setShowTreeOfThought] = useState<boolean>(false);
  const [activeThoughtCase, setActiveThoughtCase] = useState<ProblemCase | null>(null);
  const [deepExplorationMode, setDeepExplorationMode] = useState<boolean>(false);
  const [showNotebookModal, setShowNotebookModal] = useState<boolean>(false);
  const [showCodeSandbox, setShowCodeSandbox] = useState<boolean>(false);
  const [showLiveVoiceModal, setShowLiveVoiceModal] = useState<boolean>(false);
  const [showComplexLabModal, setShowComplexLabModal] = useState<boolean>(false);
  const [showEngineBridgeModal, setShowEngineBridgeModal] = useState<boolean>(false);
  const [showProviderManagerModal, setShowProviderManagerModal] = useState<boolean>(false);

  // Direct Voice Interaction with Audio Frequency Analysis
  const chatVoice = useVoiceInteraction({
    lang: "ar-SA",
    onInterimTranscript: (draft) => {
      setInput(draft);
    },
    onFinalTranscript: (finalText) => {
      setInput(finalText);
    },
  });

  const currentPersona =
    OMEGA_VOICE_PERSONAS.find((p) => p.id === selectedPersonaId) ||
    OMEGA_VOICE_PERSONAS[0];

  useEffect(() => {
    const unsub = subscribeSpeechState((s) => {
      setIsVoiceActive(s.isPlaying && !s.isPaused);
      if (!s.isPlaying) {
        setCurrentSpeakingMessageId(null);
      }
    });
    return unsub;
  }, []);

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, id: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopiedId(id);
        setTimeout(() => {
          setCopiedId((prev) => (prev === id ? null : prev));
        }, 2000);
      } catch (e) {
        console.error("Fallback copy failed:", e);
      }
    }
  };

  // Capability Modal State
  const [isCapabilityModalOpen, setIsCapabilityModalOpen] = useState(false);
  const [activeCapabilityTab, setActiveCapabilityTab] = useState<CapabilityTab>("datetime");

  const openCapability = (tab: CapabilityTab) => {
    setActiveCapabilityTab(tab);
    setIsCapabilityModalOpen(true);
  };

  const handleAddAttachment = (att: ChatAttachment) => {
    setAttachments((prev) => [...prev, att]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Start a fresh new chat session
  const handleNewChat = () => {
    console.log("[ChatView] handleNewChat triggered.");
    try {
      if (activeSessionId && Array.isArray(messages)) {
        const title = generateSessionTitle(messages);
        updateSession(activeSessionId, (s) => ({ ...s, messages, title }));
      }
      const newSession = createSession("محادثة جديدة");
      const all = loadSessions();
      setSessions(all);
      setActiveSessionId(newSession.id);
      setMessages(newSession.messages);
      setInput("");
      setAttachments([]);
      console.log(`[ChatView] New chat created with id: ${newSession.id}`);
    } catch (err) {
      console.error("[ChatView] Error inside handleNewChat:", err);
    }
  };

  // Switch to a previous session
  const handleSelectSession = (id: string) => {
    console.log(`[ChatView] handleSelectSession triggered for session id: ${id}`);
    if (id === activeSessionId) return;
    try {
      if (activeSessionId && Array.isArray(messages)) {
        const title = generateSessionTitle(messages);
        updateSession(activeSessionId, (s) => ({ ...s, messages, title }));
      }
      setActiveSessionId(id);
      const all = loadSessions();
      setSessions(all);
      const target = all.find((s) => s.id === id);
      if (target && Array.isArray(target.messages)) {
        setMessages(target.messages);
      }
      console.log(`[ChatView] Successfully switched to session ${id}`);
    } catch (err) {
      console.error("[ChatView] Error inside handleSelectSession:", err);
    }
  };

  // Delete session
  const handleDeleteSession = (id: string) => {
    console.log(`[ChatView] handleDeleteSession triggered for session id: ${id}`);
    try {
      const { sessions: updated, nextActiveId } = deleteSession(id);
      setSessions(updated);
      if (activeSessionId === id) {
        setActiveSessionId(nextActiveId);
        const target = updated.find((s) => s.id === nextActiveId) || updated[0];
        setMessages(target ? target.messages : []);
      }
    } catch (err) {
      console.error("[ChatView] Error inside handleDeleteSession:", err);
    }
  };

  // Rename session
  const handleRenameSession = (id: string, newTitle: string) => {
    console.log(`[ChatView] handleRenameSession triggered for ${id}: "${newTitle}"`);
    try {
      renameSession(id, newTitle);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: newTitle.trim() || s.title } : s))
      );
    } catch (err) {
      console.error("[ChatView] Error inside handleRenameSession:", err);
    }
  };

  // Clear all sessions
  const handleClearAllSessions = () => {
    console.log("[ChatView] handleClearAllSessions triggered.");
    try {
      const fresh = clearAllSessions();
      setSessions(fresh);
      setActiveSessionId(fresh[0].id);
      setMessages(fresh[0].messages);
    } catch (err) {
      console.error("[ChatView] Error inside handleClearAllSessions:", err);
    }
  };

  // Media Generation Handler
  const handleGenerateMedia = async (data: {
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
  }) => {
    const userMsgId = `user-${Date.now()}`;
    const asstMsgId = `asst-${Date.now()}`;

    const userText =
      data.originalUserPrompt ||
      (data.type === "pipeline"
        ? `طلب إنتاج فيديو علمي تعليمي (Pipeline): "${data.prompt}" (${data.pipelineMode === "open_source" ? "مفتوح المصدر بالكامل" : "أعلى جودة Flagship"})`
        : data.type === "voice"
        ? `طلب نطق صوتي ذكي بصوت أوميغا: "${data.prompt}"`
        : data.type === "image"
        ? `طلب توليد صورة: "${data.prompt}" (الأسلوب: ${data.style || "سينمائي"}، الأبعاد: ${data.aspectRatio || "16:9"})`
        : `طلب توليد فيديو متحرك: "${data.prompt}" (النموذج: ${data.videoModel || "veo-google"}، الأسلوب: ${data.style || "سينمائي"})`);

    // Add user request message and pending assistant message
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: userText,
        timestamp: Date.now(),
      },
      {
        id: asstMsgId,
        role: "assistant",
        content:
          data.type === "pipeline"
            ? "جاري تشغيل خط إنتاج الفيديو العلمي متعدد النماذج (السيناريو ← البورتريه ← توليد الحركة ← تحريك الملامح ← مزامنة الشفاه ← استنساخ الصوت والمونتاج والشارة)..."
            : data.type === "voice"
            ? "جاري تهيئة المحرك الصوتي واستدعاء النبرة الصوتية المطلوبة..."
            : data.type === "image"
            ? "جاري استدعاء محرك التوليد البصري الفائق ورسم المشهد بدقة سينمائية 8K..."
            : "جاري استدعاء محرك الفيديو السينمائي ومحاكاة المشهد التفاعلي...",
        timestamp: Date.now(),
        isFusing: true,
      },
    ]);

    try {
      if (data.type === "voice") {
        const persona =
          OMEGA_VOICE_PERSONAS.find((p) => p.id === (data.voicePersonaId || selectedPersonaId)) ||
          OMEGA_VOICE_PERSONAS[0];
        const engine =
          OMEGA_VOICE_ENGINES[data.voiceEngineId || persona.recommendedEngine] ||
          OMEGA_VOICE_ENGINES.elevenlabs;

        setSelectedPersonaId(persona.id);
        setCurrentSpeakingMessageId(asstMsgId);

        speakWithOmega(data.prompt, {
          personaId: persona.id,
          rate: speedMultiplier,
          onEnd: () => setCurrentSpeakingMessageId(null),
          onError: () => setCurrentSpeakingMessageId(null),
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId
              ? {
                  ...m,
                  content:
                    `### 🎙️ محاكاة ونطق صوتي مباشر (Omega Voice Synthesis)\n\n` +
                    `• **الشخصية والنبرة:** ${persona.avatarEmoji} **${persona.nameAr}** (${persona.nameEn})\n` +
                    `• **برنامج / محرك التوليد:** \`${engine.name}\` (${engine.company}) — *${engine.badge}*\n` +
                    `• **الفئة:** ${persona.titleAr}\n` +
                    `• **الاستجابة وجودة الإلقاء:** ${engine.latency} • تقييم: **${engine.qualityRating}**\n\n` +
                    `> «${data.prompt}»\n\n` +
                    `🔊 **أوميغا يتكلم الآن بنبرة ${persona.nameAr}!** يمكنك التحكم في مستوى الصوت وسرعة الإلقاء والإيقاف المؤقت من خلال شريط الصوت أدناه.`,
                  isFusing: false,
                }
              : m
          )
        );
        return;
      }
      if (data.type === "pipeline") {
        const endpoint = "/api/omega/pipeline/generate";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: data.prompt,
            scientistId: data.scientistId || "newton",
            mode: data.pipelineMode || "flagship",
            tools: data.tools || {},
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "فشل خط إنتاج الفيديو العلمي");
        }

        const pData = json.pipeline || {};
        const sc = pData.scientist || {};
        const script = pData.script || {};
        const trace = pData.executionTrace || [];

        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId
              ? {
                  ...m,
                  content:
                    `### 🔬 خط إنتاج الفيديو العلمي والتعليمي المتكامل (Scientific Video Pipeline)\n\n` +
                    `تمت محاكاة وهندسة الإنتاج العلمي المتكامل بنجاح للعالم الجليل **${sc.nameAr || "العالم"} (${sc.nameEn || ""})** لشرح موضوع: **«${pData.topic}»**.\n\n` +
                    `• **العصر التاريخي:** ${sc.era || ""}\n` +
                    `• **التخصص العلمي:** ${sc.specialtyAr || ""}\n` +
                    `• **المعادلة الفيزيائية الحاكمة:** $$${script.keyEquation || sc.keyEquation || ""}$$\n` +
                    `• **توليفة الأدوات:** ${pData.mode === "open_source" ? "مفتوحة المصدر 100% ومحلية (Wan 2.2 + Qwen 2.5 + LivePortrait + MuseTalk + XTTS v2 + FFmpeg)" : "أعلى جودة سينمائية Flagship (Veo + Runway + FLUX.1 + ElevenLabs + Sync Labs)"}\n\n` +
                    `> ⚠️ **ميثاق الشفافية والأمانة العلمية الصارم:** ${pData.disclaimer || "إعادة تمثيل ومحاكاة علمية بالذكاء الاصطناعي وليست تسجيلاً حقيقياً • AI Educational Simulation (Non-Authentic Historical Re-enactment)"}\n\n` +
                    `#### 🎬 ملخص المشاهد وسيناريو الشرح:\n` +
                    (script.scenes || [])
                      .map(
                        (s: any, i: number) =>
                          `**المشهد ${i + 1}: ${s.title}** (${s.duration || 6} ثوانٍ)\n` +
                          `• *الحوار:* «${s.voiceLine || ""}»\n` +
                          `• *الفيزياء وحركة الكاميرا:* ${s.cameraMotion || ""} — ${s.physicsInteraction || ""}`
                      )
                      .join("\n\n") +
                    `\n\n#### ⚡ سجل تنفيذ خط الإنتاج (Pipeline Execution Trace):\n` +
                    `| المرحلة | النموذج والأداة | الحالة | زمن المعالجة |\n` +
                    `|---|---|---|---|\n` +
                    trace
                      .map(
                        (t: any) =>
                          `| ${t.stageNameAr} | \`${t.tool}\` | ✅ ${t.status} | ${t.durationMs}ms |`
                      )
                      .join("\n") +
                    `\n\nيمكنك تشغيل واستعراض الفيديو المحاكى، والتنقل بين المشاهد والتحكم في السرعة وعرض المخطط من خلال المشغل أدناه:`,
                  isFusing: false,
                  mediaPayload: {
                    type: "pipeline",
                    prompt: data.prompt,
                    style: data.style,
                    videoData: pData.videoData,
                    pipelineData: pData,
                  },
                }
              : m
          )
        );
        return;
      }

      const endpoint =
        data.type === "image" ? "/api/omega/generate-image" : "/api/omega/generate-video";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: data.prompt,
          aspectRatio: data.aspectRatio,
          style: data.style,
          videoModel: data.videoModel || "veo-google",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "فشل التوليد البصري");
      }

      if (data.type === "image") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId
              ? {
                  ...m,
                  content: `### 🎨 نتيجة التوليد البصري الفائق (Omega Visual Synthesis):\n\nتم توليد الصورة بنجاح استجابةً للوصف: «${data.prompt}» بأبعاد **${data.aspectRatio}** وأسلوب **${data.style}**.\n\nيمكنك استعراض وتنزيل الصورة مباشرة من البطاقة البصرية أدناه:`,
                  isFusing: false,
                  mediaPayload: {
                    type: "image",
                    url: json.imageUrl,
                    prompt: data.prompt,
                    aspectRatio: data.aspectRatio,
                    style: data.style,
                    provider: json.provider,
                  },
                }
              : m
          )
        );
      } else {
        const vData = json.videoData || {};
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId
              ? {
                  ...m,
                  content: `### 🎬 مقطع الفيديو الحركي التفاعلي — محرك **${vData.modelName || "Veo (Google)"}**\n\n` +
                    `• **النموذج:** ${vData.modelName || "Veo (Google)"} (${vData.modelProvider || "Google DeepMind"})\n` +
                    `• **الميزة الأساسية:** ${vData.modelTagline || "من أقوى مولدات الفيديو الواقعية"}\n` +
                    `• **الدقة ومعدل الإطارات:** ${vData.resolution || "1080p / 4K"} • ${vData.fps || 60}fps • تقييم الفيزياء: **${vData.physicsRating || "9.9/10"}**\n\n` +
                    `تمت محاكاة المشهد الحركي بنجاح استجابةً لسيناريو: «${data.prompt}». يمكنك تشغيل المشهد، والتبديل بحرية بين نماذج الفيديو السبعة مباشرة من داخل المشغل:`,
                  isFusing: false,
                  mediaPayload: {
                    type: "video",
                    prompt: data.prompt,
                    style: data.style,
                    videoData: vData,
                  },
                }
              : m
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstMsgId
            ? {
                ...m,
                content: `حدث خطأ أثناء توليد الوسائط: ${err.message || "فشل غير متوقع"}. يرجى المحاولة مجدداً.`,
                isFusing: false,
              }
            : m
        )
      );
    }
  };

  // Main chat sending handler
  const handleSend = async (promptToSend?: string, filesToSend?: ChatAttachment[]) => {
    const text = (promptToSend ?? input).trim();
    const currentAttachments = filesToSend ?? attachments;

    if ((!text && currentAttachments.length === 0) || isProcessing) return;

    // Check if user specifically requested a scientific educational video pipeline (Newton, Einstein, etc.)
    const isFreeFallPrompt =
      /سقوط.*شاقولي|شاقولي.*سقوط|السقوط.*الحر|سقوط.*حر|free\s*fall|freefall/i.test(text) ||
      (text.includes("نيوتن") && (text.includes("سقوط") || text.includes("شاقولي") || text.includes("جاذبية") || text.includes("تفاحة")));

    const isPipelineDirectPrompt =
      isFreeFallPrompt ||
      (/\b(خط إنتاج|خط انتاج|pipeline|محاكاة علمية|فيديو علمي|فيديو تعليمي)\b/i.test(text) &&
        /\b(نيوتن|أينشتاين|تيسلا|كوري|ابن الهيثم|الهيثم|فاينمان|newton|einstein|tesla|curie|feynman)\b/i.test(text)) ||
      (/\b(أنتج فيديو|انشئ فيديو|أنشئ فيديو|اصنع فيديو|فيديو|محاكاة|توليد فيديو|ولد فيديو)\b/i.test(text) &&
        /\b(يشرح|شرح|توضيح|تفسير|نيوتن|أينشتاين|تيسلا|ابن الهيثم|ماري كوري|فاينمان|الجاذبية|النسبية|السقوط)\b/i.test(text)) ||
      /^(نيوتن يشرح|أينشتاين يشرح|تيسلا يشرح|ابن الهيثم يشرح|ماري كوري تشرح|فاينمان يشرح)/i.test(text);

    if (isPipelineDirectPrompt) {
      let scientistId = "newton";
      if (/أينشتاين|einstein/i.test(text)) scientistId = "einstein";
      else if (/تيسلا|tesla/i.test(text)) scientistId = "tesla";
      else if (/ابن الهيثم|الهيثم|ibn/i.test(text)) scientistId = "ibn_al_haytham";
      else if (/كوري|curie/i.test(text)) scientistId = "curie";
      else if (/فاينمان|feynman/i.test(text)) scientistId = "feynman";

      const pipelineMode = /(مفتوح المصدر|مفتوحة المصدر|open source|wan|hunyuan|محلي|local)/i.test(text)
        ? "open_source"
        : "flagship";

      // Clean prompt of meta-instructions or complaint phrases like "عندما اطلب... يظهر فيديو لا علاقة..."
      let cleanTopic = text
        .replace(/^(يرجى\s+|من فضلك\s+|لو سمحت\s+|ممكن\s+|أرجو\s+|اريد منك\s+|أريد منك\s+|نريد\s+|قم بـ\s+|قم\s+|عندما اطلب\s+|عندما أطلب\s+)/i, "")
        .replace(/^(أنتج فيديو|انشئ فيديو|أنشئ فيديو|اصنع فيديو|فيديو علمي|فيديو تعليمي|فيديو متحرك|فيديو|محاكاة علمية|محاكاة|خط إنتاج|خط انتاج|pipeline)[:\s]*/i, "")
        .replace(/(،|\.|-)\s*(يضهر|يظهر|يطلع|طلع|بيظهر)\s+فيديو.*$/i, "")
        .trim();

      if (isFreeFallPrompt) {
        cleanTopic = "قانون نيوتن للسقوط الشاقولي الحر للكتل وتسارع الجاذبية P=mg";
        scientistId = "newton";
      } else if (!cleanTopic) {
        cleanTopic = text;
      }

      setInput("");
      handleGenerateMedia({
        type: "pipeline",
        prompt: cleanTopic,
        scientistId,
        pipelineMode,
        originalUserPrompt: text,
      });
      return;
    }

    // Check if user specifically requested a direct voice synthesis prompt (e.g. "تكلم يا اوميغا", "تحدث بصوت نيوتن", "اقرأ بصوت...")
    const isDirectVoiceCommand =
      /^(تكلم يا اوميغا|تحدث يا اوميغا|تكلم يا أوميغا|تحدث يا أوميغا|تكلم بالصوت|تحدث بالصوت|انطق بصوت|نطق بصوت|شغل صوت|اقرأ بصوت|تكلم بصوت|تحدث بصوت|سمعني صوت|تحدث معي|تكلم معي)/i.test(text);

    if (isDirectVoiceCommand) {
      let targetPersonaId = selectedPersonaId;
      if (/نيوتن|newton/i.test(text)) targetPersonaId = "newton";
      else if (/أينشتاين|اينشتاين|einstein/i.test(text)) targetPersonaId = "einstein";
      else if (/مورغان|فريمان|morgan/i.test(text)) targetPersonaId = "morgan-freeman";
      else if (/أتينبورو|ديفيد|attenborough/i.test(text)) targetPersonaId = "david-attenborough";
      else if (/وثائقي|ناشيونال|documentary/i.test(text)) targetPersonaId = "doc-arabic-fusha";
      else if (/تيسلا|تسلا|tesla/i.test(text)) targetPersonaId = "tesla";
      else if (/ابن الهيثم|هيثم/i.test(text)) targetPersonaId = "ibn-al-haytham";
      else if (/فاينمان|feynman/i.test(text)) targetPersonaId = "feynman";
      else if (/كوري|curie/i.test(text)) targetPersonaId = "curie";
      else if (/تايسون|tyson/i.test(text)) targetPersonaId = "neil-tyson";
      else if (/ساغان|sagan/i.test(text)) targetPersonaId = "carl-sagan";
      else if (/ستيف|جوبز|jobs/i.test(text)) targetPersonaId = "steve-jobs";

      let cleanPrompt = text
        .replace(/^(تكلم يا اوميغا|تحدث يا اوميغا|تكلم يا أوميغا|تحدث يا أوميغا|تكلم بالصوت|تحدث بالصوت|انطق بصوت|نطق بصوت|شغل صوت|اقرأ بصوت|تكلم بصوت|تحدث بصوت|سمعني صوت|تحدث معي|تكلم معي)\s*[:،-]?\s*/i, "")
        .trim();

      if (!cleanPrompt) {
        cleanPrompt = "مرحباً بك! أنا نظام أوميغا المعرفي، والآن أمتلك القدرة الكاملة على الكلام ونطق المعرفة والتفاعل الصوتي بنبرات العلماء الكبار والمشاهير ورواد الأفلام الوثائقية العالمية.";
      }

      setInput("");
      handleGenerateMedia({
        type: "voice",
        prompt: cleanPrompt,
        voicePersonaId: targetPersonaId,
        originalUserPrompt: text,
      });
      return;
    }

    // Check if user specifically requested a video
    const isVideoDirectPrompt =
      /\b(توليد فيديو|ولد فيديو|ولد لي فيديو|انشئ فيديو|إنشاء فيديو|فيديو متحرك|صمم فيديو|اعمل فيديو|مقطع فيديو متحرك|مقطع فيديو)\b/i.test(text) ||
      /\b(generate video|create video|make a video|animate video|video of|motion video)\b/i.test(text);

    // Check if user specifically requested an image or drawing
    const isImageDirectPrompt =
      !isVideoDirectPrompt &&
      (/\b(رسم صورة|ارسم صورة|ارسم لي|ارسم|توليد صورة|ولد صورة|ولد لي صورة|انشئ صورة|إنشاء صورة|صمم صورة|صمم لي صورة|اعمل صورة|اعمل لي صورة|أريد صورة|اريد صورة|أريد رسم|اريد رسم|صورة لـ|صورة عن|اعطني صورة|طلع لي صورة)\b/i.test(text) ||
        /\b(draw a|draw an|draw me|draw|paint a|paint me|paint|generate an image|generate image|create an image|create image|illustration of|artwork of|sketch a|render an image|picture of)\b/i.test(text) ||
        /(رسم|ارسم)\s+(لي\s+)?(صورة|شخصية|مشهد|منظر|قلعة|ساحر|فارس|تنين|مدينة|طبيعة|وحش|رجل|امرأة)/i.test(text));

    if (isImageDirectPrompt) {
      let cleanPrompt = text
        .replace(/^(يرجى\s+|من فضلك\s+|لو سمحت\s+|ممكن\s+|أرجو\s+|اريد منك\s+|أريد منك\s+|نريد\s+|قم بـ\s+|قم\s+)/i, "")
        .replace(/^(رسم صورة لـ|رسم صورة|ارسم لي صورة لـ|ارسم لي صورة|ارسم صورة لـ|ارسم صورة|ارسم لي|ارسم|توليد صورة لـ|توليد صورة|ولد لي صورة لـ|ولد لي صورة|ولد صورة لـ|ولد صورة|انشئ صورة لـ|انشئ صورة|إنشاء صورة لـ|إنشاء صورة|صمم صورة لـ|صمم صورة|صمم لي صورة لـ|صمم لي صورة|اعمل صورة لـ|اعمل صورة|اعمل لي صورة لـ|اعمل لي صورة|أريد صورة لـ|أريد صورة|اريد صورة لـ|اريد صورة|أريد رسم صورة لـ|أريد رسم صورة|أريد رسم|اريد رسم|صورة لـ|صورة عن|اعطني صورة|طلع لي صورة|draw a picture of|draw an image of|draw me a|draw me|draw|paint a picture of|paint me|paint|generate an image of|generate image of|generate image|create an image of|create image of|create image|illustration of|artwork of|picture of)[:\s]*/i, "")
        .trim();

      if (!cleanPrompt) cleanPrompt = text;

      // Smart aesthetic style detection based on keywords
      let selectedStyle = "سينمائي واقعي (Cinematic 8K)";
      if (/(ساحر|شرير|قلعة|ظلام|وحش|تنين|فانتازيا|أسطوري|dark|evil|wizard|witch|castle|dragon|fantasy|gothic|demon)/i.test(text)) {
        selectedStyle = "فانتازيا داكنة وسينمائية (Dark Fantasy 8K)";
      } else if (/(أنمي|مانغا|كرتون|رسوم متحركة|anime|manga)/i.test(text)) {
        selectedStyle = "أنمي فني ياباني (Anime Masterpiece)";
      } else if (/(رقمي|سريالي|خيال علمي|مستقبل|سايبربانك|cyberpunk|sci-fi|futuristic)/i.test(text)) {
        selectedStyle = "فن رقمي ثلاثي الأبعاد (3D Digital Art)";
      }

      setInput("");
      handleGenerateMedia({
        type: "image",
        prompt: cleanPrompt,
        aspectRatio: "16:9",
        style: selectedStyle,
        originalUserPrompt: text,
      });
      return;
    }

    if (isVideoDirectPrompt) {
      let cleanPrompt = text
        .replace(/^(يرجى\s+|من فضلك\s+|لو سمحت\s+|ممكن\s+|أرجو\s+|اريد منك\s+|أريد منك\s+|نريد\s+|قم بـ\s+|قم\s+)/i, "")
        .replace(/^(توليد فيديو لـ|توليد فيديو|ولد لي فيديو لـ|ولد لي فيديو|ولد فيديو لـ|ولد فيديو|انشئ فيديو لـ|انشئ فيديو|إنشاء فيديو لـ|إنشاء فيديو|فيديو متحرك لـ|فيديو متحرك|صمم فيديو لـ|صمم فيديو|اعمل فيديو لـ|اعمل فيديو|مقطع فيديو متحرك لـ|مقطع فيديو لـ|مقطع فيديو|generate video of|generate video|create video of|create video|make a video of|make a video|video of)[:\s]*/i, "")
        .trim();

      if (!cleanPrompt) cleanPrompt = text;

      // Smart video model detection from prompt
      let detectedModel = "veo-google";
      if (/\b(veo|فيو)\b/i.test(text)) {
        detectedModel = "veo-google";
      } else if (/\b(runway|رنواي|gen-?4|gen4)\b/i.test(text)) {
        detectedModel = "runway-gen4";
      } else if (/\b(luma|لوما|dream machine)\b/i.test(text)) {
        detectedModel = "luma-dream-machine";
      } else if (/\b(pika|بيكا)\b/i.test(text)) {
        detectedModel = "pika";
      } else if (/\b(pixverse|بيكس فيرس|بيكسفيرس)\b/i.test(text)) {
        detectedModel = "pixverse-ai";
      } else if (/\b(wan|وان|alibaba)\b/i.test(text)) {
        detectedModel = "wan-2-2-alibaba";
      } else if (/\b(hunyuan|هونيوان|tencent)\b/i.test(text)) {
        detectedModel = "hunyuan-video-tencent";
      }

      setInput("");
      handleGenerateMedia({
        type: "video",
        prompt: cleanPrompt,
        aspectRatio: "16:9",
        style: "حركي ديناميكي (Dynamic Motion)",
        videoModel: detectedModel,
        originalUserPrompt: text,
      });
      return;
    }

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `asst-${Date.now()}`;

    // Check if voice synthesis is explicitly requested or mentioned in the prompt
    const isVoiceExplicitQuery =
      /(اضف برامج الاصوات|برامج الاصوات|اصوات العلماء|اصوات المشاهير|اصوات الافلام الوثائيقية|اصوات الافلام الوثائقية|القدرة على الكلام|تكلم يا اوميغا|تحدث يا اوميغا|تكلم يا أوميغا|تحدث يا أوميغا|تكلم بصوت|تحدث بصوت|اقرأ بصوت|نطق بصوت|شغل صوت|voice programs|speak with omega|تحدث معي|تكلم معي|صوتك|تكلم)/i.test(text);

    let personaForThis = selectedPersonaId;
    if (/نيوتن|newton/i.test(text)) personaForThis = "newton";
    else if (/أينشتاين|اينشتاين|einstein/i.test(text)) personaForThis = "einstein";
    else if (/مورغان|فريمان|morgan/i.test(text)) personaForThis = "morgan-freeman";
    else if (/أتينبورو|ديفيد|attenborough/i.test(text)) personaForThis = "david-attenborough";
    else if (/وثائقي|ناشيونال|documentary/i.test(text)) personaForThis = "doc-arabic-fusha";
    else if (/تيسلا|تسلا|tesla/i.test(text)) personaForThis = "tesla";
    else if (/ابن الهيثم|هيثم/i.test(text)) personaForThis = "ibn-al-haytham";
    else if (/فاينمان|feynman/i.test(text)) personaForThis = "feynman";
    else if (/كوري|curie/i.test(text)) personaForThis = "curie";
    else if (/تايسون|tyson/i.test(text)) personaForThis = "neil-tyson";
    else if (/ساغان|sagan/i.test(text)) personaForThis = "carl-sagan";
    else if (/ستيف|جوبز|jobs/i.test(text)) personaForThis = "steve-jobs";

    if (personaForThis !== selectedPersonaId) {
      setSelectedPersonaId(personaForThis);
    }

    const userMsgContent = text || "يرجى تحليل وفحص المستندات المرفقة واستخلاص النتائج.";

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMessageId,
        role: "user",
        content: userMsgContent,
        attachments: currentAttachments.length > 0 ? [...currentAttachments] : undefined,
        timestamp: Date.now(),
      },
    ];

    setMessages([
      ...newMessages,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isFusing: true,
      },
    ]);

    setInput("");
    setAttachments([]);
    setIsProcessing(true);
    setCurrentStep("توجيه المجال المعرفي واختيار النماذج...");

    try {
      // Check if this is a live news, weather, or current events query where past physics/math memories must NOT be injected
      const isNewsOrLiveQuery = /\b(خبر|أخبار|اخبار|حدث|أحداث|طقس|الطقس|الجزائر|اليوم|الآن|عاجل|news|breaking|weather|today|now)\b/i.test(userMsgContent);

      let pastContext = "";
      let firestoreContext = "";

      if (!isNewsOrLiveQuery) {
        // Recall past context only for continuous ongoing topical discussions
        pastContext = findRelevantPastContext(userMsgContent, activeSessionId);
        try {
          const expRes = await fetch("/api/omega/experience/context", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: "user_main", question: userMsgContent }),
          });
          if (expRes.ok) {
            const expData = await expRes.json();
            if (expData.context) firestoreContext = expData.context;
          }
        } catch {}
      }

      // Build recent history for fusion
      const history = newMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      // If relevant past context exists, add it to history as a system note rather than polluting the raw user question
      if (pastContext || firestoreContext) {
        const memoryNotes = [
          pastContext ? `[ذاكرة سياقية من جلسات سابقة: ${pastContext}]` : "",
          firestoreContext ? `[معارف سابقة مسترجعة]:\n${firestoreContext}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");

        if (memoryNotes) {
          history.unshift({
            role: "system" as any,
            content: memoryNotes,
          });
        }
      }

      // Always pass the clean userMsgContent as the question so domain routing detects the true user intention
      const result = await fuseResponses(userMsgContent, history, {
        directThreshold: config.directThreshold,
        uncertainSpread: config.uncertainSpread,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        maxModelsPerDomain: config.maxModelsPerDomain,
        aggregatorModel: config.aggregatorModel,
        verifierModel: config.verifierModel,
        skipVerification: config.skipVerification,
        attachments: currentAttachments,
        searchGrounding: true,
        forceExploratoryMode: deepExplorationMode,
        onStepProgress: (_step, details) => {
          if (details) setCurrentStep(details);
        },
      });

      // Update Omega kernel, lineage, and real Firestore self-evolution
      globalOmegaKernel.absorb(userMsgContent, result.candidates, result.domain);
      globalOmegaLineage.recordStep(userMsgContent, result);

      try {
        const top = result.candidates[0];
        fetch("/api/omega/evolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "user_main",
            userMessage: userMsgContent,
            assistantResponse: result.finalText,
            domain: result.domain,
            topPsi: top?.psi ?? 0.8,
            verificationPassed: result.verification ? result.verification.verified : true,
            chosenModelId: result.chosenModelId,
            candidatesCount: result.candidates.length,
            spread: result.telemetry?.spread ?? 0.1,
          }),
        }).catch(() => {});
      } catch {}

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: result.finalText,
                fusionResult: result,
                isFusing: false,
              }
            : msg
        )
      );

      // Trigger voice speech playback if auto-speak or voice explicit query
      if ((autoSpeakResponses || isVoiceExplicitQuery) && result.finalText) {
        setCurrentSpeakingMessageId(assistantMessageId);
        speakWithOmega(result.finalText, {
          personaId: personaForThis,
          rate: speedMultiplier,
          onEnd: () => setCurrentSpeakingMessageId(null),
          onError: () => setCurrentSpeakingMessageId(null),
        });
      }
    } catch (err: any) {
      console.error("Fusion error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `حدث تعذر أثناء معالجة الاندماج التوافقي: ${err.message || "خطأ غير متوقع"}. تم التحويل التلقائي للنواة الاحتياطية.`,
                isFusing: false,
              }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
      setCurrentStep("");
    }
  };

  const handleSaveToMemory = (result: FusionResult, topic: string) => {
    globalOmegaMemory.add(
      topic.slice(0, 60),
      result.finalText,
      result.domain,
      result.candidates[0]?.psi || 0.9,
      [result.domain, result.mode, "omega-fusion"]
    );
    setSavedMemorySuccess(topic);
    setTimeout(() => setSavedMemorySuccess(null), 3000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] max-w-6xl mx-auto w-full px-2 sm:px-4 py-2">
      {/* Top Session & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-2 bg-slate-900/80 border border-slate-800 rounded-xl mb-2 text-xs">
        <div className="flex items-center gap-2 shrink-0">
          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-sm transition-all cursor-pointer shrink-0"
            title="بدء صفحة محادثة جديدة"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="font-semibold">محادثة جديدة</span>
          </button>

          {/* Chat History Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 border border-slate-700"
            title="استعراض سجل المحادثات السابقة"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>السجل</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] text-slate-300 font-mono">
              {sessions.length}
            </span>
          </button>

          {/* Current Session Title */}
          <div className="text-slate-400 text-xs truncate hidden lg:block border-r border-slate-800 pr-2 mr-1 max-w-[200px]">
            <span className="text-slate-500">الجلسة:</span>{" "}
            <span className="text-slate-200 font-medium">{activeSession?.title || "محادثة أوميغا"}</span>
          </div>
        </div>

        {/* Voice & Media Studio Triggers */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          {/* Omega Voice Hub Trigger */}
          <button
            type="button"
            onClick={() => setIsVoiceDropdownOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold shadow transition-all cursor-pointer shrink-0 border ${
              isVoiceActive
                ? "bg-emerald-950/90 border-emerald-500 text-emerald-200 ring-1 ring-emerald-400/50 shadow-emerald-900/40"
                : isVoiceDropdownOpen
                ? "bg-purple-900/60 border-purple-500 text-purple-200"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
            title="التحكم في صوت أوميغا: العلماء، المشاهير، الأفلام الوثائقية"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">صوت أوميغا:</span>
            <span className="text-emerald-300 font-bold truncate max-w-[100px]">
              {currentPersona.nameAr}
            </span>
            {isVoiceActive ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            ) : autoSpeakResponses ? (
              <span className="text-[10px] px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                تلقائي
              </span>
            ) : null}
          </button>

          {/* Interactive Physics Sandbox Trigger */}
          <button
            type="button"
            onClick={() => setShowInteractiveLab((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
              showInteractiveLab
                ? "bg-cyan-950 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40"
                : "bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700"
            }`}
            title="فتح مختبر الفيزياء التفاعلي والرسوم البيانية اللحظية للسقوط الحر"
          >
            <Atom className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">مختبر الفيزياء</span>
          </button>

          {/* Tree of Thought Reasoning Engine Trigger */}
          <button
            type="button"
            onClick={() => setShowTreeOfThought(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
              showTreeOfThought
                ? "bg-purple-950 border-purple-400 text-purple-200 ring-1 ring-purple-400/40"
                : "bg-slate-800 hover:bg-slate-700 text-purple-300 border-slate-700"
            }`}
            title="شجرة التفكير والاستنتاج العلمي متعدد المسارات (Tree of Thought)"
          >
            <GitBranch className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">شجرة الاستدلال</span>
          </button>

          {/* Deep Exploration Mode (Open Problem & Hypothesis Engine) Trigger */}
          <button
            type="button"
            onClick={() => setDeepExplorationMode((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
              deepExplorationMode
                ? "bg-indigo-950/90 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400/50 shadow-indigo-900/40"
                : "bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700"
            }`}
            title="تفعيل وضع الاستدلال الاستكشافي ونواة توليد الفرضيات والتفنيد الذاتي للمسائل المفتوحة"
          >
            <Compass className={`w-3.5 h-3.5 text-indigo-400 ${deepExplorationMode ? "animate-spin-slow" : ""}`} />
            <span className="hidden sm:inline">الاستكشاف العميق:</span>
            <span className={`font-mono text-[11px] ${deepExplorationMode ? "text-amber-300 font-bold" : "text-slate-400"}`}>
              {deepExplorationMode ? "مفعّل" : "تلقائي"}
            </span>
          </button>

          {/* Omega Notebooks Trigger */}
          <button
            type="button"
            onClick={() => setShowNotebookModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
              showNotebookModal
                ? "bg-amber-950 border-amber-400 text-amber-200 ring-1 ring-amber-400/40"
                : "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700"
            }`}
            title="دفاتر المحاضرات العلمية وشرائح العرض التفاعلية (Omega Notebooks)"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">دفاتر المحاضرات</span>
          </button>

          {/* Omega Code & Simulation Sandbox Trigger */}
          <button
            type="button"
            onClick={() => setShowCodeSandbox(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
              showCodeSandbox
                ? "bg-emerald-950 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/40"
                : "bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700"
            }`}
            title="منصة تشغيل الأكواد والحل العددي الرياضي (Code Sandbox)"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">منصة الأكواد</span>
          </button>

          {/* Live Voice Interaction Room Trigger */}
          <button
            type="button"
            onClick={() => setShowLiveVoiceModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
              showLiveVoiceModal
                ? "bg-cyan-950 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40 shadow-cyan-950/60"
                : "bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700"
            }`}
            title="بدء تفاعل صوتي مباشر مع أوميغا عبر الميكروفون مع تحليل التردد الصوتي الحي"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">تفاعل صوتي مباشر</span>
            <span className="sm:hidden">صوت حي</span>
          </button>

          {/* 3D Professor Omega Avatar Trigger */}
          <button
            type="button"
            onClick={() => setShowProfessor3D((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
              showProfessor3D
                ? "bg-cyan-950/90 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40 shadow-cyan-950/60"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
            title="إظهار / إخفاء شخصية البروفيسور أوميغا ثلاثية الأبعاد المتحركة"
          >
            <span className="text-sm">👨‍🔬</span>
            <span className="hidden sm:inline">البروفيسور 3D</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </button>

          {/* Media Generation Studio Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsMediaModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium shadow transition-all cursor-pointer shrink-0"
            title="توليد الوسائط والأصوات بالذكاء الاصطناعي"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">استوديو الوسائط</span>
            <span className="sm:hidden">استوديو</span>
          </button>
        </div>
      </div>

      {/* Quick Voice Hub Popover Panel */}
      {isVoiceDropdownOpen && (
        <div
          dir="rtl"
          className="bg-slate-900/95 border border-purple-500/30 rounded-xl p-3 mb-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 text-xs text-slate-200"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm border shadow-inner"
                style={{
                  backgroundColor: `${currentPersona.accentColor}20`,
                  borderColor: currentPersona.accentColor,
                }}
              >
                {currentPersona.avatarEmoji}
              </div>
              <div>
                <span className="font-bold text-white ml-2">{currentPersona.nameAr}</span>
                <span className="text-slate-400 text-[11px]">{currentPersona.titleAr}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Test Voice Button */}
              <button
                type="button"
                onClick={() => {
                  if (isVoiceActive) {
                    stopSpeaking();
                  } else {
                    speakWithOmega(currentPersona.sampleQuoteAr, {
                      personaId: currentPersona.id,
                      rate: speedMultiplier,
                    });
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                  isVoiceActive
                    ? "bg-purple-950 border-purple-500 text-purple-200 animate-pulse"
                    : "bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30"
                }`}
              >
                {isVoiceActive ? (
                  <>
                    <Square className="w-3 h-3 text-purple-400 fill-purple-400" />
                    <span>إيقاف المعاينة</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    <span>تجربة نبرة الصوت</span>
                  </>
                )}
              </button>

              {/* Close panel */}
              <button
                type="button"
                onClick={() => setIsVoiceDropdownOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 pt-2.5 pb-2">
            {[
              { id: "scientists" as VoiceCategory, label: "🔬 أصوات العلماء", count: 6 },
              { id: "celebrities" as VoiceCategory, label: "🌟 المشاهير والرواد", count: 5 },
              { id: "documentary" as VoiceCategory, label: "🌍 الرواة والوثائقيات", count: 4 },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setVoiceCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  voiceCategoryFilter === cat.id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Personas Horizontal Scroll / Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-1">
            {OMEGA_VOICE_PERSONAS.filter((p) => p.category === voiceCategoryFilter).map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => {
                  setSelectedPersonaId(persona.id);
                  speakWithOmega(`مرحباً بك، أنا ${persona.nameAr}.`, {
                    personaId: persona.id,
                    rate: speedMultiplier,
                  });
                }}
                className={`flex items-center gap-2 p-2 rounded-lg border text-right transition-all cursor-pointer ${
                  selectedPersonaId === persona.id
                    ? "bg-purple-950/80 border-purple-400/80 text-white ring-1 ring-purple-400/40"
                    : "bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700"
                }`}
              >
                <span className="text-lg">{persona.avatarEmoji}</span>
                <div className="truncate flex-1 min-w-0">
                  <div className="font-semibold text-xs truncate">{persona.nameAr}</div>
                  <div className="text-[10px] text-slate-400 truncate">{persona.titleAr}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Bottom Settings: Auto-Speak toggle & Speed selector & Full Studio link */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 mt-2 border-t border-slate-800">
            {/* Auto-Speak Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-[11px]">
              <input
                type="checkbox"
                checked={autoSpeakResponses}
                onChange={(e) => setAutoSpeakResponses(e.target.checked)}
                className="w-3.5 h-3.5 text-purple-600 rounded bg-slate-800 border-slate-700 focus:ring-purple-500 cursor-pointer"
              />
              <span className="font-medium text-slate-200">
                قراءة جميع ردود أوميغا صوتياً وتلقائياً
              </span>
            </label>

            {/* Speed selection */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400">السرعة:</span>
              {[0.8, 1.0, 1.25, 1.5].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setSpeedMultiplier(speed)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                    speedMultiplier === speed
                      ? "bg-purple-600 text-white font-bold"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Launch Full Studio */}
            <button
              type="button"
              onClick={() => {
                setIsVoiceDropdownOpen(false);
                setIsMediaModalOpen(true);
              }}
              className="text-[11px] text-pink-400 hover:text-pink-300 underline font-medium cursor-pointer"
            >
              فتح استوديو الأصوات المتقدم (6 محركات) ↗
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1 pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`flex items-start gap-3 max-w-full sm:max-w-[88%] ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  msg.role === "user"
                    ? "bg-purple-950 border-purple-500/40 text-purple-300"
                    : "bg-slate-900 border-slate-700 text-cyan-400"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 space-y-2 overflow-hidden">
                {/* User Attachments Display */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <span className="max-w-[150px] truncate">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "bg-purple-600/90 text-white rounded-tr-none shadow-md shadow-purple-900/30 font-medium"
                      : "bg-slate-900/90 text-slate-100 rounded-tl-none border border-slate-800 shadow-xl"
                  }`}
                >
                  {/* Generated Media Payload Display (Images & Videos) */}
                  {msg.mediaPayload && (
                    <div className="mb-3 space-y-2">
                      {msg.mediaPayload.type === "image" && msg.mediaPayload.url && (
                        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 p-2">
                          <div className="relative group rounded-lg overflow-hidden">
                            <img
                              src={msg.mediaPayload.url}
                              alt={msg.mediaPayload.prompt}
                              className="w-full max-h-96 object-contain rounded-lg bg-black/40"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                              <span className="text-xs text-slate-200 line-clamp-1">
                                {msg.mediaPayload.prompt}
                              </span>
                              <a
                                href={msg.mediaPayload.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download="omega_generated_image.jpg"
                                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shrink-0 flex items-center gap-1 shadow cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                <span>تحميل</span>
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
                            <span>
                              الأسلوب: {msg.mediaPayload.style || "سينمائي"} • الأبعاد:{" "}
                              {msg.mediaPayload.aspectRatio || "16:9"}
                            </span>
                            <span className="text-purple-300 font-mono">Omega Visual Engine</span>
                          </div>
                        </div>
                      )}

                      {(msg.mediaPayload.type === "video" || msg.mediaPayload.type === "pipeline") && (
                        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-1">
                          <OmegaVideoPlayer
                            prompt={msg.mediaPayload.prompt}
                            videoData={msg.mediaPayload.videoData}
                          />

                          {/* Pipeline Visual Storyboard Strip */}
                          {msg.mediaPayload.pipelineData?.storyboard &&
                            msg.mediaPayload.pipelineData.storyboard.length > 0 && (
                              <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 mt-1 rounded-b-lg">
                                <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-2">
                                  <div className="flex items-center gap-1.5 text-purple-300">
                                    <Workflow className="w-3.5 h-3.5 text-purple-400" />
                                    <span>لوحة مشاهد خط الإنتاج البصري (Visual Storyboard):</span>
                                  </div>
                                  <span className="text-[10px] text-cyan-400 font-mono">
                                    {msg.mediaPayload.pipelineData.storyboard.length} مشاهد مسلسلة
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  {msg.mediaPayload.pipelineData.storyboard.map(
                                    (sc: any, idx: number) => (
                                      <div
                                        key={sc.sceneId || idx}
                                        className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex flex-col group"
                                      >
                                        <div className="relative aspect-video overflow-hidden bg-black/60">
                                          <img
                                            src={sc.imageUrl}
                                            alt={sc.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            referrerPolicy="no-referrer"
                                          />
                                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] text-slate-200 font-mono">
                                            المشهد {idx + 1}
                                          </span>
                                        </div>
                                        <div className="p-1.5 text-[10px] text-slate-300 font-medium truncate">
                                          {sc.title}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Quick Trigger for Interactive Sandbox & Live Kinematics */}
                          <div className="flex items-center justify-between px-3 py-2 bg-cyan-950/40 border-t border-cyan-500/30 rounded-b-lg">
                            <span className="text-[11px] text-cyan-300 flex items-center gap-1.5 font-medium">
                              <Atom className="w-3.5 h-3.5 text-cyan-400" />
                              <span>هل تريد تجربة السقوط وتغيير الجاذبية والكتلة بنفسك؟</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowInteractiveLab(true)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow"
                            >
                              <Sliders className="w-3 h-3" />
                              <span>فتح المختبر التفاعلي والرسوم البيانية</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main text content with Math & Chart Renderer */}
                  {msg.isFusing ? (
                    <div className="py-2">
                      <SignalMeter isProcessing={true} stepDetails={currentStep} />
                    </div>
                  ) : (
                    <>
                      {/* Prominent Multi-Server Synergy Header */}
                      {msg.fusionResult && msg.fusionResult.candidates && msg.fusionResult.candidates.length > 0 && (
                        <div className="mb-3 pb-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold bg-purple-950/70 border border-purple-500/40 text-purple-300">
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              <span>الخوادم المساهمة ({msg.fusionResult.candidates.length}):</span>
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {msg.fusionResult.candidates.map((c, i) => {
                                const isQwen = c.modelId.includes("qwen");
                                const isLlama = c.modelId.includes("llama");
                                const isGemini = c.modelId.includes("gemini");
                                const isClaude = c.modelId.includes("claude");
                                const isGpt = c.modelId.includes("gpt");
                                const isDeepseek = c.modelId.includes("deepseek");

                                const label = isQwen
                                  ? "Qwen 2.5 72B"
                                  : isLlama
                                  ? "Llama 3.3 70B"
                                  : isGemini
                                  ? "Gemini 3.8"
                                  : isClaude
                                  ? "Claude 3.5"
                                  : isGpt
                                  ? "GPT-4o"
                                  : isDeepseek
                                  ? "DeepSeek R1"
                                  : c.modelId;

                                const badgeColor = isQwen
                                  ? "bg-violet-950/80 text-violet-300 border-violet-500/50 shadow-sm shadow-violet-900/20"
                                  : isLlama
                                  ? "bg-indigo-950/80 text-indigo-300 border-indigo-500/50 shadow-sm shadow-indigo-900/20"
                                  : isGemini
                                  ? "bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-900/20"
                                  : isClaude
                                  ? "bg-orange-950/80 text-orange-300 border-orange-500/50"
                                  : isGpt
                                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                                  : isDeepseek
                                  ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50"
                                  : "bg-slate-800 text-slate-300 border-slate-700";

                                return (
                                  <span
                                    key={i}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-mono border ${badgeColor}`}
                                    title={`خادم حي متصل: توافق دلالي Ψ = ${(c.psi * 100).toFixed(0)}%`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {label}
                                    <span className="text-[10px] opacity-75">({(c.psi * 100).toFixed(0)}%)</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          {msg.fusionResult.chosenModelId && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              حسم الإجماع:{" "}
                              <strong className="text-cyan-300 font-semibold">
                                {msg.fusionResult.chosenModelId.includes("qwen")
                                  ? "Qwen 2.5 72B"
                                  : msg.fusionResult.chosenModelId.includes("llama")
                                  ? "Meta Llama 3.3"
                                  : msg.fusionResult.chosenModelId.includes("gemini")
                                  ? "Gemini 3.8 Flash"
                                  : msg.fusionResult.chosenModelId}
                              </strong>
                            </span>
                          )}
                        </div>
                      )}
                      <MathRenderer content={msg.content} />
                    </>
                  )}
                </div>

                {/* Assistant Actions Bar: Copy Answer & Speak with Omega Voice */}
                {msg.role === "assistant" && !msg.isFusing && (
                  <div className="flex items-center flex-wrap gap-2 pt-1 px-1">
                    {/* Speak / Listen with Omega Voice */}
                    <button
                      type="button"
                      onClick={() => {
                        if (currentSpeakingMessageId === msg.id && isVoiceActive) {
                          stopSpeaking();
                          setCurrentSpeakingMessageId(null);
                        } else {
                          setCurrentSpeakingMessageId(msg.id);
                          speakWithOmega(msg.content, {
                            personaId: selectedPersonaId,
                            rate: speedMultiplier,
                            onEnd: () => setCurrentSpeakingMessageId(null),
                            onError: () => setCurrentSpeakingMessageId(null),
                          });
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border shadow-sm ${
                        currentSpeakingMessageId === msg.id && isVoiceActive
                          ? "bg-purple-950/90 border-purple-500 text-purple-200 ring-1 ring-purple-400/50 shadow-purple-900/30 animate-pulse"
                          : "bg-slate-900/80 border-slate-800 text-slate-300 hover:text-emerald-300 hover:bg-slate-800/90 hover:border-slate-700"
                      }`}
                      title="استماع للإجابة بصوت أوميغا والشخصية المختارة"
                    >
                      {currentSpeakingMessageId === msg.id && isVoiceActive ? (
                        <>
                          <Square className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                          <span>إيقاف القراءة</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>استماع بالصوت ({currentPersona.avatarEmoji} {currentPersona.nameAr})</span>
                        </>
                      )}
                    </button>

                    {/* Download Audio File (WAV) */}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const { blob, filename } = await synthesizeSpeechToWavBlob(msg.content, {
                            personaId: selectedPersonaId,
                            speed: speedMultiplier,
                          });
                          triggerAudioFileDownload(blob, filename);
                        } catch (err) {
                          console.error("[Download Message Audio Error]:", err);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border shadow-sm bg-purple-950/70 border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-900"
                      title="تحميل نطق هذه الإجابة كملف صوتي حقيقي (WAV)"
                    >
                      <Download className="w-3.5 h-3.5 text-purple-400" />
                      <span>تحميل ملف الصوت (WAV)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border shadow-sm ${
                        copiedId === msg.id
                          ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-emerald-900/30"
                          : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/90 hover:border-slate-700"
                      }`}
                      title="نسخ الإجابة كاملة إلى الحافظة"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تم نسخ الإجابة بنجاح!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الإجابة</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* User Actions Bar: Copy Query */}
                {msg.role === "user" && (
                  <div className="flex justify-end pt-0.5 px-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                        copiedId === msg.id
                          ? "text-emerald-300 font-medium"
                          : "text-purple-300/60 hover:text-purple-200"
                      }`}
                      title="نسخ نص السؤال"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Fusion Result Telemetry and Candidate Accordion */}
                {msg.fusionResult && !msg.isFusing && (
                  <div className="space-y-2.5 mt-2">
                    {/* Deep Exploration Hypothesis Engine Card */}
                    {msg.fusionResult.exploratoryData && (
                      <SafeBoundary>
                        <ExploratoryReasoningCard
                          data={msg.fusionResult.exploratoryData}
                          onOpenTreeOfThought={() => {
                            const userQ =
                              messages.find((m, i) => i === messages.indexOf(msg) - 1)?.content ||
                              "استكشاف المسألة المفتوحة";
                            const thoughtCase = createThoughtTreeFromFusion(userQ, msg.fusionResult!);
                            setActiveThoughtCase(thoughtCase);
                            setShowTreeOfThought(true);
                          }}
                        />
                      </SafeBoundary>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <SafeBoundary>
                        <SignalMeter result={msg.fusionResult} />
                      </SafeBoundary>
                      <button
                        type="button"
                        onClick={() => {
                          const userQ =
                            messages.find((m, i) => i === messages.indexOf(msg) - 1)?.content ||
                            "استنتاج أوميغا";
                          const thoughtCase = createThoughtTreeFromFusion(userQ, msg.fusionResult!);
                          setActiveThoughtCase(thoughtCase);
                          setShowTreeOfThought(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-500/40 text-purple-200 hover:bg-purple-900/80 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                        title="تتبع مسارات الاستدلال والتحقق من الفرضيات (Tree of Thought)"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                        <span>شجرة الاستدلال</span>
                      </button>
                    </div>

                    {/* Candidate Inspection Accordion */}
                    <div className="border border-slate-800/80 rounded-xl bg-slate-950/40 overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCandidateId(
                            expandedCandidateId === msg.id ? null : msg.id
                          )
                        }
                        className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          المساهمات التكاملية للخوادم ({msg.fusionResult.candidates.length} خوادم تآزرية)
                        </span>
                        {expandedCandidateId === msg.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {expandedCandidateId === msg.id && (
                        <div className="p-3 border-t border-slate-800/60 space-y-2.5 bg-slate-950/80">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>
                              <strong>ميثاق التكامل لأوميغا:</strong> تعمل هذه الخوادم بتناغم تام كفريق استشاري تخصصي، حيث يقوم أوميغا كالعقل الإنساني الحصيف باستنتاج الإجابة القطعية الشاملة دون أي صراع بين النماذج.
                            </span>
                          </div>

                          {msg.fusionResult.candidates.map((cand, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1.5"
                            >
                              <div className="flex items-center justify-between font-mono text-[11px] text-slate-300">
                                <span className="font-bold text-cyan-400">
                                  {cand.modelId}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-purple-300">
                                    معامل التوافق Ψ: {cand.psi.toFixed(3)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(cand.text, `${msg.id}-cand-${idx}`)}
                                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                                    title="نسخ إجابة هذا النموذج"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="text-slate-300 text-[11px] leading-relaxed">
                                <MathRenderer content={cand.text} />
                              </div>
                            </div>
                          ))}

                          {/* Verification details */}
                          {msg.fusionResult.verification && (
                            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <div className="font-semibold text-slate-300 text-[11px]">
                                  تدقيق التحقق الذاتي (Self-Verification Critique):
                                </div>
                                <div className="text-slate-400 text-[11px] leading-relaxed">
                                  {msg.fusionResult.verification.critique}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action links */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => {
                                const userQ =
                                  messages.find((m, i) => i === messages.indexOf(msg) - 1)?.content ||
                                  "استنتاج أوميغا";
                                const thoughtCase = createThoughtTreeFromFusion(userQ, msg.fusionResult!);
                                setActiveThoughtCase(thoughtCase);
                                setShowTreeOfThought(true);
                              }}
                              className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                              title="تتبع مسارات الاستدلال والفرضيات (Tree of Thought Visualizer)"
                            >
                              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                              <span>فحص شجرة الاستدلال (Tree of Thought)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleSaveToMemory(
                                  msg.fusionResult!,
                                  messages.find((m, i) => i === messages.indexOf(msg) - 1)?.content ||
                                    "استنتاج أوميغا"
                                )
                              }
                              className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                            >
                              <BookmarkPlus className="w-3.5 h-3.5" />
                              {savedMemorySuccess ? "تم الحفظ في الذاكرة بنجاح!" : "حفظ في الذاكرة المعرفية"}
                            </button>

                            {onOpenKernelWithResult && (
                              <button
                                type="button"
                                onClick={() => onOpenKernelWithResult(msg.fusionResult!)}
                                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                              >
                                <Brain className="w-3.5 h-3.5" />
                                فحص في مختبر نواة الحالة (Kernel Lab)
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggested prompts pills */}
      {messages.length <= 2 && (
        <div className="py-2">
          <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              نماذج استعلام سريعة للقدرات المتقدمة:
            </span>
            {onOpenOptimizer && (
              <button
                type="button"
                onClick={onOpenOptimizer}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-purple-400 text-[11px] cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                معايرة المعاملات (Thresholds)
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {SAMPLE_PROMPTS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(p.prompt)}
                  disabled={isProcessing}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-purple-500/40 text-right transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-purple-950/80 text-purple-400 shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">
                      {p.label}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {p.prompt}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK CAPABILITY TOOLBAR */}
      <div className="flex items-center gap-1.5 py-1.5 overflow-x-auto border-t border-slate-800/60 text-xs">
        <span className="text-[11px] text-slate-500 shrink-0 font-medium ml-1">أدوات أوميغا:</span>

        {/* Complex Operations Lab Trigger */}
        <button
          type="button"
          onClick={() => setShowComplexLabModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 hover:text-white transition-colors shrink-0 cursor-pointer shadow-sm"
          title="مختبر العمليات المعقدة: مصفوفات، كولاتز، نسبية، وميكانيكا الكم"
        >
          <Sigma className="w-3.5 h-3.5 text-purple-400" />
          <span>العمليات المعقدة</span>
        </button>

        {/* Media Router & Multi-Provider Manager Trigger */}
        <button
          type="button"
          onClick={() => setShowProviderManagerModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 hover:text-white transition-colors shrink-0 cursor-pointer shadow-sm"
          title="إدارة موجه وسائط الذكاء الاصطناعي (fal.ai, Replicate, Hugging Face, Together AI)"
        >
          <Server className="w-3.5 h-3.5 text-indigo-400" />
          <span>موجه الوسائط والمزودين</span>
        </button>

        {/* Real GPU & Local Engine Bridge Trigger */}
        <button
          type="button"
          onClick={() => setShowEngineBridgeModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 hover:text-white transition-colors shrink-0 cursor-pointer shadow-sm"
          title="ربط وفحص الخوادم والعتاد المحلي الحقيقي (Ollama, ComfyUI, vLLM)"
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>جسر العتاد (Ollama/GPU)</span>
        </button>

        {/* Real-time Voice Interaction Room Trigger */}
        <button
          type="button"
          onClick={() => setShowLiveVoiceModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/50 text-cyan-200 hover:text-white transition-colors shrink-0 cursor-pointer shadow-sm"
          title="تحدث مباشرة مع أوميغا بالصوت مع شاشة الترددات"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>تحدث بالصوت مباشرة</span>
        </button>

        {/* Media Generation Studio Trigger */}
        <button
          type="button"
          onClick={() => setIsMediaModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900/90 border border-purple-500/40 text-purple-200 hover:text-white transition-colors shrink-0 cursor-pointer shadow-sm"
        >
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span>توليد صور وفيديو</span>
        </button>

        {/* Interactive Chart Generator Trigger */}
        <button
          type="button"
          onClick={() =>
            handleSend(
              "أنشئ مخططاً بيانياً تفاعلياً (Chart) يوضح مقارنة إحصائية تفصيلية بالأعمدة ونسب الإنجاز والمؤشرات الرئيسية."
            )
          }
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors shrink-0 cursor-pointer"
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>مخطط بياني (Chart)</span>
        </button>

        <button
          type="button"
          onClick={() => openCapability("datetime")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors shrink-0 cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>التاريخ والوقت</span>
        </button>

        <button
          type="button"
          onClick={() => openCapability("weather")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition-colors shrink-0 cursor-pointer"
        >
          <CloudSun className="w-3.5 h-3.5 text-amber-400" />
          <span>الطقس المباشر</span>
        </button>

        <button
          type="button"
          onClick={() => openCapability("news")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition-colors shrink-0 cursor-pointer"
        >
          <Newspaper className="w-3.5 h-3.5 text-emerald-400" />
          <span>الأخبار العالمية</span>
        </button>

        <button
          type="button"
          onClick={() => openCapability("social")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/40 text-slate-300 hover:text-pink-300 transition-colors shrink-0 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-pink-400" />
          <span>يوتيوب والتواصل</span>
        </button>

        <button
          type="button"
          onClick={() => openCapability("latex")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 transition-colors shrink-0 cursor-pointer"
        >
          <Sigma className="w-3.5 h-3.5 text-indigo-400" />
          <span>قوالب معادلات LaTeX</span>
        </button>
      </div>

      {/* Input Box with Attachment Support */}
      <div className="relative mt-1">
        {/* Dynamic Exploratory Notification Banner */}
        {(deepExplorationMode || (input.trim() && isOpenProblemQuery(input))) && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-amber-950/40 border border-indigo-500/40 rounded-xl mb-2 text-[11px] text-indigo-200 shadow-md">
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow shrink-0" />
              <span>
                <strong>وضع الاستدلال الاستكشافي نشط:</strong> سيتم تحليل المسألة متعددة المسارات، تشغيل المحاكاة الرمزية، وتوليد الفرضيات المقاومة للتفنيد الذاتي وحساب Ψ_explore.
              </span>
            </div>
            <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] shrink-0">
              Open Problem Engine
            </span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (chatVoice.isListening) {
              chatVoice.stopListening();
            }
            handleSend();
          }}
          className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30 overflow-hidden"
        >
          {/* Active Microphone Audio Frequency Visualizer Header */}
          {chatVoice.isListening && (
            <div className="flex flex-col gap-1.5 p-3 bg-slate-950/95 border-b border-cyan-500/40 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>أوميغا يستمع إليك مباشرة عبر الميكروفون...</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-mono">
                    تحليل الترددات الحية
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      chatVoice.stopListening();
                      if (input.trim()) {
                        handleSend();
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Send className="w-3 h-3" />
                    <span>إرسال فوري</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => chatVoice.stopListening()}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>

              {/* Real-time Frequency Spectrum Visualizer */}
              <AudioFrequencyVisualizer
                engine={chatVoice.frequencyEngine}
                isActive={chatVoice.isListening}
                mode="bars"
                height={46}
                barCount={32}
                accentTheme="cyan"
                showMetrics={true}
              />
            </div>
          )}

          {/* Main Input Row */}
          <div className="flex items-center w-full">
            {/* Attachment Button */}
            <div className="pr-2 pl-1">
              <AttachmentPicker
                attachments={attachments}
                onAddAttachment={handleAddAttachment}
                onRemoveAttachment={handleRemoveAttachment}
                disabled={isProcessing}
              />
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              placeholder={
                chatVoice.isListening
                  ? "تحدث الآن بوضوح في الميكروفون..."
                  : isProcessing
                  ? "جاري معالجة إجماع أوميغا عبر الخوادم..."
                  : "تكلم مع أوميغا بالصوت مباشرة أو اكتب مسألة علمية، صورة، معادلات، أو اطلب فيديو..."
              }
              className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-60"
            />

            <div className="flex items-center gap-1.5 pl-2 pr-3">
              {/* Direct Microphone Button */}
              <button
                type="button"
                onClick={() => {
                  if (chatVoice.isListening) {
                    chatVoice.stopListening();
                  } else {
                    chatVoice.startListening();
                  }
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer border ${
                  chatVoice.isListening
                    ? "bg-red-600 hover:bg-red-500 text-white border-red-400 animate-pulse ring-2 ring-red-400/50 shadow-lg shadow-red-950/60"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border-slate-700"
                }`}
                title={
                  chatVoice.isListening
                    ? "إيقاف الاستماع الصوتي"
                    : "تحدث مع أوميغا مباشرة عبر الميكروفون مع مؤشر التردد الصوتي"
                }
              >
                {chatVoice.isListening ? (
                  <MicOff className="w-4 h-4 text-white" />
                ) : (
                  <Mic className="w-4 h-4 text-cyan-400" />
                )}
              </button>

              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isProcessing}
                className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between mt-1.5 px-2 text-[10px] text-slate-500 font-mono">
          <span>
            عتبة الإجماع: Ψ ≥ {config.directThreshold} | فارق الحيرة: ≤ {config.uncertainSpread}
          </span>
          <span>توليد أصوات العلماء والمشاهير والوثائقيات • خط إنتاج الفيديوهات العلمية • صور ومخططات</span>
        </div>
      </div>

      {/* Persistent Floating Omega Voice Synthesizer Player */}
      <OmegaVoicePlayer
        currentPersonaId={selectedPersonaId}
        onSelectPersona={(id) => setSelectedPersonaId(id)}
        speedMultiplier={speedMultiplier}
        onChangeSpeed={(speed) => setSpeedMultiplier(speed)}
        autoSpeak={autoSpeakResponses}
        onToggleAutoSpeak={() => setAutoSpeakResponses((prev) => !prev)}
      />

      {/* Advanced Capabilities Modal */}
      <OmegaCapabilityModal
        isOpen={isCapabilityModalOpen}
        activeTab={activeCapabilityTab}
        onClose={() => setIsCapabilityModalOpen(false)}
        onSelectTab={(tab) => setActiveCapabilityTab(tab)}
        onInjectPrompt={(text) => setInput(text)}
        onSendDirectly={(text) => handleSend(text)}
      />

      {/* Generative Media Studio Modal */}
      <OmegaMediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSubmit={handleGenerateMedia}
        onGenerate={handleGenerateMedia}
      />

      {/* Chat History & Previous Conversations Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAll={handleClearAllSessions}
      />

      {/* 3D Animated Professor Omega Avatar */}
      {showProfessor3D && (
        <OmegaProfessor3D
          currentContext={currentStep}
          isProcessing={isProcessing}
          isFloating={isProfessorFloating}
          onCloseFloating={() => setShowProfessor3D(false)}
          onSendMessage={(txt) => {
            setInput(txt);
            handleSend(txt);
          }}
        />
      )}

      {/* Interactive Physics Sandbox Modal */}
      {showInteractiveLab && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-950 border border-cyan-500/50 shadow-2xl p-2 sm:p-4">
            <button
              type="button"
              onClick={() => setShowInteractiveLab(false)}
              className="absolute top-4 left-4 z-20 p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="إغلاق المختبر"
            >
              <X className="w-4 h-4" />
            </button>
            <InteractivePhysicsLab />
          </div>
        </div>
      )}

      {/* Tree of Thought Reasoning Visualizer Modal */}
      {showTreeOfThought && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-950 border border-purple-500/50 shadow-2xl p-2 sm:p-4">
            <TreeOfThoughtVisualizer
              customCase={activeThoughtCase}
              onClose={() => {
                setShowTreeOfThought(false);
                setActiveThoughtCase(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Omega Scientific Notebook Presentation Modal */}
      <OmegaNotebookModal
        isOpen={showNotebookModal}
        onClose={() => setShowNotebookModal(false)}
      />

      {/* Omega Code & Simulation Sandbox Modal */}
      {showCodeSandbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-950 border border-emerald-500/50 shadow-2xl p-2 sm:p-4">
            <OmegaCodeSandbox onClose={() => setShowCodeSandbox(false)} />
          </div>
        </div>
      )}

      {/* Complex Operations Laboratory Modal */}
      {showComplexLabModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-950 border border-purple-500/50 shadow-2xl p-2 sm:p-4">
            <ComplexOperationsLab onClose={() => setShowComplexLabModal(false)} />
          </div>
        </div>
      )}

      {/* Real Local GPU & Engine Connector Modal */}
      <RealEngineConnectorModal
        isOpen={showEngineBridgeModal}
        onClose={() => setShowEngineBridgeModal(false)}
      />

      {/* Media Router & Multi-Provider Manager Modal */}
      {showProviderManagerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-950 border border-purple-500/50 shadow-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">استوديو توجيه الوسائط وإدارة المزودين (Media Router & Provider Manager)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProviderManagerModal(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <OmegaProviderManagerTab />
          </div>
        </div>
      )}

      {/* Real-Time Live Voice Interaction Room with Audio Frequency Visualizer */}
      <LiveVoiceInteractionModal
        isOpen={showLiveVoiceModal}
        onClose={() => setShowLiveVoiceModal(false)}
        onSendMessage={(text) => handleSend(text)}
        initialPersonaId={selectedPersonaId}
      />
    </div>
  );
};
