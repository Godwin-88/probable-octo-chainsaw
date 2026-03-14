import { useState } from 'react';
import { postBlotterAttribution, postBlotterPnl } from '@/utils/api';

const SAMPLE_PORTFOLIO_RETURNS = [0.01, 0.02, -0.01, 0.015, 0.005];
const SAMPLE_MARKET_RETURNS = [0.015, 0.012, -0.005, 0.01, 0.008];

export const AttributionCard = () => {
  const [attribution, setAttribution] = useState<Record<string, unknown> | null>(null);
  const [pnl, setPnl] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAttribution = async () => {
    setLoading(true);
    setError(null);
    setAttribution(null);
    try {
      const res = await postBlotterAttribution({
        portfolio_returns: SAMPLE_PORTFOLIO_RETURNS,
        market_returns: SAMPLE_MARKET_RETURNS,
      });
      setAttribution(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Attribution failed');
    } finally {
      setLoading(false);
    }
  };

  const runPnl = async () => {
    setLoading(true);
    setError(null);
    setPnl(null);
    try {
      const res = await postBlotterPnl({ current_prices: { AAPL: 155, MSFT: 400 } });
      setPnl(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'P&L failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Performance Attribution & P&L (M1 §4)</h3>
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}
      <div className="flex gap-2 mb-4">
        <button
          onClick={runAttribution}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-500 disabled:opacity-50"
        >
          {loading ? '…' : 'Attribution'}
        </button>
        <button
          onClick={runPnl}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 disabled:opacity-50"
        >
          P&L Snapshot
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attribution && (
          <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-3">
            <p className="text-slate-400 text-sm font-medium mb-2">Decomposition</p>
            <pre className="text-xs text-cyan-300 font-mono overflow-auto max-h-40">
              {JSON.stringify(attribution, null, 2)}
            </pre>
          </div>
        )}
        {pnl && (
          <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-3">
            <p className="text-slate-400 text-sm font-medium mb-2">P&L</p>
            <pre className="text-xs text-cyan-300 font-mono overflow-auto max-h-40">
              {JSON.stringify(pnl, null, 2)}
            </pre>
          </div>
        )}
      </div>
      {!attribution && !pnl && !loading && (
        <p className="text-slate-500 text-sm">Run Attribution or P&L Snapshot to see results.</p>
      )}
    </div>
  );
};
