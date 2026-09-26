/**
 * src/lib/omega/kernel.ts
 * Omega Kernel Architecture:
 * State vector mechanics, spectral consensus, real-time pub/sub telemetry,
 * and continuous kernel state evolution synchronized with the 3D Avatar.
 */

import { norm, normalize, entropy } from "./math";
import { hashEmbed } from "./embeddings";
import type { FusionCandidate } from "./fusion";

export type AvatarMoodState =
  | "neutral"
  | "speaking"
  | "eureka"
  | "thinking"
  | "adjust_glasses"
  | "scratch_beard"
  | "pointing";

export interface KernelState {
  step: number;
  dim: number;
  stateVector: number[];
  energy: number;
  coherence: number;
  theta: number; // Phase angle in radians
  entropy: number;
  spectralRadius: number;
  activeDimensions: number;
  lastUpdated: number;
  recentProjections: { label: string; x: number; y: number; psi: number }[];
  avatarMood?: AvatarMoodState;
  lastDomain?: string;
  thinkingDepth?: number;
  lastInsight?: string;
}

type KernelListener = (state: KernelState) => void;

export class OmegaKernel {
  private state: KernelState;
  private listeners: Set<KernelListener> = new Set();

  constructor(dim = 32) {
    const initialVec = normalize(
      Array.from({ length: dim }, (_, i) => Math.sin((i + 1) * 0.5))
    );
    this.state = {
      step: 0,
      dim,
      stateVector: initialVec,
      energy: 1.0,
      coherence: 0.88,
      theta: 0.0,
      entropy: 1.25,
      spectralRadius: 0.94,
      activeDimensions: Math.round(dim * 0.75),
      lastUpdated: Date.now(),
      recentProjections: [],
      avatarMood: "neutral",
      lastDomain: "general",
      thinkingDepth: 2,
      lastInsight: "النواة الكمومية في حالة اتزان طيفي وجاهزية للاستدلال.",
    };
  }

  public getState(): KernelState {
    return { ...this.state };
  }

  /**
   * Subscribe to real-time kernel state updates (used by OmegaProfessor3D & HUDs).
   */
  public subscribe(listener: KernelListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snapshot = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (e) {
        console.warn("[OmegaKernel] Listener error:", e);
      }
    });
  }

  /**
   * Updates the 3D Avatar mood and optional live insight banner, notifying subscribers.
   */
  public setAvatarMood(
    mood: AvatarMoodState,
    insight?: string,
    domain?: string,
    thinkingDepth?: number
  ): KernelState {
    this.state.avatarMood = mood;
    if (insight !== undefined) this.state.lastInsight = insight;
    if (domain !== undefined) this.state.lastDomain = domain;
    if (thinkingDepth !== undefined) this.state.thinkingDepth = thinkingDepth;
    this.state.lastUpdated = Date.now();
    this.emit();
    return this.getState();
  }

  /**
   * Absorb input stimulus and candidate consensus vectors, evolving the kernel state.
   */
  public absorb(
    input: string,
    candidates: FusionCandidate[] = [],
    domain?: string
  ): KernelState {
    const inputVec = hashEmbed(input, this.state.dim);
    this.state.step += 1;

    // Weighted blend with existing state vector
    const alpha = 0.35;
    let newVec = this.state.stateVector.map(
      (sv, i) => (1 - alpha) * sv + alpha * inputVec[i]
    );

    // If candidates exist, pull state towards candidate consensus weighted by psi
    if (candidates.length > 0) {
      const candidateVecs = candidates.map((c) => hashEmbed(c.text, this.state.dim));
      candidates.forEach((c, idx) => {
        const pull = c.weight * 0.25;
        const cv = candidateVecs[idx];
        newVec = newVec.map((v, i) => v + pull * cv[i]);
      });
    }

    const normalizedState = normalize(newVec);
    this.state.stateVector = normalizedState;

    // Phase progression
    this.state.theta = (this.state.theta + 0.15 * Math.PI) % (2 * Math.PI);

    // Compute energy
    this.state.energy = Number(norm(normalizedState).toFixed(4));

    // Spectral coherence
    const candidatePsiAvg =
      candidates.length > 0
        ? candidates.reduce((acc, c) => acc + c.psi, 0) / candidates.length
        : 0.85;
    this.state.coherence = Number(
      (0.7 * this.state.coherence + 0.3 * candidatePsiAvg).toFixed(4)
    );

    // Dynamic entropy
    const weights = candidates.map((c) => c.weight);
    this.state.entropy = Number(
      (weights.length > 0 ? entropy(weights) : 1.1).toFixed(4)
    );

    // Active dimensions (non-trivial components)
    this.state.activeDimensions = normalizedState.filter(
      (x) => Math.abs(x) > 0.05
    ).length;

    // Spectral radius
    this.state.spectralRadius = Number(
      (0.85 + 0.14 * this.state.coherence).toFixed(4)
    );
    if (domain) this.state.lastDomain = domain;
    this.state.avatarMood = this.state.coherence >= 0.88 ? "eureka" : "pointing";
    this.state.lastUpdated = Date.now();

    // 2D projections for visualizer
    if (candidates.length > 0) {
      this.state.recentProjections = candidates.map((c, i) => {
        const angle = (2 * Math.PI * i) / candidates.length + this.state.theta;
        const radius = (1.05 - c.psi) * 120 + 20;
        return {
          label: c.modelId,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          psi: Number(c.psi.toFixed(3)),
        };
      });
    }

    this.emit();
    return this.getState();
  }

  public reset(dim = 32): void {
    const initialVec = normalize(
      Array.from({ length: dim }, (_, i) => Math.sin((i + 1) * 0.5))
    );
    this.state = {
      step: 0,
      dim,
      stateVector: initialVec,
      energy: 1.0,
      coherence: 0.88,
      theta: 0.0,
      entropy: 1.25,
      spectralRadius: 0.94,
      activeDimensions: Math.round(dim * 0.75),
      lastUpdated: Date.now(),
      recentProjections: [],
      avatarMood: "neutral",
      lastDomain: "general",
      thinkingDepth: 2,
      lastInsight: "تمت إعادة ضبط متجه الحالة الكمومي للنواة.",
    };
    this.emit();
  }
}

export const globalOmegaKernel = new OmegaKernel(32);
