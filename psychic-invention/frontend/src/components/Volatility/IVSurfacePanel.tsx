/**
 * IV Surface Panel — Heston-generated implied vol surface (M1 L5 / DPE)
 * Displays: vol surface heatmap · vol smile · ATM term structure
 * Parameters: v₀, κ, θ, ξ, ρ_SV via sliders — live surface recomputed on demand
 */
import { useVolatility } from '@/context/VolatilityContext';
import type { HestonParams } from '@/context/VolatilityContext';
import { MathText } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(1) + '%';

// ── Surface heatmap ────────────────────────────────────────────────────────────
function SurfaceHeatmap({
  moneyness, expiries, ivGrid,
}: { moneyness: number[]; expiries: number[]; ivGrid: number[][] }) {
  const NM = moneyness.length; const NE = expiries.length;
  const W = 540; const H = 260;
  const padL = 36; const padB = 28; const padT = 12; const padR = 16;
  const cw = (W - padL - padR) / NM;
  const ch = (H - padT - padB) / NE;

  // Find iv range
  const flatIv = ivGrid.flat();
  const minIv = Math.min(...flatIv); const maxIv = Math.max(...flatIv);
  const range = maxIv - minIv || 0.01;

  const cellColor = (iv: number) => {
    const t = (iv - minIv) / range;
    // plasma-like: dark purple → orange → yellow
    const r = Math.round(Math.min(255, t * 2.5 * 255));
    const g = Math.round(Math.max(0, t * 1.5 - 0.3) * 255);
    const b = Math.round(Math.max(0, 1 - t * 2) * 220);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {ivGrid.map((row, ei) =>
        row.map((iv, mi) => (
          <rect key={`${ei}-${mi}`}
            x={padL + mi * cw} y={padT + ei * ch}
            width={cw - 0.5} height={ch - 0.5}
            fill={cellColor(iv)} opacity={0.9}
          >
            <title>{`K/S=${moneyness[mi].toFixed(2)}, τ=${expiries[ei].toFixed(2)}y, IV=${pct(iv)}`}</title>
          </rect>
        ))
      )}
      {/* X-axis: moneyness */}
      {moneyness.map((m, mi) => (
        <text key={mi} x={padL + (mi + 0.5) * cw} y={H - padB + 12}
          textAnchor="middle" fontSize="8" fill="#94a3b8">
          {m.toFixed(2)}
        </text>
      ))}
      {/* Y-axis: expiry */}
      {expiries.map((tau, ei) => (
        <text key={ei} x={padL - 4} y={padT + (ei + 0.5) * ch + 3}
          textAnchor="end" fontSize="8" fill="#94a3b8">
          {tau.toFixed(1)}y
        </text>
      ))}
      {/* Labels */}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="#64748b">Moneyness K/S</text>
      <text x={8} y={H / 2} textAnchor="middle" fontSize="8" fill="#64748b"
        transform={`rotate(-90,8,${H / 2})`}>Expiry (yr)</text>
      {/* Colorbar legend */}
      <text x={padL} y={padT - 2} fontSize="7" fill="#64748b">
        IV: {pct(minIv)} – {pct(maxIv)}
      </text>
    </svg>
  );
}

