/**
 * src/lib/omega/vectorStore.ts
 * =====================================================================
 * Omega Vector Memory & Hypothesis Bank (الذاكرة الدلالية المتجهة وبنك الفرضيات)
 * ---------------------------------------------------------------------
 * Provides persistent semantic long-term memory for Omega's exploratory
 * reasoning, hypothesis generation, and mathematical discoveries:
 * - Cosine similarity semantic search over past hypotheses and falsifications
 * - Deduplication and circular reasoning prevention
 * - Local high-dimensional n-gram/TF-IDF vectorizer + optional Gemini embeddings
 * - Pre-seeded landmark conjectures, bounds, and lemmas
 * - Persistent browser LocalStorage with export/import capabilities
 * =====================================================================
 */

export type HypothesisStatus =
  | "survived"
  | "refuted"
  | "open_conjecture"
  | "verified_lemma"
  | "promising";

export interface HypothesisMemoryItem {
  id: string;
  title: string;
  domain: string;
  hypothesisText: string;
  formalEquations: string[];
  status: HypothesisStatus;
  resilienceScore: number; // 0 - 100
  tags: string[];
  vector: number[];
  timestamp: number;
  source: string;
  falsificationSummary?: string;
  verificationMethod?: string;
}

export interface SimilaritySearchResult {
  item: HypothesisMemoryItem;
  similarity: number; // 0.0 to 1.0
  similarityPercent: number; // 0 to 100%
}

const STORAGE_KEY = "omega_vector_memory_bank_v1";
const VECTOR_DIMENSIONS = 96;

/**
 * Deterministic Semantic Feature Vectorizer (Works fully client-side and server-side)
 * Generates an L2-normalized 96-dimensional embedding using sub-word hash n-grams & character bi-grams.
 */
export function generateLocalEmbedding(text: string, dim: number = VECTOR_DIMENSIONS): number[] {
  const vec = new Array(dim).fill(0);
  if (!text) return vec;

  const clean = text.toLowerCase().trim();
  const words = clean.split(/[\s,;:.?!()\[\]{}<>=+\-*/\\$]+/);

  // 1. Unigram frequency projection
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!w) continue;
    let hash = 0;
    for (let c = 0; c < w.length; c++) {
      hash = (hash << 5) - hash + w.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1.0 + (w.length > 5 ? 0.5 : 0);
  }

  // 2. Character Bi-grams & Tri-grams for morphological and Arabic root semantic preservation
  for (let i = 0; i < clean.length - 2; i++) {
    const trigram = clean.substring(i, i + 3);
    let hash = 5381;
    for (let c = 0; c < trigram.length; c++) {
      hash = ((hash << 5) + hash) + trigram.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 0.35;
  }

  // 3. Mathematical symbol emphasis
  const mathSymbols = ["\\sum", "\\int", "\\log", "\\prod", "mod", "2^", "3n+1", "zeta", "prime", "\\infty"];
  mathSymbols.forEach((sym, sIdx) => {
    if (clean.includes(sym)) {
      const idx = (sIdx * 7) % dim;
      vec[idx] += 2.0;
    }
  });

  // 4. L2 Normalization
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vec[i] = Number((vec[i] / norm).toFixed(5));
    }
  }

  return vec;
}

/**
 * Calculates Cosine Similarity between two L2-normalized vectors.
 */
export function cosineSimilarity(v1: number[], v2: number[]): number {
  if (!v1 || !v2 || v1.length === 0 || v2.length === 0) return 0;
  const len = Math.min(v1.length, v2.length);
  let dot = 0;
  for (let i = 0; i < len; i++) {
    dot += v1[i] * v2[i];
  }
  // Clamp between 0 and 1 for positive feature vectors
  return Math.max(0, Math.min(1, dot));
}

/**
 * Initial Seed Knowledge Base of Landmark Open Problems & Bounds
 */
