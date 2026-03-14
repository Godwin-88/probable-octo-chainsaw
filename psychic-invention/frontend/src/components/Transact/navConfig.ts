// Shared navigation config — used by Sidebar (primary rail) and
// TransactLayout (secondary sub-nav panel). Web3-native labels per transact2web3.md.
// Keep in sync with App.tsx routes. Paths unchanged for backward compatibility.

export interface SubItem {
  id: string;
  label: string;
  path: string;
}

export interface MenuItem {
  id: string;
  icon: string;
  label: string;
  path: string;
  subItems?: SubItem[];
}

export const menuItems: MenuItem[] = [
  {
    id: 'overview',
    icon: '🏠',
    label: 'Dashboard',
    path: '/transact',
  },
  {
    id: 'pricer',
    icon: '⚡',
    label: 'On-Chain Pricer & Oracle Hub',
    path: '/transact/pricer',
    subItems: [
      { id: 'multi-model', label: 'AMM/Perp/Option Pricer', path: '/transact/pricer' },
      { id: 'oracle',      label: 'Oracle & Pool State Fetch', path: '/transact/pricer/visualize' },
      { id: 'greeks',      label: 'Delta / Gamma / IL Exposure', path: '/transact/pricer/greeks' },
      { id: 'chain',       label: 'On-Chain Deriv Chain', path: '/transact/pricer/chain' },
      { id: 'capm',        label: 'Beta vs. Chain / TVL-Weighted Benchmark', path: '/transact/pricer/capm' },
    ],
  },
  {
    id: 'portfolio',
    icon: '📊',
    label: 'Position & Yield Tracker',
    path: '/transact/portfolio',
    subItems: [
      { id: 'builder',     label: 'Wallet & Chain Portfolio Scanner', path: '/transact/portfolio' },
      { id: 'moments',     label: 'Position Stats', path: '/transact/portfolio/moments' },
      { id: 'performance', label: 'Yield Metrics & Alpha', path: '/transact/portfolio/performance' },
      { id: 'stats',       label: 'IL & Correlation Risks', path: '/transact/portfolio/stats' },
      { id: 'attribution', label: 'Brinson Decomposition for DeFi', path: '/transact/portfolio/attribution' },
    ],
  },
  {
    id: 'risk',
    icon: '🛡️',
    label: 'Risk & MEV Shield',
    path: '/transact/risk',
    subItems: [
      { id: 'var',         label: 'On-Chain VaR / ES', path: '/transact/risk' },
      { id: 'greeks-risk', label: 'Portfolio Greeks + MEV Delta', path: '/transact/risk/greeks' },
      { id: 'covariance',  label: 'Cross-Chain Correlation & Shrinkage', path: '/transact/risk/covariance' },
      { id: 'mst',         label: 'Protocol Dependency Graph', path: '/transact/risk/mst' },
      { id: 'dashboard',   label: 'Multi-Chain Risk Grid', path: '/transact/risk/dashboard' },
    ],
  },
  {
    id: 'optimizer',
    icon: '🎛️',
    label: 'Capital Allocator & Strategy Optimizer',
    path: '/transact/optimizer',
    subItems: [
      { id: 'mvo',         label: 'Efficient Frontier for DeFi', path: '/transact/optimizer' },
      { id: 'blm',         label: 'Views on Yield / Funding / Arb Edges', path: '/transact/optimizer/blm' },
      { id: 'cla',         label: 'Critical Line', path: '/transact/optimizer/cla' },
      { id: 'kelly',       label: 'Kelly / Fractional for On-Chain Edges', path: '/transact/optimizer/kelly' },
      { id: 'rp',          label: 'TVL Parity', path: '/transact/optimizer/risk-parity' },
      { id: 'hrp',         label: 'Hierarchical Yield Parity', path: '/transact/optimizer/hrp' },
      { id: 'compare',     label: 'DeFi Strategy Radar', path: '/transact/optimizer/compare' },
    ],
  },
  {
    id: 'volatility',
    icon: '🔬',
    label: 'Vol & Funding Surface Lab',
    path: '/transact/volatility',
    subItems: [
      { id: 'surface',      label: 'Perp Funding + Implied Vol Surface', path: '/transact/volatility' },
      { id: 'heston',       label: 'Stoch Vol on Perps / Options', path: '/transact/volatility/heston' },
      { id: 'hist-implied', label: 'Realised vs Funding Premium', path: '/transact/volatility/hist-implied' },
      { id: 'decomp',       label: 'Systematic vs Idiosyncratic in DeFi', path: '/transact/volatility/decomposition' },
    ],
  },
  {
    id: 'factor',
    icon: '🧬',
    label: 'On-Chain Signals & Edge Discovery',
    path: '/transact/factor',
    subItems: [
      { id: 'models',     label: 'On-Chain Factor Regressions', path: '/transact/factor' },
      { id: 'fmb',        label: 'Cross-Sectional Premia in DeFi', path: '/transact/factor/fama-macbeth' },
      { id: 'smart-beta', label: 'Momentum / Mean-Reversion Tilt on Pools', path: '/transact/factor/smart-beta' },
      { id: 'herding',    label: 'Crowding & MEV Crowding Index', path: '/transact/factor/herding' },
      { id: 'ml',         label: 'PCA on Mempool / Pool Activity', path: '/transact/factor/ml' },
    ],
  },
  {
    id: 'scenarios',
    icon: '🎯',
    label: 'Stress & MEV Scenario Simulator',
    path: '/transact/scenarios',
    subItems: [
      { id: 'definition',    label: 'Custom Chain Shocks + MEV Bundles', path: '/transact/scenarios' },
      { id: 'probabilistic', label: 'Expected Yield under Scenarios', path: '/transact/scenarios/probabilistic' },
      { id: 'behavioral',    label: 'Herding / Liquidation Cascades', path: '/transact/scenarios/behavioral' },
      { id: 'monte-carlo',   label: 'Multi-Chain MC Paths', path: '/transact/scenarios/monte-carlo' },
      { id: 'cov-stress',    label: 'Stressed Correlations + Oracle Spikes', path: '/transact/scenarios/cov-stress' },
    ],
  },
  {
    id: 'blotter',
    icon: '📋',
    label: 'Positions & Activity',
    path: '/transact/blotter',
    subItems: [
      { id: 'overview',    label: 'Opportunity Queue & Bundle Builder', path: '/transact/blotter' },
      { id: 'entry',       label: 'Trade Entry', path: '/transact/blotter/entry' },
      { id: 'positions',   label: 'Real-Time P&L + MEV Attribution', path: '/transact/blotter/positions' },
      { id: 'attribution', label: 'Decomposition by Chain / Strategy / MEV Impact', path: '/transact/blotter/attribution' },
      { id: 'history',     label: 'On-Chain Tx Audit Trail', path: '/transact/blotter/history' },
      { id: 'export',      label: 'Export', path: '/transact/blotter/export' },
    ],
  },
  {
    id: 'universe',
    icon: '🪐',
    label: 'Data Universe',
    path: '/transact/universe',
  },
  {
    id: 'defi',
    icon: '🌾',
    label: 'Yield & Agent',
    path: '/transact/defi',
    subItems: [
      { id: 'portfolio', label: 'Portfolio', path: '/transact/defi/portfolio' },
      { id: 'optimize',  label: 'Optimize',  path: '/transact/defi/optimize' },
      { id: 'plan',      label: 'Plan',      path: '/transact/defi/plan' },
      { id: 'execute',   label: 'Execute',   path: '/transact/defi/execute' },
    ],
  },
];
