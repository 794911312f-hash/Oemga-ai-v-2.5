import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Download,
  Film,
  Sparkles,
  Cpu,
  Video,
  ChevronDown,
  Check,
  Subtitles,
  GitMerge,
  Atom,
  AlertTriangle,
  Info,
  Volume2,
  VolumeX,
  Mic,
  Radio,
  Globe,
  Headphones,
} from "lucide-react";
import { OMEGA_VIDEO_MODELS, type VideoModelId } from "../../lib/omega/models";
import {
  speakWithOmega,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  OMEGA_VOICE_PERSONAS,
} from "../../lib/omega/speech";

export interface VideoGenerationData {
  prompt: string;
  videoUrl?: string;
  duration?: number;
  style?: string;
  theme?: "space" | "quantum" | "nature" | "philosophy" | "geometry" | "fantasy" | "science";
  modelId?: VideoModelId | string;
  modelName?: string;
  modelProvider?: string;
  modelTagline?: string;
  modelBadge?: string;
  resolution?: string;
  fps?: number;
  physicsRating?: string;
  scenes?: { name: string; description: string; voiceLine?: string; sfx?: string }[];
  isPipelineGenerated?: boolean;
  scientistId?: string;
  scientistName?: string;
  scientistEra?: string;
  keyEquation?: string;
  disclaimer?: string;
}

interface OmegaVideoPlayerProps {
  video?: VideoGenerationData;
  prompt?: string;
  videoData?: VideoGenerationData;
}

