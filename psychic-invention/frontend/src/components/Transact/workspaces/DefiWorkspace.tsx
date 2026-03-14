/**
 * DeFi / Yield workspace — gateway portfolio, optimize, plan, execute.
 * Sub-panels: Portfolio, Optimize, Plan, Execute (navConfig subItems).
 */
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getPortfolio, startOptimization, getPlan, type PortfolioResponse, type PlanResponse } from '@/api/gateway';
import { useWallet } from '@/context/WalletContext';
import { useChain } from '@/context/ChainContext';

// ── Progress types (WebSocket /ws/progress) ────────────────────────────────────

type ProgressStatus =
  | 'FETCHING_DATA' | 'COMPUTING_GRAPH' | 'GENERATING_PLAN'
  | 'WAITING_FOR_SIGNATURE' | 'BROADCASTING' | 'DONE' | 'FAILED';

type ProgressMsg = {
  optimizationId: string; status: ProgressStatus; progress: number;
  summary?: string; error?: string;
};

function useOptimizationProgress(optimizationId: string | null) {
  const [msg, setMsg] = useState<ProgressMsg | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!optimizationId) { setMsg(null); return; }
    const base = import.meta.env.VITE_GATEWAY_URL ?? '';
    const wsBase = base
      ? base.replace(/^http/, 'ws').replace(/\/?$/, '')
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
    const ws = new WebSocket(`${wsBase}/ws/progress?optimizationId=${encodeURIComponent(optimizationId)}`);
    wsRef.current = ws;
    ws.onmessage = (e) => { try { setMsg(JSON.parse(e.data) as ProgressMsg); } catch (_) {} };
    ws.onerror = () => setMsg((m) => m ? { ...m, error: 'WebSocket error' } : null);
    ws.onclose = () => { wsRef.current = null; };
    return () => { ws.close(); wsRef.current = null; };
  }, [optimizationId]);

  return msg;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const SUB_LABELS: Record<string, string> = {
  portfolio: 'Portfolio',
  optimize: 'Analyze & Optimize',
  plan: 'Optimization Plan',
  execute: 'Execute',
};

