import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, AreaChart as AreaChartIcon, Copy, Check } from "lucide-react";

export interface ChartSeries {
  key: string;
  name: string;
  color?: string;
}

export interface OmegaChartConfig {
  type?: "bar" | "line" | "area" | "pie" | "radar";
  title?: string;
  subtitle?: string;
  xAxisKey?: string;
  data: Record<string, any>[];
  series?: ChartSeries[];
}

interface OmegaChartProps {
  config: OmegaChartConfig;
}

const PALETTE = [
  "#a855f7", // purple-500
  "#06b6d4", // cyan-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
];

export const OmegaChart: React.FC<OmegaChartProps> = ({ config }) => {
  const [activeType, setActiveType] = useState<"bar" | "line" | "area" | "pie" | "radar">(
    config.type || "bar"
  );
  const [copied, setCopied] = useState(false);

  if (!config.data || !Array.isArray(config.data) || config.data.length === 0) {
    return null;
  }

  const xAxisKey = config.xAxisKey || Object.keys(config.data[0])[0] || "name";

  // Derive series if not provided
  const series: ChartSeries[] =
    config.series && config.series.length > 0
      ? config.series
      : Object.keys(config.data[0])
          .filter((k) => k !== xAxisKey && typeof config.data[0][k] === "number")
          .map((k, i) => ({
            key: k,
            name: k,
            color: PALETTE[i % PALETTE.length],
          }));

  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-4 rounded-2xl border border-slate-800/90 bg-slate-950/90 shadow-xl overflow-hidden" dir="rtl">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800/80 bg-slate-900/60">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span>{config.title || "مخطط بياني تحليلي (Omega Chart)"}</span>
          </h4>
          {config.subtitle && (
            <p className="text-[11px] text-slate-400 mt-0.5">{config.subtitle}</p>
          )}
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1.5" dir="ltr">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setActiveType("bar")}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeType === "bar" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="أعمدة (Bar)"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveType("line")}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeType === "line" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="خطي (Line)"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveType("area")}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeType === "area" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="مساحي (Area)"
            >
              <AreaChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveType("pie")}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeType === "pie" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="دائري (Pie)"
            >
              <PieChartIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyData}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title="نسخ بيانات المخطط (JSON)"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? "تم النسخ" : "نسخ البيانات"}</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="p-4 w-full h-72 sm:h-80" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          {activeType === "bar" ? (
            <BarChart data={config.data} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              {series.map((s, idx) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name || s.key}
                  fill={s.color || PALETTE[idx % PALETTE.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : activeType === "line" ? (
            <LineChart data={config.data} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              {series.map((s, idx) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name || s.key}
                  stroke={s.color || PALETTE[idx % PALETTE.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: s.color || PALETTE[idx % PALETTE.length] }}
                />
              ))}
            </LineChart>
          ) : activeType === "area" ? (
            <AreaChart data={config.data} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              {series.map((s, idx) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name || s.key}
                  stroke={s.color || PALETTE[idx % PALETTE.length]}
                  fill={s.color || PALETTE[idx % PALETTE.length]}
                  fillOpacity={0.25}
                />
              ))}
            </AreaChart>
          ) : activeType === "pie" ? (
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Pie
                data={config.data}
                dataKey={series[0]?.key || Object.keys(config.data[0])[1] || "value"}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={35}
                paddingAngle={4}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {config.data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <RadarChart cx="50%" cy="50%" outerRadius={90} data={config.data}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey={xAxisKey} stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <PolarRadiusAxis stroke="#475569" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {series.map((s, idx) => (
                <Radar
                  key={s.key}
                  name={s.name || s.key}
                  dataKey={s.key}
                  stroke={s.color || PALETTE[idx % PALETTE.length]}
                  fill={s.color || PALETTE[idx % PALETTE.length]}
                  fillOpacity={0.3}
                />
              ))}
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
