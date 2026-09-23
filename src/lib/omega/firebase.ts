/**
 * src/lib/omega/firebase.ts
 * Real Firebase Firestore Integration for Omega Kernel Self-Evolution & Memory
 * Directly connects to the provisioned Firestore database
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit as fsLimit,
  getDocs,
  type Firestore,
} from "firebase/firestore";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

// Firebase configuration from provisioned environment
export const firebaseConfig = {
  projectId: "lunar-storm-pwjkk",
  appId: "1:615184919319:web:d20e7a9dee9cc38c7c2552",
  apiKey: "AIzaSyDCoxADtV-qDodkmWvLheIcQi4S7r1vtcA",
  authDomain: "lunar-storm-pwjkk.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-omegaai-c546828b-c753-4c76-8065-6864b1b5cc5e",
  storageBucket: "lunar-storm-pwjkk.firebasestorage.app",
  messagingSenderId: "615184919319",
};

export function initFirebase(): Firestore {
  if (db) return db;

  try {
    if (getApps().length === 0) {
      app = initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      });
    } else {
      app = getApps()[0];
    }

    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log("[Omega Firebase] Connected to real Firestore database:", firebaseConfig.firestoreDatabaseId);
    return db;
  } catch (err) {
    console.error("[Omega Firebase] Initialization error:", err);
    throw err;
  }
}

export function getDb(): Firestore | null {
  try {
    return initFirebase();
  } catch (e) {
    console.error("[Omega Firebase] getDb failed:", e);
    return null;
  }
}

// ============================================================
// Types
// ============================================================

export interface EvolutionExperience {
  id?: string;
  userId: string;
  question: string;
  finalAnswer: string;
  domain: string;
  topPsi: number;
  verificationPassed: boolean;
  chosenModelId?: string;
  candidatesCount: number;
  spread: number;
  timestamp: number;
  embedding?: number[];
  _sim?: number;
}

export interface KernelEvolutionState {
  userId: string;
  generation: number;
  totalInteractions: number;
  successfulVerifications: number;
  failedVerifications: number;
  domainStats: Record<
    string,
    {
      count: number;
      avgPsi: number;
      successRate: number;
      preferredModels: string[];
    }
  >;
  learnedConfig: {
    directThreshold: number;
    uncertainSpread: number;
    maxModelsPerDomain: number;
  };
  learnedInvariants: string[];
  lastUpdated: number;
}

export interface MemoryItem {
  id?: string;
  userId: string;
  topic: string;
  content: string;
  domain: string;
  confidence: number;
  tags: string[];
  embedding: number[];
  accessCount: number;
  timestamp: number;
  _sim?: number;
}

// ============================================================
// Evolution State
// ============================================================

export const DEFAULT_STATE = (userId: string): KernelEvolutionState => ({
  userId,
  generation: 1,
  totalInteractions: 0,
  successfulVerifications: 0,
  failedVerifications: 0,
  domainStats: {},
  learnedConfig: {
    directThreshold: 0.85,
    uncertainSpread: 0.1,
    maxModelsPerDomain: 3,
  },
  learnedInvariants: [
    "Prioritize mathematical rigor and multi-model consensus.",
    "Maintain high semantic density and self-verification.",
  ],
  lastUpdated: Date.now(),
});

export async function getEvolutionState(userId: string): Promise<KernelEvolutionState> {
  const database = getDb();
  if (!database) return DEFAULT_STATE(userId);

  try {
    const docRef = doc(database, "omega_evolution", userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      const state = DEFAULT_STATE(userId);
      await setDoc(docRef, state);
      return state;
    }
    return snap.data() as KernelEvolutionState;
  } catch (err) {
    console.error("[Omega Firebase] getEvolutionState error:", err);
    return DEFAULT_STATE(userId);
  }
}

export async function saveEvolutionState(state: KernelEvolutionState): Promise<void> {
  const database = getDb();
  if (!database) return;

  try {
    state.lastUpdated = Date.now();
    const docRef = doc(database, "omega_evolution", state.userId);
    await setDoc(docRef, state, { merge: true });
  } catch (err) {
    console.error("[Omega Firebase] saveEvolutionState error:", err);
  }
}

// ============================================================
// Experiences (Real Learning Store)
// ============================================================

export async function saveExperience(exp: EvolutionExperience): Promise<string> {
  const database = getDb();
  if (!database) return "offline-id";

  try {
    const colRef = collection(database, "omega_experiences");
    const docRef = await addDoc(colRef, {
      ...exp,
      timestamp: exp.timestamp || Date.now(),
    });
    return docRef.id;
  } catch (err) {
    console.error("[Omega Firebase] saveExperience error:", err);
    return "error-saving-exp";
  }
}

export async function findSimilarExperiences(
  userId: string,
  queryEmbedding: number[],
  limitCount = 5
): Promise<EvolutionExperience[]> {
  const database = getDb();
  if (!database) return [];

  try {
    const colRef = collection(database, "omega_experiences");
    const q = query(
      colRef,
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      fsLimit(80)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as EvolutionExperience));

    const scored = items
      .filter((x) => x.embedding && x.embedding.length > 0)
      .map((x) => {
        let dot = 0;
        let na = 0;
        let nb = 0;
        const len = Math.min(queryEmbedding.length, x.embedding!.length);
        for (let i = 0; i < len; i++) {
          dot += queryEmbedding[i] * x.embedding![i];
          na += queryEmbedding[i] ** 2;
          nb += x.embedding![i] ** 2;
        }
        const sim = na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
        return { ...x, _sim: sim };
      })
      .sort((a, b) => (b._sim ?? 0) - (a._sim ?? 0))
      .slice(0, limitCount);

    return scored;
  } catch (err) {
    console.error("[Omega Firebase] findSimilarExperiences error:", err);
    return [];
  }
}

// ============================================================
// Long-term Memory
// ============================================================

export async function saveMemory(item: MemoryItem): Promise<string> {
  const database = getDb();
  if (!database) return "offline-id";

  try {
    const colRef = collection(database, "omega_memory");
    const docRef = await addDoc(colRef, {
      ...item,
      timestamp: item.timestamp || Date.now(),
      accessCount: item.accessCount || 1,
    });
    return docRef.id;
  } catch (err) {
    console.error("[Omega Firebase] saveMemory error:", err);
    return "error-saving-memory";
  }
}

export async function searchMemory(
  userId: string,
  queryEmbedding: number[],
  limitCount = 5
): Promise<MemoryItem[]> {
  const database = getDb();
  if (!database) return [];

  try {
    const colRef = collection(database, "omega_memory");
    const q = query(
      colRef,
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      fsLimit(100)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as MemoryItem));

    return items
      .map((x) => {
        let dot = 0;
        let na = 0;
        let nb = 0;
        const emb = x.embedding || [];
        const len = Math.min(queryEmbedding.length, emb.length);
        for (let i = 0; i < len; i++) {
          dot += queryEmbedding[i] * emb[i];
          na += queryEmbedding[i] ** 2;
          nb += emb[i] ** 2;
        }
        const sim = na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
        return { ...x, _sim: sim };
      })
      .sort((a, b) => (b._sim ?? 0) - (a._sim ?? 0))
      .slice(0, limitCount);
  } catch (err) {
    console.error("[Omega Firebase] searchMemory error:", err);
    return [];
  }
}
