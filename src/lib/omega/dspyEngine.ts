/**
 * src/lib/omega/dspyEngine.ts
 * =============================================================================
 * DSPy Engine for Omega AI (Declarative Self-improving Prompt Optimization)
 * =============================================================================
 *
 * Implements native DSPy programming framework in TypeScript for Omega AI:
 *  - Declarative Signatures (e.g. "context, question -> rationale, answer")
 *  - Modular Blocks: Predict, ChainOfThought, ReAct, MultiHop
 *  - Teleprompters & Optimizers: BootstrapFewShot, MIPRO (Instruction Proposal Optimization)
 *  - Automatic Metric Evaluation & Prompt Compilation
 */

export interface FieldSpec {
  name: string;
  type: "input" | "output";
  description?: string;
}

export interface Signature {
  signatureString: string; // e.g. "context, question -> rationale, answer"
  inputs: FieldSpec[];
  outputs: FieldSpec[];
  description?: string;
}

export interface Example {
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PredictionResult {
  outputs: Record<string, string>;
  rationale?: string;
  rawResponse: string;
  confidenceScore?: number;
  promptUsed: string;
  demosCount: number;
}

export type MetricFn = (example: Example, prediction: PredictionResult) => number | Promise<number>;

/**
 * Parses a DSPy signature string (e.g. "question -> answer" or "context, question -> rationale, answer")
 */
export function parseSignature(sigStr: string, description?: string): Signature {
  const parts = sigStr.split("->").map((p) => p.trim());
  if (parts.length !== 2) {
    throw new Error(`Invalid DSPy signature format "${sigStr}". Expected "inputs -> outputs".`);
  }

  const inputNames = parts[0].split(",").map((s) => s.trim()).filter(Boolean);
  const outputNames = parts[1].split(",").map((s) => s.trim()).filter(Boolean);

  const inputs: FieldSpec[] = inputNames.map((name) => ({
    name,
    type: "input",
    description: `Input parameter: ${name}`,
  }));

  const outputs: FieldSpec[] = outputNames.map((name) => ({
    name,
    type: "output",
    description: `Target output field: ${name}`,
  }));

  return {
    signatureString: sigStr,
    inputs,
    outputs,
    description: description || `DSPy Program for: ${sigStr}`,
  };
}

/**
 * Base DSPy Module
 */
export abstract class DSPyModule {
  public signature: Signature;
  public demos: Example[] = [];
  public customInstruction?: string;

  constructor(signatureStr: string | Signature, customInstruction?: string) {
    this.signature = typeof signatureStr === "string" ? parseSignature(signatureStr) : signatureStr;
    this.customInstruction = customInstruction;
  }

  /**
   * Constructs the structured prompt for LLM execution
   */
  public buildPrompt(inputValues: Record<string, any>): string {
    const lines: string[] = [];

    // System instruction or module description
    if (this.customInstruction) {
      lines.push(`System Task: ${this.customInstruction}`);
    } else if (this.signature.description) {
      lines.push(`Task Specification: ${this.signature.description}`);
    }

    lines.push(`Signature: ${this.signature.signatureString}`);
    lines.push("\n--- Instructions ---");
    lines.push("Follow the format strictly. Produce clear output matching the requested output fields.");

    // Few-shot demonstrations (if compiled)
    if (this.demos.length > 0) {
      lines.push(`\n--- Few-Shot Demonstrations (${this.demos.length}) ---`);
      this.demos.forEach((demo, idx) => {
        lines.push(`\n[Demonstration #${idx + 1}]`);
        this.signature.inputs.forEach((inField) => {
          if (demo.inputs[inField.name] !== undefined) {
            lines.push(`${inField.name}: ${demo.inputs[inField.name]}`);
          }
        });
        if (demo.outputs) {
          this.signature.outputs.forEach((outField) => {
            if (demo.outputs![outField.name] !== undefined) {
              lines.push(`${outField.name}: ${demo.outputs![outField.name]}`);
            }
          });
        }
      });
    }

    // Target Input Values
    lines.push("\n--- Current Query ---");
    this.signature.inputs.forEach((inField) => {
      const val = inputValues[inField.name] ?? "";
      lines.push(`${inField.name}: ${val}`);
    });

    lines.push("\n--- Output Format Required ---");
    this.signature.outputs.forEach((outField) => {
      lines.push(`${outField.name}: [Your output for ${outField.name}]`);
    });

    return lines.join("\n");
  }

