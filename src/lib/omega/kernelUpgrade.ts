/**
 * Omega Kernel Upgrade v1
 * ----------------------
 * Implements:
 * 1. EMA-Deviation Psi (avoids absolute-score overconfidence)
 * 2. Agreement Ceiling
 * 3. Hybrid Confidence Ψ (Consensus + Falsification + Reasoning Quality)
 * 4. Adaptive Thinking Depth
 * 5. Deep Exploration Mode scaffolding
 * 6. Domain-aware weight profiles
 * 7. Final Synthesizer + Critique interface
 *
 * Author style: compatible with existing Omega fusion architecture
 */

// ============================================================
// 1. Types
// ============================================================

export type Domain =
  | "general"
  | "code"
  | "math_logic"
  | "science_factual"
  | "news_realtime"
  | "creative"
  | "open_problem";

export interface ModelCandidate {
  modelId: string;
  text: string;
  embedding?: number[];          // semantic vector
  // Optional signals for advanced scoring
  reasoningSteps?: number;
  gaps?: number;                 // logical gaps estimate (0-1)
  novelty?: number;              // 0-1
  counterExamples?: number;      // found during falsification
  falsificationTests?: number;   // attempts made
}

export interface PsiState {
  deltaEma: number;
  initialized: boolean;
}

export interface HybridScores {
  psiCons: number[];             // consensus-based
  F: number[];                   // falsification resistance
  S: number[];                   // reasoning structure strength
  Psi: number[];                 // final hybrid confidence
  weights: number[];
  meanPsi: number;
  entropy: number;
}

export interface ExplorationPath {
  id: string;
  strategy: string;              // e.g. "algebraic", "probabilistic", "structural"
  text: string;
  Q: number;                     // reasoning quality
  F: number;
  Psi: number;
}

// ============================================================
// 2. Math helpers
// ============================================================

export function softsign(x: number): number {
  return x / (1 + Math.abs(x));
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function clip(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom < 1e-12 ? 0 : clip(dot / denom, -1, 1);
}

export function shannonEntropy(weights: number[]): number {
  let h = 0;
  for (const w of weights) {
    if (w > 1e-12) h -= w * Math.log2(w);
  }
  return h;
}

export function softmax(values: number[], temperature = 1.0): number[] {
  const t = Math.max(temperature, 1e-4);
  const max = Math.max(...values);
  const exps = values.map(v => Math.exp((v - max) / t));
  const sum = exps.reduce((a, b) => a + b, 0);
  return sum < 1e-12 ? values.map(() => 1 / values.length) : exps.map(e => e / sum);
}

// ============================================================
// 3. Core: EMA-Deviation Consensus Psi
// ============================================================

export const DEFAULT_PSI_STATE: PsiState = {
  deltaEma: 0.25,
  initialized: false,
};

export function computeConsensusPsi(
  candidates: ModelCandidate[],
  state: PsiState,
  opts?: {
    lambda?: number;
    c?: number;
    beta?: number;
    psiMin?: number;
    psiMax?: number;
  }
): { psiCons: number[]; deltas: number[]; newState: PsiState; meanDelta: number } {
  const lambda = opts?.lambda ?? 0.94;
  const c = opts?.c ?? 1.4;
  const beta = opts?.beta ?? 2.5;
  const psiMin = opts?.psiMin ?? 0.08;
  const psiMax = opts?.psiMax ?? 0.97;

  // Need embeddings
  const vectors = candidates.map(c => c.embedding);
  if (vectors.some(v => !v || v.length === 0)) {
    // Fallback: uniform
    return {
      psiCons: candidates.map(() => 0.7),
      deltas: candidates.map(() => 0.3),
      newState: state,
      meanDelta: 0.3,
    };
  }

  const dim = vectors[0]!.length;
  const centroid = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) centroid[i] += v![i] / vectors.length;
  }

  const deltas = vectors.map(v => 1 - cosineSimilarity(v!, centroid));
  const meanDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;

  let deltaEma = state.deltaEma;
  if (!state.initialized) {
    deltaEma = meanDelta;
  } else {
    deltaEma = lambda * deltaEma + (1 - lambda) * meanDelta;
  }

  const psiCons = deltas.map(delta => {
    const d = delta - deltaEma;
    const raw = Math.exp(-c * softsign(beta * d));
    return clip(raw, psiMin, psiMax);
  });

  return {
    psiCons,
    deltas,
    newState: { deltaEma, initialized: true },
    meanDelta,
  };
}

// ============================================================
// 4. Reasoning Quality + Falsification Resistance
// ============================================================

