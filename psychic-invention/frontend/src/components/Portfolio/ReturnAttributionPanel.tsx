/**
 * Return Attribution Panel — Menu 2.5 (TRANSACT_APP_SPEC §3.2.5)
 * M1 §4, M2 §5: r_p = α + β_p·r_m + Σ_k λ_k·β_{p,k} + ε_p
 * CAPM single-factor decomposition with optional multi-factor extension.
 */
import { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { postPortfolioAttribution } from '@/utils/api';
import { MathBlock } from '@/components/ui/Math';

interface AttributionResult {
  alpha: number;
  systematic_return: number;
  factor_contributions: { name: string; contribution: number }[];
  residual: number;
  total_return: number;
  decomposition: {
    alpha: number;
    systematic: number;
    factor_total: number;
    residual: number;
    total: number;
  };
}

// ── Waterfall bar ──────────────────────────────────────────────────────────

function WaterfallChart({ data, annualizeFactor }: { data: AttributionResult; annualizeFactor: number }) {
  const ann = (v: number) => v * annualizeFactor;
  const items = [
    { label: 'Alpha (α)', value: ann(data.alpha), desc: 'Manager skill above CAPM prediction' },
    { label: `Systematic (β·r_m)`, value: ann(data.systematic_return), desc: 'Market-driven return' },
    ...data.factor_contributions.map(fc => ({
      label: fc.name,
      value: ann(fc.contribution),
      desc: 'Factor contribution λ_k · β_{p,k}',
    })),
    { label: 'Residual (ε)', value: ann(data.residual), desc: 'Unexplained idiosyncratic component' },
  ];

  const total = items.reduce((s, it) => s + it.value, 0);
  const maxAbs = Math.max(...items.map(it => Math.abs(it.value)), 0.001);

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-white">Return Decomposition Waterfall</h4>
        <span className="text-xs text-slate-500">
          Total: <span className={`font-mono font-semibold ${total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {total >= 0 ? '+' : ''}{(total * 100).toFixed(3)}%
          </span>
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => {
          const pct = (Math.abs(item.value) / maxAbs) * 85;
          const isPos = item.value >= 0;
          return (
            <div key={i} className="grid items-center gap-3" style={{ gridTemplateColumns: '150px 1fr 80px' }}>
              <div className="text-right">
                <span className="text-xs text-slate-300 font-medium">{item.label}</span>
              </div>
              <div className="relative h-7 bg-slate-800 rounded overflow-hidden">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600" />
                <div
                  className={`absolute top-1 bottom-1 rounded ${isPos ? 'left-1/2' : ''} ${isPos ? 'bg-emerald-500/80' : 'bg-red-500/80'}`}
                  style={{
                    width: `${pct / 2}%`,
                    ...(isPos ? { left: '50%' } : { right: '50%' }),
                  }}
                />
                <div className={`absolute top-0 bottom-0 flex items-center ${isPos ? 'left-1/2 pl-2' : 'right-1/2 justify-end pr-2'}`}>
                  <span className="text-[10px] text-slate-300 font-mono">
                    {item.value >= 0 ? '+' : ''}{(item.value * 100).toFixed(3)}%
                  </span>
                </div>
              </div>
              <span className={`text-xs font-mono text-right ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.value >= 0 ? '+' : ''}{(item.value * 100).toFixed(4)}%
              </span>
            </div>
          );
        })}

        {/* Total line */}
        <div className="pt-2 border-t border-slate-700/60 grid items-center gap-3" style={{ gridTemplateColumns: '150px 1fr 80px' }}>
          <span className="text-xs font-bold text-white text-right">Total r_p</span>
          <div className="relative h-7 bg-slate-800 rounded overflow-hidden">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600" />
            <div
              className={`absolute top-1 bottom-1 rounded ${total >= 0 ? 'bg-blue-500/80' : 'bg-orange-500/80'}`}
              style={{
                width: `${(Math.abs(total) / maxAbs) * 85 / 2}%`,
                ...(total >= 0 ? { left: '50%' } : { right: '50%' }),
              }}
            />
          </div>
          <span className={`text-xs font-mono font-bold text-right ${total >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
            {total >= 0 ? '+' : ''}{(total * 100).toFixed(4)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Pie-like share breakdown ───────────────────────────────────────────────

function ShareBreakdown({ data, annualizeFactor }: { data: AttributionResult; annualizeFactor: number }) {
  const ann = (v: number) => v * annualizeFactor;
  const parts = [
    { label: 'Alpha', value: ann(data.alpha), color: 'bg-indigo-500' },
    { label: 'Market (β·r_m)', value: ann(data.systematic_return), color: 'bg-blue-500' },
    ...data.factor_contributions.map((fc, i) => ({
      label: fc.name,
      value: ann(fc.contribution),
      color: ['bg-teal-500', 'bg-cyan-500', 'bg-sky-500'][i % 3],
    })),
    { label: 'Residual', value: ann(data.residual), color: 'bg-slate-500' },
  ];

  const total = parts.reduce((s, p) => s + Math.abs(p.value), 0);

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
      <h4 className="text-sm font-semibold text-white mb-4">Attribution Share (absolute contribution)</h4>
      <div className="flex h-8 rounded overflow-hidden gap-px mb-3">
        {parts.map((p, i) => (
          <div
            key={i}
            className={`${p.color} transition-all`}
            style={{ width: `${total > 0 ? (Math.abs(p.value) / total) * 100 : 100 / parts.length}%` }}
            title={`${p.label}: ${(p.value * 100).toFixed(4)}%`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {parts.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${p.color}`} />
            <span className="text-xs text-slate-400 truncate">{p.label}</span>
            <span className={`text-xs font-mono ml-auto ${p.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {p.value >= 0 ? '+' : ''}{(p.value * 100).toFixed(3)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Factor input ───────────────────────────────────────────────────────────

const PRESET_FACTORS = [
  { name: 'No additional factors (CAPM only)', factors: [] },
  { name: 'Fama-French 3-Factor (MKT, SMB, HML)', factors: ['MKT-RF', 'SMB', 'HML'] },
  { name: 'Carhart 4-Factor (+MOM)', factors: ['MKT-RF', 'SMB', 'HML', 'MOM'] },
];

// ── Main ──────────────────────────────────────────────────────────────────

export const ReturnAttributionPanel = () => {
  const {
    returns: ctxReturns, benchmarkReturns, assets, moments, benchmarkSymbol,
    status,
  } = usePortfolio();

  const [result, setResult] = useState<AttributionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rfRate, setRfRate] = useState(0.045);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [annualize, setAnnualize] = useState(true);

  const annFactor = annualize ? 252 : 1;

  const handleCompute = async () => {
    if (!ctxReturns || !benchmarkReturns) {
      setError('Fetch market data from Asset Universe first. Both asset returns and benchmark returns are required.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const weights = assets.map(a => a.weight);
      const wSum = weights.reduce((s, w) => s + w, 0);
      const normW = wSum > 0 ? weights.map(w => w / wSum) : weights;

      // Portfolio return series
      const portReturns = ctxReturns.map(row =>
        row.reduce((s, r, i) => s + r * (normW[i] ?? 0), 0)
      );

      const res = await postPortfolioAttribution({
        portfolio_returns: portReturns,
        market_returns: benchmarkReturns,
        risk_free_rate: rfRate / 252, // daily rate
        factor_names: PRESET_FACTORS[selectedPreset].factors,
      });

      setResult(res as AttributionResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Attribution computation failed');
    } finally {
      setLoading(false);
    }
  };

  const hasData = !!(ctxReturns && benchmarkReturns);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white">Return Attribution</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          M1 §4, M2 §5 · r_p = α + β_p·r_m + Σ_k λ_k·β_{'{'}p,k{'}'} + ε_p
          · Benchmark: <span className="text-slate-300">{benchmarkSymbol}</span>
        </p>
      </div>

      {/* Config */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Factor Model</label>
            <select
              value={selectedPreset}
              onChange={e => setSelectedPreset(parseInt(e.target.value))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {PRESET_FACTORS.map((p, i) => (
                <option key={i} value={i}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Risk-Free Rate (annual)</label>
            <input
              type="number" min={0} max={0.2} step={0.001}
              value={rfRate}
              onChange={e => setRfRate(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-slate-600 mt-1">Converted to daily: {(rfRate / 252 * 100).toFixed(4)}% /day</p>
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Display</label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={annualize}
                onChange={e => setAnnualize(e.target.checked)}
                className="rounded"
              />
              Annualize returns (×252)
            </label>
          </div>
        </div>

        {!hasData && (
          <div className="rounded-lg border border-amber-800/40 bg-amber-900/10 px-3 py-2 text-amber-300 text-xs mb-3">
            ⚠ Fetch market data from Asset Universe first. Returns and benchmark needed for CAPM regression.
          </div>
        )}

        {moments && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-center">
              <p className="text-xs text-slate-500">Portfolio Beta</p>
              <p className="font-mono text-white font-bold">{moments.portfolio_beta.toFixed(4)}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-center">
              <p className="text-xs text-slate-500">Portfolio Return (ann.)</p>
              <p className={`font-mono font-bold ${moments.portfolio_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(moments.portfolio_return * 252 * 100).toFixed(2)}%
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-center">
              <p className="text-xs text-slate-500">Systematic Risk %</p>
              <p className="font-mono text-blue-400 font-bold">
                {(moments.systematic_risk / (moments.systematic_risk + moments.non_systematic_risk) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleCompute}
          disabled={loading || !hasData || status === 'fetching'}
          className="px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '⟳ Computing attribution…' : '⚡ Run Attribution'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/60 bg-red-900/20 px-4 py-3 text-red-300 text-sm">{error}</div>
      )}

      {!hasData && !result && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-10 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-3xl">🔬</div>
          <div>
            <p className="text-lg font-bold text-white">Attribution requires market data</p>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              Go to <span className="text-blue-400 font-medium">Asset Universe</span> → set assets & benchmark → click <span className="text-blue-400 font-medium">Fetch Market Data</span>.
              Then return here to run the CAPM attribution regression.
            </p>
          </div>
          <div className="overflow-x-auto w-full space-y-1">
            <MathBlock latex="r_p - r_f = \alpha + \beta_p(r_m - r_f) + \varepsilon" className="text-slate-600" />
            <MathBlock latex="\text{Jensen's } \alpha = r_p - \bigl[r_f + \beta_p(r_m - r_f)\bigr]" className="text-slate-600" />
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Jensen's Alpha (α)",
                formula: "r_p − [r_f + β_p(r_m − r_f)]",
                value: result.alpha * annFactor,
                fmt: 'pct',
                color: result.alpha > 0 ? 'green' : 'red',
                desc: result.alpha > 0 ? 'Manager adds value above CAPM' : 'Manager destroys value vs CAPM',
              },
              {
                label: "Systematic Return",
                formula: "β_p · (r_m − r_f)",
                value: result.systematic_return * annFactor,
                fmt: 'pct',
                color: result.systematic_return > 0 ? 'default' : 'red',
                desc: 'Market-factor driven return',
              },
              {
                label: "Total Return",
                formula: "E[r_p]",
                value: result.total_return * annFactor,
                fmt: 'pct',
                color: result.total_return > 0 ? 'green' : 'red',
                desc: 'Portfolio mean return (daily avg × 252)',
              },
              {
                label: "Residual (ε)",
                formula: "r_p − α − β·r_m − Σλ_k β_k",
                value: result.residual * annFactor,
                fmt: 'pct',
                color: Math.abs(result.residual) < 0.001 ? 'default' : 'amber',
                desc: 'Unexplained idiosyncratic portion',
              },
            ].map((m, i) => {
              const colors = {
                green: { border: 'border-emerald-700/60', bg: 'bg-emerald-500/5', text: 'text-emerald-400' },
                red: { border: 'border-red-700/60', bg: 'bg-red-500/5', text: 'text-red-400' },
                amber: { border: 'border-amber-700/60', bg: 'bg-amber-500/5', text: 'text-amber-400' },
                default: { border: 'border-slate-700', bg: 'bg-slate-800/50', text: 'text-white' },
              };
              const c = colors[m.color as keyof typeof colors];
              return (
                <div key={i} className={`rounded-xl border ${c.border} ${c.bg} p-4 space-y-1`}>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">{m.label}</p>
                  <p className="text-[10px] text-slate-600 font-mono">{m.formula}</p>
                  <p className={`text-2xl font-mono font-bold ${c.text}`}>
                    {m.value >= 0 ? '+' : ''}{(m.value * 100).toFixed(3)}%
                  </p>
                  <p className="text-[11px] text-slate-400">{m.desc}</p>
                </div>
              );
            })}
          </div>

          <WaterfallChart data={result} annualizeFactor={annFactor} />
          <ShareBreakdown data={result} annualizeFactor={annFactor} />

          {/* Decomposition table */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
            <h4 className="text-sm font-semibold text-white mb-3">Full Decomposition Table</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-500 pb-2 font-medium">Component</th>
                    <th className="text-left text-slate-500 pb-2 font-medium">Formula</th>
                    <th className="text-right text-slate-500 pb-2 font-medium">Daily</th>
                    <th className="text-right text-slate-500 pb-2 font-medium">Annualized</th>
                    <th className="text-right text-slate-500 pb-2 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    { name: "Alpha (α)", formula: "r_p − CAPM_expected", value: result.alpha },
                    { name: "Systematic (β·r_m)", formula: "β_p · (r_m − r_f)", value: result.systematic_return },
                    ...result.factor_contributions.map(fc => ({
                      name: fc.name, formula: "λ_k · β_{p,k}", value: fc.contribution,
                    })),
                    { name: "Residual (ε)", formula: "unexplained", value: result.residual },
                    { name: "Total r_p", formula: "Σ components", value: result.total_return },
                  ].map((row, i) => {
                    const isTotal = i === result.factor_contributions.length + 3;
                    const share = result.total_return !== 0 ? (row.value / result.total_return) * 100 : 0;
                    return (
                      <tr key={i} className={isTotal ? 'font-semibold text-white border-t border-slate-600' : ''}>
                        <td className="py-2 text-slate-300">{row.name}</td>
                        <td className="py-2 font-mono text-slate-600">{row.formula}</td>
                        <td className={`py-2 text-right font-mono ${row.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {row.value >= 0 ? '+' : ''}{(row.value * 100).toFixed(5)}%
                        </td>
                        <td className={`py-2 text-right font-mono ${row.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {row.value >= 0 ? '+' : ''}{(row.value * 252 * 100).toFixed(3)}%
                        </td>
                        <td className="py-2 text-right text-slate-400">
                          {isTotal ? '100%' : `${share.toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Theory */}
          <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">M1 §4 / M2 §5 Theory</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
              <div>
                <p className="text-slate-300 font-semibold mb-1">CAPM Attribution</p>
                <p>r_p − r_f = α + β_p·(r_m − r_f) + ε. Jensen's α captures manager skill beyond market compensation. β·(r_m−r_f) is the fair market premium for bearing systematic risk.</p>
              </div>
              <div>
                <p className="text-slate-300 font-semibold mb-1">Multi-Factor Extension (M2 §5)</p>
                <p>β_{'{'}p,k{'}'} = w^T B_k where B_k is the k-th column of the factor loading matrix. Each factor captures a different risk premia: size (SMB), value (HML), momentum (MOM).</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
