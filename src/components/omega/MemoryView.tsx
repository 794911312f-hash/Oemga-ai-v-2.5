import React, { useState } from "react";
import {
  Bookmark,
  Search,
  Plus,
  Trash2,
  Tag,
  Clock,
  Sparkles,
  Database,
  ExternalLink,
} from "lucide-react";
import { globalOmegaMemory, type MemoryNode } from "../../lib/omega/memory";
import type { Domain } from "../../lib/omega/domainRouting";

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<MemoryNode[]>(
    globalOmegaMemory.getAll()
  );
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { node: MemoryNode; similarity: number }[] | null
  >(null);

  // New Memory Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newDomain, setNewDomain] = useState<Domain>("general");
  const [newTags, setNewTags] = useState("");

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const results = globalOmegaMemory.query(searchQuery, 8, 0.1);
    setSearchResults(results);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newContent.trim()) return;

    const tagsArr = newTags
      .split(/[,،]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const created = globalOmegaMemory.add(
      newTopic,
      newContent,
      newDomain,
      0.95,
      tagsArr
    );

    setMemories(globalOmegaMemory.getAll());
    setShowAddModal(false);
    setNewTopic("");
    setNewContent("");
    setNewTags("");
  };

  const handleDelete = (id: string) => {
    globalOmegaMemory.delete(id);
    setMemories(globalOmegaMemory.getAll());
    if (searchResults) {
      setSearchResults(searchResults.filter((r) => r.node.id !== id));
    }
  };

  const displayedMemories = searchResults
    ? searchResults.map((r) => r.node)
    : selectedDomain === "all"
    ? memories
    : memories.filter((m) => m.domain === selectedDomain);

  const domainTabs = [
    { id: "all", label: "الكل" },
    { id: "code", label: "برمجة وهندسة" },
    { id: "math_logic", label: "رياضيات ومنطق" },
    { id: "science_factual", label: "علوم وحقائق" },
    { id: "creative_writing", label: "كتابة وإبداع" },
    { id: "general", label: "عام" },
  ];

  return (
    <div className="max-w-6xl mx-auto w-full p-3 sm:p-5 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/40 omega-glow-cyan">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              الذاكرة المعرفية الترابطية (Omega Epistemic Memory)
            </h2>
            <p className="text-xs text-slate-400">
              تخزين الاستنتاجات المُحققة واسترجاعها عبر التشابه الدلالي في فضاء المتجهات
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إضافة عقدة معرفية
        </button>
      </div>

      {/* Semantic Search & Domain Tabs */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث دلالياً عن أي فكرة أو مصطلح في الذاكرة الترابطية..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            استرجاع دلالي
          </button>
          {searchResults && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-3 py-2.5 rounded-xl bg-slate-950 text-slate-400 hover:text-slate-200 text-xs border border-slate-800 transition-colors cursor-pointer"
            >
              إلغاء التصفية
            </button>
          )}
        </form>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {domainTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedDomain(tab.id);
                setSearchResults(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedDomain === tab.id && !searchResults
                  ? "bg-cyan-950 border border-cyan-500/50 text-cyan-300"
                  : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedMemories.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            لا توجد عقد معرفية مطابقة لمعايير البحث الحالية.
          </div>
        ) : (
          displayedMemories.map((node) => {
            const resultMatch = searchResults?.find((r) => r.node.id === node.id);
            return (
              <div
                key={node.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-200 leading-snug">
                      {node.topic}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {resultMatch && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                          تشابه: {(resultMatch.similarity * 100).toFixed(1)}%
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(node.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="حذف من الذاكرة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {node.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-400">
                      {node.domain}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      مرات الوصول: {node.accessCount}
                    </span>
                  </div>

                  {node.tags && node.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-600" />
                      <span>{node.tags.slice(0, 3).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-cyan-400" />
              إضافة معرفة جديدة إلى ذاكرة أوميغا
            </h3>

            <form onSubmit={handleAddMemory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  الموضوع / العنوان
                </label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="مثال: نظرية إجماع بايزي متعدد القنوات"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  المجال المعرفي
                </label>
                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value as Domain)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                >
                  <option value="code">برمجة وهندسة (Code)</option>
                  <option value="math_logic">رياضيات ومنطق (Math/Logic)</option>
                  <option value="science_factual">علوم وحقائق (Science/Factual)</option>
                  <option value="creative_writing">كتابة وإبداع (Creative Writing)</option>
                  <option value="general">عام (General)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  المحتوى / الخلاصة المعرفية
                </label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="اكتب المعرفة أو القاعدة المستخلصة التي ترغب في تذكرها واسترجاعها..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  الوسوم (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="مثال: خوارزمية, إجماع, أوميغا"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold cursor-pointer"
                >
                  حفظ في الذاكرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
