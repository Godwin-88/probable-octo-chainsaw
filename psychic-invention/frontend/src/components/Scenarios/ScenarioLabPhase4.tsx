import { useState } from 'react';
import {
  postScenariosRun,
  postScenariosProbabilistic,
  postScenariosMonteCarlo,
  postScenariosBehavioral,
} from '@/utils/api';

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
const SCENARIO_RETURNS = [
  [0.08, 0.12, 0.06],
  [-0.05, -0.02, 0.01],
  [0.02, 0.03, 0.02],
];
const SCENARIO_PROBS = [0.5, 0.3, 0.2];

export const ScenarioLabPhase4 = () => {
  const [scenarioRun, setScenarioRun] = useState<Record<string, unknown> | null>(null);
  const [probabilistic, setProbabilistic] = useState<Record<string, unknown> | null>(null);
  const [monteCarlo, setMonteCarlo] = useState<Record<string, unknown> | null>(null);
  const [behavioral, setBehavioral] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAll = async () => {
    setLoading('Phase 4');
    setError(null);
    setScenarioRun(null);
    setProbabilistic(null);
    setMonteCarlo(null);
    setBehavioral(null);
    try {
      const [runRes, probRes, mcRes, behRes] = await Promise.all([
        postScenariosRun({
          returns: SAMPLE_RETURNS,
          weights: WEIGHTS,
          historical: 'GFC_2008',
        }),
        postScenariosProbabilistic({
          scenario_returns: SCENARIO_RETURNS,
          scenario_probs: SCENARIO_PROBS,
          target_return: 0.06,
          long_only: true,
        }),
        postScenariosMonteCarlo({
          returns: SAMPLE_RETURNS,
          weights: WEIGHTS,
          portfolio_value: 1_000_000,
          horizon_days: 1,
          n_paths: 50_000,
        }),
        postScenariosBehavioral({
          returns: SAMPLE_RETURNS,
          weights: WEIGHTS,
          mode: 'prospect',
        }),
      ]);
      setScenarioRun(runRes);
      setProbabilistic(probRes);
      setMonteCarlo(mcRes);
      setBehavioral(behRes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Phase 4 failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Scenarios & Behavioral (M3, M4)</h3>
        <button
          onClick={runAll}
          disabled={!!loading}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run All Phase 4'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarioRun && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-slate-400 text-sm font-medium mb-2">Scenario Run (GFC 2008)</p>
            <pre className="text-xs text-cyan-300 font-mono overflow-auto max-h-32">
              {JSON.stringify(scenarioRun, null, 2)}
            </pre>
          </div>
        )}
        {probabilistic && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-slate-400 text-sm font-medium mb-2">Probabilistic Optimization</p>
            <pre className="text-xs text-cyan-300 font-mono overflow-auto max-h-32">
              {JSON.stringify(probabilistic, null, 2)}
            </pre>
          </div>
        )}
        {monteCarlo && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-slate-400 text-sm font-medium mb-2">Monte Carlo Simulation</p>
            <pre className="text-xs text-cyan-300 font-mono overflow-auto max-h-32">
              {JSON.stringify(monteCarlo, null, 2)}
            </pre>
          </div>
        )}
        {behavioral && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-slate-400 text-sm font-medium mb-2">Prospect Theory</p>
            <pre className="text-xs text-cyan-300 font-mono overflow-auto max-h-32">
              {JSON.stringify(behavioral, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {!scenarioRun && !probabilistic && !monteCarlo && !behavioral && !loading && !error && (
        <p className="text-slate-500 text-sm">Click &quot;Run All Phase 4&quot; to run scenario engine, probabilistic optimization, Monte Carlo, and behavioral simulator.</p>
      )}
    </div>
  );
};
