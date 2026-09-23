import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Brain,
  Database,
  GitBranch,
  Sliders,
  ShieldCheck,
  Zap,
  Terminal,
  UserCheck,
  LogIn,
  ExternalLink,
  Calculator,
  Cpu,
  Sparkles,
} from "lucide-react";
import { OmegaMark } from "./OmegaMark";
import { ModelBar } from "./ModelBar";
import { ChatView } from "./ChatView";
import { KernelLab } from "./KernelLab";
import { MemoryView } from "./MemoryView";
import { LineageView } from "./LineageView";
import { OptimizerLab } from "./OptimizerLab";
import { SymbolicCASWorkbench } from "./SymbolicCASWorkbench";
import { AdvancedOrchestratorLab } from "./AdvancedOrchestratorLab";
import { OmegaEvolutionLab } from "./OmegaEvolutionLab";
import { AuthModal, type OmegaUser } from "./AuthModal";
import { DEFAULT_OMEGA_CONFIG, type OmegaConfig } from "../../lib/omega/optimizer";
import type { FusionResult } from "../../lib/omega/fusion";

export type NavTab = "chat" | "kernel" | "memory" | "lineage" | "optimizer" | "cas" | "orchestrator" | "evolution";

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("chat");
  const [config, setConfig] = useState<OmegaConfig>(DEFAULT_OMEGA_CONFIG);
  const [inspectedResult, setInspectedResult] = useState<FusionResult | null>(null);
  const [currentUser, setCurrentUser] = useState<OmegaUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("omega_auth_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          setCurrentUser(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogin = (user: OmegaUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("omega_auth_user");
    } catch {
      // ignore
    }
    setCurrentUser(null);
  };

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
    {
      id: "cas" as NavTab,
      label: "الحساب الرمزي والنظم (SymPy)",
      subLabel: "Symbolic CAS",
      icon: Calculator,
    },
    {
      id: "orchestrator" as NavTab,
      label: "الوكلاء المتقدمون والمحاكاة",
      subLabel: "Orchestrator Lab",
      icon: Cpu,
    },
    {
      id: "evolution" as NavTab,
      label: "التطور الذاتي للنواة",
      subLabel: "Self-Evolving Core",
      icon: Sparkles,
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

            {/* System Status Indicators & Auth Button */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden md:inline">النواة متصلة</span>
                <span className="text-slate-500">|</span>
                <span className="text-cyan-400">Ψ Engine Ready</span>
              </div>

              {/* Open in New Window / New Tab Button */}
              <a
                href={typeof window !== "undefined" ? window.location.href : "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  try {
                    window.open(window.location.href, "_blank", "noopener,noreferrer");
                  } catch {
                    // Fallback to normal anchor navigation
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-slate-900/90 hover:bg-cyan-950/40 text-cyan-200 hover:border-cyan-400 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow-cyan-950/50 shrink-0"
                title="فتح نظام أوميغا في صفحة / نافذة جديدة مستقلة"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="inline">صفحة جديدة</span>
              </a>

              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  currentUser
                    ? "bg-purple-950/70 border-purple-500/50 text-purple-200 hover:bg-purple-900/60"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-purple-500/50"
                }`}
                title={currentUser ? `مسجل كـ: ${currentUser.email}` : "الدخول بالبريد الإلكتروني"}
              >
                {currentUser ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="max-w-[120px] truncate">{currentUser.name || currentUser.email}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5 text-purple-400" />
                    <span>الدخول بالإيميل</span>
                  </>
                )}
              </button>
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
        {activeTab === "cas" && (
          <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
            <SymbolicCASWorkbench />
          </div>
        )}
        {activeTab === "orchestrator" && <AdvancedOrchestratorLab />}
        {activeTab === "evolution" && <OmegaEvolutionLab />}
      </main>

      {/* Email Authentication Security Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </div>
  );
};
