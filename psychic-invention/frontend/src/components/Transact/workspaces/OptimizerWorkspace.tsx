/**
 * Optimizer Workspace — Menu 4 of the Transact Application
 * TRANSACT_APP_SPEC §3.4: MVO, BLM, Kelly, Risk Parity, HRP, Comparison
 *
 * Navigation is handled by the secondary sidebar (navConfig.ts + TransactLayout).
 * This component reads the URL path to determine which sub-panel to render.
 *
 * Routes:
 *   /transact/optimizer             → MVO (M1 L4)
 *   /transact/optimizer/blm         → Black-Litterman (M3 L1)
 *   /transact/optimizer/kelly       → Kelly Criterion (M5 L1)
 *   /transact/optimizer/risk-parity → Risk Parity ERC/RRP (M5 L3)
 *   /transact/optimizer/hrp         → Hierarchical Risk Parity (M7 L4)
 *   /transact/optimizer/compare     → Strategy Comparison
 */
import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { OptimizerProvider, useOptimizer } from '@/context/OptimizerContext';
import { useAgentContext, DEFAULT_SUGGESTED_QUESTIONS } from '@/context/AgentContext';
import { MathText } from '@/components/ui/Math';
import { AssetSearchBar } from '@/components/AssetSearchBar';
import { MVOPanel }        from '@/components/Optimizer/MVOPanel';
import { BLMPanel }        from '@/components/Optimizer/BLMPanel';
import { KellyPanel }      from '@/components/Optimizer/KellyPanel';
import { RiskParityPanel } from '@/components/Optimizer/RiskParityPanel';
import { HRPPanel }        from '@/components/Optimizer/HRPPanel';
import { ComparisonPanel } from '@/components/Optimizer/ComparisonPanel';

// ── Agent context sync hook ────────────────────────────────────────────────────
function useOptimizerAgentSync() {
  const { setWorkspaceContext } = useAgentContext();
  const { returns, labels, dataSource, mvoResult, blmResult, kellyResult, rpResult, hrpResult } = useOptimizer();

  useEffect(() => {
    const rawData: Record<string, unknown> = {};
    const metrics: Record<string, string | number | null> = {
      assets: labels.join(', ') || 'none',
      observations: returns.length,
      data_source: dataSource,
    };

    if (mvoResult) {
      rawData.mvo = mvoResult;
      if (mvoResult.tangency) {
        metrics['tangency_return'] = (mvoResult.tangency.expected_return * 100).toFixed(2) + '%';
        metrics['tangency_vol']    = (mvoResult.tangency.volatility * 100).toFixed(2) + '%';
      }
    }
    if (blmResult) {
      rawData.blm = blmResult;
      metrics['blm_sharpe'] = blmResult.sharpe_ratio.toFixed(3);
    }
    if (rpResult)    rawData.risk_parity = rpResult;
    if (hrpResult)   rawData.hrp         = hrpResult;
    if (kellyResult) {
      rawData.kelly = kellyResult;
      metrics['kelly_growth'] = (kellyResult.expected_growth * 100).toFixed(2) + '%';
    }

    const hasResults = mvoResult || blmResult || rpResult || hrpResult || kellyResult;
    const summary = hasResults
      ? `Optimizer: ${labels.length} assets, ${dataSource} data — ${[mvoResult && 'MVO', blmResult && 'BLM', rpResult && 'RP', hrpResult && 'HRP', kellyResult && 'Kelly'].filter(Boolean).join(', ')} computed`
      : `Optimizer: ${labels.length} assets loaded (${dataSource}), no results yet`;

    setWorkspaceContext({
      menuId: 'optimizer',
      summary,
      metrics,
      suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS.optimizer,
      ...(hasResults ? { rawData } : {}),
    });
  }, [returns, labels, dataSource, mvoResult, blmResult, kellyResult, rpResult, hrpResult, setWorkspaceContext]);
}

