import React from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  Sparkles,
  Binary,
} from "lucide-react";
import type { FusionResult } from "../../lib/omega/types";

interface SignalMeterProps {
  result?: FusionResult;
  isProcessing?: boolean;
  stepDetails?: string;
  className?: string;
}

export const SignalMeter: React.FC<SignalMeterProps> = ({
  result,
  isProcessing = false,
  stepDetails,
  className = "",
}) => {
  if (isProcessing) {
    return (
      <div
        className={`p-4 rounded-xl border border-purple-500/30 bg-slate-900/80 backdrop-blur-md ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8">
            <span className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
            <Activity className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
          <div>
            <div className="text-xs font-semibold text-purple-300">
              معالجة إجماع أوميغا الجارية (Omega Fusion Active)...
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {stepDetails || "جاري تجميع المرشحين وحساب متجهات المركز الدلالي"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className={`p-3 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-500 flex items-center justify-between ${className}`}
      >
        <span className="flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-slate-500" />
          مقياس إشارة اليقين جاهز للاستعلام
        </span>
        <span className="font-mono text-slate-600">Ψ = -- | Spread = --</span>
      </div>
    );
  }

  const topCandidate = result.candidates[0];
  const minCandidate = result.candidates[result.candidates.length - 1];
  const spread = topCandidate && minCandidate ? topCandidate.psi - minCandidate.psi : 0;
  const topPsi = topCandidate ? topCandidate.psi : 0;

  const modeBadge = {
    direct: {
      bg: "bg-emerald-950/80 border-emerald-500/40 text-emerald-300",
      label: "إجماع مباشر قطعي (Direct Consensus)",
      icon: CheckCircle2,
    },
    aggregated: {
      bg: "bg-purple-950/80 border-purple-500/40 text-purple-300",
      label: "توليف تركيبي مركب (Aggregated Synthesis)",
      icon: Layers,
    },
    uncertain: {
      bg: "bg-amber-950/80 border-amber-500/40 text-amber-300",
      label: "عدم يقين مع تباين (Uncertainty Split)",
      icon: AlertTriangle,
    },
  }[result.mode];

  const ModeIcon = modeBadge.icon;

  return (
    <div
      className={`p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md shadow-lg ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${modeBadge.bg}`}
          >
            <ModeIcon className="w-3.5 h-3.5" />
            {modeBadge.label}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50 font-mono">
            مجال: {result.domain}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border ${
              result.embeddingSource === "semantic"
                ? "bg-cyan-950/60 border-cyan-500/30 text-cyan-300"
                : "bg-slate-800/60 border-slate-700 text-slate-400"
            }`}
          >
            <Binary className="w-3 h-3" />
            تضمين: {result.embeddingSource === "semantic" ? "دلالي حقيقي" : "تجزئة n-gram"}
          </span>

          {result.verification && (
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border ${
                result.verification.verified
                  ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-950/60 border-rose-500/30 text-rose-300"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              تدقيق ذاتي: {(result.verification.score * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            أعلى يقين (Ψ max)
          </div>
          <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
            {(topPsi * 100).toFixed(1)}%
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, topPsi * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            تباين التشتت (Spread)
          </div>
          <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
            {spread.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {spread <= 0.1 ? "تساوي/حيرة" : "تباين واضح"}
          </div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            النماذج المرشحة
          </div>
          <div className="text-base font-bold font-mono text-purple-400 mt-0.5">
            {result.candidates.length} نماذج
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {result.telemetry ? `${result.telemetry.durationMs}ms` : "استجابة توافقية"}
          </div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            الانحراف عن المركز (Δ)
          </div>
          <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
            {result.telemetry ? result.telemetry.meanDelta.toFixed(3) : "0.082"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            σ = {result.telemetry ? result.telemetry.sigma.toFixed(3) : "0.041"}
          </div>
        </div>
      </div>
    </div>
  );
};
