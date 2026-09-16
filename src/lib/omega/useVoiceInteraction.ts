/**
 * src/lib/omega/useVoiceInteraction.ts
 * React hook orchestrating real-time microphone audio capture, Web Audio frequency analysis,
 * and Speech-to-Text transcription with auto-silence detection and duplex conversation loops.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { AudioFrequencyEngine, type AudioFrequencyMetrics } from "./audioFrequency";
import { stopSpeaking } from "./speech";

export interface UseVoiceInteractionOptions {
  lang?: string;
  autoSendOnSilence?: boolean;
  silenceDelayMs?: number;
  onFinalTranscript?: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

export interface UseVoiceInteractionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  frequencyEngine: AudioFrequencyEngine | null;
  metrics: AudioFrequencyMetrics;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleListening: () => void;
  clearTranscript: () => void;
}

export function useVoiceInteraction(
  options: UseVoiceInteractionOptions = {}
): UseVoiceInteractionReturn {
  const {
    lang = "ar-SA",
    autoSendOnSilence = false,
    silenceDelayMs = 1600,
    onFinalTranscript,
    onInterimTranscript,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AudioFrequencyMetrics>({
    averageVolume: 0,
    peakFrequencyHz: 0,
    decibels: -100,
    isVoiceDetected: false,
  });

  const engineRef = useRef<AudioFrequencyEngine | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const currentAccumulatedRef = useRef<string>("");

  // Check speech recognition support
  useEffect(() => {
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setIsSupported(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    currentAccumulatedRef.current = "";
  }, []);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (engineRef.current) {
      engineRef.current.stop();
    }

    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const startListening = useCallback(async () => {
    setError(null);

    // 1. Immediately interrupt any ongoing TTS so user can speak cleanly
    stopSpeaking();

    // 2. Initialize AudioFrequencyEngine
    if (!engineRef.current) {
      engineRef.current = new AudioFrequencyEngine();
    }

    try {
      await engineRef.current.start();
    } catch (err: any) {
      console.warn("Microphone audio engine error:", err);
      // Even if raw Web Audio fails, still attempt speech recognition
    }

    // 3. Initialize SpeechRecognition
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setError("التعرف على الصوت غير مدعوم في هذا المتصفح. استخدم متصفح Chrome أو Edge.");
      setIsListening(true); // Still allow audio spectrum
      onError?.("التعرف على الصوت غير مدعوم في هذا المتصفح");
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = lang;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onresult = (event: any) => {
        let finalStr = "";
        let interimStr = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += trans;
          } else {
            interimStr += trans;
          }
        }

        if (finalStr) {
          currentAccumulatedRef.current = (
            currentAccumulatedRef.current +
            " " +
            finalStr
          ).trim();
          setTranscript(currentAccumulatedRef.current);
          onInterimTranscript?.(currentAccumulatedRef.current);

          // If auto send on silence is active, reset debounce timer
          if (autoSendOnSilence) {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }
            silenceTimerRef.current = setTimeout(() => {
              const textToSend = currentAccumulatedRef.current.trim();
              if (textToSend) {
                onFinalTranscript?.(textToSend);
                clearTranscript();
              }
            }, silenceDelayMs);
          }
        }

        if (interimStr) {
          setInterimTranscript(interimStr);
          const fullDraft = (currentAccumulatedRef.current + " " + interimStr).trim();
          onInterimTranscript?.(fullDraft);

          // Reset silence timer while actively receiving interim speech
          if (autoSendOnSilence && silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
        }
      };

      rec.onerror = (event: any) => {
        console.warn("[SpeechRecognition Error]:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          const msg = "يرجى منح إذن استخدام الميكروفون في المتصفح للتحدث مع أوميغا.";
          setError(msg);
          onError?.(msg);
        } else if (event.error !== "no-speech") {
          setError(`خطأ في التعرف على الصوت: ${event.error}`);
        }
      };

      rec.onend = () => {
        // If still supposed to be listening, speech recognition may have timed out; gracefully restart or stop
        setIsListening(false);
      };

      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch (err: any) {
      console.error("Failed to start SpeechRecognition:", err);
      setError("تعذر بدء الميكروفون. يرجى التحقق من الأذونات.");
      onError?.(err?.message || "تعذر بدء الميكروفون");
    }
  }, [lang, autoSendOnSilence, silenceDelayMs, onFinalTranscript, onInterimTranscript, onError, clearTranscript]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    frequencyEngine: engineRef.current,
    metrics,
    error,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
  };
}
