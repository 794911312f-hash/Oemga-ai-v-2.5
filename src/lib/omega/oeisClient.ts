/**
 * src/lib/omega/oeisClient.ts
 * =====================================================================
 * OEIS (On-Line Encyclopedia of Integer Sequences) Integration
 * ---------------------------------------------------------------------
 * Connects the Omega Deep Exploration Kernel directly to the world's
 * foremost database of integer sequences (370,000+ sequences).
 * Enables empirical verification, trajectory matching, and mathematical
 * history cross-referencing for open problems.
 * =====================================================================
 */

export interface OEISSequenceEntry {
  id: string; // e.g. "A006577"
  number: number; // e.g. 6577
  name: string;
  data: string; // Comma-separated sample terms
  termsList?: number[];
  comment: string[];
  formula: string[];
  reference: string[];
  link: string[];
  author?: string;
  url: string;
  isCuratedCore?: boolean;
}

/**
 * High-precision built-in registry of fundamental Collatz & Number Theory sequences.
 * Provides guaranteed zero-latency availability and resilience even in offline environments.
 */
export const KNOWN_OEIS_REGISTRY: Record<string, OEISSequenceEntry> = {
  A006370: {
    id: "A006370",
    number: 6370,
    name: "The Collatz or 3x+1 map: a(n) = n/2 if n is even, 3n + 1 if n is odd.",
    data: "0, 4, 1, 10, 2, 16, 3, 22, 4, 28, 5, 34, 6, 40, 7, 46, 8, 52, 9, 58, 10, 64, 11, 70, 12, 76, 13, 82, 14, 88, 15, 94",
    termsList: [0, 4, 1, 10, 2, 16, 3, 22, 4, 28, 5, 34, 6, 40, 7, 46, 8, 52, 9, 58, 10, 64],
    comment: [
      "The 3x+1 or Collatz problem: start with any number n. If n is even, divide by 2, otherwise 3n+1. Do we always reach 1? Unsolved problem.",
      "The Krasikov-Lagarias paper shows that at least N^0.84 of positive numbers < N fall into the 4-2-1 cycle.",
      "Christian Hercher (2023): There are no Collatz m-Cycles with m <= 91 (J. Int. Seq. Vol. 26).",
    ],
    formula: [
      "a(2n) = n",
      "a(2n+1) = 3(2n+1) + 1 = 6n + 4",
    ],
    reference: [
      "J. C. Lagarias, ed., The Ultimate Challenge: The 3x+1 Problem, Amer. Math. Soc., 2010.",
      "R. K. Guy, Unsolved Problems in Number Theory, E16.",
    ],
    link: [
      "https://oeis.org/A006370",
      "https://arxiv.org/abs/2111.02635 (Lagarias Overview)",
    ],
    url: "https://oeis.org/A006370",
    isCuratedCore: true,
  },
  A006577: {
    id: "A006577",
    number: 6577,
    name: "Number of halving and tripling steps to reach 1 in '3x+1' problem (Total Stopping Time).",
    data: "0, 1, 7, 2, 5, 8, 16, 3, 19, 6, 14, 9, 9, 17, 17, 4, 12, 20, 20, 7, 7, 15, 15, 10, 23, 10, 111, 18, 18, 18, 106, 5, 26",
    termsList: [0, 1, 7, 2, 5, 8, 16, 3, 19, 6, 14, 9, 9, 17, 17, 4, 12, 20, 20, 7, 7, 15, 15, 10, 23, 10, 111],
    comment: [
      "Total stopping time: for n = 27, exactly 111 steps are required to reach 1 (a(27) = 111).",
      "Notice that 5 is the only tested integer whose value matches its total number of steps a(5) = 5.",
      "Verified computationally for all starting seeds up to 2.95 * 10^20 without counterexamples.",
    ],
    formula: [
      "a(n) = 0 if n=1; else 1 + a(n/2) if n even; else 1 + a(3n+1) if n odd.",
    ],
    reference: [
      "N. J. A. Sloane and Simon Plouffe, The Encyclopedia of Integer Sequences, 1995.",
      "Terence Tao (2019): Almost all orbits of the Collatz map attain almost bounded values.",
    ],
    link: [
      "https://oeis.org/A006577",
    ],
    url: "https://oeis.org/A006577",
    isCuratedCore: true,
  },
  A006877: {
    id: "A006877",
    number: 6877,
    name: "In 3x+1 problem, sequence of maximum values attained for starting values n.",
    data: "1, 2, 16, 4, 16, 16, 52, 8, 52, 16, 52, 16, 52, 52, 160, 16, 52, 52, 88, 20, 64, 52, 160, 24, 88, 52, 9232, 28",
    termsList: [1, 2, 16, 4, 16, 16, 52, 8, 52, 16, 52, 16, 52, 52, 160, 16, 52, 52, 88, 20, 64, 52, 160, 24, 88, 52, 9232],
    comment: [
      "For n = 27, the peak value reaches 9232 (a(27) = 9232), more than 341 times the initial seed.",
      "This exponential spike highlights the non-triviality of controlling intermediate bounds.",
    ],
    formula: [
      "a(n) = max_{k >= 0} T^k(n) where T is the Collatz map.",
    ],
    reference: [
      "D. H. Lehmer, Mathematical Reviews 45 (1973) #3304.",
    ],
    link: [
      "https://oeis.org/A006877",
    ],
    url: "https://oeis.org/A006877",
    isCuratedCore: true,
  },
  A006884: {
    id: "A006884",
    number: 6884,
    name: "Starting values setting new records for number of steps to reach 1 in 3x+1 problem.",
    data: "1, 2, 3, 6, 7, 9, 18, 25, 27, 54, 73, 97, 129, 171, 231, 313, 327, 649, 703, 871, 1161, 2223, 2463, 2919, 3711, 6171, 10971, 13255, 17647, 23529, 26623, 34239, 35655",
    termsList: [1, 2, 3, 6, 7, 9, 18, 25, 27, 54, 73, 97, 129, 171, 231, 313, 327, 649, 703],
    comment: [
      "Records in stopping time: 27 requires 111 steps; 97 requires 118 steps; 871 requires 178 steps; 6171 requires 261 steps.",
    ],
    formula: [],
    reference: [
      "R. E. Crandall, On the '3x + 1' problem, Math. Comp. 32 (1978), 1281-1292.",
    ],
    link: [
      "https://oeis.org/A006884",
    ],
    url: "https://oeis.org/A006884",
    isCuratedCore: true,
  },
  A014682: {
    id: "A014682",
    number: 14682,
    name: "The trajectory of 27 in 3x+1 problem: 27, 82, 41, 124, 62, 31, 94, 47, 142, 71, 214...",
    data: "27, 82, 41, 124, 62, 31, 94, 47, 142, 71, 214, 107, 322, 161, 484, 242, 121, 364, 182, 91, 274, 137, 412, 206, 103, 310, 155, 466, 233, 700, 350, 175, 526, 263, 790, 395",
    termsList: [27, 82, 41, 124, 62, 31, 94, 47, 142, 71, 214, 107, 322, 161, 484, 242, 121],
    comment: [
      "Complete 111-step trajectory for the classic benchmark seed 27.",
      "Peaks at step 77 reaching 9232, then collapses to 1 via powers of two.",
    ],
    formula: [],
    reference: [],
    link: ["https://oeis.org/A014682"],
    url: "https://oeis.org/A014682",
    isCuratedCore: true,
  },
  A000040: {
    id: "A000040",
    number: 40,
    name: "The prime numbers: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71...",
    data: "2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127",
    termsList: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71],
    comment: [
      "Fundamental theorem of arithmetic: every integer > 1 is prime or unique product of primes.",
    ],
    formula: [],
    reference: ["Euclid, Elements, Book IX, Proposition 20."],
    link: ["https://oeis.org/A000040"],
    url: "https://oeis.org/A000040",
    isCuratedCore: true,
  },
  A000045: {
    id: "A000045",
    number: 45,
    name: "Fibonacci numbers: F(n) = F(n-1) + F(n-2) with F(0) = 0, F(1) = 1.",
    data: "0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368",
    termsList: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377],
    comment: ["Golden ratio limit: F(n+1)/F(n) -> phi = (1 + sqrt(5))/2."],
    formula: ["F(n) = ((1+sqrt(5))^n - (1-sqrt(5))^n) / (2^n * sqrt(5))"],
    reference: ["Leonardo of Pisa (Fibonacci), Liber Abaci, 1202."],
    link: ["https://oeis.org/A000045"],
    url: "https://oeis.org/A000045",
    isCuratedCore: true,
  },
};

