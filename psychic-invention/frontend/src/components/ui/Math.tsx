/**
 * Math — KaTeX-based formula renderer
 *
 * Usage:
 *   <Math latex="C = SN(d_1) - Ke^{-r\tau}N(d_2)" />          // inline
 *   <Math latex="\sigma^2_p = \mathbf{w}^\top\Sigma\mathbf{w}" display />  // block
 *   <MathBlock latex="..." />  // shorthand for display mode
 *   <MathInline latex="..." /> // shorthand for inline mode
 */
import { useMemo } from 'react';
import katex from 'katex';

interface MathProps {
  latex: string;
  display?: boolean;
  className?: string;
  errorColor?: string;
}

export const Math = ({ latex, display = false, className = '', errorColor = '#f87171' }: MathProps) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: display,
        output: 'html',
        errorColor,
        trust: false,
        strict: 'ignore',
      });
    } catch {
      return `<span style="color:${errorColor}">${latex}</span>`;
    }
  }, [latex, display, errorColor]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/** Block-level (display mode) formula — centred, larger */
export const MathBlock = ({ latex, className = '' }: { latex: string; className?: string }) => (
  <Math latex={latex} display className={`block text-center py-1 ${className}`} />
);

/** Inline formula — flows with surrounding text */
export const MathInline = ({ latex, className = '' }: { latex: string; className?: string }) => (
  <Math latex={latex} display={false} className={className} />
);

/**
 * MathText — renders a mixed string containing plain text and $...$ inline math.
 * Use this for workspace description strings like:
 *   "Portfolio return $R_p = \mathbf{w}^\top \mathbf{r}$ and variance $\sigma^2_p$"
 *
 * Supported delimiters:
 *   $...$   → inline KaTeX
 *   $$...$$ → display KaTeX (block)
 */
export function MathText({ text, className = '' }: { text: string; className?: string }) {
  const parts = useMemo(() => {
    const segments: Array<{ t: 'text' | 'inline' | 'display'; s: string }> = [];
    // Match $$...$$ first (display), then $...$ (inline)
    const RE = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = RE.exec(text)) !== null) {
      if (m.index > last) segments.push({ t: 'text', s: text.slice(last, m.index) });
      if (m[1] !== undefined) segments.push({ t: 'display', s: m[1].trim() });
      else segments.push({ t: 'inline', s: m[2].trim() });
      last = RE.lastIndex;
    }
    if (last < text.length) segments.push({ t: 'text', s: text.slice(last) });
    return segments;
  }, [text]);

  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.t === 'text') return <span key={i}>{p.s}</span>;
        return <Math key={i} latex={p.s} display={p.t === 'display'} />;
      })}
    </span>
  );
}
