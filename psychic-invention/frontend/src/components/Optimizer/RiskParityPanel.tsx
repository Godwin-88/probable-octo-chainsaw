/**
 * Risk Parity Panel — ERC / Relaxed Risk Parity (M5 L3)
 * ERC: w_i · (Σw)_i / σ_p = 1/N · σ_p  ∀i  (equal risk contribution)
 * RRP: min ½w^TΣw − ρ·μ^Tw  s.t. Σw_i=1, RC_i proportional (SOCP via CVXPY)
 * ρ=0 → pure ERC, ρ=1 → Sharpe-tilted
 */
import { useState } from 'react';
import { useOptimizer } from '@/context/OptimizerContext';
import { MathText } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(2) + '%';

// ── Risk contribution chart ───────────────────────────────────────────────────
function RCChart({
  labels, rcActual, rcEqual,
}: { labels: string[]; rcActual: number[]; rcEqual: number }) {
  const max = Math.max(...rcActual, rcEqual, 0.001);
  const COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#818cf8','#4f46e5','#7c3aed','#9333ea'];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded inline-block" style={{ background: COLORS[0] }} />Actual RC</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-emerald-500 inline-block" />Target (1/N)</span>
      </div>
      {labels.map((lbl, i) => (
        <div key={lbl} className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300 w-14 text-right">{lbl}</span>
          <div className="flex-1 space-y-0.5">
            <div className="h-3 bg-slate-800 rounded overflow-hidden">
              <div className="h-full rounded transition-all duration-300"
                style={{ width: `${(rcActual[i] / max) * 100}%`, background: COLORS[i % COLORS.length] }} />
            </div>
            <div className="h-2 bg-slate-800 rounded overflow-hidden">
              <div className="h-full rounded bg-emerald-600/60"
                style={{ width: `${(rcEqual / max) * 100}%` }} />
            </div>
          </div>
          <span className="text-xs font-mono text-slate-300 w-16">{pct(rcActual[i])}</span>
        </div>
      ))}
    </div>
  );
}

// ── Weight bars ───────────────────────────────────────────────────────────────
function WeightBars({ weights, labels }: { weights: number[]; labels: string[] }) {
  const max = Math.max(...weights, 0.001);
  const COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#818cf8','#4f46e5','#7c3aed','#9333ea'];
  return (
    <div className="space-y-1.5">
      {labels.map((lbl, i) => (
        <div key={lbl} className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300 w-14 text-right">{lbl}</span>
          <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-300"
              style={{ width: `${(weights[i] / max) * 100}%`, background: COLORS[i % COLORS.length] }} />
          </div>
          <span className="text-xs font-mono text-slate-300 w-14">{pct(weights[i])}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export const RiskParityPanel = () => {
  const { cov, labels, rpResult, computeRP, rpLoading, longOnly, error } = useOptimizer();
  const [rho, setRho] = useState(0.0);

  const N = labels.length;
  const rcEqual = N > 0 ? 1 / N : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-200">Risk Parity Settings</p>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            ρ (return-tilt) = {rho.toFixed(2)}
            <span className="ml-2 text-slate-600">
              {rho === 0 ? '← pure ERC' : rho === 1 ? '← max-Sharpe tilt →' : ''}
            </span>
          </label>
          <input type="range" min="0" max="1" step="0.05" value={rho}
            onChange={e => setRho(parseFloat(e.target.value))}
            className="w-64 accent-emerald-500" />
          <div className="flex justify-between text-[10px] text-slate-600 w-64 mt-0.5">
            <span>ρ=0 ERC</span>
            <span>ρ=1 Sharpe-tilted</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => computeRP(rho)} disabled={rpLoading || cov.length === 0}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-40 transition flex items-center gap-2">
            {rpLoading
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Computing…</>
              : 'Compute Risk Parity'}
          </button>
          {cov.length === 0 && <p className="text-xs text-amber-400">Load data first.</p>}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {rpResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk contributions */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-300">Risk Contributions</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                rpResult.method === 'erc'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-violet-500/10 border-violet-500/30 text-violet-300'
              }`}>
                {rpResult.method?.toUpperCase() ?? 'RP'}
              </span>
            </div>
            <RCChart
              labels={labels}
              rcActual={rpResult.risk_contributions}
              rcEqual={rcEqual}
            />
            {/* RC sum check */}
            <p className="text-[10px] text-slate-600 mt-3">
              <MathText text={`$\Sigma\mathrm{RC}$ = ${rpResult.risk_contributions.reduce((a, b) => a + b, 0).toFixed(4)} (target 1.0)`} />
            </p>
          </div>

          {/* Weights + stats */}
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/10 p-4">
              <p className="text-xs font-semibold text-emerald-300 mb-2">Portfolio Stats</p>
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div><span className="text-slate-500">Volatility σ</span><br /><span className="text-white font-mono">{pct(rpResult.volatility)}</span></div>
                <div><span className="text-slate-500">Long-only</span><br /><span className="text-white font-mono">{longOnly ? 'Yes' : 'No'}</span></div>
              </div>
              <p className="text-xs text-slate-400 mb-2">Weights</p>
              <WeightBars weights={rpResult.weights} labels={labels} />
            </div>

            {/* RC deviation from equal */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-xs">
              <p className="text-slate-400 mb-2">RC deviation from 1/N target</p>
              <div className="grid grid-cols-2 gap-1">
                {labels.map((lbl, i) => {
                  const dev = rpResult.risk_contributions[i] - rcEqual;
                  return (
                    <div key={lbl} className="flex justify-between">
                      <span className="text-slate-500">{lbl}</span>
                      <span className={`font-mono ${Math.abs(dev) < 0.005 ? 'text-emerald-400' : dev > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                        {dev >= 0 ? '+' : ''}{pct(dev)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theory note */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">M5 L3 — Equal Risk Contribution / Relaxed Risk Parity</p>
        <p><MathText text="ERC condition: $\mathrm{RC}_i = w_i(\Sigma w)_i/\sigma_p = \sigma_p/N\;\forall i$. No closed form; solved via iterative (Roncalli 2013) or SOCP." /></p>
        <p><MathText text="RRP: $\min_w \tfrac{1}{2}w^\top\Sigma w - \rho\,\mu^\top w$ s.t. $\sum_i w_i = 1$, second-order cone risk-budget constraints." /></p>
        <p><MathText text="$\rho = 0$: volatility-minimising ERC. $\rho > 0$ tilts toward higher-$\mu$ assets while maintaining approximate equal RC." /></p>
      </div>
    </div>
  );
};
