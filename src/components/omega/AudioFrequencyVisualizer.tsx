/**
 * src/components/omega/AudioFrequencyVisualizer.tsx
 * Real-time dynamic audio frequency visualizer with 60fps canvas animation,
 * glowing multi-band spectrum bars, peak-hold physics, and live telemetry.
 */

import React, { useEffect, useRef, useState } from "react";
import { Activity, Mic, Volume2 } from "lucide-react";
import { AudioFrequencyEngine, type AudioFrequencyMetrics } from "../../lib/omega/audioFrequency";

export interface AudioFrequencyVisualizerProps {
  engine?: AudioFrequencyEngine | null;
  isActive: boolean;
  mode?: "bars" | "waveform" | "circular" | "compact";
  height?: number;
  barCount?: number;
  className?: string;
  showMetrics?: boolean;
  accentTheme?: "cyan" | "purple" | "emerald" | "amber";
  onMetricsUpdate?: (metrics: AudioFrequencyMetrics) => void;
}

export const AudioFrequencyVisualizer: React.FC<AudioFrequencyVisualizerProps> = ({
  engine,
  isActive,
  mode = "bars",
  height = 54,
  barCount = 28,
  className = "",
  showMetrics = true,
  accentTheme = "cyan",
  onMetricsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const peakValuesRef = useRef<number[]>([]);
  const peakDecaySpeed = 1.4;

  const [metrics, setMetrics] = useState<AudioFrequencyMetrics>({
    averageVolume: 0,
    peakFrequencyHz: 0,
    decibels: -100,
    isVoiceDetected: false,
  });

  // Initialize or reset peaks
  useEffect(() => {
    peakValuesRef.current = new Array(barCount).fill(0);
  }, [barCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isMounted = true;

    const renderFrame = () => {
      if (!isMounted) return;

      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      if (!isActive || !engine) {
        // Render resting subtle wave / flat idle line
        drawIdleState(ctx, width, h, accentTheme);
        animationFrameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      // Read audio data from the frequency engine
      const freqData = engine.getFrequencyData();
      const currentMetrics = engine.getMetrics();

      setMetrics(currentMetrics);
      onMetricsUpdate?.(currentMetrics);

      if (mode === "bars" || mode === "compact") {
        drawBars(ctx, width, h, freqData, barCount, accentTheme, mode === "compact");
      } else if (mode === "waveform") {
        const timeData = engine.getTimeDomainData();
        drawWaveform(ctx, width, h, timeData, accentTheme);
      } else if (mode === "circular") {
        drawCircular(ctx, width, h, freqData, accentTheme, currentMetrics.averageVolume);
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animationFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, engine, mode, barCount, accentTheme, onMetricsUpdate]);

  // Render idle subtle baseline
  const drawIdleState = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    theme: string
  ) => {
    const centerY = height / 2;
    ctx.beginPath();
    ctx.strokeStyle =
      theme === "cyan"
        ? "rgba(6, 182, 212, 0.25)"
        : theme === "purple"
        ? "rgba(168, 85, 247, 0.25)"
        : "rgba(16, 185, 129, 0.25)";
    ctx.lineWidth = 2;
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Draw resting dashed dots
    const dotCount = Math.min(24, Math.floor(width / 16));
    const step = width / (dotCount + 1);
    ctx.fillStyle =
      theme === "cyan"
        ? "rgba(6, 182, 212, 0.4)"
        : theme === "purple"
        ? "rgba(168, 85, 247, 0.4)"
        : "rgba(16, 185, 129, 0.4)";
    for (let i = 1; i <= dotCount; i++) {
      ctx.beginPath();
      ctx.arc(i * step, centerY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Render glowing frequency spectrum bars
  const drawBars = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freqData: Uint8Array,
    count: number,
    theme: string,
    isCompact: boolean
  ) => {
    const totalBars = count;
    const gap = isCompact ? 2 : 3;
    const barWidth = Math.max(2, (width - gap * (totalBars - 1)) / totalBars);
    const dataLen = freqData.length;

    // Gradient colors
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    if (theme === "cyan") {
      gradient.addColorStop(0, "rgba(6, 182, 212, 0.4)");
      gradient.addColorStop(0.5, "rgba(14, 165, 233, 0.85)");
      gradient.addColorStop(0.85, "rgba(99, 102, 241, 0.95)");
      gradient.addColorStop(1, "rgba(236, 72, 153, 1)");
    } else if (theme === "purple") {
      gradient.addColorStop(0, "rgba(147, 51, 234, 0.4)");
      gradient.addColorStop(0.5, "rgba(192, 38, 211, 0.85)");
      gradient.addColorStop(0.85, "rgba(236, 72, 153, 0.95)");
      gradient.addColorStop(1, "rgba(245, 158, 11, 1)");
    } else {
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.4)");
      gradient.addColorStop(0.6, "rgba(20, 184, 166, 0.85)");
      gradient.addColorStop(1, "rgba(56, 189, 248, 1)");
    }

    const peaks = peakValuesRef.current;

    for (let i = 0; i < totalBars; i++) {
      // Map bar index to frequency array logarithmic index
      const binIdx = Math.floor((Math.pow(i / totalBars, 1.3) * (dataLen - 1)));
      const rawValue = freqData[Math.min(dataLen - 1, Math.max(0, binIdx))] || 0;

      // Scale value with a non-linear perceptual curve
      const normalized = Math.min(1, Math.max(0.04, rawValue / 255));
      const barHeight = Math.max(3, normalized * (height - 6));
      const x = i * (barWidth + gap);
      const y = height - barHeight;

      // Peak hold animation
      if (barHeight > (peaks[i] || 0)) {
        peaks[i] = barHeight;
      } else {
        peaks[i] = Math.max(0, (peaks[i] || 0) - peakDecaySpeed);
      }

      // Draw Main Bar
      ctx.fillStyle = gradient;
      ctx.shadowColor = theme === "cyan" ? "rgba(6, 182, 212, 0.5)" : "rgba(168, 85, 247, 0.5)";
      ctx.shadowBlur = isCompact ? 4 : 8;

      // Rounded top rectangle
      const radius = Math.min(barWidth / 2, 3);
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, height);
      ctx.closePath();
      ctx.fill();

      // Reset shadow for peaks
      ctx.shadowBlur = 0;

      // Draw Peak Caps (floating caps on top of bars)
      if (!isCompact && peaks[i] && peaks[i] > 4) {
        const peakY = height - peaks[i];
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x, Math.max(1, peakY - 2), barWidth, 1.8);
      }
    }
  };

  // Render smooth oscilloscope waveform
  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timeData: Uint8Array,
    theme: string
  ) => {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = theme === "cyan" ? "#22d3ee" : "#c084fc";
    ctx.shadowColor = theme === "cyan" ? "rgba(34, 211, 238, 0.7)" : "rgba(192, 132, 252, 0.7)";
    ctx.shadowBlur = 10;

    ctx.beginPath();
    const sliceWidth = width / (timeData.length - 1);
    let x = 0;

    for (let i = 0; i < timeData.length; i++) {
      const v = timeData[i] / 128.0; // 0.0 to 2.0
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  // Render circular pulsing frequency ring (holographic voice orb style)
  const drawCircular = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freqData: Uint8Array,
    theme: string,
    volume: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.28 + (volume / 100) * 8;
    const rays = 32;

    // Glowing center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle =
      theme === "cyan"
        ? "rgba(6, 182, 212, 0.15)"
        : "rgba(168, 85, 247, 0.15)";
    ctx.fill();

    ctx.strokeStyle = theme === "cyan" ? "#06b6d4" : "#a855f7";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Outward frequency rays
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2;
      const bin = Math.floor((i / rays) * freqData.length);
      const val = (freqData[bin] || 0) / 255;
      const rayLength = 6 + val * 24;

      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * (baseRadius + rayLength);
      const y2 = centerY + Math.sin(angle) * (baseRadius + rayLength);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = val > 0.6 ? "#f43f5e" : theme === "cyan" ? "#38bdf8" : "#d946ef";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} dir="rtl">
      {/* Canvas Spectrum Display */}
      <div className="relative w-full rounded-xl overflow-hidden bg-slate-950/70 border border-slate-800/80 p-1 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={mode === "compact" ? 180 : 360}
          height={height}
          className="w-full h-auto block"
        />

        {/* Live Audio Status Badge */}
        {isActive && (
          <div className="absolute top-1.5 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>مباشر {metrics.averageVolume}%</span>
          </div>
        )}
      </div>

      {/* Live Audio Metrics Row (Hz, dB, Voice activity) */}
      {showMetrics && (
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-300">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>التردد السائد:</span>
              <strong className="text-cyan-300 font-bold">
                {isActive && metrics.peakFrequencyHz > 0 ? `${metrics.peakFrequencyHz} Hz` : "-- Hz"}
              </strong>
            </span>

            <span className="text-slate-600">•</span>

            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-purple-400" />
              <span>المستوى:</span>
              <strong className="text-purple-300 font-bold">
                {isActive ? `${metrics.decibels} dB` : "-100 dB"}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                metrics.isVoiceDetected
                  ? "bg-emerald-400 ring-2 ring-emerald-400/40 shadow-sm shadow-emerald-400"
                  : "bg-slate-700"
              }`}
            />
            <span className="text-[10px]">
              {metrics.isVoiceDetected ? "تم رصد الصوت البشري" : "في انتظار التحدث..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
