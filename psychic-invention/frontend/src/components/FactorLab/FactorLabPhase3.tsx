import { useState } from 'react';
import {
  postFactorsEstimate,
  postFactorsFamaMacbeth,
  postPortfolioCoskewness,
  postHestonCalibrate,
  postFactorsSmartBeta,
  postFactorsCrowding,
} from '@/utils/api';

const SAMPLE_RETURNS = [
  [0.01, -0.005, 0.02, 0.015],
  [-0.02, 0.01, -0.01, 0.005],
  [0.015, 0.02, 0.01, -0.005],
  [0.005, -0.01, 0.015, 0.02],
  [-0.01, 0.005, -0.02, 0.01],
  [0.02, 0.015, 0.005, 0.01],
  [-0.005, -0.02, 0.01, 0.015],
  [0.01, 0.005, -0.005, 0.02],
  [0.015, 0.01, 0.02, -0.01],
  [0.005, -0.01, 0.02, 0.005],
];
const SAMPLE_FACTORS = [[0.02], [-0.01], [0.015], [0.005], [-0.02], [0.01], [-0.005], [0.02], [0.01], [0.005]];
const WEIGHTS = [0.25, 0.25, 0.25, 0.25];
const FACTOR_SCORES = [0.8, -0.3, 0.5, 0.2];

export const FactorLabPhase3 = () => {
  const [factorEst, setFactorEst] = useState<Record<string, unknown> | null>(null);
  const [fm, setFm] = useState<Record<string, unknown> | null>(null);
  const [coskew, setCoskew] = useState<Record<string, unknown> | null>(null);
  const [heston, setHeston] = useState<Record<string, unknown> | null>(null);
  const [smartBeta, setSmartBeta] = useState<Record<string, unknown> | null>(null);
  const [crowding, setCrowding] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAll = async () => {
    setLoading(true);
    setError(null);
    setFactorEst(null);
    setFm(null);
    setCoskew(null);
    setHeston(null);
    setSmartBeta(null);
    setCrowding(null);
    try {
      const [fe, fmRes, cs, sb, cr] = await Promise.all([
        postFactorsEstimate({ returns: SAMPLE_RETURNS, factors: SAMPLE_FACTORS }),
        postFactorsFamaMacbeth({ returns: SAMPLE_RETURNS, factors: SAMPLE_FACTORS }),
        postPortfolioCoskewness({ returns: SAMPLE_RETURNS, weights: WEIGHTS }),
        postFactorsSmartBeta({ factor_scores: FACTOR_SCORES, returns: SAMPLE_RETURNS }),
        postFactorsCrowding({ factor_loadings: [[0.9, 0.1], [0.8, 0.2], [0.7, 0.3], [0.85, 0.15]] }),
      ]);
      setFactorEst(fe);
      setFm(fmRes);
      setCoskew(cs);
      setSmartBeta(sb);
      setCrowding(cr);

      try {
        const h = await postHestonCalibrate({
          s: 100,
          r: 0.05,
          strikes: [95, 100, 105],
          expiries: [0.25, 0.25, 0.25],
          market_prices: [10, 5, 2],
        });
        setHeston(h);
      } catch {
        setHeston({ error: 'Heston calibration failed (pricing engine may be unavailable)' });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Phase 3 failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Phase 3: Factor Lab · Coskewness · Heston · Smart Beta · Crowding</h3>
        <button
          onClick={runAll}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run All Phase 3'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-300 text-sm">{error}</div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {factorEst && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="font-semibold text-white mb-2">Factor Model (OLS)</h4>
            <p className="text-sm text-slate-400">R²: {(factorEst.r_squared as number[]).map((x) => (x * 100).toFixed(1)).join(', ')}%</p>
          </div>
        )}
        {fm && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="font-semibold text-white mb-2">Fama-MacBeth</h4>
            <p className="text-sm text-slate-400">λ: {(fm.lambdas as number[]).map((x) => x.toFixed(4)).join(', ')}</p>
            <p className="text-sm text-slate-400">t-stats: {(fm.t_stats as number[]).map((x) => x.toFixed(2)).join(', ')}</p>
          </div>
        )}
        {coskew && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="font-semibold text-white mb-2">Coskewness (M2)</h4>
            <p className="text-sm text-slate-400">Portfolio skewness: {(coskew.portfolio_skewness as number).toFixed(4)}</p>
            {coskew.excess_kurtosis_warning && <p className="text-sm text-amber-400">Heavy tails warning</p>}
          </div>
        )}
        {heston && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="font-semibold text-white mb-2">Heston Calibration</h4>
            {heston.error ? (
              <p className="text-sm text-slate-400">{String(heston.error)}</p>
            ) : (
              <p className="text-sm text-slate-400">v0={Number(heston.v0).toFixed(3)} κ={Number(heston.kappa).toFixed(2)} RMSE={Number(heston.rmse).toFixed(4)}</p>
            )}
          </div>
        )}
        {smartBeta && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="font-semibold text-white mb-2">Smart Beta ({smartBeta.method})</h4>
            <p className="text-sm text-slate-400">Weights: {((smartBeta.weights as number[]).map((w) => (w * 100).toFixed(1)).join('% / '))}%</p>
          </div>
        )}
        {crowding && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="font-semibold text-white mb-2">Crowding Risk</h4>
            <p className="text-sm text-slate-400">Index: {(crowding.crowding_index as number).toFixed(3)} | Level: {crowding.level as string}</p>
          </div>
        )}
      </div>
    </div>
  );
};
