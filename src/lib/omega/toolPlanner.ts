/**
 * src/lib/omega/toolPlanner.ts
 * =============================================================================
 * Intelligent Tool Planner for Omega AI Kernel
 * =============================================================================
 *
 * Autonomously decides which tools to invoke and constructs an optimal execution plan:
 *  - web_search: Live news, breaking developments, weather, real-time facts
 *  - symbolic_cas: Formal calculus, algebraic equations, linear algebra, integrals
 *  - code_sandbox: Safe algorithmic execution, iterative numerical computing
 *  - image_generation: Visual rendering and artistic generation
 *  - knowledge_graph: Relational multi-hop path deductions between entities
 *  - mcts_reasoning: Deep multi-branch tree exploration for complex or open problems
 *  - direct_synthesis: Pure linguistic & conceptual reasoning
 */

export type ToolType =
  | "web_search"
  | "symbolic_cas"
  | "code_sandbox"
  | "image_generation"
  | "knowledge_graph"
  | "mcts_reasoning"
  | "direct_synthesis";

export interface ToolStep {
  step: number;
  tool: ToolType;
  purpose: string;
  expectedOutput: string;
}

export interface ToolExecutionPlan {
  primaryTool: ToolType;
  auxiliaryTools: ToolType[];
  steps: ToolStep[];
  confidence: number;
  rationale: string;
  executionMode: "single_tool" | "pipeline_chain" | "direct";
}

