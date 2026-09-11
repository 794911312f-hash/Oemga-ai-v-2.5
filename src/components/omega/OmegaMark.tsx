import React from "react";

interface OmegaMarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  showGlow?: boolean;
  pulse?: boolean;
  className?: string;
}

export const OmegaMark: React.FC<OmegaMarkProps> = ({
  size = "md",
  showGlow = true,
  pulse = true,
  className = "",
}) => {
  const sizeMap = {
    sm: "w-7 h-7 text-sm",
    md: "w-10 h-10 text-xl",
    lg: "w-14 h-14 text-2xl",
    xl: "w-20 h-20 text-4xl",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-900/80 via-slate-900 to-indigo-950 border border-purple-500/40 select-none ${
        sizeMap[size]
      } ${showGlow ? "omega-glow" : ""} ${className}`}
    >
      {pulse && (
        <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 opacity-20 blur-sm animate-pulse" />
      )}
      <span className="relative font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-tr from-purple-300 via-white to-cyan-300 font-mono">
        Ω
      </span>
      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-950" />
    </div>
  );
};
