/**
 * src/lib/omega/inferenceEngine.ts
 * =============================================================================
 * Omega Stateful Inference Engine (محرك الاستنتاج ذو الحالة)
 * =============================================================================
 *
 * يحوّل نواة أوميغا من مجموعة دوال عديمة الحالة إلى خادم ذكاء اصطناعي
 * يحتفظ بحالة داخلية دائمة، يطوّر أوزانه ذاتياً، ويستنتج عبر مصفوفات.
 *
 * المكونات:
 *  1. Memory Matrix          — علاقات المفاهيم والمحادثات (من Firebase)
 *  2. Confidence Matrix      — أوزان الثقة الزمنية لكل معلومة
 *  3. Experience Matrix      — نتائج القرارات السابقة → قرارات لاحقة
 *  4. Model Agreement Matrix — اتفاق النماذج مع النتيجة النهائية
 *  5. Goal Matrix            — السرعة / الدقة / الإبداع / البحث العميق
 *  6. Knowledge Graph        — مصفوفة تجاور المفاهيم (استنتاج لا استرجاع فقط)
 *
 * + Event Engine, Long-term Memory Manager, Adaptive Learning,
 *   Reasoning Engine, Self-Evaluation
 *
 * متوافق مع: firebase.ts · realEvolution.ts · kernel.ts · fusion.ts
 */

import { hashEmbed } from "./embeddings";
import { cosine, normalize, softmax, entropy, clipExpPsi } from "./math";
import {
  getDb,
  getEvolutionState,
  saveEvolutionState,
  saveExperience,
  saveMemory,
  searchMemory,
  findSimilarExperiences,
  type KernelEvolutionState,
  type MemoryItem,
} from "./firebase";
import { MCTSEngine, type MCTSResult } from "./mctsTree";
import { HierarchicalMemoryManager } from "./hierarchicalMemory";
import { AdversarialDebateEngine, type DebateResult } from "./adversarialDebate";
import { SafeCodeSandbox, type ExecutionResult } from "./codeSandbox";

// =============================================================================
// Types
// =============================================================================

export type GoalAxis = "speed" | "accuracy" | "creativity" | "deep_research";
export type DomainTag =
  | "general"
  | "code"
  | "math_logic"
  | "science_factual"
  | "news_realtime"
  | "creative"
  | "open_problem";

export interface InferenceCandidate {
  modelId: string;
  text: string;
  psi?: number;
  latencyMs?: number;
}

export interface InferenceInput {
  userId: string;
  question: string;
  domain?: DomainTag;
  candidates?: InferenceCandidate[];
  finalAnswer?: string;
  verificationPassed?: boolean;
  chosenModelId?: string;
  topPsi?: number;
  spread?: number;
}

export interface InferenceResult {
  answer: string;
  confidence: number;
  goalProfile: Record<GoalAxis, number>;
  modelWeights: Record<string, number>;
  recalledMemories: string[];
  inferredFacts: string[];
  selfEval: SelfEvalReport;
  matrixSnapshot: MatrixSnapshot;
  generation: number;
}

export interface SelfEvalReport {
  score: number;
  coherence: number;
  novelty: number;
  risk: number;
  recommendations: string[];
}

export interface MatrixSnapshot {
  memoryRank: number;
  confidenceMean: number;
  experienceDepth: number;
  agreementEntropy: number;
  activeGoals: GoalAxis[];
  knowledgeNodes: number;
  knowledgeEdges: number;
}

// =============================================================================
// 1. Memory Matrix — علاقات المفاهيم والمحادثات
// =============================================================================

/**
 * مصفوفة كثيفة: rows = concepts, cols = concepts
 * M[i][j] = قوة الارتباط الدلالي (من تجارب Firebase + التضمين)
 */
export class MemoryMatrix {
  private conceptIndex = new Map<string, number>();
  private concepts: string[] = [];
  private matrix: number[][] = [];
  private embeddings = new Map<string, number[]>();
  private dim = 64;
  private decay = 0.995; // نسيان تدريجي

  private ensureConcept(c: string): number {
    const key = c.toLowerCase().trim().slice(0, 80);
    if (!this.conceptIndex.has(key)) {
      const idx = this.concepts.length;
      this.conceptIndex.set(key, idx);
      this.concepts.push(key);
      this.embeddings.set(key, hashEmbed(key, this.dim));
      // توسيع المصفوفة
      for (const row of this.matrix) row.push(0);
      this.matrix.push(new Array(idx + 1).fill(0));
    }
    return this.conceptIndex.get(key)!;
  }

  /** تقوية الرابط بين مفهومين (أو سلسلة مفاهيم من نص) */
  reinforce(a: string, b: string, strength = 0.15): void {
    if (a === b) return;
    const i = this.ensureConcept(a);
    const j = this.ensureConcept(b);
    this.matrix[i][j] = Math.min(1, this.matrix[i][j] + strength);
    this.matrix[j][i] = Math.min(1, this.matrix[j][i] + strength);
  }

