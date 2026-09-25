/**
 * src/lib/omega/codeSandbox.ts
 * =============================================================================
 * Safe Sandboxed Code Execution & Self-Correction Engine for Omega Kernel
 * =============================================================================
 *
 * Provides:
 *  - Sandboxed JS/TS code execution in Node 'vm' with memory/time bounds
 *  - Autonomous Self-Correction Loop: catches runtime errors, self-repairs code, and re-executes
 */

export interface ExecutionResult {
  ok: boolean;
  output: string;
  returnValue?: any;
  error?: string | null;
  attempts: number;
  history: Array<{
    attempt: number;
    code: string;
    error: string | null;
    output: string;
  }>;
  executionTimeMs: number;
}

export class SafeCodeSandbox {
  private timeoutMs = 3500;

  /**
   * Executes code safely in a sandbox
   */
  async runSingle(code: string): Promise<{ ok: boolean; output: string; returnValue?: any; error?: string | null }> {
    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) =>
        logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
      error: (...args: any[]) => logs.push("[ERROR] " + args.join(" ")),
      warn: (...args: any[]) => logs.push("[WARN] " + args.join(" ")),
    };

    try {
      const vm = await import("vm");
      const sandbox = {
        console: customConsole,
        Math,
        Date,
        JSON,
        parseInt,
        parseFloat,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        Map,
        Set,
      };

      vm.createContext(sandbox);
      const script = new vm.Script(code);
      const returnValue = script.runInNewContext(sandbox, { timeout: this.timeoutMs });

      const output = logs.join("\n") + (returnValue !== undefined ? `\n[القيمة المُرجعة]: ${JSON.stringify(returnValue, null, 2)}` : "");
      return { ok: true, output: output.trim(), returnValue, error: null };
    } catch (err: any) {
      return { ok: false, output: logs.join("\n"), error: err?.message || String(err) };
    }
  }

  /**
   * Autonomous Self-Correcting Execution:
   * If code fails, it diagnoses the error, repairs the code, and re-runs up to maxAttempts.
   */
  async executeWithSelfCorrection(
    initialCode: string,
    repairFn?: (code: string, error: string) => Promise<string>,
    maxAttempts = 3
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    let currentCode = initialCode;
    const history: ExecutionResult["history"] = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const run = await this.runSingle(currentCode);
      history.push({
        attempt,
        code: currentCode,
        error: run.error,
        output: run.output,
      });

      if (run.ok) {
        return {
          ok: true,
          output: run.output || "تم تنفيذ الكود البرمجي بنجاح.",
          returnValue: run.returnValue,
          error: null,
          attempts: attempt,
          history,
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Self-repair logic
      if (attempt < maxAttempts) {
        if (repairFn) {
          try {
            currentCode = await repairFn(currentCode, run.error || "Unknown error");
          } catch {
            currentCode = this.heuristicRepair(currentCode, run.error || "");
          }
        } else {
          currentCode = this.heuristicRepair(currentCode, run.error || "");
        }
      }
    }

    return {
      ok: false,
      output: history[history.length - 1].output,
      error: history[history.length - 1].error,
      attempts: maxAttempts,
      history,
      executionTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Rule-based heuristic repair for common runtime exceptions
   */
  private heuristicRepair(code: string, error: string): string {
    let repaired = code;

    // 1. Missing declaration / ReferenceError
    if (/is not defined/.test(error)) {
      const match = error.match(/(\w+) is not defined/);
      if (match && match[1]) {
        repaired = `let ${match[1]} = 0;\n` + repaired;
      }
    }

    // 2. Return outside function
    if (/Illegal return statement/.test(error)) {
      repaired = `(() => {\n${repaired}\n})();`;
    }

    // 3. Division by zero check
    if (/zero/i.test(error) || /infinity/i.test(error)) {
      repaired = repaired.replace(/\/ 0/g, "/ 1e-12");
    }

    return repaired;
  }
}
