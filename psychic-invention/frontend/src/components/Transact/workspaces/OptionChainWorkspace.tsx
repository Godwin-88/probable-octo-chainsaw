/**
 * OptionChainWorkspace — Live option chain from yfinance (Menu 1.3)
 *
 * Data: getAssetOptions(symbol, nExpiries, moneynessRange)
 *   → contracts: { strike, expiry_str, price, implied_vol, moneyness }
 *
 * Displays per expiry group:
 *   Strike | Moneyness | Mkt Price | Implied Vol | BS Theoretical | Δ (BS)
 *
 * ITM = green  (moneyness < −0.02 for puts / > +0.02 for calls)
 * ATM = yellow (|moneyness| ≤ 0.02)
 * OTM = dim    (moneyness > +0.02 for calls / < −0.02 for puts)
 */
import { useState, useMemo, useCallback } from 'react';
import { useDataProvider } from '@/context/DataProviderContext';
import { getAssetOptions, getAssetQuote } from '@/utils/api';
import { computeCallGreeks } from '@/utils/greeks';
import { MathText } from '@/components/ui/Math';

// ── BS pricing (client-side) ──────────────────────────────────────────────────
const INV_SQRT2PI = 1 / Math.sqrt(2 * Math.PI);
function erf(x: number) {
  const sign = Math.sign(x) || 1;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-x * x));
}
function normCDF(x: number) { return (1 + erf(x / Math.SQRT2)) / 2; }

function bsCall(s: number, k: number, tau: number, r: number, sigma: number): number {
  if (tau <= 0 || sigma <= 0) return Math.max(0, s - k);
  const d1 = (Math.log(s / k) + (r + 0.5 * sigma * sigma) * tau) / (sigma * Math.sqrt(tau));
  const d2 = d1 - sigma * Math.sqrt(tau);
  return s * normCDF(d1) - k * Math.exp(-r * tau) * normCDF(d2);
}

