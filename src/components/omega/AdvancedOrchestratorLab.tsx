import React, { useState } from "react";
import {
  Cpu,
  Terminal,
  ShieldCheck,
  Layers,
  Play,
  Database,
  Search,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  GitCommit,
} from "lucide-react";

export const AdvancedOrchestratorLab: React.FC = () => {
  // Multi-Agent State
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentResult, setAgentResult] = useState<any | null>(null);

  // Weighted Consensus State
  const [consensusPrompt, setConsensusPrompt] = useState("");
  const [consensusDomain, setConsensusDomain] = useState("math");
  const [consensusLoading, setConsensusLoading] = useState(false);
  const [consensusResult, setConsensusResult] = useState<any | null>(null);

  // Code Sandbox State
  const [sandboxCode, setSandboxCode] = useState("const fib = (n) => n <= 1 ? n : fib(n-1) + fib(n-2);\nconsole.log('Fib(10):', fib(10));\nreturn fib(10);");
  const [sandboxLang, setSandboxLang] = useState("javascript");
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);

  // Vector Memory State
  const [memoryText, setMemoryText] = useState("");
  const [memoryQuery, setMemoryQuery] = useState("");
  const [memoryResults, setMemoryResults] = useState<any[]>([]);
  const [memoryStatus, setMemoryStatus] = useState("");

  const handleRunAgents = async () => {
    if (!agentPrompt.trim()) return;
    setAgentLoading(true);
    setAgentResult(null);
    try {
      const res = await fetch("/api/omega/pipeline/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: agentPrompt }),
      });
      const data = await res.json();
      if (data.ok) {
        setAgentResult(data);
      } else {
        alert(data.error || "Pipeline execution failed");
      }
    } catch (e: any) {
      alert("Network error: " + e.message);
    } finally {
      setAgentLoading(false);
    }
  };

  const handleRunConsensus = async () => {
    if (!consensusPrompt.trim()) return;
    setConsensusLoading(true);
    setConsensusResult(null);
    try {
      const res = await fetch("/api/omega/consensus/weighted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: consensusPrompt, domain: consensusDomain }),
      });
      const data = await res.json();
      if (data.ok) {
        setConsensusResult(data);
      } else {
        alert(data.error || "Consensus failed");
      }
    } catch (e: any) {
      alert("Network error: " + e.message);
    } finally {
      setConsensusLoading(false);
    }
  };

  const handleRunSandbox = async () => {
    if (!sandboxCode.trim()) return;
    setSandboxLoading(true);
    setSandboxResult(null);
    try {
      const res = await fetch("/api/omega/code/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sandboxCode, language: sandboxLang }),
      });
      const data = await res.json();
      if (data.ok) {
        setSandboxResult(data);
      } else {
        alert(data.error || "Execution failed");
      }
    } catch (e: any) {
      alert("Network error: " + e.message);
    } finally {
      setSandboxLoading(false);
    }
  };

  const handleStoreMemory = async () => {
    if (!memoryText.trim()) return;
    try {
      const res = await fetch("/api/omega/memory/vector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "store", text: memoryText }),
      });
      const data = await res.json();
      if (data.ok) {
        setMemoryStatus("تم تخزين المعلومة في الذاكرة الدلالية المتجهة بنجاح!");
        setMemoryText("");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleSearchMemory = async () => {
    if (!memoryQuery.trim()) return;
    try {
      const res = await fetch("/api/omega/memory/vector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", query: memoryQuery }),
      });
      const data = await res.json();
      if (data.ok) {
        setMemoryResults(data.results || []);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-3 sm:p-5 space-y-8">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 shadow-lg">
            <Cpu className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              معمل الوكلاء المتقدمون والمحاكاة (Advanced Agents & Sandbox)
            </h2>
            <p className="text-xs text-slate-400">
              خط إنتاج الوكلاء الثلاثي، الإجماع المرجح بالقطاع، بيئة تشغيل الأكواد الآمنة، والذاكرة الدلالية طويلة المدى
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Multi-Agent Pipeline */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">1. خط إنتاج الوكلاء المتخصصين (Multi-Agent Pipeline)</h3>
          </div>
          <p className="text-xs text-slate-400">
            تحليل المهمة عبر (محلل ➔ مهندس ➔ مدقق) بالتسلسل لضمان أقصى درجات الدقة والابتكار.
          </p>
          <textarea
            value={agentPrompt}
            onChange={(e) => setAgentPrompt(e.target.value)}
            placeholder="اكتب المشكلة أو المشروع المطلوب تحليله وتطويره..."
            className="w-full h-24 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
          />
          <button
            type="button"
            onClick={handleRunAgents}
            disabled={agentLoading}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {agentLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            تشغيل خط الوكلاء الثلاثي
          </button>

          {agentResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-3 text-xs text-slate-300">
              <div className="font-bold text-purple-400">نتائج خط الوكلاء:</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-cyan-400">📊 تقرير المحلل:</span>
                <p className="mt-1 whitespace-pre-wrap">{agentResult.agents?.analyst}</p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400">⚙️ حل المهندس:</span>
                <p className="mt-1 whitespace-pre-wrap">{agentResult.agents?.engineer}</p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-400">🛡️ تقييم المدقق:</span>
                <p className="mt-1 whitespace-pre-wrap">{agentResult.agents?.verifier}</p>
              </div>
            </div>
          )}
        </div>

        {/* 2. Weighted Consensus Engine */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5">
            <GitCommit className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">2. الإجماع المرجح حسب القطاع (Weighted Consensus)</h3>
          </div>
          <p className="text-xs text-slate-400">
            دمج إجابات النماذج المتعددة بناءً على أوزان تخصصية (رياضيات، برمجة، صياغة عامة).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={consensusPrompt}
              onChange={(e) => setConsensusPrompt(e.target.value)}
              placeholder="اكتب السؤال أو المعضلة..."
              className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
            <select
              value={consensusDomain}
              onChange={(e) => setConsensusDomain(e.target.value)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            >
              <option value="math">رياضيات</option>
              <option value="code">برمجة</option>
              <option value="prose">أدب وصياغة</option>
              <option value="general">عام</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleRunConsensus}
            disabled={consensusLoading}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {consensusLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            حساب الإجماع المرجح
          </button>

          {consensusResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-cyan-400">نتيجة الإجماع:</div>
              <div className="p-3 rounded bg-slate-900 border border-slate-800 whitespace-pre-wrap">
                {consensusResult.consensus}
              </div>
            </div>
          )}
        </div>

        {/* 3. Sandboxed Code Execution & Self-Debugging */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">3. بيئة تشغيل الأكواد الآمنة (Code Sandbox & Self-Debug)</h3>
          </div>
          <p className="text-xs text-slate-400">
            تنفيذ الأكواد برمجياً في بيئة آمنة مع رصد الأخطاء واقتراح التصحيح الذاتي.
          </p>
          <textarea
            value={sandboxCode}
            onChange={(e) => setSandboxCode(e.target.value)}
            className="w-full h-28 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleRunSandbox}
            disabled={sandboxLoading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {sandboxLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            تنفيذ الكود في الحاوية الآمنة
          </button>

          {sandboxResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-emerald-400">مخرجات التنفيذ:</div>
              <pre className="p-3 rounded bg-slate-900 border border-slate-800 font-mono text-emerald-200 whitespace-pre-wrap">
                {sandboxResult.output}
              </pre>
              {sandboxResult.error && (
                <div className="p-2 rounded bg-rose-950/50 border border-rose-500/40 text-rose-300">
                  ⚠️ الخطأ المكتشف: {sandboxResult.error}
                  <div className="mt-1 text-amber-300">{sandboxResult.debugSuggested}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Vector RAG Long-Term Memory */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">4. الذاكرة الدلالية طويلة المدى (Vector RAG Memory)</h3>
          </div>
          <p className="text-xs text-slate-400">
            حفظ واسترجاع المعارف والمستندات بدلالة المتجهات الرياضية (Cosine Similarity).
          </p>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                placeholder="أضف معلومة جديدة للذاكرة..."
                className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleStoreMemory}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
              >
                حفظ
              </button>
            </div>
            {memoryStatus && <div className="text-emerald-400 text-xs">{memoryStatus}</div>}

            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={memoryQuery}
                onChange={(e) => setMemoryQuery(e.target.value)}
                placeholder="بحث دلالي في الذاكرة..."
                className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleSearchMemory}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                بحث
              </button>
            </div>

            {memoryResults.length > 0 && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {memoryResults.map((res, i) => (
                  <div key={i} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-amber-400 font-mono text-[10px]">
                      <span>ID: {res.id}</span>
                      <span>التطابق الدلالي: {(res.similarity * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-slate-300">{res.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
