/**
 * Minimum Spanning Tree Graph Panel — TRANSACT_APP_SPEC §3.3.3
 * M7 L3: MST of correlation-distance graph d(ρᵢⱼ) = √(2(1−ρᵢⱼ))
 *
 * Pure-SVG circular layout — no external graph library required.
 * Nodes placed on a circle; MST edges highlighted in teal; all
 * edges shown as faint gray lines (togglable).
 */
import { useState } from 'react';
import { useRisk } from '@/context/RiskContext';

// ── Colour helpers ──────────────────────────────────────────────────────────
function edgeColor(corr: number): string {
  // high correlation (corr → 1) → warm red; low → cool blue
  const t = Math.max(0, Math.min(1, (corr + 1) / 2));  // 0..1
  const r  = Math.round(59  + (239 - 59)  * t);
  const g  = Math.round(130 + (68  - 130) * t);
  const b  = Math.round(246 + (68  - 246) * t);
  return `rgb(${r},${g},${b})`;
}

function nodeColor(idx: number, total: number): string {
  const hue = Math.round((idx / total) * 280);
  return `hsl(${hue}, 70%, 55%)`;
}

// ── SVG MST Graph ──────────────────────────────────────────────────────────
interface GraphProps {
  nodes: { id: number; label: string }[];
  mstEdges: { from: number; to: number; correlation: number; distance: number }[];
  allEdges: { from: number; to: number; correlation: number; distance: number }[];
  showAllEdges: boolean;
  showDistances: boolean;
}

