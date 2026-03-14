import { useState } from 'react';
import { postRiskVar } from '@/utils/api';
import { downloadFile, generateFilename } from '@/utils/export';

const SAMPLE_RETURNS = [
  [0.01, -0.005, 0.02],
  [0.02, 0.01, -0.01],
  [0.015, 0.02, 0.01],
  [0.005, -0.01, 0.015],
  [-0.01, 0.005, -0.02],
  [0.02, 0.015, 0.005],
  [-0.005, -0.02, 0.01],
  [0.01, 0.005, -0.005],
  [0.015, 0.01, 0.02],
  [0.005, -0.01, 0.02],
];
const WEIGHTS = [0.33, 0.33, 0.34];

export const VaRDashboard = () => {
  const [varResult, setVarResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = (format: 'csv' | 'json') => {
    if (!varResult) return;
    const payload = {
      timestamp: new Date().toISOString(),
      inputs: { returns: SAMPLE_RETURNS.length, weights: WEIGHTS, alpha: 0.05, portfolio_value: 1_000_000 },
      results: varResult,
    };
    if (format === 'json') {
      const json = JSON.stringify(payload, null, 2);
      downloadFile(json, generateFilename('var_report', 'json'), 'application/json');
    } else {
      const rows = [['Metric', 'Value'], ...Object.entries(varResult).map(([k, v]) => [k, String(v)])];
      const csv = rows.map((r) => r.join(',')).join('\n');
      downloadFile(csv, generateFilename('var_report', 'csv'), 'text/csv');
    }
  };

  const runVaR = async () => {
    setLoading(true);
    setError(null);
    setVarResult(null);
    try {
      const res = await postRiskVar({
        returns: SAMPLE_RETURNS,
        weights: WEIGHTS,
        alpha: 0.05,
        portfolio_value: 1_000_000,
        include_monte_carlo: true,
        mc_simulations: 50_000,
      });
      setVarResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'VaR computation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-white">VaR & Expected Shortfall (M1 L2)</h3>
          <div className="flex gap-2">
            {varResult && (
              <>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                >
                  Export JSON
                </button>
              </>
            )}
            <button
            onClick={runVaR}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 disabled:opacity-50"
          >
            {loading ? 'Computing…' : 'Compute VaR'}
          </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-300 text-sm mb-4">
            {error}
          </div>
        )}

        {varResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(varResult).map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-slate-600 bg-slate-800/50 p-3"
              >
                <p className="text-slate-400 text-sm font-medium capitalize">
                  {key.replace(/_/g, ' ')}
                </p>
                <p className="font-mono text-white mt-1">
                  {typeof value === 'number'
                    ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    : JSON.stringify(value)}
                </p>
              </div>
            ))}
          </div>
        )}

        {!varResult && !loading && !error && (
          <p className="text-slate-500 text-sm">Click &quot;Compute VaR&quot; to run historical, parametric, and Monte Carlo VaR.</p>
        )}
      </div>
    </div>
  );
};