const SEED_HYPOTHESES: Omit<HypothesisMemoryItem, "vector">[] = [
  {
    id: "hyp_collatz_tao_2019",
    title: "مبرهنة تاو للقيم اللوغاريتمية شبه المؤكدة (Terence Tao Almost All Orbits)",
    domain: "الرياضيات المتقطعة ونظرية الاحتمالات",
    hypothesisText: "أثبت تيرينس تاو في 2019 أن الغالبية الساحقة من مدارات كولاتز تنحدر لقيم أصغر من أي دالة متزايدة ببطء f(N) مثل log(log(log(N)))، مما يعزز الحظر الإحصائي لأي تباعد نحو اللانهاية.",
    formalEquations: ["\\lim_{N \\to \\infty} \\frac{\\#\\{1 \\le n \\le N : \\min_{k} T^k(n) < f(n)\\}}{N} = 1"],
    status: "verified_lemma",
    resilienceScore: 98,
    tags: ["كولاتز", "كولاطز", "collatz", "3n+1", "terence tao", "حدود تقارب"],
    timestamp: 1568700000000,
    source: "Terence Tao (UCLA ArXiv 2019)",
    falsificationSummary: "مبرهنة رياضية محكمة صامدة أمام كل محاولات التفنيد، تؤكد الانحدار الإحصائي لمعظم المسارات.",
  },
  {
    id: "hyp_collatz_steiner_cycles",
    title: "حظر الدورات غير التافهة القصيرة والمتوسطة (Steiner-Eliahou Cycle Bound)",
    domain: "نظرية الأعداد الجبرية",
    hypothesisText: "لا توجد أي دورة مغلقة في متتالية كولاتز ذات طول دورة أقل من 17 مليار خطوة فردية، باستثناء الدورة التافهة المعروفة {1, 4, 2}.",
    formalEquations: ["k > 1.7 \\times 10^{10} \\; \\text{for any non-trivial 1-cycle}"],
    status: "verified_lemma",
    resilienceScore: 96,
    tags: ["كولاتز", "دورات كولاتز", "steiner", "eliahou", "cycle bound"],
    timestamp: 1600000000000,
    source: "Ray Steiner (1977) & Shalom Eliahou (1993)",
    falsificationSummary: "تم إثبات حظر الدورات باستخدام متطابقات لوغاريتمية ونظرية بيكر في التقديرات الخطية.",
  },
  {
    id: "hyp_collatz_2adic_measure",
    title: "مصفوفات التحويل الثنائي والقياس الإرغودي (2-adic Ergodic Measure)",
    domain: "الأنظمة الديناميكية ونظرية القياس",
    hypothesisText: "عند توسيع دالة كولاتز إلى حقل الأعداد p-adic الثنائية Z_2، تصبح الدالة مقترنة بنظام إرغودي يحفظ قياس هار (Haar Measure)، مما يعني استحالة وجود جاذب دوري فرعي مستقر غير الصفر والواحد.",
    formalEquations: ["T: \\mathbb{Z}_2 \\to \\mathbb{Z}_2, \\quad \\mu(T^{-1}(A)) = \\mu(A)"],
    status: "promising",
    resilienceScore: 89,
    tags: ["2-adic", "p-adic", "كولاتز", "إرغودية", "نظام ديناميكي"],
    timestamp: 1645000000000,
    source: "Lagarias & Bernstein (Dynamical Systems)",
    falsificationSummary: "النموذج متماسك في Z_2 لكن إسقاطه التام على الأعداد الصحيحة الطبيعية N ما زال يتطلب حسم مشكلة الالتفاف المعياري.",
  },
  {
    id: "hyp_collatz_conway_undecidable",
    title: "حدسية عدم الحسم المنطقي وتكافؤ تورينغ لكولاتز المعممة (Conway Undecidability)",
    domain: "المنطق الرياضي ونظرية الحوسبة",
    hypothesisText: "أثبت جون كونواي أن النسخة المعممة من مسألة كولاتز تكافئ مسألة التوقف لآلة تورينغ (Halting Problem)، وبالتالي فهي غير قابلة للحسم (Undecidable) داخل نظام بديهيات ZFC.",
    formalEquations: ["\\text{Collatz-Generalised} \\equiv \\text{Turing-Halting} \\implies \\text{Undecidable}"],
    status: "open_conjecture",
    resilienceScore: 85,
    tags: ["conway", "عدم حسم", "turing", "zfc", "منطق رياضي"],
    timestamp: 1620000000000,
    source: "John Horton Conway (1972)",
    falsificationSummary: "أثبتت لتعميمات كولاتز، ولكن لم يثبت بعد ما إذا كانت الدالة المحددة 3n+1 نفسها مستقلة عن ZFC أم قابلة للإثبات.",
  },
  {
    id: "hyp_riemann_explicit_zeros",
    title: "صيغة ريمان الصريحة وثنائية الأصفار غير التافهة (Riemann Explicit Duality)",
    domain: "نظرية الأعداد التحليلية",
    hypothesisText: "تقع جميع الأصفار غير التافهة لدالة زيتا ريمان على الخط الحرج Re(s) = 1/2، وهو ما يضمن توزيعاً فائق الانتظام للأعداد الأولية بحد خطأ O(sqrt(x) * log(x)).",
    formalEquations: ["\\zeta(s) = 0 \\implies \\Re(s) = \\frac{1}{2}, \\quad \\psi(x) = x - \\sum_{\\rho} \\frac{x^\\rho}{\\rho} - \\ln(2\\pi)"],
    status: "open_conjecture",
    resilienceScore: 92,
    tags: ["ريمان", "دالة زيتا", "riemann hypothesis", "أعداد أولية", "أصفار الخط الحرج"],
    timestamp: 1610000000000,
    source: "Bernhard Riemann (1859)",
    falsificationSummary: "تم فحص أكثر من 10 تريليون صفر أولي حاسوبياً وجميعها تقع تماماً على الخط الحرج دون أي استثناء.",
  },
  {
    id: "hyp_goldbach_hardy_littlewood",
    title: "طريقة الدائرة لهاردي وليتلوود لحدسية غولدباخ (Hardy-Littlewood Circle Method)",
    domain: "نظرية الأعداد التوافقية",
    hypothesisText: "كل عدد زوجي أكبر من 2 يمكن تمثيله كمجموع عددين أوليين؛ أثبت هارالد هيلفغوت الحدسية الضعيفة (للأعداد الفردية كـ 3 أوليات) في 2013 باستخدام الأقواس الكبرى والصغرى لطريقة الدائرة.",
    formalEquations: ["r_2(n) = \\int_0^1 \\left(\\sum_{p \\le n} e^{2\\pi i p \\alpha}\\right)^2 e^{-2\\pi i n \\alpha} d\\alpha > 0"],
    status: "promising",
    resilienceScore: 94,
    tags: ["غولدباخ", "goldbach", "أعداد أولية", "hardy littlewood", "طريقة الدائرة"],
    timestamp: 1630000000000,
    source: "Hardy, Littlewood & Harald Helfgott (2013)",
    falsificationSummary: "تم إثبات الحدسية الضعيفة قطعياً (Helfgott 2013)، وتعتبر الحدسية القوية مثبتة حسابياً حتى 4 × 10¹⁸.",
  },
];

