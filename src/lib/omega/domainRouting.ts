/**
 * src/lib/omega/domainRouting.ts
 * Domain-aware model selection for Omega V2:
 * Intelligently routes questions to specialized candidate ensembles.
 */

import type { ModelId } from "./models";

export type Domain =
  | "code"
  | "math_logic"
  | "science_factual"
  | "creative_writing"
  | "general";

export interface DomainRouteResult {
  domain: Domain;
  models: ModelId[];
  confidence: number;
  matchedKeywords: string[];
}

const DOMAIN_KEYWORDS: Record<Domain, string[]> = {
  code: [
    "code", "function", "javascript", "typescript", "python", "react", "html", "css",
    "algorithm", "bug", "debug", "sql", "api", "backend", "frontend", "class",
    "برمجة", "كود", "دالة", "خوارزمية", "خطأ", "بايثون", "جافاسكريبت", "قاعدة بيانات", "تطوير"
  ],
  math_logic: [
    "calculate", "solve", "equation", "proof", "matrix", "integral", "derivative",
    "probability", "logic", "deduce", "theorem", "lemma", "arithmetic", "why",
    "احسب", "معادلة", "برهان", "مصفوفة", "احتمال", "منطق", "تفاضل", "تكامل", "نظرية", "استنتاج"
  ],
  science_factual: [
    "quantum", "physics", "biology", "chemistry", "universe", "planet", "history",
    "evidence", "experiment", "molecule", "genome", "cellular", "gravity", "energy",
    "فيزياء", "كيمياء", "أحياء", "كون", "كوكب", "تاريخ", "تجربة", "ذرة", "طاقة", "جاذبية", "خلية"
  ],
  creative_writing: [
    "story", "poem", "essay", "metaphor", "character", "creative", "fiction",
    "rhyme", "dialogue", "novel", "narrative", "lyric",
    "قصة", "شعر", "رواية", "مقال", "استعارة", "شخصية", "إبداعي", "حوار", "قافية", "خيال"
  ],
  general: [
    "who", "what", "where", "when", "how", "hello", "help", "summary", "explain",
    "من", "ماذا", "أين", "متى", "كيف", "مرحبا", "اشرح", "لخص", "مساعدة"
  ],
};

const DOMAIN_MODEL_PRIORITY: Record<Domain, ModelId[]> = {
  code: [
    "qwen-2-5-compat",
    "gemini-3.8-flash",
    "deepseek-r1-compat",
    "gemini-3.1-pro-preview",
  ],
  math_logic: [
    "qwen-2-5-compat",
    "deepseek-r1-compat",
    "gemini-3.8-flash",
    "omega-kernel-c1",
  ],
  science_factual: [
    "gemini-3.8-flash",
    "qwen-2-5-compat",
    "gpt-4o-compat",
    "omega-kernel-c2",
  ],
  creative_writing: [
    "llama-3-3-compat",
    "claude-3-5-sonnet-compat",
    "gemini-3.8-flash",
    "gpt-4o-compat",
  ],
  general: [
    "qwen-2-5-compat",
    "llama-3-3-compat",
    "gemini-3.8-flash",
    "claude-3-5-sonnet-compat",
    "deepseek-r1-compat",
  ],
};

export function detectDomain(question: string): { domain: Domain; confidence: number; matched: string[] } {
  const qLower = question.toLowerCase();
  const scores: Record<Domain, number> = {
    code: 0,
    math_logic: 0,
    science_factual: 0,
    creative_writing: 0,
    general: 0,
  };
  const matchedWords: Record<Domain, string[]> = {
    code: [],
    math_logic: [],
    science_factual: [],
    creative_writing: [],
    general: [],
  };

  (Object.keys(DOMAIN_KEYWORDS) as Domain[]).forEach((d) => {
    DOMAIN_KEYWORDS[d].forEach((kw) => {
      if (qLower.includes(kw)) {
        scores[d] += 1;
        matchedWords[d].push(kw);
      }
    });
  });

  // Code syntax heuristics
  if (/[{}();=><\[\]_]/.test(question) && (question.includes("const ") || question.includes("def ") || question.includes("function") || question.includes("import "))) {
    scores.code += 4;
    matchedWords.code.push("syntax_tokens");
  }

  // Math equation heuristics
  if (/[0-9]+\s*[\+\-\*\/\^=]\s*[0-9]+/.test(question) || /\\frac|\\int|\\sqrt/.test(question)) {
    scores.math_logic += 3;
    matchedWords.math_logic.push("equation_pattern");
  }

  let bestDomain: Domain = "general";
  let maxScore = scores.general;

  (Object.keys(scores) as Domain[]).forEach((d) => {
    if (scores[d] > maxScore) {
      maxScore = scores[d];
      bestDomain = d;
    }
  });

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore === 0 ? 0.6 : Math.min(0.98, 0.5 + (maxScore / Math.max(1, totalScore)) * 0.45);

  return {
    domain: bestDomain,
    confidence: Number(confidence.toFixed(2)),
    matched: matchedWords[bestDomain],
  };
}

export function modelsForQuestion(
  question: string,
  maxModelsPerDomain = 3
): DomainRouteResult {
  const { domain, confidence, matched } = detectDomain(question);
  const candidatePool = DOMAIN_MODEL_PRIORITY[domain] || DOMAIN_MODEL_PRIORITY.general;
  const selectedModels = candidatePool.slice(0, Math.max(2, maxModelsPerDomain));

  return {
    domain,
    models: selectedModels,
    confidence,
    matchedKeywords: matched,
  };
}
