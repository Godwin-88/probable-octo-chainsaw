import { useMemo, useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useChain } from '@/context/ChainContext';
import { getV2UniverseSnapshot, type V2UniverseSnapshot } from '@/api/gatewayV2';
import { downloadFile, exportToJSON, generateFilename } from '@/utils/export';

const tabIds = ['Chains', 'Tokens', 'Prices', 'Positions'] as const;
type TabId = (typeof tabIds)[number];

export function DataUniverseExplorer() {
  const { address } = useWallet();
  const { chain, chains } = useChain();

  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [assets, setAssets] = useState<string>('ETH,BTC,USDC,USDT');
  const [includeTokens, setIncludeTokens] = useState(true);
  const [includePrices, setIncludePrices] = useState(true);
  const [includePositions, setIncludePositions] = useState(false);
  const [quote, setQuote] = useState('USDT');
  const [tab, setTab] = useState<TabId>('Prices');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<V2UniverseSnapshot | null>(null);

  const chainOptions = useMemo(() => (chains.length ? chains : [{ id: chain, name: chain }]), [chains, chain]);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const include: string[] = [];
      if (includeTokens) include.push('tokens');
      if (includePrices) include.push('prices');
      if (includePositions) include.push('positions');

      const resolvedChains = selectedChains.length ? selectedChains : chainOptions.map((c) => c.id);
      const resolvedAssets = assets
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const r = await getV2UniverseSnapshot({
        chains: resolvedChains,
        assets: resolvedAssets,
        quote,
        include,
        wallet: includePositions ? address ?? undefined : undefined,
      });
      setSnapshot(r);
    } catch (e) {
      setSnapshot(null);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function exportSnapshot() {
    if (!snapshot) return;
    const json = exportToJSON(snapshot as unknown as any);
    downloadFile(json, generateFilename('data_universe_snapshot', 'json'), 'application/json');
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Data Universe</p>
        <h1 className="text-3xl font-black text-white">Data Universe Explorer</h1>
        <p className="text-slate-400 text-sm max-w-3xl">
          Build a dynamic multi-chain universe (chains → tokens → prices → positions) using the same ingestion layer the agent uses.
        </p>
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-12 gap-3 p-5 rounded-2xl backdrop-blur-md bg-slate-900/70 border border-slate-700/50">
        <div className="md:col-span-5">
          <label className="text-[11px] text-slate-500 uppercase tracking-wider">Chains</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {chainOptions.map((c) => {
              const active = selectedChains.length ? selectedChains.includes(c.id) : true;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedChains((prev) => {
                      const set = new Set(prev);
                      if (set.has(c.id)) set.delete(c.id);
                      else set.add(c.id);
                      return Array.from(set);
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    active
                      ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan'
                      : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={c.name ?? c.id}
                >
                  {c.id}
                </button>
              );
            })}
            <button
              onClick={() => setSelectedChains([])}
              className="px-3 py-1.5 rounded-lg text-xs border border-slate-700 bg-slate-800/40 text-slate-400 hover:text-white"
              title="Reset (use all)"
            >
              All
            </button>
          </div>
        </div>

        <div className="md:col-span-5">
          <label className="text-[11px] text-slate-500 uppercase tracking-wider">Assets (comma-separated)</label>
          <input
            value={assets}
            onChange={(e) => setAssets(e.target.value)}
            className="mt-2 w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-cyan/40"
            placeholder="ETH,BTC,USDC,USDT"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[11px] text-slate-500 uppercase tracking-wider">Quote</label>
          <input
            value={quote}
            onChange={(e) => setQuote(e.target.value.toUpperCase())}
            className="mt-2 w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-cyan/40"
            placeholder="USDT"
          />
        </div>

        <div className="md:col-span-10 flex flex-wrap gap-3 items-center pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={includeTokens} onChange={(e) => setIncludeTokens(e.target.checked)} />
            Tokens
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={includePrices} onChange={(e) => setIncludePrices(e.target.checked)} />
            Prices
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={includePositions} onChange={(e) => setIncludePositions(e.target.checked)} />
            Positions (needs wallet connected)
          </label>
        </div>

        <div className="md:col-span-2 flex gap-2 items-end justify-end">
          <button
            onClick={run}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 text-sm font-semibold hover:bg-neon-cyan/30 transition-colors disabled:opacity-50"
          >
            {loading ? 'Running…' : 'Run'}
          </button>
          <button
            onClick={exportSnapshot}
            disabled={!snapshot}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-700/40 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {tabIds.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
              tab === t ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan' : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="rounded-2xl backdrop-blur-md bg-slate-900/70 border border-slate-700/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            {snapshot ? `Snapshot @ ${snapshot.timestamp}` : 'No snapshot yet'}
          </p>
          <p className="text-xs text-slate-500">{includePositions ? `Wallet: ${address ?? 'not connected'}` : 'Wallet: —'}</p>
        </div>

        <div className="p-5">
          {!snapshot && !loading && (
            <div className="text-slate-500 text-sm">Run a snapshot to populate the universe.</div>
          )}

          {snapshot && tab === 'Chains' && (
            <pre className="text-xs text-slate-200 overflow-auto">{JSON.stringify(snapshot.chains, null, 2)}</pre>
          )}
          {snapshot && tab === 'Tokens' && (
            <pre className="text-xs text-slate-200 overflow-auto">{JSON.stringify(snapshot.tokens, null, 2)}</pre>
          )}
          {snapshot && tab === 'Prices' && (
            <pre className="text-xs text-slate-200 overflow-auto">{JSON.stringify(snapshot.prices, null, 2)}</pre>
          )}
          {snapshot && tab === 'Positions' && (
            <pre className="text-xs text-slate-200 overflow-auto">{JSON.stringify(snapshot.positions, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

