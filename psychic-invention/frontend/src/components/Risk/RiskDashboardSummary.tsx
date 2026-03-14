/**
 * Risk Dashboard Summary — TRANSACT_APP_SPEC §3.3.4
 * Consolidated view: multi-confidence VaR table, multi-horizon ES table,
 * Basel III requirements, and key portfolio risk highlights.
 */
import { useState, useCallback } from 'react';
import { useRisk } from '@/context/RiskContext';
import { postRiskVar } from '@/utils/api';

const CONFIDENCE_LEVELS = [
  { label: '90%',   alpha: 0.10 },
  { label: '95%',   alpha: 0.05 },
  { label: '99%',   alpha: 0.01 },
  { label: '99.9%', alpha: 0.001 },
];

const HORIZONS = [
  { label: '1-day',    days: 1  },
  { label: '10-day',   days: 10 },
  { label: '21-day',   days: 21 },
];

const METHOD_SHORT: Record<string, string> = {
  historical:        'Hist',
  parametric_normal: 'Norm',
  parametric_t:      't-dist',
  monte_carlo:       'MC',
};

type SummaryMatrix = Record<string, Record<number, { var: number; es: number }>>;

function fmt(v: number | null | undefined): string {
  if (v == null || !isFinite(v)) return '—';
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function RiskLevelBadge({ var99 }: { var99: number }) {
  if (var99 <= 0) return null;
  const level = var99 < 10000 ? 'Low' : var99 < 50000 ? 'Moderate' : var99 < 100000 ? 'Elevated' : 'High';
  const color = {
    Low: 'text-emerald-300 border-emerald-700 bg-emerald-900/20',
    Moderate: 'text-amber-300 border-amber-700 bg-amber-900/20',
    Elevated: 'text-orange-300 border-orange-700 bg-orange-900/20',
    High: 'text-red-300 border-red-700 bg-red-900/20',
  }[level]!;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border ${color}`}>
      {level} risk
    </span>
  );
}

export const RiskDashboardSummary = () => {
  const {
    returns, weights, portfolioValue,
    varData, loading, error,
    computeAll,
  } = useRisk();

  const [matrix, setMatrix] = useState<SummaryMatrix | null>(null);
  const [computing, setComputing] = useState(false);
  const [innerError, setInnerError] = useState<string | null>(null);

  const buildMatrix = useCallback(async () => {
    setComputing(true);
    setInnerError(null);
    try {
      const total = weights.reduce((s, w) => s + w, 0);
      const normW = total > 0 ? weights.map(w => w / total) : weights;
      const result: SummaryMatrix = {};

      // Fetch all confidence × horizon combinations in parallel batches
      const tasks = CONFIDENCE_LEVELS.flatMap(cl =>
        HORIZONS.map(h => ({ alpha: cl.alpha, days: h.days }))
      );

      const responses = await Promise.all(
        tasks.map(t =>
          postRiskVar({
            returns,
            weights: normW,
            alpha: t.alpha,
            horizon_days: t.days,
            portfolio_value: portfolioValue,
            include_monte_carlo: false,
            mc_simulations: 0,
          }).catch(() => null)
        )
      );

      tasks.forEach((t, i) => {
        const res = responses[i];
        if (!res) return;
        // Use historical as the reference method for the summary table
        const varVal = res.var?.historical ?? 0;
        const esVal  = res.es?.historical  ?? 0;
        const key = `${t.alpha}`;
        if (!result[key]) result[key] = {};
        result[key][t.days] = { var: varVal, es: esVal };
      });

      setMatrix(result);
    } catch (e: unknown) {
      setInnerError(e instanceof Error ? e.message : 'Dashboard computation failed');
    } finally {
      setComputing(false);
    }
  }, [returns, weights, portfolioValue]);

  const handleComputeAll = async () => {
    await computeAll();
    await buildMatrix();
  };

  // Highest VaR from varData (for the badge)
  const var99 = varData?.var?.historical ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Risk Dashboard Summary</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-confidence · Multi-horizon · Basel III requirements (99%, 10-day)
            </p>
          </div>
          {var99 > 0 && <RiskLevelBadge var99={var99} />}
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleComputeAll}
            disabled={computing || loading.var || loading.covHealth}
            className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-500 disabled:opacity-50 transition"
          >
            {computing || loading.var ? 'Computing all…' : 'Compute All Risk Metrics'}
          </button>
        </div>

        {(error || innerError) && (
          <div className="mt-3 rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">
            {error ?? innerError}
          </div>
        )}
      </div>

      {/* ── Current VaR snapshot (from context) ──────────────────────── */}
      {varData && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
          <h4 className="text-sm font-semibold text-white mb-4">
            Current VaR — {(varData.confidence * 100).toFixed(1)}% Confidence,{' '}
            {varData.horizon_days}-day Horizon
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {varData.methods.map(m => (
              <div key={m} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                <p className="text-xs text-slate-400">{METHOD_SHORT[m] ?? m}</p>
                <p className="text-xl font-black text-emerald-300 mt-1">
                  {fmt(varData.var[m])}
                </p>
                <p className="text-xs text-slate-500">ES: {fmt(varData.es[m])}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Multi-confidence × horizon table ─────────────────────────── */}
      {matrix && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
          <h4 className="text-sm font-semibold text-white mb-1">
            Historical VaR — Confidence × Horizon Grid
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            All values in dollars. Portfolio M = {portfolioValue.toLocaleString()}.
            Multi-day scaling: VaR(T) = VaR(1) × √T.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left pb-2 text-slate-400 font-medium">Confidence</th>
                  {HORIZONS.map(h => (
                    <th key={h.days} className="text-right pb-2 text-slate-400 font-medium">
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {CONFIDENCE_LEVELS.map(cl => (
                  <tr key={cl.alpha} className={cl.alpha === 0.01 ? 'bg-amber-900/10' : ''}>
                    <td className="py-3 pr-4 text-white">
                      <span className="font-semibold">{cl.label}</span>
                      {cl.alpha === 0.01 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-amber-800/50 text-amber-300 border border-amber-700">
                          Basel III
                        </span>
                      )}
                    </td>
                    {HORIZONS.map(h => {
                      const cell = matrix[`${cl.alpha}`]?.[h.days];
                      const isBasel = cl.alpha === 0.01 && h.days === 10;
                      return (
                        <td
                          key={h.days}
                          className={`py-3 text-right font-mono ${
                            isBasel
                              ? 'text-amber-300 font-bold'
                              : 'text-slate-300'
                          }`}
                        >
                          {cell ? fmt(cell.var) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            ⚠ Highlighted row = Basel III capital requirement benchmark (99%, 10-day).
            Market risk capital charge ≥ max(VaR_t−1, k·VaR̄_60d) where k ∈ [3,4].
          </p>
        </div>
      )}

      {/* ── ES table ─────────────────────────────────────────────────── */}
      {matrix && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
          <h4 className="text-sm font-semibold text-white mb-1">
            Expected Shortfall (CVaR) — Coherent Risk Measure
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            ES = E[L | L {'>'} VaR] — always sub-additive; preferred by Basel IV (FRTB).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left pb-2 text-slate-400 font-medium">Confidence</th>
                  {HORIZONS.map(h => (
                    <th key={h.days} className="text-right pb-2 text-slate-400 font-medium">
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {CONFIDENCE_LEVELS.map(cl => (
                  <tr key={cl.alpha}>
                    <td className="py-3 pr-4 text-white font-semibold">{cl.label}</td>
                    {HORIZONS.map(h => {
                      const cell = matrix[`${cl.alpha}`]?.[h.days];
                      return (
                        <td key={h.days} className="py-3 text-right font-mono text-rose-300">
                          {cell ? fmt(cell.es) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Key insights ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-5 space-y-3 text-sm text-slate-400">
        <p className="font-semibold text-slate-300">Risk Management Framework Notes</p>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>
            <span className="text-white">VaR sub-additivity:</span> VaR_p ≤ Σᵢ VaR_i — diversification
            reduces aggregate risk, but VaR is not guaranteed coherent under non-normality.
          </li>
          <li>
            <span className="text-white">ES (Basel IV / FRTB):</span> Expected Shortfall replaced VaR
            as the primary regulatory risk measure under the Fundamental Review of the Trading Book.
          </li>
          <li>
            <span className="text-white">Square-root of time:</span> Multi-day scaling assumes i.i.d.
            returns. In practice, GARCH volatility clustering invalidates this — conditional VaR
            should be used for stressed market periods.
          </li>
          <li>
            <span className="text-white">Heavy tails:</span> If t-distribution VaR {'>'} Normal VaR,
            your return distribution has excess kurtosis — fat tails that Gaussian models underestimate.
          </li>
        </ul>
      </div>

      {!varData && !matrix && !computing && !loading.var && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center text-slate-500 text-sm">
          Click <span className="text-white font-medium">Compute All Risk Metrics</span> to populate
          the full multi-confidence, multi-horizon VaR and ES tables.
        </div>
      )}
    </div>
  );
};