function getActiveTab(pathname: string): string {
  if (pathname.includes('/defi/portfolio')) return 'portfolio';
  if (pathname.includes('/defi/optimize')) return 'optimize';
  if (pathname.includes('/defi/plan')) return 'plan';
  if (pathname.includes('/defi/execute')) return 'execute';
  return 'portfolio';
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PortfolioDisplay({ portfolio }: { portfolio: PortfolioResponse }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-200 font-semibold">Portfolio</h3>
        <span className="text-xs text-slate-500 font-mono">
          {portfolio.walletAddress.slice(0, 8)}…{portfolio.walletAddress.slice(-4)}
        </span>
      </div>
      <div className="text-3xl font-bold text-emerald-400 font-mono">
        ${portfolio.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        <span className="text-sm font-normal text-slate-500 ml-2">USD</span>
      </div>
      <ul className="divide-y divide-slate-700/50">
        {portfolio.positions.map((p, i) => {
          const decimals = p.type === 'native' ? 18 : 6;
          const amount = (Number(p.amount) / 10 ** decimals).toLocaleString('en-US', { maximumFractionDigits: 6 });
          return (
            <li key={i} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-200 font-medium">{p.assetSymbol}</span>
              <span className="text-slate-400 font-mono">{amount}</span>
              {p.amountUsd > 0 && (
                <span className="text-emerald-400 font-mono">${p.amountUsd.toFixed(2)}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProgressBar({ progress, status }: { progress: number; status: ProgressStatus }) {
  const colour =
    status === 'FAILED' ? 'bg-red-500' :
    status === 'DONE' ? 'bg-emerald-500' :
    'bg-blue-500';
  return (
    <div className="w-full bg-slate-700 rounded-full h-1.5">
      <div
        className={`${colour} h-1.5 rounded-full transition-all duration-300`}
        style={{ width: `${Math.max(4, progress)}%` }}
      />
    </div>
  );
}

function PlanDisplay({ plan }: { plan: PlanResponse }) {
  return (
    <div className="space-y-4">
      {plan.explanation && (
        <p className="text-slate-400 text-sm">{plan.explanation}</p>
      )}
      {(plan.expected_yield_apy != null || plan.risk_score != null) && (
        <div className="flex gap-6">
          {plan.expected_yield_apy != null && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Expected APY</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{plan.expected_yield_apy.toFixed(2)}%</div>
            </div>
          )}
          {plan.risk_score != null && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Risk Score</div>
              <div className={`text-2xl font-bold font-mono ${plan.risk_score > 0.6 ? 'text-red-400' : 'text-amber-400'}`}>
                {plan.risk_score.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="space-y-2">
        {plan.actions.map((a) => (
          <div key={a.id} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">{a.type}</span>
              <span className="text-slate-500 text-xs">{a.protocol_id}</span>
            </div>
            <div className="text-slate-200 text-sm">{a.asset_id}</div>
            {a.reason && <div className="text-slate-500 text-xs mt-1">{a.reason}</div>}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-600">
        Non-custodial: sign in your wallet and broadcast via POST /api/execute/signed
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DefiWorkspace() {
  const location = useLocation();
  const activeTab = getActiveTab(location.pathname);

  const { address } = useWallet();
  const { chain } = useChain();

  const [wallet, setWallet] = useState(address ?? '');
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [optimizationId, setOptimizationId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = useOptimizationProgress(optimizationId);
  const isRunning = progress && progress.status !== 'DONE' && progress.status !== 'FAILED';

  // Sync wallet from wallet context when address changes
  useEffect(() => {
    if (address && !wallet) setWallet(address);
  }, [address]);

  // Load portfolio when wallet/chain changes
  useEffect(() => {
    if (!wallet.trim()) { setPortfolio(null); return; }
    setLoading(true);
    setError(null);
    getPortfolio(wallet.trim(), chain)
      .then(setPortfolio)
      .catch((e) => {
        setPortfolio(null);
        setError(e instanceof Error ? e.message : 'Failed to fetch portfolio');
      })
      .finally(() => setLoading(false));
  }, [wallet, chain]);

  // Poll for plan when optimization is running
  useEffect(() => {
    if (!optimizationId || plan) return;
    const t = setInterval(() => {
      getPlan(optimizationId)
        .then((p) => { setPlan(p); clearInterval(t); })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(t);
  }, [optimizationId, plan]);

  const handleOptimize = async () => {
    if (!wallet.trim()) return;
    setError(null);
    setPlan(null);
    try {
      const { optimizationId: id } = await startOptimization(wallet.trim());
      setOptimizationId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Optimization failed');
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-200">{SUB_LABELS[activeTab] ?? 'Yield & Agent'}</h2>
        <p className="text-xs text-slate-500">Gateway: {import.meta.env.VITE_GATEWAY_URL || 'localhost:3000'} · Chain: {chain}</p>
      </div>

      {/* Wallet input */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">Wallet address</label>
        <input
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="0x…"
          className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none text-sm"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Portfolio tab */}
      {activeTab === 'portfolio' && (
        <div>
          {loading && <p className="text-slate-400 text-sm">Loading…</p>}
          {!wallet.trim() && !loading && <p className="text-slate-500 text-sm">Enter a wallet address above.</p>}
          {portfolio && !loading && <PortfolioDisplay portfolio={portfolio} />}
        </div>
      )}

      {/* Optimize tab */}
      {activeTab === 'optimize' && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Uses Neo4j opportunities and ai-core. Progress streams via gateway WebSocket.</p>
          <button
            onClick={handleOptimize}
            disabled={!wallet.trim() || !!isRunning}
            className="rounded-lg bg-amber-600 hover:bg-amber-500 px-5 py-2.5 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? 'Optimizing…' : 'Analyze & Optimize'}
          </button>

          {progress && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className={
                  progress.status === 'DONE' ? 'text-emerald-400 font-semibold' :
                  progress.status === 'FAILED' ? 'text-red-400 font-semibold' :
                  'text-blue-400 font-semibold'
                }>{progress.status}</span>
              </div>
              <ProgressBar progress={progress.progress} status={progress.status} />
              {progress.summary && <p className="text-slate-300 text-sm">{progress.summary}</p>}
              {progress.error && <p className="text-red-400 text-sm">{progress.error}</p>}
              {progress.status === 'DONE' && (
                <p className="text-slate-400 text-xs">Check the Plan tab for your optimization results.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Plan tab */}
      {activeTab === 'plan' && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="text-slate-200 font-semibold mb-3">Optimization Plan</h3>
          {!plan && !optimizationId && <p className="text-slate-500 text-sm">Run optimization first.</p>}
          {optimizationId && !plan && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Waiting for plan… (id: {optimizationId})
            </div>
          )}
          {plan && <PlanDisplay plan={plan} />}
        </div>
      )}

      {/* Execute tab */}
      {activeTab === 'execute' && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="text-slate-200 font-semibold mb-2">Execute</h3>
          <p className="text-slate-400 text-sm">
            Sign the recommended actions in your wallet and broadcast via{' '}
            <code className="text-slate-300 bg-slate-900 px-1 rounded text-xs">POST /api/execute/signed</code>.
            The gateway is non-custodial — it only broadcasts your signed transaction hex.
          </p>
        </div>
      )}
    </div>
  );
}
