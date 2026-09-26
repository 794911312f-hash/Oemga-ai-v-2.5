/**
 * src/components/omega/ExploratoryReasoningCard.tsx
 * =====================================================================
 * Omega Deep Exploration & Hypothesis Engine UI Component
 * ---------------------------------------------------------------------
 * Renders the multi-pathway hypothesis generation, self-falsification
 * stress-tests, symbolic trajectory simulations, and the exploratory
 * confidence metric (Ψ_explore).
 * =====================================================================
 */

import React, { useState, useEffect } from "react";
import {
  Compass,
  ShieldCheck,
  AlertTriangle,
  GitBranch,
  Brain,
  Binary,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingDown,
  BookOpen,
  Search,
  ExternalLink,
  Database,
  RefreshCw,
  Calculator,
  Cpu,
  Bookmark,
  BookmarkCheck,
  Download,
  Upload,
  History,
  FileText,
  GraduationCap,
  Sliders,
} from "lucide-react";
import { MathRenderer } from "./MathRenderer";
import { SymbolicCASWorkbench } from "./SymbolicCASWorkbench";
import type { DeepExplorationResult, ExplorationPathway } from "../../lib/omega/exploratoryEngine";
import { searchOEIS, type OEISSequenceEntry } from "../../lib/omega/oeisClient";
import { searchArxiv, type ArxivPaperEntry } from "../../lib/omega/arxivClient";
import {
  executeSymbolicOperation,
  type SymbolicOperation,
  type SymbolicResult,
} from "../../lib/omega/symbolicEngine";
import {
  getHypothesisVectorStore,
  saveHypothesisToMemory,
  searchSimilarHypotheses,
  exportVectorMemoryJSON,
  importVectorMemoryJSON,
  type HypothesisMemoryItem,
  type SimilaritySearchResult,
} from "../../lib/omega/vectorStore";

interface ExploratoryReasoningCardProps {
  data: DeepExplorationResult;
  onOpenTreeOfThought?: () => void;
  className?: string;
}

