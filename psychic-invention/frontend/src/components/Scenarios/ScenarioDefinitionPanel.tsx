/**
 * Scenario Definition Panel — M3 L4
 * Custom return shocks, volatility shocks, correlation shifts.
 * Historical crisis scenarios: GFC 2008, COVID 2020, Quant Meltdown 2007.
 *
 * Formulas:
 *   Stressed μ_i = μ_i + Δr_i
 *   Stressed σ_i = σ_i · (1 + Δσ_i)
 *   Stressed ρ_ij = clip(ρ_ij + Δρ, -0.99, 0.99)
 *   Stressed portfolio return = Σ w_i · stressed_μ_i
 *   Stressed portfolio variance = w^T · Σ_stressed · w
 */
import { useState } from 'react';
import { useScenariosContext } from '@/context/ScenariosContext';
import { MathText } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(2) + '%';
const fmt3 = (v: number) => v.toFixed(4);

type CrisisKey = 'GFC_2008' | 'COVID_2020' | 'Quant_Melt_2007';

const HISTORICAL: Record<CrisisKey, { label: string; returnShift: number; corrShift: number; color: string }> = {
  GFC_2008:        { label: 'GFC 2008',        returnShift: -0.37, corrShift: 0.50, color: 'border-red-700/50 bg-red-900/15 text-red-300' },
  COVID_2020:      { label: 'COVID 2020',       returnShift: -0.20, corrShift: 0.30, color: 'border-orange-700/50 bg-orange-900/15 text-orange-300' },
  Quant_Melt_2007: { label: 'Quant Melt 2007', returnShift: -0.10, corrShift: 0.40, color: 'border-amber-700/50 bg-amber-900/15 text-amber-300' },
};

