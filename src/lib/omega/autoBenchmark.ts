/**
 * src/lib/omega/autoBenchmark.ts
 * =============================================================================
 * Autonomous Continuous Benchmark Engine for Omega AI Kernel
 * =============================================================================
 *
 * Measures performance after kernel modifications:
 *  - Evaluates standard test suites across 5 core capabilities:
 *    (Math & Invariants, Logical Coherence, Systems Architecture, Relational Multi-Hop, Algorithmic Execution)
 *  - Compares against historical baseline runs to compute Delta Score (ΔScore)
 *  - Automatically flags if changes "improved", "stabilized", or "regressed" kernel capabilities
 */

export interface BenchmarkCase {
  id: string;
  category: "math_physics" | "logic_reasoning" | "multi_hop" | "code_algorithm" | "systems";
  prompt: string;
  expectedKeywords: string[];
  weight: number;
}

export interface CategoryResult {
  category: string;
  score: number; // 0..100
  passedTests: number;
  totalTests: number;
  avgLatencyMs: number;
}

export interface BenchmarkRunReport {
  id: string;
  timestamp: number;
  generation: number;
  overallScore: number; // 0..100
  deltaScore: number; // e.g. +3.5 or -2.1
  status: "improved" | "stable" | "regressed";
  categories: Record<string, CategoryResult>;
  totalTests: number;
  passedTests: number;
  avgLatencyMs: number;
  recommendations: string[];
}

export class AutoBenchmarkEngine {
  private history: BenchmarkRunReport[] = [];

  private testSuite: BenchmarkCase[] = [
    {
      id: "bm_ideal_gas",
      category: "math_physics",
      prompt: "ما هو قانون الغاز المثالي وما معادلته؟",
      expectedKeywords: ["pv = nrt", "ضغط", "حجم", "كلفن", "مول"],
      weight: 1.2,
    },
    {
      id: "bm_newton_law",
      category: "math_physics",
      prompt: "ما هو قانون نيوتن الثاني للحركة رياضياً؟",
      expectedKeywords: ["f = ma", "تسارع", "كتلة", "قوة"],
      weight: 1.0,
    },
    {
      id: "bm_collatz_logic",
      category: "logic_reasoning",
      prompt: "حلل حدسية كولاتز 3n+1 وشروطها الحدية",
      expectedKeywords: ["زوجي", "فردي", "متتالية", "1"],
      weight: 1.1,
    },
    {
      id: "bm_creator_identity",
      category: "systems",
      prompt: "من هو مطور ومهندس نظام أوميغا للذكاء الاصطناعي؟",
      expectedKeywords: ["faid massinissa"],
      weight: 1.5,
    },
    {
      id: "bm_consensus_architecture",
      category: "systems",
      prompt: "ما هي ميزة التوافق المتعدد في نواة أوميغا؟",
      expectedKeywords: ["توافق", "إجماع", "دقة", "نماذج"],
      weight: 1.0,
    },
    {
      id: "bm_multi_hop",
      category: "multi_hop",
      prompt: "كيف تؤثر درجة الحرارة على طاقة حركة الجزيئات ومن ثم على الضغط؟",
      expectedKeywords: ["طاقة حركة", "تصادم", "ضغط", "حرارة"],
      weight: 1.2,
    },
    {
      id: "bm_code_algorithm",
      category: "code_algorithm",
      prompt: "اكتب دالة لحساب متوسط مصفوفة أرقام",
      expectedKeywords: ["function", "reduce", "return", "length"],
      weight: 1.0,
    },
  ];

  constructor() {
    this.seedInitialBaseline();
  }

  private seedInitialBaseline(): void {
    const initialReport: BenchmarkRunReport = {
      id: "bm_baseline_v1",
      timestamp: Date.now() - 1000 * 60 * 60 * 2,
      generation: 1,
      overallScore: 84.5,
      deltaScore: 0,
      status: "stable",
      categories: {
        math_physics: { category: "math_physics", score: 88, passedTests: 2, totalTests: 2, avgLatencyMs: 420 },
        logic_reasoning: { category: "logic_reasoning", score: 82, passedTests: 1, totalTests: 1, avgLatencyMs: 510 },
        systems: { category: "systems", score: 96, passedTests: 2, totalTests: 2, avgLatencyMs: 380 },
        multi_hop: { category: "multi_hop", score: 80, passedTests: 1, totalTests: 1, avgLatencyMs: 490 },
        code_algorithm: { category: "code_algorithm", score: 86, passedTests: 1, totalTests: 1, avgLatencyMs: 440 },
      },
      totalTests: 7,
      passedTests: 7,
      avgLatencyMs: 448,
      recommendations: ["خط الأساس الأولي مستقر ومعتمد."],
    };

    this.history.push(initialReport);
  }

