/**
 * src/lib/omega/types.ts
 * Unified types export for Omega AI ecosystem.
 */

export * from "./math";
export * from "./models";
export * from "./embeddings";
export * from "./domainRouting";
export * from "./selfVerify";
export * from "./providers";
export * from "./fusion";
export * from "./matrices";
export * from "./kernel";
export * from "./memory";
export * from "./lineage";
export * from "./optimizer";
export * from "./bench";

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  mimeType?: string;
  textContent?: string;
  base64Data?: string;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  attachments?: ChatAttachment[];
  fusionResult?: import("./fusion").FusionResult;
  isFusing?: boolean;
  stepProgress?: {
    step: "routing" | "gathering" | "embedding" | "scoring" | "resolving" | "verifying";
    details?: string;
  };
}