export const ExploratoryReasoningCard: React.FC<ExploratoryReasoningCardProps> = ({
  data,
  onOpenTreeOfThought,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showFalsificationDetails, setShowFalsificationDetails] = useState<boolean>(false);
  const [showOEISSection, setShowOEISSection] = useState<boolean>(true);
  const [showCASSection, setShowCASSection] = useState<boolean>(true);
  const [showSympyWorkbench, setShowSympyWorkbench] = useState<boolean>(false);
  const [showVectorMemorySection, setShowVectorMemorySection] = useState<boolean>(true);
  const [showArxivSection, setShowArxivSection] = useState<boolean>(true);

  // Live arXiv Scientific Literature State
  const [arxivSearchInput, setArxivSearchInput] = useState<string>("");
  const [arxivPapers, setArxivPapers] = useState<ArxivPaperEntry[]>(data.arxivPapers || []);
  const [isSearchingArxiv, setIsSearchingArxiv] = useState<boolean>(false);
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  // Live Vector Memory Bank State
  const [memoryBank, setMemoryBank] = useState<HypothesisMemoryItem[]>([]);
  const [memorySearchInput, setMemorySearchInput] = useState<string>("");
  const [memorySearchResults, setMemorySearchResults] = useState<SimilaritySearchResult[]>([]);
  const [savedSuccessFeedback, setSavedSuccessFeedback] = useState<boolean>(false);

  // Live Symbolic CAS Workbench State
  const [casOperation, setCasOperation] = useState<SymbolicOperation>("diff");
  const [casExpression, setCasExpression] = useState<string>("x^3 + 4*x^2 - 5*x + 1");
  const [casVariable, setCasVariable] = useState<string>("x");
  const [casResult, setCasResult] = useState<SymbolicResult | null>(data.symbolicCASResult || null);
  const [isCalculatingCAS, setIsCalculatingCAS] = useState<boolean>(false);

  // Live OEIS Interactive Search State
  const [oeisSearchInput, setOeisSearchInput] = useState<string>("");
  const [oeisResults, setOeisResults] = useState<OEISSequenceEntry[]>(data.oeisSequences || []);
  const [isSearchingOEIS, setIsSearchingOEIS] = useState<boolean>(false);

  useEffect(() => {
    setMemoryBank(getHypothesisVectorStore().getAll());
  }, []);

  useEffect(() => {
    if (data.oeisSequences && data.oeisSequences.length > 0) {
      setOeisResults(data.oeisSequences);
    }
    if (data.symbolicCASResult) {
      setCasResult(data.symbolicCASResult);
    }
    if (data.arxivPapers && data.arxivPapers.length > 0) {
      setArxivPapers(data.arxivPapers);
    }
  }, [data.oeisSequences, data.symbolicCASResult, data.arxivPapers]);

  const activePathway = data.activePathways[activeTab] || data.activePathways[0];

  const handleSaveActivePathway = () => {
    if (!activePathway) return;
    saveHypothesisToMemory({
      title: activePathway.nameAr,
      domain: data.problemDomain || "الرياضيات المتقدمة والأنظمة المعقدة",
      hypothesisText: activePathway.hypothesisText,
      formalEquations: activePathway.formalEquations,
      status:
        activePathway.verdict === "promising"
          ? "survived"
          : activePathway.verdict === "falsified"
          ? "refuted"
          : "open_conjecture",
      resilienceScore: activePathway.resilienceScore,
      tags: [activePathway.paradigm, data.problemDomain, "omega-exploration"],
      source: "Omega Autonomous Reasoning (faid Massinissa)",
      falsificationSummary: `صمود في ${
        activePathway.falsificationTests.filter((t) => t.result === "survived").length
      } من أصل ${activePathway.falsificationTests.length} اختبارات تفنيد`,
    });
    setMemoryBank(getHypothesisVectorStore().getAll());
    setSavedSuccessFeedback(true);
    setTimeout(() => setSavedSuccessFeedback(false), 3500);
  };

  const handleMemorySearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = memorySearchInput.trim();
    if (!q) {
      setMemorySearchResults([]);
      return;
    }
    const results = searchSimilarHypotheses(q, 4);
    setMemorySearchResults(results);
  };

  const handleArxivSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : arxivSearchInput).trim();
    if (!q) return;
    setIsSearchingArxiv(true);
    try {
      const papers = await searchArxiv(q, 4);
      setArxivPapers(papers);
    } catch (err) {
      console.error("arXiv search error:", err);
    } finally {
      setIsSearchingArxiv(false);
    }
  };

  const handleExecuteCAS = async (
    op: SymbolicOperation = casOperation,
    expr: string = casExpression,
    variable: string = casVariable
  ) => {
    if (!expr.trim()) return;
    setIsCalculatingCAS(true);
    try {
      const res = await executeSymbolicOperation({
        operation: op,
        expression: expr,
        variable,
      });
      setCasResult(res);
    } catch (_e) {
      // Handled inside executeSymbolicOperation
    } finally {
      setIsCalculatingCAS(false);
    }
  };

  const handleLiveOEISSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = oeisSearchInput.trim();
    if (!q) return;

    setIsSearchingOEIS(true);
    try {
      const results = await searchOEIS(q, 4);
      setOeisResults(results);
    } catch (_err) {
      // Fallback handled in searchOEIS
    } finally {
      setIsSearchingOEIS(false);
    }
  };

  const psiPercentage = Math.round(data.overallExploratoryPsi * 100);

  return (
    <div
      className={`border border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 via-slate-950/80 to-slate-950 rounded-2xl overflow-hidden shadow-xl text-slate-200 text-xs transition-all ${className}`}
    >
      {/* Top Banner & Header */}
      <div className="p-3.5 sm:p-4 bg-slate-900/80 border-b border-indigo-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 shadow-inner">
            <Compass className="w-5 h-5 text-indigo-300 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-amber-200">
                وضع الاستدلال الاستكشافي ونواة توليد الفرضيات (Deep Exploration)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono">
                Open Problem Mode
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              استكشاف استدلالي متقدم للمسائل المفتوحة • فحص الصمود أمام التفنيد الذاتي
            </p>
          </div>
        </div>

        {/* Psi Gauge & Interactive Controls */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 shadow"
            title="مؤشر اليقين الاستكشافي المحدث (Ψ_explore): يزن الصمود أمام التفنيد والاتساق الداخلي بدلاً من مجرد تطابق الإجابات"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-[11px]">Ψ_explore:</span>
            <span className="font-bold font-mono text-amber-300 text-sm">
              {typeof data?.overallExploratoryPsi === "number" ? data.overallExploratoryPsi.toFixed(2) : "0.88"}
            </span>
            <span className="text-[10px] text-slate-400">({psiPercentage}%)</span>
          </div>

          <button
            type="button"
            onClick={handleSaveActivePathway}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/90 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="حفظ الفرضية المعروضة حالياً في بنك الذاكرة المتجهة الدلالية"
          >
            {savedSuccessFeedback ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">تم الحفظ بالذاكرة!</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-purple-300" />
                <span>حفظ في بنك الفرضيات</span>
              </>
            )}
          </button>

          {onOpenTreeOfThought && (
            <button
              type="button"
              onClick={onOpenTreeOfThought}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer"
              title="فتح شجرة الاستدلال والفرضيات التفاعلية الكاملة"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>شجرة الفرضيات</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isExpanded ? "طي لوحة الاستكشاف" : "توسيع لوحة الاستكشاف"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 sm:p-4 space-y-4">
          {/* Exploratory Psi 4-Pillar Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col">
              <span className="text-slate-400">صمود التفنيد الذاتي (35%)</span>
              <span className="text-emerald-400 font-bold font-mono text-sm mt-0.5">
                {activePathway ? `${activePathway.resilienceScore}%` : "88%"}
              </span>
              <span className="text-[10px] text-slate-500">اختبار الأمثلة المضادة</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col">
              <span className="text-slate-400">الاتساق الداخلي (30%)</span>
              <span className="text-cyan-400 font-bold font-mono text-sm mt-0.5">
                {activePathway ? `${activePathway.consistencyScore}%` : "92%"}
              </span>
              <span className="text-[10px] text-slate-500">تماسك البنية الجبرية</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col">
              <span className="text-slate-400">عمق الخطوات (20%)</span>
              <span className="text-purple-400 font-bold font-mono text-sm mt-0.5">
                {activePathway ? `${activePathway.proofStepsCount} خطوات` : "9 خطوات"}
              </span>
              <span className="text-[10px] text-slate-500">كثافة الاستدلال</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col">
              <span className="text-slate-400">الجدة النظرية (15%)</span>
              <span className="text-amber-400 font-bold font-mono text-sm mt-0.5">
                {activePathway ? `${activePathway.noveltyScore}%` : "85%"}
              </span>
              <span className="text-[10px] text-slate-500">أصالة زاوية الهجوم</span>
            </div>
          </div>

          {/* Known Proved Bounds & State of the Art */}
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-xs">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>الحدود المعرفية المثبتة حالياً (State-of-the-Art Bounds):</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11.5px]">
              {data.knownBoundsSummary}
            </p>
          </div>

          {/* Multi-Pathway Hypothesis Exploration Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                مسارات الاستكشاف والفرضيات المتنافسة ({data.activePathways.length} مسارات هجوم):
              </span>
              <span className="text-[11px] text-slate-400">
                اختر مساراً لاستعراض بنيته الجبرية واختبارات تفنيده
              </span>
            </div>

            {/* Pathway Selector Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {data.activePathways.map((path, idx) => {
                const isSelected = idx === activeTab;
                return (
                  <button
                    key={path.id || idx}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-900/50"
                        : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{path.nameAr.split(":")[0] || `المسار ${idx + 1}`}</span>
                    <span className="text-[10px] opacity-80 font-mono">
                      (Ψ={typeof path?.exploratoryPsi === "number" ? path.exploratoryPsi.toFixed(2) : "0.85"})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Pathway Details Card */}
            {activePathway && (
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 mt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="space-y-0.5">
                    <div className="font-bold text-indigo-300 text-xs sm:text-sm">
                      {activePathway.nameAr}
                    </div>
                    <div className="text-slate-400 text-[10px] font-mono">
                      {activePathway.nameEn} • نمط: {activePathway.paradigm}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        activePathway.verdict === "promising"
                          ? "bg-emerald-950 border-emerald-500/50 text-emerald-300"
                          : "bg-amber-950 border-amber-500/50 text-amber-300"
                      }`}
                    >
                      {activePathway.verdict === "promising" ? "فرضية واعدة ومتسقة" : "حدسية مفتوحة"}
                    </span>
                  </div>
                </div>

                {/* Hypothesis Text */}
                <div className="text-slate-300 text-[11.5px] leading-relaxed">
                  <MathRenderer content={activePathway.hypothesisText} />
                </div>

                {/* Equations */}
                {activePathway.formalEquations.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono block">
                      الصيغة الرياضية الحاكمة للمسار:
                    </span>
                    <div className="space-y-1 text-cyan-300">
                      {activePathway.formalEquations.map((eq, i) => (
                        <MathRenderer key={i} content={`$$ ${eq} $$`} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Self-Falsification Trials Section */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      نتائج حلقة التفنيد الذاتي (Self-Falsification Trials):
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFalsificationDetails(!showFalsificationDetails)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      {showFalsificationDetails ? "إخفاء التفاصيل" : "عرض جميع الاختبارات"}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {activePathway.falsificationTests.map((t, idx) => {
                      const isSurvived = t.result === "survived";
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-medium text-slate-200">
                              {isSurvived ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                              <span>{t.testName}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                isSurvived
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                                  : "bg-amber-950 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {isSurvived ? "صمدت الفرضية ✓" : "تحدٍّ أو قيود محدودة"}
                            </span>
                          </div>
                          {(showFalsificationDetails || idx === 0) && (
                            <div className="text-slate-400 text-[10.5px] leading-relaxed pl-5 pr-2">
                              {t.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommended Next Attacks */}
                {activePathway.recommendedNextAttacks?.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-500/30 space-y-1">
                    <span className="text-[10.5px] font-semibold text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      توجيهات الهجوم البرهاني اللاحقة (Recommended Attack Vectors):
                    </span>
                    <ul className="space-y-0.5 text-slate-300 text-[10.5px]">
                      {activePathway.recommendedNextAttacks.map((att, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <ArrowRight className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
                          <span>{att}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real Computational & Symbolic Simulation Results */}
          {data.symbolicSimulations?.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                <Binary className="w-3.5 h-3.5 text-cyan-400" />
                <span>نتائج المحاكاة الرمزية والحسابية المباشرة (Symbolic Simulator):</span>
              </div>
              <div className="space-y-2 text-[11px]">
                {data.symbolicSimulations.map((sim, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="font-mono font-bold text-slate-300">{sim.engineUsed}</span>
                      <span className="text-emerald-400 font-medium">
                        {sim.exactProofStatus === "empirically_supported"
                          ? "مدعوم حسابياً 100%"
                          : "حدسية غير مبرهنة"}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      <MathRenderer content={sim.computationalEvidence} />
                    </p>
                    {sim.maxTestedValue && (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        نطاق الفحص: {sim.maxTestedValue}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OEIS (On-Line Encyclopedia of Integer Sequences) Integration Section */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-indigo-950/30 to-slate-900/70 border border-indigo-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 pb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-indigo-200 text-xs sm:text-sm">
                  موسوعة المتتاليات الصحيحة (OEIS Database Integration)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                  370k+ Sequences
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowOEISSection(!showOEISSection)}
                className="text-[10px] text-indigo-300 hover:text-white cursor-pointer"
              >
                {showOEISSection ? "طي القسم" : "توسيع القسم"}
              </button>
            </div>

            {showOEISSection && (
              <div className="space-y-3">
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  ربط استدلال أوميغا مباشرة مع قاعدة بيانات مؤسسة OEIS العالمية لتوثيق مسارات المتتاليات والحدود القياسية المثبتة:
                </p>

                {/* Interactive OEIS Search Bar */}
                <form
                  onSubmit={handleLiveOEISSearch}
                  className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-slate-800 focus-within:border-cyan-500/50"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
                  <input
                    type="text"
                    value={oeisSearchInput}
                    onChange={(e) => setOeisSearchInput(e.target.value)}
                    placeholder="ابحث برقم المتتالية (مثلاً A006884) أو بالأرقام (مثلاً 1, 2, 3, 6, 7, 9)..."
                    className="w-full bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingOEIS}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isSearchingOEIS ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <span>بحث OEIS</span>
                    )}
                  </button>
                </form>

                {/* Quick Collatz & Number Theory Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-400">متتاليات مرجعية سريعة:</span>
                  {[
                    { id: "A006370", label: "خريطة كولاتز A006370" },
                    { id: "A006577", label: "أطوال المسارات A006577" },
                    { id: "A006877", label: "القمم القياسية A006877" },
                    { id: "A006884", label: "الأرقام القياسية A006884" },
                    { id: "A014682", label: "مسار 27 الكامل A014682" },
                    { id: "A000040", label: "الأعداد الأولية A000040" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={async () => {
                        setOeisSearchInput(preset.id);
                        setIsSearchingOEIS(true);
                        const res = await searchOEIS(preset.id, 3);
                        setOeisResults(res);
                        setIsSearchingOEIS(false);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 font-mono transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* OEIS Sequences List */}
                <div className="space-y-2">
                  {oeisResults.map((seq, idx) => (
                    <div
                      key={seq.id || idx}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1.5 hover:border-indigo-500/40 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-[10.5px]">
                            {seq.id}
                          </span>
                          <span className="font-semibold text-slate-200 text-[11px]">
                            {seq.name}
                          </span>
                        </div>
                        <a
                          href={seq.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[10px] font-mono"
                          title="فتح المتتالية في الموسوعة الرسمية OEIS"
                        >
                          <span>oeis.org</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Sample terms */}
                      {seq.data && (
                        <div className="p-1.5 rounded-lg bg-slate-900/90 font-mono text-[10.5px] text-cyan-300 break-all">
                          <span className="text-slate-500 mr-1 select-none">الحدود الأولى:</span>
                          {seq.data.slice(0, 140)}
                          {seq.data.length > 140 ? "..." : ""}
                        </div>
                      )}

                      {/* Key Comments */}
                      {seq.comment.length > 0 && (
                        <div className="text-slate-400 text-[10.5px] leading-relaxed space-y-0.5">
                          {seq.comment.slice(0, 2).map((c, ci) => (
                            <p key={ci} className="line-clamp-2">
                              • {c}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Omega Symbolic Mathematics & CAS Engine Section */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-purple-950/30 to-slate-900/70 border border-purple-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-fuchsia-400" />
                <span className="font-bold text-purple-200 text-xs sm:text-sm">
                  محرك الحساب الرمزي والتحقق الجبري (Symbolic CAS Engine)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 text-[10px] font-mono">
                  Exact Analytical CAS
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCASSection(!showCASSection)}
                className="text-[10px] text-purple-300 hover:text-white cursor-pointer"
              >
                {showCASSection ? "طي المحرك" : "توسيع المحرك"}
              </button>
            </div>

            {showCASSection && (
              <div className="space-y-3">
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  تنفيذ حسابات رمزية رياضية قطعية وموثوقة بنسبة 100% بدون أي تخمين أو هلوسة، تدعم التفاضل والتكامل والتبسيط وحل المعادلات:
                </p>

                {/* Operation Selector Tabs */}
                <div className="flex flex-wrap gap-1.5 text-[10.5px]">
                  {[
                    { id: "diff" as SymbolicOperation, label: "اشتقاق رمزي d/dx" },
                    { id: "integrate" as SymbolicOperation, label: "تكامل رمزي ∫ dx" },
                    { id: "solve" as SymbolicOperation, label: "حل معادلة f(x)=0" },
                    { id: "simplify" as SymbolicOperation, label: "تبسيط جبري" },
                    { id: "factor" as SymbolicOperation, label: "تحليل لعوامل" },
                    { id: "expand" as SymbolicOperation, label: "نشر الأقواس" },
                    { id: "collatz_orbit" as SymbolicOperation, label: "محاكاة مدار كولاتز" },
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => {
                        setCasOperation(op.id);
                        if (op.id === "collatz_orbit") {
                          setCasExpression("27");
                        } else if (op.id === "integrate") {
                          setCasExpression("x^2 * cos(x)");
                        } else if (op.id === "solve") {
                          setCasExpression("x^2 - 16 = 0");
                        } else if (op.id === "simplify") {
                          setCasExpression("(x^2 - 1)/(x - 1)");
                        } else if (op.id === "factor") {
                          setCasExpression("x^4 - 16");
                        } else if (op.id === "diff") {
                          setCasExpression("x^3 + 4*x^2 - 5*x + 1");
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        casOperation === op.id
                          ? "bg-purple-600 text-white shadow-sm shadow-purple-500/30"
                          : "bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>

                {/* Interactive Formula Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecuteCAS();
                  }}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2"
                >
                  <div className="flex-1 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-slate-800 focus-within:border-purple-500/50">
                    <Cpu className="w-3.5 h-3.5 text-purple-400 ml-1 shrink-0" />
                    <input
                      type="text"
                      value={casExpression}
                      onChange={(e) => setCasExpression(e.target.value)}
                      placeholder="أدخل التعبير الرياضي (مثلاً x^3 + 4*x^2 - 5*x + 1)..."
                      className="w-full bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-mono"
                    />
                  </div>

                  {casOperation !== "collatz_orbit" && (
                    <div className="w-24 flex items-center gap-1 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px]">المتغير:</span>
                      <input
                        type="text"
                        value={casVariable}
                        onChange={(e) => setCasVariable(e.target.value)}
                        className="w-full bg-transparent border-none text-xs text-cyan-300 font-mono text-center focus:outline-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isCalculatingCAS}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-purple-900/30 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isCalculatingCAS ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>حساب رمزي قطعي</span>
                  </button>
                </form>

                {/* CAS Fast Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500">أمثلة سريعة:</span>
                  {[
                    { label: "كولاتز البذرة 27", op: "collatz_orbit" as SymbolicOperation, expr: "27", v: "x" },
                    { label: "تفاضل x³+4x²", op: "diff" as SymbolicOperation, expr: "x^3 + 4*x^2 - 5*x + 1", v: "x" },
                    { label: "تكامل x²·cos(x)", op: "integrate" as SymbolicOperation, expr: "x^2 * cos(x)", v: "x" },
                    { label: "حل x²-16=0", op: "solve" as SymbolicOperation, expr: "x^2 - 16 = 0", v: "x" },
                    { label: "تبسيط كسر", op: "simplify" as SymbolicOperation, expr: "(x^2 - 1)/(x - 1)", v: "x" },
                    { label: "تحليل x⁴-16", op: "factor" as SymbolicOperation, expr: "x^4 - 16", v: "x" },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCasOperation(preset.op);
                        setCasExpression(preset.expr);
                        setCasVariable(preset.v);
                        handleExecuteCAS(preset.op, preset.expr, preset.v);
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-purple-950/70 border border-slate-800 hover:border-purple-500/40 text-slate-400 hover:text-purple-200 font-mono transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* CAS Execution Result Box */}
                {casResult && (
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-purple-500/30 space-y-2">
                    <div className="flex flex-wrap items-center justify-between text-[11px] gap-2 border-b border-slate-800/80 pb-1.5">
                      <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>النتيجة الرياضية الرمزية الدقيقة ({casResult.operation})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        زمن الحساب: {casResult.executionTimeMs}ms
                      </span>
                    </div>

                    {/* Formatted Mathematical Result */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm overflow-x-auto text-emerald-300 font-mono flex items-center justify-center min-h-[44px]">
                      {casResult.latex ? (
                        <MathRenderer content={`$$${casResult.latex}$$`} />
                      ) : (
                        <span>{casResult.result}</span>
                      )}
                    </div>

                    {/* Extended Orbit / Trajectory Metadata */}
                    {casResult.metadata?.collatzSteps !== undefined && (
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 text-[10.5px]">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
                          <span>
                            عدد خطوات التوقف (Stopping Time):{" "}
                            <strong className="text-amber-300 font-mono">
                              {casResult.metadata.collatzSteps} خطوة
                            </strong>
                          </span>
                          <span>
                            أعلى قمة بلغها المسار (Peak):{" "}
                            <strong className="text-cyan-300 font-mono">
                              {casResult.metadata.collatzMax?.toLocaleString()}
                            </strong>
                          </span>
                        </div>
                        {casResult.metadata.trajectorySample && (
                          <div className="text-slate-400 font-mono text-[10px] break-all">
                            <span className="text-slate-500 mr-1">المسار الأولي:</span>
                            {casResult.metadata.trajectorySample.join(" → ")} → ...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Toggle Full SymPy / Algebraic Systems Workbench */}
                <div className="pt-2 border-t border-purple-500/20">
                  <button
                    type="button"
                    onClick={() => setShowSympyWorkbench(!showSympyWorkbench)}
                    className="w-full py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>
                      {showSympyWorkbench
                        ? "إغلاق منصة SymPy لحل النظم الجبرية والتبسيط الشامل"
                        : "فتح منصة SymPy المتقدمة (حل نظم المعادلات، التبسيط، وحساب النهايات)"}
                    </span>
                  </button>

                  {showSympyWorkbench && (
                    <div className="mt-3">
                      <SymbolicCASWorkbench
                        onHypothesisSaved={() => {
                          setMemoryBank(getHypothesisVectorStore().getAll());
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Omega Semantic Vector Memory & Hypothesis Bank Section */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-blue-950/30 to-slate-900/70 border border-blue-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-500/20 pb-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-blue-200 text-xs sm:text-sm">
                  بنك الذاكرة المتجهة الدلالية والفرضيات (Semantic Vector Memory Bank)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                  {memoryBank.length} فرضيات محفوظة
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const json = exportVectorMemoryJSON();
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `omega-vector-memory-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                  title="تصدير بنك الذاكرة والفرضيات كملف JSON"
                >
                  <Download className="w-3 h-3 text-sky-400" />
                  <span>تصدير JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowVectorMemorySection(!showVectorMemorySection)}
                  className="text-[10px] text-blue-300 hover:text-white cursor-pointer"
                >
                  {showVectorMemorySection ? "طي القسم" : "توسيع القسم"}
                </button>
              </div>
            </div>

            {showVectorMemorySection && (
              <div className="space-y-3">
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  تخزين تراكمي للفرضيات ومحاولات الإثبات ونتائج التفنيد عبر فضاء متجهي دلالي (Cosine Similarity)، يمنع التكرار والحلقات المفرغة ويمكّن أوميغا من التعلم المستمر:
                </p>

                {/* Auto-Retrieved Contextual Matches for Current Query */}
                {data.retrievedPriorHypotheses && data.retrievedPriorHypotheses.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        فرضيات سابقة مسترجعة تلقائياً لمسألتك الحالية:
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        تطابق متجهي وثيق
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {data.retrievedPriorHypotheses.map((match, mi) => (
                        <div
                          key={mi}
                          className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1 text-[10.5px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 line-clamp-1">
                              {match.item.title}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[9.5px]">
                              {match.similarityPercent}% تشابه
                            </span>
                          </div>
                          <p className="text-slate-400 line-clamp-2 text-[10px]">
                            {match.item.hypothesisText}
                          </p>
                          <div className="flex items-center justify-between text-[9.5px] text-slate-500 pt-1 border-t border-slate-900">
                            <span>المصدر: {match.item.source}</span>
                            <span className="text-emerald-400 font-medium">
                              صمود: {match.item.resilienceScore}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Semantic Vector Search Bar */}
                <form
                  onSubmit={handleMemorySearch}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2"
                >
                  <div className="flex-1 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-slate-800 focus-within:border-sky-500/50">
                    <Search className="w-3.5 h-3.5 text-sky-400 ml-1 shrink-0" />
                    <input
                      type="text"
                      value={memorySearchInput}
                      onChange={(e) => {
                        setMemorySearchInput(e.target.value);
                        if (!e.target.value.trim()) setMemorySearchResults([]);
                      }}
                      placeholder="ابحث دلالياً في بنك الفرضيات (مثلاً: تاو، دورات، ريمان، إرغودية)..."
                      className="w-full bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-1 shrink-0 cursor-pointer transition-all shadow"
                  >
                    <span>بحث دلالي</span>
                  </button>
                </form>

                {/* Search Results Display */}
                {memorySearchResults.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      نتائج البحث المتجهي ({memorySearchResults.length} نتائج مطابقة):
                    </span>
                    <div className="space-y-1.5">
                      {memorySearchResults.map((res, ri) => (
                        <div
                          key={ri}
                          className="p-2.5 rounded-lg bg-slate-950 border border-sky-500/30 space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-sky-200">{res.item.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[10px]">
                              تشابه: {res.similarityPercent}%
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            {res.item.hypothesisText}
                          </p>
                          {res.item.formalEquations?.length > 0 && (
                            <div className="text-amber-200 text-[10.5px] font-mono">
                              <MathRenderer content={`$$${res.item.formalEquations[0]}$$`} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stored Hypotheses Vault Mini-Explorer */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">
                      نظرة على الفرضيات المؤسسة المخزنة حالياً في النواة:
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      مخزنة محلياً ودلالياً
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {memoryBank.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 transition-colors space-y-1 text-[10.5px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 line-clamp-1">
                            {item.title}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 text-[9px] rounded font-medium ${
                              item.status === "verified_lemma"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : item.status === "survived"
                                ? "bg-cyan-500/20 text-cyan-300"
                                : "bg-purple-500/20 text-purple-300"
                            }`}
                          >
                            {item.status === "verified_lemma"
                              ? "مبرهنة"
                              : item.status === "survived"
                              ? "صامدة"
                              : "حدسية مفتوحة"}
                          </span>
                        </div>
                        <p className="text-slate-400 line-clamp-2 text-[10px]">
                          {item.hypothesisText}
                        </p>
                        <div className="text-[9.5px] text-slate-500 flex items-center justify-between pt-1">
                          <span className="line-clamp-1">{item.domain}</span>
                          <span className="text-amber-400 font-mono">Ψ {item.resilienceScore}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Omega arXiv Academic Literature & Preprints Grounding Section */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-emerald-950/30 to-slate-900/70 border border-emerald-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-200 text-xs sm:text-sm">
                  محرك الأوراق العلمية والتحقق الأكاديمي (arXiv Academic Literature)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                  {arxivPapers.length} أوراق أكاديمية محققة
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowArxivSection(!showArxivSection)}
                className="text-[10px] text-emerald-300 hover:text-white cursor-pointer"
              >
                {showArxivSection ? "طي القسم" : "توسيع القسم"}
              </button>
            </div>

            {showArxivSection && (
              <div className="space-y-3">
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  ربط وتأصيل استدلالات أوميغا بأحدث الأوراق البحثية والمسودات المفتوحة (Preprints) من مستودع arXiv العالمي، لمقارنة الفرضيات بالمبرهنات المنشورة رسمياً:
                </p>

                {/* arXiv Search Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleArxivSearch();
                  }}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2"
                >
                  <div className="flex-1 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500/50">
                    <Search className="w-3.5 h-3.5 text-emerald-400 ml-1 shrink-0" />
                    <input
                      type="text"
                      value={arxivSearchInput}
                      onChange={(e) => setArxivSearchInput(e.target.value)}
                      placeholder="ابحث في arXiv (مثلاً: Terence Tao, Collatz, Riemann Hypothesis, Ergodic)..."
                      className="w-full bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSearchingArxiv}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50"
                  >
                    {isSearchingArxiv ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span>بحث أكاديمي</span>
                  </button>
                </form>

                {/* arXiv Fast Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500">أوراق مرجعية:</span>
                  {[
                    { label: "مبرهنة تاو (كولاتز 2019)", q: "Terence Tao Collatz 2019" },
                    { label: "ببليوغرافيا لاغارياس 3x+1", q: "Jeffrey Lagarias 3x+1 Problem" },
                    { label: "أصفار دالة زيتا ريمان", q: "Riemann hypothesis zeros" },
                    { label: "إثبات غولدباخ الضعيفة (هيلفغوت)", q: "ternary goldbach conjecture helfgott" },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setArxivSearchInput(preset.q);
                        handleArxivSearch(preset.q);
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-emerald-950/70 border border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-200 font-mono transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* arXiv Papers List */}
                {arxivPapers.length > 0 ? (
                  <div className="space-y-2.5">
                    {arxivPapers.map((paper) => {
                      const isExpanded = !!expandedAbstracts[paper.id];
                      return (
                        <div
                          key={paper.id}
                          className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-2"
                        >
                          {/* Header: Title, Category Badge, External Links */}
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-xs sm:text-sm text-slate-100 leading-snug">
                                  {paper.title}
                                </span>
                                {paper.isLandmark && (
                                  <span className="px-1.5 py-0.2 text-[9px] rounded bg-amber-500/20 text-amber-300 font-medium">
                                    مرجعية تأسيسية
                                  </span>
                                )}
                                <span className="px-1.5 py-0.2 text-[9px] rounded bg-slate-800 text-slate-400 font-mono">
                                  {paper.primaryCategory}
                                </span>
                              </div>

                              {/* Authors & Published Date */}
                              <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-slate-400">
                                <span>المؤلفون: {paper.authors.join(", ")}</span>
                                <span>•</span>
                                <span className="font-mono">{paper.published}</span>
                                <span>•</span>
                                <span className="font-mono text-emerald-400">arXiv:{paper.id}</span>
                              </div>
                            </div>

                            {/* Links */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <a
                                href={paper.arxivUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10.5px] transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 text-sky-400" />
                                <span>arXiv</span>
                              </a>
                              <a
                                href={paper.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-600/40 text-[10.5px] font-medium transition-colors"
                              >
                                <Download className="w-3 h-3 text-emerald-400" />
                                <span>PDF</span>
                              </a>
                            </div>
                          </div>

                          {/* Summary / Abstract */}
                          <div className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                            <p className={isExpanded ? "" : "line-clamp-2"}>{paper.summary}</p>
                            {paper.summary.length > 120 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedAbstracts((prev) => ({
                                    ...prev,
                                    [paper.id]: !prev[paper.id],
                                  }))
                                }
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium mt-1 cursor-pointer"
                              >
                                {isExpanded ? "إخفاء الملخص" : "عرض الملخص الأكاديمي كاملاً..."}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-950 text-center text-slate-500 text-xs">
                    لم يتم العثور على أوراق بحثية فورية. جرب البحث عن مصطلح آخر أو انقر على أحد الأوراق المرجعية أعلاه.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
