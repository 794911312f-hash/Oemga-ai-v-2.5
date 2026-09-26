/**
 * src/lib/omega/hardwareDetector.ts
 * =====================================================================
 * Omega Hardware & Capability Orchestration Engine
 * ---------------------------------------------------------------------
 * Automatically profiles:
 * - WebGPU & WebGL2 API availability and GPU vendor
 * - Hardware concurrency (CPU cores), RAM/device memory (GB)
 * - Battery status and thermal constraints
 * - Available Cloud AI API Keys (fal.ai, HF, Replicate, Together)
 * 
 * Auto-selects the optimal Avatar Execution Tier:
 * - Tier 1: Light Procedural 3D (0ms latency, works anywhere)
 * - Tier 2: In-Browser WebGPU / Wasm Mesh Deformation
 * - Tier 3: Photorealistic Neural Cloud Stream (LivePortrait / MuseTalk)
 * =====================================================================
 */

export type AvatarExecutionTier = "tier1_procedural" | "tier2_webgpu" | "tier3_neural_cloud";

export interface HardwareProfile {
  hasWebGPU: boolean;
  gpuAdapterName: string;
  hasWebGL2: boolean;
  cpuCores: number;
  deviceMemoryGb: number;
  batteryLevel: number | null; // 0.0 - 1.0
  isCharging: boolean | null;
  recommendedTier: AvatarExecutionTier;
  targetFps: 30 | 60 | 120;
  shadowsQuality: "off" | "low" | "high";
  tierScore: number; // 0 - 100
  cloudApisAvailable: {
    falAi: boolean;
    huggingFace: boolean;
    replicate: boolean;
    togetherAi: boolean;
  };
}

let cachedProfile: HardwareProfile | null = null;

export async function detectHardwareCapabilities(): Promise<HardwareProfile> {
  if (cachedProfile) {
    return cachedProfile;
  }

  let hasWebGPU = false;
  let gpuAdapterName = "Standard GPU / Software Rasterizer";
  let hasWebGL2 = false;

  // 1. Detect WebGPU
  if (typeof navigator !== "undefined" && "gpu" in navigator && (navigator as any).gpu) {
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        hasWebGPU = true;
        gpuAdapterName = adapter.info?.description || adapter.info?.vendor || "WebGPU Compatible Hardware Adapter";
      }
    } catch {
      hasWebGPU = false;
    }
  }

  // 2. Detect WebGL2
  if (typeof document !== "undefined") {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2");
      hasWebGL2 = !!gl;
      if (gl && (!hasWebGPU || gpuAdapterName.includes("Standard"))) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          gpuAdapterName = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || gpuAdapterName;
        }
      }
    } catch {
      hasWebGL2 = false;
    }
  }

  // 3. CPU Cores & Memory
  const cpuCores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
  const deviceMemoryGb = typeof navigator !== "undefined" ? (navigator as any).deviceMemory || 4 : 4;

  // 4. Battery profile
  let batteryLevel: number | null = null;
  let isCharging: boolean | null = null;
  if (typeof navigator !== "undefined" && "getBattery" in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      batteryLevel = battery.level;
      isCharging = battery.charging;
    } catch {
      // Ignored
    }
  }

  // 5. Check Cloud API tokens in localStorage
  let falAi = false;
  let huggingFace = false;
  let replicate = false;
  let togetherAi = false;

  if (typeof window !== "undefined" && window.localStorage) {
    falAi = !!(localStorage.getItem("omega_fal_key") || localStorage.getItem("fal_key"));
    huggingFace = !!(localStorage.getItem("omega_hf_token") || localStorage.getItem("hf_token"));
    replicate = !!(localStorage.getItem("omega_replicate_token") || localStorage.getItem("replicate_token"));
    togetherAi = !!(localStorage.getItem("omega_together_key") || localStorage.getItem("together_key"));
  }

  // 6. Compute Hardware Score & Recommended Tier
  let tierScore = 40; // Base score for procedural
  if (hasWebGL2) tierScore += 20;
  if (hasWebGPU) tierScore += 30;
  if (cpuCores >= 8) tierScore += 10;
  if (deviceMemoryGb >= 8) tierScore += 10;
  if (falAi || huggingFace || replicate) tierScore += 15;

  let recommendedTier: AvatarExecutionTier = "tier1_procedural";
  let targetFps: 30 | 60 | 120 = 60;
  let shadowsQuality: "off" | "low" | "high" = "low";

  if (hasWebGPU && tierScore >= 75) {
    recommendedTier = "tier2_webgpu";
    targetFps = 60;
    shadowsQuality = "high";
  } else if (tierScore < 50 || (batteryLevel !== null && batteryLevel < 0.2 && !isCharging)) {
    recommendedTier = "tier1_procedural";
    targetFps = 30;
    shadowsQuality = "off";
  } else {
    recommendedTier = "tier1_procedural";
    targetFps = 60;
    shadowsQuality = "low";
  }

  cachedProfile = {
    hasWebGPU,
    gpuAdapterName,
    hasWebGL2,
    cpuCores,
    deviceMemoryGb,
    batteryLevel,
    isCharging,
    recommendedTier,
    targetFps,
    shadowsQuality,
    tierScore: Math.min(100, tierScore),
    cloudApisAvailable: {
      falAi,
      huggingFace,
      replicate,
      togetherAi,
    },
  };

  return cachedProfile;
}