function MSTGraph({ nodes, mstEdges, allEdges, showAllEdges, showDistances }: GraphProps) {
  const N = nodes.length;
  if (N === 0) return null;

  const SVG_W = 520;
  const SVG_H = 480;
  const CX = SVG_W / 2;
  const CY = SVG_H / 2;
  const R  = Math.min(CX, CY) - 70;  // radius of node circle
  const NODE_R = Math.max(22, Math.min(32, 160 / N));

  // Node positions on circle
  const pos = nodes.map((_, i) => {
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    return {
      x: CX + R * Math.cos(angle),
      y: CY + R * Math.sin(angle),
    };
  });

  const mstSet = new Set(mstEdges.map(e => `${Math.min(e.from, e.to)}-${Math.max(e.from, e.to)}`));

  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="block mx-auto"
      style={{ background: 'transparent' }}
    >
      {/* All-edges (faint) */}
      {showAllEdges && allEdges.map(e => {
        const key = `${Math.min(e.from, e.to)}-${Math.max(e.from, e.to)}`;
        if (mstSet.has(key)) return null;
        const p1 = pos[e.from], p2 = pos[e.to];
        return (
          <line
            key={`ae-${key}`}
            x1={p1.x} y1={p1.y}
            x2={p2.x} y2={p2.y}
            stroke="#475569"
            strokeWidth={0.5}
            strokeDasharray="3 4"
            opacity={0.4}
          />
        );
      })}

      {/* MST edges */}
      {mstEdges.map(e => {
        const key = `${Math.min(e.from, e.to)}-${Math.max(e.from, e.to)}`;
        const p1 = pos[e.from], p2 = pos[e.to];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const color = edgeColor(e.correlation);
        const thick = Math.max(1.5, Math.min(4, 3 * Math.abs(e.correlation)));

        return (
          <g key={`mst-${key}`}>
            <line
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              stroke={color}
              strokeWidth={thick}
              strokeLinecap="round"
              opacity={0.85}
            />
            {showDistances && (
              <text
                x={midX}
                y={midY - 4}
                textAnchor="middle"
                fontSize={9}
                fill="#cbd5e1"
              >
                {e.distance.toFixed(3)}
              </text>
            )}
            <title>{`ρ = ${e.correlation.toFixed(3)}, d = ${e.distance.toFixed(3)}`}</title>
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node, i) => {
        const { x, y } = pos[i];
        const color = nodeColor(i, N);
        return (
          <g key={`node-${i}`}>
            <circle
              cx={x}
              cy={y}
              r={NODE_R}
              fill={color}
              opacity={0.85}
              stroke="#1e293b"
              strokeWidth={2}
            />
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              fontSize={Math.min(12, NODE_R - 2)}
              fontWeight="bold"
              fill="white"
            >
              {node.label.slice(0, 5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────
export const MSTGraphPanel = () => {
  const {
    returns, labels, usingDemo,
    mstData, computeMst, loading, error,
  } = useRisk();

  const [showAllEdges, setShowAllEdges]   = useState(false);
  const [showDistances, setShowDistances] = useState(true);

  const N = returns[0]?.length ?? 0;
  const T = returns.length;

  // Min / max correlation for legend
  const corrRange = mstData?.mst_edges.length
    ? [
        Math.min(...mstData.mst_edges.map(e => e.correlation)),
        Math.max(...mstData.mst_edges.map(e => e.correlation)),
      ]
    : [0, 1];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Minimum Spanning Tree (MST)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              M7 L3 · Mantegna (1999) · d(ρᵢⱼ) = √(2(1−ρᵢⱼ)) · Kruskal MST
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-full border ${usingDemo
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              {usingDemo ? '⚠ Demo' : '✓ Custom'}
            </span>
            <span className="text-slate-500">{T} obs · {N} assets</span>
          </div>
        </div>

        {/* Theory note */}
        <div className="mb-4 rounded-lg bg-slate-800/50 border border-slate-700 p-3 text-xs font-mono text-slate-400">
          <span className="text-teal-400">Distance metric:</span> d(ρᵢⱼ) = √(2(1−ρᵢⱼ)) ∈ [0, 2] &nbsp;·&nbsp;
          <span className="text-teal-400">MST:</span> N−1 edges spanning all N nodes with minimum total distance
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={computeMst}
            disabled={loading.mst}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 disabled:opacity-50 transition"
          >
            {loading.mst ? 'Computing MST…' : 'Compute MST'}
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-800 bg-red-900/20 p-3 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* ── Graph ───────────────────────────────────────────────────────── */}
      {mstData && (
        <>
          {/* Controls */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <div className="flex items-center gap-4 flex-wrap mb-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={showAllEdges}
                  onChange={e => setShowAllEdges(e.target.checked)}
                  className="accent-teal-500"
                />
                Show all edges (dashed)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={showDistances}
                  onChange={e => setShowDistances(e.target.checked)}
                  className="accent-teal-500"
                />
                Show distances on MST edges
              </label>

              {/* Colour legend */}
              <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                <span>ρ=−1</span>
                <div className="w-20 h-2 rounded" style={{
                  background: 'linear-gradient(to right, rgb(59,130,246), rgb(239,68,68))',
                }} />
                <span>ρ=+1</span>
              </div>
            </div>

            <MSTGraph
              nodes={mstData.nodes}
              mstEdges={mstData.mst_edges}
              allEdges={mstData.all_edges}
              showAllEdges={showAllEdges}
              showDistances={showDistances}
            />
          </div>

          {/* MST edge table */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="text-sm font-semibold text-white mb-1">MST Edges</h4>
            <p className="text-xs text-slate-500 mb-4">
              Total MST distance: {mstData.total_mst_distance.toFixed(4)} &nbsp;·&nbsp;
              {mstData.mst_edges.length} edges for {mstData.nodes.length} assets &nbsp;·&nbsp;
              ρ range: [{corrRange[0].toFixed(3)}, {corrRange[1].toFixed(3)}]
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left pb-2 text-slate-400 font-medium">Asset A</th>
                    <th className="text-left pb-2 text-slate-400 font-medium">Asset B</th>
                    <th className="text-right pb-2 text-slate-400 font-medium">Correlation ρ</th>
                    <th className="text-right pb-2 text-slate-400 font-medium">Distance d</th>
                    <th className="w-24 pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[...mstData.mst_edges]
                    .sort((a, b) => b.correlation - a.correlation)
                    .map((e, i) => {
                      const color = edgeColor(e.correlation);
                      return (
                        <tr key={i}>
                          <td className="py-2 pr-3 text-white font-medium">
                            {mstData.nodes[e.from]?.label ?? e.from}
                          </td>
                          <td className="py-2 pr-3 text-white font-medium">
                            {mstData.nodes[e.to]?.label ?? e.to}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono" style={{ color }}>
                            {e.correlation.toFixed(4)}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-slate-400">
                            {e.distance.toFixed(4)}
                          </td>
                          <td className="py-2">
                            <div className="h-1.5 rounded bg-slate-700 overflow-hidden">
                              <div
                                className="h-full rounded"
                                style={{ width: `${Math.max(0, e.correlation) * 100}%`, backgroundColor: color }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Highly correlated pairs (ρ close to 1) appear as short MST edges — these assets
              move together and offer little diversification benefit. In a crisis, all correlations
              converge toward 1 (correlation breakdown).
            </p>
          </div>
        </>
      )}

      {!mstData && !loading.mst && !error && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center text-slate-500 text-sm">
          Click <span className="text-white font-medium">Compute MST</span> to build the Minimum Spanning Tree
          of the asset correlation network.
        </div>
      )}
    </div>
  );
};
