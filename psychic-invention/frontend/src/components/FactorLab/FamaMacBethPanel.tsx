/**
 * Fama-MacBeth Panel — M6 L1
 * Two-stage cross-sectional regression to estimate factor risk premia λ.
 *
 * Stage 1: Time-series OLS per asset → β̂_i
 * Stage 2: Cross-sectional regression per period → λ̂_t
 * Inference: λ̂ = mean(λ̂_t), SE = std(λ̂_t)/√T, t = λ̂/SE
 */
import { useFactorContext } from '@/context/FactorContext';
import { MathText } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(3) + '%';
const fmt4 = (v: number) => v.toFixed(4);

function sigStars(p: number) {
  if (p < 0.01) return '***';
  if (p < 0.05) return '**';
  if (p < 0.10) return '*';
  return '';
}

// ── Lambda time-series bar chart ─────────────────────────────────────────────
function LambdaChart({
  lambdas, ses, labels,
}: { lambdas: number[]; ses: number[]; labels: string[] }) {
  const N = lambdas.length;
  if (!N) return null;
  const W = 520; const H = 160;
  const pad = { l: 60, r: 16, t: 24, b: 36 };
  const max = Math.max(...lambdas.map(Math.abs), ...ses, 0.005) * 1.3;

  const fy = (v: number) =>
    H - pad.b - ((v + max) / (2 * max)) * (H - pad.t - pad.b);
  const zero = fy(0);

  const bw = (W - pad.l - pad.r) / (N * 2);
  const yTicks = [-max, -max / 2, 0, max / 2, max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {yTicks.map((v, k) => (
        <g key={k}>
          <line x1={pad.l} y1={fy(v)} x2={W - pad.r} y2={fy(v)}
            stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
          <text x={pad.l - 4} y={fy(v) + 3} textAnchor="end" fontSize="7" fill="#94a3b8">
            {pct(v)}
          </text>
        </g>
      ))}
      <line x1={pad.l} y1={zero} x2={W - pad.r} y2={zero} stroke="#475569" strokeWidth="1" />

      {lambdas.map((lam, i) => {
        const x  = pad.l + i * bw * 2 + bw * 0.3;
        const y  = lam >= 0 ? fy(lam) : zero;
        const h  = Math.abs(fy(lam) - zero);
        const se = ses[i] ?? 0;
        const eY = fy(lam + se);
        const eY2 = fy(lam - se);
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={Math.max(h, 1)}
              fill={lam >= 0 ? '#f59e0b' : '#f87171'} opacity={0.8} />
            {/* ±1 SE error bar */}
            <line x1={x + bw / 2} y1={eY} x2={x + bw / 2} y2={eY2}
              stroke="#e2e8f0" strokeWidth="1.5" />
            <line x1={x + bw / 4} y1={eY}  x2={x + 3 * bw / 4} y2={eY}
              stroke="#e2e8f0" strokeWidth="1" />
            <line x1={x + bw / 4} y1={eY2} x2={x + 3 * bw / 4} y2={eY2}
              stroke="#e2e8f0" strokeWidth="1" />
            <text x={x + bw / 2} y={H - pad.b + 12} textAnchor="middle" fontSize="8" fill="#94a3b8">
              {labels[i]}
            </text>
          </g>
        );
      })}
      <text x={12} y={H / 2} textAnchor="middle" fontSize="9" fill="#64748b"
        transform={`rotate(-90,12,${H / 2})`}>λ (annualised)</text>
    </svg>
  );
}

