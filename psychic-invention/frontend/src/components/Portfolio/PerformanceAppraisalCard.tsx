/**
 * Performance Appraisal Panel — Menu 2.3 (TRANSACT_APP_SPEC §3.2.3)
 * M1 Part II §4–7: Sharpe, Treynor, Sortino, M², M²-Sortino, IR, Appraisal Ratio
 */
import { usePortfolio, type PerformanceData } from '@/context/PortfolioContext';
import { MathBlock, MathText } from '@/components/ui/Math';

// ── Ratio card ─────────────────────────────────────────────────────────────

interface RatioConfig {
  key: keyof PerformanceData;
  label: string;
  formula: string;
  interpretation: (v: number) => string;
  color: (v: number) => 'green' | 'amber' | 'red' | 'default';
  fmt: 'pct' | 'num';
  ref: string;
}

const RATIO_CONFIGS: RatioConfig[] = [
  {
    key: 'sharpe_ratio',
    label: 'Sharpe Ratio',
    formula: '$SR = (\\bar{r}_p - r_f) / \\sigma_p$',
    interpretation: v => v > 1 ? 'Excellent (> 1.0)' : v > 0.5 ? 'Good (0.5–1.0)' : v > 0 ? 'Marginal (0–0.5)' : 'Negative — underperforms risk-free',
    color: v => v > 1 ? 'green' : v > 0.5 ? 'amber' : v > 0 ? 'default' : 'red',
    fmt: 'num',
    ref: 'M1 Part II §4',
  },
  {
    key: 'treynor_ratio',
    label: 'Treynor Ratio',
    formula: '$TR = (\\bar{r}_p - r_f) / \\beta_p$',
    interpretation: v => `Excess return per unit of systematic risk. ${v > 0 ? 'Positive β-adjusted return.' : 'Below risk-free on systematic basis.'}`,
    color: v => v > 0 ? 'green' : 'red',
    fmt: 'num',
    ref: 'M1 Part II §4',
  },
  {
    key: 'sortino_ratio',
    label: 'Sortino Ratio',
    formula: '$SoR = (\\bar{r}_p - r_{\\text{MAR}}) / \\sigma_{\\downarrow}$',
    interpretation: v => v > 1.5 ? 'Strong downside-adjusted return' : v > 0.5 ? 'Moderate' : 'Low downside risk-adjusted return',
    color: v => v > 1.5 ? 'green' : v > 0.5 ? 'amber' : 'red',
    fmt: 'num',
    ref: 'M1 Part II §5',
  },
  {
    key: 'm2_modigliani',
    label: 'M² (Modigliani)',
    formula: '$M^2_p = r_f + SR \\cdot \\sigma_{\\text{bench}}$',
    interpretation: v => `Leveraged/deleveraged to benchmark volatility: ${(v * 100).toFixed(2)}% p.a.`,
    color: v => v > 0.08 ? 'green' : v > 0.04 ? 'amber' : v > 0 ? 'default' : 'red',
    fmt: 'pct',
    ref: 'M1 Part II §6',
  },
  {
    key: 'm2_sortino',
    label: 'M²-Sortino',
    formula: '$M^2_{\\text{Sort}} = r_p + SoR(\\sigma_{D,b} - \\sigma_D)$',
    interpretation: v => `Downside-adjusted M²: ${(v * 100).toFixed(2)}%`,
    color: v => v > 0.06 ? 'green' : v > 0 ? 'default' : 'red',
    fmt: 'pct',
    ref: 'M1 Part II §6',
  },
  {
    key: 'information_ratio',
    label: 'Information Ratio',
    formula: '$IR_p = (\\bar{r}_p - \\bar{r}_b) / \\sigma(r_p - r_b)$',
    interpretation: v => v > 0.5 ? 'Strong active return vs tracking error' : v > 0 ? 'Positive active management value' : 'Negative: manager underperforms benchmark',
    color: v => v > 0.5 ? 'green' : v > 0 ? 'amber' : 'red',
    fmt: 'num',
    ref: 'M1 Part II §7',
  },
  {
    key: 'appraisal_ratio',
    label: 'Appraisal Ratio',
    formula: '$AR_p = \\alpha / \\sigma_u$',
    interpretation: v => `Alpha per unit of idiosyncratic risk. ${v > 0 ? 'Positive skill detected.' : 'Negative alpha — market underperformance.'}`,
    color: v => v > 0.5 ? 'green' : v > 0 ? 'amber' : 'red',
    fmt: 'num',
    ref: 'M1 Part II §7',
  },
  {
    key: 'alpha',
    label: 'Jensen\'s Alpha',
    formula: '$\\alpha = r_p - [r_f + \\beta_p(r_m - r_f)]$',
    interpretation: v => v > 0 ? `Positive alpha: ${(v * 100 * 252).toFixed(2)}% pa above CAPM expected` : `Negative alpha: ${(v * 100 * 252).toFixed(2)}% pa below CAPM expected`,
    color: v => v > 0 ? 'green' : 'red',
    fmt: 'pct',
    ref: 'M1 §4, CAPM',
  },
];

