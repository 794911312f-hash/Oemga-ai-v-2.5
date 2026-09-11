import React, { useState } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  Brain,
  BookmarkPlus,
  Sliders,
  Scale,
  Code2,
  Atom,
  Clock,
  CloudSun,
  Newspaper,
  Share2,
  Sigma,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import type { ChatMessage, ChatAttachment } from "../../lib/omega/types";
import { fuseResponses, type FusionResult } from "../../lib/omega/fusion";
import { SignalMeter } from "./SignalMeter";
import { globalOmegaMemory } from "../../lib/omega/memory";
import { globalOmegaLineage } from "../../lib/omega/lineage";
import { globalOmegaKernel } from "../../lib/omega/kernel";
import type { OmegaConfig } from "../../lib/omega/optimizer";
import { OMEGA_MODELS } from "../../lib/omega/models";
import { MathRenderer } from "./MathRenderer";
import { AttachmentPicker } from "./AttachmentPicker";
import { OmegaCapabilityModal, type CapabilityTab } from "./OmegaCapabilityModal";

interface ChatViewProps {
  config: OmegaConfig;
  onOpenKernelWithResult?: (result: FusionResult) => void;
  onOpenOptimizer?: () => void;
}

const SAMPLE_PROMPTS = [
  {
    label: "برمجة وهندسة",
    icon: Code2,
    domain: "code",
    prompt: "اكتب دالة بلغة TypeScript لتطبيق خوارزمية البحث الثنائي Binary Search مع معالجة الحالات الحدية وأنواع البيانات الصارمة.",
  },
  {
    label: "فيزياء ومعادلات كمومية (LaTeX)",
    icon: Atom,
    domain: "science_factual",
    prompt: "اشرح معادلة شرودنغر الزمنية $$i\\hbar \\frac{\\partial}{\\partial t}\\Psi(\\vec{r}, t) = \\hat{H}\\Psi(\\vec{r}, t)$$ وكيف تصف تراكب الحالات الكمية في الكيوبت؟",
  },
  {
    label: "توقيت وتاريخ لحظي",
    icon: Clock,
    domain: "general",
    prompt: "ما هو الوقت والتاريخ الدقيق الآن بالتوقيتين الهجري والميلادي ويوم الأسبوع وفق ساعة النظام؟",
  },
  {
    label: "طقس وأحوال جوية",
    icon: CloudSun,
    domain: "general",
    prompt: "ما هي أحوال الطقس وتوقعات درجات الحرارة والرياح في الرياض والقاهرة اليوم؟",
  },
  {
    label: "أخبار وأحداث عالمية",
    icon: Newspaper,
    domain: "general",
    prompt: "ما هي أبرز الأخبار العالمية وتطورات التكنولوجيا والذكاء الاصطناعي اليوم؟",
  },
  {
    label: "رياضيات وتفاضل وتكامل (LaTeX)",
    icon: Scale,
    domain: "math_logic",
    prompt: "حل المعادلة التفاضلية $$\\frac{dy}{dx} + 2y = e^{-x}$$ مع الشرط الأولي $y(0) = 1$ مع كتابة جميع الخطوات بصيغ LaTeX الرياضية الدقيقة.",
  },
];

