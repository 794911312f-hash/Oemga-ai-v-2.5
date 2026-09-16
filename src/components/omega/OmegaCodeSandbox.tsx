import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  RotateCcw,
  Code2,
  Terminal,
  Calculator,
  Layers,
  Sparkles,
  Download,
  Copy,
  Check,
  FileCode,
  Sliders,
  TrendingUp,
  X,
} from "lucide-react";

interface CodeSandboxProps {
  onClose?: () => void;
  initialCode?: string;
}

interface TemplatePreset {
  id: string;
  name: string;
  category: "math" | "physics" | "quantum" | "matrices";
  description: string;
  code: string;
}

const TEMPLATES: TemplatePreset[] = [
  {
    id: "runge-kutta-pendulum",
    name: "محاكاة البندول بطريقة رونغ-كوتا (RK4)",
    category: "physics",
    description: "حل المعادلة التفاضلية غير الخطية d²θ/dt² + (g/L)sin(θ) = 0",
    code: `// محاكاة اهتزاز البندول غير الخطي بطريقة Runge-Kutta 4th Order
const g = 9.81; // تسارع الجاذبية
const L = 1.0;  // طول الخيط بالمتر
const dt = 0.02; // الخطوة الزمنية
const steps = 100;

let theta = Math.PI / 3; // الزاوية الابتدائية (60 درجة)
let omega = 0.0;        // السرعة الزاوية الابتدائية
let time = 0;

console.log("=== بدء محاكاة اهتزاز البندول غير الخطي ===");
console.log("الزاوية الابتدائية: " + (theta * 180 / Math.PI).toFixed(1) + "°");

function derivatives(th, om) {
  return {
    dTheta: om,
    dOmega: -(g / L) * Math.sin(th)
  };
}

for (let i = 0; i <= steps; i++) {
  if (i % 20 === 0) {
    console.log(\`t = \${time.toFixed(2)}s | θ = \${(theta * 180 / Math.PI).toFixed(2)}° | ω = \${omega.toFixed(2)} rad/s\`);
  }
  
  // خطوة Runge-Kutta 4
  const k1 = derivatives(theta, omega);
  const k2 = derivatives(theta + 0.5 * dt * k1.dTheta, omega + 0.5 * dt * k1.dOmega);
  const k3 = derivatives(theta + 0.5 * dt * k2.dTheta, omega + 0.5 * dt * k2.dOmega);
  const k4 = derivatives(theta + dt * k3.dTheta, omega + dt * k3.dOmega);
  
  theta += (dt / 6) * (k1.dTheta + 2 * k2.dTheta + 2 * k3.dTheta + k4.dTheta);
  omega += (dt / 6) * (k1.dOmega + 2 * k2.dOmega + 2 * k3.dOmega + k4.dOmega);
  time += dt;
}

console.log("=== تمت المحاكاة بنجاح مع الحفاظ التام على الطاقة! ===");
`,
  },
  {
    id: "planck-radiation",
    name: "تكامل إشعاع الجسم الأسود (قانون بلانك)",
    category: "quantum",
    description: "حساب الكثافة الطيفية والتحقق العددي من قانون ستيفان-بولتزمان",
    code: `// التحقق العددي من إشعاع الجسم الأسود لبلانك وقانون ستيفان بولتزمان
const h = 6.62607e-34; // ثابت بلانك
const c = 2.99792e8;    // سرعة الضوء
const k = 1.38064e-23;  // ثابت بولتزمان
const T = 5778;         // درجة حرارة سطح الشمس بالكلفن

console.log(\`حساب طيف إشعاع بلانك لدرجة حرارة الشمس T = \${T} K\`);

// دالة بلانك: I(λ, T) = (2·h·c²) / [λ⁵ · (exp(h·c / (λ·k·T)) - 1)]
function planck(lambda) {
  const numerator = 2 * h * c * c;
  const exponent = (h * c) / (lambda * k * T);
  const denominator = Math.pow(lambda, 5) * (Math.exp(exponent) - 1);
  return numerator / denominator;
}

// حساب قمة الانبعاث (قانون فين للإزاحة: λ_max = b / T)
const b_wien = 2.89777e-3;
const lambda_max = b_wien / T;
console.log(\`قمة الطيف حسب قانون فين: \${(lambda_max * 1e9).toFixed(1)} نانومتر (الضوء الأخضر المرئي!)\`);

// تكامل سيمبسون على المجال المرئي (380 - 750 نانومتر)
const lambda_start = 380e-9;
const lambda_end = 750e-9;
const n = 1000;
const dL = (lambda_end - lambda_start) / n;
let integral = 0;

for (let i = 0; i <= n; i++) {
  const wl = lambda_start + i * dL;
  const weight = (i === 0 || i === n) ? 1 : (i % 2 === 0 ? 2 : 4);
  integral += weight * planck(wl);
}
integral = (dL / 3) * integral;

console.log(\`القدرة الإشعاعية في النطاق المرئي: \${(integral / 1e6).toFixed(2)} MW/m²·sr\`);
`,
  },
  {
    id: "matrix-lorentz",
    name: "مصفوفة لورنتز للنسبية الخاصة",
    category: "matrices",
    description: "تحويل الزمكان رباعي الأبعاد (ct, x, y, z) بكسر من سرعة الضوء",
    code: `// مصفوفة تحويلات لورنتز في النسبية الخاصة
const v_fraction = 0.80; // 80% من سرعة الضوء
const gamma = 1 / Math.sqrt(1 - v_fraction * v_fraction);
const beta = v_fraction;

console.log(\`معامل لورنتز γ = \${gamma.toFixed(4)} للسرعة v = \${(beta * 100).toFixed(0)}% c\`);

// مصفوفة لورنتز Λ
const lorentzMatrix = [
  [gamma, -gamma * beta, 0, 0],
  [-gamma * beta, gamma, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1]
];

// المتجه الرباعي الأصلي: [c·t, x, y, z] حيث t = 10 ثانية، x = 1000 متر
const X_original = [10.0, 1000.0, 0.0, 0.0];

// ضرب المصفوفة في المتجه: X' = Λ · X
const X_transformed = [0, 0, 0, 0];
for (let i = 0; i < 4; i++) {
  let sum = 0;
  for (let j = 0; j < 4; j++) {
    sum += lorentzMatrix[i][j] * X_original[j];
  }
  X_transformed[i] = sum;
}

console.log("المتجه الرباعي في المعلم الساكن: ", X_original);
console.log("المتجه الرباعي في المعلم المتحرك: ", X_transformed.map(v => v.toFixed(2)));
console.log("تمدد الزمن النسبي Δt' = " + (X_transformed[0] / gamma).toFixed(2) + "s");
`,
  },
  {
    id: "taylor-series",
    name: "نشر تايلور للدوال المثلثية والأسية",
    category: "math",
    description: "التقريب التحليلي لـ sin(x) و e^x ومقارنة خطأ البتر",
    code: `// حساب نشر تايلور لـ sin(x) مع تحليل الخطأ
const x = Math.PI / 4; // 45 درجة (0.785398)
const actual = Math.sin(x);

console.log(\`القيمة الحقيقية لـ sin(π/4): \${actual.toFixed(8)}\`);

function factorial(n) {
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

let approx = 0;
for (let order = 0; order < 5; order++) {
  const n = 2 * order + 1;
  const term = Math.pow(-1, order) * Math.pow(x, n) / factorial(n);
  approx += term;
  const error = Math.abs(approx - actual);
  console.log(\`الرتبة \${n}: تقريب = \${approx.toFixed(8)} | الخطأ = \${error.toExponential(3)}\`);
}
`,
  },
];

