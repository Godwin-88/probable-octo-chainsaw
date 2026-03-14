/**
 * Chart Area (Overview) — Menu 8 Blotter first sub-menu.
 *
 * Trading-style layout:
 * - Main OHLC / candlestick chart with:
 *   - Crosshair cursor (vertical + horizontal lines) snapping to bars
 *   - Axis readouts on price (Y) and time (X) that follow the crosshair
 *   - Hover → OHLC tooltip; click → pin OHLC panel
 *   - Zoom (wheel) + pan (drag)
 * - Right-hand volume profile:
 *   - Horizontal bars per price bin, anchored on right axis and stretching left
 *   - Shares the same price axis as the main chart
 * - Bubble overlay on the main chart:
 *   - Circles sized by volume and coloured by direction
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AssetSearchBar } from '@/components/AssetSearchBar';
import { useDataProvider } from '@/context/DataProviderContext';
import { getAssetHistory } from '@/utils/api';

type ChartType = 'candlestick' | 'bar' | 'line' | 'heikin-ashi' | 'area';

interface BarPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartLayout {
  margin: { top: number; right: number; bottom: number; left: number };
  chartW: number;
  chartH: number;
  viewStart: number;
  visibleCount: number;
  scaleX: (i: number) => number;
  scaleY: (v: number) => number;
  yMin: number;
  yMax: number;
  barW: number;
  data: BarPoint[];
}

// Periods supported by /assets/history (same as Scenarios/Risk)
const PERIODS = [
  { id: '1d', label: '1D' },
  { id: '5d', label: '5D' },
  { id: '1mo', label: '1M' },
  { id: '3mo', label: '3M' },
  { id: '6mo', label: '6M' },
  { id: '1y', label: '1Y' },
  { id: '2y', label: '2Y' },
  { id: '5y', label: '5Y' },
  { id: 'ytd', label: 'YTD' },
] as const;

const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: 'candlestick', label: 'Candlestick' },
  { id: 'bar', label: 'Bar (OHLC)' },
  { id: 'line', label: 'Line' },
  { id: 'heikin-ashi', label: 'Heikin-Ashi' },
  { id: 'area', label: 'Area' },
];

function historyToBars(hist: { date: string; open: number | null; high: number | null; low: number | null; close: number | null; volume: number | null }[]): BarPoint[] {
  return hist
    .filter((r) => r.close != null || r.open != null)
    .map((r) => ({
      time: new Date(r.date).getTime() / 1000,
      open: Number(r.open ?? r.close ?? 0),
      high: Number(r.high ?? r.close ?? 0),
      low: Number(r.low ?? r.close ?? 0),
      close: Number(r.close ?? r.open ?? 0),
      volume: Number(r.volume ?? 0),
    }));
}

function heikinAshi(bars: BarPoint[]): BarPoint[] {
  const out: BarPoint[] = [];
  let haPrev = { open: 0, close: 0 };
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const haClose = (b.open + b.high + b.low + b.close) / 4;
    const haOpen = i === 0 ? b.open : (haPrev.open + haPrev.close) / 2;
    const haHigh = Math.max(b.high, haOpen, haClose);
    const haLow = Math.min(b.low, haOpen, haClose);
    out.push({ ...b, open: haOpen, high: haHigh, low: haLow, close: haClose });
    haPrev = { open: haOpen, close: haClose };
  }
  return out;
}

function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) out.push(null);
    else out.push(values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period);
  }
  return out;
}

function ema(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let prev = values[0];
  for (let i = 0; i < values.length; i++) {
    if (i === 0) out.push(values[0]);
    else {
      prev = values[i] * k + prev * (1 - k);
      out.push(prev);
    }
  }
  return out;
}

function rsi(closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      out.push(null);
      continue;
    }
    let gains = 0;
    let losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const ch = closes[j]! - closes[j - 1]!;
      if (ch > 0) gains += ch;
      else losses -= ch;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) out.push(100);
    else out.push(100 - 100 / (1 + avgGain / avgLoss));
  }
  return out;
}

function macd(closes: number[], fast = 12, slow = 26, signal = 9): { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] } {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine: (number | null)[] = closes.map((_, i) => {
    const f = emaFast[i];
    const s = emaSlow[i];
    if (f == null || s == null) return null;
    return f - s;
  });
  const vals: number[] = [];
  const indices: number[] = [];
  macdLine.forEach((m, i) => {
    if (m != null) { vals.push(m); indices.push(i); }
  });
  const emaSignal = ema(vals.length ? vals : [0], signal);
  const signalMapped: (number | null)[] = macdLine.map((_, i) => {
    const idx = indices.indexOf(i);
    return idx >= 0 ? emaSignal[idx] : null;
  });
  const hist: (number | null)[] = macdLine.map((m, i) => {
    const s = signalMapped[i];
    if (m == null || s == null) return null;
    return m - s;
  });
  return { macd: macdLine, signal: signalMapped, hist };
}

function vwap(bars: BarPoint[]): number[] {
  let cumTpV = 0;
  let cumV = 0;
  return bars.map((b) => {
    const tp = (b.high + b.low + b.close) / 3;
    cumTpV += tp * b.volume;
    cumV += b.volume;
    return cumV > 0 ? cumTpV / cumV : b.close;
  });
}

/** Per-bar delta proxy (no tick data): volume-weighted by close vs open. */
function barDeltas(bars: BarPoint[]): number[] {
  return bars.map((b) => {
    const range = Math.max(b.high - b.low, 1e-10);
    const frac = (b.close - b.open) / range;
    return b.volume * frac;
  });
}