  /**
   * Parses raw LLM text response into output fields
   */
  public parseOutputs(rawText: string): Record<string, string> {
    const result: Record<string, string> = {};
    const outputNames = this.signature.outputs.map((o) => o.name);

    if (outputNames.length === 1) {
      // If single output, sanitize prefixes
      const firstName = outputNames[0];
      const clean = rawText
        .replace(new RegExp(`^${firstName}:\\s*`, "i"), "")
        .trim();
      result[firstName] = clean;
      return result;
    }

    // Multi-field parsing
    outputNames.forEach((name, i) => {
      const nextName = outputNames[i + 1];
      const regex = nextName
        ? new RegExp(`${name}:\\s*([\\s\\S]*?)(?=${nextName}:|$)`, "i")
        : new RegExp(`${name}:\\s*([\\s\\S]*)$`, "i");

      const match = rawText.match(regex);
      if (match && match[1]) {
        result[name] = match[1].trim();
      } else {
        result[name] = "";
      }
    });

    // Fallback if parsing failed
    const hasAny = Object.values(result).some((v) => v.length > 0);
    if (!hasAny && outputNames.length > 0) {
      result[outputNames[0]] = rawText.trim();
    }

    return result;
  }

  abstract forward(
    inputValues: Record<string, any>,
    llmCall: (prompt: string) => Promise<string>
  ): Promise<PredictionResult>;
}

/**
 * DSPy Predict Module
 */
export class Predict extends DSPyModule {
  async forward(
    inputValues: Record<string, any>,
    llmCall: (prompt: string) => Promise<string>
  ): Promise<PredictionResult> {
    const prompt = this.buildPrompt(inputValues);
    const rawResponse = await llmCall(prompt);
    const outputs = this.parseOutputs(rawResponse);

    return {
      outputs,
      rawResponse,
      promptUsed: prompt,
      demosCount: this.demos.length,
    };
  }
}

/**
 * DSPy ChainOfThought Module
 */
export class ChainOfThought extends DSPyModule {
  constructor(signatureStr: string | Signature, customInstruction?: string) {
    const baseSig = typeof signatureStr === "string" ? parseSignature(signatureStr) : signatureStr;

    // Ensure 'rationale' or 'reasoning' is in output fields
    const hasRationale = baseSig.outputs.some((o) => o.name === "rationale" || o.name === "reasoning");
    if (!hasRationale) {
      baseSig.outputs.unshift({
        name: "rationale",
        type: "output",
        description: "Step-by-step reasoning & logical derivation",
      });
      baseSig.signatureString = `${baseSig.inputs.map((i) => i.name).join(", ")} -> rationale, ${baseSig.outputs.slice(1).map((o) => o.name).join(", ")}`;
    }

    super(baseSig, customInstruction || "Think step-by-step before answering. Derivations must precede final output.");
  }

  async forward(
    inputValues: Record<string, any>,
    llmCall: (prompt: string) => Promise<string>
  ): Promise<PredictionResult> {
    const prompt = this.buildPrompt(inputValues);
    const rawResponse = await llmCall(prompt);
    const outputs = this.parseOutputs(rawResponse);

    return {
      outputs,
      rationale: outputs["rationale"] || outputs["reasoning"],
      rawResponse,
      promptUsed: prompt,
      demosCount: this.demos.length,
    };
  }
}

/**
 * DSPy ReAct Module (Reasoning + Action Loop)
 */
export interface ToolDef {
  name: string;
  description: string;
  execute: (args: string) => Promise<string>;
}

export class ReAct extends DSPyModule {
  private tools: ToolDef[];
  private maxSteps: number;

  constructor(signatureStr: string | Signature, tools: ToolDef[], maxSteps = 5) {
    super(signatureStr, "Solve the task using Thought, Action, Action Input, and Observation loop.");
    this.tools = tools;
    this.maxSteps = maxSteps;
  }

