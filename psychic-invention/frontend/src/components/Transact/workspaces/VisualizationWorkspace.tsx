import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, Plus, Loader2 } from 'lucide-react';
import { VIZ_OPTIONS, VIZ_CATEGORIES } from '@/config/vizOptions';
import { getAssetHistory } from '@/utils/api';
import { useDataProvider } from '@/context/DataProviderContext';
import { VizChartPreview } from '@/components/Transact/VizChartPreview';
import { useSelectedAssets } from '@/context/SelectedAssetsContext';

const TIMEFRAMES = [
  { id: '1d', label: '1 Day' },
  { id: '5d', label: '5 Days' },
  { id: '1mo', label: '1 Month' },
  { id: '3mo', label: '3 Months' },
  { id: '6mo', label: '6 Months' },
  { id: '1y', label: '1 Year' },
  { id: 'ytd', label: 'YTD' },
] as const;

type ChartDataPoint = { date: string; open: number | null; high: number | null; low: number | null; close: number | null; volume: number | null };

export const VisualizationWorkspace = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedAssets } = useSelectedAssets();
  const { dataProvider } = useDataProvider();
  const [activeViz, setActiveViz] = useState<string | null>(null);
  const [assetsFromUrl, setAssetsFromUrl] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState<string>('1mo');
  const [chartDataBySymbol, setChartDataBySymbol] = useState<Record<string, ChartDataPoint[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const assetsParam = searchParams.get('assets');
    if (assetsParam) {
      setAssetsFromUrl(assetsParam.split(',').map((s) => s.trim()).filter(Boolean));
    }
  }, [searchParams]);

  const assets = assetsFromUrl.length > 0 ? assetsFromUrl : selectedAssets.map((a) => a.symbol);
  const assetsKey = assets.join(',');

  const loadCharts = useCallback(async () => {
    const symbols = assetsKey.split(',').map((s) => s.trim()).filter(Boolean);
    if (!activeViz || symbols.length === 0) return;
    setError(null);
    setLoading(true);
    try {
      const results: Record<string, ChartDataPoint[]> = {};
      for (const symbol of symbols) {
        const data = await getAssetHistory(symbol, timeframe);
        results[symbol] = data;
      }
      setChartDataBySymbol(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
      setChartDataBySymbol({});
    } finally {
      setLoading(false);
    }
  }, [activeViz, assetsKey, timeframe, dataProvider]);

  useEffect(() => {
    if (activeViz && assetsKey) {
      loadCharts();
    } else {
      setChartDataBySymbol({});
    }
  }, [activeViz, assetsKey, timeframe, loadCharts]);

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/transact/pricer')}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to Pricer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Visualization Workspace</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {assets.length > 0
                ? `Visualizing: ${assets.join(', ')}`
                : 'Select assets in header or open from Pricer panel'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
          Secondary Workspace
        </span>
      </div>

      {/* Content: chart grid + viz picker */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeViz ? (
              <div className="col-span-full space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <BarChart2 className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">
                      {VIZ_OPTIONS.find((v) => v.id === activeViz)?.label ?? 'Chart'}
                    </h3>
                  </div>
                  {assets.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
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
                  )}
                </div>
                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 rounded-xl bg-slate-800/50 border border-slate-700">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" />
                    <p className="text-slate-500 text-sm">Loading chart data…</p>
                  </div>
                ) : Object.keys(chartDataBySymbol).length > 0 ? (
                  (() => {
                    const multiAsset = ['pie', 'treemap', 'sunburst', 'heatmap', 'correlation-matrix'].includes(activeViz) && assets.length >= 2;
                    if (multiAsset) {
                      const firstData = Object.values(chartDataBySymbol).find((d) => d.length > 0) ?? [];
                      return (
                        <VizChartPreview
                          key="multi"
                          data={firstData}
                          symbol={assets[0]}
                          vizType={activeViz}
                          period={TIMEFRAMES.find((t) => t.id === timeframe)?.label ?? timeframe}
                          height={280}
                          allDataBySymbol={chartDataBySymbol}
                          assetCount={assets.length}
                        />
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Object.entries(chartDataBySymbol).map(([sym, data]) =>
                          data.length > 0 ? (
                            <VizChartPreview
                              key={sym}
                              data={data}
                              symbol={sym}
                              vizType={activeViz}
                              period={TIMEFRAMES.find((t) => t.id === timeframe)?.label ?? timeframe}
                              height={280}
                              allDataBySymbol={chartDataBySymbol}
                              assetCount={assets.length}
                            />
                          ) : null
                        )}
                      </div>
                    );
                  })()
                ) : assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 rounded-xl bg-slate-800/50 border border-slate-700 border-dashed">
                    <p className="text-slate-500 text-sm">Select assets in the header to visualize</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 rounded-xl bg-slate-800/50 border border-slate-700 border-dashed">
                    <p className="text-slate-500 text-sm">No data available for the selected period</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center min-h-[320px] rounded-xl bg-slate-900/40 border border-slate-800 border-dashed">
                <Plus className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">Select a visualization from the panel</p>
                <p className="text-slate-600 text-xs mt-1">Or add charts for your selected assets</p>
              </div>
            )}
            <div className="bg-slate-900/40 border border-slate-700 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Quick add</p>
              <div className="flex flex-wrap gap-2">
                {VIZ_OPTIONS.slice(0, 6).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveViz(v.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeViz === v.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: viz picker panel (inline, always visible) */}
        <div className="w-64 shrink-0 border-l border-slate-800 bg-slate-900/40 overflow-y-auto">
          <div className="p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              All visualizations
            </p>
            {VIZ_CATEGORIES.map((cat) => {
              const items = VIZ_OPTIONS.filter((v) => v.category === cat.id);
              return (
                <div key={cat.id}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    {cat.label}
                  </p>
                  <div className="space-y-1">
                    {items.map((viz) => (
                      <button
                        key={viz.id}
                        onClick={() => setActiveViz(viz.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeViz === viz.id
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        {viz.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
