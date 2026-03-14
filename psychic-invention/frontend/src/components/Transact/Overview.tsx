import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import { useChain } from '@/context/ChainContext';
import { useV2Api, getV2Positions } from '@/api/gatewayV2';
import { getPortfolio } from '@/api/gateway';

const BRAND_NAME = 'Quanti🔥Nova';

const modules = [
  { icon: '⚡', label: 'On-Chain Pricer & Oracle Hub', path: '/transact/pricer', desc: 'AMM/Perp/Option pricing, oracle & pool state', accent: 'cyan' },
  { icon: '📊', label: 'Position & Yield Tracker', path: '/transact/portfolio', desc: 'Wallet & chain portfolio, yield metrics, Brinson DeFi', accent: 'indigo' },
  { icon: '🛡️', label: 'Risk & MEV Shield', path: '/transact/risk', desc: 'On-Chain VaR/ES, MEV delta, protocol dependency graph', accent: 'emerald' },
  { icon: '🎛️', label: 'Capital Allocator & Strategy Optimizer', path: '/transact/optimizer', desc: 'Efficient frontier DeFi, Kelly, TVL parity', accent: 'violet' },
  { icon: '🔬', label: 'Vol & Funding Surface Lab', path: '/transact/volatility', desc: 'Perp funding, implied vol, stoch vol', accent: 'cyan' },
  { icon: '🧬', label: 'On-Chain Signals & Edge Discovery', path: '/transact/factor', desc: 'Factor regressions, MEV crowding, PCA mempool', accent: 'amber' },
  { icon: '🎯', label: 'Stress & MEV Scenario Simulator', path: '/transact/scenarios', desc: 'Chain shocks, liquidation cascades, MC paths', accent: 'rose' },
  { icon: '📋', label: 'Positions & Activity', path: '/transact/blotter', desc: 'Opportunity queue, P&L + MEV attribution, tx audit', accent: 'slate' },
];

const accentHover: Record<string, string> = {
  cyan: 'hover:border-neon-cyan/50 hover:bg-neon-cyan/5',
  indigo: 'hover:border-indigo-500/50 hover:bg-indigo-500/5',
  emerald: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
  violet: 'hover:border-violet-500/50 hover:bg-violet-500/5',
  amber: 'hover:border-amber-500/50 hover:bg-amber-500/5',
  rose: 'hover:border-rose-500/50 hover:bg-rose-500/5',
  slate: 'hover:border-slate-500/50 hover:bg-slate-500/5',
};

const accentText: Record<string, string> = {
  cyan: 'text-neon-cyan', indigo: 'text-indigo-400', emerald: 'text-emerald-400',
  violet: 'text-violet-400', amber: 'text-amber-400', rose: 'text-rose-400', slate: 'text-slate-400',
};

export const Overview = () => {
  const navigate = useNavigate();
  const { address } = useWallet();
  const { chain, chainLabels } = useChain();
  const useV2 = useV2Api();
  const [tvlUsd, setTvlUsd] = useState<number | null>(null);

  useEffect(() => {
    if (!address) {
      setTvlUsd(null);
      return;
    }
    if (useV2) {
      getV2Positions(address, chain)
        .then((r) => setTvlUsd(r.totalUsd))
        .catch(() => setTvlUsd(null));
    } else {
      getPortfolio(address, chain)
        .then((r) => setTvlUsd(r.totalUsd))
        .catch(() => setTvlUsd(null));
    }
  }, [address, chain, useV2]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Command Center</p>
        <h1 className="text-4xl font-black text-white leading-tight">
          {BRAND_NAME}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
            Dashboard
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          TVL, yield, positions, and opportunities across chains. Connect your wallet and run the agent.
        </p>
      </div>

      {/* Top row: TVL, Agent status, MEV shield, P&L */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl backdrop-blur-md bg-slate-900/70 border border-slate-700/50">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Aggregate TVL</p>
          <p className="text-2xl font-black font-mono text-white mt-1">
            {address ? (tvlUsd != null ? `$${tvlUsd.toFixed(2)}` : '…') : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{address ? `Chain: ${chainLabels[chain] ?? chain}` : 'Connect wallet'}</p>
        </div>
        <div className="p-5 rounded-2xl backdrop-blur-md bg-slate-900/70 border border-slate-700/50">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Agent Status</p>
          <p className="text-lg font-bold text-neon-green mt-1">Ready</p>
          <p className="text-xs text-slate-500 mt-0.5">Manual / Autonomous</p>
        </div>
        <div className="p-5 rounded-2xl backdrop-blur-md bg-slate-900/70 border border-slate-700/50">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">MEV Shield</p>
          <p className="text-lg font-bold text-neon-cyan mt-1">Off</p>
          <p className="text-xs text-slate-500 mt-0.5">Toggle in Risk & MEV Shield</p>
        </div>
        <div className="p-5 rounded-2xl backdrop-blur-md bg-slate-900/70 border border-slate-700/50">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Quick P&L</p>
          <p className="text-2xl font-black font-mono text-white mt-1">—</p>
          <p className="text-xs text-slate-500 mt-0.5">From Positions & Activity</p>
        </div>
      </div>

      {/* Opportunities scanner */}
      <div className="p-5 rounded-2xl backdrop-blur-md bg-slate-900/70 border border-slate-700/50">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          Opportunities Scanner
        </h2>
        <p className="text-xs text-slate-500 mb-3">Arb / liquidation / yield alerts (stream when v2/ws/opportunities is live)</p>
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4 text-center text-slate-500 text-sm">
          No opportunities right now. Connect wallet and select chain to scan.
        </div>
      </div>

      {/* Recent activity */}
      <div className="p-5 rounded-2xl backdrop-blur-md bg-slate-900/70 border border-slate-700/50">
        <h2 className="text-sm font-bold text-white mb-3">Recent Activity</h2>
        <div className="space-y-2 text-sm text-slate-500">
          <p>Recent optimizations and txs will appear here (v2/ws/agent).</p>
        </div>
      </div>

      {/* Module shortcuts — Web3 names */}
      <div>
        <h2 className="text-lg font-bold text-white mb-5">Workspaces</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {modules.map((m) => (
            <button
              key={m.label}
              onClick={() => navigate(m.path)}
              className={`group p-5 rounded-2xl backdrop-blur-md bg-slate-900/70 border border-slate-700/50 text-left transition-all duration-200 hover:-translate-y-0.5 ${accentHover[m.accent]}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{m.icon}</span>
                <span className={`text-xs ${accentText[m.accent]} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Open →
                </span>
              </div>
              <p className="text-sm font-bold text-white mb-1">{m.label}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick start */}
      <div className="p-6 rounded-2xl backdrop-blur-md bg-slate-900/70 border border-slate-700/50">
        <h2 className="text-base font-bold text-white mb-4">Quick Start</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          {[
            { step: '01', title: 'On-Chain Pricer', desc: 'Oracle Hub → AMM/Perp/Option Pricer for BS/FFT/Heston and pool state.', path: '/transact/pricer' },
            { step: '02', title: 'Position & Yield', desc: 'Wallet & Chain Portfolio Scanner to add assets, then Position Stats.', path: '/transact/portfolio' },
            { step: '03', title: 'Capital Allocator', desc: 'Efficient Frontier for DeFi or Kelly for on-chain edges.', path: '/transact/optimizer' },
          ].map((g) => (
            <button
              key={g.step}
              onClick={() => navigate(g.path)}
              className="text-left p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-neon-cyan/30 transition-all"
            >
              <p className="text-xs font-black text-neon-cyan mb-2">Step {g.step}</p>
              <p className="font-semibold text-white mb-1">{g.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