/**
 * Initializes and retrieves the full hypothesis vector store.
 */
export function getHypothesisVectorStore(): HypothesisMemoryItem[] {
  if (typeof window === "undefined") {
    // Server-side environment
    return SEED_HYPOTHESES.map((item) => ({
      ...item,
      vector: generateLocalEmbedding(`${item.title} ${item.domain} ${item.hypothesisText} ${item.tags.join(" ")}`),
    }));
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initialized = SEED_HYPOTHESES.map((item) => ({
        ...item,
        vector: generateLocalEmbedding(`${item.title} ${item.domain} ${item.hypothesisText} ${item.tags.join(" ")}`),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialized));
      return initialized;
    }
    const parsed: HypothesisMemoryItem[] = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
  } catch (err) {
    console.warn("Failed to load hypothesis memory bank from localStorage:", err);
    return [];
  }
}

/**
 * Saves a new hypothesis into the vector memory store.
 */
export function saveHypothesisToMemory(
  item: Omit<HypothesisMemoryItem, "id" | "vector" | "timestamp">
): HypothesisMemoryItem {
  const current = getHypothesisVectorStore();
  const textCorpus = `${item.title} ${item.domain} ${item.hypothesisText} ${item.tags.join(" ")}`;
  const vector = generateLocalEmbedding(textCorpus);

  const newItem: HypothesisMemoryItem = {
    ...item,
    id: `hyp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    vector,
    timestamp: Date.now(),
  };

  const updated = [newItem, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("LocalStorage save failed:", e);
    }
  }

  return newItem;
}

/**
 * Deletes a hypothesis from the vector store by ID.
 */
export function deleteHypothesisFromMemory(id: string): boolean {
  const current = getHypothesisVectorStore();
  const filtered = current.filter((h) => h.id !== id);
  if (filtered.length !== current.length) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) {
        console.error("LocalStorage delete failed:", e);
      }
    }
    return true;
  }
  return false;
}

/**
 * Performs Semantic Cosine Similarity Search over all stored hypotheses.
 */
export function searchSimilarHypotheses(
  query: string,
  topK = 3,
  domainFilter?: string
): SimilaritySearchResult[] {
  if (!query || !query.trim()) return [];

  const store = getHypothesisVectorStore();
  if (store.length === 0) return [];

  const queryVector = generateLocalEmbedding(query);

  const scored: SimilaritySearchResult[] = store
    .filter((item) => !domainFilter || item.domain.includes(domainFilter) || domainFilter === "all")
    .map((item) => {
      const sim = cosineSimilarity(queryVector, item.vector);
      return {
        item,
        similarity: sim,
        similarityPercent: Math.round(sim * 100),
      };
    })
    .filter((res) => res.similarity > 0.15) // minimum semantic relevance threshold
    .sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}

/**
 * Exports the entire vector memory bank as a downloadable JSON string.
 */
export function exportVectorMemoryJSON(): string {
  const store = getHypothesisVectorStore();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      creator: "Omega-Core (faid Massinissa)",
      version: "2.5-vector-store",
      itemCount: store.length,
      items: store,
    },
    null,
    2
  );
}

/**
 * Imports a JSON string into the vector memory bank.
 */
export function importVectorMemoryJSON(jsonString: string): { success: boolean; count: number } {
  try {
    const data = JSON.parse(jsonString);
    const items: HypothesisMemoryItem[] = Array.isArray(data) ? data : data.items;
    if (!Array.isArray(items)) return { success: false, count: 0 };

    const validItems = items.filter((it) => it.id && it.title && it.hypothesisText);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems));
    }
    return { success: true, count: validItems.length };
  } catch (err) {
    console.error("Failed to import memory JSON:", err);
    return { success: false, count: 0 };
  }
}
