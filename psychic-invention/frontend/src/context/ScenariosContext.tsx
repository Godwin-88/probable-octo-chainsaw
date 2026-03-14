/**
 * ScenariosContext — shared state for Menu 7: Scenario Engine
 *
 * Live yfinance data only — no demo data defaults.
 * Shared DataSourcePanel at ScenariosWorkspace level loads:
 *   - N portfolio assets → T×N log-returns matrix
 *   - Equal weights default (user can adjust per panel)
 *
 * Sub-panels:
 *   - ScenarioDefinitionPanel  (custom shocks + historical)
 *   - ProbabilisticPanel       (M3 L4: PSO)
 *   - BehavioralPanel          (M4: Prospect Theory + herding VaR)
 *   - MonteCarloPanel          (M1 L2: path simulation)
 *   - CovStressPanel           (M7: correlation + vol stress)
 */
import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from 'react';
import {
  getAssetHistory,
  postScenariosRun,
  postScenariosProbabilistic,
  postScenariosMonteCarlo,
  postScenariosBehavioral,
} from '@/utils/api';
import { useDataProvider } from '@/context/DataProviderContext';

// ── Result types ──────────────────────────────────────────────────────────────

export interface ScenarioRunResult {
  stressed_portfolio_return: number;
  stressed_portfolio_variance: number;
  stressed_portfolio_volatility: number;
}

export interface ProbabilisticResult {
  weights: number[];
}

export interface MCResult {
  terminal_wealth_mean: number;
  terminal_wealth_std: number;
  var_95: number;
  var_99: number;
  cvar_95: number;
  cvar_99: number;
  percentiles: Record<string, number>;
}

export interface BehavioralResult {
  perceived_utility?: number;
  base_var_95?: number;
  base_var_99?: number;
  stressed_var_95?: number;
  stressed_var_99?: number;
  correlation_shift?: number;
}

// ── Context shape ──────────────────────────────────────────────────────────────
interface ScenariosContextType {
  // Data
  symbols: string[];
  returnMatrix: number[][];  // T×N
  labels: string[];
  weights: number[];          // N — equal default, overridable
  period: string;
  setPeriod: (p: string) => void;
  multiLoading: boolean;
  fetchMultiAssets: (syms: string[], period?: string) => Promise<void>;

  // Scenario Definition
  scenarioResult: ScenarioRunResult | null;
  scenarioLoading: boolean;
  computeScenario: (
    returnShocks?: number[],
    volShocks?: number[],
    corrShift?: number,
    historical?: string
  ) => Promise<void>;

  // Probabilistic (M3 L4)
  probResult: ProbabilisticResult | null;
  probLoading: boolean;
  computeProbabilistic: (
    scenarioReturns: number[][],
    scenarioProbs: number[],
    targetReturn: number,
    longOnly: boolean
  ) => Promise<void>;

  // Monte Carlo (M1 L2)
  mcResult: MCResult | null;
  mcLoading: boolean;
  computeMonteCarlo: (
    horizonDays: number,
    nPaths: number,
    useTDist: boolean,
    df: number,
    portfolioValue: number
  ) => Promise<void>;

  // Behavioral (M4)
  behavResult: BehavioralResult | null;
  behavLoading: boolean;
  computeBehavioral: (
    mode: 'prospect' | 'herding',
    corrShift?: number,
    alpha?: number,
    portfolioValue?: number
  ) => Promise<void>;

  error: string | null;
  clearError: () => void;
}

const ScenariosContext = createContext<ScenariosContextType | null>(null);

export const useScenariosContext = () => {
  const ctx = useContext(ScenariosContext);
  if (!ctx) throw new Error('useScenariosContext must be used inside ScenariosProvider');
  return ctx;
};

