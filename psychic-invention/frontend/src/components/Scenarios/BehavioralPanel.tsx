/**
 * Behavioral Scenarios Panel — M4: Prospect Theory + Herding Risk
 *
 * Prospect Theory (Kahneman & Tversky 1992):
 *   v(x) = x^α                if x ≥ 0   (concave — diminishing sensitivity to gains)
 *   v(x) = −λ(−x)^β          if x < 0   (convex — loss aversion)
 *   α = β ≈ 0.88,  λ ≈ 2.25
 *
 * Probability weighting (rank-dependent):
 *   w⁺(p) = p^γ / [p^γ + (1−p)^γ]^{1/γ},  γ = 0.61  (gains)
 *   w⁻(p) = p^δ / [p^δ + (1−p)^δ]^{1/δ},  δ = 0.69  (losses)
 *
 * Herding VaR (Khandani-Lo):
 *   Stressed Σ = D · clip(ρ + Δρ, −0.99, 0.99) · D
 *   Stressed VaR = −W₀ · [Φ⁻¹(α) · stressed_σ_p + μ_p]
 *
 * Source: M4 Lesson Notes — Prospect Theory (M4 L2)
 */
import { useState } from 'react';
import { useScenariosContext } from '@/context/ScenariosContext';
import { MathText } from '@/components/ui/Math';

const pct   = (v: number) => (v * 100).toFixed(2) + '%';
const fmt4  = (v: number) => v.toFixed(4);
const money = (v: number, val: number) => `$${(v * val).toFixed(0)}`;

// ── Prospect Theory value function curve ──────────────────────────────────────
function ProspectValueCurve({ alpha = 0.88, lambda_ = 2.25, beta = 0.88 }: {
  alpha?: number; lambda_?: number; beta?: number;
}) {
  const W = 400; const H = 200;
  const pad = { l: 48, r: 16, t: 16, b: 36 };
  const xRange = 1.0; // ±1 in outcome space (normalised)

  const px = (x: number) => pad.l + ((x + xRange) / (2 * xRange)) * (W - pad.l - pad.r);
  const py = (y: number) => H - pad.b - ((y + 1) / 2) * (H - pad.t - pad.b);

  // Sample points for KT value function
  const nPts = 80;
  const kv = (x: number) => x >= 0
    ? Math.pow(Math.abs(x), alpha)
    : -lambda_ * Math.pow(Math.abs(x), beta);
  const rv = (x: number) => x; // rational (linear)

  const ktPoints  = Array.from({ length: nPts + 1 }, (_, i) => {
    const x = -xRange + (2 * xRange * i) / nPts;
    return `${px(x)},${py(kv(x))}`;
  }).join(' ');
  const ratPoints = Array.from({ length: nPts + 1 }, (_, i) => {
    const x = -xRange + (2 * xRange * i) / nPts;
    return `${px(x)},${py(rv(x))}`;
  }).join(' ');

  const xTicks = [-1, -0.5, 0, 0.5, 1];
  const yTicks = [-1, -0.5, 0, 0.5, 1];
  const zeroX  = px(0); const zeroY = py(0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {xTicks.map(v => (
        <g key={v}>
          <line x1={px(v)} y1={pad.t} x2={px(v)} y2={H - pad.b} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
          <text x={px(v)} y={H - pad.b + 12} textAnchor="middle" fontSize="7" fill="#64748b">{v}</text>
        </g>
      ))}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={pad.l} y1={py(v)} x2={W - pad.r} y2={py(v)} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
          <text x={pad.l - 4} y={py(v) + 3} textAnchor="end" fontSize="7" fill="#64748b">{v}</text>
        </g>
      ))}
      {/* Axes */}
      <line x1={pad.l} y1={zeroY} x2={W - pad.r} y2={zeroY} stroke="#475569" strokeWidth="1" />
      <line x1={zeroX} y1={pad.t} x2={zeroX} y2={H - pad.b} stroke="#475569" strokeWidth="1" />
      {/* Rational (linear) utility */}
      <polyline points={ratPoints} fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="6,4" opacity={0.6} />
      {/* KT value function */}
      <polyline points={ktPoints} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinejoin="round" />
      {/* Labels */}
      <text x={W - 20} y={pad.t + 20} fontSize="7" fill="#f43f5e">v(x) KT</text>
      <text x={W - 20} y={pad.t + 32} fontSize="7" fill="#475569">Linear</text>
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="#64748b">Outcome x (normalised)</text>
      <text x={12} y={H / 2} textAnchor="middle" fontSize="8" fill="#64748b"
        transform={`rotate(-90,12,${H / 2})`}>v(x) — subjective value</text>
      {/* Annotation: loss aversion */}
      <text x={zeroX + 8} y={py(-0.5) - 4} fontSize="7" fill="#fbbf24">−λ(−x)^β</text>
      <text x={zeroX + 8} y={py(0.5) - 4}  fontSize="7" fill="#34d399">x^α</text>
    </svg>
  );
}

