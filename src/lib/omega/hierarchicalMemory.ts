/**
 * src/lib/omega/hierarchicalMemory.ts
 * =============================================================================
 * Tri-Level Hierarchical Memory Architecture for Omega AI Kernel
 * =============================================================================
 *
 * Implements cognitive 3-tier memory:
 *  - Tier 1: Working Memory (RAM Scratchpad & Active Context Focus)
 *  - Tier 2: Episodic Memory (Experience Traces & Temporal History in Firestore)
 *  - Tier 3: Axiomatic Semantic Core (Immutable, Non-Decaying Ground Truths & Invariants)
 */

import { hashEmbed } from "./embeddings";
import { cosine } from "./math";
import {
  saveMemory,
  searchMemory,
  findSimilarExperiences,
  type MemoryItem,
  type EvolutionExperience,
} from "./firebase";

export interface WorkingMemoryItem {
  id: string;
  key: string;
  value: any;
  priority: number;
  addedAt: number;
  ttlMs: number;
}

export interface AxiomItem {
  id: string;
  domain: string;
  name: string;
  statement: string;
  mathematicalLaw?: string;
  verifiedAt: number;
  source: string;
}

export class HierarchicalMemoryManager {
  // Tier 1: Fast in-memory working scratchpad
  private workingMemory = new Map<string, WorkingMemoryItem>();
  private maxWorkingItems = 40;

  // Tier 3: Immutable Axiomatic Core (Immune to decay)
  private axiomaticCore: AxiomItem[] = [
    {
      id: "ax_ideal_gas",
      domain: "thermodynamics",
      name: "قانون الغاز المثالي (Ideal Gas Law)",
      statement: "العلاقة الفيزيائية بين الضغط والحجم وكمية المادة ودرجة الحرارة المطلقة للغاز المثالي.",
      mathematicalLaw: "P \\cdot V = n \\cdot R \\cdot T",
      verifiedAt: Date.now(),
      source: "Classical Thermodynamics",
    },
    {
      id: "ax_newton_second",
      domain: "classical_mechanics",
      name: "قانون نيوتن الثاني للحركة (Newton's Second Law)",
      statement: "القوة المؤثرة على جسم تساوي المعدل الزمني لتغير كمية حركته الخطية.",
      mathematicalLaw: "\\vec{F} = m\\vec{a} = \\frac{d\\vec{p}}{dt}",
      verifiedAt: Date.now(),
      source: "Newtonian Physics",
    },
    {
      id: "ax_energy_conservation",
      domain: "physics_invariants",
      name: "مبدأ حفظ الطاقة (Conservation of Energy)",
      statement: "الطاقة في نظام معزول لا تفنى ولا تستحدث من عدم، بل تتحول من شكل إلى آخر.",
      mathematicalLaw: "\\Delta E_{\\text{system}} = Q - W",
      verifiedAt: Date.now(),
      source: "First Law of Thermodynamics",
    },
    {
      id: "ax_ohm_law",
      domain: "electromagnetism",
      name: "قانون أوم (Ohm's Law)",
      statement: "فرق الجهد الكهربائي بين طرفي موصل يتناسب طردياً مع شدة التيار المار فيه.",
      mathematicalLaw: "V = I \\cdot R",
      verifiedAt: Date.now(),
      source: "Electrodynamics",
    },
    {
      id: "ax_pythagoras",
      domain: "mathematics",
      name: "مبرهنة فيثاغورس (Pythagorean Theorem)",
      statement: "مربع طول الوتر في المثلث قائم الزاوية يساوي مجموع مربعي طولي الضلعين الآخرين.",
      mathematicalLaw: "a^2 + b^2 = c^2",
      verifiedAt: Date.now(),
      source: "Euclidean Geometry",
    },
    {
      id: "ax_omega_creator",
      domain: "system_identity",
      name: "هوية المطور والمنشئ لنظام أوميغا",
      statement: "faid Massinissa هو المهندس والمطور الوحيد لنظام أوميغا للذكاء الاصطناعي.",
      mathematicalLaw: "\\text{Developer}(\\text{Omega}) = \\text{faid Massinissa}",
      verifiedAt: Date.now(),
      source: "Omega System Architecture Invariant",
    },
  ];

  constructor(private userId = "user_main") {}