// ── Panel metadata (Web3-native labels) ────────────────────────────────────────
const WORKSPACE_TITLE = 'Capital Allocator & Strategy Optimizer';
const PANEL_META: Record<string, { title: string; badge: string; desc: string }> = {
  mvo: {
    title: 'Efficient Frontier for DeFi',
    badge: 'M1 L4',
    desc:  '$\\min_w \\mathbf{w}^\\top \\Sigma \\mathbf{w}$ s.t. $\\mathbf{w}^\\top \\mathbf{1}=1$ · Efficient frontier (CVXPY QP) · GMV · Tangency · CAL',
  },
  blm: {
    title: 'Views on Yield / Funding / Arb Edges',
    badge: 'M3 L1',
    desc:  'Equilibrium $\\pi = \\delta \\Sigma w_m$ · Posterior $\\mu_{BL}$ blends views $(P, Q, \\Omega)$ with prior · CAPM-consistent',
  },
  kelly: {
    title: 'Kelly / Fractional for On-Chain Edges',
    badge: 'M5 L1',
    desc:  'Single-asset $G(f) = p\\ln(1+bf) + q\\ln(1-f)$ · Multi-asset $\\max\\, \\mathbb{E}[\\ln(1 + \\mathbf{w}^\\top r)]$ · Fractional Kelly $\\kappa$',
  },
  'risk-parity': {
    title: 'TVL Parity',
    badge: 'M5 L3',
    desc:  'ERC: $RC_i = w_i(\\Sigma w)_i / \\sigma = \\sigma/N$ · Relaxed RP with return-tilt $\\rho$ (SOCP via CVXPY)',
  },
  hrp: {
    title: 'Hierarchical Yield Parity',
    badge: 'M7 L4',
    desc:  'Mantegna distance $d(\\rho) = \\sqrt{2(1-\\rho)}$ · Ward clustering · Quasi-diagonalisation · Recursive bisection',
  },
  compare: {
    title: 'DeFi Strategy Radar',
    badge: 'M1–M7',
    desc:  'Side-by-side: MVO · BLM · Risk Parity · HRP · Kelly — weight table · profile radar · $\\text{HHI} = \\sum_i w_i^2$',
  },
};

const PERIODS = [
  { value: '3mo', label: '3 Mo' },
  { value: '6mo', label: '6 Mo' },
  { value: '1y',  label: '1 Yr' },
  { value: '2y',  label: '2 Yr' },
  { value: '5y',  label: '5 Yr' },
];

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  demo:   { label: 'Demo data',   cls: 'bg-amber-500/10  border-amber-500/30  text-amber-300' },
  live:   { label: 'Live market', cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
  manual: { label: 'Manual JSON', cls: 'bg-sky-500/10     border-sky-500/30     text-sky-300' },
};

