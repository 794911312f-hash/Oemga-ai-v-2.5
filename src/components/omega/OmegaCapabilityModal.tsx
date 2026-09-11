import React, { useState, useEffect } from "react";
import {
  Clock,
  CloudSun,
  Newspaper,
  Share2,
  Sigma,
  X,
  Search,
  ExternalLink,
  Check,
  Send,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { MathRenderer } from "./MathRenderer";

export type CapabilityTab = "datetime" | "weather" | "news" | "social" | "latex";

interface OmegaCapabilityModalProps {
  isOpen: boolean;
  activeTab: CapabilityTab;
  onClose: () => void;
  onSelectTab: (tab: CapabilityTab) => void;
  onInjectPrompt: (text: string) => void;
  onSendDirectly?: (prompt: string) => void;
}

export const OmegaCapabilityModal: React.FC<OmegaCapabilityModalProps> = ({
  isOpen,
  activeTab,
  onClose,
  onSelectTab,
  onInjectPrompt,
  onSendDirectly,
}) => {
  // --- Date & Time State ---
  const [dateTimeData, setDateTimeData] = useState<any>(null);
  const [loadingDateTime, setLoadingDateTime] = useState(false);

  // --- Weather State ---
  const [cityInput, setCityInput] = useState("الرياض");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  // --- News State ---
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  // --- Social / YouTube State ---
  const [socialUrl, setSocialUrl] = useState("");
  const [socialData, setSocialData] = useState<any>(null);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [socialError, setSocialError] = useState("");

  // --- LaTeX Formula Helper State ---
  const [selectedCategory, setSelectedCategory] = useState("quantum");

  // Fetch Date & Time
  const fetchDateTime = async () => {
    setLoadingDateTime(true);
    try {
      const res = await fetch("/api/omega/tools/datetime");
      const data = await res.json();
      if (data.ok) {
        setDateTimeData(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingDateTime(false);
    }
  };

  // Fetch Weather
  const fetchWeather = async (cityToFetch?: string) => {
    const city = cityToFetch || cityInput;
    if (!city.trim()) return;
    setLoadingWeather(true);
    setWeatherError("");
    try {
      const res = await fetch(`/api/omega/tools/weather?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (data.ok) {
        setWeatherData(data);
      } else {
        setWeatherError(data.error || "تعذر جلب بيانات الطقس لهذه المدينة");
      }
    } catch {
      setWeatherError("حدث خطأ في الاتصال بخدمة الطقس");
    } finally {
      setLoadingWeather(false);
    }
  };

  // Fetch News
  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const res = await fetch("/api/omega/tools/news");
      const data = await res.json();
      if (data.ok && Array.isArray(data.items)) {
        setNewsItems(data.items);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingNews(false);
    }
  };

  // Inspect Social URL
  const inspectSocial = async () => {
    if (!socialUrl.trim()) return;
    setLoadingSocial(true);
    setSocialError("");
    try {
      const res = await fetch("/api/omega/tools/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: socialUrl.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setSocialData(data);
      } else {
        setSocialError(data.error || "تعذر قراءة الرابط");
      }
    } catch {
      setSocialError("تعذر الاتصال بخادم فحص الروابط");
    } finally {
      setLoadingSocial(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === "datetime") fetchDateTime();
    if (activeTab === "weather" && !weatherData) fetchWeather("الرياض");
    if (activeTab === "news" && newsItems.length === 0) fetchNews();
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Formula presets
  const FORMULA_CATEGORIES: Record<string, { label: string; formulas: Array<{ name: string; latex: string; explanation: string }> }> = {
    quantum: {
      label: "فيزياء كمية",
      formulas: [
        {
          name: "معادلة شرودنغر المعتمدة على الزمن",
          latex: "i\\hbar \\frac{\\partial}{\\partial t}\\Psi(\\vec{r}, t) = \\left[ -\\frac{\\hbar^2}{2m}\\nabla^2 + V(\\vec{r}, t) \\right] \\Psi(\\vec{r}, t)",
          explanation: "المعادلة الأساسية التي تصف تطور الحالة الكمية للمنظومة الفيزيائية عبر الزمن.",
        },
        {
          name: "مبدأ عدم اليقين لهايزنبرغ",
          latex: "\\Delta x \\cdot \\Delta p_x \\ge \\frac{\\hbar}{2}",
          explanation: "استحالة قياس موضع جسيم وكمية حركته معاً بدقة مطلقة.",
        },
        {
          name: "معادلة ديراك للجسيمات النسبية",
          latex: "\\left( i\\gamma^\\mu \\partial_\\mu - m \\right) \\psi = 0",
          explanation: "تجمع بين ميكانيكا الكم والنسبية الخاصة وتنبأت بوجود المادة المضادة.",
        },
        {
          name: "تراكب الحالات الكمية (Superposition)",
          latex: "|\\psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle, \\quad |\\alpha|^2 + |\\beta|^2 = 1",
          explanation: "وصف حالة الكيوبت (Qubit) في الحوسبة الكمومية.",
        },
      ],
    },
    relativity: {
      label: "النسبية والكونيات",
      formulas: [
        {
          name: "تكافؤ الكتلة والطاقة (أينشتاين)",
          latex: "E^2 = (pc)^2 + (m_0 c^2)^2 \\implies E = m c^2",
          explanation: "العلاقة الشهيرة بين الطاقة الكلية، كمية الحركة، وكتلة السكون.",
        },
        {
          name: "معادلات أينشتاين للمجال التثاقلي",
          latex: "G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}",
          explanation: "تصف كيف يُحدد توزيع المادة والطاقة انحناء نسيج الزمكان.",
        },
        {
          name: "تحويلات لورنتز للزمن المتمدد",
          latex: "\\Delta t' = \\frac{\\Delta t}{\\sqrt{1 - \\frac{v^2}{c^2}}} = \\gamma \\Delta t",
          explanation: "ظاهرة تباطؤ وتمدد الزمن للأجسام المتحركة بسرعة قريبة من سرعة الضوء.",
        },
      ],
    },
    calculus: {
      label: "تفاضل وتكامل ورياضيات",
      formulas: [
        {
          name: "صيغة أويلر الشهيرة في التحليل المركب",
          latex: "e^{i\\pi} + 1 = 0 \\quad \\text{أو} \\quad e^{i\\theta} = \\cos\\theta + i\\sin\\theta",
          explanation: "تربط بين أهم خمسة ثوابت رياضية في معادلة واحدة بالغة الجمال والعمق.",
        },
        {
          name: "مبرهنة ستوكس التكاملية للتحليل المتجهي",
          latex: "\\oint_{\\partial S} \\vec{F} \\cdot d\\vec{r} = \\iint_S (\\nabla \\times \\vec{F}) \\cdot d\\vec{S}",
          explanation: "تربط تكامل المسار المغلق بالدوران السطحي للحقل المتجهي.",
        },
        {
          name: "متسلسلة تايلور للتقريب الرياضي",
          latex: "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x - a)^n",
          explanation: "تمثيل الدوال الرياضية القابلة للاشتقاق على شكل متسلسلة قوى غير منتهية.",
        },
      ],
    },
    mechanics: {
      label: "ميكانيكا وكهرومغناطيسية",
      formulas: [
        {
          name: "معادلات ماكسويل الأربعة في الكهرومغناطيسية",
          latex: "\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\epsilon_0}, \\quad \\nabla \\cdot \\vec{B} = 0, \\quad \\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}, \\quad \\nabla \\times \\vec{B} = \\mu_0 \\vec{J} + \\mu_0 \\epsilon_0 \\frac{\\partial \\vec{E}}{\\partial t}",
          explanation: "الأساس الموحد للكهرباء والمغناطيسية والموجات الضوئية الكهرومغناطيسية.",
        },
        {
          name: "معادلة أويلر-لاغرانج للحركة",
          latex: "\\frac{d}{dt}\\left( \\frac{\\partial L}{\\partial \\dot{q}_i} \\right) - \\frac{\\partial L}{\\partial q_i} = 0",
          explanation: "صياغة ميكانيكية متقدمة تعتمد على مبدأ الفعل الأصغر (Least Action Principle).",
        },
      ],
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-base font-bold text-slate-100">
              أدوات وقدرات نظام أوميغا المتقدمة (Omega Advanced Capabilities)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          <button
            type="button"
            onClick={() => onSelectTab("datetime")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "datetime"
                ? "bg-purple-600/90 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>الوقت والتاريخ الدقيق</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("weather")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "weather"
                ? "bg-purple-600/90 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <CloudSun className="w-4 h-4 text-amber-400" />
            <span>الطقس والأحوال الجوية</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("news")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "news"
                ? "bg-purple-600/90 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Newspaper className="w-4 h-4 text-emerald-400" />
            <span>الأخبار العالمية المباشرة</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("social")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "social"
                ? "bg-purple-600/90 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Share2 className="w-4 h-4 text-pink-400" />
            <span>يوتيوب والتواصل الاجتماعي</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("latex")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "latex"
                ? "bg-purple-600/90 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Sigma className="w-4 h-4 text-indigo-400" />
            <span>معادلات LaTeX (رياضيات وفيزياء)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {/* TAB 1: DATE & TIME */}
          {activeTab === "datetime" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">المرجع الزمني الدقيق لخوادم نظام أوميغا</h3>
                  <p className="text-xs text-slate-400">تزامن فوري مع التوقيت العالمي المنسق والتقويمين الهجري والميلادي.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchDateTime}
                  disabled={loadingDateTime}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDateTime ? "animate-spin" : ""}`} />
                  <span>تحديث الآن</span>
                </button>
              </div>

              {dateTimeData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20">
                    <span className="text-xs text-purple-400 font-semibold block mb-1">التوقيت المحلي الدقيق</span>
                    <span className="text-2xl font-mono font-bold text-white tracking-wider">{dateTimeData.time}</span>
                    <span className="text-[11px] text-slate-400 block mt-1">المنطقة الزمنية: {dateTimeData.timezone}</span>
                  </div>

                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20">
                    <span className="text-xs text-cyan-400 font-semibold block mb-1">التقويم الميلادي</span>
                    <span className="text-lg font-bold text-white">{dateTimeData.gregorianDate}</span>
                    <span className="text-xs text-slate-400 block mt-1">اليوم: {dateTimeData.dayOfWeek}</span>
                  </div>

                  {dateTimeData.hijriDate && (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 sm:col-span-2">
                      <span className="text-xs text-emerald-400 font-semibold block mb-1">التقويم الهجري (الموافق)</span>
                      <span className="text-lg font-bold text-white">{dateTimeData.hijriDate}</span>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 sm:col-span-2 font-mono text-xs text-slate-400 flex items-center justify-between">
                    <span>ISO 8601: {dateTimeData.iso}</span>
                    <span>Unix Timestamp: {dateTimeData.timestamp}</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  <span>جاري قراءة الوقت من خوادم النظام...</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const q = "ما هو التاريخ والوقت الدقيق الآن بتوقيتك والتقويمين الهجري والميلادي؟";
                    if (onSendDirectly) onSendDirectly(q);
                    else onInjectPrompt(q);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>طرح سؤال التوقيت على أوميغا</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: WEATHER */}
          {activeTab === "weather" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">الرصد الجوي والطقس العالمي</h3>
                  <p className="text-xs text-slate-400">استعلام حي عن درجات الحرارة والرطوبة وسرعة الرياح لأي مدينة.</p>
                </div>
              </div>

              {/* City search bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchWeather()}
                    placeholder="اكتب اسم أي مدينة (مثال: الرياض، القاهرة، مكة، دبي، لندن)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
                <button
                  type="button"
                  onClick={() => fetchWeather()}
                  disabled={loadingWeather || !cityInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loadingWeather ? <Loader2 className="w-4 h-4 animate-spin" /> : "استعلام"}
                </button>
              </div>

              {weatherError && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                  {weatherError}
                </div>
              )}

              {weatherData && !loadingWeather && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{weatherData.city}</span>
                        {weatherData.country && <span className="text-xs text-slate-400 font-normal">({weatherData.country})</span>}
                      </h4>
                      <p className="text-xs text-amber-400 font-medium mt-0.5">{weatherData.conditionAr} ({weatherData.conditionEn})</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-mono font-bold text-amber-300">{weatherData.temperature}°C</span>
                      <span className="text-[11px] text-slate-400 block">المحسوسة: {weatherData.apparentTemperature}°C</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">نسبة الرطوبة</span>
                      <span className="text-sm font-bold font-mono text-cyan-300">{weatherData.humidity}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">سرعة الرياح</span>
                      <span className="text-sm font-bold font-mono text-emerald-300">{weatherData.windSpeed} كم/س</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[11px] text-slate-400 block">الفترة الجوية</span>
                      <span className="text-sm font-bold text-purple-300">{weatherData.isDay ? "نهاراً" : "ليلاً"}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const q = `ما هي حالة الطقس وتوقعات الأرصاد الجوية اليوم في ${cityInput} بالتفصيل؟`;
                    if (onSendDirectly) onSendDirectly(q);
                    else onInjectPrompt(q);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-semibold hover:from-amber-500 hover:to-orange-500 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>طرح استفسار الطقس على أوميغا</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: NEWS */}
          {activeTab === "news" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">موجز الأخبار العالمية المباشرة</h3>
                  <p className="text-xs text-slate-400">موجز لحظي مستقى من وكالات الأنباء الدولية والمصادر الموثوقة.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchNews}
                  disabled={loadingNews}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? "animate-spin" : ""}`} />
                  <span>تحديث الأخبار</span>
                </button>
              </div>

              {loadingNews && (
                <div className="py-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  <span>جاري استرداد آخر الأخبار العالمية...</span>
                </div>
              )}

              {!loadingNews && (
                <div className="space-y-3">
                  {newsItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-emerald-500/40 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          {item.source}
                        </span>
                        {item.pubDate && <span className="text-[10px] text-slate-500 font-mono">{item.pubDate}</span>}
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 hover:text-emerald-300 transition-colors">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>قراءة المصدر</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const q = `حلل هذا الخبر وتداعياته الاستراتيجية والعالمية: "${item.title}"`;
                            if (onSendDirectly) onSendDirectly(q);
                            else onInjectPrompt(q);
                            onClose();
                          }}
                          className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>تحليل الخبر في أوميغا</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SOCIAL MEDIA & YOUTUBE */}
          {activeTab === "social" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">فاحص وتحليل روابط التواصل الاجتماعي ويوتيوب</h3>
                <p className="text-xs text-slate-400">الصق أي رابط لمقطع يوتيوب أو منشور فيسبوك أو تغريدة لاستخراج محتواها وتحليلها.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && inspectSocial()}
                  placeholder="الصق رابط يوتيوب أو فيسبوك هنا (مثال: https://www.youtube.com/watch?v=...)..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-pink-500/60"
                />
                <button
                  type="button"
                  onClick={inspectSocial}
                  disabled={loadingSocial || !socialUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loadingSocial ? <Loader2 className="w-4 h-4 animate-spin" /> : "فحص الرابط"}
                </button>
              </div>

              {socialError && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                  {socialError}
                </div>
              )}

              {socialData && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-pink-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-pink-400">
                    <span className="px-2 py-0.5 rounded bg-pink-950 border border-pink-500/30">
                      المنصة: {socialData.platform}
                    </span>
                    {socialData.authorName && <span className="text-slate-400">الناشر: {socialData.authorName}</span>}
                  </div>

                  <h4 className="text-sm font-bold text-white">{socialData.title}</h4>

                  {socialData.description && (
                    <p className="text-xs text-slate-300 leading-relaxed">{socialData.description}</p>
                  )}

                  {/* YouTube Embed / Thumbnail */}
                  {socialData.embedUrl ? (
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-800">
                      <iframe
                        src={socialData.embedUrl}
                        title={socialData.title}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  ) : socialData.thumbnailUrl ? (
                    <img
                      src={socialData.thumbnailUrl}
                      alt={socialData.title}
                      className="max-h-48 rounded-xl object-cover border border-slate-800"
                    />
                  ) : null}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <a
                      href={socialData.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-pink-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>فتح الرابط الأصلي</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        const q = `قم بتحليل محتوى هذا الرابط (${socialData.url}) وعنوانه: "${socialData.title}" وقدم ملخصاً نقدياً ومعرفياً شاملاً لأبرز نقاطه.`;
                        if (onSendDirectly) onSendDirectly(q);
                        else onInjectPrompt(q);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>إرسال الرابط لأوميغا للتحليل الشامل</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LATEX MATH & PHYSICS */}
          {activeTab === "latex" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">معادلات وصيغ الرياضيات والفيزياء (LaTeX)</h3>
                <p className="text-xs text-slate-400">
                  اختر أي معادلة من القوالب الفيزيائية والرياضية لإدراجها في صندوق السؤال وفحص المعالجة التوافقية لأوميغا:
                </p>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2">
                {Object.entries(FORMULA_CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      selectedCategory === key
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Formulas in current category */}
              <div className="space-y-3">
                {FORMULA_CATEGORIES[selectedCategory]?.formulas.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-indigo-500/40 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300">{item.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const query = `اشرح بتفصيل علمي ودقيق المعادلة الفيزيائية التالية وحلولها الممكنة وتطبيقاتها:\n$$${item.latex}$$\nما هي دلالة كل حد من حدودها؟`;
                          if (onSendDirectly) onSendDirectly(query);
                          else onInjectPrompt(query);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>تحليل المعادلة في أوميغا</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center overflow-x-auto" dir="ltr">
                      <MathRenderer content={`$$${item.latex}$$`} />
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
