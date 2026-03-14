/**
 * Greeks Risk Aggregation Panel — TRANSACT_APP_SPEC §3.3.2
 * M1 L2 §8: Delta-VaR (linear) and Gamma-adjusted VaR (non-linear)
 *
 * Delta-VaR:          ΔW ≈ Δ_net · ΔS,   ΔS ~ N(0, σ_spot·S)
 * Gamma-adjusted VaR: ΔW ≈ Δ_net · ΔS + ½Γ_net · (ΔS)²  (2nd-order Taylor)
 */
import { useState } from 'react';
import { useRisk, type GreeksPosition } from '@/context/RiskContext';
import { MathBlock } from '@/components/ui/Math';

const EMPTY_POSITION: GreeksPosition = {
  asset: '', delta: 0.5, gamma: 0.02, vega: 5.0, theta: -0.05,
  quantity: 100, spot_price: 100,
};

function fmt(v: number | undefined, d = 4): string {
  if (v == null || !isFinite(v)) return '—';
  return v.toLocaleString('en-US', { maximumFractionDigits: d });
}

function fmtPct(v: number | undefined): string {
  if (v == null || !isFinite(v)) return '—';
  return (v * 100).toFixed(2) + '%';
}

function GreekBadge({ label, value, color }: { label: string; value: number; color: string }) {
  const sign = value >= 0 ? '+' : '';
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-xs font-medium opacity-75">Net {label}</p>
      <p className="text-2xl font-black mt-1">
        {sign}{fmt(value, 4)}
      </p>
    </div>
  );
}

const PRESETS: GreeksPosition[] = [
  { asset: 'AAPL',  delta: 0.62,  gamma: 0.018, vega:  8.5, theta: -0.08, quantity: 50,  spot_price: 185 },
  { asset: 'MSFT',  delta: -0.45, gamma: 0.022, vega:  7.2, theta: -0.07, quantity: 30,  spot_price: 415 },
  { asset: 'GOOGL', delta: 0.38,  gamma: 0.015, vega:  6.0, theta: -0.06, quantity: 20,  spot_price: 170 },
];

