/**
 * AssetSearchBar — shared asset selection widget used by Portfolio and Risk workspaces.
 *
 * Features:
 *   - Web3-centric asset-type filter tabs (All · Tokens · Pools · LP · Staking · …)
 *   - Blockchain selector (replaces legacy data source dropdown) — chain drives /v2/universe/snapshot and analysis
 *   - Live search with 400 ms debounce → /assets/search (and chain-scoped tokens where applicable)
 *   - Removable symbol chips showing current selection
 *   - "Load from global selection" shortcut (uses SelectedAssetsContext)
 */
import { useState, useEffect, useRef } from 'react';
import { useSelectedAssets } from '@/context/SelectedAssetsContext';
import { searchAssets } from '@/utils/api';
import { ChainSelector } from '@/components/Transact/ChainSelector';

interface AssetSearchBarProps {
  /** Currently selected symbols */
  chips: string[];
  /** Called when user picks a result from the dropdown */
  onAdd: (symbol: string, name: string) => void;
  /** Called when user removes a chip */
  onRemove: (symbol: string) => void;
  /** Maximum number of symbols allowed */
  maxChips?: number;
  /** Show data source toggle (yfinance / openbb / nautilus) top-right */
  showDataProviderToggle?: boolean;
  /** Accent colour class for chip + active type tab */
  accentBg?: string;
  /** Chip border colour */
  accentBorder?: string;
  /** Chip text colour */
  accentText?: string;
}

export function AssetSearchBar({
  chips,
  onAdd,
  onRemove,
  maxChips = 20,
  showDataProviderToggle = true,
  accentBg     = 'bg-rose-900/40',
  accentBorder = 'border-rose-700/50',
  accentText   = 'text-rose-200',
}: AssetSearchBarProps) {
  const { assetTypes, selectedAssets } = useSelectedAssets();

  const [activeType, setActiveType] = useState('all');
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<{ symbol: string; name: string; type: string }[]>([]);
  const [searching, setSearching]   = useState(false);
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef                    = useRef<HTMLInputElement>(null);

  // Map Web3-centric types to backend search type (assets API may not have tokens/pools etc.)
  const searchType =
    activeType === 'tokens' || activeType === 'pools' || activeType === 'lp' || activeType === 'staking' || activeType === 'lending' || activeType === 'vaults'
      ? 'cryptocurrency'
      : activeType;

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) { setResults([]); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchAssets(query.trim(), searchType, 12);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchType]);

  const handleAdd = (symbol: string, name: string) => {
    if (chips.includes(symbol) || chips.length >= maxChips) return;
    onAdd(symbol, name);
    setQuery('');
    setResults([]);
  };

  const loadFromSelection = () => {
    selectedAssets.forEach(a => {
      if (!chips.includes(a.symbol) && chips.length < maxChips) {
        onAdd(a.symbol, a.name ?? a.symbol);
      }
    });
  };

  // Asset type labels (Web3-centric + legacy)
  const typeLabels: Record<string, string> = {
    all: 'All',
    tokens: 'Tokens',
    cryptocurrency: 'Crypto',
    pools: 'Pools',
    lp: 'LP',
    staking: 'Staking',
    lending: 'Lending',
    vaults: 'Vaults',
    equity: 'Equity',
    etf: 'ETF',
    index: 'Index',
    currency: 'Forex',
    future: 'Commodity',
    mutualfund: 'Mutual Fund',
  };

  return (
    <div className="space-y-3">
      {/* ── Asset type filter + Data source toggle (top right) ─────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {assetTypes.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveType(t.id); setResults([]); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
              activeType === t.id
                ? `${accentBg} ${accentBorder} ${accentText}`
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {typeLabels[t.id] ?? t.label}
          </button>
        ))}
        </div>
        {showDataProviderToggle && (
          <div className="shrink-0 min-w-0">
            <ChainSelector className="justify-end" />
          </div>
        )}
      </div>

      {/* ── Search input + dropdown ───────────────────────────────────── */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Search ${typeLabels[activeType] ?? activeType} symbols or names…`}
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
        />
        {(results.length > 0 || searching) && (
          <div className="absolute z-30 left-0 right-0 mt-1 rounded-lg border border-slate-700 bg-slate-800 shadow-2xl overflow-hidden">
            {searching && (
              <div className="px-3 py-2 text-slate-400 text-xs flex items-center gap-2">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Searching {typeLabels[activeType]}…
              </div>
            )}
            {results.map(r => {
              const alreadyAdded = chips.includes(r.symbol);
              return (
                <button
                  key={r.symbol}
                  onClick={() => handleAdd(r.symbol, r.name)}
                  disabled={alreadyAdded || chips.length >= maxChips}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-700 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white text-sm font-mono font-semibold shrink-0">{r.symbol}</span>
                    <span className="text-slate-400 text-xs truncate">{r.name}</span>
                    {alreadyAdded && <span className="text-emerald-400 text-xs shrink-0">✓ added</span>}
                  </div>
                  <span className="text-slate-500 text-xs uppercase ml-2 shrink-0">{r.type}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Selected chips ────────────────────────────────────────────── */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map(sym => (
            <span
              key={sym}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${accentBg} border ${accentBorder} ${accentText} text-xs font-mono`}
            >
              {sym}
              <button
                onClick={() => onRemove(sym)}
                className="opacity-60 hover:opacity-100 leading-none"
                aria-label={`Remove ${sym}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── Load from header selection ───────────────────────────────── */}
      {selectedAssets.length > 0 && (
        <button
          onClick={loadFromSelection}
          className="text-xs text-slate-400 hover:text-white underline underline-offset-2 transition"
        >
          Load from global selection ({selectedAssets.map(a => a.symbol).join(', ')})
        </button>
      )}

      {chips.length === 0 && (
        <p className="text-[11px] text-slate-600">
          Select an asset type, then search by ticker or name. Minimum 2 assets required to fetch data.
        </p>
      )}
    </div>
  );
}
