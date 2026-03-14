/**
 * Volatility Workspace — Menu 5
 *
 * ONE shared AssetSearchBar at the top fetches live yfinance data:
 *   • Price history   → log-returns for realised vol (HistImplied)
 *   • Option chain    → strikes / expiries / prices for Heston calibration + ATM IV
 *
 * Sub-panels are route-driven (same pattern as Risk / Optimizer workspaces):
 *   /transact/volatility              → IVSurfacePanel
 *   /transact/volatility/heston       → HestonPanel
 *   /transact/volatility/hist-implied → HistImpliedPanel
 *   /transact/volatility/decomposition → VolDecompPanel   (has own multi-asset bar)
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { VolatilityProvider, useVolatility } from '@/context/VolatilityContext';
import { useAgentContext, DEFAULT_SUGGESTED_QUESTIONS } from '@/context/AgentContext';
import { MathText } from '@/components/ui/Math';
import { AssetSearchBar }   from '@/components/AssetSearchBar';
import { IVSurfacePanel }   from '@/components/Volatility/IVSurfacePanel';
import { HestonPanel }      from '@/components/Volatility/HestonPanel';
import { HistImpliedPanel } from '@/components/Volatility/HistImpliedPanel';
import { VolDecompPanel }   from '@/components/Volatility/VolDecompPanel';

// ── Panel metadata ─────────────────────────────────────────────────────────────
const PANEL_META: Record<string, { title: string; badge: string; desc: string }> = {
  surface:      { title: 'Implied Volatility Surface',   badge: 'Heston · DPE',       desc: 'Heston SV: $dv_t = \\kappa(\\theta - v_t)dt + \\xi\\sqrt{v_t}dW^v_t$ · vol smile · ATM term structure' },
  heston:       { title: 'Heston Model Calibration',     badge: 'L-BFGS-B · Feller',  desc: 'Calibrate $\\kappa,\\theta,\\xi,\\rho,v_0$ from live market option prices · Feller: $2\\kappa\\theta > \\xi^2$' },
  'hist-implied': { title: 'Historical vs Implied Vol',  badge: 'Vol Risk Premium',    desc: 'Rolling realised $\\hat{\\sigma}$ vs ATM implied vol · VRP $= \\text{IV} - \\text{RV}$ dynamics' },
  decomp:       { title: 'Factor Vol Decomposition',     badge: 'M2 · M6 · CAPM',      desc: '$\\sigma^2_p = \\beta_p^2\\sigma^2_m + \\mathbf{w}^\\top\\Sigma_\\varepsilon\\mathbf{w}$ · systematic vs idiosyncratic' },
};

// ── Agent context sync hook ────────────────────────────────────────────────────
function useVolatilityAgentSync() {
  const { setWorkspaceContext } = useAgentContext();
  const { symbol, atmIV, hestonParams, histVolResult, optionChain, calibResult } = useVolatility();

  useEffect(() => {
    const rawData: Record<string, unknown> = {};
    const metrics: Record<string, string | number | null> = {
      symbol: symbol || 'none',
      options_loaded: optionChain.length,
    };

    if (atmIV !== null) {
      metrics['atm_iv'] = (atmIV * 100).toFixed(2) + '%';
    }
    if (histVolResult) {
      rawData.historical_vol = histVolResult;
      metrics['hist_vol'] = (histVolResult.full_period_vol * 100).toFixed(2) + '%';
    }
    if (calibResult) {
      rawData.heston_calib = calibResult;
      metrics['kappa']     = calibResult.kappa.toFixed(3);
      metrics['theta']     = (calibResult.theta * 100).toFixed(2) + '%';
    } else if (symbol) {
      rawData.heston_params = hestonParams;
    }
    if (optionChain.length > 0) {
      rawData.option_chain_summary = {
        count: optionChain.length,
        expiries: [...new Set(optionChain.map(o => o.expiry_str))],
      };
    }

    const summary = symbol
      ? `Volatility Lab: ${symbol}${atmIV !== null ? ` · ATM IV ${(atmIV * 100).toFixed(1)}%` : ''}${histVolResult ? ` · Hist vol ${(histVolResult.full_period_vol * 100).toFixed(1)}%` : ''}`
      : 'Volatility Lab: no asset loaded yet';

    setWorkspaceContext({
      menuId: 'volatility',
      summary,
      metrics,
      suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS.volatility,
      ...(symbol ? { rawData } : {}),
    });
  }, [symbol, atmIV, hestonParams, histVolResult, optionChain, calibResult, setWorkspaceContext]);
}

// ── Shared Data Source Panel ──────────────────────────────────────────────────
function DataSourcePanel({ activeTab }: { activeTab: string }) {
  const { symbol, spot, returns, optionChain, atmIV, assetLoading, fetchAsset, error, clearError } = useVolatility();
  const [chips,  setChips]  = useState<string[]>(symbol ? [symbol] : []);
  const [period, setPeriod] = useState('2y');

  // VolDecomp has its own multi-asset search — hide shared bar for that tab
  if (activeTab === 'decomp') return null;

  const handleFetch = async () => {
    if (!chips.length) return;
    clearError();
    await fetchAsset(chips[0], period);
  };

  return (
    <div className="rounded-xl border border-cyan-800/40 bg-cyan-900/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-200">Data Source</p>
        {symbol && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              <span className="text-cyan-300 font-mono">{symbol}</span>
              {spot !== null && <> · S={spot.toFixed(2)}</>}
            </span>
            {returns.length > 0 && <span className="text-slate-500">{returns.length} daily obs</span>}
            {optionChain.length > 0 && (
              <span className="text-emerald-400">{optionChain.length} options loaded</span>
            )}
            {optionChain.length === 0 && returns.length > 0 && (
              <span className="text-amber-400">no options (history only)</span>
            )}
            {atmIV !== null && (
              <span className="text-cyan-300">ATM IV: {(atmIV * 100).toFixed(1)}%</span>
            )}
          </div>
        )}
      </div>

      <AssetSearchBar
        chips={chips}
        onAdd={sym => setChips([sym])}
        onRemove={() => setChips([])}
        maxChips={1}
        accentBg="bg-cyan-900/40"
        accentBorder="border-cyan-700/50"
        accentText="text-cyan-200"
      />

      <div className="flex flex-wrap items-center gap-3">
        {/* Period picker */}
        <div className="flex gap-1">
          {['6mo','1y','2y','5y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                period === p
                  ? 'bg-cyan-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}>{p}</button>
          ))}
        </div>

        <button
          onClick={handleFetch}
          disabled={!chips.length || assetLoading}
          className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500 disabled:opacity-40 transition flex items-center gap-2"
        >
          {assetLoading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>Fetching…</>
            : 'Fetch Live Data'}
        </button>

        {!chips.length && (
          <p className="text-xs text-amber-400">Search and select a ticker to load live data</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-2 text-red-300 text-xs flex items-center justify-between">
          {error}
          <button onClick={clearError} className="ml-2 text-red-400 hover:text-red-200 text-sm leading-none">×</button>
        </div>
      )}

      {!symbol && !assetLoading && (
        <p className="text-xs text-slate-600">
          Search for any equity (e.g. AAPL, MSFT, TSLA). Price history + option chain fetched live from yfinance.
        </p>
      )}
    </div>
  );
}