export class ToolPlanner {
  /**
   * Plans the optimal tool workflow for any incoming inquiry
   */
  plan(question: string, attachments: any[] = []): ToolExecutionPlan {
    const q = question.toLowerCase();

    // 1. Image Generation check
    if (
      /^(رسم صورة|ارسم|صمم صورة|ولد صورة|انشئ صورة|صورة لـ|draw|paint|generate image|create image|illustration)/i.test(
        question
      ) ||
      /\b(صورة لـ|ارسم لي|توليد صورة)\b/i.test(question)
    ) {
      return {
        primaryTool: "image_generation",
        auxiliaryTools: ["direct_synthesis"],
        steps: [
          {
            step: 1,
            tool: "image_generation",
            purpose: "استخراج الموجه البصري وتوليد الصورة بدقة سينمائية 8K",
            expectedOutput: "رابط الصورة وتفكيكها الجمالي",
          },
        ],
        confidence: 0.98,
        rationale: "الاستفسار يتطلب صراحة توليد مشهد بصري أو رسم فني.",
        executionMode: "single_tool",
      };
    }

    // 2. Symbolic Math / CAS check
    if (
      /(مشتق|مشتقة|تكامل|حل المعادلة|معادلة|تفاضل|محدد المصفوفة|جذور|كثير حدود|derivative|integral|solve equation|taylor series|factorize|nerdamer)/i.test(
        q
      ) ||
      /(\b(solve|roots|factor|integrate|diff)\b|\b\d+\s*[\+\-\*\/]\s*\d+\b)/i.test(q)
    ) {
      return {
        primaryTool: "symbolic_cas",
        auxiliaryTools: ["code_sandbox", "direct_synthesis"],
        steps: [
          {
            step: 1,
            tool: "symbolic_cas",
            purpose: "حل المعادلة أو العملية الرمزية جبرياً دون أخطاء تقريبية",
            expectedOutput: "الحل الجبري الدقيق بصيغة KaTeX",
          },
          {
            step: 2,
            tool: "direct_synthesis",
            purpose: "صياغة الشرح الرياضي المتكامل والخطوات التحليلية",
            expectedOutput: "الإجابة العلمية الوافية",
          },
        ],
        confidence: 0.95,
        rationale: "السؤال يتضمن عمليات جبرية، تفاضل، تكامل، أو حسابات رمزية دقيقة تتطلب محرك CAS.",
        executionMode: "pipeline_chain",
      };
    }

    // 3. Code Execution / Algorithmic Problem check
    if (
      /(خوارزمية|نفذ كود|اكتب دالة|شفرة برمجية|احسب برمجياً|بايثون|برمجة|algorithm|execute code|run script|benchmark code|sort array)/i.test(
        q
      )
    ) {
      return {
        primaryTool: "code_sandbox",
        auxiliaryTools: ["direct_synthesis"],
        steps: [
          {
            step: 1,
            tool: "code_sandbox",
            purpose: "تنفيذ الخوارزمية في بيئة الحجر الصحي وتصحيحها ذاتياً",
            expectedOutput: "مخرجات التنفيذ والنتائج الحسابية الخوارزمية",
          },
        ],
        confidence: 0.92,
        rationale: "المسألة تتطلب معالجة خوارزمية أو تنفيذ أكواد برمجية موثوقة.",
        executionMode: "pipeline_chain",
      };
    }

    // 4. Live News / Real-time Grounding check
    if (
      /(خبر|أخبار|اخبار|عاجل|طقس|الطقس|الآن|اليوم|مستجدات|تريند|ترند|حدث الآن|news|breaking|weather|today|now|2026)/i.test(
        q
      )
    ) {
      return {
        primaryTool: "web_search",
        auxiliaryTools: ["direct_synthesis"],
        steps: [
          {
            step: 1,
            tool: "web_search",
            purpose: "جلب أحدث التغطيات الإخبارية والبيانات الميدانية اللحظية",
            expectedOutput: "موجز إخباري موثق ومحدث",
          },
          {
            step: 2,
            tool: "direct_synthesis",
            purpose: "صياغة إحاطة إخبارية متزنة دون ادعاءات غير موثقة",
            expectedOutput: "تقرير إخباري رصين",
          },
        ],
        confidence: 0.96,
        rationale: "الاستفسار يتناول أحداثاً جارية أو مستجدات حية تستلزم تغذية إخبارية فورية.",
        executionMode: "pipeline_chain",
      };
    }

    // 5. Relational Multi-Hop / Knowledge Graph check
    if (
      /(ما العلاقة بين|كيف يرتبط|سلسلة الأسباب|مسار التأثير|relation between|how does .* lead to|chain of|علاقة بين)/i.test(
        q
      )
    ) {
      return {
        primaryTool: "knowledge_graph",
        auxiliaryTools: ["direct_synthesis"],
        steps: [
          {
            step: 1,
            tool: "knowledge_graph",
            purpose: "استخراج المسار الاستدلالي متعدد القفزات بين المفاهيم في الرسم البياني",
            expectedOutput: "سلسلة الروابط السببية بين العقد المعرفية",
          },
          {
            step: 2,
            tool: "direct_synthesis",
            purpose: "دمج الروابط البيانية في صياغة استدلالية رصينة",
            expectedOutput: "إجابة متماسكة توضح طبيعة العلاقة",
          },
        ],
        confidence: 0.89,
        rationale: "السؤال يركز على العلاقات السببية البنيوية والروابط المتقاطعة بين عدة كيانات.",
        executionMode: "pipeline_chain",
      };
    }

    // 6. Deep Open Problem / Conjecture check
    if (
      /\b(كولاتز|collatz|ريمان|riemann|غولدباخ|goldbach|مسألة مفتوحة|معضلة غير محلولة|unsolved problem|فرضية)\b/i.test(
        q
      )
    ) {
      return {
        primaryTool: "mcts_reasoning",
        auxiliaryTools: ["symbolic_cas", "direct_synthesis"],
        steps: [
          {
            step: 1,
            tool: "mcts_reasoning",
            purpose: "استكشاف فروع المسألة عبر شجرة تفكير MCTS ومحاكاة المسارات الاستدلالية",
            expectedOutput: "أقوى الفرضيات الصامدة أمام التفنيد",
          },
          {
            step: 2,
            tool: "direct_synthesis",
            purpose: "صياغة التفكيك الاستكشافي المتكامل مع مؤشر اليقين",
            expectedOutput: "تقرير استدلالي معمق",
          },
        ],
        confidence: 0.94,
        rationale: "مسألة رياضية أو علمية مفتوحة تتطلب استكشافاً نظرياً عميقاً عبر شجرة MCTS.",
        executionMode: "pipeline_chain",
      };
    }

    // Default: Direct Multi-Model Consensus Synthesis
    return {
      primaryTool: "direct_synthesis",
      auxiliaryTools: [],
      steps: [
        {
          step: 1,
          tool: "direct_synthesis",
          purpose: "تحليل الاستفسار وصياغة الإجابة المباشرة والواضحة عبر توافق النماذج",
          expectedOutput: "إجابة متكاملة وشاملة",
        },
      ],
      confidence: 0.9,
      rationale: "الاستفسار مفاهيمي عام يناسبه الاستدلال التكاملي المباشر.",
      executionMode: "direct",
    };
  }
}
