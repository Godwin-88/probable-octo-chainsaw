/**
 * Monte Carlo Portfolio Simulation Panel — M1 L2
 *
 * Simulates n_paths of portfolio P&L over a horizon of T days.
 * Distribution choice:
 *   Normal:    r_t ~ N(μ_p, σ_p)
 *   Student-t: r_t ~ t(df, loc=μ_p, scale=σ_p)
 *
 * Terminal wealth:  W_T = W₀ · ∏_{t=1}^{T} (1 + r_t)
 * Loss:             L = W₀ − W_T
 * VaR(α):           α-th quantile of L distribution
 * CVaR(α):          E[L | L ≥ VaR(α)]
 *
 * Live data: μ_p, σ_p estimated from yfinance price history.
 * Source: M1 L2 Lesson Notes — VaR
 */
import { useState } from 'react';
import { useScenariosContext } from '@/context/ScenariosContext';
import { MathText } from '@/components/ui/Math';

const pct  = (v: number) => (v * 100).toFixed(2) + '%';
const money = (v: number) => v >= 1e6
  ? `$${(v / 1e6).toFixed(3)}M`
  : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}k` : `$${v.toFixed(0)}`;

// ── Terminal wealth percentile fan chart ─────────────────────────────────────
function WealthFan({
  mean, std, p5, p25, p50, p75, p95, initial,
}: {
  mean: number; std: number;
  p5: number; p25: number; p50: number; p75: number; p95: number;
  initial: number;
}) {
  const W = 560; const H = 160;
  const pad = { l: 64, r: 16, t: 16, b: 28 };

  const allV = [p5, p25, p50, p75, p95, initial];
  const minV = Math.min(...allV) * 0.97;
  const maxV = Math.max(...allV) * 1.03;
  const rng  = maxV - minV || 1;

  const px = (x: number, totalW: number) => pad.l + ((x - minV) / rng) * (totalW - pad.l - pad.r);
  const barX0 = pad.l; const barW = W - pad.l - pad.r;

  const pxv = (v: number) => pad.l + ((v - minV) / rng) * barW;

  const yTicks = [p5, p25, p50, p75, p95, initial].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {/* Background bands */}
      <rect x={pxv(p5)}  y={pad.t} width={pxv(p95) - pxv(p5)}  height={H - pad.t - pad.b} fill="#1e293b" opacity={0.5} rx={3} />
      <rect x={pxv(p25)} y={pad.t} width={pxv(p75) - pxv(p25)} height={H - pad.t - pad.b} fill="#334155" opacity={0.6} rx={3} />
      {/* Median */}
      <line x1={pxv(p50)} y1={pad.t} x2={pxv(p50)} y2={H - pad.b} stroke="#22d3ee" strokeWidth="2" />
      {/* Mean */}
      <line x1={pxv(mean)} y1={pad.t} x2={pxv(mean)} y2={H - pad.b} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" />
      {/* Initial value */}
      <line x1={pxv(initial)} y1={pad.t} x2={pxv(initial)} y2={H - pad.b} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />

      {/* Axis labels */}
      {[p5, p25, p50, p75, p95].map((v, i) => (
        <text key={i} x={pxv(v)} y={H - pad.b + 12} textAnchor="middle" fontSize="7" fill="#64748b">
          {money(v)}
        </text>
      ))}
      <text x={pxv(initial)} y={pad.t - 2} textAnchor="middle" fontSize="7" fill="#94a3b8">W₀</text>
      <text x={pxv(mean)}    y={pad.t - 2} textAnchor="middle" fontSize="7" fill="#f59e0b">E[W]</text>
      <text x={pxv(p50)}     y={H - pad.b + 22} textAnchor="middle" fontSize="7" fill="#22d3ee">Median</text>

      {/* Legend */}
      <rect x={barX0 + 4} y={pad.t + 4} width={8} height={8} fill="#334155" opacity={0.8} rx={1} />
      <text x={barX0 + 14} y={pad.t + 11} fontSize="7" fill="#94a3b8">IQR (P25–P75)</text>
      <rect x={barX0 + 80} y={pad.t + 4} width={8} height={8} fill="#1e293b" opacity={0.8} rx={1} />
      <text x={barX0 + 90} y={pad.t + 11} fontSize="7" fill="#94a3b8">P5–P95</text>
    </svg>
  );
}

// ── VaR / CVaR visual ────────────────────────────────────────────────────────
function VaRStrip({
  label, var95, var99, cvar95, cvar99, maxVal,
}: {
  label: string;
  var95: number; var99: number; cvar95: number; cvar99: number;
  maxVal: number;
}) {
  const W = 480; const H = 60; const pad = { l: 8, r: 8, t: 8, b: 12 };
  const innerW = W - pad.l - pad.r;
  const pv = (v: number) => pad.l + (Math.min(Math.abs(v) / maxVal, 1)) * innerW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      <text x={pad.l} y={pad.t + 8} fontSize="8" fill="#94a3b8" fontWeight="600">{label}</text>
      {/* VaR 95 */}
      <rect x={pad.l} y={pad.t + 14} width={Math.max(pv(var95) - pad.l, 1)} height={10} fill="#f59e0b" opacity={0.7} />
      <text x={pv(var95) + 2} y={pad.t + 22} fontSize="7" fill="#f59e0b">{money(Math.abs(var95))} VaR95</text>
      {/* VaR 99 */}
      <rect x={pad.l} y={pad.t + 28} width={Math.max(pv(var99) - pad.l, 1)} height={10} fill="#ef4444" opacity={0.7} />
      <text x={pv(var99) + 2} y={pad.t + 36} fontSize="7" fill="#ef4444">{money(Math.abs(var99))} VaR99</text>
      {/* CVaR 95 */}
      <rect x={pv(var95)} y={pad.t + 14} width={Math.max(pv(cvar95) - pv(var95), 1)} height={10} fill="#f59e0b" opacity={0.35} />
      {/* CVaR 99 */}
      <rect x={pv(var99)} y={pad.t + 28} width={Math.max(pv(cvar99) - pv(var99), 1)} height={10} fill="#ef4444" opacity={0.35} />
      <text x={pv(cvar95) + 2} y={pad.t + 22} fontSize="6" fill="#f59e0b" opacity={0.7}>CVaR95</text>
      <text x={pv(cvar99) + 2} y={pad.t + 36} fontSize="6" fill="#ef4444" opacity={0.7}>CVaR99</text>
    </svg>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export const MonteCarloPanel = () => {
  const {
    returnMatrix, weights,
    mcResult, mcLoading, computeMonteCarlo, error,
  } = useScenariosContext();

  const hasData = returnMatrix.length > 0;

  const HORIZON_OPTIONS = [
    { label: '1d',   days: 1 },
    { label: '5d',   days: 5 },
    { label: '22d',  days: 22 },
    { label: '63d',  days: 63 },
    { label: '252d', days: 252 },
  ];
  const PATH_OPTIONS = [10_000, 50_000, 100_000];

  const [horizonDays, setHorizonDays]     = useState(1);
  const [nPaths, setNPaths]               = useState(50_000);
  const [useTDist, setUseTDist]           = useState(false);
  const [df, setDf]                       = useState(5);
  const [portfolioValue, setPortfolioValue] = useState(1_000_000);

  // Baseline portfolio moments (from live data)
  const mu   = hasData ? (() => {
    const T = returnMatrix.length;
    const portRets = returnMatrix.map(row =>
      row.reduce((s, r, i) => s + r * (weights[i] ?? 1 / row.length), 0)
    );
    return portRets.reduce((s, r) => s + r, 0) / T;
  })() : 0;
  const portVol = hasData ? (() => {
    const T = returnMatrix.length;
    const portRets = returnMatrix.map(row =>
      row.reduce((s, r, i) => s + r * (weights[i] ?? 1 / row.length), 0)
    );
    const m = portRets.reduce((s, r) => s + r, 0) / T;
    const variance = portRets.reduce((s, r) => s + (r - m) ** 2, 0) / (T - 1);
    return Math.sqrt(variance);
  })() : 0;

  const run = () => {
    computeMonteCarlo(horizonDays, nPaths, useTDist, df, portfolioValue);
  };

  const maxLoss = mcResult
    ? Math.max(Math.abs(mcResult.cvar_99), 1)
    : 1;

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="rounded-xl border border-rose-700/40 bg-rose-900/10 p-4 text-rose-300 text-sm">
          Load assets above. Monte Carlo uses μ and σ estimated from live yfinance returns.
        </div>
      )}

      {/* Controls */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">Monte Carlo Path Simulation</p>
            {hasData && (
              <p className="text-xs text-slate-500 mt-0.5">
                μ_p = {pct(mu)}/day · σ_p = {pct(portVol)}/day · from {returnMatrix.length} live obs
              </p>
            )}
          </div>
          <button
            onClick={run}
            disabled={mcLoading || !hasData}
            className="px-4 py-1.5 rounded-lg bg-rose-700 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-40 transition flex items-center gap-2"
          >
            {mcLoading
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Simulating…</>
              : `Run ${(nPaths / 1000).toFixed(0)}k Paths`}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Horizon */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Horizon</p>
            <div className="flex flex-wrap gap-1">
              {HORIZON_OPTIONS.map(h => (
                <button key={h.days} onClick={() => setHorizonDays(h.days)}
                  className={`px-2 py-0.5 rounded text-xs transition ${
                    horizonDays === h.days ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}>{h.label}</button>
              ))}
            </div>
          </div>

          {/* Paths */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Paths</p>
            <div className="flex flex-wrap gap-1">
              {PATH_OPTIONS.map(n => (
                <button key={n} onClick={() => setNPaths(n)}
                  className={`px-2 py-0.5 rounded text-xs transition ${
                    nPaths === n ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}>{(n / 1000).toFixed(0)}k</button>
              ))}
            </div>
          </div>

          {/* Distribution */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Distribution</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useTDist} onChange={e => setUseTDist(e.target.checked)}
                className="accent-rose-500" />
              <span className="text-slate-300">Student-t</span>
            </label>
            {useTDist && (
              <div className="mt-1 flex items-center gap-2">
                <input type="range" min={2} max={30} step={1} value={df}
                  onChange={e => setDf(parseInt(e.target.value))}
                  className="w-20 accent-rose-500" />
                <span className="font-mono text-rose-300">df={df}</span>
              </div>
            )}
          </div>

          {/* Portfolio value */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Portfolio Value</p>
            <div className="flex flex-wrap gap-1">
              {[100_000, 500_000, 1_000_000, 5_000_000].map(v => (
                <button key={v} onClick={() => setPortfolioValue(v)}
                  className={`px-2 py-0.5 rounded text-[10px] transition ${
                    portfolioValue === v ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}>${(v / 1000).toFixed(0)}k</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Results */}
      {mcResult && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'E[Terminal Wealth]', value: money(mcResult.terminal_wealth_mean), color: mcResult.terminal_wealth_mean >= portfolioValue ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Std Dev (W_T)',       value: money(mcResult.terminal_wealth_std),  color: 'text-amber-300' },
              { label: 'VaR 95%',            value: money(Math.abs(mcResult.var_95)),      color: 'text-orange-400' },
              { label: 'VaR 99%',            value: money(Math.abs(mcResult.var_99)),      color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-xs">
                <p className="text-slate-500 mb-1">{label}</p>
                <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Wealth distribution fan */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-1">Terminal Wealth Distribution</p>
            <p className="text-xs text-slate-500 mb-3">
              Cyan = median · Amber dashed = mean · Dark band = P5–P95 · Mid band = IQR
            </p>
            <WealthFan
              mean={mcResult.terminal_wealth_mean}
              std={mcResult.terminal_wealth_std}
              p5={mcResult.percentiles[5]}
              p25={mcResult.percentiles[25]}
              p50={mcResult.percentiles[50]}
              p75={mcResult.percentiles[75]}
              p95={mcResult.percentiles[95]}
              initial={portfolioValue}
            />
          </div>

          {/* VaR / CVaR strip */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-1">Loss Distribution — VaR & CVaR</p>
            <p className="text-xs text-slate-500 mb-3">
              Amber = VaR/CVaR 95% · Red = VaR/CVaR 99% · Faded extension = Expected Shortfall tail
            </p>
            <VaRStrip
              label={`${horizonDays}-day horizon · ${useTDist ? `Student-t (df=${df})` : 'Normal'} · W₀=${money(portfolioValue)}`}
              var95={mcResult.var_95}
              var99={mcResult.var_99}
              cvar95={mcResult.cvar_95}
              cvar99={mcResult.cvar_99}
              maxVal={maxLoss}
            />
          </div>

          {/* Detailed table */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-3">Simulation Summary</p>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-800">
                {[
                  ['Horizon', `${horizonDays} trading day(s)`],
                  ['Paths', nPaths.toLocaleString()],
                  ['Distribution', useTDist ? `Student-t (df = ${df})` : 'Normal (μ_p, σ_p)'],
                  ['Initial Value', money(portfolioValue)],
                  ['E[W_T]', money(mcResult.terminal_wealth_mean)],
                  ['σ(W_T)', money(mcResult.terminal_wealth_std)],
                  ['P5 / P95 (W_T)', `${money(mcResult.percentiles[5])} / ${money(mcResult.percentiles[95])}`],
                  ['VaR 95%', money(Math.abs(mcResult.var_95))],
                  ['CVaR 95% (ES)', money(Math.abs(mcResult.cvar_95))],
                  ['VaR 99%', money(Math.abs(mcResult.var_99))],
                  ['CVaR 99% (ES)', money(Math.abs(mcResult.cvar_99))],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-1.5 text-slate-500">{k}</td>
                    <td className="py-1.5 text-right font-mono text-slate-300">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Theory */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">Monte Carlo Portfolio Simulation (M1 L2)</p>
        <p><MathText text="$\mu_p = w^\top\mu$, $\sigma_p = \sqrt{w^\top\Sigma w}$ — portfolio moments estimated from live yfinance data." /></p>
        <p><MathText text="Path: $W_T = W_0 \cdot \prod_{t=1}^{T}(1 + r_t)$, $r_t \sim \mathcal{N}(\mu_p, \sigma_p)$ or $t(\nu, \mu_p, \sigma_p)$." /></p>
        <p><MathText text="$\mathrm{VaR}(\alpha)$ = $\alpha$-th quantile of $L = W_0 - W_T$ over all paths." /></p>
        <p><MathText text="$\mathrm{CVaR}(\alpha) = \mathbb{E}[L \mid L \geq \mathrm{VaR}(\alpha)]$ — Expected Shortfall, coherent risk measure (Basel III)." /></p>
        <p><MathText text="Fat tails: Student-$t$ with low $\nu$ captures volatility clustering and heavy tails better than Normal." /></p>
      </div>
    </div>
  );
};