function RatioCard({ config, value }: { config: RatioConfig; value: number }) {
  const num = isNaN(value) ? 0 : value;
  const display = config.fmt === 'pct'
    ? `${(num * 100 * (config.key === 'alpha' ? 252 : 1)).toFixed(2)}%`
    : num.toFixed(4);

  const color = config.color(num);
  const ring = { green: 'border-emerald-700/60', amber: 'border-amber-700/60', red: 'border-red-700/60', default: 'border-slate-700' }[color];
  const textColor = { green: 'text-emerald-400', amber: 'text-amber-400', red: 'text-red-400', default: 'text-white' }[color];
  const bg = { green: 'bg-emerald-500/10', amber: 'bg-amber-500/10', red: 'bg-red-500/10', default: 'bg-slate-800/50' }[color];

  return (
    <div className={`rounded-xl border ${ring} ${bg} p-4 space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider">{config.label}</p>
          <p className="text-[10px] text-slate-600 mt-0.5"><MathText text={config.formula} /></p>
        </div>
        <span className="text-[9px] text-slate-600 shrink-0">{config.ref}</span>
      </div>
      <p className={`text-2xl font-mono font-bold ${textColor}`}>{display}</p>
      <p className="text-[11px] text-slate-400 leading-tight">{config.interpretation(num)}</p>
    </div>
  );
}

// ── Radar-like bar comparison ──────────────────────────────────────────────

function RatioComparison({ data }: { data: PerformanceData }) {
  const bars = [
    { label: 'Sharpe', value: Math.min(Math.max(data.sharpe_ratio, -2), 3), min: -2, max: 3 },
    { label: 'Sortino', value: Math.min(Math.max(data.sortino_ratio, -2), 4), min: -2, max: 4 },
    { label: 'Treynor', value: Math.min(Math.max(data.treynor_ratio, -0.1), 0.2), min: -0.1, max: 0.2 },
    { label: 'Info Ratio', value: Math.min(Math.max(data.information_ratio, -2), 2), min: -2, max: 2 },
    { label: 'Appraisal', value: Math.min(Math.max(data.appraisal_ratio, -3), 3), min: -3, max: 3 },
  ];

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Ratio Comparison (normalized ranges)</p>
      <div className="space-y-3">
        {bars.map(bar => {
          const range = bar.max - bar.min;
          const zeroPct = ((-bar.min) / range) * 100;
          const valuePct = ((bar.value - bar.min) / range) * 100;
          const isPositive = bar.value >= 0;
          const barLeft = Math.min(zeroPct, valuePct);
          const barWidth = Math.abs(valuePct - zeroPct);
          return (
            <div key={bar.label} className="grid items-center gap-3" style={{ gridTemplateColumns: '70px 1fr 64px' }}>
              <span className="text-xs text-slate-400 text-right">{bar.label}</span>
              <div className="relative h-5 bg-slate-700 rounded overflow-hidden">
                {/* Zero line */}
                <div className="absolute top-0 bottom-0 w-px bg-slate-500" style={{ left: `${zeroPct}%` }} />
                {/* Value bar */}
                <div
                  className={`absolute top-1 bottom-1 rounded ${isPositive ? 'bg-blue-500/80' : 'bg-red-500/80'}`}
                  style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                />
              </div>
              <span className={`text-xs font-mono text-right ${isPositive ? 'text-blue-400' : 'text-red-400'}`}>
                {bar.value.toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-600 mt-2">Bars show position within typical range. Zero line = risk-free baseline.</p>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-10 flex flex-col items-center justify-center text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl">📈</div>
      <div>
        <p className="text-lg font-bold text-white">No performance data</p>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">
          Go to <span className="text-blue-400 font-medium">Asset Universe</span>, fetch market data, then click <span className="text-blue-400 font-medium">Compute All Analytics</span>.
        </p>
      </div>
      <div className="overflow-x-auto w-full">
        <MathBlock latex="SR = \dfrac{\bar{r}_p - r_f}{\sigma_p} \qquad TR = \dfrac{\bar{r}_p - r_f}{\beta_p} \qquad IR = \dfrac{\bar{r}_p - \bar{r}_b}{\sigma(r_p - r_b)}" className="text-slate-600" />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

interface PerformanceAppraisalCardProps {
  data?: PerformanceData | Record<string, unknown> | null;
}

export const PerformanceAppraisalCard = ({ data: propData }: PerformanceAppraisalCardProps = {}) => {
  const { performance: ctxPerf, moments, benchmarkSymbol, status, computeAll } = usePortfolio();
  const data = (propData ?? ctxPerf) as PerformanceData | null;

  if (!data || typeof data.sharpe_ratio !== 'number') {
    if (status === 'fetching' || status === 'computing') {
      return (
        <div className="flex items-center justify-center h-60 gap-3 text-slate-400">
          <span className="animate-spin text-xl">⟳</span>
          <span>Computing performance metrics…</span>
        </div>
      );
    }
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Performance Appraisal</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            M1 Part II §4–7 · Benchmark: <span className="text-slate-300 font-medium">{benchmarkSymbol}</span>
            {moments && <> · <MathText text={`$\\beta_p = ${moments.portfolio_beta.toFixed(3)}$`} /></>}
          </p>
        </div>
        <button onClick={() => computeAll()} className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white text-xs transition-colors">
          Recompute
        </button>
      </div>

      {/* Key ratios */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Risk-Adjusted Return Ratios</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {RATIO_CONFIGS.map(cfg => (
            <RatioCard key={cfg.key} config={cfg} value={data[cfg.key] as number} />
          ))}
        </div>
      </div>

      {/* Ratio comparison chart */}
      <RatioComparison data={data} />

      {/* Interpretation guide */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Interpretation Guide (M1 Part II)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
          <div>
            <p className="text-slate-300 font-semibold mb-1">Sharpe vs Treynor</p>
            <p><MathText text="Sharpe penalizes total risk $\sigma_p$ (undiversified investors). Treynor penalizes only systematic risk $\beta_p$ (diversified investors)." /></p>
          </div>
          <div>
            <p className="text-slate-300 font-semibold mb-1">Sortino Advantage</p>
            <p><MathText text="Sortino uses downside deviation $\sigma_{\downarrow}$ below the MAR, not total $\sigma$. Does not penalize upside volatility — better for asymmetric distributions." /></p>
          </div>
          <div>
            <p className="text-slate-300 font-semibold mb-1">M² (Modigliani-Modigliani)</p>
            <p><MathText text="Scales portfolio to benchmark volatility. Comparable in % terms: $M^2_p > r_{\text{bench}}$ means risk-adjusted outperformance." /></p>
          </div>
          <div>
            <p className="text-slate-300 font-semibold mb-1">Information Ratio</p>
            <p>Active return divided by tracking error. IR &gt; 0.5 is considered strong active management skill. Used by institutional allocators to evaluate manager alpha.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
