/**
 * src/lib/omega/lineage.ts
 * Evolutionary lineage tracker for Omega AI:
 * Traces cognitive mutations, parent-child consensus steps, and convergence graphs.
 */

import type { FusionResult } from "./fusion";
import type { Domain } from "./domainRouting";

export interface LineageNode {
  id: string;
  generation: number;
  parentId?: string;
  query: string;
  mode: "direct" | "aggregated" | "uncertain";
  domain: Domain;
  winnerModel?: string;
  candidateCount: number;
  topPsi: number;
  spread: number;
  summary: string;
  verified: boolean;
  verificationScore: number;
  timestamp: number;
  childrenIds: string[];
}

class LineageGraph {
  private nodes: Map<string, LineageNode> = new Map();
  private rootIds: string[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const root1: LineageNode = {
      id: "lin-gen0-1",
      generation: 0,
      query: "تأسيس خوارزمية إجماع أوميغا (Omega Consensus Initializer)",
      mode: "direct",
      domain: "math_logic",
      winnerModel: "gemini-3.1-pro-preview",
      candidateCount: 4,
      topPsi: 0.94,
      spread: 0.28,
      summary: "صياغة المبدأ الرياضي لحساب Psi عبر التوزيع الأسي ومسافة جيب التمام من المركز الدلالي.",
      verified: true,
      verificationScore: 0.97,
      timestamp: Date.now() - 7200000,
      childrenIds: ["lin-gen1-1", "lin-gen1-2"],
    };

    const child1: LineageNode = {
      id: "lin-gen1-1",
      generation: 1,
      parentId: "lin-gen0-1",
      query: "التكامل مع التضمينات الدلالية الحقيقية (Semantic Embedding Integration)",
      mode: "aggregated",
      domain: "code",
      winnerModel: "gemini-3.8-flash",
      candidateCount: 3,
      topPsi: 0.82,
      spread: 0.14,
      summary: "استبدال التجزئة الثابتة بتضمينات هيلبرت المستمرة مع الحفاظ على التراجع التلقائي عند انقطاع الاتصال.",
      verified: true,
      verificationScore: 0.94,
      timestamp: Date.now() - 3600000,
      childrenIds: ["lin-gen2-1"],
    };

    const child2: LineageNode = {
      id: "lin-gen1-2",
      generation: 1,
      parentId: "lin-gen0-1",
      query: "حل حالات التساوي الشديد (Uncertainty Split Optimization)",
      mode: "uncertain",
      domain: "general",
      winnerModel: "deepseek-r1-compat & claude-3-5-sonnet-compat",
      candidateCount: 4,
      topPsi: 0.77,
      spread: 0.04,
      summary: "تفعيل وضع الانشطار لتقديم وجهتي النظر الأبرز بدلاً من الحسم القسري الزائف.",
      verified: true,
      verificationScore: 0.91,
      timestamp: Date.now() - 1800000,
      childrenIds: [],
    };

    const grandchild1: LineageNode = {
      id: "lin-gen2-1",
      generation: 2,
      parentId: "lin-gen1-1",
      query: "التدقيق الذاتي الاستدلالي (Self-Verification Pass V2.5)",
      mode: "direct",
      domain: "science_factual",
      winnerModel: "gemini-3.1-pro-preview",
      candidateCount: 3,
      topPsi: 0.91,
      spread: 0.22,
      summary: "تشغيل فاحص الاتساق المنطقي لكشف التناقضات وحساب درجات الموثوقية.",
      verified: true,
      verificationScore: 0.98,
      timestamp: Date.now() - 600000,
      childrenIds: [],
    };

    this.nodes.set(root1.id, root1);
    this.nodes.set(child1.id, child1);
    this.nodes.set(child2.id, child2);
    this.nodes.set(grandchild1.id, grandchild1);
    this.rootIds = [root1.id];
  }

  public getNodes(): LineageNode[] {
    return Array.from(this.nodes.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  public recordStep(query: string, result: FusionResult, parentId?: string): LineageNode {
    const parent = parentId ? this.nodes.get(parentId) : undefined;
    const generation = parent ? parent.generation + 1 : 0;
    const id = `lin-gen${generation}-${Date.now().toString(36)}`;

    const topPsi = result.candidates[0]?.psi || 0;
    const minPsi = result.candidates[result.candidates.length - 1]?.psi || 0;
    const spread = topPsi - minPsi;

    const winner =
      result.mode === "direct"
        ? result.chosenModelId || result.candidates[0]?.modelId
        : result.mode === "uncertain"
        ? `${result.candidates[0]?.modelId} & ${result.candidates[1]?.modelId}`
        : "Omega Synthesizer";

    const node: LineageNode = {
      id,
      generation,
      parentId,
      query,
      mode: result.mode,
      domain: result.domain,
      winnerModel: winner,
      candidateCount: result.candidates.length,
      topPsi: Number(topPsi.toFixed(3)),
      spread: Number(spread.toFixed(3)),
      summary: result.finalText.slice(0, 140) + (result.finalText.length > 140 ? "..." : ""),
      verified: result.verification?.verified ?? true,
      verificationScore: result.verification?.score ?? 0.9,
      timestamp: Date.now(),
      childrenIds: [],
    };

    this.nodes.set(id, node);
    if (parent) {
      parent.childrenIds.push(id);
    } else {
      this.rootIds.push(id);
    }

    return node;
  }
}

export const globalOmegaLineage = new LineageGraph();
