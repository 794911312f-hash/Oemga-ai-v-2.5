import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  X,
  Lightbulb,
  Brain,
  MessageSquare,
  HelpCircle,
  RotateCcw,
  Sliders,
} from "lucide-react";
import {
  speakWithOmega,
  stopSpeaking,
  subscribeSpeechState,
  OMEGA_VOICE_PERSONAS,
} from "../../lib/omega/speech";
import { AudioFrequencyVisualizer } from "./AudioFrequencyVisualizer";
import { AudioFrequencyEngine } from "../../lib/omega/audioFrequency";

interface OmegaProfessor3DProps {
  currentContext?: string;
  onSendMessage?: (text: string) => void;
  isFloating?: boolean;
  onCloseFloating?: () => void;
}

export const OmegaProfessor3D: React.FC<OmegaProfessor3DProps> = ({
  currentContext,
  onSendMessage,
  isFloating = false,
  onCloseFloating,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState("");
  const [mood, setMood] = useState<
    "neutral" | "speaking" | "eureka" | "thinking" | "adjust_glasses" | "scratch_beard" | "pointing"
  >("neutral");
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDuplexMode, setIsDuplexMode] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState<string>(
    "مرحباً بك يا بني في مختبر أوميغا.. أنا البروفيسور العجوز أوميغا، كيف أساعدك اليوم في سبر أغوار فيزياء الكون؟"
  );

  // Old Man Voice Character Customization States
  const [oldManPreset, setOldManPreset] = useState<"wise" | "scholar" | "deep">("wise");
  const [oldManPitch, setOldManPitch] = useState<number>(0.68); // Deep resonant elder pitch
  const [oldManRate, setOldManRate] = useState<number>(0.84);   // Measured deliberate pace
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);

  // Audio frequency analyser for live microphone input
  const audioEngineRef = useRef<AudioFrequencyEngine | null>(null);

  // References for 3D anim loop
  const animFrameIdRef = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Rigged elements
  const headGroupRef = useRef<THREE.Group | null>(null);
  const jawMeshRef = useRef<THREE.Mesh | null>(null);
  const mustacheGroupRef = useRef<THREE.Group | null>(null);
  const glassesGroupRef = useRef<THREE.Group | null>(null);
  const pointerLaserRef = useRef<THREE.Mesh | null>(null);
  const leftEyebrowRef = useRef<THREE.Mesh | null>(null);
  const rightEyebrowRef = useRef<THREE.Mesh | null>(null);
  const leftEyeRef = useRef<THREE.Group | null>(null);
  const rightEyeRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);
  const leftArmRef = useRef<THREE.Group | null>(null);
  const flaskLightRef = useRef<THREE.PointLight | null>(null);
  const flaskLiquidRef = useRef<THREE.Mesh | null>(null);
  const omegaBadgeRef = useRef<THREE.Mesh | null>(null);
  const gestureTimeoutRef = useRef<any>(null);

  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetLookRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const recognitionRef = useRef<any>(null);

  const triggerGesture = (
    gesture: "adjust_glasses" | "scratch_beard" | "pointing" | "eureka" | "thinking",
    speechLine?: string
  ) => {
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    setMood(gesture);
    if (speechLine) {
      speakProfessorLine(speechLine);
    }
    gestureTimeoutRef.current = setTimeout(() => {
      setMood((prev) => (prev === gesture ? "neutral" : prev));
    }, 6000);
  };

  // Subscribe to speech synthesis state
  useEffect(() => {
    const unsubscribe = subscribeSpeechState((state) => {
      setIsSpeaking(state.isPlaying);
      if (state.isPlaying && state.currentText) {
        setCurrentSpeechText(state.currentText);
        setSpeechBubbleText(state.currentText.slice(0, 140) + (state.currentText.length > 140 ? "..." : ""));
        setMood("speaking");
      } else if (!state.isPlaying) {
        setMood((prev) => (prev === "speaking" ? "neutral" : prev));
      }
    });
    return () => unsubscribe();
  }, []);

  // Web Speech Recognition (Mic dialogue)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = "ar-SA";

        rec.onresult = (event: any) => {
          let currentText = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
          if (event.results[0].isFinal) {
            handleUserVoiceQuery(currentText);
            setIsListening(false);
          }
        };

        rec.onerror = () => {
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      console.warn("Speech recognition is not supported in this browser environment.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      audioEngineRef.current?.stop();
    } else {
      try {
        // Immediate interrupt: stop any ongoing professor speech cleanly
        stopSpeaking();
        setIsSpeaking(false);
        setMood("thinking");
        setTranscript("");
        if (!audioEngineRef.current) {
          audioEngineRef.current = new AudioFrequencyEngine();
        }
        audioEngineRef.current.start();
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Mic start err:", err);
      }
    }
  };

  const handleUserVoiceQuery = (query: string) => {
    if (!query.trim()) return;
    setMood("thinking");
    setSpeechBubbleText(`أسمعك جيداً يا بني: "${query}"... دعني أفكر في معادلاتها بعين الحكمة!`);

    if (onSendMessage) {
      onSendMessage(query);
    } else {
      setTimeout(() => {
        speakProfessorLine(
          `سؤال رائع يا بني عن "${query}"! في فيزياء أوميغا، كل حركة في هذا الكون تخضع لمبادئ التحريك وقوانين الحفظ الصارمة!`
        );
      }, 1000);
    }
  };

  const applyOldManPreset = (preset: "wise" | "scholar" | "deep") => {
    setOldManPreset(preset);
    if (preset === "wise") {
      setOldManPitch(0.68);
      setOldManRate(0.84);
      speakProfessorLine(
        "أهلاً بك يا بني.. الحكمة لا تأتي إلا مع الصبر والتجربة والتأمل في قوانين الطبيعة."
      );
    } else if (preset === "scholar") {
      setOldManPitch(0.74);
      setOldManRate(0.92);
      speakProfessorLine(
        "انظر يا بني! رغم تقدم السن، ما زال شغف الاكتشاف متوقداً كالنار في قلبي!"
      );
    } else if (preset === "deep") {
      setOldManPitch(0.58);
      setOldManRate(0.78);
      speakProfessorLine(
        "تأمل في هذا الزمكان الفسيح.. الذرات التي تؤلفنا وُلدت في قلوب النجوم العتيقة."
      );
    }
  };

  const speakProfessorLine = (text: string, customPitchOverride?: number, customRateOverride?: number) => {
    if (isMuted) return;
    setSpeechBubbleText(text);
    speakWithOmega(text, {
      personaId: "professor-omega",
      customPitch: customPitchOverride ?? oldManPitch,
      rateMultiplier: (customRateOverride ?? oldManRate) / 0.86,
      playAcousticIntro: true,
      onStart: () => {
        setIsSpeaking(true);
        setMood((prev) => (prev === "neutral" ? "speaking" : prev));
      },
      onEnd: () => {
        setIsSpeaking(false);
        setMood("neutral");
        // Full Duplex: automatically re-arm listening loop if duplex mode is enabled
        if (isDuplexMode && recognitionRef.current) {
          setTimeout(() => {
            try {
              setTranscript("");
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {
              // already active or permission issue
            }
          }, 800);
        }
      },
    });
  };

  // Build the Canvas texture for the Ω badge
  const createOmegaBadgeTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 256, 256);

      // Gold badge border
      ctx.lineWidth = 14;
      ctx.strokeStyle = "#0891b2";
      ctx.strokeRect(10, 10, 236, 236);

      // Inner lab pocket stitch
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = "#0284c7";
      ctx.strokeRect(24, 24, 208, 208);
      ctx.setLineDash([]);

      // Glowing Greek Omega Symbol (Ω)
      ctx.font = "bold 130px 'Times New Roman', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#0e7490";
      ctx.fillText("Ω", 128, 122);

      // Sub-text: OMEGA LABS
      ctx.font = "bold 20px monospace";
      ctx.fillStyle = "#0369a1";
      ctx.fillText("OMEGA LAB", 128, 195);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  // 3D Scene Initialization
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 360;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 3.4);
    camera.lookAt(0, 0.4, 0);
    cameraRef.current = camera;

    // WebGL Renderer safely initialized
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      rendererRef.current = renderer;
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn("[OmegaProfessor3D] WebGL context initialization failed or disabled:", err);
      return;
    }

    // ==========================================
    // Lighting (Warm Lab Atmosphere + Cyan Highlights)
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xf1f5f9, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.0);
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-3, 3, -2);
    scene.add(rimLight);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 1.5, 4);
    cyanPoint.position.set(-0.6, 0.2, 0.8);
    scene.add(cyanPoint);
    flaskLightRef.current = cyanPoint;

    // ==========================================
    // Character Hierarchy: The Eccentric Professor Omega
    // ==========================================
    const characterRoot = new THREE.Group();
    scene.add(characterRoot);

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf5d0b5,
      roughness: 0.55,
      metalness: 0.05,
    });
    const whiteCoatMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.1,
    });
    const darkVestMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
    });
    const tieMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Crimson eccentric bow tie
      roughness: 0.3,
    });
    const wildHairMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
    });
    const goldRimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const glassLensMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.85,
      opacity: 0.8,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
    });

    // --- TORSO & LAB COAT ---
    const torsoGroup = new THREE.Group();
    characterRoot.add(torsoGroup);

    // Main Coat Torso
    const coatGeom = new THREE.CylinderGeometry(0.48, 0.65, 1.3, 16);
    const coatMesh = new THREE.Mesh(coatGeom, whiteCoatMat);
    coatMesh.position.y = -0.3;
    torsoGroup.add(coatMesh);

    // Dark Vest / Shirt inside coat opening
    const vestGeom = new THREE.CylinderGeometry(0.38, 0.45, 0.85, 16, 1, false, 0, Math.PI);
    const vestMesh = new THREE.Mesh(vestGeom, darkVestMat);
    vestMesh.rotation.y = Math.PI * 0.5;
    vestMesh.position.set(0, -0.1, 0.08);
    torsoGroup.add(vestMesh);

    // High Shirt Collar
    const collarGeom = new THREE.TorusGeometry(0.26, 0.06, 8, 20);
    const collarMesh = new THREE.Mesh(collarGeom, whiteCoatMat);
    collarMesh.rotation.x = Math.PI * 0.5;
    collarMesh.position.set(0, 0.38, 0);
    torsoGroup.add(collarMesh);

    // Crimson Bow Tie
    const bowCenterGeom = new THREE.SphereGeometry(0.05, 8, 8);
    const bowLeftGeom = new THREE.ConeGeometry(0.08, 0.18, 5);
    const bowRightGeom = new THREE.ConeGeometry(0.08, 0.18, 5);

    const bowCenter = new THREE.Mesh(bowCenterGeom, tieMat);
    bowCenter.position.set(0, 0.32, 0.34);
    torsoGroup.add(bowCenter);

    const bowLeft = new THREE.Mesh(bowLeftGeom, tieMat);
    bowLeft.rotation.z = Math.PI * 0.5;
    bowLeft.position.set(-0.12, 0.32, 0.34);
    torsoGroup.add(bowLeft);

    const bowRight = new THREE.Mesh(bowRightGeom, tieMat);
    bowRight.rotation.z = -Math.PI * 0.5;
    bowRight.position.set(0.12, 0.32, 0.34);
    torsoGroup.add(bowRight);

    // White Coat Lapels
    const lapelGeom = new THREE.BoxGeometry(0.12, 0.6, 0.04);
    const lapelLeft = new THREE.Mesh(lapelGeom, whiteCoatMat);
    lapelLeft.position.set(-0.2, 0.05, 0.44);
    lapelLeft.rotation.z = -0.18;
    torsoGroup.add(lapelLeft);

    const lapelRight = new THREE.Mesh(lapelGeom, whiteCoatMat);
    lapelRight.position.set(0.2, 0.05, 0.44);
    lapelRight.rotation.z = 0.18;
    torsoGroup.add(lapelRight);

    // OMEGA (Ω) BADGE ON THE LAB COAT CHEST POCKET
    const badgeTexture = createOmegaBadgeTexture();
    const badgeMat = new THREE.MeshStandardMaterial({
      map: badgeTexture,
      roughness: 0.3,
      metalness: 0.1,
    });
    const badgeGeom = new THREE.PlaneGeometry(0.2, 0.2);
    const badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
    badgeMesh.position.set(-0.3, 0.08, 0.46);
    badgeMesh.rotation.y = 0.2;
    torsoGroup.add(badgeMesh);
    omegaBadgeRef.current = badgeMesh;

    // Golden Pens in Pocket
    const penGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8);
    const pen1 = new THREE.Mesh(penGeom, goldRimMat);
    pen1.position.set(-0.35, 0.22, 0.44);
    pen1.rotation.z = 0.1;
    torsoGroup.add(pen1);

    const pen2 = new THREE.Mesh(penGeom, new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    pen2.position.set(-0.32, 0.21, 0.44);
    pen2.rotation.z = -0.05;
    torsoGroup.add(pen2);

    // --- HEAD GROUP ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.72, 0);
    characterRoot.add(headGroup);
    headGroupRef.current = headGroup;

    // Main Stylized Head Mesh
    const headGeom = new THREE.SphereGeometry(0.42, 24, 24);
    headGeom.scale(0.9, 1.15, 0.95);
    const headMesh = new THREE.Mesh(headGeom, skinMat);
    headGroup.add(headMesh);

    // Scholar Nose
    const noseGeom = new THREE.ConeGeometry(0.08, 0.2, 8);
    const noseMesh = new THREE.Mesh(noseGeom, skinMat);
    noseMesh.rotation.x = Math.PI * 0.45;
    noseMesh.position.set(0, -0.02, 0.46);
    headGroup.add(noseMesh);

    // Warm Old Professor Ears
    const earGeom = new THREE.SphereGeometry(0.09, 8, 8);
    earGeom.scale(0.5, 1.2, 0.7);
    const leftEar = new THREE.Mesh(earGeom, skinMat);
    leftEar.position.set(-0.42, 0.02, 0);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, skinMat);
    rightEar.position.set(0.42, 0.02, 0);
    headGroup.add(rightEar);

    // Big Scientist Goggles / Glasses
    const glassesGroup = new THREE.Group();
    headGroup.add(glassesGroup);
    glassesGroupRef.current = glassesGroup;

    const goggleRadius = 0.13;
    const goggleTorusGeom = new THREE.TorusGeometry(goggleRadius, 0.025, 10, 24);
    const goggleLensGeom = new THREE.CircleGeometry(goggleRadius * 0.95, 20);

    // Left Goggle
    const leftGoggleRim = new THREE.Mesh(goggleTorusGeom, goldRimMat);
    leftGoggleRim.position.set(-0.16, 0.06, 0.42);
    glassesGroup.add(leftGoggleRim);

    const leftGoggleLens = new THREE.Mesh(goggleLensGeom, glassLensMat);
    leftGoggleLens.position.set(-0.16, 0.06, 0.42);
    glassesGroup.add(leftGoggleLens);

    // Right Goggle
    const rightGoggleRim = new THREE.Mesh(goggleTorusGeom, goldRimMat);
    rightGoggleRim.position.set(0.16, 0.06, 0.42);
    glassesGroup.add(rightGoggleRim);

    const rightGoggleLens = new THREE.Mesh(goggleLensGeom, glassLensMat);
    rightGoggleLens.position.set(0.16, 0.06, 0.42);
    glassesGroup.add(rightGoggleLens);

    // Glasses Bridge
    const bridgeGeom = new THREE.BoxGeometry(0.1, 0.025, 0.02);
    const bridgeMesh = new THREE.Mesh(bridgeGeom, goldRimMat);
    bridgeMesh.position.set(0, 0.07, 0.43);
    glassesGroup.add(bridgeMesh);

    // Eyes (Behind the lenses)
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 }); // Cyber-blue energetic pupil

    // Left Eye
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.16, 0.06, 0.36);
    const leftBall = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), eyeWhiteMat);
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), pupilMat);
    leftPupil.position.z = 0.06;
    leftEyeGroup.add(leftBall);
    leftEyeGroup.add(leftPupil);
    headGroup.add(leftEyeGroup);
    leftEyeRef.current = leftEyeGroup;

    // Right Eye
    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.16, 0.06, 0.36);
    const rightBall = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), eyeWhiteMat);
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), pupilMat);
    rightPupil.position.z = 0.06;
    rightEyeGroup.add(rightBall);
    rightEyeGroup.add(rightPupil);
    headGroup.add(rightEyeGroup);
    rightEyeRef.current = rightEyeGroup;

    // Bushy White Eyebrows
    const browGeom = new THREE.BoxGeometry(0.16, 0.05, 0.06);
    const leftBrow = new THREE.Mesh(browGeom, wildHairMat);
    leftBrow.position.set(-0.16, 0.22, 0.41);
    leftBrow.rotation.z = 0.15;
    headGroup.add(leftBrow);
    leftEyebrowRef.current = leftBrow;

    const rightBrow = new THREE.Mesh(browGeom, wildHairMat);
    rightBrow.position.set(0.16, 0.22, 0.41);
    rightBrow.rotation.z = -0.15;
    headGroup.add(rightBrow);
    rightEyebrowRef.current = rightBrow;

    // Bushy White Mustache
    const mustacheGroup = new THREE.Group();
    mustacheGroup.position.set(0, -0.14, 0.42);
    const mustacheL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), wildHairMat);
    mustacheL.rotation.z = Math.PI * 0.4;
    mustacheL.position.x = -0.1;
    mustacheGroup.add(mustacheL);

    const mustacheR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), wildHairMat);
    mustacheR.rotation.z = -Math.PI * 0.4;
    mustacheR.position.x = 0.1;
    mustacheGroup.add(mustacheR);

    headGroup.add(mustacheGroup);
    mustacheGroupRef.current = mustacheGroup;

    // ARTICULATED LOWER JAW / MOUTH (For Lip-Sync Speech!)
    const jawGeom = new THREE.BoxGeometry(0.24, 0.09, 0.22);
    const jawMesh = new THREE.Mesh(jawGeom, skinMat);
    jawMesh.position.set(0, -0.25, 0.28);
    headGroup.add(jawMesh);
    jawMeshRef.current = jawMesh;

    // Wild Eccentric Scientist Hair (Einstein / Doc Brown style)
    const hairTuftGroup = new THREE.Group();
    headGroup.add(hairTuftGroup);

    const tuftCount = 18;
    for (let i = 0; i < tuftCount; i++) {
      const angle = (i / tuftCount) * Math.PI * 1.6 - Math.PI * 0.3;
      const radius = 0.42;
      const tuftGeom = new THREE.ConeGeometry(0.1 + Math.random() * 0.06, 0.35 + Math.random() * 0.25, 5);
      const tuftMesh = new THREE.Mesh(tuftGeom, wildHairMat);

      const x = Math.cos(angle) * radius;
      const y = 0.22 + Math.sin(angle * 0.8) * 0.25;
      const z = -0.15 + (Math.random() - 0.5) * 0.25;

      tuftMesh.position.set(x, y, z);
      tuftMesh.rotation.z = -angle * 0.8 + (Math.random() - 0.5) * 0.4;
      tuftMesh.rotation.x = -0.4 + (Math.random() - 0.5) * 0.5;
      hairTuftGroup.add(tuftMesh);
    }

    // Top hair spikes
    for (let j = 0; j < 6; j++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 5), wildHairMat);
      spike.position.set((j - 2.5) * 0.09, 0.48, -0.05 + (Math.random() - 0.5) * 0.1);
      spike.rotation.z = (Math.random() - 0.5) * 0.6;
      spike.rotation.x = -0.2 + (Math.random() - 0.5) * 0.4;
      hairTuftGroup.add(spike);
    }

    // --- LEFT ARM: HOLDING THE QUANTUM FLASK ---
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.48, 0.2, 0.1);
    torsoGroup.add(leftArmGroup);
    leftArmRef.current = leftArmGroup;

    // Upper arm
    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.45, 10), whiteCoatMat);
    lUpperArm.position.set(-0.08, -0.15, 0);
    lUpperArm.rotation.z = 0.35;
    leftArmGroup.add(lUpperArm);

    // Forearm angled forward
    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.4, 10), whiteCoatMat);
    lForearm.position.set(-0.06, -0.4, 0.2);
    lForearm.rotation.x = -Math.PI * 0.35;
    leftArmGroup.add(lForearm);

    // Hand holding beaker
    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
    lHand.position.set(-0.06, -0.48, 0.36);
    leftArmGroup.add(lHand);

    // Quantum Conical Lab Flask (Erlenmeyer)
    const flaskGroup = new THREE.Group();
    flaskGroup.position.set(-0.06, -0.42, 0.48);
    leftArmGroup.add(flaskGroup);

    const flaskGeom = new THREE.ConeGeometry(0.14, 0.28, 12);
    const flaskGlass = new THREE.Mesh(
      flaskGeom,
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.9,
        transparent: true,
        roughness: 0.1,
        ior: 1.45,
      })
    );
    flaskGroup.add(flaskGlass);

    // Glowing Liquid inside flask
    const liquidGeom = new THREE.ConeGeometry(0.12, 0.2, 12);
    const liquidMesh = new THREE.Mesh(
      liquidGeom,
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      })
    );
    liquidMesh.position.y = -0.03;
    flaskGroup.add(liquidMesh);
    flaskLiquidRef.current = liquidMesh;

    // Flask Neck
    const neckGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10);
    const neckMesh = new THREE.Mesh(neckGeom, flaskGlass.material);
    neckMesh.position.y = 0.18;
    flaskGroup.add(neckMesh);

    // --- RIGHT ARM: ARTICULATED GESTURING ARM ---
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.48, 0.2, 0.1);
    torsoGroup.add(rightArmGroup);
    rightArmRef.current = rightArmGroup;

    // Upper arm
    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.45, 10), whiteCoatMat);
    rUpperArm.position.set(0.08, -0.15, 0);
    rUpperArm.rotation.z = -0.3;
    rightArmGroup.add(rUpperArm);

    // Forearm
    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.4, 10), whiteCoatMat);
    rForearm.position.set(0.12, -0.38, 0.15);
    rForearm.rotation.x = -Math.PI * 0.25;
    rightArmGroup.add(rForearm);

    // Hand & Articulated Pointer Finger
    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
    rHand.position.set(0.14, -0.45, 0.28);
    rightArmGroup.add(rHand);

    // Extended Index Finger for UI pointing
    const indexFinger = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.12, 8), skinMat);
    indexFinger.position.set(0.15, -0.52, 0.35);
    indexFinger.rotation.x = -Math.PI * 0.45;
    rightArmGroup.add(indexFinger);

    // Holographic Laser Pointer Beam
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.85,
    });
    const laserBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.024, 1.4, 8),
      laserMat
    );
    laserBeam.position.set(0.15, -0.92, 0.85);
    laserBeam.rotation.x = -Math.PI * 0.38;
    laserBeam.visible = false;
    rightArmGroup.add(laserBeam);
    pointerLaserRef.current = laserBeam;

    // ==========================================
    // Mouse Tracking Event
    // ==========================================
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePosRef.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    };

    window.addEventListener("mousemove", handleMouseMove);

    // ==========================================
    // Animation Loop
    // ==========================================
    let isLoopActive = true;
    let lastTime = performance.now();
    let startTime = performance.now();
    let blinkTimer = 0;
    let isBlinking = false;

    const animate = () => {
      if (!isLoopActive) return;
      animFrameIdRef.current = requestAnimationFrame(animate);
      const currentTime = performance.now();
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const time = (currentTime - startTime) / 1000;

      // Smooth gaze interpolation
      targetLookRef.current.x += (mousePosRef.current.x - targetLookRef.current.x) * 0.06;
      targetLookRef.current.y += (mousePosRef.current.y - targetLookRef.current.y) * 0.06;

      // Idle breathing and subtle head sway
      const breathing = Math.sin(time * 2.2) * 0.03;
      torsoGroup.position.y = breathing * 0.5;

      if (headGroupRef.current) {
        // Head rotation tracks cursor + organic sway
        headGroupRef.current.rotation.y = targetLookRef.current.x * 0.45 + Math.sin(time * 0.8) * 0.04;
        headGroupRef.current.rotation.x = -targetLookRef.current.y * 0.35 + Math.cos(time * 1.2) * 0.03;
        headGroupRef.current.position.y = 0.72 + breathing;
      }

      // Eye pupil tracking
      if (leftEyeRef.current && rightEyeRef.current) {
        leftEyeRef.current.rotation.y = targetLookRef.current.x * 0.3;
        leftEyeRef.current.rotation.x = -targetLookRef.current.y * 0.25;
        rightEyeRef.current.rotation.y = targetLookRef.current.x * 0.3;
        rightEyeRef.current.rotation.x = -targetLookRef.current.y * 0.25;
      }

      // Eye Blinking simulation
      blinkTimer += delta;
      if (blinkTimer > 3.5 + Math.sin(time) * 1.5) {
        isBlinking = true;
        if (blinkTimer > 3.7 + Math.sin(time) * 1.5) {
          isBlinking = false;
          blinkTimer = 0;
        }
      }
      if (leftEyeRef.current && rightEyeRef.current) {
        const eyeScaleY = isBlinking ? 0.1 : 1.0;
        leftEyeRef.current.scale.y = eyeScaleY;
        rightEyeRef.current.scale.y = eyeScaleY;
      }

      // --- MOOD & SPEECH ARTICULATION ---
      const jaw = jawMeshRef.current;
      const mustache = mustacheGroupRef.current;
      const lBrow = leftEyebrowRef.current;
      const rBrow = rightEyebrowRef.current;
      const rArm = rightArmRef.current;

      if (isSpeaking) {
        // Dynamic Lip-Sync Mouth Opening (modulated by rapid sin harmonics)
        const mouthOpen = Math.abs(Math.sin(time * 16) * 0.12 + Math.sin(time * 9) * 0.06);
        if (jaw) {
          jaw.position.y = -0.25 - mouthOpen;
          jaw.scale.y = 1 + mouthOpen * 3;
        }
        if (mustache) {
          mustache.position.y = -0.14 - mouthOpen * 0.4;
          mustache.rotation.z = Math.sin(time * 12) * 0.08;
        }
        if (lBrow && rBrow) {
          // Expressive raised eyebrows while talking
          lBrow.position.y = 0.23 + Math.sin(time * 5) * 0.03;
          rBrow.position.y = 0.23 + Math.cos(time * 5) * 0.03;
        }
        if (rArm) {
          // Gesturing right hand
          rArm.rotation.x = Math.sin(time * 4) * 0.3 - 0.2;
          rArm.rotation.z = Math.cos(time * 3) * 0.2;
        }
      } else {
        // Closed / resting mouth
        if (jaw) {
          jaw.position.y = -0.25;
          jaw.scale.y = 1.0;
        }
        if (mustache) {
          mustache.position.y = -0.14;
          mustache.rotation.z = 0;
        }

        // Default state resets for micro-expression rigs
        if (pointerLaserRef.current) pointerLaserRef.current.visible = false;
        if (glassesGroupRef.current) glassesGroupRef.current.position.y = 0;
        if (mustacheGroupRef.current) mustacheGroupRef.current.position.x = 0;

        if (mood === "eureka") {
          // Excited Eureka! Bouncing with wide eyes and raised arm!
          if (rArm) {
            rArm.rotation.x = -Math.PI * 0.7 + Math.sin(time * 10) * 0.15;
            rArm.rotation.y = 0;
            rArm.rotation.z = 0.4;
          }
          if (lBrow && rBrow) {
            lBrow.position.y = 0.26;
            rBrow.position.y = 0.26;
          }
        } else if (mood === "thinking") {
          // Hand to chin / scratching head
          if (rArm) {
            rArm.rotation.x = -Math.PI * 0.55;
            rArm.rotation.y = 0;
            rArm.rotation.z = -0.3;
          }
          if (lBrow && rBrow) {
            lBrow.position.y = 0.19;
            rBrow.position.y = 0.24; // Quirky one-eyebrow raise!
          }
        } else if (mood === "adjust_glasses") {
          // Micro-expression 1: Adjusting goggles / glasses with thumb & forefinger
          if (rArm) {
            rArm.rotation.x = -Math.PI * 0.58 + Math.sin(time * 8) * 0.04;
            rArm.rotation.y = -0.18;
            rArm.rotation.z = -0.34;
          }
          if (glassesGroupRef.current) {
            // Glasses slide subtly up the bridge
            glassesGroupRef.current.position.y = 0.015 + Math.sin(time * 8) * 0.008;
          }
          if (headGroupRef.current) {
            // Tilts head back slightly to seat the glasses
            headGroupRef.current.rotation.x = -0.1 + Math.sin(time * 4) * 0.02;
          }
          if (lBrow && rBrow) {
            lBrow.position.y = 0.24;
            rBrow.position.y = 0.24;
          }
        } else if (mood === "scratch_beard") {
          // Micro-expression 2: Pensive beard stroking / scratching
          if (rArm) {
            rArm.rotation.x = -Math.PI * 0.44;
            rArm.rotation.y = -0.14;
            rArm.rotation.z = -0.38 + Math.sin(time * 7) * 0.05;
          }
          if (mustacheGroupRef.current) {
            // Mustache and beard slightly ruffled
            mustacheGroupRef.current.position.x = Math.sin(time * 7) * 0.008;
          }
          if (headGroupRef.current) {
            // Curious sideway tilt of the elder scholar
            headGroupRef.current.rotation.z = -0.12 + Math.sin(time * 3) * 0.02;
          }
          if (lBrow && rBrow) {
            lBrow.position.y = 0.18;
            rBrow.position.y = 0.26; // Asymmetric pondering brow
          }
        } else if (mood === "pointing") {
          // Direct UI Pointing gesture towards formulas/viewport
          if (rArm) {
            rArm.rotation.x = -Math.PI * 0.48;
            rArm.rotation.y = -0.42;
            rArm.rotation.z = 0.18 + Math.sin(time * 3) * 0.04;
          }
          if (pointerLaserRef.current) {
            pointerLaserRef.current.visible = true;
            (pointerLaserRef.current.material as THREE.MeshBasicMaterial).opacity =
              0.65 + Math.sin(time * 12) * 0.35;
          }
          if (headGroupRef.current) {
            // Head turns to face what he is pointing at
            headGroupRef.current.rotation.y = -0.22;
            headGroupRef.current.rotation.x = 0.04;
          }
          if (lBrow && rBrow) {
            lBrow.position.y = 0.24;
            rBrow.position.y = 0.24;
          }
        } else {
          // Neutral resting arm
          if (rArm) {
            rArm.rotation.x = Math.sin(time * 1.5) * 0.05;
            rArm.rotation.y = 0;
            rArm.rotation.z = 0;
          }
          if (lBrow && rBrow) {
            lBrow.position.y = 0.22;
            rBrow.position.y = 0.22;
          }
        }
      }

      // Flask bubbling and light pulsing
      if (flaskLightRef.current && flaskLiquidRef.current) {
        const pulse = 1.0 + Math.sin(time * 6) * 0.4;
        flaskLightRef.current.intensity = 1.2 * pulse;
        (flaskLiquidRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 * pulse;
      }

      // Gentle badge emission pulse
      if (omegaBadgeRef.current) {
        omegaBadgeRef.current.position.z = 0.46 + Math.sin(time * 3) * 0.002;
      }

      try {
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          renderer.render(scene, camera);
        }
      } catch (e) {
        // Suppress WebGL lost context / transient render errors
      }
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 360;
      camera.aspect = w / (h || 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      isLoopActive = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className={`relative flex flex-col rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950 text-slate-100 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        isFloating
          ? "fixed bottom-6 right-6 z-50 w-80 sm:w-96 overflow-hidden shadow-cyan-950/50"
          : isExpanded
          ? "w-full h-full min-h-[460px]"
          : "w-full h-[380px]"
      }`}
      dir="rtl"
    >
      {/* Top Header Card */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-cyan-500/20 bg-slate-900/60 z-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <div className="text-right">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>البروفيسور أوميغا 3D</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded bg-cyan-950 text-cyan-300 border border-cyan-600/40">
                Ω Live
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">كبير علماء أوميغا • محاكاة ثلاثية الأبعاد</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Old Man Voice Settings Trigger */}
          <button
            type="button"
            onClick={() => setShowVoiceSettings((prev) => !prev)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              showVoiceSettings
                ? "bg-amber-950/80 border-amber-400 text-amber-300 ring-1 ring-amber-400/40"
                : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white"
            }`}
            title="تخصيص وضبط نبرة صوت الرجل العجوز"
          >
            <span>👴</span>
            <span className="hidden sm:inline">صوت العجوز</span>
            <Sliders className="w-3 h-3 text-amber-400" />
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsMuted((prev) => {
                const next = !prev;
                if (next) stopSpeaking();
                return next;
              });
            }}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isMuted
                ? "bg-red-950/60 border-red-500/30 text-red-400"
                : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white"
            }`}
            title={isMuted ? "إلغاء كتم الصوت" : "كتم صوت البروفيسور"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Expand Toggle */}
          {!isFloating && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isExpanded ? "تصغير" : "تكبير"}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Close if Floating */}
          {isFloating && onCloseFloating && (
            <button
              type="button"
              onClick={onCloseFloating}
              className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="إغلاق الشاشة العائمة"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div className="relative flex-1 w-full min-h-[200px] overflow-hidden bg-radial from-slate-900/60 to-black/90">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Old Man Voice Settings Floating Popover */}
        {showVoiceSettings && (
          <div className="absolute inset-x-2 top-2 z-30 p-3 rounded-xl bg-slate-950/95 border border-amber-500/40 shadow-2xl backdrop-blur-md text-right text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <span className="text-base">👴</span>
                <span>تخصيص نبرة صوت الرجل العجوز</span>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceSettings(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Presets */}
            <div className="mb-3">
              <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">
                الأنماط الصوتية للعجوز:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyOldManPreset("wise")}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-center transition-all cursor-pointer ${
                    oldManPreset === "wise"
                      ? "bg-amber-950/80 border-amber-400 text-amber-200 ring-1 ring-amber-400/40"
                      : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="font-bold">حكيم ووقور</div>
                  <div className="text-[9px] text-slate-400">نبرة هادئة ورصينة</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyOldManPreset("scholar")}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-center transition-all cursor-pointer ${
                    oldManPreset === "scholar"
                      ? "bg-amber-950/80 border-amber-400 text-amber-200 ring-1 ring-amber-400/40"
                      : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="font-bold">كهل متوقد</div>
                  <div className="text-[9px] text-slate-400">حماس علمي عالٍ</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyOldManPreset("deep")}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-center transition-all cursor-pointer ${
                    oldManPreset === "deep"
                      ? "bg-amber-950/80 border-amber-400 text-amber-200 ring-1 ring-amber-400/40"
                      : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="font-bold">فيلسوف عميق</div>
                  <div className="text-[9px] text-slate-400">عمق جهوري متأمل</div>
                </button>
              </div>
            </div>

            {/* Fine Tuning Sliders */}
            <div className="space-y-2 mb-3 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>عمق الصوت (Pitch - الخشونة والوقار):</span>
                  <span className="font-mono text-amber-400">{Math.round(oldManPitch * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.45"
                  max="0.85"
                  step="0.02"
                  value={oldManPitch}
                  onChange={(e) => setOldManPitch(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>تؤدة الإلقاء (Speed - سرعة الحديث):</span>
                  <span className="font-mono text-amber-400">{Math.round(oldManRate * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.65"
                  max="1.10"
                  step="0.02"
                  value={oldManRate}
                  onChange={(e) => setOldManRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>

            {/* Test Voice Button */}
            <button
              type="button"
              onClick={() =>
                speakProfessorLine(
                  "أهلاً بك يا بني.. الحكمة نتاج عقود من الصبر والتجربة والتأمل في نواميس الكون."
                )
              }
              className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>استمع إلى صوت العجوز الآن</span>
            </button>
          </div>
        )}

        {/* Live Speech Bubble Floating Over Head */}
        <div className="absolute top-2 left-3 right-3 pointer-events-none z-10">
          <div className="p-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-cyan-500/40 text-right shadow-xl">
            <div className="flex items-center justify-between text-[10px] text-cyan-400 border-b border-slate-800 pb-1 mb-1 font-mono">
              <span className="flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>شرح البروفيسور المباشر:</span>
              </span>
              {isSpeaking && (
                <span className="text-emerald-400 animate-pulse font-sans">يتحدث الآن 🎙️</span>
              )}
            </div>
            <p className="text-xs text-slate-100 font-medium leading-relaxed">
              «{speechBubbleText}»
            </p>
          </div>
        </div>

        {/* Micro-Expressions & Gestures Control Dock */}
        <div className="absolute top-20 right-2 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={() =>
              triggerGesture(
                "adjust_glasses",
                "دعني أعدل نظاراتي لأرى تفاصيل معادلتك بدقة متناهية يا بني!"
              )
            }
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer shadow-md ${
              mood === "adjust_glasses"
                ? "bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400"
                : "bg-slate-900/80 backdrop-blur-sm border-slate-700 text-slate-300 hover:text-amber-300 hover:bg-slate-800"
            }`}
            title="تعديل النظارات باليد (Micro-expression)"
          >
            <span>👓</span>
            <span className="text-[10px] hidden sm:inline">نظارات</span>
          </button>

          <button
            type="button"
            onClick={() =>
              triggerGesture(
                "scratch_beard",
                "مسألة تثير الفضول العلمي حقاً.. دعني أحك لحيتي وأتأمل في قوانينها!"
              )
            }
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer shadow-md ${
              mood === "scratch_beard"
                ? "bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400"
                : "bg-slate-900/80 backdrop-blur-sm border-slate-700 text-slate-300 hover:text-amber-300 hover:bg-slate-800"
            }`}
            title="حك اللحية والتأمل (Micro-expression)"
          >
            <span>🧔</span>
            <span className="text-[10px] hidden sm:inline">حك اللحية</span>
          </button>

          <button
            type="button"
            onClick={() =>
              triggerGesture(
                "pointing",
                "انظر هنا يا بني مباشرة إلى هذه المعادلة والمحاكاة التفاعلية على الشاشة!"
              )
            }
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer shadow-md ${
              mood === "pointing"
                ? "bg-cyan-500 text-slate-950 border-cyan-300 ring-2 ring-cyan-400"
                : "bg-slate-900/80 backdrop-blur-sm border-slate-700 text-slate-300 hover:text-cyan-300 hover:bg-slate-800"
            }`}
            title="إشارة مباشرة إلى الشاشة بالليزر الهولوغرافي"
          >
            <span>👉</span>
            <span className="text-[10px] hidden sm:inline">إشارة</span>
          </button>
        </div>

        {/* Floating Controls Overlay */}
        <div className="absolute bottom-2 left-3 right-3 flex flex-wrap items-center justify-between gap-1.5 z-10">
          {/* Quick Mood Triggers */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                triggerGesture(
                  "eureka",
                  "يا إلهي! فكرة عبقرية يا بني! انظر كيف تتطابق المعادلات الفيزيائية بعد كل هذه السنين!"
                );
              }}
              className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                mood === "eureka"
                  ? "bg-amber-500 text-slate-950 border-amber-300 font-bold"
                  : "bg-amber-950/80 border-amber-500/40 text-amber-300 hover:bg-amber-900"
              }`}
              title="تفعيل حالة الاكتشاف Eureka!"
            >
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>Eureka!</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerGesture(
                  "thinking",
                  "هممم... دعني أفكر ملياً يا بني بعين الخبرة والتجربة في شروط المسألة الفيزيائية!"
                );
              }}
              className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                mood === "thinking"
                  ? "bg-cyan-500 text-slate-950 border-cyan-300 font-bold"
                  : "bg-cyan-950/80 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900"
              }`}
              title="تفكير علمي"
            >
              <Brain className="w-3 h-3 text-cyan-400" />
              <span>تفكير</span>
            </button>

            {/* Full-Duplex Dialogue Toggle */}
            <button
              type="button"
              onClick={() => setIsDuplexMode((prev) => !prev)}
              className={`px-2 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                isDuplexMode
                  ? "bg-emerald-600 text-white border-emerald-400 ring-1 ring-emerald-400 shadow-sm"
                  : "bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
              title="تفعيل الحوار المستمر الكامل (Full-Duplex): تحدث دون توقف ويستمع البروفيسور تلقائياً"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDuplexMode ? "bg-emerald-300 animate-ping" : "bg-slate-500"
                }`}
              />
              <span>{isDuplexMode ? "Duplex مفعّل" : "محادثة حرة"}</span>
            </button>
          </div>

          {/* Direct Voice Input Button */}
          <button
            type="button"
            onClick={toggleMic}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg ${
              isListening
                ? "bg-red-600 text-white animate-pulse border border-red-400"
                : "bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400"
            }`}
            title="تحدث مع البروفيسور مباشرة بالصوت (يقاطع البروفيسور فوراً)"
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isListening ? "جاري الاستماع..." : "تحدث معه"}</span>
          </button>
        </div>
      </div>

      {/* Bottom Status / Mic Transcript & Audio Frequency Bar */}
      {isListening && (
        <div className="px-3 py-2 bg-red-950/90 border-t border-red-500/40 text-[11px] text-red-200 flex flex-col gap-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span className="font-semibold text-slate-100">البروفيسور يستمع لتردد صوتك:</span>
            </span>
            <span className="font-medium text-cyan-300 truncate max-w-[180px]">
              {transcript || "تكلم الآن..."}
            </span>
          </div>

          <AudioFrequencyVisualizer
            engine={audioEngineRef.current}
            isActive={isListening}
            mode="bars"
            height={28}
            barCount={24}
            accentTheme="cyan"
            showMetrics={false}
          />
        </div>
      )}
    </div>
  );
};
