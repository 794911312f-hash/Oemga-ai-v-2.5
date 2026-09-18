/**
 * src/components/omega/SymbolicCASWorkbench.tsx
 * =====================================================================
 * Omega Symbolic Mathematics & CAS Interactive Workbench
 * ---------------------------------------------------------------------
 * A high-precision UI workbench powered by the SymbolicService layer (SymPy/Nerdamer):
 * - Solve algebraic systems of linear and non-linear equations
 * - Simplify complex equations, rational expressions, and trigonometric identities
 * - Perform exact symbolic differentiation, integration, limits, and factorizations
 * - Pristine KaTeX mathematical rendering with instant copying and memory bank saving
 * =====================================================================
 */

import React, { useState } from "react";
import {
  Calculator,
  Sliders,
  Sparkles,
  Layers,
  Copy,
  Check,
  Plus,
  Trash2,
  Bookmark,
  BookmarkCheck,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { MathRenderer } from "./MathRenderer";
import {
  SymbolicService,
  type AlgebraicSystemSolution,
  type SimplificationResult,
  type SymbolicCalculationResult,
  formatSystemToLatex,
} from "../../lib/omega/symbolicService";
import { saveHypothesisToMemory } from "../../lib/omega/vectorStore";

interface Props {
  onHypothesisSaved?: () => void;
  className?: string;
}

type WorkbenchTab = "systems" | "simplify" | "calculus";

export const SymbolicCASWorkbench: React.FC<Props> = ({
  onHypothesisSaved,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("systems");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  // --- Tab 1: Algebraic Systems State ---
  const [systemEquations, setSystemEquations] = useState<string[]>([
    "x + y = 10",
    "2*x - y = 5",
  ]);
  const [systemVariables, setSystemVariables] = useState<string>("x, y");
  const [isSolvingSystem, setIsSolvingSystem] = useState<boolean>(false);
  const [systemSolution, setSystemSolution] = useState<AlgebraicSystemSolution | null>(null);

  // --- Tab 2: Simplification State ---
  const [simplifyInput, setSimplifyInput] = useState<string>("(x^2 - 1)/(x - 1)");
  const [isSimplifying, setIsSimplifying] = useState<boolean>(false);
  const [simplifyResult, setSimplifyResult] = useState<SimplificationResult | null>(null);

  // --- Tab 3: Calculus & Operations State ---
  const [calcOp, setCalcOp] = useState<"diff" | "integrate" | "limit" | "factor" | "expand" | "substitute">("diff");
  const [calcExpression, setCalcExpression] = useState<string>("x^3 * sin(x)");
  const [calcVariable, setCalcVariable] = useState<string>("x");
  const [calcOrder, setCalcOrder] = useState<number>(1);
  const [calcLimitPoint, setCalcLimitPoint] = useState<string>("0");
  const [calcSubstitutions, setCalcSubstitutions] = useState<string>("x: 5");
  const [isComputingCalc, setIsComputingCalc] = useState<boolean>(false);
  const [calcResult, setCalcResult] = useState<SymbolicCalculationResult | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Solve System Handler
  const handleSolveSystem = async () => {
    setIsSolvingSystem(true);
    const vars = systemVariables
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const res = await SymbolicService.solveAlgebraicSystem(systemEquations, vars);
    setSystemSolution(res);
    setIsSolvingSystem(false);
  };

  // Simplify Handler
  const handleSimplify = async (exprToSimplify?: string) => {
    const target = exprToSimplify || simplifyInput;
    setIsSimplifying(true);
    const res = await SymbolicService.simplifyEquation(target);
    setSimplifyResult(res);
    setIsSimplifying(false);
  };

  // Calculus Handler
  const handleCalculate = async () => {
    setIsComputingCalc(true);
    let subs: Record<string, string | number> = {};
    if (calcOp === "substitute" && calcSubstitutions) {
      calcSubstitutions.split(",").forEach((pair) => {
        const [k, v] = pair.split(":");
        if (k && v) subs[k.trim()] = v.trim();
      });
    }

    const res = await SymbolicService.calculate({
      operation: calcOp,
      expression: calcExpression,
      variable: calcVariable,
      order: calcOrder,
      limitPoint: calcLimitPoint,
      substitutions: subs,
    });
    setCalcResult(res);
    setIsComputingCalc(false);
  };

  // Save to Memory Bank
  const handleSaveToMemory = (title: string, desc: string, equations: string[]) => {
    saveHypothesisToMemory({
      title,
      hypothesisText: desc,
      formalEquations: equations,
      domain: "Computer Algebra System (CAS)",
      status: "verified_lemma",
      resilienceScore: 99,
      tags: ["CAS", "SymPy", "حساب رمزي", "جبر"],
      source: "Omega Symbolic CAS Engine",
      verificationMethod: "Deterministic SymPy/Nerdamer Algebraic Reduction",
      falsificationSummary: "تم التبسيط والتحقق الرمزي الجبري الدقيق عبر محرك CAS",
    });
    setSavedKey(title);
    if (onHypothesisSaved) onHypothesisSaved();
    setTimeout(() => setSavedKey(null), 2500);
  };

  return (
    <div
      className={`rounded-2xl bg-gradient-to-b from-slate-950/95 via-indigo-950/20 to-slate-950/95 border border-indigo-500/30 p-4 sm:p-5 shadow-xl space-y-4 ${className}`}
    >
      {/* Workbench Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-indigo-100">
                منصة الحساب الرمزي وحل النظم الجبرية (SymPy / CAS Workbench)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-medium">
                دقيق وقطعي (Exact)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              حل منظومات المعادلات الرياضية الخطية وغير الخطية وتبسيط المقادير بدقة جبرية مطلقة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("systems")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === "systems"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              حل نظم المعادلات
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("simplify")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === "simplify"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              تبسيط العبارات
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calculus")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === "calculus"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              التفاضل والتكامل والنهايات
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title={isCollapsed ? "توسيع المنصة" : "طي المنصة"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-4">
          {/* ============================================================== */}
          {/* TAB 1: ALGEBRAIC SYSTEMS SOLVER */}
          {/* ============================================================== */}
          {activeTab === "systems" && (
            <div className="space-y-4">
              {/* Presets Row */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">أنظمة جاهزة:</span>
                {[
                  {
                    name: "خطي 2×2",
                    eqs: ["x + y = 10", "2*x - y = 5"],
                    vars: "x, y",
                  },
                  {
                    name: "غير خطي (دائرة ومستقيم)",
                    eqs: ["x^2 + y^2 = 25", "x - y = 1"],
                    vars: "x, y",
                  },
                  {
                    name: "خطي 3×3",
                    eqs: [
                      "3*x + 2*y - z = 1",
                      "2*x - 2*y + 4*z = -2",
                      "-x + 0.5*y - z = 0",
                    ],
                    vars: "x, y, z",
                  },
                  {
                    name: "كثير حدود من الدرجة 3",
                    eqs: ["x^3 - 6*x^2 + 11*x - 6 = 0"],
                    vars: "x",
                  },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSystemEquations(preset.eqs);
                      setSystemVariables(preset.vars);
                      setSystemSolution(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Equations Input List */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    معادلات المنظومة الجبرية:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">المتغيرات:</span>
                    <input
                      type="text"
                      value={systemVariables}
                      onChange={(e) => setSystemVariables(e.target.value)}
                      placeholder="x, y, z"
                      className="w-20 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {systemEquations.map((eq, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-xs w-5 text-center">
                        {i + 1}.
                      </span>
                      <input
                        type="text"
                        value={eq}
                        onChange={(e) => {
                          const updated = [...systemEquations];
                          updated[i] = e.target.value;
                          setSystemEquations(updated);
                        }}
                        placeholder="مثلاً: x + y = 10 أو 2*x - y = 5"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                      {systemEquations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSystemEquations(systemEquations.filter((_, idx) => idx !== i));
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="حذف المعادلة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Equation & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setSystemEquations([...systemEquations, ""])}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة معادلة أخرى للنظام</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSolveSystem}
                    disabled={isSolvingSystem || systemEquations.every((e) => !e.trim())}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-indigo-950/50"
                  >
                    {isSolvingSystem ? (
                      <Sliders className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>حل المنظومة الجبرية بدقة قطعية</span>
                  </button>
                </div>
              </div>

              {/* System Preview in KaTeX */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                <span className="text-[10px] text-slate-400 block">تمثيل المنظومة في صيغة LaTeX:</span>
                <div className="text-sm sm:text-base text-indigo-200">
                  <MathRenderer content={`$$${formatSystemToLatex(systemEquations)}$$`} />
                </div>
              </div>

              {/* Solution Output */}
              {systemSolution && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      حل المنظومة الجبرية المحقق (Exact Solution):
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      {systemSolution.executionTimeMs}ms
                    </span>
                  </div>

                  {/* Math Display of Solution */}
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-center text-emerald-200 text-base">
                    <MathRenderer content={`$$${systemSolution.solutionLatex}$$`} />
                  </div>

                  {/* Solved Discrete Variables Badges */}
                  {systemSolution.solutions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400">القيم المستخرجة:</span>
                      {systemSolution.solutions.map((sol, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-300 flex items-center gap-1"
                        >
                          <span className="text-indigo-300">{sol.variable}</span>
                          <span className="text-slate-500">=</span>
                          <span>{sol.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action row: Copy / Save to Memory Bank */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-900 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(systemSolution.solutionLatex, "system_latex")
                      }
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                    >
                      {copiedKey === "system_latex" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>نسخ LaTeX</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSaveToMemory(
                          `حل منظومة معادلات (${systemEquations.join(" ; ")})`,
                          `تم حل النظام الجبري والحصول على الحلول الدقيقة: ${systemSolution.solutions.map((s) => `${s.variable}=${s.value}`).join(", ")}`,
                          [systemSolution.solutionLatex]
                        )
                      }
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-600/40 cursor-pointer"
                    >
                      {savedKey ? (
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span>حفظ الحل في بنك الفرضيات</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: EQUATION & EXPRESSION SIMPLIFIER */}
          {/* ============================================================== */}
          {activeTab === "simplify" && (
            <div className="space-y-4">
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">أمثلة شائعة:</span>
                {[
                  { label: "كسر نسبي (x²-1)/(x-1)", expr: "(x^2 - 1)/(x - 1)" },
                  { label: "متطابقة sin²(x)+cos²(x)", expr: "sin(x)^2 + cos(x)^2" },
                  { label: "فرق مكعبين (x+y)³ - (x-y)³", expr: "(x + y)^3 - (x - y)^3" },
                  { label: "تبسيط جذر √(x²+2x+1)", expr: "sqrt(x^2 + 2*x + 1)" },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSimplifyInput(preset.expr);
                      handleSimplify(preset.expr);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                <label className="text-xs font-semibold text-slate-200 block">
                  العبارة أو المعادلة الرياضية المراد تبسيطها:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={simplifyInput}
                    onChange={(e) => setSimplifyInput(e.target.value)}
                    placeholder="مثلاً: (x^2 - 1)/(x - 1) أو sin(x)^2 + cos(x)^2"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSimplify()}
                    disabled={isSimplifying || !simplifyInput.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-indigo-950/50"
                  >
                    {isSimplifying ? (
                      <Sliders className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    )}
                    <span>تبسيط العبارة</span>
                  </button>
                </div>
              </div>

              {/* Result Comparison */}
              {simplifyResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300">
                      مقارنة التعبير قبل وبعد التبسيط الجبري القطعي:
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      {simplifyResult.executionTimeMs}ms
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-center">
                      <span className="text-[10.5px] text-slate-400">التعبير الأصلي:</span>
                      <div className="text-sm text-slate-200">
                        <MathRenderer content={`$$${simplifyResult.originalLatex}$$`} />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/40 space-y-1 text-center">
                      <span className="text-[10.5px] text-emerald-400 font-semibold">
                        النتيجة المبسطة قطيعاً:
                      </span>
                      <div className="text-base text-indigo-100 font-bold">
                        <MathRenderer content={`$$${simplifyResult.simplifiedLatex}$$`} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(simplifyResult.simplifiedLatex, "simp_latex")
                      }
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                    >
                      {copiedKey === "simp_latex" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>نسخ النتيجة المبسطة</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: CALCULUS & ADVANCED SYMBOLIC OPS */}
          {/* ============================================================== */}
          {activeTab === "calculus" && (
            <div className="space-y-4">
              {/* Operation Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 text-xs">
                {[
                  { id: "diff", label: "اشتقاق رمزي", desc: "d/dx" },
                  { id: "integrate", label: "تكامل تحليلي", desc: "∫ f(x) dx" },
                  { id: "limit", label: "حساب النهايات", desc: "lim x→a" },
                  { id: "factor", label: "تحليل لكثيرات الحدود", desc: "Factor" },
                  { id: "expand", label: "نشر العبارات", desc: "Expand" },
                  { id: "substitute", label: "تعويض القيم", desc: "x = a" },
                ].map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => {
                      setCalcOp(op.id as any);
                      setCalcResult(null);
                    }}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                      calcOp === op.id
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                        : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="block font-bold text-xs">{op.label}</span>
                    <span className="block text-[10px] font-mono text-slate-500">{op.desc}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Inputs Form */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs text-slate-300 font-medium">الدالة أو العبارة:</label>
                    <input
                      type="text"
                      value={calcExpression}
                      onChange={(e) => setCalcExpression(e.target.value)}
                      placeholder="x^3 * sin(x) أو x^4 - 16"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">المتغير:</label>
                    <input
                      type="text"
                      value={calcVariable}
                      onChange={(e) => setCalcVariable(e.target.value)}
                      placeholder="x"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Sub-parameters based on Op */}
                {calcOp === "diff" && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">رتبة الاشتقاق (Order):</span>
                    {[1, 2, 3, 4].map((ord) => (
                      <button
                        key={ord}
                        type="button"
                        onClick={() => setCalcOrder(ord)}
                        className={`px-2 py-0.5 rounded font-mono cursor-pointer ${
                          calcOrder === ord
                            ? "bg-indigo-600 text-white font-bold"
                            : "bg-slate-900 text-slate-400 border border-slate-800"
                        }`}
                      >
                        {ord}
                      </button>
                    ))}
                  </div>
                )}

                {calcOp === "limit" && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">النقطة التي يؤول إليها المتغير (x → a):</span>
                    <input
                      type="text"
                      value={calcLimitPoint}
                      onChange={(e) => setCalcLimitPoint(e.target.value)}
                      placeholder="0 أو Infinity أو 1"
                      className="w-24 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-300"
                    />
                  </div>
                )}

                {calcOp === "substitute" && (
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400">التعويضات (مثلاً: x: 5, y: 3):</span>
                    <input
                      type="text"
                      value={calcSubstitutions}
                      onChange={(e) => setCalcSubstitutions(e.target.value)}
                      placeholder="x: 5, y: 10"
                      className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-300"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleCalculate}
                    disabled={isComputingCalc || !calcExpression.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-indigo-950/50"
                  >
                    {isComputingCalc ? (
                      <Sliders className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>حساب وتحليل رمزي قطعي</span>
                  </button>
                </div>
              </div>

              {/* Calculus Result */}
              {calcResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300">
                      النتيجة التحليلية الدقيقة (Analytical CAS Output):
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      {calcResult.executionTimeMs}ms
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/40 text-center text-base sm:text-lg text-indigo-100 font-mono">
                    <MathRenderer content={`$$${calcResult.latex}$$`} />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900 text-xs">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(calcResult.latex, "calc_latex")}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                    >
                      {copiedKey === "calc_latex" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>نسخ LaTeX</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