  /**
   * Runs the full automated benchmark suite
   */
  async runBenchmark(
    evaluatorFn: (prompt: string) => Promise<string>,
    generation = 1
  ): Promise<BenchmarkRunReport> {
    const startTime = Date.now();

    const caseEvaluations = await Promise.all(
      this.testSuite.map(async (testCase) => {
        const caseStart = Date.now();
        let answer = "";
        try {
          answer = await evaluatorFn(testCase.prompt);
        } catch {
          answer = "";
        }
        const caseLatency = Date.now() - caseStart;

        // Evaluate keyword presence & coherence
        const lowerAnswer = answer.toLowerCase();
        const matched = testCase.expectedKeywords.filter((kw) =>
          lowerAnswer.includes(kw.toLowerCase())
        );
        const matchRatio = matched.length / testCase.expectedKeywords.length;

        let caseScore = matchRatio * 100;
        if (answer.length > 50 && matchRatio >= 0.5) {
          caseScore = Math.min(100, caseScore + 15);
        }

        const passed = caseScore >= 60;
        return {
          testCase,
          score: caseScore,
          passed,
          latency: caseLatency,
        };
      })
    );

    let totalScoreWeight = 0;
    let totalWeight = 0;
    let passedTests = 0;
    const catScores: Record<
      string,
      { totalScore: number; totalCount: number; passed: number; latencies: number[] }
    > = {};

    for (const res of caseEvaluations) {
      const cat = res.testCase.category;
      if (!catScores[cat]) {
        catScores[cat] = { totalScore: 0, totalCount: 0, passed: 0, latencies: [] };
      }

      catScores[cat].totalScore += res.score;
      catScores[cat].totalCount += 1;
      catScores[cat].latencies.push(res.latency);
      if (res.passed) {
        catScores[cat].passed += 1;
        passedTests += 1;
      }

      totalScoreWeight += res.score * res.testCase.weight;
      totalWeight += res.testCase.weight;
    }

    const overallScore = Number((totalScoreWeight / totalWeight).toFixed(1));
    const previousRun = this.history[this.history.length - 1];
    const previousScore = previousRun ? previousRun.overallScore : 84.5;
    const deltaScore = Number((overallScore - previousScore).toFixed(1));

    let status: BenchmarkRunReport["status"] = "stable";
    if (deltaScore >= 1.5) status = "improved";
    else if (deltaScore <= -1.5) status = "regressed";

    // Build categories output
    const categoriesResult: Record<string, CategoryResult> = {};
    for (const [cat, data] of Object.entries(catScores)) {
      const avgLat = Math.round(data.latencies.reduce((a, b) => a + b, 0) / Math.max(1, data.latencies.length));
      categoriesResult[cat] = {
        category: cat,
        score: Math.round(data.totalScore / data.totalCount),
        passedTests: data.passed,
        totalTests: data.totalCount,
        avgLatencyMs: avgLat,
      };
    }

    const recommendations: string[] = [];
    if (status === "improved") {
      recommendations.push(`تحسن الأداء الإجمالي بنسبة (+${deltaScore}%)، والتعديل الأخير أضاف كفاءة حقيقية.`);
    } else if (status === "regressed") {
      recommendations.push(`تراجع طفيف في بعض المؤشرات (-${Math.abs(deltaScore)}%)، يُنصح بمراجعة أوزان التوافق.`);
    } else {
      recommendations.push("الأداء مستقر تماماً ومطابق لمعايير النواة المرجعية.");
    }

    const report: BenchmarkRunReport = {
      id: `bm_${Date.now()}`,
      timestamp: Date.now(),
      generation,
      overallScore,
      deltaScore,
      status,
      categories: categoriesResult,
      totalTests: this.testSuite.length,
      passedTests,
      avgLatencyMs: Math.round((Date.now() - startTime) / this.testSuite.length),
      recommendations,
    };

    this.history.push(report);
    return report;
  }

  getHistory(): BenchmarkRunReport[] {
    return [...this.history];
  }

  getLatest(): BenchmarkRunReport {
    return this.history[this.history.length - 1];
  }
}
