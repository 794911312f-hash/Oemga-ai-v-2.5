/**
 * src/components/omega/OmegaProviderManagerTab.tsx
 * =====================================================================
 * Omega Media Router & Provider Manager Studio (لوحة إدارة وموجه مزودي الوسائط)
 * ---------------------------------------------------------------------
 * Real-time Multi-Provider Management for:
 * 1. Hugging Face Inference Providers (Unified HF API: fal, Replicate, Together)
 * 2. fal.ai (Ultra-fast FLUX, Kling, Wan 2.2, Stable Video, Vidu)
 * 3. Replicate (Wan 2.2, HunyuanVideo, CogVideoX, XTTS-v2)
 * 4. Together AI (FLUX.1 Schnell/Dev, Llama, Qwen)
 * 5. Zero-Token Neural Stream (Direct High-Res Generative Fallback)
 * 
 * Features:
 * - Dynamic Latency, Success Rate (Psi), Cost, and Quality Tracking
 * - Key Management (hfToken, falKey, replicateToken, togetherKey)
 * - Live Ping / Health Latency Test
 * - Interactive Generation Sandbox with Visual Fallback Cascade Trace
 * =====================================================================
 */

import React, { useState, useEffect } from "react";
import {
  Server,
  Zap,
  Activity,
  ShieldCheck,
  Key,
  RefreshCw,
  Sparkles,
  Film,
  Image as ImageIcon,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Download,
  Play,
  Clock,
  Coins,
  Award,
  Layers,
  Check,
  Eye,
  EyeOff,
  Radio,
  Share2,
  Workflow,
  Cpu,
} from "lucide-react";
import {
  globalMediaRouter,
  type ProviderMetric,
  type MediaProviderId,
  type MediaGenerationType,
  type UniversalMediaResponse,
} from "../../lib/omega/universalMediaRouter";