// ── Beta scatter (N assets, market β on x-axis, avg return on y) ─────────────
function BetaReturnScatter({
  betas, labels, returnMatrix,
}: { betas: number[]; labels: string[]; returnMatrix: number[][] }) {
  const N = betas.length;
  if (!N || !returnMatrix.length) return null;
  const T = returnMatrix.length;
  const avgRets = Array.from({ length: N }, (_, i) =>
    returnMatrix.reduce((s, row) => s + row[i], 0) / T
  );

  const W = 480; const H = 180;
  const pad = { l: 52, r: 16, t: 16, b: 36 };
  const minB = Math.min(...betas) - 0.1;
  const maxB = Math.max(...betas) + 0.1;
  const minR = Math.min(...avgRets);
  const maxR = Math.max(...avgRets);
  const rRange = maxR - minR || 0.001;
  const bRange = maxB - minB || 0.1;

  const px = (b: number) => pad.l + ((b - minB) / bRange) * (W - pad.l - pad.r);
  const py = (r: number) => H - pad.b - ((r - minR) / rRange) * (H - pad.t - pad.b);

  // SML line from OLS: r = λ₀ + λ₁·β
  // Simple: draw from (minB, λ₀ + λ₁*minB) to (maxB, λ₀ + λ₁*maxB)
  const xMean = betas.reduce((s, b) => s + b, 0) / N;
  const yMean = avgRets.reduce((s, r) => s + r, 0) / N;
  const cov   = betas.reduce((s, b, i) => s + (b - xMean) * (avgRets[i] - yMean), 0) / N;
  const varB  = betas.reduce((s, b) => s + (b - xMean) ** 2, 0) / N || 1;
  const slope = cov / varB;
  const intercept = yMean - slope * xMean;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {/* Axes */}
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="#475569" />
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#475569" />
      {/* SML */}
      <line
        x1={px(minB)} y1={py(intercept + slope * minB)}
        x2={px(maxB)} y2={py(intercept + slope * maxB)}
        stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3" opacity={0.7}
      />
      {/* Asset dots */}
      {betas.map((b, i) => (
        <g key={i}>
          <circle cx={px(b)} cy={py(avgRets[i])} r={4} fill="#22d3ee" opacity={0.8} />
          <text x={px(b) + 6} y={py(avgRets[i]) + 3} fontSize="7" fill="#94a3b8">{labels[i]}</text>
        </g>
      ))}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="#64748b">Market β</text>
      <text x={12} y={H / 2} textAnchor="middle" fontSize="8" fill="#64748b"
        transform={`rotate(-90,12,${H / 2})`}>Avg Return</text>
      <text x={W - 80} y={14} fontSize="7" fill="#f59e0b">— SML</text>
    </svg>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export const FamaMacBethPanel = () => {
  const {
    labels, returnMatrix, benchmarkSymbol,
    fmbResult, fmbLoading, computeFamaMacBeth, error,
  } = useFactorContext();

  const hasData = returnMatrix.length > 0;

  // Factor names: intercept + market
  const factorNames = ['Intercept (λ₀)', `Market Premium (λ_m) — ${benchmarkSymbol}`];

  // Annualise lambdas (×252 trading days)
  const lambdasAnn = (fmbResult?.lambdas ?? []).map(l => l * 252);
  const sesAnn     = (fmbResult?.std_errors ?? []).map(s => s * 252);
  const tStats     = fmbResult?.t_stats ?? [];
  const pValues    = fmbResult?.p_values ?? [];

  // Asset market betas (first factor beta, col 0)
  const assetBetas = (fmbResult?.betas ?? []).map(b => b[0] ?? 0);

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 p-4 text-amber-300 text-sm">
          Use the <strong>Data Source</strong> panel above to load assets. Fama-MacBeth regresses cross-sectional returns on market betas each period.
        </div>
      )}

      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-200">Fama-MacBeth Two-Pass Regression</p>
          {hasData && (
            <p className="text-xs text-slate-500 mt-0.5">
              {returnMatrix.length} periods · {labels.length} assets · factor: {benchmarkSymbol}
            </p>
          )}
        </div>
        <button onClick={computeFamaMacBeth}
          disabled={fmbLoading || !hasData}
          className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-40 transition flex items-center gap-2">
          {fmbLoading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Regressing…</>
            : 'Run Fama-MacBeth'}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {fmbResult && (
        <div className="space-y-4">
          {/* Risk premia table */}
          <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 p-4">
            <p className="text-sm font-semibold text-amber-300 mb-3">Factor Risk Premia — Stage 2 Results</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-700">
                    <th className="pb-2 text-left font-medium">Factor</th>
                    <th className="pb-2 text-right font-medium">λ̂ (ann.)</th>
                    <th className="pb-2 text-right font-medium">SE</th>
                    <th className="pb-2 text-right font-medium">t-stat</th>
                    <th className="pb-2 text-right font-medium">p-value</th>
                    <th className="pb-2 text-right font-medium">Sig.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {lambdasAnn.map((lam, i) => {
                    const p = pValues[i] ?? 1;
                    const t = tStats[i] ?? 0;
                    const sig = sigStars(p);
                    return (
                      <tr key={i}>
                        <td className="py-2 text-slate-300">{factorNames[i] ?? `λ_${i}`}</td>
                        <td className={`py-2 text-right font-mono ${lam > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pct(lam)}
                        </td>
                        <td className="py-2 text-right font-mono text-slate-400">{pct(sesAnn[i])}</td>
                        <td className={`py-2 text-right font-mono ${Math.abs(t) > 2 ? 'text-white' : 'text-slate-500'}`}>
                          {fmt4(t)}
                        </td>
                        <td className="py-2 text-right font-mono text-slate-400">{p.toFixed(4)}</td>
                        <td className="py-2 text-right font-bold text-amber-300">{sig}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-600 mt-2">
              *** p&lt;0.01 · ** p&lt;0.05 · * p&lt;0.10 · Annualised by ×252 · FM standard errors from cross-time dispersion of λ_t
            </p>
          </div>

          {/* Lambda chart */}
          {lambdasAnn.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <p className="text-xs font-semibold text-slate-300 mb-1">Estimated Factor Premia (annualised)</p>
              <p className="text-xs text-slate-500 mb-3">Bars = λ̂ · Error bars = ±1 SE</p>
              <LambdaChart
                lambdas={lambdasAnn}
                ses={sesAnn}
                labels={factorNames.map(n => n.split(' ')[0])}
              />
            </div>
          )}

          {/* Beta-return scatter */}
          {assetBetas.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <p className="text-xs font-semibold text-slate-300 mb-1">Security Market Line (Stage 1 betas vs avg returns)</p>
              <p className="text-xs text-slate-500 mb-3">Dots = assets · Dashed = SML fitted line</p>
              <BetaReturnScatter
                betas={assetBetas}
                labels={labels}
                returnMatrix={returnMatrix}
              />
            </div>
          )}
        </div>
      )}

      {/* Theory */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">Fama-MacBeth Regression (M6 L1)</p>
        <p><MathText text="Stage 1 — Time-series OLS: $R_{it} = \alpha_i + \boldsymbol{\beta}_i^\top \mathbf{f}_t + \varepsilon_{it}$ → $\hat{\boldsymbol{\beta}}_i$ per asset." /></p>
        <p><MathText text="Stage 2 — Cross-section: $\bar{r}_i = \lambda_0 + \hat{\boldsymbol{\beta}}_i^\top\boldsymbol{\lambda} + \alpha_i$ each period $t$ → $\hat{\boldsymbol{\lambda}}_t$." /></p>
        <p><MathText text="$\hat{\lambda}_k = \overline{\hat{\lambda}_{k,t}}$, $\;\mathrm{SE}(\hat{\lambda}_k) = \mathrm{std}(\hat{\lambda}_{k,t})/\sqrt{T}$ (Fama-MacBeth standard errors)." /></p>
        <p><MathText text="Positive $\lambda_{\text{market}}$ = investors demand compensation for bearing market risk." /></p>
      </div>
    </div>
  );
};
