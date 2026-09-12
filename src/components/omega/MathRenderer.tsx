import React, { useState } from "react";
import katex from "katex";
import { Copy, Check } from "lucide-react";

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * MathRenderer parses and renders mathematical and physics formulas written in LaTeX.
 * Supports:
 * - Display equations: $$ ... $$ and \[ ... \]
 * - Inline equations: $ ... $ and \( ... \)
 * - Code blocks: ``` ... ``` and inline code ` ... `
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = "",
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!content) return null;

  const handleCopyCode = async (codeText: string, index: number) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(codeText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = codeText;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex((prev) => (prev === index ? null : prev));
      }, 2000);
    } catch (e) {
      console.error("Failed to copy code snippet:", e);
    }
  };

  // Function to render math string via KaTeX safely
  const renderKatex = (math: string, displayMode: boolean): string => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: true,
      });
    } catch {
      return `<code class="font-mono text-purple-300">${math}</code>`;
    }
  };

  // Parse text segments: code blocks first, then math blocks, then inline math
  const parseContent = (text: string): React.ReactNode[] => {
    // 1. Split code blocks ```...```
    const codeBlockRegex = /(```[\s\S]*?```)/g;
    const parts = text.split(codeBlockRegex);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        const lang = lines[0]?.trim() || "";
        const code = (lang ? lines.slice(1) : lines).join("\n");
        return (
          <div
            key={`code-${index}`}
            className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs"
            dir="ltr"
          >
            <div className="bg-slate-900/90 px-3 py-1.5 text-[11px] text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
              <span className="font-semibold text-slate-300">{lang || "code"}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(code, index)}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-sans font-medium text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
                title="نسخ الكود"
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الكود</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-slate-200 leading-relaxed font-mono">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // 2. Split Display Math ($$...$$ or \[...\])
      const displayMathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g;
      const subParts = part.split(displayMathRegex);

      return (
        <span key={`text-${index}`}>
          {subParts.map((subPart, subIdx) => {
            if (
              (subPart.startsWith("$$") && subPart.endsWith("$$")) ||
              (subPart.startsWith("\\[") && subPart.endsWith("\\]"))
            ) {
              const formula = subPart.startsWith("$$")
                ? subPart.slice(2, -2)
                : subPart.slice(2, -2);
              const html = renderKatex(formula, true);
              return (
                <div
                  key={`display-math-${subIdx}`}
                  className="my-2.5 overflow-x-auto py-1 text-center"
                  dir="ltr"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            }

            // 3. Split Inline Math ($...$ or \(...\))
            // Match single dollar $ not followed/preceded by digit or dollar (avoid currency like $50)
            const inlineMathRegex = /(\$(?!\s)[\s\S]*?(?<!\s)\$|\\\([\s\S]*?\\\))/g;
            const inlineParts = subPart.split(inlineMathRegex);

            return (
              <span key={`inline-sub-${subIdx}`}>
                {inlineParts.map((item, inlineIdx) => {
                  if (
                    item.startsWith("$") &&
                    item.endsWith("$") &&
                    item.length > 2 &&
                    !/^\$\d+([,.]\d+)?\$$/.test(item)
                  ) {
                    const formula = item.slice(1, -1);
                    const html = renderKatex(formula, false);
                    return (
                      <span
                        key={`inline-math-${inlineIdx}`}
                        className="inline-block px-1 mx-0.5 align-middle"
                        dir="ltr"
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    );
                  }

                  if (item.startsWith("\\(") && item.endsWith("\\)")) {
                    const formula = item.slice(2, -2);
                    const html = renderKatex(formula, false);
                    return (
                      <span
                        key={`inline-math-paren-${inlineIdx}`}
                        className="inline-block px-1 mx-0.5 align-middle"
                        dir="ltr"
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    );
                  }

                  // Standard text: preserve bold, italic, and newlines
                  return <span key={`plain-${inlineIdx}`}>{item}</span>;
                })}
              </span>
            );
          })}
        </span>
      );
    });
  };

  return <div className={`math-content ${className}`}>{parseContent(content)}</div>;
};
