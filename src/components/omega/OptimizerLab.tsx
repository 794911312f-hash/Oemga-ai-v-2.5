import React, { useState } from "react";
import {
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  BarChart3,
  Timer,
  ShieldAlert,
  Zap,
  RotateCcw,
} from "lucide-react";
import type { OmegaConfig, OptimizerPreset } from "../../lib/omega/optimizer";
import { OPTIMIZER_PRESETS, DEFAULT_OMEGA_CONFIG } from "../../lib/omega/optimizer";
import { runBenchmark, type BenchmarkMetrics } from "../../lib/omega/bench";
import { OMEGA_MODELS, type ModelId } from "../../lib/omega/models";

interface OptimizerLabProps {
  config: OmegaConfig;
  onChangeConfig: (newConfig: OmegaConfig) => void;
}

export const OptimizerLab: React.FC<OptimizerLabProps> = ({
  config,
  onChangeConfig,
}) => {
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchProgress, setBenchProgress] = useState({ current: 0, total: 0 });
  const [metrics, setMetrics] = useState<BenchmarkMetrics | null>(null);

  const handleApplyPreset = (preset: OptimizerPreset) => {
    onChangeConfig({ ...preset.config });
  };

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await runBenchmark(config, 4, (cur, tot) => {
        setBenchProgress({ current: cur, total: tot });
      });
      setMetrics(res);
    } catch (err) {
      console.error("Benchmark error:", err);
    } finally {
      setBenchmarking(false);
    }
  };

  const modelOptions = Object.values(OMEGA_MODELS);

  return (
    <div className="max-w-6xl mx-auto w-full p-3 sm:p-5 space-y-6">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950 text-amber-300 border border-amber-500/40 omega-glow-amber">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              مختبر المعايرة والاختبارات القياسية (Omega Optimizer & Benchmarks)
            </h2>
            <p className="text-xs text-slate-400">
              ضبط عتبات التوافق الرياضي Ψ، وفارق عدم اليقين، واختبار كفاءة الإجماع الحقيقي
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onChangeConfig(DEFAULT_OMEGA_CONFIG)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-xs font-mono transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          استعادة القيم الافتراضية
        </button>
      </div>

      {/* Preset Profiles */}
      <div className="space-y-2.5">
        <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          حزم الإعدادات الجاهزة (Presets):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {OPTIMIZER_PRESETS.map((preset) => {
            const isMatch =
              config.directThreshold === preset.config.directThreshold &&
              config.uncertainSpread === preset.config.uncertainSpread;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  isMatch
                    ? "bg-slate-900 border-amber-500/70 shadow-md shadow-amber-950/30 text-amber-200"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 mb-1">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex justify-between">
                  <span>عتبة: {preset.config.directThreshold}</span>
                  <span>حيرة: {preset.config.uncertainSpread}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hyperparameter Sliders & Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Mathematical Thresholds */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>معايير الحسم التوافقي (Consensus Thresholds)</span>
            <span className="text-xs font-mono text-cyan-400 font-normal">
              Direct &amp; Uncertain
            </span>
          </h3>

          {/* Direct Consensus Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="text-slate-300 font-semibold">
                عتبة الإجماع المباشر (Direct Consensus Threshold - Ψ)
              </label>
              <span className="font-mono text-cyan-400 font-bold text-sm">
                {(config.directThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.60"
              max="0.98"
              step="0.01"
              value={config.directThreshold}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  directThreshold: Number(e.target.value),
                })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              إذا بلغت درجة ثقة النموذج الأعلى (Ψ) هذه القيمة أو فاقتها، يُعتمد جوابه مباشرة دون تشتت.
            </p>
          </div>

          {/* Uncertain Spread Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="text-slate-300 font-semibold">
                فارق الحيرة وعدم اليقين (Uncertain Spread Threshold)
              </label>
              <span className="font-mono text-amber-400 font-bold text-sm">
                {config.uncertainSpread.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.25"
              step="0.01"
              value={config.uncertainSpread}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  uncertainSpread: Number(e.target.value),
                })
              }
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              إذا كان فارق الثقة بين أعلى وأدنى نموذج أقل من هذه القيمة، يُفعّل وضع عدم اليقين ويعرض النظام الرأيين معاً.
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="text-slate-300 font-semibold">
                درجة حرارة التوليد (Temperature)
              </label>
              <span className="font-mono text-purple-400 font-bold text-sm">
                {config.temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={config.temperature}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  temperature: Number(e.target.value),
                })
              }
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Model Selection & Verification */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>نماذج التوليف والتدقيق (Synthesis &amp; Verification)</span>
            <span className="text-xs font-mono text-emerald-400 font-normal">
              Audit Agents
            </span>
          </h3>

          {/* Aggregator Model Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              نموذج التوليف والدمج (Aggregator Model)
            </label>
            <select
              value={config.aggregatorModel}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  aggregatorModel: e.target.value as ModelId,
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
            >
              {modelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.family})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              النموذج المسؤول عن صياغة الخلاصة الموحدة وحل التناقضات بين الآراء في نمط Aggregated.
            </p>
          </div>

          {/* Verifier Model Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              نموذج التدقيق الذاتي (Verifier Model)
            </label>
            <select
              value={config.verifierModel}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  verifierModel: e.target.value as ModelId,
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 font-mono"
            >
              {modelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.family})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              النموذج المكلف بمراجعة الإجابة النهائية وفحص الاتساق الداخلي وخلوها من التناقضات.
            </p>
          </div>

          {/* Verification toggle & max models */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={!config.skipVerification}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    skipVerification: !e.target.checked,
                  })
                }
                className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span>تفعيل فحص التحقق الذاتي (Self-Verification Active)</span>
            </label>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>أقصى نماذج لكل مجال:</span>
              <span className="font-bold text-slate-200 font-mono">
                {config.maxModelsPerDomain}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Battery Section */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              حزمة الاختبارات القياسية الحية (Live Benchmark Battery)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تشغيل مجموعة استعلامات متعددة المجالات لقياس نسب الحسم وسرعة الاستجابة ودقة التحقق
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunBenchmark}
            disabled={benchmarking}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {benchmarking
              ? `جاري الاختبار (${benchProgress.current}/${benchProgress.total})...`
              : "تشغيل الاختبارات القياسية (Run Battery)"}
          </button>
        </div>

        {/* Benchmark Results */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-800 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">متوسط ثقة الإجماع (Ψ)</div>
              <div className="text-base font-bold font-mono text-cyan-400 mt-1">
                {(metrics.avgPsi * 100).toFixed(1)}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">توزيع الأنماط (Modes)</div>
              <div className="text-xs font-mono text-slate-200 mt-1 flex justify-center gap-1.5">
                <span className="text-emerald-400">D:{metrics.modeCounts.direct}</span>
                <span className="text-purple-400">A:{metrics.modeCounts.aggregated}</span>
                <span className="text-amber-400">U:{metrics.modeCounts.uncertain}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">متوسط زمن المعالجة</div>
              <div className="text-base font-bold font-mono text-purple-400 mt-1">
                {metrics.avgDurationMs} ms
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">نسبة اجتياز التدقيق الذاتي</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                {metrics.verificationPassRate}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">متوسط التشتت (Spread)</div>
              <div className="text-base font-bold font-mono text-amber-400 mt-1">
                {metrics.avgSpread.toFixed(3)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
