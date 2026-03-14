import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHealthCheck } from '@/hooks/useApi';
import { useWallet } from '@/context/WalletContext';
import { MarketTicker } from './MarketTicker';

const BRAND_NAME = 'Quanti🔥Nova';

export const TransactHeader = () => {
  const navigate = useNavigate();
  const { isHealthy } = useHealthCheck();
  const { address, disconnect } = useWallet();
  const [autonomousMode, setAutonomousMode] = useState(false);

  return (
    <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 shrink-0 h-12">
      <div className="flex items-center gap-4 px-4 h-full">
        {/* Brand — Quanti🔥Nova */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
            title="Back to landing"
          >
            <span className="text-sm">←</span>
          </button>
          <button
            onClick={() => navigate('/transact')}
            className="group flex items-center gap-2 text-left shrink-0"
          >
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-neon-cyan/80 to-neon-purple/80 flex items-center justify-center text-base shadow-glow-cyan">
              🔥
            </div>
            <p className="text-sm font-black text-white leading-none group-hover:text-neon-cyan transition-colors">
              {BRAND_NAME}
            </p>
          </button>
        </div>

        <div className="w-px h-5 bg-slate-800 shrink-0" />

        {/* Live market ticker */}
        {isHealthy && <MarketTicker />}
        {!isHealthy && (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[10px] text-slate-700 uppercase tracking-widest">
              Oracle / pool data — API offline
            </span>
          </div>
        )}

        <div className="w-px h-5 bg-slate-800 shrink-0" />

        {/* Wallet summary */}
        {address && (
          <>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-mono">
              <span className="text-slate-400">{address.slice(0, 6)}…{address.slice(-4)}</span>
              <button
                onClick={disconnect}
                className="text-slate-500 hover:text-neon-pink transition-colors"
                title="Disconnect"
              >
                ×
              </button>
            </div>
            <div className="w-px h-5 bg-slate-800 shrink-0" />
          </>
        )}

        {/* Autonomous Mode toggle */}
        <button
          onClick={() => setAutonomousMode((v) => !v)}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-medium shrink-0 transition-colors ${
            autonomousMode
              ? 'bg-neon-green/15 border-neon-green/50 text-neon-green'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-300'
          }`}
          title={autonomousMode ? 'Agent can execute (auto)' : 'Manual confirm only'}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
          {autonomousMode ? 'Autonomous' : 'Manual'}
        </button>

        <div className="w-px h-5 bg-slate-800 shrink-0" />

        {/* API status pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono shrink-0">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isHealthy ? 'bg-neon-green animate-pulse' : 'bg-red-400'
            }`}
          />
          <span className={isHealthy ? 'text-neon-green' : 'text-red-400'}>
            {isHealthy ? 'LIVE' : 'OFF'}
          </span>
        </div>
      </div>
    </header>
  );
};