  /** استخراج مفاهيم بسيطة من نص وتحديث الروابط */
  absorbText(text: string, weight = 0.1): void {
    const tokens = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length > 3)
      .slice(0, 24);
    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < Math.min(i + 4, tokens.length); j++) {
        this.reinforce(tokens[i], tokens[j], weight / (j - i));
      }
    }
  }

  /** أقرب المفاهيم لمفهوم معيّن */
  neighbors(concept: string, k = 5): { concept: string; strength: number }[] {
    const key = concept.toLowerCase().trim().slice(0, 80);
    if (!this.conceptIndex.has(key)) return [];
    const i = this.conceptIndex.get(key)!;
    return this.concepts
      .map((c, j) => ({ concept: c, strength: this.matrix[i][j] }))
      .filter((x) => x.strength > 0.05 && x.concept !== key)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, k);
  }

  /** استعلام دلالي عبر التضمين + المصفوفة */
  query(text: string, k = 5): { concept: string; score: number }[] {
    const q = hashEmbed(text, this.dim);
    const scored = this.concepts.map((c) => {
      const emb = this.embeddings.get(c)!;
      const sim = cosine(q, emb);
      const i = this.conceptIndex.get(c)!;
      const degree = this.matrix[i].reduce((s, v) => s + v, 0) / Math.max(1, this.concepts.length);
      return { concept: c, score: 0.7 * sim + 0.3 * degree };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, k);
  }

  /** تطبيق نسيان تدريجي على كل الروابط */
  applyDecay(): void {
    for (let i = 0; i < this.matrix.length; i++) {
      for (let j = 0; j < this.matrix[i].length; j++) {
        this.matrix[i][j] *= this.decay;
        if (this.matrix[i][j] < 0.01) this.matrix[i][j] = 0;
      }
    }
  }

  rank(): number {
    return this.concepts.length;
  }

  serialize(): { concepts: string[]; matrix: number[][] } {
    return { concepts: [...this.concepts], matrix: this.matrix.map((r) => [...r]) };
  }

  load(data: { concepts: string[]; matrix: number[][] }): void {
    this.concepts = data.concepts || [];
    this.matrix = data.matrix || [];
    this.conceptIndex.clear();
    this.embeddings.clear();
    this.concepts.forEach((c, i) => {
      this.conceptIndex.set(c, i);
      this.embeddings.set(c, hashEmbed(c, this.dim));
    });
  }
}

// =============================================================================
// 2. Confidence Matrix — وزن زمني لكل معلومة
// =============================================================================

export interface ConfidenceEntry {
  id: string;
  claim: string;
  domain: string;
  value: number; // 0..1
  successes: number;
  failures: number;
  lastTouch: number;
  halfLifeMs: number; // اضمحلال الثقة
}

export class ConfidenceMatrix {
  private entries = new Map<string, ConfidenceEntry>();

  private idOf(claim: string): string {
    return hashEmbed(claim, 8)
      .map((x) => Math.abs(x * 1000).toFixed(0))
      .join("")
      .slice(0, 16);
  }

  /** تحديث الثقة بعد تحقق ناجح/فاشل */
  update(claim: string, domain: string, success: boolean, magnitude = 0.08): ConfidenceEntry {
    const id = this.idOf(claim);
    let e = this.entries.get(id);
    if (!e) {
      e = {
        id,
        claim: claim.slice(0, 400),
        domain,
        value: 0.55,
        successes: 0,
        failures: 0,
        lastTouch: Date.now(),
        halfLifeMs: 1000 * 60 * 60 * 24 * 14, // أسبوعان
      };
      this.entries.set(id, e);
    }
    if (success) {
      e.successes += 1;
      e.value = Math.min(0.99, e.value + magnitude * (1 - e.value));
    } else {
      e.failures += 1;
      e.value = Math.max(0.05, e.value - magnitude * 1.4);
    }
    e.lastTouch = Date.now();
    return e;
  }

  /** ثقة فعّالة بعد اضمحلال زمني */
  effective(claim: string): number {
    const id = this.idOf(claim);
    const e = this.entries.get(id);
    if (!e) return 0.5;
    const age = Date.now() - e.lastTouch;
    const decay = Math.pow(0.5, age / e.halfLifeMs);
    return e.value * (0.4 + 0.6 * decay);
  }

  mean(): number {
    if (this.entries.size === 0) return 0.5;
    let s = 0;
    for (const e of this.entries.values()) s += this.effective(e.claim);
    return s / this.entries.size;
  }

  top(k = 10): ConfidenceEntry[] {
    return [...this.entries.values()]
      .map((e) => ({ ...e, value: this.effective(e.claim) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, k);
  }

  serialize(): ConfidenceEntry[] {
    return [...this.entries.values()];
  }

  load(list: ConfidenceEntry[]): void {
    this.entries.clear();
    for (const e of list || []) this.entries.set(e.id, e);
  }
}

// =============================================================================
// 3. Experience Matrix — قرارات سابقة → قرارات لاحقة
// =============================================================================

export interface ExperienceRecord {
  id: string;
  questionHash: string;
  domain: string;
  chosenModelId: string;
  topPsi: number;
  verificationPassed: boolean;
  goalSnapshot: Record<GoalAxis, number>;
  timestamp: number;
  embedding: number[];
}

export class ExperienceMatrix {
  private records: ExperienceRecord[] = [];
  private maxRecords = 500;
  private dim = 64;

  add(input: {
    question: string;
    domain: string;
    chosenModelId: string;
    topPsi: number;
    verificationPassed: boolean;
    goalSnapshot: Record<GoalAxis, number>;
  }): ExperienceRecord {
    const embedding = hashEmbed(input.question, this.dim);
    const rec: ExperienceRecord = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      questionHash: embedding
        .slice(0, 4)
        .map((x) => x.toFixed(3))
        .join("|"),
      domain: input.domain,
      chosenModelId: input.chosenModelId,
      topPsi: input.topPsi,
      verificationPassed: input.verificationPassed,
      goalSnapshot: { ...input.goalSnapshot },
      timestamp: Date.now(),
      embedding,
    };
    this.records.unshift(rec);
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(0, this.maxRecords);
    }
    return rec;
  }