function cvd(bars: BarPoint[]): number[] {
  const deltas = barDeltas(bars);
  const out: number[] = [];
  let cum = 0;
  for (const d of deltas) {
    cum += d;
    out.push(cum);
  }
  return out;
}

/** Price-binned volume for profile; returns { bins: price mid[], volumes: number[] } */
function volumeProfileBins(bars: BarPoint[], bins: number, yMin: number, yMax: number): { prices: number[]; volumes: number[] } {
  const prices = new Array(bins).fill(0).map((_, i) => yMin + (yMax - yMin) * (i + 0.5) / bins);
  const volumes = new Array(bins).fill(0);
  const range = Math.max(yMax - yMin, 1e-10);
  bars.forEach((b) => {
    const t = (b.close - yMin) / range;
    const idx = Math.min(bins - 1, Math.max(0, Math.floor(t * bins)));
    volumes[idx] += b.volume;
  });
  return { prices, volumes };
}

/** Delta profile: same bins but sum delta per bar. */
function deltaProfileBins(bars: BarPoint[], bins: number, yMin: number, yMax: number): { prices: number[]; deltas: number[] } {
  const prices = new Array(bins).fill(0).map((_, i) => yMin + (yMax - yMin) * (i + 0.5) / bins);
  const deltas = new Array(bins).fill(0);
  const range = Math.max(yMax - yMin, 1e-10);
  const d = barDeltas(bars);
  bars.forEach((b, i) => {
    const t = (b.close - yMin) / range;
    const idx = Math.min(bins - 1, Math.max(0, Math.floor(t * bins)));
    deltas[idx] += d[i];
  });
  return { prices, deltas };
}

/** POC = price at max volume; VAH/VAL = value area (70%) high/low. */
function profileValues(volumes: number[], prices: number[]): { poc: number; vah: number; val: number } | null {
  const total = volumes.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  const idxByVol = volumes.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const pocIdx = idxByVol[0]?.i ?? 0;
  let cum = 0;
  const target = total * 0.7;
  let vaMin = prices[pocIdx];
  let vaMax = prices[pocIdx];
  for (let k = 0; k < idxByVol.length; k++) {
    const idx = idxByVol[k]!.i;
    cum += volumes[idx];
    vaMin = Math.min(vaMin, prices[idx]);
    vaMax = Math.max(vaMax, prices[idx]);
    if (cum >= target) break;
  }
  return { poc: prices[pocIdx], vah: vaMax, val: vaMin };
}

const CHART_H = 380;
const VOLUME_PROFILE_WIDTH = 88;
const VOLUME_PROFILE_BINS = 40;
const INDICATOR_ROW_H = 72;

interface BlotterChartOverviewProps {
  onSymbolChange?: (symbol: string) => void;
}

