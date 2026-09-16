import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Activity,
  Globe,
  Wind,
  Weight,
  ArrowDown,
  Sparkles,
  Download,
  Share2,
  FileText,
  CheckCircle2,
  HelpCircle,
  BarChart2,
  Atom,
  Sun,
  Layers,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { speakWithOmega } from "../../lib/omega/speech";

interface SimulationPoint {
  t: number;
  height: number;
  velocity: number;
  acceleration: number;
  dragForce: number;
}

const PLANETS = [
  { name: "الأرض (Earth)", g: 9.81, emoji: "🌍", desc: "الجاذبية القياسية المعيارية" },
  { name: "القمر (Moon)", g: 1.62, emoji: "🌑", desc: "جاذبية منخفضة (سدس الأرض)" },
  { name: "المريخ (Mars)", g: 3.72, emoji: "🔴", desc: "جاذبية الكوكب الأحمر" },
  { name: "المشتري (Jupiter)", g: 24.79, emoji: "🪐", desc: "جاذبية عملاقة فائقة" },
  { name: "الفراغ الخالص (Vacuum Space)", g: 0.0, emoji: "🌌", desc: "انعدام تام للوزن" },
];

export const InteractivePhysicsLab: React.FC = () => {
  // Active science discipline tab
  const [activeDiscipline, setActiveDiscipline] = useState<"kinematics" | "optics" | "orbits" | "quantum">("kinematics");

  // ========================================================
  // 1. KINEMATICS & GRAVITY STATE
  // ========================================================
  const [selectedPlanetIndex, setSelectedPlanetIndex] = useState<number>(0);
  const [initialHeight, setInitialHeight] = useState<number>(50); // meters
  const [mass, setMass] = useState<number>(2.0); // kg
  const [dragCoeff, setDragCoeff] = useState<number>(0.0); // 0 = pure vacuum
  const [initialVelocity, setInitialVelocity] = useState<number>(0); // m/s
  const [compareObjects, setCompareObjects] = useState<boolean>(true); // Apple vs Feather
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simTime, setSimTime] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const currentG = PLANETS[selectedPlanetIndex].g;

  // Terminal velocity
  const terminalVelocity = useMemo(() => {
    if (dragCoeff <= 0.001 || currentG <= 0) return null;
    return Math.sqrt((mass * currentG) / dragCoeff);
  }, [mass, currentG, dragCoeff]);

  // Trajectory curve
  const chartData = useMemo(() => {
    const points: Array<{ t: number; height: number; velocity: number; featherH?: number }> = [];
    const dt = 0.05;
    let t = 0;
    let y = initialHeight;
    let v = initialVelocity;
    let yFeather = initialHeight;
    let vFeather = initialVelocity;
    const featherMass = 0.005;
    const featherDrag = dragCoeff > 0 ? 0.35 : 0;

    while (y > 0 && t < 12) {
      points.push({
        t: Number(t.toFixed(2)),
        height: Math.max(0, Number(y.toFixed(2))),
        velocity: Number(v.toFixed(2)),
        featherH: Math.max(0, Number(yFeather.toFixed(2))),
      });

      const drag = dragCoeff * v * v;
      const acc = currentG - (drag / mass);
      v += acc * dt;
      y -= v * dt;

      if (yFeather > 0) {
        const dragF = featherDrag * vFeather * vFeather;
        const accF = currentG - (dragF / featherMass);
        vFeather += accF * dt;
        yFeather -= vFeather * dt;
      }

      t += dt;
    }

    if (points.length > 0) {
      points.push({
        t: Number(t.toFixed(2)),
        height: 0,
        velocity: Number(v.toFixed(2)),
        featherH: 0,
      });
    }

    return points;
  }, [initialHeight, initialVelocity, currentG, mass, dragCoeff]);

  // Kinematics Loop
  useEffect(() => {
    if (!isRunning || activeDiscipline !== "kinematics") {
      lastTimestampRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      setSimTime((prevTime) => {
        const nextTime = prevTime + delta * 1.0;
        const maxTime = chartData.length > 0 ? chartData[chartData.length - 1].t : 5;
        if (nextTime >= maxTime) {
          setIsRunning(false);
          return maxTime;
        }
        return nextTime;
      });

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, chartData, activeDiscipline]);

  const currentStatus = useMemo(() => {
    if (chartData.length === 0) return { h: initialHeight, v: 0, hFeather: initialHeight };
    const exact = chartData.find((p) => p.t >= simTime) || chartData[chartData.length - 1];
    return {
      h: exact.height,
      v: exact.velocity,
      hFeather: exact.featherH ?? 0,
    };
  }, [chartData, simTime, initialHeight]);

  // ========================================================
  // 2. OPTICS & REFRACTION STATE (Snell's Law)
  // ========================================================
  const [n1, setN1] = useState<number>(1.0); // Air
  const [n2, setN2] = useState<number>(1.5); // Glass
  const [theta1Deg, setTheta1Deg] = useState<number>(45); // Incident angle in degrees
  const opticsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const opticsResults = useMemo(() => {
    const theta1Rad = (theta1Deg * Math.PI) / 180;
    const sinTheta2 = (n1 / n2) * Math.sin(theta1Rad);
    const isTotalInternalReflection = sinTheta2 > 1.0;
    const theta2Rad = isTotalInternalReflection ? null : Math.asin(sinTheta2);
    const theta2Deg = theta2Rad !== null ? (theta2Rad * 180) / Math.PI : null;
    const criticalAngleDeg = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;

    return {
      isTIR: isTotalInternalReflection,
      theta2Deg,
      criticalAngleDeg,
    };
  }, [n1, n2, theta1Deg]);

  // Optics Canvas Drawing
  useEffect(() => {
    if (activeDiscipline !== "optics") return;
    const canvas = opticsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Backgrounds: Medium 1 top, Medium 2 bottom
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h / 2);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, h / 2, w, h / 2);

    // Interface boundary line
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Normal line (dashed)
    ctx.strokeStyle = "#64748b";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    const centerX = w / 2;
    const centerY = h / 2;
    const rayLength = 140;
    const t1Rad = (theta1Deg * Math.PI) / 180;

    // Incident Ray
    const incidentStartX = centerX - Math.sin(t1Rad) * rayLength;
    const incidentStartY = centerY - Math.cos(t1Rad) * rayLength;

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(incidentStartX, incidentStartY);
    ctx.lineTo(centerX, centerY);
    ctx.stroke();

    if (opticsResults.isTIR) {
      // Total Internal Reflection Ray
      const reflectedEndX = centerX + Math.sin(t1Rad) * rayLength;
      const reflectedEndY = centerY - Math.cos(t1Rad) * rayLength;
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(reflectedEndX, reflectedEndY);
      ctx.stroke();
    } else if (opticsResults.theta2Deg !== null) {
      // Refracted Ray
      const t2Rad = (opticsResults.theta2Deg * Math.PI) / 180;
      const refractedEndX = centerX + Math.sin(t2Rad) * rayLength;
      const refractedEndY = centerY + Math.cos(t2Rad) * rayLength;
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(refractedEndX, refractedEndY);
      ctx.stroke();
    }
  }, [activeDiscipline, n1, n2, theta1Deg, opticsResults]);

  // ========================================================
  // 3. PLANETARY ORBITS STATE (Kepler's Laws)
  // ========================================================
  const [starMass, setStarMass] = useState<number>(1.0); // Solar masses
  const [semiMajorAxis, setSemiMajorAxis] = useState<number>(1.0); // AU
  const [eccentricity, setEccentricity] = useState<number>(0.3); // 0 to 0.85
  const orbitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const orbitAngleRef = useRef<number>(0);

  const keplerPeriodYears = useMemo(() => {
    return Math.sqrt(Math.pow(semiMajorAxis, 3) / starMass);
  }, [semiMajorAxis, starMass]);

  useEffect(() => {
    if (activeDiscipline !== "orbits") return;
    let animId: number;

    const renderOrbit = () => {
      const canvas = orbitCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Space background with stars
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;
      const scale = 80; // pixels per AU

      const a = semiMajorAxis * scale;
      const b = a * Math.sqrt(1 - eccentricity * eccentricity);
      const c = a * eccentricity; // Focus offset

      // Draw Sun at focus F1 (c, 0)
      const sunX = centerX - c;
      const sunY = centerY;

      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(sunX, sunY, 14 * Math.sqrt(starMass), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw Orbit Ellipse
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, a, b, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Update angle
      orbitAngleRef.current += 0.02 / keplerPeriodYears;
      const ang = orbitAngleRef.current;

      const px = centerX + a * Math.cos(ang);
      const py = centerY + b * Math.sin(ang);

      // Velocity vector arrow
      const vx = -a * Math.sin(ang);
      const vy = b * Math.cos(ang);
      const vLen = Math.sqrt(vx * vx + vy * vy);

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + (vx / vLen) * 35, py + (vy / vLen) * 35);
      ctx.stroke();

      // Planet
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(renderOrbit);
    };

    animId = requestAnimationFrame(renderOrbit);
    return () => cancelAnimationFrame(animId);
  }, [activeDiscipline, semiMajorAxis, eccentricity, starMass, keplerPeriodYears]);

  // ========================================================
  // 4. QUANTUM BOHR ATOM STATE
  // ========================================================
  const [ni, setNi] = useState<number>(3); // Initial shell (e.g. 3)
  const [nf, setNf] = useState<number>(2); // Final shell (e.g. 2: Balmer visible series)
  const bohrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const quantumTransition = useMemo(() => {
    const Ei = -13.6 / (ni * ni);
    const Ef = -13.6 / (nf * nf);
    const deltaE = Math.abs(Ei - Ef); // in eV
    // lambda (nm) = 1240 / deltaE (approx for hc in eV·nm)
    const lambdaNm = deltaE > 0 ? 1239.84 / deltaE : 0;

    let seriesName = "أخرى";
    let spectralColor = "#ffffff";

    if (nf === 1) {
      seriesName = "سلسلة لايمان (فوق بنفسجي Lyman)";
      spectralColor = "#a855f7";
    } else if (nf === 2) {
      seriesName = "سلسلة بالمر (الضوء المرئي Balmer)";
      if (lambdaNm < 420) spectralColor = "#8b5cf6";
      else if (lambdaNm < 460) spectralColor = "#3b82f6";
      else if (lambdaNm < 520) spectralColor = "#06b6d4";
      else if (lambdaNm < 590) spectralColor = "#22c55e";
      else if (lambdaNm < 620) spectralColor = "#eab308";
      else spectralColor = "#ef4444";
    } else if (nf === 3) {
      seriesName = "سلسلة باشن (تحت الأحمر Paschen)";
      spectralColor = "#f97316";
    }

    return {
      deltaE: Number(deltaE.toFixed(3)),
      lambdaNm: Number(lambdaNm.toFixed(1)),
      seriesName,
      spectralColor,
    };
  }, [ni, nf]);

  useEffect(() => {
    if (activeDiscipline !== "quantum") return;
    const canvas = bohrCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Concentric Bohr shells n=1 to n=5
    for (let n = 1; n <= 5; n++) {
      const r = 24 + n * 24;
      ctx.strokeStyle = n === ni ? "#f59e0b" : n === nf ? "#10b981" : "#334155";
      ctx.lineWidth = n === ni || n === nf ? 2 : 1;
      ctx.setLineDash(n === ni || n === nf ? [] : [3, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "10px monospace";
      ctx.fillText(`n=${n}`, cx + r + 4, cy);
    }
    ctx.setLineDash([]);

    // Proton Nucleus
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("+", cx - 3, cy + 3);

    // Emitted Photon Wave Vector
    ctx.strokeStyle = quantumTransition.spectralColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 24 - nf * 24);
    ctx.lineTo(cx + 90, cy - 24 - nf * 24 - 40);
    ctx.stroke();

    ctx.fillStyle = quantumTransition.spectralColor;
    ctx.font = "bold 11px monospace";
    ctx.fillText(`λ = ${quantumTransition.lambdaNm} nm`, cx + 95, cy - 24 - nf * 24 - 35);
  }, [activeDiscipline, ni, nf, quantumTransition]);

  const handleReset = () => {
    setIsRunning(false);
    setSimTime(0);
    lastTimestampRef.current = null;
  };

  const handleTogglePlay = () => {
    if (simTime >= (chartData[chartData.length - 1]?.t || 5)) {
      setSimTime(0);
    }
    setIsRunning((prev) => !prev);
  };

  const explainCurrentSetup = () => {
    let msg = "";
    if (activeDiscipline === "kinematics") {
      if (dragCoeff === 0) {
        msg = `في تجربة السقوط الحر بالفراغ الخالص، يتطابق تسارع كافة الأجسام a = ${currentG} م/ث² بغض النظر عن الكتلة!`;
      } else {
        msg = `مع مقاومة الهواء (k = ${dragCoeff})، تصل الأجسام الخفيفة للسرعة الحدية V_lim أسرع من الأجسام الثقيلة!`;
      }
    } else if (activeDiscipline === "optics") {
      msg = `قانون سنيل للانكسار n1 sin(θ1) = n2 sin(θ2).. عندما ينتقل الضوء من وسط أكثف لوسط أقل كثافة ويتجاوز الزاوية الحرجة، يحدث انعكاس كلي داخلي!`;
    } else if (activeDiscipline === "orbits") {
      msg = `قوانين كبلر الثلاثة: مدارات الكواكب إهليلجية، ويمسح شعاع المدار مساحات متساوية في أزمنة متساوية، ومربع الدور المداري يتناسب مع مكعب نصف المحور الأكبر!`;
    } else {
      msg = `نموذج بور لذرة الهيدروجين يثبت تكميم مستويات الطاقة.. عند هبوط الإلكترون من المدار ${ni} إلى ${nf} ينبعث فوتون بطول موجي ${quantumTransition.lambdaNm} نانومتر!`;
    }
    speakWithOmega(msg, {
      personaId: "professor-omega",
      rateMultiplier: 0.92,
    });
  };

  const handleExportCard = () => {
    const planet = PLANETS[selectedPlanetIndex];
    const reportHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>بطاقة مختبر أوميغا الفيزيائي المتقدم</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 32px; line-height: 1.6; }
          .card { max-width: 800px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #06b6d4; padding: 28px; }
          h1 { color: #38bdf8; border-bottom: 2px solid #06b6d4; padding-bottom: 12px; }
          .badge { background: #0891b2; color: #fff; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 13px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
          .item { background: #0f172a; padding: 14px; border-radius: 10px; border: 1px solid #334155; }
          .equation-box { background: #0284c7; color: white; padding: 16px; border-radius: 10px; text-align: center; font-size: 18px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">مختبر العلوم المتكامل • نظام أوميغا</span>
          <h1>بطاقة التجربة العلمية: ${activeDiscipline === "kinematics" ? "الميكانيكا والجاذبية" : activeDiscipline === "optics" ? "البصريات والانكسار" : activeDiscipline === "orbits" ? "المدارات وقوانين كبلر" : "نموذج بور الذري"}</h1>
          <div class="equation-box">
            ${activeDiscipline === "kinematics" ? "∑F = m·a ⟹ a = g - (k/m)v²" : activeDiscipline === "optics" ? "n₁·sin(θ₁) = n₂·sin(θ₂)" : activeDiscipline === "orbits" ? "T² = (4π² / GM) · a³" : "ΔE = 13.6 · (1/n_f² - 1/n_i²) eV ⟹ λ = hc/ΔE"}
          </div>
          <p>تم إعداد وتوليد هذه البطاقة عبر محاكي أوميغا التفاعلي.</p>
          <button onclick="window.print()" style="background:#06b6d4;color:black;border:none;padding:10px 20px;border-radius:8px;font-weight:bold;cursor:pointer;">طباعة PDF</button>
        </div>
      </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(reportHtml);
      win.document.close();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-slate-100 shadow-2xl backdrop-blur-md" dir="rtl">
      {/* Header with Discipline Selector */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
            <Atom className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>مختبر أوميغا للعلوم الفيزيائية المتقدمة</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-900/50 text-cyan-300 border border-cyan-500/30">
                Multi-Lab Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              الميكانيكا، البصريات وانكسار الضوء، الجاذبية والمدارات الكوكبية، ونموذج بور الذري
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Discipline Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveDiscipline("kinematics")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeDiscipline === "kinematics"
                  ? "bg-cyan-600 text-white font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🚀 الميكانيكا
            </button>
            <button
              type="button"
              onClick={() => setActiveDiscipline("optics")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeDiscipline === "optics"
                  ? "bg-cyan-600 text-white font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🌈 البصريات
            </button>
            <button
              type="button"
              onClick={() => setActiveDiscipline("orbits")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeDiscipline === "orbits"
                  ? "bg-cyan-600 text-white font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🪐 المدارات
            </button>
            <button
              type="button"
              onClick={() => setActiveDiscipline("quantum")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeDiscipline === "quantum"
                  ? "bg-cyan-600 text-white font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ⚛️ بور الذري
            </button>
          </div>

          <button
            type="button"
            onClick={explainCurrentSetup}
            className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="استمع لتحليل البروفيسور لهذه التجربة"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>شرح البروفيسور</span>
          </button>

          <button
            type="button"
            onClick={handleExportCard}
            className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="تصدير بطاقة الدرس والملخص"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير البطاقة</span>
          </button>
        </div>
      </div>

      {/* DISCIPLINE 1: KINEMATICS & GRAVITY */}
      {activeDiscipline === "kinematics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 flex flex-col rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-2 mb-2 font-mono">
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <span>{PLANETS[selectedPlanetIndex].emoji}</span>
                <span>{PLANETS[selectedPlanetIndex].name}</span>
              </span>
              <span>g = {currentG} m/s²</span>
            </div>

            <div className="relative w-full h-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-lg border border-slate-800/80 overflow-hidden flex justify-around items-end pb-3">
              <div className="absolute top-2 left-2 flex flex-col justify-between h-[85%] text-[10px] text-slate-500 font-mono border-l border-slate-800 pl-1">
                <span>{initialHeight}m</span>
                <span>{Math.round(initialHeight * 0.75)}m</span>
                <span>{Math.round(initialHeight * 0.5)}m</span>
                <span>{Math.round(initialHeight * 0.25)}m</span>
                <span>0m</span>
              </div>

              <div className="flex flex-col items-center z-10 w-20">
                <div
                  className="transition-transform duration-75 flex flex-col items-center"
                  style={{
                    transform: `translateY(-${Math.max(
                      0,
                      (currentStatus.h / (initialHeight || 1)) * 180
                    )}px)`,
                  }}
                >
                  <div className="w-9 h-9 rounded-full bg-red-600 shadow-lg shadow-red-600/40 border-2 border-red-300 flex items-center justify-center text-sm font-bold text-white relative">
                    🍎
                    {currentStatus.v > 0.5 && (
                      <div
                        className="absolute top-full w-0.5 bg-cyan-400 flex flex-col items-center"
                        style={{ height: `${Math.min(40, currentStatus.v * 1.5)}px` }}
                      >
                        <ArrowDown className="w-3 h-3 text-cyan-400 -mt-1" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-300 font-mono mt-1 font-bold">
                    {mass}kg
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 border-t border-slate-800 pt-0.5">التفاحة</span>
              </div>

              {compareObjects && (
                <div className="flex flex-col items-center z-10 w-20">
                  <div
                    className="transition-transform duration-75 flex flex-col items-center"
                    style={{
                      transform: `translateY(-${Math.max(
                        0,
                        (currentStatus.hFeather / (initialHeight || 1)) * 180
                      )}px)`,
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500/30 border border-amber-400 flex items-center justify-center text-sm shadow-md text-amber-200">
                      🪶
                    </div>
                    <span className="text-[10px] text-amber-300 font-mono mt-1">
                      5g
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 border-t border-slate-800 pt-0.5">الريشة</span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-950 via-slate-800 to-emerald-950 border-t border-emerald-500/30 flex items-center justify-center">
                <span className="text-[9px] text-emerald-400 font-mono tracking-wider">الأرض • y = 0</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mt-3 text-center text-xs">
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">الزمن (t)</span>
                <span className="font-mono font-bold text-cyan-400">{simTime.toFixed(2)} s</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">الارتفاع (y)</span>
                <span className="font-mono font-bold text-white">{currentStatus.h.toFixed(1)} m</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">السرعة (v)</span>
                <span className="font-mono font-bold text-emerald-400">{currentStatus.v.toFixed(1)} m/s</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-slate-900">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? "إيقاف مؤقت" : "بدء السقوط"}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="إعادة ضبط التجربة"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  <span>المنحنيات الحركية اللحظية (Kinematics Curves):</span>
                </span>
                {terminalVelocity && (
                  <span className="text-[11px] text-amber-400 font-mono">
                    السرعة الحدية V_lim = {terminalVelocity.toFixed(1)} m/s
                  </span>
                )}
              </div>

              <div className="h-44 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="t" stroke="#94a3b8" fontSize={10} unit="s" />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#06b6d4", fontSize: "11px" }}
                      formatter={(val: any, name: any) => [
                        `${Number(val).toFixed(2)}`,
                        name === "height" ? "ارتفاع التفاحة (م)" : name === "velocity" ? "السرعة (م/ث)" : "ارتفاع الريشة (م)",
                      ]}
                      labelFormatter={(t) => `الزمن: ${t} ثانية`}
                    />
                    <ReferenceLine x={Number(simTime.toFixed(2))} stroke="#06b6d4" strokeWidth={2} label="t" />
                    <Line type="monotone" dataKey="height" stroke="#ef4444" strokeWidth={2.5} dot={false} name="height" />
                    <Line type="monotone" dataKey="velocity" stroke="#10b981" strokeWidth={2} dot={false} name="velocity" />
                    {compareObjects && (
                      <Line type="monotone" dataKey="featherH" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="featherH" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-3 h-0.5 bg-red-500 inline-block" /> الارتفاع y(t)
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-3 h-0.5 bg-emerald-500 inline-block" /> السرعة v(t)
                </span>
                {compareObjects && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-3 h-0.5 bg-amber-500 border-dashed inline-block" /> مسار الريشة في الهواء
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  الجرم السماوي:
                </span>
                <select
                  value={selectedPlanetIndex}
                  onChange={(e) => {
                    setSelectedPlanetIndex(Number(e.target.value));
                    handleReset();
                  }}
                  className="w-full text-xs p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 cursor-pointer"
                >
                  {PLANETS.map((p, idx) => (
                    <option key={p.name} value={idx}>
                      {p.emoji} {p.name} ({p.g} m/s²)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>الارتفاع الابتدائي:</span>
                  <span className="text-cyan-400 font-mono">{initialHeight} م</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={150}
                  step={5}
                  value={initialHeight}
                  onChange={(e) => {
                    setInitialHeight(Number(e.target.value));
                    handleReset();
                  }}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>كتلة الجسم (m):</span>
                  <span className="text-cyan-400 font-mono">{mass} كغ</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={20}
                  step={0.2}
                  value={mass}
                  onChange={(e) => {
                    setMass(Number(e.target.value));
                    handleReset();
                  }}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>مقاومة الهواء (k):</span>
                  <span className={`font-mono ${dragCoeff === 0 ? "text-emerald-400 font-bold" : "text-amber-400"}`}>
                    {dragCoeff === 0 ? "فراغ (0)" : dragCoeff}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.3}
                  step={0.02}
                  value={dragCoeff}
                  onChange={(e) => {
                    setDragCoeff(Number(e.target.value));
                    handleReset();
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISCIPLINE 2: OPTICS & REFRACTION */}
      {activeDiscipline === "optics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 flex flex-col rounded-xl bg-slate-950 border border-slate-800 p-3 overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-2 mb-2 font-mono">
              <span className="text-cyan-300 font-bold">مسار الأشعة الضوئية (Ray Tracing)</span>
              <span>n₁·sin(θ₁) = n₂·sin(θ₂)</span>
            </div>
            <div className="flex justify-center bg-black rounded-lg overflow-hidden border border-slate-900">
              <canvas ref={opticsCanvasRef} width={500} height={300} className="w-full max-w-full h-auto" />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-1">
              <span className="text-red-400">🔴 الشعاع الساقط (θ₁ = {theta1Deg}°)</span>
              {opticsResults.isTIR ? (
                <span className="text-amber-400 font-bold">⚠️ انعكاس كلي داخلي (TIR)</span>
              ) : (
                <span className="text-emerald-400">🟢 الشعاع المنكسر (θ₂ = {opticsResults.theta2Deg?.toFixed(1)}°)</span>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="font-bold text-xs text-white">إعدادات الوسطين وزاوية السقوط:</div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>معامل انكسار الوسط الأول (n₁):</span>
                  <span className="text-cyan-400 font-mono">{n1}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.05"
                  value={n1}
                  onChange={(e) => setN1(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>هواء (1.0)</span>
                  <span>ماء (1.33)</span>
                  <span>زجاج (1.5)</span>
                  <span>ألماس (2.42)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>معامل انكسار الوسط الثاني (n₂):</span>
                  <span className="text-cyan-400 font-mono">{n2}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.05"
                  value={n2}
                  onChange={(e) => setN2(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>زاوية السقوط (θ₁):</span>
                  <span className="text-amber-400 font-mono font-bold">{theta1Deg}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="89"
                  step="1"
                  value={theta1Deg}
                  onChange={(e) => setTheta1Deg(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">الزاوية الحرجة (θ_c):</span>
                  <span className="font-mono text-cyan-300">
                    {opticsResults.criticalAngleDeg ? `${opticsResults.criticalAngleDeg.toFixed(1)}°` : "لا توجد (n₁ ≤ n₂)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الحالة الفيزيائية:</span>
                  <span className="font-bold text-emerald-400">
                    {opticsResults.isTIR ? "انعكاس كلي داخلي" : "انكسار معتاد"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISCIPLINE 3: PLANETARY ORBITS */}
      {activeDiscipline === "orbits" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 flex flex-col rounded-xl bg-slate-950 border border-slate-800 p-3 overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-2 mb-2 font-mono">
              <span className="text-cyan-300 font-bold">محاكاة المدار الإهليلجي (قوانين كبلر)</span>
              <span>T² = a³ / M</span>
            </div>
            <div className="flex justify-center bg-black rounded-lg overflow-hidden border border-slate-900">
              <canvas ref={orbitCanvasRef} width={500} height={300} className="w-full max-w-full h-auto" />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-1">
              <span className="text-amber-400">☀️ النجم المركزي في البؤرة الأولى</span>
              <span className="text-emerald-400">🟢 متجه السرعة المماسية المدارية</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="font-bold text-xs text-white">متغيرات المدار الإهليلجي:</div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>كتلة النجم المركزي (M/M☉):</span>
                  <span className="text-amber-400 font-mono">{starMass} شمسية</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={starMass}
                  onChange={(e) => setStarMass(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>نصف المحور الأكبر (a):</span>
                  <span className="text-cyan-400 font-mono">{semiMajorAxis} AU (وحدة فلكية)</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.1"
                  value={semiMajorAxis}
                  onChange={(e) => setSemiMajorAxis(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>اللاتمركز المداري (Eccentricity e):</span>
                  <span className="text-purple-400 font-mono">{eccentricity}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={eccentricity}
                  onChange={(e) => setEccentricity(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">الدور المداري للكوكب (T):</span>
                  <span className="font-mono text-cyan-300 font-bold">{keplerPeriodYears.toFixed(2)} سنة أرضية</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">مسافة الحضيض (Perihelion):</span>
                  <span className="font-mono text-emerald-400 font-bold">{(semiMajorAxis * (1 - eccentricity)).toFixed(2)} AU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">مسافة الأوج (Aphelion):</span>
                  <span className="font-mono text-amber-400 font-bold">{(semiMajorAxis * (1 + eccentricity)).toFixed(2)} AU</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISCIPLINE 4: QUANTUM BOHR ATOM */}
      {activeDiscipline === "quantum" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 flex flex-col rounded-xl bg-slate-950 border border-slate-800 p-3 overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-2 mb-2 font-mono">
              <span className="text-cyan-300 font-bold">المدارات الكمومية لذرة الهيدروجين</span>
              <span>E_n = -13.6 / n² eV</span>
            </div>
            <div className="flex justify-center bg-black rounded-lg overflow-hidden border border-slate-900">
              <canvas ref={bohrCanvasRef} width={500} height={300} className="w-full max-w-full h-auto" />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-1">
              <span className="text-amber-400">المدار الابتدائي: n = {ni}</span>
              <span className="text-emerald-400">المدار النهائي: n = {nf}</span>
              <span className="font-bold" style={{ color: quantumTransition.spectralColor }}>
                {quantumTransition.seriesName}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="font-bold text-xs text-white">انتقال الإلكترون بين المدارات:</div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>المدار الابتدائي (Initial n_i):</span>
                  <span className="text-amber-400 font-mono font-bold">n = {ni}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNi(n)}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        ni === n
                          ? "bg-amber-500 text-black font-bold"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      n={n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>المدار النهائي (Final n_f):</span>
                  <span className="text-emerald-400 font-mono font-bold">n = {nf}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNf(n)}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        nf === n
                          ? "bg-emerald-500 text-black font-bold"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      n={n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">طاقة الفوتون المنبعث (ΔE):</span>
                  <span className="font-mono text-cyan-300 font-bold">{quantumTransition.deltaE} eV</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الطول الموجي للفوتون (λ):</span>
                  <span className="font-mono text-amber-300 font-bold">{quantumTransition.lambdaNm} نانومتر</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">لون الطيف المنبعث:</span>
                  <div
                    className="w-5 h-5 rounded-full border border-white/40 shadow"
                    style={{ backgroundColor: quantumTransition.spectralColor }}
                  />
                  <span className="text-[11px] font-mono text-slate-300">{quantumTransition.spectralColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