  /** استرجاع تجارب مشابهة لتوجيه القرار */
  similar(question: string, k = 5): ExperienceRecord[] {
    const q = hashEmbed(question, this.dim);
    return this.records
      .map((r) => ({ r, sim: cosine(q, r.embedding) }))
      .filter((x) => x.sim > 0.12)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, k)
      .map((x) => x.r);
  }

  /** نموذج مفضّل لهذا السؤال بناءً على النجاح التاريخي */
  preferredModel(question: string, domain: string): string | null {
    const sims = this.similar(question, 12).filter(
      (r) => r.domain === domain || r.verificationPassed
    );
    if (sims.length === 0) return null;
    const scores = new Map<string, number>();
    for (const r of sims) {
      const w = (r.verificationPassed ? 1.2 : 0.4) * r.topPsi;
      scores.set(r.chosenModelId, (scores.get(r.chosenModelId) || 0) + w);
    }
    let best: string | null = null;
    let bestScore = -1;
    for (const [m, s] of scores) {
      if (s > bestScore) {
        bestScore = s;
        best = m;
      }
    }
    return best;
  }

  depth(): number {
    return this.records.length;
  }

  serialize(): ExperienceRecord[] {
    return [...this.records];
  }

  load(list: ExperienceRecord[]): void {
    this.records = list || [];
  }
}

// =============================================================================
// 4. Model Agreement Matrix — اتفاق النماذج مع النتيجة
// =============================================================================

export class ModelAgreementMatrix {
  /** rows/cols = modelIds ; A[i][j] = متوسط الاتفاق التاريخي */
  private models: string[] = [];
  private index = new Map<string, number>();
  private agreement: number[][] = [];
  private successCount = new Map<string, number>();
  private totalCount = new Map<string, number>();

  private ensure(m: string): number {
    if (!this.index.has(m)) {
      const i = this.models.length;
      this.index.set(m, i);
      this.models.push(m);
      for (const row of this.agreement) row.push(0.5);
      this.agreement.push(new Array(i + 1).fill(0.5));
      this.successCount.set(m, 0);
      this.totalCount.set(m, 0);
    }
    return this.index.get(m)!;
  }

  /**
   * بعد كل دمج: حدّث الاتفاق بين المرشحين والنموذج المختار
   * agreement += alpha * cosine(embed(text_i), embed(final))
   */
  recordRound(
    candidates: InferenceCandidate[],
    chosenModelId: string,
    finalText: string,
    verificationPassed: boolean
  ): void {
    const finalVec = hashEmbed(finalText, 64);
    for (const c of candidates) {
      this.ensure(c.modelId);
      const sim = Math.max(0, cosine(hashEmbed(c.text, 64), finalVec));
      const i = this.index.get(c.modelId)!;
      const j = this.ensure(chosenModelId);
      const alpha = 0.12;
      this.agreement[i][j] = (1 - alpha) * this.agreement[i][j] + alpha * sim;
      this.agreement[j][i] = this.agreement[i][j];
      this.totalCount.set(c.modelId, (this.totalCount.get(c.modelId) || 0) + 1);
      if (verificationPassed && c.modelId === chosenModelId) {
        this.successCount.set(c.modelId, (this.successCount.get(c.modelId) || 0) + 1);
      }
    }
  }

  /** أوزان دمج ديناميكية من معدل النجاح + الاتفاق */
  fusionWeights(modelIds: string[]): Record<string, number> {
    const raw = modelIds.map((m) => {
      this.ensure(m);
      const total = this.totalCount.get(m) || 1;
      const succ = this.successCount.get(m) || 0;
      const successRate = succ / total;
      const i = this.index.get(m)!;
      const avgAgree =
        this.agreement[i].reduce((s, v) => s + v, 0) / Math.max(1, this.agreement[i].length);
      return 0.55 * successRate + 0.45 * avgAgree;
    });
    const soft = softmax(raw, 0.7);
    const out: Record<string, number> = {};
    modelIds.forEach((m, i) => {
      out[m] = Number(soft[i].toFixed(4));
    });
    return out;
  }

  agreementEntropy(): number {
    if (this.models.length < 2) return 0;
    const flat = this.agreement.flat().filter((x) => x > 0);
    if (flat.length === 0) return 0;
    const s = flat.reduce((a, b) => a + b, 0);
    const p = flat.map((x) => x / s);
    return entropy(p);
  }

  serialize() {
    return {
      models: this.models,
      agreement: this.agreement,
      successCount: Object.fromEntries(this.successCount),
      totalCount: Object.fromEntries(this.totalCount),
    };
  }

  load(data: {
    models?: string[];
    agreement?: number[][];
    successCount?: Record<string, number>;
    totalCount?: Record<string, number>;
  }): void {
    this.models = data.models || [];
    this.agreement = data.agreement || [];
    this.index.clear();
    this.models.forEach((m, i) => this.index.set(m, i));
    this.successCount = new Map(Object.entries(data.successCount || {}));
    this.totalCount = new Map(Object.entries(data.totalCount || {}));
  }
}

// =============================================================================
// 5. Goal Matrix — السرعة / الدقة / الإبداع / البحث العميق
// =============================================================================

export class GoalMatrix {
  private profile: Record<GoalAxis, number> = {
    speed: 0.25,
    accuracy: 0.35,
    creativity: 0.2,
    deep_research: 0.2,
  };