// ── Provider ───────────────────────────────────────────────────────────────────
export const ScenariosProvider = ({ children }: { children: ReactNode }) => {
  const { dataProvider } = useDataProvider();
  const [symbols, setSymbols]           = useState<string[]>([]);
  const [returnMatrix, setReturnMatrix] = useState<number[][]>([]);
  const [labels, setLabels]             = useState<string[]>([]);
  const [weights, setWeights]           = useState<number[]>([]);
  const [period, setPeriod]             = useState('1y');
  const [multiLoading, setMultiLoading] = useState(false);

  const [scenarioResult, setScenarioResult] = useState<ScenarioRunResult | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  const [probResult, setProbResult]   = useState<ProbabilisticResult | null>(null);
  const [probLoading, setProbLoading] = useState(false);

  const [mcResult, setMcResult]   = useState<MCResult | null>(null);
  const [mcLoading, setMcLoading] = useState(false);

  const [behavResult, setBehavResult]   = useState<BehavioralResult | null>(null);
  const [behavLoading, setBehavLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const clearError = () => setError(null);

  // ── Fetch multi-asset history from yfinance ─────────────────────────────────
  // getAssetHistory returns a direct array of {date, close, ...} (same as FactorContext)
  const fetchMultiAssets = useCallback(async (syms: string[], per?: string) => {
    if (syms.length < 2) return;
    setMultiLoading(true);
    setError(null);
    try {
      const usePeriod = per ?? period;
      const results = await Promise.all(
        syms.map(sym => getAssetHistory(sym, usePeriod, dataProvider))
      );

      // Find common dates (intersection) — filter out null closes
      const dateSets = results.map(r =>
        new Set(r.filter(h => h.close !== null).map(h => h.date))
      );
      const commonDates = [...dateSets[0]].filter(d => dateSets.every(s => s.has(d))).sort();

      const T = commonDates.length;
      if (T < 20) throw new Error('Too few common dates — try a longer period or check symbols');

      // Build price lookup maps then extract ordered price series
      const priceMatrix = results.map(r => {
        const byDate: Record<string, number> = {};
        r.forEach(h => { if (h.close !== null) byDate[h.date] = h.close as number; });
        return commonDates.map(d => byDate[d]);
      });

      // Log-returns: T-1 rows, N cols
      const logReturns: number[][] = [];
      for (let t = 1; t < T; t++) {
        logReturns.push(priceMatrix.map(prices => Math.log(prices[t] / prices[t - 1])));
      }

      const N = syms.length;
      setSymbols(syms);
      setLabels(syms);
      setReturnMatrix(logReturns);
      setWeights(Array(N).fill(1 / N));  // equal weight default
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Data fetch failed');
    } finally {
      setMultiLoading(false);
    }
  }, [period, dataProvider]);

  // ── Scenario Run ─────────────────────────────────────────────────────────────
  const computeScenario = useCallback(async (
    returnShocks?: number[],
    volShocks?: number[],
    corrShift?: number,
    historical?: string
  ) => {
    if (!returnMatrix.length) return;
    setScenarioLoading(true);
    setError(null);
    try {
      const res = await postScenariosRun({
        returns: returnMatrix,
        weights,
        return_shocks: returnShocks,
        vol_shocks: volShocks,
        corr_shift: corrShift ?? 0,
        historical,
      });
      setScenarioResult(res as ScenarioRunResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Scenario computation failed');
    } finally {
      setScenarioLoading(false);
    }
  }, [returnMatrix, weights]);

  // ── Probabilistic (M3 L4) ─────────────────────────────────────────────────
  const computeProbabilistic = useCallback(async (
    scenarioReturns: number[][],
    scenarioProbs: number[],
    targetReturn: number,
    longOnly: boolean
  ) => {
    setProbLoading(true);
    setError(null);
    try {
      const res = await postScenariosProbabilistic({
        scenario_returns: scenarioReturns,
        scenario_probs: scenarioProbs,
        target_return: targetReturn,
        long_only: longOnly,
      });
      setProbResult(res as ProbabilisticResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Probabilistic optimization failed');
    } finally {
      setProbLoading(false);
    }
  }, []);

  // ── Monte Carlo (M1 L2) ───────────────────────────────────────────────────
  const computeMonteCarlo = useCallback(async (
    horizonDays: number,
    nPaths: number,
    useTDist: boolean,
    df: number,
    portfolioValue: number
  ) => {
    if (!returnMatrix.length) return;
    setMcLoading(true);
    setError(null);
    try {
      const res = await postScenariosMonteCarlo({
        returns: returnMatrix,
        weights,
        portfolio_value: portfolioValue,
        horizon_days: horizonDays,
        n_paths: nPaths,
        use_t_dist: useTDist,
        df,
      });
      setMcResult(res as MCResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Monte Carlo simulation failed');
    } finally {
      setMcLoading(false);
    }
  }, [returnMatrix, weights]);

  // ── Behavioral (M4) ───────────────────────────────────────────────────────
  const computeBehavioral = useCallback(async (
    mode: 'prospect' | 'herding',
    corrShift = 0.3,
    alpha = 0.05,
    portfolioValue = 1.0
  ) => {
    if (!returnMatrix.length) return;
    setBehavLoading(true);
    setError(null);
    try {
      const res = await postScenariosBehavioral({
        returns: returnMatrix,
        weights,
        mode,
        correlation_shift: corrShift,
        alpha,
        portfolio_value: portfolioValue,
      });
      setBehavResult(res as BehavioralResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Behavioral simulation failed');
    } finally {
      setBehavLoading(false);
    }
  }, [returnMatrix, weights]);

  return (
    <ScenariosContext.Provider value={{
      symbols, returnMatrix, labels, weights, period, setPeriod,
      multiLoading, fetchMultiAssets,
      scenarioResult, scenarioLoading, computeScenario,
      probResult, probLoading, computeProbabilistic,
      mcResult, mcLoading, computeMonteCarlo,
      behavResult, behavLoading, computeBehavioral,
      error, clearError,
    }}>
      {children}
    </ScenariosContext.Provider>
  );
};
