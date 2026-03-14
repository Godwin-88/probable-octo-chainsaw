/**
 * Historical vs Implied Volatility Panel — M1 L5
 * Data comes from the shared DataSourcePanel (top of VolatilityWorkspace).
 * Computes rolling realised vol via /vol/historical and compares to ATM IV from live option chain.
 */
import { useVolatility } from '@/context/VolatilityContext';
import { MathText } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(2) + '%';

// ── Rolling vol line chart ─────────────────────────────────────────────────────
function RollingVolChart({
  realized, atmIV, dates, windowSize,
}: { realized: number[]; atmIV: number | null; dates: string[]; windowSize: number }) {
  const N = realized.length;
  if (N < 2) return null;
  const W = 620; const H = 220;
  const pad = { t: 16, r: 16, b: 36, l: 48 };

  const allVals = atmIV !== null ? [...realized, atmIV] : realized;
  const minV = Math.min(...allVals) * 0.85;
  const maxV = Math.max(...allVals) * 1.15;
  const vRange = maxV - minV || 0.01;

  const px = (i: number) => pad.l + (i / (N - 1)) * (W - pad.l - pad.r);
  const py = (v: number) => H - pad.b - ((v - minV) / vRange) * (H - pad.t - pad.b);

  const pts = realized.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const meanV = realized.reduce((s, v) => s + v, 0) / N;

  // Date labels (offset by windowSize since realized starts at index windowSize)
  const nLabels = 5;
  const dateTicks = Array.from({ length: nLabels }, (_, k) => {
    const i    = Math.round(k * (N - 1) / (nLabels - 1));
    const orig = windowSize + i;
    return { x: px(i), label: dates[orig]?.slice(0, 7) ?? '' };
  });

  const nYTicks = 5;
  const yTicks  = Array.from({ length: nYTicks }, (_, k) => minV + (k / (nYTicks - 1)) * vRange);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {/* Grid */}
      {yTicks.map((v, k) => (
        <g key={k}>
          <line x1={pad.l} y1={py(v)} x2={W - pad.r} y2={py(v)} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
          <text x={pad.l - 4} y={py(v) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{pct(v)}</text>
        </g>
      ))}
      {/* Mean realized vol */}
      <line x1={pad.l} y1={py(meanV)} x2={W - pad.r} y2={py(meanV)}
        stroke="#f59e0b" strokeWidth="1" strokeDasharray="6,3" opacity={0.7} />
      {/* ATM IV horizontal line */}
      {atmIV !== null && (
        <line x1={pad.l} y1={py(atmIV)} x2={W - pad.r} y2={py(atmIV)}
          stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="8,4" opacity={0.9} />
      )}
      {/* Fill */}
      <polygon
        points={`${pad.l},${H - pad.b} ${pts} ${px(N - 1)},${H - pad.b}`}
        fill="#22d3ee" opacity={0.07}
      />
      {/* Realized vol line */}
      <polyline points={pts} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Date labels */}
      {dateTicks.map((t, i) => (
        <text key={i} x={t.x} y={H - pad.b + 14} textAnchor="middle" fontSize="8" fill="#64748b">{t.label}</text>
      ))}
      {/* Legend */}
      <line x1={W - 145} y1={16} x2={W - 133} y2={16} stroke="#22d3ee" strokeWidth="1.5" />
      <text x={W - 130} y={19} fontSize="8" fill="#94a3b8">Realised σ ({windowSize}d)</text>
      <line x1={W - 145} y1={28} x2={W - 133} y2={28} stroke="#f59e0b" strokeWidth="1" strokeDasharray="6,3" />
      <text x={W - 130} y={31} fontSize="8" fill="#94a3b8">Mean σ</text>
      {atmIV !== null && (
        <>
          <line x1={W - 145} y1={40} x2={W - 133} y2={40} stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="8,4" />
          <text x={W - 130} y={43} fontSize="8" fill="#94a3b8">ATM IV ({pct(atmIV)})</text>
        </>
      )}
      <text x={12} y={H / 2} textAnchor="middle" fontSize="9" fill="#64748b"
        transform={`rotate(-90,12,${H/2})`}>Annualised Vol</text>
    </svg>
  );
}

