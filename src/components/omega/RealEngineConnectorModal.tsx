/**
 * src/components/omega/RealEngineConnectorModal.tsx
 * =====================================================================
 * Omega Real Engine & Hardware Connector Modal
 * ---------------------------------------------------------------------
 * Allows users to connect their local GPU instances (Ollama, ComfyUI, vLLM)
 * and view live diagnostics, ping latency, and model lists.
 * =====================================================================
 */

import React, { useState, useEffect } from "react";
import {
  Server,
  Cpu,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ExternalLink,
  Loader2,
  HardDrive,
  Activity,
  Check,
} from "lucide-react";
import {
  globalLocalEngineBridge,
  type EngineHealthStatus,
  type LocalEngineConfig,
} from "../../lib/omega/localEngineBridge";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RealEngineConnectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<LocalEngineConfig>(() => globalLocalEngineBridge.getConfig());
  const [ollamaStatus, setOllamaStatus] = useState<EngineHealthStatus | null>(null);
  const [comfyStatus, setComfyStatus] = useState<EngineHealthStatus | null>(null);
  const [customStatus, setCustomStatus] = useState<EngineHealthStatus | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  const runDiagnostics = async () => {
    setIsTesting(true);
    try {
      const [ollama, comfy, custom] = await Promise.all([
        globalLocalEngineBridge.checkOllamaHealth(config.ollamaUrl),
        globalLocalEngineBridge.checkComfyUiHealth(config.comfyUiUrl),
        globalLocalEngineBridge.checkCustomOpenAiHealth(config.customOpenAiUrl),
      ]);
      setOllamaStatus(ollama);
      setComfyStatus(comfy);
      setCustomStatus(custom);
    } catch (e) {
      console.error("Diagnostic error:", e);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    globalLocalEngineBridge.saveConfig(config);
    setSaveSuccess(true);
    runDiagnostics();
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-2xl p-4 sm:p-6 text-slate-100 flex flex-col gap-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-inner">
              <Server className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>جسر الخوادم والعتاد المحلي الحقيقي</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Local GPU & Engine Bridge
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ربط أوميغا بسيرفراتك المحلية (Ollama, ComfyUI, vLLM) لتنفيذ الاستدلال الحقيقي على كرت الشاشة.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Engine Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Ollama Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>خادم Ollama المحلي</span>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    ollamaStatus?.isOnline ? "bg-emerald-400 animate-pulse" : "bg-red-500"
                  }`}
                  title={ollamaStatus?.isOnline ? "متصل (Online)" : "غير متصل"}
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">عنوان الرابط (Endpoint):</label>
                  <input
                    type="text"
                    value={config.ollamaUrl}
                    onChange={(e) => setConfig({ ...config, ollamaUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">النموذج النشط (Model):</label>
                  <input
                    type="text"
                    value={config.ollamaModel}
                    onChange={(e) => setConfig({ ...config, ollamaModel: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] pt-2 border-t border-slate-800/80">
              {ollamaStatus?.isOnline ? (
                <div className="text-emerald-400 flex items-center justify-between">
                  <span>الاستجابة: {ollamaStatus.latencyMs}ms</span>
                  <span className="text-[10px] text-slate-400">
                    {ollamaStatus.availableModels.length} نماذج متوفرة
                  </span>
                </div>
              ) : (
                <span className="text-slate-500">{ollamaStatus?.error || "الخادم غير متصل"}</span>
              )}
            </div>
          </div>

          {/* 2. ComfyUI Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>ComfyUI توليد الفيديو</span>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    comfyStatus?.isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-500"
                  }`}
                  title={comfyStatus?.isOnline ? "متصل" : "بانتظار التشغيل"}
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">عنوان سيرفر ComfyUI:</label>
                  <input
                    type="text"
                    value={config.comfyUiUrl}
                    onChange={(e) => setConfig({ ...config, comfyUiUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] pt-2 border-t border-slate-800/80">
              {comfyStatus?.isOnline ? (
                <span className="text-emerald-400">متصل وجاهز للإنتاج ({comfyStatus.latencyMs}ms)</span>
              ) : (
                <span className="text-slate-500">يتطلب تشغيل ComfyUI محلياً</span>
              )}
            </div>
          </div>

          {/* 3. OpenAI-Compatible Custom Card (LM Studio / vLLM) */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span>LM Studio / vLLM</span>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    customStatus?.isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                  }`}
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">عنوان الرابط (Base URL):</label>
                  <input
                    type="text"
                    value={config.customOpenAiUrl}
                    onChange={(e) => setConfig({ ...config, customOpenAiUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] pt-2 border-t border-slate-800/80">
              {customStatus?.isOnline ? (
                <span className="text-emerald-400">متصل ({customStatus.availableModels.length} نماذج)</span>
              ) : (
                <span className="text-slate-500">جاهز للربط عبر المنفذ</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={runDiagnostics}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
          >
            {isTesting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>إعادة فحص الاتصال</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>تم حفظ الإعدادات!</span>
                </>
              ) : (
                <span>حفظ وتفعيل الجسر</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
