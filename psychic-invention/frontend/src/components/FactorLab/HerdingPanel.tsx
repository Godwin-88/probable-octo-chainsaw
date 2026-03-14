/**
 * Herding Risk / Factor Crowding Panel — M6 L2
 * Khandani-Lo style crowding index: avg pairwise correlation of factor loadings.
 * Inspired by the 2007 Quant Meltdown context (crowded momentum unwind).
 * Requires Factor Model to be run first to extract asset betas.
 */
import { useFactorContext } from '@/context/FactorContext';
import { MathText } from '@/components/ui/Math';

const pct  = (v: number) => (v * 100).toFixed(2) + '%';
const fmt3 = (v: number) => v.toFixed(3);

// ── Crowding gauge ─────────────────────────────────────────────────────────────
function CrowdingGauge({ index, level }: { index: number; level: string }) {
  const W = 200; const H = 110;
  const cx = W / 2; const cy = H - 10;
  const r  = 80;

  const levelColor: Record<string, string> = {
    low:      '#22d3ee',
    mild:     '#f59e0b',
    elevated: '#f97316',
    extreme:  '#ef4444',
  };
  const col = levelColor[level] ?? '#94a3b8';

  // Arc from -180° to 0° (semicircle), fill proportional to index
  const angle = -Math.PI + index * Math.PI;  // -π to 0
  const x1 = cx + r * Math.cos(-Math.PI);
  const y1 = cy + r * Math.sin(-Math.PI);
  const x2 = cx + r * Math.cos(angle);
  const y2 = cy + r * Math.sin(angle);
  const large = index > 0.5 ? 1 : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {/* Background arc */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#1e293b" strokeWidth="12" />
      {/* Filled arc */}
      {index > 0 && (
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
          fill="none" stroke={col} strokeWidth="12" strokeLinecap="round" />
      )}
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={cx + (r - 20) * Math.cos(angle)} y2={cy + (r - 20) * Math.sin(angle)}
        stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={4} fill="#e2e8f0" />
      {/* Labels */}
      <text x={cx - r - 4} y={cy + 16} fontSize="8" fill="#64748b" textAnchor="middle">0</text>
      <text x={cx}         y={cy - r - 8} fontSize="8" fill="#64748b" textAnchor="middle">0.5</text>
      <text x={cx + r + 4} y={cy + 16} fontSize="8" fill="#64748b" textAnchor="middle">1</text>
      {/* Center text */}
      <text x={cx} y={cy - 20} fontSize="16" fontWeight="bold" fill={col} textAnchor="middle">
        {(index * 100).toFixed(0)}
      </text>
      <text x={cx} y={cy - 6} fontSize="9" fill={col} textAnchor="middle" textTransform="uppercase">
        {level.toUpperCase()}
      </text>
    </svg>
  );
}

