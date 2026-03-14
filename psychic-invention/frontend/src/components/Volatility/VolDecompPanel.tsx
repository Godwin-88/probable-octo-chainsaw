/**
 * Factor Vol Decomposition Panel — M2 / M6
 * Decomposes σ²_p = β_p²·σ²_m + w^T·Σ_ε·w
 * Uses AssetSearchBar for multi-asset data
 * Shows: donut chart (systematic vs idiosyncratic) · per-asset β + R² table · vol attribution
 */
import { useState } from 'react';
import { useVolatility } from '@/context/VolatilityContext';
import { AssetSearchBar } from '@/components/AssetSearchBar';
import { MathText } from '@/components/ui/Math';

const pct   = (v: number) => (v * 100).toFixed(2) + '%';
const fmt3  = (v: number) => v.toFixed(3);

// ── Donut chart ────────────────────────────────────────────────────────────────
function DonutChart({ systematic, idiosyncratic }: { systematic: number; idiosyncratic: number }) {
  const total = systematic + idiosyncratic || 1;
  const sysPct = systematic / total;
  const idioPct = idiosyncratic / total;

  const R = 60; const cx = 90; const cy = 90; const stroke = 22;
  const circ = 2 * Math.PI * R;

  // systematic arc first (starts at top = -π/2)
  const sysLen = sysPct * circ;
  const idioLen = idioPct * circ;

  return (
    <svg viewBox="0 0 180 180" className="w-full" style={{ maxHeight: 180 }}>
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1e293b" strokeWidth={stroke} />
      {/* Systematic arc */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#6366f1" strokeWidth={stroke}
        strokeDasharray={`${sysLen} ${circ - sysLen}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="butt"
      />
      {/* Idiosyncratic arc */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#22d3ee" strokeWidth={stroke}
        strokeDasharray={`${idioLen} ${circ - idioLen}`}
        strokeDashoffset={circ / 4 - sysLen}
        strokeLinecap="butt"
      />
      {/* Centre text */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="bold" fill="white">
        {pct(systematic + idiosyncratic)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#94a3b8">Total σ_p</text>
      {/* Legend */}
      <rect x={8} y={162} width={10} height={6} fill="#6366f1" rx="1" />
      <text x={22} y={168} fontSize="8" fill="#94a3b8">Systematic {pct(sysPct * 100)}</text>
      <rect x={95} y={162} width={10} height={6} fill="#22d3ee" rx="1" />
      <text x={109} y={168} fontSize="8" fill="#94a3b8">Idiosyncratic {pct(idioPct * 100)}</text>
    </svg>
  );
}

// ── Beta + R² bar chart per asset ─────────────────────────────────────────────
function BetaRSquaredChart({
  labels, betas, r2s,
}: { labels: string[]; betas: number[]; r2s: number[] }) {
  const N = labels.length;
  const W = 480; const H = 180;
  const pad = { t: 20, r: 16, b: 28, l: 40 };
  const inner = { w: W - pad.l - pad.r, h: H - pad.t - pad.b };

  const maxBeta = Math.max(...betas.map(Math.abs), 0.5);
  const barW = inner.w / (N * 2 + N + 1);
  const gap   = barW;

  const py = (v: number, min: number, max: number) =>
    H - pad.b - ((v - min) / (max - min || 1)) * inner.h;

  const betaY   = (b: number) => py(b, -maxBeta, maxBeta);
  const zeroY   = py(0, -maxBeta, maxBeta);
  const r2Y     = (r: number) => pad.t + (1 - r) * inner.h;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {/* Zero baseline */}
      <line x1={pad.l} y1={zeroY} x2={W - pad.r} y2={zeroY} stroke="#475569" strokeWidth="1" />
      {/* Grid */}
      {[-1, -0.5, 0.5, 1].map(v => {
        const y = py(v * maxBeta, -maxBeta, maxBeta);
        if (y < pad.t || y > H - pad.b) return null;
        return (
          <g key={v}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
            <text x={pad.l - 4} y={y + 3} textAnchor="end" fontSize="7" fill="#64748b">{(v * maxBeta).toFixed(1)}</text>
          </g>
        );
      })}
      {labels.map((lbl, i) => {
        const x0 = pad.l + i * (2 * barW + gap) + gap / 2;
        const beta = betas[i];
        const r2   = r2s[i];
        const bY = betaY(beta);
        const bH = Math.abs(bY - zeroY);

        return (
          <g key={lbl}>
            {/* Beta bar */}
            <rect x={x0} y={beta >= 0 ? bY : zeroY} width={barW} height={bH}
              fill={beta >= 0 ? '#6366f1' : '#f87171'} opacity={0.85} />
            {/* R² bar (on right, full height representing 0-1) */}
            <rect x={x0 + barW} y={r2Y(r2)} width={barW} height={(1 - r2) > 0 ? H - pad.b - r2Y(r2) : 0}
              fill="#22d3ee" opacity={0.6} />
            {/* Label */}
            <text x={x0 + barW} y={H - pad.b + 11} textAnchor="middle" fontSize="8" fill="#94a3b8">{lbl}</text>
            {/* Value on bar */}
            <text x={x0 + barW / 2} y={beta >= 0 ? bY - 2 : bY + 8} textAnchor="middle" fontSize="7" fill="white">
              β={beta.toFixed(2)}
            </text>
          </g>
        );
      })}
      {/* Top title */}
      <text x={pad.l} y={12} fontSize="8" fill="#64748b">β (purple) · R² (cyan)</text>
    </svg>
  );
}

// ── Vol attribution horizontal bars ───────────────────────────────────────────
function VolAttributionBars({
  systematic, idiosyncratic,
}: { systematic: number; idiosyncratic: number }) {
  const total = systematic + idiosyncratic || 1;
  const items = [
    { label: 'Systematic σ',    value: systematic,    color: '#6366f1' },
    { label: 'Idiosyncratic σ', value: idiosyncratic, color: '#22d3ee' },
    { label: 'Total σ_p',       value: total,         color: '#f59e0b' },
  ];
  return (
    <div className="space-y-2">
      {items.map(({ label, value, color }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-300 w-36 text-right">{label}</span>
          <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-500"
              style={{ width: `${(value / total) * 100}%`, background: color }} />
          </div>
          <span className="text-xs font-mono text-slate-300 w-16">{pct(value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export const VolDecompPanel = () => {
  const {
    multiLabels, multiReturns, weights, setWeights,
    decompResult, decompLoading, computeDecomp,
    fetchMultiAssets, multiLoading, error,
  } = useVolatility();

  const [chips,  setChips]  = useState<string[]>([]);
  const [period, setPeriod] = useState('1y');

  const handleFetch = async () => {
    if (chips.length < 2) return;
    await fetchMultiAssets(chips, period);
  };

  const N = multiLabels.length;
  const wSum = weights.reduce((s, w) => s + w, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Asset search */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-200">Select Portfolio Assets</p>
        <AssetSearchBar
          chips={chips}
          onAdd={sym => setChips(prev => prev.includes(sym) ? prev : [...prev, sym])}
          onRemove={sym => setChips(prev => prev.filter(s => s !== sym))}
          maxChips={10}
          accentBg="bg-violet-900/40"
          accentBorder="border-violet-700/50"
          accentText="text-violet-200"
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {['1y','2y','5y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  period === p ? 'bg-violet-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}>{p}</button>
            ))}
          </div>
          <button onClick={handleFetch} disabled={chips.length < 2 || multiLoading}
            className="px-4 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-40 transition flex items-center gap-2">
            {multiLoading
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Loading…</>
              : 'Fetch Data'}
          </button>
          {chips.length < 2 && <p className="text-xs text-amber-400">Select at least 2 assets</p>}
          {multiReturns.length > 0 && <span className="text-xs text-slate-400">{multiReturns.length} obs × {N} assets · live yfinance data</span>}
        </div>
      </div>

      {/* Weights editor */}
      {N > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-200">Portfolio Weights</p>
            <div className="flex gap-2">
              <button onClick={() => setWeights(Array(N).fill(1 / N))}
                className="px-3 py-1 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 transition">
                Equal weight
              </button>
              <button onClick={computeDecomp} disabled={decompLoading}
                className="px-4 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-40 transition flex items-center gap-2">
                {decompLoading
                  ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Computing…</>
                  : 'Decompose Vol'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {multiLabels.map((lbl, i) => (
              <div key={lbl}>
                <label className="text-xs text-slate-400">{lbl}</label>
                <input
                  type="number" step="0.01" min="0" max="1"
                  value={(weights[i] ?? 1 / N).toFixed(3)}
                  onChange={e => {
                    const v = Math.max(0, parseFloat(e.target.value) || 0);
                    const next = [...weights];
                    next[i] = v;
                    setWeights(next);
                  }}
                  className="w-full mt-0.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-2 py-1 focus:outline-none focus:border-violet-500"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600">
            Sum of weights: <span className="text-slate-400">{wSum.toFixed(3)}</span>
            {Math.abs(wSum - 1) > 0.01 && <span className="text-amber-400 ml-2">— will be normalised by backend</span>}
          </p>
        </div>
      )}

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {decompResult && (() => {
        const d = decompResult;
        return (
          <div className="space-y-4">
            {/* Summary row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Total σ_p',       value: pct(d.total_vol),         color: 'text-amber-300' },
                { label: 'Systematic σ',    value: pct(d.systematic_vol),    color: 'text-indigo-300' },
                { label: 'Idiosyncratic σ', value: pct(d.idiosyncratic_vol), color: 'text-cyan-300' },
                { label: 'Systematic %',    value: pct(d.systematic_pct),    color: 'text-indigo-300' },
                { label: 'Portfolio β',     value: fmt3(d.portfolio_beta),   color: 'text-slate-200' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-xs">
                  <p className="text-slate-500 mb-1">{label}</p>
                  <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Donut + attribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <p className="text-xs font-semibold text-slate-300 mb-3">Variance Attribution</p>
                <div className="flex justify-center">
                  <div style={{ width: '60%' }}>
                    <DonutChart systematic={d.systematic_vol} idiosyncratic={d.idiosyncratic_vol} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <p className="text-xs font-semibold text-slate-300 mb-3">Vol Components</p>
                <VolAttributionBars systematic={d.systematic_vol} idiosyncratic={d.idiosyncratic_vol} />
                <div className="mt-4 text-xs text-slate-500 space-y-0.5">
                  <p><MathText text="$\sigma^2_p = \beta_p^2\sigma^2_m + \mathbf{w}^\top\Sigma_\varepsilon\mathbf{w}$" /></p>
                  <p>Systematic: <span className="text-slate-300">{pct(d.systematic_pct)}</span> of variance</p>
                  <p>Idiosyncratic: <span className="text-slate-300">{pct(d.idiosyncratic_pct)}</span> of variance</p>
                </div>
              </div>
            </div>

            {/* Per-asset beta + R² */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <p className="text-xs font-semibold text-slate-300 mb-3">Per-Asset Factor Exposures</p>
              <BetaRSquaredChart labels={multiLabels} betas={d.asset_betas} r2s={d.asset_r_squared} />
              {/* Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700">
                      <th className="pb-2 text-left font-medium">Asset</th>
                      <th className="pb-2 text-right font-medium">β</th>
                      <th className="pb-2 text-right font-medium pl-4">R²</th>
                      <th className="pb-2 text-right font-medium pl-4">Weight</th>
                      <th className="pb-2 text-right font-medium pl-4">β·w</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {multiLabels.map((lbl, i) => {
                      const w = (weights[i] ?? 1 / N) / wSum;
                      return (
                        <tr key={lbl}>
                          <td className="py-1.5 text-white font-mono">{lbl}</td>
                          <td className="py-1.5 text-right font-mono text-slate-300">{fmt3(d.asset_betas[i])}</td>
                          <td className="py-1.5 text-right font-mono text-slate-300 pl-4">{pct(d.asset_r_squared[i])}</td>
                          <td className="py-1.5 text-right font-mono text-slate-300 pl-4">{pct(w)}</td>
                          <td className="py-1.5 text-right font-mono text-slate-300 pl-4">{fmt3(d.asset_betas[i] * w)}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-slate-600 font-semibold">
                      <td className="py-1.5 text-slate-400">Portfolio β</td>
                      <td className="py-1.5 text-right text-white font-mono" colSpan={4}>{fmt3(d.portfolio_beta)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {!decompResult && !decompLoading && (
        <div className="flex items-center justify-center h-40 rounded-xl border border-slate-700 bg-slate-900/30 text-slate-500 text-sm">
          {multiReturns.length > 0
            ? 'Set weights and click "Decompose Vol"'
            : 'Demo data loaded (AAPL/MSFT/GOOGL/AMZN/TSLA) — fetch live data or decompose now'}
        </div>
      )}

      {/* Theory */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">M2 / M6 — Factor-Based Variance Decomposition</p>
        <p><MathText text="$\sigma^2_p = \beta_p^2\sigma^2_m + \mathbf{w}^\top\Sigma_\varepsilon\mathbf{w}$ where $\beta_p = \mathbf{w}^\top\boldsymbol{\beta}$ and $\Sigma_\varepsilon = \mathrm{diag}(\sigma^2_{\varepsilon,i})$" /></p>
        <p>Systematic component explained by market factor (CAPM); idiosyncratic is diversifiable.</p>
        <p><MathText text="$R^2_i = 1 - \mathrm{Var}(\varepsilon_i)/\mathrm{Var}(r_i)$: fraction of asset variance explained by market." /></p>
        <p><MathText text="Portfolio diversification reduces idiosyncratic risk as $N \to \infty$ (law of large numbers)." /></p>
      </div>
    </div>
  );
};
