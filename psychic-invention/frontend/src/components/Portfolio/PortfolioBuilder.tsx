/**
 * Asset Universe & Weight Builder — Menu 2.1 (TRANSACT_APP_SPEC §3.2.1)
 * Central hub: define assets, set weights, fetch real market data, compute analytics.
 */
import { useState, useCallback, useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { useSelectedAssets } from '@/context/SelectedAssetsContext';
import { AssetSearchBar } from '@/components/AssetSearchBar';

const PERIOD_OPTIONS = [
  { value: '1mo', label: '1 Month' },
  { value: '3mo', label: '3 Months' },
  { value: '6mo', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: '2y', label: '2 Years' },
];

const BENCHMARK_OPTIONS = [
  { value: 'SPY', label: 'S&P 500 (SPY)' },
  { value: 'QQQ', label: 'NASDAQ-100 (QQQ)' },
  { value: 'IWM', label: 'Russell 2000 (IWM)' },
  { value: 'EFA', label: 'MSCI EAFE (EFA)' },
  { value: 'AGG', label: 'US Bond Agg (AGG)' },
];

const RF_RATE_OPTIONS = [
  { value: 0.0, label: '0.00% (zero)' },
  { value: 0.02, label: '2.00%' },
  { value: 0.04, label: '4.00%' },
  { value: 0.045, label: '4.50% (~Fed Funds)' },
  { value: 0.05, label: '5.00%' },
];

// ── Status bar ────────────────────────────────────────────────────────────

function StatusBar({ status, error }: { status: string; error: string | null }) {
  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-red-800/60 bg-red-900/20 px-4 py-3 text-red-300 text-sm">
        <span className="shrink-0 mt-0.5">⚠</span>
        <span>{error}</span>
      </div>
    );
  }
  if (status === 'fetching') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-blue-800/60 bg-blue-900/20 px-4 py-3 text-blue-300 text-sm">
        <span className="animate-spin">⟳</span>
        <span>Fetching historical returns from yfinance…</span>
      </div>
    );
  }
  if (status === 'computing') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-indigo-800/60 bg-indigo-900/20 px-4 py-3 text-indigo-300 text-sm">
        <span className="animate-spin">⟳</span>
        <span>Computing moments and performance metrics…</span>
      </div>
    );
  }
  if (status === 'ready') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-800/60 bg-emerald-900/20 px-4 py-3 text-emerald-300 text-sm">
        <span>✓</span>
        <span>Analytics ready — navigate sub-panels to explore results in detail.</span>
      </div>
    );
  }
  return null;
}

// ── Weight bar visualizer ─────────────────────────────────────────────────