  /** استنتاج ملف الأهداف من نص السؤال + المجال */
  inferFromQuery(question: string, domain: DomainTag = "general"): Record<GoalAxis, number> {
    const q = question.toLowerCase();
    let speed = 0.2;
    let accuracy = 0.3;
    let creativity = 0.2;
    let deep = 0.3;

    if (/\b(سريع|باختصار|ملخص|quick|brief|tl;dr|عاجل)\b/i.test(q)) speed += 0.35;
    if (/\b(دقيق|برهن|اثبت|دليل|precise|prove|rigorous|معادلة)\b/i.test(q)) accuracy += 0.35;
    if (/\b(أبدع|قصة|شعر|تخيل|creative|story|poem|تخيل)\b/i.test(q)) creativity += 0.4;
    if (/\b(اشرح بالتفصيل|بحث|تحليل عميق|deep|research|exhaustive|لماذا)\b/i.test(q)) deep += 0.35;

    if (domain === "code" || domain === "math_logic") accuracy += 0.15;
    if (domain === "creative") creativity += 0.2;
    if (domain === "news_realtime") speed += 0.2;
    if (domain === "open_problem" || domain === "science_factual") deep += 0.15;

    const raw = [speed, accuracy, creativity, deep];
    const soft = softmax(raw, 1.0);
    this.profile = {
      speed: soft[0],
      accuracy: soft[1],
      creativity: soft[2],
      deep_research: soft[3],
    };
    return { ...this.profile };
  }

  get(): Record<GoalAxis, number> {
    return { ...this.profile };
  }

  dominant(): GoalAxis[] {
    return (Object.entries(this.profile) as [GoalAxis, number][])
      .sort((a, b) => b[1] - a[1])
      .filter(([, v]) => v >= 0.22)
      .map(([k]) => k);
  }

  /** معاملات تشغيل مستمدة من الأهداف */
  runtimeParams(): {
    temperature: number;
    maxTokens: number;
    preferFastModels: boolean;
    requireVerification: boolean;
  } {
    const g = this.profile;
    return {
      temperature: Number((0.2 + 0.7 * g.creativity + 0.15 * g.deep_research).toFixed(3)),
      maxTokens: Math.round(400 + 1200 * g.deep_research + 400 * g.accuracy),
      preferFastModels: g.speed > 0.35,
      requireVerification: g.accuracy > 0.3 || g.deep_research > 0.3,
    };
  }

  serialize() {
    return { ...this.profile };
  }

  load(p: Partial<Record<GoalAxis, number>>): void {
    this.profile = { ...this.profile, ...p };
  }
}

// =============================================================================
// 6. Knowledge Graph — مصفوفة تجاور + استنتاج
// =============================================================================

export interface KGNode {
  id: string;
  label: string;
  embedding: number[];
  weight: number;
}

export interface KGEdge {
  from: string;
  to: string;
  relation: string;
  weight: number;
}

export class KnowledgeGraph {
  private nodes = new Map<string, KGNode>();
  private edges: KGEdge[] = [];
  private adj = new Map<string, Map<string, number>>(); // adjacency matrix sparse
  private dim = 64;

  private nid(label: string): string {
    return label.toLowerCase().trim().slice(0, 64);
  }

  addNode(label: string, weight = 1): KGNode {
    const id = this.nid(label);
    if (this.nodes.has(id)) {
      const n = this.nodes.get(id)!;
      n.weight = Math.min(10, n.weight + 0.1);
      return n;
    }
    const node: KGNode = {
      id,
      label,
      embedding: hashEmbed(label, this.dim),
      weight,
    };
    this.nodes.set(id, node);
    this.adj.set(id, new Map());
    return node;
  }

  addEdge(from: string, to: string, relation = "related", weight = 0.5): void {
    const a = this.addNode(from);
    const b = this.addNode(to);
    if (a.id === b.id) return;
    this.edges.push({ from: a.id, to: b.id, relation, weight });
    const row = this.adj.get(a.id)!;
    row.set(b.id, Math.min(1, (row.get(b.id) || 0) + weight));
    const rowB = this.adj.get(b.id)!;
    rowB.set(a.id, Math.min(1, (rowB.get(a.id) || 0) + weight * 0.8));
  }

  /** بناء روابط من جملة سؤال/إجابة */
  ingestUtterance(text: string): void {
    const parts = text
      .split(/[،,.؛;:!?\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8)
      .slice(0, 12);
    for (let i = 0; i < parts.length; i++) {
      this.addNode(parts[i].slice(0, 80));
      if (i > 0) this.addEdge(parts[i - 1].slice(0, 80), parts[i].slice(0, 80), "sequence", 0.3);
    }
    // كلمات مفتاحية
    const words = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 16);
    for (let i = 0; i < words.length - 1; i++) {
      this.addEdge(words[i], words[i + 1], "cooccur", 0.15);
    }
  }

  /**
   * استنتاج بسيط: مسارات بطول 2 من عقد مرتبطة بالسؤال
   * → "حقائق" مرشحة لم تُذكر مباشرة
   */
  infer(question: string, maxFacts = 5): string[] {
    const qVec = hashEmbed(question, this.dim);
    const seeds = [...this.nodes.values()]
      .map((n) => ({ n, sim: cosine(qVec, n.embedding) * n.weight }))
      .filter((x) => x.sim > 0.15)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 6)
      .map((x) => x.n.id);