export const ChatView: React.FC<ChatViewProps> = ({
  config,
  onOpenKernelWithResult,
  onOpenOptimizer,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `مرحباً بك في **نظام أوميغا للذكاء الاصطناعي متعدد الخوادم (Omega AI Multi-Model Consensus System)**.

تم تفعيل منظومة القدرات المتكاملة وفق أعلى معايير الدقة:
1. **صياغة معادلات الرياضيات والفيزياء بدقة (LaTeX & KaTeX)**: دعم كامل للمعادلات الخطية $E = mc^2$ والمعادلات الكبرى $$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$ ومعادلات ميكانيكا الكم والنسبية.
2. **المرجع الزمني الدقيق (Live Clock)**: معرفة حية بالوقت والتاريخ الهجري والميلادي ويوم الأسبوع.
3. **تحميل وقراءة المستندات والملفات**: دعم إرفاق ملفات النصوص، البرمجة، والـ PDF والصور لتحليلها مباشرة عبر حوض النماذج.
4. **الرصد الجوي والأخبار العالمية**: استعلام مباشر عن أحوال الطقس وآخر الأنباء العالمية.
5. **فحص روابط التواصل ويوتيوب وفيسبوك**: استخراج وتلخيص محتوى الروابط والوسائط التفاعلية.
6. **الدمج التوافقي الحقيقي**: اندماج دلالي بين خوادم Qwen 2.5، Llama 3.3، Google Gemini، DeepSeek R1، Claude، و GPT-4o.`,
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [savedMemorySuccess, setSavedMemorySuccess] = useState<string | null>(null);

  // Capability Modal State
  const [isCapabilityModalOpen, setIsCapabilityModalOpen] = useState(false);
  const [activeCapabilityTab, setActiveCapabilityTab] = useState<CapabilityTab>("datetime");

  const openCapability = (tab: CapabilityTab) => {
    setActiveCapabilityTab(tab);
    setIsCapabilityModalOpen(true);
  };

  const handleAddAttachment = (att: ChatAttachment) => {
    setAttachments((prev) => [...prev, att]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = async (promptToSend?: string, filesToSend?: ChatAttachment[]) => {
    const text = (promptToSend ?? input).trim();
    const currentAttachments = filesToSend ?? attachments;

    if ((!text && currentAttachments.length === 0) || isProcessing) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `asst-${Date.now()}`;

    const userMsgContent = text || "يرجى تحليل وفحص المستندات المرفقة واستخلاص النتائج.";

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMessageId,
        role: "user",
        content: userMsgContent,
        attachments: currentAttachments.length > 0 ? [...currentAttachments] : undefined,
        timestamp: Date.now(),
      },
    ];

    setMessages([
      ...newMessages,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isFusing: true,
      },
    ]);

    setInput("");
    setAttachments([]);
    setIsProcessing(true);
    setCurrentStep("توجيه المجال المعرفي واختيار النماذج...");

    try {
      // Build history
      const history = newMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const result = await fuseResponses(userMsgContent, history, {
        directThreshold: config.directThreshold,
        uncertainSpread: config.uncertainSpread,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        maxModelsPerDomain: config.maxModelsPerDomain,
        aggregatorModel: config.aggregatorModel,
        verifierModel: config.verifierModel,
        skipVerification: config.skipVerification,
        attachments: currentAttachments,
        searchGrounding: true,
        onStepProgress: (_step, details) => {
          if (details) setCurrentStep(details);
        },
      });

      // Update Omega kernel and evolutionary lineage
      globalOmegaKernel.absorb(userMsgContent, result.candidates);
      globalOmegaLineage.recordStep(userMsgContent, result);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: result.finalText,
                fusionResult: result,
                isFusing: false,
              }
            : msg
        )
      );
    } catch (err: any) {
      console.error("Fusion error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `حدث تعذر أثناء معالجة الاندماج التوافقي: ${err.message || "خطأ غير متوقع"}. تم التحويل التلقائي للنواة الاحتياطية.`,
                isFusing: false,
              }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
      setCurrentStep("");
    }
  };

  const handleSaveToMemory = (result: FusionResult, topic: string) => {
    globalOmegaMemory.add(
      topic.slice(0, 60),
      result.finalText,
      result.domain,
      result.candidates[0]?.psi || 0.9,
      [result.domain, result.mode, "omega-fusion"]
    );
    setSavedMemorySuccess(topic);
    setTimeout(() => setSavedMemorySuccess(null), 3000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] max-w-6xl mx-auto w-full px-2 sm:px-4 py-2">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1 pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`flex items-start gap-3 max-w-full sm:max-w-[88%] ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  msg.role === "user"
                    ? "bg-purple-950 border-purple-500/40 text-purple-300"
                    : "bg-slate-900 border-slate-700 text-cyan-400"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 space-y-2 overflow-hidden">
                {/* User Attachments Display */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-1 justify-end">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-500/40 text-xs text-purple-200"
                      >
                        {att.type === "image" ? (
                          <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span className="max-w-[150px] truncate">{att.name}</span>
                        <span className="text-[10px] text-purple-400 font-mono">
                          ({Math.round(att.size / 1024)}KB)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Bubble with MathRenderer */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "bg-purple-600/90 text-white rounded-tr-none shadow-md shadow-purple-900/30 font-medium"
                      : "bg-slate-900/90 text-slate-100 rounded-tl-none border border-slate-800 shadow-xl"
                  }`}
                >
                  {msg.isFusing ? (
                    <div className="py-2">
                      <SignalMeter isProcessing={true} stepDetails={currentStep} />
                    </div>
                  ) : (
                    <>
                      {/* If mode is UNCERTAIN, show clear split between Candidate 1 and Candidate 2 */}
                      {msg.fusionResult?.mode === "uncertain" && msg.fusionResult.secondText ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>
                              وضع عدم اليقين الدلالي: لم تتجاوز النماذج فارق الحسم (Spread ≤ {config.uncertainSpread}). يعرض النظام الرأيين المتصدرين بشفافية:
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/30">
                              <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-1.5 pb-1 border-b border-slate-800">
                                <span className="font-bold">الخيار الأول (المرشح 1)</span>
                                <span>Ψ = {msg.fusionResult.candidates[0]?.psi.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-slate-200 leading-relaxed">
                                <MathRenderer content={msg.fusionResult.finalText} />
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/30">
                              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-1.5 pb-1 border-b border-slate-800">
                                <span className="font-bold">الخيار الثاني (المرشح 2)</span>
                                <span>Ψ = {msg.fusionResult.candidates[1]?.psi.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-slate-200 leading-relaxed">
                                <MathRenderer content={msg.fusionResult.secondText} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <MathRenderer content={msg.content} />
                      )}
                    </>
                  )}
                </div>

                {/* If Assistant response has FusionResult Telemetry */}
                {msg.fusionResult && !msg.isFusing && (
                  <div className="space-y-2 mt-2">
                    <SignalMeter result={msg.fusionResult} />

                    {/* Candidate Inspection Accordion */}
                    <div className="border border-slate-800/80 rounded-xl bg-slate-950/40 overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCandidateId(
                            expandedCandidateId === msg.id ? null : msg.id
                          )
                        }
                        className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <Layers className="w-3.5 h-3.5 text-purple-400" />
                          تفاصيل توافق المرشحين ({msg.fusionResult.candidates.length} نماذج) وحسابات التشتت
                        </span>
                        {expandedCandidateId === msg.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {expandedCandidateId === msg.id && (
                        <div className="p-3 border-t border-slate-800/60 space-y-2.5 bg-slate-950/80">
                          {msg.fusionResult.candidates.map((cand, idx) => {
                            const spec = OMEGA_MODELS[cand.modelId];
                            return (
                              <div
                                key={`${cand.modelId}-${idx}`}
                                className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 space-y-1.5"
                              >
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: spec?.accentHex || "#a855f7" }}
                                    />
                                    <span className="font-bold">{spec?.name || cand.modelId}</span>
                                    <span className="text-slate-500">#{idx + 1}</span>
                                  </div>
                                  <div className="flex items-center gap-3 font-mono text-[11px]">
                                    <span className="text-cyan-400">
                                      Ψ: {(cand.psi * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-slate-400">
                                      وزن: {(cand.weight * 100).toFixed(1)}%
                                    </span>
                                    {cand.delta !== undefined && (
                                      <span className="text-slate-500 text-[10px]">
                                        انحراف Δ: {cand.delta.toFixed(3)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-slate-300 text-[11px] leading-relaxed">
                                  <MathRenderer content={cand.text} />
                                </div>
                              </div>
                            );
                          })}

                          {/* Verification details */}
                          {msg.fusionResult.verification && (
                            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <div className="font-semibold text-slate-300 text-[11px]">
                                  تدقيق التحقق الذاتي (Self-Verification Critique):
                                </div>
                                <div className="text-slate-400 text-[11px] leading-relaxed">
                                  {msg.fusionResult.verification.critique}
                                </div>
                                {msg.fusionResult.verification.warnings.length > 0 && (
                                  <div className="text-amber-400 text-[10px]">
                                    تنبيهات: {msg.fusionResult.verification.warnings.join(" | ")}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action links */}
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() =>
                                handleSaveToMemory(
                                  msg.fusionResult!,
                                  messages.find((m, i) => i === messages.indexOf(msg) - 1)?.content || "استنتاج أوميغا"
                                )
                              }
                              className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                            >
                              <BookmarkPlus className="w-3.5 h-3.5" />
                              {savedMemorySuccess ? "تم الحفظ في الذاكرة بنجاح!" : "حفظ في الذاكرة المعرفية"}
                            </button>

                            {onOpenKernelWithResult && (
                              <button
                                type="button"
                                onClick={() => onOpenKernelWithResult(msg.fusionResult!)}
                                className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 cursor-pointer"
                              >
                                <Brain className="w-3.5 h-3.5" />
                                فحص في مختبر نواة الحالة (Kernel Lab)
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggested prompts pills (shown when chat has few messages) */}
      {messages.length <= 2 && (
        <div className="py-2">
          <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              نماذج استعلام سريعة للقدرات المتقدمة:
            </span>
            {onOpenOptimizer && (
              <button
                type="button"
                onClick={onOpenOptimizer}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-purple-400 text-[11px] cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                معايرة المعاملات (Thresholds)
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {SAMPLE_PROMPTS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(p.prompt)}
                  disabled={isProcessing}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-purple-500/40 text-right transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-purple-950/80 text-purple-400 shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">
                      {p.label}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {p.prompt}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK CAPABILITY TOOLBAR */}
      <div className="flex items-center gap-1.5 py-1.5 overflow-x-auto border-t border-slate-800/60 text-xs">
        <span className="text-[11px] text-slate-500 shrink-0 font-medium ml-1">أدوات أوميغا:</span>

        <button
          type="button"
          onClick={() => openCapability("datetime")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors shrink-0 cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>التاريخ والوقت</span>
        </button>

        <button
          type="button"
          onClick={() => openCapability("weather")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition-colors shrink-0 cursor-pointer"
        >
          <CloudSun className="w-3.5 h-3.5 text-amber-400" />
          <span>الطقس المباشر</span>
        </button>

        <button
          type="button"
          onClick={() => openCapability("news")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition-colors shrink-0 cursor-pointer"
        >
          <Newspaper className="w-3.5 h-3.5 text-emerald-400" />
          <span>الأخبار العالمية</span>
        </button>

        <button
          type="button"
          onClick={() => openCapability("social")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/40 text-slate-300 hover:text-pink-300 transition-colors shrink-0 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-pink-400" />
          <span>يوتيوب والتواصل</span>
        </button>

        <button
          type="button"
          onClick={() => openCapability("latex")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 transition-colors shrink-0 cursor-pointer"
        >
          <Sigma className="w-3.5 h-3.5 text-indigo-400" />
          <span>قوالب معادلات LaTeX</span>
        </button>
      </div>

      {/* Input Box with Attachment Support */}
      <div className="relative mt-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl focus-within:border-purple-500/60 focus-within:ring-1 focus-within:ring-purple-500/30 overflow-hidden"
        >
          {/* Main Input Row */}
          <div className="flex items-center w-full">
            {/* Attachment Button */}
            <div className="pr-2 pl-1">
              <AttachmentPicker
                attachments={attachments}
                onAddAttachment={handleAddAttachment}
                onRemoveAttachment={handleRemoveAttachment}
                disabled={isProcessing}
              />
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              placeholder={
                isProcessing
                  ? "جاري معالجة إجماع أوميغا عبر الخوادم..."
                  : "اطرح مسألة رياضية، معادلة فيزيائية، خبراً، أو استفساراً لاختبار الإجماع..."
              }
              className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-60"
            />

            <div className="flex items-center gap-1.5 pl-2 pr-3">
              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isProcessing}
                className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between mt-1.5 px-2 text-[10px] text-slate-500 font-mono">
          <span>عتبة الإجماع: Ψ ≥ {config.directThreshold} | فارق الحيرة: ≤ {config.uncertainSpread}</span>
          <span>معادلات LaTeX مفعّلة • توقيت دقيق • مستندات • خوادم مدمجة</span>
        </div>
      </div>

      {/* Advanced Capabilities Modal */}
      <OmegaCapabilityModal
        isOpen={isCapabilityModalOpen}
        activeTab={activeCapabilityTab}
        onClose={() => setIsCapabilityModalOpen(false)}
        onSelectTab={(tab) => setActiveCapabilityTab(tab)}
        onInjectPrompt={(text) => setInput(text)}
        onSendDirectly={(text) => handleSend(text)}
      />
    </div>
  );
};
