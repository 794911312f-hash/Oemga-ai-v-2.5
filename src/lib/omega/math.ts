/**
 * src/lib/omega/math.ts
 * Mathematical core for Omega V2/V2.5 confidence blending,
 * vector geometry, and kernel calculations.
 */

export function dot(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function norm(v: number[]): number {
  return Math.sqrt(dot(v, v));
}

export function normalize(v: number[]): number[] {
  const n = norm(v);
  if (n < 1e-12) return v.map(() => 0);
  return v.map((x) => x / n);
}

export function cosine(a: number[], b: number[]): number {
  const na = norm(a);
  const nb = norm(b);
  if (na < 1e-12 || nb < 1e-12) return 0;
  const val = dot(a, b) / (na * nb);
  return Math.max(-1, Math.min(1, val));
}

export function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Exponential consensus scoring (Ψ - Psi)
 * Compares deviation from centroid delta with standard deviation sigma.
 * Lower delta => higher psi (closer to consensus).
 */
export function clipExpPsi(delta: number, sigma: number, epsilon = 1e-6): number {
  const effectiveSigma = Math.max(sigma, epsilon);
  // As delta -> 0, psi -> 1.0
  const raw = Math.exp(-delta / (effectiveSigma * 1.5 + 0.05));
  return Math.max(0.01, Math.min(1.0, raw));
}

/**
 * Shannon Entropy of probability distribution (in bits)
 */
export function entropy(weights: number[]): number {
  let h = 0;
  for (const w of weights) {
    if (w > 1e-12) {
      h -= w * Math.log2(w);
    }
  }
  return h;
}

export function softmax(arr: number[], temperature = 1.0): number[] {
  const temp = Math.max(temperature, 1e-4);
  const max = Math.max(...arr);
  const exps = arr.map((x) => Math.exp((x - max) / temp));
  const sum = exps.reduce((a, b) => a + b, 0);
  if (sum < 1e-12) return arr.map(() => 1 / arr.length);
  return exps.map((e) => e / sum);
}
