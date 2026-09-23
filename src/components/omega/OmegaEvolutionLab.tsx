import React, { useState, useEffect } from "react";
import { Sparkles, Activity, ShieldCheck, Zap, RefreshCw, GitBranch, Server, Cpu } from "lucide-react";

export const OmegaEvolutionLab: React.FC = () => {
  const [registry, setRegistry] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  const fetchEvolution = async () => {
    try {
      const res = await fetch("/api/omega/kernel/evolution");
      const data = await res.json();
      if (data.ok) {
        setRegistry(data.registry);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEvolution();
    const interval = setInterval(fetchEvolution, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerEvolutionPulse = async () => {
    setPulsing(true);
    try {
      const res = await fetch("/api/omega/evolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: "Autonomous self-evolution heartbeat test", assistantResponse: "Kernel successfully adapted and recalibrated invariants." }),
      });
      const data = await res.json();
      if (data.ok) {
        setRegistry((prev: any) => ({
          ...prev,
          ...data.evolution,
          nodes: [data.evolution.latestNode, ...(prev?.nodes || [])],
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPulsing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-3 sm:p-5 space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/50 to-slate-900 border border-purple-500/30 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-900/60 text-purple-300 border border-purple-500/40 shadow-lg">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              نواة أوميغا المتطورة ذاتياً (Self-Evolving & Autonomous Kernel)
            </h2>
            <p className="text-xs text-slate-400">
              نظام التعلم المستمر، استخلاص الأنماط بعد كل محادثة، والتطور الذاتي لتصبح النواة خادم ذكاء اصطناعي مستقل بذاته
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={triggerEvolutionPulse}
          disabled={pulsing}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
        >
          {pulsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          إرسال نبضة تطور ذاتي (Pulse)
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>جيل النواة الحالي (Generation)</span>
            <GitBranch className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            v{registry?.generation || 1}.0-ALPHA
          </div>
          <div className="text-[11px] text-slate-500">يتطور تلقائياً كل 3 تفاعلات ناجحة</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>إجمالي التفاعلات والتعلم (Interactions)</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">
            {registry?.totalInteractions || 0}
          </div>
          <div className="text-[11px] text-slate-500">حلقات الاستدلال والتغذية الراجعة النشطة</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>حالة الخادم المستقل (Self-Hosting Node)</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            ACTIVE (ONLINE)
          </div>
          <div className="text-[11px] text-slate-500">خادم خلفي مستقل مع تصحيح ذاتي</div>
        </div>
      </div>

      {/* Learned Invariants & Nodes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            الثوابت والقواعد المستفادة ذاتياً (Auto-Learned Invariants)
          </h3>
          <div className="space-y-2">
            {registry?.learnedInvariants?.map((inv: string, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                <span className="text-purple-400 font-mono">#{idx + 1}</span>
                <p className="leading-relaxed">{inv}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            سجل التطور الذاتي والخبرات (Evolution Audit Log)
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {registry?.nodes?.length === 0 && (
              <div className="text-xs text-slate-500 text-center py-6">لم يتم تسجيل نبضات تطور بعد. انقر على "إرسال نبضة تطور ذاتي".</div>
            )}
            {registry?.nodes?.map((node: any) => (
              <div key={node.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span className="text-purple-400">الجيل v{node.generation}</span>
                  <span>{new Date(node.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-200">{node.insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
