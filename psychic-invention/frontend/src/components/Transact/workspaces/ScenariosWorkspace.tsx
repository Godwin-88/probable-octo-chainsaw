/**
 * Scenario Engine Workspace — Menu 7
 *
 * ONE shared DataSourcePanel at top loads:
 *   - N portfolio assets (≥2) price history → T×N log-returns matrix (live yfinance)
 *   - Equal-weight default, each panel operates on shared state
 *
 * Sub-panels are route-driven:
 *   /transact/scenarios                → ScenarioDefinitionPanel  (custom + historical)
 *   /transact/scenarios/probabilistic  → ProbabilisticPanel       (M3 L4: PSO)
 *   /transact/scenarios/behavioral     → BehavioralPanel          (M4: Prospect Theory + herding)
 *   /transact/scenarios/monte-carlo    → MonteCarloPanel          (M1 L2: path simulation)
 *   /transact/scenarios/cov-stress     → CovStressPanel           (M7: Σ stress)
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ScenariosProvider, useScenariosContext } from '@/context/ScenariosContext';
import { useAgentContext, DEFAULT_SUGGESTED_QUESTIONS } from '@/context/AgentContext';
import { MathText } from '@/components/ui/Math';
import { AssetSearchBar }           from '@/components/AssetSearchBar';
import { ScenarioDefinitionPanel }  from '@/components/Scenarios/ScenarioDefinitionPanel';
import { ProbabilisticPanel }       from '@/components/Scenarios/ProbabilisticPanel';
import { BehavioralPanel }          from '@/components/Scenarios/BehavioralPanel';
import { MonteCarloPanel }          from '@/components/Scenarios/MonteCarloPanel';
import { CovStressPanel }           from '@/components/Scenarios/CovStressPanel';

// ── Agent context sync hook ────────────────────────────────────────────────────
function useScenariosAgentSync() {
  const { setWorkspaceContext } = useAgentContext();
  const { symbols, returnMatrix, scenarioResult, mcResult, behavResult, probResult } = useScenariosContext();

  useEffect(() => {
    const rawData: Record<string, unknown> = {};
    const metrics: Record<string, string | number | null> = {
      assets: symbols.join(', ') || 'none',
      observations: returnMatrix.length,
    };

    if (scenarioResult) {
      rawData.scenario = scenarioResult;
      metrics['stressed_return'] = (scenarioResult.stressed_portfolio_return * 100).toFixed(2) + '%';
      metrics['stressed_vol']    = (scenarioResult.stressed_portfolio_volatility * 100).toFixed(2) + '%';
    }
    if (mcResult) {
      rawData.monte_carlo = mcResult;
      metrics['mc_var_95']  = (mcResult.var_95 * 100).toFixed(2) + '%';
      metrics['mc_cvar_95'] = (mcResult.cvar_95 * 100).toFixed(2) + '%';
    }
    if (behavResult) {
      rawData.behavioral = behavResult;
      if (behavResult.base_var_95 != null)
        metrics['behav_var_95'] = (behavResult.base_var_95 * 100).toFixed(2) + '%';
    }
    if (probResult) {
      rawData.probabilistic = probResult;
    }

    const hasResults = scenarioResult || mcResult || behavResult || probResult;
    const summary = hasResults
      ? `Scenario Engine: ${symbols.length} assets — ${[scenarioResult && 'Stress', mcResult && 'MC', behavResult && 'Behavioral', probResult && 'Probabilistic'].filter(Boolean).join(', ')} computed`
      : `Scenario Engine: ${symbols.length > 0 ? symbols.length + ' assets loaded' : 'no data loaded yet'}`;

    setWorkspaceContext({
      menuId: 'scenarios',
      summary,
      metrics,
      suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS.scenarios,
      ...(hasResults ? { rawData } : {}),
    });
  }, [symbols, returnMatrix, scenarioResult, mcResult, behavResult, probResult, setWorkspaceContext]);
}

// ── Panel metadata ─────────────────────────────────────────────────────────────
const PANEL_META: Record<string, { title: string; badge: string; desc: string }> = {
  definition:    { title: 'Scenario Definition',              badge: 'M3 L4 · Stress',     desc: 'Custom $\\Delta r, \\Delta\\sigma, \\Delta\\Sigma$ shocks · Historical overlays: GFC 2008, COVID 2020, Quant Meltdown 2007' },
  probabilistic: { title: 'Probabilistic Scenario Optimisation', badge: 'M3 L4 · PSO',     desc: '$\\mathbb{E}[r] = \\sum_k p_k r_k$ · $\\Sigma = \\sum_k p_k(r_k - \\mathbb{E}[r])(r_k - \\mathbb{E}[r])^\\top$ · min-variance with return floor' },
  behavioral:    { title: 'Behavioral Scenarios',            badge: 'M4 · KT 1992',          desc: 'Prospect Theory $v(x) = x^\\alpha$ (gains), $-\\lambda(-x)^\\beta$ (losses) · $\\lambda \\approx 2.25$ · herding VaR' },
  'monte-carlo': { title: 'Monte Carlo Simulation',          badge: 'M1 L2 · Paths',         desc: '$n$ paths · $W_T = W_0\\prod_t(1+r_t)$ · $r_t \\sim \\mathcal{N}(\\mu, \\Sigma)$ or Student-$t$ · VaR/CVaR from terminal P&L' },
  'cov-stress':  { title: 'Covariance Stress Testing',       badge: 'M7 · Shrinkage',        desc: '$\\Sigma_{\\text{stress}} = D\\cdot\\text{clip}(\\rho + \\Delta\\rho)\\cdot D$ · vol spikes · Ledoit-Wolf vs OAS shrinkage' },
};

// ── Shared Data Source Panel ─────────────────────────────────────────────────
function DataSourcePanel() {
  const {
    symbols, returnMatrix, period, setPeriod,
    multiLoading, fetchMultiAssets, error, clearError,
  } = useScenariosContext();

  const [chips, setChips] = useState<string[]>(symbols.length ? [...symbols] : []);

  const handleFetch = async () => {
    if (chips.length < 2) return;
    clearError();
    await fetchMultiAssets(chips, period);
  };

  return (
    <div className="rounded-xl border border-rose-800/40 bg-rose-900/5 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-semibold text-slate-200">Data Source</p>
        {symbols.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>
              {symbols.length} assets ·
              <span className="font-mono text-rose-300 ml-1">{symbols.join(', ')}</span>
            </span>
            {returnMatrix.length > 0 && <span className="text-slate-500">{returnMatrix.length} obs</span>}
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Portfolio Assets (≥2, live from yfinance)</p>
        <AssetSearchBar
          chips={chips}
          onAdd={sym => setChips(prev => prev.includes(sym) ? prev : [...prev, sym])}
          onRemove={sym => setChips(prev => prev.filter(s => s !== sym))}
          maxChips={12}
          accentBg="bg-rose-900/40"
          accentBorder="border-rose-700/50"
          accentText="text-rose-200"
        />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Period</p>
          <div className="flex gap-1">
            {['1y', '2y', '3y', '5y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  period === p
                    ? 'bg-rose-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}>{p}</button>
            ))}
          </div>
        </div>

        <button
          onClick={handleFetch}
          disabled={chips.length < 2 || multiLoading}
          className="px-4 py-1.5 rounded-lg bg-rose-700 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-40 transition flex items-center gap-2"
        >
          {multiLoading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>Fetching…</>
            : 'Fetch Live Data'}
        </button>

        {chips.length < 2 && (
          <p className="text-xs text-rose-400">Add at least 2 assets for scenario analysis</p>
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
          Add 2–12 equities (e.g. SPY, AGG, GLD, QQQ, TLT) · Price history fetched live from yfinance.
        </p>
      )}
    </div>
  );
}

// ── Inner workspace ────────────────────────────────────────────────────────────
function ScenariosWorkspaceInner() {
  useScenariosAgentSync();
  const location = useLocation();

  function getActiveTab() {
    if (location.pathname.includes('/probabilistic')) return 'probabilistic';
    if (location.pathname.includes('/behavioral'))    return 'behavioral';
    if (location.pathname.includes('/monte-carlo'))   return 'monte-carlo';
    if (location.pathname.includes('/cov-stress'))    return 'cov-stress';
    return 'definition';
  }
  const activeTab = getActiveTab();
  const meta = PANEL_META[activeTab];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🎯</span>
          <h1 className="text-2xl font-black text-white">Stress & MEV Scenario Simulator</h1>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/20">
            {meta.badge}
          </span>
        </div>
        <p className="text-sm text-slate-400 ml-9"><MathText text={meta.desc} /></p>
      </div>

      {/* Shared data source */}
      <DataSourcePanel />

      {/* Active panel */}
      <div className="min-h-[500px]">
        {activeTab === 'definition'    && <ScenarioDefinitionPanel />}
        {activeTab === 'probabilistic' && <ProbabilisticPanel />}
        {activeTab === 'behavioral'    && <BehavioralPanel />}
        {activeTab === 'monte-carlo'   && <MonteCarloPanel />}
        {activeTab === 'cov-stress'    && <CovStressPanel />}
      </div>
    </div>
  );
}

// ── Exported workspace (wraps provider) ──────────────────────────────────────
export const ScenariosWorkspace = () => (
  <ScenariosProvider>
    <ScenariosWorkspaceInner />
  </ScenariosProvider>
);
