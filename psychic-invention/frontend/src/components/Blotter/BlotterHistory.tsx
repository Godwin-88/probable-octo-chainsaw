import { useState, useEffect } from 'react';
import { getBlotterHistory } from '@/utils/api';
import { downloadFile, generateFilename } from '@/utils/export';

export interface TradeRecord {
  id: string;
  asset: string;
  direction: string;
  quantity: number;
  entry_price: number;
  entry_date: string;
  model_used?: string;
  theoretical_price_at_entry?: number;
  strategy_tag?: string;
}

export const BlotterHistory = () => {
  const [history, setHistory] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBlotterHistory();
      setHistory(Array.isArray(res?.trades) ? res.trades : Array.isArray(res) ? res : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch history');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = ['id', 'asset', 'direction', 'quantity', 'entry_price', 'entry_date', 'strategy_tag'];
    const rows = history.map((t) =>
      headers.map((h) => {
        const v = (t as Record<string, unknown>)[h];
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v ?? '');
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile(csv, generateFilename('blotter_history', 'csv'), 'text/csv');
  };

  const handleExportJSON = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      count: history.length,
      history,
    };
    const json = JSON.stringify(payload, null, 2);
    downloadFile(json, generateFilename('blotter_history', 'json'), 'application/json');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Transaction History</h3>
          <div className="flex gap-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            {history.length > 0 && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                >
                  Export JSON
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-300 text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm py-8 text-center">Loading transaction history…</p>
        ) : history.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center">
            No trades recorded. Add trades via Trade Entry to build history.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-slate-600 bg-slate-800 p-2 text-slate-400 text-left">Date</th>
                  <th className="border border-slate-600 bg-slate-800 p-2 text-slate-400 text-left">Asset</th>
                  <th className="border border-slate-600 bg-slate-800 p-2 text-slate-400 text-left">Dir</th>
                  <th className="border border-slate-600 bg-slate-800 p-2 text-slate-400 text-right">Qty</th>
                  <th className="border border-slate-600 bg-slate-800 p-2 text-slate-400 text-right">Entry $</th>
                  <th className="border border-slate-600 bg-slate-800 p-2 text-slate-400 text-left">Strategy</th>
                  <th className="border border-slate-600 bg-slate-800 p-2 text-slate-400 text-left">ID</th>
                </tr>
              </thead>
              <tbody>
                {history.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/50">
                    <td className="border border-slate-600 p-2 text-slate-300">{t.entry_date}</td>
                    <td className="border border-slate-600 p-2 text-white font-medium">{t.asset}</td>
                    <td className="border border-slate-600 p-2">
                      <span
                        className={
                          t.direction === 'long' ? 'text-emerald-400' : 'text-rose-400'
                        }
                      >
                        {t.direction}
                      </span>
                    </td>
                    <td className="border border-slate-600 p-2 text-right font-mono">{t.quantity}</td>
                    <td className="border border-slate-600 p-2 text-right font-mono">
                      {t.entry_price.toFixed(2)}
                    </td>
                    <td className="border border-slate-600 p-2 text-slate-400">
                      {t.strategy_tag || '—'}
                    </td>
                    <td className="border border-slate-600 p-2 text-xs text-slate-500 font-mono">
                      {t.id.slice(0, 8)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