export const OmegaVideoPlayer: React.FC<OmegaVideoPlayerProps> = ({
  video,
  prompt: propPrompt,
  videoData,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showPipelineDetails, setShowPipelineDetails] = useState(false);
  const animFrameIdRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  const rawData = video || videoData || {};
  const currentPrompt = rawData.prompt || propPrompt || "مشهد حركي تفاعلي";

  // Initial video model
  const initialModelId: VideoModelId =
    (rawData.modelId as VideoModelId) && OMEGA_VIDEO_MODELS[rawData.modelId as VideoModelId]
      ? (rawData.modelId as VideoModelId)
      : "veo-google";

  const [activeModelId, setActiveModelId] = useState<VideoModelId>(initialModelId);
  const activeModelSpec = OMEGA_VIDEO_MODELS[activeModelId] || OMEGA_VIDEO_MODELS["veo-google"];

  const durationSec = rawData.duration || 18;
  const p = currentPrompt.toLowerCase();
  const isFreeFall =
    rawData.theme === "free_fall" ||
    p.includes("سقوط") ||
    p.includes("شاقولي") ||
    p.includes("free fall") ||
    p.includes("freefall") ||
    p.includes("تفاحة") ||
    (p.includes("نيوتن") &&
      (p.includes("جاذبية") || p.includes("حركة") || p.includes("قانون") || p.includes("سقوط")));

  // Audio Narration Synchronization States
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(
    isFreeFall ? "newton" : rawData.scientistId || "newton"
  );
  const [voiceLanguageMode, setVoiceLanguageMode] = useState<"ar" | "en" | "bilingual">("ar");
  const [isSpeakingVoice, setIsSpeakingVoice] = useState<boolean>(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState<boolean>(false);
  const lastSpokenSceneRef = useRef<number>(-1);

  const isScientific =
    isFreeFall ||
    rawData.isPipelineGenerated ||
    Boolean(rawData.scientistName) ||
    currentPrompt.includes("نيوتن") ||
    currentPrompt.includes("أينشتاين") ||
    currentPrompt.includes("تيسلا") ||
    currentPrompt.includes("جاذبية") ||
    currentPrompt.includes("نسبية") ||
    currentPrompt.includes("فيزياء");

  // Visual theme based on prompt keywords
  let theme: "space" | "quantum" | "nature" | "philosophy" | "geometry" | "fantasy" | "science" | "free_fall" =
    rawData.theme || "space";

  if (isFreeFall) {
    theme = "free_fall";
  } else if (isScientific) {
    theme = "science";
  } else if (rawData.theme) {
    theme = rawData.theme;
  } else if (
    p.includes("ساحر") ||
    p.includes("شرير") ||
    p.includes("قلعة") ||
    p.includes("تنين") ||
    p.includes("سحر") ||
    p.includes("wizard") ||
    p.includes("castle") ||
    p.includes("magic") ||
    p.includes("fantasy")
  ) {
    theme = "fantasy";
  } else if (
    p.includes("دين") ||
    p.includes("فلسفة") ||
    p.includes("تاريخ") ||
    p.includes("spirit") ||
    p.includes("philosophy")
  ) {
    theme = "philosophy";
  } else if (
    p.includes("هندسة") ||
    p.includes("geometry") ||
    p.includes("fractal")
  ) {
    theme = "geometry";
  } else if (
    p.includes("كموم") ||
    p.includes("ذرة") ||
    p.includes("طاقة") ||
    p.includes("quantum")
  ) {
    theme = "quantum";
  } else if (
    p.includes("طبيعة") ||
    p.includes("بحر") ||
    p.includes("غابة") ||
    p.includes("مطر") ||
    p.includes("nature")
  ) {
    theme = "nature";
  }

  // Free fall specialized scenes with Newton voice lines (Arabic & English)
  const defaultFreeFallScenes = [
    {
      name: "المشهد 1: شروط السقوط الشاقولي الحر (v₀ = 0)",
      description: "انطلاق حركة السقوط من السكون تحت تأثير قوة الثقل P = mg فقط بإهمال مقاومة الهواء.",
      voiceLine:
        "مرحباً بكم، أنا إسحاق نيوتن. في السقوط الشاقولي الحر، نهمل مقاومة الهواء، فيخضع الجسم لقوة ثقله فقط P = mg.",
      voiceLineEn:
        "Greetings, I am Sir Isaac Newton. In free vertical fall, neglecting air resistance, the falling body is governed solely by gravity: P equals m times g.",
    },
    {
      name: "المشهد 2: تسارع الجاذبية وشعاع السرعة المتزايد (v = g·t)",
      description: "التسارع ثابت a = g = 9.81 m/s² وشعاع السرعة اللحظية v(t) يزداد خطياً مع الزمن.",
      voiceLine:
        "بتطبيق القانون الثاني للتحريك: ∑F = m·a، نجد أن تسارع السقوط a = g ثابت لجميع الكتل، والسرعة v(t) = gt تزداد بانتظام.",
      voiceLineEn:
        "Applying my second law of motion: sum of forces equals mass times acceleration. Thus, acceleration a equals g is constant for all masses, and velocity v equals g times t increases uniformly.",
    },
    {
      name: "المشهد 3: برهان الفراغ الخالد ومقارنة التفاحة والريشة",
      description: "في الفراغ، تسقط التفاحة والريشة بنفس التسارع وتصلان للأرض معاً لأن السقوط الحر مستقل عن الكتلة.",
      voiceLine:
        "تذكروا دائماً: في غياب الهواء، تسقط التفاحة والريشة معاً وتصلان للأرض في نفس اللحظة لأن التسارع لا يعتمد على الكتلة!",
      voiceLineEn:
        "Remember always: in a vacuum, the apple and the feather fall with identical acceleration and reach the ground together, because gravitational acceleration is completely independent of mass!",
    },
  ];

  // Active scene calculation
  const fallbackGenericScenes = [
    {
      name: "المشهد 1: المقدمة والاستكشاف",
      description: `تأسيس المشهد وانسياب الحركة: ${currentPrompt}`,
      voiceLine: rawData.scientistName
        ? `مرحباً بكم، أنا ${rawData.scientistName}. دعونا نتأمل في هذه الظاهرة العلمية الفريدة.`
        : undefined,
    },
    {
      name: "المشهد 2: كشف المبدأ الفيزيائي",
      description: `التفاعل الحركي والبرهان: ${rawData.keyEquation || "E = mc²"}`,
      voiceLine: rawData.scientistName
        ? `السر يكمن في التماثل الرياضي والقانون الكوني: ${rawData.keyEquation || "F = ma"}.`
        : undefined,
    },
    {
      name: "المشهد 3: الخلاصة والتأصيل العلمي",
      description: "التوازن والاستقرار الكوني مع شارة الشفافية",
      voiceLine: rawData.scientistName
        ? "تذكروا دائماً: لا نصل إلى الحقيقة إلا من خلال الفحص والتجريب والبرهان الصارم."
        : undefined,
    },
  ];

  const scenes =
    isFreeFall &&
    (!rawData.scenes ||
      rawData.scenes[0]?.name?.includes("المشهد 1: المقدمة") ||
      rawData.scenes[0]?.name?.includes("Scene 1"))
      ? defaultFreeFallScenes
      : rawData.scenes || (isFreeFall ? defaultFreeFallScenes : fallbackGenericScenes);

  const currentSceneIndex = Math.min(
    scenes.length - 1,
    Math.floor(progress * scenes.length)
  );
  const activeScene = scenes[currentSceneIndex] || scenes[0];

  const triggerSceneNarration = (sceneIdx: number) => {
    const scene = scenes[sceneIdx];
    if (!scene) return;

    let textToSpeak = scene.voiceLine || "";
    const enLine = (scene as any).voiceLineEn;
    if (voiceLanguageMode === "en" && enLine) {
      textToSpeak = enLine;
    } else if (voiceLanguageMode === "bilingual" && enLine) {
      textToSpeak = `${enLine}. ${scene.voiceLine}`;
    }

    if (textToSpeak) {
      speakWithOmega(textToSpeak, {
        personaId: selectedPersonaId,
        langPref: voiceLanguageMode === "en" ? "en" : "ar",
        playAcousticIntro: true,
        onStart: () => setIsSpeakingVoice(true),
        onEnd: () => setIsSpeakingVoice(false),
        onError: () => setIsSpeakingVoice(false),
      });
    }
  };

  // Synchronize audio narration directly with video scenes
  useEffect(() => {
    if (!isPlaying || !isAudioEnabled) {
      if (!isPlaying) {
        pauseSpeaking();
      } else {
        stopSpeaking();
      }
      setIsSpeakingVoice(false);
      return;
    }

    if (lastSpokenSceneRef.current !== currentSceneIndex) {
      lastSpokenSceneRef.current = currentSceneIndex;
      triggerSceneNarration(currentSceneIndex);
    }
  }, [isPlaying, isAudioEnabled, currentSceneIndex, selectedPersonaId, voiceLanguageMode, scenes]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle system
    const particlesCount = activeModelId === "pika" ? 45 : 65;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const colors = [
      activeModelSpec.accentColor,
      "#38bdf8",
      "#a855f7",
      "#ec4899",
      "#10b981",
      "#fbbf24",
    ];

    for (let i = 0; i < particlesCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 2.5 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let lastTimestamp = performance.now();

    const render = () => {
      const now = performance.now();
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlaying) {
        timeRef.current += delta * playbackRate;
        if (timeRef.current >= durationSec) {
          timeRef.current = 0;
        }
        setProgress(timeRef.current / durationSec);
      }

      const t = timeRef.current;
      const cx = width / 2;
      const cy = height / 2;

      // 1. Background Fill with Dynamic Multi-Color Vignette
      const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, Math.max(cx, cy));
      if (theme === "fantasy") {
        bgGrad.addColorStop(0, "#1e0b36");
        bgGrad.addColorStop(0.6, "#0a0314");
        bgGrad.addColorStop(1, "#020108");
      } else if (theme === "nature") {
        bgGrad.addColorStop(0, "#062820");
        bgGrad.addColorStop(0.6, "#021510");
        bgGrad.addColorStop(1, "#010805");
      } else if (theme === "science") {
        // High-contrast deep navy celestial laboratory
        bgGrad.addColorStop(0, "#0b192e");
        bgGrad.addColorStop(0.5, "#070e1c");
        bgGrad.addColorStop(1, "#02050a");
      } else {
        bgGrad.addColorStop(0, "#0f172a");
        bgGrad.addColorStop(0.5, "#090d16");
        bgGrad.addColorStop(1, "#020408");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(cx, cy);

      // Model-Specific Canvas Atmosphere
      if (activeModelId === "veo-google") {
        // Veo: Optical flare and high-end cinematic anamorphic streak
        const streakGrad = ctx.createLinearGradient(-cx, 0, cx, 0);
        streakGrad.addColorStop(0, "rgba(59, 130, 246, 0)");
        streakGrad.addColorStop(0.5, "rgba(96, 165, 250, 0.45)");
        streakGrad.addColorStop(1, "rgba(59, 130, 246, 0)");
        ctx.fillStyle = streakGrad;
        ctx.fillRect(-cx, -3, width, 6);
      } else if (activeModelId === "runway-gen4") {
        // Runway: Cinematic letterbox and directorial crosshair
        ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 80 + Math.sin(t * 1.5) * 5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeModelId === "kling-ai") {
        // Kling AI: Kinematic trajectory lines and human motion keypoint arcs
        ctx.strokeStyle = "rgba(236, 72, 153, 0.35)";
        ctx.lineWidth = 1.5;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, 110 + k * 25, 45 + k * 10, t * 0.4 + k, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (activeModelId === "cogvideox") {
        // CogVideoX: 3D spatial voxel grid with 3D VAE perspective
        ctx.strokeStyle = "rgba(99, 102, 241, 0.25)";
        ctx.lineWidth = 1;
        for (let v = -80; v <= 80; v += 32) {
          ctx.beginPath();
          ctx.moveTo(v, -80);
          ctx.lineTo(v * 1.5, 90);
          ctx.stroke();
        }
      } else if (activeModelId === "wan-2-2-alibaba" || activeModelId === "hunyuan-video-tencent") {
        // Wan 2.2 / Hunyuan: Open-source neural transformer grid
        ctx.strokeStyle =
          activeModelId === "wan-2-2-alibaba"
            ? "rgba(245, 158, 11, 0.18)"
            : "rgba(2, 132, 199, 0.22)";
        ctx.lineWidth = 0.8;
        const gridSize = 36;
        for (let x = -cx; x < cx; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, -cy);
          ctx.lineTo(x, cy);
          ctx.stroke();
        }
        for (let y = -cy; y < cy; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(-cx, y);
          ctx.lineTo(cx, y);
          ctx.stroke();
        }
      }

      // Dynamic visual subjects based on theme
      if (theme === "free_fall") {
        // =========================================================================
        // PHYSICALLY ACCURATE LABORATORY SIMULATION: NEWTON'S FREE VERTICAL FALL (السقوط الشاقولي الحر)
        // =========================================================================
        const groundY = cy - 42; // Stone floor position
        const ceilingY = -cy + 52; // Top suspension rig position
        const fallHeight = groundY - ceilingY; // Total drop height in pixels

        // 1. Blackboard Laboratory Physics Coordinate Grid
        ctx.strokeStyle = "rgba(56, 189, 248, 0.07)";
        ctx.lineWidth = 1;
        for (let gx = -cx; gx <= cx; gx += 40) {
          ctx.beginPath();
          ctx.moveTo(gx, -cy);
          ctx.lineTo(gx, cy);
          ctx.stroke();
        }
        for (let gy = -cy; gy <= cy; gy += 40) {
          ctx.beginPath();
          ctx.moveTo(-cx, gy);
          ctx.lineTo(cx, gy);
          ctx.stroke();
        }

        // 2. Laboratory Stone Floor (الأرضية المخبرية ونقطة الاصطدام)
        const floorGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 45);
        floorGrad.addColorStop(0, "#1e293b");
        floorGrad.addColorStop(0.35, "#0f172a");
        floorGrad.addColorStop(1, "#020617");
        ctx.fillStyle = floorGrad;
        ctx.fillRect(-cx, groundY, width, height - (groundY + cy));

        // Floor reflective highlight
        ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-cx, groundY);
        ctx.lineTo(cx, groundY);
        ctx.stroke();

        // 3. Top Suspension Rig / Wooden Beam (مسند الانطلاق العلوي)
        ctx.fillStyle = "#334155";
        ctx.fillRect(-cx + 50, ceilingY - 14, 250, 10);
        ctx.strokeStyle = "#475569";
        ctx.strokeRect(-cx + 50, ceilingY - 14, 250, 10);

        // 4. Vertical Calibrated Axis (Oz) and Metric Scale (مسطرة القياس الشاقولية)
        const axisX = -cx + 78;
        ctx.strokeStyle = "rgba(245, 158, 11, 0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(axisX, ceilingY);
        ctx.lineTo(axisX, groundY + 14);
        ctx.stroke();

        // Arrowhead at bottom of axis (Oz)
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.moveTo(axisX, groundY + 20);
        ctx.lineTo(axisX - 5, groundY + 11);
        ctx.lineTo(axisX + 5, groundY + 11);
        ctx.closePath();
        ctx.fill();

        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "#fbbf24";
        ctx.fillText("(Oz) ↓ شاقولي", axisX - 34, groundY + 34);

        // Metric ticks every 2 meters (0m to 10m)
        const steps = 5;
        for (let s = 0; s <= steps; s++) {
          const sy = ceilingY + (s / steps) * fallHeight;
          ctx.strokeStyle = "rgba(245, 158, 11, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(axisX - 6, sy);
          ctx.lineTo(axisX + 6, sy);
          ctx.stroke();

          ctx.font = "10px monospace";
          ctx.fillStyle = "#e2e8f0";
          ctx.fillText(`${s * 2}m`, axisX - 32, sy + 3);
        }

        // Fixed Acceleration vector next to metric scale: a = g = 9.81 m/s²
        const gVectorY = ceilingY + fallHeight * 0.38;
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(axisX + 18, gVectorY);
        ctx.lineTo(axisX + 18, gVectorY + 42);
        ctx.stroke();

        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.moveTo(axisX + 18, gVectorY + 47);
        ctx.lineTo(axisX + 14, gVectorY + 39);
        ctx.lineTo(axisX + 22, gVectorY + 39);
        ctx.closePath();
        ctx.fill();

        ctx.font = "bold 9.5px sans-serif";
        ctx.fillStyle = "#fef08a";
        ctx.fillText("g⃗ = 9.81 m/s²", axisX + 26, gVectorY + 26);

        // 5. Dynamic Time Cycle & Real Quadratic Kinematics
        const cycleDuration = 3.2; // seconds per repeat
        const fallTime = 2.0; // time to reach the floor
        const localT = (t * playbackRate) % cycleDuration;
        const isDropping = localT < fallTime;
        const dropRatio = Math.min(1, localT / fallTime);

        // Physical Quadratic Displacement: y(t) = 1/2 * g * t^2
        const quadraticRatio = Math.pow(dropRatio, 2);
        const appleY = ceilingY + quadraticRatio * (fallHeight - 16);

        // Apple X position
        const appleX = -cx + 175;

        // Ground Impact shockwave & bounce
        if (!isDropping) {
          const impactT = (localT - fallTime) / (cycleDuration - fallTime);
          const rippleRadius = impactT * 75;
          ctx.strokeStyle = `rgba(239, 68, 68, ${Math.max(0, 0.7 * (1 - impactT))})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(appleX, groundY, rippleRadius, rippleRadius * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Small impact sparks
          for (let d = 0; d < 6; d++) {
            const da = (d / 6) * Math.PI * 2;
            const dx = appleX + Math.cos(da) * rippleRadius * 0.75;
            const dy = groundY - Math.sin(impactT * Math.PI) * 14 * (d % 2 === 0 ? 1 : 0.6);
            ctx.fillStyle = `rgba(251, 191, 36, ${0.8 * (1 - impactT)})`;
            ctx.beginPath();
            ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Motion Path Trace Line (المسار الشاقولي المستقيم)
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(appleX, ceilingY);
        ctx.lineTo(appleX, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 6. DRAWING NEWTON'S FALLING APPLE (تفاحة نيوتن)
        ctx.save();
        ctx.translate(appleX, appleY);

        // Apple body with rich 3D radial gradient
        ctx.beginPath();
        ctx.arc(-5, 0, 13, 0, Math.PI * 2);
        ctx.arc(5, 0, 13, 0, Math.PI * 2);
        const appleGrad = ctx.createRadialGradient(-3, -4, 2, 0, 0, 16);
        appleGrad.addColorStop(0, "#ef4444");
        appleGrad.addColorStop(0.7, "#dc2626");
        appleGrad.addColorStop(1, "#991b1b");
        ctx.fillStyle = appleGrad;
        ctx.shadowColor = "rgba(220, 38, 38, 0.6)";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Apple stem
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.quadraticCurveTo(3, -17, 7, -19);
        ctx.stroke();

        // Apple green leaf
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.ellipse(5, -17, 6, 2.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Center of mass indicator dot
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 7. PHYSICAL VECTORS ON THE APPLE
        // A) Weight Force Vector P = mg (شعاع الثقل) -> Constant emerald downward arrow
        const pLen = 46;
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, pLen);
        ctx.stroke();

        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.moveTo(0, pLen + 6);
        ctx.lineTo(-4.5, pLen);
        ctx.lineTo(4.5, pLen);
        ctx.closePath();
        ctx.fill();

        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = "#34d399";
        ctx.fillText("P⃗ = m·g⃗", 8, pLen - 8);

        // B) Velocity Vector v(t) = g·t (شعاع السرعة اللحظية المتزايد خطياً)
        if (isDropping && dropRatio > 0.05) {
          const vLen = dropRatio * 72; // Grows linearly with velocity
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-16, 0);
          ctx.lineTo(-16, vLen);
          ctx.stroke();

          ctx.fillStyle = "#06b6d4";
          ctx.beginPath();
          ctx.moveTo(-16, vLen + 6);
          ctx.lineTo(-20.5, vLen);
          ctx.lineTo(-11.5, vLen);
          ctx.closePath();
          ctx.fill();

          ctx.font = "bold 10px sans-serif";
          ctx.fillStyle = "#22d3ee";
          ctx.fillText("v⃗(t) = g·t", -68, vLen * 0.6 + 4);
        }

        ctx.restore();

        // 8. GALILEO / NEWTON VACUUM TUBE EXPERIMENT (تجربة أنبوب نيوتن المفرغ)
        const tubeX = cx - 180;
        const tubeW = 84;
        const tubeTop = ceilingY + 8;
        const tubeBottom = groundY - 4;
        const tubeH = tubeBottom - tubeTop;

        // Tube background & glass glow
        ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
        ctx.fillRect(tubeX - tubeW / 2, tubeTop, tubeW, tubeH);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(tubeX - tubeW / 2, tubeTop, tubeW, tubeH);

        // Vacuum glass specular reflection
        const tubeGrad = ctx.createLinearGradient(tubeX - tubeW / 2, 0, tubeX + tubeW / 2, 0);
        tubeGrad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
        tubeGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.02)");
        tubeGrad.addColorStop(0.7, "rgba(56, 189, 248, 0.08)");
        tubeGrad.addColorStop(1, "rgba(255, 255, 255, 0.12)");
        ctx.fillStyle = tubeGrad;
        ctx.fillRect(tubeX - tubeW / 2 + 2, tubeTop + 2, tubeW - 4, tubeH - 4);

        // Tube metal flanges
        ctx.fillStyle = "#475569";
        ctx.fillRect(tubeX - tubeW / 2 - 4, tubeTop - 7, tubeW + 8, 7);
        ctx.fillRect(tubeX - tubeW / 2 - 4, tubeBottom, tubeW + 8, 7);

        // Tube Title Badge
        ctx.fillStyle = "rgba(10, 15, 30, 0.92)";
        ctx.fillRect(tubeX - tubeW / 2 - 20, tubeTop - 28, tubeW + 40, 18);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
        ctx.strokeRect(tubeX - tubeW / 2 - 20, tubeTop - 28, tubeW + 40, 18);
        ctx.font = "bold 9.5px sans-serif";
        ctx.fillStyle = "#38bdf8";
        ctx.textAlign = "center";
        ctx.fillText("أنبوب الفراغ (Vacuum Tube)", tubeX, tubeTop - 16);
        ctx.textAlign = "left";

        // Inside the vacuum tube: Golden mass and Feather falling simultaneously
        const vacuumY = tubeTop + 18 + quadraticRatio * (tubeH - 36);

        // Object A: Golden Sphere (m₁ = 200g)
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(tubeX - 18, vacuumY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "8.5px sans-serif";
        ctx.fillStyle = "#fbbf24";
        ctx.fillText("كرة (m₁)", tubeX - 35, vacuumY + 16);

        // Object B: Delicate White Feather (m₂ = 1g)
        ctx.save();
        ctx.translate(tubeX + 18, vacuumY);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(0, 9);
        ctx.stroke();
        for (let fb = -7; fb <= 7; fb += 3) {
          ctx.beginPath();
          ctx.moveTo(0, fb);
          ctx.lineTo(-5, fb - 2);
          ctx.moveTo(0, fb);
          ctx.lineTo(5, fb - 2);
          ctx.stroke();
        }
        ctx.font = "8.5px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("ريشة (m₂)", -14, 18);
        ctx.restore();

        // Vacuum equivalence label
        ctx.font = "bold 9px sans-serif";
        ctx.fillStyle = "#34d399";
        ctx.textAlign = "center";
        ctx.fillText("تطابق السقوط: a₁ = a₂ = g", tubeX, tubeBottom + 18);
        ctx.textAlign = "left";

        // 9. LIVE TELEMETRY & KINEMATIC HUD PANEL (لوحة البيانات اللحظية)
        const currentSimT = Math.min(fallTime, localT);
        const currentMeters = 0.5 * 9.81 * Math.pow(currentSimT, 2);
        const currentSpeed = 9.81 * currentSimT;

        const hudW = 180;
        const hudH = 100;
        const hudX = cx - hudW - 12;
        const hudY = -cy + 42;

        ctx.fillStyle = "rgba(7, 13, 26, 0.9)";
        ctx.fillRect(hudX, hudY, hudW, hudH);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.strokeRect(hudX, hudY, hudW, hudH);

        // HUD Header
        ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
        ctx.fillRect(hudX, hudY, hudW, 18);
        ctx.font = "bold 9.5px sans-serif";
        ctx.fillStyle = "#38bdf8";
        ctx.fillText("⚡ عدادات السقوط الشاقولي", hudX + 8, hudY + 13);

        ctx.font = "9.5px monospace";
        // Time
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("الزمن المنقضي t:", hudX + 8, hudY + 33);
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(`${currentSimT.toFixed(2)} s`, hudX + 118, hudY + 33);

        // Velocity
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("السرعة v = gt:", hudX + 8, hudY + 50);
        ctx.fillStyle = "#22d3ee";
        ctx.fillText(`${currentSpeed.toFixed(1)} m/s`, hudX + 118, hudY + 50);

        // Distance fallen
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("المسافة y = ½gt²:", hudX + 8, hudY + 67);
        ctx.fillStyle = "#fbbf24";
        ctx.fillText(`${currentMeters.toFixed(1)} m`, hudX + 118, hudY + 67);

        // Acceleration
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("التسارع a = g:", hudX + 8, hudY + 84);
        ctx.fillStyle = "#34d399";
        ctx.fillText("9.81 m/s²", hudX + 118, hudY + 84);

        // 10. LATEX PHYSICS FORMULA BANNER AT TOP
        const bannerW = Math.min(width - 40, 440);
        const bannerH = 30;
        const bannerX = -bannerW / 2;
        const bannerY = -cy + 10;

        ctx.fillStyle = "rgba(10, 20, 40, 0.94)";
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
        ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

        ctx.font = "bold 12px serif";
        ctx.fillStyle = "#38bdf8";
        ctx.textAlign = "center";
        ctx.fillText(
          "∑ F⃗ = P⃗ = m·g⃗  ⟹  a⃗ = g⃗  |  v(t) = g·t  |  y(t) = ½ g t²",
          0,
          bannerY + 20
        );
        ctx.textAlign = "left";
      } else if (theme === "science") {
        // Scientific Educational Simulation Theme
        // 1. Spacetime Grid Curvature / Orbital Trajectories
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = 1.2;
        for (let ring = 1; ring <= 4; ring++) {
          const r = ring * 40 + Math.sin(t * 1.5 + ring) * 8;
          ctx.beginPath();
          ctx.ellipse(0, 0, r, r * 0.55, 0.25, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 2. Gravitational Body / Light Prism / Electron Cloud
        const orbY = Math.sin(t * 2) * 15;
        ctx.beginPath();
        ctx.arc(0, orbY, 24, 0, Math.PI * 2);
        const coreGrad = ctx.createRadialGradient(0, orbY, 2, 0, orbY, 24);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.4, "#38bdf8");
        coreGrad.addColorStop(1, "#0284c7");
        ctx.fillStyle = coreGrad;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 24;
        ctx.fill();
        ctx.shadowBlur = 0;

        // 3. Falling Apple / Energy Photon (Newton / Einstein / Tesla)
        const photonX = Math.cos(t * 3) * 90;
        const photonY = Math.sin(t * 3) * 45;
        ctx.beginPath();
        ctx.arc(photonX, photonY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#fbbf24";
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // 4. Floating LaTeX Equation Box in Center
        if (rawData.keyEquation) {
          ctx.fillStyle = "rgba(10, 20, 40, 0.85)";
          ctx.fillRect(-120, -115, 240, 28);
          ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
          ctx.strokeRect(-120, -115, 240, 28);

          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 13px serif";
          ctx.textAlign = "center";
          ctx.fillText(rawData.keyEquation, 0, -96);
          ctx.textAlign = "left";
        }
      } else if (theme === "fantasy") {
        const castleWidth = 140;
        const castleHeight = 90;

        // Magical aura rings
        for (let ring = 1; ring <= 4; ring++) {
          ctx.beginPath();
          ctx.arc(0, -20, ring * 35 + Math.sin(t * 2 + ring) * 8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(192, 38, 211, ${0.25 - ring * 0.04})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Castle silhouette
        ctx.fillStyle = "#0a0314";
        ctx.fillRect(-castleWidth / 2, 10, castleWidth, castleHeight);
        ctx.fillRect(-castleWidth / 2 - 15, -20, 25, castleHeight + 30);
        ctx.fillRect(castleWidth / 2 - 10, -20, 25, castleHeight + 30);
        ctx.fillRect(-20, -50, 40, castleHeight + 60);

        // Tower spires
        ctx.beginPath();
        ctx.moveTo(-20, -50);
        ctx.lineTo(0, -90);
        ctx.lineTo(20, -50);
        ctx.closePath();
        ctx.fillStyle = "#0f0520";
        ctx.fill();

        // Glowing magical orb
        const orbY = -105 + Math.sin(t * 3) * 6;
        ctx.beginPath();
        ctx.arc(0, orbY, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#e879f9";
        ctx.shadowColor = "#e879f9";
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (theme === "philosophy" || theme === "geometry") {
        // Rotating Sacred Geometry Nested Polyhedra
        for (let poly = 1; poly <= 3; poly++) {
          const r = poly * 45 + Math.sin(t + poly) * 6;
          const sides = poly === 1 ? 6 : poly === 2 ? 8 : 12;
          const rot = t * (poly % 2 === 0 ? 0.4 : -0.4);

          ctx.beginPath();
          for (let s = 0; s < sides; s++) {
            const angle = rot + (s * 2 * Math.PI) / sides;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = poly === 1 ? "#a855f7" : poly === 2 ? "#06b6d4" : "#f59e0b";
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
      } else if (theme === "nature") {
        // Organic Fluid Harmonic Waves
        for (let wave = 0; wave < 4; wave++) {
          ctx.beginPath();
          for (let x = -cx; x <= cx; x += 8) {
            const y =
              Math.sin(x * 0.015 + t * 2 + wave) * 25 +
              Math.cos(x * 0.03 - t + wave) * 12 +
              (wave - 1.5) * 22;
            if (x === -cx) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = wave % 2 === 0 ? "#10b981" : "#06b6d4";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else {
        // Space & Quantum Cosmic Vortex
        for (let i = 0; i < 5; i++) {
          const radius = (i + 1) * 32 + Math.sin(t * 2 + i) * 6;
          ctx.beginPath();
          ctx.arc(0, 0, radius, t * 0.5 + i, t * 0.5 + i + Math.PI * 1.4);
          ctx.strokeStyle = i % 2 === 0 ? "#a855f7" : "#06b6d4";
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }

        // Quantum Center Glow
        ctx.beginPath();
        ctx.arc(0, 0, 16 + Math.sin(t * 4) * 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 24;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      // Floating dynamic particles
      particles.forEach((p) => {
        if (isPlaying) {
          p.x += p.vx * playbackRate;
          p.y += p.vy * playbackRate;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = activeModelId === "pika" ? 12 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // HUD Watermark in top left corner of video canvas
      ctx.fillStyle = "rgba(10, 15, 30, 0.75)";
      ctx.fillRect(12, 12, 240, 26);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
      ctx.strokeRect(12, 12, 240, 26);

      ctx.fillStyle = activeModelSpec.accentColor;
      ctx.font = "bold 10px monospace";
      ctx.fillText(
        `OMEGA × ${activeModelSpec.name.toUpperCase()} • ${activeModelSpec.fps}FPS`,
        18,
        29
      );

      // MANDATORY ETHICAL DISCLAIMER WATERMARK (If scientific simulation)
      if (isScientific || rawData.disclaimer) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(12, height - 32, width - 24, 22);
        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
        ctx.strokeRect(12, height - 32, width - 24, 22);

        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 9.5px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          "⚠️ إعادة تمثيل ومحاكاة علمية بالذكاء الاصطناعي وليست تسجيلاً حقيقياً • AI Educational Simulation (Not Authentic Footage)",
          width / 2,
          height - 18
        );
        ctx.textAlign = "left";
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, playbackRate, theme, durationSec, activeModelId, activeModelSpec, isScientific, rawData]);

  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (!next) {
        pauseSpeaking();
        setIsSpeakingVoice(false);
      } else {
        if (isAudioEnabled) {
          resumeSpeaking();
        }
      }
      return next;
    });
  };

  const handleReset = () => {
    stopSpeaking();
    setIsSpeakingVoice(false);
    lastSpokenSceneRef.current = -1;
    timeRef.current = 0;
    setProgress(0);
    setIsPlaying(true);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `omega_${activeModelId}_frame_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const currentSecondsFormatted = Math.floor(progress * durationSec);
  const videoModelEntries = Object.values(OMEGA_VIDEO_MODELS);

  return (
    <div
      ref={containerRef}
      className="my-3 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden group"
      dir="ltr"
    >
      {/* Top Header: Model Switcher & Metadata Badge */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 gap-2">
        {/* Left: Active Model Tag */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowModelPicker((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-cyan-500 text-xs text-white font-bold transition-all cursor-pointer shadow-sm"
              title="تغيير نموذج الفيديو"
            >
              <Video className="w-3.5 h-3.5" style={{ color: activeModelSpec.accentColor }} />
              <span>{activeModelSpec.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Model Dropdown Menu */}
            {showModelPicker && (
              <div
                className="absolute left-0 top-full mt-1.5 w-72 max-h-80 overflow-y-auto rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-700 shadow-2xl p-1.5 z-50 divide-y divide-slate-800/60"
                dir="rtl"
              >
                <div className="px-2 py-1 text-[10px] text-slate-400 font-medium">
                  اختر محرك توليد الفيديو المطلوب:
                </div>
                <div className="pt-1 space-y-1">
                  {videoModelEntries.map((spec) => (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => {
                        setActiveModelId(spec.id);
                        setShowModelPicker(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-right text-xs transition-all cursor-pointer ${
                        activeModelId === spec.id
                          ? "bg-purple-950/80 border border-purple-500/50 text-white font-semibold"
                          : "hover:bg-slate-900 text-slate-300 hover:text-white"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: spec.accentColor }}
                          />
                          <span>{spec.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate max-w-[190px]">
                          {spec.tagline}
                        </span>
                      </div>
                      {activeModelId === spec.id && (
                        <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
            {activeModelSpec.badge}
          </span>

          {rawData.isPipelineGenerated && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 flex items-center gap-1">
              <GitMerge className="w-3 h-3 text-purple-400" />
              <span>Scientific Pipeline</span>
            </span>
          )}
        </div>

        {/* Right: Resolution & FPS & Engine Status */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            {activeModelSpec.resolution}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400">
            {activeModelSpec.fps} FPS
          </span>
          <span className="text-purple-300 hidden sm:inline">
            Physics: {activeModelSpec.physicsRating}
          </span>
        </div>
      </div>

      {/* Video Canvas Container */}
      <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full object-cover block" />

        {/* Video Prompt Overlay Badge */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/60 text-xs text-purple-200 font-medium max-w-[70%]">
            <Film className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{currentPrompt}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/90 border border-purple-500/40 text-[10px] text-purple-200 font-mono">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>{activeModelSpec.company}</span>
          </div>
        </div>

        {/* Closed Captions Subtitle Box (For voice lines) */}
        {showSubtitles && activeScene.voiceLine && (
          <div
            className="absolute bottom-10 left-6 right-6 flex justify-center z-10"
            dir="rtl"
          >
            <div className="px-4 py-2.5 rounded-xl bg-black/90 backdrop-blur-md border border-cyan-500/40 text-white text-xs sm:text-sm font-medium text-center shadow-2xl max-w-xl animate-fade-in flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-between w-full border-b border-slate-800/80 pb-1 text-[11px]">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span>{selectedPersonaId === "newton" ? "🍎 السير إسحاق نيوتن" : (rawData.scientistName || "الراوي العلمي")}:</span>
                  {isSpeakingVoice && (
                    <span className="flex items-center gap-0.5 text-cyan-400" title="يتحدث الآن">
                      <span className="w-1 h-3 bg-cyan-400 animate-pulse rounded-full" />
                      <span className="w-1 h-4 bg-purple-400 animate-pulse rounded-full [animation-delay:150ms]" />
                      <span className="w-1 h-2 bg-emerald-400 animate-pulse rounded-full [animation-delay:300ms]" />
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-[10px]">
                    {voiceLanguageMode === "en" ? "نطق إنجليزي أكاديمي" : voiceLanguageMode === "bilingual" ? "ثنائي اللغة" : "عربي وقور"}
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerSceneNarration(currentSceneIndex)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-colors cursor-pointer text-[10px]"
                    title="استمع لصوت نيوتن لهذا المشهد"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>إعادة الاستماع</span>
                  </button>
                </div>
              </div>
              <span className="text-slate-100 font-medium leading-relaxed">
                «{voiceLanguageMode === "en" && (activeScene as any).voiceLineEn ? (activeScene as any).voiceLineEn : activeScene.voiceLine}»
              </span>
            </div>
          </div>
        )}

        {/* Big Center Play/Pause button on hover when paused */}
        {!isPlaying && (
          <button
            type="button"
            onClick={handleTogglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg backdrop-blur-sm hover:scale-110 transition-transform cursor-pointer"
          >
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </button>
        )}
      </div>

      {/* Progress Timeline Scrubber */}
      <div
        className="w-full h-1.5 bg-slate-900 cursor-pointer relative"
        onClick={(e) => {
          stopSpeaking();
          setIsSpeakingVoice(false);
          lastSpokenSceneRef.current = -1;
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          timeRef.current = ratio * durationSec;
          setProgress(ratio);
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-75"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Video Player Controls Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950 border-t border-slate-900 gap-2 text-xs">
        {/* Left: Play, Reset, Audio, Time */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="إعادة من البداية"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Synchronized Audio Narration Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsAudioEnabled((prev) => {
                const next = !prev;
                if (!next) {
                  stopSpeaking();
                  setIsSpeakingVoice(false);
                } else {
                  triggerSceneNarration(currentSceneIndex);
                }
                return next;
              });
            }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isAudioEnabled
                ? "bg-cyan-950 border border-cyan-500/40 text-cyan-300"
                : "bg-slate-900 text-slate-500 hover:text-slate-300"
            }`}
            title={isAudioEnabled ? "الصوت متزامن (مفعل)" : "كتم الصوت"}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Voice Persona & Language Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowVoiceMenu((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors cursor-pointer text-[11px]"
              title="تخصيص شخصية الصوت ولغة النطق"
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-medium">
                {selectedPersonaId === "newton"
                  ? "🍎 نيوتن"
                  : selectedPersonaId === "einstein"
                  ? "🌌 أينشتاين"
                  : selectedPersonaId === "curie"
                  ? "🔬 كوري"
                  : selectedPersonaId === "morgan-freeman"
                  ? "🎬 فريمان"
                  : "🎙️ الراوي"}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showVoiceMenu && (
              <div
                className="absolute bottom-full mb-2 left-0 w-64 p-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl z-30 space-y-2.5 text-right"
                dir="rtl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                    شخصية الصوت المتزامنة:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowVoiceMenu(false)}
                    className="text-slate-400 hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPersonaId("newton");
                      stopSpeaking();
                      lastSpokenSceneRef.current = -1;
                      setShowVoiceMenu(false);
                      triggerSceneNarration(currentSceneIndex);
                    }}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      selectedPersonaId === "newton"
                        ? "bg-purple-900/60 text-white border border-purple-500/40"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🍎</span>
                      <span>السير إسحاق نيوتن (أكاديمي باريتون)</span>
                    </span>
                    {selectedPersonaId === "newton" && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPersonaId("einstein");
                      stopSpeaking();
                      lastSpokenSceneRef.current = -1;
                      setShowVoiceMenu(false);
                      triggerSceneNarration(currentSceneIndex);
                    }}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      selectedPersonaId === "einstein"
                        ? "bg-purple-900/60 text-white border border-purple-500/40"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🌌</span>
                      <span>ألبرت أينشتاين (فلسفي هادئ)</span>
                    </span>
                    {selectedPersonaId === "einstein" && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPersonaId("documentary");
                      stopSpeaking();
                      lastSpokenSceneRef.current = -1;
                      setShowVoiceMenu(false);
                      triggerSceneNarration(currentSceneIndex);
                    }}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      selectedPersonaId === "documentary"
                        ? "bg-purple-900/60 text-white border border-purple-500/40"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🎙️</span>
                      <span>الراوي الوثائقي (صوت علمي رصين)</span>
                    </span>
                    {selectedPersonaId === "documentary" && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPersonaId("morgan-freeman");
                      stopSpeaking();
                      lastSpokenSceneRef.current = -1;
                      setShowVoiceMenu(false);
                      triggerSceneNarration(currentSceneIndex);
                    }}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      selectedPersonaId === "morgan-freeman"
                        ? "bg-purple-900/60 text-white border border-purple-500/40"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🎬</span>
                      <span>مورغان فريمان (صوت عميق مهيب)</span>
                    </span>
                    {selectedPersonaId === "morgan-freeman" && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    لغة ونمط نطق نيوتن:
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceLanguageMode("ar");
                        stopSpeaking();
                        lastSpokenSceneRef.current = -1;
                        triggerSceneNarration(currentSceneIndex);
                      }}
                      className={`py-1 rounded text-center transition-colors cursor-pointer ${
                        voiceLanguageMode === "ar"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      عربي رصين
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceLanguageMode("en");
                        stopSpeaking();
                        lastSpokenSceneRef.current = -1;
                        triggerSceneNarration(currentSceneIndex);
                      }}
                      className={`py-1 rounded text-center transition-colors cursor-pointer ${
                        voiceLanguageMode === "en"
                          ? "bg-purple-950 text-purple-300 border border-purple-500/40 font-bold"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceLanguageMode("bilingual");
                        stopSpeaking();
                        lastSpokenSceneRef.current = -1;
                        triggerSceneNarration(currentSceneIndex);
                      }}
                      className={`py-1 rounded text-center transition-colors cursor-pointer ${
                        voiceLanguageMode === "bilingual"
                          ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      ثنائي اللغة
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <span className="text-slate-400 font-mono text-[11px] ml-1">
            00:{currentSecondsFormatted.toString().padStart(2, "0")} / 00:
            {durationSec.toString().padStart(2, "0")}
          </span>
        </div>

        {/* Center: Current Scene Name & Pipeline Toggle */}
        <div className="flex items-center gap-2 text-[11px] text-slate-300" dir="rtl">
          <span className="font-semibold text-cyan-300 truncate max-w-[200px]">
            {activeScene.name}
          </span>

          {rawData.isPipelineGenerated && (
            <button
              type="button"
              onClick={() => setShowPipelineDetails((prev) => !prev)}
              className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 hover:text-white transition-colors cursor-pointer text-[10px]"
            >
              {showPipelineDetails ? "إخفاء المراحل" : "عرض مراحل الإنتاج"}
            </button>
          )}
        </div>

        {/* Right: Subtitles, Speed, Snapshot, Fullscreen */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSubtitles((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showSubtitles
                ? "bg-cyan-950 border border-cyan-500/40 text-cyan-300"
                : "bg-slate-900 text-slate-500 hover:text-slate-300"
            }`}
            title="الترجمة والحوار الصوتي"
          >
            <Subtitles className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              const rates = [0.5, 1, 1.5, 2];
              const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
              setPlaybackRate(next);
            }}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-purple-300 transition-colors cursor-pointer"
            title="تغيير سرعة العرض"
          >
            {playbackRate}x
          </button>

          <button
            type="button"
            onClick={handleDownloadSnapshot}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            title="تحميل لقطة من المشهد"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px]">حفظ</span>
          </button>

          <button
            type="button"
            onClick={handleFullscreen}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="شاشة كاملة"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Pipeline Architecture Drawer */}
      {showPipelineDetails && rawData.isPipelineGenerated && (
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-3" dir="rtl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white">
                هندسة خط الإنتاج المتكامل (Scientific Video Pipeline):
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              7 مراحل إنتاج متسلسلة • استقرار فيزيائي 9.9/10
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-purple-400 font-semibold mb-0.5">1. كتابة السيناريو</div>
              <div className="text-slate-300">GPT-5 / Claude / Gemini</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-cyan-400 font-semibold mb-0.5">2. توليد البورتريه</div>
              <div className="text-slate-300">FLUX.1 Pro / Imagen 3</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-blue-400 font-semibold mb-0.5">3. توليد حركة المشهد</div>
              <div className="text-slate-300">Veo / Runway / Wan 2.2</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-emerald-400 font-semibold mb-0.5">4. تحريك الملامح (512D)</div>
              <div className="text-slate-300">LivePortrait / Hallo</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-pink-400 font-semibold mb-0.5">5. مزامنة الشفاه</div>
              <div className="text-slate-300">MuseTalk / Sync Labs</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-amber-400 font-semibold mb-0.5">6. الصوت والمؤثرات</div>
              <div className="text-slate-300">ElevenLabs / XTTS v2</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 col-span-1 sm:col-span-2">
              <div className="text-violet-400 font-semibold mb-0.5">7. المونتاج والشارة الإلزامية</div>
              <div className="text-slate-300">FFmpeg + Remotion (معادلات KaTeX وشارة الشفافية)</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>
              ميثاق الشفافية الأكاديمية: يتم إدراج علامة مائية دائمة توضح أن الفيديو محاكاة علمية تفاعلية
              بالذكاء الاصطناعي لمنع التضليل وللحفاظ على الأمانة العلمية.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
