/**
 * Portfolio Workspace — Menu 2 (TRANSACT_APP_SPEC §3.2)
 * Wraps all sub-panels with PortfolioProvider for shared state.
 * Syncs computed moments + performance data to AgentContext for AI analysis.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PortfolioProvider, usePortfolio } from '@/context/PortfolioContext';
import { PortfolioBuilder } from '@/components/Portfolio/PortfolioBuilder';
import { MomentsPanel } from '@/components/Portfolio/MomentsPanel';
import { PerformanceAppraisalCard } from '@/components/Portfolio/PerformanceAppraisalCard';
import { CoskewnessHeatmap } from '@/components/Portfolio/CoskewnessHeatmap';
import { ReturnAttributionPanel } from '@/components/Portfolio/ReturnAttributionPanel';
import { useAgentContext, DEFAULT_SUGGESTED_QUESTIONS } from '@/context/AgentContext';
import { MathText } from '@/components/ui/Math';

const WORKSPACE_TITLE = 'Position & Yield Tracker';
const SUB_LABELS: Record<string, string> = {
  builder: 'Wallet & Chain Portfolio Scanner',
  moments: 'Position Stats',
  performance: 'Yield Metrics & Alpha',
  stats: 'IL & Correlation Risks',
  attribution: 'Brinson Decomposition for DeFi',
};

const SOURCE_BADGES: Record<string, string> = {
  builder: 'M1 §3.2.1',
  moments: 'M1 L1',
  performance: 'M1 Part II §4–7',
  stats: 'M2 L2',
  attribution: 'M1 §4 · M2 §5',
};

const SUB_DESCRIPTIONS: Record<string, string> = {
  builder: 'Define asset universe, set weights, fetch real market returns, compute all analytics.',
  moments: '$R_p = \\mathbf{w}^\\top \\bar{r}$ · $\\sigma^2_p = \\mathbf{w}^\\top \\Sigma \\mathbf{w}$ · $\\beta_p = \\mathbf{w}^\\top \\beta$ · $\\hat{\\gamma}$ skewness · $\\hat{\\kappa}$ kurtosis',
  performance: 'Sharpe · Treynor · Sortino · $M^2$ (Modigliani) · $M^2$-Sortino · Information Ratio · Appraisal Ratio · Jensen $\\alpha$',
  stats: 'Coskewness $M_3$ matrix · portfolio skewness via Kronecker product · heavy-tail kurtosis flag',
  attribution: '$r_p = \\alpha + \\beta_p r_m + \\sum_k \\lambda_k \\beta_{p,k} + \\varepsilon$ · Jensen alpha · CAPM decomposition · multi-factor extension',
};

function pct(v: number) { return `${(v * 100).toFixed(2)}%`; }
function fmt(v: number, d = 4) { return v.toFixed(d); }
// Annualisation helpers — match exactly what MomentsPanel / PerformanceAppraisalCard display
const ANN = 252;
const ANN_SQRT = Math.sqrt(252);
function annReturn(v: number) { return pct(v * ANN); }          // daily mean → annual %
function annVol(v: number)    { return pct(v * ANN_SQRT); }      // daily vol  → annual %
function annAlpha(v: number)  { return pct(v * ANN); }           // daily alpha → annual %

function WorkspaceContent({ activeTab }: { activeTab: string }) {
  switch (activeTab) {
    case 'moments':     return <MomentsPanel />;
    case 'performance': return <PerformanceAppraisalCard />;
    case 'stats':       return <CoskewnessHeatmap />;
    case 'attribution': return <ReturnAttributionPanel />;
    default:            return <PortfolioBuilder />;
  }
}

/** Inner component — has access to both PortfolioContext and AgentContext */
function PortfolioWorkspaceInner() {
  const location = useLocation();
  const { moments, performance, assets, period } = usePortfolio();
  const { setWorkspaceContext } = useAgentContext();

  function getActiveTab() {
    if (location.pathname.includes('/moments'))     return 'moments';
    if (location.pathname.includes('/performance')) return 'performance';
    if (location.pathname.includes('/stats'))       return 'stats';
    if (location.pathname.includes('/attribution')) return 'attribution';
    return 'builder';
  }
  const activeTab = getActiveTab();

  // ── Sync computed results to AgentContext ──────────────────────────────────
  useEffect(() => {
    if (!moments && !performance) return;
    const metrics: Record<string, string> = {};
    const rawData: Record<string, unknown> = {};

    if (assets.length > 0) {
      rawData.assets = assets.map(a => ({ symbol: a.symbol, weight: a.weight }));
      rawData.period = period;
    }

    if (moments) {
      // Annualise exactly as the workspace display components do (×252 / ×√252)
      metrics['Return (ann.)']    = annReturn(moments.portfolio_return);
      metrics['Volatility (ann.)']= annVol(moments.portfolio_volatility);
      metrics['Beta']             = fmt(moments.portfolio_beta, 3);
      metrics['Skewness']         = fmt(moments.skewness, 3);
      metrics['Excess Kurtosis']  = fmt(moments.kurtosis_excess, 3);
      rawData.moments = {
        portfolio_return_annualized:     annReturn(moments.portfolio_return),
        portfolio_volatility_annualized: annVol(moments.portfolio_volatility),
        portfolio_variance_annualized:   fmt(moments.portfolio_variance * ANN, 6),
        portfolio_beta:                  fmt(moments.portfolio_beta, 4),
        systematic_risk_annualized:      pct(moments.systematic_risk * ANN),
        non_systematic_risk_annualized:  pct(moments.non_systematic_risk * ANN),
        skewness:                        fmt(moments.skewness, 4),
        excess_kurtosis:                 fmt(moments.kurtosis_excess, 4),
        note: 'All return/vol figures annualised: mean×252, vol×√252 (252 trading days)',
      };
    }

    if (performance) {
      // Sharpe/Sortino/Treynor are dimensionless daily ratios — shown as-is (matching PerformanceAppraisalCard)
      // Alpha is daily → annualised ×252 (matching PerformanceAppraisalCard line 98)
      metrics['Sharpe']   = fmt(performance.sharpe_ratio, 3);
      metrics['Sortino']  = fmt(performance.sortino_ratio, 3);
      metrics['Jensen α'] = annAlpha(performance.alpha);
      rawData.performance = {
        sharpe_ratio:       fmt(performance.sharpe_ratio, 4),
        sortino_ratio:      fmt(performance.sortino_ratio, 4),
        treynor_ratio:      fmt(performance.treynor_ratio, 4),
        m2_modigliani:      pct(performance.m2_modigliani),
        m2_sortino:         pct(performance.m2_sortino),
        information_ratio:  fmt(performance.information_ratio, 4),
        appraisal_ratio:    fmt(performance.appraisal_ratio, 4),
        jensen_alpha_annualized: annAlpha(performance.alpha),
        note: 'Sharpe/Sortino/Treynor are daily ratios. Alpha annualised ×252.',
      };
    }

    const assetList = assets.map(a => a.symbol).join(', ') || 'portfolio';
    setWorkspaceContext({
      menuId: 'portfolio',
      summary: moments
        ? `${assetList} · Return ${annReturn(moments.portfolio_return)} · Vol ${annVol(moments.portfolio_volatility)} · β ${fmt(moments.portfolio_beta, 2)}`
        : `${assetList} — compute analytics to enable analysis`,
      metrics,
      rawData,
      suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS.portfolio,
    });
  }, [moments, performance, assets, period, setWorkspaceContext]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">📊</span>
          <h1 className="text-2xl font-black text-white">{WORKSPACE_TITLE}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{SUB_LABELS[activeTab]}</p>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {SOURCE_BADGES[activeTab]}
          </span>
        </div>
        <p className="text-sm text-slate-400 ml-9"><MathText text={SUB_DESCRIPTIONS[activeTab]} /></p>
      </div>
      <div className="min-h-[500px]">
        <WorkspaceContent activeTab={activeTab} />
      </div>
    </div>
  );
}

export const PortfolioWorkspace = () => (
  <PortfolioProvider>
    <PortfolioWorkspaceInner />
  </PortfolioProvider>
);
