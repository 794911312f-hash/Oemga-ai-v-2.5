import React, { useState } from "react";
import {
  Wrench,
  Search,
  Calculator,
  Terminal,
  Image as ImageIcon,
  Network,
  GitBranch,
  RefreshCw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  Layers,
  ShieldCheck,
} from "lucide-react";

export const OmegaToolPlannerTab: React.FC = () => {
  const [question, setQuestion] = useState("ابحث عن مستجدات طقس الجزائر اليوم واحسب طاقة حركة كتلة 10 كغ بسرعة 5 م/ث");
  const [plan, setPlan] = useState<any | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  
  // Execution state
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  const presets = [
    {
      label: "بحث وأخبار حية",
      q: "ما هي آخر الأخبار والتطورات العاجلة في الجزائر والشرق الأوسط اليوم؟",
    },
    {
      label: "حساب جبري رمزي (CAS)",
      q: "احسب مشتقة الدالة f(x) = 3x^3 - 5x^2 + 7x - 9 واوجد جذورها الحقيقية بدقة",
    },
    {
      label: "استدلال متعدد القفزات",
      q: "ما العلاقة السببية والفيزيائية بين درجة الحرارة والضغط في الغازات؟",
    },
    {
      label: "حساب خوارزمي مبرمج",
      q: "نفذ كود لحساب شانون إنتروبي Entropy لمصفوفة احتمالات [0.5, 0.25, 0.25]",
    },
    {
      label: "توليد صورة سينمائية",
      q: "ارسم صورة سينمائية فائقة الدقة 8K لمختبر فيزياء فضائي متطور في عام 2050",
    },
  ];

  const handleGeneratePlan = async () => {
    if (!question.trim()) return;
    setPlanLoading(true);
    setPlan(null);
    setExecutionResult(null);
    try {
      const res = await fetch("/api/omega/tools/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, userId: "user_main" }),
      });
      const data = await res.json();
      if (data.ok && data.plan) {
        setPlan(data.plan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPlanLoading(false);
    }
  };

  const handleExecutePipeline = async () => {
    if (!question.trim()) return;
    setExecuting(true);
    setExecutionResult(null);
    try {
      const res = await fetch("/api/omega/tools/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          tool: plan?.primaryTool,
          userId: "user_main",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setExecutionResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecuting(false);
    }
  };

  const toolCatalog = [
    {
      id: "web_search",
      name: "البحث الحي وتغذية الأخبار (Web Grounding)",
      icon: Search,
      desc: "جلب مستجدات حية وأحداث آنية مع التحقق من المصادر.",
      color: "text-blue-400 border-blue-800 bg-blue-950/40",
    },
    {
      id: "symbolic_cas",
      name: "محرك الحساب الرمزي (Symbolic CAS)",
      icon: Calculator,
      desc: "حل المعادلات، التفاضل، التكامل، والجبر الخطي بدقة KaTeX دون تقريب.",
      color: "text-purple-400 border-purple-800 bg-purple-950/40",
    },
    {
      id: "code_sandbox",
      name: "حجر تنفيذ الأكواد (Code Sandbox)",
      icon: Terminal,
      desc: "تنفيذ برمجي في بيئة VM معزولة مع حلقات التصحيح الذاتي التلقائي.",
      color: "text-emerald-400 border-emerald-800 bg-emerald-950/40",
    },
    {
      id: "knowledge_graph",
      name: "رسم المعرفة متعدد القفزات (Knowledge Graph)",
      icon: Network,
      desc: "استخراج السلاسل السببية والعلاقات بين المفاهيم والقوانين.",
      color: "text-indigo-400 border-indigo-800 bg-indigo-950/40",
    },
    {
      id: "image_generation",
      name: "توليد المشاهد البصرية (8K Image Engine)",
      icon: ImageIcon,
      desc: "تفكيك الموجهات الفنية وتوليد صور عالية الدقة.",
      color: "text-amber-400 border-amber-800 bg-amber-950/40",
    },
    {
      id: "mcts_reasoning",
      name: "شبكة الاستدلال الشجري (MCTS)",
      icon: GitBranch,
      desc: "تفكيك المعضلات المعقدة ومسارات التفكير المتعددة.",
      color: "text-cyan-400 border-cyan-800 bg-cyan-950/40",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-orange-950/40 to-slate-900 border border-amber-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-600/30 border border-amber-500/40 text-amber-300 shadow">
              <Wrench className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                مخطط الأدوات الذكي ومسار التنفيذ المستقل
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-900/70 text-amber-300 border border-amber-700/50">
                  Autonomous Tool Planner & Pipeline
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                يفكك استفسارات المستخدم المعقدة ويقرر بصورة مستقلة متى يستدعي محرك البحث، الحساب الرمزي CAS، تنفيذ الأكواد، رسم المعرفة، أو توليد الصور.
              </p>
            </div>
          </div>
        </div>

        {/* 6 Tools Catalog Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {toolCatalog.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                className={`p-2.5 rounded-xl border ${t.color} space-y-1 shadow-sm`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{t.id}</span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {t.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Planner Workbench */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Sparkles className="w-4 h-4 text-amber-400" />
            تخطيط سير عمل الأدوات (Interactive Workflow Planner)
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(p.q);
                  setPlan(null);
                  setExecutionResult(null);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="اكتب مسألة متعددة المهام ليقوم المخطط بتحديد الأدوات اللازمة..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 shadow-inner"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={planLoading || !question.trim()}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {planLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                جاري تحليل المهام وتفكيك الأدوات...
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4" />
                توليد خطة التنفيذ المثلى (Generate Execution Plan)
              </>
            )}
          </button>
        </div>

        {/* Generated Plan Output */}
        {plan && (
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/50 space-y-4 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">الأداة الرئيسية المنتقاة:</span>
                <span className="font-mono font-bold text-amber-300 text-sm px-2.5 py-0.5 rounded-lg bg-amber-950/80 border border-amber-800">
                  {plan.primaryTool}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[10px]">
                  نمط: {plan.executionMode}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-emerald-400 font-bold">
                  ثقة المخطط: {(plan.confidence * 100).toFixed(1)}%
                </span>
                <button
                  type="button"
                  onClick={handleExecutePipeline}
                  disabled={executing}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
                >
                  {executing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      جاري التنفيذ...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      تنفيذ الخطة آلياً
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 font-sans text-xs">
              <strong className="text-amber-400">مبرر التخطيط: </strong>
              {plan.rationale}
            </div>

            {/* Pipeline Steps Sequence Cards */}
            {plan.steps && plan.steps.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  تسلسل خطوات المعالجة والتنفيذ:
                </span>
                <div className="space-y-2">
                  {plan.steps.map((st: any) => (
                    <div
                      key={st.step}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-950 border border-amber-800 text-amber-400 font-mono font-bold flex items-center justify-center text-xs">
                          {st.step}
                        </span>
                        <div>
                          <span className="font-bold text-slate-200 font-mono text-[11px] block">
                            [{st.tool}]
                          </span>
                          <span className="text-slate-400 text-[11px]">{st.purpose}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        مخرج متوقع: {st.expectedOutput}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Execution Result Output */}
        {executionResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/60 space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                نتائج تنفيذ خطة الأدوات بنجاح: [{executionResult.executedTool}]
              </span>
              <span className="text-[10px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded">
                Active Execution OK
              </span>
            </div>

            {executionResult.toolResult && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="text-amber-300 font-semibold">مخرجات الأداة المباشرة:</div>
                <pre className="whitespace-pre-wrap overflow-x-auto text-slate-200">
                  {JSON.stringify(executionResult.toolResult, null, 2)}
                </pre>
              </div>
            )}

            {executionResult.synthesizedAnswer && (
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-emerald-800/40 text-slate-200 text-xs leading-relaxed space-y-1">
                <span className="font-bold text-emerald-300 block">الاستنتاج التكاملي النهائي:</span>
                <p className="whitespace-pre-wrap">{executionResult.synthesizedAnswer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