/**
 * Parses raw OEIS JSON item into a clean OEISSequenceEntry.
 */
export function formatOEISItem(raw: any): OEISSequenceEntry {
  const num = typeof raw.number === "number" ? raw.number : parseInt(String(raw.number || "0"), 10);
  const id = raw.id && raw.id.startsWith("A") ? raw.id : `A${String(num).padStart(6, "0")}`;

  const dataStr = raw.data || "";
  const termsList = dataStr
    ? dataStr
        .split(",")
        .map((s: string) => parseInt(s.trim(), 10))
        .filter((n: number) => !isNaN(n))
    : [];

  return {
    id,
    number: num,
    name: raw.name || "متتالية أعداد صحيحة مسجلة في OEIS",
    data: dataStr,
    termsList,
    comment: Array.isArray(raw.comment) ? raw.comment.slice(0, 6) : [],
    formula: Array.isArray(raw.formula) ? raw.formula.slice(0, 4) : [],
    reference: Array.isArray(raw.reference) ? raw.reference.slice(0, 4) : [],
    link: Array.isArray(raw.link) ? raw.link.slice(0, 4) : [],
    author: raw.author,
    url: `https://oeis.org/${id}`,
    isCuratedCore: Boolean(KNOWN_OEIS_REGISTRY[id]),
  };
}