// ── Stressed metrics comparison bars ─────────────────────────────────────────
function ComparisonBar({ label, base, stressed, unit = '' }: {
  label: string; base: number; stressed: number; unit?: string;
}) {
  const maxAbs = Math.max(Math.abs(base), Math.abs(stressed), 0.001);
  const pBase     = ((base + maxAbs) / (2 * maxAbs)) * 100;
  const pStressed = ((stressed + maxAbs) / (2 * maxAbs)) * 100;
  const center    = 50;
  const delta = stressed - base;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className={delta < 0 ? 'text-red-400' : 'text-emerald-400'}>
          {delta > 0 ? '+' : ''}{(delta * 100).toFixed(2)}{unit}
        </span>
      </div>
      <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
        <div className="absolute top-0 bottom-0 bg-slate-600/40 rounded-full"
          style={{ left: `${Math.min(pBase, center)}%`, width: `${Math.abs(pBase - center)}%` }} />
        <div className="absolute top-0 bottom-0 bg-rose-500/60 rounded-full"
          style={{ left: `${Math.min(pStressed, center)}%`, width: `${Math.abs(pStressed - center)}%` }} />
        <div className="absolute top-0 bottom-0 w-px bg-slate-500" style={{ left: `${center}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>Base: {pct(base)}</span>
        <span>Stressed: {pct(stressed)}</span>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export const ScenarioDefinitionPanel = () => {
  const {
    labels, returnMatrix, weights,
    scenarioResult, scenarioLoading, computeScenario, error,
  } = useScenariosContext();

  const hasData = returnMatrix.length > 0;
  const N = labels.length;

  // Custom shock inputs
  const [returnShocks, setReturnShocks] = useState<number[]>(() => Array(N || 3).fill(0));
  const [volShocks, setVolShocks]       = useState<number[]>(() => Array(N || 3).fill(0));
  const [corrShift, setCorrShift]       = useState(0);
  const [activeHistorical, setActiveHistorical] = useState<CrisisKey | null>(null);

  // Sync array sizes when assets load
  const shockArr = Array.from({ length: N }, (_, i) => returnShocks[i] ?? 0);
  const volArr   = Array.from({ length: N }, (_, i) => volShocks[i] ?? 0);

  const runCustom = () => {
    setActiveHistorical(null);
    computeScenario(shockArr, volArr, corrShift);
  };
  const runHistorical = (key: CrisisKey) => {
    setActiveHistorical(key);
    computeScenario(undefined, undefined, undefined, key);
  };

  // Baseline metrics
  const mu = hasData
    ? (() => {
        const T = returnMatrix.length;
        return Array.from({ length: N }, (_, i) =>
          returnMatrix.reduce((s, row) => s + row[i], 0) / T
        );
      })()
    : [];
  const basePortReturn = mu.reduce((s, m, i) => s + m * (weights[i] ?? 1 / N), 0);

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="rounded-xl border border-rose-700/40 bg-rose-900/10 p-4 text-rose-300 text-sm">
          Load assets above to run scenario stress tests.
        </div>
      )}

      {/* Historical crisis buttons */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-200">Historical Crisis Scenarios</p>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(HISTORICAL) as [CrisisKey, typeof HISTORICAL[CrisisKey]][]).map(([key, h]) => (
            <button
              key={key}
              onClick={() => runHistorical(key)}
              disabled={scenarioLoading || !hasData}
              className={`rounded-xl border p-3 text-left transition ${h.color} ${
                activeHistorical === key ? 'ring-2 ring-white/30' : 'opacity-80 hover:opacity-100'
              } disabled:opacity-40`}
            >
              <p className="text-xs font-bold">{h.label}</p>
              <p className="text-[10px] mt-1 opacity-70">
                Return: {pct(h.returnShift)} · Δρ: +{pct(h.corrShift)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom shock controls */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-200">Custom Shocks</p>

        {hasData ? (
          <>
            <div className="space-y-3">
              {labels.map((lbl, i) => (
                <div key={i} className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">
                      {lbl} return shock (%)
                    </label>
                    <input
                      type="range" min={-50} max={50} step={1}
                      value={Math.round((shockArr[i] ?? 0) * 100)}
                      onChange={e => {
                        const updated = [...shockArr];
                        updated[i] = parseInt(e.target.value) / 100;
                        setReturnShocks(updated);
                      }}
                      className="w-full accent-rose-500"
                    />
                    <span className="text-rose-300 font-mono">
                      {shockArr[i] >= 0 ? '+' : ''}{pct(shockArr[i])}
                    </span>
                  </div>
                  <div>
                    <label className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">
                      {lbl} vol shock (×)
                    </label>
                    <input
                      type="range" min={-50} max={200} step={5}
                      value={Math.round((volArr[i] ?? 0) * 100)}
                      onChange={e => {
                        const updated = [...volArr];
                        updated[i] = parseInt(e.target.value) / 100;
                        setVolShocks(updated);
                      }}
                      className="w-full accent-amber-500"
                    />
                    <span className="text-amber-300 font-mono">
                      ×{(1 + (volArr[i] ?? 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">
                Correlation shift Δρ (all pairs)
              </label>
              <input
                type="range" min={-50} max={70} step={1}
                value={Math.round(corrShift * 100)}
                onChange={e => setCorrShift(parseInt(e.target.value) / 100)}
                className="w-full accent-cyan-500"
              />
              <span className="text-cyan-300 font-mono text-xs">
                {corrShift >= 0 ? '+' : ''}{pct(corrShift)}
              </span>
            </div>

            <button
              onClick={runCustom}
              disabled={scenarioLoading}
              className="px-4 py-1.5 rounded-lg bg-rose-700 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-40 transition flex items-center gap-2"
            >
              {scenarioLoading
                ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Stressing…</>
                : 'Apply Custom Shocks'}
            </button>
          </>
        ) : (
          <p className="text-xs text-slate-600">Load assets above to configure shocks.</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Results */}
      {scenarioResult && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-800/40 bg-rose-900/10 p-4">
            <p className="text-sm font-semibold text-rose-300 mb-3">
              Stressed Portfolio — {activeHistorical ? HISTORICAL[activeHistorical].label : 'Custom Shock'}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Stressed Return (daily)', value: pct(scenarioResult.stressed_portfolio_return), color: scenarioResult.stressed_portfolio_return >= 0 ? 'text-emerald-400' : 'text-red-400' },
                { label: 'Stressed Volatility (daily)', value: pct(scenarioResult.stressed_portfolio_volatility), color: 'text-amber-300' },
                { label: 'Stressed Variance', value: fmt3(scenarioResult.stressed_portfolio_variance), color: 'text-slate-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-xs">
                  <p className="text-slate-500 mb-1">{label}</p>
                  <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {hasData && (
              <div className="space-y-3">
                <ComparisonBar
                  label="Portfolio Return (daily)"
                  base={basePortReturn}
                  stressed={scenarioResult.stressed_portfolio_return}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theory */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">Scenario Stress Testing (M3 L4)</p>
        <p><MathText text="Stressed $\mu_i = \mu_i + \Delta r_i$ — direct return shock per asset." /></p>
        <p><MathText text="Stressed $\sigma_i = \sigma_i \cdot (1 + \Delta\sigma_i)$ — proportional volatility scaling." /></p>
        <p><MathText text="Stressed $\rho_{ij} = \mathrm{clip}(\rho_{ij} + \Delta\rho,\,-0.99,\,0.99)$ — uniform correlation shift (flight to quality)." /></p>
        <p>Historical crises: GFC 2008 (−37% return, +50% corr) · COVID 2020 (−20%, +30%) · Quant Melt 2007 (−10%, +40%).</p>
      </div>
    </div>
  );
};