export function computeReasoningQuality(c: ModelCandidate): number {
  const consistency = c.reasoningSteps
    ? clip(c.reasoningSteps / 12, 0, 1)   // crude proxy
    : 0.6;
  const novelty = c.novelty ?? 0.5;
  const gaps = c.gaps ?? 0.3;
  const repetition = 0.2;                // placeholder – can be computed vs known answers

  // Q = αC + βN - γG - δR
  return 0.40 * consistency + 0.25 * novelty - 0.25 * gaps - 0.10 * repetition;
}

export function computeFalsificationResistance(c: ModelCandidate): number {
  const counters = c.counterExamples ?? 0;
  const tests = Math.max(c.falsificationTests ?? 1, 1);
  const lambdaF = 1.8;
  return Math.exp(-lambdaF * (counters / (tests + 1e-6)));
}

// ============================================================
// 5. Hybrid Confidence Ψ
// ============================================================

export function getDomainWeights(domain: Domain): { alpha: number; beta: number; gamma: number } {
  switch (domain) {
    case "open_problem":
    case "math_logic":
      return { alpha: 0.25, beta: 0.35, gamma: 0.40 }; // logic & falsification heavy
    case "creative":
      return { alpha: 0.40, beta: 0.15, gamma: 0.45 };
    case "news_realtime":
      return { alpha: 0.50, beta: 0.25, gamma: 0.25 };
    case "code":
      return { alpha: 0.45, beta: 0.20, gamma: 0.35 };
    default:
      return { alpha: 0.55, beta: 0.20, gamma: 0.25 };
  }
}

export function computeHybridConfidence(
  candidates: ModelCandidate[],
  psiCons: number[],
  domain: Domain
): HybridScores {
  const { alpha, beta, gamma } = getDomainWeights(domain);

  const F = candidates.map(computeFalsificationResistance);
  const rawQ = candidates.map(computeReasoningQuality);
  const S = rawQ.map(q => sigmoid(q * 3)); // map quality to (0,1)

  const Psi = candidates.map((_, i) => {
    const value =
      Math.pow(psiCons[i], alpha) *
      Math.pow(F[i], beta) *
      Math.pow(S[i], gamma);
    return clip(value, 0.05, 0.98);
  });

  // Agreement Ceiling
  let adjusted = [...Psi];
  const meanPsi = adjusted.reduce((a, b) => a + b, 0) / adjusted.length;
  const weightsTmp = softmax(adjusted, 0.7);
  const H = shannonEntropy(weightsTmp);

  if (meanPsi > 0.91 && H < 0.45) {
    adjusted = adjusted.map(p => Math.max(0.08, p - 0.12));
  }

  const weights = softmax(adjusted, 0.65);

  return {
    psiCons,
    F,
    S,
    Psi: adjusted,
    weights,
    meanPsi: adjusted.reduce((a, b) => a + b, 0) / adjusted.length,
    entropy: shannonEntropy(weights),
  };
}

// ============================================================
// 6. Adaptive Thinking Depth
// ============================================================

export function computeThinkingDepth(
  difficultyEntropy: number,   // estimated from question complexity
  opts?: { dMin?: number; dMax?: number; gamma?: number; h0?: number }
): number {
  const dMin = opts?.dMin ?? 1;
  const dMax = opts?.dMax ?? 6;
  const gamma = opts?.gamma ?? 2.2;
  const h0 = opts?.h0 ?? 1.1;

  const ratio = sigmoid(gamma * (difficultyEntropy - h0));
  return Math.round(dMin + (dMax - dMin) * ratio);
}

// ============================================================
// 7. Deep Exploration Scaffolding
// ============================================================

export function shouldActivateDeepExploration(
  domain: Domain,
  question: string,
  meanPsi: number
): boolean {
  const openKeywords = [
    "فرضية", "فرضية", "أثبت", "هل يمكن", "نظرية", "مفتوحة",
    "collatz", "conjecture", "open problem", "prove that", "hypothesis"
  ];
  const lower = question.toLowerCase();
  const hasOpenSignal = openKeywords.some(k => lower.includes(k));
  return domain === "open_problem" || domain === "math_logic" || hasOpenSignal || meanPsi < 0.55;
}

export function rankExplorationPaths(paths: ExplorationPath[]): ExplorationPath[] {
  return [...paths].sort((a, b) => b.Psi - a.Psi || b.Q - a.Q);
}

// ============================================================
// 8. Final Synthesizer + Critique Interface
// ============================================================

export interface SynthesisRequest {
  question: string;
  domain: Domain;
  candidates: ModelCandidate[];
  scores: HybridScores;
  mode: "direct" | "aggregated" | "exploration";
}

