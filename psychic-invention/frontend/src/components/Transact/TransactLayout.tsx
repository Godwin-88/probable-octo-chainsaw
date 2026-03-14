import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { menuItems, type SubItem } from './navConfig';
import { useSelectedAssets } from '@/context/SelectedAssetsContext';
import { AgentButton } from '@/components/Agent';
import { ChainSelector } from './ChainSelector';
import { AgentContextProvider } from '@/context/AgentContext';
import { ChainProvider } from '@/context/ChainContext';
import { WalletProvider } from '@/context/WalletContext';

const BRAND_NAME = 'Quanti🔥Nova';

function getBreadcrumb(pathname: string): string[] {
  const segments = pathname.replace(/^\/transact\/?/, '').split('/').filter(Boolean);
  const labels: Record<string, string> = {
    pricer: 'On-Chain Pricer & Oracle Hub', portfolio: 'Position & Yield Tracker', risk: 'Risk & MEV Shield',
    optimizer: 'Capital Allocator & Strategy Optimizer', volatility: 'Vol & Funding Surface Lab',
    factor: 'On-Chain Signals & Edge Discovery', scenarios: 'Stress & MEV Scenario Simulator', blotter: 'Positions & Activity',
    defi: 'Yield & Agent', optimize: 'Optimize', plan: 'Plan', execute: 'Execute',
    greeks: 'Delta / Gamma / IL Exposure', chain: 'On-Chain Deriv Chain',
    capm: 'Beta vs. Chain / TVL-Weighted Benchmark', moments: 'Position Stats', performance: 'Yield Metrics & Alpha',
    stats: 'IL & Correlation Risks', attribution: 'Brinson Decomposition for DeFi', dashboard: 'Multi-Chain Risk Grid',
    covariance: 'Cross-Chain Correlation & Shrinkage', mst: 'Protocol Dependency Graph', blm: 'Views on Yield / Funding / Arb Edges', cla: 'Critical Line',
    kelly: 'Kelly / Fractional for On-Chain Edges', 'risk-parity': 'TVL Parity / Hierarchical Yield Parity', hrp: 'Hierarchical Yield Parity', compare: 'DeFi Strategy Radar',
    heston: 'Stoch Vol on Perps / Options', 'hist-implied': 'Realised vs Funding Premium', decomposition: 'Systematic vs Idiosyncratic in DeFi',
    'fama-macbeth': 'Cross-Sectional Premia in DeFi', 'smart-beta': 'Momentum / Mean-Reversion Tilt on Pools', herding: 'Crowding & MEV Crowding Index', ml: 'PCA on Mempool / Pool Activity',
    probabilistic: 'Expected Yield under Scenarios', behavioral: 'Herding / Liquidation Cascades', 'monte-carlo': 'Multi-Chain MC Paths',
    'cov-stress': 'Stressed Correlations + Oracle Spikes', positions: 'Real-Time P&L + MEV Attribution', history: 'On-Chain Tx Audit Trail', export: 'Export',
    overview: 'Opportunity Queue & Bundle Builder', entry: 'Trade Entry',
    visualize: 'Oracle & Pool State Fetch',
  };
  return [BRAND_NAME, ...segments.map(s => labels[s] ?? s)];
}

function TransactLayoutInner() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [subPanelCollapsed, setSubPanelCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedAssets } = useSelectedAssets();
  const breadcrumb = getBreadcrumb(location.pathname);

  const activeMenuItem = menuItems.find(item => {
    if (item.path === '/transact') return location.pathname === '/transact';
    return location.pathname.startsWith(item.path);
  });

  function isSubItemActive(sub: SubItem): boolean {
    if (!activeMenuItem) return false;
    if (sub.path === activeMenuItem.path) {
      return !activeMenuItem.subItems?.some(
        s => s.path !== activeMenuItem.path && location.pathname.startsWith(s.path)
      );
    }
    return location.pathname.startsWith(sub.path);
  }

  const hasSubPanel = !!(activeMenuItem?.subItems?.length);

  return (
    <div className="flex" style={{ height: 'calc(100vh - 65px)' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
      />

      {/* ── Secondary sub-nav panel ────────────────────────────────────── */}
      {hasSubPanel && (
        <div
          className={`relative shrink-0 flex flex-col bg-slate-900/50 border-r border-slate-800/60 overflow-hidden transition-all duration-300 ease-in-out ${
            subPanelCollapsed ? 'w-8' : 'w-48'
          }`}
        >
          <button
            onClick={() => setSubPanelCollapsed(prev => !prev)}
            className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center text-xs"
            title={subPanelCollapsed ? 'Expand sub-menu' : 'Collapse sub-menu'}
          >
            {subPanelCollapsed ? '›' : '‹'}
          </button>

          {!subPanelCollapsed && (
            <>
              <div className="px-4 pt-5 pb-3 border-b border-slate-800/60 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none">{activeMenuItem!.icon}</span>
                  <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-widest truncate">
                    {activeMenuItem!.label}
                  </p>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
                {activeMenuItem!.subItems!.map(sub => {
                  const active = isSubItemActive(sub);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => navigate(sub.path)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 border-l-2 ${
                        active
                          ? 'text-white font-semibold bg-blue-600/15 border-blue-500'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
                      }`}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </nav>
            </>
          )}
        </div>
      )}

      {/* ── Main workspace ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Context bar + blockchain selector (replaces legacy data source dropdown) */}
        <div className="flex items-center justify-between gap-4 px-6 py-2 border-b border-slate-800/40 bg-slate-900/20 shrink-0">
          <span className="text-xs text-slate-500 uppercase tracking-wider truncate min-w-0">
            {selectedAssets.length > 0
              ? `Analyzing ${selectedAssets.map((a) => a.symbol).join(', ')}`
              : 'Select chain and assets in Asset Universe to run analytics'}
          </span>
          <ChainSelector className="shrink-0" />
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800/60 bg-slate-900/40 shrink-0">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-slate-700">›</span>}
              {i === breadcrumb.length - 1 ? (
                <span className="text-sm font-semibold text-white">{crumb}</span>
              ) : (
                <button
                  onClick={() => i === 0 ? navigate('/transact') : undefined}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {crumb}
                </button>
              )}
            </span>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto relative">
          <Outlet />
          {/* Agent FAB — reads WorkspaceAgentContext written by each workspace */}
          <AgentButton
            menuId={activeMenuItem?.id ?? 'overview'}
            menuLabel={activeMenuItem?.label ?? BRAND_NAME}
          />
        </div>
      </div>
    </div>
  );
}

// Chain + Wallet + Agent context providers for Web3-native sidebar and views.
export const TransactLayout = () => (
  <ChainProvider>
    <WalletProvider>
      <AgentContextProvider>
        <TransactLayoutInner />
      </AgentContextProvider>
    </WalletProvider>
  </ChainProvider>
);