// ── Probability weighting function curve ──────────────────────────────────────
function WeightingCurve() {
  const W = 280; const H = 160;
  const pad = { l: 32, r: 16, t: 16, b: 28 };

  const wPlus  = (p: number, g = 0.61) => Math.pow(p, g) / Math.pow(Math.pow(p, g) + Math.pow(1 - p, g), 1 / g);
  const wMinus = (p: number, d = 0.69) => Math.pow(p, d) / Math.pow(Math.pow(p, d) + Math.pow(1 - p, d), 1 / d);

  const px = (p: number) => pad.l + p * (W - pad.l - pad.r);
  const py = (w: number) => H - pad.b - w * (H - pad.t - pad.b);

  const nPts = 50;
  const plusPts  = Array.from({ length: nPts - 1 }, (_, i) => {
    const p = (i + 1) / nPts;
    return `${px(p)},${py(wPlus(p))}`;
  }).join(' ');
  const minusPts = Array.from({ length: nPts - 1 }, (_, i) => {
    const p = (i + 1) / nPts;
    return `${px(p)},${py(wMinus(p))}`;
  }).join(' ');
  const neutralPts = Array.from({ length: nPts - 1 }, (_, i) => {
    const p = (i + 1) / nPts;
    return `${px(p)},${py(p)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {[0.25, 0.5, 0.75, 1].map(t => (
        <g key={t}>
          <line x1={pad.l} y1={py(t)} x2={W - pad.r} y2={py(t)} stroke="#1e293b" strokeWidth="1" strokeDasharray="2,2" />
          <text x={pad.l - 4} y={py(t) + 3} textAnchor="end" fontSize="7" fill="#64748b">{t}</text>
          <text x={px(t)} y={H - pad.b + 10} textAnchor="middle" fontSize="7" fill="#64748b">{t}</text>
        </g>
      ))}
      <polyline points={neutralPts} fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="4,3" opacity={0.7} />
      <polyline points={plusPts}    fill="none" stroke="#22d3ee" strokeWidth="1.5" />
      <polyline points={minusPts}   fill="none" stroke="#f59e0b" strokeWidth="1.5" />
      <text x={W - 40} y={pad.t + 14} fontSize="7" fill="#22d3ee">w⁺ (γ=0.61)</text>
      <text x={W - 40} y={pad.t + 24} fontSize="7" fill="#f59e0b">w⁻ (δ=0.69)</text>
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="#64748b">Physical prob p</text>
    </svg>
  );
}

// ── Herding VaR comparison bar ────────────────────────────────────────────────
function VarCompBar({ base, stressed, label }: { base: number; stressed: number; label: string }) {
  const maxV = Math.max(Math.abs(base), Math.abs(stressed), 0.001);
  const wBase     = (Math.abs(base) / maxV) * 100;
  const wStressed = (Math.abs(stressed) / maxV) * 100;
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 w-14 text-right">Base</span>
          <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-cyan-600/70 rounded-full" style={{ width: `${wBase}%` }} />
          </div>
          <span className="text-[10px] font-mono text-cyan-400 w-20 text-right">{pct(base)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 w-14 text-right">Stressed</span>
          <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-red-500/70 rounded-full" style={{ width: `${wStressed}%` }} />
          </div>
          <span className="text-[10px] font-mono text-red-400 w-20 text-right">{pct(stressed)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export const BehavioralPanel = () => {
  const {
    returnMatrix, weights,
    behavResult, behavLoading, computeBehavioral, error,
  } = useScenariosContext();

  const hasData = returnMatrix.length > 0;

  const [mode, setMode]         = useState<'prospect' | 'herding'>('prospect');
  const [corrShift, setCorrShift] = useState(0.30);
  const [portfolioValue, setPortfolioValue] = useState(1_000_000);

  // KT parameters (display only, backend uses defaults)
  const alpha   = 0.88;
  const lambda_ = 2.25;
  const beta    = 0.88;
  const gamma   = 0.61;
  const delta   = 0.69;

  const run = () => {
    computeBehavioral(mode, corrShift, 0.05, portfolioValue);
  };

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="rounded-xl border border-rose-700/40 bg-rose-900/10 p-4 text-rose-300 text-sm">
          Load assets above. Behavioral analysis runs on live portfolio returns.
        </div>
      )}

      {/* Controls */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm font-semibold text-slate-200">Behavioral Finance Simulation</p>
          <button
            onClick={run}
            disabled={behavLoading || !hasData}
            className="px-4 py-1.5 rounded-lg bg-rose-700 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-40 transition flex items-center gap-2"
          >
            {behavLoading
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Simulating…</>
              : 'Run Behavioral Sim'}
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          {[
            { id: 'prospect' as const, label: 'Prospect Theory', desc: 'S-shaped utility · loss aversion λ ≈ 2.25' },
            { id: 'herding'  as const, label: 'Herding VaR',     desc: 'Khandani-Lo: correlation stress → VaR amplification' },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs text-left border transition ${
                mode === m.id
                  ? 'bg-rose-700/30 border-rose-600 text-rose-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}>
              <p className="font-semibold">{m.label}</p>
              <p className="text-[10px] mt-0.5 opacity-70">{m.desc}</p>
            </button>
          ))}
        </div>

        {mode === 'herding' && (
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Correlation Shock Δρ (herding/crowding)
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={70} step={1}
                value={Math.round(corrShift * 100)}
                onChange={e => setCorrShift(parseInt(e.target.value) / 100)}
                className="w-48 accent-rose-500"
              />
              <span className="text-rose-300 font-mono text-sm w-14">+{pct(corrShift)}</span>
              <button onClick={() => setCorrShift(0.40)}
                className="px-2 py-0.5 rounded text-[10px] bg-amber-700/30 border border-amber-600/40 text-amber-300 hover:bg-amber-700/50 transition">
                Quant Melt 2007
              </button>
              <button onClick={() => setCorrShift(0.50)}
                className="px-2 py-0.5 rounded text-[10px] bg-red-700/30 border border-red-600/40 text-red-300 hover:bg-red-700/50 transition">
                GFC 2008
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
            Portfolio Value ($)
          </label>
          <div className="flex gap-2">
            {[100_000, 500_000, 1_000_000, 10_000_000].map(v => (
              <button key={v} onClick={() => setPortfolioValue(v)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  portfolioValue === v ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}>
                ${(v / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Results */}
      {behavResult && (
        <div className="space-y-4">
          {/* Prospect Theory results */}
          {behavResult.perceived_utility !== undefined && (
            <div className="rounded-xl border border-rose-800/40 bg-rose-900/10 p-4 space-y-4">
              <p className="text-sm font-semibold text-rose-300">Prospect Theory — Perceived Utility</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-xs">
                  <p className="text-slate-500 mb-1">Perceived Utility (KT)</p>
                  <p className={`text-lg font-mono font-bold ${behavResult.perceived_utility >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmt4(behavResult.perceived_utility)}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    avg v(r_t) over portfolio return series
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-xs">
                  <p className="text-slate-500 mb-1">KT Parameters</p>
                  <p className="font-mono text-slate-300">α = β = {alpha} · λ = {lambda_}</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Losses feel {lambda_}× more painful than equivalent gains
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
                  <p className="text-xs font-semibold text-slate-300 mb-2">S-shaped Value Function v(x)</p>
                  <p className="text-[10px] text-slate-500 mb-2">
                    Red = KT (loss averse) · Dashed grey = rational (linear)
                  </p>
                  <ProspectValueCurve alpha={alpha} lambda_={lambda_} beta={beta} />
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
                  <p className="text-xs font-semibold text-slate-300 mb-2">Probability Weighting w(p)</p>
                  <p className="text-[10px] text-slate-500 mb-2">
                    Cyan = gains (γ=0.61) · Amber = losses (δ=0.69) · Overweight small, underweight large probs
                  </p>
                  <WeightingCurve />
                </div>
              </div>
            </div>
          )}

          {/* Herding VaR results */}
          {behavResult.base_var_95 !== undefined && (
            <div className="rounded-xl border border-rose-800/40 bg-rose-900/10 p-4 space-y-4">
              <p className="text-sm font-semibold text-rose-300">
                Herding VaR — Δρ = +{pct(behavResult.correlation_shift ?? corrShift)}
              </p>

              <div className="space-y-3">
                <VarCompBar
                  label="VaR 95% (5% loss quantile)"
                  base={behavResult.base_var_95!}
                  stressed={behavResult.stressed_var_95!}
                />
                <VarCompBar
                  label="VaR 99% (1% loss quantile)"
                  base={behavResult.base_var_99!}
                  stressed={behavResult.stressed_var_99!}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {[
                  { label: 'Base VaR 95%', val: pct(behavResult.base_var_95!), color: 'text-cyan-400' },
                  { label: 'Stressed VaR 95%', val: pct(behavResult.stressed_var_95!), color: 'text-red-400' },
                  { label: 'Base VaR 99%', val: pct(behavResult.base_var_99!), color: 'text-cyan-400' },
                  { label: 'Stressed VaR 99%', val: pct(behavResult.stressed_var_99!), color: 'text-red-400' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="rounded-lg bg-slate-800/60 border border-slate-700 p-2">
                    <p className="text-slate-500 mb-1">{label}</p>
                    <p className={`font-mono font-semibold ${color}`}>{val}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {money(parseFloat(val.replace('%', '')) / 100, portfolioValue)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-amber-700/30 bg-amber-900/10 p-3 text-xs text-amber-300">
                <strong>Quant Meltdown 2007 context:</strong> When many quant funds hold similar factor exposures,
                simultaneous unwinding drives correlations toward 1, amplifying portfolio losses far beyond
                normal VaR estimates — exactly what the stressed VaR above models.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Theory */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">Prospect Theory — Kahneman &amp; Tversky 1992 (M4 L2)</p>
        <p><MathText text="$v(x) = x^\alpha$ (gains), $v(x) = -\lambda(-x)^\beta$ (losses) · $\alpha = \beta \approx 0.88$, $\lambda \approx 2.25$." /></p>
        <p><MathText text="$w^+(p) = p^\gamma / [p^\gamma + (1-p)^\gamma]^{1/\gamma}$, $\gamma = 0.61$ (overweight small gain probs)." /></p>
        <p><MathText text="$w^-(p) = p^\delta / [p^\delta + (1-p)^\delta]^{1/\delta}$, $\delta = 0.69$ (overweight small loss probs)." /></p>
        <p><MathText text="Herding VaR: $\Sigma_{\text{stressed}} = D\cdot\mathrm{clip}(\rho + \Delta\rho)\cdot D$ → higher portfolio vol → bigger VaR (2007 Quant Melt)." /></p>
      </div>
    </div>
  );
};
