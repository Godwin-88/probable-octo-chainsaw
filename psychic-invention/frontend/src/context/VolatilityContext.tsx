/**
 * VolatilityContext — shared state for Menu 5: Volatility Lab
 *
 * Live data (yfinance) is the ONLY data source — no demo data defaults.
 * One AssetSearchBar in the workspace shell fetches:
 *   - Price history → log-returns for rolling realised vol (HistImplied)
 *   - Option chain  → strikes/expiries/prices for Heston calibration + ATM IV
 *
 * All four sub-panels share this context.
 */
import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from 'react';
import {
  getAssetHistory,
  getAssetOptions,
  postVolHestonSurface,
  postVolHistorical,
  postVolFactorDecompose,
  postHestonCalibrate,
} from '@/utils/api';
import { useDataProvider } from '@/context/DataProviderContext';

// ── Option contract shape (from /assets/options/{symbol}) ────────────────────
export interface OptionContract {
  strike: number;
  expiry: number;       // years to expiry
  expiry_str: string;
  price: number;        // bid/ask mid-price
  implied_vol: number;  // yfinance-reported IV
  moneyness: number;    // K / S
}

// ── Result types ──────────────────────────────────────────────────────────────
export interface HestonSurfaceResult {
  moneyness: number[];
  expiries: number[];
  iv_grid: number[][];
  smile: { moneyness: number; iv: number }[];
  term_structure: { expiry: number; iv: number }[];
  feller_ok: boolean;
}

export interface HestonCalibResult {
  v0: number;
  kappa: number;
  theta: number;
  xi: number;
  rho: number;
  rmse: number;
  feller_condition_ok: boolean;
}

export interface HistVolResult {
  realized_vol: number[];
  full_period_vol: number;
  window: number;
  n_obs: number;
}

export interface VolDecompResult {
  systematic_vol: number;
  idiosyncratic_vol: number;
  total_vol: number;
  systematic_pct: number;
  idiosyncratic_pct: number;
  asset_betas: number[];
  asset_r_squared: number[];
  portfolio_beta: number;
}

export interface HestonParams {
  v0: number;
  kappa: number;
  theta: number;
  xi: number;
  rho: number;
  s: number;
  r: number;
}

// ── Context shape ─────────────────────────────────────────────────────────────
interface VolatilityContextType {
  // Primary loaded asset
  symbol: string;
  spot: number | null;
  returns: number[];
  prices: number[];
  dates: string[];
  optionChain: OptionContract[];
  atmIV: number | null;         // ATM implied vol from chain
  assetLoading: boolean;
  fetchAsset: (sym: string, period?: string) => Promise<void>;

  // Multi-asset (VolDecomp panel)
  multiSymbols: string[];
  multiReturns: number[][];
  multiLabels: string[];
  weights: number[];
  setWeights: (w: number[]) => void;
  fetchMultiAssets: (syms: string[], period?: string) => Promise<void>;
  multiLoading: boolean;

  // Heston surface (parametric)
  hestonParams: HestonParams;
  setHestonParams: (p: HestonParams) => void;
  surfaceResult: HestonSurfaceResult | null;
  surfaceLoading: boolean;
  computeSurface: () => Promise<void>;

  // Heston calibration
  calibResult: HestonCalibResult | null;
  calibLoading: boolean;
  calibrate: (strikes: number[], expiries: number[], prices: number[], spot: number, r: number) => Promise<void>;
  calibrateFromChain: () => Promise<void>;  // uses live optionChain

  // Rolling realised vol
  histVolResult: HistVolResult | null;
  histLoading: boolean;
  rollingWindow: number;
  setRollingWindow: (w: number) => void;
  computeHistVol: () => Promise<void>;

  // Factor decomp
  decompResult: VolDecompResult | null;
  decompLoading: boolean;
  computeDecomp: () => Promise<void>;

  error: string | null;
  clearError: () => void;
}

const VolatilityContext = createContext<VolatilityContextType | null>(null);

