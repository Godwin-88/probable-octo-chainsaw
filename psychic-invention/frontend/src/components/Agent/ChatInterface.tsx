/**
 * ChatInterface — message list + input + per-message RLHF feedback controls.
 * Agent replies are rendered with Markdown + KaTeX LaTeX support.
 * Delimiters supported:
 *   \[...\]  $$...$$   → display (block) math
 *   \(...\)             → inline math
 *   **...**             → bold
 *   - / * line prefix  → unordered list
 *   ## / ###           → heading
 */
import { useRef, useEffect, useMemo } from 'react';
import katex from 'katex';
import type { Message } from '@/context/AgentContext';
import { CitationBadge } from '@/components/CitationBadge';

export type { Message };

interface ChatInterfaceProps {
  messages: Message[];
  loading: boolean;
  onSend: (message: string) => void;
  disabled?: boolean;
  streamingText?: string;
  feedbackSent?: Record<number, 'up' | 'down'>;
  onFeedback?: (msgIndex: number, direction: 'up' | 'down') => void;
  correcting?: number | null;
  correctionText?: string;
  onCorrectionChange?: (text: string) => void;
  onSubmitCorrection?: (msgIndex: number) => void;
  onCancelCorrection?: () => void;
}

// ── LaTeX / Markdown renderer ─────────────────────────────────────────────────

type Seg =
  | { t: 'text'; s: string }
  | { t: 'display'; latex: string }
  | { t: 'inline'; latex: string };

/** Split message text into text / display-math / inline-math segments. */
function parseSegments(text: string): Seg[] {
  const segs: Seg[] = [];
  // Group 1: \[...\]  (display)
  // Group 2: $$...$$ (display)
  // Group 3: \(...\)  (inline)
  // Group 4: $...$   (inline — must come last to avoid matching $$)
  const RE = /\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)|\$([^$\n]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(text)) !== null) {
    if (m.index > last) segs.push({ t: 'text', s: text.slice(last, m.index) });
    if (m[1] !== undefined)      segs.push({ t: 'display', latex: m[1].trim() });
    else if (m[2] !== undefined) segs.push({ t: 'display', latex: m[2].trim() });
    else if (m[3] !== undefined) segs.push({ t: 'inline', latex: m[3].trim() });
    else                         segs.push({ t: 'inline', latex: m[4].trim() });
    last = RE.lastIndex;
  }
  if (last < text.length) segs.push({ t: 'text', s: text.slice(last) });
  return segs;
}

function renderLatex(latex: string, display: boolean): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: display,
      output: 'html',
      errorColor: '#f87171',
      strict: 'ignore',
      trust: false,
    });
  } catch {
    return `<span style="color:#f87171">${latex}</span>`;
  }
}

