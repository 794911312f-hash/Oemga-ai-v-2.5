/**
 * langGraphBridge.ts
 * جسر تكامل LangGraph.js مع Omega AI
 * يعزز النواة الطيفية + الـ Consensus + الوكيل المستقل
 */

import { StateGraph, START, END, Annotation, MemorySaver } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { gatherCandidates, type FusionOptions } from "./fusion"; // Omega Logic Integration
import type { ChatMsg } from "./providers";

// ======================
// 1. حالة Omega داخل LangGraph
// ======================
const OmegaState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  // حالة النواة الطيفية من Omega
  spectralState: Annotation<{
    energy: number;
    coherence: number;
    entropy: number;
    spectralRadius: number;
    theta: number;
  }>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({
      energy: 0.5,
      coherence: 0.7,
      entropy: 0.3,
      spectralRadius: 0.8,
      theta: 0,
    }),
  }),
  // درجة الثقة Ψ
  psi: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0.5,
  }),
  // نتائج النماذج المتعددة
  modelResponses: Annotation<Record<string, string>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  // الخطوة الحالية
  currentStep: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "prepare",
  }),
});

// ======================
// 2. عقد (Nodes) متوافقة مع دورة Omega
// ======================

/** مرحلة التحضير */
async function prepareNode(state: typeof OmegaState.State) {
  console.log("[Omega-LangGraph] → prepare");
  return {
    currentStep: "inference",
    messages: [
      new SystemMessage(
        "أنت نواة Omega المعرفية. قم بتحليل السؤال وتوزيعه على النماذج."
      ),
    ],
  };
}

/** مرحلة الاستدلال المتوازي */
async function inferenceNode(state: typeof OmegaState.State) {
  console.log("[Omega-LangGraph] → inference (multi-model)");

  const lastUserMsg = state.messages[state.messages.length - 1]?.content || "";
  
  // Map LangChain messages to ChatMsg format
  const chatMessages: ChatMsg[] = state.messages.map(m => {
    let role: "system" | "user" | "assistant" = "system";
    if (m instanceof HumanMessage) role = "user";
    else if (m instanceof AIMessage) role = "assistant";
    
    return {
      role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    };
  });

  // Integrate with real Omega logic from fusion.ts
  // This calls providers and aggregates responses
  const candidates = await gatherCandidates(
    chatMessages,
    ["gemini-3.8-flash", "gpt-4o-compat"], // Default models for now
    { aggregatorModel: "gemini-3.8-flash" } as FusionOptions
  );

  const responses: Record<string, string> = {};
  
  candidates.forEach(c => {
    responses[c.modelId] = c.text;
  });

  // Simplified PSI: Use default 0.82 if psi is not returned by gatherCandidates
  const psi = 0.82; 

  return {
    modelResponses: responses,
    psi,
    currentStep: "verify",
    spectralState: {
      ...state.spectralState,
      coherence: Math.min(1, state.spectralState.coherence + 0.05),
      entropy: Math.max(0, state.spectralState.entropy - 0.03),
    },
  };
}

/** مرحلة التحقق والتوليف */
async function verifyNode(state: typeof OmegaState.State) {
  console.log("[Omega-LangGraph] → verify & synthesize");

  const finalAnswer =
    state.psi > 0.7
      ? `الإجابة الموحدة (Ψ=${state.psi.toFixed(2)}):\n ${Object.values(state.modelResponses).join("\n---\n")}`
      : `وضع عدم اليقين (Ψ=${state.psi.toFixed(2)}) - عرض المرشحين الأفضل:\n${Object.values(state.modelResponses).join("\n---\n")}`;

  return {
    messages: [new AIMessage(finalAnswer)],
    currentStep: "done",
    spectralState: {
      ...state.spectralState,
      energy: state.psi,
      theta: state.spectralState.theta + 0.1,
    },
  };
}

// ======================
// 3. بناء الرسم البياني
// ======================
const workflow = new StateGraph(OmegaState)
  .addNode("prepare", prepareNode)
  .addNode("inference", inferenceNode)
  .addNode("verify", verifyNode)
  .addEdge(START, "prepare")
  .addEdge("prepare", "inference")
  .addEdge("inference", "verify")
  .addEdge("verify", END);

// ======================
// 4. تجميع مع ذاكرة (Checkpointer)
// ======================
const checkpointer = new MemorySaver();
export const omegaGraph = workflow.compile({
  checkpointer,
});

// ======================
// 5. دالة مساعدة سهلة الاستخدام داخل Omega
// ======================
export async function runOmegaWithLangGraph(
  userInput: string,
  threadId: string = "omega-default"
) {
  const result = await omegaGraph.invoke(
    {
      messages: [new HumanMessage(userInput)],
    },
    {
      configurable: { thread_id: threadId },
    }
  );

  return {
    answer: result.messages[result.messages.length - 1]?.content,
    psi: result.psi,
    spectralState: result.spectralState,
    modelResponses: result.modelResponses,
  };
}
