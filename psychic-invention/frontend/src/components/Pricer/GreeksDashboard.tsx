import { useState, useEffect, useMemo } from 'react';
import { postGreeksCall, postGreeksPut, getAssetHistory } from '@/utils/api';
import { useSelectedAssets } from '@/context/SelectedAssetsContext';
import { useDataProvider } from '@/context/DataProviderContext';
import { downloadFile, generateFilename } from '@/utils/export';
import { GreekDiagrams } from './GreekDiagrams';
import { MathBlock } from '@/components/ui/Math';

// ── Greeks Heatmap ─────────────────────────────────────────────────────────────
// Vary S (rows) and K (cols) ±30% in 7 steps; compute BS Δ and Γ client-side.
const SQRT2PI = Math.sqrt(2 * Math.PI);
function normCDF(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const res = 1 - (Math.exp(-0.5 * x * x) / SQRT2PI) * poly;
  return x >= 0 ? res : 1 - res;
}
function bsD1(s: number, k: number, tau: number, r: number, sigma: number) {
  return (Math.log(s / k) + (r + 0.5 * sigma * sigma) * tau) / (sigma * Math.sqrt(tau));
}
function bsDelta(s: number, k: number, tau: number, r: number, sigma: number, isCall: boolean) {
  const d1 = bsD1(s, k, tau, r, sigma);
  return isCall ? normCDF(d1) : normCDF(d1) - 1;
}
function bsGamma(s: number, k: number, tau: number, r: number, sigma: number) {
  const d1 = bsD1(s, k, tau, r, sigma);
  return (Math.exp(-0.5 * d1 * d1) / SQRT2PI) / (s * sigma * Math.sqrt(tau));
}

const STEPS = [-0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30];

function heatColor(val: number, min: number, max: number, palette: 'rg' | 'blue') {
  const t = Math.max(0, Math.min(1, (val - min) / (max - min + 1e-10)));
  if (palette === 'rg') {
    // red→yellow→green
    const r = t < 0.5 ? 220 : Math.round(220 * (1 - (t - 0.5) * 2));
    const g = t < 0.5 ? Math.round(200 * t * 2) : 200;
    return `rgb(${r},${g},40)`;
  }
  // dark→light blue
  const v = Math.round(30 + t * 180);
  return `rgb(30,${v},${Math.round(80 + t * 175)})`;
}

interface HeatmapProps { s: number; k: number; tau: number; r: number; sigma: number; optionType: 'call' | 'put' }

