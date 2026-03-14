import { useState, useEffect } from 'react';
import { postBlotterPositions, getBlotterHistory } from '@/utils/api';

interface Position {
  asset: string;
  quantity: number;
  direction: string;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
}

interface PositionTableProps {
  onSelectPosition?: (position: Position | null) => void;
}

export const PositionTable = ({ onSelectPosition }: PositionTableProps = {}) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'positions' | 'history'>('positions');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [posRes, histRes] = await Promise.all([
        postBlotterPositions(prices),
        getBlotterHistory(),
      ]);
      setPositions(posRes.positions || []);
      setHistory(histRes.trades || []);
    } catch {
      setPositions([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [prices]);

  useEffect(() => {
    refresh();
  }, []);

  const handlePriceChange = (asset: string, value: number) => {
    setPrices((prev) => ({ ...prev, [asset]: value }));
  };

  const handleSelectPosition = (position: Position) => {
    if (selectedAsset === position.asset) {
      setSelectedAsset(null);
      onSelectPosition?.(null);
    } else {
      setSelectedAsset(position.asset);
      onSelectPosition?.(position);
    }
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('positions')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === 'positions' ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            Positions
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === 'history' ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            History
          </button>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {tab === 'positions' && (
        <div className="space-y-6">
          {selectedAsset && (
            <div className="flex items-center gap-2 text-xs text-cyan-300 bg-cyan-900/20 border border-cyan-800/40 rounded-lg px-3 py-1.5">
              <span className="font-mono font-bold">{selectedAsset}</span>
              <span className="text-slate-400">selected — agent will focus analysis on this position</span>
              <button onClick={() => { setSelectedAsset(null); onSelectPosition?.(null); }} className="ml-auto text-slate-500 hover:text-white">×</button>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {positions.map((p) => (
              <div key={p.asset} className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">{p.asset}</span>
                <input
                  type="number"
                  placeholder="Price"
                  value={prices[p.asset] ?? p.entry_price}
                  onChange={(e) => handlePriceChange(p.asset, parseFloat(e.target.value) || 0)}
                  className="w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white text-sm"
                />
              </div>
            ))}
            {positions.length === 0 && (
              <p className="text-slate-500 text-sm">No positions. Add trades to see P&L.</p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-600">
                  <th className="text-left py-2">Asset</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Direction</th>
                  <th className="text-right py-2">Entry</th>
                  <th className="text-right py-2">Current</th>
                  <th className="text-right py-2">P&L</th>
                  <th className="text-right py-2">P&L %</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr
                    key={p.asset}
                    onClick={() => handleSelectPosition(p)}
                    className={`border-b border-slate-700 cursor-pointer transition-colors ${
                      selectedAsset === p.asset
                        ? 'bg-cyan-900/30 border-l-2 border-l-cyan-500'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-2 text-white font-medium">{p.asset}</td>
                    <td className="py-2 text-right text-slate-300">{p.quantity}</td>
                    <td className="py-2 text-right text-slate-300 capitalize">{p.direction}</td>
                    <td className="py-2 text-right font-mono text-slate-300">
                      {p.entry_price.toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-mono text-slate-300">
                      {p.current_price.toFixed(2)}
                    </td>
                    <td
                      className={`py-2 text-right font-mono ${
                        p.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {p.unrealized_pnl.toFixed(2)}
                    </td>
                    <td
                      className={`py-2 text-right font-mono ${
                        p.unrealized_pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {p.unrealized_pnl_pct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-600">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Asset</th>
                <th className="text-right py-2">Direction</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {history.map((t, i) => (
                <tr key={(t.id as string) || i} className="border-b border-slate-700">
                  <td className="py-2 text-slate-300 capitalize">{String(t.entry_date)}</td>
                  <td className="py-2 text-white font-medium">{String(t.asset)}</td>
                  <td className="py-2 text-right text-slate-300 capitalize">{String(t.direction)}</td>
                  <td className="py-2 text-right font-mono text-slate-300">{String(t.quantity)}</td>
                  <td className="py-2 text-right font-mono text-slate-300">
                    {Number(t.entry_price).toFixed(2)}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No trades yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