/**
 * Builds the prompt for the Final Synthesizer model.
 * The synthesizer should NOT just average opinions —
 * it must reconstruct a high-quality answer.
 */
export function buildSynthesizerPrompt(req: SynthesisRequest): string {
  const top = req.candidates
    .map((c, i) => ({ c, psi: req.scores.Psi[i] }))
    .sort((a, b) => b.psi - a.psi)
    .slice(0, 4);

  const contributions = top
    .map(({ c, psi }, idx) =>
      `[مساهمة ${idx + 1} | {c.modelId} | Ψ= ${psi.toFixed(3)}]\n${c.text}`
    )
    .join("\n\n---\n\n");

  return `
أنت الطبقة النهائية الحاكمة في نظام أوميغا (Final Synthesizer).

المطلوب منك:
1. لست مجرد مُلخّص. أنت تعيد بناء إجابة عالية الجودة.
2. استخرج أفضل الأفكار من المساهمات وتخلص من التكرار والضعف.
3. حافظ على الدقة، الوضوح، والتنظيم.
4. إذا كانت هناك تعارضات، احسمها بمنطق صريح أو اعرض البدائل بشفافية.
5. في المسائل المفتوحة: لا تدّع اليقين. قدم أقوى الفرضيات مع حدودها.

السؤال:
${req.question}

المساهمات المرتبة حسب الثقة الهجينة Ψ:
${contributions}

أكتب الإجابة النهائية الآن:
`.trim();
}

export function buildCritiquePrompt(question: string, draft: string): string {
  return `
أنت طبقة النقد (Critique) في أوميغا.
افحص المسودة التالية بصرامة:
- هل هناك أخطاء منطقية أو حسابية؟
- هل هناك ادعاءات غير مدعومة؟
- هل يمكن تحسين الوضوح أو البنية؟
- هل تم تجاهل جوانب مهمة؟

السؤال: ${question}

المسودة:
${draft}

أرجع نقداً موجزاً وبنّاءً فقط، ثم اقترح نسخة محسّنة إن لزم.
`.trim();
}

// ============================================================
// 9. Main entry – one function that ties everything
// ============================================================

export interface KernelResult {
  scores: HybridScores;
  mode: "direct" | "aggregated" | "exploration";
  thinkingDepth: number;
  synthesizerPrompt?: string;
  critiquePrompt?: string;
  newPsiState: PsiState;
}

export function runOmegaKernel(
  question: string,
  domain: Domain,
  candidates: ModelCandidate[],
  psiState: PsiState,
  difficultyEntropy = 1.2
): KernelResult {
  // 1. Consensus Psi with EMA
  const { psiCons, newState } = computeConsensusPsi(candidates, psiState);

  // 2. Hybrid confidence
  const scores = computeHybridConfidence(candidates, psiCons, domain);

  // 3. Adaptive depth
  const thinkingDepth = computeThinkingDepth(difficultyEntropy);

  // 4. Decide mode
  const topPsi = Math.max(...scores.Psi);
  let mode: "direct" | "aggregated" | "exploration" = "aggregated";

  if (shouldActivateDeepExploration(domain, question, scores.meanPsi)) {
    mode = "exploration";
  } else if (topPsi >= 0.88 && scores.entropy < 1.2) {
    mode = "direct";
  }

  // 5. Build prompts for next stage
  const synthReq: SynthesisRequest = { question, domain, candidates, scores, mode };
  const synthesizerPrompt = buildSynthesizerPrompt(synthReq);

  return {
    scores,
    mode,
    thinkingDepth,
    synthesizerPrompt,
    newPsiState: newState,
  };
}
// ============================================================
// 10. Tree-of-Thoughts / Multi-Path Exploration (Simplified)
// ============================================================

export interface ThoughtNode {
  id: string;
  parentId: string | null;
  strategy: string;
  content: string;
  score: number;          // local quality
  depth: number;
  children: string[];
  status: "active" | "pruned" | "selected" | "falsified";
}

export interface ToTState {
  nodes: Map<string, ThoughtNode>;
  rootId: string;
  selectedPath: string[];
}

/** استراتيجيات استكشاف مختلفة */
export const EXPLORATION_STRATEGIES = [
  "structural",      // بنيوي / جبري
  "probabilistic",   // احتمالي / إحصائي
  "constructive",    // بناء أمثلة أو خوارزميات
  "contradiction",   // برهان بالخلف
  "reduction",       // اختزال إلى مسألة أبسط
  "generalization",  // تعميم أو حالات خاصة
] as const;

export type Strategy = typeof EXPLORATION_STRATEGIES[number];

