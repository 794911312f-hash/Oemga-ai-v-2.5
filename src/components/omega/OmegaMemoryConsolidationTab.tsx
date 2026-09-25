import React, { useState } from "react";
import {
  Layers,
  Database,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Minimize2,
  Trash2,
  Archive,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Tag,
} from "lucide-react";

export const OmegaMemoryConsolidationTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runConsolidation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/omega/memory/consolidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user_main" }),
      });
      const data = await res.json();
      if (data.ok && data.report) {
        setReport(data.report);
      } else {
        setErrorMsg(data.error || "فشل تشغيل عملية تلخيص الذاكرة");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border border-emerald-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 shadow">
              <Minimize2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                تجريد وتلخيص الذاكرة المعرفية (Memory Consolidation)
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/70 text-emerald-300 border border-emerald-700/50">
                  Anti-Bloat & Semantic Compression
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                يمنع تراكم الذكريات اللانهائي عبر تجميع التفاعلات المتشابهة (Cosine Sim &ge; 0.72) وتلخيصها في ثوابت وحقائق تجريدية عليا مع حذف الشظايا غير الضرورية.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={runConsolidation}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                جاري العنقَدة والتلخيص...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                تشغيل التلخيص الآن (Consolidate Now)
              </>
            )}
          </button>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">عتبة التشابه الدلالي</span>
            <div className="text-lg font-bold text-emerald-300 font-mono flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              &ge; 0.72 Sim
            </div>
            <span className="text-[10px] text-slate-500">عنقَدة متقاربة متجانسة</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">سعة العمل القصوى</span>
            <div className="text-lg font-bold text-teal-300 font-mono flex items-center gap-1.5">
              <Database className="w-4 h-4 text-teal-400" />
              60 عنصر
            </div>
            <span className="text-[10px] text-slate-500">تلخيص تلقائي عند التجاوز</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">نسبة تقليص الحجم</span>
            <div className="text-lg font-bold text-cyan-300 font-mono flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-cyan-400" />
              {report ? `${report.spaceReductionPct}%` : "جاهز للضغط"}
            </div>
            <span className="text-[10px] text-slate-500">حماية من تشتت السياق</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">الحقائق التجريدية المستخلصة</span>
            <div className="text-lg font-bold text-amber-300 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              {report ? `${report.generatedInvariants.length} ثوابت` : "High Invariants"}
            </div>
            <span className="text-[10px] text-slate-500">تخزين دائم في Firestore</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* How it works breakdown */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Archive className="w-4 h-4 text-emerald-400" />
          كيف تعمل خوارزمية التلخيص التجريدي في النواة؟
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              1. العنقَدة الشعاعية (Vector Clustering)
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              توليد متجهات تضمين دلالية (Embeddings) للذكريات والتجارب وحساب مسافة جيب التمام، وتجميع الذكريات المترابطة معاً.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              2. التجريد التركيبي (Invariant Synthesis)
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              استخلاص القاسم المعرفي المشترك، ودمج الجزئيات المتناثرة في صيغة حقيقة مركزية واحدة تحتفظ باليقين وتلخص التجربة.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              3. التشذيب الآمن (Safe Pruning)
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              حذف المسودات والشظايا المكررة والاحتفاظ بالذاكرة التجريدية الجامعة ذات الثقة العالية، مما يخفف استهلاك الذاكرة بنسبة تصل إلى 80%.
            </p>
          </div>
        </div>
      </div>

      {/* Consolidation Report Output */}
      {report && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-900/50 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-white">تقرير التلخيص المعرفي المنجز</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">الحجم قبل: <strong className="text-slate-200">{report.totalBefore}</strong></span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-emerald-400">الحجم بعد: <strong>{report.totalAfter}</strong></span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
                تقليص: {report.spaceReductionPct}%
              </span>
            </div>
          </div>

          {/* Generated Invariants */}
          {report.generatedInvariants && report.generatedInvariants.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                الحقائق والثوابت العليا المولدة (High-Order Invariants):
              </span>
              <div className="space-y-2">
                {report.generatedInvariants.map((inv: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-emerald-800/40 text-xs text-slate-200 leading-relaxed font-mono flex items-start gap-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold mt-0.5">
                      #{idx + 1}
                    </span>
                    <span className="flex-1">{inv}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Execution Log */}
          {report.details && report.details.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-slate-400">سجل عمليات العنقَدة والتشذيب:</span>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px] text-slate-300">
                {report.details.map((msg: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
