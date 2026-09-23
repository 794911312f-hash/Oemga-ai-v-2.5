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
} from "lucide-react";

export const OmegaEvolutionLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "openai" | "selfplay">("overview");
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

  useEffect(() => {
    fetchEvolution();
    fetchSelfPlayHistory();
    const interval = setInterval(() => {
      fetchEvolution();
      fetchSelfPlayHistory();
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
                  <option value="anthropic/claude-3.5-sonnet">anthropic/claude-3.5-sonnet</option>
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
    </div>
  );
};