// ── Asset beta heatmap (pairwise correlation proxy) ──────────────────────────
function BetaHeatmap({
  labels, betas,
}: { labels: string[]; betas: number[] }) {
  const N = labels.length;
  if (N < 2) return null;
  const W = Math.min(N * 48 + 52, 560);
  const H = Math.min(N * 32 + 32, 360);
  const cellW = (W - 52) / N;
  const cellH = (H - 32) / N;

  // Compute pairwise "similarity" (abs correlation proxy) from beta vectors
  // With a single beta per asset, similarity = 1 - |β_i - β_j| / max_range
  const maxRange = Math.max(...betas.map(Math.abs), 0.5) * 2;
  const sim = (a: number, b: number) => 1 - Math.abs(a - b) / maxRange;

  const heat = (v: number) => {
    const r = Math.round(255 * Math.min(v, 1));
    const g = Math.round(255 * Math.max(0, 1 - v));
    return `rgb(${r},${g},50)`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {labels.map((colLbl, j) => (
        <text key={j} x={52 + j * cellW + cellW / 2} y={14}
          textAnchor="middle" fontSize="7" fill="#94a3b8">{colLbl}</text>
      ))}
      {labels.map((rowLbl, i) => (
        <g key={i}>
          <text x={48} y={32 + i * cellH + cellH / 2 + 3}
            textAnchor="end" fontSize="7" fill="#94a3b8">{rowLbl}</text>
          {labels.map((_, j) => {
            const v = sim(betas[i], betas[j]);
            return (
              <rect key={j}
                x={52 + j * cellW} y={32 + i * cellH}
                width={cellW - 1} height={cellH - 1}
                fill={heat(v)} opacity={0.8}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export const HerdingPanel = () => {
  const {
    labels, factorModelResult,
    crowdingResult, crowdingLoading, computeCrowding, error,
  } = useFactorContext();

  const hasBetas  = !!(factorModelResult && factorModelResult.betas.length > 0);
  const mktBetas  = hasBetas ? factorModelResult!.betas.map(b => b[1] ?? 0) : [];

  const levelDesc: Record<string, string> = {
    low:      'Factor loadings are well-dispersed — crowding risk is minimal.',
    mild:     'Moderate correlation in factor exposures — monitor closely.',
    elevated: 'High correlation across assets — crowding risk is significant.',
    extreme:  'Extreme crowding! Risk of simultaneous factor unwind (Quant Meltdown scenario).',
  };

  return (
    <div className="space-y-6">
      {!hasBetas && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 p-4 text-amber-300 text-sm">
          Run the <strong>Factor Model</strong> panel first to extract asset betas, then analyse herding risk here.
        </div>
      )}

      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-200">Herding / Crowding Risk Monitor</p>
          {hasBetas && (
            <p className="text-xs text-slate-500 mt-0.5">
              {labels.length} assets · pairwise correlation of market β loadings
            </p>
          )}
        </div>
        <button onClick={computeCrowding}
          disabled={crowdingLoading || !hasBetas}
          className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-40 transition flex items-center gap-2">
          {crowdingLoading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Analysing…</>
            : 'Analyse Crowding'}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {crowdingResult && (
        <div className="space-y-4">
          {/* Gauge + level card */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 flex flex-col items-center">
              <p className="text-xs font-semibold text-slate-300 mb-2">Crowding Index</p>
              <CrowdingGauge index={crowdingResult.crowding_index} level={crowdingResult.level} />
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-300">Risk Assessment</p>
              <div className={`rounded-lg p-3 text-sm border ${
                crowdingResult.level === 'extreme'  ? 'bg-red-900/20 border-red-700/40 text-red-300' :
                crowdingResult.level === 'elevated' ? 'bg-orange-900/20 border-orange-700/40 text-orange-300' :
                crowdingResult.level === 'mild'     ? 'bg-amber-900/20 border-amber-700/40 text-amber-300' :
                                                     'bg-emerald-900/20 border-emerald-700/40 text-emerald-300'
              }`}>
                {levelDesc[crowdingResult.level]}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-2">
                  <p className="text-slate-500 mb-1">Crowding Index</p>
                  <p className="font-mono text-white text-sm">{fmt3(crowdingResult.crowding_index)}</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-2">
                  <p className="text-slate-500 mb-1">Avg |ρ| of loadings</p>
                  <p className="font-mono text-white text-sm">{fmt3(crowdingResult.avg_correlation)}</p>
                </div>
              </div>
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <p>Thresholds: Low &lt;0.30 · Mild 0.30–0.50 · Elevated 0.50–0.70 · Extreme &gt;0.70</p>
              </div>
            </div>
          </div>

          {/* Asset beta similarity heatmap */}
          {mktBetas.length > 1 && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <p className="text-xs font-semibold text-slate-300 mb-1">Factor Loading Similarity Matrix</p>
              <p className="text-xs text-slate-500 mb-3">
                Green = high similarity (crowded) · Red = divergent exposures (diversified)
              </p>
              <BetaHeatmap labels={labels} betas={mktBetas} />
            </div>
          )}

          {/* Per-asset betas */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-3">Asset Market β — Crowding Inputs</p>
            <div className="flex flex-wrap gap-2">
              {labels.map((lbl, i) => (
                <div key={i} className="rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-xs">
                  <p className="text-slate-400 text-[10px]">{lbl}</p>
                  <p className={`font-mono font-semibold ${
                    Math.abs(mktBetas[i]) > 1.2 ? 'text-red-300' :
                    Math.abs(mktBetas[i]) > 0.8 ? 'text-amber-300' : 'text-emerald-300'
                  }`}>{fmt3(mktBetas[i])}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Theory */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">Herding Risk — Khandani-Lo (M6 L2)</p>
        <p><MathText text="Crowding index $= \frac{1}{N(N-1)}\sum_{i \neq j}|\rho_{ij}|$ — avg pairwise absolute correlation of factor loadings." /></p>
        <p>High crowding → many assets move together when a factor unwinds (2007 Quant Meltdown).</p>
        <p>Liquidity crisis: crowded factors amplify drawdowns as multiple strategies exit simultaneously.</p>
        <p>Mitigation: diversify across factors (value + momentum + quality) to reduce herding exposure.</p>
      </div>
    </div>
  );
};
