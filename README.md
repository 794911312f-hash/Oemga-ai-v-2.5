# 🧠 Omega AI — Cognitive Consensus Engine

> **A self-hosted, multi-model reasoning system built on spectral consensus, dynamic state evolution, and an interactive 3D cognitive avatar.**

[![Version](https://img.shields.io/badge/version-2.5.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)]()
[![React](https://img.shields.io/badge/React-19-61dafb.svg)]()
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)]()

---

## 📖 Overview

**Omega AI** is not a wrapper around a single language model. It is a **cognitive operating system** that orchestrates multiple AI models, evaluates their agreement through a quantitative consensus mechanism, and evolves an internal spectral state with every query.

Instead of trusting one model blindly, Omega asks many — then measures how much they agree, how confident the consensus is, and how uncertain the result remains.

The system is designed first and foremost as a **personal reasoning tool**: a private, extensible alternative to subscription-locked chat interfaces, where the user owns the pipeline, the memory, and the intelligence.

---

## ✨ Key Features

### 🎯 Spectral Consensus Engine
- Queries multiple models in parallel (Gemini, GPT, Claude, DeepSeek, Qwen, Groq, local models).
- Embeds candidate responses and computes a **semantic centroid**.
- Derives a confidence metric **Ψ (Psi)** from cosine distance to the centroid.
- Weights each response proportionally and synthesizes a final unified answer.
- Falls back to an "uncertain" mode when consensus is weak, presenting the top candidates instead of silently picking one.

### 🧬 Dynamic Spectral Kernel
- Maintains an internal 32-dimensional state vector.
- Tracks **energy**, **coherence**, **entropy**, and **spectral radius** across turns.
- Uses polar coordinates (θ) to represent phase transitions in reasoning.
- Observable and traceable — every internal value is exposed to the UI.

### 🎭 Professor Omega — Cognitive Avatar
- A 3D interactive avatar whose mood reflects the real system state.
- Transitions between states: **Thinking**, **Dialogue**, **Eureka**, **Uncertain**.
- Synchronized with Ψ and entropy in real time.
- Alternative personas (Newton, Einstein, Tesla) for different reasoning lenses.

### 🧩 Modular Reasoning Units
| Module | Purpose |
|---|---|
| `omegaCore.ts` | Unified request lifecycle orchestrator (`prepare` → `inference` → `verify` → `commit`) |
| `fusion.ts` | Multi-model consensus and synthesis |
| `kernel.ts` | Spectral state evolution & `OmegaCore ⇄ OmegaKernel` live bridge |
| `inferenceEngine.ts` | Stateful matrices (Memory, Confidence, Experience, Agreement, Goals, Knowledge Graph) |
| `intelligentRouter.ts` | Domain-aware model routing |
| `domainRouting.ts` | Per-domain model selection |
| `adversarialDebate.ts` | Structured debate between models |
| `selfVerify.ts` | Post-selection self-verification |
| `hierarchicalMemory.ts` | 3-tier working, episodic, and axiomatic memory |
| `vectorStore.ts` | Vector retrieval for RAG |
| `symbolicEngine.ts` | Symbolic math solving (Nerdamer / Math.js / SymPy CAS) |
| `mctsTree.ts` | Monte Carlo tree search reasoning |
| `autonomousAgent.ts` | Self-directed task execution & self-correction |
| `providerManager.ts` | Multi-provider media router, health telemetry & automatic failover |
| `mediaOrchestrator.ts` | Image, audio, and video generation |

---

## 🌐 Integrated Services & Multi-Provider Architecture (الخدمات المتكاملة)

Omega AI decouples reasoning and media synthesis from any single vendor by routing requests through unified service layers with automatic failover (`ProviderManager`):

### 1. 🧠 Language & Reasoning Services (LLM Consensus Pool)
- **Google Gemini (`@google/genai`)**: High-speed reasoning, multimodal document/image analysis, and search grounding.
- **OpenRouter Unified Gateway**: Multi-provider access to **Alibaba Qwen 2.5 72B**, **DeepSeek R1**, **Meta Llama 3.3 70B**, **Anthropic Claude 3.5 Sonnet**, **OpenAI GPT-4o**, and **xAI Grok**.
- **Together AI & Groq**: Low-latency open-weights inference.
- **Local Hardware Bridge**: Direct zero-cost local execution via **Ollama** (`http://localhost:11434`) and **vLLM** (`http://localhost:8000`).

### 2. 🎨 Media Router & Generative Visual Services (`ProviderManager`)
Omega routes image, video, and audio tasks across prioritized providers based on latency, success rate, cost, and quality, failing over automatically:
- **Hugging Face Inference Providers**: Unified API gateway for FLUX.1, Stable Diffusion, LTX-Video, and Whisper STT.
- **fal.ai**: Ultra-fast generation for **FLUX.1 Pro/Schnell**, **Kling Video**, **Wan 2.2**, **Stable Video**, and **Vidu**.
- **Replicate**: Open-source model hub for **FLUX**, **Wan 2.1**, **LivePortrait**, **MuseTalk**, and **SadTalker**.
- **Together AI**: Unified image generation (`FLUX.1-schnell-Free`).
- **Local ComfyUI**: Self-hosted node-based image/video/avatar pipelines (`http://localhost:8188`).

### 3. 🎭 Hybrid Avatar & Voice Services (Professor Omega)
- **Tier 1 — Lightweight Real-Time Engine (Always Active)**: Browser-native **CSS + HTML5 Canvas + Web Audio API** frequency analyzer for zero-latency lip-sync, eye tracking, blinking, breathing, and head tilt on any device.
- **Tier 2 — Pro Neural Lip-Sync (Cloud API / Local GPU)**: Automatic upgrade to **LivePortrait**, **MuseTalk**, or **SadTalker** when a cloud API key (`fal.ai` / `Replicate`) or local GPU (`ComfyUI`) is connected.
- **Voice Synthesis & STT**: **ElevenLabs**, **OpenAI TTS**, **XTTS v2**, **Edge TTS**, and **Web Speech API** with 12+ scientific and documentary voice personas.

### 4. 🔬 Scientific, Symbolic & Real-Time Grounding Services
- **Symbolic CAS Engine (`/api/omega/symbolic`)**: Algebraic simplification, differentiation, integration, equation systems, and Collatz orbit verification via `nerdamer` and `mathjs`.
- **OEIS & arXiv Integration (`/api/omega/oeis`)**: Live integer sequence lookup and scientific preprint retrieval for open mathematical problems.
- **Live Weather & Global News (`/api/omega/tools/weather`, `/api/omega/tools/news`)**: Real-time meteorological telemetry (`Open-Meteo`) and verified RSS news grounding.
- **Firebase Cloud Persistence (`firebase-admin`)**: Long-term episodic memory, self-evolving weights, and cross-session state synchronization.

### 🎨 Multimodal Studio
- **Images** — high-quality generation from prompts.
- **Video** — short interactive clips.
- **Charts** — bar, line, pie, area, radar (Recharts).
- **Math** — full LaTeX rendering via KaTeX and MathJax.
- **Voice** — TTS and STT integration.

---

## 🏗️ Architecture

```

┌────▼────┐ ┌───▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
│ Gemini  │ │  GPT   │ │ Claude  │ │DeepSeek │ │  Local  │
└────┬────┘ └───┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
│          │           │           │           │
└──────────┴─────┬─────┴───────────┴───────────┘
│
┌────────▼─────────┐
│   fusion.ts      │
│  Semantic        │
│  Centroid + Ψ    │
└────────┬─────────┘
│
┌────────▼─────────┐
│   kernel.ts      │
│  State Evolution │
│  E, H, θ, ρ      │
└────────┬─────────┘
│
┌────────────────┼─────────────────┐
│                │                 │
┌────▼────┐     ┌─────▼─────┐     ┌────▼────┐
│ Avatar  │     │  Memory   │     │ Verify  │
│ Mood    │     │  Update   │     │ Layer   │
└─────────┘     └───────────┘     └─────────┘

```

---

## 🧮 Mathematical Foundation

Omega AI is built upon a quantitative reasoning framework rather than simple response aggregation. Every reasoning cycle produces measurable cognitive signals that are used to evaluate confidence, disagreement, and internal state evolution.

### 1. Semantic Consensus

Suppose the system receives responses from **N** language models.

Each response is embedded into a semantic vector

$$
e_i \in \mathbb{R}^{d}
$$

The semantic centroid is

$$
C = \frac{1}{N}\sum_{i=1}^{N} e_i
$$

Agreement is measured through cosine similarity

$$
S_i = \cos(e_i, C)
$$

---

### 2. Consensus Confidence (Ψ)

Omega defines the confidence score

$$
\Psi = \exp(-\overline{D})
$$

where

$$
\overline{D}
=
\frac{1}{N}
\sum_{i=1}^{N}
\left(1 - \cos(e_i, C)\right)
$$

Properties:

- Ψ ≈ 1 → strong consensus
- Ψ ≈ 0.5 → partial agreement
- Ψ < 0.4 → uncertain reasoning

This metric determines whether the system synthesizes a single answer or exposes multiple competing hypotheses.

---

### 3. Weighted Fusion

Each model receives a normalized weight

$$
w_i =
\frac{\Psi_i}{\sum_j \Psi_j}
$$

The synthesized response maximizes the weighted semantic agreement instead of selecting the longest or most confident individual answer.

---

### 4. Spectral Cognitive State

Omega maintains an internal cognitive vector

$$
x_t \in \mathbb{R}^{32}
$$

Each interaction updates the state

$$
x_{t+1} = f(x_t, u_t)
$$

where

- $u_t$ is the current query
- $f$ represents the spectral evolution kernel

---

### 5. Cognitive Energy

The internal energy is

$$
E = \|x\|^2
$$

High energy indicates intensive reasoning activity, while lower energy corresponds to stable dialogue.

---

### 6. Cognitive Entropy

The normalized state distribution

$$
p_i = \frac{|x_i|}{\sum_j |x_j|}
$$

produces

$$
H = -\sum_i p_i \log p_i
$$

Entropy measures uncertainty and internal dispersion.

---

### 7. Coherence

Internal coherence is defined as the average cosine similarity between the current state and recent memory states

$$
C_h = \frac{1}{K} \sum_{i=1}^{K} \cos(x_t, x_i)
$$

Higher coherence implies stable long-term reasoning.

---

### 8. Spectral Radius

For the transition matrix $A$, Omega computes

$$
\rho(A) = \max |\lambda_i|
$$

where $\lambda_i$ are the eigenvalues.

The spectral radius provides an indicator of cognitive stability and long-term convergence.

---

### 9. Phase Angle (θ)

The kernel projects the internal state into polar coordinates

$$
\theta = \operatorname{atan2}(y, x)
$$

Different angular regions correspond to different reasoning modes:

| θ Region | Cognitive Mode |
|-----------|----------------|
| Stable | Dialogue |
| Increasing | Deep Reasoning |
| Peak | Eureka |
| Chaotic | Uncertain |

---

### 10. Dynamic Routing

Before inference, Omega estimates the query domain

$$
d = R(q)
$$

where $R$ maps the query to one of:

- Mathematics
- Programming
- Scientific reasoning
- Creative writing
- Real-time knowledge

Each domain dynamically selects the most appropriate model ensemble.

---

### 11. Adversarial Debate

Selected models participate in a structured debate.

Each response is evaluated for:

- factual consistency
- logical validity
- mathematical correctness
- contradiction detection
- uncertainty estimation

The final synthesis is generated only after this verification stage.

---

### 12. Self-Verification

The synthesized answer undergoes a second verification pass.

Omega evaluates:

- unsupported claims
- logical inconsistencies
- hallucination risk
- missing assumptions
- confidence calibration

Only then is the final response delivered.

---

### 13. Benchmark Philosophy

Unlike traditional chat systems, Omega evaluates itself using measurable quantities rather than subjective confidence.

Primary evaluation metrics include:

- Consensus Confidence (Ψ)
- Semantic Agreement
- Entropy
- Coherence
- Energy
- Response Stability
- Self-Verification Success Rate
- Hallucination Detection Rate

---

## 🔬 Research Direction

Omega AI is designed as a research platform for multi-model cognitive systems.

Future work includes:

- Adaptive consensus learning
- Bayesian confidence calibration
- Graph-based reasoning
- Symbolic-neural integration
- Reinforcement-driven routing
- Autonomous planning agents
- Distributed local model orchestration
- Cognitive memory compression
- Scientific theorem assistance
- Multi-agent collaborative reasoning

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 20 or **Bun** ≥ 1.1
- **Git**
- API keys for at least one provider (see below)
- Optional: **Ollama** for fully local inference

### Installation

```bash
git clone https://github.com/794911312f-hash/Oemga-ai-v-2.5.git
cd Oemga-ai-v-2.5
bun install      # or: npm install
```

Environment Variables

Create a .env.local file in the project root:

```env
# --- Required (at least one) ---
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# --- Optional providers ---
DEEPSEEK_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
TOGETHER_API_KEY=your_key_here

# --- Local inference (no key required) ---
OLLAMA_BASE_URL=http://localhost:11434

# --- Media ---
ELEVENLABS_API_KEY=your_key_here
PLAYHT_API_KEY=your_key_here

# --- Firebase (deployment) ---
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

⚠️ Never commit .env.local or any API key to the repository. Ensure .gitignore includes .env*.

Run Locally

```bash
bun run dev
# or
npm run dev
```

The app will be available at http://localhost:5173.

Build for Production

```bash
bun run build
bun run start
```

---

🧪 Testing

```bash
bun run test          # unit tests
bun run test:e2e      # end-to-end
bun run typecheck     # TypeScript validation
```

---

🌐 Deployment

Option 1 — Google Cloud Run (Recommended)

```bash
gcloud run deploy omega-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

Option 2 — Docker Compose (VPS)

```bash
docker compose up -d --build
```

Option 3 — Firebase Hosting + Cloud Functions

See DEPLOYMENT.md for the full guide.

---

🔐 Security & Privacy

· All API keys are read from environment variables — never hardcoded.
· Firebase Admin SDK enforces authenticated reads/writes.
· Rate limiting is applied per endpoint.
· Queue authorization validates each inference request.
· Conversations are stored locally by default; cloud sync is opt-in.

If you discover a vulnerability, please see SECURITY.md.

---

🗺️ Roadmap

☐ Multi-provider fallback — automatic failover across Gemini, Groq, DeepSeek, OpenRouter, Ollama
☐ Local-first mode — run entirely offline with Ollama + Whisper.cpp
☐ Tool use layer — web search, code execution, file analysis
☐ Per-domain model profiles — auto-select optimal model per task
☐ Plugin system — third-party reasoning modules
☐ Full audit log — every consensus decision traceable

---

🤝 Contributing

Contributions are welcome. Please:

1. Fork the repository.
2. Create a feature branch: git checkout -b feature/amazing-feature.
3. Commit with clear messages: git commit -m "Add X".
4. Push and open a Pull Request.

Before submitting, run:

```bash
bun run typecheck && bun run test && bun run lint
```

---

📜 License

Released under the MIT License — see LICENSE for details.

You are free to use, modify, and distribute this project, including commercially. Attribution is appreciated but not required.

---

🙏 Acknowledgements

Omega stands on the shoulders of:

· The open-source AI community
· Providers offering accessible APIs (Google AI Studio, Groq, DeepSeek, OpenRouter, Together)
· The local inference ecosystem (Ollama, llama.cpp, vLLM)
· Everyone who chooses to build instead of subscribe

---

📬 Contact

· GitHub: @794911312f-hash
· Live Demo: omega-ai-1.ai.studio

---

"Don't rent intelligence. Build it."

— Omega AI (Created & Architected by **faid Massinissa**)