  // ---------------------------------------------------------------------------
  // Tier 1: Working Memory Methods
  // ---------------------------------------------------------------------------
  setWorking(key: string, value: any, ttlMs = 1000 * 60 * 30, priority = 1): void {
    const id = `wm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.workingMemory.set(key, {
      id,
      key,
      value,
      priority,
      addedAt: Date.now(),
      ttlMs,
    });

    if (this.workingMemory.size > this.maxWorkingItems) {
      // Evict oldest or lowest priority
      const oldestKey = [...this.workingMemory.entries()].sort(
        (a, b) => a[1].addedAt - b[1].addedAt
      )[0][0];
      this.workingMemory.delete(oldestKey);
    }
  }

  getWorking(key: string): any | null {
    const item = this.workingMemory.get(key);
    if (!item) return null;
    if (Date.now() - item.addedAt > item.ttlMs) {
      this.workingMemory.delete(key);
      return null;
    }
    return item.value;
  }

  listWorking(): WorkingMemoryItem[] {
    const now = Date.now();
    for (const [k, v] of this.workingMemory.entries()) {
      if (now - v.addedAt > v.ttlMs) this.workingMemory.delete(k);
    }
    return [...this.workingMemory.values()];
  }

  // ---------------------------------------------------------------------------
  // Tier 2: Episodic Memory Methods (Firestore Bound)
  // ---------------------------------------------------------------------------
  async recallEpisodic(query: string, limit = 4): Promise<EvolutionExperience[]> {
    const qVec = hashEmbed(query, 64);
    return findSimilarExperiences(this.userId, qVec, limit);
  }

  // ---------------------------------------------------------------------------
  // Tier 3: Axiomatic Semantic Core (Immutable Ground Truths)
  // ---------------------------------------------------------------------------
  searchAxioms(query: string, maxResults = 3): AxiomItem[] {
    const qVec = hashEmbed(query, 64);
    const scored = this.axiomaticCore.map((ax) => {
      const axVec = hashEmbed(`${ax.name} ${ax.statement} ${ax.domain}`, 64);
      return { ax, sim: cosine(qVec, axVec) };
    });

    return scored
      .filter((s) => s.sim > 0.15)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, maxResults)
      .map((s) => s.ax);
  }

  addAxiom(axiom: Omit<AxiomItem, "id" | "verifiedAt">): AxiomItem {
    const full: AxiomItem = {
      ...axiom,
      id: `ax_${Date.now()}`,
      verifiedAt: Date.now(),
    };
    this.axiomaticCore.push(full);
    return full;
  }

  listAxioms(): AxiomItem[] {
    return [...this.axiomaticCore];
  }

  // ---------------------------------------------------------------------------
  // Tri-Level Integrated Synthesis Context
  // ---------------------------------------------------------------------------
  async buildHierarchicalContext(query: string): Promise<{
    working: WorkingMemoryItem[];
    episodic: EvolutionExperience[];
    axioms: AxiomItem[];
    formattedBlock: string;
  }> {
    const working = this.listWorking();
    const episodic = await this.recallEpisodic(query, 3);
    const axioms = this.searchAxioms(query, 3);

    const parts: string[] = [];

    if (axioms.length > 0) {
      parts.push(
        "### 🏛️ المستوى 3: الذاكرة الدلالية التجريدية (Axiomatic Core - حقائق ثابتة لا تقبل الاضمحلال):\n" +
          axioms
            .map(
              (ax) =>
                `• **${ax.name}**: ${ax.statement}${ax.mathematicalLaw ? ` [صيغة: $${ax.mathematicalLaw}$]` : ""}`
            )
            .join("\n")
      );
    }

    if (episodic.length > 0) {
      parts.push(
        "### 📜 المستوى 2: الذاكرة الإجرائية والعرضية (Episodic Memory - تجارب سابقة مخزنة):\n" +
          episodic
            .map(
              (ep, idx) =>
                `• تجربة #${idx + 1}: ${ep.question.slice(0, 80)}… (توافق ψ=${ep.topPsi.toFixed(2)})`
            )
            .join("\n")
      );
    }

    if (working.length > 0) {
      parts.push(
        "### ⚡ المستوى 1: الذاكرة اللحظية النشطة (Working Memory):\n" +
          working.map((w) => `• ${w.key}: ${JSON.stringify(w.value)}`).join("\n")
      );
    }

    return {
      working,
      episodic,
      axioms,
      formattedBlock: parts.join("\n\n"),
    };
  }
}