/**
 * إنشاء جذور متعددة (Multi-Path)
 */
export function generateInitialPaths(
  question: string,
  depthLimit: number,
  strategies: Strategy[] = ["structural", "probabilistic", "contradiction"]
): ThoughtNode[] {
  return strategies.slice(0, depthLimit).map((strategy, idx) => ({
    id: `root-{strategy}-{idx}`,
    parentId: null,
    strategy,
    content: `[${strategy}] بدء استكشاف المسألة: ${question.slice(0, 120)}...`,
    score: 0.5,
    depth: 0,
    children: [],
    status: "active" as const,
  }));
}

/**
 * تقييم عقدة فكرية (يمكن استبداله بنموذج لاحقاً)
 */
export function scoreThoughtNode(
  node: ThoughtNode,
  falsificationHits = 0
): number {
  // درجة أولية حسب الاستراتيجية + عقوبة التفنيد
  const base = 0.55 + Math.random() * 0.25; // placeholder – استبدل بتقييم نموذج
  const penalty = Math.min(0.4, falsificationHits * 0.15);
  return clip(base - penalty, 0.05, 0.95);
}

/**
 * توسيع مسار (توليد أبناء)
 */
export function expandNode(
  parent: ThoughtNode,
  maxChildren = 2
): ThoughtNode[] {
  const children: ThoughtNode[] = [];
  for (let i = 0; i < maxChildren; i++) {
    const child: ThoughtNode = {
      id: `{parent.id}-c{i}`,
      parentId: parent.id,
      strategy: parent.strategy,
      content: `امتداد ({parent.strategy}) #{i + 1} من: ${parent.content.slice(0, 80)}`,
      score: 0,
      depth: parent.depth + 1,
      children: [],
      status: "active",
    };
    child.score = scoreThoughtNode(child);
    children.push(child);
  }
  return children;
}

/**
 * خوارزمية ToT مبسطة: Beam Search
 */
export function runTreeOfThoughts(
  question: string,
  thinkingDepth: number,
  beamWidth = 3
): { state: ToTState; bestPath: ThoughtNode[] } {
  const roots = generateInitialPaths(question, thinkingDepth);
  const nodes = new Map<string, ThoughtNode>();
  roots.forEach(r => nodes.set(r.id, r));

  let frontier = [...roots];

  for (let d = 0; d < thinkingDepth; d++) {
    const nextFrontier: ThoughtNode[] = [];

    for (const node of frontier) {
      if (node.status !== "active") continue;
      const children = expandNode(node, 2);
      children.forEach(c => {
        nodes.set(c.id, c);
        node.children.push(c.id);
        nextFrontier.push(c);
      });
    }

    // احتفظ بأفضل beamWidth فقط
    nextFrontier.sort((a, b) => b.score - a.score);
    frontier = nextFrontier.slice(0, beamWidth);

    // قلّم الباقي
    nextFrontier.slice(beamWidth).forEach(n => {
      n.status = "pruned";
    });
  }

  // اختر أفضل مسار نهائي
  const bestLeaf = frontier.sort((a, b) => b.score - a.score)[0];
  const bestPath: ThoughtNode[] = [];
  let current: ThoughtNode | undefined = bestLeaf;
  while (current) {
    bestPath.unshift(current);
    current.status = "selected";
    current = current.parentId ? nodes.get(current.parentId) : undefined;
  }

  return {
    state: {
      nodes,
      rootId: roots[0]?.id ?? "",
      selectedPath: bestPath.map(n => n.id),
    },
    bestPath,
  };
}

// ============================================================
// 11. Tool Integration Layer (SymPy + Code Execution)
// ============================================================

export interface ToolResult {
  tool: string;
  success: boolean;
  output: string;
  error?: string;
}

export interface ToolCall {
  name: "sympy" | "python" | "search" | "oeis";
  code?: string;           // for sympy / python
  query?: string;          // for search / oeis
}

/**
 * منفذ أدوات بسيط (يجب ربطه بـ sandbox حقيقي في الإنتاج)
 * هنا نضع الواجهة + محاكاة / هيكل جاهز.
 */