export function BlotterChartOverview({ onSymbolChange }: BlotterChartOverviewProps = {}) {
  const { dataProvider } = useDataProvider();
  const [chartSymbols, setChartSymbols] = useState<string[]>([]);
  const [period, setPeriod] = useState<string>('1y');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [bars, setBars] = useState<BarPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showVolProfile, setShowVolProfile] = useState(true);
  const [showBidAsk, setShowBidAsk] = useState(false);
  const [showDailyVolProfile, setShowDailyVolProfile] = useState(false);
  const [showDailyDeltaProfile, setShowDailyDeltaProfile] = useState(false);
  const [showDailyProfileValues, setShowDailyProfileValues] = useState(false);
  const [showWeeklyVolProfile, setShowWeeklyVolProfile] = useState(false);
  const [showWeeklyDeltaProfile, setShowWeeklyDeltaProfile] = useState(false);
  const [showWeeklyProfileValues, setShowWeeklyProfileValues] = useState(false);
  const [showVWAP, setShowVWAP] = useState(false);
  const [showCVD, setShowCVD] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewStart, setViewStart] = useState(0);
  const [hoveredBar, setHoveredBar] = useState<BarPoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedBar, setSelectedBar] = useState<BarPoint | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, viewStart: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const volumeCanvasRef = useRef<HTMLCanvasElement>(null);
  const indicatorCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartLayoutRef = useRef<ChartLayout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const symbol = chartSymbols[0] ?? '';

  // Notify parent when chart symbol changes (for agent context)
  useEffect(() => {
    if (symbol) onSymbolChange?.(symbol);
  }, [symbol, onSymbolChange]);

  const loadBars = useCallback(async () => {
    if (!symbol) {
      setBars([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const hist = await getAssetHistory(symbol, period, dataProvider);
      setBars(historyToBars(hist));
    } catch (e) {
      setBars([]);
      setError(e instanceof Error ? e.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [symbol, period, dataProvider]);

  useEffect(() => {
    if (symbol) loadBars();
    else setBars([]);
  }, [symbol, period, loadBars]);

  const data = chartType === 'heikin-ashi' ? heikinAshi(bars) : bars;
  const closes = data.map((b) => b.close);
  const sma20 = sma(closes, 20);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const rsi14 = rsi(closes, 14);
  const { macd: macdLine, signal: macdSignal, hist: macdHist } = macd(closes);
  const vwapSeries = vwap(data);
  const cvdSeries = cvd(data);
  const dailyBars = (() => {
    const byDay = new Map<number, BarPoint[]>();
    data.forEach((b) => {
      const day = Math.floor(b.time / 86400) * 86400;
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(b);
    });
    return Array.from(byDay.values()).flatMap((dayBars) => {
      if (dayBars.length === 0) return [];
      const o = dayBars[0]!.open;
      const c = dayBars[dayBars.length - 1]!.close;
      const hi = Math.max(...dayBars.map((x) => x.high));
      const lo = Math.min(...dayBars.map((x) => x.low));
      const vol = dayBars.reduce((a, x) => a + x.volume, 0);
      return [{ time: dayBars[0]!.time, open: o, high: hi, low: lo, close: c, volume: vol }];
    });
  })();
  const weeklyBars = (() => {
    const byWeek = new Map<number, BarPoint[]>();
    data.forEach((b) => {
      const week = Math.floor(b.time / (86400 * 7)) * 86400 * 7;
      if (!byWeek.has(week)) byWeek.set(week, []);
      byWeek.get(week)!.push(b);
    });
    return Array.from(byWeek.values()).flatMap((weekBars) => {
      if (weekBars.length === 0) return [];
      const o = weekBars[0]!.open;
      const c = weekBars[weekBars.length - 1]!.close;
      const hi = Math.max(...weekBars.map((x) => x.high));
      const lo = Math.min(...weekBars.map((x) => x.low));
      const vol = weekBars.reduce((a, x) => a + x.volume, 0);
      return [{ time: weekBars[0]!.time, open: o, high: hi, low: lo, close: c, volume: vol }];
    });
  })();
  const dailyYMin = dailyBars.length ? Math.min(...dailyBars.map((d) => d.low)) : (data.length ? Math.min(...data.map((d) => d.low)) : 0);
  const dailyYMax = dailyBars.length ? Math.max(...dailyBars.map((d) => d.high)) : (data.length ? Math.max(...data.map((d) => d.high)) : 1);
  const weeklyYMin = weeklyBars.length ? Math.min(...weeklyBars.map((d) => d.low)) : (data.length ? Math.min(...data.map((d) => d.low)) : 0);
  const weeklyYMax = weeklyBars.length ? Math.max(...weeklyBars.map((d) => d.high)) : (data.length ? Math.max(...data.map((d) => d.high)) : 1);
  const dailyVolProfile = volumeProfileBins(dailyBars, VOLUME_PROFILE_BINS, dailyYMin, dailyYMax);
  const dailyDeltaProfile = deltaProfileBins(dailyBars, VOLUME_PROFILE_BINS, dailyYMin, dailyYMax);
  const dailyProfileVals = profileValues(dailyVolProfile.volumes, dailyVolProfile.prices);
  const weeklyVolProfile = volumeProfileBins(weeklyBars, VOLUME_PROFILE_BINS, weeklyYMin, weeklyYMax);
  const weeklyDeltaProfile = deltaProfileBins(weeklyBars, VOLUME_PROFILE_BINS, weeklyYMin, weeklyYMax);
  const weeklyProfileVals = profileValues(weeklyVolProfile.volumes, weeklyVolProfile.prices);

  const visibleCount = Math.max(20, Math.min(data.length, Math.floor(data.length / Math.max(0.1, zoomLevel))));
  const clampedViewStart = Math.max(0, Math.min(viewStart, Math.max(0, data.length - visibleCount)));
  const visibleData = data.slice(clampedViewStart, clampedViewStart + visibleCount);
  const yMinVis = visibleData.length ? Math.min(...visibleData.map((d) => d.low)) : 0;
  const yMaxVis = visibleData.length ? Math.max(...visibleData.map((d) => d.high)) : 1;
  const sessionProfile = volumeProfileBins(visibleData, VOLUME_PROFILE_BINS, yMinVis, yMaxVis);
  const sessionDeltaProfile = deltaProfileBins(visibleData, VOLUME_PROFILE_BINS, yMinVis, yMaxVis);
  const sessionProfileVals = profileValues(sessionProfile.volumes, sessionProfile.prices);

  useEffect(() => {
    setViewStart((s) => {
      const maxStart = Math.max(0, data.length - visibleCount);
      if (s > maxStart) return maxStart;
      return s;
    });
  }, [data.length, visibleCount]);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const containerWidth = (canvas.parentElement as HTMLElement)?.offsetWidth ?? canvas.offsetWidth ?? 500;
    const w = Math.max(120, containerWidth - (showVolProfile ? VOLUME_PROFILE_WIDTH : 0));
    const h = CHART_H;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const margin = { top: 24, right: 16, bottom: 40, left: 56 };
    const chartW = w - margin.left - margin.right;
    const chartH = h - margin.top - margin.bottom;
    const yMin = Math.min(...visibleData.map((d) => d.low));
    const yMax = Math.max(...visibleData.map((d) => d.high));
    const pad = (yMax - yMin) * 0.05 || 1;
    const scaleY = (v: number) => margin.top + chartH - ((v - (yMin - pad)) / (yMax - yMin + 2 * pad)) * chartH;
    const scaleX = (i: number) => margin.left + (i / Math.max(1, visibleCount - 1)) * chartW;
    const barW = Math.max(2, Math.min(12, chartW / visibleCount - 1));
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const nYTicks = 6;
    const nXTicks = 6;
    for (let k = 0; k <= nYTicks; k++) {
      const v = yMin - pad + (k / nYTicks) * (yMax - yMin + 2 * pad);
      const y = scaleY(v);
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(w - margin.right, y);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(2), margin.left - 6, y + 4);
    }
    for (let k = 0; k <= nXTicks; k++) {
      const i = Math.floor((k / nXTicks) * (visibleCount - 1));
      const x = scaleX(i);
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, h - margin.bottom);
      ctx.stroke();
      if (visibleData[i]) {
        const date = new Date(visibleData[i].time * 1000);
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), x, h - margin.bottom + 14);
      }
    }
    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Price', margin.left - 34, h / 2);
    ctx.fillText('Date', margin.left + chartW / 2, h - 4);

    const maxVolVisible = Math.max(...visibleData.map((d) => d.volume), 1);
    const baseY = h - margin.bottom;

    if (chartType === 'line') {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      visibleData.forEach((d, i) => {
        const x = scaleX(i);
        const y = scaleY(d.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    } else if (chartType === 'area') {
      ctx.beginPath();
      ctx.moveTo(scaleX(0), baseY);
      visibleData.forEach((d, i) => {
        ctx.lineTo(scaleX(i), scaleY(d.close));
      });
      ctx.lineTo(scaleX(visibleData.length - 1), baseY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      visibleData.forEach((d, i) => {
        if (i === 0) ctx.moveTo(scaleX(i), scaleY(d.close));
        else ctx.lineTo(scaleX(i), scaleY(d.close));
      });
      ctx.stroke();
    } else if (chartType === 'bar') {
      visibleData.forEach((d, i) => {
        const o = d.open;
        const c = d.close;
        const hi = d.high;
        const lo = d.low;
        const isUp = c >= o;
        ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 1.5;
        const cx = scaleX(i);
        const tickLen = Math.max(2, barW * 0.4);
        ctx.beginPath();
        ctx.moveTo(cx, scaleY(hi));
        ctx.lineTo(cx, scaleY(lo));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - tickLen, scaleY(o));
        ctx.lineTo(cx, scaleY(o));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, scaleY(c));
        ctx.lineTo(cx + tickLen, scaleY(c));
        ctx.stroke();
      });
    } else {
      // candlestick | heikin-ashi
      visibleData.forEach((d, i) => {
        const o = d.open;
        const c = d.close;
        const hi = d.high;
        const lo = d.low;
        const x = scaleX(i) - barW / 2;
        const isUp = c >= o;
        ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444';
        ctx.fillStyle = isUp ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.moveTo(scaleX(i), scaleY(hi));
        ctx.lineTo(scaleX(i), scaleY(lo));
        ctx.stroke();
        ctx.fillRect(x, scaleY(Math.max(o, c)), barW, Math.abs(scaleY(o) - scaleY(c)) || 1);

        const volFrac = d.volume / maxVolVisible;
        const r = 2 + 7 * Math.sqrt(Math.max(0, Math.min(1, volFrac)));
        ctx.beginPath();
        ctx.arc(scaleX(i), scaleY(c), r, 0, 2 * Math.PI);
        ctx.fillStyle = isUp ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)';
        ctx.fill();
      });
    }

    // Order Flow Bid/Ask: per-bar buy vs sell volume proxy (no tick data)
    if (showBidAsk && visibleData.length) {
      const deltas = barDeltas(visibleData);
      const maxAbsDelta = Math.max(...deltas.map(Math.abs), 1);
      const barH = 12;
      const y0 = h - margin.bottom - barH - 4;
      visibleData.forEach((d, i) => {
        const delta = deltas[i] ?? 0;
        const buyFrac = 0.5 + 0.5 * Math.max(-1, Math.min(1, delta / maxAbsDelta));
        const buyW = Math.max(1, (scaleX(i + 0.5) - scaleX(i - 0.5)) * 0.7);
        const x = scaleX(i) - buyW / 2;
        if (buyFrac > 0.02) {
          ctx.fillStyle = 'rgba(34,197,94,0.8)';
          ctx.fillRect(x, y0 + barH * (1 - buyFrac), buyW, barH * buyFrac);
        }
        if (buyFrac < 0.98) {
          ctx.fillStyle = 'rgba(239,68,68,0.8)';
          ctx.fillRect(x, y0, buyW, barH * (1 - buyFrac));
        }
      });
    }
    if (showSMA && sma20.length) {
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.beginPath();
      visibleData.forEach((d, i) => {
        const idx = clampedViewStart + i;
        const v = sma20[idx];
        if (v == null) return;
        if (i === 0) ctx.moveTo(scaleX(i), scaleY(v));
        else ctx.lineTo(scaleX(i), scaleY(v));
      });
      ctx.stroke();
    }
    if (showEMA && ema12.length) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      visibleData.forEach((d, i) => {
        const idx = clampedViewStart + i;
        const v = ema12[idx];
        if (v == null) return;
        if (i === 0) ctx.moveTo(scaleX(i), scaleY(v));
        else ctx.lineTo(scaleX(i), scaleY(v));
      });
      ctx.stroke();
    }
    if (showBollinger && closes.length >= 20) {
      const periodN = 20;
      const mult = 2;
      const bands = closes.map((_, i) => {
        if (i < periodN - 1) return null;
        const slice = closes.slice(i - periodN + 1, i + 1);
        const avg = slice.reduce((a, b) => a + b, 0) / periodN;
        const std = Math.sqrt(slice.reduce((s, v) => s + (v - avg) ** 2, 0) / periodN) || 0;
        return { mid: avg, upper: avg + mult * std, lower: avg - mult * std };
      });
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      visibleData.forEach((_, i) => {
        const idx = clampedViewStart + i;
        const b = bands[idx];
        if (b == null) return;
        if (i === 0) ctx.moveTo(scaleX(i), scaleY(b.mid));
        else ctx.lineTo(scaleX(i), scaleY(b.mid));
      });
      ctx.stroke();
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      visibleData.forEach((_, i) => {
        const idx = clampedViewStart + i;
        const b = bands[idx];
        if (b == null) return;
        if (i === 0) ctx.moveTo(scaleX(i), scaleY(b.upper));
        else ctx.lineTo(scaleX(i), scaleY(b.upper));
      });
      ctx.stroke();
      ctx.beginPath();
      visibleData.forEach((_, i) => {
        const idx = clampedViewStart + i;
        const b = bands[idx];
        if (b == null) return;
        if (i === 0) ctx.moveTo(scaleX(i), scaleY(b.lower));
        else ctx.lineTo(scaleX(i), scaleY(b.lower));
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (showVWAP && vwapSeries.length) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)';
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      visibleData.forEach((d, i) => {
        const idx = clampedViewStart + i;
        const v = vwapSeries[idx];
        if (v == null) return;
        if (i === 0) ctx.moveTo(scaleX(i), scaleY(v));
        else ctx.lineTo(scaleX(i), scaleY(v));
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Crosshair (vertical + horizontal) + axis readouts
    if (hoveredBar && hoveredIndex !== null) {
      const localIndex = hoveredIndex - clampedViewStart;
      if (localIndex >= 0 && localIndex < visibleCount) {
        const x = scaleX(localIndex);
        const y = scaleY(hoveredBar.close);

        ctx.strokeStyle = 'rgba(148,163,184,0.8)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        // Vertical
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, h - margin.bottom);
        ctx.stroke();
        // Horizontal
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(w - margin.right, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Price label on Y axis
        const priceLabel = hoveredBar.close.toFixed(2);
        const labelW = 52;
        const labelH = 18;
        const labelX = margin.left - labelW - 4;
        const labelY = Math.min(h - margin.bottom - labelH, Math.max(margin.top, y - labelH / 2));
        ctx.fillStyle = '#020617';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(labelX, labelY, labelW, labelH, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(priceLabel, labelX + labelW / 2, labelY + labelH / 2);

        // Time label on X axis
        const date = new Date(hoveredBar.time * 1000);
        const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
        const tW = Math.max(64, ctx.measureText(dateLabel).width + 12);
        const tH = 18;
        const tX = Math.min(w - margin.right - tW / 2, Math.max(margin.left + tW / 2, x));
        const tY = h - margin.bottom + 6;
        ctx.fillStyle = '#020617';
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(tX - tW / 2, tY, tW, tH, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dateLabel, tX, tY + tH / 2);
      }
    }

    chartLayoutRef.current = {
      margin,
      chartW,
      chartH,
      viewStart: clampedViewStart,
      visibleCount,
      scaleX,
      scaleY,
      yMin: yMin - pad,
      yMax: yMax + pad,
      barW,
      data,
    };
  }, [chartType, data, visibleData, visibleCount, clampedViewStart, showSMA, showEMA, showBollinger, showVWAP, showVolProfile, showBidAsk, sma20, ema12, closes, vwapSeries]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  useEffect(() => {
    const volCanvas = volumeCanvasRef.current;
    const layout = chartLayoutRef.current;
    if (!volCanvas || !layout) return;
    const useDelta = showWeeklyDeltaProfile || showDailyDeltaProfile;
    const useWeekly = showWeeklyVolProfile || showWeeklyDeltaProfile;
    const useDaily = showDailyVolProfile || showDailyDeltaProfile;
    const { prices, volumes: volData, deltas: deltaData } = (() => {
      if (useWeekly) return useDelta
        ? { prices: weeklyVolProfile.prices, volumes: weeklyVolProfile.volumes, deltas: weeklyDeltaProfile.deltas }
        : { prices: weeklyVolProfile.prices, volumes: weeklyVolProfile.volumes, deltas: [] as number[] };
      if (useDaily) return useDelta
        ? { prices: dailyVolProfile.prices, volumes: dailyVolProfile.volumes, deltas: dailyDeltaProfile.deltas }
        : { prices: dailyVolProfile.prices, volumes: dailyVolProfile.volumes, deltas: [] as number[] };
      return { prices: sessionProfile.prices, volumes: sessionProfile.volumes, deltas: sessionDeltaProfile.deltas };
    })();
    const values = useDelta ? deltaData : volData;
    const maxVal = Math.max(...values, 1);
    const absMax = Math.max(...values.map(Math.abs), 1);

    const ctx = volCanvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = VOLUME_PROFILE_WIDTH;
    const h = CHART_H;
    volCanvas.width = w * dpr;
    volCanvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const margin = { top: layout.margin.top, right: 12, bottom: layout.margin.bottom, left: 8 };
    const stripW = w - margin.left - margin.right;
    const stripH = h - margin.top - margin.bottom;
    const bins = VOLUME_PROFILE_BINS;
    const bandH = stripH / bins;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    values.forEach((val, i) => {
      if (val === 0 && !useDelta) return;
      const frac = useDelta ? Math.abs(val) / absMax : val / maxVal;
      const barLen = Math.max(2, frac * stripW);
      const y = margin.top + i * bandH;
      const xRight = w - margin.right;
      const xLeft = xRight - barLen;
      ctx.fillStyle = useDelta ? (val >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)') : 'rgba(56,189,248,0.7)';
      ctx.fillRect(xLeft, y, barLen, bandH - 1);
    });

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'right';
    const nTicks = 4;
    for (let k = 0; k <= nTicks; k++) {
      const v = (k / nTicks) * (useDelta ? absMax : maxVal);
      const y = margin.top + stripH - (k / nTicks) * stripH;
      const label = useDelta ? (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toFixed(0)) : (maxVal >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : maxVal >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : maxVal >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toFixed(0));
      ctx.fillText(label, w - 2, y + 3);
    }

    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(w / 2, margin.top - 8);
    ctx.fillText(useDelta ? 'Delta Profile' : 'Volume Profile', 0, 0);
    ctx.restore();
  }, [visibleData, showVolProfile, showDailyVolProfile, showWeeklyVolProfile, showDailyDeltaProfile, showWeeklyDeltaProfile, sessionProfile, sessionDeltaProfile, dailyVolProfile, dailyDeltaProfile, weeklyVolProfile, weeklyDeltaProfile]);

  const indicatorRows = [showRSI, showMACD, showCVD].filter(Boolean).length;
  const indicatorHeight = indicatorRows * INDICATOR_ROW_H;

  useEffect(() => {
    if (!(showRSI || showMACD || showCVD) || !indicatorCanvasRef.current || !visibleData.length) return;
    const canvas = indicatorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const layout = chartLayoutRef.current;
    if (!layout) return;
    const dpr = window.devicePixelRatio || 1;
    const parentW = (canvas.parentElement as HTMLElement)?.offsetWidth ?? 400;
    const w = Math.max(120, parentW);
    const h = indicatorHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const margin = { top: 10, right: 12, bottom: 20, left: 44 };
    const chartW = w - margin.left - margin.right;
    const scaleX = (i: number) => margin.left + (i / Math.max(1, visibleCount - 1)) * chartW;
    let rowTop = 0;

    if (showRSI && rsi14.length) {
      const rowH = INDICATOR_ROW_H;
      const chartH = rowH - margin.top - margin.bottom;
      const rng = [0, 100];
      const scaleY = (v: number) => rowTop + margin.top + chartH - ((v - rng[0]) / (rng[1] - rng[0])) * chartH;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, rowTop, w, rowH);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(margin.left, rowTop + margin.top, chartW, chartH);
      ctx.fillStyle = 'rgba(248,113,113,0.2)';
      ctx.fillRect(margin.left, rowTop + margin.top, chartW, (30 / 100) * chartH);
      ctx.fillStyle = 'rgba(34,197,94,0.2)';
      ctx.fillRect(margin.left, rowTop + margin.top + (70 / 100) * chartH, chartW, (30 / 100) * chartH);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      visibleData.forEach((_, i) => {
        const idx = clampedViewStart + i;
        const v = rsi14[idx];
        if (v == null) return;
        if (i === 0) ctx.moveTo(scaleX(i), scaleY(v));
        else ctx.lineTo(scaleX(i), scaleY(v));
      });
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText('100', margin.left - 4, rowTop + margin.top + 4);
      ctx.fillText('30', margin.left - 4, rowTop + margin.top + chartH - 30);
      ctx.fillText('70', margin.left - 4, rowTop + margin.top + chartH - 70);
      ctx.fillText('RSI(14)', margin.left - 4, rowTop + margin.top + chartH / 2);
      rowTop += rowH;
    }

    if (showMACD && macdLine.length) {
      const rowH = INDICATOR_ROW_H;
      const chartH = rowH - margin.top - margin.bottom;
      const visibleMacd = visibleData.map((_, i) => macdLine[clampedViewStart + i]).filter((v): v is number => v != null);
      const visibleSig = visibleData.map((_, i) => macdSignal[clampedViewStart + i]).filter((v): v is number => v != null);
      const visibleHist = visibleData.map((_, i) => macdHist[clampedViewStart + i]).filter((v): v is number => v != null);
      const allVals = [...visibleMacd, ...visibleSig, ...visibleHist];
      const mn = Math.min(...allVals, 0);
      const mx = Math.max(...allVals, 0);
      const rng = mx - mn || 1;
      const scaleY = (v: number) => rowTop + margin.top + chartH - ((v - mn) / rng) * chartH;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, rowTop, w, rowH);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(margin.left, rowTop + margin.top, chartW, chartH);
      const zeroY = scaleY(0);
      ctx.strokeStyle = '#64748b';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(margin.left, zeroY);
      ctx.lineTo(w - margin.right, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
      visibleData.forEach((_, i) => {
        const idx = clampedViewStart + i;
        const histVal = macdHist[idx];
        if (histVal == null) return;
        const x = scaleX(i) - 2;
        const y = scaleY(histVal);
        ctx.fillStyle = histVal >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)';
        ctx.fillRect(x, y, 4, zeroY - y);
      });
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      visibleData.forEach((_, i) => {
        const idx = clampedViewStart + i;
        const v = macdLine[idx];
        if (v == null) return;
        if (i === 0) ctx.moveTo(scaleX(i), scaleY(v));
        else ctx.lineTo(scaleX(i), scaleY(v));
      });
      ctx.stroke();
      ctx.strokeStyle = '#eab308';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      visibleData.forEach((_, i) => {
        const idx = clampedViewStart + i;
        const v = macdSignal[idx];
        if (v == null) return;
        if (i === 0) ctx.moveTo(scaleX(i), scaleY(v));
        else ctx.lineTo(scaleX(i), scaleY(v));
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px system-ui';
      ctx.fillText('MACD', margin.left - 4, rowTop + margin.top + chartH / 2);
      rowTop += rowH;
    }

    if (showCVD && cvdSeries.length) {
      const rowH = INDICATOR_ROW_H;
      const chartH = rowH - margin.top - margin.bottom;
      const visibleCvd = visibleData.map((_, i) => cvdSeries[clampedViewStart + i]);
      const mn = Math.min(...visibleCvd);
      const mx = Math.max(...visibleCvd);
      const rng = Math.max(mx - mn, 1);
      const scaleY = (v: number) => rowTop + margin.top + chartH - ((v - mn) / rng) * chartH;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, rowTop, w, rowH);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(margin.left, rowTop + margin.top, chartW, chartH);
      ctx.strokeStyle = 'rgba(251,191,36,0.95)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      visibleData.forEach((_, i) => {
        const v = cvdSeries[clampedViewStart + i];
        if (i === 0) ctx.moveTo(scaleX(i), scaleY(v));
        else ctx.lineTo(scaleX(i), scaleY(v));
      });
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px system-ui';
      ctx.fillText('CVD', margin.left - 4, rowTop + margin.top + chartH / 2);
      rowTop += rowH;
    }
  }, [showRSI, showMACD, showCVD, visibleData, visibleCount, clampedViewStart, rsi14, macdLine, macdSignal, macdHist, cvdSeries, indicatorHeight]);

  const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const layout = chartLayoutRef.current;
    if (!layout || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (y < layout.margin.top || y > layout.margin.top + layout.chartH || x < layout.margin.left || x > layout.margin.left + layout.chartW) {
      setHoveredBar(null);
      setHoveredIndex(null);
      return;
    }
    const i = (x - layout.margin.left) / layout.chartW * (layout.visibleCount - 1);
    const barIndex = layout.viewStart + Math.round(i);
    if (barIndex >= 0 && barIndex < layout.data.length) {
      setHoveredBar(layout.data[barIndex]);
      setHoveredIndex(barIndex);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredBar(null);
      setHoveredIndex(null);
    }
  };

  const handleChartMouseLeave = () => {
    setHoveredBar(null);
    setHoveredIndex(null);
    setIsDragging(false);
  };

  const handleChartClick = () => {
    if (hoveredBar !== null && hoveredIndex !== null) {
      setSelectedBar(hoveredBar);
      setSelectedIndex(hoveredIndex);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel((z) => Math.max(0.1, Math.min(10, z * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, viewStart };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const layout = chartLayoutRef.current;
      if (!layout) return;
      const dx = e.clientX - dragStartRef.current.x;
      const pixelsPerBar = layout.chartW / Math.max(1, layout.visibleCount - 1);
      const deltaBars = -dx / pixelsPerBar;
      const newStart = Math.max(0, Math.min(layout.data.length - visibleCount, Math.round(dragStartRef.current.viewStart + deltaBars)));
      setViewStart(newStart);
      dragStartRef.current = { x: e.clientX, viewStart: newStart };
    } else {
      handleChartMouseMove(e);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const formatDate = (t: number) => new Date(t * 1000).toLocaleString(undefined, { dateStyle: 'medium' });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-200">Data source (same as Scenarios · /assets/history)</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Select security — full asset universe</p>
        <AssetSearchBar
          chips={chartSymbols}
          onAdd={(sym) => setChartSymbols((prev) => (prev.includes(sym) ? prev : [sym].concat(prev).slice(0, 1)))}
          onRemove={(sym) => setChartSymbols((prev) => prev.filter((s) => s !== sym))}
          maxChips={1}
          accentBg="bg-slate-700/50"
          accentBorder="border-slate-600"
          accentText="text-slate-200"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Timeframe (period)</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          >
            {PERIODS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Chart type</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as ChartType)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          >
            {CHART_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Indicators</span>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showSMA} onChange={(e) => setShowSMA(e.target.checked)} className="rounded" />
            SMA 20
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showEMA} onChange={(e) => setShowEMA(e.target.checked)} className="rounded" />
            EMA 12
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showBollinger} onChange={(e) => setShowBollinger(e.target.checked)} className="rounded" />
            Bollinger Bands
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showRSI} onChange={(e) => setShowRSI(e.target.checked)} className="rounded" />
            RSI
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showMACD} onChange={(e) => setShowMACD(e.target.checked)} className="rounded" />
            MACD
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showVWAP} onChange={(e) => setShowVWAP(e.target.checked)} className="rounded" />
            VWAP
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showCVD} onChange={(e) => setShowCVD(e.target.checked)} className="rounded" />
            CVD
          </label>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Order flow & profiles</span>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showVolProfile} onChange={(e) => setShowVolProfile(e.target.checked)} className="rounded" />
            Order Flow (Vol Profile)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showBidAsk} onChange={(e) => setShowBidAsk(e.target.checked)} className="rounded" />
            Order Flow (Bid/Ask)
          </label>
          <span className="text-xs text-slate-500 ml-2">Daily:</span>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showDailyVolProfile} onChange={(e) => setShowDailyVolProfile(e.target.checked)} className="rounded" />
            Vol Profile
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showDailyDeltaProfile} onChange={(e) => setShowDailyDeltaProfile(e.target.checked)} className="rounded" />
            Delta Profile
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showDailyProfileValues} onChange={(e) => setShowDailyProfileValues(e.target.checked)} className="rounded" />
            Profile Values
          </label>
          <span className="text-xs text-slate-500 ml-2">Weekly:</span>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showWeeklyVolProfile} onChange={(e) => setShowWeeklyVolProfile(e.target.checked)} className="rounded" />
            Vol Profile
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showWeeklyDeltaProfile} onChange={(e) => setShowWeeklyDeltaProfile(e.target.checked)} className="rounded" />
            Delta Profile
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showWeeklyProfileValues} onChange={(e) => setShowWeeklyProfileValues(e.target.checked)} className="rounded" />
            Profile Values
          </label>
        </div>
      </div>

      {error && <p className="text-amber-400 text-sm">{error}</p>}
      {loading && <p className="text-slate-400 text-sm">Loading chart data…</p>}

      <div className="rounded-xl bg-slate-800/60 border border-slate-700 overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">{symbol || 'Select a symbol'} · {chartType} · {period}</span>
          <span className="text-[10px] uppercase text-slate-500">
            Crosshair = axis values · Hover = OHLC tooltip · Click = pin bar · Wheel = zoom · Drag = pan · Right = volume profile
          </span>
        </div>
        <div
          ref={containerRef}
          className="flex p-2 gap-0 relative select-none cursor-crosshair active:cursor-grabbing"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleChartMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleChartClick}
          onWheel={handleWheel}
          style={{ touchAction: 'none' }}
        >
          <div className="flex-1 min-w-0 relative">
            <canvas
              ref={canvasRef}
              className="w-full rounded-l-lg block"
              style={{ height: CHART_H }}
            />
          </div>
          {showVolProfile && (
            <div className="relative" style={{ width: VOLUME_PROFILE_WIDTH }}>
              <canvas
                ref={volumeCanvasRef}
                className="rounded-r-lg block"
                style={{ height: CHART_H, width: VOLUME_PROFILE_WIDTH }}
              />
            </div>
          )}
        </div>

        {indicatorRows > 0 && (
          <div className="flex px-2 pb-2 gap-0" style={{ height: indicatorHeight }}>
            <div className="flex-1 min-w-0">
              <canvas
                ref={indicatorCanvasRef}
                className="block rounded-b-lg w-full"
                style={{ height: indicatorHeight }}
              />
            </div>
            {showVolProfile && <div style={{ width: VOLUME_PROFILE_WIDTH, flexShrink: 0 }} />}
          </div>
        )}

        {((showDailyProfileValues && dailyProfileVals) || (showWeeklyProfileValues && weeklyProfileVals) || (showVolProfile && !showDailyVolProfile && !showWeeklyVolProfile && sessionProfileVals)) && (
          <div className="px-4 py-2 border-t border-slate-700 bg-slate-900/30 flex flex-wrap gap-6 text-sm font-mono">
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">Profile values (POC · VAH · VAL)</span>
            {showDailyProfileValues && dailyProfileVals && (
              <div className="flex gap-4">
                <span className="text-slate-500">Daily:</span>
                <span>POC <span className="text-cyan-400">{dailyProfileVals.poc.toFixed(2)}</span></span>
                <span>VAH <span className="text-green-400">{dailyProfileVals.vah.toFixed(2)}</span></span>
                <span>VAL <span className="text-red-400">{dailyProfileVals.val.toFixed(2)}</span></span>
              </div>
            )}
            {showWeeklyProfileValues && weeklyProfileVals && (
              <div className="flex gap-4">
                <span className="text-slate-500">Weekly:</span>
                <span>POC <span className="text-cyan-400">{weeklyProfileVals.poc.toFixed(2)}</span></span>
                <span>VAH <span className="text-green-400">{weeklyProfileVals.vah.toFixed(2)}</span></span>
                <span>VAL <span className="text-red-400">{weeklyProfileVals.val.toFixed(2)}</span></span>
              </div>
            )}
            {showVolProfile && !showDailyVolProfile && !showWeeklyVolProfile && sessionProfileVals && (
              <div className="flex gap-4">
                <span className="text-slate-500">Session:</span>
                <span>POC <span className="text-cyan-400">{sessionProfileVals.poc.toFixed(2)}</span></span>
                <span>VAH <span className="text-green-400">{sessionProfileVals.vah.toFixed(2)}</span></span>
                <span>VAL <span className="text-red-400">{sessionProfileVals.val.toFixed(2)}</span></span>
              </div>
            )}
          </div>
        )}

        {hoveredBar && (
          <div
            className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 shadow-xl text-xs font-mono"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y + 12 }}
          >
            <p className="text-slate-400 font-semibold mb-1">{formatDate(hoveredBar.time)}</p>
            <p>O <span className="text-white">{hoveredBar.open.toFixed(2)}</span></p>
            <p>H <span className="text-green-400">{hoveredBar.high.toFixed(2)}</span></p>
            <p>L <span className="text-red-400">{hoveredBar.low.toFixed(2)}</span></p>
            <p>C <span className="text-white">{hoveredBar.close.toFixed(2)}</span></p>
            <p className="text-slate-500">Vol {hoveredBar.volume.toLocaleString()}</p>
          </div>
        )}

        {selectedBar && (
          <div className="px-4 py-3 border-t border-slate-700 bg-slate-900/50 rounded-b-xl">
            <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold mb-2">Selected bar (click on chart) — OHLC</p>
            <div className="flex flex-wrap gap-4 text-sm font-mono">
              <span><span className="text-slate-500">Date:</span> {formatDate(selectedBar.time)}</span>
              <span><span className="text-slate-500">O</span> <span className="text-white">{selectedBar.open.toFixed(2)}</span></span>
              <span><span className="text-slate-500">H</span> <span className="text-green-400">{selectedBar.high.toFixed(2)}</span></span>
              <span><span className="text-slate-500">L</span> <span className="text-red-400">{selectedBar.low.toFixed(2)}</span></span>
              <span><span className="text-slate-500">C</span> <span className="text-white">{selectedBar.close.toFixed(2)}</span></span>
              <span><span className="text-slate-500">Vol</span> {selectedBar.volume.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <details className="rounded-lg bg-slate-800/40 border border-slate-700 p-3">
        <summary className="text-sm font-medium text-slate-300 cursor-pointer">Chart patterns (reference)</summary>
        <div className="mt-2 text-xs text-slate-500 space-y-1">
          <p><strong className="text-slate-400">Reversal:</strong> Double top/bottom, head and shoulders, rounded top/bottom.</p>
          <p><strong className="text-slate-400">Continuation:</strong> Flags, pennants, triangles (ascending/descending/symmetrical), wedges.</p>
        </div>
      </details>
    </div>
  );
}
