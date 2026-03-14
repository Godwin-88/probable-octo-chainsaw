import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAgentContext, DEFAULT_SUGGESTED_QUESTIONS } from '@/context/AgentContext';
import { AGENTS_CONFIG } from '@/config/agents';
import { MathText } from '@/components/ui/Math';
import { BlotterChartOverview } from '@/components/Blotter/BlotterChartOverview';
import { TradeEntryForm } from '@/components/Blotter/TradeEntryForm';
import { PositionTable } from '@/components/Blotter/PositionTable';
import { AttributionCard } from '@/components/Blotter/AttributionCard';
import { BlotterHistory } from '@/components/Blotter/BlotterHistory';
import { BlotterExportPanel } from '@/components/Blotter/BlotterExportPanel';

interface SelectedPosition {
  asset: string;
  quantity: number;
  direction: string;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
}

const PlaceholderPanel = ({ title, desc }: { title: string; desc: string }) => (
  <div className="flex flex-col items-center justify-center h-80 gap-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-3xl">📋</div>
    <div>
      <p className="text-lg font-bold text-white">{title}</p>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">{desc}</p>
    </div>
    <span className="px-3 py-1 rounded-full text-xs bg-slate-800 text-slate-400 border border-slate-700">Panel active</span>
  </div>
);

const BASE = AGENTS_CONFIG.BASE_URL;

export const BlotterWorkspace = () => {
  const { setWorkspaceContext } = useAgentContext();
  const location = useLocation();
  const [chartSymbol, setChartSymbol] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<SelectedPosition | null>(null);

  // Build rich agent context from aggregated blotter data + selected position + chart symbol
  const syncBlotter = useCallback(async () => {
    try {
      // Fetch aggregated context from backend (new endpoint)
      const ctxRes = await axios.get(`${BASE}/blotter/context`, { timeout: 6000 }).catch(() => null);
      const ctx = ctxRes?.data ?? {};

      const positions: SelectedPosition[] = ctx.positions ?? [];
      const totalPnL: number = ctx.total_unrealized_pnl ?? 0;
      const totalValue: number = ctx.total_market_value ?? 0;
      const tradeCount: number = ctx.trade_count ?? 0;
      const winRate: number = ctx.win_rate_pct ?? 0;

      const rawData: Record<string, unknown> = {
        // Portfolio summary
        position_count: positions.length,
        long_positions: ctx.long_count ?? 0,
        short_positions: ctx.short_count ?? 0,
        total_unrealized_pnl: totalPnL,
        total_market_value: totalValue,
        trade_count: tradeCount,
        winner_count: ctx.winner_count ?? 0,
        loser_count: ctx.loser_count ?? 0,
        win_rate_pct: winRate,

        // All positions (full detail)
        positions: positions.map((p) => ({
          symbol: p.asset,
          quantity: p.quantity,
          direction: p.direction,
          entry_price: p.entry_price,
          current_price: p.current_price,
          unrealized_pnl: p.unrealized_pnl,
          unrealized_pnl_pct: p.unrealized_pnl_pct,
        })),

        // Chart context (instrument being analysed)
        ...(chartSymbol ? { chart_instrument: chartSymbol } : {}),

        // Selected position profile (highlighted by user)
        ...(selectedPosition ? {
          selected_position: {
            symbol: selectedPosition.asset,
            quantity: selectedPosition.quantity,
            direction: selectedPosition.direction,
            entry_price: selectedPosition.entry_price,
            current_price: selectedPosition.current_price,
            unrealized_pnl: selectedPosition.unrealized_pnl,
            unrealized_pnl_pct: selectedPosition.unrealized_pnl_pct,
            note: 'User has selected this position for focused analysis',
          },
        } : {}),
      };

      // Build metrics display
      const metrics: Record<string, string | number | null> = {
        'Positions': positions.length,
        'Total P&L': `$${totalPnL.toFixed(2)}`,
        'Market Value': `$${totalValue.toFixed(2)}`,
        'Trades': tradeCount,
        'Win Rate': `${winRate.toFixed(1)}%`,
      };
      if (chartSymbol) metrics['Chart'] = chartSymbol;
      if (selectedPosition) metrics['Focus'] = selectedPosition.asset;

      const selectedNote = selectedPosition
        ? ` · analysing ${selectedPosition.asset} (${selectedPosition.direction})`
        : '';
      const chartNote = chartSymbol ? ` · chart: ${chartSymbol}` : '';

      setWorkspaceContext({
        menuId: 'blotter',
        summary: `Blotter: ${positions.length} positions · P&L $${totalPnL.toFixed(2)} · ${tradeCount} trades${selectedNote}${chartNote}`,
        metrics,
        rawData,
        suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS.blotter,
      });
    } catch {
      setWorkspaceContext({
        menuId: 'blotter',
        summary: 'Trade Blotter: trade entry, position monitoring, P&L attribution and export',
        suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS.blotter,
      });
    }
  }, [setWorkspaceContext, chartSymbol, selectedPosition]);

  // Sync on mount, tab change, chart symbol change, or selected position change
  useEffect(() => {
    syncBlotter();
  }, [location.pathname, chartSymbol, selectedPosition, syncBlotter]);

  function getActiveTab() {
    if (location.pathname.includes('/positions'))   return 'positions';
    if (location.pathname.includes('/attribution')) return 'attribution';
    if (location.pathname.includes('/history'))     return 'history';
    if (location.pathname.includes('/export'))      return 'export';
    if (location.pathname.includes('/entry'))       return 'entry';
    return 'overview';
  }
  const activeTab = getActiveTab();

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">📋</span>
          <h1 className="text-2xl font-black text-white">Positions & Activity</h1>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-300 border border-slate-500/20">DPE · M1 · M2</span>
        </div>
        <p className="text-sm text-slate-400 ml-9">
          <MathText text="Trade entry · real-time P&L · attribution ($\alpha$, $\beta$, factor decomposition) · export" />
        </p>
      </div>


      <div className="min-h-[500px]">
        {activeTab === 'overview'    && (
          <div className="space-y-6">
            <BlotterChartOverview onSymbolChange={setChartSymbol} />
          </div>
        )}
        {activeTab === 'entry'       && (
          <div className="space-y-6">
            <TradeEntryForm />
          </div>
        )}
        {activeTab === 'positions'   && (
          <div className="space-y-6">
            <PositionTable onSelectPosition={setSelectedPosition} />
          </div>
        )}
        {activeTab === 'attribution' && (
          <div className="space-y-6">
            <AttributionCard />
          </div>
        )}
        {activeTab === 'history'     && <BlotterHistory />}
        {activeTab === 'export'      && <BlotterExportPanel />}
      </div>
    </div>
  );
};
