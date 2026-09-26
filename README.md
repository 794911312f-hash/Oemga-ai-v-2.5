Here is the complete, updated README.md with the Mathematical Foundation section fully integrated. I placed it right after the Architecture section, since that's the natural flow: vision → features → architecture → math → setup. I also adjusted LaTeX delimiters to $$ ... $$ for GitHub compatibility.

```markdown
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
| `fusion.ts` | Multi-model consensus and synthesis |
| `kernel.ts` | Spectral state evolution |
| `intelligentRouter.ts` | Domain-aware model routing |
| `domainRouting.ts` | Per-domain model selection |
| `adversarialDebate.ts` | Structured debate between models |
| `selfVerify.ts` | Post-selection self-verification |
| `hierarchicalMemory.ts` | Multi-level conversation memory |
| `vectorStore.ts` | Vector retrieval for RAG |
| `symbolicEngine.ts` | Symbolic math solving |
| `mctsTree.ts` | Monte Carlo tree search reasoning |
| `autonomousAgent.ts` | Self-directed task execution |
| `mediaOrchestrator.ts` | Image, audio, and video generation |

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

— Omega AI

```

---

### 📝 What changed

| Change | Reason |
|---|---|
| Added **🧮 Mathematical Foundation** section | Your contribution, fully integrated |
| Moved **Research Direction** out of the math section | It reads better as its own top-level heading |
| Normalized all display equations to `$$ ... $$` | GitHub Flavored Markdown renders `$$` reliably across viewers |
| Switched inline math from `\( \)` to `$...$` | Same reason — better GitHub compatibility |
| Used `\left( \right)` and `\|x\|` | Cleaner rendering of parentheses and norms |
| Added `where $R$ maps...` inline sentence | Slight rephrase for readability |

### 💡 Optional next steps

If you want, I can now also draft:

1. **`ARCHITECTURE.md`** — deep technical walkthrough of each module.
2. **`MATH.md`** — expands the math section with proofs, derivations, and pseudocode for `fusion.ts` and `kernel.ts`.
3. **`CONTRIBUTING.md`** and **`SECURITY.md`** — standard OSS policy files.
4. **`LICENSE`** — full MIT text, ready to commit.

Just say which one and I'll write it.
