/**
 * src/lib/omega/vectorMemory.ts
 * =============================================================================
 * Omega Vector Memory (ChromaDB Integration)
 * =============================================================================
 * Provides long-term semantic memory storage and retrieval for Omega AI,
 * enhancing context across sessions using ChromaDB.
 */

import { ChromaClient, Collection } from "chromadb";

// Initialize ChromaDB (assuming local persistence or remote URL)
const client = new ChromaClient({ path: process.env.CHROMADB_URL || "http://localhost:8000" });

export class VectorMemory {
  private collectionName: string;
  private collection: Collection | null = null;

  constructor(collectionName: string = "omega_memory") {
    this.collectionName = collectionName;
  }

  async init() {
    this.collection = await client.getOrCreateCollection({
      name: this.collectionName,
    });
  }

  async store(id: string, text: string, metadata: Record<string, any> = {}) {
    if (!this.collection) await this.init();
    await this.collection!.add({
      ids: [id],
      documents: [text],
      metadatas: [metadata],
    });
  }

  async retrieve(query: string, nResults: number = 3) {
    if (!this.collection) await this.init();
    const results = await this.collection!.query({
      queryTexts: [query],
      nResults,
    });
    return results;
  }
}

export const omegaMemory = new VectorMemory();
