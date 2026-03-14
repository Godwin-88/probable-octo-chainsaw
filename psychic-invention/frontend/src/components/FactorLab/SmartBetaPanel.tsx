/**
 * Smart Beta Panel — M6 L2
 * Factor-tilted portfolio using momentum scores computed from live price history.
 * Methods: quintile sort (long top quintile) or signal-weighted.
 * Compares Smart Beta weights vs equal-weight.
 */
import { useState } from 'react';
import { useFactorContext } from '@/context/FactorContext';
import { MathText } from '@/components/ui/Math';

const pct  = (v: number) => (v * 100).toFixed(2) + '%';
const fmt3 = (v: number) => v.toFixed(3);

type Method = 'quintile_sort' | 'signal_weighted';

// ── Weight comparison chart ───────────────────────────────────────────────────
function WeightChart({
  labels, weights, equalWeights,
}: { labels: string[]; weights: number[]; equalWeights: number[] }) {
  const N = labels.length;
  if (!N) return null;
  const W = 560; const H = 140;
  const pad = { l: 8, r: 8, t: 16, b: 32 };
  const maxW = Math.max(...weights, ...equalWeights, 0.01) * 1.2;
  const bw = (W - pad.l - pad.r) / (N * 2.5);
  const fy = (v: number) => H - pad.b - (v / maxW) * (H - pad.t - pad.b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {[0.25, 0.5, 0.75, 1].map(t => {
        const y = fy(t * maxW);
        return (
          <g key={t}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
            <text x={pad.l} y={y - 2} fontSize="7" fill="#64748b">{pct(t * maxW)}</text>
          </g>
        );
      })}
      {labels.map((lbl, i) => {
        const x0 = pad.l + i * bw * 2.5;
        const sbH = weights[i] * (H - pad.t - pad.b) / maxW;
        const ewH = equalWeights[i] * (H - pad.t - pad.b) / maxW;
        return (
          <g key={i}>
            {/* Smart beta bar */}
            <rect x={x0} y={H - pad.b - sbH} width={bw} height={Math.max(sbH, 1)}
              fill="#f59e0b" opacity={0.85} />
            {/* Equal-weight bar */}
            <rect x={x0 + bw + 1} y={H - pad.b - ewH} width={bw} height={Math.max(ewH, 1)}
              fill="#475569" opacity={0.7} />
            <text x={x0 + bw} y={H - pad.b + 12} textAnchor="middle" fontSize="7" fill="#94a3b8">
              {lbl}
            </text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={W - 120} y={6} width={8} height={6} fill="#f59e0b" opacity={0.85} />
      <text x={W - 109} y={12} fontSize="7" fill="#94a3b8">Smart Beta</text>
      <rect x={W - 120} y={16} width={8} height={6} fill="#475569" opacity={0.7} />
      <text x={W - 109} y={22} fontSize="7" fill="#94a3b8">Equal-Weight</text>
    </svg>
  );
}

// ── Momentum score bar chart ──────────────────────────────────────────────────
function MomentumChart({ labels, scores }: { labels: string[]; scores: number[] }) {
  const N = labels.length;
  if (!N) return null;
  const W = 560; const H = 110;
  const pad = { l: 48, r: 16, t: 8, b: 28 };
  const max = Math.max(...scores.map(Math.abs), 0.01) * 1.2;
  const bw  = (W - pad.l - pad.r) / (N * 1.6);
  const zero = H - pad.b - (max / (2 * max)) * (H - pad.t - pad.b);
  const fy = (v: number) => H - pad.b - ((v + max) / (2 * max)) * (H - pad.t - pad.b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      <line x1={pad.l} y1={zero} x2={W - pad.r} y2={zero} stroke="#475569" strokeWidth="1" />
      {[-max, 0, max].map((v, k) => (
        <text key={k} x={pad.l - 4} y={fy(v) + 3} textAnchor="end" fontSize="7" fill="#94a3b8">
          {pct(v)}
        </text>
      ))}
      {scores.map((s, i) => {
        const x = pad.l + i * bw * 1.6;
        const y = s >= 0 ? fy(s) : zero;
        const h = Math.abs(fy(s) - zero);
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={Math.max(h, 1)} fill={s >= 0 ? '#22d3ee' : '#f87171'} opacity={0.8} />
            <text x={x + bw / 2} y={H - pad.b + 12} textAnchor="middle" fontSize="7" fill="#94a3b8">
              {labels[i]}
            </text>
          </g>
        );
      })}
      <text x={12} y={H / 2} textAnchor="middle" fontSize="8" fill="#64748b"
        transform={`rotate(-90,12,${H / 2})`}>Mom. Score</text>
    </svg>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export const SmartBetaPanel = () => {
  const {
    labels, returnMatrix, momentumScores, weights,
    smartBetaResult, smartBetaLoading, computeSmartBeta, error,
  } = useFactorContext();

  const [method, setMethod] = useState<Method>('quintile_sort');

  const hasData  = returnMatrix.length > 0 && momentumScores.length > 0;
  const N        = labels.length || 1;
  const equalW   = Array.from({ length: N }, () => 1 / N);

  const sbWeights = smartBetaResult?.weights ?? [];

  // Quintile rank (which quintile is each asset in?)
  const sortedIdx = [...momentumScores.map((s, i) => ({ s, i }))].sort((a, b) => a.s - b.s);
  const quintile  = new Array(N).fill(0);
  sortedIdx.forEach(({ i }, rank) => {
    quintile[i] = Math.ceil(((rank + 1) / N) * 5);
  });

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 p-4 text-amber-300 text-sm">
          Load assets above. Momentum scores (≈12-1m return) are computed automatically from price history.
        </div>
      )}

      {/* Controls */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">Smart Beta — Momentum Factor</p>
            {hasData && (
              <p className="text-xs text-slate-500 mt-0.5">
                {labels.length} assets · scores from ≈12-1m rolling return
              </p>
            )}
          </div>
          <button onClick={() => computeSmartBeta(method)}
            disabled={smartBetaLoading || !hasData}
            className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-40 transition flex items-center gap-2">
            {smartBetaLoading
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Computing…</>
              : 'Build Smart Beta'}
          </button>
        </div>

        {/* Method toggle */}
        <div className="flex gap-2">
          {([
            { id: 'quintile_sort',    label: 'Quintile Sort',   desc: 'Long top 20% momentum' },
            { id: 'signal_weighted',  label: 'Signal-Weighted', desc: 'w_i ∝ momentum score' },
          ] as const).map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs text-left border transition ${
                method === m.id
                  ? 'bg-amber-700/30 border-amber-600 text-amber-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}>
              <p className="font-semibold">{m.label}</p>
              <p className="text-[10px] mt-0.5 opacity-70">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {/* Momentum scores */}
      {hasData && momentumScores.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs font-semibold text-slate-300 mb-1">Asset Momentum Scores (approx. 12-1m return)</p>
          <p className="text-xs text-slate-500 mb-3">Cyan = positive momentum · Red = negative momentum</p>
          <MomentumChart labels={labels} scores={momentumScores} />
        </div>
      )}

      {smartBetaResult && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Method',           value: smartBetaResult.method.replace('_', ' '), color: 'text-amber-300' },
              { label: 'Expected Return',  value: pct(smartBetaResult.expected_return * 252), color: 'text-emerald-300' },
              { label: 'Portfolio σ (ann)', value: pct(smartBetaResult.volatility * Math.sqrt(252)), color: 'text-cyan-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-xs">
                <p className="text-slate-500 mb-1">{label}</p>
                <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Weight comparison */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-1">Smart Beta vs Equal-Weight Allocation</p>
            <p className="text-xs text-slate-500 mb-3">Amber = smart beta · Grey = 1/N equal weight</p>
            <WeightChart labels={labels} weights={sbWeights} equalWeights={equalW} />
          </div>

          {/* Asset detail table */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-3">Asset Detail</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="pb-2 text-left">Asset</th>
                  <th className="pb-2 text-right">Mom. Score</th>
                  <th className="pb-2 text-right">Quintile</th>
                  <th className="pb-2 text-right">Smart β w</th>
                  <th className="pb-2 text-right">1/N w</th>
                  <th className="pb-2 text-right">Active Tilt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {labels.map((lbl, i) => {
                  const sb = sbWeights[i] ?? 0;
                  const ew = equalW[i];
                  const tilt = sb - ew;
                  return (
                    <tr key={i}>
                      <td className="py-1.5 font-mono text-white">{lbl}</td>
                      <td className={`py-1.5 text-right font-mono ${momentumScores[i] >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                        {pct(momentumScores[i])}
                      </td>
                      <td className="py-1.5 text-right text-slate-400">Q{quintile[i]}</td>
                      <td className="py-1.5 text-right font-mono text-amber-300">{pct(sb)}</td>
                      <td className="py-1.5 text-right font-mono text-slate-500">{pct(ew)}</td>
                      <td className={`py-1.5 text-right font-mono ${tilt > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tilt > 0 ? '+' : ''}{pct(tilt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Theory */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">Smart Beta — Momentum Strategy (M6 L2)</p>
        <p><MathText text="Momentum: $\text{MOM}_i$ = cumulative log-return over $\approx 12$ months, skip last 1 month (short-term reversal)." /></p>
        <p>Quintile sort: divide universe into 5 groups; long Q5 (high MOM), equal-weight within.</p>
        <p><MathText text="Signal-weighted: $w_i \propto \max(\text{MOM}_i,\, 0)$ — tilt toward positive momentum assets." /></p>
        <p><MathText text="Active tilt $= w_{\text{SB}} - w_{1/N}$ (positive = overweight, negative = underweight)." /></p>
      </div>
    </div>
  );
};
