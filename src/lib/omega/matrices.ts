/**
 * src/lib/omega/matrices.ts
 * Matrix operations, projection kernels, and Gram matrix computations for Omega State Space.
 */

import { dot, norm, normalize } from "./math";

export type Matrix = number[][];

/**
 * Compute the Gram matrix G where G[i][j] = <v_i, v_j>
 * Useful for inspecting pairwise alignment and linear independence of candidate answers.
 */
export function computeGramMatrix(vectors: number[][]): Matrix {
  const n = vectors.length;
  const G: Matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      G[i][j] = Number(dot(vectors[i], vectors[j]).toFixed(4));
    }
  }
  return G;
}

/**
 * Compute pairwise cosine similarity matrix
 */
export function computeSimilarityMatrix(vectors: number[][]): Matrix {
  const normalized = vectors.map((v) => normalize(v));
  return computeGramMatrix(normalized);
}

/**
 * Compute projection matrix onto orthogonal complement of vector u
 * P_orth = I - (u * u^T) / ||u||^2
 */
export function orthogonalProject(v: number[], basis: number[]): number[] {
  const bNormSq = dot(basis, basis);
  if (bNormSq < 1e-12) return [...v];
  const coeff = dot(v, basis) / bNormSq;
  return v.map((vi, i) => vi - coeff * basis[i]);
}

/**
 * Synthesize a 2D projection for visual representation (e.g. PCA-like projection to 2D / 3D)
 */
export function projectTo2D(vector: number[]): { x: number; y: number } {
  if (vector.length === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (let i = 0; i < vector.length; i++) {
    const angle = (2 * Math.PI * i) / vector.length;
    x += vector[i] * Math.cos(angle);
    y += vector[i] * Math.sin(angle);
  }
  return {
    x: Number((x * 2.5).toFixed(3)),
    y: Number((y * 2.5).toFixed(3)),
  };
}
