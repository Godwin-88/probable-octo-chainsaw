/**
 * Probabilistic Scenario Optimisation Panel — M3 L4
 * (Shadabfar & Cheng 2020 / Sun et al. 2015)
 *
 * The investor specifies K market scenarios {r_k, p_k}.
 * Probability-weighted expected return:
 *   E[r] = Σ_{k=1}^{K} p_k · r_k          (N-vector)
 *
 * Probability-weighted covariance:
 *   Σ = Σ_{k=1}^{K} p_k · (r_k − E[r])(r_k − E[r])^T
 *
 * Optimisation (min-variance with return floor):
 *   min   w^T Σ w
 *   s.t.  w^T E[r] ≥ target,  Σ w_i = 1,  w_i ≥ 0
 *
 * Ref: M3 L4 Lesson Notes — Probabilistic Scenario Optimisation
 */
import { useState } from 'react';
import { useScenariosContext } from '@/context/ScenariosContext';
import { MathText } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(2) + '%';

// ── Weight bar chart ──────────────────────────────────────────────────────────
function WeightChart({ labels, weights, equalWeights }: {
  labels: string[]; weights: number[]; equalWeights: number[];
}) {
  const N = labels.length;
  if (!N) return null;
  const W = 560; const H = 130;
  const pad = { l: 8, r: 8, t: 16, b: 28 };
  const maxW = Math.max(...weights, ...equalWeights, 0.01) * 1.2;
  const bw = (W - pad.l - pad.r) / (N * 2.5);
  const fy = (v: number) => H - pad.b - (v / maxW) * (H - pad.t - pad.b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {[0.25, 0.5, 0.75, 1].map(t => {
        const y = fy(t * maxW);
        return (
          <g key={t}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
            <text x={pad.l} y={y - 2} fontSize="7" fill="#64748b">{pct(t * maxW)}</text>
          </g>
        );
      })}
      {labels.map((lbl, i) => {
        const x0 = pad.l + i * bw * 2.5;
        const psoH = weights[i] * (H - pad.t - pad.b) / maxW;
        const ewH  = equalWeights[i] * (H - pad.t - pad.b) / maxW;
        return (
          <g key={i}>
            <rect x={x0} y={H - pad.b - psoH} width={bw} height={Math.max(psoH, 1)} fill="#f43f5e" opacity={0.85} />
            <rect x={x0 + bw + 1} y={H - pad.b - ewH} width={bw} height={Math.max(ewH, 1)} fill="#475569" opacity={0.7} />
            <text x={x0 + bw} y={H - pad.b + 12} textAnchor="middle" fontSize="7" fill="#94a3b8">{lbl}</text>
          </g>
        );
      })}
      <rect x={W - 120} y={6} width={8} height={6} fill="#f43f5e" opacity={0.85} />
      <text x={W - 109} y={12} fontSize="7" fill="#94a3b8">PSO Optimal</text>
      <rect x={W - 120} y={16} width={8} height={6} fill="#475569" opacity={0.7} />
      <text x={W - 109} y={22} fontSize="7" fill="#94a3b8">Equal-Weight</text>
    </svg>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export const ProbabilisticPanel = () => {
  const {
    labels, returnMatrix,
    probResult, probLoading, computeProbabilistic, error,
  } = useScenariosContext();

  const hasData = returnMatrix.length > 0;
  const N = labels.length || 3;

  // K scenario builder — default 3 scenarios
  const [K, setK] = useState(3);
  // scenarioReturns[k][i] = expected return of asset i under scenario k
  const [scenarioReturns, setScenarioReturns] = useState<number[][]>(() =>
    [[0.08, 0.12, 0.06].slice(0, N), [-0.05, -0.02, 0.01].slice(0, N), [0.02, 0.03, 0.02].slice(0, N)]
  );
  const [scenarioProbs, setScenarioProbs] = useState<number[]>([0.50, 0.30, 0.20]);
  const [targetReturn, setTargetReturn]   = useState(0.05);
  const [longOnly, setLongOnly]           = useState(true);

  // Ensure arrays are sized correctly
  const adjustedK = Math.max(2, Math.min(K, 6));
  const scRets = Array.from({ length: adjustedK }, (_, k) =>
    Array.from({ length: N }, (_, i) => scenarioReturns[k]?.[i] ?? 0)
  );
  const scProbs = Array.from({ length: adjustedK }, (_, k) => scenarioProbs[k] ?? (1 / adjustedK));
  const probSum = scProbs.reduce((s, p) => s + p, 0);
  const normalizedProbs = scProbs.map(p => p / probSum);

  // E[r] per asset from PSO formula
  const expRet = Array.from({ length: N }, (_, i) =>
    scRets.reduce((s, rk, k) => s + normalizedProbs[k] * rk[i], 0)
  );

  const equalW = Array(N).fill(1 / N);
  const psoW   = probResult?.weights ?? [];

  const runPSO = () => {
    computeProbabilistic(scRets, normalizedProbs, targetReturn / 100, longOnly);
  };

  const updateScenRet = (k: number, i: number, val: number) => {
    setScenarioReturns(prev => {
      const next = prev.map(row => [...row]);
      if (!next[k]) next[k] = Array(N).fill(0);
      next[k][i] = val;
      return next;
    });
  };
  const updateProb = (k: number, val: number) => {
    setScenarioProbs(prev => {
      const next = [...prev];
      next[k] = val;
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="rounded-xl border border-rose-700/40 bg-rose-900/10 p-4 text-rose-300 text-sm">
          Load assets above. PSO uses probability-weighted scenario returns to optimise portfolio weights.
        </div>
      )}

      {/* Scenario builder */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">Scenario Builder</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Define K market scenarios · Assign probabilities (must sum to 1)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Scenarios K</label>
              <div className="flex gap-1">
                {[2, 3, 4, 5].map(k => (
                  <button key={k} onClick={() => setK(k)}
                    className={`px-2.5 py-1 rounded text-xs transition ${
                      adjustedK === k ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                    }`}>{k}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-700">
                <th className="pb-2 text-left font-medium">Scenario</th>
                <th className="pb-2 text-right font-medium">Prob (pₖ)</th>
                {labels.map(lbl => (
                  <th key={lbl} className="pb-2 text-right font-medium">{lbl} r (%)</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {Array.from({ length: adjustedK }, (_, k) => (
                <tr key={k}>
                  <td className="py-2 text-slate-300 font-medium">S{k + 1}</td>
                  <td className="py-2 text-right">
                    <input
                      type="number" step="0.05" min={0} max={1}
                      value={scProbs[k]?.toFixed(2) ?? '0.00'}
                      onChange={e => updateProb(k, parseFloat(e.target.value) || 0)}
                      className="w-16 rounded bg-slate-800 border border-slate-700 text-white text-right px-1 py-0.5 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </td>
                  {labels.map((_, i) => (
                    <td key={i} className="py-2 text-right">
                      <input
                        type="number" step="1" min={-50} max={100}
                        value={Math.round((scRets[k]?.[i] ?? 0) * 100)}
                        onChange={e => updateScenRet(k, i, (parseFloat(e.target.value) || 0) / 100)}
                        className="w-16 rounded bg-slate-800 border border-slate-700 text-white text-right px-1 py-0.5 text-xs focus:outline-none focus:border-rose-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              {/* E[r] row */}
              <tr className="bg-slate-800/40">
                <td className="py-2 text-rose-300 font-semibold">E[r] = Σ pₖrₖ</td>
                <td className="py-2 text-right text-slate-500 text-[10px]">
                  {pct(normalizedProbs.reduce((s, p) => s + p, 0))} total
                </td>
                {expRet.map((r, i) => (
                  <td key={i} className={`py-2 text-right font-mono font-semibold ${r >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pct(r)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
              Target Return (%/period)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={-5} max={30} step={0.5}
                value={targetReturn}
                onChange={e => setTargetReturn(parseFloat(e.target.value))}
                className="w-32 accent-rose-500"
              />
              <span className="text-rose-300 font-mono text-sm w-12">{targetReturn.toFixed(1)}%</span>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input type="checkbox" checked={longOnly} onChange={e => setLongOnly(e.target.checked)}
              className="accent-rose-500" />
            Long-only (w ≥ 0)
          </label>
          <button
            onClick={runPSO}
            disabled={probLoading || !hasData}
            className="px-4 py-1.5 rounded-lg bg-rose-700 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-40 transition flex items-center gap-2"
          >
            {probLoading
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Optimising…</>
              : 'Run PSO'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Results */}
      {psoW.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-800/40 bg-rose-900/10 p-4">
            <p className="text-sm font-semibold text-rose-300 mb-3">PSO Optimal Weights</p>

            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 mb-4">
              <p className="text-xs text-slate-500 mb-3">Amber = PSO optimal · Grey = 1/N equal-weight</p>
              <WeightChart labels={labels} weights={psoW} equalWeights={equalW} />
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="pb-2 text-left font-medium">Asset</th>
                  <th className="pb-2 text-right font-medium">E[rᵢ]</th>
                  <th className="pb-2 text-right font-medium">PSO wᵢ</th>
                  <th className="pb-2 text-right font-medium">Equal wᵢ</th>
                  <th className="pb-2 text-right font-medium">Active Tilt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {labels.map((lbl, i) => {
                  const tilt = (psoW[i] ?? 0) - equalW[i];
                  return (
                    <tr key={i}>
                      <td className="py-1.5 font-mono text-white">{lbl}</td>
                      <td className={`py-1.5 text-right font-mono ${expRet[i] >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pct(expRet[i])}
                      </td>
                      <td className="py-1.5 text-right font-mono text-rose-300">{pct(psoW[i] ?? 0)}</td>
                      <td className="py-1.5 text-right font-mono text-slate-500">{pct(equalW[i])}</td>
                      <td className={`py-1.5 text-right font-mono ${tilt > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tilt > 0 ? '+' : ''}{pct(tilt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Theory */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">Probabilistic Scenario Optimisation (M3 L4)</p>
        <p><MathText text="$\mathbb{E}[r] = \sum_{k} p_k \cdot r_k$ — probability-weighted expected return vector ($N \times 1$)." /></p>
        <p><MathText text="$\Sigma = \sum_{k} p_k \cdot (r_k - \mathbb{E}[r])(r_k - \mathbb{E}[r])^\top$ — scenario-weighted covariance matrix." /></p>
        <p><MathText text="Optimise: $\min_w w^\top\Sigma w$ s.t. $w^\top\mathbb{E}[r] \geq \text{target}$, $\sum_i w_i = 1$, $w_i \geq 0$ — QP solved by ECOS." /></p>
        <p>Interpreting PSO: concentrates weight toward high E[r] assets whose variability across scenarios is low.</p>
      </div>
    </div>
  );
};
