/**
 * Factor Lab Workspace — Menu 6
 *
 * ONE shared multi-asset DataSourcePanel at the top loads:
 *   - N portfolio assets (≥2) price history → T×N log-returns matrix
 *   - 1 benchmark asset (default: SPY) for market factor
 *
 * Sub-panels are route-driven:
 *   /transact/factor                → FactorModelPanel  (OLS factor model)
 *   /transact/factor/fama-macbeth   → FamaMacBethPanel  (two-pass FM)
 *   /transact/factor/smart-beta     → SmartBetaPanel    (momentum tilt)
 *   /transact/factor/herding        → HerdingPanel      (crowding risk)
 *   /transact/factor/ml             → MLFactorPanel     (PCA discovery)
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FactorProvider, useFactorContext } from '@/context/FactorContext';
import { useAgentContext, DEFAULT_SUGGESTED_QUESTIONS } from '@/context/AgentContext';
import { MathText } from '@/components/ui/Math';
import { AssetSearchBar }    from '@/components/AssetSearchBar';
import { FactorModelPanel }  from '@/components/FactorLab/FactorModelPanel';
import { FamaMacBethPanel }  from '@/components/FactorLab/FamaMacBethPanel';
import { SmartBetaPanel }    from '@/components/FactorLab/SmartBetaPanel';
import { HerdingPanel }      from '@/components/FactorLab/HerdingPanel';
import { MLFactorPanel }     from '@/components/FactorLab/MLFactorPanel';

// ── Agent context sync hook ────────────────────────────────────────────────────
function useFactorAgentSync() {
  const { setWorkspaceContext } = useAgentContext();
  const { symbols, returnMatrix, factorModelResult, fmbResult, smartBetaResult, crowdingResult } = useFactorContext();

  useEffect(() => {
    const rawData: Record<string, unknown> = {};
    const metrics: Record<string, string | number | null> = {
      assets: symbols.join(', ') || 'none',
      observations: returnMatrix.length,
    };

    if (factorModelResult) {
      rawData.factor_model = factorModelResult;
      const avgR2 = factorModelResult.r_squared.length > 0
        ? factorModelResult.r_squared.reduce((a, b) => a + b, 0) / factorModelResult.r_squared.length
        : null;
      if (avgR2 !== null) metrics['avg_r_squared'] = avgR2.toFixed(3);
    }
    if (fmbResult) {
      rawData.fama_macbeth = fmbResult;
      metrics['fm_lambda_0'] = fmbResult.lambdas[0]?.toFixed(4) ?? null;
    }
    if (smartBetaResult) {
      rawData.smart_beta = smartBetaResult;
      metrics['sb_return'] = (smartBetaResult.expected_return * 100).toFixed(2) + '%';
      metrics['sb_vol']    = (smartBetaResult.volatility * 100).toFixed(2) + '%';
    }
    if (crowdingResult) {
      rawData.crowding = crowdingResult;
      metrics['crowding_index'] = crowdingResult.crowding_index.toFixed(3);
      metrics['crowding_level'] = crowdingResult.level;
    }

    const hasResults = factorModelResult || fmbResult || smartBetaResult || crowdingResult;
    const summary = hasResults
      ? `Factor Lab: ${symbols.length} assets — ${[factorModelResult && 'OLS', fmbResult && 'Fama-MacBeth', smartBetaResult && 'Smart Beta', crowdingResult && 'Crowding'].filter(Boolean).join(', ')} computed`
      : `Factor Lab: ${symbols.length > 0 ? symbols.length + ' assets loaded' : 'no data loaded yet'}`;

    setWorkspaceContext({
      menuId: 'factor',
      summary,
      metrics,
      suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS.factor,
      ...(hasResults ? { rawData } : {}),
    });
  }, [symbols, returnMatrix, factorModelResult, fmbResult, smartBetaResult, crowdingResult, setWorkspaceContext]);
}

// ── Panel metadata ─────────────────────────────────────────────────────────────
const PANEL_META: Record<string, { title: string; badge: string; desc: string }> = {
  models:       { title: 'Factor Model Builder',    badge: 'M2 L4 · OLS',         desc: '$R_{it} = \\alpha_i + \\boldsymbol{\\beta}_i^\\top \\mathbf{f}_t + \\varepsilon_{it}$ · systematic vs idiosyncratic decomposition' },
  fmb:          { title: 'Fama-MacBeth Regression', badge: 'M6 L1 · Two-Pass',    desc: 'Stage 1: time-series $\\hat{\\beta}_i$ · Stage 2: cross-sectional risk premia $\\hat{\\lambda}$ via $\\bar{r}_i = \\lambda_0 + \\hat{\\beta}_i^\\top\\lambda + \\alpha_i$' },
  'smart-beta': { title: 'Smart Beta Construction', badge: 'M6 L2 · Momentum',    desc: 'Factor-tilted portfolios: quintile sort & signal-weighted on momentum $\\text{IC} = \\text{Corr}(\\text{signal}, r_{t+1})$' },
  herding:      { title: 'Herding Risk Monitor',    badge: 'M6 L2 · Khandani-Lo', desc: 'Factor crowding index · 2007 Quant Meltdown · pairwise $|\\rho_{ij}|$ · herding $= \\frac{1}{N(N-1)}\\sum_{i \\neq j}|\\rho_{ij}|$' },
  ml:           { title: 'ML Factor Discovery',     badge: 'PCA · Latent',        desc: 'PCA on return matrix $X \\approx U\\Sigma V^\\top$ · scree plot · 80% variance rule · loadings heatmap' },
};

// ── Shared Data Source Panel ─────────────────────────────────────────────────
function DataSourcePanel() {
  const {
    symbols, returnMatrix, benchmarkSymbol, period, setPeriod,
    multiLoading, fetchMultiAssets, error, clearError,
  } = useFactorContext();

  const [chips,     setChips]     = useState<string[]>(symbols.length ? [...symbols] : []);
  const [benchmark, setBenchmark] = useState(benchmarkSymbol);

  const handleFetch = async () => {
    if (chips.length < 2) return;
    clearError();
    await fetchMultiAssets(chips, benchmark, period);
  };

  return (
    <div className="rounded-xl border border-amber-800/40 bg-amber-900/5 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-semibold text-slate-200">Data Source</p>
        {symbols.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>
              {symbols.length} assets ·
              <span className="font-mono text-amber-300 ml-1">{symbols.join(', ')}</span>
            </span>
            {returnMatrix.length > 0 && <span className="text-slate-500">{returnMatrix.length} obs</span>}
            <span>factor: <span className="font-mono text-cyan-300">{benchmark}</span></span>
          </div>
        )}
      </div>

      {/* Portfolio assets (multi) */}
      <div>
        <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Portfolio Assets (≥2)</p>
        <AssetSearchBar
          chips={chips}
          onAdd={sym => setChips(prev => prev.includes(sym) ? prev : [...prev, sym])}
          onRemove={sym => setChips(prev => prev.filter(s => s !== sym))}
          maxChips={10}
          accentBg="bg-amber-900/40"
          accentBorder="border-amber-700/50"
          accentText="text-amber-200"
        />
      </div>

      {/* Benchmark + period + fetch */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Benchmark / Market Factor</p>
          <input
            value={benchmark}
            onChange={e => setBenchmark(e.target.value.toUpperCase())}
            placeholder="SPY"
            className="w-28 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <div>
          <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Period</p>
          <div className="flex gap-1">
            {['1y', '2y', '3y', '5y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  period === p
                    ? 'bg-amber-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}>{p}</button>
            ))}
          </div>
        </div>

        <button
          onClick={handleFetch}
          disabled={chips.length < 2 || multiLoading}
          className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-40 transition flex items-center gap-2"
        >
          {multiLoading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>Fetching…</>
            : 'Fetch Live Data'}
        </button>

        {chips.length < 2 && (
          <p className="text-xs text-amber-400">Select at least 2 assets for factor analysis</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-2 text-red-300 text-xs flex items-center justify-between">
          {error}
          <button onClick={clearError} className="ml-2 text-red-400 hover:text-red-200 text-sm leading-none">×</button>
        </div>
      )}

      {!symbols.length && !multiLoading && (
        <p className="text-xs text-slate-600">
          Add 2–10 equities (e.g. AAPL, MSFT, GOOGL, JPM) + a benchmark (SPY). Price history fetched live from yfinance.
        </p>
      )}
    </div>
  );
}

