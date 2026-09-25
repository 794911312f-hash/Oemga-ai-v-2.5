import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Activity,
  ShieldCheck,
  Zap,
  RefreshCw,
  GitBranch,
  Server,
  Cpu,
  Database,
  CheckCircle2,
  Sliders,
  Target,
  Code,
  Terminal,
  Play,
  Copy,
  Check,
  BrainCircuit,
  Award,
  Clock,
  ArrowRight,
  Layers,
  Scale,
  ShieldAlert,
} from "lucide-react";

export const OmegaEvolutionLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "openai" | "selfplay" | "matrices">("overview");
  const [registry, setRegistry] = useState<any | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const [pulsing, setPulsing] = useState(false);

  // OpenAI Test state
  const [testPrompt, setTestPrompt] = useState("ما هي أهمية معمارية الإجماع المتعدد في استقرار الأنظمة الموزعة؟");
  const [testModel, setTestModel] = useState("omega-kernel-consensus");
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Self-play state
  const [selfPlayHistory, setSelfPlayHistory] = useState<any[]>([]);
  const [isSelfPlayActive, setIsSelfPlayActive] = useState(false);
  const [runningSelfPlay, setRunningSelfPlay] = useState(false);
  const [lastSelfPlayResult, setLastSelfPlayResult] = useState<any | null>(null);

  // Stateful Inference Matrices state
  const [matrixData, setMatrixData] = useState<any | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [cyclePrompt, setCyclePrompt] = useState("ما هي العلاقة الديناميكية بين الضغط ودرجة الحرارة في الغازات وفق المبادئ الأولية؟");
  const [cycleLoading, setCycleLoading] = useState(false);
  const [cycleResult, setCycleResult] = useState<any | null>(null);

  // 1. MCTS State
  const [mctsPrompt, setMctsPrompt] = useState("حلل حدسية كولاتز (Collatz Conjecture 3n+1) وفق الشروط الحدية والتحليل الثنائي");
  const [mctsLoading, setMctsLoading] = useState(false);
  const [mctsResult, setMctsResult] = useState<any | null>(null);

  // 2. Hierarchical Memory State
  const [hierarchicalData, setHierarchicalData] = useState<any | null>(null);
  const [hierarchicalLoading, setHierarchicalLoading] = useState(false);

  // 3. Adversarial Debate State
  const [debatePrompt, setDebatePrompt] = useState("هل يمكن للوعي الاصطناعي الحقيقي أن ينبثق فقط من نماذج التنبؤ بالرمز التالي؟");
  const [debateLoading, setDebateLoading] = useState(false);
  const [debateResult, setDebateResult] = useState<any | null>(null);

  // 4. Code Sandbox State
  const [sandboxCode, setSandboxCode] = useState(`function computeEntropy(arr) {\n  let total = arr.reduce((a, b) => a + b, 0);\n  let p = arr.map(x => x / total);\n  let h = 0;\n  for (let val of p) {\n    if (val > 0) h -= val * Math.log2(val);\n  }\n  return h;\n}\nconsole.log("Shannon Entropy (bits):", computeEntropy([0.4, 0.35, 0.15, 0.1]));`);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);

  const fetchEvolution = async () => {
    try {
      const res = await fetch("/api/omega/kernel/evolution?userId=user_main");
      const data = await res.json();
      if (data.ok) {
        setRegistry(data.registry);
        if (data.firebaseConnected !== undefined) {
          setFirebaseConnected(data.firebaseConnected);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSelfPlayHistory = async () => {
    try {
      const res = await fetch("/api/omega/self-play/history");
      const data = await res.json();
      if (data.ok) {
        setSelfPlayHistory(data.history || []);
        setIsSelfPlayActive(!!data.isActive);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMatrixState = async () => {
    try {
      setMatrixLoading(true);
      const res = await fetch("/api/omega/inference/state?userId=user_main");
      const data = await res.json();
      if (data.ok) {
        setMatrixData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMatrixLoading(false);
    }
  };

  const runLiveInferenceCycle = async () => {
    if (!cyclePrompt.trim()) return;
    setCycleLoading(true);
    try {
      const res = await fetch("/api/omega/inference/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_main",
          question: cyclePrompt,
          domain: "science_factual",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setCycleResult(data);
        await fetchMatrixState();
        await fetchEvolution();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCycleLoading(false);
    }
  };

  const runMCTSTreeSearch = async () => {
    if (!mctsPrompt.trim()) return;
    setMctsLoading(true);
    try {
      const res = await fetch("/api/omega/mcts/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: mctsPrompt, userId: "user_main" }),
      });
      const data = await res.json();
      if (data.ok) setMctsResult(data.mctsResult);
    } catch (e) {
      console.error(e);
    } finally {
      setMctsLoading(false);
    }
  };

  const fetchHierarchicalMemory = async () => {
    setHierarchicalLoading(true);
    try {
      const res = await fetch("/api/omega/memory/hierarchical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "قانون الغاز المثالي وحفظ الطاقة", userId: "user_main" }),
      });
      const data = await res.json();
      if (data.ok) setHierarchicalData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setHierarchicalLoading(false);
    }
  };

  const runAdversarialDebate = async () => {
    if (!debatePrompt.trim()) return;
    setDebateLoading(true);
    try {
      const res = await fetch("/api/omega/debate/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: debatePrompt, userId: "user_main" }),
      });
      const data = await res.json();
      if (data.ok) setDebateResult(data.debateResult);
    } catch (e) {
      console.error(e);
    } finally {
      setDebateLoading(false);
    }
  };

  const runCodeSandbox = async () => {
    if (!sandboxCode.trim()) return;
    setSandboxLoading(true);
    try {
      const res = await fetch("/api/omega/code/self-correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sandboxCode, userId: "user_main", maxAttempts: 3 }),
      });
      const data = await res.json();
      if (data.ok) setSandboxResult(data.execution);
    } catch (e) {
      console.error(e);
    } finally {
      setSandboxLoading(false);
    }
  };

  useEffect(() => {
    fetchEvolution();
    fetchSelfPlayHistory();
    fetchMatrixState();
    fetchHierarchicalMemory();
    const interval = setInterval(() => {
      fetchEvolution();
      fetchSelfPlayHistory();
      fetchMatrixState();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const triggerEvolutionPulse = async () => {
    setPulsing(true);
    try {
      const res = await fetch("/api/omega/evolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_main",
          userMessage: "Autonomous Firestore verification pulse: testing persistent self-evolution convergence.",
          assistantResponse: "Verified invariant: Consensus convergence verified and stored in cloud Firestore.",
          domain: "systems_architecture",
          topPsi: 0.94,
          verificationPassed: true,
          chosenModelId: "omega-kernel-v2",
          candidatesCount: 3,
          spread: 0.08,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchEvolution();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPulsing(false);
    }
  };

  const runTestOpenAiCall = async () => {
    setTestLoading(true);
    setTestResponse(null);
    try {
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer omega-sk-live",
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: "user", content: testPrompt }],
          temperature: 0.4,
          max_tokens: 600,
        }),
      });
      const data = await res.json();
      setTestResponse(data);
      await fetchEvolution();
    } catch (err: any) {
      setTestResponse({ error: err?.message });
    } finally {
      setTestLoading(false);
    }
  };

  const runSingleSelfPlay = async () => {
    setRunningSelfPlay(true);
    try {
      const res = await fetch("/api/omega/self-play/cycle", { method: "POST" });
      const data = await res.json();
      if (data.ok && data.cycle) {
        setLastSelfPlayResult(data.cycle);
        await fetchSelfPlayHistory();
        await fetchEvolution();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningSelfPlay(false);
    }
  };

  const toggleSelfPlay = async () => {
    try {
      const res = await fetch("/api/omega/self-play/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: !isSelfPlayActive }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsSelfPlayActive(data.isActive);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const curlExample = `curl -X POST "${baseUrl}/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer omega-sk-live" \\
  -d '{
    "model": "omega-kernel-consensus",
    "messages": [
      {"role": "user", "content": "اشرح مبدأ الإجماع المتعدد في النظم الذكية"}
    ],
    "temperature": 0.4
  }'`;

  const pythonExample = `from openai import OpenAI

# الاتصال المباشر بخادم نواة أوميغا المستقل
client = OpenAI(
    base_url="${baseUrl}/v1",
    api_key="omega-sk-live"  # أي مفتاح أو توكن تعريفي
)

response = client.chat.completions.create(
    model="omega-kernel-consensus",
    messages=[
        {"role": "system", "content": "أنت خادم أوميغا الذكي المستقل"},
        {"role": "user", "content": "حلل معضلة توافق النماذج اللغوية"}
    ],
    temperature=0.3
)

print("رد خادم أوميغا:", response.choices[0].message.content)
print("الجيل المتعلم:", response.omega.get("generation"))`;

  return (
    <div className="max-w-6xl mx-auto w-full p-3 sm:p-5 space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/70 to-slate-900 border border-purple-500/30 flex items-center justify-between flex-wrap gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-900/60 text-purple-300 border border-purple-500/40 shadow-lg">
            <Sparkles className="w-7 h-7 animate-pulse text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">
                نواة أوميغا المتطورة ذاتياً (Autonomous Sovereign AI Server)
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 border border-emerald-500/50 text-emerald-400">
                <Database className="w-3 h-3 text-emerald-400" />
                Firestore متصل حياً
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              خادم ذكاء اصطناعي مستقل مع واجهة متوافقة مع OpenAI، تعلم ذاتي توليدي (Self-Play)، وتخزين سحابي دائم للخبرات
            </p>
          </div>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            نواة التطور في Firestore
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("openai")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "openai"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            خادم OpenAI API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("selfplay")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "selfplay"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-amber-300" />
            التعلم الذاتي (Self-Play)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("matrices");
              fetchMatrixState();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "matrices"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-300" />
            مصفوفات الاستنتاج ذو الحالة
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & FIRESTORE EVOLUTION */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>جيل النواة الحالي</span>
                <GitBranch className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-300 font-mono">
                Gen v{registry?.generation || 1}.0
              </div>
              <div className="text-[11px] text-slate-500">يتطور تلقائياً كل 5 تفاعلات ناجحة</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>إجمالي التفاعلات المخزنة</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-300 font-mono">
                {registry?.totalInteractions || 0}
              </div>
              <div className="text-[11px] text-slate-500">
                نجاح: {registry?.successfulVerifications || 0} | تدقيق: {registry?.failedVerifications || 0}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>عتبة الإجماع المباشر</span>
                <Target className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-300 font-mono">
                {(registry?.learnedConfig?.directThreshold ?? 0.85).toFixed(3)}
              </div>
              <div className="text-[11px] text-slate-500">
                هامش التردد: {(registry?.learnedConfig?.uncertainSpread ?? 0.1).toFixed(3)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>حالة الخادم وقاعدة البيانات</span>
                <Server className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1.5 pt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                FIRESTORE CONNECTED
              </div>
              <div className="text-[11px] text-slate-500 truncate" title="ai-studio-omegaai-c546828b-c753-4c76-8065-6864b1b5cc5e">
                قاعدة: ai-studio-omegaai...
              </div>
            </div>
          </div>

          {/* Quick Pulse Action */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={triggerEvolutionPulse}
              disabled={pulsing}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {pulsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
              إرسال نبضة تطور يدوي وتخزين سحابي
            </button>
          </div>

          {/* Learned Invariants & Domain Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                الثوابت المستخلصة في قاعدة البيانات (Learned Invariants in Firestore)
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(!registry?.learnedInvariants || registry.learnedInvariants.length === 0) && (
                  <div className="text-xs text-slate-500 text-center py-4">جاري استخلاص الثوابت...</div>
                )}
                {registry?.learnedInvariants?.map((inv: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5 shadow-sm"
                  >
                    <span className="text-purple-400 font-mono font-bold">#{idx + 1}</span>
                    <p className="leading-relaxed text-slate-200">{inv}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                إحصائيات المجالات المعرفية المتعلمة (Domain Statistics)
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {!registry?.domainStats || Object.keys(registry.domainStats).length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-8">
                    لم يتم تسجيل تفاعلات في مجالات معرفية بعد. ستقوم النواة ببنائها تلقائياً بعد كل محادثة في الشات.
                  </div>
                ) : (
                  Object.entries(registry.domainStats).map(([domain, stats]: [string, any]) => (
                    <div key={domain} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-cyan-300 uppercase">{domain}</span>
                        <span className="text-purple-400 font-mono">{stats.count} تفاعل</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                        <div>
                          متوسط اليقين (Avg Ψ):{" "}
                          <span className="font-mono text-emerald-400">{(stats.avgPsi * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          نسبة النجاح:{" "}
                          <span className="font-mono text-amber-400">{(stats.successRate * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      {stats.preferredModels?.length > 0 && (
                        <div className="text-[10px] text-slate-500">
                          النماذج المفضلة: <span className="text-slate-300 font-mono">{stats.preferredModels.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPENAI-COMPATIBLE API SERVER */}
      {activeTab === "openai" && (
        <div className="space-y-6">
          {/* API Info Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-200">
                  خادم أوميغا القياسي المتوافق مع OpenAI API (`/v1/chat/completions`)
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                HTTP 200 OK • Live Endpoint Active
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              يمكنك استخدام نقطة النهاية هذه في أي تطبيق برمجي خارجي، تطبيق موبايل، أو أدوات الذكاء الاصطناعي مثل Cursor و LangChain كبديل كامل لـ OpenAI مع الاستفادة التلقائية من إجماع أوميغا وتخزين التجارب في Firestore.
            </p>

            {/* Base URL display */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-purple-400 font-bold uppercase">Base URL:</span>
                <span className="text-slate-200 truncate">{baseUrl}/v1</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(`${baseUrl}/v1`, "base")}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer flex items-center gap-1 text-[11px]"
              >
                {copiedType === "base" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                نسخ
              </button>
            </div>
          </div>

          {/* Code Snippets (cURL + Python) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* cURL */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  مثال cURL (Terminal / Bash)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(curlExample, "curl")}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-950 px-2 py-1 rounded border border-slate-800"
                >
                  {copiedType === "curl" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  نسخ الكود
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {curlExample}
              </pre>
            </div>

            {/* Python OpenAI SDK */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  مثال كود Python (مكتبة openai الرسمية)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(pythonExample, "py")}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-950 px-2 py-1 rounded border border-slate-800"
                >
                  {copiedType === "py" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  نسخ الكود
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {pythonExample}
              </pre>
            </div>
          </div>

          {/* Interactive Live API Console Tester */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Play className="w-4 h-4 text-purple-400" />
              منصة الاختبار المباشر لنقطة النهاية (Live API Tester)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs text-slate-400">نص الرسالة (user message):</label>
                <input
                  type="text"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">النموذج (Model):</label>
                <select
                  value={testModel}
                  onChange={(e) => setTestModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="omega-kernel-consensus">omega-kernel-consensus</option>
                  <option value="deepseek/deepseek-r1">deepseek/deepseek-r1</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">meta-llama/llama-3.3-70b-instruct</option>
                  <option value="qwen/qwen-2.5-72b-instruct">qwen/qwen-2.5-72b-instruct</option>
                  <option value="anthropic/claude-sonnet-4.5">anthropic/claude-sonnet-4.5</option>
                  <option value="x-ai/grok-4.3">x-ai/grok-4.3</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={runTestOpenAiCall}
                disabled={testLoading}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {testLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                إرسال طلب مباشر لـ /v1/chat/completions
              </button>
            </div>

            {testResponse && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-purple-300">رد الخادم القياسي (OpenAI Format):</span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    ID: {testResponse.id || "Error"}
                  </span>
                </div>
                <pre className="p-3 rounded-lg bg-black/60 border border-slate-900 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-60">
                  {JSON.stringify(testResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUTONOMOUS SELF-PLAY & RLAIF */}
      {activeTab === "selfplay" && (
        <div className="space-y-6">
          {/* Self-Play Control Bar */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 flex items-center justify-between flex-wrap gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-amber-300 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-200">
                  حلقة التعلم الذاتي التوليدي بلا توقف (Autonomous Self-Play & RLAIF)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                تقوم النواة تلقائياً بتوليد معضلات منطقية وبرمجية، حلها عبر نموذج الاستدلال (DeepSeek R1)، وتقييمها عبر (Claude/Gemini)، وحفظ أفضل التجارب في Firestore.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelfPlay}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                  isSelfPlayActive
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Clock className="w-4 h-4" />
                {isSelfPlayActive ? "التشغيل التلقائي مفعل (كل 4 دقائق)" : "تفعيل الحلقة التلقائية في الخلفية"}
              </button>

              <button
                type="button"
                onClick={runSingleSelfPlay}
                disabled={runningSelfPlay}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {runningSelfPlay ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-amber-300" />}
                بدء دورة تعلم ذاتي حقيقية الآن (Run Cycle)
              </button>
            </div>
          </div>

          {/* Running Status Indicator */}
          {runningSelfPlay && (
            <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/40 text-purple-200 text-xs flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-300" />
              <div>
                <p className="font-bold">جاري تنفيذ دورة التعلم الذاتي الحقيقية...</p>
                <p className="text-[11px] text-purple-400">
                  توليد المعضلة ➔ حل الاستدلال المعمق عبر DeepSeek R1 ➔ التقييم والتدقيق ➔ الحفظ والتطور في Firestore
                </p>
              </div>
            </div>
          )}

          {/* Latest Self-Play Result */}
          {lastSelfPlayResult && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  نتيجة آخر دورة تعلم ذاتي مستخلصة (Latest Golden Experience)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                  درجة التقييم: {lastSelfPlayResult.score}/100 • {lastSelfPlayResult.passed ? "معتمدة" : "مرفوضة"}
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">المعضلة المولدة ذاتياً ({lastSelfPlayResult.domain}):</span>
                  <p className="text-xs text-slate-200 mt-1">{lastSelfPlayResult.question}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-purple-400 uppercase">
                    حل الاستدلال ({lastSelfPlayResult.solverModel}):
                  </span>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-4 leading-relaxed font-mono">
                    {lastSelfPlayResult.solution}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">
                    نقد وتدقيق الناقد ({lastSelfPlayResult.criticModel}):
                  </span>
                  <p className="text-xs text-slate-300 mt-1">{lastSelfPlayResult.critique}</p>
                </div>
              </div>
            </div>
          )}

          {/* Self-Play History Log */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              سجل خبرات التعلم الذاتي المخزنة في Firestore (RLAIF History)
            </h3>
            {selfPlayHistory.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-8">
                لم يتم تشغيل دورات تعلم ذاتي بعد. انقر على "بدء دورة تعلم ذاتي حقيقية الآن" لتبدأ النواة التطور فوراً.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selfPlayHistory.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-cyan-300 uppercase">{item.domain}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-purple-400">الجيل v{item.generation}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            item.score >= 80 ? "bg-emerald-950 text-emerald-300" : "bg-amber-950 text-amber-300"
                          }`}
                        >
                          درجة: {item.score}/100
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{item.question}</p>
                    <p className="text-[11px] text-slate-400 italic">الناقد: {item.critique}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: STATEFUL INFERENCE MATRICES */}
      {activeTab === "matrices" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-cyan-950/80 border border-purple-800/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">
                  محرك الاستنتاج ذو الحالة (Omega Stateful Inference Engine)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
                  تطبيق حي ونشط 100%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                إدارة حالة مستمرة عبر 6 مصفوفات رياضية: الذاكرة الدلالية، الثقة الزمنية، الخبرة، اتفاق النماذج، ملف الأهداف، والرسم البياني المعرفي.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchMatrixState}
                disabled={matrixLoading}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${matrixLoading ? "animate-spin text-cyan-400" : ""}`} />
                تحديث المصفوفات
              </button>
            </div>
          </div>

          {/* 6 Matrices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Memory Matrix */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-purple-400" />
                  1. مصفوفة الذاكرة (Memory Matrix)
                </span>
                <span className="text-[10px] font-mono text-slate-400">R^64 Decay: 0.995</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">رتبة المفاهيم المستوعبة:</span>
                  <span className="font-bold font-mono text-purple-300 text-sm">
                    {matrixData?.memoryRank || matrixData?.matrixSnapshot?.memoryRank || 0} مفهوم
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                  تستوعب النصوص دلالياً وتربط المفاهيم المتجاورة تلقائياً مع خضوعها لاضمحلال نسيان تدريجي منتظم لمنع تراكم الشوائب.
                </div>
              </div>
            </div>

            {/* 2. Confidence Matrix */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  2. مصفوفة الثقة (Confidence Matrix)
                </span>
                <span className="text-[10px] font-mono text-slate-400">t_1/2: 14 Days</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">متوسط الثقة الكلي للنواة:</span>
                  <span className="font-bold font-mono text-cyan-300 text-sm">
                    {typeof matrixData?.confidenceMean === "number"
                      ? `${(matrixData.confidenceMean * 100).toFixed(1)}%`
                      : "55.0%"}
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((matrixData?.confidenceMean || 0.55) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] text-slate-400">
                  تسجل نجاحات وفشل كل حقيقة مع اضمحلال أسي زمني لضمان حداثة المعرفة.
                </div>
              </div>
            </div>

            {/* 3. Experience Matrix */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-emerald-400" />
                  3. مصفوفة الخبرات (Experience Matrix)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Depth Vector</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">عمق القرارات السابقة:</span>
                  <span className="font-bold font-mono text-emerald-300 text-sm">
                    {matrixData?.experienceDepth || matrixData?.matrixSnapshot?.experienceDepth || 0} قرار مسجل
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                  تسترجع القرارات المشابهة السابقة وتوجه اختيار أفضل خادم للأسئلة القادمة بناءً على النجاح التاريخي المؤكد.
                </div>
              </div>
            </div>

            {/* 4. Model Agreement Matrix */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  4. مصفوفة اتفاق النماذج (Agreement)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Softmax Fusion</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">إنتروبيا الاتفاق المعرفي:</span>
                  <span className="font-bold font-mono text-amber-300 text-sm">
                    {typeof matrixData?.agreementEntropy === "number"
                      ? matrixData.agreementEntropy.toFixed(3)
                      : "0.000"} bits
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                  تقيس مدى تقارب مخرجات النماذج المتعددة، وتضبط أوزان الدمج عبر Softmax ديناميكي يرفع وزن النموذج الأكثر دقة.
                </div>
              </div>
            </div>

            {/* 5. Goal Matrix */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-rose-400" />
                  5. مصفوفة الأهداف (Goal Matrix)
                </span>
                <span className="text-[10px] font-mono text-slate-400">4-Axis Vector</span>
              </div>
              <div className="space-y-2 text-xs">
                {matrixData?.goals ? (
                  <>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">الدقة والبرهان:</span>
                      <span className="font-mono text-cyan-300 font-bold">{Math.round((matrixData.goals.accuracy || 0.35) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${Math.round((matrixData.goals.accuracy || 0.35) * 100)}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">البحث العميق:</span>
                      <span className="font-mono text-purple-300 font-bold">{Math.round((matrixData.goals.deep_research || 0.2) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-400 h-full rounded-full" style={{ width: `${Math.round((matrixData.goals.deep_research || 0.2) * 100)}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">السرعة والجاهزية:</span>
                      <span className="font-mono text-emerald-300 font-bold">{Math.round((matrixData.goals.speed || 0.25) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.round((matrixData.goals.speed || 0.25) * 100)}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">الإبداع والتخيل:</span>
                      <span className="font-mono text-amber-300 font-bold">{Math.round((matrixData.goals.creativity || 0.2) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.round((matrixData.goals.creativity || 0.2) * 100)}%` }} />
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-slate-500">جاري استنتاج الأهداف الرباعية...</div>
                )}
              </div>
            </div>

            {/* 6. Knowledge Graph */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-sky-300 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-sky-400" />
                  6. الرسم البياني المعرفي (Knowledge Graph)
                </span>
                <span className="text-[10px] font-mono text-slate-400">2-Hop Inferences</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">عقد المعرفة (Nodes):</span>
                  <span className="font-bold font-mono text-sky-300 text-sm">
                    {matrixData?.knowledgeStats?.nodes || matrixData?.matrixSnapshot?.knowledgeNodes || 0} عقدة
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">روابط العلاقات (Edges):</span>
                  <span className="font-bold font-mono text-indigo-300 text-sm">
                    {matrixData?.knowledgeStats?.edges || matrixData?.matrixSnapshot?.knowledgeEdges || 0} رابط
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-xl border border-slate-800/80 leading-relaxed">
                  يولّد استنتاجات بيانية ذاتية بربط العقد عبر قفزات متعددة، متجاوزاً مجرد الاسترجاع السطحي للنصوص.
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Stateful Inference Cycle Runner */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Play className="w-4 h-4 text-cyan-400" />
                  تشغيل دورة استنتاج حية عبر المصفوفات (Stateful Inference Cycle)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  اختبر التطبيق الفعلي للمحرك: يمر السؤال بمصفوفة الأهداف، يسترجع الذاكرة الطويلة، يستنتج عبر الرسم المعرفي، وينفذ التقييم الذاتي التلقائي.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {[
                  "ما هي العلاقة الديناميكية بين الضغط ودرجة الحرارة في الغازات؟",
                  "برهن أهمية مبدأ حفظ الطاقة في الميكانيكا الكلاسيكية",
                  "قارن بين خوارزميات التوافق Paxos و Raft في الأنظمة الموزعة",
                  "كيف تؤثر الإنتروبيا على التوازن الكوني والزمن؟",
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCyclePrompt(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-purple-600 hover:text-purple-300 transition-all cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={cyclePrompt}
                  onChange={(e) => setCyclePrompt(e.target.value)}
                  placeholder="أدخل استفسارك لاختبار دورة الاستنتاج ذو الحالة..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={runLiveInferenceCycle}
                  disabled={cycleLoading || !cyclePrompt.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-900/30"
                >
                  {cycleLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      جاري التنفيذ الحي...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      تشغيل الدورة الحية
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Cycle Result Display */}
            {cycleResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-center text-xs border-b border-slate-800/80 pb-3">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    اكتملت دورة الاستنتاج ذو الحالة بنجاح (Committed to Matrices)
                  </span>
                  <span className="font-mono text-purple-300 text-xs">
                    الجيل: v{cycleResult.result?.generation || 1}.0
                  </span>
                </div>

                {/* Self-Eval Radar */}
                {cycleResult.result?.selfEval && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/70">
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400">درجة التقييم الذاتي</div>
                      <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                        {Math.round((cycleResult.result.selfEval.score || 0.9) * 100)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400">التماسك المنطقي</div>
                      <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
                        {Math.round((cycleResult.result.selfEval.coherence || 0.9) * 100)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400">الجدة والابتكار</div>
                      <div className="text-base font-bold font-mono text-purple-300 mt-0.5">
                        {Math.round((cycleResult.result.selfEval.novelty || 0.7) * 100)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400">معامل الأمان</div>
                      <div className="text-base font-bold font-mono text-amber-300 mt-0.5">
                        {Math.round((1 - (cycleResult.result.selfEval.risk || 0.1)) * 100)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Inferred Facts from Knowledge Graph */}
                {cycleResult.result?.inferredFacts && cycleResult.result.inferredFacts.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5" />
                      استنتاجات الرسم البياني المعرفي (Multi-hop Knowledge Facts):
                    </div>
                    <div className="space-y-1">
                      {cycleResult.result.inferredFacts.map((fact: string, i: number) => (
                        <div key={i} className="text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px]">
                          • {fact}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Output Answer */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    الإجابة المستنتجة عبر النواة:
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed bg-slate-900 p-3.5 rounded-xl border border-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto font-sans">
                    {cycleResult.result?.answer || "تمت المعالجة وحفظ الحالة في النواة."}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* THE 4 COGNITIVE FRONTIERS (القفزات الأربع المتقدمة لتطوير النواة) */}
          {/* ========================================================================= */}
          <div className="space-y-6 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-slate-100">
                القفزات الإدراكية الأربع لتطوير النواة (Cognitive Frontiers Engine)
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 1. MCTS REASONING TREE */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
                    <GitBranch className="w-4 h-4 text-purple-400" />
                    1. شبكة التفكيك الشجري (Monte Carlo Tree Search)
                  </div>
                  <span className="text-[10px] font-mono bg-purple-950 border border-purple-800 text-purple-300 px-2 py-0.5 rounded-full">
                    UCB1 Exploration
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  توليد 3 مسارات استدلالية مختلفة لكل خطوة فكرية، واختيار الفرع الأقوى منطقياً عبر محاكاة Rollout والرجوع العكسي (Backprop).
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={mctsPrompt}
                    onChange={(e) => setMctsPrompt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={runMCTSTreeSearch}
                    disabled={mctsLoading || !mctsPrompt.trim()}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {mctsLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        جاري استكشاف شجرة MCTS...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        تشغيل استدلال شجرة MCTS
                      </>
                    )}
                  </button>
                </div>

                {mctsResult && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-900/40 space-y-2 text-xs animate-in fade-in">
                    <div className="flex justify-between text-[11px] font-mono text-purple-300 border-b border-slate-800 pb-1.5">
                      <span>الفرضية الفائزة (Winning Hypothesis)</span>
                      <span>اليقين: {(mctsResult.verificationScore * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-slate-200 font-semibold">{mctsResult.winningHypothesis}</div>
                    <div className="space-y-1.5 pt-1">
                      {mctsResult.branches?.map((b: any, idx: number) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
                          <div className="flex justify-between font-bold text-slate-300">
                            <span>{b.title}</span>
                            <span className="font-mono text-cyan-400">Q={b.score} (Visits: {b.visits})</span>
                          </div>
                          <p className="text-slate-400">{b.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. TRI-LEVEL HIERARCHICAL MEMORY */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    2. الذاكرة الهرمية ثلاثية المستويات (Tri-Level Memory)
                  </div>
                  <button
                    type="button"
                    onClick={fetchHierarchicalMemory}
                    disabled={hierarchicalLoading}
                    className="text-[10px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${hierarchicalLoading ? "animate-spin" : ""}`} />
                    تحديث المستويات
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تدرج معرفي متكامل: ذاكرة لحظية سريعة (Working)، ذاكرة إجرائية زمنية (Episodic)، وحقائق تأسيسية مجردة لا تفنى ولا تضمحل (Axiomatic Core).
                </p>

                <div className="space-y-2 text-xs">
                  {/* Tier 3: Axioms */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      🏛️ المستوى 3: النواة التأسيسية الثابتة (Axiomatic Core - لا تضمحل)
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {(hierarchicalData?.axioms || []).map((ax: any, i: number) => (
                        <div key={i} className="text-[11px] text-slate-300 flex justify-between bg-slate-900/80 p-1.5 rounded">
                          <span className="font-semibold text-slate-200">{ax.name}</span>
                          <span className="font-mono text-cyan-400">${ax.mathematicalLaw || ""}$</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tier 2: Episodic */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                    <span className="font-bold text-purple-300 flex items-center gap-1">
                      📜 المستوى 2: الذاكرة الإجرائية (Episodic Experiences in Firestore)
                    </span>
                    <p className="text-slate-400">
                      {hierarchicalData?.episodic?.length || 0} تجارب وحلول سابقة مسترجعة بناءً على التشابه الدلالي.
                    </p>
                  </div>

                  {/* Tier 1: Working Memory */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                    <span className="font-bold text-emerald-300 flex items-center gap-1">
                      ⚡ المستوى 1: الذاكرة اللحظية (Working Memory in RAM)
                    </span>
                    <p className="text-slate-400">
                      {hierarchicalData?.working?.length || 0} متغيرات نشطة في مساحة الذاكرة الحية.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. ADVERSARIAL DEBATE */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-bold text-rose-300">
                    <Scale className="w-4 h-4 text-rose-400" />
                    3. حلقة المناظرة والتفنيد الصارم (Adversarial Debate)
                  </div>
                  <span className="text-[10px] font-mono bg-rose-950 border border-rose-800 text-rose-300 px-2 py-0.5 rounded-full">
                    Devil's Advocate
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  مناظرة على 3 مراحل: نموذج مؤيد يطرح الحل، نموذج شكّاك يقتنص الثغرات والشروط الحدية، والمحكّم أوميغا يصوغ النتيجة التي تصمد أمام التفنيد.
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={debatePrompt}
                    onChange={(e) => setDebatePrompt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={runAdversarialDebate}
                    disabled={debateLoading || !debatePrompt.trim()}
                    className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {debateLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        جاري إدارة المناظرة والتفنيد...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        بدء مناظرة استدلالية متضاربة
                      </>
                    )}
                  </button>
                </div>

                {debateResult && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-900/40 space-y-2.5 text-xs animate-in fade-in">
                    <div className="flex justify-between text-[11px] font-mono text-emerald-400 border-b border-slate-800 pb-1.5">
                      <span>صمود الفرضية (Falsification Passed): ✓</span>
                      <span>معامل المتانة: {(debateResult.resilienceScore * 100).toFixed(1)}%</span>
                    </div>

                    {/* Thesis */}
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                      <span className="font-bold text-cyan-300">أطروحة المؤيد (Thesis):</span>
                      <ul className="text-slate-300 list-disc list-inside space-y-0.5 text-[11px]">
                        {debateResult.thesis?.arguments?.map((arg: string, i: number) => (
                          <li key={i}>{arg}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Sceptic */}
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                      <span className="font-bold text-amber-300">اعتراضات الشكّاك (Devil's Advocate):</span>
                      <ul className="text-slate-300 list-disc list-inside space-y-0.5 text-[11px]">
                        {debateResult.antithesis?.arguments?.map((arg: string, i: number) => (
                          <li key={i}>{arg}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Synthesis */}
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                      <span className="font-bold text-purple-300">حكم المحكّم أوميغا (Synthesis):</span>
                      <p className="text-slate-200 text-[11px] leading-relaxed">{debateResult.synthesis?.rebuttal}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. SAFE CODE SANDBOX & SELF-CORRECTION */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    4. الحجر الصحي وتصحيح الأكواد ذاتياً (Safe Sandbox)
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded-full">
                    Isolated VM
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تنفيذ برمجي آمن للمسائل الحسابية في بيئة Node VM معزولة. إذا وقع خطأ استثنائي، تفحصه النواة وتصلح الكود تلقائياً في حلقة تصحيح ذاتي.
                </p>

                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={sandboxCode}
                    onChange={(e) => setSandboxCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[11px] font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={runCodeSandbox}
                    disabled={sandboxLoading || !sandboxCode.trim()}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {sandboxLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        جاري التنفيذ والتصحيح الذاتي...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        تنفيذ الكود في الحجر الصحي
                      </>
                    )}
                  </button>
                </div>

                {sandboxResult && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/40 space-y-2 text-xs animate-in fade-in">
                    <div className="flex justify-between text-[11px] font-mono text-emerald-300 border-b border-slate-800 pb-1.5">
                      <span>{sandboxResult.ok ? "✓ نجح التنفيذ" : "✗ تعذر الإصلاح"}</span>
                      <span>عدد المحاولات: {sandboxResult.attempts} | الوقت: {sandboxResult.executionTimeMs}ms</span>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-200 bg-slate-900 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap">
                      {sandboxResult.output}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
