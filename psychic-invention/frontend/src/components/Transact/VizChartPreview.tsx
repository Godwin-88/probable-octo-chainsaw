import { useEffect, useRef, useState, useCallback } from 'react';

export interface OHLCPoint {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume?: number | null;
}

interface VizChartPreviewProps {
  data: OHLCPoint[];
  symbol: string;
  vizType: string;
  period: string;
  height?: number;
  /** For multi-asset charts (pie, treemap, etc.) */
  allDataBySymbol?: Record<string, OHLCPoint[]>;
  assetCount?: number;
}

const NOT_AVAILABLE: Record<string, string> = {
  pie: 'Not available — Pie charts require 2+ assets for allocation. Select multiple assets.',
  treemap: 'Not available — Treemaps require 2+ assets for allocation. Select multiple assets.',
  sunburst: 'Not available — Sunburst requires hierarchical allocation data (2+ assets).',
  heatmap: 'Not available — Heatmaps require 2+ assets for correlation matrix.',
  'correlation-matrix': 'Not available — Correlation matrix requires 2+ assets.',
  waterfall: 'Not available — Waterfall charts are for sequential variance (income statements, cash flow).',
  sankey: 'Not available — Sankey diagrams require flow data (e.g. fund flows).',
  radar: 'Not available — Radar charts require multi-factor scores (ESG, risk metrics).',
  gantt: 'Not available — Gantt charts are for schedules and timelines.',
  bullet: 'Not available — Bullet charts require KPI vs target data.',
};

const NEEDS_MULTI_ASSET = ['pie', 'treemap', 'sunburst', 'heatmap', 'correlation-matrix'];
const NOT_APPLICABLE = ['waterfall', 'sankey', 'radar', 'gantt', 'bullet'];

function computeReturns(data: OHLCPoint[]): number[] {
  const closes = data.map((d) => d.close ?? d.open ?? 0).filter((v) => v > 0);
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const r = (closes[i] - closes[i - 1]) / closes[i - 1];
    out.push(r);
  }
  return out;
}

