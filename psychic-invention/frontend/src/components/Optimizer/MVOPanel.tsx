/**
 * MVO Panel — Mean-Variance Optimization (M1 L4)
 * Efficient frontier (QP via CVXPY), GMV, Tangency portfolios.
 * SVG scatter chart: σ (x) vs E[r] (y). Click point → show weights.
 */
import { useState, useEffect } from 'react';
import { useOptimizer, type FrontierPoint } from '@/context/OptimizerContext';
import { MathBlock } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(2) + '%';
const fmt2 = (v: number) => v.toFixed(4);

// ── Pure-SVG frontier chart ───────────────────────────────────────────────────
function FrontierChart({
  frontier, gmv, tangency, selected, onSelect, rfRate,
}: {
  frontier: FrontierPoint[];
  gmv: { expected_return: number; volatility: number };
  tangency: { expected_return: number; volatility: number };
  selected: number | null;
  onSelect: (i: number) => void;
  rfRate: number;
}) {
  if (frontier.length === 0) return null;

  const W = 560; const H = 320; const PAD = { t: 20, r: 20, b: 48, l: 56 };
  const xs = frontier.map(p => p.volatility);
  const ys = frontier.map(p => p.expected_return);
  const xMin = Math.min(...xs) * 0.95; const xMax = Math.max(...xs) * 1.05;
  const yMin = Math.min(...ys, rfRate) * 0.95; const yMax = Math.max(...ys) * 1.05;

  const tx = (v: number) => PAD.l + ((v - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const ty = (v: number) => H - PAD.b - ((v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  // Capital Allocation Line: from rf through tangency (extend right)
  const calX2 = xMax;
  const calY2 = rfRate + ((tangency.expected_return - rfRate) / tangency.volatility) * calX2;

  // Y-axis ticks
  const nTicks = 5;
  const yTicks = Array.from({ length: nTicks + 1 }, (_, i) => yMin + (i / nTicks) * (yMax - yMin));
  const xTicks = Array.from({ length: nTicks + 1 }, (_, i) => xMin + (i / nTicks) * (xMax - xMin));

  const frontierPath = frontier.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${tx(p.volatility).toFixed(1)} ${ty(p.expected_return).toFixed(1)}`
  ).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 320 }}>
      {/* Grid */}
      {yTicks.map((y, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={ty(y)} x2={W - PAD.r} y2={ty(y)} stroke="#1e293b" strokeWidth="1" />
          <text x={PAD.l - 6} y={ty(y) + 4} textAnchor="end" fontSize="10" fill="#64748b">
            {pct(y)}
          </text>
        </g>
      ))}
      {xTicks.map((x, i) => (
        <g key={i}>
          <line x1={tx(x)} y1={PAD.t} x2={tx(x)} y2={H - PAD.b} stroke="#1e293b" strokeWidth="1" />
          <text x={tx(x)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="#64748b">
            {pct(x)}
          </text>
        </g>
      ))}

      {/* Axis labels */}
      <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="#94a3b8">Volatility (σ)</text>
      <text x={14} y={H / 2} textAnchor="middle" fontSize="11" fill="#94a3b8"
        transform={`rotate(-90, 14, ${H / 2})`}>E[r] (ann.)</text>

      {/* CAL */}
      <line x1={tx(0)} y1={ty(rfRate)} x2={tx(calX2)} y2={ty(calY2)}
        stroke="#f59e0b" strokeWidth="1" strokeDasharray="5,3" opacity="0.6" />

      {/* Frontier curve */}
      <path d={frontierPath} fill="none" stroke="#6366f1" strokeWidth="2" />

      {/* Frontier dots */}
      {frontier.map((p, i) => (
        <circle key={i} cx={tx(p.volatility)} cy={ty(p.expected_return)} r={selected === i ? 6 : 4}
          fill={selected === i ? '#f59e0b' : '#6366f1'} opacity={selected === i ? 1 : 0.5}
          className="cursor-pointer hover:opacity-100"
          onClick={() => onSelect(i)} />
      ))}

      {/* GMV */}
      <circle cx={tx(gmv.volatility)} cy={ty(gmv.expected_return)} r={7}
        fill="#10b981" stroke="#064e3b" strokeWidth="2" />
      <text x={tx(gmv.volatility) + 10} y={ty(gmv.expected_return) - 4} fontSize="10" fill="#10b981">GMV</text>

      {/* Tangency */}
      <circle cx={tx(tangency.volatility)} cy={ty(tangency.expected_return)} r={7}
        fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
      <text x={tx(tangency.volatility) + 10} y={ty(tangency.expected_return) - 4} fontSize="10" fill="#f59e0b">Tang.</text>
    </svg>
  );
}

// ── Weight bars ───────────────────────────────────────────────────────────────
function WeightBars({ weights, labels }: { weights: number[]; labels: string[] }) {
  const max = Math.max(...weights);
  const COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe','#e0e7ff','#818cf8','#4f46e5'];
  return (
    <div className="space-y-1.5">
      {labels.map((lbl, i) => (
        <div key={lbl} className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300 w-14 text-right">{lbl}</span>
          <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-300"
              style={{ width: `${max > 0 ? (weights[i] / max) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
          </div>
          <span className="text-xs font-mono text-slate-300 w-14">{pct(weights[i])}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export const MVOPanel = () => {
  const { mu, cov, labels, mvoResult, computeMVO, mvoLoading, rfRate, setRfRate, longOnly, setLongOnly, error } = useOptimizer();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [rfInput, setRfInput] = useState(String(rfRate * 100));

  useEffect(() => { setSelectedIdx(null); }, [mvoResult]);

  const selected = selectedIdx !== null ? mvoResult?.frontier[selectedIdx] : null;
  const displayWeights = selected?.weights ?? mvoResult?.tangency
    ? (selected?.weights ?? mvoResult!.tangency.weights) : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Risk-free rate (%)</label>
          <input type="number" step="0.1" value={rfInput}
            onChange={e => { setRfInput(e.target.value); setRfRate(parseFloat(e.target.value) / 100 || 0); }}
            className="w-24 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-violet-500" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-slate-400">Long-only</span>
          <div onClick={() => setLongOnly(!longOnly)}
            className={`w-9 h-5 rounded-full transition-colors ${longOnly ? 'bg-violet-600' : 'bg-slate-700'} relative`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${longOnly ? 'left-4' : 'left-0.5'}`} />
          </div>
        </label>
        <button onClick={computeMVO} disabled={mvoLoading || cov.length === 0}
          className="px-5 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-40 transition flex items-center gap-2">
          {mvoLoading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Computing…</>
            : 'Compute Frontier'}
        </button>
        {cov.length === 0 && <p className="text-xs text-amber-400">Load data first.</p>}
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {mvoResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-400 mb-3">
              Click any point to inspect weights. Yellow = CAL. Green = GMV. Orange = Tangency.
            </p>
            <FrontierChart frontier={mvoResult.frontier} gmv={mvoResult.gmv}
              tangency={mvoResult.tangency} selected={selectedIdx} onSelect={setSelectedIdx} rfRate={rfRate} />
          </div>

          {/* Portfolio stats */}
          <div className="space-y-4">
            {/* Key portfolios */}
            {[
              { label: 'GMV Portfolio', p: mvoResult.gmv, color: 'emerald' },
              { label: 'Tangency Portfolio', p: mvoResult.tangency, color: 'amber' },
            ].map(({ label, p, color }) => (
              <div key={label} className={`rounded-xl border border-${color}-800/40 bg-${color}-900/10 p-4`}>
                <p className={`text-xs font-semibold text-${color}-300 mb-2`}>{label}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Return</span><br /><span className="text-white font-mono">{pct(p.expected_return)}</span></div>
                  <div><span className="text-slate-500">Vol σ</span><br /><span className="text-white font-mono">{pct(p.volatility)}</span></div>
                </div>
              </div>
            ))}

            {/* Selected point */}
            {selected && (
              <div className="rounded-xl border border-violet-800/40 bg-violet-900/10 p-4">
                <p className="text-xs font-semibold text-violet-300 mb-2">Selected Point</p>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div><span className="text-slate-500">Return</span><br /><span className="text-white font-mono">{pct(selected.expected_return)}</span></div>
                  <div><span className="text-slate-500">Vol σ</span><br /><span className="text-white font-mono">{pct(selected.volatility)}</span></div>
                  <div><span className="text-slate-500">Sharpe</span><br /><span className="text-white font-mono">{fmt2(selected.sharpe_ratio)}</span></div>
                </div>
                <WeightBars weights={selected.weights} labels={labels} />
              </div>
            )}

            {/* Tangency weights if none selected */}
            {!selected && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400 mb-2">Tangency Weights</p>
                <WeightBars weights={mvoResult.tangency.weights} labels={labels} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theory note */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-300">M1 L4 — Markowitz Mean-Variance Optimization</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-x-auto">
          <MathBlock latex="\min_w \tfrac{1}{2}\mathbf{w}^\top\Sigma\mathbf{w} \;\text{ s.t. }\; \mathbf{w}^\top\boldsymbol{\mu}=E[r],\; \mathbf{w}^\top\iota=1,\; w\ge0" />
          <MathBlock latex="w_{\mathrm{GMV}} = \frac{\Sigma^{-1}\iota}{\iota^\top\Sigma^{-1}\iota} \qquad w_{\mathrm{Tang}} = \frac{\Sigma^{-1}(\boldsymbol{\mu}-r_f\iota)}{\iota^\top\Sigma^{-1}(\boldsymbol{\mu}-r_f\iota)}" />
          <MathBlock latex="\text{Two-fund: } w^* = \alpha\, w_{\mathrm{GMV}} + (1-\alpha)\,w_{\mathrm{Tang}}" />
          <MathBlock latex="\text{CAL slope} = \mathrm{Sharpe}(w_{\mathrm{Tang}}) = \frac{E[r_T]-r_f}{\sigma_T}" />
        </div>
      </div>
    </div>
  );
};
