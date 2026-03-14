import { useEffect, useState } from 'react';

type PriceEntry = { price: number; timestamp: string; source?: string; error?: string };
type Rates = Record<string, PriceEntry>;

const WS_BASE = (() => {
  const base = import.meta.env.VITE_GATEWAY_URL ?? '';
  if (base) return base.replace(/^http/, 'ws').replace(/\/?$/, '');
  const { protocol, hostname } = window.location;
  return `${protocol === 'https:' ? 'wss:' : 'ws:'}//${hostname}:3000`;
})();

export function LiveRates() {
  const [rates, setRates] = useState<Rates>({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      try {
        ws = new WebSocket(`${WS_BASE}/v2/ws/market`);
        ws.onopen = () => setConnected(true);
        ws.onclose = () => {
          setConnected(false);
          retryTimer = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws?.close();
        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data) as { type: string; prices?: Rates };
            if (msg.type === 'market_update' && msg.prices) {
              setRates((prev) => ({ ...prev, ...msg.prices }));
            }
          } catch (_) {}
        };
      } catch (_) {}
    }

    connect();
    return () => {
      clearTimeout(retryTimer);
      ws?.close();
    };
  }, []);

  const pairs = Object.entries(rates);

  return (
    <div className="flex items-center gap-4 flex-wrap px-4 py-2 bg-slate-950/60 border-b border-slate-800/50 text-xs">
      <span className={`font-bold uppercase tracking-widest ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
        {connected ? '● LIVE' : '○ CONNECTING'}
      </span>
      {pairs.length === 0 && (
        <span className="text-slate-600">Waiting for prices…</span>
      )}
      {pairs.map(([pair, data]) => (
        <div key={pair} className="flex items-center gap-1.5">
          <span className="text-slate-500">{pair}</span>
          <span className="text-slate-200 font-semibold font-mono">
            {data.error ? '—' : `$${data.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
          </span>
          {data.source && <span className="text-slate-600">{data.source}</span>}
        </div>
      ))}
    </div>
  );
}
