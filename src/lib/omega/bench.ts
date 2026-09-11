/**
 * src/lib/omega/bench.ts
 * Benchmark simulation and statistical metrics evaluator for Omega V2 Consensus.
 */

import type { OmegaConfig } from "./optimizer";
import { fuseResponses } from "./fusion";

export interface BenchmarkMetrics {
  totalRuns: number;
  modeCounts: {
    direct: number;
    aggregated: number;
    uncertain: number;
  };
  avgPsi: number;
  avgSpread: number;
  avgDurationMs: number;
  verificationPassRate: number;
  semanticEmbeddingUsage: number;
}

const SAMPLE_BENCHMARK_PROMPTS = [
  "ما هو المبدأ الأساسي وراء ميكانيكا الكم وتراكب الحالات؟",
  "Write an efficient TypeScript function to debounce an async search handler.",
  "كيف تقارن بين نظرية النسبية العامة والجاذبية النيوتونية؟",
  "هل يمكن للذكاء الاصطناعي امتلاك وعي حقيقي أم مجرد محاكاة متقنة؟",
  "Solve for x: 3x^2 - 12x + 9 = 0 and explain the roots.",
];

export async function runBenchmark(
  config: OmegaConfig,
  runs = 3,
  onProgress?: (current: number, total: number) => void
): Promise<BenchmarkMetrics> {
  const prompts = SAMPLE_BENCHMARK_PROMPTS.slice(0, Math.min(runs, SAMPLE_BENCHMARK_PROMPTS.length));
  const results = [];

  for (let i = 0; i < prompts.length; i++) {
    onProgress?.(i + 1, prompts.length);
    const res = await fuseResponses(prompts[i], [], {
      directThreshold: config.directThreshold,
      uncertainSpread: config.uncertainSpread,
      temperature: config.temperature,
      maxTokens: 512,
      maxModelsPerDomain: config.maxModelsPerDomain,
      aggregatorModel: config.aggregatorModel,
      verifierModel: config.verifierModel,
      skipVerification: config.skipVerification,
    });
    results.push(res);
  }

  const modeCounts = { direct: 0, aggregated: 0, uncertain: 0 };
  let totalPsi = 0;
  let totalSpread = 0;
  let totalDuration = 0;
  let verifiedCount = 0;
  let semanticCount = 0;

  results.forEach((r) => {
    modeCounts[r.mode] += 1;
    const topPsi = r.candidates[0]?.psi || 0;
    const minPsi = r.candidates[r.candidates.length - 1]?.psi || 0;
    totalPsi += topPsi;
    totalSpread += topPsi - minPsi;
    totalDuration += r.telemetry?.durationMs || 450;
    if (r.verification?.verified) verifiedCount += 1;
    if (r.embeddingSource === "semantic") semanticCount += 1;
  });

  const count = results.length || 1;
  return {
    totalRuns: results.length,
    modeCounts,
    avgPsi: Number((totalPsi / count).toFixed(3)),
    avgSpread: Number((totalSpread / count).toFixed(3)),
    avgDurationMs: Math.round(totalDuration / count),
    verificationPassRate: Number(((verifiedCount / count) * 100).toFixed(1)),
    semanticEmbeddingUsage: Number(((semanticCount / count) * 100).toFixed(1)),
  };
}
