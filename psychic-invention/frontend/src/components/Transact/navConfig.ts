// Shared navigation config — Focused for Lablab.ai Hackathon: Agentic Economy on Arc.
// We are hiding non-essential TradFi/math menus to focus judges on Arc L1 & Circle.

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
  /*
  {
    id: 'overview',
    icon: '🏠',
    label: 'Dashboard',
    path: '/transact',
  },
  */
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
  {
    id: 'admin',
    icon: '🛡️',
    label: 'Arc Control Center',
    path: '/transact/admin',
  },
  /*
  {
    id: 'universe',
    icon: '🪐',
    label: 'Knowledge Graph',
    path: '/transact/universe',
  },
  {
    id: 'pricer',
    icon: '⚡',
    label: 'On-Chain Pricer',
    path: '/transact/pricer',
  },
  {
    id: 'risk',
    icon: '🛡️',
    label: 'Risk Shield',
    path: '/transact/risk',
  },
  {
    id: 'optimizer',
    icon: '🎛️',
    label: 'Strategy Optimizer',
    path: '/transact/optimizer',
  },
  */
];
