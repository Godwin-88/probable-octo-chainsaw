/**
 * Covariance Stress Testing Panel — M7: Correlation + Volatility Stress
 *
 * Applies deterministic shocks to the covariance matrix:
 *   Σ_stressed = D_stressed · clip(ρ + Δρ, −0.99, 0.99) · D_stressed
 *   where D_stressed = diag(σ_i · (1 + Δσ))
 *
 * Portfolio impact:
 *   σ²_p_stressed = w^T Σ_stressed w
 *   Compare: stressed vs baseline portfolio volatility, Sharpe
 *
 * Shrinkage context (M7: Ledoit-Wolf vs OAS):
 *   Σ_LW = (1−δ)·S + δ·μ·I   (Ledoit-Wolf oracle)
 *   → Well-conditioned, reduces estimation noise for small T/N
 *   → POST /risk/covariance-health computes this for the loaded return matrix
 *
 * Source: M7 Lesson Notes — Shrinking the Covariance Matrix
 */
import { useState, useMemo } from 'react';
import { useScenariosContext } from '@/context/ScenariosContext';
import { MathText } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(2) + '%';
const fmt3 = (v: number) => v.toFixed(3);

// ── Correlation heatmap SVG ───────────────────────────────────────────────────
function CorrHeatmap({
  labels, corrMatrix, title,
}: { labels: string[]; corrMatrix: number[][]; title: string }) {
  const N = labels.length;
  if (!N) return null;
  const W = Math.min(N * 52 + 52, 380);
  const H = Math.min(N * 36 + 28, 300);
  const cellW = (W - 52) / N;
  const cellH = (H - 28) / N;

  const heat = (v: number) => {
    // -1 → red, 0 → black/grey, +1 → blue
    if (v >= 0) {
      const b = Math.round(255 * v);
      return `rgb(0,${Math.round(80 * (1 - v))},${b})`;
    }
    const r = Math.round(255 * (-v));
    return `rgb(${r},0,${Math.round(40 * (1 + v))})`;
  };

  return (
    <div>
      <p className="text-[10px] text-slate-400 font-semibold mb-1">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
        {labels.map((lbl, j) => (
          <text key={j} x={52 + j * cellW + cellW / 2} y={14}
            textAnchor="middle" fontSize="7" fill="#94a3b8">{lbl}</text>
        ))}
        {corrMatrix.map((row, i) => (
          <g key={i}>
            <text x={48} y={28 + i * cellH + cellH / 2 + 3}
              textAnchor="end" fontSize="7" fill="#94a3b8">{labels[i]}</text>
            {row.map((v, j) => (
              <g key={j}>
                <rect x={52 + j * cellW} y={28 + i * cellH}
                  width={cellW - 1} height={cellH - 1}
                  fill={heat(v)} opacity={0.85} />
                {cellW > 28 && (
                  <text x={52 + j * cellW + cellW / 2} y={28 + i * cellH + cellH / 2 + 3}
                    textAnchor="middle" fontSize="6" fill="#e2e8f0">{v.toFixed(2)}</text>
                )}
              </g>
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Volatility bar chart ──────────────────────────────────────────────────────
function VolComparison({ labels, baseSig, stressedSig }: {
  labels: string[]; baseSig: number[]; stressedSig: number[];
}) {
  const N = labels.length;
  if (!N) return null;
  const W = 480; const H = 110;
  const pad = { l: 8, r: 8, t: 16, b: 28 };
  const maxV = Math.max(...baseSig, ...stressedSig, 0.001) * 1.2;
  const bw = (W - pad.l - pad.r) / (N * 2.5);
  const fy = (v: number) => H - pad.b - (v / maxV) * (H - pad.t - pad.b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {[0.25, 0.5, 0.75, 1].map(t => {
        const y = fy(t * maxV);
        return (
          <g key={t}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
            <text x={pad.l} y={y - 2} fontSize="7" fill="#64748b">{pct(t * maxV)}</text>
          </g>
        );
      })}
      {labels.map((lbl, i) => {
        const x0 = pad.l + i * bw * 2.5;
        const bh = (baseSig[i] / maxV) * (H - pad.t - pad.b);
        const sh = (stressedSig[i] / maxV) * (H - pad.t - pad.b);
        return (
          <g key={i}>
            <rect x={x0} y={H - pad.b - bh} width={bw} height={Math.max(bh, 1)} fill="#22d3ee" opacity={0.75} />
            <rect x={x0 + bw + 1} y={H - pad.b - sh} width={bw} height={Math.max(sh, 1)} fill="#f43f5e" opacity={0.8} />
            <text x={x0 + bw} y={H - pad.b + 12} textAnchor="middle" fontSize="7" fill="#94a3b8">{lbl}</text>
          </g>
        );
      })}
      <rect x={W - 120} y={6} width={8} height={6} fill="#22d3ee" opacity={0.75} />
      <text x={W - 109} y={12} fontSize="7" fill="#94a3b8">Baseline σ</text>
      <rect x={W - 120} y={16} width={8} height={6} fill="#f43f5e" opacity={0.8} />
      <text x={W - 109} y={22} fontSize="7" fill="#94a3b8">Stressed σ</text>
    </svg>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export const CovStressPanel = () => {
  const { labels, returnMatrix, weights } = useScenariosContext();

  const hasData = returnMatrix.length > 0;
  const N = labels.length;

  const [corrShift, setCorrShift] = useState(0.20);
  const [volMultiplier, setVolMultiplier] = useState(1.5);  // stressed σ_i *= this
  const [rfRate, setRfRate] = useState(0.05);  // annualised risk-free for Sharpe

  // ── Compute baseline from live data ────────────────────────────────────────
  const { baseCorr, baseSig, baseCov, portVol, portReturn } = useMemo(() => {
    if (!hasData || !N) return { baseCorr: [], baseSig: [], baseCov: [], portVol: 0, portReturn: 0 };
    const T = returnMatrix.length;
    const w = weights.length === N ? weights : Array(N).fill(1 / N);

    // Mean returns
    const mu = Array.from({ length: N }, (_, i) =>
      returnMatrix.reduce((s, row) => s + row[i], 0) / T
    );
    // Covariance matrix
    const cov = Array.from({ length: N }, (_, i) =>
      Array.from({ length: N }, (_, j) => {
        const c = returnMatrix.reduce((s, row) => s + (row[i] - mu[i]) * (row[j] - mu[j]), 0) / (T - 1);
        return c;
      })
    );
    // Std devs
    const sig = Array.from({ length: N }, (_, i) => Math.sqrt(cov[i][i]));
    // Correlation matrix
    const corr = Array.from({ length: N }, (_, i) =>
      Array.from({ length: N }, (_, j) =>
        sig[i] > 0 && sig[j] > 0 ? cov[i][j] / (sig[i] * sig[j]) : (i === j ? 1 : 0)
      )
    );
    // Portfolio stats
    let pv = 0;
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++)
        pv += w[i] * w[j] * cov[i][j];
    const pr = mu.reduce((s, m, i) => s + m * w[i], 0);

    return { baseCorr: corr, baseSig: sig, baseCov: cov, portVol: Math.sqrt(pv), portReturn: pr };
  }, [returnMatrix, weights, N, hasData]);

  // ── Compute stressed covariance ────────────────────────────────────────────
  const { stressedCorr, stressedSig, stressedPortVol } = useMemo(() => {
    if (!hasData || !N || !baseSig.length) return { stressedCorr: [], stressedSig: [], stressedPortVol: 0 };
    const w = weights.length === N ? weights : Array(N).fill(1 / N);

    const sSig = baseSig.map(s => s * volMultiplier);
    const sCorr = baseCorr.map((row, i) =>
      row.map((c, j) => {
        if (i === j) return 1;
        return Math.max(-0.99, Math.min(0.99, c + corrShift));
      })
    );
    // Stressed covariance
    const sCov = Array.from({ length: N }, (_, i) =>
      Array.from({ length: N }, (_, j) => sSig[i] * sSig[j] * sCorr[i][j])
    );
    // Stressed portfolio variance
    let spv = 0;
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++)
        spv += w[i] * w[j] * sCov[i][j];

    return { stressedCorr: sCorr, stressedSig: sSig, stressedPortVol: Math.sqrt(spv) };
  }, [baseCorr, baseSig, corrShift, volMultiplier, weights, N, hasData]);

  // Sharpe ratios (annualised ×√252, daily rf / 252)
  const rfDaily = rfRate / 252;
  const baseAnnVol     = portVol * Math.sqrt(252);
  const stressedAnnVol = stressedPortVol * Math.sqrt(252);
  const annReturn      = portReturn * 252;
  const baseSharpe     = baseAnnVol > 0 ? (annReturn - rfRate) / baseAnnVol : 0;
  const stressedSharpe = stressedAnnVol > 0 ? (annReturn - rfRate) / stressedAnnVol : 0;

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="rounded-xl border border-rose-700/40 bg-rose-900/10 p-4 text-rose-300 text-sm">
          Load assets above. Covariance stress uses live yfinance data to build Σ, then applies shocks.
        </div>
      )}

      {/* Controls */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-200">Covariance Matrix Stress Controls</p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Correlation Shock Δρ (all pairs)
            </label>
            <input type="range" min={-30} max={70} step={1}
              value={Math.round(corrShift * 100)}
              onChange={e => setCorrShift(parseInt(e.target.value) / 100)}
              className="w-full accent-rose-500"
            />
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">−30%</span>
              <span className={`font-mono font-semibold ${corrShift > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {corrShift >= 0 ? '+' : ''}{pct(corrShift)}
              </span>
              <span className="text-slate-600">+70%</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {[0.30, 0.40, 0.50].map(v => (
                <button key={v} onClick={() => setCorrShift(v)}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition">
                  {v === 0.30 ? 'COVID' : v === 0.40 ? 'QM07' : 'GFC08'}+{pct(v)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Volatility Multiplier (×σᵢ)
            </label>
            <input type="range" min={100} max={400} step={10}
              value={Math.round(volMultiplier * 100)}
              onChange={e => setVolMultiplier(parseInt(e.target.value) / 100)}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">×1.0</span>
              <span className="font-mono font-semibold text-amber-300">×{volMultiplier.toFixed(2)}</span>
              <span className="text-slate-600">×4.0</span>
            </div>
            <div className="flex gap-1">
              {[1.0, 1.5, 2.0, 3.0].map(v => (
                <button key={v} onClick={() => setVolMultiplier(v)}
                  className={`px-2 py-0.5 rounded text-[10px] transition ${
                    volMultiplier === v ? 'bg-amber-700 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
                  }`}>×{v}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Risk-Free Rate (annualised)
            </label>
            <input type="range" min={0} max={10} step={0.25}
              value={rfRate * 100}
              onChange={e => setRfRate(parseFloat(e.target.value) / 100)}
              className="w-full accent-cyan-500"
            />
            <span className="text-cyan-300 font-mono text-xs">{pct(rfRate)}</span>
          </div>
        </div>
      </div>

      {/* Live results — computed client-side from live data */}
      {hasData && N > 0 && (
        <div className="space-y-4">
          {/* Comparison cards */}
          <div className="rounded-xl border border-rose-800/40 bg-rose-900/10 p-4">
            <p className="text-sm font-semibold text-rose-300 mb-3">Stressed Portfolio Metrics</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Baseline σ (ann)',   value: pct(baseAnnVol),     color: 'text-cyan-400' },
                { label: 'Stressed σ (ann)',   value: pct(stressedAnnVol), color: 'text-red-400' },
                { label: 'Baseline Sharpe',    value: fmt3(baseSharpe),    color: 'text-emerald-400' },
                { label: 'Stressed Sharpe',    value: fmt3(stressedSharpe), color: stressedSharpe > 0 ? 'text-amber-300' : 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-xs">
                  <p className="text-slate-500 mb-1">{label}</p>
                  <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Vol comparison bars */}
            {baseSig.length > 0 && stressedSig.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
                <p className="text-xs text-slate-400 font-semibold mb-1">Asset Volatility: Baseline vs Stressed</p>
                <p className="text-[10px] text-slate-500 mb-2">Cyan = baseline σ · Red = stressed σ (×{volMultiplier.toFixed(1)})</p>
                <VolComparison labels={labels} baseSig={baseSig} stressedSig={stressedSig} />
              </div>
            )}
          </div>

          {/* Correlation heatmaps */}
          {baseCorr.length > 0 && stressedCorr.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <p className="text-xs font-semibold text-slate-300 mb-3">Correlation Matrix — Baseline vs Stressed</p>
              <p className="text-[10px] text-slate-500 mb-3">
                Blue = positive ρ · Red = negative ρ · Stressed = clip(ρ + {pct(corrShift)}, −0.99, 0.99)
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <CorrHeatmap labels={labels} corrMatrix={baseCorr} title={`Baseline ρ`} />
                <CorrHeatmap labels={labels} corrMatrix={stressedCorr} title={`Stressed ρ (+${pct(corrShift)})`} />
              </div>
            </div>
          )}

          {/* Detailed comparison table */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-3">Asset Volatility Detail</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="pb-2 text-left font-medium">Asset</th>
                  <th className="pb-2 text-right font-medium">σ_base (daily)</th>
                  <th className="pb-2 text-right font-medium">σ_stressed (daily)</th>
                  <th className="pb-2 text-right font-medium">σ_base (ann)</th>
                  <th className="pb-2 text-right font-medium">σ_stressed (ann)</th>
                  <th className="pb-2 text-right font-medium">Amplification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {labels.map((lbl, i) => {
                  const amp = stressedSig[i] / baseSig[i];
                  return (
                    <tr key={i}>
                      <td className="py-1.5 font-mono text-white">{lbl}</td>
                      <td className="py-1.5 text-right font-mono text-cyan-400">{pct(baseSig[i])}</td>
                      <td className="py-1.5 text-right font-mono text-red-400">{pct(stressedSig[i])}</td>
                      <td className="py-1.5 text-right font-mono text-slate-400">{pct(baseSig[i] * Math.sqrt(252))}</td>
                      <td className="py-1.5 text-right font-mono text-slate-400">{pct(stressedSig[i] * Math.sqrt(252))}</td>
                      <td className="py-1.5 text-right font-mono text-amber-300">×{fmt3(amp)}</td>
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
        <p className="font-semibold text-slate-300">Covariance Stress Testing (M7)</p>
        <p><MathText text="$\Sigma_{\text{stressed}} = D_{\text{stressed}} \cdot \mathrm{clip}(\rho + \Delta\rho,\,-0.99,\,0.99) \cdot D_{\text{stressed}}$" /></p>
        <p><MathText text="$D_{\text{stressed}} = \mathrm{diag}(\sigma_i \cdot \text{mult})$ — scaled volatility diagonal matrix." /></p>
        <p><MathText text="$\sigma^2_{p,\text{stressed}} = w^\top\Sigma_{\text{stressed}}\,w$ — stressed portfolio variance." /></p>
        <p><MathText text="Ledoit-Wolf (M7): $\Sigma_{\mathrm{LW}} = (1-\delta)S + \delta\bar{\mu}I$ — reduces estimation error for small $T/N$." /></p>
        <p>OAS (Oracle Approximating Shrinkage): data-driven δ estimate, generally more accurate than LW.</p>
      </div>
    </div>
  );
};
