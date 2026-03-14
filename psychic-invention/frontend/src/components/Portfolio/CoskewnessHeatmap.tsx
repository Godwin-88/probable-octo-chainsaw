/**
 * Higher-Order Statistics Panel — Menu 2.4 (TRANSACT_APP_SPEC §3.2.4)
 * M2 L2: Coskewness M₃, portfolio skewness via Kronecker product, cokurtosis warning.
 * γ_{XYZ} = E[(X-μ_X)(Y-μ_Y)(Z-μ_Z)] / (σ_X σ_Y σ_Z)
 */
import { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { postPortfolioCoskewness } from '@/utils/api';
import { downloadFile, generateFilename } from '@/utils/export';

interface CoskewnessResult {
  portfolio_skewness: number;
  excess_kurtosis_warning: boolean;
  coskewness_matrix: number[][];
}

function heatColor(val: number): string {
  const v = Math.max(-1, Math.min(1, val));
  if (v < 0) {
    const t = (v + 1) / 2;
    return `rgb(${Math.round(59 + (99 - 59) * t)}, ${Math.round(130 + (179 - 130) * t)}, ${Math.round(246 + (255 - 246) * t)})`;
  }
  const t = v;
  return `rgb(${Math.round(251 - (251 - 146) * t)}, ${Math.round(146 + (64 - 146) * t)}, ${Math.round(60 + (50 - 60) * t)})`;
}

function textColorForBg(val: number): string {
  return Math.abs(val) > 0.4 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.75)';
}

function generateDemoReturns(n: number): number[][] {
  const T = 60;
  return Array.from({ length: T }, () =>
    Array.from({ length: n }, () => (Math.random() - 0.5) * 0.04)
  );
}

