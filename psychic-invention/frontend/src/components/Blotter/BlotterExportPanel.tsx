/**
 * Export panel — Menu 8 Blotter: export trades and positions to CSV or JSON.
 * Uses GET /blotter/history and GET /blotter/positions with optional date range.
 */

import { useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import { downloadFile, generateFilename } from '@/utils/export';

const baseUrl = API_CONFIG.BASE_URL;

function tradesToCSV(trades: Record<string, unknown>[]): string {
  if (trades.length === 0) return 'date,asset,direction,quantity,entry_price,id\n';
  const headers = Object.keys(trades[0]).join(',');
  const rows = trades.map((t) =>
    Object.values(t).map((v) => (v != null ? String(v).replace(/,/g, ';') : '')).join(',')
  );
  return [headers, ...rows].join('\n');
}

function positionsToCSV(positions: Record<string, unknown>[]): string {
  if (positions.length === 0) return 'asset,quantity,direction,entry_price,current_price,unrealized_pnl,unrealized_pnl_pct\n';
  const headers = Object.keys(positions[0]).join(',');
  const rows = positions.map((p) =>
    Object.values(p).map((v) => (v != null ? String(v).replace(/,/g, ';') : '')).join(',')
  );
  return [headers, ...rows].join('\n');
}

export function BlotterExportPanel() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [exportType, setExportType] = useState<'trades' | 'positions' | 'both'>('trades');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const [historyRes, positionsRes] = await Promise.all([
        axios.get<{ trades: Record<string, unknown>[] }>(`${baseUrl}/blotter/history`, { params }),
        axios.get<{ positions: Record<string, unknown>[] }>(`${baseUrl}/blotter/positions`),
      ]);
      const trades = historyRes.data.trades || [];
      const positions = positionsRes.data.positions || [];

      if (format === 'json') {
        const payload =
          exportType === 'trades'
            ? { trades }
            : exportType === 'positions'
              ? { positions }
              : { trades, positions };
        const json = JSON.stringify(payload, null, 2);
        const filename = generateFilename('blotter_export', 'json');
        downloadFile(json, filename, 'application/json');
      } else {
        if (exportType === 'trades' || exportType === 'both') {
          const csv1 = tradesToCSV(trades);
          const filename1 = generateFilename('blotter_trades', 'csv');
          downloadFile(csv1, filename1, 'text/csv');
        }
        if (exportType === 'positions' || exportType === 'both') {
          const csv2 = positionsToCSV(positions);
          const filename2 = generateFilename('blotter_positions', 'csv');
          downloadFile(csv2, filename2, 'text/csv');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl bg-slate-800/60 border border-slate-700 p-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Export Centre</h3>
        <p className="text-sm text-slate-500">
          Export trades and/or positions to CSV or JSON. Optionally filter trades by date range.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">From date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">To date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Export</label>
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value as 'trades' | 'positions' | 'both')}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="trades">Trades only</option>
            <option value="positions">Positions only</option>
            <option value="both">Trades + Positions</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <button
          onClick={handleExport}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium text-sm hover:bg-primary-500 disabled:opacity-50"
        >
          {loading ? 'Exporting…' : 'Export'}
        </button>
      </div>
      {error && <p className="text-amber-400 text-sm">{error}</p>}
    </div>
  );
}
