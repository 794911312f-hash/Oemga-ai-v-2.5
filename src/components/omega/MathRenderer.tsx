import React, { useState } from "react";
import katex from "katex";
import { Copy, Check, Download, ExternalLink } from "lucide-react";
import { OmegaChart, type OmegaChartConfig } from "./OmegaChart";

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

        // Check if this is a chart specification
        const isChartBlock =
          lang.toLowerCase().includes("chart") ||
          (lang.toLowerCase() === "json" && code.includes('"data"') && (code.includes('"series"') || code.includes('"type"')));

        if (isChartBlock) {
          try {
            const parsedConfig = JSON.parse(code) as OmegaChartConfig;
            if (parsedConfig && Array.isArray(parsedConfig.data) && parsedConfig.data.length > 0) {
              return <OmegaChart key={`chart-${index}`} config={parsedConfig} />;
            }
          } catch {
            // If JSON fails, render standard code block below
          }
        }

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

                  // Standard text: check for markdown images ![alt](url)
                  const imageRegex = /(!\[[^\]]*\]\([^\)]+\))/g;
                  if (imageRegex.test(item)) {
                    const imgParts = item.split(imageRegex);
                    return (
                      <span key={`img-group-${inlineIdx}`}>
                        {imgParts.map((sub, sIdx) => {
                          const match = sub.match(/^!\[(.*?)\]\((.*?)\)$/);
                          if (match) {
                            const altText = match[1] || "صورة مولدة بواسطة أوميغا";
                            const imgUrl = match[2];
                            return (
                              <div
                                key={`img-${inlineIdx}-${sIdx}`}
                                className="my-3 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/90 p-2 shadow-2xl max-w-2xl"
                              >
                                <div className="relative group rounded-xl overflow-hidden bg-black/50">
                                  <img
                                    src={imgUrl}
                                    alt={altText}
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    className="w-full max-h-[480px] object-contain rounded-xl mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                                    <span className="text-xs text-slate-200 line-clamp-1 font-medium">{altText}</span>
                                    <a
                                      href={imgUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download="omega_visual_ai.jpg"
                                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shrink-0 flex items-center gap-1 shadow cursor-pointer"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>تحميل</span>
                                    </a>
                                  </div>
                                </div>
                                <div className="mt-2 px-1 text-[11px] text-slate-400 flex items-center justify-between">
                                  <span className="line-clamp-1">{altText}</span>
                                  <span className="text-[10px] text-purple-400 font-mono shrink-0">Omega Visual Synthesis</span>
                                </div>
                              </div>
                            );
                          }
                          return <span key={`sub-plain-${sIdx}`}>{sub}</span>;
                        })}
                      </span>
                    );
                  }

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
