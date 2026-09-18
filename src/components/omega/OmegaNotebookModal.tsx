import React, { useState } from "react";
import {
  BookOpen,
  Presentation,
  Download,
  Copy,
  Check,
  Printer,
  ChevronRight,
  ChevronLeft,
  Share2,
  Sparkles,
  FileText,
  Atom,
  X,
  Maximize2,
} from "lucide-react";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  bulletPoints: string[];
  keyFormula: string;
  takeaway: string;
}

interface NotebookTopic {
  id: string;
  title: string;
  author: string;
  date: string;
  summary: string;
  slides: Slide[];
  markdownContent: string;
}

const NOTEBOOK_TOPICS: NotebookTopic[] = [
  {
    id: "classical-to-relativistic",
    title: "من ميكانيكا نيوتن إلى نسبية آينشتاين الخاصة",
    author: "البروفيسور أوميغا • مختبر الفيزياء المتقدمة",
    date: "2026",
    summary: "ملخص شامل لديناميكا السقوط الحر، قوانين الحركة، وحدود السرعات الكونية عند الاقتراب من سرعة الضوء.",
    slides: [
      {
        id: 1,
        title: "قوانين نيوتن في التحريك والسقوط الحر",
        subtitle: "الأسس الكلاسيكية للميكانيكا",
        bulletPoints: [
          "القانون الثاني لنيوتن: محصلة القوى الخارجية تساوي مشتق كمية الحركة بالنسبة للزمن ∑F = m·a.",
          "في غياب مقاومة الهواء، تسارع جميع الأجسام في حقل الجاذبية الأرضية متساوٍ تماماً a = g ≈ 9.81 m/s².",
          "بوجود مقاومة المائع (Air Drag)، تنشأ قوة إعاقة F_d = k·v² تؤدي للوصول إلى السرعة الحدية.",
        ],
        keyFormula: "a = g - \\frac{k}{m}v^2 \\implies v_{lim} = \\sqrt{\\frac{mg}{k}}",
        takeaway: "الكتلة لا تؤثر على سرعة السقوط الحر في الفراغ، لكنها تحدد السرعة الحدية بوجود مقاومة الهواء.",
      },
      {
        id: 2,
        title: "ثبات سرعة الضوء وتجربة مايكلسون-مورلي",
        subtitle: "انهيار فرضية الأثير الكوني",
        bulletPoints: [
          "أثبتت تجربة مايكلسون-مورلي (1887) عدم وجود أثير حامل للموجات الضوئية.",
          "سرعة الضوء في الفراغ c ثابتة لجميع الملاحظين في كافة الجمل العطالية، بصرف النظر عن سرعة المصدر.",
          "ضرورة استبدال تحويلات غاليليو بتحويلات لورنتز للزمكان رباعي الأبعاد.",
        ],
        keyFormula: "c = 299,792,458 \\text{ m/s} = \\text{const}",
        takeaway: "الضوء هو الحد الأقصى المطلق لنقل الإشارات والمعلومات في الكون.",
      },
      {
        id: 3,
        title: "تمدد الزمن وتقلص الأطوال ومكافئ الكتلة-الطاقة",
        subtitle: "النتائج الجوهرية للنسبية الخاصة",
        bulletPoints: [
          "تمدد الزمن: الساعات المتحركة تدق بمعدل أبطأ بالنسبة لمراقب ساكن Δt' = γ·Δt.",
          "تقلص الطول: تقصر الأجسام في اتجاه حركتها بمعامل لورنتز L' = L / γ.",
          "تكافؤ الكتلة والطاقة: الكتلة هي طاقة مركزة وشديدة الكثافة E = m·c².",
        ],
        keyFormula: "\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}, \\quad E^2 = (pc)^2 + (m_0 c^2)^2",
        takeaway: "الكتلة الساكنة m₀ تتحول لطاقة هائلة، والزمن ليس مطلقاً بل بُعد مرتبط بالمكان.",
      },
    ],
    markdownContent: `# من ميكانيكا نيوتن إلى نسبية آينشتاين الخاصة
**إعداد:** البروفيسور أوميغا
**التاريخ:** 2026

## 1. قوانين نيوتن والسقوط الشاقولي
- **قانون نيوتن الثاني:** \`∑F = m·a\`
- في الفراغ الخالص، يكون التسارع مستقلاً تماماً عن الكتلة: \`a = g\`
- عند وجود مائع لزج: \`a = g - (k/m)·v²\` مما يقود إلى سرعة حدية: \`v_lim = √(mg/k)\`.

## 2. النسبية الخاصة
- سرعة الضوء ثابتة \`c ≈ 3 × 10⁸ m/s\`.
- معامل لورنتز: \`γ = 1 / √(1 - v²/c²)\`.
- تكافؤ الكتلة والطاقة: \`E = γ·m₀·c²\`.
`,
  },
  {
    id: "quantum-foundations",
    title: "مقدمة في فيزياء الكم وتكميم الطاقة",
    author: "البروفيسور أوميغا • مختبر الفيزياء المتقدمة",
    date: "2026",
    summary: "شرح فرضية بلانك، الظاهرة الكهروضوئية لآينشتاين، ونموذج بور لذرة الهيدروجين.",
    slides: [
      {
        id: 1,
        title: "أزمة الفيزياء الكلاسيكية والكارثة فوق البنفسجية",
        subtitle: "بداية الثورة الكمومية",
        bulletPoints: [
          "تنبأ قانون رايلي-جينس بأن الجسم الأسود يطلق طاقة لانهائية عند الترددات العالية.",
          "اقترح ماكس بلانك (1900) تكميم طاقة التذبذب في حزم منفصلة E = h·ν.",
          "أزال التكميم اللانهاية وفسر منحنيات الإشعاع الكهرومغناطيسي بدقة بالغة.",
        ],
        keyFormula: "E = n \\cdot h \\nu, \\quad h = 6.626 \\times 10^{-34} \\text{ J}\\cdot\\text{s}",
        takeaway: "الطاقة المتبادلة بين المادة والإشعاع ليست مستمرة بل تصدر على شكل كمات.",
      },
      {
        id: 2,
        title: "الظاهرة الكهروضوئية وتأكيد وجود الفوتون",
        subtitle: "جائزة نوبل لألبرت آينشتاين 1921",
        bulletPoints: [
          "انبعاث الإلكترونات من سطح المعدن يعتمد حصراً على تردد الضوء الساقط وليس شدته.",
          "تجاوز تردد العتبة ν₀ شرط أساسي لتحرير الإلكترون.",
          "تتحول طاقة الفوتون إلى طاقة حركية بعد التغلب على دالة العمل للمعدن W.",
        ],
        keyFormula: "K_{max} = h\\nu - W_0 = e \\cdot V_{stop}",
        takeaway: "للضوء طبيعة مزدوجة: موجية في الانتشار وجسيمية عند التفاعل مع المادة.",
      },
      {
        id: 3,
        title: "نموذج بور ومستويات طاقة ذرة الهيدروجين",
        subtitle: "تفسير أطياف الانبعاث والامتصاص",
        bulletPoints: [
          "يدور الإلكترون في مدارات دائرية محددة دون أن يشع طاقة (تكميم العزم الزاوي L = n·ℏ).",
          "يشع الذرة فوتوناً فقط عند انتقال الإلكترون من مدار طاقة أعلى n₂ إلى مدار أدنى n₁.",
          "سلاسل لايمان (فوق بنفسجي)، بالمر (الضوء المرئي)، وباشن (تحت الأحمر).",
        ],
        keyFormula: "E_n = -\\frac{13.6 \\text{ eV}}{n^2}, \\quad \\frac{1}{\\lambda} = R_H \\left(\\frac{1}{n_1^2} - \\frac{1}{n_2^2}\\right)",
        takeaway: "استقرار الذرة والأطياف الخطية المحددة هي نتيجة حتمية لتكميم مستويات الطاقة.",
      },
    ],
    markdownContent: `# فيزياء الكم وتكميم الطاقة
**إعداد:** البروفيسور أوميغا

## 1. فرضية بلانك
\`E = h·ν\` حيث \`h = 6.626 × 10⁻³⁴ J·s\`

## 2. الظاهرة الكهروضوئية
\`K_max = h·ν - W₀\`

## 3. نموذج بور لذرة الهيدروجين
\`E_n = -13.6 / n² eV\`
`,
  },
];

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export const OmegaNotebookModal: React.FC<Props> = ({ isOpen = true, onClose }) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(NOTEBOOK_TOPICS[0].id);
  const [viewMode, setViewMode] = useState<"slides" | "notebook">("slides");
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  if (isOpen === false) return null;

  const currentTopic = NOTEBOOK_TOPICS.find((t) => t.id === selectedTopicId) || NOTEBOOK_TOPICS[0];
  const currentSlide = currentTopic.slides[currentSlideIndex] || currentTopic.slides[0];

  const handleNextSlide = () => {
    if (currentSlideIndex < currentTopic.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(currentTopic.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-950/95 border border-indigo-500/40 text-slate-100 shadow-2xl backdrop-blur-md max-h-[88vh] overflow-y-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-400">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>المذكرة العلمية الذكية واستوديو العروض التقديمية</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-900/60 text-indigo-300 border border-indigo-500/30">
                Omega Deck & Notes
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              تصفح المحاضرات العلمية كشرائح عرض تفاعلية أو تصديرها كمذكرة دراسية جاهزة للطباعة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("slides")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === "slides"
                  ? "bg-indigo-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>عرض الشرائح</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("notebook")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === "notebook"
                  ? "bg-indigo-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>المذكرة والمستند</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
            title="طباعة أو تصدير PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Topics Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-[11px] shrink-0 font-medium">المحاضرة:</span>
        {NOTEBOOK_TOPICS.map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => {
              setSelectedTopicId(topic.id);
              setCurrentSlideIndex(0);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedTopicId === topic.id
                ? "bg-indigo-950 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400/40"
                : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
            }`}
          >
            {topic.title}
          </button>
        ))}
      </div>

      {viewMode === "slides" ? (
        /* Slides Presentation Mode */
        <div className="flex flex-col gap-3">
          {/* Main Slide Card */}
          <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-black border border-indigo-500/30 shadow-2xl min-h-[360px] flex flex-col justify-between">
            {/* Slide Header */}
            <div>
              <div className="flex items-center justify-between text-xs text-indigo-400 font-mono mb-2">
                <span>{currentTopic.author}</span>
                <span className="bg-indigo-900/60 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold">
                  شريحة {currentSlideIndex + 1} من {currentTopic.slides.length}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">{currentSlide.title}</h3>
              <p className="text-xs sm:text-sm text-indigo-300 mt-1">{currentSlide.subtitle}</p>
            </div>

            {/* Bullet Points */}
            <div className="my-4 space-y-2.5">
              {currentSlide.bulletPoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200">
                  <span className="text-indigo-400 text-base leading-none">•</span>
                  <span className="leading-relaxed">{point}</span>
                </div>
              ))}
            </div>

            {/* Key Formula & Takeaway Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-indigo-900/50">
              <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/30 font-mono text-xs text-cyan-300 text-center flex items-center justify-center" dir="ltr">
                {currentSlide.keyFormula}
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold">{currentSlide.takeaway}</span>
              </div>
            </div>
          </div>

          {/* Slide Navigation Controls */}
          <div className="flex items-center justify-between px-2">
            <button
              type="button"
              onClick={handlePrevSlide}
              disabled={currentSlideIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 text-xs font-semibold text-slate-200 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الشريحة السابقة</span>
            </button>

            {/* Mini Slide Dots */}
            <div className="flex items-center gap-1.5">
              {currentTopic.slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentSlideIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    currentSlideIndex === i
                      ? "bg-indigo-400 w-6"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNextSlide}
              disabled={currentSlideIndex === currentTopic.slides.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 text-xs font-semibold text-slate-200 cursor-pointer transition-colors"
            >
              <span>الشريحة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Notebook Document Mode */
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs text-slate-400">محتوى المستند (Markdown / LaTeX):</span>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "تم النسخ" : "نسخ النص كـ Markdown"}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-black font-mono text-xs text-indigo-200 overflow-x-auto whitespace-pre-wrap leading-relaxed" dir="ltr">
            {currentTopic.markdownContent}
          </pre>
        </div>
      )}
    </div>
  );
};