// ── Inner workspace ───────────────────────────────────────────────────────────
function FactorWorkspaceInner() {
  useFactorAgentSync();
  const location = useLocation();

  function getActiveTab() {
    if (location.pathname.includes('/fama-macbeth')) return 'fmb';
    if (location.pathname.includes('/smart-beta'))   return 'smart-beta';
    if (location.pathname.includes('/herding'))      return 'herding';
    if (location.pathname.includes('/ml'))           return 'ml';
    return 'models';
  }
  const activeTab = getActiveTab();
  const meta = PANEL_META[activeTab];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🧬</span>
          <h1 className="text-2xl font-black text-white">On-Chain Signals & Edge Discovery</h1>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
            {meta.badge}
          </span>
        </div>
        <p className="text-sm text-slate-400 ml-9"><MathText text={meta.desc} /></p>
      </div>

      {/* Shared data source */}
      <DataSourcePanel />

      {/* Active panel */}
      <div className="min-h-[500px]">
        {activeTab === 'models'      && <FactorModelPanel />}
        {activeTab === 'fmb'         && <FamaMacBethPanel />}
        {activeTab === 'smart-beta'  && <SmartBetaPanel />}
        {activeTab === 'herding'     && <HerdingPanel />}
        {activeTab === 'ml'          && <MLFactorPanel />}
      </div>
    </div>
  );
}

// ── Exported workspace (wraps provider) ──────────────────────────────────────
export const FactorWorkspace = () => (
  <FactorProvider>
    <FactorWorkspaceInner />
  </FactorProvider>
);
