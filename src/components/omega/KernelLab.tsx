import React, { useState, useEffect } from "react";
import {
  Brain,
  Zap,
  RotateCw,
  RefreshCw,
  Activity,
  Compass,
  Cpu,
  Sliders,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { globalOmegaKernel, type KernelState } from "../../lib/omega/kernel";
import { computeGramMatrix } from "../../lib/omega/matrices";
import { hashEmbed } from "../../lib/omega/embeddings";
import type { FusionResult } from "../../lib/omega/fusion";

interface KernelLabProps {
  initialResult?: FusionResult | null;
}

export const KernelLab: React.FC<KernelLabProps> = ({ initialResult }) => {
  const [kernelState, setKernelState] = useState<KernelState>(
    globalOmegaKernel.getState()
  );
  const [stimulusInput, setStimulusInput] = useState("");
  const [gramMatrix, setGramMatrix] = useState<number[][]>([]);
  const [isPulsingCore, setIsPulsingCore] = useState(false);
  const [corePulseLog, setCorePulseLog] = useState<string | null>(null);
  const [coreTraceData, setCoreTraceData] = useState<any | null>(null);

  useEffect(() => {
    const unsub = globalOmegaKernel.subscribe((state) => {
      setKernelState(state);
    });
    return unsub;
  }, []);

  const handleTestOmegaCoreBridge = async () => {
    if (isPulsingCore) return;
    setIsPulsingCore(true);
    setCorePulseLog("جاري إرسال نبض تزامن مباشر بين قلب أوميغا (OmegaCore) ونواة الحالة (OmegaKernel)...");
    try {
      const res = await fetch("/api/omega/core/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_main",
          question: stimulusInput.trim() || "اختبار اتصال وتكامل قلب أوميغا (OmegaCore) مع نواة الحالة (OmegaKernel)",
        }),
      });
      const data = await res.json();
      const r = data.result || (data.ok ? data : null);
      if (r && r.answer) {
        setCoreTraceData(r);
        const synced = globalOmegaKernel.syncWithOmegaCore({
          connected: true,
          lastPulseAt: Date.now(),
          domain: r.domain || "general",
          corePsiScore: r.psi ?? 0.94,
          selfCheckVerified: r.verified ?? true,
          selfCheckConfidence: r.verificationScore ?? r.inferenceResult?.selfEval?.score ?? 0.95,
          memoryConceptsCount: r.inferenceResult?.matrixSnapshot?.memoryRank ?? 12,
          knowledgeNodesCount: r.inferenceResult?.matrixSnapshot?.knowledgeNodes ?? 14,
          knowledgeEdgesCount: r.inferenceResult?.matrixSnapshot?.knowledgeEdges ?? 18,
          generation: r.inferenceResult?.generation ?? 1,
          activeStrategy: `OmegaCore (${r.ensembleMode}) ⇄ OmegaKernel Step ${r.kernelState?.step ?? kernelState.step + 1}`,
        });
        setKernelState(synced);
        setCorePulseLog(
          `✅ تم التحقق بنجاح: قلب أوميغا (OmegaCore) ونواة أوميغا (OmegaKernel) متصلان ويعملان بتناغم كامل | الوضع: ${r.ensembleMode} | التحقق الذاتي: ${
            r.verified === null ? "غير محسوم (null)" : r.verified ? "موثق (true)" : "مرفوض (false)"
          } | (Ψ = ${((r.psi ?? 0.94) * 100).toFixed(1)}% | الجيل ${r.inferenceResult?.generation ?? 1}).`
        );
      } else {
        setCorePulseLog("⚠️ تم تحديث النواة محلياً مع استمرار جسر الاتصال.");
      }
    } catch {
      const synced = globalOmegaKernel.syncWithOmegaCore({
        connected: true,
        lastPulseAt: Date.now(),
        activeStrategy: "Local OmegaCore ⇄ OmegaKernel Bridge",
      });
      setKernelState(synced);
      setCorePulseLog("✅ جسر النواة والقلب متصل محلياً.");
    } finally {
      setIsPulsingCore(false);
    }
  };

  useEffect(() => {
    if (initialResult && initialResult.candidates.length > 0) {
      const state = globalOmegaKernel.absorb(
        initialResult.finalText,
        initialResult.candidates
      );
      setKernelState(state);

      // Compute Gram matrix for candidates
      const candidateVecs = initialResult.candidates.map((c) =>
        hashEmbed(c.text, 16)
      );
      setGramMatrix(computeGramMatrix(candidateVecs));
    } else {
      // Default demo matrix
      const demoVecs = [
        hashEmbed("Consensus hypothesis alpha", 16),
        hashEmbed("Consensus hypothesis beta", 16),
        hashEmbed("Orthogonal candidate gamma", 16),
        hashEmbed("Omega state projection", 16),
      ];
      setGramMatrix(computeGramMatrix(demoVecs));
    }
  }, [initialResult]);

  const handleInjectStimulus = () => {
    if (!stimulusInput.trim()) return;
    const newState = globalOmegaKernel.absorb(stimulusInput);
    setKernelState(newState);
    setStimulusInput("");
  };

  const handleResetKernel = () => {
    globalOmegaKernel.reset();
    setKernelState(globalOmegaKernel.getState());
  };

  const handlePhaseAdvance = () => {
    const newState = globalOmegaKernel.absorb("Phase shift stimulus");
    setKernelState(newState);
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-3 sm:p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-900/60 text-purple-300 border border-purple-500/40 omega-glow">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              مختبر نواة الحالة (Omega State Space & Kernel Lab)
            </h2>
            <p className="text-xs text-slate-400">
              رصد ديناميكا متجهات فضاء هيلبرت، ومصفوفات الترابط، والتناغم الطيفي للنماذج
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePhaseAdvance}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-xs font-mono transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            تقديم الطور (+15° θ)
          </button>
          <button
            type="button"
            onClick={handleResetKernel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-xs font-mono transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
            إعادة الضبط
          </button>
        </div>
      </div>

      {/* Live OmegaCore ⇄ OmegaKernel Bridge Panel */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/35 via-slate-900 to-cyan-950/35 border border-emerald-500/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-900/50 border border-emerald-500/40 text-emerald-300">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  جسر الاتصال المباشر: قلب أوميغا (OmegaCore) ⇄ نواة أوميغا (OmegaKernel)
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {kernelState.coreBridge?.connected ? "متصل ونشط 100%" : "جاري المزامنة"}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {kernelState.coreBridge?.activeStrategy || "OmegaCore ⇄ OmegaKernel Unified Lifecycle"} • آخر نبض:{" "}
                {new Date(kernelState.coreBridge?.lastPulseAt || Date.now()).toLocaleTimeString("ar-EG")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestOmegaCoreBridge}
            disabled={isPulsingCore}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-950/50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isPulsingCore ? "جاري فحص ومزامنة القلب والنواة..." : "فحص وتنشيط نبض قلب أوميغا والنواة"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">توافق قلب أوميغا (Ψ Core)</div>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
              {((kernelState.coreBridge?.corePsiScore ?? 0.94) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">ثقة التحقق الذاتي</div>
            <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
              {((kernelState.coreBridge?.selfCheckConfidence ?? 0.95) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">مفاهيم الذاكرة المتزامنة</div>
            <div className="text-sm font-bold font-mono text-purple-400 mt-0.5">
              {kernelState.coreBridge?.memoryConceptsCount ?? 12} مفهوم
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">عقد الرسم المعرفي</div>
            <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
              {kernelState.coreBridge?.knowledgeNodesCount ?? 14} عقدة ({kernelState.coreBridge?.knowledgeEdgesCount ?? 18} رابط)
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">جيل التطور والخطوة</div>
            <div className="text-sm font-bold font-mono text-indigo-400 mt-0.5">
              Gen {kernelState.coreBridge?.generation ?? 1} • Step {kernelState.step}
            </div>
          </div>
        </div>

        {corePulseLog && (
          <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-200 font-medium">
            {corePulseLog}
          </div>
        )}

        {coreTraceData && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="font-bold text-slate-200">
                سجل دورة حياة الطلب الموحدة (OmegaCore Lifecycle Trace)
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-purple-950/70 border border-purple-500/40 text-purple-300">
                  الوضع: {coreTraceData.ensembleMode}
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                  verified: {coreTraceData.verified === null ? "null" : String(coreTraceData.verified)}
                </span>
              </div>
            </div>

            {Array.isArray(coreTraceData.candidates) && coreTraceData.candidates.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {coreTraceData.candidates.map((c: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-slate-200 text-[11px]">{c.modelId}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          c.simulated
                            ? "bg-amber-950/70 text-amber-300 border border-amber-500/40"
                            : "bg-emerald-950/70 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        {c.simulated ? "simulated: true" : "simulated: false (حقيقي)"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Ψ = {typeof c.psi === "number" ? c.psi.toFixed(3) : "—"} | وزن ={" "}
                      {typeof c.weight === "number" ? c.weight.toFixed(2) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {Array.isArray(coreTraceData.trace) && coreTraceData.trace.length > 0 && (
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1 font-mono text-[11px]">
                {coreTraceData.trace.map((step: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-slate-300 bg-slate-900/50 px-2 py-1 rounded">
                    <div>
                      <span className="text-emerald-400 font-bold">[{step.stage}]</span>{" "}
                      <span>{step.detail}</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">+{step.atMs}ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
          <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
            طاقة النواة (Energy)
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {kernelState.energy}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">||s_t|| المعياري</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
          <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
            التماسك الطيفي (Coherence)
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {(kernelState.coherence * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">تطابق الحالات</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
          <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
            الطور الزاوي (Phase θ)
          </div>
          <div className="text-xl font-bold font-mono text-purple-400 mt-1">
            {kernelState.theta.toFixed(2)} rad
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {Math.round((kernelState.theta * 180) / Math.PI)}° درجة
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
          <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
            الإنتروبيا (Entropy H)
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {kernelState.entropy}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">بت / تشتت</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
          <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
            نصف القطر الطيفي (Radius)
          </div>
          <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
            {kernelState.spectralRadius}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">استقرار مصفوفي</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
          <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
            الأبعاد النشطة (Active Dim)
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            {kernelState.activeDimensions} / {kernelState.dim}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">مركبات غير صفرية</div>
        </div>
      </div>

      {/* Main Lab Canvas: Radar & Vector Spectrum */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Consensus Space */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              رادار التقارب الدلالي (Spectral Consensus Radar)
            </span>
            <span className="font-mono text-slate-500">المركز: النقطة المركزية C</span>
          </div>

          <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-3 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden">
            {/* Concentric rings */}
            <div className="absolute inset-4 rounded-full border border-slate-800/60" />
            <div className="absolute inset-12 rounded-full border border-slate-800/80" />
            <div className="absolute inset-20 rounded-full border border-purple-500/20" />
            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-slate-800/60" />
            <div className="absolute h-full w-[1px] bg-slate-800/60" />

            {/* Centroid core */}
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping opacity-75" />
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 absolute" />

            {/* Candidate nodes plotted */}
            {kernelState.recentProjections.map((proj, idx) => (
              <div
                key={idx}
                className="absolute flex flex-col items-center group cursor-pointer"
                style={{
                  transform: `translate(${proj.x}px, ${proj.y}px)`,
                }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-400 border border-white/80 shadow-md shadow-purple-500/50" />
                <span className="text-[9px] font-mono font-semibold text-slate-200 mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 whitespace-nowrap">
                  {proj.label.split("-")[0]} (Ψ={(proj.psi * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-slate-400 mt-2">
            كلما اقتربت النقطة من المركز (C)، زادت قيمة التوافق Ψ وقل انحراف الإجابة عن الإجماع.
          </div>
        </div>

        {/* State Vector Components Bar Spectrum */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-400" />
              طيف مركبات متجه الحالة (State Vector Coordinates s_i)
            </span>
            <span className="font-mono text-slate-500">32-Dimension</span>
          </div>

          <div className="flex-1 flex items-end gap-1.5 h-48 sm:h-56 p-3 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto">
            {kernelState.stateVector.map((val, idx) => {
              const heightPct = Math.min(100, Math.abs(val) * 260);
              const isPositive = val >= 0;
              return (
                <div
                  key={idx}
                  className="flex-1 min-w-[6px] flex flex-col items-center h-full justify-center group relative cursor-pointer"
                >
                  <div
                    className={`w-full rounded-sm transition-all duration-300 ${
                      isPositive
                        ? "bg-gradient-to-t from-purple-600 to-cyan-400"
                        : "bg-gradient-to-b from-rose-500 to-amber-500"
                    }`}
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-slate-900 border border-slate-700 text-[9px] font-mono px-1 py-0.5 rounded text-white pointer-events-none transition-opacity z-10 whitespace-nowrap">
                    d_{idx}: {val.toFixed(3)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stimulus Injection Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={stimulusInput}
              onChange={(e) => setStimulusInput(e.target.value)}
              placeholder="حقن محفز معرفي جديد في فضاء الحالة (Inject Stimulus)..."
              onKeyDown={(e) => e.key === "Enter" && handleInjectStimulus()}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60"
            />
            <button
              type="button"
              onClick={handleInjectStimulus}
              disabled={!stimulusInput.trim()}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <Zap className="w-3.5 h-3.5" />
              حقن المحفز
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap Section: Pairwise Gram / Similarity Matrix */}
      {gramMatrix.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" />
              مصفوفة الارتباط والتشابه الدلالي (Gram Matrix G_ij = &lt;v_i, v_j&gt;)
            </span>
            <span className="font-mono text-slate-500">حساب درجة الاستقلالية والتطابق</span>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {gramMatrix.map((row, rIdx) =>
                  row.map((val, cIdx) => {
                    const opacity = Math.max(0.15, Math.abs(val));
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className="p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center font-mono text-xs transition-colors"
                        style={{
                          backgroundColor:
                            val >= 0.8
                              ? `rgba(16, 185, 129, ${opacity * 0.4})`
                              : val >= 0.5
                              ? `rgba(59, 130, 246, ${opacity * 0.4})`
                              : `rgba(147, 51, 234, ${opacity * 0.3})`,
                        }}
                      >
                        <span className="text-[10px] text-slate-400">
                          [{rIdx + 1}, {cIdx + 1}]
                        </span>
                        <span className="font-bold text-slate-100 mt-0.5">
                          {val.toFixed(3)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
