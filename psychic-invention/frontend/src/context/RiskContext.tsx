/**
 * RiskContext — shared state for Menu 3: Risk Management
 * Provides returns, weights, labels, VaR results, covariance health, MST data,
 * and Greeks positions to all Risk sub-panels.
 *
 * Data sources (in priority order):
 *   1. Live market data — fetched from /assets/history (yfinance or OpenBB)
 *   2. Demo data        — seeded 252×5 correlated synthetic returns
 *   3. Manual JSON      — user-pasted T×N matrix
 *
 * TRANSACT_APP_SPEC §3.3 (M1 L2 · M2 L2 · M7 L1–3)
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  postRiskVar,
  postRiskCovarianceHealth,
  postRiskMst,
  postRiskGreeksAggregate,
  getAssetHistory,
} from '@/utils/api';
import { useDataProvider } from '@/context/DataProviderContext';

// ── Seeded RNG for deterministic demo data ─────────────────────────────────
function makeLCG(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
function boxMuller(u1: number, u2: number) {
  return Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
}

function buildDemoReturns(): { returns: number[][]; weights: number[]; labels: string[] } {
  const T = 252; const N = 5;
  const labels = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
  const mu  = [0.00042, 0.00038, 0.00032, 0.00028, 0.00065];
  const sig = [0.0155,  0.0140,  0.0162,  0.0175,  0.0260 ];
  const L   = [
    [1.0,   0.0,   0.0,   0.0,   0.0 ],
    [0.720, 0.694, 0.0,   0.0,   0.0 ],
    [0.680, 0.388, 0.621, 0.0,   0.0 ],
    [0.620, 0.380, 0.310, 0.607, 0.0 ],
    [0.380, 0.130, 0.090, 0.050, 0.910],
  ];
  const rng = makeLCG(9_137_261);
  const returns: number[][] = [];
  for (let t = 0; t < T; t++) {
    const z = Array.from({ length: N }, () => boxMuller(rng(), rng()));
    const x = Array.from({ length: N }, (_, i) => L[i].reduce((a, lij, j) => a + lij * z[j], 0));
    returns.push(x.map((xi, i) => mu[i] + sig[i] * xi));
  }
  return { returns, weights: Array(N).fill(1 / N), labels };
}

const DEMO = buildDemoReturns();

// ── Types ──────────────────────────────────────────────────────────────────

export type DataSource = 'demo' | 'live' | 'manual';

export interface VaRData {
  var: Record<string, number>;
  es: Record<string, number>;
  confidence: number;
  horizon_days: number;
  portfolio_value: number;
  methods: string[];
}

export interface CovHealthData {
  condition_number: number;
  is_ill_conditioned: boolean;
  lw_shrinkage: number;
  oas_shrinkage: number;
  eigenvalues: number[];
  eigenvalue_fractions: number[];
  raw_correlation: number[][];
  lw_correlation: number[][];
  oas_correlation: number[][];
  distance_matrix: number[][];
  n_assets: number;
  n_obs: number;
}

export interface MSTData {
  nodes: { id: number; label: string }[];
  mst_edges: { from: number; to: number; correlation: number; distance: number }[];
  all_edges: { from: number; to: number; correlation: number; distance: number }[];
  total_mst_distance: number;
}

export interface GreeksPosition {
  asset: string;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  quantity: number;
  spot_price: number;
}

export interface GreeksResult {
  net_delta: number;
  net_gamma: number;
  net_vega: number;
  net_theta: number;
  delta_var: number;
  gamma_adjusted_var: number;
  gamma_adjusted_es: number;
  confidence: number;
  sigma_spot: number;
  positions: (GreeksPosition & { delta_var: number })[];
}

interface RiskContextValue {
  // ── Data ──────────────────────────────────────────────────────────────
  returns: number[][];
  weights: number[];
  labels: string[];
  dataSource: DataSource;
  dataFetchPeriod: string;
  setDataFetchPeriod: (p: string) => void;

  // Live data fetching
  fetchLiveData: (symbols: string[], period: string) => Promise<void>;
  fetchLoading: boolean;
  fetchError: string | null;

  // Manual override
  setReturns: (r: number[][]) => void;
  setWeights: (w: number[]) => void;
  setLabels: (l: string[]) => void;
  loadDemoData: () => void;

  // ── VaR Parameters ────────────────────────────────────────────────────
  alpha: number;
  setAlpha: (a: number) => void;
  horizonDays: number;
  setHorizonDays: (h: number) => void;
  portfolioValue: number;
  setPortfolioValue: (v: number) => void;

  // ── Greeks ────────────────────────────────────────────────────────────
  greeksPositions: GreeksPosition[];
  setGreeksPositions: (p: GreeksPosition[]) => void;
  sigmaSpot: number;
  setSigmaSpot: (s: number) => void;

  // ── Results ───────────────────────────────────────────────────────────
  varData: VaRData | null;
  covHealth: CovHealthData | null;
  mstData: MSTData | null;
  greeksResult: GreeksResult | null;

  // ── Actions ───────────────────────────────────────────────────────────
  computeVar: () => Promise<void>;
  computeCovHealth: () => Promise<void>;
  computeMst: () => Promise<void>;
  computeGreeks: () => Promise<void>;
  computeAll: () => Promise<void>;

  loading: { var: boolean; covHealth: boolean; mst: boolean; greeks: boolean };
  error: string | null;
}

// ── Context ────────────────────────────────────────────────────────────────
const ctx = createContext<RiskContextValue | null>(null);

// ── Log-return helper ──────────────────────────────────────────────────────
function computeLogReturns(priceMap: Record<string, number>, dates: string[]): number[] {
  return dates.slice(1).map((d, i) => Math.log(priceMap[d] / priceMap[dates[i]]));
}

// ── Provider ───────────────────────────────────────────────────────────────
export function RiskProvider({ children }: { children: ReactNode }) {
  const { dataProvider } = useDataProvider();
  // ── Data state ────────────────────────────────────────────────────────
  const [returns, setReturnsState]     = useState<number[][]>(DEMO.returns);
  const [weights, setWeightsState]     = useState<number[]>(DEMO.weights);
  const [labels, setLabelsState]       = useState<string[]>(DEMO.labels);
  const [dataSource, setDataSource]    = useState<DataSource>('demo');
  const [dataFetchPeriod, setDataFetchPeriod] = useState('1y');

  // Live fetch status
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError]     = useState<string | null>(null);

  // ── VaR parameters ────────────────────────────────────────────────────
  const [alpha, setAlpha]                   = useState(0.05);
  const [horizonDays, setHorizonDays]       = useState(1);
  const [portfolioValue, setPortfolioValue] = useState(1_000_000);

  // ── Greeks ────────────────────────────────────────────────────────────
  const [greeksPositions, setGreeksPositions] = useState<GreeksPosition[]>([]);
  const [sigmaSpot, setSigmaSpot]             = useState(0.01);

  // ── Compute results ───────────────────────────────────────────────────
  const [varData, setVarData]           = useState<VaRData | null>(null);
  const [covHealth, setCovHealth]       = useState<CovHealthData | null>(null);
  const [mstData, setMstData]           = useState<MSTData | null>(null);
  const [greeksResult, setGreeksResult] = useState<GreeksResult | null>(null);
  const [loading, setLoading]           = useState({ var: false, covHealth: false, mst: false, greeks: false });
  const [error, setError]               = useState<string | null>(null);

  // ── Live data fetch ────────────────────────────────────────────────────
  /**
   * Fetch daily OHLCV from /assets/history (yfinance) for each symbol,
   * align on common trading dates, compute daily log returns ln(P_t/P_{t-1}).
   * Mirrors the date-alignment logic in PortfolioContext.fetchData().
   */
  const fetchLiveData = useCallback(async (symbols: string[], period: string) => {
    if (symbols.length < 2) {
      setFetchError('Select at least 2 assets to build a portfolio.');
      return;
    }
    setFetchLoading(true);
    setFetchError(null);
    setVarData(null);
    setCovHealth(null);
    setMstData(null);

    try {
      // Fetch all histories in parallel; silently drop symbols that fail
      const histories = await Promise.all(
        symbols.map(sym => getAssetHistory(sym, period, dataProvider).catch(() => []))
      );

      // Build date → close maps per symbol
      const dateMaps = histories.map(hist =>
        Object.fromEntries(
          hist
            .filter(r => r.close != null)
            .map(r => [r.date, r.close as number])
        )
      );

      // Filter out symbols with no data
      const validIndices = symbols
        .map((_, i) => i)
        .filter(i => Object.keys(dateMaps[i]).length > 5);

      if (validIndices.length < 2) {
        throw new Error(
          `Too few valid symbols. Got data for: ${validIndices.map(i => symbols[i]).join(', ') || 'none'}. ` +
          'Check symbol spelling and try a shorter period.'
        );
      }

      const validSymbols  = validIndices.map(i => symbols[i]);
      const validDateMaps = validIndices.map(i => dateMaps[i]);

      // Common dates (inner join) across all valid symbols
      const allDateSets = validDateMaps.map(m => new Set(Object.keys(m)));
      const commonDates = [...allDateSets[0]]
        .filter(d => allDateSets.every(s => s.has(d)))
        .sort();

      if (commonDates.length < 20) {
        throw new Error(
          `Only ${commonDates.length} common trading days across selected symbols. ` +
          'Try a shorter period, fewer assets, or different symbols.'
        );
      }

      // Log returns: T-1 rows × N columns
      const assetReturnArrays = validDateMaps.map(m => computeLogReturns(m, commonDates));
      const T = assetReturnArrays[0].length;
      const N = validSymbols.length;
      const matrix: number[][] = Array.from({ length: T }, (_, t) =>
        Array.from({ length: N }, (_, n) => assetReturnArrays[n][t])
      );

      setReturnsState(matrix);
      setWeightsState(Array(N).fill(1 / N));
      setLabelsState(validSymbols);
      setDataSource('live');
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'Failed to fetch market data');
    } finally {
      setFetchLoading(false);
    }
  }, [dataProvider]);

  // ── Manual setters ────────────────────────────────────────────────────
  const setReturns = useCallback((r: number[][]) => {
    setReturnsState(r);
    setDataSource('manual');
    setVarData(null); setCovHealth(null); setMstData(null);
  }, []);

  const setWeights = useCallback((w: number[]) => {
    setWeightsState(w);
    setVarData(null);
  }, []);

  const setLabels = useCallback((l: string[]) => {
    setLabelsState(l);
    setMstData(null);
  }, []);

  const loadDemoData = useCallback(() => {
    setReturnsState(DEMO.returns);
    setWeightsState(DEMO.weights);
    setLabelsState(DEMO.labels);
    setDataSource('demo');
    setVarData(null); setCovHealth(null); setMstData(null);
    setError(null); setFetchError(null);
  }, []);

  // ── Compute analytics ─────────────────────────────────────────────────
  const computeVar = useCallback(async () => {
    setLoading(l => ({ ...l, var: true }));
    setError(null);
    try {
      const total = weights.reduce((s, w) => s + w, 0);
      const normW = total > 0 ? weights.map(w => w / total) : weights;
      const res = await postRiskVar({
        returns, weights: normW, alpha,
        horizon_days: horizonDays, portfolio_value: portfolioValue,
        include_monte_carlo: true, mc_simulations: 100_000,
      });
      setVarData(res as VaRData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'VaR computation failed');
    } finally {
      setLoading(l => ({ ...l, var: false }));
    }
  }, [returns, weights, alpha, horizonDays, portfolioValue]);

  const computeCovHealth = useCallback(async () => {
    setLoading(l => ({ ...l, covHealth: true }));
    setError(null);
    try {
      const res = await postRiskCovarianceHealth({ returns });
      setCovHealth(res as CovHealthData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Covariance health computation failed');
    } finally {
      setLoading(l => ({ ...l, covHealth: false }));
    }
  }, [returns]);

  const computeMst = useCallback(async () => {
    setLoading(l => ({ ...l, mst: true }));
    setError(null);
    try {
      const res = await postRiskMst({ returns, labels });
      setMstData(res as MSTData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'MST computation failed');
    } finally {
      setLoading(l => ({ ...l, mst: false }));
    }
  }, [returns, labels]);

  const computeGreeks = useCallback(async () => {
    if (greeksPositions.length === 0) {
      setError('Add at least one derivative position first.');
      return;
    }
    setLoading(l => ({ ...l, greeks: true }));
    setError(null);
    try {
      const res = await postRiskGreeksAggregate({ positions: greeksPositions, alpha, sigma_spot: sigmaSpot });
      setGreeksResult(res as GreeksResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Greeks aggregation failed');
    } finally {
      setLoading(l => ({ ...l, greeks: false }));
    }
  }, [greeksPositions, alpha, sigmaSpot]);

  const computeAll = useCallback(async () => {
    await Promise.allSettled([computeVar(), computeCovHealth(), computeMst()]);
  }, [computeVar, computeCovHealth, computeMst]);

  const value = useMemo<RiskContextValue>(() => ({
    returns, weights, labels, dataSource, dataFetchPeriod, setDataFetchPeriod,
    fetchLiveData, fetchLoading, fetchError,
    setReturns, setWeights, setLabels, loadDemoData,
    alpha, setAlpha, horizonDays, setHorizonDays, portfolioValue, setPortfolioValue,
    greeksPositions, setGreeksPositions, sigmaSpot, setSigmaSpot,
    varData, covHealth, mstData, greeksResult,
    computeVar, computeCovHealth, computeMst, computeGreeks, computeAll,
    loading, error,
  }), [
    returns, weights, labels, dataSource, dataFetchPeriod,
    fetchLiveData, fetchLoading, fetchError,
    setReturns, setWeights, setLabels, loadDemoData,
    alpha, horizonDays, portfolioValue,
    greeksPositions, sigmaSpot,
    varData, covHealth, mstData, greeksResult,
    computeVar, computeCovHealth, computeMst, computeGreeks, computeAll,
    loading, error,
  ]);

  return <ctx.Provider value={value}>{children}</ctx.Provider>;
}

export function useRisk() {
  const value = useContext(ctx);
  if (!value) throw new Error('useRisk must be used within RiskProvider');
  return value;
}
