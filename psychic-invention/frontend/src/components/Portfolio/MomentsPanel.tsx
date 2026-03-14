/**
 * Sample Moments Panel — Menu 2.2 (TRANSACT_APP_SPEC §3.2.2)
 * M1 L1: R_p = w^T r, σ²_p = w^T Σ w, β_p, γ̂, κ̂
 */
import { usePortfolio, type MomentsData } from '@/context/PortfolioContext';
import { MathBlock, MathText } from '@/components/ui/Math';

function MetricCard({
  label, formula, value, fmt = 'num4', description, color = 'default',
}: {
  label: string; formula?: string; value: number; fmt?: 'pct2' | 'num4';
  description?: string; color?: 'default' | 'green' | 'red' | 'amber' | 'blue';
}) {
  const num = isNaN(value) ? 0 : value;
  const display = fmt === 'pct2' ? `${(num * 100).toFixed(2)}%` : num.toFixed(4);
  const ring = { default: 'border-slate-700', green: 'border-emerald-700/60', red: 'border-red-700/60', amber: 'border-amber-700/60', blue: 'border-blue-700/60' }[color];
  const textColor = { default: 'text-white', green: 'text-emerald-400', red: 'text-red-400', amber: 'text-amber-400', blue: 'text-blue-400' }[color];
  return (
    <div className={`rounded-xl border ${ring} bg-slate-800/50 p-4 space-y-1`}>
      <p className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</p>
      {formula && <p className="text-[10px] text-slate-600 mt-0.5"><MathText text={formula} /></p>}
      <p className={`text-xl font-mono font-bold ${textColor}`}>{display}</p>
      {description && <p className="text-[11px] text-slate-500 leading-tight">{description}</p>}
    </div>
  );
}

function DistributionShape({ skewness, kurtosis }: { skewness: number; kurtosis: number }) {
  const skewPct = Math.min(Math.abs(skewness) * 20, 45);
  const isLeftSkewed = skewness < 0;
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Distribution Shape (M1 §5)</p>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span><MathText text={`Skewness $\\hat{\\gamma}$ = ${skewness.toFixed(4)}`} /></span>
            <span className={skewness < -0.5 ? 'text-red-400' : skewness > 0.5 ? 'text-emerald-400' : 'text-slate-400'}>
              {skewness < -0.5 ? 'Left-skewed (tail risk)' : skewness > 0.5 ? 'Right-skewed' : 'Near-symmetric'}
            </span>
          </div>
          <div className="relative h-5 bg-slate-700 rounded overflow-hidden">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-500" />
            {isLeftSkewed
              ? <div className="absolute right-1/2 top-1 bottom-1 bg-red-500/70 rounded" style={{ width: `${skewPct}%` }} />
              : <div className="absolute left-1/2 top-1 bottom-1 bg-emerald-500/70 rounded" style={{ width: `${skewPct}%` }} />
            }
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <span className="text-[10px] text-slate-400">L</span>
              <span className="text-[10px] text-slate-400">R</span>
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span><MathText text={`Excess Kurtosis $\\hat{\\kappa}$ = ${kurtosis.toFixed(4)}`} /></span>
            <span className={kurtosis > 1 ? 'text-red-400' : kurtosis > 0 ? 'text-amber-400' : 'text-slate-400'}>
              {kurtosis > 1 ? 'Leptokurtic (heavy tails)' : kurtosis < -0.5 ? 'Platykurtic' : 'Mesokurtic (normal-like)'}
            </span>
          </div>
          <div className="relative h-5 bg-slate-700 rounded overflow-hidden">
            <div
              className={`absolute left-0 top-1 bottom-1 rounded ${kurtosis > 1 ? 'bg-red-500/70' : kurtosis > 0 ? 'bg-amber-500/70' : 'bg-blue-500/70'}`}
              style={{ width: `${Math.min(Math.abs(kurtosis) * 15, 90)}%` }}
            />
            <div className="absolute inset-0 flex items-center px-2">
              <span className="text-[10px] text-slate-400">Normal baseline = 0</span>
            </div>
          </div>
        </div>
        {kurtosis > 1 && (
          <div className="rounded-lg border border-red-800/40 bg-red-900/10 px-3 py-2 text-xs text-red-300">
            <MathText text="⚠ $\hat{\kappa} > 1$: parametric VaR (normal) will underestimate tail losses. Prefer historical or $t$-distribution VaR." />
          </div>
        )}
      </div>
    </div>
  );
}

