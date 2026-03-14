/**
 * ML Factor Discovery Panel — M6 L2 / Advanced Factor Construction
 * PCA-based latent factor extraction from the cross-sectional return matrix.
 *
 * Displays:
 *   - Scree plot: eigenvalue decay
 *   - Cumulative explained variance line
 *   - Factor loadings heatmap (N assets × K components)
 *   - Components needed for 80% variance threshold
 */
import { useFactorContext } from '@/context/FactorContext';
import { MathText } from '@/components/ui/Math';

const pct = (v: number) => (v * 100).toFixed(1) + '%';

// ── Scree plot + cumulative variance ─────────────────────────────────────────
function ScreePlot({
  eigenvalues, explained, cumulative, n80,
}: {
  eigenvalues: number[];
  explained: number[];
  cumulative: number[];
  n80: number;
}) {
  const K = eigenvalues.length;
  if (!K) return null;
  const W = 560; const H = 200;
  const pad = { l: 48, r: 40, t: 24, b: 36 };
  const maxE = Math.max(...eigenvalues, 0.01) * 1.15;
  const bw   = (W - pad.l - pad.r) / (K * 1.8);

  const fy  = (v: number) => H - pad.b - (v / maxE) * (H - pad.t - pad.b);
  const fcum = (v: number) => H - pad.b - v * (H - pad.t - pad.b);
  const px   = (i: number) => pad.l + i * bw * 1.8 + bw * 0.4;

  const cumPts = cumulative.map((c, i) => `${px(i)},${fcum(c)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {/* Y-axis grid (eigenvalue) */}
      {[0.25, 0.5, 0.75, 1].map(t => {
        const y = fy(t * maxE);
        return (
          <g key={t}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
            <text x={pad.l - 4} y={y + 3} textAnchor="end" fontSize="7" fill="#94a3b8">
              {(t * maxE).toFixed(1)}
            </text>
          </g>
        );
      })}
      {/* 80% cumulative threshold */}
      <line x1={pad.l} y1={fcum(0.80)} x2={W - pad.r} y2={fcum(0.80)}
        stroke="#f59e0b" strokeWidth="1" strokeDasharray="6,3" opacity={0.7} />
      <text x={W - pad.r + 2} y={fcum(0.80) + 3} fontSize="7" fill="#f59e0b">80%</text>

      {/* Eigenvalue bars */}
      {eigenvalues.map((e, i) => {
        const x = px(i);
        const h = (e / maxE) * (H - pad.t - pad.b);
        const isK80 = i === n80 - 1;
        return (
          <g key={i}>
            <rect x={x} y={fy(e)} width={bw} height={Math.max(h, 1)}
              fill={isK80 ? '#f59e0b' : '#6366f1'} opacity={0.8} />
            <text x={x + bw / 2} y={H - pad.b + 12} textAnchor="middle" fontSize="7" fill="#94a3b8">
              PC{i + 1}
            </text>
            <text x={x + bw / 2} y={fy(e) - 3} textAnchor="middle" fontSize="6" fill="#e2e8f0">
              {pct(explained[i])}
            </text>
          </g>
        );
      })}

      {/* Cumulative variance line */}
      <polyline points={cumPts} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinejoin="round" />
      {cumulative.map((c, i) => (
        <circle key={i} cx={px(i) + bw / 2} cy={fcum(c)} r={2.5} fill="#22d3ee" />
      ))}

      {/* Right axis labels (cumulative %) */}
      {[0.25, 0.5, 0.75, 1].map(t => (
        <text key={t} x={W - pad.r + 2} y={fcum(t) + 3} fontSize="7" fill="#22d3ee">
          {pct(t)}
        </text>
      ))}

      {/* Legend */}
      <rect x={pad.l + 4} y={pad.t} width={8} height={6} fill="#6366f1" opacity={0.8} />
      <text x={pad.l + 14} y={pad.t + 6} fontSize="7" fill="#94a3b8">Eigenvalue</text>
      <line x1={pad.l + 40} y1={pad.t + 3} x2={pad.l + 48} y2={pad.t + 3} stroke="#22d3ee" strokeWidth="1.5" />
      <text x={pad.l + 50} y={pad.t + 6} fontSize="7" fill="#94a3b8">Cumulative %</text>
    </svg>
  );
}

// ── Factor loadings heatmap ───────────────────────────────────────────────────
function LoadingsHeatmap({
  labels, loadings,
}: { labels: string[]; loadings: number[][] }) {
  const N = loadings.length;
  const K = loadings[0]?.length ?? 0;
  if (!N || !K) return null;

  const W = Math.min(K * 56 + 64, 560);
  const H = Math.min(N * 28 + 28, 400);
  const cellW = (W - 64) / K;
  const cellH = (H - 28) / N;

  const maxAbs = Math.max(...loadings.flat().map(Math.abs), 0.01);
  const heat = (v: number) => {
    const norm = v / maxAbs;         // -1 to +1
    if (norm >= 0) {
      const b = Math.round(255 * (1 - norm));
      return `rgb(34,${Math.round(200 * (1 - norm))},${255})`;  // blue → cyan
    }
    const a = Math.round(255 * (-norm));
    return `rgb(${a},50,50)`;        // red
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {Array.from({ length: K }, (_, j) => (
        <text key={j} x={64 + j * cellW + cellW / 2} y={14}
          textAnchor="middle" fontSize="7" fill="#94a3b8">PC{j + 1}</text>
      ))}
      {loadings.map((row, i) => (
        <g key={i}>
          <text x={60} y={28 + i * cellH + cellH / 2 + 3}
            textAnchor="end" fontSize="7" fill="#94a3b8">{labels[i]}</text>
          {row.map((v, j) => (
            <g key={j}>
              <rect x={64 + j * cellW} y={28 + i * cellH}
                width={cellW - 1} height={cellH - 1}
                fill={heat(v)} opacity={0.85} />
              {cellW > 30 && (
                <text x={64 + j * cellW + cellW / 2} y={28 + i * cellH + cellH / 2 + 3}
                  textAnchor="middle" fontSize="6" fill="#e2e8f0">{v.toFixed(2)}</text>
              )}
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export const MLFactorPanel = () => {
  const {
    labels, returnMatrix,
    nPcaComponents, setNPcaComponents,
    pcaResult, pcaLoading, computePCA, error,
  } = useFactorContext();

  const hasData = returnMatrix.length > 0;
  const maxK    = Math.min(labels.length, 10);

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 p-4 text-amber-300 text-sm">
          Load assets above. PCA extracts latent statistical factors from the return correlation matrix.
        </div>
      )}

      {/* Controls */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">ML Factor Discovery — PCA</p>
            {hasData && (
              <p className="text-xs text-slate-500 mt-0.5">
                {returnMatrix.length} obs · {labels.length} assets · extracting {nPcaComponents} PC{nPcaComponents > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button onClick={computePCA}
            disabled={pcaLoading || !hasData}
            className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-40 transition flex items-center gap-2">
            {pcaLoading
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Computing…</>
              : 'Run PCA'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <input type="range" min={1} max={maxK} step={1} value={nPcaComponents}
            onChange={e => setNPcaComponents(parseInt(e.target.value))}
            className="w-40 accent-amber-500" disabled={!hasData} />
          <span className="text-sm text-white font-mono w-12">{nPcaComponents} PC{nPcaComponents > 1 ? 's' : ''}</span>
          <div className="flex gap-1">
            {[2, 3, 5, Math.min(maxK, 8)].filter((v, i, a) => a.indexOf(v) === i).map(k => (
              <button key={k} onClick={() => setNPcaComponents(k)}
                disabled={!hasData}
                className={`px-2 py-0.5 rounded text-xs transition ${
                  nPcaComponents === k
                    ? 'bg-amber-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                } disabled:opacity-40`}>{k}</button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">{error}</div>}

      {pcaResult && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'PC1 Variance',       value: pct(pcaResult.explained_variance_ratio[0]), color: 'text-violet-300' },
              { label: 'Cumul. (all PCs)',   value: pct(pcaResult.cumulative_variance[pcaResult.cumulative_variance.length - 1]), color: 'text-cyan-300' },
              { label: 'PCs for 80%',        value: `${pcaResult.components_for_80pct} of ${pcaResult.total_n_assets}`, color: 'text-amber-300' },
              { label: 'Assets',             value: `${pcaResult.total_n_assets}`, color: 'text-slate-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-xs">
                <p className="text-slate-500 mb-1">{label}</p>
                <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Scree + cumulative */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-1">Scree Plot — Eigenvalue Decay</p>
            <p className="text-xs text-slate-500 mb-3">
              Purple bars = eigenvalue · Cyan line = cumulative variance · Amber = 80% threshold · Gold bar = component achieving 80%
            </p>
            <ScreePlot
              eigenvalues={pcaResult.eigenvalues}
              explained={pcaResult.explained_variance_ratio}
              cumulative={pcaResult.cumulative_variance}
              n80={pcaResult.components_for_80pct}
            />
          </div>

          {/* Loadings heatmap */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-1">Factor Loadings Matrix (N assets × K PCs)</p>
            <p className="text-xs text-slate-500 mb-3">
              Cyan = positive loading · Red = negative loading · High absolute value = strong association with that factor
            </p>
            <LoadingsHeatmap labels={labels} loadings={pcaResult.loadings} />
          </div>

          {/* Explained variance table */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-3">Variance Explained per Component</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="pb-2 text-left font-medium">Component</th>
                  <th className="pb-2 text-right font-medium">Eigenvalue</th>
                  <th className="pb-2 text-right font-medium">% Variance</th>
                  <th className="pb-2 text-right font-medium">Cumulative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pcaResult.eigenvalues.map((ev, i) => (
                  <tr key={i}>
                    <td className="py-1.5 font-mono text-white">PC{i + 1}</td>
                    <td className="py-1.5 text-right font-mono text-violet-300">{ev.toFixed(4)}</td>
                    <td className="py-1.5 text-right font-mono text-cyan-300">
                      {pct(pcaResult.explained_variance_ratio[i])}
                    </td>
                    <td className={`py-1.5 text-right font-mono ${
                      pcaResult.cumulative_variance[i] >= 0.80 ? 'text-amber-300' : 'text-slate-400'
                    }`}>
                      {pct(pcaResult.cumulative_variance[i])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Theory */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">PCA Latent Factor Extraction (M6 L2)</p>
        <p><MathText text="Standardise: $\tilde{R}_{it} = (R_{it} - \mu_i)/\sigma_i$ — remove scale effects." /></p>
        <p><MathText text="Correlation matrix $C = \tilde{R}^\top\tilde{R}/(T-1)$ — eigendecomposition $\to (\lambda_k, \mathbf{v}_k)$." /></p>
        <p><MathText text="$\text{PC}_k = \tilde{R}\,\mathbf{v}_k$ — $k$-th latent factor time series (linear combination of returns)." /></p>
        <p><MathText text="Elbow rule: choose $K$ where scree plot flattens. 80\% rule: $K$ s.t. $\sum_k\lambda_k \geq 0.80\sum\lambda$." /></p>
      </div>
    </div>
  );
};