// ── Inner workspace ────────────────────────────────────────────────────────────
function VolatilityWorkspaceInner() {
  useVolatilityAgentSync();
  const location = useLocation();

  function getActiveTab() {
    if (location.pathname.includes('/heston'))        return 'heston';
    if (location.pathname.includes('/hist-implied'))  return 'hist-implied';
    if (location.pathname.includes('/decomposition')) return 'decomp';
    return 'surface';
  }
  const activeTab = getActiveTab();
  const meta = PANEL_META[activeTab];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🔬</span>
          <h1 className="text-2xl font-black text-white">Vol & Funding Surface Lab</h1>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            {meta.badge}
          </span>
        </div>
        <p className="text-sm text-slate-400 ml-9"><MathText text={meta.desc} /></p>
      </div>

      {/* Shared data source — hidden for VolDecomp which has its own multi-asset bar */}
      <DataSourcePanel activeTab={activeTab} />

      {/* Active panel */}
      <div className="min-h-[500px]">
        {activeTab === 'surface'       && <IVSurfacePanel />}
        {activeTab === 'heston'        && <HestonPanel />}
        {activeTab === 'hist-implied'  && <HistImpliedPanel />}
        {activeTab === 'decomp'        && <VolDecompPanel />}
      </div>
    </div>
  );
}

// ── Exported workspace (wraps provider) ───────────────────────────────────────
export const VolatilityWorkspace = () => (
  <VolatilityProvider>
    <VolatilityWorkspaceInner />
  </VolatilityProvider>
);
