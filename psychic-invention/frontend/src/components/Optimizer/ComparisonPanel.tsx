/**
 * Comparison Panel — Side-by-side optimizer results (M1 L4 · M3 L1 · M5 L1,L3 · M7 L4)
 * Runs all strategies on the current dataset and compares:
 *   • Weight allocations (heatmap table)
 *   • Risk/return profile (radar-style SVG)
 *   • Sharpe, volatility, expected return
 */
import { useState } from 'react';
import { useOptimizer } from '@/context/OptimizerContext';
import { MathText } from '@/components/ui/Math';

const pct  = (v: number) => (v * 100).toFixed(1) + '%';
const pct2 = (v: number) => (v * 100).toFixed(2) + '%';
const fmt3 = (v: number) => v.toFixed(3);

// ── Radar chart ───────────────────────────────────────────────────────────────
interface RadarSeries {
  label: string;
  color: string;
  values: number[]; // [0,1] normalised on each axis
}

function RadarChart({
  axes, series,
}: { axes: string[]; series: RadarSeries[] }) {
  const W = 320; const H = 320;
  const CX = W / 2; const CY = H / 2; const R = 110;
  const N = axes.length;

  const angle = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const pt = (i: number, r: number) => ({
    x: CX + r * Math.cos(angle(i)),
    y: CY + r * Math.sin(angle(i)),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 280 }}>
      {/* Grid polygons */}
      {gridLevels.map(lvl => {
        const d = axes.map((_, i) => {
          const p = pt(i, R * lvl);
          return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        }).join(' ') + ' Z';
        return <path key={lvl} d={d} fill="none" stroke="#1e293b" strokeWidth="1" />;
      })}

      {/* Spokes */}
      {axes.map((_, i) => {
        const p = pt(i, R);
        return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="#1e293b" strokeWidth="1" />;
      })}

      {/* Axis labels */}
      {axes.map((lbl, i) => {
        const p = pt(i, R + 18);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="#94a3b8">{lbl}</text>
        );
      })}

      {/* Data series */}
      {series.map((s, si) => {
        const d = s.values.map((v, i) => {
          const p = pt(i, R * Math.max(0, Math.min(1, v)));
          return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        }).join(' ') + ' Z';
        return (
          <path key={si} d={d}
            fill={s.color} fillOpacity={0.12}
            stroke={s.color} strokeWidth={1.5} />
        );
      })}

      {/* Legend */}
      {series.map((s, i) => (
        <g key={i} transform={`translate(8, ${H - 12 - i * 14})`}>
          <rect x={0} y={-7} width={10} height={8} rx={2} fill={s.color} />
          <text x={13} y={0} fontSize="9" fill="#94a3b8">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Weight heatmap row ────────────────────────────────────────────────────────
function WeightRow({
  label, values, strategies,
}: { label: string; values: (number | null)[]; strategies: string[] }) {
  const max = Math.max(...values.filter((v): v is number => v !== null), 0.001);
  const COLORS = ['#6366f1','#f59e0b','#10b981','#ec4899','#06b6d4'];
  return (
    <tr className="border-b border-slate-800">
      <td className="py-1.5 pr-3 text-xs font-mono text-slate-300 text-right">{label}</td>
      {values.map((v, si) => (
        <td key={si} className="px-2 py-1.5 text-center">
          {v === null ? (
            <span className="text-slate-600 text-xs">—</span>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <div className="h-2 w-16 bg-slate-800 rounded overflow-hidden">
                <div className="h-full rounded" style={{
                  width: `${(v / max) * 100}%`,
                  background: COLORS[si % COLORS.length],
                }} />
              </div>
              <span className="text-[10px] font-mono text-slate-400">{pct(v)}</span>
            </div>
          )}
        </td>
      ))}
    </tr>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
const STRATEGY_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#06b6d4'];

export const ComparisonPanel = () => {
  const {
    cov, mu, labels, rfRate,
    mvoResult,  computeMVO,  mvoLoading,
    blmResult,  computeBLM,  blmLoading,
    rpResult,   computeRP,   rpLoading,
    hrpResult,  computeHRP,  hrpLoading,
    kellyResult,computeKelly,kellyLoading,
    error,
  } = useOptimizer();

  const [running, setRunning] = useState(false);

  const handleRunAll = async () => {
    if (cov.length === 0) return;
    setRunning(true);
    try {
      const mktW = Array(labels.length).fill(1 / labels.length);
      const P = [Array(labels.length).fill(0).map((_, i) => i === 0 ? 1 : 0)];
      const Q = [mu[0] ?? 0.05];
      await Promise.allSettled([
        computeMVO(),
        computeBLM(mktW, P, Q, 0.025),
        computeRP(0),
        computeHRP(),
        computeKelly(0.5),
      ]);
    } finally {
      setRunning(false);
    }
  };

  const anyLoading = running || mvoLoading || blmLoading || rpLoading || hrpLoading || kellyLoading;

  // Build strategies list
  const strategies = [
    { key: 'mvo', label: 'MVO Tang.', weights: mvoResult?.tangency?.weights ?? null, ret: mvoResult?.tangency?.expected_return ?? null, vol: mvoResult?.tangency?.volatility ?? null },
    { key: 'blm', label: 'BLM', weights: blmResult?.weights ?? null, ret: blmResult?.expected_return ?? null, vol: blmResult?.volatility ?? null },
    { key: 'rp',  label: 'Risk Parity', weights: rpResult?.weights ?? null, ret: null, vol: rpResult?.volatility ?? null },
    { key: 'hrp', label: 'HRP', weights: hrpResult?.weights ?? null, ret: null, vol: hrpResult?.volatility ?? null },
    { key: 'kelly', label: 'Kelly (0.5×)', weights: kellyResult?.weights ?? null, ret: null, vol: null },
  ];

  const hasAny = strategies.some(s => s.weights !== null);

  // Radar series: axes = [Return, 1/Vol (Sharpe proxy), Diversification, Concentration-inv]
  const maxRet = Math.max(...strategies.map(s => s.ret ?? 0), 0.001);
  const minVol = Math.min(...strategies.filter(s => s.vol != null).map(s => s.vol!), 1);
  const maxVol = Math.max(...strategies.filter(s => s.vol != null).map(s => s.vol!), 0.001);

  // Herfindahl concentration: HHI = Σw_i^2; lower = more diversified
  const hhi = (w: number[] | null) => w ? w.reduce((s, wi) => s + wi * wi, 0) : null;
  const maxHHI = Math.max(...strategies.map(s => hhi(s.weights) ?? 0), 0.001);

  const radarSeries: RadarSeries[] = strategies
    .filter(s => s.weights !== null)
    .map((s, si) => ({
      label: s.label,
      color: STRATEGY_COLORS[si % STRATEGY_COLORS.length],
      values: [
        s.ret != null ? s.ret / maxRet : 0,                                   // Return (higher = better)
        s.vol != null ? 1 - (s.vol - minVol) / (maxVol - minVol + 1e-10) : 0, // Low vol = high score
        s.weights != null ? 1 - (hhi(s.weights)! / maxHHI) : 0,               // Diversification
        s.weights != null ? s.weights.filter(w => w > 0.01).length / labels.length : 0, // Breadth
      ],
    }));

  return (
    <div className="space-y-6">
      {/* Run all */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 flex flex-wrap items-center gap-4">
        <button onClick={handleRunAll} disabled={anyLoading || cov.length === 0}
          className="px-5 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-40 transition flex items-center gap-2">
          {anyLoading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Running all…</>
            : 'Run All Strategies'}
        </button>
        {cov.length === 0 && <p className="text-xs text-amber-400">Load data first.</p>}
        <p className="text-xs text-slate-500">
          Runs MVO, Black-Litterman (equal-weight prior, no views), Risk Parity (ERC), HRP, Kelly (½×) simultaneously.
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {/* Status row */}
      <div className="flex flex-wrap gap-2">
        {strategies.map((s, si) => (
          <span key={s.key} className={`px-2.5 py-1 rounded-full text-xs border ${
            s.weights
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}>
            {s.label} {s.weights ? '✓' : '–'}
          </span>
        ))}
      </div>

      {hasAny && (
        <>
          {/* Summary table */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-3">Performance Summary</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-2 text-left text-slate-500 font-normal">Metric</th>
                    {strategies.map((s, si) => (
                      <th key={s.key} className="pb-2 text-center font-semibold"
                        style={{ color: STRATEGY_COLORS[si % STRATEGY_COLORS.length] }}>
                        {s.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-1.5 text-slate-500">E[r] (ann.)</td>
                    {strategies.map((s, si) => (
                      <td key={si} className="py-1.5 text-center font-mono text-white">
                        {s.ret != null ? pct2(s.ret) : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-500">Vol σ (ann.)</td>
                    {strategies.map((s, si) => (
                      <td key={si} className="py-1.5 text-center font-mono text-white">
                        {s.vol != null ? pct2(s.vol) : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-500">Sharpe (est.)</td>
                    {strategies.map((s, si) => (
                      <td key={si} className="py-1.5 text-center font-mono text-white">
                        {s.ret != null && s.vol != null
                          ? fmt3((s.ret - rfRate) / s.vol)
                          : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-500">HHI (conc.)</td>
                    {strategies.map((s, si) => {
                      const h = hhi(s.weights);
                      return (
                        <td key={si} className="py-1.5 text-center font-mono text-white">
                          {h != null ? h.toFixed(3) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-500">Active positions</td>
                    {strategies.map((s, si) => (
                      <td key={si} className="py-1.5 text-center font-mono text-white">
                        {s.weights ? s.weights.filter(w => w > 0.005).length : '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Weight table + Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weight allocation table */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <p className="text-xs font-semibold text-slate-300 mb-3">Weight Allocation by Asset</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-2 text-right pr-3 text-slate-500 text-xs font-normal">Asset</th>
                      {strategies.map((s, si) => (
                        <th key={s.key} className="pb-2 text-center text-xs font-semibold"
                          style={{ color: STRATEGY_COLORS[si % STRATEGY_COLORS.length] }}>
                          {s.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {labels.map((lbl, li) => (
                      <WeightRow
                        key={lbl}
                        label={lbl}
                        strategies={strategies.map(s => s.label)}
                        values={strategies.map(s => s.weights?.[li] ?? null)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Radar chart */}
            {radarSeries.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <p className="text-xs font-semibold text-slate-300 mb-1">Strategy Profile</p>
                <p className="text-[10px] text-slate-500 mb-2">
                  Higher = better on each axis. Vol axis inverted (lower vol → higher score).
                </p>
                <RadarChart
                  axes={['Return', 'Low Vol', 'Diversif.', 'Breadth']}
                  series={radarSeries}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Theory note */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">Strategy Comparison — M1 L4 · M3 L1 · M5 L1,L3 · M7 L4</p>
        <p><MathText text="MVO Tangency: max Sharpe on mean-variance frontier. BLM: equilibrium $\pi +$ views. Risk Parity: ERC ($\rho=0$)." /></p>
        <p><MathText text="HRP: Mantegna clustering + recursive bisection (no $\Sigma^{-1}$). Kelly: $\max\,\mathbb{E}[\ln W]$." /></p>
        <p><MathText text="$\text{HHI} = \sum_i w_i^2$ (Herfindahl-Hirschman index); $1/N$ = perfectly diversified, $1$ = fully concentrated." /></p>
      </div>
    </div>
  );
};