/** Render a plain-text segment with basic Markdown (bold, lists, headings). */
function TextSegment({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length) {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc list-inside space-y-0.5 my-1 pl-1">
          {listItems.map((li, j) => (
            <li key={j} className="text-slate-200" dangerouslySetInnerHTML={{ __html: inlineBold(li) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const key = String(i);
    // h2
    if (/^###\s/.test(line)) {
      flushList(key);
      elements.push(<h4 key={key} className="text-sm font-bold text-white mt-3 mb-1">{line.replace(/^###\s/, '')}</h4>);
    } else if (/^##\s/.test(line)) {
      flushList(key);
      elements.push(<h3 key={key} className="text-sm font-semibold text-white mt-3 mb-1 border-b border-slate-700 pb-0.5">{line.replace(/^##\s/, '')}</h3>);
    } else if (/^[*\-]\s/.test(line)) {
      listItems.push(line.replace(/^[*\-]\s/, ''));
    } else if (/^\d+\.\s/.test(line)) {
      flushList(key);
      // numbered items — collect similar to bullet
      listItems.push(line.replace(/^\d+\.\s/, ''));
    } else if (line.trim() === '') {
      flushList(key);
      if (elements.length > 0) elements.push(<div key={key} className="h-1" />);
    } else {
      flushList(key);
      elements.push(
        <p key={key} className="text-slate-200 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: inlineBold(line) }} />
      );
    }
  });
  flushList('end');
  return <>{elements}</>;
}

function inlineBold(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
}

/** Render a full assistant message with LaTeX + Markdown. */
function MarkdownMessage({ content }: { content: string }) {
  const segs = useMemo(() => parseSegments(content), [content]);
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {segs.map((seg, i) => {
        if (seg.t === 'display') {
          return (
            <div
              key={i}
              className="overflow-x-auto my-2 px-2 py-1 rounded bg-slate-900/60 border border-slate-700/40"
              dangerouslySetInnerHTML={{ __html: renderLatex(seg.latex, true) }}
            />
          );
        }
        if (seg.t === 'inline') {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: renderLatex(seg.latex, false) }}
            />
          );
        }
        return <TextSegment key={i} text={seg.s} />;
      })}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatInterface({
  messages,
  loading,
  onSend,
  disabled,
  streamingText,
  feedbackSent = {},
  onFeedback,
  correcting = null,
  correctionText = '',
  onCorrectionChange,
  onSubmitCorrection,
  onCancelCorrection,
}: ChatInterfaceProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, correcting, streamingText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value?.trim();
    if (!value || disabled || loading) return;
    onSend(value);
    inputRef.current!.value = '';
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Message list ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm text-center pt-6">
            Use the suggested questions below, click "Analyse my data", or type your own question.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[95%] rounded-xl px-4 py-2.5 ${
                m.role === 'user'
                  ? 'bg-blue-600/80 text-white text-sm'
                  : 'bg-slate-800 text-slate-200 border border-slate-700/60'
              }`}
            >
              {m.role === 'assistant' ? (
                <MarkdownMessage content={m.content} />
              ) : (
                <div className="whitespace-pre-wrap break-words text-sm">{m.content}</div>
              )}
            </div>

            {/* Citation badges for assistant messages with sources */}
            {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
              <div className="max-w-[95%]">
                <CitationBadge sources={m.sources} />
              </div>
            )}

            {/* RLHF thumbs for assistant messages */}
            {m.role === 'assistant' && onFeedback && (
              <div className="flex items-center gap-1.5 pl-1">
                {feedbackSent[i] ? (
                  <span className="text-[10px] text-slate-500">
                    {feedbackSent[i] === 'up' ? '✓ Helpful' : '✓ Feedback sent'}
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => onFeedback(i, 'up')}
                      title="This was helpful"
                      className="p-1 rounded text-slate-600 hover:text-emerald-400 hover:bg-slate-800 transition-colors text-xs"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => onFeedback(i, 'down')}
                      title="This was unhelpful — add a correction"
                      className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-slate-800 transition-colors text-xs"
                    >
                      👎
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Correction input (appears after thumbs-down) */}
            {correcting === i && (
              <div className="w-full max-w-[95%] mt-1 space-y-1.5">
                <p className="text-[10px] text-slate-500 pl-1">
                  What would be a better answer? (helps improve the knowledge graph)
                </p>
                <textarea
                  value={correctionText}
                  onChange={(e) => onCorrectionChange?.(e.target.value)}
                  placeholder="Type the correct answer…"
                  rows={3}
                  className="w-full rounded-lg bg-slate-800 border border-red-800/60 text-white placeholder-slate-600 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onSubmitCorrection?.(i)}
                    disabled={!correctionText.trim()}
                    className="px-3 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-medium disabled:opacity-40 transition-colors"
                  >
                    Submit correction
                  </button>
                  <button
                    onClick={onCancelCorrection}
                    className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[95%] bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 text-sm opacity-90">
              <MarkdownMessage content={streamingText} />
              <span className="inline-block w-1 h-3.5 bg-blue-400 ml-0.5 animate-pulse align-middle" />
            </div>
          </div>
        )}

        {loading && !streamingText && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-400 text-sm flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-1">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input form ── */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800/60 shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            placeholder="Ask a financial question…"
            className="flex-1 min-h-[44px] max-h-32 resize-y rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            disabled={disabled || loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={disabled || loading}
            className="shrink-0 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-1.5 text-right">
          Shift+Enter for newline · 👍/👎 to give feedback
        </p>
      </form>
    </div>
  );
}
