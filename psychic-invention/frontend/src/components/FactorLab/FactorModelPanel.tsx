/**
 * Factor Model Panel — M2 L4 / M6
 * OLS time-series factor model: R_it = α_i + β_i^T f_t + ε_it
 * Factor = benchmark (SPY or user-defined) returns.
 * Displays: per-asset α, β, R², residual variance + covariance decomposition.
 */
import { useFactorContext } from '@/context/FactorContext';
import { MathText } from '@/components/ui/Math';

const pct  = (v: number) => (v * 100).toFixed(2) + '%';
const fmt3 = (v: number) => v.toFixed(3);

// ── β bar chart ──────────────────────────────────────────────────────────────
function BetaBarChart({ labels, betas }: { labels: string[]; betas: number[] }) {
  const N = labels.length;
  if (!N) return null;
  const W = 560; const H = 160;
  const pad = { l: 52, r: 16, t: 16, b: 36 };
  const max = Math.max(...betas.map(Math.abs), 0.5) * 1.2;
  const bw  = (W - pad.l - pad.r) / (N * 1.6);
  const zero = H - pad.b - ((0 - (-max)) / (2 * max)) * (H - pad.t - pad.b);

  const fy = (v: number) => H - pad.b - ((v - (-max)) / (2 * max)) * (H - pad.t - pad.b);
  const yTicks = [-max, -max / 2, 0, max / 2, max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {yTicks.map((v, k) => (
        <g key={k}>
          <line x1={pad.l} y1={fy(v)} x2={W - pad.r} y2={fy(v)}
            stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
          <text x={pad.l - 4} y={fy(v) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">
            {v.toFixed(1)}
          </text>
        </g>
      ))}
      <line x1={pad.l} y1={zero} x2={W - pad.r} y2={zero} stroke="#475569" strokeWidth="1" />
      {betas.map((b, i) => {
        const x = pad.l + i * bw * 1.6 + bw * 0.3;
        const y = b >= 0 ? fy(b) : zero;
        const h = Math.abs(fy(b) - zero);
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={Math.max(h, 1)} fill={b >= 0 ? '#22d3ee' : '#f87171'} opacity={0.8} />
            <text x={x + bw / 2} y={H - pad.b + 12} textAnchor="middle" fontSize="8" fill="#94a3b8">
              {labels[i]}
            </text>
            <text x={x + bw / 2} y={b >= 0 ? fy(b) - 3 : fy(b) + 11} textAnchor="middle" fontSize="7" fill="#e2e8f0">
              {b.toFixed(2)}
            </text>
          </g>
        );
      })}
      <text x={12} y={H / 2} textAnchor="middle" fontSize="9" fill="#64748b"
        transform={`rotate(-90,12,${H / 2})`}>Market β</text>
    </svg>
  );
}