    const facts: { text: string; score: number }[] = [];
    for (const s of seeds) {
      const mid = this.adj.get(s);
      if (!mid) continue;
      for (const [m, w1] of mid) {
        const midNode = this.nodes.get(m);
        if (!midNode) continue;
        const next = this.adj.get(m);
        if (!next) continue;
        for (const [t, w2] of next) {
          if (t === s) continue;
          const target = this.nodes.get(t);
          if (!target) continue;
          const score = w1 * w2 * midNode.weight * 0.5;
          if (score > 0.05) {
            facts.push({
              text: `${this.nodes.get(s)?.label} ↔ ${midNode.label} ↔ ${target.label}`,
              score,
            });
          }
        }
      }
    }
    return facts
      .sort((a, b) => b.score - a.score)
      .slice(0, maxFacts)
      .map((f) => f.text);
  }

  nodeCount(): number {
    return this.nodes.size;
  }

  edgeCount(): number {
    return this.edges.length;
  }

  serialize() {
    return {
      nodes: [...this.nodes.values()],
      edges: this.edges,
    };
  }

  load(data: { nodes?: KGNode[]; edges?: KGEdge[] }): void {
    this.nodes.clear();
    this.adj.clear();
    this.edges = [];
    for (const n of data.nodes || []) {
      this.nodes.set(n.id, n);
      this.adj.set(n.id, new Map());
    }
    for (const e of data.edges || []) {
      this.edges.push(e);
      if (!this.adj.has(e.from)) this.adj.set(e.from, new Map());
      this.adj.get(e.from)!.set(e.to, e.weight);
    }
  }
}

// =============================================================================
// Event Engine — يتفاعل مع تحديثات Firebase / التفاعلات
// =============================================================================

export type OmegaEventType =
  | "interaction"
  | "verification"
  | "evolution"
  | "memory_write"
  | "matrix_decay"
  | "self_eval";

export interface OmegaEvent {
  type: OmegaEventType;
  userId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

type EventHandler = (ev: OmegaEvent) => void | Promise<void>;

export class EventEngine {
  private handlers = new Map<OmegaEventType | "*", EventHandler[]>();
  private queue: OmegaEvent[] = [];
  private processing = false;

  on(type: OmegaEventType | "*", handler: EventHandler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler);
    return () => {
      const list = this.handlers.get(type) || [];
      this.handlers.set(
        type,
        list.filter((h) => h !== handler)
      );
    };
  }

  emit(ev: Omit<OmegaEvent, "timestamp"> & { timestamp?: number }): void {
    this.queue.push({ ...ev, timestamp: ev.timestamp ?? Date.now() });
    void this.flush();
  }

  private async flush(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const ev = this.queue.shift()!;
      const specific = this.handlers.get(ev.type) || [];
      const all = this.handlers.get("*") || [];
      for (const h of [...specific, ...all]) {
        try {
          await h(ev);
        } catch (err) {
          console.error("[Omega EventEngine]", ev.type, err);
        }
      }
    }
    this.processing = false;
  }
}

// =============================================================================
// Long-term Memory Manager
// =============================================================================

export class LongTermMemoryManager {
  constructor(private userId: string) {}

  async recall(question: string, limit = 4): Promise<string[]> {
    const emb = hashEmbed(question, 64);
    try {
      const items = await searchMemory(this.userId, emb, limit);
      return items.map(
        (m) =>
          `[ذاكرة ψ≈${(m.confidence ?? 0.5).toFixed(2)}] ${m.topic || ""}: ${String(m.content || "").slice(0, 280)}`
      );
    } catch {
      return [];
    }
  }

