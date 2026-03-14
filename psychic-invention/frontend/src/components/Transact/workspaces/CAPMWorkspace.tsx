/**
 * CAPMWorkspace — Capital Asset Pricing Model (Menu 1.4 · M1 §2)
 *
 * E(Ri) = Rf + β(Rm − Rf)
 *
 * Live beta: fetch 1-year daily history for asset + benchmark (SPY),
 * compute β = cov(r_i, r_m) / var(r_m) from log-returns.
 *
 * Security Market Line: interactive SVG (like MVO frontier). Click point on SML → set β and show E(R).
 * Delta-adjusted exposure: Δ × β_underlying (option position beta)
 */
import { useState, useMemo, useCallback } from 'react';
import { getAssetHistory } from '@/utils/api';
import { useDataProvider } from '@/context/DataProviderContext';
import { MathText } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(2) + '%';

// ── Beta computation ──────────────────────────────────────────────────────────
function logReturns(prices: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < prices.length; i++) r.push(Math.log(prices[i] / prices[i - 1]));
  return r;
}
function mean(a: number[]) { return a.reduce((s, v) => s + v, 0) / a.length; }
function cov(a: number[], b: number[]) {
  const ma = mean(a), mb = mean(b);
  return a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0) / (a.length - 1);
}
function variance(a: number[]) { return cov(a, a); }

// ── SML points for interactive chart (same step pattern as frontier points) ────
const BETA_MAX = 2.5;
const SML_POINTS = Array.from({ length: 11 }, (_, i) => (i / 10) * BETA_MAX);

// ── Hover point on SML (for right-side display) ─────────────────────────────────
export type SMLHoverPoint = { beta: number; return: number } | null;