// ── Vol smile chart ────────────────────────────────────────────────────────────
function SmileChart({ smile }: { smile: { moneyness: number; iv: number }[] }) {
  if (!smile.length) return null;
  const W = 280; const H = 160;
  const pad = { t: 16, r: 12, b: 28, l: 36 };
  const xs = smile.map(d => d.moneyness);
  const ys = smile.map(d => d.iv);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys) * 0.9; const maxY = Math.max(...ys) * 1.1;
  const px = (x: number) => pad.l + (x - minX) / (maxX - minX) * (W - pad.l - pad.r);
  const py = (y: number) => H - pad.b - (y - minY) / (maxY - minY) * (H - pad.t - pad.b);

  const pts = smile.map(d => `${px(d.moneyness)},${py(d.iv)}`).join(' ');
  // ATM line at moneyness=1
  const atmX = px(1.0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {/* Grid */}
      {[0.25, 0.5, 0.75].map(t => {
        const y = py(minY + t * (maxY - minY));
        return <line key={t} x1={pad.l} y1={y} x2={W - pad.r} y2={y}
          stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />;
      })}
      {/* ATM line */}
      {atmX > pad.l && atmX < W - pad.r && (
        <line x1={atmX} y1={pad.t} x2={atmX} y2={H - pad.b} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,4" />
      )}
      {/* Smile curve */}
      <polyline points={pts} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" />
      {smile.map(d => (
        <circle key={d.moneyness} cx={px(d.moneyness)} cy={py(d.iv)} r="2.5" fill="#22d3ee" />
      ))}
      {/* Y axis ticks */}
      {[0, 0.5, 1].map(t => {
        const iv = minY + t * (maxY - minY);
        return <text key={t} x={pad.l - 3} y={py(iv) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{pct(iv)}</text>;
      })}
      {/* X axis labels */}
      {[minX, 1.0, maxX].map(m => (
        <text key={m} x={px(m)} y={H - pad.b + 11} textAnchor="middle" fontSize="8" fill="#94a3b8">{m.toFixed(2)}</text>
      ))}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="#64748b">Moneyness K/S</text>
      <text x={8} y={H / 2} textAnchor="middle" fontSize="8" fill="#64748b"
        transform={`rotate(-90,8,${H/2})`}>IV</text>
    </svg>
  );
}

