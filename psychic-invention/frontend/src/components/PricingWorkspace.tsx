/**
 * PricingWorkspace — Multi-Model Derivatives Pricer (Menu 1 · DPE)
 *
 * Live market data:
 *   S ← getAssetQuote(symbol)               (spot price, live)
 *   σ ← getAssetOptions(symbol) nearest ATM  (implied vol, live)
 *
 * Models (all priced in parallel):
 *   Black-Scholes   POST /price/{call|put}/bs            analytical
 *   FFT-Optimized   POST /price/{call|put}/fft-optimized  Carr-Madan auto-α
 *   Heston SV       POST /price/{call|put}/heston         stochastic vol
 *
 * Model agreement: flag |FFT−BS|/BS > 1% or |Heston−BS|/BS > 5%
 * Greeks: client-side BS (Δ, Γ, Θ, ν, ρ) — no extra request needed
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { MathBlock, MathInline } from '@/components/ui/Math';
import { useAgentContext, DEFAULT_SUGGESTED_QUESTIONS } from '@/context/AgentContext';
import {
  priceCallBS, pricePutBS,
  priceCallFFTOpt, pricePutFFTOpt,
  priceCallHeston, pricePutHeston,
  getAssetQuote, getAssetOptions,
} from '@/utils/api';
import { useDataProvider } from '@/context/DataProviderContext';
import { computeCallGreeks, computePutGreeks } from '@/utils/greeks';
import type { OptionRequest } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────
interface HestonParams { v0: number; kappa: number; theta: number; sigma_v: number; rho: number }
interface ModelResult { call: number; put: number; label: string; tag: string; color: string }

const DEFAULT_BS: OptionRequest   = { s: 100, k: 100, tau: 0.25, r: 0.05, sigma: 0.20 };
const DEFAULT_H: HestonParams     = { v0: 0.04, kappa: 2.0, theta: 0.04, sigma_v: 0.30, rho: -0.70 };

// ── Helpers ───────────────────────────────────────────────────────────────────
const fellerOK = (h: HestonParams) => 2 * h.kappa * h.theta > h.sigma_v ** 2;

function pctDiff(a: number, b: number) { return Math.abs(a - b) / Math.max(Math.abs(a), 1e-8) * 100; }

const NUM_FLD: { key: keyof OptionRequest; label: string; step: number; min: number }[] = [
  { key: 's',     label: 'S  (Spot)',      step: 0.01,  min: 0.01  },
  { key: 'k',     label: 'K  (Strike)',    step: 0.01,  min: 0.01  },
  { key: 'tau',   label: 'τ  (Years)',     step: 0.01,  min: 0.001 },
  { key: 'r',     label: 'r  (Rate)',      step: 0.001, min: 0     },
  { key: 'sigma', label: 'σ  (Vol)',       step: 0.01,  min: 0.01  },
];

const H_FLD: { key: keyof HestonParams; label: string; step: number; min: number; max?: number }[] = [
  { key: 'v0',      label: 'v₀  (init var)',  step: 0.001, min: 0.001 },
  { key: 'kappa',   label: 'κ  (mean rev)',   step: 0.1,   min: 0.01  },
  { key: 'theta',   label: 'θ  (long var)',   step: 0.001, min: 0.001 },
  { key: 'sigma_v', label: 'ξ  (vol-of-vol)', step: 0.01,  min: 0.01  },
  { key: 'rho',     label: 'ρ  (corr)',       step: 0.01,  min: -0.99, max: 0.99 },
];

// ── Component ─────────────────────────────────────────────────────────────────
export const PricingWorkspace = ({ defaultTab: _tab = 'bs' }: { defaultTab?: string }) => {
  const { dataProvider } = useDataProvider();
  const { setWorkspaceContext } = useAgentContext();

  const [symbol,       setSymbol]       = useState('');
  const [quoteInfo,    setQuoteInfo]    = useState<{ spot: number; name: string } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [params,    setParams]    = useState<OptionRequest>(DEFAULT_BS);
  const [heston,    setHeston]    = useState<HestonParams>(DEFAULT_H);
  const [optType,   setOptType]   = useState<'call' | 'put'>('call');
  const [showH,     setShowH]     = useState(false);

  const [results,   setResults]   = useState<ModelResult[] | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ── Live asset fetch ────────────────────────────────────────────────────────
  const loadAsset = useCallback(async (sym: string) => {
    if (!sym) return;
    setQuoteLoading(true);
    setError(null);
    try {
      const [quote, opts] = await Promise.all([
        getAssetQuote(sym),
        getAssetOptions(sym, 2, 0.20).catch(() => null),
      ]);
      setQuoteInfo({ spot: quote.spot, name: quote.name });
      const spot = quote.spot;
      let iv = params.sigma;
      if (opts?.contracts?.length) {
        const atm = opts.contracts.reduce((b, c) =>
          Math.abs(c.moneyness) < Math.abs(b.moneyness) ? c : b
        );
        if (atm.implied_vol > 0.01 && atm.implied_vol < 5) iv = Math.round(atm.implied_vol * 100) / 100;
      }
      setParams(prev => ({ ...prev, s: spot, k: Math.round(spot), sigma: iv }));
      setHeston(prev => ({ ...prev, v0: Math.round(iv ** 2 * 1000) / 1000, theta: Math.round(iv ** 2 * 1000) / 1000 }));
    } catch { setError(`Could not load quote for ${sym}. Check symbol.`); }
    finally { setQuoteLoading(false); }
  }, [params.sigma, dataProvider]);

  // ── Price all models ────────────────────────────────────────────────────────
  const priceAll = useCallback(async () => {
    if (params.s <= 0 || params.k <= 0 || params.tau <= 0 || params.sigma <= 0) {
      setError('S, K, τ, σ must all be positive'); return;
    }
    setLoading(true); setError(null); setResults(null);
    try {
      const feller = fellerOK(heston);
      const calls = [
        priceCallBS(params),
        pricePutBS(params),
        priceCallFFTOpt(params),
        pricePutFFTOpt(params),
        feller ? priceCallHeston({ ...params, ...heston }) : Promise.resolve(null),
        feller ? pricePutHeston({ ...params, ...heston })  : Promise.resolve(null),
      ];
      const [bsC, bsP, fftC, fftP, hC, hP] = await Promise.all(calls);

      const models: ModelResult[] = [
        { call: (bsC as { price: number }).price,  put: (bsP as { price: number }).price,  label: 'Black-Scholes',      tag: 'Analytical · Closed-form',    color: 'blue'   },
        { call: (fftC as { price: number }).price, put: (fftP as { price: number }).price, label: 'FFT (Carr-Madan)',    tag: 'Numerical · Auto-optimised',  color: 'violet' },
      ];
      if (hC && hP) {
        models.push({ call: (hC as { price: number }).price, put: (hP as { price: number }).price, label: 'Heston SV', tag: 'Stochastic vol · 5-param', color: 'rose' });
      } else if (!feller) {
        setError(`Feller condition violated: 2κθ ≤ ξ² (${(2*heston.kappa*heston.theta).toFixed(4)} ≤ ${(heston.sigma_v**2).toFixed(4)}). Heston skipped.`);
      }
      setResults(models);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Pricing failed');
    } finally { setLoading(false); }
  }, [params, heston]);

  // ── Greeks (client-side BS) ─────────────────────────────────────────────────
  const greeks = useMemo(() => {
    if (params.s <= 0 || params.k <= 0 || params.tau <= 0 || params.sigma <= 0) return null;
    return optType === 'call' ? computeCallGreeks(params) : computePutGreeks(params);
  }, [params, optType]);

  // ── Model agreement ─────────────────────────────────────────────────────────
  const agreements = useMemo(() => {
    if (!results || results.length < 2) return [];
    const bs = results[0];
    const ref = optType === 'call' ? bs.call : bs.put;
    return results.slice(1).map(m => ({
      label: m.label,
      pct: pctDiff(ref, optType === 'call' ? m.call : m.put),
      threshold: m.label.includes('Heston') ? 5 : 1,
    }));
  }, [results, optType]);

  // ── Sync computed results to AgentContext ────────────────────────────────────
  useEffect(() => {
    const rawData: Record<string, unknown> = {
      option_type: optType,
      parameters: {
        spot_S: params.s,
        strike_K: params.k,
        time_to_maturity_tau_years: params.tau,
        risk_free_rate_r: params.r,
        bs_volatility_sigma: params.sigma,
      },
      heston_parameters: {
        v0_initial_variance: heston.v0,
        kappa_mean_reversion: heston.kappa,
        theta_long_run_variance: heston.theta,
        xi_vol_of_vol: heston.sigma_v,
        rho_spot_vol_correlation: heston.rho,
        feller_condition_satisfied: fellerOK(heston),
        feller_check: `2κθ=${(2*heston.kappa*heston.theta).toFixed(4)} vs ξ²=${(heston.sigma_v**2).toFixed(4)}`,
      },
    };

    const metrics: Record<string, string | number | null> = {
      'S (Spot)': params.s,
      'K (Strike)': params.k,
      'τ (Years)': params.tau,
      'σ (Vol)': `${(params.sigma * 100).toFixed(1)}%`,
      'r (Rate)': `${(params.r * 100).toFixed(2)}%`,
    };

    if (quoteInfo) {
      rawData.live_asset = { symbol, name: quoteInfo.name, live_spot: quoteInfo.spot };
    }

    if (results) {
      rawData.model_prices = results.map(m => ({
        model: m.label,
        call_price: +m.call.toFixed(4),
        put_price: +m.put.toFixed(4),
        put_call_parity_error: +(Math.abs(m.call - m.put - (params.s - params.k * Math.exp(-params.r * params.tau)))).toFixed(6),
      }));
      results.forEach(m => {
        metrics[`${m.label} ${optType}`] = (optType === 'call' ? m.call : m.put).toFixed(4);
      });
      if (results.length >= 2) {
        const bs = optType === 'call' ? results[0].call : results[0].put;
        const fft = optType === 'call' ? results[1].call : results[1].put;
        rawData.model_agreement = {
          fft_vs_bs_pct_deviation: +((Math.abs(fft - bs) / Math.max(Math.abs(bs), 1e-8)) * 100).toFixed(3),
          ...(results[2] ? {
            heston_vs_bs_pct_deviation: +((Math.abs((optType === 'call' ? results[2].call : results[2].put) - bs) / Math.max(Math.abs(bs), 1e-8)) * 100).toFixed(3),
          } : {}),
        };
      }
    }

    if (greeks) {
      rawData.greeks_bs = {
        delta: +greeks.delta.toFixed(4),
        gamma: +greeks.gamma.toFixed(4),
        theta_per_day: +greeks.theta.toFixed(4),
        vega_per_1pct_vol: +(greeks.vega / 100).toFixed(4),
        rho: +greeks.rho.toFixed(4),
      };
      metrics['Δ Delta'] = greeks.delta.toFixed(4);
      metrics['ν Vega'] = greeks.vega.toFixed(4);
      metrics['Γ Gamma'] = greeks.gamma.toFixed(4);
    }

    const bsPrice = results ? (optType === 'call' ? results[0].call : results[0].put) : null;
    setWorkspaceContext({
      menuId: 'pricer',
      summary: results
        ? `${symbol || 'Option'} ${optType.toUpperCase()} · S=${params.s} K=${params.k} τ=${params.tau}y σ=${(params.sigma*100).toFixed(0)}% · BS=${bsPrice?.toFixed(4) ?? 'N/A'}`
        : `${symbol || 'Option'} ${optType} — S=${params.s} K=${params.k} τ=${params.tau}y σ=${(params.sigma*100).toFixed(0)}% — run pricing to compute`,
      metrics,
      rawData,
      suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS.pricer,
    });
  }, [results, greeks, params, heston, optType, symbol, quoteInfo, setWorkspaceContext]);

  // ── Input helper ────────────────────────────────────────────────────────────
  const inp = (
    v: number, onChange: (n: number) => void,
    step = 0.01, min = 0, max?: number
  ) => (
    <input type="number" value={v} step={step} min={min} max={max}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
    />
  );

  return (
    <div className="space-y-5">

      {/* ── Live Asset Strip ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-blue-800/40 bg-blue-900/5 p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-200">Live Asset</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text" placeholder="Symbol (AAPL, TSLA, SPY, EURUSD…)"
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && loadAsset(symbol)}
            className="flex-1 min-w-[200px] rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
          />
          <button onClick={() => loadAsset(symbol)} disabled={!symbol || quoteLoading}
            className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-40 transition">
            {quoteLoading ? 'Loading…' : 'Load Quote'}
          </button>
          {quoteInfo && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-400 truncate max-w-[180px]">{quoteInfo.name}</span>
              <span className="font-mono text-blue-300 font-semibold">${quoteInfo.spot.toFixed(2)}</span>
              <span className="text-xs text-slate-500">σ={params.sigma.toFixed(2)} (ATM IV)</span>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-600">Enter symbol → auto-fills S from live quote and σ from nearest ATM implied vol.</p>
      </div>

      {/* ── Parameters Panel ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">Option Parameters</p>
          <div className="flex gap-1">
            {(['call', 'put'] as const).map(t => (
              <button key={t} onClick={() => setOptType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition capitalize ${optType === t ? (t === 'call' ? 'bg-blue-700 text-white' : 'bg-amber-700 text-white') : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {NUM_FLD.map(({ key, label, step, min }) => (
            <div key={key}>
              <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</label>
              {inp(params[key], v => setParams(p => ({ ...p, [key]: v })), step, min)}
            </div>
          ))}
        </div>

        {/* Heston params */}
        <button onClick={() => setShowH(v => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition">
          <span>{showH ? '▾' : '▸'}</span>
          <span>Heston Parameters (v₀, κ, θ, ξ, ρ)</span>
          {!fellerOK(heston) && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-900/40 text-amber-400 border border-amber-700/40">
              ⚠ Feller: 2κθ &lt; ξ²
            </span>
          )}
        </button>

        {showH && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-800">
            {H_FLD.map(({ key, label, step, min, max }) => (
              <div key={key}>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                {inp(heston[key], v => setHeston(h => ({ ...h, [key]: v })), step, min, max)}
              </div>
            ))}
          </div>
        )}

        <button onClick={priceAll} disabled={loading}
          className="w-full py-2.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-40 transition flex items-center justify-center gap-2">
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          )}
          {loading ? 'Pricing all models…' : 'Price All Models  ·  BS  ·  FFT  ·  Heston'}
        </button>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>

      {/* ── Model Result Cards ────────────────────────────────────────────── */}
      {results && (
        <div className={`grid gap-4 ${results.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {results.map(m => {
            const price = optType === 'call' ? m.call : m.put;
            const other = optType === 'call' ? m.put  : m.call;
            const parity = params.s - params.k * Math.exp(-params.r * params.tau);
            return (
              <div key={m.label}
                className={`rounded-xl border border-${m.color}-800/40 bg-${m.color}-900/5 p-4 space-y-3`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-200">{m.label}</p>
                  <span className={`text-[10px] text-${m.color}-300 border border-${m.color}-700/40 rounded px-1.5 py-0.5 whitespace-nowrap`}>
                    {m.tag}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Call</p>
                    <p className="text-2xl font-mono text-white">${m.call.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Put</p>
                    <p className="text-2xl font-mono text-white">${m.put.toFixed(4)}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
                  <p className="text-slate-500">
                    {optType === 'call' ? 'Put' : 'Call'} price: <span className="font-mono text-slate-300">${other.toFixed(4)}</span>
                  </p>
                  <p className="text-slate-500">
                    Parity C−P: <span className="font-mono text-slate-300">{(m.call - m.put).toFixed(4)}</span>
                    {' '}vs S−Ke⁻ʳᵗ: <span className="font-mono text-slate-300">{parity.toFixed(4)}</span>
                    {' '}<span className={Math.abs(m.call - m.put - parity) < 0.01 ? 'text-green-400' : 'text-amber-400'}>
                      {Math.abs(m.call - m.put - parity) < 0.01 ? '✓' : '≈'}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Model Agreement ──────────────────────────────────────────────── */}
      {results && agreements.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Model Agreement  vs  Black-Scholes
          </p>
          <div className="flex flex-wrap gap-5">
            {agreements.map(a => (
              <div key={a.label} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${a.pct < a.threshold ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-sm text-slate-300">
                  {a.label} deviation:
                  <span className={`font-mono ml-1 ${a.pct < a.threshold ? 'text-green-400' : 'text-amber-400'}`}>
                    {a.pct.toFixed(3)}%
                  </span>
                  <span className="ml-1 text-slate-500 text-xs">
                    {a.pct < a.threshold ? '✓ agree' : `⚠ >${a.threshold}%`}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-2">
            Thresholds: FFT vs BS &lt;1% | Heston vs BS &lt;5% (vol-smile skew expected for Heston)
          </p>
        </div>
      )}

      {/* ── Greeks (BS · client-side) ─────────────────────────────────────── */}
      {greeks && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Greeks  ·  BS {optType}  ·  S={params.s}  K={params.k}  τ={params.tau}  σ={params.sigma}
          </p>
          <div className="grid grid-cols-5 gap-3 text-center">
            {([
              ['Δ  Delta',  greeks.delta,  'text-blue-400'],
              ['Γ  Gamma',  greeks.gamma,  'text-violet-400'],
              ['Θ  Theta',  greeks.theta,  'text-amber-400'],
              ['ν  Vega',   greeks.vega,   'text-green-400'],
              ['ρ  Rho',    greeks.rho,    'text-rose-400'],
            ] as [string, number, string][]).map(([lbl, val, cls]) => (
              <div key={lbl} className="rounded-lg bg-slate-800/50 border border-slate-700 p-2">
                <p className="text-[10px] text-slate-500 mb-1">{lbl}</p>
                <p className={`font-mono text-sm ${cls}`}>{val.toFixed(4)}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 px-3 py-2.5 rounded-lg bg-slate-900/50 border border-slate-800 overflow-x-auto">
            <MathBlock latex="\Delta = N(d_1) \quad \Gamma = \frac{N'(d_1)}{S\sigma\sqrt{\tau}} \quad \nu = S\phi(d_1)\sqrt{\tau} \quad \Theta = -\frac{S\sigma\phi(d_1)}{2\sqrt{\tau}} - rKe^{-r\tau}N(d_2)" />
          </div>
        </div>
      )}

      {/* ── Theory Box ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-4">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">DPE Pricing Models</p>

        <div className="space-y-3">
          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 px-4 py-3 overflow-x-auto">
            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-semibold mb-2">Black-Scholes</p>
            <MathBlock latex="C = S N(d_1) - K e^{-r\tau} N(d_2), \quad d_1 = \frac{\ln(S/K)+\left(r+\frac{1}{2}\sigma^2\right)\tau}{\sigma\sqrt{\tau}}" />
          </div>

          <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 px-4 py-3 overflow-x-auto">
            <p className="text-[10px] text-violet-400 uppercase tracking-widest font-semibold mb-2">FFT Carr-Madan</p>
            <MathBlock latex="C(k) = \frac{e^{-r\tau}}{\pi}\,\mathrm{Re}\!\left[\int_0^\infty e^{-iuk}\,\psi(u)\,du\right] \quad \text{auto-optimised } \alpha, N, \Delta v" />
          </div>

          <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 px-4 py-3 overflow-x-auto">
            <p className="text-[10px] text-rose-400 uppercase tracking-widest font-semibold mb-2">Heston Stochastic Volatility</p>
            <MathBlock latex="dv = \kappa(\theta-v)\,dt + \xi\sqrt{v}\,dW_2, \quad 2\kappa\theta > \xi^2 \;\text{(Feller)}" />
          </div>
        </div>
      </div>
    </div>
  );
};
