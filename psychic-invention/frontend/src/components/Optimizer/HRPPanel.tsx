/**
 * HRP Panel — Hierarchical Risk Parity (M7 L4)
 * Mantegna distance: d(ρ_ij) = √(2(1−ρ_ij))
 * Hierarchical clustering → quasi-diagonalisation → recursive bisection
 * Backend returns: weights[], sort_order[], linkage[][], volatility
 */
import type { ReactNode } from 'react';
import { useOptimizer } from '@/context/OptimizerContext';
import { MathText } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(2) + '%';

// ── Dendrogram SVG ────────────────────────────────────────────────────────────
function Dendrogram({
  n, linkage, sortOrder, labels,
}: {
  n: number;
  linkage: number[][];
  sortOrder: number[];
  labels: string[];
}) {
  if (!linkage.length || !sortOrder.length) return null;

  const W = 560; const H = 240;
  const PAD = { t: 16, r: 20, b: 36, l: 20 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  // x positions indexed by original leaf index (0..N-1)
  const leafX = new Array(n).fill(0);
  sortOrder.forEach((origIdx, pos) => {
    leafX[origIdx] = PAD.l + (pos + 0.5) * innerW / n;
  });

  // clusterX and clusterHeight arrays, size 2N-1
  const clusterX = new Array(2 * n).fill(0);
  const clusterHeight = new Array(2 * n).fill(0);
  for (let i = 0; i < n; i++) { clusterX[i] = leafX[i]; clusterHeight[i] = 0; }

  const heights = linkage.map(r => r[2]);
  const maxH = Math.max(...heights, 1e-10);

  const ty = (h: number) => H - PAD.b - (h / maxH) * innerH;

  linkage.forEach((row, k) => {
    const ci = row[0]; const cj = row[1]; const mergeH = row[2];
    clusterX[n + k] = (clusterX[ci] + clusterX[cj]) / 2;
    clusterHeight[n + k] = mergeH;
  });

  const lines: ReactNode[] = [];
  linkage.forEach((row, k) => {
    const ci = Math.round(row[0]); const cj = Math.round(row[1]); const mergeH = row[2];
    const xi = clusterX[ci]; const xj = clusterX[cj];
    const y  = ty(mergeH);
    const yi = ty(clusterHeight[ci]);
    const yj = ty(clusterHeight[cj]);
    lines.push(
      <line key={`lv${k}`} x1={xi} y1={yi} x2={xi} y2={y} stroke="#6366f1" strokeWidth="1.5" />,
      <line key={`rv${k}`} x1={xj} y1={yj} x2={xj} y2={y} stroke="#6366f1" strokeWidth="1.5" />,
      <line key={`h${k}`}  x1={xi} y1={y}  x2={xj} y2={y}  stroke="#6366f1" strokeWidth="1.5" />,
    );
  });

  // Height ticks on right
  const nTicks = 4;
  const yTicks = Array.from({ length: nTicks + 1 }, (_, i) => (i / nTicks) * maxH);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 240 }}>
      {/* Grid lines */}
      {yTicks.map((h, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={ty(h)} x2={W - PAD.r} y2={ty(h)}
            stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
          <text x={W - PAD.r + 2} y={ty(h) + 3} fontSize="8" fill="#475569">{h.toFixed(2)}</text>
        </g>
      ))}

      {/* Leaf baselines */}
      {sortOrder.map((origIdx, pos) => {
        const x = PAD.l + (pos + 0.5) * innerW / n;
        return (
          <g key={origIdx}>
            <line x1={x} y1={ty(0)} x2={x} y2={H - PAD.b + 4} stroke="#334155" strokeWidth="1" />
            <text x={x} y={H - PAD.b + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {labels[origIdx] ?? String(origIdx)}
            </text>
          </g>
        );
      })}

      {/* Dendrogram arms */}
      {lines}

      {/* Y-axis label */}
      <text x={6} y={H / 2} textAnchor="middle" fontSize="9" fill="#64748b"
        transform={`rotate(-90, 6, ${H / 2})`}>Distance d(ρ)</text>
    </svg>
  );
}