// ── Data source panel ─────────────────────────────────────────────────────────
function DataSourcePanel() {
  const {
    returns, labels, dataSource, dataFetchPeriod, setDataFetchPeriod,
    fetchLiveData, fetchLoading, fetchError, setReturns, loadDemoData,
  } = useOptimizer();

  const [chips, setChips] = useState<string[]>([]);
  const [jsonText, setJsonText]     = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const handleAdd = useCallback((symbol: string) => {
    setChips(c => c.includes(symbol) ? c : [...c, symbol]);
  }, []);

  const handleRemove = useCallback((symbol: string) => {
    setChips(c => c.filter(s => s !== symbol));
  }, []);

  const handleImport = () => {
    setParseError(null);
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed.returns) || parsed.returns.length === 0)
        throw new Error('Expected { returns: number[][], labels?: string[] }');
      setReturns(parsed.returns as number[][], parsed.labels as string[] | undefined);
      setJsonText('');
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : 'Parse failed');
    }
  };

  const badge = SOURCE_BADGE[dataSource] ?? SOURCE_BADGE.demo;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-5">
      {/* Status */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-white">Portfolio Data</span>
        <span className={`px-2 py-0.5 rounded-full text-xs border ${badge.cls}`}>
          {badge.label} — {labels.join(', ')} ({returns.length} obs)
        </span>
        <button onClick={loadDemoData}
          className="ml-auto text-xs text-slate-400 hover:text-white underline underline-offset-2">
          Reset to demo
        </button>
      </div>

      {/* Asset search */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-300">Select assets to fetch live market data</p>
        <AssetSearchBar
          chips={chips}
          onAdd={handleAdd}
          onRemove={handleRemove}
          maxChips={15}
          accentBg="bg-violet-900/40"
          accentBorder="border-violet-700/50"
          accentText="text-violet-200"
        />
      </div>

      {/* Period + fetch */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs text-slate-400">Period:</span>
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setDataFetchPeriod(p.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              dataFetchPeriod === p.value
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
            }`}>
            {p.label}
          </button>
        ))}
        <button onClick={() => fetchLiveData(chips, dataFetchPeriod)}
          disabled={fetchLoading || chips.length < 2}
          className="ml-auto px-4 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-40 transition flex items-center gap-2">
          {fetchLoading ? (
            <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>Fetching…</>
          ) : `Fetch Live Data${chips.length >= 2 ? ` (${chips.length})` : ''}`}
        </button>
      </div>

      {chips.length === 1 && (
        <p className="text-[11px] text-amber-400">Add at least 2 assets to fetch live data.</p>
      )}
      {fetchError && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-2.5 text-red-300 text-xs">{fetchError}</div>
      )}

      {/* Manual JSON import */}
      <details className="text-xs text-slate-500 border-t border-slate-800 pt-3">
        <summary className="cursor-pointer hover:text-slate-300 select-none">
          Import custom returns matrix (JSON)
        </summary>
        <div className="mt-2 space-y-2">
          <p className="text-slate-600">{`Format: { "returns": [[r00,r01,…],…], "labels": ["A","B",…] }`}</p>
          <textarea rows={4} value={jsonText} onChange={e => setJsonText(e.target.value)}
            placeholder='{ "returns": [...], "labels": [...] }'
            className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-2 font-mono focus:outline-none focus:border-violet-500" />
          {parseError && <p className="text-red-400">{parseError}</p>}
          <button onClick={handleImport} disabled={!jsonText.trim()}
            className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs hover:bg-violet-500 disabled:opacity-40 transition">
            Import
          </button>
        </div>
      </details>
    </div>
  );
}

// ── Active panel resolver ─────────────────────────────────────────────────────
function ActivePanel({ tab }: { tab: string }) {
  switch (tab) {
    case 'blm':          return <BLMPanel />;
    case 'kelly':        return <KellyPanel />;
    case 'risk-parity':  return <RiskParityPanel />;
    case 'hrp':          return <HRPPanel />;
    case 'compare':      return <ComparisonPanel />;
    default:             return <MVOPanel />;
  }
}

// ── Inner workspace ───────────────────────────────────────────────────────────
function OptimizerWorkspaceInner() {
  useOptimizerAgentSync();
  const location = useLocation();

  function getActiveTab() {
    if (location.pathname.includes('/blm'))          return 'blm';
    if (location.pathname.includes('/kelly'))        return 'kelly';
    if (location.pathname.includes('/risk-parity'))  return 'risk-parity';
    if (location.pathname.includes('/hrp'))          return 'hrp';
    if (location.pathname.includes('/compare'))      return 'compare';
    return 'mvo';
  }

  const tab  = getActiveTab();
  const meta = PANEL_META[tab] ?? PANEL_META.mvo;

  return (
    <div className="p-6 space-y-6">
      {/* Section header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🎛️</span>
          <h1 className="text-2xl font-black text-white">{WORKSPACE_TITLE}</h1>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-300 border border-violet-500/20">
            {meta.badge}
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-0.5">{meta.title}</p>
        <p className="text-sm text-slate-400 ml-9 mt-1"><MathText text={meta.desc} /></p>
      </div>

      {/* Data source panel */}
      <DataSourcePanel />

      {/* Active sub-panel */}
      <div className="min-h-[500px]">
        <ActivePanel tab={tab} />
      </div>
    </div>
  );
}

// ── Exported component ────────────────────────────────────────────────────────
export const OptimizerWorkspace = () => (
  <OptimizerProvider>
    <OptimizerWorkspaceInner />
  </OptimizerProvider>
);