  async forward(
    inputValues: Record<string, any>,
    llmCall: (prompt: string) => Promise<string>
  ): Promise<PredictionResult> {
    const toolDescriptions = this.tools
      .map((t) => `- ${t.name}: ${t.description}`)
      .join("\n");

    let trajectory = `Available Tools:\n${toolDescriptions}\n\nTask Query:\n`;
    this.signature.inputs.forEach((i) => {
      trajectory += `${i.name}: ${inputValues[i.name]}\n`;
    });

    for (let step = 1; step <= this.maxSteps; step++) {
      const stepPrompt = `${trajectory}\nStep ${step}:\nThought: [Analyze current state]\nAction: [Tool name or 'Finish']\nAction Input: [Arguments or Final Answer]`;
      const rawText = await llmCall(stepPrompt);

      const actionMatch = rawText.match(/Action:\s*([^\n]+)/i);
      const inputMatch = rawText.match(/Action Input:\s*([^\n]+)/i);

      const action = actionMatch ? actionMatch[1].trim() : "Finish";
      const actionInput = inputMatch ? inputMatch[1].trim() : "";

      if (action.toLowerCase() === "finish" || !actionMatch) {
        const finalOutputStr = actionInput || rawText;
        const outputs = this.parseOutputs(finalOutputStr);

        return {
          outputs,
          rationale: trajectory + "\n" + rawText,
          rawResponse: rawText,
          promptUsed: stepPrompt,
          demosCount: this.demos.length,
        };
      }

      const tool = this.tools.find((t) => t.name.toLowerCase() === action.toLowerCase());
      let observation = "";
      if (tool) {
        try {
          observation = await tool.execute(actionInput);
        } catch (err: any) {
          observation = `Tool Error: ${err.message}`;
        }
      } else {
        observation = `Unknown Tool: ${action}. Valid tools are: ${this.tools.map((t) => t.name).join(", ")}`;
      }

      trajectory += `\nStep ${step}:\n${rawText}\nObservation: ${observation}\n`;
    }

    // Exhausted steps
    const finalRaw = await llmCall(`${trajectory}\nFinal Answer summary:`);
    return {
      outputs: this.parseOutputs(finalRaw),
      rationale: trajectory,
      rawResponse: finalRaw,
      promptUsed: trajectory,
      demosCount: this.demos.length,
    };
  }
}

// =============================================================================
// Teleprompters & Optimizers (BootstrapFewShot & MIPRO)
// =============================================================================

export class BootstrapFewShot {
  private maxBootstrappedDemos: number;
  private metric: MetricFn;

  constructor(metric: MetricFn, maxBootstrappedDemos = 3) {
    this.metric = metric;
    this.maxBootstrappedDemos = maxBootstrappedDemos;
  }

  /**
   * Compiles the program by running against dataset and picking top passing examples as demos
   */
  async compile(
    studentModule: DSPyModule,
    trainset: Example[],
    llmCall: (prompt: string) => Promise<string>
  ): Promise<DSPyModule> {
    const compiledDemos: Example[] = [];

    for (const example of trainset) {
      if (compiledDemos.length >= this.maxBootstrappedDemos) break;

      try {
        const pred = await studentModule.forward(example.inputs, llmCall);
        const score = await this.metric(example, pred);

        if (score >= 0.7) {
          compiledDemos.push({
            inputs: example.inputs,
            outputs: pred.outputs,
            metadata: { score, timestamp: Date.now() },
          });
        }
      } catch (err) {
        console.warn("[DSPy BootstrapFewShot] Candidate demo failed:", err);
      }
    }

    studentModule.demos = compiledDemos;
    return studentModule;
  }
}

export class MIPROOptimizer {
  private metric: MetricFn;
  private numInstructionCandidates: number;

  constructor(metric: MetricFn, numInstructionCandidates = 3) {
    this.metric = metric;
    this.numInstructionCandidates = numInstructionCandidates;
  }

  /**
   * Proposes variant instructions, evaluates each on validation set, and installs the optimal instruction
   */
  async compile(
    studentModule: DSPyModule,
    valSet: Example[],
    llmCall: (prompt: string) => Promise<string>
  ): Promise<{ module: DSPyModule; bestScore: number; bestInstruction: string }> {
    const candidates: string[] = [
      studentModule.customInstruction || "Provide precise, accurate, step-by-step reasoning.",
      "Analyze the problem rigorously. State clear premises, logical inferences, and verified outcomes.",
      "Be concise, mathematically sound, and eliminate irrelevant fluff.",
    ];

    let bestScore = -1;
    let bestInstruction = candidates[0];

    for (const candidateInst of candidates) {
      studentModule.customInstruction = candidateInst;
      let totalScore = 0;

      for (const ex of valSet) {
        const pred = await studentModule.forward(ex.inputs, llmCall);
        const score = await this.metric(ex, pred);
        totalScore += score;
      }

      const avgScore = valSet.length > 0 ? totalScore / valSet.length : 0;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestInstruction = candidateInst;
      }
    }

    studentModule.customInstruction = bestInstruction;
    return {
      module: studentModule,
      bestScore,
      bestInstruction,
    };
  }
}

// =============================================================================
// Helper: Native Omega DSPy Helper Function
// =============================================================================

export async function runOmegaDSPyProgram(
  signatureStr: string,
  inputs: Record<string, any>,
  llmCall: (prompt: string) => Promise<string>,
  options?: {
    useChainOfThought?: boolean;
    customInstruction?: string;
  }
): Promise<PredictionResult> {
  const module = options?.useChainOfThought
    ? new ChainOfThought(signatureStr, options.customInstruction)
    : new Predict(signatureStr, options.customInstruction);

  return await module.forward(inputs, llmCall);
}
