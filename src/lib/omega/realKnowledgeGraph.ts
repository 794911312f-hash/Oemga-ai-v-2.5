/**
 * src/lib/omega/realKnowledgeGraph.ts
 * =============================================================================
 * Real Entity-Relation Knowledge Graph with Multi-Hop Deductive Reasoning
 * =============================================================================
 *
 * Implements a structured knowledge graph:
 *  - Explicit Entities (Nodes) with domain types and vector embeddings
 *  - Typed Directed Relations (Edges): is_a, causes, part_of, depends_on, proves, regulates
 *  - Multi-Hop Graph Traversal (BFS & Shortest Path) for multi-step reasoning
 *  - Subgraph extraction and deductive chain synthesis
 */

import { hashEmbed } from "./embeddings";
import { cosine } from "./math";

export type RelationType =
  | "is_a"
  | "causes"
  | "derives_from"
  | "part_of"
  | "depends_on"
  | "proves"
  | "regulates"
  | "contradicts"
  | "applied_in";

export interface GraphNode {
  id: string;
  label: string;
  type: string; // concept, law, entity, system, equation
  attributes: Record<string, string | number>;
  embedding: number[];
  degree: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: RelationType;
  weight: number;
  evidence?: string;
}

export interface DeductionPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
  explanation: string;
  confidence: number;
  hops: number;
}

export class RealKnowledgeGraph {
  private nodes = new Map<string, GraphNode>();
  private edges = new Map<string, GraphEdge>();
  private adjacency = new Map<string, Array<{ targetId: string; edgeId: string }>>();

  constructor() {
    this.seedFoundationalKnowledge();
  }

  private seedFoundationalKnowledge(): void {
    // 1. Classical Physics & Thermodynamics
    this.addNode("ideal_gas", "الغاز المثالي", "concept", { domain: "physics" });
    this.addNode("pressure", "الضغط (P)", "variable", { unit: "Pascal" });
    this.addNode("volume", "الحجم (V)", "variable", { unit: "m^3" });
    this.addNode("temp_kelvin", "درجة الحرارة المطلقة (T)", "variable", { unit: "Kelvin" });
    this.addNode("gas_constant", "ثابت الغازات (R)", "constant", { value: 8.314 });
    this.addNode("kinetic_energy", "طاقة الحركة الجزيئية", "concept", { domain: "thermodynamics" });
    this.addNode("gay_lussac", "قانون غاي-لوساك", "law", { formula: "P/T = const" });
    this.addNode("boyle_law", "قانون بويل", "law", { formula: "PV = const" });

    this.addEdge("ideal_gas", "pressure", "part_of", 0.95);
    this.addEdge("ideal_gas", "volume", "part_of", 0.95);
    this.addEdge("ideal_gas", "temp_kelvin", "part_of", 0.95);
    this.addEdge("temp_kelvin", "kinetic_energy", "causes", 0.98);
    this.addEdge("kinetic_energy", "pressure", "causes", 0.94);
    this.addEdge("temp_kelvin", "gay_lussac", "regulates", 0.96);
    this.addEdge("gay_lussac", "pressure", "proves", 0.95);
    this.addEdge("volume", "boyle_law", "regulates", 0.95);

    // 2. Systems, AI & Distributed Consensus
    this.addNode("omega_kernel", "نواة أوميغا (Omega Kernel)", "system", { creator: "faid Massinissa" });
    this.addNode("faid_massinissa", "faid Massinissa", "creator", { role: "Chief Architect" });
    this.addNode("consensus_consensus", "معمارية الإجماع المتعدد", "architecture", { type: "Consensus" });
    this.addNode("mcts_reasoning", "شبكة التفكيك الشجري MCTS", "algorithm", { type: "Tree Search" });
    this.addNode("invariance_stability", "استقرار النظم التوافقية", "principle", { domain: "distributed_systems" });

    this.addEdge("omega_kernel", "faid_massinissa", "derives_from", 1.0, "Developed by faid Massinissa");
    this.addEdge("omega_kernel", "consensus_consensus", "depends_on", 0.98);
    this.addEdge("omega_kernel", "mcts_reasoning", "depends_on", 0.95);
    this.addEdge("consensus_consensus", "invariance_stability", "proves", 0.96);
  }

