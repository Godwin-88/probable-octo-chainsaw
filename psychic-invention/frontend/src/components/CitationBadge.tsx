type Citation = {
  id?: string;
  title?: string;
  type?: string;
};

type Props = {
  sources: Citation[];
};

export function CitationBadge({ sources }: Props) {
  if (!sources.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {sources.map((s, i) => (
        <span
          key={i}
          title={s.title ?? s.id ?? ''}
          className="text-[11px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 border border-blue-800/60 cursor-default"
        >
          [{i + 1}] {(s.title ?? s.id ?? s.type ?? 'src').slice(0, 30)}
        </span>
      ))}
    </div>
  );
}