// ── Interactive SML chart (SVG, like MVO FrontierChart) ────────────────────────
function SMLChart({
  rf, mrp, beta, reqReturn, adjBeta, onSelectBeta, onHover,
}: {
  rf: number; mrp: number; beta: number; reqReturn: number;
  adjBeta: number | null;
  onSelectBeta: (b: number) => void;
  onHover: (point: SMLHoverPoint) => void;
}) {
  const W = 560; const H = 320; const PAD = { t: 20, r: 20, b: 48, l: 56 };
  const xMin = 0; const xMax = BETA_MAX;
  const rMin = rf - 0.02; const rMax = rf + BETA_MAX * mrp + 0.03;

  const tx = (b: number) => PAD.l + ((b - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const ty = (r: number) => H - PAD.b - ((r - rMin) / (rMax - rMin)) * (H - PAD.t - PAD.b);

  const smlPath = `M ${tx(0)} ${ty(rf)} L ${tx(BETA_MAX)} ${ty(rf + BETA_MAX * mrp)}`;

  const yTicks = Array.from({ length: 6 }, (_, i) => rMin + (i / 5) * (rMax - rMin));
  const xTicks = Array.from({ length: 6 }, (_, i) => (i / 5) * BETA_MAX);

  const chartWidth = W - PAD.l - PAD.r;
  const toBeta = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const frac = (x - PAD.l) / chartWidth;
    if (frac < 0 || frac > 1) return null;
    return Math.max(0, Math.min(BETA_MAX, frac * BETA_MAX));
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const b = toBeta(e.clientX, e.currentTarget.getBoundingClientRect());
    if (b != null) onSelectBeta(Math.round(b * 100) / 100);
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const b = toBeta(e.clientX, e.currentTarget.getBoundingClientRect());
    if (b != null) onHover({ beta: b, return: rf + b * mrp });
    else onHover(null);
  };

  const handleSvgMouseLeave = () => onHover(null);

  const selectedIdx = SML_POINTS.reduce((best, b, i) =>
    Math.abs(b - beta) < Math.abs(SML_POINTS[best] - beta) ? i : best
  , 0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full cursor-crosshair"
      style={{ maxHeight: 320 }}
      onClick={handleSvgClick}
      onMouseMove={handleSvgMouseMove}
      onMouseLeave={handleSvgMouseLeave}
    >
      {/* Grid */}
      {yTicks.map((y, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={ty(y)} x2={W - PAD.r} y2={ty(y)} stroke="#1e293b" strokeWidth="1" />
          <text x={PAD.l - 6} y={ty(y) + 4} textAnchor="end" fontSize="10" fill="#64748b">{pct(y)}</text>
        </g>
      ))}
      {xTicks.map((x, i) => (
        <g key={i}>
          <line x1={tx(x)} y1={PAD.t} x2={tx(x)} y2={H - PAD.b} stroke="#1e293b" strokeWidth="1" />
          <text x={tx(x)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="#64748b">{x.toFixed(1)}</text>
        </g>
      ))}
      <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="#94a3b8">β (Beta)</text>
      <text x={14} y={H / 2} textAnchor="middle" fontSize="11" fill="#94a3b8" transform={`rotate(-90, 14, ${H / 2})`}>E[R]</text>

      {/* SML line */}
      <path d={smlPath} fill="none" stroke="#3b82f6" strokeWidth="2" />

      {/* Clickable points on SML (like MVO frontier dots) */}
      {SML_POINTS.map((b, i) => {
        const r = rf + b * mrp;
        const sel = selectedIdx === i;
        return (
          <circle
            key={i}
            cx={tx(b)}
            cy={ty(r)}
            r={sel ? 6 : 4}
            fill={sel ? '#f59e0b' : '#6366f1'}
            opacity={sel ? 1 : 0.5}
            className="cursor-pointer hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); onSelectBeta(b); }}
          />
        );
      })}

      {/* Current asset point (green) */}
      <circle cx={tx(beta)} cy={ty(reqReturn)} r={7} fill="#22c55e" stroke="#064e3b" strokeWidth="2" />
      <text x={tx(beta) + 10} y={ty(reqReturn) - 4} fontSize="10" fill="#22c55e">Asset</text>

      {/* Delta-adjusted point */}
      {adjBeta !== null && (
        <>
          <circle cx={tx(adjBeta)} cy={ty(rf + adjBeta * mrp)} r={6} fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
          <text x={tx(adjBeta) + 10} y={ty(rf + adjBeta * mrp)} fontSize="10" fill="#f59e0b">Δ×β</text>
        </>
      )}
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export const CAPMWorkspace = () => {
  const { dataProvider } = useDataProvider();

  // ── Live beta state
  const [assetSym,  setAssetSym]  = useState('');
  const [benchSym,  setBenchSym]  = useState('SPY');
  const [betaLoading, setBetaLoading] = useState(false);
  const [betaError,   setBetaError]   = useState<string | null>(null);
  const [betaInfo,    setBetaInfo]    = useState<{ beta: number; r2: number; n: number; symbol: string; benchmark: string } | null>(null);

  // ── CAPM parameters
  const [rf,   setRf]   = useState(0.04);
  const [rm,   setRm]   = useState(0.10);
  const [beta, setBeta] = useState(1.0);
  const [delta, setDelta] = useState<number | ''>('');
  const [hoverPoint, setHoverPoint] = useState<SMLHoverPoint>(null);

  // ── Derived
  const mrp         = useMemo(() => rm - rf, [rm, rf]);
  const reqReturn   = useMemo(() => rf + beta * mrp, [rf, beta, mrp]);
  const adjBeta     = useMemo(() => typeof delta === 'number' ? delta * beta : null, [delta, beta]);

  // ── Live beta fetch
  const computeLiveBeta = useCallback(async () => {
    if (!assetSym) return;
    setBetaLoading(true); setBetaError(null);
    try {
      const [assetHist, benchHist] = await Promise.all([
        getAssetHistory(assetSym.toUpperCase(), '1y', dataProvider),
        getAssetHistory(benchSym.toUpperCase(), '1y', dataProvider),
      ]);
      // Align on common dates
      const assetMap: Record<string, number> = {};
      assetHist.forEach(h => { if (h.close != null) assetMap[h.date] = h.close; });
      const benchMap: Record<string, number> = {};
      benchHist.forEach(h => { if (h.close != null) benchMap[h.date] = h.close; });
      const common = Object.keys(assetMap).filter(d => benchMap[d]).sort();
      if (common.length < 30) throw new Error('Too few common dates — try a different symbol');

      const rAsset = logReturns(common.map(d => assetMap[d]));
      const rBench = logReturns(common.map(d => benchMap[d]));

      const b = cov(rAsset, rBench) / variance(rBench);
      const corr = cov(rAsset, rBench) / Math.sqrt(variance(rAsset) * variance(rBench));

      setBetaInfo({ beta: b, r2: corr ** 2, n: rAsset.length, symbol: assetSym.toUpperCase(), benchmark: benchSym.toUpperCase() });
      setBeta(Math.round(b * 100) / 100);
    } catch (e: unknown) {
      setBetaError(e instanceof Error ? e.message : 'Beta computation failed');
    } finally { setBetaLoading(false); }
  }, [assetSym, benchSym, dataProvider]);

  return (
    <div className="space-y-5">

      {/* Live Beta Panel */}
      <div className="rounded-xl border border-blue-800/40 bg-blue-900/5 p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-200 mb-1">
            Compute Live Beta &nbsp;·&nbsp; <MathText text="$\beta = \text{cov}(r_i,\, r_m) / \text{var}(r_m)$" />
          </p>
          <p className="text-xs text-slate-500">Fetches 1-year daily log-returns from yfinance · auto-populates β below</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Asset Symbol</label>
            <input type="text" value={assetSym} placeholder="e.g. AAPL"
              onChange={e => setAssetSym(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && computeLiveBeta()}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-sm focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Benchmark</label>
            <input type="text" value={benchSym}
              onChange={e => setBenchSym(e.target.value.toUpperCase())}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-sm focus:border-blue-500 outline-none" />
          </div>
          <div className="sm:col-span-2">
            <button onClick={computeLiveBeta} disabled={!assetSym || betaLoading}
              className="w-full py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-40 transition flex items-center justify-center gap-2">
              {betaLoading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              {betaLoading ? 'Computing…' : 'Compute Live Beta'}
            </button>
          </div>
        </div>
        {betaError && <p className="text-red-400 text-xs">{betaError}</p>}
        {betaInfo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60">
            <div className="rounded-lg bg-slate-800/50 p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider"><MathText text="Beta $\beta$" /></p>
              <p className="text-xl font-mono text-blue-300">{betaInfo.beta.toFixed(4)}</p>
              <p className="text-[10px] text-slate-600">{betaInfo.symbol} vs {betaInfo.benchmark}</p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">R² (corr²)</p>
              <p className="text-xl font-mono text-violet-300">{betaInfo.r2.toFixed(4)}</p>
              <p className="text-[10px] text-slate-600">Systematic risk %</p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Observations</p>
              <p className="text-xl font-mono text-slate-200">{betaInfo.n}</p>
              <p className="text-[10px] text-slate-600">daily log-returns</p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status</p>
              <p className={`text-sm font-semibold mt-1 ${Math.abs(betaInfo.beta - 1) < 0.2 ? 'text-slate-300' : betaInfo.beta > 1 ? 'text-red-400' : 'text-green-400'}`}>
                {betaInfo.beta > 1.5 ? 'High risk' : betaInfo.beta > 1.1 ? 'Aggressive' : betaInfo.beta > 0.9 ? 'Market-like' : betaInfo.beta > 0.5 ? 'Defensive' : 'Low beta'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CAPM + SML */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
        <p className="text-sm font-semibold text-slate-200 mb-4">
          CAPM &nbsp;·&nbsp; <MathText text="$E(R_i) = R_f + \beta(R_m - R_f)$" />
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: inputs */}
          <div className="space-y-3">
            {[
              { label: 'Risk-free rate $R_f$', val: rf, set: setRf, step: 0.005, min: 0, max: 0.3 },
              { label: 'Market return $R_m$',  val: rm, set: setRm, step: 0.005, min: rf, max: 0.5 },
              { label: 'Beta $\\beta$',         val: beta, set: setBeta, step: 0.05, min: -2, max: 5 },
            ].map(({ label, val, set, step, min, max }) => (
              <div key={label}>
                <label className="block text-xs text-slate-400 mb-1"><MathText text={label} /></label>
                <input type="number" value={val} step={step} min={min} max={max}
                  onChange={e => set(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-sm focus:border-blue-500 outline-none" />
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1"><MathText text="Option $\Delta$ (optional)" /></label>
              <input type="number" value={delta} step={0.01} min={-1} max={1}
                placeholder="e.g. 0.5 to compute delta-adjusted beta"
                onChange={e => setDelta(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-sm focus:border-blue-500 outline-none" />
              <p className="text-[10px] text-slate-600 mt-0.5"><MathText text="$\Delta \times \beta$ = effective beta for an option position" /></p>
            </div>
          </div>

          {/* Right: results (highlighted when hovering over SML) */}
          <div className="space-y-3">
            {hoverPoint !== null && (
              <div className="rounded-lg bg-amber-900/30 border-2 border-amber-500/60 p-4 ring-1 ring-amber-400/20">
                <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">On line (hover)</p>
                <p className="text-xl font-mono text-amber-200 mt-1">β = {hoverPoint.beta.toFixed(3)}</p>
                <p className="text-xl font-mono text-amber-200">E(R) = {pct(hoverPoint.return)}</p>
                <p className="text-xs text-amber-500/80 mt-1">
                  <MathText text="$R_f + \beta(R_m - R_f)$" /> = {(rf*100).toFixed(2)}% + {hoverPoint.beta.toFixed(3)}×{(mrp*100).toFixed(2)}%
                </p>
              </div>
            )}
            <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Market Risk Premium</p>
              <p className="text-2xl font-mono text-blue-400">{(mrp * 100).toFixed(2)}%</p>
              <p className="text-xs text-slate-500"><MathText text="$R_m - R_f$" /></p>
            </div>
            <div className={`rounded-lg border p-4 transition-all ${hoverPoint !== null ? 'bg-slate-800/30 border-slate-600' : 'bg-slate-800/50 border-slate-700'}`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider"><MathText text="Required Return $E(R_i)$" /></p>
              <p className="text-2xl font-mono text-white">{(reqReturn * 100).toFixed(2)}%</p>
              <p className="text-xs text-slate-500">
                <MathText text="$R_f + \beta(R_m - R_f)$" /> = {(rf*100).toFixed(2)}% + {beta}×{(mrp*100).toFixed(2)}%
              </p>
            </div>
            {adjBeta !== null && (
              <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Delta-Adjusted Beta</p>
                <p className="text-2xl font-mono text-amber-400">{adjBeta.toFixed(4)}</p>
                <p className="text-xs text-slate-500">
                  <MathText text="$\Delta \times \beta$" /> = {delta} × {beta} — effective market exposure
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SML Chart — interactive (click point on line or on chart to set β, like MVO frontier) */}
        <div className="mt-5">
          <p className="text-xs font-medium text-slate-400 mb-2">
            Security Market Line · Click any point to set <MathText text="$\beta$" /> (or click chart area). Green = asset, amber = selected / <MathText text="$\Delta \times \beta$" />.
          </p>
          <div className="rounded-lg border border-slate-700 bg-slate-800/20 overflow-hidden">
            <SMLChart rf={rf} mrp={mrp} beta={beta} reqReturn={reqReturn} adjBeta={adjBeta} onSelectBeta={setBeta} onHover={setHoverPoint} />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Selected: <MathText text={`$\\beta = ${beta}$`} /> → <MathText text="$E(R)$" /> = {pct(reqReturn)} · Blue line: SML
          </p>
        </div>
      </div>

      {/* Theory footer */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-2">
        <p className="text-[11px] font-semibold text-slate-400">CAPM · M1 §2</p>
        <div className="text-[11px] text-slate-500 space-y-1.5">
          <p>
            <MathText text="$E(R_i) = R_f + \beta_i(R_m - R_f)$ where $\beta_i = \text{cov}(r_i, r_m) / \text{var}(r_m)$ — estimated from 1-year daily log-returns" />
          </p>
          <p>
            <MathText text="Systematic risk: $\beta^2\sigma^2_m$ · Non-systematic: $\sigma^2_\varepsilon = \sigma^2_i(1 - \rho^2_{im})$ · Total: $\sigma^2_i = \beta^2\sigma^2_m + \sigma^2_\varepsilon$" />
          </p>
          <p>
            <MathText text="Option beta: $\beta_{opt} = \Delta \times \beta_{und}$ — Delta-adjusted effective market exposure (M1 §2.1)" />
          </p>
        </div>
      </div>
    </div>
  );
};