function AssetCrossSection({ symbols, assetReturns, vols, weights }: {
  symbols: string[]; assetReturns: number[]; vols: number[]; weights: number[];
}) {
  if (!symbols.length) return null;
  const annR = assetReturns.map(r => r * 252);
  const annV = vols.map(v => v * Math.sqrt(252));
  const maxR = Math.max(...annR.map(Math.abs), 0.001);
  const maxV = Math.max(...annV, 0.001);
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Asset Cross-Section (annualized)</p>
      <div className="space-y-2.5">
        {symbols.map((sym, i) => (
          <div key={sym} className="grid gap-2 items-center text-xs" style={{ gridTemplateColumns: '56px 1fr 72px 1fr 72px 40px' }}>
            <span className="font-mono font-bold text-white text-[11px] truncate">{sym}</span>
            <div className="h-2 bg-slate-700 rounded overflow-hidden">
              <div
                className={`h-full rounded ${annR[i] >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${(Math.abs(annR[i]) / maxR) * 100}%` }}
              />
            </div>
            <span className={`font-mono text-right text-[11px] ${annR[i] >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {annR[i] >= 0 ? '+' : ''}{(annR[i] * 100).toFixed(2)}%
            </span>
            <div className="h-2 bg-slate-700 rounded overflow-hidden">
              <div className="h-full bg-blue-500 rounded" style={{ width: `${(annV[i] / maxV) * 100}%` }} />
            </div>
            <span className="font-mono text-slate-400 text-right text-[11px]">σ {(annV[i] * 100).toFixed(2)}%</span>
            <span className="text-slate-500 text-right">{(weights[i] * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <div className="flex gap-6 mt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-sm bg-emerald-500" />Return pa</span>
        <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-sm bg-blue-500" />Volatility pa</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

interface MomentsPanelProps {
  data?: MomentsData | Record<string, unknown> | null;
}

export const MomentsPanel = ({ data: propData }: MomentsPanelProps = {}) => {
  const { moments: ctxMoments, assets, status, computeAll } = usePortfolio();
  const data = (propData ?? ctxMoments) as MomentsData | null;

  if (!data || typeof data.portfolio_return !== 'number') {
    if (status === 'fetching' || status === 'computing') {
      return (
        <div className="flex items-center justify-center h-60 gap-3 text-slate-400">
          <span className="animate-spin text-xl">⟳</span>
          <span>{status === 'fetching' ? 'Fetching market data…' : 'Computing moments…'}</span>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-10 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl">📐</div>
        <div>
          <p className="text-lg font-bold text-white">No moments computed yet</p>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Go to <span className="text-blue-400 font-medium">Asset Universe</span>, fetch market data, then click <span className="text-blue-400 font-medium">Compute All Analytics</span>.
          </p>
        </div>
        <div className="overflow-x-auto w-full">
          <MathBlock latex="R_p = \mathbf{w}^\top \bar{r} \qquad \sigma^2_p = \mathbf{w}^\top \Sigma\, \mathbf{w} \qquad \beta_p = \mathbf{w}^\top \beta" className="text-slate-600" />
        </div>
      </div>
    );
  }

  const annReturn = data.portfolio_return * 252;
  const annVol = data.portfolio_volatility * Math.sqrt(252);
  const symbols = assets.map(a => a.symbol);
  const weights = assets.map(a => a.weight);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Sample Moments</h3>
          <p className="text-xs text-slate-500 mt-0.5">M1 L1 vector/matrix formulas — daily log returns, annualized (×252 / ×√252)</p>
        </div>
        <button onClick={() => computeAll()} className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white text-xs transition-colors">
          Recompute
        </button>
      </div>

      {/* First two moments */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">First Two Moments (Annualized)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Portfolio Return" formula="$R_p = \mathbf{w}^\top \bar{r}$" value={annReturn} fmt="pct2"
            color={annReturn >= 0 ? 'green' : 'red'} description="Weighted avg of asset mean returns" />
          <MetricCard label="Portfolio Variance" formula="$\sigma^2_p = \mathbf{w}^\top \Sigma \mathbf{w}$" value={data.portfolio_variance * 252} fmt="num4"
            description="Quadratic form of covariance matrix" />
          <MetricCard label="Portfolio Volatility" formula="$\sigma_p = \sqrt{\mathbf{w}^\top \Sigma \mathbf{w}}$" value={annVol} fmt="pct2"
            description="Std dev of portfolio returns" />
          <MetricCard label="Portfolio Beta" formula="$\beta_p = \mathbf{w}^\top \beta$" value={data.portfolio_beta} fmt="num4"
            color={data.portfolio_beta > 1.2 ? 'amber' : data.portfolio_beta < 0.8 ? 'blue' : 'default'}
            description="Market sensitivity vs benchmark" />
        </div>
      </div>

      {/* Risk decomposition */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
          <MathText text="Risk Decomposition: $\sigma^2_p = \beta^2_p \sigma^2_m + \sigma^2_u$ (M1 §3)" />
        </p>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Systematic Risk" formula="$\beta^2_p \sigma^2_m$" value={data.systematic_risk * 252} fmt="num4"
            color="blue" description="Cannot be diversified away" />
          <MetricCard label="Non-Systematic Risk" formula="$\sigma^2_u = \sigma^2_p - \beta^2_p \sigma^2_m$" value={data.non_systematic_risk * 252} fmt="num4"
            description="Idiosyncratic — diversifiable" />
          <MetricCard label="Diversification Benefit" formula="$1 - \sigma^2_u / \sigma^2_p$"
            value={data.portfolio_variance > 0 ? 1 - data.non_systematic_risk / data.portfolio_variance : 0}
            fmt="num4" color="green" description="Market-factor R²" />
        </div>
        <div className="mt-3 rounded-lg border border-slate-700/40 bg-slate-800/30 p-3">
          {(() => {
            const total = data.systematic_risk + data.non_systematic_risk;
            const sysPct = total > 0 ? (data.systematic_risk / total) * 100 : 50;
            return (
              <>
                <div className="flex h-5 rounded overflow-hidden gap-px mb-2">
                  <div className="bg-blue-600 flex items-center justify-center text-[10px] text-white" style={{ width: `${sysPct}%` }}>
                    {sysPct > 10 ? `Systematic ${sysPct.toFixed(0)}%` : ''}
                  </div>
                  <div className="bg-slate-600 flex items-center justify-center text-[10px] text-white" style={{ width: `${100 - sysPct}%` }}>
                    {100 - sysPct > 10 ? `Idiosyncratic ${(100 - sysPct).toFixed(0)}%` : ''}
                  </div>
                </div>
                <div className="flex gap-4 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-600" />Systematic</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-600" />Idiosyncratic</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Higher moments */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Higher Moments (M1 Part II §5)</p>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Skewness" formula="$\hat{\gamma} = \frac{N}{(N-1)(N-2)}\sum\!\left(\frac{r-\bar{r}}{s}\right)^{\!3}$" value={data.skewness} fmt="num4"
            color={data.skewness < -0.5 ? 'red' : data.skewness > 0.5 ? 'green' : 'default'}
            description={data.skewness < -0.5 ? 'Negative: asymmetric downside tail' : data.skewness > 0.5 ? 'Positive: upside skewed' : 'Near-symmetric'} />
          <MetricCard label="Excess Kurtosis" formula="$\hat{\kappa} = \frac{N(N+1)}{(N-1)(N-2)(N-3)}\sum\!\left(\frac{r-\bar{r}}{s}\right)^{\!4} - 3$" value={data.kurtosis_excess} fmt="num4"
            color={data.kurtosis_excess > 1 ? 'red' : 'default'}
            description={data.kurtosis_excess > 1 ? 'Leptokurtic: fat tails, VaR risk' : 'Tail weight near-normal'} />
        </div>
      </div>

      <DistributionShape skewness={data.skewness} kurtosis={data.kurtosis_excess} />

      {data.asset_returns && data.asset_volatilities && (
        <AssetCrossSection
          symbols={symbols}
          assetReturns={Array.from(data.asset_returns)}
          vols={Array.from(data.asset_volatilities)}
          weights={weights}
        />
      )}

      {/* Formula reference */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">M1 L1 Formula Reference</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-x-auto">
          <MathBlock latex="R_p = \mathbf{w}^\top \bar{r}" />
          <MathBlock latex="\sigma^2_p = \mathbf{w}^\top \Sigma\,\mathbf{w}" />
          <MathBlock latex="\beta_p = \dfrac{\mathrm{Cov}(r_p,\,r_m)}{\mathrm{Var}(r_m)}" />
          <MathBlock latex="\sigma^2_p = \beta^2_p\,\sigma^2_m + \sigma^2_u" />
          <MathBlock latex="\hat{\gamma} = \dfrac{N}{(N{-}1)(N{-}2)}\sum\!\left(\dfrac{r-\bar{r}}{s}\right)^{\!3}" />
          <MathBlock latex="\hat{\kappa} = \dfrac{N(N{+}1)}{(N{-}1)(N{-}2)(N{-}3)}\sum\!\left(\dfrac{r-\bar{r}}{s}\right)^{\!4} - 3" />
        </div>
      </div>
    </div>
  );
};
