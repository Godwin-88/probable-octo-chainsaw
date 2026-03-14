/**
 * FactorContext — shared state for Menu 6: Factor Lab
 *
 * Live data (yfinance) is the ONLY data source — no demo data defaults.
 * A shared AssetSearchBar at the top of the workspace fetches:
 *   - Multi-asset price history → T×N log-returns matrix
 *   - Benchmark (default SPY) → T×1 market returns (used as factor)
 *
 * All five sub-panels share this context:
 *   - Factor Model (OLS)
 *   - Fama-MacBeth
 *   - Smart Beta
 *   - Herding Risk
 *   - ML Factor Discovery (PCA)
 */
import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from 'react';
import {
  getAssetHistory,
  postFactorsEstimate,
  postFactorsFamaMacbeth,
  postFactorsSmartBeta,
  postFactorsCrowding,
  postFactorsPca,
} from '@/utils/api';
import { useDataProvider } from '@/context/DataProviderContext';

// ── Result types ──────────────────────────────────────────────────────────────

export interface FactorModelResult {
  alphas: number[];
  betas: number[][];   // N × K (including intercept)
  r_squared: number[];
  residual_var: number[];
}

export interface FamaMacBethResult {
  lambdas: number[];
  std_errors: number[];
  t_stats: number[];
  p_values: number[];
  betas: number[][];   // N × K
}

export interface SmartBetaResult {
  weights: number[];
  method: string;
  expected_return: number;
  volatility: number;
}

export interface CrowdingResult {
  crowding_index: number;
  level: string;
  avg_correlation: number;
}

export interface PCAResult {
  eigenvalues: number[];
  explained_variance_ratio: number[];
  cumulative_variance: number[];
  loadings: number[][];  // N × K
  n_components: number;
  components_for_80pct: number;
  total_n_assets: number;
}

// ── Context shape ──────────────────────────────────────────────────────────────
interface FactorContextType {
  // Multi-asset data
  symbols: string[];
  returnMatrix: number[][];  // T×N (row = time, col = asset)
  labels: string[];
  period: string;
  setPeriod: (p: string) => void;
  multiLoading: boolean;
  fetchMultiAssets: (syms: string[], benchmark: string, period?: string) => Promise<void>;

  // Benchmark
  benchmarkSymbol: string;
  benchmarkReturns: number[];

  // Weights (equal-weight default)
  weights: number[];
  setWeights: (w: number[]) => void;

  // Momentum scores (computed from price history: 12-1m return)
  momentumScores: number[];

  // nPcaComponents user-controlled
  nPcaComponents: number;
  setNPcaComponents: (n: number) => void;

  // Results
  factorModelResult: FactorModelResult | null;
  fmbResult: FamaMacBethResult | null;
  smartBetaResult: SmartBetaResult | null;
  crowdingResult: CrowdingResult | null;
  pcaResult: PCAResult | null;

  // Loading per panel
  factorLoading: boolean;
  fmbLoading: boolean;
  smartBetaLoading: boolean;
  crowdingLoading: boolean;
  pcaLoading: boolean;

  computeFactorModel: () => Promise<void>;
  computeFamaMacBeth: () => Promise<void>;
  computeSmartBeta: (method?: string) => Promise<void>;
  computeCrowding: () => Promise<void>;
  computePCA: () => Promise<void>;

  error: string | null;
  clearError: () => void;
}

const FactorContext = createContext<FactorContextType | null>(null);