// ── ATM term structure chart ───────────────────────────────────────────────────
function TermStructureChart({ ts }: { ts: { expiry: number; iv: number }[] }) {
  if (!ts.length) return null;
  const W = 280; const H = 160;
  const pad = { t: 16, r: 12, b: 28, l: 36 };
  const xs = ts.map(d => d.expiry);
  const ys = ts.map(d => d.iv);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys) * 0.9; const maxY = Math.max(...ys) * 1.1;
  const px = (x: number) => pad.l + (x - minX) / (maxX - minX) * (W - pad.l - pad.r);
  const py = (y: number) => H - pad.b - (y - minY) / (maxY - minY) * (H - pad.t - pad.b);
  const pts = ts.map(d => `${px(d.expiry)},${py(d.iv)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {[0.25, 0.5, 0.75].map(t => {
        const y = py(minY + t * (maxY - minY));
        return <line key={t} x1={pad.l} y1={y} x2={W - pad.r} y2={y}
          stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />;
      })}
      <polyline points={pts} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round" />
      {ts.map(d => (
        <circle key={d.expiry} cx={px(d.expiry)} cy={py(d.iv)} r="2.5" fill="#a78bfa" />
      ))}
      {[0, 0.5, 1].map(t => {
        const iv = minY + t * (maxY - minY);
        return <text key={t} x={pad.l - 3} y={py(iv) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{pct(iv)}</text>;
      })}
      {[minX, (minX + maxX) / 2, maxX].map(e => (
        <text key={e} x={px(e)} y={H - pad.b + 11} textAnchor="middle" fontSize="8" fill="#94a3b8">{e.toFixed(1)}y</text>
      ))}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="#64748b">Expiry (years)</text>
      <text x={8} y={H / 2} textAnchor="middle" fontSize="8" fill="#64748b"
        transform={`rotate(-90,8,${H/2})`}>ATM IV</text>
    </svg>
  );
}

// ── Param slider ───────────────────────────────────────────────────────────────
function ParamSlider({
  label, value, min, max, step, onChange, desc,
}: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; desc?: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-400 font-mono">{label}</label>
        <span className="text-xs text-white font-mono">{value.toFixed(3)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-500" />
      {desc && <p className="text-[10px] text-slate-600">{desc}</p>}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export const IVSurfacePanel = () => {
  const { hestonParams, setHestonParams, surfaceResult, surfaceLoading, computeSurface, error } = useVolatility();

  const set = (field: keyof HestonParams) => (v: number) =>
    setHestonParams({ ...hestonParams, [field]: v });

  const feller = 2 * hestonParams.kappa * hestonParams.theta > hestonParams.xi ** 2;

  return (
    <div className="space-y-6">
      {/* Parameters */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">Heston Parameters</p>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${feller ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40' : 'bg-red-900/40 text-red-300 border border-red-700/40'}`}>
              Feller: {feller ? 'OK 2κθ>ξ²' : 'VIOLATED'}
            </span>
            <button onClick={computeSurface} disabled={surfaceLoading}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500 disabled:opacity-40 transition flex items-center gap-2">
              {surfaceLoading
                ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Computing…</>
                : 'Generate Surface'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
          <ParamSlider label="v₀ (initial var)" value={hestonParams.v0} min={0.001} max={0.5} step={0.001}
            onChange={set('v0')} desc="Initial variance ≈ σ²" />
          <ParamSlider label="κ (mean-reversion)" value={hestonParams.kappa} min={0.1} max={10} step={0.1}
            onChange={set('kappa')} desc="Speed of reversion to θ" />
          <ParamSlider label="θ (long-run var)" value={hestonParams.theta} min={0.001} max={0.5} step={0.001}
            onChange={set('theta')} desc="Long-run variance level" />
          <ParamSlider label="ξ (vol of vol)" value={hestonParams.xi} min={0.01} max={2} step={0.01}
            onChange={set('xi')} desc="Volatility of variance" />
          <ParamSlider label="ρ (spot-vol corr)" value={hestonParams.rho} min={-0.99} max={0.99} step={0.01}
            onChange={set('rho')} desc="Neg: downside skew" />
          <div className="space-y-2">
            <div>
              <label className="text-xs text-slate-400">S (spot)</label>
              <input type="number" value={hestonParams.s} onChange={e => set('s')(parseFloat(e.target.value) || 100)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-2 py-1 focus:outline-none focus:border-cyan-500 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-slate-400">r (risk-free)</label>
              <input type="number" step="0.001" value={hestonParams.r} onChange={e => set('r')(parseFloat(e.target.value) || 0.02)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-2 py-1 focus:outline-none focus:border-cyan-500 mt-0.5" />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {surfaceResult && (
        <div className="space-y-4">
          {/* Heatmap */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-1">Implied Volatility Surface</p>
            <p className="text-xs text-slate-500 mb-3">Heston model IV(K/S, τ) — darker = higher IV. Y=expiry, X=moneyness.</p>
            <SurfaceHeatmap
              moneyness={surfaceResult.moneyness}
              expiries={surfaceResult.expiries}
              ivGrid={surfaceResult.iv_grid}
            />
            {/* Colorbar hint */}
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-32 rounded" style={{ background: 'linear-gradient(to right, rgb(0,0,220), rgb(200,50,0), rgb(255,200,0))' }} />
              <span className="text-[10px] text-slate-500">Low IV → High IV</span>
            </div>
          </div>

          {/* Smile + Term structure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <p className="text-xs font-semibold text-slate-300 mb-1">Vol Smile (mid expiry)</p>
              <p className="text-xs text-slate-500 mb-3">IV vs moneyness — negative ρ creates left skew.</p>
              <SmileChart smile={surfaceResult.smile} />
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <p className="text-xs font-semibold text-slate-300 mb-1">ATM Term Structure</p>
              <p className="text-xs text-slate-500 mb-3">IV at K=S across maturities — κ controls slope.</p>
              <TermStructureChart ts={surfaceResult.term_structure} />
            </div>
          </div>
        </div>
      )}

      {!surfaceResult && !surfaceLoading && (
        <div className="flex items-center justify-center h-48 rounded-xl border border-slate-700 bg-slate-900/30 text-slate-500 text-sm">
          Adjust parameters and click Generate Surface
        </div>
      )}

      {/* Theory note */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">Heston Stochastic Volatility Model</p>
        <p><MathText text="$dS = \mu S\,dt + \sqrt{v}\,S\,dW_1 \;\cdot\; dv = \kappa(\theta - v)\,dt + \xi\sqrt{v}\,dW_2 \;\cdot\; \mathrm{Corr}(dW_1,dW_2) = \rho$" /></p>
        <p><MathText text="Feller condition: $2\kappa\theta > \xi^2$ ensures $v(t) > 0$. Negative $\rho$ generates left skew (equity smile)." /></p>
        <p><MathText text="$\kappa$: mean-reversion speed · $\theta$: long-run variance · $\xi$: vol-of-vol · $v_0$: initial variance" /></p>
      </div>
    </div>
  );
};
