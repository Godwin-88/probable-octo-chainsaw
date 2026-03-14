/**
 * VaR Calculator Panel — TRANSACT_APP_SPEC §3.3.1
 * M1 L2: Historical, Parametric Normal, Parametric t, Monte Carlo VaR + ES
 *
 * Formulae:
 *   Historical:  VaR̂_np(1-α) = M · q̂(α)
 *   Normal:      VaR̂_p(1-α) = M · (μ̂ + σ̂ · Φ⁻¹(α))
 *   t-dist:      VaR̂_p(1-α) = M · (μ̂ + σ̂ · F_ν⁻¹(α)), ν via MLE
 *   MC:          1M paths from fitted distribution
 *   Scaling:     VaR(T) = VaR(1) × √T  (square-root of time)
 *   Div. benefit = Σ VaR_i − VaR_p  (sub-additivity)
 */
import { useState } from 'react';
import { useRisk } from '@/context/RiskContext';
import { downloadFile, generateFilename } from '@/utils/export';
import { MathBlock } from '@/components/ui/Math';

const CONFIDENCE_OPTIONS = [
  { label: '90% (VaR₀.₁₀)', alpha: 0.10 },
  { label: '95% (VaR₀.₀₅)', alpha: 0.05 },
  { label: '99% (VaR₀.₀₁)', alpha: 0.01 },
  { label: '99.9% Basel III', alpha: 0.001 },
];

const HORIZON_OPTIONS = [
  { label: '1-day',   days: 1 },
  { label: '10-day',  days: 10 },
  { label: '21-day',  days: 21 },
];

const METHOD_LABELS: Record<string, string> = {
  historical:        'Historical (Non-Parametric)',
  parametric_normal: 'Parametric — Normal',
  parametric_t:      'Parametric — t-Distribution',
  monte_carlo:       'Monte Carlo',
};

const METHOD_DESC: Record<string, string> = {
  historical:        'q̂(α) of empirical loss distribution',
  parametric_normal: 'μ̂ + σ̂ · Φ⁻¹(α)',
  parametric_t:      'μ̂ + σ̂ · F_ν⁻¹(α),  ν via MLE',
  monte_carlo:       '100 k draws from fitted distribution',
};

