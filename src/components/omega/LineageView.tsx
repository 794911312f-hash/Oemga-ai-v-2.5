import React, { useState } from "react";
import {
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Sparkles,
  Cpu,
  History,
  Info,
} from "lucide-react";
import { globalOmegaLineage, type LineageNode } from "../../lib/omega/lineage";

export const LineageView: React.FC = () => {
  const [nodes, setNodes] = useState<LineageNode[]>(
    globalOmegaLineage.getNodes()
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    nodes[0]?.id || null
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const refreshNodes = () => {
    setNodes(globalOmegaLineage.getNodes());
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-3 sm:p-5 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-500/40 omega-glow">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              شجرة النسب المعرفي التطوري (Omega Lineage Graph)
            </h2>
            <p className="text-xs text-slate-400">
              تتبع الأجيال الاستدلالية (Generations)، وطفرات التوافق، ومسارات الحسم المتعاقبة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refreshNodes}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          <History className="w-4 h-4" />
          تحديث السجل
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline / Generational Tree List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-xs text-slate-400 font-semibold flex items-center justify-between px-1">
            <span>العقد التطورية المسجلة ({nodes.length})</span>
            <span>الجيل الحالي: Gen {Math.max(0, ...nodes.map((n) => n.generation))}</span>
          </div>

          <div className="space-y-3">
            {nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const modeColor = {
                direct: "border-emerald-500/40 bg-emerald-950/20 text-emerald-300",
                aggregated: "border-purple-500/40 bg-purple-950/20 text-purple-300",
                uncertain: "border-amber-500/40 bg-amber-950/20 text-amber-300",
                exploratory: "border-cyan-500/40 bg-cyan-950/20 text-cyan-300",
              }[node.mode] || "border-slate-700 bg-slate-900 text-slate-300";

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col space-y-2 ${
                    isSelected
                      ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/40"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                        Gen {node.generation}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${modeColor}`}
                      >
                        {node.mode === "direct"
                          ? "إجماع مباشر"
                          : node.mode === "aggregated"
                          ? "توليف مركب"
                          : "انشطار حيرة"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        مجال: {node.domain}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span>Ψ: {(node.topPsi * 100).toFixed(0)}%</span>
                      <span>تشتت: {node.spread.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-slate-200">
                    {node.query}
                  </div>

                  <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {node.summary}
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>النموذج الراجح: {node.winnerModel}</span>
                    <span>
                      {node.verified ? "✓ مدقق ذاتياً" : "! تحفظ"} (
                      {(node.verificationScore * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Detail Inspector Panel */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 h-fit sticky top-20">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 pb-2 border-b border-slate-800">
            <Info className="w-4 h-4 text-indigo-400" />
            فاحص العقدة التطورية (Lineage Inspector)
          </div>

          {selectedNode ? (
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="text-slate-400 font-semibold mb-1">المسألة / الاستفسار:</div>
                <div className="text-slate-200 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-medium">
                  {selectedNode.query}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">رقم الجيل</span>
                  <span className="font-mono text-slate-200 font-bold text-sm">
                    Generation {selectedNode.generation}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">نمط الحسم</span>
                  <span className="font-mono text-indigo-400 font-bold text-sm">
                    {selectedNode.mode.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-slate-400 font-semibold mb-1">خلاصة الإجماع النهائي:</div>
                <div className="text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 leading-relaxed text-xs">
                  {selectedNode.summary}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>المرشحون المشاركون:</span>
                  <span className="text-slate-200">{selectedNode.candidateCount} نماذج</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>أعلى يقين (Ψ):</span>
                  <span className="text-cyan-400">{(selectedNode.topPsi * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>فارق التشتت (Spread):</span>
                  <span className="text-amber-400">{selectedNode.spread}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>درجة التدقيق الذاتي:</span>
                  <span className="text-emerald-400">
                    {(selectedNode.verificationScore * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">
              اختر عقدة معرفية من الشجرة لعرض بياناتها التفصيلية.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
