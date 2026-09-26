import React, { useEffect, useState, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Sparkles,
  ChevronDown,
  Gauge,
  UserCheck,
  Download,
  UploadCloud,
  FileAudio,
  Sliders,
  Radio,
  Check,
  Loader2,
} from "lucide-react";
import {
  OMEGA_VOICE_PERSONAS,
  OMEGA_VOICE_ENGINES,
  subscribeSpeechState,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  speakWithOmega,
  type VoicePersona,
} from "../../lib/omega/speech";
import {
  synthesizeSpeechToWavBlob,
  triggerAudioFileDownload,
  decodeAudioFile,
  type DecodedAudioFileInfo,
} from "../../lib/omega/audioExporter";

interface OmegaVoicePlayerProps {
  currentPersonaId: string;
  onSelectPersona: (personaId: string) => void;
  speedMultiplier: number;
  onChangeSpeed: (speed: number) => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
}

export const OmegaVoicePlayer: React.FC<OmegaVoicePlayerProps> = ({
  currentPersonaId,
  onSelectPersona,
  speedMultiplier,
  onChangeSpeed,
  autoSpeak,
  onToggleAutoSpeak,
}) => {
  const [speechState, setSpeechState] = useState({
    isPlaying: false,
    isPaused: false,
    currentPersonaId,
    currentText: "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExportingAudio, setIsExportingAudio] = useState(false);
  const [uploadedAudio, setUploadedAudio] = useState<DecodedAudioFileInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAudioInfo, setShowAudioInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = subscribeSpeechState((s) => {
      setSpeechState(s);
    });
    return unsub;
  }, []);

  const activePersona: VoicePersona =
    OMEGA_VOICE_PERSONAS.find((p) => p.id === (speechState.currentPersonaId || currentPersonaId)) ||
    OMEGA_VOICE_PERSONAS[0];

  const engine = OMEGA_VOICE_ENGINES[activePersona.recommendedEngine] || OMEGA_VOICE_ENGINES.elevenlabs;

  // Handle direct audio file export as WAV
  const handleExportAudioFile = async () => {
    const textToExport = speechState.currentText || activePersona.sampleQuoteAr;
    setIsExportingAudio(true);
    try {
      const { blob, filename } = await synthesizeSpeechToWavBlob(textToExport, {
        personaId: activePersona.id,
        speed: speedMultiplier,
      });
      triggerAudioFileDownload(blob, filename);
    } catch (err) {
      console.error("[Omega Audio Export Error]:", err);
    } finally {
      setIsExportingAudio(false);
    }
  };

  // Handle local audio file upload & spectral analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const decoded = await decodeAudioFile(file);
      setUploadedAudio(decoded);
      setShowAudioInfo(true);
    } catch (err) {
      console.error("[Audio Decode Error]:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!speechState.isPlaying && !autoSpeak && !uploadedAudio) {
    // Show a compact floating pill or trigger in toolbar
    return null;
  }

  return (
    <div
      dir="rtl"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-3xl bg-zinc-950/95 border border-purple-500/30 rounded-2xl shadow-2xl backdrop-blur-xl p-3 text-zinc-100 animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          {/* Left / Start: Persona avatar & identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner border border-white/10"
              style={{ backgroundColor: `${activePersona.accentColor}20`, borderColor: activePersona.accentColor }}
            >
              {activePersona.avatarEmoji}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-100 truncate">
                  {activePersona.nameAr}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium border"
                  style={{
                    color: engine.accentColor,
                    borderColor: `${engine.accentColor}40`,
                    backgroundColor: `${engine.accentColor}15`,
                  }}
                >
                  {engine.name}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate max-w-[280px]">
                {speechState.isPlaying
                  ? speechState.isPaused
                    ? "متوقف مؤقتاً"
                    : "أوميغا يقرأ بصوت متزامن..."
                  : uploadedAudio
                  ? `ملف صوتي: ${uploadedAudio.name} (${uploadedAudio.durationSeconds.toFixed(1)}s)`
                  : "جاهز للقراءة الصوتية والتصدير"}
              </p>
            </div>
          </div>

          {/* Center: Live Soundwave Visualizer */}
          <div className="flex items-center gap-1 px-2 h-7 shrink-0">
            {[0.3, 0.7, 1.0, 0.5, 0.85, 0.4, 0.9, 0.6, 0.35].map((heightScale, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  speechState.isPlaying && !speechState.isPaused
                    ? "bg-purple-400 animate-pulse"
                    : "bg-zinc-700 h-1.5"
                }`}
                style={{
                  height:
                    speechState.isPlaying && !speechState.isPaused
                      ? `${Math.max(6, Math.sin(Date.now() / 200 + idx) * 10 + 14 * heightScale)}px`
                      : "4px",
                  animationDelay: `${idx * 75}ms`,
                }}
              />
            ))}
          </div>

          {/* Right: Controls (Download Audio, Upload Audio, Speed, Persona Picker, Play/Pause/Stop) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Download Audio File Button */}
            <button
              type="button"
              onClick={handleExportAudioFile}
              disabled={isExportingAudio}
              className="px-2.5 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 hover:text-white text-[11px] font-medium rounded-lg flex items-center gap-1 transition-all shadow-sm disabled:opacity-50"
              title="تصدير وتحميل ملف الصوت الفعلي (WAV/MP3)"
            >
              {isExportingAudio ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
              ) : (
                <Download className="w-3.5 h-3.5 text-purple-400" />
              )}
              <span className="hidden sm:inline">تحميل ملف الصوت</span>
            </button>

            {/* Upload Local Audio File */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg transition-colors"
              title="رفع ملف صوتي وتحليله (Upload Audio File)"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              ) : (
                <UploadCloud className="w-4 h-4 text-cyan-400" />
              )}
            </button>

            {/* Speed Toggle */}
            <button
              type="button"
              onClick={() => {
                const speeds = [0.85, 1.0, 1.25, 1.5];
                const nextIdx = (speeds.indexOf(speedMultiplier) + 1) % speeds.length;
                onChangeSpeed(speeds[nextIdx]);
              }}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono rounded-lg border border-zinc-700 text-zinc-300 transition-colors"
              title="سرعة القراءة الصوتية"
            >
              {speedMultiplier}x
            </button>

            {/* Persona selector quick toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-[11px] rounded-lg border border-zinc-700 text-zinc-300 flex items-center gap-1 transition-colors"
                title="اختيار نبرة الصوت أو العالم"
              >
                <span>نبرة الصوت</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isDropdownOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-64 max-h-72 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl p-1.5 shadow-2xl z-50 text-right space-y-1">
                  <div className="text-[10px] text-zinc-400 font-semibold px-2 py-1">
                    أصوات العلماء والمشاهير والرواة:
                  </div>
                  {OMEGA_VOICE_PERSONAS.map((persona) => (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => {
                        onSelectPersona(persona.id);
                        setIsDropdownOpen(false);
                        if (speechState.currentText && speechState.isPlaying) {
                          speakWithOmega(speechState.currentText, {
                            personaId: persona.id,
                            rateMultiplier: speedMultiplier,
                          });
                        }
                      }}
                      className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-xs transition-colors text-right ${
                        persona.id === activePersona.id
                          ? "bg-purple-600/30 text-purple-200 border border-purple-500/40"
                          : "hover:bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <span>{persona.avatarEmoji}</span>
                      <div className="truncate flex-1">
                        <div className="font-medium text-[11px]">{persona.nameAr}</div>
                        <div className="text-[9px] text-zinc-400 truncate">{persona.titleAr}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Play/Pause Button */}
            {speechState.isPlaying ? (
              speechState.isPaused ? (
                <button
                  type="button"
                  onClick={resumeSpeaking}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                  title="استئناف القراءة"
                >
                  <Play className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseSpeaking}
                  className="p-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
                  title="إيقاف مؤقت"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )
            ) : null}

            {/* Stop / Close Button */}
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                setUploadedAudio(null);
              }}
              className="p-1.5 bg-zinc-800 hover:bg-red-600/80 text-zinc-300 hover:text-white rounded-lg transition-colors"
              title="إيقاف الصوت وإغلاق المشغل"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Uploaded Audio Preview Bar (If a file is uploaded) */}
        {uploadedAudio && (
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileAudio className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-zinc-200 truncate">{uploadedAudio.name}</span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {uploadedAudio.sampleRate}Hz • {uploadedAudio.numberOfChannels}ch • {(uploadedAudio.size / 1024).toFixed(1)}KB
              </span>
            </div>
            <audio src={uploadedAudio.audioUrl} controls className="h-7 max-w-[220px]" />
          </div>
        )}
      </div>
    </div>
  );
};