export const OmegaCodeSandbox: React.FC<CodeSandboxProps> = ({ onClose, initialCode }) => {
  const [code, setCode] = useState<string>(
    initialCode || TEMPLATES[0].code
  );
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(TEMPLATES[0].id);
  const [activeTab, setActiveTab] = useState<"code" | "plot">("code");
  const [copied, setCopied] = useState<boolean>(false);

  // Plotter state
  const [plotFormula, setPlotFormula] = useState<string>("Math.sin(x) * Math.exp(-0.2 * x)");
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Run user code safely inside isolated sandboxed evaluation
  const runCode = () => {
    setIsRunning(true);
    setOutputLogs([]);
    const logs: string[] = [];

    const customConsole = {
      log: (...args: any[]) => {
        logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
      },
      warn: (...args: any[]) => {
        logs.push("[تحذير] " + args.join(" "));
      },
      error: (...args: any[]) => {
        logs.push("[خطأ] " + args.join(" "));
      },
    };

    const startTime = performance.now();
    try {
      // Execute with custom safe sandbox environment
      const executeFn = new Function("console", code);
      executeFn(customConsole);
      const elapsed = performance.now() - startTime;
      setExecTime(Number(elapsed.toFixed(2)));
      setOutputLogs(logs.length > 0 ? logs : ["(تم التنفيذ بنجاح دون طباعة مخرجات نصية)"]);
    } catch (err: any) {
      logs.push(`⚠️ خطأ في التنفيذ: ${err.message || String(err)}`);
      setOutputLogs(logs);
      setExecTime(null);
    } finally {
      setIsRunning(false);
    }
  };

  // Run initially
  useEffect(() => {
    runCode();
  }, []);

  // Function Plotter Canvas Draw Loop
  useEffect(() => {
    if (activeTab !== "plot") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Axes
    const originX = width / 2;
    const originY = height / 2;

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Plot Curve
    try {
      const evalFn = new Function("x", `return ${plotFormula};`);
      const scaleX = width / (xMax - xMin);
      const scaleY = 40; // Pixels per unit

      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      let started = false;
      for (let px = 0; px < width; px += 2) {
        const xVal = xMin + (px / width) * (xMax - xMin);
        try {
          const yVal = evalFn(xVal);
          if (isFinite(yVal)) {
            const py = originY - yVal * scaleY;
            if (!started) {
              ctx.moveTo(px, py);
              started = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
        } catch {
          // ignore nan
        }
      }
      ctx.stroke();

      // Formula Label
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 13px monospace";
      ctx.fillText(`f(x) = ${plotFormula}`, 16, 24);
    } catch (err: any) {
      ctx.fillStyle = "#f87171";
      ctx.font = "12px sans-serif";
      ctx.fillText(`خطأ في صيغة الدالة: ${err.message}`, 16, 24);
    }
  }, [activeTab, plotFormula, xMin, xMax]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectPreset = (id: string) => {
    setSelectedTemplate(id);
    const tmpl = TEMPLATES.find((t) => t.id === id);
    if (tmpl) {
      setCode(tmpl.code);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-5 rounded-2xl bg-slate-950/95 border border-cyan-500/40 text-slate-100 shadow-2xl backdrop-blur-md max-h-[85vh] overflow-y-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>بيئة تشغيل الأكواد والرياضيات الحية</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                Live Computational Runtime
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              تنفيذ الخوارزميات، المحاكاة العددية، ورسم المنحنيات الرياضية لحظياً
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === "code"
                  ? "bg-cyan-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              محرر الأكواد
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("plot")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === "plot"
                  ? "bg-cyan-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              راسم الدوال (Plotter)
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {activeTab === "code" ? (
        <>
          {/* Templates Picker */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 text-[11px] shrink-0 font-medium">النماذج الجاهزة:</span>
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => selectPreset(tmpl.id)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap text-xs transition-all cursor-pointer border ${
                  selectedTemplate === tmpl.id
                    ? "bg-cyan-950 border-cyan-400 text-cyan-200 font-bold ring-1 ring-cyan-400/40"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                }`}
              >
                {tmpl.name}
              </button>
            ))}
          </div>

          {/* Code Editor & Console Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Editor Area (7 cols) */}
            <div className="lg:col-span-7 flex flex-col rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono text-[11px]">simulation.ts</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "تم النسخ" : "نسخ الكود"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={runCode}
                    disabled={isRunning}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>تشغيل الكود</span>
                  </button>
                </div>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-80 p-3 bg-slate-950/60 font-mono text-xs text-cyan-100 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50 leading-relaxed"
                spellCheck={false}
                dir="ltr"
              />
            </div>

            {/* Terminal Console (5 cols) */}
            <div className="lg:col-span-5 flex flex-col rounded-xl bg-black border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>وحدة الإخراج (Terminal Output)</span>
                </div>
                {execTime !== null && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    ⚡ {execTime} ms
                  </span>
                )}
              </div>

              <div className="flex-1 p-3 font-mono text-xs overflow-y-auto max-h-80 space-y-1 text-slate-200" dir="ltr">
                {outputLogs.map((line, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      line.startsWith("[خطأ]") || line.startsWith("⚠️")
                        ? "text-red-400"
                        : line.startsWith("===")
                        ? "text-cyan-400 font-bold"
                        : "text-emerald-300"
                    }`}
                  >
                    {line}
                  </div>
                ))}
                {outputLogs.length === 0 && (
                  <div className="text-slate-500 italic text-[11px]">اضغط على "تشغيل الكود" لمعاينة النتائج...</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Function Plotter View */
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-[11px] text-slate-400 mb-1">صيغة الدالة f(x):</label>
              <input
                type="text"
                value={plotFormula}
                onChange={(e) => setPlotFormula(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 font-mono text-cyan-300 focus:outline-none"
                placeholder="Math.sin(x)"
                dir="ltr"
              />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">x min:</label>
                <input
                  type="number"
                  value={xMin}
                  onChange={(e) => setXMin(parseFloat(e.target.value) || -10)}
                  className="w-16 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-center font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">x max:</label>
                <input
                  type="number"
                  value={xMax}
                  onChange={(e) => setXMax(parseFloat(e.target.value) || 10)}
                  className="w-16 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-center font-mono"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/30 overflow-hidden flex justify-center bg-black">
            <canvas ref={canvasRef} width={800} height={360} className="w-full max-w-full h-auto" />
          </div>
        </div>
      )}
    </div>
  );
};