function WeightBar({ weight, max }: { weight: number; max: number }) {
  const pct = max > 0 ? (weight / max) * 100 : 0;
  return (
    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
        style={{ width: `${Math.max(0, pct)}%` }}
      />
    </div>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────

function SummaryCard({
  label, value, sub, color = 'default',
}: {
  label: string; value: string; sub?: string; color?: 'default' | 'green' | 'red' | 'amber';
}) {
  const valueColor = { default: 'text-white', green: 'text-emerald-400', red: 'text-red-400', amber: 'text-amber-400' }[color];
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
      <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-mono font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export const PortfolioBuilder = () => {
  const {
    assets, setAssets, updateWeight, normalizeWeights,
    period, setPeriod,
    benchmarkSymbol, setBenchmarkSymbol,
    returns, moments, performance,
    status, error,
    fetchData, computeAll,
  } = usePortfolio();

  const { selectedAssets } = useSelectedAssets();
  const [rfRate, setRfRate] = useState(0.045);

  const handleLoadFromHeader = () => {
    if (selectedAssets.length === 0) return;
    const equal = 1 / selectedAssets.length;
    setAssets(selectedAssets.map(a => ({ symbol: a.symbol, name: a.name, weight: equal })));
  };

  const handleAddAsset = (symbol: string, name: string) => {
    if (assets.find(a => a.symbol === symbol)) return;
    if (assets.length >= 10) return;
    const n = assets.length + 1;
    const equal = 1 / n;
    setAssets([...assets.map(a => ({ ...a, weight: equal })), { symbol, name, weight: equal }]);
  };

  const handleRemoveAsset = (symbol: string) => {
    const next = assets.filter(a => a.symbol !== symbol);
    if (next.length === 0) return;
    const equal = 1 / next.length;
    setAssets(next.map(a => ({ ...a, weight: equal })));
  };

  const handleWeightChange = (symbol: string, raw: string) => {
    const val = parseFloat(raw);
    if (!isNaN(val)) updateWeight(symbol, val / 100);
  };

  const maxWeight = useMemo(() => Math.max(...assets.map(a => a.weight), 0.01), [assets]);
  const weightSum = useMemo(() => assets.reduce((s, a) => s + a.weight, 0), [assets]);
  const isBalanced = Math.abs(weightSum - 1) < 0.001;

  const handleFetchAndCompute = async () => {
    await fetchData();
  };

  return (
    <div className="space-y-6">

      {/* ── Asset table ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="text-base font-semibold text-white flex-1">Asset Universe</h3>
          {selectedAssets.length > 0 && (
            <button
              onClick={handleLoadFromHeader}
              className="px-3 py-1.5 rounded-lg border border-blue-700/60 bg-blue-900/20 text-blue-300 hover:bg-blue-800/30 text-xs font-medium transition-colors"
            >
              Load from Header ({selectedAssets.length})
            </button>
          )}
          {assets.length > 0 && (
            <button
              onClick={() => setAssets([])}
              className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-700/60 text-xs transition-colors"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setAssets([
              { symbol: 'AAPL', name: 'Apple Inc.', weight: 0.25 },
              { symbol: 'MSFT', name: 'Microsoft Corp.', weight: 0.25 },
              { symbol: 'GOOGL', name: 'Alphabet Inc.', weight: 0.25 },
              { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 0.25 },
            ])}
            className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white text-xs transition-colors"
          >
            Load Example
          </button>
        </div>

        {/* Search — all asset types: equities, ETFs, crypto, FX, indices, commodities */}
        <div className="mb-4">
          <AssetSearchBar
            chips={assets.map(a => a.symbol)}
            onAdd={(symbol, name) => handleAddAsset(symbol, name)}
            onRemove={handleRemoveAsset}
            maxChips={10}
            accentBg="bg-indigo-900/40"
            accentBorder="border-indigo-700/50"
            accentText="text-indigo-200"
          />
          <p className="text-xs text-slate-500 mt-2">{assets.length}/10 assets · chain-driven · tokens · pools · crypto · equity · ETF · index</p>
        </div>

        {/* Empty state */}
        {assets.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center rounded-lg border border-dashed border-slate-600 bg-slate-800/20">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl">📂</div>
            <div>
              <p className="text-sm font-semibold text-white">No assets yet</p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                Select a chain, then search by symbol or name (tokens, crypto, equity, ETF), or click <span className="text-slate-200 font-medium">Load Example</span> to start with a sample portfolio.
              </p>
            </div>
          </div>
        )}

        {/* Asset rows */}
        <div className="space-y-2">
          {assets.map(asset => (
            <div key={asset.symbol} className="grid gap-3 items-center" style={{ gridTemplateColumns: '80px 1fr 90px 50px 24px' }}>
              <span className="font-mono text-sm font-bold text-white truncate">{asset.symbol}</span>
              <WeightBar weight={asset.weight} max={maxWeight} />
              <div className="relative">
                <input
                  type="number"
                  min={-100}
                  max={100}
                  step={0.1}
                  value={(asset.weight * 100).toFixed(1)}
                  onChange={e => handleWeightChange(asset.symbol, e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-white text-sm text-right pr-5 focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
              </div>
              <span className="text-xs text-slate-400 text-right">{(asset.weight * 100).toFixed(1)}%</span>
              <button
                onClick={() => handleRemoveAsset(asset.symbol)}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Weight sum */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/60">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Sum: <span className={`font-mono font-semibold ${isBalanced ? 'text-emerald-400' : 'text-amber-400'}`}>
                {(weightSum * 100).toFixed(1)}%
              </span>
            </span>
            {!isBalanced && (
              <button onClick={normalizeWeights} className="text-xs text-blue-400 hover:text-blue-300 underline">
                Normalize
              </button>
            )}
          </div>
          <span className="text-xs text-slate-500">Constraint: Σ w_i = 1 · w_i ≥ 0</span>
        </div>
      </div>

      {/* ── Settings row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Historical Period</label>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
            {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <p className="text-xs text-slate-500 mt-1">Daily log returns via yfinance</p>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Benchmark (for β, α, IR)</label>
          <select value={benchmarkSymbol} onChange={e => setBenchmarkSymbol(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
            {BENCHMARK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <p className="text-xs text-slate-500 mt-1">Used across all sub-panels</p>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Risk-Free Rate r_f</label>
          <select value={rfRate} onChange={e => setRfRate(parseFloat(e.target.value))}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
            {RF_RATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <p className="text-xs text-slate-500 mt-1">Sharpe, Treynor, M², Sortino</p>
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleFetchAndCompute}
          disabled={status === 'fetching' || status === 'computing' || assets.length === 0}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-900/30"
        >
          {status === 'fetching' ? '⟳ Fetching…' : '⬇ Fetch Market Data'}
        </button>

        {returns && (
          <button
            onClick={() => computeAll(rfRate)}
            disabled={status === 'computing'}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-900/30"
          >
            {status === 'computing' ? '⟳ Computing…' : '⚡ Compute All Analytics'}
          </button>
        )}
      </div>

      <StatusBar status={status} error={error} />

      {/* ── Data loaded summary ──────────────────────────────────────── */}
      {returns && (
        <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-emerald-400 text-sm">✓</span>
            <span className="text-sm font-semibold text-white">Market Data Loaded</span>
            <span className="text-xs text-slate-400">
              {returns.length} trading days · {assets.length} assets · benchmark: {benchmarkSymbol}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {assets.map((asset, i) => {
              const col = returns.map(row => row[i]);
              const mean = col.reduce((s, r) => s + r, 0) / col.length;
              const vol = Math.sqrt(col.reduce((s, r) => s + (r - mean) ** 2, 0) / (col.length - 1));
              const annMu = mean * 252;
              const annVol = vol * Math.sqrt(252);
              return (
                <div key={asset.symbol} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  <p className="font-mono font-bold text-white text-sm">{asset.symbol}</p>
                  <p className={`text-xs font-semibold mt-1 ${annMu >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {annMu >= 0 ? '+' : ''}{(annMu * 100).toFixed(1)}% pa
                  </p>
                  <p className="text-xs text-slate-400">σ {(annVol * 100).toFixed(1)}% pa</p>
                  <p className="text-xs text-slate-500 mt-0.5">{(asset.weight * 100).toFixed(1)}% wt</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Analytics ready summary ──────────────────────────────────── */}
      {moments && performance && (
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Portfolio Summary (M1 L1)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              label="Return (ann.)"
              value={`${(moments.portfolio_return * 252 * 100).toFixed(2)}%`}
              sub="w^T r̄ annualized"
              color={moments.portfolio_return >= 0 ? 'green' : 'red'}
            />
            <SummaryCard
              label="Volatility (ann.)"
              value={`${(moments.portfolio_volatility * Math.sqrt(252) * 100).toFixed(2)}%`}
              sub="√(w^T Σ w)"
            />
            <SummaryCard
              label="Beta β_p"
              value={moments.portfolio_beta.toFixed(3)}
              sub={`vs ${benchmarkSymbol}`}
            />
            <SummaryCard
              label="Sharpe Ratio"
              value={performance.sharpe_ratio.toFixed(3)}
              sub="(r_p − r_f) / σ_p"
              color={performance.sharpe_ratio > 1 ? 'green' : performance.sharpe_ratio > 0 ? 'amber' : 'red'}
            />
            <SummaryCard
              label="Skewness γ"
              value={moments.skewness.toFixed(4)}
              sub={moments.skewness < -0.5 ? 'Left-skewed (tail risk)' : 'Near-symmetric'}
              color={moments.skewness < -0.5 ? 'red' : 'default'}
            />
            <SummaryCard
              label="Excess Kurtosis"
              value={moments.kurtosis_excess.toFixed(4)}
              sub={moments.kurtosis_excess > 1 ? 'Heavy tails!' : 'Normal-like tails'}
              color={moments.kurtosis_excess > 1 ? 'red' : 'default'}
            />
            <SummaryCard label="Systematic Risk" value={`${(moments.systematic_risk * 100).toFixed(4)}%`} sub="β²_p · σ²_m" />
            <SummaryCard label="Idiosyncratic Risk" value={`${(moments.non_systematic_risk * 100).toFixed(4)}%`} sub="σ²_u (diversifiable)" />
          </div>

          {/* Risk decomposition bar */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
              Total Risk Decomposition: σ²_p = β²_p · σ²_m + σ²_u
            </p>
            {(() => {
              const total = moments.systematic_risk + moments.non_systematic_risk;
              const sysPct = total > 0 ? (moments.systematic_risk / total) * 100 : 50;
              return (
                <>
                  <div className="flex h-6 rounded overflow-hidden gap-px">
                    <div
                      className="flex items-center justify-center text-xs font-medium text-white bg-blue-600"
                      style={{ width: `${sysPct}%` }}
                    >
                      {sysPct > 15 ? `Systematic ${sysPct.toFixed(0)}%` : ''}
                    </div>
                    <div
                      className="flex items-center justify-center text-xs font-medium text-white bg-slate-600"
                      style={{ width: `${100 - sysPct}%` }}
                    >
                      {100 - sysPct > 15 ? `Idiosyncratic ${(100 - sysPct).toFixed(0)}%` : ''}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />Systematic (market)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-600" />Idiosyncratic (diversifiable)</span>
                  </div>
                </>
              );
            })()}
          </div>

          <p className="text-xs text-slate-500">
            Navigate sub-panels: <span className="text-slate-300">Sample Moments</span> · <span className="text-slate-300">Performance Appraisal</span> · <span className="text-slate-300">Higher-Order Stats</span> · <span className="text-slate-300">Return Attribution</span>
          </p>
        </div>
      )}
    </div>
  );
};