export function useVolatility() {
  const ctx = useContext(VolatilityContext);
  if (!ctx) throw new Error('useVolatility must be used inside VolatilityProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function VolatilityProvider({ children }: { children: ReactNode }) {
  const { dataProvider } = useDataProvider();
  // Primary asset
  const [symbol,      setSymbol]      = useState('');
  const [spot,        setSpot]        = useState<number | null>(null);
  const [returns,     setReturns]     = useState<number[]>([]);
  const [prices,      setPrices]      = useState<number[]>([]);
  const [dates,       setDates]       = useState<string[]>([]);
  const [optionChain, setOptionChain] = useState<OptionContract[]>([]);
  const [atmIV,       setAtmIV]       = useState<number | null>(null);
  const [assetLoading, setAssetLoading] = useState(false);

  // Multi-asset
  const [multiSymbols,  setMultiSymbols]  = useState<string[]>([]);
  const [multiReturns,  setMultiReturns]  = useState<number[][]>([]);
  const [multiLabels,   setMultiLabels]   = useState<string[]>([]);
  const [weights,       setWeights]       = useState<number[]>([]);
  const [multiLoading,  setMultiLoading]  = useState(false);

  // Heston surface
  const [hestonParams, setHestonParams] = useState<HestonParams>({
    v0: 0.04, kappa: 2.0, theta: 0.04, xi: 0.3, rho: -0.5, s: 100.0, r: 0.02,
  });
  const [surfaceResult,  setSurfaceResult]  = useState<HestonSurfaceResult | null>(null);
  const [surfaceLoading, setSurfaceLoading] = useState(false);

  // Calibration
  const [calibResult,  setCalibResult]  = useState<HestonCalibResult | null>(null);
  const [calibLoading, setCalibLoading] = useState(false);

  // Rolling vol
  const [histVolResult, setHistVolResult] = useState<HistVolResult | null>(null);
  const [histLoading,   setHistLoading]   = useState(false);
  const [rollingWindow, setRollingWindow] = useState(21);

  // Decomp
  const [decompResult,  setDecompResult]  = useState<VolDecompResult | null>(null);
  const [decompLoading, setDecompLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  // ── Fetch single asset: price history + option chain ─────────────────────
  const fetchAsset = useCallback(async (sym: string, period = '2y') => {
    setAssetLoading(true);
    setError(null);
    // Reset previous data
    setReturns([]); setPrices([]); setDates([]);
    setOptionChain([]); setAtmIV(null); setSpot(null);
    setHistVolResult(null); setCalibResult(null);

    try {
      // 1. Price history → log-returns
      const hist = await getAssetHistory(sym, period, dataProvider);
      const valid = hist.filter(d => d.close !== null);
      if (valid.length < 30) throw new Error(`Insufficient price history for ${sym} (${valid.length} bars)`);

      const closeArr = valid.map(d => d.close as number);
      const datesArr = valid.map(d => d.date);
      const rets     = closeArr.slice(1).map((c, i) => Math.log(c / closeArr[i]));
      const spotVal  = closeArr[closeArr.length - 1];

      setSymbol(sym);
      setSpot(spotVal);
      setReturns(rets);
      setPrices(closeArr);
      setDates(datesArr);

      // Update Heston param S with real spot
      setHestonParams(prev => ({ ...prev, s: Math.round(spotVal * 100) / 100 }));

      // 2. Option chain (may fail for ETFs/indices — non-fatal)
      try {
        const optData = await getAssetOptions(sym, 3, 0.20, dataProvider);
        const contracts = optData.contracts;
        setOptionChain(contracts);
        setSpot(optData.spot);

        // ATM IV: contract with moneyness closest to 1.0
        if (contracts.length > 0) {
          const atm = contracts.reduce((best, c) =>
            Math.abs(c.moneyness - 1) < Math.abs(best.moneyness - 1) ? c : best
          );
          setAtmIV(atm.implied_vol > 0 ? atm.implied_vol : null);
        }
      } catch {
        // Options unavailable (e.g. ETF, crypto) — silently continue
        setOptionChain([]);
        setAtmIV(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : `Failed to load ${sym}`);
    } finally {
      setAssetLoading(false);
    }
  }, [dataProvider]);

  // ── Fetch multi-asset ─────────────────────────────────────────────────────
  const fetchMultiAssets = useCallback(async (syms: string[], period = '1y') => {
    setMultiLoading(true);
    setError(null);
    try {
      const allHist = await Promise.all(syms.map(s => getAssetHistory(s, period, dataProvider)));

      // Align on common dates
      const dateSets = allHist.map(d =>
        new Set(d.filter(r => r.close !== null).map(r => r.date))
      );
      let common = [...dateSets[0]];
      for (let i = 1; i < dateSets.length; i++) {
        common = common.filter(d => dateSets[i].has(d));
      }
      common.sort();
      if (common.length < 30) throw new Error('Fewer than 30 common trading days across assets');

      const closeMaps = allHist.map(d => {
        const m: Record<string, number> = {};
        d.forEach(r => { if (r.close !== null) m[r.date] = r.close as number; });
        return m;
      });

      const T = common.length - 1;
      const N = syms.length;
      const retMatrix: number[][] = Array.from({ length: T }, (_, t) =>
        Array.from({ length: N }, (__, n) =>
          Math.log(closeMaps[n][common[t + 1]] / closeMaps[n][common[t]])
        )
      );

      setMultiSymbols(syms);
      setMultiReturns(retMatrix);
      setMultiLabels(syms);
      setWeights(syms.map(() => 1 / N));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch multi-asset data');
    } finally {
      setMultiLoading(false);
    }
  }, [dataProvider]);

  // ── Heston surface ────────────────────────────────────────────────────────
  const computeSurface = useCallback(async () => {
    setSurfaceLoading(true); setError(null);
    try {
      const res = await postVolHestonSurface(hestonParams);
      setSurfaceResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Surface computation failed');
    } finally {
      setSurfaceLoading(false);
    }
  }, [hestonParams]);

  // ── Heston calibration (manual input) ─────────────────────────────────────
  const calibrate = useCallback(async (
    strikes: number[], expiries: number[], mktPrices: number[], s: number, r: number
  ) => {
    setCalibLoading(true); setError(null);
    try {
      const res = await postHestonCalibrate({ s, r, strikes, expiries, market_prices: mktPrices });
      setCalibResult(res);
      // Auto-apply calibrated params to surface panel
      setHestonParams(prev => ({
        ...prev,
        v0: res.v0, kappa: res.kappa, theta: res.theta, xi: res.xi, rho: res.rho,
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Calibration failed');
    } finally {
      setCalibLoading(false);
    }
  }, []);

  // ── Calibrate directly from live option chain ─────────────────────────────
  const calibrateFromChain = useCallback(async () => {
    if (!optionChain.length) {
      setError('No option chain loaded — fetch an asset with options first'); return;
    }
    const s = spot ?? hestonParams.s;
    const r = hestonParams.r;
    await calibrate(
      optionChain.map(c => c.strike),
      optionChain.map(c => c.expiry),
      optionChain.map(c => c.price),
      s, r,
    );
  }, [optionChain, spot, hestonParams.r, hestonParams.s, calibrate]);

  // ── Rolling realised vol ──────────────────────────────────────────────────
  const computeHistVol = useCallback(async () => {
    if (returns.length < rollingWindow) {
      setError(`Need ≥${rollingWindow} return observations (have ${returns.length})`); return;
    }
    setHistLoading(true); setError(null);
    try {
      const res = await postVolHistorical({ returns, window: rollingWindow });
      setHistVolResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Realised vol computation failed');
    } finally {
      setHistLoading(false);
    }
  }, [returns, rollingWindow]);

  // ── Factor decomp ─────────────────────────────────────────────────────────
  const computeDecomp = useCallback(async () => {
    if (multiReturns.length < 10) {
      setError('Load multi-asset data first (Factor Decomp panel)'); return;
    }
    setDecompLoading(true); setError(null);
    try {
      const wSum = weights.reduce((s, w) => s + w, 0) || 1;
      const normW = weights.map(w => w / wSum);
      const res = await postVolFactorDecompose({ returns: multiReturns, weights: normW });
      setDecompResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Decomposition failed');
    } finally {
      setDecompLoading(false);
    }
  }, [multiReturns, weights]);

  return (
    <VolatilityContext.Provider value={{
      symbol, spot, returns, prices, dates, optionChain, atmIV, assetLoading, fetchAsset,
      multiSymbols, multiReturns, multiLabels, weights, setWeights, fetchMultiAssets, multiLoading,
      hestonParams, setHestonParams,
      surfaceResult, surfaceLoading, computeSurface,
      calibResult, calibLoading, calibrate, calibrateFromChain,
      histVolResult, histLoading, rollingWindow, setRollingWindow, computeHistVol,
      decompResult, decompLoading, computeDecomp,
      error, clearError,
    }}>
      {children}
    </VolatilityContext.Provider>
  );
}
