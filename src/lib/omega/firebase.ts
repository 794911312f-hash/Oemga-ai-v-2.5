/**
 * src/lib/omega/firebase.ts
 * Server-Side Firebase Admin Integration for Omega Kernel Self-Evolution & Memory
 * Replaces client SDK with firebase-admin for secure, high-performance server operations.
 */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import firebaseConfig from "../../../firebase-applet-config.json";

let app: App | null = null;
let db: Firestore | null = null;

export const config = firebaseConfig;

export function initFirebase(): Firestore {
  if (db) return db;

  try {
    if (getApps().length === 0) {
      const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (saEnv) {
        try {
          const sa = JSON.parse(saEnv);
          app = initializeApp({
            credential: cert(sa),
            projectId: firebaseConfig.projectId,
          });
        } catch (e) {
          console.warn("[Omega Firebase Admin] Invalid FIREBASE_SERVICE_ACCOUNT JSON, using default app initialization.");
          app = initializeApp({ projectId: firebaseConfig.projectId });
        }
      } else {
        app = initializeApp({ projectId: firebaseConfig.projectId });
      }
    } else {
      app = getApps()[0];
    }

    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log("[Omega Firebase Admin] Connected server-side to Firestore:", firebaseConfig.firestoreDatabaseId);
    return db;
  } catch (err) {
    console.error("[Omega Firebase Admin] Initialization error:", err);
    throw err;
  }
}

export function getDb(): Firestore | null {
  try {
    return initFirebase();
  } catch (e) {
    console.error("[Omega Firebase Admin] getDb failed:", e);
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

// In-Memory Fallback Store when Firestore Admin credentials/permissions are not active in preview
const inMemoryStateMap = new Map<string, KernelEvolutionState>();
const inMemoryExperiences: EvolutionExperience[] = [];
const inMemoryMemories: MemoryItem[] = [];
let hasWarnedPermission = false;

function logFirestoreNotice(err: any) {
  if (!hasWarnedPermission) {
    hasWarnedPermission = true;
    const msg = err?.message || String(err);
    if (msg.includes("PERMISSION_DENIED") || msg.includes("UNAUTHENTICATED") || msg.includes("7")) {
      console.log(
        "[Omega Firebase Admin] Notice: Operating in-memory mode. For cloud persistence, set FIREBASE_SERVICE_ACCOUNT in environment."
      );
    } else {
      console.warn("[Omega Firebase Admin] Firestore operation fallback:", msg);
    }
  }
}

export async function getEvolutionState(userId: string): Promise<KernelEvolutionState> {
  const database = getDb();
  if (database) {
    try {
      const docRef = database.collection("omega_evolution").doc(userId);
      const snap = await docRef.get();
      if (snap.exists) {
        return snap.data() as KernelEvolutionState;
      }
      const state = inMemoryStateMap.get(userId) || DEFAULT_STATE(userId);
      try {
        await docRef.set(state);
      } catch (e) {
        logFirestoreNotice(e);
      }
      inMemoryStateMap.set(userId, state);
      return state;
    } catch (err) {
      logFirestoreNotice(err);
    }
  }

  if (!inMemoryStateMap.has(userId)) {
    inMemoryStateMap.set(userId, DEFAULT_STATE(userId));
  }
  return inMemoryStateMap.get(userId)!;
}

export async function saveEvolutionState(state: KernelEvolutionState): Promise<void> {
  state.lastUpdated = Date.now();
  inMemoryStateMap.set(state.userId, state);

  const database = getDb();
  if (!database) return;

  try {
    const docRef = database.collection("omega_evolution").doc(state.userId);
    await docRef.set(state, { merge: true });
  } catch (err) {
    logFirestoreNotice(err);
  }
}

// ============================================================
// Experiences (Real Learning Store)
// ============================================================

export async function saveExperience(exp: EvolutionExperience): Promise<string> {
  const item = { ...exp, id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, timestamp: exp.timestamp || Date.now() };
  inMemoryExperiences.push(item);

  const database = getDb();
  if (!database) return item.id;

  try {
    const colRef = database.collection("omega_experiences");
    const res = await colRef.add(exp);
    return res.id;
  } catch (err) {
    logFirestoreNotice(err);
    return item.id;
  }
}

export async function findSimilarExperiences(
  userId: string,
  queryEmbedding: number[],
  limitCount = 5
): Promise<EvolutionExperience[]> {
  let items = inMemoryExperiences.filter((x) => x.userId === userId);

  const database = getDb();
  if (database) {
    try {
      const colRef = database.collection("omega_experiences");
      const snap = await colRef
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(80)
        .get();

      if (!snap.empty) {
        items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as EvolutionExperience));
      }
    } catch (err) {
      logFirestoreNotice(err);
    }
  }

  return items
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
}

// ============================================================
// Long-term Memory
// ============================================================

export async function saveMemory(item: MemoryItem): Promise<string> {
  const mem = { ...item, id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, timestamp: item.timestamp || Date.now(), accessCount: item.accessCount || 1 };
  inMemoryMemories.push(mem);

  const database = getDb();
  if (!database) return mem.id;

  try {
    const colRef = database.collection("omega_memory");
    const res = await colRef.add(item);
    return res.id;
  } catch (err) {
    logFirestoreNotice(err);
    return mem.id;
  }
}

export async function searchMemory(
  userId: string,
  queryEmbedding: number[],
  limitCount = 5
): Promise<MemoryItem[]> {
  let items = inMemoryMemories.filter((x) => x.userId === userId);

  const database = getDb();
  if (database) {
    try {
      const colRef = database.collection("omega_memory");
      const snap = await colRef
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();

      if (!snap.empty) {
        items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as MemoryItem));
      }
    } catch (err) {
      logFirestoreNotice(err);
    }
  }

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
}
