import React, { useState, useEffect } from "react";
import {
  Compass,
  TrendingUp,
  Award,
  Zap,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Layers,
} from "lucide-react";

export const OmegaModelRouterTab: React.FC = () => {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  
  // Interactive Route Tester state
  const [testQuestion, setTestQuestion] = useState("ما هو قانون الغاز المثالي وعلاقته بالضغط ودرجة الحرارة؟");
  const [testDomain, setTestDomain] = useState("science_factual");
  const [routeResult, setRouteResult] = useState<any | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const fetchLedger = async (domain?: string) => {
    try {
      setLoading(true);
      const url = domain && domain !== "all" 
        ? `/api/omega/router/ledger?domain=${domain}` 
        : "/api/omega/router/ledger";
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok && Array.isArray(data.ledger)) {
        setLedger(data.ledger);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger(selectedDomain);
  }, [selectedDomain]);

  const runRouteSimulation = async () => {
    if (!testQuestion.trim()) return;
    setRoutingLoading(true);
    setRouteResult(null);
    try {
      const res = await fetch("/api/omega/router/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: testQuestion,
          domain: testDomain,
          poolSize: 4,
          userId: "user_main",
        }),
      });
      const data = await res.json();
      if (data.ok && data.decision) {
        setRouteResult(data.decision);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRoutingLoading(false);
    }
  };

  const handleFeedback = async (modelId: string, domain: string, success: boolean) => {
    try {
      const res = await fetch("/api/omega/router/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          domain,
          success,
          psi: success ? 0.95 : 0.45,
          latencyMs: success ? 380 : 850,
          userId: "user_main",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedbackSuccess(`تم تحديث تصنيف ELO للنموذج [${modelId}] إلى ${data.record?.eloRating}!`);
        setTimeout(() => setFeedbackSuccess(null), 3500);
        await fetchLedger(selectedDomain);
        if (routeResult) {
          await runRouteSimulation();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const domainOptions = [
    { id: "all", label: "كافة المجالات" },
    { id: "math_logic", label: "رياضيات ومنطق" },
    { id: "code", label: "برمجة وخوارزميات" },
    { id: "science_factual", label: "علوم وفيزياء" },
    { id: "news_realtime", label: "أخبار ومستجدات" },
    { id: "general", label: "استفسارات عامة" },
  ];

  const presets = [
    { label: "قانون الغاز المثالي", q: "ما هو قانون الغاز المثالي وعلاقته بالضغط ودرجة الحرارة؟", d: "science_factual" },
    { label: "معضلة كولاتز", q: "حلل حدسية كولاتز 3n+1 وشروطها الحدية رياضياً", d: "math_logic" },
    { label: "خوارزمية فرز سريعة", q: "اكتب دالة فرز سريعة QuickSort في بايثون مع تحليل التعقيد الزمني", d: "code" },
    { label: "أخبار حية", q: "ما هي آخر مستجدات الذكاء الاصطناعي وتقنيات الاستدلال اليوم؟", d: "news_realtime" },
  ];

  // Calculate high-level stats
  const totalCalls = ledger.reduce((acc, r) => acc + (r.totalCalls || 0), 0);
  const avgSystemPsi = ledger.length 
    ? (ledger.reduce((acc, r) => acc + (r.avgPsi || 0), 0) / ledger.length).toFixed(3)
    : "0.850";
  const highestElo = ledger.length 
    ? Math.max(...ledger.map((r) => r.eloRating || 1500)) 
    : 1500;
  const bestModel = ledger.find((r) => r.eloRating === highestElo)?.modelId || "qwen-2-5-compat";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 shadow">
              <Compass className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                راوتر النماذج الذكي المبني على الأداء الفعلي
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-900/70 text-blue-300 border border-blue-700/50">
                  Empirical UCB1 & ELO
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                لا يعتمد على قواعد مسبقة ثابتة، بل يتتبع سجل الكفاءة التجريبي الحقيقي (معدل النجاح، متوسط الثقة ψ، زمن الاستجابة، وتصنيف ELO) لكل نموذج في مجاله.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchLedger(selectedDomain)}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث السجل
          </button>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">أعلى تصنيف ELO</span>
            <div className="text-lg font-bold text-amber-300 font-mono flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              {highestElo}
            </div>
            <span className="text-[10px] text-slate-500 font-mono truncate block">{bestModel}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">إجمالي الاستدعاءات التجريبية</span>
            <div className="text-lg font-bold text-blue-300 font-mono flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-400" />
              {totalCalls} طلب
            </div>
            <span className="text-[10px] text-slate-500">موزعة عبر المجالات</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">متوسط الثقة التوافقية ψ</span>
            <div className="text-lg font-bold text-emerald-300 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {avgSystemPsi}
            </div>
            <span className="text-[10px] text-slate-500">يقين استدلالي عالي</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">موازنة الاستكشاف UCB1</span>
            <div className="text-lg font-bold text-purple-300 font-mono flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Exploration: 0.10
            </div>
            <span className="text-[10px] text-slate-500">منع التحيز لنماذج سابقة</span>
          </div>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {feedbackSuccess}
        </div>
      )}

      {/* Interactive Simulator Section */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Sparkles className="w-4 h-4 text-amber-400" />
            اختبار التوجيه الذكي اللحظي (Simulate Live Dynamic Routing)
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTestQuestion(p.q);
                  setTestDomain(p.d);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-3">
            <input
              type="text"
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              placeholder="اكتب استفسارك لاختبار التوجيه الرياضي والمنطقي..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 shadow-inner"
            />
          </div>
          <div>
            <select
              value={testDomain}
              onChange={(e) => setTestDomain(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="math_logic">رياضيات ومنطق</option>
              <option value="code">برمجة وخوارزميات</option>
              <option value="science_factual">علوم وفيزياء</option>
              <option value="news_realtime">أخبار ومستجدات</option>
              <option value="general">استفسارات عامة</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={runRouteSimulation}
          disabled={routingLoading || !testQuestion.trim()}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
        >
          {routingLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              جاري حساب احتمالات UCB1 والـ Softmax...
            </>
          ) : (
            <>
              <Compass className="w-4 h-4" />
              تنفيذ التوجيه الذكي بالأداء الفعلي
            </>
          )}
        </button>

        {/* Route Decision Card */}
        {routeResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-blue-900/50 space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">النموذج الفائز المختار:</span>
                <span className="font-mono font-bold text-amber-300 text-sm px-2.5 py-0.5 rounded-lg bg-amber-950/80 border border-amber-800">
                  {routeResult.selectedModel}
                </span>
                <span className="text-emerald-400 font-mono">
                  (ثقة: {(routeResult.confidenceScore * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  متوقع: {routeResult.expectedLatencyMs}ms
                </span>
                {/* Immediate Feedback test buttons */}
                <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
                  <button
                    type="button"
                    onClick={() => handleFeedback(routeResult.selectedModel, routeResult.domain, true)}
                    className="p-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 cursor-pointer"
                    title="مكافأة نجاح (+ELO)"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeedback(routeResult.selectedModel, routeResult.domain, false)}
                    className="p-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800 cursor-pointer"
                    title="خصم خطأ (-ELO)"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px]">
              {routeResult.reasoning}
            </div>

            {/* Model Probabilities Bars */}
            {routeResult.modelProbabilities && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                  توزيع احتمالات الانتقاء التجريبي عبر النماذج المرشحة (Softmax UCB1):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {Object.entries(routeResult.modelProbabilities).map(([mId, prob]: any) => (
                    <div key={mId} className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className={mId === routeResult.selectedModel ? "text-amber-300 font-bold" : "text-slate-300"}>
                          {mId}
                        </span>
                        <span className="text-blue-300 font-semibold">{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            mId === routeResult.selectedModel ? "bg-amber-400" : "bg-blue-600"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, prob * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ledger Table Section */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Layers className="w-4 h-4 text-blue-400" />
            سجل الأداء التجريبي للنماذج (Empirical Performance Ledger)
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {domainOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedDomain(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  selectedDomain === opt.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="p-3">النموذج</th>
                <th className="p-3">المجال</th>
                <th className="p-3 text-center">الاستدعاءات</th>
                <th className="p-3 text-center">معدل النجاح</th>
                <th className="p-3 text-center">متوسط الثقة (ψ)</th>
                <th className="p-3 text-center">الاستجابة (ms)</th>
                <th className="p-3 text-center">تصنيف ELO</th>
                <th className="p-3 text-center">تغذية راجعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500 font-sans">
                    لا توجد سجلات أداء مسجلة حالياً
                  </td>
                </tr>
              ) : (
                ledger.map((rec, i) => {
                  const successRate = rec.totalCalls > 0 
                    ? ((rec.successfulCalls / rec.totalCalls) * 100).toFixed(1) 
                    : "100.0";
                  const isLeader = rec.eloRating >= 1650;
                  return (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-slate-200 font-semibold">
                        <div className="flex items-center gap-1.5">
                          {isLeader && <Award className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{rec.modelId}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-400 font-sans">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                          {rec.domain}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-300">{rec.totalCalls}</td>
                      <td className="p-3 text-center text-emerald-400 font-bold">{successRate}%</td>
                      <td className="p-3 text-center text-cyan-300">{rec.avgPsi.toFixed(3)}</td>
                      <td className="p-3 text-center text-slate-400">{rec.avgLatencyMs}ms</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            rec.eloRating >= 1650
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : rec.eloRating >= 1520
                              ? "bg-blue-950 text-blue-300 border border-blue-800"
                              : "bg-slate-950 text-slate-400 border border-slate-800"
                          }`}
                        >
                          {rec.eloRating}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleFeedback(rec.modelId, rec.domain, true)}
                            className="p-1 rounded bg-slate-950 hover:bg-emerald-950 text-slate-400 hover:text-emerald-300 border border-slate-800 cursor-pointer"
                            title="إضافة نقطة نجاح"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(rec.modelId, rec.domain, false)}
                            className="p-1 rounded bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 cursor-pointer"
                            title="خصم نقطة خطأ"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