// ── R² / residual var chart ──────────────────────────────────────────────────
function R2Chart({ labels, r2, residVar }: { labels: string[]; r2: number[]; residVar: number[] }) {
  const N = labels.length;
  if (!N) return null;
  const W = 560; const H = 120;
  const pad = { l: 8, r: 8, t: 16, b: 24 };
  const bw = (W - pad.l - pad.r) / (N + 0.5);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {r2.map((r, i) => {
        const x  = pad.l + i * bw + bw * 0.1;
        const h  = r * (H - pad.t - pad.b);
        const y  = H - pad.b - h;
        const rv = Math.sqrt(residVar[i] ?? 0);
        return (
          <g key={i}>
            {/* R² filled bar */}
            <rect x={x} y={y} width={bw * 0.8} height={h} fill="#6366f1" opacity={0.75} />
            {/* Idiosyncratic σ as thin red bar on top */}
            <rect x={x} y={y - rv * (H - pad.t - pad.b) * 5} width={bw * 0.8}
              height={rv * (H - pad.t - pad.b) * 5} fill="#f87171" opacity={0.5} />
            <text x={x + bw * 0.4} y={H - pad.b + 12} textAnchor="middle" fontSize="7" fill="#94a3b8">
              {labels[i]}
            </text>
            <text x={x + bw * 0.4} y={Math.max(y - 3, pad.t)} textAnchor="middle" fontSize="7" fill="#e2e8f0">
              {(r * 100).toFixed(0)}%
            </text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={W - 120} y={6} width={8} height={6} fill="#6366f1" opacity={0.75} />
      <text x={W - 109} y={12} fontSize="7" fill="#94a3b8">R² (systematic)</text>
      <rect x={W - 120} y={16} width={8} height={6} fill="#f87171" opacity={0.5} />
      <text x={W - 109} y={22} fontSize="7" fill="#94a3b8">σ_ε (idiosyncratic)</text>
    </svg>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export const FactorModelPanel = () => {
  const {
    symbols, labels, returnMatrix, benchmarkSymbol,
    factorModelResult, factorLoading, computeFactorModel, error,
  } = useFactorContext();

  const hasData = returnMatrix.length > 0;

  // Market betas = index 1 in betas (index 0 = intercept)
  const mktBetas  = factorModelResult?.betas.map(b => b[1] ?? 0) ?? [];
  const alphas    = factorModelResult?.alphas ?? [];
  const r2        = factorModelResult?.r_squared ?? [];
  const residVar  = factorModelResult?.residual_var ?? [];

  // Portfolio-weighted systemic vs idiosyncratic (equal weights)
  const N = symbols.length || 1;
  const w = 1 / N;
  const portBeta  = mktBetas.reduce((s, b) => s + b * w, 0);
  const portAlpha = alphas.reduce((s, a) => s + a * w, 0);
  const portR2    = r2.reduce((s, r) => s + r * w, 0);

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 p-4 text-amber-300 text-sm">
          Use the <strong>Data Source</strong> panel above to load assets. The benchmark ({benchmarkSymbol}) is used as the market factor.
        </div>
      )}

      {/* Run button */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-200">OLS Factor Model (CAPM single-factor)</p>
          {hasData && (
            <p className="text-xs text-slate-500 mt-0.5">
              {returnMatrix.length} obs · {symbols.length} assets · factor: <span className="text-amber-300 font-mono">{benchmarkSymbol}</span>
            </p>
          )}
        </div>
        <button onClick={computeFactorModel}
          disabled={factorLoading || !hasData}
          className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-40 transition flex items-center gap-2">
          {factorLoading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Estimating…</>
            : 'Run Factor Model'}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {factorModelResult && (
        <div className="space-y-4">
          {/* Portfolio summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Portfolio β', value: fmt3(portBeta), color: portBeta > 1 ? 'text-red-300' : 'text-cyan-300' },
              { label: 'Portfolio α (daily)', value: pct(portAlpha), color: portAlpha > 0 ? 'text-emerald-300' : 'text-red-300' },
              { label: 'Avg R²', value: pct(portR2), color: 'text-violet-300' },
              { label: 'Assets', value: `${symbols.length} vs ${benchmarkSymbol}`, color: 'text-slate-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-xs">
                <p className="text-slate-500 mb-1">{label}</p>
                <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Asset table */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-3">Per-Asset Estimates</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-700">
                    <th className="pb-2 text-left font-medium">Asset</th>
                    <th className="pb-2 text-right font-medium">α (daily)</th>
                    <th className="pb-2 text-right font-medium">β (market)</th>
                    <th className="pb-2 text-right font-medium">R²</th>
                    <th className="pb-2 text-right font-medium">σ_ε</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {labels.map((lbl, i) => (
                    <tr key={i}>
                      <td className="py-1.5 font-mono text-white">{lbl}</td>
                      <td className={`py-1.5 text-right font-mono ${alphas[i] > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pct(alphas[i])}
                      </td>
                      <td className={`py-1.5 text-right font-mono ${mktBetas[i] > 1 ? 'text-amber-400' : 'text-cyan-400'}`}>
                        {fmt3(mktBetas[i])}
                      </td>
                      <td className="py-1.5 text-right font-mono text-violet-300">
                        {pct(r2[i])}
                      </td>
                      <td className="py-1.5 text-right font-mono text-slate-400">
                        {pct(Math.sqrt(residVar[i] ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Beta chart */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-1">Market β — Asset Comparison</p>
            <p className="text-xs text-slate-500 mb-3">Cyan = β &gt; 0 (positively correlated), Red = β &lt; 0 (hedges market)</p>
            <BetaBarChart labels={labels} betas={mktBetas} />
          </div>

          {/* R² chart */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-1">R² Systematic vs Idiosyncratic Decomposition</p>
            <p className="text-xs text-slate-500 mb-3">Purple = variance explained by market factor · Red = idiosyncratic residual σ</p>
            <R2Chart labels={labels} r2={r2} residVar={residVar} />
          </div>
        </div>
      )}

      {/* Theory */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">CAPM Factor Model (M2 L4)</p>
        <p><MathText text="$R_{it} = \alpha_i + \beta_i R_{Mt} + \varepsilon_{it}$ — estimated by time-series OLS for each asset $i$." /></p>
        <p><MathText text="Covariance: $\hat{\Omega} = B\Sigma_f B^\top + \Sigma_\varepsilon$ · Systematic: $\beta_i^2\sigma_m^2$ · Idiosyncratic: $\sigma^2_{\varepsilon,i}$" /></p>
        <p><MathText text="$R^2 = 1 - \sigma^2_\varepsilon / \sigma^2_R$ — fraction of variance explained by the market factor." /></p>
      </div>
    </div>
  );
};
