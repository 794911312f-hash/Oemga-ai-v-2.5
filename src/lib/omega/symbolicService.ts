/**
 * src/lib/omega/symbolicService.ts
 * =====================================================================
 * Omega Symbolic Mathematics & CAS Service Layer (خدمة الحساب الرمزي الشاملة)
 * ---------------------------------------------------------------------
 * A high-level service layer wrapping advanced Computer Algebra Systems (CAS)
 * such as SymPy / Nerdamer / Math.js, enabling Omega to:
 * 1. Solve algebraic systems of linear and non-linear equations
 * 2. Simplify complex algebraic and trigonometric expressions and equations
 * 3. Perform exact symbolic calculus (differentiation, integration, limits)
 * 4. Substitute variables and evaluate symbolic formulas
 * 5. Generate pristine KaTeX LaTeX markup for direct UI presentation
 * =====================================================================
 */

export interface SystemVariableSolution {
  variable: string;
  value: string;
  latex: string;
}

export interface AlgebraicSystemSolution {
  ok: boolean;
  equations: string[];
  variables: string[];
  solutions: SystemVariableSolution[];
  solutionLatex: string;
  systemLatex: string;
  executionTimeMs: number;
  isConsistent: boolean;
  error?: string;
}

export interface SimplificationResult {
  ok: boolean;
  original: string;
  simplified: string;
  originalLatex: string;
  simplifiedLatex: string;
  executionTimeMs: number;
  error?: string;
}

export interface SymbolicCalculationRequest {
  operation:
    | "diff"
    | "integrate"
    | "solve"
    | "simplify"
    | "expand"
    | "factor"
    | "limit"
    | "substitute"
    | "solve_system";
  expression: string;
  variable?: string;
  equations?: string[];
  substitutions?: Record<string, string | number>;
  order?: number; // for derivatives
  limitPoint?: string; // for limits
  params?: Record<string, any>;
}

export interface SymbolicCalculationResult {
  ok: boolean;
  operation: string;
  expression: string;
  result: string;
  latex: string;
  executionTimeMs: number;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Clean and format mathematical expressions into standard CAS syntax
 */
export function normalizeMathExpression(input: string): string {
  if (!input) return "";
  return input
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\^/g, "^")
    .trim();
}

/**
 * Format a set of equations into LaTeX system bracket notation: \begin{cases} ... \end{cases}
 */
export function formatSystemToLatex(equations: string[]): string {
  if (!equations || equations.length === 0) return "";
  const cleaned = equations.map((eq) =>
    eq
      .replace(/\*/g, " \\cdot ")
      .replace(/<=/g, " \\le ")
      .replace(/>=/g, " \\ge ")
      .trim()
  );
  return `\\begin{cases} ${cleaned.join(" \\\\[4pt] ")} \\end{cases}`;
}

/**
 * Omega Symbolic Service Layer
 */
export class SymbolicService {
  /**
   * Solves an algebraic system of equations (e.g. 2x2, 3x3, polynomial or non-linear)
   */
  public static async solveAlgebraicSystem(
    equations: string[],
    variables: string[] = ["x", "y"]
  ): Promise<AlgebraicSystemSolution> {
    const t0 = performance.now();
    const cleanEqs = equations
      .map((e) => normalizeMathExpression(e))
      .filter((e) => e.length > 0);

    if (cleanEqs.length === 0) {
      return {
        ok: false,
        equations: [],
        variables,
        solutions: [],
        solutionLatex: "\\text{No equations provided}",
        systemLatex: "",
        executionTimeMs: 0,
        isConsistent: false,
        error: "يرجى إدخال معادلة واحدة على الأقل.",
      };
    }

    try {
      const res = await fetch("/api/omega/symbolic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "solve_system",
          equations: cleanEqs,
          expression: cleanEqs.join(" ; "),
          params: { variables },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          const rawSolutions: [string, any][] = data.metadata?.systemSolutions || [];
          const solItems: SystemVariableSolution[] = rawSolutions.map(([v, val]) => ({
            variable: v,
            value: String(val),
            latex: `${v} = ${String(val)}`,
          }));

          const solutionLatex =
            solItems.length > 0
              ? `\\begin{cases} ${solItems.map((s) => s.latex).join(" \\\\[4pt] ")} \\end{cases}`
              : data.latex || "\\text{No solution found}";

          return {
            ok: true,
            equations: cleanEqs,
            variables,
            solutions: solItems,
            solutionLatex,
            systemLatex: formatSystemToLatex(cleanEqs),
            executionTimeMs: Math.round(performance.now() - t0),
            isConsistent: solItems.length > 0,
          };
        }
      }
    } catch (err: any) {
      console.warn("Symbolic solve_system remote call failed:", err);
    }

