/**
 * Covariance Matrix Health Panel — TRANSACT_APP_SPEC §3.3.3
 * M7 L1–3: Ledoit-Wolf α_LW, OAS shrinkage, condition number, eigenvalue spectrum,
 *          d(ρ_ij) = √(2(1-ρ_ij)) distance matrix, raw vs shrunk correlation heatmaps.
 */
import { useState } from 'react';
import { useRisk } from '@/context/RiskContext';

// ── Shared heatmap helpers ──────────────────────────────────────────────────
function corrColor(val: number): string {
  const v = Math.max(-1, Math.min(1, val));
  if (v < 0) {
    const t = (v + 1); // 0..1
    return `rgb(${Math.round(59 + 56 * t)},${Math.round(130 + 79 * t)},${Math.round(246 - 50 * t)})`;
  }
  const t = v; // 0..1
  return `rgb(${Math.round(248 - 102 * t)},${Math.round(113 - 49 * t)},${Math.round(113 - 53 * t)})`;
}

function distColor(d: number, maxD: number): string {
  // low distance (correlated) → red, high distance (uncorrelated) → blue
  const t = maxD > 0 ? Math.min(1, d / maxD) : 0;
  return `rgb(${Math.round(59 + 189 * (1 - t))},${Math.round(130 + 50 * (1 - t))},${Math.round(246 - 133 * (1 - t))})`;
}

function textFor(v: number, range: [number, number] = [-1, 1]): string {
  const norm = (v - range[0]) / (range[1] - range[0]);
  return norm > 0.5 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
}

