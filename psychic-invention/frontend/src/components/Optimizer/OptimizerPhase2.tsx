import { useState } from 'react';
import {
  postOptimizeBlm,
  postOptimizeRiskParity,
  postOptimizeHrp,
  postOptimizeKelly,
  postOptimizeKellySingle,
} from '@/utils/api';

const SAMPLE_COV = [
  [0.04, 0.02, 0.01],
  [0.02, 0.09, 0.015],
  [0.01, 0.015, 0.06],
];
const SAMPLE_MU = [0.08, 0.12, 0.06];
const SAMPLE_RETURNS = [
  [0.01, -0.005, 0.02],
  [0.02, 0.01, -0.01],
  [0.015, 0.02, 0.01],
  [0.005, -0.01, 0.015],
  [-0.01, 0.005, -0.02],
  [0.02, 0.015, 0.005],
  [-0.005, -0.02, 0.01],
  [0.01, 0.005, -0.005],
  [0.015, 0.01, 0.02],
  [-0.02, 0.015, 0.005],
];
const MARKET_WEIGHTS = [0.5, 0.3, 0.2];
// View: asset 1 outperforms asset 2 by 2%
const P_MATRIX = [[0, 1, -1]];
const Q_VIEW = [0.02];

export const OptimizerPhase2 = () => {
  const [blm, setBlm] = useState<Record<string, unknown> | null>(null);
  const [riskParity, setRiskParity] = useState<Record<string, unknown> | null>(null);
  const [hrp, setHrp] = useState<Record<string, unknown> | null>(null);
  const [kelly, setKelly] = useState<Record<string, unknown> | null>(null);
  const [kellySingle, setKellySingle] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAll = async () => {
    setLoading('Phase 2');
    setError(null);
    setBlm(null);
    setRiskParity(null);
    setHrp(null);
    setKelly(null);
    setKellySingle(null);
    try {
      const [blmRes, rpRes, hrpRes, kellyRes, kellySRes] = await Promise.all([
        postOptimizeBlm({
          covariance: SAMPLE_COV,
          market_weights: MARKET_WEIGHTS,
          P: P_MATRIX,
          Q: Q_VIEW,
          tau: 0.05,
          risk_free_rate: 0.02,
        }),
        postOptimizeRiskParity({
          covariance: SAMPLE_COV,
          expected_returns: SAMPLE_MU,
          rho: 0,
        }),
        postOptimizeHrp({ covariance: SAMPLE_COV }),
        postOptimizeKelly({
          returns: SAMPLE_RETURNS,
          fractional: 0.5,
        }),
        postOptimizeKellySingle({ p: 0.55, q: 0.45 }),
      ]);
      setBlm(blmRes);
      setRiskParity(rpRes);
      setHrp(hrpRes);
      setKelly(kellyRes);
      setKellySingle(kellySRes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Phase 2 failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Phase 2: BLM · Risk Parity · HRP · Kelly</h3>
        <button
          onClick={runAll}
          disabled={!!loading}
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run All Phase 2 Optimizers'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {blm && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="font-semibold text-white mb-2">Black-Litterman</h4>
            <p className="text-sm text-slate-400">Weights: {(blm.weights as number[]).map((w) => (w * 100).toFixed(1)).join('% / ')}%</p>
            <p className="text-sm text-slate-400">Return: {((blm.expected_return as number) * 100).toFixed(2)}% | Vol: {((blm.volatility as number) * 100).toFixed(2)}%</p>
          </div>
        )}
        {riskParity && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="font-semibold text-white mb-2">Risk Parity ({riskParity.method})</h4>
            <p className="text-sm text-slate-400">Weights: {(riskParity.weights as number[]).map((w) => (w * 100).toFixed(1)).join('% / ')}%</p>
            <p className="text-sm text-slate-400">Vol: {((riskParity.volatility as number) * 100).toFixed(2)}%</p>
          </div>
        )}
        {hrp && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="font-semibold text-white mb-2">Hierarchical Risk Parity</h4>
            <p className="text-sm text-slate-400">Weights: {(hrp.weights as number[]).map((w) => (w * 100).toFixed(1)).join('% / ')}%</p>
            <p className="text-sm text-slate-400">Vol: {((hrp.volatility as number) * 100).toFixed(2)}%</p>
          </div>
        )}
        {kelly && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="font-semibold text-white mb-2">Multi-Asset Kelly (½ Kelly)</h4>
            <p className="text-sm text-slate-400">Weights: {(kelly.weights as number[]).map((w) => (w * 100).toFixed(1)).join('% / ')}%</p>
            <p className="text-sm text-slate-400">Expected growth: {((kelly.expected_growth as number) * 100).toFixed(3)}%</p>
          </div>
        )}
        {kellySingle && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="font-semibold text-white mb-2">Single-Asset Kelly (p=0.55)</h4>
            <p className="text-sm text-slate-400">Optimal fraction: {((kellySingle.optimal_fraction as number) * 100).toFixed(1)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};
