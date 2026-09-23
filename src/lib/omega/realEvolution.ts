/**
 * src/lib/omega/realEvolution.ts
 * Real Evolution Engine for Omega Kernel
 * Learns from self-verification success/failure and adapts thresholds & weights
 */

import { hashEmbed } from "./embeddings";
import {
  getEvolutionState,
  saveEvolutionState,
  saveExperience,
  findSimilarExperiences,
  type KernelEvolutionState,
  type EvolutionExperience,
} from "./firebase";

export interface EvolutionInput {
  userId: string;
  question: string;
  finalAnswer: string;
  domain: string;
  topPsi: number;
  verificationPassed: boolean;
  chosenModelId?: string;
  candidatesCount: number;
  spread: number;
}

/**
 * Invoked after each conversation → updates state and learns continuously
 */
export async function evolveFromInteraction(input: EvolutionInput): Promise<KernelEvolutionState> {
  const state = await getEvolutionState(input.userId);

  // 1. Update interaction counters
  state.totalInteractions += 1;
  if (input.verificationPassed) {
    state.successfulVerifications += 1;
  } else {
    state.failedVerifications += 1;
  }

  // 2. Update domain statistics
  if (!state.domainStats[input.domain]) {
    state.domainStats[input.domain] = {
      count: 0,
      avgPsi: 0,
      successRate: 0,
      preferredModels: [],
    };
  }
  const ds = state.domainStats[input.domain];
  const prevCount = ds.count;
  ds.count += 1;
  ds.avgPsi = (ds.avgPsi * prevCount + input.topPsi) / ds.count;
  ds.successRate = (ds.successRate * prevCount + (input.verificationPassed ? 1 : 0)) / ds.count;

  if (input.chosenModelId && input.verificationPassed) {
    if (!ds.preferredModels.includes(input.chosenModelId)) {
      ds.preferredModels.push(input.chosenModelId);
      if (ds.preferredModels.length > 5) ds.preferredModels.shift();
    }
  }

  // 3. Real Evolution of thresholds
  const successRate =
    state.totalInteractions > 0
      ? state.successfulVerifications / state.totalInteractions
      : 0.5;

  if (!input.verificationPassed) {
    state.learnedConfig.directThreshold = Math.min(
      0.95,
      state.learnedConfig.directThreshold + 0.01
    );
    state.learnedConfig.uncertainSpread = Math.min(
      0.2,
      state.learnedConfig.uncertainSpread + 0.005
    );
  } else if (input.topPsi > 0.92 && successRate > 0.8) {
    state.learnedConfig.directThreshold = Math.max(
      0.78,
      state.learnedConfig.directThreshold - 0.005
    );
  }

  if (ds.successRate < 0.6 && ds.count >= 5) {
    state.learnedConfig.maxModelsPerDomain = Math.min(5, state.learnedConfig.maxModelsPerDomain + 1);
  }

  // 4. Evolve generation every 5 interactions
  if (state.totalInteractions % 5 === 0) {
    state.generation += 1;
    const newInvariant = `Gen ${state.generation}: domain=${input.domain} avgΨ=${ds.avgPsi.toFixed(2)} success=${(ds.successRate * 100).toFixed(0)}%`;
    state.learnedInvariants.push(newInvariant);
    if (state.learnedInvariants.length > 40) {
      state.learnedInvariants = state.learnedInvariants.slice(-40);
    }
  }

  // 5. Save experience to Firestore
  const embedding = hashEmbed(input.question, 64);
  await saveExperience({
    userId: input.userId,
    question: input.question,
    finalAnswer: input.finalAnswer.slice(0, 2000),
    domain: input.domain,
    topPsi: input.topPsi,
    verificationPassed: input.verificationPassed,
    chosenModelId: input.chosenModelId,
    candidatesCount: input.candidatesCount,
    spread: input.spread,
    timestamp: Date.now(),
    embedding,
  });

  // 6. Save evolved state
  await saveEvolutionState(state);
  return state;
}

/**
 * Retrieves similar experiences to supply as contextual memory for next conversation
 */
export async function getRelevantExperienceContext(
  userId: string,
  question: string,
  limitCount = 3
): Promise<string> {
  const embedding = hashEmbed(question, 64);
  const similar = await findSimilarExperiences(userId, embedding, limitCount);

  if (similar.length === 0) return "";

  return (
    "### خبرات سابقة مشابهة من نواة أوميغا (Firestore RAG):\n" +
    similar
      .map(
        (s, i) =>
          `${i + 1}. سؤال: ${s.question.slice(0, 120)}...\n` +
          `   إجابة سابقة (ψ=${s.topPsi.toFixed(2)}, تحقق=${s.verificationPassed ? "نجح" : "فشل"}):\n` +
          `   ${s.finalAnswer.slice(0, 300)}...`
      )
      .join("\n\n")
  );
}

/**
 * Returns learned configuration for use in dynamic fusion
 */
export async function getLearnedFusionOptions(userId: string) {
  const state = await getEvolutionState(userId);
  return {
    directThreshold: state.learnedConfig.directThreshold,
    uncertainSpread: state.learnedConfig.uncertainSpread,
    maxModelsPerDomain: state.learnedConfig.maxModelsPerDomain,
    generation: state.generation,
    totalInteractions: state.totalInteractions,
  };
}
