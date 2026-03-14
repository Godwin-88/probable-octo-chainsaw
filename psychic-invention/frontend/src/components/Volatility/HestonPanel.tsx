/**
 * Heston Calibration Panel — M1 L5 / DPE
 * Live market option prices (loaded via shared DataSourcePanel → yfinance)
 * are auto-populated into the calibration table.
 * Users can also edit rows manually.
 * Calibrated params are written back to context (auto-update IV Surface sliders).
 */
import { useState, useEffect } from 'react';
import { useVolatility } from '@/context/VolatilityContext';
import { MathText } from '@/components/ui/Math';

const pct  = (v: number) => (v * 100).toFixed(2) + '%';
const fmt4 = (v: number) => v.toFixed(4);

interface MarketRow { strike: string; expiry: string; price: string; iv: string; }

// ── Model vs market comparison bars ───────────────────────────────────────────
function ModelVsMarket({
  strikes, expiries, marketIVs, calibIV,
}: { strikes: number[]; expiries: number[]; marketIVs: number[]; calibIV: number }) {
  const N = strikes.length;
  if (!N) return null;
  const W = 560; const H = 160;
  const pad = { l: 28, r: 12, t: 16, b: 28 };
  const maxIV = Math.max(...marketIVs, calibIV, 0.01);
  const bw = (W - pad.l - pad.r) / (N * 2.5);

  const fy = (v: number) => H - pad.b - (v / maxIV) * (H - pad.t - pad.b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {[0.25, 0.5, 0.75, 1].map(t => {
        const y = fy(t * maxIV);
        return (
          <g key={t}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
            <text x={pad.l - 3} y={y + 3} textAnchor="end" fontSize="7" fill="#94a3b8">{pct(t * maxIV)}</text>
          </g>
        );
      })}
      {strikes.map((k, i) => {
        const x0 = pad.l + i * bw * 2.5 + bw * 0.25;
        const mY  = fy(marketIVs[i] || 0);
        return (
          <g key={i}>
            <rect x={x0} y={mY} width={bw} height={H - pad.b - mY} fill="#6366f1" opacity={0.8} />
            <text x={x0 + bw / 2} y={H - pad.b + 10} textAnchor="middle" fontSize="7" fill="#94a3b8">
              {k.toFixed(0)} / {expiries[i].toFixed(2)}y
            </text>
          </g>
        );
      })}
      <rect x={W - 80} y={8} width={8} height={6} fill="#6366f1" opacity={0.8} />
      <text x={W - 69} y={14} fontSize="7" fill="#94a3b8">Market IV</text>
    </svg>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export const HestonPanel = () => {
  const {
    symbol, spot, optionChain, hestonParams,
    calibResult, calibLoading, calibrate, calibrateFromChain, error,
  } = useVolatility();

  const [rows, setRows] = useState<MarketRow[]>([]);
  const [rfRate, setRfRate] = useState(0.04);

  // Auto-populate from live option chain whenever it changes
  useEffect(() => {
    if (optionChain.length > 0) {
      setRows(optionChain.map(c => ({
        strike: c.strike.toFixed(2),
        expiry: c.expiry.toFixed(4),
        price:  c.price.toFixed(4),
        iv:     c.implied_vol > 0 ? (c.implied_vol * 100).toFixed(2) : '',
      })));
    }
  }, [optionChain]);

  const addRow   = () => setRows(r => [...r, { strike: (spot ?? 100).toFixed(2), expiry: '0.25', price: '5.00', iv: '' }]);
  const removeRow = (i: number) => setRows(r => r.filter((_, j) => j !== i));
  const updateRow = (i: number, field: keyof MarketRow, val: string) =>
    setRows(r => r.map((row, j) => j === i ? { ...row, [field]: val } : row));

  const validRows = rows.filter(r =>
    !isNaN(parseFloat(r.strike)) && !isNaN(parseFloat(r.expiry)) && !isNaN(parseFloat(r.price))
  );

  const handleCalibrate = async () => {
    if (validRows.length < 3) return;
    await calibrate(
      validRows.map(r => parseFloat(r.strike)),
      validRows.map(r => parseFloat(r.expiry)),
      validRows.map(r => parseFloat(r.price)),
      spot ?? hestonParams.s,
      rfRate,
    );
  };

  const noData  = !symbol;
  const noChain = symbol && optionChain.length === 0;

  return (
    <div className="space-y-6">
      {/* Status / prompt */}
      {noData && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 p-4 text-amber-300 text-sm">
          Search and fetch an equity ticker in the Data Source panel above. The live option chain will be loaded automatically for calibration.
        </div>
      )}
      {noChain && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-3 text-slate-400 text-xs">
          No options data found for <span className="font-mono text-white">{symbol}</span> (ETFs/indices/crypto may not have listed options). Enter prices manually below.
        </div>
      )}

      {/* Option price table */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">Market Option Prices</p>
            {optionChain.length > 0 && (
              <p className="text-xs text-emerald-400 mt-0.5">
                {optionChain.length} contracts auto-loaded from {symbol} option chain
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {optionChain.length > 0 && (
              <button onClick={calibrateFromChain} disabled={calibLoading}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-600 disabled:opacity-40 transition">
                ⚡ Calibrate from chain
              </button>
            )}
            <button onClick={addRow}
              className="px-3 py-1 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 transition">
              + Add row
            </button>
          </div>
        </div>

        {/* rf rate + spot display */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <label className="block text-xs text-slate-400 mb-1">S (spot)</label>
            <div className="w-28 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 text-sm px-2 py-1">
              {spot !== null ? spot.toFixed(2) : '—'}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">r (risk-free)</label>
            <input type="number" step="0.001" value={rfRate}
              onChange={e => setRfRate(parseFloat(e.target.value) || 0.04)}
              className="w-28 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-2 py-1 focus:outline-none focus:border-cyan-500" />
          </div>
        </div>

        {/* Table */}
        {rows.length > 0 ? (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="pb-2 text-left font-medium">Strike K</th>
                  <th className="pb-2 text-left font-medium pl-3">Expiry τ (yr)</th>
                  <th className="pb-2 text-left font-medium pl-3">Call Price</th>
                  <th className="pb-2 text-left font-medium pl-3">Mkt IV</th>
                  <th className="pb-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((row, i) => (
                  <tr key={i}>
                    {(['strike', 'expiry', 'price'] as const).map(field => (
                      <td key={field} className="py-1 pl-0 pr-2 first:pr-2">
                        <input type="number" value={row[field]}
                          onChange={e => updateRow(i, field, e.target.value)}
                          step={field === 'expiry' ? '0.05' : field === 'price' ? '0.01' : '1'}
                          className="w-24 rounded bg-slate-800 border border-slate-700 text-white text-xs px-2 py-1 focus:outline-none focus:border-cyan-500" />
                      </td>
                    ))}
                    <td className="py-1 pl-3 text-slate-500 font-mono">{row.iv ? `${row.iv}%` : '—'}</td>
                    <td className="py-1">
                      <button onClick={() => removeRow(i)} className="text-slate-600 hover:text-red-400 px-1 text-sm">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            {symbol ? 'No rows — fetch live data or add manually.' : 'Load a ticker above to auto-populate.'}
          </p>
        )}

        <button onClick={handleCalibrate} disabled={calibLoading || validRows.length < 3}
          className="px-5 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500 disabled:opacity-40 transition flex items-center gap-2">
          {calibLoading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Calibrating…</>
            : `Calibrate Heston (${validRows.length} contracts)`}
        </button>
        {validRows.length < 3 && rows.length > 0 && (
          <p className="text-xs text-amber-400">Need at least 3 valid contracts to calibrate.</p>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {calibResult && (() => {
        const p = calibResult;
        const fellerOk = p.feller_condition_ok;
        const fellerVal = 2 * p.kappa * p.theta - p.xi ** 2;
        return (
          <div className="space-y-4">
            {/* Params card */}
            <div className="rounded-xl border border-cyan-800/40 bg-cyan-900/10 p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-sm font-semibold text-cyan-300">
                  Calibrated Heston — {symbol || 'manual input'}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${fellerOk ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40' : 'bg-red-900/40 text-red-300 border border-red-700/40'}`}>
                    Feller {fellerOk ? `OK (+${fellerVal.toFixed(3)})` : `VIOLATED (${fellerVal.toFixed(3)})`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    RMSE {fmt4(p.rmse)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3 text-xs">
                {[
                  { lbl: 'v₀',  val: fmt4(p.v0),    sub: `σ₀≈${pct(Math.sqrt(p.v0))}` },
                  { lbl: 'κ',   val: fmt4(p.kappa),  sub: 'mean-rev speed' },
                  { lbl: 'θ',   val: fmt4(p.theta),  sub: `≈${pct(Math.sqrt(p.theta))}` },
                  { lbl: 'ξ',   val: fmt4(p.xi),     sub: 'vol-of-vol' },
                  { lbl: 'ρ',   val: fmt4(p.rho),    sub: p.rho < 0 ? 'left skew' : 'right skew' },
                ].map(({ lbl, val, sub }) => (
                  <div key={lbl} className="rounded-lg bg-slate-800/60 p-3">
                    <p className="text-slate-500 mb-1">{lbl}</p>
                    <p className="text-white font-mono text-sm">{val}</p>
                    <p className="text-slate-600 text-[10px] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-3">
                Calibrated params auto-applied to IV Surface panel. Click Generate Surface there to visualise.
              </p>
            </div>

            {/* IV comparison */}
            {validRows.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <p className="text-xs font-semibold text-slate-300 mb-3">Market IV per Contract</p>
                <ModelVsMarket
                  strikes={validRows.map(r => parseFloat(r.strike))}
                  expiries={validRows.map(r => parseFloat(r.expiry))}
                  marketIVs={validRows.map(r => parseFloat(r.iv) / 100 || 0)}
                  calibIV={Math.sqrt(p.v0)}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* Theory */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">Heston (1993) Calibration — Live Data</p>
        <p><MathText text="Option chain from yfinance: bid/ask mid-price used as $C_{\text{market}}$ for each $(K,\tau)$." /></p>
        <p><MathText text="Minimise $\mathrm{RMSE} = \sqrt{\tfrac{1}{N}\sum_i(C_{\text{Heston}}(\kappa,\theta,\xi,\rho,v_0) - C_{\text{market}})^2}$ via L-BFGS-B." /></p>
        <p><MathText text="Feller condition $2\kappa\theta > \xi^2$ ensures variance process $v(t) > 0$ strictly." /></p>
        <p>Calibrated params automatically update the IV Surface panel.</p>
      </div>
    </div>
  );
};