export const VizChartPreview = ({
  data,
  symbol,
  vizType,
  period,
  height = 220,
  allDataBySymbol = {},
  assetCount = 1,
}: VizChartPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const notAvailableReason = NOT_APPLICABLE.includes(vizType)
    ? NOT_AVAILABLE[vizType]
    : NEEDS_MULTI_ASSET.includes(vizType) && assetCount < 2
      ? NOT_AVAILABLE[vizType] ?? 'Requires 2+ assets for allocation.'
      : null;

  if (notAvailableReason) {
    return (
      <div className="rounded-xl bg-slate-800/60 border border-slate-700 overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
          <span className="text-sm font-medium text-white">{symbol}</span>
          <span className="text-xs text-slate-500">{vizType} · {period}</span>
        </div>
        <div
          className="flex flex-col items-center justify-center rounded-b-xl bg-amber-500/5 border-t border-amber-500/20"
          style={{ height: `${height}px` }}
        >
          <p className="text-amber-400 text-sm font-medium">Not available</p>
          <p className="text-slate-500 text-xs mt-1 text-center max-w-xs">{notAvailableReason}</p>
        </div>
      </div>
    );
  }

  const margin = { top: 24, right: 16, bottom: 32, left: 52 };
  const chartH = height - margin.top - margin.bottom;
  const isMultiAssetChart = ['pie', 'treemap', 'sunburst', 'heatmap', 'correlation-matrix'].includes(vizType) && Object.keys(allDataBySymbol).length >= 2;

  const drawChart = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (!data.length) return;
      const chartW = w - margin.left - margin.right;

      const closes = data.map((d) => d.close).filter((v): v is number => v != null);
      if (closes.length === 0) return;

      const returns = computeReturns(data);
      const minY = Math.min(...closes);
      const maxY = Math.max(...closes);
      const pad = (maxY - minY) * 0.05 || 1;
      const yMin = minY - pad;
      const yMax = maxY + pad;

      const scaleY = (v: number) => margin.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH;
      const scaleX = (i: number) => margin.left + (i / Math.max(1, data.length - 1)) * chartW;

      const barW = Math.max(2, Math.min(8, chartW / data.length - 2));

      if (vizType === 'candlestick' || vizType === 'ohlc-bars') {
        data.forEach((d, i) => {
          const o = d.open ?? d.close ?? 0;
          const c = d.close ?? d.open ?? 0;
          const hi = d.high ?? Math.max(o, c);
          const lo = d.low ?? Math.min(o, c);
          const x = scaleX(i) - barW / 2;
          const isUp = c >= o;
          ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444';
          ctx.fillStyle = isUp ? '#22c55e' : '#ef4444';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(scaleX(i), scaleY(hi));
          ctx.lineTo(scaleX(i), scaleY(lo));
          ctx.stroke();
          ctx.fillRect(x, scaleY(Math.max(o, c)), barW, Math.abs(scaleY(o) - scaleY(c)) || 1);
        });
      } else if (vizType === 'area') {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.beginPath();
        data.forEach((d, i) => {
          const v = d.close ?? d.open ?? 0;
          if (i === 0) ctx.moveTo(scaleX(i), scaleY(v));
          else ctx.lineTo(scaleX(i), scaleY(v));
        });
        ctx.lineTo(scaleX(data.length - 1), margin.top + chartH);
        ctx.lineTo(scaleX(0), margin.top + chartH);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((d, i) => {
          const v = d.close ?? d.open ?? 0;
          if (i === 0) ctx.moveTo(scaleX(i), scaleY(v));
          else ctx.lineTo(scaleX(i), scaleY(v));
        });
        ctx.stroke();
      } else if (vizType === 'bar' || vizType === 'grouped-bar') {
        data.forEach((d, i) => {
          const v = d.close ?? d.open ?? 0;
          const x = scaleX(i) - barW / 2;
          ctx.fillStyle = v >= (d.open ?? v) ? '#22c55e' : '#ef4444';
          ctx.fillRect(x, scaleY(v), barW, margin.top + chartH - scaleY(v));
        });
      } else if (vizType === 'histogram' && returns.length > 0) {
        const bins = 12;
        const minR = Math.min(...returns);
        const maxR = Math.max(...returns);
        const step = (maxR - minR) || 0.001;
        const counts = new Array(bins).fill(0);
        returns.forEach((r) => {
          const idx = Math.min(Math.floor(((r - minR) / step) * bins), bins - 1);
          counts[idx]++;
        });
        const maxCnt = Math.max(...counts, 1);
        const bw = chartW / bins;
        counts.forEach((cnt, i) => {
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(margin.left + i * bw, margin.top + chartH - (cnt / maxCnt) * chartH, bw - 2, (cnt / maxCnt) * chartH);
        });
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px system-ui';
        ctx.fillText('Return %', margin.left, margin.top - 4);
      } else if (vizType === 'box-plot' && returns.length > 0) {
        const sorted = [...returns].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const med = sorted[Math.floor(sorted.length * 0.5)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const wiskLo = sorted[0];
        const wiskHi = sorted[sorted.length - 1];
        const rMin = Math.min(...returns);
        const rMax = Math.max(...returns);
        const scaleR = (r: number) => margin.top + chartH - ((r - rMin) / (rMax - rMin || 0.001)) * chartH;
        const cx = margin.left + chartW / 2;
        const boxW = chartW * 0.3;
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - boxW / 2, scaleR(q3), boxW, scaleR(q1) - scaleR(q3));
        ctx.beginPath();
        ctx.moveTo(cx, scaleR(wiskHi));
        ctx.lineTo(cx, scaleR(q3));
        ctx.moveTo(cx - boxW / 2, scaleR(med));
        ctx.lineTo(cx + boxW / 2, scaleR(med));
        ctx.moveTo(cx, scaleR(q1));
        ctx.lineTo(cx, scaleR(wiskLo));
        ctx.stroke();
      } else if ((vizType === 'scatter' || vizType === 'bubble') && returns.length >= 2) {
        const vols = returns.map((_, i) => (i > 0 ? Math.abs(returns[i] - returns[i - 1]) : 0));
        const rMin = Math.min(...returns);
        const rMax = Math.max(...returns);
        const vMax = Math.max(...vols) || 1;
        const scaleR = (r: number) => margin.left + ((r - rMin) / (rMax - rMin || 0.001)) * chartW * 0.8;
        const scaleV = (v: number) => margin.top + chartH - (v / vMax) * chartH * 0.8;
        const maxAbsR = Math.max(...returns.map((r) => Math.abs(r))) || 0.01;
        returns.forEach((r, i) => {
          if (i === 0) return;
          const size = vizType === 'bubble' ? 4 + 12 * (Math.abs(r) / maxAbsR) : 4;
          ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
          ctx.beginPath();
          ctx.arc(scaleR(r), scaleV(vols[i]), size, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#3b82f6';
          ctx.stroke();
        });
      } else if (vizType === 'pie' && Object.keys(allDataBySymbol).length >= 2) {
        const totals = Object.entries(allDataBySymbol).map(([sym, d]) => {
          const last = d.filter((x) => (x.close ?? x.open) != null).pop();
          return { sym, val: last?.close ?? last?.open ?? 0 };
        });
        const sum = totals.reduce((s, t) => s + t.val, 0) || 1;
        const colors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7'];
        let start = -Math.PI / 2;
        totals.forEach((t, i) => {
          const sweep = (t.val / sum) * Math.PI * 2;
          ctx.fillStyle = colors[i % colors.length];
          ctx.beginPath();
          ctx.moveTo(margin.left + chartW / 2, margin.top + chartH / 2);
          ctx.arc(margin.left + chartW / 2, margin.top + chartH / 2, Math.min(chartW, chartH) / 2 - 10, start, start + sweep);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#1e293b';
          ctx.stroke();
          start += sweep;
        });
      } else if (vizType === 'sunburst' && Object.keys(allDataBySymbol).length >= 2) {
        const totals = Object.entries(allDataBySymbol).map(([sym, d]) => {
          const last = d.filter((x) => (x.close ?? x.open) != null).pop();
          return { sym, val: last?.close ?? last?.open ?? 0 };
        });
        const sum = totals.reduce((s, t) => s + t.val, 0) || 1;
        const colors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7'];
        const cx = margin.left + chartW / 2;
        const cy = margin.top + chartH / 2;
        const maxR = Math.min(chartW, chartH) / 2 - 10;
        let start = -Math.PI / 2;
        totals.forEach((t, i) => {
          const sweep = (t.val / sum) * Math.PI * 2;
          ctx.fillStyle = colors[i % colors.length];
          ctx.beginPath();
          ctx.arc(cx, cy, maxR, start, start + sweep);
          ctx.arc(cx, cy, maxR * 0.5, start + sweep, start, true);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#1e293b';
          ctx.stroke();
          start += sweep;
        });
      } else if (vizType === 'treemap' && Object.keys(allDataBySymbol).length >= 2) {
        const totals = Object.entries(allDataBySymbol).map(([sym, d]) => {
          const last = d.filter((x) => (x.close ?? x.open) != null).pop();
          return { sym, val: last?.close ?? last?.open ?? 0 };
        });
        const sum = totals.reduce((s, t) => s + t.val, 0) || 1;
        const colors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444'];
        let x = margin.left;
        totals.forEach((t, i) => {
          const pct = t.val / sum;
          const w = chartW * pct - 2;
          ctx.fillStyle = colors[i % colors.length];
          ctx.fillRect(x, margin.top, w, chartH);
          ctx.fillStyle = '#fff';
          ctx.font = '10px system-ui';
          ctx.fillText(t.sym, x + 4, margin.top + chartH / 2 - 4);
          ctx.fillText(`${(pct * 100).toFixed(1)}%`, x + 4, margin.top + chartH / 2 + 8);
          x += w + 2;
        });
      } else if ((vizType === 'heatmap' || vizType === 'correlation-matrix') && Object.keys(allDataBySymbol).length >= 2) {
        const symbols = Object.keys(allDataBySymbol);
        const returnsBySym = symbols.map((s) => computeReturns(allDataBySymbol[s] ?? []));
        const n = symbols.length;
        const cellSize = Math.min((chartW - 20) / n, (chartH - 20) / n);
        const pad = 10;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            const r1 = returnsBySym[i];
            const r2 = returnsBySym[j];
            let corr = 1;
            if (i !== j && r1.length && r2.length) {
              const len = Math.min(r1.length, r2.length);
              const m1 = r1.slice(-len).reduce((a, b) => a + b, 0) / len;
              const m2 = r2.slice(-len).reduce((a, b) => a + b, 0) / len;
              let num = 0, d1 = 0, d2 = 0;
              for (let k = 0; k < len; k++) {
                num += (r1[r1.length - len + k] - m1) * (r2[r2.length - len + k] - m2);
                d1 += (r1[r1.length - len + k] - m1) ** 2;
                d2 += (r2[r2.length - len + k] - m2) ** 2;
              }
              corr = d1 * d2 ? num / Math.sqrt(d1 * d2) : 1;
            }
            const hue = corr >= 0 ? 120 : 0;
            const sat = Math.abs(corr) * 70;
            ctx.fillStyle = `hsl(${hue}, ${sat}%, 40%)`;
            ctx.fillRect(margin.left + pad + i * cellSize, margin.top + pad + j * cellSize, cellSize - 2, cellSize - 2);
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '8px system-ui';
            ctx.fillText(corr.toFixed(2), margin.left + pad + i * cellSize + 4, margin.top + pad + j * cellSize + cellSize / 2);
          }
        }
      } else {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((d, i) => {
          const v = d.close ?? d.open ?? 0;
          if (i === 0) ctx.moveTo(scaleX(i), scaleY(v));
          else ctx.lineTo(scaleX(i), scaleY(v));
        });
        ctx.stroke();
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      if (vizType !== 'pie' && vizType !== 'treemap' && vizType !== 'histogram' && vizType !== 'heatmap' && vizType !== 'correlation-matrix' && vizType !== 'scatter' && vizType !== 'box-plot') {
        ctx.fillText(minY.toFixed(2), margin.left - 6, margin.top);
        ctx.fillText(maxY.toFixed(2), margin.left - 6, margin.top + chartH);
      }
      ctx.textAlign = 'left';
      ctx.fillText(data[0]?.date ?? '', margin.left, h - 6);
      ctx.fillText(data[data.length - 1]?.date ?? '', margin.left + chartW - 40, h - 6);
    },
    [data, vizType, allDataBySymbol, height]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    drawChart(ctx, w, h);
  }, [data, vizType, height, drawChart, allDataBySymbol]);

  const getPointAt = (clientX: number): { i: number; point: OHLCPoint } | null => {
    if (!containerRef.current || !data.length) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const w = rect.width - margin.left - margin.right;
    const i = Math.round(((x - margin.left) / w) * (data.length - 1));
    const idx = Math.max(0, Math.min(i, data.length - 1));
    return { i: idx, point: data[idx] };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (['pie', 'treemap', 'sunburst', 'heatmap', 'correlation-matrix'].includes(vizType) && Object.keys(allDataBySymbol).length >= 2) {
      const totals = Object.entries(allDataBySymbol).map(([sym, d]) => {
        const last = d.filter((x) => (x.close ?? x.open) != null).pop();
        return { sym, val: last?.close ?? last?.open ?? 0 };
      });
      const sum = totals.reduce((s, t) => s + t.val, 0) || 1;
      const lines = totals.map((t) => `${t.sym}: ${((t.val / sum) * 100).toFixed(1)}%`).join('\n');
      setTooltip({ x: e.clientX, y: e.clientY, text: `Allocation\n${lines}` });
      return;
    }
    if (['scatter', 'bubble'].includes(vizType) && data.length >= 2) {
      const returns = computeReturns(data);
      const vols = returns.map((_, i) => (i > 0 ? Math.abs(returns[i] - returns[i - 1]) : 0));
      if (!containerRef.current || returns.length < 2) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left - margin.left;
      const my = e.clientY - rect.top - margin.top;
      const rMin = Math.min(...returns), rMax = Math.max(...returns);
      const vMax = Math.max(...vols) || 1;
      const chartW = rect.width - margin.left - margin.right;
      let best = -1; let bestD = 1e9;
      returns.forEach((r, i) => {
        if (i === 0) return;
        const px = ((r - rMin) / (rMax - rMin || 0.001)) * chartW * 0.8;
        const py = chartH - (vols[i] / vMax) * chartH * 0.8;
        const d = (mx - px) ** 2 + (my - py) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best >= 1) {
        const d = data[best];
        setTooltip({ x: e.clientX, y: e.clientY, text: `${d.date}\nReturn: ${(returns[best - 1] * 100).toFixed(2)}%` });
      } else setTooltip(null);
      return;
    }
    if (['histogram', 'box-plot'].includes(vizType)) {
      const returns = computeReturns(data);
      if (returns.length === 0) return;
      const sorted = [...returns].sort((a, b) => a - b);
      const stats = `Min: ${(sorted[0] * 100).toFixed(2)}%\nMax: ${(sorted[sorted.length - 1] * 100).toFixed(2)}%\nMean: ${(returns.reduce((a, b) => a + b, 0) / returns.length * 100).toFixed(2)}%`;
      setTooltip({ x: e.clientX, y: e.clientY, text: `Return distribution\n${stats}` });
      return;
    }
    const hit = getPointAt(e.clientX);
    if (!hit) { setTooltip(null); return; }
    const { point } = hit;
    const c = point.close ?? point.open ?? 0;
    const o = point.open ?? point.close ?? 0;
    const chg = o ? (((c - o) / o) * 100).toFixed(2) : '—';
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      text: `${point.date}\nO: ${(o).toFixed(2)}  H: ${(point.high ?? c).toFixed(2)}  L: ${(point.low ?? c).toFixed(2)}  C: ${(c).toFixed(2)}\nChange: ${chg}%`,
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  if (!data.length) return null;

  const isMultiAsset = isMultiAssetChart;

  return (
    <div
      ref={containerRef}
      className="rounded-xl bg-slate-800/60 border border-slate-700 overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-sm font-medium text-white">
          {isMultiAsset ? Object.keys(allDataBySymbol).join(', ') : symbol}
        </span>
        <span className="text-xs text-slate-500">{vizType} · {period}</span>
      </div>
      <div className="w-full relative" style={{ height: `${height}px` }}>
        <canvas ref={canvasRef} className="w-full h-full block" />
        {tooltip && (
          <div
            className="fixed z-[100] px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-xs text-white shadow-xl pointer-events-none whitespace-pre-line font-mono"
            style={{ left: Math.min(tooltip.x + 12, window.innerWidth - 220), top: Math.min(tooltip.y + 12, window.innerHeight - 120) }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
};
