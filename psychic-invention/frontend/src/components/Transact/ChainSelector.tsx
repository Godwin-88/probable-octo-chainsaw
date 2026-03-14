/**
 * ChainSelector — horizontal scrollable blockchain selector (replaces traditional finance "Source" dropdown).
 * Used in Asset Universe and Transact context bar so user or autonomous agent can pick chain for on-chain data and analysis.
 */
import { useRef } from 'react';
import { useChain } from '@/context/ChainContext';

const SHORT_LABELS: Record<string, string> = {
  ethereum: 'ETH',
  sepolia: 'SEP',
  polygon: 'POL',
  arbitrum: 'ARB',
  base: 'BASE',
  solana: 'SOL',
  ton: 'TON',
  tron: 'TRON',
};

export function ChainSelector({ className = '' }: { className?: string }) {
  const { chain, setChain, chains, chainLabels } = useChain();
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayChains = chains.length > 0 ? chains : [
    { id: 'ethereum', name: 'Ethereum', configured: true },
    { id: 'sepolia', name: 'Sepolia', configured: true },
    { id: 'polygon', name: 'Polygon', configured: true },
    { id: 'arbitrum', name: 'Arbitrum', configured: true },
    { id: 'base', name: 'Base', configured: true },
    { id: 'solana', name: 'Solana', configured: true },
    { id: 'ton', name: 'TON', configured: true },
    { id: 'tron', name: 'TRON', configured: true },
  ];

  const label = (id: string) => SHORT_LABELS[id] ?? chainLabels[id] ?? id.slice(0, 3).toUpperCase();

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="text-[11px] text-slate-500 uppercase tracking-wider shrink-0">Chain</span>
      <div
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5"
        style={{ scrollBehavior: 'smooth' }}
      >
        {displayChains.map((c) => {
          const isActive = chain === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setChain(c.id)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                isActive
                  ? 'bg-blue-600/90 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
              title={chainLabels[c.id] ?? c.name ?? c.id}
            >
              {label(c.id)}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => scrollRef.current?.scrollBy({ left: 80, behavior: 'smooth' })}
        className="shrink-0 w-6 h-6 rounded-full border border-slate-600 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center text-xs"
        aria-label="Scroll right"
      >
        ›
      </button>
    </div>
  );
}