function GreeksHeatmap({ s, k, tau, r, sigma, optionType }: HeatmapProps) {
  const isCall = optionType === 'call';

  const { deltaGrid, gammaGrid, sLabels, kLabels, dMin, dMax, gMax } = useMemo(() => {
    const sVals = STEPS.map(d => s * (1 + d));
    const kVals = STEPS.map(d => k * (1 + d));
    const dg: number[][] = [], gg: number[][] = [];
    let dMin = Infinity, dMax = -Infinity, gMax = 0;
    for (const sv of sVals) {
      const dr: number[] = [], gr: number[] = [];
      for (const kv of kVals) {
        const d = bsDelta(sv, kv, tau, r, sigma, isCall);
        const g = bsGamma(sv, kv, tau, r, sigma);
        dr.push(d); gr.push(g);
        if (d < dMin) dMin = d; if (d > dMax) dMax = d;
        if (g > gMax) gMax = g;
      }
      dg.push(dr); gg.push(gr);
    }
    return {
      deltaGrid: dg, gammaGrid: gg,
      sLabels: sVals.map(v => v.toFixed(1)),
      kLabels: kVals.map(v => v.toFixed(1)),
      dMin, dMax, gMax,
    };
  }, [s, k, tau, r, sigma, isCall]);

  const cell = 'w-[52px] h-[28px] text-[10px] font-mono text-center leading-[28px] rounded';

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 space-y-5">
      <div>
        <p className="text-sm font-semibold text-white mb-1">Greeks Heatmap</p>
        <p className="text-xs text-slate-500">Rows = spot S ±30% · Cols = strike K ±30% · {optionType}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Delta heatmap */}
        <div>
          <p className="text-xs font-semibold text-blue-300 mb-2">Δ  Delta  (red=0 → green=1)</p>
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-0.5 text-[10px]">
              <thead>
                <tr>
                  <th className="text-slate-600 w-12 text-right pr-1">S\K</th>
                  {kLabels.map((kl, i) => (
                    <th key={i} className="text-slate-500 w-[52px] text-center font-mono">{kl}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deltaGrid.map((row, ri) => (
                  <tr key={ri}>
                    <td className="text-slate-500 text-right pr-1 font-mono">{sLabels[ri]}</td>
                    {row.map((val, ci) => (
                      <td key={ci} className={cell}
                        style={{ backgroundColor: heatColor(val, dMin, dMax, 'rg'), color: '#fff' }}>
                        {val.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gamma heatmap */}
        <div>
          <p className="text-xs font-semibold text-violet-300 mb-2">Γ  Gamma  (dark=0 → bright=max)</p>
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-0.5 text-[10px]">
              <thead>
                <tr>
                  <th className="text-slate-600 w-12 text-right pr-1">S\K</th>
                  {kLabels.map((kl, i) => (
                    <th key={i} className="text-slate-500 w-[52px] text-center font-mono">{kl}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gammaGrid.map((row, ri) => (
                  <tr key={ri}>
                    <td className="text-slate-500 text-right pr-1 font-mono">{sLabels[ri]}</td>
                    {row.map((val, ci) => (
                      <td key={ci} className={cell}
                        style={{ backgroundColor: heatColor(val, 0, gMax, 'blue'), color: '#fff' }}>
                        {val.toExponential(1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <MathBlock
          latex="\Delta = N(d_1)\,\text{(call)},\;\; N(d_1)-1\,\text{(put)} \qquad \Gamma = \dfrac{N'(d_1)}{S\sigma\sqrt{\tau}} \quad \text{(peaks ATM)}"
          className="text-slate-500"
        />
      </div>
    </div>
  );
}

const GREEK_LABELS: Record<string, string> = {
  delta: 'Δ Delta',
  gamma: 'Γ Gamma',
  theta: 'Θ Theta',
  vega: 'ν Vega',
  rho: 'ρ Rho',
};

export const GreeksDashboard = () => {
  const { selectedAssets } = useSelectedAssets();
  const { dataProvider } = useDataProvider();
  const [s, setS] = useState(100);
  const [k, setK] = useState(100);
  const [tau, setTau] = useState(0.25);
  const [r, setR] = useState(0.05);
  const [sigma, setSigma] = useState(0.2);
  const [model, setModel] = useState<'bs' | 'fft' | 'numerical'>('bs');
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [results, setResults] = useState<Record<string, { greeks: Record<string, number>; method: string }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstAssetSymbol = selectedAssets[0]?.symbol;
  useEffect(() => {
    if (!firstAssetSymbol) return;
    let cancelled = false;
    (async () => {
      try {
        const history = await getAssetHistory(firstAssetSymbol, '5d');
        if (cancelled || !Array.isArray(history) || history.length === 0) return;
        const lastRow = history[history.length - 1];
        const close = lastRow?.close;
        if (typeof close === 'number' && close > 0) setS(close);
      } catch {
        // Ignore: keep current manual values
      }
    })();
    return () => { cancelled = true; };
  }, [firstAssetSymbol, dataProvider]);

  const models = [
    { id: 'bs' as const, label: 'Black-Scholes', desc: 'Analytical closed-form' },
    { id: 'fft' as const, label: 'FFT', desc: 'Numerical via Carr-Madan' },
    { id: 'numerical' as const, label: 'Numerical', desc: 'Finite-difference' },
  ];

  const handleCompute = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const payload = { s, k, tau, r, sigma };
      const post = optionType === 'call' ? postGreeksCall : postGreeksPut;
      const all = await Promise.all([
        post({ ...payload, model: 'bs' }),
        post({ ...payload, model: 'fft' }),
        post({ ...payload, model: 'numerical' }),
      ]);
      setResults({
        bs: { greeks: all[0].greeks, method: all[0].method },
        fft: { greeks: all[1].greeks, method: all[1].method },
        numerical: { greeks: all[2].greeks, method: all[2].method },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Greeks computation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!results) return;
    const payload = {
      timestamp: new Date().toISOString(),
      inputs: { s, k, tau, r, sigma },
      option_type: optionType,
      results,
    };
    const json = JSON.stringify(payload, null, 2);
    downloadFile(json, generateFilename('greeks_dashboard', 'json'), 'application/json');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Greeks Dashboard (Δ, Γ, ν, Θ, ρ)</h3>
        <p className="text-sm text-slate-400 mb-4">
          Compare analytical (BS), FFT-based, and numerical Greeks across all models.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Spot (S)</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={s}
              onChange={(e) => setS(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Strike (K)</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={k}
              onChange={(e) => setK(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Time (τ)</label>
            <input
              type="number"
              min={0.001}
              step={0.01}
              value={tau}
              onChange={(e) => setTau(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Rate (r)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={r}
              onChange={(e) => setR(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Volatility (σ)</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={sigma}
              onChange={(e) => setSigma(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Option</label>
            <select
              value={optionType}
              onChange={(e) => setOptionType(e.target.value as 'call' | 'put')}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
            >
              <option value="call">Call</option>
              <option value="put">Put</option>
            </select>
          </div>
          <button
            onClick={handleCompute}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Computing…' : 'Compute All Greeks'}
          </button>
          {results && (
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium"
            >
              Export JSON
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-300 text-sm">{error}</div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h4 className="text-md font-semibold text-white mb-4">Greeks by Model</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {models.map((m) => (
                <div key={m.id} className="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
                  <p className="text-slate-300 font-semibold mb-1">{m.label}</p>
                  <p className="text-xs text-slate-500 mb-3">{results[m.id].method}</p>
                  <div className="space-y-2">
                    {Object.entries(results[m.id].greeks).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-slate-400">{GREEK_LABELS[key] ?? key}</span>
                        <span className="font-mono text-white">{val.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {s > 0 && k > 0 && tau > 0 && sigma > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
          <GreekDiagrams
            s={s}
            k={k}
            tau={tau}
            r={r}
            sigma={sigma}
            optionType={optionType}
          />
        </div>
      )}

      {s > 0 && k > 0 && tau > 0 && sigma > 0 && (
        <GreeksHeatmap s={s} k={k} tau={tau} r={r} sigma={sigma} optionType={optionType} />
      )}
    </div>
  );
};
