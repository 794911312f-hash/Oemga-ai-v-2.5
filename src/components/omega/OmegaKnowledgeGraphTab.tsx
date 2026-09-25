import React, { useState, useEffect } from "react";
import {
  Network,
  Share2,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Layers,
  Database,
  Link as LinkIcon,
  Tag,
  Compass,
} from "lucide-react";

export const OmegaKnowledgeGraphTab: React.FC = () => {
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");

  // Multi-hop Deduction state
  const [inquiry, setInquiry] = useState("ما العلاقة بين درجة الحرارة والضغط في الغازات؟");
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [paths, setPaths] = useState<any[]>([]);
  const [inferLoading, setInferLoading] = useState(false);

  // New Node/Edge modal/inline state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNodeId, setNewNodeId] = useState("");
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeType, setNewNodeType] = useState("concept");
  const [newEdgeSource, setNewEdgeSource] = useState("");
  const [newEdgeTarget, setNewEdgeTarget] = useState("");
  const [newEdgeRelation, setNewEdgeRelation] = useState("depends_on");
  const [addMsg, setAddMsg] = useState<string | null>(null);

  const fetchSnapshot = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/omega/graph/snapshot?userId=user_main");
      const data = await res.json();
      if (data.ok && data.snapshot) {
        setSnapshot(data.snapshot);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot();
  }, []);

  const runMultiHopInference = async () => {
    setInferLoading(true);
    setPaths([]);
    try {
      const payload: any = { userId: "user_main" };
      if (sourceId && targetId) {
        payload.sourceId = sourceId;
        payload.targetId = targetId;
      } else if (inquiry.trim()) {
        payload.inquiry = inquiry;
      } else {
        return;
      }

      const res = await fetch("/api/omega/graph/infer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.path) {
          setPaths([data.path]);
        } else if (Array.isArray(data.paths)) {
          setPaths(data.paths);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInferLoading(false);
    }
  };

  const handleAddNode = async () => {
    if (!newNodeId.trim() || !newNodeLabel.trim()) return;
    try {
      const res = await fetch("/api/omega/graph/add-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newNodeId.trim(),
          label: newNodeLabel.trim(),
          type: newNodeType,
          userId: "user_main",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAddMsg(`تمت إضافة العُقدة «${newNodeLabel}» بنجاح!`);
        setTimeout(() => setAddMsg(null), 3000);
        setNewNodeId("");
        setNewNodeLabel("");
        await fetchSnapshot();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEdge = async () => {
    if (!newEdgeSource || !newEdgeTarget) return;
    try {
      const res = await fetch("/api/omega/graph/add-edge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: newEdgeSource,
          target: newEdgeTarget,
          relation: newEdgeRelation,
          weight: 0.95,
          userId: "user_main",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAddMsg(`تم ربط «${newEdgeSource}» بـ «${newEdgeTarget}» عبر [${newEdgeRelation}]!`);
        setTimeout(() => setAddMsg(null), 3000);
        await fetchSnapshot();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const nodeTypes = [
    { id: "all", label: "كافة العُقد" },
    { id: "concept", label: "مفاهيم وقوانين" },
    { id: "variable", label: "متغيرات وثوابت" },
    { id: "system", label: "أنظمة ومعماريات" },
  ];

  const presets = [
    { label: "الحرارة إلى الضغط", src: "temp_kelvin", tgt: "pressure", q: "ما العلاقة بين درجة الحرارة والضغط؟" },
    { label: "الغاز المثالي إلى بويل", src: "ideal_gas", tgt: "boyle_law", q: "كيف يرتبط الغاز المثالي بقانون بويل؟" },
    { label: "أوميغا إلى الاستقرار", src: "omega_kernel", tgt: "invariance_stability", q: "كيف تضمن معمارية الإجماع استقرار النواة؟" },
  ];

  const filteredNodes = snapshot?.nodes
    ? snapshot.nodes.filter((n: any) => selectedType === "all" || n.type === selectedType)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 shadow">
              <Network className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                رسم المعرفة الحقيقي والاستدلال متعدد القفزات
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-900/70 text-purple-300 border border-purple-700/50">
                  Real Knowledge Graph & Multi-Hop BFS
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                بنية شبكية حقيقية بعُقد وروابط موجهة دلالياً (is_a, causes, depends_on, proves, regulates) تسمح بالاستنتاج المنطقي عبر مسارات قفزات متعددة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(!showAddModal)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              إضافة عُقدة / رابط
            </button>
            <button
              type="button"
              onClick={fetchSnapshot}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              تحديث الرسم
            </button>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">إجمالي العُقد المعرفية</span>
            <div className="text-lg font-bold text-purple-300 font-mono flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              {snapshot?.nodeCount || 0} عُقدة
            </div>
            <span className="text-[10px] text-slate-500">مفاهيم، قوانين، ومعادلات</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">إجمالي الروابط الموجهة</span>
            <div className="text-lg font-bold text-indigo-300 font-mono flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-indigo-400" />
              {snapshot?.edgeCount || 0} علاقة
            </div>
            <span className="text-[10px] text-slate-500">causes, depends_on, proves</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">خوارزمية الاستدلال</span>
            <div className="text-lg font-bold text-cyan-300 font-mono flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              Shortest BFS
            </div>
            <span className="text-[10px] text-slate-500">أقصر مسار استنتاجي مبرهن</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">التضمين الشعاعي</span>
            <div className="text-lg font-bold text-emerald-300 font-mono flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              64D Vector
            </div>
            <span className="text-[10px] text-slate-500">ربط الكلمات بالعُقد دلالياً</span>
          </div>
        </div>
      </div>

      {addMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {addMsg}
        </div>
      )}

      {/* Add Node & Edge Expandable Form */}
      {showAddModal && (
        <div className="p-5 rounded-2xl bg-slate-900/95 border border-purple-700/50 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              توسيع رسم المعرفة الحقيقي (إضافة عُقد وروابط)
            </h4>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              إغلاق
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Add Node Subform */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-200 block">1. إضافة عُقدة جديدة (Entity Node)</span>
              <input
                type="text"
                placeholder="معرف العقدة (e.g. quantum_mechanics)"
                value={newNodeId}
                onChange={(e) => setNewNodeId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              />
              <input
                type="text"
                placeholder="اسم العقدة الظاهر (e.g. ميكانيكا الكم)"
                value={newNodeLabel}
                onChange={(e) => setNewNodeLabel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <select
                value={newNodeType}
                onChange={(e) => setNewNodeType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="concept">مفهوم علمي (concept)</option>
                <option value="law">قانون فيزيائي (law)</option>
                <option value="equation">معادلة رياضية (equation)</option>
                <option value="system">نظام تقني (system)</option>
                <option value="variable">متغير / ثابت (variable)</option>
              </select>
              <button
                type="button"
                onClick={handleAddNode}
                disabled={!newNodeId.trim() || !newNodeLabel.trim()}
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                حفظ العُقدة في الرسم
              </button>
            </div>

            {/* Add Edge Subform */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-200 block">2. ربط عُقدتين برابط موجه (Relation Edge)</span>
              <select
                value={newEdgeSource}
                onChange={(e) => setNewEdgeSource(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              >
                <option value="">اختر العُقدة المصدر (Source)...</option>
                {snapshot?.nodes?.map((n: any) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({n.id})
                  </option>
                ))}
              </select>

              <select
                value={newEdgeRelation}
                onChange={(e) => setNewEdgeRelation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              >
                <option value="causes">يسبب (causes)</option>
                <option value="depends_on">يعتمد على (depends_on)</option>
                <option value="proves">يبرهن (proves)</option>
                <option value="part_of">جزء من (part_of)</option>
                <option value="regulates">ينظم / يضبط (regulates)</option>
                <option value="derives_from">يشتق من (derives_from)</option>
              </select>

              <select
                value={newEdgeTarget}
                onChange={(e) => setNewEdgeTarget(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              >
                <option value="">اختر العُقدة الهدف (Target)...</option>
                {snapshot?.nodes?.map((n: any) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({n.id})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddEdge}
                disabled={!newEdgeSource || !newEdgeTarget}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                إنشاء الرابط السببي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Hop Reasoner Interactive Workbench */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Sparkles className="w-4 h-4 text-purple-400" />
            محرك الاستدلال متعدد الخطوات (Multi-Hop Graph Reasoner)
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSourceId(p.src);
                  setTargetId(p.tgt);
                  setInquiry(p.q);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={inquiry}
              onChange={(e) => {
                setInquiry(e.target.value);
                setSourceId("");
                setTargetId("");
              }}
              placeholder="اكتب استفساراً استدلالياً للبحث عن المسارات السببية..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="">من (Source)...</option>
              {snapshot?.nodes?.map((n: any) => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="">إلى (Target)...</option>
              {snapshot?.nodes?.map((n: any) => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={runMultiHopInference}
          disabled={inferLoading || (!inquiry.trim() && (!sourceId || !targetId))}
          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
        >
          {inferLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              جاري التنقل في شبكة العُقد واحتساب مسارات BFS...
            </>
          ) : (
            <>
              <Compass className="w-4 h-4" />
              استنتاج المسار التكاملي متعدد القفزات
            </>
          )}
        </button>

        {/* Paths Output */}
        {paths.length > 0 && (
          <div className="space-y-3 pt-2 animate-in fade-in">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              تم العثور على {paths.length} مسار استدلالي مؤكد:
            </span>
            {paths.map((p, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-purple-900/60 space-y-2.5 text-xs font-mono"
              >
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2 flex-wrap gap-2">
                  <span className="text-amber-300 font-bold font-sans">
                    سلسلة الاستنتاج رقم #{idx + 1}
                  </span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-cyan-300">القفزات: {p.hops} Hops</span>
                    <span className="text-emerald-400 font-bold">اليقين: {(p.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80 text-purple-200 leading-relaxed font-sans text-xs">
                  {p.explanation}
                </div>

                {p.edges && p.edges.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 font-mono pt-1">
                    {p.edges.map((e: any, eIdx: number) => (
                      <span
                        key={eIdx}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 text-[10px]"
                      >
                        {e.source} ──[{e.relation}]──&gt; {e.target}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nodes Directory */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Database className="w-4 h-4 text-purple-400" />
            فهرس العُقد المعرفية في الرسم البياني
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {nodeTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  selectedType === t.id
                    ? "bg-purple-600 text-white shadow"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {filteredNodes.map((n: any) => (
            <div
              key={n.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-600/40 transition-all space-y-1.5 shadow-sm"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-100 truncate">{n.label}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-300">
                  {n.type}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate">id: {n.id}</div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                <span>الاتصالات: {n.degree || 1} روابط</span>
                <button
                  type="button"
                  onClick={() => {
                    setSourceId(n.id);
                    setInquiry(`ما العلاقة بين ${n.label} وبقية المفاهيم؟`);
                  }}
                  className="text-purple-400 hover:text-purple-300 cursor-pointer"
                >
                  استنتاج من هنا &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