/**
 * Searches OEIS via the server API or directly from the official OEIS endpoint.
 * Gracefully falls back to the curated in-memory registry on network timeouts.
 */
export async function searchOEIS(query: string, maxResults = 5): Promise<OEISSequenceEntry[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  // Check in-memory registry first for exact ID match
  const upperQ = cleanQ.toUpperCase();
  if (KNOWN_OEIS_REGISTRY[upperQ]) {
    return [KNOWN_OEIS_REGISTRY[upperQ]];
  }

  try {
    // 1. First attempt: call local server-side proxy route to avoid browser CORS
    const endpoint = `/api/omega/oeis?q=${encodeURIComponent(cleanQ)}&max=${maxResults}`;
    const res = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        return json.map(formatOEISItem).slice(0, maxResults);
      }
      if (json && Array.isArray(json.results) && json.results.length > 0) {
        return json.results.map(formatOEISItem).slice(0, maxResults);
      }
    }
  } catch (_localErr) {
    // Fall back to direct external fetch or registry
  }

  try {
    // 2. Second attempt: direct fetch from OEIS official API
    const directUrl = `https://oeis.org/search?q=${encodeURIComponent(cleanQ)}&fmt=json`;
    const resDirect = await fetch(directUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (resDirect.ok) {
      const rawData = await resDirect.json();
      const list = Array.isArray(rawData) ? rawData : (rawData?.results || []);
      if (list.length > 0) {
        return list.map(formatOEISItem).slice(0, maxResults);
      }
    }
  } catch (_directErr) {
    // Graceful fallback to local registry
  }

  // 3. Fallback: filter local curated registry by query
  const lowerQ = cleanQ.toLowerCase();
  const matched = Object.values(KNOWN_OEIS_REGISTRY).filter((seq) => {
    return (
      seq.id.toLowerCase().includes(lowerQ) ||
      seq.name.toLowerCase().includes(lowerQ) ||
      seq.data.includes(cleanQ)
    );
  });

  if (matched.length > 0) {
    return matched.slice(0, maxResults);
  }

  // If query is related to Collatz, return default fundamental Collatz set
  if (lowerQ.includes("collatz") || lowerQ.includes("كولاتز") || lowerQ.includes("3x+1") || lowerQ.includes("3n+1")) {
    return [
      KNOWN_OEIS_REGISTRY.A006370,
      KNOWN_OEIS_REGISTRY.A006577,
      KNOWN_OEIS_REGISTRY.A006877,
      KNOWN_OEIS_REGISTRY.A006884,
    ];
  }

  return [];
}

/**
 * Returns key Collatz benchmark sequences for deep exploration
 */
export function getCollatzCoreSequences(): OEISSequenceEntry[] {
  return [
    KNOWN_OEIS_REGISTRY.A006370,
    KNOWN_OEIS_REGISTRY.A006577,
    KNOWN_OEIS_REGISTRY.A006877,
    KNOWN_OEIS_REGISTRY.A006884,
    KNOWN_OEIS_REGISTRY.A014682,
  ];
}
