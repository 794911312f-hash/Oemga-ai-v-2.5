/**
 * src/lib/omega/memory.ts
 * Epistemic associative memory engine for Omega AI.
 * Stores semantic embeddings of proven conclusions and recalls context dynamically.
 */

import { cosine, normalize } from "./math";
import { hashEmbed } from "./embeddings";
import type { Domain } from "./domainRouting";

export interface MemoryNode {
  id: string;
  topic: string;
  content: string;
  domain: Domain;
  confidence: number;
  tags: string[];
  timestamp: number;
  accessCount: number;
  vector: number[];
}

const INITIAL_MEMORIES: Omit<MemoryNode, "id" | "timestamp" | "accessCount" | "vector">[] = [
  {
    topic: "مبدأ الاندماج متعدد النماذج Omega V2",
    content: "يعتمد نظام أوميغا على دمج استجابات نماذج ذكاء اصطناعي متعددة عبر حساب المركز الهندسي الدلالي (Semantic Centroid) والانحراف (Delta) لحساب ثقة الإجماع (Ψ-scoring) بدلاً من ترجيح نموذج واحد عشوائياً.",
    domain: "math_logic",
    confidence: 0.98,
    tags: ["omega", "consensus", "fusion", "psi-score"],
  },
  {
    topic: "آلية التحقق الذاتي (Self-Verification)",
    content: "مرحلة تدقيقية إضافية تُجرى بعد اختيار الإجابة الراجحة لفحص الاتساق الداخلي، وكشف التناقضات العكسية، والتأكد من خلو الاستنتاج من الهلوسة.",
    domain: "science_factual",
    confidence: 0.95,
    tags: ["verification", "anti-contradiction", "audit"],
  },
  {
    topic: "وضع عدم اليقين (Uncertainty Split)",
    content: "عندما يقل الفارق الرياضي بين أعلى مرشحين عن عتبة معينة (Spread <= uncertainSpread)، يرفض النظام افتعال يقين زائف ويعرض أفضل إجابتين متنافستين جنباً إلى جنب مع الفروق الجوهرية.",
    domain: "general",
    confidence: 0.92,
    tags: ["uncertainty", "epistemic-honesty", "dual-answer"],
  },
  {
    topic: "التوجيه التلقائي للمجالات (Domain-Aware Routing)",
    content: "تصنيف الاستفسارات آلياً إلى مجالات متخصصة (شفرات برمجية، منطق ورياضيات، حقائق علمية، كتابة إبداعية) وتوجيه الاستفسار فقط إلى النماذج الأجدر بهذا التخصص لتقليل الهدر والضوضاء.",
    domain: "code",
    confidence: 0.96,
    tags: ["routing", "domain-dispatch", "efficiency"],
  },
  {
    topic: "هندسة فضاء الحالة في نواة أوميغا (Kernel State Space)",
    content: "تمثيل المعرفة والتوافق الدلالي كمتجهات إسقاطية ضمن فضاء هيلبرت متعدد الأبعاد مع مصفوفات تشابه دلالية وتتبع مستمر لدرجة الإنتروبيا والتناغم الطيفي.",
    domain: "math_logic",
    confidence: 0.97,
    tags: ["kernel", "state-vector", "entropy"],
  },
];

class MemoryStore {
  private nodes: MemoryNode[] = [];

  constructor() {
    this.nodes = INITIAL_MEMORIES.map((m, idx) => ({
      ...m,
      id: `mem-${idx + 1}`,
      timestamp: Date.now() - (INITIAL_MEMORIES.length - idx) * 3600000,
      accessCount: Math.floor(Math.random() * 8) + 1,
      vector: hashEmbed(m.topic + " " + m.content, 64),
    }));
  }

  public getAll(): MemoryNode[] {
    return [...this.nodes];
  }

  public add(
    topic: string,
    content: string,
    domain: Domain = "general",
    confidence = 0.9,
    tags: string[] = []
  ): MemoryNode {
    const vector = hashEmbed(topic + " " + content, 64);
    const node: MemoryNode = {
      id: `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      topic,
      content,
      domain,
      confidence,
      tags,
      timestamp: Date.now(),
      accessCount: 1,
      vector,
    };
    this.nodes.unshift(node);
    return node;
  }

  public query(
    text: string,
    limit = 4,
    minSimilarity = 0.15
  ): { node: MemoryNode; similarity: number }[] {
    const qVec = hashEmbed(text, 64);
    const scored = this.nodes.map((node) => {
      const sim = cosine(qVec, node.vector);
      return { node, similarity: Number(sim.toFixed(4)) };
    });

    return scored
      .filter((s) => s.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((item) => {
        item.node.accessCount += 1;
        return item;
      });
  }

  public delete(id: string): boolean {
    const prevLen = this.nodes.length;
    this.nodes = this.nodes.filter((n) => n.id !== id);
    return this.nodes.length < prevLen;
  }
}

export const globalOmegaMemory = new MemoryStore();
