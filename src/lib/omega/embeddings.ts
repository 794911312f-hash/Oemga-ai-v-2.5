/**
 * src/lib/omega/embeddings.ts
 * Real semantic embeddings with graceful fallback to deterministic n-gram hash embeddings.
 */

import { normalize } from "./math";
import type { ProviderKeys } from "./models";

/**
 * Deterministic bag-of-words / n-gram hash embedding.
 * Maps any arbitrary text into a normalized vector in R^dim.
 */
export function hashEmbed(text: string, dim = 64): number[] {
  const vec = new Array(dim).fill(0);
  const normalized = text.toLowerCase().trim();
  if (!normalized) return vec;

  // 1-grams and 2-grams
  const words = normalized.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Hash word
    let h = 5381;
    for (let c = 0; c < word.length; c++) {
      h = ((h << 5) + h + word.charCodeAt(c)) | 0;
    }
    const idx = Math.abs(h) % dim;
    const sign = (h & 1) === 0 ? 1 : -1;
    vec[idx] += sign * (1.0 + Math.min(2, word.length * 0.2));

    // Bigram
    if (i < words.length - 1) {
      const bigram = word + "_" + words[i + 1];
      let hb = 5381;
      for (let c = 0; c < bigram.length; c++) {
        hb = ((hb << 5) + hb + bigram.charCodeAt(c)) | 0;
      }
      const bIdx = Math.abs(hb) % dim;
      const bSign = (hb & 1) === 0 ? 1 : -1;
      vec[bIdx] += bSign * 1.5;
    }
  }

  // Character tri-grams for subword semantics
  for (let i = 0; i < normalized.length - 2; i += 2) {
    const tri = normalized.substring(i, i + 3);
    let h = 31;
    for (let c = 0; c < tri.length; c++) {
      h = (h * 33 + tri.charCodeAt(c)) | 0;
    }
    const idx = Math.abs(h) % dim;
    vec[idx] += ((h & 1) === 0 ? 0.5 : -0.5);
  }

  return normalize(vec);
}

export interface EmbedBatchResult {
  vectors: number[][];
  source: "semantic" | "hash";
}

/**
 * Embed a batch of texts using real semantic embeddings (Gemini embedding model via /api/omega/embed)
 * or fall back seamlessly to deterministic hashEmbed if offline or key is missing.
 */
export async function embedBatch(
  texts: string[],
  keys?: ProviderKeys
): Promise<EmbedBatchResult> {
  if (texts.length === 0) {
    return { vectors: [], source: "hash" };
  }

  try {
    const res = await fetch("/api/omega/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, keys }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.vectors) && data.vectors.length === texts.length) {
        return {
          vectors: data.vectors.map((v: number[]) => normalize(v)),
          source: data.source === "semantic" ? "semantic" : "hash",
        };
      }
    }
  } catch {
    // Network or server offline, fall through to client hash embedding
  }

  // Deterministic local embedding fallback
  return {
    vectors: texts.map((t) => hashEmbed(t, 64)),
    source: "hash",
  };
}