function fmt(v: number | undefined, decimals = 2): string {
  if (v == null || !isFinite(v)) return '—';
  return v.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function fmtDollar(v: number | undefined): string {
  if (v == null || !isFinite(v)) return '—';
  return '$' + fmt(v, 0);
}

function VaRBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="relative h-2 rounded-full bg-slate-700 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export const VaRCalculatorPanel = () => {
  const {
    returns, weights, labels, usingDemo,
    alpha, setAlpha, horizonDays, setHorizonDays, portfolioValue, setPortfolioValue,
    varData, computeVar, loading, error,
  } = useRisk();

  const [showFormulas, setShowFormulas] = useState(false);
  const [exportErr, setExportErr] = useState<string | null>(null);

  const N = returns[0]?.length ?? 0;
  const T = returns.length;

  const maxVaR = varData
    ? Math.max(...Object.values(varData.var).filter(isFinite))
    : 0;

  const handleExport = (fmt: 'csv' | 'json') => {
    if (!varData) return;
    setExportErr(null);
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        parameters: { alpha, horizonDays, portfolioValue },
        assets: labels,
        var: varData.var,
        es: varData.es,
        confidence: varData.confidence,
        horizon_days: varData.horizon_days,
      };
      if (fmt === 'json') {
        downloadFile(
          JSON.stringify(payload, null, 2),
          generateFilename('var_report', 'json'),
          'application/json',
        );
      } else {
        const rows = [
          ['Method', 'VaR', 'ES'],
          ...varData.methods.map(m => [
            METHOD_LABELS[m] ?? m,
            (varData.var[m] ?? '').toString(),
            (varData.es[m]  ?? '').toString(),
          ]),
        ];
        downloadFile(
          rows.map(r => r.join(',')).join('\n'),
          generateFilename('var_report', 'csv'),
          'text/csv',
        );
      }
    } catch {
      setExportErr('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-white">
              VaR &amp; Expected Shortfall Calculator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              M1 L2 · Historical · Parametric Normal · Parametric t · Monte Carlo
            </p>
          </div>
          <button
            onClick={() => setShowFormulas(f => !f)}
            className="text-xs text-slate-400 hover:text-primary-300 underline underline-offset-2"
          >
            {showFormulas ? 'Hide' : 'Show'} formulae
          </button>
        </div>

        {/* Formulae box */}
        {showFormulas && (
          <div className="mb-5 rounded-lg bg-slate-800/60 border border-slate-700 p-5 overflow-x-auto space-y-4">
            <div>
              <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-1">Historical (Non-Parametric)</p>
              <MathBlock latex="\widehat{\mathrm{VaR}}_{np}(1{-}\alpha) = M \cdot \hat{q}(\alpha) \qquad \mathrm{ES}_{np} = M \cdot \mathbb{E}[L \mid L > \hat{q}(\alpha)]" />
            </div>
            <div>
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-1">Parametric — Normal</p>
              <MathBlock latex="\widehat{\mathrm{VaR}}_N = M\!\left(\hat{\mu} + \hat{\sigma}\,\Phi^{-1}(\alpha)\right) \qquad \mathrm{ES}_N = M\!\left(\hat{\mu} - \hat{\sigma}\,\frac{\phi(\Phi^{-1}(\alpha))}{\alpha}\right)" />
            </div>
            <div>
              <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider mb-1">Parametric — t-distribution (ν via MLE)</p>
              <MathBlock latex="\widehat{\mathrm{VaR}}_t = M\!\left(\hat{\mu} + \hat{\sigma}\,F_\nu^{-1}(\alpha)\right) \qquad \mathrm{ES}_t = M\!\left(\hat{\mu} - \hat{\sigma}\,\frac{f_\nu(t_\alpha)}{\alpha}\cdot\frac{\nu+t_\alpha^2}{\nu-1}\right)" />
            </div>
            <div>
              <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mb-1">Horizon Scaling & Diversification</p>
              <MathBlock latex="\mathrm{VaR}(T) = \mathrm{VaR}(1)\times\sqrt{T} \qquad \text{Div. benefit} = \textstyle\sum_i \mathrm{VaR}_i - \mathrm{VaR}_p" />
            </div>
          </div>
        )}

        {/* Data source badge */}
        <div className="flex items-center gap-2 mb-5 text-xs">
          <span className={`px-2 py-0.5 rounded-full border ${usingDemo
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            {usingDemo ? '⚠ Demo data' : '✓ Custom data'}
          </span>
          <span className="text-slate-500">{T} obs · {N} assets · {labels.join(', ')}</span>
        </div>

        {/* ── Controls ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Confidence level */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Confidence level (1−α)</label>
            <div className="flex flex-wrap gap-1.5">
              {CONFIDENCE_OPTIONS.map(opt => (
                <button
                  key={opt.alpha}
                  onClick={() => setAlpha(opt.alpha)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    alpha === opt.alpha
                      ? 'bg-primary-600 border-primary-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horizon */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Horizon (VaR(T) = VaR(1)×√T)</label>
            <div className="flex gap-1.5">
              {HORIZON_OPTIONS.map(h => (
                <button
                  key={h.days}
                  onClick={() => setHorizonDays(h.days)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                    horizonDays === h.days
                      ? 'bg-primary-600 border-primary-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Portfolio value */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Portfolio value (M)</label>
            <input
              type="number"
              min={1000}
              step={100000}
              value={portfolioValue}
              onChange={e => setPortfolioValue(Number(e.target.value))}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={computeVar}
            disabled={loading.var}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 disabled:opacity-50 transition"
          >
            {loading.var ? 'Computing…' : 'Compute VaR & ES'}
          </button>
          {varData && (
            <>
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition"
              >
                Export JSON
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">
            {error}
          </div>
        )}
        {exportErr && (
          <div className="mt-2 text-xs text-red-400">{exportErr}</div>
        )}
      </div>

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {varData && (
        <>
          {/* Method comparison table */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="text-sm font-semibold text-white mb-1">
              Method Comparison — {(varData.confidence * 100).toFixed(1)}% Confidence · {varData.horizon_days}-day Horizon
            </h4>
            <p className="text-xs text-slate-500 mb-4">All values in dollars (portfolio M = {fmtDollar(portfolioValue)})</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left pb-2 text-slate-400 font-medium">Method</th>
                    <th className="text-left pb-2 text-slate-400 font-medium">Formula</th>
                    <th className="text-right pb-2 text-slate-400 font-medium">VaR</th>
                    <th className="text-right pb-2 text-slate-400 font-medium">ES (CVaR)</th>
                    <th className="w-32 pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {varData.methods.map(method => (
                    <tr key={method}>
                      <td className="py-3 pr-4">
                        <p className="text-white font-medium">{METHOD_LABELS[method] ?? method}</p>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-500">
                        {METHOD_DESC[method]}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-emerald-300 font-semibold">
                        {fmtDollar(varData.var[method])}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-rose-300">
                        {fmtDollar(varData.es[method])}
                      </td>
                      <td className="py-3">
                        <VaRBar value={varData.var[method] ?? 0} max={maxVaR} color="#10b981" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Multi-horizon scaling table */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="text-sm font-semibold text-white mb-1">
              Horizon Scaling — VaR(T) = VaR(1-day) × √T
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Assumes i.i.d. returns (square-root of time rule). Autocorrelated series may underestimate multi-day VaR.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left pb-2 text-slate-400 font-medium">Method</th>
                    <th className="text-right pb-2 text-slate-400 font-medium">1-day VaR</th>
                    <th className="text-right pb-2 text-slate-400 font-medium">10-day (×√10)</th>
                    <th className="text-right pb-2 text-slate-400 font-medium">21-day (×√21)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {varData.methods.map(method => {
                    const v1 = varData.var[method] ?? 0;
                    // Scale from horizon_days back to 1-day, then to target
                    const v1day = v1 / Math.sqrt(varData.horizon_days);
                    return (
                      <tr key={method}>
                        <td className="py-2.5 pr-4 text-white">{METHOD_LABELS[method] ?? method}</td>
                        <td className="py-2.5 pr-4 text-right font-mono text-slate-300">{fmtDollar(v1day)}</td>
                        <td className="py-2.5 pr-4 text-right font-mono text-slate-300">{fmtDollar(v1day * Math.sqrt(10))}</td>
                        <td className="py-2.5 text-right font-mono text-slate-300">{fmtDollar(v1day * Math.sqrt(21))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* VaR vs ES comparison cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {varData.methods.map(method => {
              const var_ = varData.var[method] ?? 0;
              const es_  = varData.es[method]  ?? 0;
              const esRatio = var_ > 0 ? es_ / var_ : 0;
              return (
                <div key={method} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-400 font-medium truncate">{METHOD_LABELS[method] ?? method}</p>
                  <p className="text-lg font-black text-emerald-300 mt-2">{fmtDollar(var_)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">VaR ({(varData.confidence * 100).toFixed(0)}%)</p>
                  <div className="mt-2 pt-2 border-t border-slate-700">
                    <p className="text-sm font-semibold text-rose-300">{fmtDollar(es_)}</p>
                    <p className="text-xs text-slate-500">ES (×{esRatio.toFixed(2)})</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key insight banner */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-sm text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Portfolio VaR Sub-additivity</p>
            <p>
              By Artzner et al. (1999), VaR need not be sub-additive under non-normal returns.
              Compare the methods above: if Parametric Normal {'<'} Historical, your tail is heavier than Gaussian
              — consider the t-distribution VaR as the conservative estimate.
              ES (Expected Shortfall) is always coherent and sub-additive.
            </p>
          </div>
        </>
      )}

      {!varData && !loading.var && !error && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center text-slate-500 text-sm">
          Select parameters above and click <span className="text-white font-medium">Compute VaR &amp; ES</span> to run all four methods.
        </div>
      )}
    </div>
  );
};
