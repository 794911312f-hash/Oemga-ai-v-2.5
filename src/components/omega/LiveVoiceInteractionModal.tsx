/**
 * src/components/omega/LiveVoiceInteractionModal.tsx
 * Full-screen / immersive real-time voice interaction room with Omega AI.
 * Features 3D holographic frequency spectrum, live transcription,
 * voice persona response selection, and direct full-duplex dialogue.
 */

import React, { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Radio,
  Headphones,
} from "lucide-react";
import { AudioFrequencyVisualizer } from "./AudioFrequencyVisualizer";
import { useVoiceInteraction } from "../../lib/omega/useVoiceInteraction";
import {
  OMEGA_VOICE_PERSONAS,
  speakWithOmega,
  stopSpeaking,
  type VoicePersona,
} from "../../lib/omega/speech";

interface LiveVoiceInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  initialPersonaId?: string;
}

export const LiveVoiceInteractionModal: React.FC<LiveVoiceInteractionModalProps> = ({
  isOpen,
  onClose,
  onSendMessage,
  initialPersonaId = "professor-omega",
}) => {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(initialPersonaId);
  const [autoSendOnSilence, setAutoSendOnSilence] = useState<boolean>(false);
  const [visualizerMode, setVisualizerMode] = useState<"bars" | "waveform" | "circular">("bars");
  const [omegaStatus, setOmegaStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [lastAnswer, setLastAnswer] = useState<string>("");

  const currentPersona =
    OMEGA_VOICE_PERSONAS.find((p) => p.id === selectedPersonaId) ||
    OMEGA_VOICE_PERSONAS[0];

  const {
    isListening,
    transcript,
    interimTranscript,
    frequencyEngine,
    error,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
  } = useVoiceInteraction({
    lang: "ar-SA",
    autoSendOnSilence: autoSendOnSilence,
    silenceDelayMs: 1800,
    onFinalTranscript: (text) => {
      handleDirectSend(text);
    },
  });

  // Auto-start listening when modal opens
  useEffect(() => {
    if (isOpen) {
      startListening();
      setOmegaStatus("listening");
    } else {
      stopListening();
      stopSpeaking();
      setOmegaStatus("idle");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isListening) {
      setOmegaStatus("listening");
    } else if (omegaStatus === "listening") {
      setOmegaStatus("idle");
    }
  }, [isListening]);

  if (!isOpen) return null;

  const currentSpeechText = (transcript + " " + interimTranscript).trim();

  const handleDirectSend = (textToSend?: string) => {
    const text = (textToSend || currentSpeechText).trim();
    if (!text) return;

    stopListening();
    setOmegaStatus("processing");

    // Send to main chat flow
    onSendMessage(text);

    // Provide immediate auditory acknowledgement from the selected persona
    const ack = `سمعتك بوضوح! جاري الآن معالجة سؤالك: "${text.slice(0, 60)}${text.length > 60 ? "..." : ""}"`;
    setLastAnswer(ack);
    setOmegaStatus("speaking");

    speakWithOmega(ack, {
      personaId: selectedPersonaId,
      onEnd: () => {
        setOmegaStatus("idle");
        clearTranscript();
        // If in continuous mode, resume listening automatically
        if (autoSendOnSilence) {
          setTimeout(() => {
            startListening();
          }, 400);
        }
      },
    });

    clearTranscript();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-300"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-cyan-500/40 rounded-3xl shadow-2xl p-4 sm:p-6 flex flex-col gap-5 overflow-hidden">
        {/* Glow ambient background highlights */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>التفاعل الصوتي المباشر مع أوميغا</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  مباشر عبر الميكروفون
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                تحدث بحرية بصوتك، واستمع لردود أوميغا الفورية عبر نماذج الذكاء الاصطناعي
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopListening();
              stopSpeaking();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق التفاعل الصوتي"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Indicator Pill */}
        <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full transition-all ${
                omegaStatus === "listening"
                  ? "bg-red-500 animate-ping"
                  : omegaStatus === "speaking"
                  ? "bg-cyan-400 animate-pulse"
                  : omegaStatus === "processing"
                  ? "bg-amber-400 animate-spin"
                  : "bg-slate-600"
              }`}
            />
            <span className="font-semibold text-slate-200">
              {omegaStatus === "listening" && "أوميغا يستمع لصوتك الآن..."}
              {omegaStatus === "speaking" && "أوميغا يتحدث إليك..."}
              {omegaStatus === "processing" && "جاري تحليل السؤال والبحث في النواة المعرفية..."}
              {omegaStatus === "idle" && "الميكروفون في وضع الاستعداد"}
            </span>
          </div>

          {/* Visualizer Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setVisualizerMode("bars")}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                visualizerMode === "bars"
                  ? "bg-cyan-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              أعمدة التردد
            </button>
            <button
              type="button"
              onClick={() => setVisualizerMode("waveform")}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                visualizerMode === "waveform"
                  ? "bg-cyan-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              موجة راسم الذبذبات
            </button>
            <button
              type="button"
              onClick={() => setVisualizerMode("circular")}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                visualizerMode === "circular"
                  ? "bg-cyan-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              الهالة الصوتية
            </button>
          </div>
        </div>

        {/* Dynamic Real-Time Audio Frequency Visualizer */}
        <div className="relative flex flex-col gap-2">
          <AudioFrequencyVisualizer
            engine={frequencyEngine}
            isActive={isListening}
            mode={visualizerMode}
            height={visualizerMode === "circular" ? 110 : 80}
            barCount={36}
            accentTheme="cyan"
            showMetrics={true}
          />

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Live Recognized Speech Transcript Display */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>النص الملتقط بالصوت مباشرة:</span>
            {currentSpeechText && (
              <button
                type="button"
                onClick={clearTranscript}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                مسح النص
              </button>
            )}
          </div>

          <div className="min-h-[72px] max-h-[120px] overflow-y-auto p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-sm leading-relaxed flex items-center justify-center text-center">
            {currentSpeechText ? (
              <p className="font-medium text-slate-100">
                <span>{transcript}</span>
                {interimTranscript && (
                  <span className="text-cyan-400 italic mr-1 animate-pulse">
                    {interimTranscript}...
                  </span>
                )}
              </p>
            ) : (
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                تكلم الآن بوضوح في الميكروفون ليتم التقاط صوتك فورياً...
              </span>
            )}
          </div>
        </div>

        {/* Persona Voice Selection Strip */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 text-purple-400" />
              <span>شخصية الرد الصوتي لأوميغا:</span>
            </span>
            <span className="text-[11px] text-purple-300 font-semibold">
              {currentPersona.nameAr}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {OMEGA_VOICE_PERSONAS.slice(0, 6).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPersonaId(p.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  selectedPersonaId === p.id
                    ? "bg-purple-950/80 border-purple-400 text-purple-200 ring-1 ring-purple-400/40 shadow-sm"
                    : "bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <span>{p.avatarEmoji}</span>
                <span className="font-medium">{p.nameAr}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          {/* Continuous Duplex / Auto-send Toggle */}
          <button
            type="button"
            onClick={() => setAutoSendOnSilence((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              autoSendOnSilence
                ? "bg-emerald-950 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/30"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
            }`}
            title="الإرسال التلقائي بمجرد التوقف عن الكلام (حوار مستمر)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoSendOnSilence ? "bg-emerald-400 animate-ping" : "bg-slate-600"
              }`}
            />
            <span>حوار مستمر تلقائي</span>
          </button>

          {/* Center Mic Toggle & Direct Send */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isListening
                  ? "bg-red-600 hover:bg-red-500 text-white border-red-400 ring-2 ring-red-400/40 animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>إيقاف الميكروفون</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <span>بدء التحدث</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleDirectSend()}
              disabled={!currentSpeechText}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span>إرسال لأوميغا</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