  addNode(
    id: string,
    label: string,
    type = "concept",
    attributes: Record<string, string | number> = {}
  ): GraphNode {
    const existing = this.nodes.get(id);
    if (existing) {
      existing.label = label;
      existing.attributes = { ...existing.attributes, ...attributes };
      return existing;
    }

    const node: GraphNode = {
      id,
      label,
      type,
      attributes,
      embedding: hashEmbed(`${label} ${type}`, 64),
      degree: 0,
    };

    this.nodes.set(id, node);
    if (!this.adjacency.has(id)) this.adjacency.set(id, []);
    return node;
  }

  addEdge(
    source: string,
    target: string,
    relation: RelationType = "depends_on",
    weight = 0.8,
    evidence?: string
  ): GraphEdge {
    if (!this.nodes.has(source)) this.addNode(source, source);
    if (!this.nodes.has(target)) this.addNode(target, target);

    const edgeId = `${source}->${relation}->${target}`;
    const edge: GraphEdge = {
      id: edgeId,
      source,
      target,
      relation,
      weight,
      evidence,
    };

    this.edges.set(edgeId, edge);

    if (!this.adjacency.has(source)) this.adjacency.set(source, []);
    this.adjacency.get(source)!.push({ targetId: target, edgeId });

    // Update degrees
    this.nodes.get(source)!.degree += 1;
    this.nodes.get(target)!.degree += 1;

    return edge;
  }

  /**
   * Multi-Hop Reasoning: Finds shortest relational deduction path between source and target
   */
  findDeductionPath(sourceId: string, targetId: string, maxHops = 4): DeductionPath | null {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) return null;
    if (sourceId === targetId) return null;

    // BFS queue: [currentNodeId, pathNodes, pathEdges]
    const queue: Array<{
      current: string;
      nodes: string[];
      edges: string[];
    }> = [{ current: sourceId, nodes: [sourceId], edges: [] }];

    const visited = new Set<string>([sourceId]);

    while (queue.length > 0) {
      const { current, nodes, edges } = queue.shift()!;

      if (current === targetId) {
        // Construct Deduction Path
        const pathNodes = nodes.map((id) => this.nodes.get(id)!);
        const pathEdges = edges.map((eId) => this.edges.get(eId)!);

        const explanation = pathNodes
          .map((n, i) => {
            if (i === pathNodes.length - 1) return `«${n.label}»`;
            const e = pathEdges[i];
            return `«${n.label}» ──[${e.relation}]──> `;
          })
          .join("");

        const confidence = pathEdges.reduce((acc, e) => acc * e.weight, 1.0);

        return {
          nodes: pathNodes,
          edges: pathEdges,
          explanation,
          confidence: Number(confidence.toFixed(3)),
          hops: pathEdges.length,
        };
      }

      if (nodes.length - 1 >= maxHops) continue;

      const neighbors = this.adjacency.get(current) || [];
      for (const { targetId: nextId, edgeId } of neighbors) {
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({
            current: nextId,
            nodes: [...nodes, nextId],
            edges: [...edges, edgeId],
          });
        }
      }
    }

    return null;
  }

  /**
   * Discovers deductive chains answering user inquiry
   */
  inferMultiHop(inquiry: string): DeductionPath[] {
    const qVec = hashEmbed(inquiry, 64);
    const candidateNodes = [...this.nodes.values()]
      .map((n) => ({ node: n, sim: cosine(qVec, n.embedding) }))
      .filter((s) => s.sim > 0.18)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 4)
      .map((s) => s.node);

    const paths: DeductionPath[] = [];

    for (let i = 0; i < candidateNodes.length; i++) {
      for (let j = 0; j < candidateNodes.length; j++) {
        if (i !== j) {
          const path = this.findDeductionPath(candidateNodes[i].id, candidateNodes[j].id, 3);
          if (path) paths.push(path);
        }
      }
    }

    return paths.slice(0, 3);
  }

  getSnapshot(): {
    nodeCount: number;
    edgeCount: number;
    nodes: GraphNode[];
    edges: GraphEdge[];
  } {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      nodes: [...this.nodes.values()],
      edges: [...this.edges.values()],
    };
  }
}