// ── Quasi-diagonalised correlation heatmap ────────────────────────────────────
function SortedHeatmap({
  cov, sortOrder, labels,
}: { cov: number[][]; sortOrder: number[]; labels: string[] }) {
  if (!cov.length || !sortOrder.length) return null;
  const N = sortOrder.length;
  const S = 280; const cellSize = (S - 20) / N;

  // Compute correlation from covariance
  const std = cov.map((row, i) => Math.sqrt(cov[i][i]) || 1);
  const corr = (i: number, j: number) => cov[i][j] / (std[i] * std[j]);

  // colour: blue negative → white zero → red positive
  const colorCell = (v: number) => {
    const c = Math.max(-1, Math.min(1, v));
    if (c >= 0) {
      const r = Math.round(220 + (255 - 220) * (1 - c));
      const g = Math.round(38 + (255 - 38) * (1 - c));
      const b = Math.round(38 + (255 - 38) * (1 - c));
      return `rgb(${r},${g},${b})`;
    } else {
      const abs = Math.abs(c);
      const r = Math.round(38 + (255 - 38) * (1 - abs));
      const g = Math.round(38 + (255 - 38) * (1 - abs));
      const b = Math.round(220 + (255 - 220) * (1 - abs));
      return `rgb(${r},${g},${b})`;
    }
  };

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full" style={{ maxHeight: S }}>
      {sortOrder.map((ri, si) =>
        sortOrder.map((rj, sj) => {
          const v = corr(ri, rj);
          return (
            <rect key={`${si}-${sj}`}
              x={10 + sj * cellSize} y={10 + si * cellSize}
              width={cellSize - 0.5} height={cellSize - 0.5}
              fill={colorCell(v)} opacity={0.85} />
          );
        })
      )}
      {/* Axis labels */}
      {sortOrder.map((origIdx, si) => (
        <text key={origIdx} x={10 + si * cellSize + cellSize / 2} y={8}
          textAnchor="middle" fontSize={Math.min(9, cellSize * 0.7)} fill="#94a3b8">
          {labels[origIdx] ?? origIdx}
        </text>
      ))}
    </svg>
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
export const HRPPanel = () => {
  const { cov, labels, hrpResult, computeHRP, hrpLoading, error } = useOptimizer();

  return (
    <div className="space-y-6">
      {/* Compute */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 flex flex-wrap items-center gap-4">
        <button onClick={computeHRP} disabled={hrpLoading || cov.length === 0}
          className="px-5 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-40 transition flex items-center gap-2">
          {hrpLoading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Computing…</>
            : 'Compute HRP'}
        </button>
        {cov.length === 0 && <p className="text-xs text-amber-400">Load data first.</p>}
        {hrpResult && (
          <span className="text-xs text-slate-400">
            Portfolio σ: <span className="text-white font-mono">{pct(hrpResult.volatility)}</span>
          </span>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {hrpResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dendrogram */}
          <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-400 mb-3">
              Hierarchical clustering dendrogram — assets ordered by correlation structure.
              Y-axis: <MathText text="Mantegna distance $d(\rho) = \sqrt{2(1-\rho)}$." />
            </p>
            <Dendrogram
              n={labels.length}
              linkage={hrpResult.linkage}
              sortOrder={hrpResult.sort_order}
              labels={labels}
            />
          </div>

          {/* Weights + heatmap */}
          <div className="space-y-4">
            <div className="rounded-xl border border-violet-800/40 bg-violet-900/10 p-4">
              <p className="text-xs font-semibold text-violet-300 mb-3">HRP Weights</p>
              <WeightBars weights={hrpResult.weights} labels={labels} />
            </div>
          </div>
        </div>
      )}

      {/* Quasi-diagonalised heatmap (below) */}
      {hrpResult && cov.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs font-semibold text-slate-300 mb-1">Quasi-Diagonalised Correlation Matrix</p>
          <p className="text-xs text-slate-500 mb-3">
            Assets reordered by HRP leaf sequence — note the block-diagonal correlation structure.
          </p>
          <div className="flex justify-center">
            <div style={{ width: '60%' }}>
              <SortedHeatmap cov={cov} sortOrder={hrpResult.sort_order} labels={labels} />
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded" style={{ background: 'rgb(220,38,38)' }} />High ρ
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded bg-white/80" />ρ≈0
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded" style={{ background: 'rgb(38,38,220)' }} />Low ρ
            </span>
          </div>
        </div>
      )}

      {/* Theory note */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">M7 L4 — Hierarchical Risk Parity (López de Prado 2016)</p>
        <p><MathText text="Step 1: Mantegna distance $D_{ij} = \sqrt{2(1-\rho_{ij})}$; apply hierarchical clustering (Ward or single-linkage)." /></p>
        <p><MathText text="Step 2: quasi-diagonalise $\Sigma$ by reordering columns/rows per dendrogram leaf sequence." /></p>
        <p>Step 3: recursive bisection — split cluster, allocate inverse-variance weights proportionally.</p>
        <p><MathText text="Advantages: no $\Sigma^{-1}$ inversion (stable for large $N$), respects hierarchical correlation structure, out-of-sample robust." /></p>
      </div>
    </div>
  );
};