export const GreeksAggregationPanel = () => {
  const {
    greeksPositions, setGreeksPositions,
    sigmaSpot, setSigmaSpot,
    alpha, setAlpha,
    greeksResult, computeGreeks, loading, error,
  } = useRisk();

  const [draft, setDraft] = useState<GreeksPosition>({ ...EMPTY_POSITION });

  const addPosition = () => {
    if (!draft.asset.trim()) return;
    setGreeksPositions([...greeksPositions, { ...draft }]);
    setDraft({ ...EMPTY_POSITION });
  };

  const removePosition = (idx: number) => {
    setGreeksPositions(greeksPositions.filter((_, i) => i !== idx));
  };

  const loadPresets = () => setGreeksPositions(PRESETS);

  const netSign = (v: number) => (v >= 0 ? `+${fmt(v, 4)}` : fmt(v, 4));

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Greeks Risk Aggregation</h3>
        <p className="text-xs text-slate-500 mb-4">
          M1 L2 §8 · Linear and non-linear (gamma-adjusted) VaR for derivative portfolios
        </p>

        {/* Formula */}
        <div className="mb-4 rounded-lg bg-slate-800/50 border border-slate-700 p-4 overflow-x-auto space-y-3">
          <MathBlock latex="\Delta W \approx \Delta_{\text{net}} \cdot \Delta S,\quad \Delta S \sim \mathcal{N}(0,\,\sigma_S) \quad\text{(Delta-VaR, linear)}" />
          <MathBlock latex="\Delta W \approx \Delta_{\text{net}}\cdot\Delta S + \tfrac{1}{2}\Gamma_{\text{net}}(\Delta S)^2 \quad\text{(Gamma-adjusted, 50k MC)}" />
          <MathBlock latex={`\\mathrm{VaR}_\\alpha = q_\\alpha(\\text{loss distribution}),\\quad \\alpha = ${alpha.toFixed(3)}`} />
        </div>

        {/* Parameters */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Daily spot vol σ_S</label>
            <input
              type="number" step={0.001} min={0.001} max={0.5}
              value={sigmaSpot}
              onChange={e => setSigmaSpot(Number(e.target.value))}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 focus:outline-none focus:border-sky-500"
            />
            <p className="text-xs text-slate-600 mt-0.5">{fmtPct(sigmaSpot)} daily vol</p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tail probability α</label>
            <select
              value={alpha}
              onChange={e => setAlpha(Number(e.target.value))}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 focus:outline-none focus:border-sky-500"
            >
              <option value={0.10}>0.10 → 90% VaR</option>
              <option value={0.05}>0.05 → 95% VaR</option>
              <option value={0.01}>0.01 → 99% VaR</option>
              <option value={0.001}>0.001 → 99.9% VaR</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Position entry ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">Derivative Positions</h4>
          <button
            onClick={loadPresets}
            className="text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2"
          >
            Load example positions
          </button>
        </div>

        {/* Current positions */}
        {greeksPositions.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Asset', 'Qty', 'Spot', 'Δ Delta', 'Γ Gamma', 'ν Vega', 'θ Theta', ''].map(h => (
                    <th key={h} className="text-left pb-2 pr-3 text-slate-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {greeksPositions.map((pos, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-3 text-white font-medium">{pos.asset}</td>
                    <td className="py-2 pr-3 text-slate-300">{pos.quantity}</td>
                    <td className="py-2 pr-3 font-mono text-slate-300">${pos.spot_price}</td>
                    <td className={`py-2 pr-3 font-mono ${pos.delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {netSign(pos.delta)}
                    </td>
                    <td className="py-2 pr-3 font-mono text-amber-300">{fmt(pos.gamma)}</td>
                    <td className="py-2 pr-3 font-mono text-purple-300">{fmt(pos.vega)}</td>
                    <td className="py-2 pr-3 font-mono text-slate-400">{fmt(pos.theta)}</td>
                    <td className="py-2">
                      <button
                        onClick={() => removePosition(i)}
                        className="text-slate-500 hover:text-red-400 transition"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add position form */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Asset</label>
            <input
              type="text" placeholder="e.g. AAPL"
              value={draft.asset}
              onChange={e => setDraft({ ...draft, asset: e.target.value })}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Quantity</label>
            <input
              type="number" step={1}
              value={draft.quantity}
              onChange={e => setDraft({ ...draft, quantity: Number(e.target.value) })}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Spot price</label>
            <input
              type="number" step={0.01}
              value={draft.spot_price}
              onChange={e => setDraft({ ...draft, spot_price: Number(e.target.value) })}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Delta (Δ)</label>
            <input
              type="number" step={0.01} min={-1} max={1}
              value={draft.delta}
              onChange={e => setDraft({ ...draft, delta: Number(e.target.value) })}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Gamma (Γ)</label>
            <input
              type="number" step={0.001}
              value={draft.gamma}
              onChange={e => setDraft({ ...draft, gamma: Number(e.target.value) })}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Vega (ν)</label>
            <input
              type="number" step={0.1}
              value={draft.vega}
              onChange={e => setDraft({ ...draft, vega: Number(e.target.value) })}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Theta (θ)</label>
            <input
              type="number" step={0.01}
              value={draft.theta}
              onChange={e => setDraft({ ...draft, theta: Number(e.target.value) })}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addPosition}
              disabled={!draft.asset.trim()}
              className="w-full px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-40 transition"
            >
              + Add
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={computeGreeks}
            disabled={loading.greeks || greeksPositions.length === 0}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50 transition"
          >
            {loading.greeks ? 'Computing…' : 'Compute Greeks VaR'}
          </button>
          {greeksPositions.length > 0 && (
            <button
              onClick={() => setGreeksPositions([])}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition"
            >
              Clear positions
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {greeksResult && (
        <>
          {/* Net Greeks cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <GreekBadge
              label="Δ (Delta)"
              value={greeksResult.net_delta}
              color="border-emerald-700 bg-emerald-900/20 text-emerald-300"
            />
            <GreekBadge
              label="Γ (Gamma)"
              value={greeksResult.net_gamma}
              color="border-amber-700 bg-amber-900/20 text-amber-300"
            />
            <GreekBadge
              label="ν (Vega)"
              value={greeksResult.net_vega}
              color="border-purple-700 bg-purple-900/20 text-purple-300"
            />
            <GreekBadge
              label="θ (Theta)"
              value={greeksResult.net_theta}
              color="border-slate-700 bg-slate-800 text-slate-300"
            />
          </div>

          {/* VaR comparison */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="text-sm font-semibold text-white mb-4">
              VaR Analysis — {(greeksResult.confidence * 100).toFixed(1)}% Confidence
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Delta-VaR */}
              <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 p-4">
                <p className="text-xs text-emerald-300 font-medium">Delta-VaR (Linear)</p>
                <div className="text-slate-400 mt-0.5 overflow-x-auto">
                  <MathBlock latex="\Delta W \approx \Delta_{\text{net}} \cdot \Delta S,\;\; \Delta S \sim \mathcal{N}(0,\sigma_S)" />
                </div>
                <p className="text-3xl font-black text-emerald-300 mt-3">
                  {fmt(greeksResult.delta_var, 6)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  (fractional portfolio move)
                </p>
              </div>

              {/* Gamma-adjusted VaR */}
              <div className="rounded-lg border border-amber-800 bg-amber-900/20 p-4">
                <p className="text-xs text-amber-300 font-medium">Gamma-Adjusted VaR (Non-Linear)</p>
                <div className="text-slate-400 mt-0.5 overflow-x-auto">
                  <MathBlock latex="\Delta W \approx \Delta\cdot\Delta S + \tfrac{1}{2}\Gamma(\Delta S)^2 \;\text{(MC 50k)}" />
                </div>
                <p className="text-3xl font-black text-amber-300 mt-3">
                  {fmt(greeksResult.gamma_adjusted_var, 6)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  ES: {fmt(greeksResult.gamma_adjusted_es, 6)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Gamma-adjusted VaR captures non-linear P&amp;L for convex/concave payoffs.
              When Γ_net {'>'} 0 (long gamma), losses are bounded — VaR may be lower than linear.
              When Γ_net {'<'} 0 (short gamma), tail losses accelerate — VaR exceeds linear estimate.
            </p>
          </div>

          {/* Per-position breakdown */}
          {greeksResult.positions.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
              <h4 className="text-sm font-semibold text-white mb-4">Per-Position Delta-VaR</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left pb-2 text-slate-400 font-medium">Asset</th>
                      <th className="text-right pb-2 text-slate-400 font-medium">Qty</th>
                      <th className="text-right pb-2 text-slate-400 font-medium">Δ · Qty</th>
                      <th className="text-right pb-2 text-slate-400 font-medium">Delta-VaR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {greeksResult.positions.map((pos, i) => (
                      <tr key={i}>
                        <td className="py-2.5 pr-3 text-white font-medium">{pos.asset}</td>
                        <td className="py-2.5 pr-3 text-right text-slate-300">{pos.quantity}</td>
                        <td className={`py-2.5 pr-3 text-right font-mono ${pos.delta * pos.quantity >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {netSign(pos.delta * pos.quantity)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-amber-300">
                          {fmt(pos.delta_var, 6)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!greeksResult && !loading.greeks && greeksPositions.length === 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center text-slate-500 text-sm">
          Add derivative positions above (or load examples) and click{' '}
          <span className="text-white font-medium">Compute Greeks VaR</span>.
        </div>
      )}
    </div>
  );
};