    // Client-side fallback or parsing
    const systemLatex = formatSystemToLatex(cleanEqs);
    return {
      ok: false,
      equations: cleanEqs,
      variables,
      solutions: [],
      solutionLatex: "\\text{Unable to solve system}",
      systemLatex,
      executionTimeMs: Math.round(performance.now() - t0),
      isConsistent: false,
      error: "تعذر حل نظام المعادلات المعطى.",
    };
  }

  /**
   * Simplifies an algebraic or trigonometric equation or expression
   */
  public static async simplifyEquation(
    expressionOrEquation: string
  ): Promise<SimplificationResult> {
    const t0 = performance.now();
    const clean = normalizeMathExpression(expressionOrEquation);

    if (!clean) {
      return {
        ok: false,
        original: "",
        simplified: "",
        originalLatex: "",
        simplifiedLatex: "",
        executionTimeMs: 0,
        error: "التعبير فارغ",
      };
    }

    try {
      const res = await fetch("/api/omega/symbolic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "simplify",
          expression: clean,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          return {
            ok: true,
            original: clean,
            simplified: data.result,
            originalLatex: clean.replace(/\*/g, " \\cdot "),
            simplifiedLatex: data.latex || data.result,
            executionTimeMs: Math.round(performance.now() - t0),
          };
        }
      }
    } catch (err: any) {
      console.warn("Symbolic simplify remote call failed:", err);
    }

    return {
      ok: false,
      original: clean,
      simplified: clean,
      originalLatex: clean,
      simplifiedLatex: clean,
      executionTimeMs: Math.round(performance.now() - t0),
      error: "تعذر تبسيط التعبير.",
    };
  }

  /**
   * Performs general symbolic calculations (diff, integrate, factor, expand, limit)
   */
  public static async calculate(
    req: SymbolicCalculationRequest
  ): Promise<SymbolicCalculationResult> {
    const t0 = performance.now();
    const cleanExpr = normalizeMathExpression(req.expression);

    try {
      const res = await fetch("/api/omega/symbolic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: req.operation,
          expression: cleanExpr,
          variable: req.variable || "x",
          equations: req.equations,
          substitutions: req.substitutions,
          order: req.order,
          limitPoint: req.limitPoint,
          params: req.params,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (err: any) {
      console.warn("Symbolic calculate call failed:", err);
    }

    return {
      ok: false,
      operation: req.operation,
      expression: cleanExpr,
      result: "",
      latex: "",
      executionTimeMs: Math.round(performance.now() - t0),
      error: "فشل تنفيذ العملية الرمزية.",
    };
  }

  /**
   * Solves a single equation (e.g. x^2 - 16 = 0 or x^3 - 6*x^2 + 11*x - 6)
   */
  public static async solveEquation(
    equation: string,
    variable = "x"
  ): Promise<SymbolicCalculationResult> {
    return this.calculate({
      operation: "solve",
      expression: equation,
      variable,
    });
  }

  /**
   * Symbolic Differentiation
   */
  public static async differentiate(
    expression: string,
    variable = "x",
    order = 1
  ): Promise<SymbolicCalculationResult> {
    return this.calculate({
      operation: "diff",
      expression,
      variable,
      order,
    });
  }

  /**
   * Symbolic Integration
   */
  public static async integrate(
    expression: string,
    variable = "x"
  ): Promise<SymbolicCalculationResult> {
    return this.calculate({
      operation: "integrate",
      expression,
      variable,
    });
  }

  /**
   * Polynomial Factorization
   */
  public static async factor(expression: string): Promise<SymbolicCalculationResult> {
    return this.calculate({
      operation: "factor",
      expression,
    });
  }

  /**
   * Algebraic Expansion
   */
  public static async expand(expression: string): Promise<SymbolicCalculationResult> {
    return this.calculate({
      operation: "expand",
      expression,
    });
  }

  /**
   * Limit Computation
   */
  public static async computeLimit(
    expression: string,
    variable = "x",
    limitPoint = "0"
  ): Promise<SymbolicCalculationResult> {
    return this.calculate({
      operation: "limit",
      expression,
      variable,
      limitPoint,
    });
  }

  /**
   * Variable Substitution
   */
  public static async substitute(
    expression: string,
    substitutions: Record<string, string | number>
  ): Promise<SymbolicCalculationResult> {
    return this.calculate({
      operation: "substitute",
      expression,
      substitutions,
    });
  }
}