export function useFactorContext() {
  const ctx = useContext(FactorContext);
  if (!ctx) throw new Error('useFactorContext must be used inside FactorProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function FactorProvider({ children }: { children: ReactNode }) {
  const { dataProvider } = useDataProvider();
  const [symbols,         setSymbols]         = useState<string[]>([]);
  const [returnMatrix,    setReturnMatrix]     = useState<number[][]>([]);
  const [labels,          setLabels]           = useState<string[]>([]);
  const [period,          setPeriod]           = useState('1y');
  const [multiLoading,    setMultiLoading]     = useState(false);

  const [benchmarkSymbol, setBenchmarkSymbol]  = useState('SPY');
  const [benchmarkReturns, setBenchmarkReturns] = useState<number[]>([]);

  const [weights,         setWeights]          = useState<number[]>([]);
  const [momentumScores,  setMomentumScores]   = useState<number[]>([]);
  const [nPcaComponents,  setNPcaComponents]   = useState(5);

  // Results
  const [factorModelResult, setFactorModelResult] = useState<FactorModelResult | null>(null);
  const [fmbResult,         setFmbResult]         = useState<FamaMacBethResult | null>(null);
  const [smartBetaResult,   setSmartBetaResult]   = useState<SmartBetaResult | null>(null);
  const [crowdingResult,    setCrowdingResult]     = useState<CrowdingResult | null>(null);
  const [pcaResult,         setPcaResult]         = useState<PCAResult | null>(null);

  // Loading states
  const [factorLoading,    setFactorLoading]    = useState(false);
  const [fmbLoading,       setFmbLoading]       = useState(false);
  const [smartBetaLoading, setSmartBetaLoading] = useState(false);
  const [crowdingLoading,  setCrowdingLoading]  = useState(false);
  const [pcaLoading,       setPcaLoading]       = useState(false);

  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  // ── Fetch multi-asset returns + benchmark ────────────────────────────────
  const fetchMultiAssets = useCallback(async (
    syms: string[], benchmark: string, per = '1y'
  ) => {
    if (syms.length < 2) {
      setError('Select at least 2 assets for factor analysis'); return;
    }
    setMultiLoading(true);
    setError(null);
    // Reset all results
    setFactorModelResult(null); setFmbResult(null);
    setSmartBetaResult(null);   setCrowdingResult(null);
    setPcaResult(null);

    try {
      const allSyms  = [...syms, benchmark];
      const allHist  = await Promise.all(allSyms.map(s => getAssetHistory(s, per, dataProvider)));

      // Align on common dates (intersection)
      const dateSets = allHist.map(d =>
        new Set(d.filter(r => r.close !== null).map(r => r.date))
      );
      let common = [...dateSets[0]];
      for (let i = 1; i < dateSets.length; i++) {
        common = common.filter(d => dateSets[i].has(d));
      }
      common.sort();
      if (common.length < 30)
        throw new Error('Fewer than 30 common trading days — try a longer period');

      const closeMaps = allHist.map(d => {
        const m: Record<string, number> = {};
        d.forEach(r => { if (r.close !== null) m[r.date] = r.close as number; });
        return m;
      });

      const T = common.length - 1;
      const N = syms.length;

      // T×N returns matrix for portfolio assets
      const retMatrix: number[][] = Array.from({ length: T }, (_, t) =>
        Array.from({ length: N }, (__, n) =>
          Math.log(closeMaps[n][common[t + 1]] / closeMaps[n][common[t]])
        )
      );

      // T×1 benchmark returns
      const benchIdx = allSyms.length - 1;
      const benchRets: number[] = Array.from({ length: T }, (_, t) =>
        Math.log(closeMaps[benchIdx][common[t + 1]] / closeMaps[benchIdx][common[t]])
      );

      // Momentum scores: 12-1m return (or full-period if < 252 days)
      // Using full available history of each asset
      const momScores = Array.from({ length: N }, (_, n) => {
        const closes = common.map(d => closeMaps[n][d]);
        const lookback = Math.max(1, closes.length - 22);  // skip last ~1 month
        const start    = Math.max(0, closes.length - 252); // ~12 months back
        if (closes[start] <= 0 || closes[lookback] <= 0) return 0;
        return Math.log(closes[lookback] / closes[start]);
      });

      setSymbols(syms);
      setReturnMatrix(retMatrix);
      setLabels(syms);
      setBenchmarkSymbol(benchmark);
      setBenchmarkReturns(benchRets);
      setWeights(syms.map(() => 1 / N));
      setMomentumScores(momScores);
      setPeriod(per);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch factor data');
    } finally {
      setMultiLoading(false);
    }
  }, [dataProvider]);

  // ── Helper: build factor matrix [intercept | benchmark] ─────────────────
  // Returns T×2 matrix (constant 1 + benchmark returns)
  const buildFactorMatrix = (): number[][] => {
    return benchmarkReturns.map(r => [1.0, r]);
  };

  // ── OLS factor model ─────────────────────────────────────────────────────
  const computeFactorModel = useCallback(async () => {
    if (returnMatrix.length < 10) {
      setError('Load multi-asset data first'); return;
    }
    setFactorLoading(true); setError(null);
    try {
      const factors = buildFactorMatrix();
      const res = await postFactorsEstimate({ returns: returnMatrix, factors });
      setFactorModelResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Factor model estimation failed');
    } finally {
      setFactorLoading(false);
    }
  }, [returnMatrix, benchmarkReturns]);

  // ── Fama-MacBeth ─────────────────────────────────────────────────────────
  const computeFamaMacBeth = useCallback(async () => {
    if (returnMatrix.length < 10) {
      setError('Load multi-asset data first'); return;
    }
    setFmbLoading(true); setError(null);
    try {
      // Use benchmark returns as the single factor (exclude intercept — FM adds its own)
      const factors = benchmarkReturns.map(r => [r]);
      const res = await postFactorsFamaMacbeth({ returns: returnMatrix, factors });
      setFmbResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fama-MacBeth regression failed');
    } finally {
      setFmbLoading(false);
    }
  }, [returnMatrix, benchmarkReturns]);

  // ── Smart Beta ───────────────────────────────────────────────────────────
  const computeSmartBeta = useCallback(async (method = 'quintile_sort') => {
    if (returnMatrix.length < 10 || momentumScores.length === 0) {
      setError('Load multi-asset data first'); return;
    }
    setSmartBetaLoading(true); setError(null);
    try {
      const res = await postFactorsSmartBeta({
        factor_scores: momentumScores,
        returns: returnMatrix,
        method,
      });
      setSmartBetaResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Smart beta computation failed');
    } finally {
      setSmartBetaLoading(false);
    }
  }, [returnMatrix, momentumScores]);

  // ── Herding/Crowding ─────────────────────────────────────────────────────
  const computeCrowding = useCallback(async () => {
    if (!factorModelResult || factorModelResult.betas.length === 0) {
      setError('Run Factor Model first to get asset betas'); return;
    }
    setCrowdingLoading(true); setError(null);
    try {
      // factor_loadings: N × K (betas excluding intercept column)
      const loadings = factorModelResult.betas.map(b => b.slice(1));
      const res = await postFactorsCrowding({ factor_loadings: loadings });
      setCrowdingResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Crowding analysis failed');
    } finally {
      setCrowdingLoading(false);
    }
  }, [factorModelResult]);

  // ── PCA latent factors ────────────────────────────────────────────────────
  const computePCA = useCallback(async () => {
    if (returnMatrix.length < 10) {
      setError('Load multi-asset data first'); return;
    }
    setPcaLoading(true); setError(null);
    try {
      const res = await postFactorsPca({ returns: returnMatrix, n_components: nPcaComponents });
      setPcaResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'PCA computation failed');
    } finally {
      setPcaLoading(false);
    }
  }, [returnMatrix, nPcaComponents]);

  return (
    <FactorContext.Provider value={{
      symbols, returnMatrix, labels, period, setPeriod, multiLoading, fetchMultiAssets,
      benchmarkSymbol, benchmarkReturns,
      weights, setWeights,
      momentumScores,
      nPcaComponents, setNPcaComponents,
      factorModelResult, fmbResult, smartBetaResult, crowdingResult, pcaResult,
      factorLoading, fmbLoading, smartBetaLoading, crowdingLoading, pcaLoading,
      computeFactorModel, computeFamaMacBeth, computeSmartBeta, computeCrowding, computePCA,
      error, clearError,
    }}>
      {children}
    </FactorContext.Provider>
  );
}
