/**
 * OptimizerContext — shared state for Menu 4: Portfolio Optimizer
 * Provides returns, covariance, annualised μ, labels, and per-strategy results.
 *
 * Data sources: live (yfinance via /assets/history) | demo (seeded 252×5) | manual JSON
 * Annualisation: μ_ann = mean(r_daily) * 252 · Σ_ann = cov(R_daily) * 252
 *
 * TRANSACT_APP_SPEC §3.4 (M1 L4 · M3 L1–2 · M5 L1,L3 · M7 L4)
 */
import {
  createContext, useContext, useState, useCallback, useMemo, type ReactNode,
} from 'react';
import {
  postOptimizeMvoFrontier, postOptimizeMvo, postOptimizeBlm,
  postOptimizeRiskParity, postOptimizeHrp,
  postOptimizeKelly, postOptimizeKellySingle,
  getAssetHistory,
} from '@/utils/api';
import { useDataProvider } from '@/context/DataProviderContext';

// ── Seeded demo data (same LCG as RiskContext) ────────────────────────────────
function makeLCG(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}
function boxMuller(u1: number, u2: number) {
  return Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
}
function buildDemo(): { returns: number[][]; labels: string[] } {
  const T = 252; const N = 5;
  const labels = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
  const mu  = [0.00042, 0.00038, 0.00032, 0.00028, 0.00065];
  const sig = [0.0155,  0.0140,  0.0162,  0.0175,  0.0260];
  const L   = [[1,0,0,0,0],[0.72,0.694,0,0,0],[0.68,0.388,0.621,0,0],
               [0.62,0.38,0.31,0.607,0],[0.38,0.13,0.09,0.05,0.91]];
  const rng = makeLCG(9_137_261);
  const returns: number[][] = [];
  for (let t = 0; t < T; t++) {
    const z = Array.from({ length: N }, () => boxMuller(rng(), rng()));
    const x = Array.from({ length: N }, (_, i) => L[i].reduce((a, v, j) => a + v * z[j], 0));
    returns.push(x.map((xi, i) => mu[i] + sig[i] * xi));
  }
  return { returns, labels };
}
const DEMO = buildDemo();

// ── Log-return helper ─────────────────────────────────────────────────────────
function logReturns(priceMap: Record<string, number>, dates: string[]): number[] {
  return dates.slice(1).map((d, i) => Math.log(priceMap[d] / priceMap[dates[i]]));
}

