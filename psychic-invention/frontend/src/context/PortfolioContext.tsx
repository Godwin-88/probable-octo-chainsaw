/**
 * PortfolioContext — shared state for Menu 2: Portfolio Analytics
 * Provides weights, historical returns, computed moments/performance,
 * and benchmark returns to all Portfolio sub-panels.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { getAssetHistory, postPortfolioMoments, postPortfolioPerformance } from '@/utils/api';
import { getV2UniverseSnapshot } from '@/api/gatewayV2';
import { useDataProvider } from '@/context/DataProviderContext';
import { useChain } from '@/context/ChainContext';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MomentsData {
  portfolio_return: number;
  portfolio_variance: number;
  portfolio_volatility: number;
  portfolio_beta: number;
  systematic_risk: number;
  non_systematic_risk: number;
  skewness: number;
  kurtosis_excess: number;
  asset_returns: number[];
  asset_volatilities: number[];
}

export interface PerformanceData {
  sharpe_ratio: number;
  treynor_ratio: number;
  sortino_ratio: number;
  m2_modigliani: number;
  m2_sortino: number;
  information_ratio: number;
  appraisal_ratio: number;
  alpha: number;
}

export type PortfolioStatus = 'idle' | 'fetching' | 'computing' | 'ready' | 'error';

export interface PortfolioAsset {
  symbol: string;
  name?: string;
  weight: number;
  currentPrice?: number;
  dayReturn?: number;
}

interface PortfolioContextValue {
  // Asset configuration
  assets: PortfolioAsset[];
  setAssets: (assets: PortfolioAsset[]) => void;
  updateWeight: (symbol: string, weight: number) => void;
  normalizeWeights: () => void;

  // Historical data
  returns: number[][] | null;        // T × N return matrix
  benchmarkReturns: number[] | null; // T-length benchmark returns
  period: string;
  setPeriod: (p: string) => void;
  benchmarkSymbol: string;
  setBenchmarkSymbol: (s: string) => void;

  // Computed analytics
  moments: MomentsData | null;
  performance: PerformanceData | null;

  // Status
  status: PortfolioStatus;
  error: string | null;

  // Actions
  fetchData: () => Promise<void>;
  computeAll: (rfRate?: number) => Promise<void>;
  reset: () => void;
}

// ── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_ASSETS: PortfolioAsset[] = [];

const ctx = createContext<PortfolioContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { dataProvider } = useDataProvider();
  const { chain } = useChain();
  const [assets, setAssetsState] = useState<PortfolioAsset[]>(DEFAULT_ASSETS);
  const [returns, setReturns] = useState<number[][] | null>(null);
  const [benchmarkReturns, setBenchmarkReturns] = useState<number[] | null>(null);
  const [period, setPeriod] = useState('6mo');
  const [benchmarkSymbol, setBenchmarkSymbolState] = useState('SPY');
  const [moments, setMoments] = useState<MomentsData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [status, setStatus] = useState<PortfolioStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const setAssets = useCallback((a: PortfolioAsset[]) => {
    setAssetsState(a);
    setReturns(null);
    setMoments(null);
    setPerformance(null);
    setStatus('idle');
  }, []);

  const updateWeight = useCallback((symbol: string, weight: number) => {
    setAssetsState(prev =>
      prev.map(a => a.symbol === symbol ? { ...a, weight: Math.max(0, weight) } : a)
    );
  }, []);

  const normalizeWeights = useCallback(() => {
    setAssetsState(prev => {
      const total = prev.reduce((s, a) => s + a.weight, 0);
      if (total <= 0) return prev;
      return prev.map(a => ({ ...a, weight: a.weight / total }));
    });
  }, []);

  const setBenchmarkSymbol = useCallback((s: string) => {
    setBenchmarkSymbolState(s);
    setBenchmarkReturns(null);
    setPerformance(null);
  }, []);

  /**
   * Fetch historical returns for all assets + benchmark.
   * When a chain is selected, also fetches /v2/universe/snapshot for current prices (chain-driven data).
   * History uses legacy provider (yfinance) for series; snapshot provides on-chain prices.
   */
  const fetchData = useCallback(async () => {
    if (assets.length === 0) return;
    setStatus('fetching');
    setError(null);
    try {
      const allSymbols = [...assets.map(a => a.symbol), benchmarkSymbol];

      // Optional: fetch on-chain prices for selected chain (Data Universe)
      if (chain) {
        try {
          const snap = await getV2UniverseSnapshot({
            chains: [chain],
            assets: allSymbols,
            quote: 'USDT',
            include: ['tokens', 'prices'],
          });
          if (snap.prices?.length) {
            const priceByPair: Record<string, number> = {};
            for (const p of snap.prices) {
              if (p.price != null && p.pair) priceByPair[p.pair] = p.price;
            }
            setAssetsState((prev) =>
              prev.map((a) => {
                const pair = `${a.symbol}-USDT`;
                const price = priceByPair[pair] ?? priceByPair[`${a.symbol}-USD`];
                return price != null ? { ...a, currentPrice: price } : a;
              })
            );
          }
        } catch {
          // Snapshot optional; continue with history
        }
      }

      // Fetch asset and benchmark histories (legacy API for series)
      const histories = await Promise.all(
        allSymbols.map(sym =>
          getAssetHistory(sym, period, dataProvider).catch(() => [])
        )
      );

      const assetHistories = histories.slice(0, assets.length);
      const benchHistory = histories[assets.length];

      // Build date→close maps per asset
      const dateMaps = assetHistories.map(hist =>
        Object.fromEntries(
          hist
            .filter(r => r.close != null)
            .map(r => [r.date, r.close as number])
        )
      );
      const benchMap: Record<string, number> = Object.fromEntries(
        benchHistory
          .filter(r => r.close != null)
          .map(r => [r.date, r.close as number])
      );

      // Find common dates across all assets + benchmark
      const allDateSets = [...dateMaps, benchMap].map(m => new Set(Object.keys(m)));
      const commonDates = [...allDateSets[0]].filter(d =>
        allDateSets.every(s => s.has(d))
      ).sort();

      if (commonDates.length < 10) {
        throw new Error(
          `Insufficient overlapping data: only ${commonDates.length} common dates. Try a shorter period or different assets.`
        );
      }

      // Compute daily log returns: ln(P_t / P_{t-1})
      const computeLogReturns = (priceMap: Record<string, number>, dates: string[]) =>
        dates.slice(1).map((d, i) => Math.log(priceMap[d] / priceMap[dates[i]]));

      const assetReturnArrays = dateMaps.map(m => computeLogReturns(m, commonDates));
      const benchReturnArray = computeLogReturns(benchMap, commonDates);

      // Build T × N matrix (rows = days, cols = assets)
      const T = assetReturnArrays[0].length;
      const N = assets.length;
      const matrix: number[][] = Array.from({ length: T }, (_, t) =>
        Array.from({ length: N }, (_, n) => assetReturnArrays[n][t])
      );

      setReturns(matrix);
      setBenchmarkReturns(benchReturnArray);
      setStatus('idle');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch market data';
      setError(msg);
      setStatus('error');
    }
  }, [assets, benchmarkSymbol, period, dataProvider, chain]);

  /**
   * Compute all portfolio analytics using existing returns.
   */
  const computeAll = useCallback(async (rfRate = 0.0) => {
    if (!returns) {
      setError('Fetch market data first before computing analytics.');
      return;
    }
    setStatus('computing');
    setError(null);
    try {
      const weights = assets.map(a => a.weight);
      const weightSum = weights.reduce((s, w) => s + w, 0);
      const normWeights = weightSum > 0 ? weights.map(w => w / weightSum) : weights;

      // Compute portfolio returns (T-vector) for performance metrics
      const portReturns = returns.map(row =>
        row.reduce((s, r, i) => s + r * normWeights[i], 0)
      );

      const [momRes, perfRes] = await Promise.all([
        postPortfolioMoments({
          returns,
          weights: normWeights,
          market_returns: benchmarkReturns ?? undefined,
        }),
        postPortfolioPerformance({
          portfolio_returns: portReturns,
          risk_free_rate: rfRate,
          portfolio_beta: 1.0, // placeholder; moments provides actual beta
          benchmark_returns: benchmarkReturns ?? undefined,
        }),
      ]);

      setMoments(momRes as MomentsData);
      setPerformance(perfRes as PerformanceData);
      setStatus('ready');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Computation failed';
      setError(msg);
      setStatus('error');
    }
  }, [returns, assets, benchmarkReturns]);

  const reset = useCallback(() => {
    setAssetsState(DEFAULT_ASSETS);
    setReturns(null);
    setBenchmarkReturns(null);
    setMoments(null);
    setPerformance(null);
    setStatus('idle');
    setError(null);
  }, []);

  return (
    <ctx.Provider
      value={{
        assets,
        setAssets,
        updateWeight,
        normalizeWeights,
        returns,
        benchmarkReturns,
        period,
        setPeriod,
        benchmarkSymbol,
        setBenchmarkSymbol,
        moments,
        performance,
        status,
        error,
        fetchData,
        computeAll,
        reset,
      }}
    >
      {children}
    </ctx.Provider>
  );
}

export function usePortfolio() {
  const value = useContext(ctx);
  if (!value) throw new Error('usePortfolio must be used within PortfolioProvider');
  return value;
}
