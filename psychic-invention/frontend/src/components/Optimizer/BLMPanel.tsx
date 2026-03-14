/**
 * BLM Panel — Black-Litterman Model (M3 L1)
 * π = δΣw_m  (implied equilibrium returns)
 * μ_BL = [(τΣ)⁻¹ + P^TΩ⁻¹P]⁻¹ [(τΣ)⁻¹π + P^TΩ⁻¹Q]
 * Ω = diag(τ·(PΣP^T))  (proportional uncertainty)
 */
import { useState } from 'react';
import { useOptimizer } from '@/context/OptimizerContext';
import { MathText } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(2) + '%';

// ── Return comparison bar chart ───────────────────────────────────────────────
function ReturnBarChart({
  labels, implied, blm,
}: { labels: string[]; implied: number[]; blm: number[] }) {
  const all = [...implied, ...blm];
  const maxAbs = Math.max(...all.map(Math.abs), 0.001);
  const COLORS = { implied: '#6366f1', blm: '#f59e0b' };
  return (
    <div className="space-y-2">
      {labels.map((lbl, i) => {
        const iw = (Math.abs(implied[i]) / maxAbs) * 100;
        const bw = (Math.abs(blm[i]) / maxAbs) * 100;
        return (
          <div key={lbl} className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-300 w-14 text-right">{lbl}</span>
            <div className="flex-1 space-y-0.5">
              <div className="h-3 bg-slate-800 rounded overflow-hidden relative">
                <div className="h-full rounded transition-all duration-300"
                  style={{ width: `${iw}%`, background: COLORS.implied, opacity: 0.8 }} />
                <span className="absolute right-1 top-0 text-[9px] text-slate-400 leading-3">
                  {pct(implied[i])}
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded overflow-hidden relative">
                <div className="h-full rounded transition-all duration-300"
                  style={{ width: `${bw}%`, background: COLORS.blm }} />
                <span className="absolute right-1 top-0 text-[9px] text-slate-400 leading-3">
                  {pct(blm[i])}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="flex gap-4 text-[10px] text-slate-500 pt-1">
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-indigo-500 inline-block" />Implied π</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-amber-500 inline-block" />BLM μ</span>
      </div>
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

// ── View row ─────────────────────────────────────────────────────────────────
interface ViewRow {
  id: number;
  type: 'absolute' | 'relative';
  asset1: number;
  asset2: number;
  value: string; // percent string
}

// ── Main panel ───────────────────────────────────────────────────────────────
export const BLMPanel = () => {
  const { mu, cov, labels, blmResult, computeBLM, blmLoading, rfRate, longOnly, error } = useOptimizer();

  const N = labels.length;
  const [tau, setTau] = useState(0.025);
  const [tauInput, setTauInput] = useState('0.025');
  const [riskAversion, setRiskAversion] = useState(2.5);
  const [views, setViews] = useState<ViewRow[]>([
    { id: 1, type: 'absolute', asset1: 0, asset2: 1, value: '' },
  ]);
  const [nextId, setNextId] = useState(2);

  const addView = () => {
    if (views.length >= 6) return;
    setViews(v => [...v, { id: nextId, type: 'absolute', asset1: 0, asset2: 1, value: '' }]);
    setNextId(n => n + 1);
  };

  const removeView = (id: number) => setViews(v => v.filter(r => r.id !== id));

  const updateView = (id: number, field: keyof ViewRow, val: string | number) => {
    setViews(v => v.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleCompute = async () => {
    if (cov.length === 0) return;

    // Build P, Q, market weights
    const mktWeights = Array(N).fill(1 / N); // equal market weights

    const validViews = views.filter(r => r.value !== '' && !isNaN(parseFloat(r.value)));
    let P: number[][] = [];
    let Q: number[] = [];

    if (validViews.length === 0) {
      // No views → P=[], Q=[] (use implied equilibrium)
      P = [[...Array(N).fill(0)]]; P[0][0] = 1;
      Q = [mu[0]]; // trivial view, just to satisfy API
    } else {
      validViews.forEach(v => {
        const row = Array(N).fill(0);
        row[v.asset1] = 1;
        if (v.type === 'relative') row[v.asset2] = -1;
        P.push(row);
        Q.push(parseFloat(v.value) / 100);
      });
    }

    await computeBLM(mktWeights, P, Q, tau);
  };

  if (cov.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 text-slate-500 text-sm">
        Load portfolio data first (use the data panel above).
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Parameters */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-200">Model Parameters</p>

        <div className="flex flex-wrap gap-6">
          <div>
            <label className="block text-xs text-slate-400 mb-1">τ (prior uncertainty)</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0.001" max="0.1" step="0.001" value={tau}
                onChange={e => { const v = parseFloat(e.target.value); setTau(v); setTauInput(v.toFixed(3)); }}
                className="w-32 accent-amber-500" />
              <input type="number" step="0.001" value={tauInput}
                onChange={e => { setTauInput(e.target.value); const v = parseFloat(e.target.value); if (v > 0 && v < 1) setTau(v); }}
                className="w-20 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-2 py-1 focus:outline-none focus:border-amber-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">δ (risk aversion)</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0.5" max="10" step="0.1" value={riskAversion}
                onChange={e => setRiskAversion(parseFloat(e.target.value))}
                className="w-32 accent-amber-500" />
              <span className="text-sm text-white font-mono w-10">{riskAversion.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Views editor */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">Investor Views</p>
          <button onClick={addView} disabled={views.length >= 6 || N < 2}
            className="px-3 py-1 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40 transition">
            + Add view
          </button>
        </div>

        <div className="text-xs text-slate-500 space-y-0.5">
          <p>Absolute: asset has expected return Q<sub>k</sub> (ann.).</p>
          <p>Relative: asset A outperforms asset B by Q<sub>k</sub> (ann.).</p>
        </div>

        {views.map(v => (
          <div key={v.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700">
            <select value={v.type} onChange={e => updateView(v.id, 'type', e.target.value)}
              className="rounded bg-slate-700 text-xs text-slate-200 px-2 py-1 border border-slate-600 focus:outline-none">
              <option value="absolute">Absolute</option>
              <option value="relative">Relative</option>
            </select>

            <select value={v.asset1} onChange={e => updateView(v.id, 'asset1', parseInt(e.target.value))}
              className="rounded bg-slate-700 text-xs text-slate-200 px-2 py-1 border border-slate-600 focus:outline-none">
              {labels.map((lbl, i) => <option key={i} value={i}>{lbl}</option>)}
            </select>

            {v.type === 'relative' && (
              <>
                <span className="text-xs text-slate-400">outperforms</span>
                <select value={v.asset2} onChange={e => updateView(v.id, 'asset2', parseInt(e.target.value))}
                  className="rounded bg-slate-700 text-xs text-slate-200 px-2 py-1 border border-slate-600 focus:outline-none">
                  {labels.map((lbl, i) => <option key={i} value={i}>{lbl}</option>)}
                </select>
              </>
            )}

            <span className="text-xs text-slate-400">by</span>
            <input type="number" step="0.1" placeholder="e.g. 12" value={v.value}
              onChange={e => updateView(v.id, 'value', e.target.value)}
              className="w-24 rounded bg-slate-700 border border-slate-600 text-white text-xs px-2 py-1 focus:outline-none focus:border-amber-500" />
            <span className="text-xs text-slate-400">% p.a.</span>

            <button onClick={() => removeView(v.id)}
              className="ml-auto text-slate-500 hover:text-red-400 text-sm leading-none px-1">×</button>
          </div>
        ))}

        <button onClick={handleCompute} disabled={blmLoading}
          className="px-5 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-40 transition flex items-center gap-2">
          {blmLoading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Computing…</>
            : 'Compute Black-Litterman'}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {blmResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Returns comparison */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-3">Implied π vs BLM μ (annualised)</p>
            <ReturnBarChart labels={labels} implied={blmResult.implied_returns} blm={blmResult.blm_returns} />
          </div>

          {/* Portfolio stats + weights */}
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 p-4">
              <p className="text-xs font-semibold text-amber-300 mb-2">BLM Optimal Portfolio</p>
              <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                <div><span className="text-slate-500">Return</span><br /><span className="text-white font-mono">{pct(blmResult.expected_return)}</span></div>
                <div><span className="text-slate-500">Vol σ</span><br /><span className="text-white font-mono">{pct(blmResult.volatility)}</span></div>
                <div><span className="text-slate-500">Sharpe</span><br /><span className="text-white font-mono">{blmResult.sharpe_ratio.toFixed(3)}</span></div>
              </div>
              <WeightBars weights={blmResult.weights} labels={labels} />
            </div>
          </div>
        </div>
      )}

      {/* Theory note */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">M3 L1 — Black-Litterman Model</p>
        <p><MathText text="Equilibrium: $\pi = \delta \Sigma w_m$ (reverse-engineering CAPM from market weights)." /></p>
        <p><MathText text="Posterior: $\mu_{BL} = [(\tau\Sigma)^{-1} + P^\top\Omega^{-1}P]^{-1}[(\tau\Sigma)^{-1}\pi + P^\top\Omega^{-1}Q]$, $\;\Omega = \tau\,\mathrm{diag}(P\Sigma P^\top)$." /></p>
        <p><MathText text="$\tau \to 0$: pure equilibrium prior · $\tau \to \infty$: pure views. $\delta \approx 2.5$ (global CAPM risk aversion)." /></p>
      </div>
    </div>
  );
};
