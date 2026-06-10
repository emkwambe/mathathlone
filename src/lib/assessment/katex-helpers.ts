// =============================================================================
// MathAthlone — KaTeX rendering helpers for take-home assessments
// =============================================================================
// Direct `katex` usage (NOT react-katex). Renders a mixed text+math string to
// an HTML string for injection via dangerouslySetInnerHTML.
// =============================================================================

import katex from 'katex';

// Detect if string contains LaTeX math
export function hasMath(text: string): boolean {
  return /\$|\\\(|\\\[|\\frac|\\sqrt|\\sum|\\int|\\times|\\div/.test(text);
}

// Render a mixed text+math string to HTML.
// Supports $$...$$ (display) and $...$ (inline).
export function renderMathText(text: string): string {
  if (!text) return '';

  // Replace $$...$$ with display math first (greedy delimiter must win over $...$).
  let result = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    try {
      return katex.renderToString(String(expr).trim(), {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return `<span class="text-red-500">[math error: ${expr}]</span>`;
    }
  });

  // Replace $...$ with inline math
  result = result.replace(/\$([^$]+?)\$/g, (_, expr) => {
    try {
      return katex.renderToString(String(expr).trim(), {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return `<span class="text-red-500">[math error: ${expr}]</span>`;
    }
  });

  return result;
}
