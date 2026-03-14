/**
 * MarketTicker — infinite right-to-left scroll of top gainers + losers per asset class.
 *
 * Data: GET /assets/movers  (yfinance, 2-day Δ, refreshed every 5 min)
 * Categories: Equities, ETFs, Indices, Crypto, Forex, Futures, Volatility, Mutual Funds
 * Animation: CSS @keyframes via inline <style>; duplicated list for seamless loop.
 * Pauses on hover.
 */
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_CONFIG } from '@/config/api';

const _api = axios.create({ baseURL: API_CONFIG.BASE_URL, timeout: 15000 });

interface Mover {
  symbol: string;
  label: string;
  price: number;
  change_pct: number;
}

interface CategoryData {
  label: string;
  color: string;
  gainers: Mover[];
  losers: Mover[];
}

interface MoversResponse {
  categories: Record<string, CategoryData>;
  timestamp: string;
}

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

// Color mapping for category badges
const COLOR_CLASSES: Record<string, string> = {
  blue:    'text-blue-400 bg-blue-500/10',
  indigo:  'text-indigo-400 bg-indigo-500/10',
  violet:  'text-violet-400 bg-violet-500/10',
  orange:  'text-orange-400 bg-orange-500/10',
  teal:    'text-teal-400 bg-teal-500/10',
  amber:   'text-amber-400 bg-amber-500/10',
  red:     'text-red-400 bg-red-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
};

// ── Single ticker item ────────────────────────────────────────────────────────
function TickerItem({ item }: { item: Mover }) {
  const up = item.change_pct >= 0;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 shrink-0">
      <span className="font-mono text-xs font-bold text-white tracking-wide">
        {item.label}
      </span>
      <span className={`font-mono text-xs ${up ? 'text-emerald-400' : 'text-red-400'}`}>
        {item.price < 10
          ? item.price.toFixed(4)
          : item.price < 1000
          ? item.price.toFixed(2)
          : item.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </span>
      <span
        className={`text-[10px] font-semibold px-1 py-0.5 rounded ${
          up ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
        }`}
      >
        {up ? '▲' : '▼'} {Math.abs(item.change_pct).toFixed(2)}%
      </span>
    </span>
  );
}

// ── Category badge divider ────────────────────────────────────────────────────
function CategoryDivider({ label, color }: { label: string; color: string }) {
  const cls = COLOR_CLASSES[color] ?? 'text-slate-400 bg-slate-500/10';
  return (
    <span className="inline-flex items-center gap-1.5 px-4 shrink-0 select-none">
      <span className="w-px h-3 bg-slate-800" />
      <span className={`text-[9px] uppercase tracking-[0.18em] font-bold px-1.5 py-0.5 rounded ${cls}`}>
        {label}
      </span>
      <span className="w-px h-3 bg-slate-800" />
    </span>
  );
}

// ── Section mini-divider (Gainers / Losers within a category) ─────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 shrink-0 select-none">
      <span className="text-[9px] uppercase tracking-widest text-slate-700 font-bold">
        {label}
      </span>
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function MarketTicker() {
  const [data, setData] = useState<MoversResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMovers = async () => {
    try {
      const res = await _api.get(API_CONFIG.ENDPOINTS.ASSETS_MOVERS, {
        params: { top: 5 },
      });
      setData(res.data);
    } catch {
      // keep stale data on error; silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovers();
    intervalRef.current = setInterval(fetchMovers, REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ── Build the flat list of renderable items ─────────────────────────────────
  type Entry =
    | { type: 'category'; label: string; color: string }
    | { type: 'section'; label: string }
    | { type: 'mover'; item: Mover };

  const items: Entry[] = [];
  if (data?.categories) {
    Object.values(data.categories).forEach(cat => {
      if (!cat.gainers.length && !cat.losers.length) return;
      items.push({ type: 'category', label: cat.label, color: cat.color });
      if (cat.gainers.length) {
        items.push({ type: 'section', label: '▲' });
        cat.gainers.forEach(m => items.push({ type: 'mover', item: m }));
      }
      if (cat.losers.length) {
        items.push({ type: 'section', label: '▼' });
        cat.losers.forEach(m => items.push({ type: 'mover', item: m }));
      }
    });
  }

  // Placeholder skeleton while loading
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div className="flex items-center gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5 animate-pulse">
              <div className="h-2.5 w-12 rounded bg-slate-800" />
              <div className="h-2.5 w-14 rounded bg-slate-700" />
              <div className="h-2.5 w-10 rounded bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || items.length === 0) return null;

  // Scroll duration scales with content volume
  const durationSec = Math.max(60, items.length * 2.8);

  const renderItem = (entry: Entry, key: string) => {
    if (entry.type === 'category')
      return <CategoryDivider key={key} label={entry.label} color={entry.color} />;
    if (entry.type === 'section')
      return <SectionDivider key={key} label={entry.label} />;
    return <TickerItem key={key} item={entry.item} />;
  };

  return (
    <>
      {/* Keyframes injected once — Tailwind can't generate arbitrary durations */}
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll ${durationSec}s linear infinite;
        }
        .ticker-track.paused {
          animation-play-state: paused;
        }
      `}</style>

      <div
        className="flex-1 overflow-hidden relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Gradient fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-slate-950 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-slate-950 to-transparent" />

        {/* Scrolling track — content doubled for seamless loop */}
        <div
          className={`ticker-track flex items-center h-full whitespace-nowrap${paused ? ' paused' : ''}`}
        >
          {/* First copy */}
          {items.map((entry, i) => renderItem(entry, `a-${i}`))}
          {/* Duplicate for seamless loop */}
          {items.map((entry, i) => renderItem(entry, `b-${i}`))}
        </div>

        {/* Timestamp badge */}
        {data.timestamp && (
          <span className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 text-[9px] text-slate-700 font-mono z-20">
            {data.timestamp}
          </span>
        )}
      </div>
    </>
  );
}