// ── Mini heatmap (SVG-based) ───────────────────────────────────────────────
function CorrelationHeatmap({
  matrix, labels, title, colorFn,
}: {
  matrix: number[][];
  labels: string[];
  title: string;
  colorFn?: (v: number) => string;
}) {
  const N = matrix.length;
  const CELL = Math.max(28, Math.min(48, Math.floor(340 / N)));
  const PAD  = 40;
  const W    = PAD + N * CELL;
  const H    = PAD + N * CELL;

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-400 font-medium mb-2">{title}</p>
      <div className="overflow-x-auto">
        <svg width={W} height={H} className="block">
          {/* Column labels */}
          {labels.map((lbl, j) => (
            <text
              key={`cl${j}`}
              x={PAD + j * CELL + CELL / 2}
              y={PAD - 6}
              textAnchor="middle"
              fontSize={Math.min(10, CELL - 4)}
              fill="#94a3b8"
            >
              {lbl.slice(0, 4)}
            </text>
          ))}
          {/* Row labels */}
          {labels.map((lbl, i) => (
            <text
              key={`rl${i}`}
              x={PAD - 4}
              y={PAD + i * CELL + CELL / 2 + 4}
              textAnchor="end"
              fontSize={Math.min(10, CELL - 4)}
              fill="#94a3b8"
            >
              {lbl.slice(0, 4)}
            </text>
          ))}
          {/* Cells */}
          {matrix.map((row, i) =>
            row.map((val, j) => {
              const color  = colorFn ? colorFn(val) : corrColor(val);
              const tColor = textFor(val);
              return (
                <g key={`${i}-${j}`}>
                  <rect
                    x={PAD + j * CELL}
                    y={PAD + i * CELL}
                    width={CELL - 1}
                    height={CELL - 1}
                    fill={color}
                    rx={2}
                  >
                    <title>{`${labels[i]}–${labels[j]}: ${val.toFixed(3)}`}</title>
                  </rect>
                  {CELL >= 32 && (
                    <text
                      x={PAD + j * CELL + CELL / 2}
                      y={PAD + i * CELL + CELL / 2 + 4}
                      textAnchor="middle"
                      fontSize={9}
                      fill={tColor}
                    >
                      {val.toFixed(2)}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
}

// ── Eigenvalue bar chart ───────────────────────────────────────────────────
function EigenSpectrum({ values, fracs }: { values: number[]; fracs: number[] }) {
  const maxEig = values[0] ?? 1;
  const BAR_H = 18;
  const W = 320;

  return (
    <div>
      <p className="text-xs text-slate-400 font-medium mb-2">
        Eigenvalue Spectrum (descending) — explains systematic risk factors
      </p>
      <svg width={W + 80} height={values.length * (BAR_H + 4) + 4} className="block">
        {values.map((eig, i) => {
          const barW = maxEig > 0 ? (eig / maxEig) * W : 0;
          const cumPct = fracs.slice(0, i + 1).reduce((a, b) => a + b, 0);
          return (
            <g key={i} transform={`translate(0,${i * (BAR_H + 4)})`}>
              <text x={0} y={BAR_H - 4} fontSize={10} fill="#94a3b8">
                λ{i + 1}
              </text>
              <rect x={24} y={0} width={barW} height={BAR_H} rx={3} fill="#6366f1" opacity={0.7 + 0.3 * (1 - i / values.length)} />
              <text x={24 + barW + 4} y={BAR_H - 4} fontSize={10} fill="#cbd5e1">
                {eig.toFixed(4)} ({(fracs[i] * 100).toFixed(1)}% · cum {(cumPct * 100).toFixed(0)}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const CovarianceHealthPanel = () => {
  const {
    returns, labels, usingDemo,
    covHealth, computeCovHealth, loading, error,
  } = useRisk();

  const [activeHeatmap, setActiveHeatmap] = useState<'raw' | 'lw' | 'oas' | 'dist'>('raw');

  const N = returns[0]?.length ?? 0;
  const T = returns.length;

  const condColor = covHealth
    ? covHealth.is_ill_conditioned
      ? 'text-red-400 border-red-700 bg-red-900/20'
      : covHealth.condition_number > 100
        ? 'text-amber-300 border-amber-700 bg-amber-900/20'
        : 'text-emerald-300 border-emerald-700 bg-emerald-900/20'
    : '';

  const maxDist = covHealth
    ? Math.max(...covHealth.distance_matrix.flat())
    : Math.sqrt(2);

  return (
    <div className="space-y-6">
      {/* ── Header card ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Covariance Matrix Health</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              M7 L1–3 · Ledoit-Wolf &amp; OAS shrinkage · Condition number · Eigenspectrum · MST distances
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-full border ${usingDemo
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              {usingDemo ? '⚠ Demo' : '✓ Custom'}
            </span>
            <span className="text-slate-500">{T} obs · {N} assets</span>
          </div>
        </div>

        {/* Formula note */}
        <div className="mb-4 rounded-lg bg-slate-800/50 border border-slate-700 p-3 text-xs font-mono text-slate-400">
          <span className="text-indigo-400">Shrinkage target:</span> Σ̂_LW = (1−α)·S + α·μ·I &nbsp;|&nbsp;
          <span className="text-indigo-400">Distance:</span> d(ρᵢⱼ) = √(2(1−ρᵢⱼ)) &nbsp;|&nbsp;
          <span className="text-indigo-400">Ill-conditioned:</span> κ(Σ) = λ_max/λ_min {'>'} 1000
        </div>

        <button
          onClick={computeCovHealth}
          disabled={loading.covHealth}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition"
        >
          {loading.covHealth ? 'Analysing…' : 'Analyse Covariance Matrix'}
        </button>

        {error && (
          <div className="mt-3 rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {covHealth && (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Condition number */}
            <div className={`rounded-xl border p-4 ${condColor}`}>
              <p className="text-xs font-medium opacity-80">Condition Number κ(Σ)</p>
              <p className="text-2xl font-black mt-1">
                {covHealth.condition_number >= 1e6
                  ? `${(covHealth.condition_number / 1e6).toFixed(1)}M`
                  : covHealth.condition_number >= 1000
                    ? `${(covHealth.condition_number / 1000).toFixed(1)}k`
                    : covHealth.condition_number.toFixed(1)}
              </p>
              <p className="text-xs mt-1 opacity-70">
                {covHealth.is_ill_conditioned
                  ? '⚠ Ill-conditioned (>1000) — inversion unstable'
                  : covHealth.condition_number > 100
                    ? '⚡ Moderate — shrinkage recommended'
                    : '✓ Well-conditioned'}
              </p>
            </div>

            {/* LW shrinkage */}
            <div className="rounded-xl border border-indigo-700 bg-indigo-900/20 p-4">
              <p className="text-xs font-medium text-indigo-300">Ledoit-Wolf α</p>
              <p className="text-2xl font-black text-white mt-1">
                {(covHealth.lw_shrinkage * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-indigo-300 mt-1 opacity-70">
                {covHealth.lw_shrinkage > 0.5
                  ? 'High shrinkage — few observations'
                  : covHealth.lw_shrinkage > 0.2
                    ? 'Moderate shrinkage intensity'
                    : 'Low shrinkage — sample is informative'}
              </p>
            </div>

            {/* OAS shrinkage */}
            <div className="rounded-xl border border-violet-700 bg-violet-900/20 p-4">
              <p className="text-xs font-medium text-violet-300">OAS α</p>
              <p className="text-2xl font-black text-white mt-1">
                {(covHealth.oas_shrinkage * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-violet-300 mt-1 opacity-70">Oracle Approximating Shrinkage</p>
            </div>

            {/* Assets / observations */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-xs font-medium text-slate-400">Sample ratio T/N</p>
              <p className="text-2xl font-black text-white mt-1">
                {(covHealth.n_obs / covHealth.n_assets).toFixed(0)}×
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {covHealth.n_obs} obs / {covHealth.n_assets} assets
                {covHealth.n_obs / covHealth.n_assets < 10
                  ? ' — thin sample, high shrinkage needed'
                  : ''}
              </p>
            </div>
          </div>

          {/* Eigenvalue spectrum */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <EigenSpectrum
              values={covHealth.eigenvalues}
              fracs={covHealth.eigenvalue_fractions}
            />
            <p className="text-xs text-slate-500 mt-3">
              Random Matrix Theory (Marchenko–Pastur): eigenvalues significantly above the upper bound
              λ+ = σ²(1 + √(N/T))² may represent genuine market factors rather than noise.
            </p>
          </div>

          {/* Correlation heatmaps */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <h4 className="text-sm font-semibold text-white">Correlation Matrices</h4>
              <div className="flex gap-1.5 ml-auto">
                {(['raw', 'lw', 'oas', 'dist'] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setActiveHeatmap(k)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition ${
                      activeHeatmap === k
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {k === 'raw' ? 'Raw ρ' : k === 'lw' ? 'LW ρ' : k === 'oas' ? 'OAS ρ' : 'Distance d'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              {activeHeatmap === 'raw' && (
                <CorrelationHeatmap
                  matrix={covHealth.raw_correlation}
                  labels={labels}
                  title="Raw sample correlation ρ̂ᵢⱼ = Σᵢⱼ / (σᵢ σⱼ)"
                />
              )}
              {activeHeatmap === 'lw' && (
                <CorrelationHeatmap
                  matrix={covHealth.lw_correlation}
                  labels={labels}
                  title="Ledoit-Wolf shrunk correlation"
                />
              )}
              {activeHeatmap === 'oas' && (
                <CorrelationHeatmap
                  matrix={covHealth.oas_correlation}
                  labels={labels}
                  title="OAS shrunk correlation"
                />
              )}
              {activeHeatmap === 'dist' && (
                <CorrelationHeatmap
                  matrix={covHealth.distance_matrix}
                  labels={labels}
                  title="Correlation distance d(ρᵢⱼ) = √(2(1−ρᵢⱼ)) — used for MST"
                  colorFn={v => distColor(v, maxDist)}
                />
              )}
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Hover cells for exact values. LW/OAS matrices are more stable estimators when T is close to N.
            </p>
          </div>

          {/* Side-by-side raw vs LW */}
          {covHealth.n_assets <= 8 && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
              <h4 className="text-sm font-semibold text-white mb-4">Raw vs Ledoit-Wolf — Side-by-Side</h4>
              <div className="flex gap-6 flex-wrap">
                <CorrelationHeatmap
                  matrix={covHealth.raw_correlation}
                  labels={labels}
                  title="Raw ρ"
                />
                <CorrelationHeatmap
                  matrix={covHealth.lw_correlation}
                  labels={labels}
                  title="Shrunk ρ (Ledoit-Wolf)"
                />
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Shrinkage pulls off-diagonal entries toward zero, reducing estimation error.
                The diagonal remains 1.0 in both matrices.
              </p>
            </div>
          )}
        </>
      )}

      {!covHealth && !loading.covHealth && !error && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center text-slate-500 text-sm">
          Click <span className="text-white font-medium">Analyse Covariance Matrix</span> to compute shrinkage intensities,
          condition number, and eigenvalue spectrum.
        </div>
      )}
    </div>
  );
};
