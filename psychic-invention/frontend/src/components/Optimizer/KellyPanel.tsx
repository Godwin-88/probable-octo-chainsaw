/**
 * Kelly Panel — Kelly Criterion (M5 L1)
 * Single asset: f* = (b·p − q) / b  where b = win multiple, q = 1−p
 * G(f) = p·ln(1+b·f) + q·ln(1−f)  (expected log growth)
 * Multi-asset: maximise E[ln(1 + w^T r)] via backend CVXPY solver.
 */
import { useState } from 'react';
import { useOptimizer } from '@/context/OptimizerContext';
import { postOptimizeKellySingle } from '@/utils/api';
import { MathText } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(2) + '%';
const fmt3 = (v: number) => v.toFixed(4);

// ── SVG Growth Curve ─────────────────────────────────────────────────────────
function GrowthCurve({
  p, b, fStar,
}: { p: number; b: number; fStar: number }) {
  const W = 480; const H = 240;
  const PAD = { t: 16, r: 16, b: 40, l: 52 };
  const q = 1 - p;

  // G(f) = p*ln(1+b*f) + q*ln(1-f)
  const pts: { f: number; g: number }[] = [];
  const fMax = Math.min(0.99, fStar * 2.5 + 0.05);
  const steps = 120;
  for (let k = 0; k <= steps; k++) {
    const f = (k / steps) * fMax;
    const g1 = 1 + b * f;
    const g2 = 1 - f;
    if (g1 <= 0 || g2 <= 0) break;
    pts.push({ f, g: p * Math.log(g1) + q * Math.log(g2) });
  }
  if (pts.length < 2) return null;

  const ys = pts.map(p => p.g);
  const yMin = Math.min(...ys) * 1.1;
  const yMax = Math.max(...ys) * 1.1;
  const xMax = fMax;

  const tx = (f: number) => PAD.l + (f / xMax) * (W - PAD.l - PAD.r);
  const ty = (g: number) => H - PAD.b - ((g - yMin) / (yMax - yMin + 1e-10)) * (H - PAD.t - PAD.b);

  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${tx(p.f).toFixed(1)} ${ty(p.g).toFixed(1)}`).join(' ');

  const nTicks = 4;
  const yTicks = Array.from({ length: nTicks + 1 }, (_, i) => yMin + (i / nTicks) * (yMax - yMin));
  const xTicks = Array.from({ length: 5 }, (_, i) => (i / 4) * xMax);

  const fStarClamped = Math.min(fStar, xMax);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 240 }}>
      {/* Grid */}
      {yTicks.map((y, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={ty(y)} x2={W - PAD.r} y2={ty(y)} stroke="#1e293b" strokeWidth="1" />
          <text x={PAD.l - 6} y={ty(y) + 4} textAnchor="end" fontSize="9" fill="#64748b">{y.toFixed(3)}</text>
        </g>
      ))}
      {xTicks.map((x, i) => (
        <g key={i}>
          <line x1={tx(x)} y1={PAD.t} x2={tx(x)} y2={H - PAD.b} stroke="#1e293b" strokeWidth="1" />
          <text x={tx(x)} y={H - PAD.b + 12} textAnchor="middle" fontSize="9" fill="#64748b">{pct(x)}</text>
        </g>
      ))}

      {/* Zero line */}
      {yMin < 0 && yMax > 0 && (
        <line x1={PAD.l} y1={ty(0)} x2={W - PAD.r} y2={ty(0)} stroke="#475569" strokeWidth="1" strokeDasharray="4,3" />
      )}

      {/* Axis labels */}
      <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="#94a3b8">Fraction f</text>
      <text x={14} y={H / 2} textAnchor="middle" fontSize="10" fill="#94a3b8"
        transform={`rotate(-90, 14, ${H / 2})`}>G(f) = E[ln growth]</text>

      {/* Growth curve */}
      <path d={path} fill="none" stroke="#10b981" strokeWidth="2" />

      {/* f* vertical */}
      {fStarClamped > 0 && (
        <>
          <line x1={tx(fStarClamped)} y1={PAD.t} x2={tx(fStarClamped)} y2={H - PAD.b}
            stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,3" />
          <text x={tx(fStarClamped) + 4} y={PAD.t + 12} fontSize="10" fill="#f59e0b">f*={pct(fStarClamped)}</text>
        </>
      )}
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
export const KellyPanel = () => {
  const { labels, returns, kellyResult, computeKelly, kellyLoading, error } = useOptimizer();
  const [activeTab, setActiveTab] = useState<'single' | 'multi'>('multi');

  // Single-asset params
  const [p, setP] = useState(0.55);
  const [b, setB] = useState(1.0); // win multiple (gain per unit)
  const [fractional, setFractional] = useState(1.0); // for multi
  const [singleResult, setSingleResult] = useState<{ f: number; g: { f: number; growth: number }[] } | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);

  const q = 1 - p;
  const fStarAnalytic = Math.max(0, (b * p - q) / b);

  const handleSingle = async () => {
    setSingleLoading(true);
    try {
      const res = await postOptimizeKellySingle({ p, q, a: 1, b }) as { optimal_fraction: number; growth_curve: { f: number; growth: number }[] };
      setSingleResult({ f: res.optimal_fraction, g: res.growth_curve });
    } catch {
      // fall back to analytic
      setSingleResult({ f: fStarAnalytic, g: [] });
    } finally {
      setSingleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab toggle */}
      <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-900/50 p-1 w-fit">
        {(['multi', 'single'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {tab === 'multi' ? 'Multi-Asset Kelly' : 'Single Asset G(f)'}
          </button>
        ))}
      </div>

      {/* Multi-asset */}
      {activeTab === 'multi' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
            <p className="text-sm font-semibold text-slate-200">Fractional Kelly</p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">κ = {fractional.toFixed(2)} (1.0 = full Kelly)</label>
              <input type="range" min="0.1" max="1.0" step="0.05" value={fractional}
                onChange={e => setFractional(parseFloat(e.target.value))}
                className="w-48 accent-violet-500" />
            </div>
            <p className="text-xs text-slate-500">
              Fractional Kelly κ scales position sizes: w = κ·f*, reducing drawdowns at cost of lower long-run growth.
            </p>
            {returns.length === 0 && <p className="text-xs text-amber-400">Load data first.</p>}
            <button onClick={() => computeKelly(fractional)} disabled={kellyLoading || returns.length === 0}
              className="px-5 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-40 transition flex items-center gap-2">
              {kellyLoading
                ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Computing…</>
                : 'Compute Kelly'}
            </button>
          </div>

          {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

          {kellyResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-violet-800/40 bg-violet-900/10 p-4">
                <p className="text-xs font-semibold text-violet-300 mb-3">Kelly Allocation (κ={fractional.toFixed(2)})</p>
                <WeightBars weights={kellyResult.weights} labels={labels} />
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-300 mb-2">Portfolio Stats</p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><span className="text-slate-500">E[ln growth]</span><br /><span className="text-white font-mono">{fmt3(kellyResult.expected_growth)}</span></div>
                  <div><span className="text-slate-500">f* (full)</span><br /><span className="text-white font-mono">{fmt3(kellyResult.optimal_fraction)}</span></div>
                  <div><span className="text-slate-500">κ·f*</span><br /><span className="text-white font-mono">{fmt3(kellyResult.fractional_kelly)}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single asset */}
      {activeTab === 'single' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
            <p className="text-sm font-semibold text-slate-200">Single-Asset Parameters</p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-slate-400 mb-1">p (win probability) = {p.toFixed(2)}</label>
                <input type="range" min="0.01" max="0.99" step="0.01" value={p}
                  onChange={e => setP(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">b (win multiple) = {b.toFixed(2)}</label>
                <input type="range" min="0.1" max="5" step="0.05" value={b}
                  onChange={e => setB(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500" />
              </div>
            </div>

            {/* Analytic f* */}
            <div className="flex flex-wrap gap-6 p-3 rounded-lg bg-slate-800/60 text-xs">
              <div><span className="text-slate-500">p</span><br /><span className="text-white font-mono">{p.toFixed(3)}</span></div>
              <div><span className="text-slate-500">q = 1−p</span><br /><span className="text-white font-mono">{q.toFixed(3)}</span></div>
              <div><span className="text-slate-500">b (gain)</span><br /><span className="text-white font-mono">{b.toFixed(3)}</span></div>
              <div><span className="text-slate-500">f* = (bp−q)/b</span><br />
                <span className={`font-mono font-bold ${fStarAnalytic > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pct(fStarAnalytic)} {fStarAnalytic <= 0 ? '(don\'t bet)' : ''}
                </span>
              </div>
              <div><span className="text-slate-500">Edge = bp−q</span><br />
                <span className={`font-mono ${b * p - q > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(b * p - q).toFixed(4)}
                </span>
              </div>
            </div>

            <button onClick={handleSingle} disabled={singleLoading}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-40 transition flex items-center gap-2">
              {singleLoading ? 'Computing…' : 'Plot G(f) curve'}
            </button>
          </div>

          {/* Growth curve (always shown analytically) */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-400 mb-3"><MathText text="$G(f) = p\ln(1+bf) + q\ln(1-f)$ — maximised at $f^*$" /></p>
            <GrowthCurve p={p} b={b} fStar={singleResult?.f ?? fStarAnalytic} />
          </div>
        </div>
      )}

      {/* Theory note */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">M5 L1 — Kelly Criterion</p>
        <p><MathText text="Single: $f^* = (bp - q)/b$. Maximises $\mathbb{E}[\log W_T] = G(f)\cdot T$ asymptotically (Breiman 1961)." /></p>
        <p><MathText text="Multi-asset: $w^* = \Sigma^{-1}\mu$ (log-optimal; same as tangency for log-normal). Solved numerically for non-normal returns." /></p>
        <p><MathText text="Fractional Kelly $\kappa \in (0,1]$ sacrifices long-run growth for lower drawdown and parameter uncertainty protection." /></p>
      </div>
    </div>
  );
};
