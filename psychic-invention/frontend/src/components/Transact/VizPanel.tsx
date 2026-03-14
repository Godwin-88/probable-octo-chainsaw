import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, CandlestickChart, LineChart, PieChart, BarChart2, ScatterChart, LayoutGrid, Loader2 } from 'lucide-react';
import { VIZ_CATEGORIES, VIZ_OPTIONS, type VizOption } from '@/config/vizOptions';
import { getAssetHistory } from '@/utils/api';
import { useDataProvider } from '@/context/DataProviderContext';
import { VizChartPreview } from '@/components/Transact/VizChartPreview';
import type { SelectedAsset } from '@/context/SelectedAssetsContext';

const TIMEFRAMES = [
  { id: '1d', label: '1 Day' },
  { id: '5d', label: '5 Days' },
  { id: '1mo', label: '1 Month' },
  { id: '3mo', label: '3 Months' },
  { id: '6mo', label: '6 Months' },
  { id: '1y', label: '1 Year' },
  { id: 'ytd', label: 'YTD' },
] as const;

interface VizPanelProps {
  open: boolean;
  onClose: () => void;
  selectedAssets: SelectedAsset[];
  selectedViz?: string;
  onSelectViz?: (id: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  candlestick: CandlestickChart,
  line: LineChart,
  pie: PieChart,
  bar: BarChart2,
  scatter: ScatterChart,
};

const getIcon = (viz: VizOption) => {
  const Icon = iconMap[viz.id];
  return Icon ? <Icon className="w-4 h-4 text-blue-400" /> : <LayoutGrid className="w-4 h-4 text-slate-500" />;
};

export const VizPanel = ({ open, onClose, selectedAssets, selectedViz, onSelectViz }: VizPanelProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState<string>('1mo');
  const [chartData, setChartData] = useState<{ date: string; open: number | null; high: number | null; low: number | null; close: number | null; volume: number | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = VIZ_OPTIONS.filter(
    (v) =>
      !search.trim() ||
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.useCase.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenWorkspace = () => {
    const symbols = selectedAssets.map((a) => a.symbol).join(',');
    navigate(`/transact/pricer/visualize${symbols ? `?assets=${encodeURIComponent(symbols)}` : ''}`);
    onClose();
  };

  const handleGenerate = async () => {
    if (!selectedViz) return;
    const symbol = selectedAssets[0]?.symbol;
    if (!symbol) {
      setError('Select at least one asset in the header first.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await getAssetHistory(symbol, timeframe, dataProvider);
      setChartData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col"
        role="dialog"
        aria-label="Visualization options"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Visualize Asset</h2>
            {selectedAssets.length > 0 ? (
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedAssets.map((a) => a.symbol).join(', ')}
              </p>
            ) : (
              <p className="text-xs text-amber-500 mt-0.5">Select assets in header</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <input
              type="text"
              placeholder="Search visualizations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>

          <div className="space-y-4">
            {VIZ_CATEGORIES.map((cat) => {
              const items = filtered.filter((v) => v.category === cat.id);
              if (items.length === 0) return null;
              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-semibold text-slate-200">{cat.label}</span>
                    <span className="text-slate-500 text-xs">{items.length}</span>
                  </div>
                  <div className="space-y-1 pl-2 border-l-2 border-slate-700">
                    {items.map((viz) => (
                      <button
                        key={viz.id}
                        onClick={() => onSelectViz?.(viz.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                          selectedViz === viz.id
                            ? 'bg-blue-600/20 border border-blue-500/40'
                            : 'hover:bg-slate-800/60 border border-transparent'
                        }`}
                      >
                        {getIcon(viz)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{viz.label}</p>
                          <p className="text-xs text-slate-500 truncate">{viz.useCase}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">No visualizations match</p>
          )}

          {selectedViz && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-4">
              <p className="text-sm font-semibold text-white">
                {VIZ_OPTIONS.find((v) => v.id === selectedViz)?.label}
              </p>
              <div>
                <p className="text-xs text-slate-400 mb-2">Timeframe</p>
                <div className="flex flex-wrap gap-2">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => setTimeframe(tf.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        timeframe === tf.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading || selectedAssets.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  'Generate Chart'
                )}
              </button>
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}
              {chartData.length > 0 && selectedAssets[0] && (
                <VizChartPreview
                  data={chartData}
                  symbol={selectedAssets[0].symbol}
                  vizType={selectedViz}
                  period={TIMEFRAMES.find((t) => t.id === timeframe)?.label ?? timeframe}
                  height={200}
                  assetCount={selectedAssets.length}
                />
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 shrink-0 space-y-3">
          <button
            onClick={handleOpenWorkspace}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Visualization Workspace
          </button>
          <p className="text-[10px] text-slate-500 text-center">
            Full-screen workspace for multi-chart analysis
          </p>
        </div>
      </div>
    </>
  );
};
