/**
 * src/lib/omega/localEngineBridge.ts
 * =====================================================================
 * Omega Real Engine & Hardware Bridge (جسر المحركات والخوادم الحقيقية)
 * ---------------------------------------------------------------------
 * Provides real direct network connectors to local and remote inference nodes:
 * 1. Ollama Local LLM Server (http://localhost:11434)
 * 2. ComfyUI Local Diffusion Workflow Server (http://127.0.0.1:8188)
 * 3. OpenAI-Compatible Local Inference (LM Studio, vLLM, Jan.ai, LocalAI)
 * 4. Real-time Node Health Diagnostics & Model Enumeration
 * =====================================================================
 */

export interface LocalEngineConfig {
  ollamaUrl: string; // e.g. "http://localhost:11434"
  ollamaModel: string; // e.g. "qwen2.5:7b" or "llama3.3"
  comfyUiUrl: string; // e.g. "http://127.0.0.1:8188"
  customOpenAiUrl: string; // e.g. "http://localhost:1234/v1"
  customOpenAiKey?: string;
  customModelName?: string;
  isEnabled: boolean;
}

export interface EngineHealthStatus {
  service: "ollama" | "comfyui" | "custom_openai";
  isOnline: boolean;
  latencyMs: number;
  availableModels: string[];
  version?: string;
  error?: string;
}

const DEFAULT_LOCAL_CONFIG: LocalEngineConfig = {
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "qwen2.5:latest",
  comfyUiUrl: "http://127.0.0.1:8188",
  customOpenAiUrl: "http://localhost:1234/v1",
  customOpenAiKey: "",
  customModelName: "local-model",
  isEnabled: false,
};

const STORAGE_KEY = "omega_local_engine_config_v1";

export class LocalEngineBridge {
  private config: LocalEngineConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): LocalEngineConfig {
    if (typeof window === "undefined") return DEFAULT_LOCAL_CONFIG;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_LOCAL_CONFIG, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_LOCAL_CONFIG;
  }

  public saveConfig(cfg: Partial<LocalEngineConfig>): LocalEngineConfig {
    this.config = { ...this.config, ...cfg };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } catch {}
    }
    return this.config;
  }

  public getConfig(): LocalEngineConfig {
    return { ...this.config };
  }

  /**
   * Health Check: Tests real connectivity to Ollama and retrieves available local models
   */
  async checkOllamaHealth(baseUrl?: string): Promise<EngineHealthStatus> {
    const url = (baseUrl || this.config.ollamaUrl).replace(/\/+$/, "");
    const t0 = performance.now();

    try {
      const res = await fetch(`${url}/api/tags`, {
        signal: AbortSignal.timeout(3500),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name || m.model) : [];
      const latencyMs = Math.round(performance.now() - t0);

      return {
        service: "ollama",
        isOnline: true,
        latencyMs,
        availableModels: models,
      };
    } catch (err: any) {
      return {
        service: "ollama",
        isOnline: false,
        latencyMs: Math.round(performance.now() - t0),
        availableModels: [],
        error: err?.message || "Ollama server unreachable at " + url,
      };
    }
  }

  /**
   * Generates real completion from local Ollama instance
   */
  async generateWithOllama(
    prompt: string,
    systemInstruction?: string,
    model?: string
  ): Promise<{ text: string; durationMs: number }> {
    const url = this.config.ollamaUrl.replace(/\/+$/, "");
    const targetModel = model || this.config.ollamaModel || "qwen2.5:latest";
    const t0 = performance.now();

    const body = {
      model: targetModel,
      prompt,
      system: systemInstruction,
      stream: false,
    };

    const res = await fetch(`${url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000), // 60s timeout for local weights
    });

    if (!res.ok) {
      throw new Error(`Ollama generation failed: HTTP ${res.status}`);
    }

    const data = await res.json();
    const durationMs = Math.round(performance.now() - t0);
    return {
      text: data.response || "",
      durationMs,
    };
  }

  /**
   * Health Check: Tests real connectivity to ComfyUI
   */
  async checkComfyUiHealth(baseUrl?: string): Promise<EngineHealthStatus> {
    const url = (baseUrl || this.config.comfyUiUrl).replace(/\/+$/, "");
    const t0 = performance.now();

    try {
      const res = await fetch(`${url}/system_stats`, {
        signal: AbortSignal.timeout(3500),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const latencyMs = Math.round(performance.now() - t0);

      return {
        service: "comfyui",
        isOnline: true,
        latencyMs,
        availableModels: ["ComfyUI Workflows Active"],
        version: data.system?.os || "Local ComfyUI",
      };
    } catch (err: any) {
      return {
        service: "comfyui",
        isOnline: false,
        latencyMs: Math.round(performance.now() - t0),
        availableModels: [],
        error: "ComfyUI server offline or CORS restricted.",
      };
    }
  }

  /**
   * Health Check: Tests real connectivity to OpenAI-compatible server (LM Studio, vLLM)
   */
  async checkCustomOpenAiHealth(baseUrl?: string): Promise<EngineHealthStatus> {
    const url = (baseUrl || this.config.customOpenAiUrl).replace(/\/+$/, "");
    const t0 = performance.now();

    try {
      const res = await fetch(`${url}/models`, {
        headers: this.config.customOpenAiKey
          ? { Authorization: `Bearer ${this.config.customOpenAiKey}` }
          : {},
        signal: AbortSignal.timeout(3500),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const models = Array.isArray(data.data) ? data.data.map((m: any) => m.id) : [];

      return {
        service: "custom_openai",
        isOnline: true,
        latencyMs: Math.round(performance.now() - t0),
        availableModels: models,
      };
    } catch (err: any) {
      return {
        service: "custom_openai",
        isOnline: false,
        latencyMs: Math.round(performance.now() - t0),
        availableModels: [],
        error: "Local OpenAI-compatible node offline.",
      };
    }
  }
}

export const globalLocalEngineBridge = new LocalEngineBridge();