// ── Vol risk premium bars ──────────────────────────────────────────────────────
function VRPChart({
  realized, impliedIV,
}: { realized: number[]; impliedIV: number }) {
  const vrp = realized.map(rv => impliedIV - rv);
  const N = vrp.length;
  if (N < 2) return null;
  const W = 620; const H = 130;
  const pad = { t: 8, r: 16, b: 24, l: 48 };
  const minV = Math.min(...vrp, -0.01);
  const maxV = Math.max(...vrp, 0.01);
  const vRange = maxV - minV || 0.01;
  const py    = (v: number) => H - pad.b - ((v - minV) / vRange) * (H - pad.t - pad.b);
  const zero  = py(0);
  const bw    = (W - pad.l - pad.r) / N;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      <line x1={pad.l} y1={zero} x2={W - pad.r} y2={zero} stroke="#475569" strokeWidth="1" />
      {vrp.map((v, i) => {
        const x = pad.l + i * bw;
        const y = v >= 0 ? py(v) : zero;
        const h = Math.abs(py(v) - zero);
        return <rect key={i} x={x} y={y} width={Math.max(bw - 0.5, 1)} height={h}
          fill={v >= 0 ? '#22d3ee' : '#f87171'} opacity={0.7} />;
      })}
      {[minV, 0, maxV].map((v, k) => (
        <text key={k} x={pad.l - 4} y={py(v) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{pct(v)}</text>
      ))}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="#64748b">
        VRP = ATM IV − Realised σ · Cyan = premium earned · Red = options underpriced
      </text>
    </svg>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export const HistImpliedPanel = () => {
  const {
    symbol, returns, dates, atmIV,
    histVolResult, histLoading, rollingWindow, setRollingWindow, computeHistVol,
    error,
  } = useVolatility();

  const hasData = returns.length > 0;

  return (
    <div className="space-y-6">
      {/* Prompt when no data yet */}
      {!hasData && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 p-4 text-amber-300 text-sm">
          Use the <strong>Data Source</strong> panel above to search and fetch a ticker. Price history will load automatically and drive this analysis.
        </div>
      )}

      {/* Controls */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">Rolling Window</p>
            {hasData && (
              <p className="text-xs text-slate-500 mt-0.5">
                {returns.length} daily obs loaded for {symbol}
              </p>
            )}
          </div>
          <button onClick={computeHistVol}
            disabled={histLoading || !hasData || returns.length < rollingWindow}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500 disabled:opacity-40 transition flex items-center gap-2">
            {histLoading
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Computing…</>
              : 'Compute Realised Vol'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <input type="range" min={5} max={63} step={1} value={rollingWindow}
            onChange={e => setRollingWindow(parseInt(e.target.value))}
            className="w-40 accent-cyan-500" disabled={!hasData} />
          <span className="text-sm text-white font-mono w-10">{rollingWindow}d</span>
          <div className="flex gap-1">
            {[5, 10, 21, 42, 63].map(w => (
              <button key={w} onClick={() => setRollingWindow(w)}
                disabled={!hasData}
                className={`px-2 py-0.5 rounded text-xs transition ${
                  rollingWindow === w
                    ? 'bg-cyan-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                } disabled:opacity-40`}>{w}d</button>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-slate-600">
          <MathText text={`$\\sigma_r(t) = \\sqrt{252/${rollingWindow} \\cdot \\sum_i r_i^2}$ · 21d≈1mo · 42d≈2mo · 63d≈1qtr`} />
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {histVolResult && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Full-period σ', value: pct(histVolResult.full_period_vol), color: 'text-cyan-300' },
              { label: 'ATM implied vol', value: atmIV !== null ? pct(atmIV) : 'n/a', color: 'text-violet-300' },
              {
                label: 'Vol risk prem',
                value: atmIV !== null ? pct(atmIV - histVolResult.full_period_vol) : 'n/a',
                color: atmIV !== null && atmIV > histVolResult.full_period_vol ? 'text-emerald-300' : 'text-red-300',
              },
              { label: 'Window', value: `${histVolResult.window}d · ${histVolResult.n_obs} obs`, color: 'text-slate-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-xs">
                <p className="text-slate-500 mb-1">{label}</p>
                <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Main chart */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-1">
              Rolling {rollingWindow}d Realised Vol{symbol && ` — ${symbol}`}
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Cyan line: σ_r(t). Amber dashed: mean. Purple dashed: ATM implied vol from live option chain.
            </p>
            <RollingVolChart
              realized={histVolResult.realized_vol}
              atmIV={atmIV}
              dates={dates}
              windowSize={rollingWindow}
            />
          </div>

          {/* VRP chart (only if ATM IV available) */}
          {atmIV !== null && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <p className="text-xs font-semibold text-slate-300 mb-1">Volatility Risk Premium</p>
              <p className="text-xs text-slate-500 mb-3">
                VRP(t) = ATM IV − σ_r(t). Positive = options systematically expensive vs realised.
              </p>
              <VRPChart realized={histVolResult.realized_vol} impliedIV={atmIV} />
            </div>
          )}

          {atmIV === null && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 text-xs text-slate-500">
              No ATM implied vol available for {symbol} — VRP chart unavailable. Assets with listed options (equities) provide IV from the option chain.
            </div>
          )}
        </div>
      )}

      {!histVolResult && !histLoading && hasData && (
        <div className="flex items-center justify-center h-32 rounded-xl border border-slate-700 bg-slate-900/30 text-slate-500 text-sm">
          Click "Compute Realised Vol" to generate chart
        </div>
      )}

      {/* Theory */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">Realised vs Implied Volatility</p>
        <p><MathText text="Realised $\hat{\sigma}$: $\sigma_r = \sqrt{\tfrac{252}{w}\sum_{i=1}^{w} r_i^2}$ — rolling window of daily log-returns from yfinance." /></p>
        <p>Implied vol: ATM IV extracted from live option chain (bid/ask mid, nearest expiry) via yfinance.</p>
        <p><MathText text="Vol Risk Premium $= \sigma_{\text{IV}} - \sigma_{\text{realised}}$. Historically positive ($\approx 2$–$5\%$), earned by variance sellers." /></p>
      </div>
    </div>
  );
};