// ── Covariance + mean from T×N matrix (annualised) ───────────────────────────
export function annualise(returns: number[][]): { mu: number[]; cov: number[][] } {
  const T = returns.length;
  const N = returns[0]?.length ?? 0;
  if (T < 2 || N === 0) return { mu: [], cov: [] };
  const mu = Array.from({ length: N }, (_, j) =>
    (returns.reduce((s, r) => s + r[j], 0) / T) * 252
  );
  const cov: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  for (let i = 0; i < N; i++) {
    for (let k = i; k < N; k++) {
      const mi = mu[i] / 252; const mk = mu[k] / 252;
      let s = 0;
      for (let t = 0; t < T; t++) s += (returns[t][i] - mi) * (returns[t][k] - mk);
      cov[i][k] = cov[k][i] = (s / (T - 1)) * 252;
    }
  }
  return { mu, cov };
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type DataSource = 'demo' | 'live' | 'manual';

export interface FrontierPoint {
  weights: number[]; expected_return: number; volatility: number; sharpe_ratio: number;
}
export interface MVOResult {
  frontier: FrontierPoint[];
  gmv: { weights: number[]; expected_return: number; volatility: number };
  tangency: { weights: number[]; expected_return: number; volatility: number };
  selected?: { weights: number[]; expected_return: number; volatility: number; sharpe_ratio: number };
}
export interface BLMResult {
  implied_returns: number[]; blm_returns: number[]; weights: number[];
  expected_return: number; volatility: number; sharpe_ratio: number;
}
export interface RPResult {
  weights: number[]; risk_contributions: number[]; volatility: number; method: string;
}
export interface HRPResult {
  weights: number[]; sort_order: number[]; linkage: number[][]; volatility: number;
}
export interface KellyMultiResult {
  weights: number[]; expected_growth: number; optimal_fraction: number; fractional_kelly: number;
}
export interface KellySingleResult {
  optimal_fraction: number;
  growth_curve: { f: number; growth: number }[];
}

interface OptimizerContextValue {
  // Data
  returns: number[][]; labels: string[];
  mu: number[]; cov: number[][];
  dataSource: DataSource;
  dataFetchPeriod: string; setDataFetchPeriod: (p: string) => void;
  fetchLiveData: (symbols: string[], period: string) => Promise<void>;
  fetchLoading: boolean; fetchError: string | null;
  setReturns: (r: number[][], labels?: string[]) => void;
  loadDemoData: () => void;
  // Params
  rfRate: number; setRfRate: (r: number) => void;
  longOnly: boolean; setLongOnly: (b: boolean) => void;
  // MVO
  mvoResult: MVOResult | null;
  computeMVO: () => Promise<void>;
  mvoLoading: boolean;
  // BLM
  blmResult: BLMResult | null;
  computeBLM: (marketWeights: number[], P: number[][], Q: number[], tau: number) => Promise<void>;
  blmLoading: boolean;
  // Risk Parity
  rpResult: RPResult | null;
  computeRP: (rho: number) => Promise<void>;
  rpLoading: boolean;
  // HRP
  hrpResult: HRPResult | null;
  computeHRP: () => Promise<void>;
  hrpLoading: boolean;
  // Kelly
  kellyResult: KellyMultiResult | null;
  computeKelly: (fractional: number) => Promise<void>;
  kellyLoading: boolean;
  // Shared error
  error: string | null;
}

const ctx = createContext<OptimizerContextValue | null>(null);

export function OptimizerProvider({ children }: { children: ReactNode }) {
  const { dataProvider } = useDataProvider();
  const [returns, setReturnsState] = useState<number[][]>(DEMO.returns);
  const [labels,  setLabelsState]  = useState<string[]>(DEMO.labels);
  const [dataSource, setDataSource] = useState<DataSource>('demo');
  const [dataFetchPeriod, setDataFetchPeriod] = useState('1y');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError,   setFetchError]   = useState<string | null>(null);

  const [rfRate,   setRfRate]   = useState(0.045);
  const [longOnly, setLongOnly] = useState(true);

  const [mvoResult,  setMvoResult]  = useState<MVOResult | null>(null);
  const [blmResult,  setBlmResult]  = useState<BLMResult | null>(null);
  const [rpResult,   setRpResult]   = useState<RPResult | null>(null);
  const [hrpResult,  setHrpResult]  = useState<HRPResult | null>(null);
  const [kellyResult,setKellyResult]= useState<KellyMultiResult | null>(null);

  const [mvoLoading,  setMvoLoading]  = useState(false);
  const [blmLoading,  setBlmLoading]  = useState(false);
  const [rpLoading,   setRpLoading]   = useState(false);
  const [hrpLoading,  setHrpLoading]  = useState(false);
  const [kellyLoading,setKellyLoading]= useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived annualised stats
  const { mu, cov } = useMemo(() => annualise(returns), [returns]);

  // ── Live data fetch ────────────────────────────────────────────────────────
  const fetchLiveData = useCallback(async (symbols: string[], period: string) => {
    if (symbols.length < 2) { setFetchError('Select at least 2 assets.'); return; }
    setFetchLoading(true); setFetchError(null);
    setMvoResult(null); setBlmResult(null); setRpResult(null); setHrpResult(null); setKellyResult(null);
    try {
      const histories = await Promise.all(symbols.map(s => getAssetHistory(s, period, dataProvider).catch(() => [])));
      const dateMaps = histories.map(h =>
        Object.fromEntries(h.filter(r => r.close != null).map(r => [r.date, r.close as number]))
      );
      const valid = symbols.map((_, i) => i).filter(i => Object.keys(dateMaps[i]).length > 5);
      if (valid.length < 2) throw new Error('Too few valid symbols — check spelling or try shorter period.');
      const vSyms = valid.map(i => symbols[i]);
      const vMaps = valid.map(i => dateMaps[i]);
      const sets  = vMaps.map(m => new Set(Object.keys(m)));
      const dates = [...sets[0]].filter(d => sets.every(s => s.has(d))).sort();
      if (dates.length < 20) throw new Error(`Only ${dates.length} common trading days. Try fewer assets or shorter period.`);
      const T = dates.length - 1; const N = vSyms.length;
      const arrs = vMaps.map(m => logReturns(m, dates));
      const matrix: number[][] = Array.from({ length: T }, (_, t) =>
        Array.from({ length: N }, (_, n) => arrs[n][t])
      );
      setReturnsState(matrix);
      setLabelsState(vSyms);
      setDataSource('live');
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'Fetch failed');
    } finally { setFetchLoading(false); }
  }, [dataProvider]);

  const setReturns = useCallback((r: number[][], lbs?: string[]) => {
    setReturnsState(r);
    if (lbs) setLabelsState(lbs);
    setDataSource('manual');
    setMvoResult(null); setBlmResult(null); setRpResult(null); setHrpResult(null); setKellyResult(null);
  }, []);

  const loadDemoData = useCallback(() => {
    setReturnsState(DEMO.returns); setLabelsState(DEMO.labels);
    setDataSource('demo');
    setMvoResult(null); setBlmResult(null); setRpResult(null); setHrpResult(null); setKellyResult(null);
    setError(null); setFetchError(null);
  }, []);

  // ── Compute helpers ────────────────────────────────────────────────────────
  const computeMVO = useCallback(async () => {
    if (cov.length === 0) { setError('No data loaded.'); return; }
    setMvoLoading(true); setError(null);
    try {
      const res = await postOptimizeMvoFrontier({ covariance: cov, expected_returns: mu, risk_free_rate: rfRate, n_points: 60, long_only: longOnly });
      setMvoResult(res as MVOResult);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'MVO failed'); }
    finally { setMvoLoading(false); }
  }, [cov, mu, rfRate, longOnly]);

  const computeBLM = useCallback(async (marketWeights: number[], P: number[][], Q: number[], tau: number) => {
    if (cov.length === 0) { setError('No data loaded.'); return; }
    setBlmLoading(true); setError(null);
    try {
      const res = await postOptimizeBlm({ covariance: cov, market_weights: marketWeights, P, Q, tau, risk_aversion: 2.5, risk_free_rate: rfRate, long_only: longOnly });
      setBlmResult(res as BLMResult);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'BLM failed'); }
    finally { setBlmLoading(false); }
  }, [cov, rfRate, longOnly]);

  const computeRP = useCallback(async (rho: number) => {
    if (cov.length === 0) { setError('No data loaded.'); return; }
    setRpLoading(true); setError(null);
    try {
      const res = await postOptimizeRiskParity({ covariance: cov, expected_returns: mu, rho, long_only: longOnly });
      setRpResult(res as RPResult);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Risk Parity failed'); }
    finally { setRpLoading(false); }
  }, [cov, mu, longOnly]);

  const computeHRP = useCallback(async () => {
    if (cov.length === 0) { setError('No data loaded.'); return; }
    setHrpLoading(true); setError(null);
    try {
      const res = await postOptimizeHrp({ covariance: cov });
      setHrpResult(res as HRPResult);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'HRP failed'); }
    finally { setHrpLoading(false); }
  }, [cov]);

  const computeKelly = useCallback(async (fractional: number) => {
    if (returns.length === 0) { setError('No data loaded.'); return; }
    setKellyLoading(true); setError(null);
    try {
      const res = await postOptimizeKelly({ returns, fractional, long_only: longOnly });
      setKellyResult(res as KellyMultiResult);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Kelly failed'); }
    finally { setKellyLoading(false); }
  }, [returns, longOnly]);

  const value = useMemo<OptimizerContextValue>(() => ({
    returns, labels, mu, cov, dataSource, dataFetchPeriod, setDataFetchPeriod,
    fetchLiveData, fetchLoading, fetchError, setReturns, loadDemoData,
    rfRate, setRfRate, longOnly, setLongOnly,
    mvoResult, computeMVO, mvoLoading,
    blmResult, computeBLM, blmLoading,
    rpResult, computeRP, rpLoading,
    hrpResult, computeHRP, hrpLoading,
    kellyResult, computeKelly, kellyLoading,
    error,
  }), [
    returns, labels, mu, cov, dataSource, dataFetchPeriod,
    fetchLiveData, fetchLoading, fetchError, setReturns, loadDemoData,
    rfRate, longOnly,
    mvoResult, computeMVO, mvoLoading,
    blmResult, computeBLM, blmLoading,
    rpResult, computeRP, rpLoading,
    hrpResult, computeHRP, hrpLoading,
    kellyResult, computeKelly, kellyLoading,
    error,
  ]);

  return <ctx.Provider value={value}>{children}</ctx.Provider>;
}

export function useOptimizer() {
  const v = useContext(ctx);
  if (!v) throw new Error('useOptimizer must be inside OptimizerProvider');
  return v;
}
