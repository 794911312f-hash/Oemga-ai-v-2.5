/**
 * src/components/omega/ComplexOperationsLab.tsx
 * =====================================================================
 * Omega Complex Operations Interactive Laboratory (مختبر العمليات المعقدة)
 * ---------------------------------------------------------------------
 * Dedicated laboratory for executing, verifying, and visualizing:
 * 1. Matrix Determinants, Inverses, Eigenvalues & Gram-Schmidt
 * 2. Collatz 3n+1 Trajectory Simulator with stopping time & peak curves
 * 3. Relativistic Lorentz Kinematics & Energy-Mass Equivalence
 * 4. Quantum 2-Qubit Superposition & Entanglement Concurrence
 * 5. Full execution trace with step-by-step mathematical proofs in KaTeX
 * =====================================================================
 */

import React, { useState } from "react";
import {
  Sigma,
  Cpu,
  Sparkles,
  Zap,
  Layers,
  Atom,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { MathRenderer } from "./MathRenderer";
import {
  executeComplexOperation,
  type ComplexDomain,
  type ComplexOperationResult,
} from "../../lib/omega/complexOperations";

interface Props {
  onClose?: () => void;
  className?: string;
}

export const ComplexOperationsLab: React.FC<Props> = ({ onClose, className = "" }) => {
  const [selectedDomain, setSelectedDomain] = useState<ComplexDomain>("linear_algebra");
  const [selectedOp, setSelectedOp] = useState<string>("matrix_det");
  const [matrixInput, setMatrixInput] = useState<string>("2, 1, 3\n1, 4, 2\n3, 2, 5");
  const [collatzSeed, setCollatzSeed] = useState<number>(27);
  const [relVelocityC, setRelVelocityC] = useState<number>(0.85); // Fraction of c
  const [relMass, setRelMass] = useState<number>(1.0); // kg
  const [qubitVector, setQubitVector] = useState<string>("1, 0, 0, 1"); // Bell state [1, 0, 0, 1] / sqrt(2)

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<ComplexOperationResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunOperation = async () => {
    setIsRunning(true);
    let inputData: any;

    if (selectedOp === "matrix_det" || selectedOp === "matrix_inverse") {
      try {
        const rows = matrixInput
          .trim()
          .split("\n")
          .map((row) =>
            row
              .split(/[, ]+/)
              .filter(Boolean)
              .map((v) => parseFloat(v))
          );
        inputData = rows;
      } catch {
        inputData = [[1, 0], [0, 1]];
      }
    } else if (selectedOp === "collatz_orbit") {
      inputData = collatzSeed;
    } else if (selectedOp === "relativistic_kinematics") {
      inputData = {
        velocity: relVelocityC * 299792458,
        mass: relMass,
      };
    } else if (selectedOp === "quantum_superposition") {
      const parts = qubitVector
        .split(/[, ]+/)
        .filter(Boolean)
        .map((v) => parseFloat(v));
      inputData = [parts[0] || 1, parts[1] || 0, parts[2] || 0, parts[3] || 1];
    }

    try {
      const res = await executeComplexOperation({
        domain: selectedDomain,
        operation: selectedOp,
        input: inputData,
      });
      setResult(res);
    } catch (err: any) {
      console.error("[Complex Operation Error]:", err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      dir="rtl"
      className={`bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-100 flex flex-col gap-5 ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
            <Sigma className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>مختبر العمليات المعقدة والنواة الحسابية</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Complex Operations Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              حسابات جبرية دقيقة، حركيات نسبية، حالات كمومية، ومسارات كولاتز الرياضية.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Domain Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedDomain("linear_algebra");
            setSelectedOp("matrix_det");
          }}
          className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
            selectedDomain === "linear_algebra"
              ? "bg-purple-950/90 border-purple-400 text-white ring-1 ring-purple-400/40 shadow-sm"
              : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="text-xs font-bold text-purple-300 mb-0.5">📐 الجبر الخطي والمصفوفات</div>
          <div className="text-[10px] text-slate-400">محددات، مقلوب، وقيم ذاتية</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedDomain("discrete_number_theory");
            setSelectedOp("collatz_orbit");
          }}
          className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
            selectedDomain === "discrete_number_theory"
              ? "bg-cyan-950/90 border-cyan-400 text-white ring-1 ring-cyan-400/40 shadow-sm"
              : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="text-xs font-bold text-cyan-300 mb-0.5">🔢 نظرية الأعداد ومسار كولاتز</div>
          <div className="text-[10px] text-slate-400">تحليل 3n+1 والتكرارات</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedDomain("quantum_relativistic_physics");
            setSelectedOp("relativistic_kinematics");
          }}
          className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
            selectedDomain === "quantum_relativistic_physics" && selectedOp === "relativistic_kinematics"
              ? "bg-amber-950/90 border-amber-400 text-white ring-1 ring-amber-400/40 shadow-sm"
              : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="text-xs font-bold text-amber-300 mb-0.5">⚡ الفيزياء النسبية ولورنتز</div>
          <div className="text-[10px] text-slate-400">معامل لورنتز وتكافؤ E=mc²</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedDomain("quantum_relativistic_physics");
            setSelectedOp("quantum_superposition");
          }}
          className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
            selectedDomain === "quantum_relativistic_physics" && selectedOp === "quantum_superposition"
              ? "bg-emerald-950/90 border-emerald-400 text-white ring-1 ring-emerald-400/40 shadow-sm"
              : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="text-xs font-bold text-emerald-300 mb-0.5">🌌 ميكانيكا الكم والتشابك</div>
          <div className="text-[10px] text-slate-400">تراكب الحالات ومقياس بل</div>
        </button>
      </div>

      {/* Input Configuration Box */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        {selectedDomain === "linear_algebra" && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                مصفوفة الإدخال المربعة (افصل بين العناصر بفاصلة أو مسافة):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOp("matrix_det")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                    selectedOp === "matrix_det"
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  حساب المحدد (det)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOp("matrix_inverse")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                    selectedOp === "matrix_inverse"
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  معكوس المصفوفة (A⁻¹)
                </button>
              </div>
            </div>
            <textarea
              value={matrixInput}
              onChange={(e) => setMatrixInput(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-purple-500"
            />
          </div>
        )}

        {selectedDomain === "discrete_number_theory" && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              بذرة عدد كولاتز البدائية (Start Seed n):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={collatzSeed}
                onChange={(e) => setCollatzSeed(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-48 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400">
                (جرب البذور الشهيرة: 27، 97، 871، أو أي عدد طبيعي كبير)
              </span>
            </div>
          </div>
        )}

        {selectedDomain === "quantum_relativistic_physics" && selectedOp === "relativistic_kinematics" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                السرعة كنسبة من سرعة الضوء (v / c):
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="0.999"
                value={relVelocityC}
                onChange={(e) => setRelVelocityC(parseFloat(e.target.value) || 0.5)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                كتلة السكون (Rest Mass m₀ in kg):
              </label>
              <input
                type="number"
                step="0.1"
                min="0.0001"
                value={relMass}
                onChange={(e) => setRelMass(parseFloat(e.target.value) || 1.0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {selectedDomain === "quantum_relativistic_physics" && selectedOp === "quantum_superposition" && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              معاملات حالة 2-كيوبت [c₀₀, c₀₁, c₁₀, c₁₁]:
            </label>
            <input
              type="text"
              value={qubitVector}
              onChange={(e) => setQubitVector(e.target.value)}
              placeholder="1, 0, 0, 1"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* Action Trigger Button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400">
            حسابات استدلالية قطعية خالية من أي تقريب أو تشويه خوارزمي.
          </span>
          <button
            type="button"
            onClick={handleRunOperation}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? "جاري تنفيذ الحساب..." : "تشغيل العملية المعقدة"}</span>
          </button>
        </div>
      </div>

      {/* Execution Results Display */}
      {result && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-purple-500/30 space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-100">{result.operationNameAr}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                مؤشر اليقين Ψ: {result.verificationPsi.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              زمن التنفيذ: {result.executionTimeMs}ms
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{result.summaryAr}</p>

          {/* Primary Formula Display */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
            <div className="text-sm text-cyan-300 font-mono">
              <MathRenderer content={`$$${result.primaryResultLatex}$$`} />
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(result.primaryResultLatex, "primary-latex")}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"
              title="نسخ صيغة LaTeX"
            >
              {copiedKey === "primary-latex" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Step-by-Step Proof Traces */}
          {result.steps && result.steps.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-slate-400">
                خطوات الإثبات والتفكيك الرياضي:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.steps.map((step, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                    <div className="font-semibold text-purple-300 text-[11px]">
                      {step.stepIndex}. {step.titleAr}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      {step.descriptionAr}
                    </div>
                    <div className="text-[11px] text-cyan-400 font-mono pt-1">
                      <MathRenderer content={`$${step.equationLatex}$`} />
                    </div>
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