export const CoskewnessHeatmap = () => {
  const { assets, returns: ctxReturns, moments } = usePortfolio();
  const [result, setResult] = useState<CoskewnessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localWeights, setLocalWeights] = useState<number[] | null>(null);

  const symbols = assets.map(a => a.symbol);
  const weights = localWeights ?? assets.map(a => a.weight);

  const normalize = (w: number[]) => {
    const s = w.reduce((a, b) => a + b, 0);
    return s > 0 ? w.map(x => x / s) : w;
  };

  const handleWeightChange = (i: number, v: number) => {
    const next = [...weights];
    next[i] = Math.max(0, v);
    setLocalWeights(normalize(next));
  };

  const handleCompute = async () => {
    if (assets.length < 2) {
      setError('Add at least 2 assets in Asset Universe before computing coskewness.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const n = assets.length;
      const returnsToUse: number[][] = ctxReturns ?? generateDemoReturns(n);
      // Always ensure weights length matches the number of assets
      const baseWeights = weights.length === n ? weights : Array(n).fill(1 / n);
      const norm = normalize(baseWeights);
      const res = await postPortfolioCoskewness({ returns: returnsToUse, weights: norm });
      setResult(res as CoskewnessResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Coskewness computation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!result) return;
    downloadFile(JSON.stringify({ timestamp: new Date().toISOString(), symbols, weights, ...result }, null, 2),
      generateFilename('portfolio_coskewness', 'json'), 'application/json');
  };

  const handleExportCSV = () => {
    if (!result) return;
    const rows = [
      ['Metric', 'Value'],
      ['Portfolio Skewness', result.portfolio_skewness.toFixed(6)],
      ['Excess Kurtosis Warning', String(result.excess_kurtosis_warning)],
      [], ['Coskewness Matrix (M3)'], [symbols.join(',')],
      ...result.coskewness_matrix.map(r => r.map(v => v.toFixed(6)).join(',')),
    ];
    downloadFile(rows.map(r => (Array.isArray(r) ? r.join(',') : r)).join('\n'),
      generateFilename('portfolio_coskewness', 'csv'), 'text/csv');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white">Higher-Order Statistics</h3>
        <p className="text-xs text-slate-500 mt-0.5">M2 L2 · Coskewness M₃ heatmap, portfolio skewness via Kronecker product, heavy-tail flag</p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">
            Sensitivity Analysis Weights
            {ctxReturns && <span className="ml-2 text-xs text-emerald-400 font-normal">Using {ctxReturns.length}d market returns</span>}
            {!ctxReturns && <span className="ml-2 text-xs text-amber-400 font-normal">Demo returns (fetch data in Asset Universe)</span>}
          </h4>
          {localWeights && (
            <button onClick={() => setLocalWeights(null)} className="text-xs text-blue-400 hover:text-blue-300 underline">
              Reset to portfolio weights
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {symbols.map((sym, i) => (
            <div key={sym}>
              <label className="block text-xs text-slate-400 mb-1">{sym}</label>
              <input
                type="number" min={0} max={1} step={0.01}
                value={(weights[i] ?? 0).toFixed(3)}
                onChange={e => handleWeightChange(i, parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-white text-sm text-right focus:outline-none focus:border-purple-500"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCompute}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-medium text-sm disabled:opacity-50 transition-colors"
          >
            {loading ? '⟳ Computing…' : '⚡ Compute Coskewness M₃'}
          </button>
          <span className="text-xs text-slate-500">
            Sum: {(weights.reduce((a, b) => a + b, 0)).toFixed(3)}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/60 bg-red-900/20 px-4 py-3 text-red-300 text-sm">{error}</div>
      )}

      {!result && !loading && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-10 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl">🔮</div>
          <div>
            <p className="text-base font-bold text-white">Click Compute to calculate M₃</p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              Uses real market returns if fetched. Otherwise uses demo data for illustration.
            </p>
          </div>
          <div className="text-xs text-slate-600 font-mono">skew_p = w^T M₃ (w⊗w)</div>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Portfolio Skewness</p>
              <p className="text-[10px] text-slate-600 font-mono mt-0.5">skew_p = w^T M₃ (w⊗w)</p>
              <p className={`text-2xl font-mono font-bold mt-1 ${result.portfolio_skewness < -0.3 ? 'text-red-400' : result.portfolio_skewness > 0.3 ? 'text-emerald-400' : 'text-white'}`}>
                {result.portfolio_skewness.toFixed(4)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {result.portfolio_skewness < -0.3 ? 'Negative: correlated downside — tail risk'
                  : result.portfolio_skewness > 0.3 ? 'Positive: correlated upside — favourable'
                  : 'Near-symmetric coskewness'}
              </p>
            </div>

            <div className={`rounded-xl border p-4 ${result.excess_kurtosis_warning ? 'border-red-700/60 bg-red-900/10' : 'border-slate-700 bg-slate-800/50'}`}>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Kurtosis Warning</p>
              <p className={`text-2xl font-bold mt-2 ${result.excess_kurtosis_warning ? 'text-red-400' : 'text-emerald-400'}`}>
                {result.excess_kurtosis_warning ? '⚠ Heavy Tails' : '✓ Normal-like'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {result.excess_kurtosis_warning
                  ? 'κ > 1: normal-based VaR will underestimate tail losses'
                  : 'Tail weight within normal range'}
              </p>
            </div>

            {moments && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Comparison</p>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Moments skew:</span>
                    <span className="font-mono text-white">{moments.skewness.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">M₃ skew:</span>
                    <span className="font-mono text-purple-400">{result.portfolio_skewness.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Excess kurt:</span>
                    <span className={`font-mono ${moments.kurtosis_excess > 1 ? 'text-red-400' : 'text-white'}`}>{moments.kurtosis_excess.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Heatmap */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Coskewness Matrix M₃</h4>
                <p className="text-xs text-slate-500 mt-0.5">γ_ij = E[(r_i−μ_i)(r_j−μ_j)(r_p−μ_p)] / (σ_i·σ_j·σ_p)</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleExportCSV} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs">CSV</button>
                <button onClick={handleExportJSON} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs">JSON</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-slate-600 bg-slate-800/80 p-2 text-slate-400 text-xs" />
                    {symbols.map(s => (
                      <th key={s} className="border border-slate-600 bg-slate-800/80 p-2 text-slate-300 text-xs font-mono">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.coskewness_matrix.map((row, i) => (
                    <tr key={i}>
                      <td className="border border-slate-600 bg-slate-800/50 p-2 text-slate-400 font-mono text-xs font-medium">{symbols[i]}</td>
                      {row.map((val, j) => (
                        <td
                          key={j}
                          className="border border-slate-600 p-2 font-mono text-center text-xs"
                          style={{ backgroundColor: heatColor(val), color: textColorForBg(val) }}
                          title={`γ(${symbols[i]}, ${symbols[j]}) = ${val.toFixed(6)}`}
                        >
                          {val.toFixed(3)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <span className="text-xs text-slate-500">Negative</span>
              <div className="flex-1 h-3 rounded" style={{ background: 'linear-gradient(to right, rgb(59,130,246), rgb(148,163,184), rgb(251,146,60))' }} />
              <span className="text-xs text-slate-500">Positive</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Blue = negative coskewness (correlated crash risk). Orange = positive (correlated upside).
            </p>
          </div>

          {/* Theory */}
          <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">M2 L2 Theory</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
              <div>
                <p className="text-slate-300 font-semibold mb-1">Coskewness M₃ (N×N matrix)</p>
                <p>γ_XYZ = E[(X-μ)(Y-μ)(Z-μ)]/(σ_X σ_Y σ_Z). Portfolio skewness = w^T M₃ (w⊗w). Negative diagonal entries flag assets that amplify portfolio downturns.</p>
              </div>
              <div>
                <p className="text-slate-300 font-semibold mb-1">Cokurtosis M₄ Warning</p>
                <p>When excess kurtosis &gt; 1, the tails are fatter than a normal. Parametric 99% VaR will underestimate true losses — use t-distribution or historical simulation instead.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
