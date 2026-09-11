import React from "react";
import { OMEGA_MODELS, type ModelId } from "../../lib/omega/models";
import { ShieldCheck, Cpu } from "lucide-react";

interface ModelBarProps {
  activeModels?: ModelId[];
  onToggleModel?: (id: ModelId) => void;
  className?: string;
}

export const ModelBar: React.FC<ModelBarProps> = ({
  activeModels = [
    "qwen-2-5-compat",
    "llama-3-3-compat",
    "gemini-3.8-flash",
    "deepseek-r1-compat",
    "claude-3-5-sonnet-compat",
  ],
  onToggleModel,
  className = "",
}) => {
  const modelEntries = Object.values(OMEGA_MODELS);

  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto py-2 px-1 no-scrollbar text-xs ${className}`}
    >
      <div className="flex items-center gap-1 text-slate-400 font-semibold shrink-0 pl-1">
        <Cpu className="w-3.5 h-3.5 text-purple-400" />
        <span>حوض النماذج (Ensemble Pool):</span>
      </div>

      {modelEntries.map((spec) => {
        const isActive = activeModels.includes(spec.id);
        return (
          <button
            key={spec.id}
            type="button"
            onClick={() => onToggleModel?.(spec.id)}
            title={spec.description}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shrink-0 transition-all cursor-pointer ${
              isActive
                ? "bg-slate-800/90 border-purple-500/50 text-slate-200 shadow-sm"
                : "bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 opacity-60"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: spec.accentHex }}
            />
            <span className="font-medium text-[11px] whitespace-nowrap">
              {spec.name.split(" ")[0]} {spec.name.split(" ")[1] || ""}
            </span>
            {isActive && (
              <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};