function bsPut(s: number, k: number, tau: number, r: number, sigma: number): number {
  const call = bsCall(s, k, tau, r, sigma);
  return call - s + k * Math.exp(-r * tau);
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Contract {
  strike: number;
  expiry_str: string;
  price: number;
  implied_vol: number;
  moneyness: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function tauFromExpiry(expiryStr: string): number {
  const exp = new Date(expiryStr).getTime();
  const now = Date.now();
  return Math.max(0.001, (exp - now) / (365.25 * 24 * 3600 * 1000));
}

function moneynessLabel(m: number): { label: string; cls: string } {
  if (Math.abs(m) <= 0.02) return { label: 'ATM', cls: 'text-yellow-300' };
  if (m > 0.02)             return { label: 'OTM', cls: 'text-slate-500' };
  return                           { label: 'ITM', cls: 'text-green-400' };
}

// ── Component ─────────────────────────────────────────────────────────────────
export const OptionChainWorkspace = () => {
  const { dataProvider } = useDataProvider();
  const [symbol,    setSymbol]    = useState('AAPL');
  const [nExpiries, setNExpiries] = useState(3);
  const [mRange,    setMRange]    = useState(0.25);
  const [rfRate,    setRfRate]    = useState(0.05);
  const [optType,   setOptType]   = useState<'call' | 'put'>('call');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [data,      setData]      = useState<{ spot: number; contracts: Contract[] } | null>(null);

  const fetchChain = useCallback(async () => {
    if (!symbol) return;
    setLoading(true); setError(null); setData(null);
    try {
      const [opts, quote] = await Promise.all([
        getAssetOptions(symbol, nExpiries, mRange, dataProvider),
        getAssetQuote(symbol, dataProvider).catch(() => null),
      ]);
      const spot = quote?.spot ?? opts.spot;
      setData({ spot, contracts: opts.contracts });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch option chain');
    } finally { setLoading(false); }
  }, [symbol, nExpiries, mRange, dataProvider]);

  // Group contracts by expiry_str
  const grouped = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, Contract[]>();
    for (const c of data.contracts) {
      const list = map.get(c.expiry_str) ?? [];
      list.push(c);
      map.set(c.expiry_str, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([exp, contracts]) => ({
        exp,
        tau: tauFromExpiry(exp),
        contracts: contracts.sort((a, b) => a.strike - b.strike),
      }));
  }, [data]);

  const spot = data?.spot ?? 0;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-200 mr-2">Option Chain</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-400 uppercase tracking-wider">yfinance · live</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Symbol</label>
            <input type="text" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && fetchChain()}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-sm focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Expiries (n)</label>
            <select value={nExpiries} onChange={e => setNExpiries(Number(e.target.value))}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-sm">
              {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Moneyness ±</label>
            <select value={mRange} onChange={e => setMRange(Number(e.target.value))}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-sm">
              {[0.10, 0.15, 0.20, 0.25, 0.30].map(v => <option key={v} value={v}>{(v * 100).toFixed(0)}%</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1"><MathText text="$r_f$" /></label>
            <input type="number" value={rfRate} step={0.005} min={0} max={0.3}
              onChange={e => setRfRate(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-sm" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Type</label>
            <select value={optType} onChange={e => setOptType(e.target.value as 'call' | 'put')}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-sm">
              <option value="call">Call</option>
              <option value="put">Put</option>
            </select>
          </div>
        </div>

        <button onClick={fetchChain} disabled={loading || !symbol}
          className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-40 transition flex items-center gap-2">
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          )}
          {loading ? 'Fetching…' : 'Fetch Live Chain'}
        </button>

        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {/* Chain tables grouped by expiry */}
      {grouped.length > 0 && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>{symbol}</span>
            <span className="font-mono text-blue-300">S = ${spot.toFixed(2)}</span>
            <span>{grouped.length} expiries · {data?.contracts.length} contracts</span>
            <span className="flex gap-2">
              <span className="text-green-400">■ ITM</span>
              <span className="text-yellow-300">■ ATM</span>
              <span className="text-slate-500">■ OTM</span>
            </span>
          </div>

          {grouped.map(({ exp, tau, contracts }) => (
            <div key={exp} className="rounded-xl border border-slate-700 bg-slate-900/50 overflow-hidden">
              <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center gap-3">
                <p className="text-sm font-semibold text-slate-200">{exp}</p>
                <span className="text-xs text-slate-500"><MathText text={`$\\tau$ = ${tau.toFixed(4)} yr`} /></span>
                <span className="text-xs text-slate-500">{contracts.length} strikes</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-[10px] uppercase tracking-wider">
                      <th className="px-3 py-2 text-left">Strike</th>
                      <th className="px-3 py-2 text-left">Moneyness</th>
                      <th className="px-3 py-2 text-right">Mkt Price</th>
                      <th className="px-3 py-2 text-right">Imp. Vol</th>
                      <th className="px-3 py-2 text-right">BS Theoretical</th>
                      <th className="px-3 py-2 text-right"><MathText text="$\Delta$ (BS)" /></th>
                      <th className="px-3 py-2 text-right"><MathText text="Mkt$-$BS" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map(c => {
                      const { label: mlbl, cls: mcls } = moneynessLabel(
                        optType === 'call' ? c.moneyness : -c.moneyness
                      );
                      const bsTheo = optType === 'call'
                        ? bsCall(spot, c.strike, tau, rfRate, c.implied_vol)
                        : bsPut(spot, c.strike, tau, rfRate, c.implied_vol);
                      const req = { s: spot, k: c.strike, tau, r: rfRate, sigma: c.implied_vol };
                      const delta = computeCallGreeks(req).delta * (optType === 'put' ? -1 : 1);
                      const diff = c.price - bsTheo;

                      return (
                        <tr key={c.strike}
                          className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${mlbl === 'ITM' ? 'bg-green-900/5' : mlbl === 'ATM' ? 'bg-yellow-900/5' : ''}`}>
                          <td className="px-3 py-1.5 text-slate-200 font-semibold">${c.strike.toFixed(2)}</td>
                          <td className={`px-3 py-1.5 font-semibold ${mcls}`}>{mlbl} {(c.moneyness * 100).toFixed(1)}%</td>
                          <td className="px-3 py-1.5 text-right text-slate-200">${c.price.toFixed(4)}</td>
                          <td className="px-3 py-1.5 text-right text-blue-300">{(c.implied_vol * 100).toFixed(2)}%</td>
                          <td className="px-3 py-1.5 text-right text-violet-300">${bsTheo.toFixed(4)}</td>
                          <td className="px-3 py-1.5 text-right text-amber-300">{delta.toFixed(4)}</td>
                          <td className={`px-3 py-1.5 text-right ${Math.abs(diff) < 0.05 ? 'text-slate-500' : diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {diff >= 0 ? '+' : ''}{diff.toFixed(4)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <p className="text-[10px] text-slate-600">
            <MathText text="BS Theoretical uses live IV per strike. $\text{Mkt}-\text{BS} > 0$ → option richer than model (vol-smile / demand premium)." />
          </p>
        </div>
      )}

      {!loading && !grouped.length && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/20 p-10 text-center">
          <p className="text-slate-400 text-sm">Enter a symbol and click Fetch Live Chain</p>
          <p className="text-slate-600 text-xs mt-1">Requires yfinance-listed options (e.g. AAPL, MSFT, SPY, QQQ, TSLA)</p>
        </div>
      )}
    </div>
  );
};
