import React, { useState } from "react";
import {
  MessageSquare,
  Brain,
  Database,
  GitBranch,
  Sliders,
  ShieldCheck,
  Zap,
  Terminal,
} from "lucide-react";
import { OmegaMark } from "./OmegaMark";
import { ModelBar } from "./ModelBar";
import { ChatView } from "./ChatView";
import { KernelLab } from "./KernelLab";
import { MemoryView } from "./MemoryView";
import { LineageView } from "./LineageView";
import { OptimizerLab } from "./OptimizerLab";
import { DEFAULT_OMEGA_CONFIG, type OmegaConfig } from "../../lib/omega/optimizer";
import type { FusionResult } from "../../lib/omega/fusion";

export type NavTab = "chat" | "kernel" | "memory" | "lineage" | "optimizer";

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("chat");
  const [config, setConfig] = useState<OmegaConfig>(DEFAULT_OMEGA_CONFIG);
  const [inspectedResult, setInspectedResult] = useState<FusionResult | null>(null);

  const handleOpenKernelWithResult = (result: FusionResult) => {
    setInspectedResult(result);
    setActiveTab("kernel");
  };

  const navItems = [
    {
      id: "chat" as NavTab,
      label: "محادثة الإجماع التوافقي",
      subLabel: "Fusion Chat",
      icon: MessageSquare,
    },
    {
      id: "kernel" as NavTab,
      label: "مختبر نواة الحالة",
      subLabel: "Kernel Lab",
      icon: Brain,
    },
    {
      id: "memory" as NavTab,
      label: "الذاكرة المعرفية",
      subLabel: "Memory Bank",
      icon: Database,
    },
    {
      id: "lineage" as NavTab,
      label: "شجرة النسب التطوري",
      subLabel: "Lineage Graph",
      icon: GitBranch,
    },
    {
      id: "optimizer" as NavTab,
      label: "المعايرة والقياس",
      subLabel: "Optimizer",
      icon: Sliders,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100 selection:bg-purple-500 selection:text-white" dir="rtl">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <OmegaMark size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                    نظام أوميغا للذكاء الاصطناعي
                  </h1>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-bold">
                    V2.5 Consensus
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  محرك الاندماج الدلالي متعدد النماذج • التدقيق الذاتي وحساب الإجماع الهندسي
                </p>
              </div>
            </div>

            {/* System Status Indicators */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden md:inline">النواة متصلة</span>
                <span className="text-slate-500">|</span>
                <span className="text-cyan-400">Ψ Engine Ready</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation Row */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-900 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-purple-950/80 border border-purple-500/50 text-purple-200 shadow-sm shadow-purple-950/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Model Bar (Ensemble status) */}
      <div className="bg-slate-950/40 border-b border-slate-900/80 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <ModelBar />
        </div>
      </div>

      {/* Main App Content Body */}
      <main className="flex-1 flex flex-col">
        {activeTab === "chat" && (
          <ChatView
            config={config}
            onOpenKernelWithResult={handleOpenKernelWithResult}
            onOpenOptimizer={() => setActiveTab("optimizer")}
          />
        )}
        {activeTab === "kernel" && (
          <KernelLab initialResult={inspectedResult} />
        )}
        {activeTab === "memory" && <MemoryView />}
        {activeTab === "lineage" && <LineageView />}
        {activeTab === "optimizer" && (
          <OptimizerLab config={config} onChangeConfig={setConfig} />
        )}
      </main>
    </div>
  );
};