  async persist(
    topic: string,
    content: string,
    domain: string,
    confidence: number,
    tags: string[] = []
  ): Promise<void> {
    try {
      await saveMemory({
        userId: this.userId,
        topic,
        content: content.slice(0, 4000),
        domain,
        confidence,
        tags,
        embedding: hashEmbed(topic + " " + content, 64),
        accessCount: 1,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("[LTM persist]", err);
    }
  }

  async recallExperiences(question: string, limit = 3): Promise<string> {
    try {
      const emb = hashEmbed(question, 64);
      const similar = await findSimilarExperiences(this.userId, emb, limit);
      if (!similar.length) return "";
      return similar
        .map(
          (s, i) =>
            `${i + 1}. س: ${s.question.slice(0, 100)}… | ψ=${s.topPsi.toFixed(2)} | ${s.verificationPassed ? "✓" : "✗"}`
        )
        .join("\n");
    } catch {
      return "";
    }
  }
}

// =============================================================================
// Adaptive Learning Unit
// =============================================================================

export class AdaptiveLearningUnit {
  /** يعدّل learnedConfig في حالة التطور حسب المصفوفات */
  async adapt(
    userId: string,
    input: InferenceInput,
    goals: Record<GoalAxis, number>,
    modelWeights: Record<string, number>
  ): Promise<KernelEvolutionState> {
    const state = await getEvolutionState(userId);
    state.totalInteractions += 1;
    if (input.verificationPassed) state.successfulVerifications += 1;
    else state.failedVerifications += 1;

    const domain = input.domain || "general";
    if (!state.domainStats[domain]) {
      state.domainStats[domain] = {
        count: 0,
        avgPsi: 0,
        successRate: 0,
        preferredModels: [],
      };
    }
    const ds = state.domainStats[domain];
    const n = ds.count;
    ds.count += 1;
    const psi = input.topPsi ?? 0.7;
    ds.avgPsi = (ds.avgPsi * n + psi) / ds.count;
    ds.successRate =
      (ds.successRate * n + (input.verificationPassed ? 1 : 0)) / ds.count;

    if (input.chosenModelId && input.verificationPassed) {
      if (!ds.preferredModels.includes(input.chosenModelId)) {
        ds.preferredModels.push(input.chosenModelId);
        if (ds.preferredModels.length > 6) ds.preferredModels.shift();
      }
    }

    // تكييف العتبات من الأهداف + النجاح
    const successRate =
      state.totalInteractions > 0
        ? state.successfulVerifications / state.totalInteractions
        : 0.5;

    if (!input.verificationPassed) {
      state.learnedConfig.directThreshold = Math.min(
        0.95,
        state.learnedConfig.directThreshold + 0.008
      );
      state.learnedConfig.uncertainSpread = Math.min(
        0.22,
        state.learnedConfig.uncertainSpread + 0.004
      );
    } else if (psi > 0.9 && successRate > 0.75) {
      state.learnedConfig.directThreshold = Math.max(
        0.78,
        state.learnedConfig.directThreshold - 0.004
      );
    }

    if (goals.deep_research > 0.35) {
      state.learnedConfig.maxModelsPerDomain = Math.min(
        5,
        state.learnedConfig.maxModelsPerDomain + 1
      );
    } else if (goals.speed > 0.4) {
      state.learnedConfig.maxModelsPerDomain = Math.max(
        1,
        state.learnedConfig.maxModelsPerDomain - 1
      );
    }

    // invariants من أوزان النماذج
    const topModel = Object.entries(modelWeights).sort((a, b) => b[1] - a[1])[0];
    if (state.totalInteractions % 5 === 0) {
      state.generation += 1;
      const inv = `Gen ${state.generation}: domain=${domain} ψ=${psi.toFixed(2)} goal=${Object.entries(goals)
        .sort((a, b) => b[1] - a[1])[0][0]} topModel=${topModel?.[0] || "?"}`;
      state.learnedInvariants.push(inv);
      if (state.learnedInvariants.length > 40) {
        state.learnedInvariants = state.learnedInvariants.slice(-40);
      }
    }

    state.lastUpdated = Date.now();
    await saveEvolutionState(state);

    if (input.question && input.finalAnswer) {
      await saveExperience({
        userId,
        question: input.question,
        finalAnswer: input.finalAnswer.slice(0, 2000),
        domain,
        topPsi: psi,
        verificationPassed: !!input.verificationPassed,
        chosenModelId: input.chosenModelId,
        candidatesCount: input.candidates?.length || 1,
        spread: input.spread ?? 0.1,
        timestamp: Date.now(),
        embedding: hashEmbed(input.question, 64),
      });
    }

    return state;
  }
}

// =============================================================================
// Reasoning Engine — استدلال عبر المصفوفات (ليس فقط استدعاء نماذج)
// =============================================================================

export class ReasoningEngine {
  constructor(
    private memory: MemoryMatrix,
    private confidence: ConfidenceMatrix,
    private experience: ExperienceMatrix,
    private agreement: ModelAgreementMatrix,
    private goals: GoalMatrix,
    private knowledge: KnowledgeGraph
  ) {}

  /**
   * دورة استدلال كاملة قبل/بعد استدعاء النماذج
   */
  reason(input: InferenceInput): {
    contextBlock: string;
    modelWeights: Record<string, number>;
    runtime: ReturnType<GoalMatrix["runtimeParams"]>;
    inferredFacts: string[];
    preferredModel: string | null;
  } {
    const domain = input.domain || "general";
    const goalProfile = this.goals.inferFromQuery(input.question, domain);
    const runtime = this.goals.runtimeParams();

    // ذاكرة مفاهيمية
    this.memory.absorbText(input.question, 0.08);
    const memHits = this.memory.query(input.question, 5);

    // معرفة
    this.knowledge.ingestUtterance(input.question);
    const inferredFacts = this.knowledge.infer(input.question, 4);

    // خبرة
    const preferredModel = this.experience.preferredModel(input.question, domain);
    const past = this.experience.similar(input.question, 3);

    // أوزان النماذج
    const modelIds =
      input.candidates?.map((c) => c.modelId) ||
      (preferredModel ? [preferredModel] : ["qwen-2-5-compat", "gemini-3.8-flash", "llama-3-3-compat"]);
    let modelWeights = this.agreement.fusionWeights(modelIds);
    if (preferredModel && modelWeights[preferredModel] !== undefined) {
      modelWeights[preferredModel] = Math.min(0.95, modelWeights[preferredModel] + 0.12);
      const sum = Object.values(modelWeights).reduce((a, b) => a + b, 0);
      for (const k of Object.keys(modelWeights)) {
        modelWeights[k] = Number((modelWeights[k] / sum).toFixed(4));
      }
    }

    const confHint = this.confidence.mean();

    const contextBlock = [
      "### سياق محرك الاستنتاج أوميغا",
      `أهداف: ${JSON.stringify(goalProfile)}`,
      `ثقة متوسطة للنواة: ${confHint.toFixed(3)}`,
      memHits.length
        ? `مفاهيم مرتبطة: ${memHits.map((m) => m.concept).join("، ")}`
        : "",
      inferredFacts.length ? `استنتاجات بيانية:\n- ${inferredFacts.join("\n- ")}` : "",
      past.length
        ? `خبرات سابقة مشابهة: ${past.map((p) => `${p.chosenModelId}(ψ=${p.topPsi.toFixed(2)})`).join(", ")}`
        : "",
      preferredModel ? `نموذج مفضّل من الخبرة: ${preferredModel}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return { contextBlock, modelWeights, runtime, inferredFacts, preferredModel };
  }

  /** بعد الحصول على إجابة نهائية — تحديث كل المصفوفات */
  integrateOutcome(input: InferenceInput): void {
    if (!input.finalAnswer) return;
    const domain = input.domain || "general";
    this.memory.absorbText(input.question + " " + input.finalAnswer, 0.12);
    this.knowledge.ingestUtterance(input.finalAnswer);
    this.confidence.update(
      input.finalAnswer.slice(0, 300),
      domain,
      !!input.verificationPassed,
      0.1
    );
    this.experience.add({
      question: input.question,
      domain,
      chosenModelId: input.chosenModelId || "unknown",
      topPsi: input.topPsi ?? 0.7,
      verificationPassed: !!input.verificationPassed,
      goalSnapshot: this.goals.get(),
    });
    if (input.candidates?.length) {
      this.agreement.recordRound(
        input.candidates,
        input.chosenModelId || input.candidates[0].modelId,
        input.finalAnswer,
        !!input.verificationPassed
      );
    }
  }
}

// =============================================================================
// Self-Evaluation
// =============================================================================

export class SelfEvaluation {
  evaluate(
    question: string,
    answer: string,
    topPsi: number,
    verificationPassed: boolean,
    inferredFacts: string[],
    confidenceMean: number
  ): SelfEvalReport {
    const len = answer.length;
    const hasStructure = /[:\n•\-\d]/.test(answer) || /\\[(\[]/.test(answer);
    const novelty = Math.min(1, 0.3 + inferredFacts.length * 0.12 + (len > 400 ? 0.15 : 0));
    const coherence =
      0.4 * topPsi +
      0.25 * (verificationPassed ? 1 : 0.4) +
      0.2 * confidenceMean +
      0.15 * (hasStructure ? 1 : 0.5);
    const risk = Math.max(
      0,
      1 -
        coherence +
        (len < 40 ? 0.2 : 0) +
        (!verificationPassed ? 0.15 : 0)
    );
    const score = Number(
      Math.max(0.05, Math.min(0.99, 0.55 * coherence + 0.25 * novelty + 0.2 * (1 - risk))).toFixed(4)
    );

    const recommendations: string[] = [];
    if (topPsi < 0.75) recommendations.push("زيادة عدد نماذج الـ ensemble أو تفعيل التحقق الذاتي");
    if (!verificationPassed) recommendations.push("إعادة صياغة الإجابة مع قيود منطقية أصرح");
    if (inferredFacts.length === 0) recommendations.push("تغذية Knowledge Graph بمزيد من التفاعلات");
    if (confidenceMean < 0.45) recommendations.push("مراجعة Confidence Matrix — ثقة منخفضة مزمنة");
    if (recommendations.length === 0) recommendations.push("الأداء ضمن النطاق المستقر");

    return {
      score,
      coherence: Number(coherence.toFixed(4)),
      novelty: Number(novelty.toFixed(4)),
      risk: Number(risk.toFixed(4)),
      recommendations,
    };
  }
}

// =============================================================================
// Omega Inference Engine — المُنسّق الرئيسي (Stateful AI Server core)
// =============================================================================

export class OmegaInferenceEngine {
  readonly memory = new MemoryMatrix();
  readonly confidence = new ConfidenceMatrix();
  readonly experience = new ExperienceMatrix();
  readonly agreement = new ModelAgreementMatrix();
  readonly goals = new GoalMatrix();
  readonly knowledge = new KnowledgeGraph();
  readonly events = new EventEngine();
  readonly adaptive = new AdaptiveLearningUnit();
  readonly selfEval = new SelfEvaluation();
  readonly reasoning: ReasoningEngine;
  readonly mcts = new MCTSEngine();
  readonly hierarchicalMemory: HierarchicalMemoryManager;
  readonly debate = new AdversarialDebateEngine();
  readonly sandbox = new SafeCodeSandbox();

  private userId: string;
  private ltm: LongTermMemoryManager;
  private persistTimer: ReturnType<typeof setInterval> | null = null;
  private generation = 1;

  constructor(userId = "anonymous") {
    this.userId = userId;
    this.ltm = new LongTermMemoryManager(userId);
    this.hierarchicalMemory = new HierarchicalMemoryManager(userId);
    this.reasoning = new ReasoningEngine(
      this.memory,
      this.confidence,
      this.experience,
      this.agreement,
      this.goals,
      this.knowledge
    );

    // اضمحلال دوري للذاكرة المفاهيمية
    this.events.on("matrix_decay", () => {
      this.memory.applyDecay();
    });

    this.events.on("interaction", async (ev) => {
      // يُربَط من الخارج بعد كل رد
      void ev;
    });
  }

  setUser(userId: string): void {
    this.userId = userId;
    this.ltm = new LongTermMemoryManager(userId);
    (this as any).hierarchicalMemory = new HierarchicalMemoryManager(userId);
  }

  /** تحميل لقطة الحالة من كائن (من Firebase لاحقاً) */
  hydrate(snapshot: {
    generation?: number;
    memory?: ReturnType<MemoryMatrix["serialize"]>;
    confidence?: ReturnType<ConfidenceMatrix["serialize"]>;
    experience?: ReturnType<ExperienceMatrix["serialize"]>;
    agreement?: ReturnType<ModelAgreementMatrix["serialize"]>;
    goals?: ReturnType<GoalMatrix["serialize"]>;
    knowledge?: ReturnType<KnowledgeGraph["serialize"]>;
  }): void {
    if (snapshot.generation) this.generation = snapshot.generation;
    if (snapshot.memory) this.memory.load(snapshot.memory);
    if (snapshot.confidence) this.confidence.load(snapshot.confidence);
    if (snapshot.experience) this.experience.load(snapshot.experience);
    if (snapshot.agreement) this.agreement.load(snapshot.agreement);
    if (snapshot.goals) this.goals.load(snapshot.goals);
    if (snapshot.knowledge) this.knowledge.load(snapshot.knowledge);
  }

  snapshot() {
    return {
      generation: this.generation,
      memory: this.memory.serialize(),
      confidence: this.confidence.serialize(),
      experience: this.experience.serialize(),
      agreement: this.agreement.serialize(),
      goals: this.goals.serialize(),
      knowledge: this.knowledge.serialize(),
      matrixSnapshot: this.matrixSnapshot(),
    };
  }

  matrixSnapshot(): MatrixSnapshot {
    return {
      memoryRank: this.memory.rank(),
      confidenceMean: Number(this.confidence.mean().toFixed(4)),
      experienceDepth: this.experience.depth(),
      agreementEntropy: Number(this.agreement.agreementEntropy().toFixed(4)),
      activeGoals: this.goals.dominant(),
      knowledgeNodes: this.knowledge.nodeCount(),
      knowledgeEdges: this.knowledge.edgeCount(),
    };
  }

  /**
   * مرحلة ما قبل الاستدعاء — تُرجع سياقاً وأوزاناً لطبقة الـ fusion / complete
   */
  async prepare(input: InferenceInput): Promise<{
    contextBlock: string;
    modelWeights: Record<string, number>;
    runtime: ReturnType<GoalMatrix["runtimeParams"]>;
    inferredFacts: string[];
    preferredModel: string | null;
    longTermRecall: string[];
    experienceContext: string;
  }> {
    const pre = this.reasoning.reason(input);
    const longTermRecall = await this.ltm.recall(input.question, 4);
    const experienceContext = await this.ltm.recallExperiences(input.question, 3);
    const hierarchical = await this.hierarchicalMemory.buildHierarchicalContext(input.question);

    const contextBlock = [
      pre.contextBlock,
      hierarchical.formattedBlock,
      longTermRecall.length ? `### ذاكرة طويلة الأمد\n${longTermRecall.join("\n")}` : "",
      experienceContext ? `### تجارب Firestore\n${experienceContext}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      ...pre,
      contextBlock,
      longTermRecall,
      experienceContext,
    };
  }

  /**
   * مرحلة ما بعد الإجابة — تحديث المصفوفات + Firebase + تقييم ذاتي
   */
  async commit(input: InferenceInput): Promise<InferenceResult> {
    const answer = input.finalAnswer || "";
    this.reasoning.integrateOutcome(input);

    const modelWeights = input.candidates?.length
      ? this.agreement.fusionWeights(input.candidates.map((c) => c.modelId))
      : {};

    const state = await this.adaptive.adapt(
      this.userId,
      input,
      this.goals.get(),
      modelWeights
    );
    this.generation = state.generation;

    // ذاكرة طويلة الأمد عند ثقة عالية
    const psi = input.topPsi ?? 0.7;
    if (answer && psi >= 0.8 && input.verificationPassed) {
      await this.ltm.persist(
        input.question.slice(0, 120),
        answer.slice(0, 2000),
        input.domain || "general",
        psi,
        [input.chosenModelId || "ensemble", "auto"]
      );
    }

    const inferredFacts = this.knowledge.infer(input.question, 4);
    const selfEval = this.selfEval.evaluate(
      input.question,
      answer,
      psi,
      !!input.verificationPassed,
      inferredFacts,
      this.confidence.mean()
    );

    this.events.emit({
      type: "interaction",
      userId: this.userId,
      payload: {
        psi,
        score: selfEval.score,
        domain: input.domain,
        generation: this.generation,
      },
    });

    this.events.emit({
      type: "self_eval",
      userId: this.userId,
      payload: { ...selfEval },
    });

    // اضمحلال خفيف كل تفاعل
    if (this.generation % 3 === 0) {
      this.events.emit({
        type: "matrix_decay",
        userId: this.userId,
        payload: {},
      });
    }

    return {
      answer,
      confidence: selfEval.score,
      goalProfile: this.goals.get(),
      modelWeights,
      recalledMemories: (await this.ltm.recall(input.question, 3)).map((s) => s.slice(0, 120)),
      inferredFacts,
      selfEval,
      matrixSnapshot: this.matrixSnapshot(),
      generation: this.generation,
    };
  }

  /**
   * مسار مختصر: prepare → (استدعاء نماذج خارجي) → commit
   * للاستخدام عندما تكون الإجابة جاهزة مسبقاً
   */
  async runCycle(input: InferenceInput): Promise<InferenceResult> {
    await this.prepare(input);
    return this.commit(input);
  }

  /** بدء حفظ دوري اختياري للقطة المصفوفات في Firestore عبر evolution doc */
  startBackgroundPersist(intervalMs = 120_000): void {
    if (this.persistTimer) return;
    this.persistTimer = setInterval(() => {
      void this.persistMatricesToEvolutionDoc();
    }, intervalMs);
  }

  stopBackgroundPersist(): void {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }
  }

  private async persistMatricesToEvolutionDoc(): Promise<void> {
    try {
      const state = await getEvolutionState(this.userId);
      (state as any).inferenceMatrices = {
        updatedAt: Date.now(),
        snapshot: this.matrixSnapshot(),
        // تخزين مضغوط — بدون كامل المصفوفات الضخمة إن كبرت
        goals: this.goals.serialize(),
        agreementSummary: this.agreement.serialize(),
        confidenceTop: this.confidence.top(15),
        knowledgeStats: {
          nodes: this.knowledge.nodeCount(),
          edges: this.knowledge.edgeCount(),
        },
        experienceDepth: this.experience.depth(),
        memoryRank: this.memory.rank(),
      };
      await saveEvolutionState(state);
    } catch (err) {
      console.error("[OmegaInferenceEngine persist]", err);
    }
  }
}

// =============================================================================
// Singleton للخادم
// =============================================================================

const enginePool = new Map<string, OmegaInferenceEngine>();

export function getInferenceEngine(userId = "anonymous"): OmegaInferenceEngine {
  if (!enginePool.has(userId)) {
    const eng = new OmegaInferenceEngine(userId);
    eng.startBackgroundPersist(180_000);
    enginePool.set(userId, eng);
  }
  return enginePool.get(userId)!;
}

export function resetInferenceEngine(userId = "anonymous"): void {
  const existing = enginePool.get(userId);
  if (existing) existing.stopBackgroundPersist();
  enginePool.delete(userId);
}