export async function executeTool(call: ToolCall): Promise<ToolResult> {
  try {
    switch (call.name) {
      case "sympy":
      case "python": {
        // في الإنتاج: أرسل إلى sandbox (E2B, Deno, Pyodide, أو سيرفر Python)
        // مثال هيكل:
        // const result = await runInSandbox(call.code ?? "");
        const code = call.code ?? "";
        if (!code.trim()) {
          return { tool: call.name, success: false, output: "", error: "Empty code" };
        }

        // محاكاة بسيطة (استبدلها بتنفيذ حقيقي)
        if (code.includes("collatz") || code.includes("Collatz")) {
          return {
            tool: call.name,
            success: true,
            output: "Simulated SymPy/Python result: Collatz sequence helpers ready.\n(Replace this with real sandbox execution)",
          };
        }

        return {
          tool: call.name,
          success: true,
          output: `[Sandbox Placeholder] Executed:\n${code.slice(0, 300)}\n\n→ Connect a real Python/SymPy runner here.`,
        };
      }

      case "oeis": {
        const q = call.query ?? "";
        return {
          tool: "oeis",
          success: true,
          output: `OEIS lookup placeholder for: ${q}\n(Integrate real OEIS API or local mirror)`,
        };
      }

      case "search": {
        return {
          tool: "search",
          success: true,
          output: `Search placeholder for: ${call.query}\n(Integrate Firecrawl / SearXNG / Bing API)`,
        };
      }

      default:
        return { tool: "unknown", success: false, output: "", error: "Unsupported tool" };
    }
  } catch (err: any) {
    return {
      tool: call.name,
      success: false,
      output: "",
      error: err?.message ?? "Tool execution failed",
    };
  }
}

/**
 * يقرر هل المسألة تحتاج أداة رمزية
 */
export function needsSymbolicTool(question: string, domain: Domain): boolean {
  if (domain === "math_logic" || domain === "open_problem") return true;
  const keywords = [
    "احسب", "بسط", "حل", "معادلة", "مشتق", "تكامل",
    "collatz", "sequence", "prove", "simplify", "factor", "matrix"
  ];
  const lower = question.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

/**
 * يبني طلب أداة SymPy تلقائياً من السؤال (مبسط جداً)
 */
export function buildSymPyCall(question: string): ToolCall {
  // في النسخة المتقدمة: استخدم نموذجاً ليولد كود SymPy
  return {
    name: "sympy",
    code: `
import sympy as sp

# Auto-generated scaffold – replace with LLM-generated code
x = sp.symbols('x')
print("SymPy ready for:", ${JSON.stringify(question.slice(0, 80))})
`.trim(),
  };
}

// ============================================================
// 12. Extended Kernel Entry (with ToT + Tools)
// ============================================================

export interface ExtendedKernelResult extends KernelResult {
  tot?: {
    bestPath: ThoughtNode[];
    strategiesUsed: string[];
  };
  toolResults?: ToolResult[];
}

export async function runOmegaKernelExtended(
  question: string,
  domain: Domain,
  candidates: ModelCandidate[],
  psiState: PsiState,
  difficultyEntropy = 1.2
): Promise<ExtendedKernelResult> {
  // --- Core scoring (from previous code) ---
  const { psiCons, newState } = computeConsensusPsi(candidates, psiState);
  const scores = computeHybridConfidence(candidates, psiCons, domain);
  const thinkingDepth = computeThinkingDepth(difficultyEntropy);

  let mode: "direct" | "aggregated" | "exploration" = "aggregated";
  if (shouldActivateDeepExploration(domain, question, scores.meanPsi)) {
    mode = "exploration";
  } else if (Math.max(...scores.Psi) >= 0.88) {
    mode = "direct";
  }

  const result: ExtendedKernelResult = {
    scores,
    mode,
    thinkingDepth,
    synthesizerPrompt: buildSynthesizerPrompt({
      question,
      domain,
      candidates,
      scores,
      mode,
    }),
    newPsiState: newState,
  };

  // --- Tree of Thoughts (only in exploration mode) ---
  if (mode === "exploration") {
    const { bestPath } = runTreeOfThoughts(question, Math.min(thinkingDepth, 4), 3);
    result.tot = {
      bestPath,
      strategiesUsed: [...new Set(bestPath.map(n => n.strategy))],
    };

    // أضف ملخص المسار إلى برومبت الـ Synthesizer
    const pathSummary = bestPath
      .map(n => `(${n.strategy}) ${n.content.slice(0, 100)}`)
      .join("\n→ ");
    result.synthesizerPrompt += `\n\n[مسار الاستكشاف الأفضل]\n${pathSummary}`;
  }

  // --- Tool execution ---
  const toolResults: ToolResult[] = [];
  if (needsSymbolicTool(question, domain)) {
    const sympyCall = buildSymPyCall(question);
    const tr = await executeTool(sympyCall);
    toolResults.push(tr);

    if (tr.success && tr.output) {
      result.synthesizerPrompt += `\n\n[نتيجة الأداة الرمزية – SymPy]\n${tr.output}`;
    }
  }

  result.toolResults = toolResults;
  return result;
}
