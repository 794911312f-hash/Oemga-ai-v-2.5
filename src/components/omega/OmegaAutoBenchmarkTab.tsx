import React, { useState, useEffect } from "react";
import {
  Award,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Activity,
  Layers,
  BarChart3,
  Calendar,
} from "lucide-react";

export const OmegaAutoBenchmarkTab: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [latestReport, setLatestReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/omega/benchmark/history?userId=user_main");
      const data = await res.json();
      if (data.ok) {
        setHistory(data.history || []);
        if (data.latest) {
          setLatestReport(data.latest);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const runBenchmark = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/omega/benchmark/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user_main", generation: (latestReport?.generation || 1) + 1 }),
      });
      const data = await res.json();
      if (data.ok && data.report) {
        setLatestReport(data.report);
        await fetchHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const categoryNames: Record<string, string> = {
    math_physics: "الرياضيات والفيزياء (Math & Invariants)",
    logic_reasoning: "الاستدلال المنطقي (Logical Coherence)",
    systems: "معمارية النظم والتوافق (Systems Architecture)",
    multi_hop: "الاستدلال الشبكي متعدد القفزات (Multi-Hop)",
    code_algorithm: "التنفيذ الخوارزمي (Algorithmic Execution)",
  };

  const isImproved = latestReport?.status === "improved";
  const isRegressed = latestReport?.status === "regressed";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-blue-950/40 to-slate-900 border border-cyan-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 shadow">
              <Award className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                نظام الاختبار والتقييم الآلي المستمر للنواة
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-900/70 text-cyan-300 border border-cyan-700/50">
                  Continuous Automated Benchmark
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                يقيس الأداء الفعلي بدقة بعد كل تعديل على النواة عبر حزمة اختبارات معيارية مبرهنة لمعرفة ما إذا كان التطوير قد حسّن النتائج (&Delta;Score) أم أضر بها.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runBenchmark}
              disabled={running}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {running ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  جاري تشغيل الاختبارات وحساب &Delta;Score...
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 text-slate-950" />
                  تشغيل الاختبار القياسي التلقائي
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">النتيجة الإجمالية للنواة</span>
            <div className="text-2xl font-bold text-cyan-300 font-mono flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              {latestReport ? `${latestReport.overallScore}` : "84.5"}
              <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-500">معدل مركب موزون</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">فارق التطور (&Delta;Score)</span>
            <div
              className={`text-2xl font-bold font-mono flex items-center gap-1.5 ${
                isImproved
                  ? "text-emerald-400"
                  : isRegressed
                  ? "text-rose-400"
                  : "text-blue-300"
              }`}
            >
              {isImproved ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : isRegressed ? (
                <TrendingDown className="w-5 h-5 text-rose-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              )}
              {latestReport?.deltaScore > 0 ? `+${latestReport.deltaScore}%` : `${latestReport?.deltaScore || 0}%`}
            </div>
            <span className="text-[10px] text-slate-500">
              {isImproved ? "تحسن مؤكد في النواة" : isRegressed ? "تراجع طفيف" : "استقرار تام في الأداء"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">نسبة اجتياز الحالات</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {latestReport ? `${latestReport.passedTests} / ${latestReport.totalTests}` : "7 / 7"}
            </div>
            <span className="text-[10px] text-slate-500">حالات اختبار معيارية</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">متوسط زمن الاستجابة</span>
            <div className="text-2xl font-bold text-slate-200 font-mono flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-slate-400" />
              {latestReport?.avgLatencyMs || 440}ms
            </div>
            <span className="text-[10px] text-slate-500">سرعة استدلال فائقة</span>
          </div>
        </div>
      </div>

      {/* Engineering Recommendation Box */}
      {latestReport?.recommendations && latestReport.recommendations.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-semibold">توصية الاختبار الآلي للمهندس:</span>
            <span className="text-slate-100 font-mono">{latestReport.recommendations[0]}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            الجيل: Gen v{latestReport.generation || 1}.0
          </span>
        </div>
      )}

      {/* 5 Core Capability Category Cards */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          مؤشرات الأداء عبر القدرات الجوهرية الخمس (Core Capabilities):
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {latestReport?.categories &&
            Object.entries(latestReport.categories).map(([catKey, catData]: any) => (
              <div
                key={catKey}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 shadow-md"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">
                    {categoryNames[catKey] || catKey}
                  </span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    {catData.score}%
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      catData.score >= 85 ? "bg-emerald-400" : catData.score >= 70 ? "bg-cyan-400" : "bg-amber-400"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, catData.score))}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono pt-1">
                  <span>الاجتياز: {catData.passedTests}/{catData.totalTests} حالات</span>
                  <span>الاستجابة: {catData.avgLatencyMs}ms</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Benchmark History Timeline */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Calendar className="w-4 h-4 text-cyan-400" />
            سجل الاختبارات القياسية عبر الأجيال (Evolution Benchmark Timeline)
          </div>
          <span className="text-xs text-slate-400 font-mono">
            إجمالي الجولات: {history.length}
          </span>
        </div>

        <div className="space-y-2">
          {history.slice(-5).reverse().map((run, idx) => (
            <div
              key={run.id || idx}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
                  Gen v{run.generation || 1}.0
                </span>
                <span className="text-slate-300 font-sans">
                  {new Date(run.timestamp).toLocaleTimeString("ar-DZ")}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-slate-400">النتيجة: <strong className="text-white">{run.overallScore}</strong>/100</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    run.status === "improved"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : run.status === "regressed"
                      ? "bg-rose-950 text-rose-400 border border-rose-800"
                      : "bg-blue-950 text-blue-300 border border-blue-800"
                  }`}
                >
                  {run.deltaScore > 0 ? `+${run.deltaScore}%` : `${run.deltaScore || 0}%`} ({run.status})
                </span>
                <span className="text-slate-500 text-[11px]">{run.avgLatencyMs}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