export const OmegaProviderManagerTab: React.FC = () => {
  const [providers, setProviders] = useState<ProviderMetric[]>([]);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Ping State
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { latencyMs: number; ok: boolean; statusText: string }>>({});

  // Interactive Test Sandbox State
  const [testType, setTestType] = useState<MediaGenerationType>("image");
  const [testPrompt, setTestPrompt] = useState<string>(
    "A photorealistic visualization of quantum entanglement and spacetime curvature, glowing cyan and violet particles, 8k resolution, cinematic lighting"
  );
  const [testPreference, setTestPreference] = useState<MediaProviderId | "auto">("auto");
  const [isTestingGen, setIsTestingGen] = useState(false);
  const [testResult, setTestResult] = useState<UniversalMediaResponse | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const refreshProviderData = () => {
    setProviders(globalMediaRouter.getProvidersList());
    setKeys(globalMediaRouter.getSavedKeys());
  };

  useEffect(() => {
    refreshProviderData();
  }, []);

  const handleSaveKeys = () => {
    setIsSavingKeys(true);
    globalMediaRouter.saveKeys(keys);
    setTimeout(() => {
      setIsSavingKeys(false);
      setSaveSuccessMsg("تم حفظ مفاتيح المزودين بأمان وتحديث طبقة التوجيه الذكية!");
      refreshProviderData();
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }, 400);
  };

  const handlePingProvider = async (providerId: MediaProviderId) => {
    setPingingId(providerId);
    try {
      const res = await globalMediaRouter.pingProvider(providerId);
      setPingResults((prev) => ({ ...prev, [providerId]: res }));
      refreshProviderData();
    } catch (err: any) {
      setPingResults((prev) => ({
        ...prev,
        [providerId]: { latencyMs: 9999, ok: false, statusText: err?.message || "Error" },
      }));
    } finally {
      setPingingId(null);
    }
  };

  const handlePingAll = async () => {
    for (const p of providers) {
      await handlePingProvider(p.id);
    }
  };

  const handleRunTestGeneration = async () => {
    if (!testPrompt.trim()) return;
    setIsTestingGen(true);
    setTestError(null);
    setTestResult(null);

    try {
      const res = await globalMediaRouter.dispatchGeneration({
        type: testType,
        prompt: testPrompt,
        preferredProvider: testPreference,
        keys: keys,
        aspectRatio: "16:9",
        durationSeconds: testType === "video" ? 8 : undefined,
      });

      if (res && res.ok) {
        setTestResult(res);
        refreshProviderData();
      } else {
        setTestError(res?.error || "تعذر التوليد عبر سلسلة المزودين");
      }
    } catch (err: any) {
      setTestError(err?.message || "حدث خطأ غير متوقع أثناء المعالجة");
    } finally {
      setIsTestingGen(false);
    }
  };

  const presets = [
    {
      type: "image" as const,
      label: "صورة علمية: تشابك كمي وانحناء الزمكان",
      prompt: "A photorealistic visualization of quantum entanglement and spacetime curvature, glowing cyan and violet particles, 8k resolution, cinematic lighting",
    },
    {
      type: "video" as const,
      label: "فيديو سينمائي: رحلة في أعماق مجرة حلزونية",
      prompt: "Cinematic cosmic camera travel through a luminous spiral nebula with radiant interstellar dust and newborn stars, Wan 2.2 motion dynamics, ultra high quality",
    },
    {
      type: "image" as const,
      label: "لوحة فلسفية: شجرة المعرفة والوعي الكوني",
      prompt: "Surrealistic sacred geometry painting representing consciousness and the tree of knowledge, radiant celestial light, intricate details, 8k masterpiece",
    },
  ];

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-300" dir="rtl">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-slate-900 border border-purple-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 shadow">
              <Server className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                طبقة توجيه الوسائط ومدير المزودين الذكي
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-300 border border-purple-700/50">
                  Media Router & Provider Manager
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                منظومة موحدة لا تعتمد على مزود واحد: توجيه ديناميكي للصور، الفيديو، والصوت مع قواطع حماية (Circuit Breaker) وسلسلة انتقال تلقائية فورية (Fallback Chain).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePingAll}
            disabled={!!pingingId}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pingingId ? "animate-spin text-purple-400" : "text-cyan-400"}`} />
            <span>فحص سرعة استجابة المزودين (Ping All)</span>
          </button>
        </div>

        {/* Architecture Routing Pipeline Visual */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-900/40">
          <div className="text-[11px] font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
            <Workflow className="w-3.5 h-3.5 text-purple-400" />
            <span>بنية التوجيه المتعدد (Multi-Tier Router Architecture):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-600/40 flex flex-col justify-center items-center">
              <span className="font-bold text-purple-300 text-xs">Omega AI Kernel</span>
              <span className="text-[9px] text-slate-400">الطلب الأصلي</span>
            </div>
            <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-600/40 flex flex-col justify-center items-center">
              <span className="font-bold text-indigo-300 text-xs">Universal Router</span>
              <span className="text-[9px] text-slate-400">اختيار الأفضل ELO & $\Psi$</span>
            </div>
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-600/40 flex flex-col justify-center items-center">
              <span className="font-bold text-blue-300 text-xs">1st Provider (Fastest)</span>
              <span className="text-[9px] text-emerald-400">fal.ai / Together / HF</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-600/40 flex flex-col justify-center items-center">
              <span className="font-bold text-amber-300 text-xs">Fallback Cascade</span>
              <span className="text-[9px] text-amber-400">Replicate / Multi-node</span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-600/40 flex flex-col justify-center items-center">
              <span className="font-bold text-emerald-300 text-xs">Zero-Token Stream</span>
              <span className="text-[9px] text-emerald-300">شبكة أمان مجانية 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Matrix Cards & Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>سجل أداء وتصنيف مزودي الخدمات (Provider Telemetry Ledger)</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">
            {providers.length} مزودين مدمجين
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {providers.map((p) => {
            const ping = pingResults[p.id];
            const isPinging = pingingId === p.id;
            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  p.isConfigured || p.category === "free_tier"
                    ? "bg-slate-900/80 border-slate-700/80 shadow-md"
                    : "bg-slate-950/60 border-slate-800/80 opacity-90"
                }`}
              >
                <div>
                  {/* Top line: Name & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>{p.nameAr}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.name}</div>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                        p.isConfigured || p.category === "free_tier"
                          ? "bg-emerald-950/90 text-emerald-300 border-emerald-600/50"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {p.category === "free_tier"
                        ? "مفعل مجاناً"
                        : p.isConfigured
                        ? "المفتاح جاهز"
                        : "متاح (يحتاج مفتاح)"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                    {p.descriptionAr}
                  </p>

                  {/* Supported Media Icons */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-[10px] text-slate-400">الوسائط المدعومة:</span>
                    <div className="flex items-center gap-1">
                      {p.supportedTypes.includes("image") && (
                        <span className="px-1.5 py-0.5 rounded bg-pink-950/70 border border-pink-700/40 text-[9px] text-pink-300 flex items-center gap-1">
                          <ImageIcon className="w-2.5 h-2.5" /> صور
                        </span>
                      )}
                      {p.supportedTypes.includes("video") && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-700/40 text-[9px] text-cyan-300 flex items-center gap-1">
                          <Film className="w-2.5 h-2.5" /> فيديو
                        </span>
                      )}
                      {p.supportedTypes.includes("voice") && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-700/40 text-[9px] text-purple-300 flex items-center gap-1">
                          <Volume2 className="w-2.5 h-2.5" /> صوت
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Telemetry Metrics Bar */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] mb-3">
                    {/* Latency */}
                    <div className="text-center">
                      <div className="text-slate-400 flex items-center justify-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-amber-400" /> زمن الاستجابة
                      </div>
                      <div className="font-mono font-bold text-amber-300 text-xs mt-0.5">
                        {ping ? `${ping.latencyMs}ms` : `${p.latencyMs}ms`}
                      </div>
                    </div>

                    {/* Success Rate */}
                    <div className="text-center border-x border-slate-800">
                      <div className="text-slate-400 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> الثقة $\Psi$
                      </div>
                      <div className="font-mono font-bold text-emerald-300 text-xs mt-0.5">
                        {Math.round(p.successRate * 100)}%
                      </div>
                    </div>

                    {/* Quality */}
                    <div className="text-center">
                      <div className="text-slate-400 flex items-center justify-center gap-1">
                        <Award className="w-2.5 h-2.5 text-purple-400" /> الجودة
                      </div>
                      <div className="font-mono font-bold text-purple-300 text-xs mt-0.5">
                        {p.qualityRating}/10
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Coins className="w-3 h-3 text-slate-500" />
                    {p.costRatingAr}
                  </span>

                  <button
                    type="button"
                    onClick={() => handlePingProvider(p.id)}
                    disabled={isPinging}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    <Activity className={`w-3 h-3 ${isPinging ? "animate-spin text-cyan-400" : "text-slate-400"}`} />
                    <span>{isPinging ? "جاري الفحص..." : "فحص (Ping)"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* API Key Management Form */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">إعداد مفاتيح المزودين السحابية (API Keys)</h4>
          </div>
          <span className="text-[10px] text-slate-400">
            تُحفظ محلياً بأمان في متصفحك ولا تُشارك مع أي طرف
          </span>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Hugging Face Token */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-purple-300">
                1. Hugging Face Inference Token (HF):
              </label>
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-purple-400 hover:underline"
              >
                احصل على مفتاح مجاني ↗
              </a>
            </div>
            <div className="relative">
              <input
                type={showKeys.hfToken ? "text" : "password"}
                value={keys.hfToken || ""}
                onChange={(e) => setKeys((prev) => ({ ...prev, hfToken: e.target.value }))}
                placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowKeys((p) => ({ ...p, hfToken: !p.hfToken }))}
                className="absolute left-2.5 top-2 text-slate-400 hover:text-white"
              >
                {showKeys.hfToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* fal.ai Key */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-cyan-300">
                2. fal.ai API Key:
              </label>
              <a
                href="https://fal.ai/dashboard/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-cyan-400 hover:underline"
              >
                احصل على رصيد ترحيبي ↗
              </a>
            </div>
            <div className="relative">
              <input
                type={showKeys.falKey ? "text" : "password"}
                value={keys.falKey || ""}
                onChange={(e) => setKeys((prev) => ({ ...prev, falKey: e.target.value }))}
                placeholder="fal_key_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowKeys((p) => ({ ...p, falKey: !p.falKey }))}
                className="absolute left-2.5 top-2 text-slate-400 hover:text-white"
              >
                {showKeys.falKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Replicate Token */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-indigo-300">
                3. Replicate API Token:
              </label>
              <a
                href="https://replicate.com/account/api-tokens"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-indigo-400 hover:underline"
              >
                حساب Replicate ↗
              </a>
            </div>
            <div className="relative">
              <input
                type={showKeys.replicateToken ? "text" : "password"}
                value={keys.replicateToken || ""}
                onChange={(e) => setKeys((prev) => ({ ...prev, replicateToken: e.target.value }))}
                placeholder="r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowKeys((p) => ({ ...p, replicateToken: !p.replicateToken }))}
                className="absolute left-2.5 top-2 text-slate-400 hover:text-white"
              >
                {showKeys.replicateToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Together AI Key */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-amber-300">
                4. Together AI API Key:
              </label>
              <a
                href="https://api.together.ai/settings/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-amber-400 hover:underline"
              >
                رصيد Together مجاني ↗
              </a>
            </div>
            <div className="relative">
              <input
                type={showKeys.togetherKey ? "text" : "password"}
                value={keys.togetherKey || ""}
                onChange={(e) => setKeys((prev) => ({ ...prev, togetherKey: e.target.value }))}
                placeholder="together_key_xxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowKeys((p) => ({ ...p, togetherKey: !p.togetherKey }))}
                className="absolute left-2.5 top-2 text-slate-400 hover:text-white"
              >
                {showKeys.togetherKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveKeys}
            disabled={isSavingKeys}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 cursor-pointer disabled:opacity-50"
          >
            {isSavingKeys ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>حفظ المفاتيح وتحديث الراوتر</span>
          </button>
        </div>
      </div>

      {/* Interactive Media Routing Test Sandbox */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">مختبر التوليد والتوجيه المباشر (Multi-Provider Generation Sandbox)</h4>
          </div>
          <span className="text-[11px] text-cyan-300 font-mono">
            تجربة التوليد مع فحص مسار الـ Fallback تلقائياً
          </span>
        </div>

        {/* Media Type & Preferred Provider Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الوسيط التوليدي:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTestType("image")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  testType === "image"
                    ? "bg-purple-950/80 border-purple-400 text-purple-200 ring-1 ring-purple-400/40"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>صور (Image)</span>
              </button>
              <button
                type="button"
                onClick={() => setTestType("video")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  testType === "video"
                    ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>فيديو (Video)</span>
              </button>
              <button
                type="button"
                onClick={() => setTestType("voice")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  testType === "voice"
                    ? "bg-emerald-950/80 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/40"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>صوت (Voice)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">مزود الخدمة المستهدف:</label>
            <select
              value={testPreference}
              onChange={(e) => setTestPreference(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="auto">توجيه ذكي تلقائي (Auto-Cascade: الأسرع فالأعلى دقة)</option>
              <option value="huggingface">Hugging Face (FLUX / Wan 2.1 / Kokoro)</option>
              <option value="fal_ai">fal.ai (Real-time FLUX / Wan 2.2)</option>
              <option value="together_ai">Together AI (FLUX.1-schnell Ultra-fast)</option>
              <option value="replicate">Replicate (Hunyuan / XTTS v2)</option>
              <option value="pollinations_free">Zero-Token Neural Stream (Free Stream)</option>
            </select>
          </div>
        </div>

        {/* Prompt Input & Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">وصف المشهد أو النص التوليدي (Prompt):</label>
          <textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none font-sans"
            placeholder="اكتب وصف المشهد باللغة العربية أو الإنجليزية..."
          />

          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTestType(p.type);
                  setTestPrompt(p.prompt);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors cursor-pointer text-right"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleRunTestGeneration}
            disabled={isTestingGen || !testPrompt.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isTestingGen ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري استدعاء سلسلة التوجيه...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>تشغيل التوليد الفوري (Execute Router Dispatch)</span>
              </>
            )}
          </button>
        </div>

        {/* Test Result Presentation */}
        {testResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">نجح التوجيه والتوليد بنجاح!</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/50">
                  المزود: {testResult.providerName}
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  زمن التنفيذ: {testResult.latencyMs}ms
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  ثقة $\Psi$: {Math.round(testResult.psiConfidence * 100)}%
                </span>
              </div>
            </div>

            {/* Fallback Trace View */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
              <span className="text-slate-400 block mb-1 font-semibold">مسار انتقال الطلب الفعلي (Fallback Execution Trace):</span>
              <div className="flex items-center flex-wrap gap-1.5 text-[10px]">
                {testResult.fallbackChain.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                      {step}
                    </span>
                    {idx < testResult.fallbackChain.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-500 rotate-180" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Media Preview Player */}
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black flex flex-col items-center justify-center p-2">
              {testResult.type === "video" ? (
                <div className="w-full max-w-xl aspect-video rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center relative">
                  <img
                    src={testResult.mediaUrl}
                    alt="Video Motion Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 backdrop-blur text-[10px] text-cyan-300 font-mono">
                    {testResult.modelUsed} • {testResult.durationSeconds || 8}s
                  </div>
                </div>
              ) : testResult.type === "voice" ? (
                <div className="w-full p-4 flex items-center justify-between gap-3 bg-slate-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-purple-400" />
                    <span className="text-xs text-slate-200">تم توليد المقطع الصوتي بنجاح</span>
                  </div>
                  <a
                    href={testResult.mediaUrl}
                    download="omega-audio.wav"
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل الصوت (WAV)</span>
                  </a>
                </div>
              ) : (
                <div className="w-full max-w-xl rounded-lg overflow-hidden">
                  <img
                    src={testResult.mediaUrl}
                    alt="Generated Media"
                    className="w-full max-h-[380px] object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Download & Copy Links */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <a
                href={testResult.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 cursor-pointer"
              >
                <span>فتح الرابط الأصلي ↗</span>
              </a>
              <a
                href={testResult.mediaUrl}
                download={`omega-${testResult.type}-${Date.now()}`}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل الوسيط المولد</span>
              </a>
            </div>
          </div>
        )}

        {testError && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{testError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
