// 04_metrics_interpretations.cypher — Run after 03_formulas.cypher
// Creates Metric nodes and Interpretation nodes; links Metric-[:INTERPRETS]->Interpretation.

MERGE (m:Metric {name: 'Sharpe Ratio'});

MATCH (m:Metric {name: 'Sharpe Ratio'})
CREATE (i:Interpretation {condition: 'sharpe < 0', min: null, max: -10.0,
  interpretation: 'Negative risk-adjusted returns. The portfolio underperforms the risk-free rate, destroying value on a risk-adjusted basis.', action: 'Consider reducing exposure or reassessing strategy. Negative SR indicates the portfolio would be better off in risk-free assets.', confidence: 0.95, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Sharpe Ratio'})
CREATE (i:Interpretation {condition: 'sharpe >= 0 AND sharpe < 0.5', min: 0.0, max: 0.5,
  interpretation: 'Poor risk-adjusted returns. The portfolio generates less than 0.5 units of excess return per unit of volatility.', action: 'Review asset allocation and consider cost reduction. SR < 0.5 suggests inadequate compensation for risk taken.', confidence: 0.9, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Sharpe Ratio'})
CREATE (i:Interpretation {condition: 'sharpe >= 0.5 AND sharpe < 1.0', min: 0.5, max: 1.0,
  interpretation: 'Moderate risk-adjusted returns. The portfolio generates reasonable excess return relative to volatility.', action: 'Monitor for consistency. SR in 0.5-1.0 range is acceptable but room for improvement exists.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Sharpe Ratio'})
CREATE (i:Interpretation {condition: 'sharpe >= 1.0 AND sharpe < 1.5', min: 1.0, max: 1.5,
  interpretation: 'Good risk-adjusted returns. The portfolio generates solid excess return per unit of risk.', action: 'Maintain current strategy while monitoring for regime changes. SR > 1.0 indicates competent management.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Sharpe Ratio'})
CREATE (i:Interpretation {condition: 'sharpe >= 1.5 AND sharpe < 2.5', min: 1.5, max: 2.5,
  interpretation: 'Excellent risk-adjusted returns. The portfolio generates 1.5+ units of excess return per unit of volatility.', action: 'Consider increasing allocation if risk tolerance permits. SR > 1.5 places portfolio in top quartile.', confidence: 0.9, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Sharpe Ratio'})
CREATE (i:Interpretation {condition: 'sharpe >= 2.5', min: 2.5, max: 10.0,
  interpretation: 'Outstanding risk-adjusted returns. The portfolio exhibits exceptional performance relative to risk.', action: 'Verify sustainability and check for hidden risks. SR > 2.5 is rare and may indicate leverage or illiquidity.', confidence: 0.8, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Sortino Ratio'});

MATCH (m:Metric {name: 'Sortino Ratio'})
CREATE (i:Interpretation {condition: 'sortino < 0', min: null, max: -10.0,
  interpretation: 'Negative downside risk-adjusted returns. Portfolio underperforms MAR with significant downside deviation.', action: 'Immediate review required. Negative Sortino indicates losses exceed gains on downside.', confidence: 0.95, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Sortino Ratio'})
CREATE (i:Interpretation {condition: 'sortino >= 0 AND sortino < 1.0', min: 0.0, max: 1.0,
  interpretation: 'Poor downside risk-adjusted returns. Limited compensation for downside risk taken.', action: 'Consider downside protection strategies. Sortino < 1.0 suggests inadequate loss management.', confidence: 0.9, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Sortino Ratio'})
CREATE (i:Interpretation {condition: 'sortino >= 1.0 AND sortino < 2.0', min: 1.0, max: 2.0,
  interpretation: 'Moderate downside risk-adjusted returns. Acceptable compensation for downside volatility.', action: 'Monitor downside capture ratio. Sortino 1.0-2.0 is typical for long-only equity strategies.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Sortino Ratio'})
CREATE (i:Interpretation {condition: 'sortino >= 2.0', min: 2.0, max: 10.0,
  interpretation: 'Strong downside risk-adjusted returns. Portfolio effectively limits losses while capturing gains.', action: 'Maintain risk management framework. Sortino > 2.0 indicates excellent downside protection.', confidence: 0.9, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Treynor Ratio'});

MATCH (m:Metric {name: 'Treynor Ratio'})
CREATE (i:Interpretation {condition: 'treynor < 0', min: null, max: -10.0,
  interpretation: 'Negative systematic risk-adjusted returns. Portfolio underperforms given its market exposure.', action: 'Reduce beta exposure or add alpha sources. Negative TR indicates poor market timing or stock selection.', confidence: 0.9, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Treynor Ratio'})
CREATE (i:Interpretation {condition: 'treynor >= 0 AND treynor < 0.05', min: 0.0, max: 0.05,
  interpretation: 'Low systematic risk-adjusted returns. Minimal compensation for market risk assumed.', action: 'Consider passive alternative. Low TR suggests active management is not adding value.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Treynor Ratio'})
CREATE (i:Interpretation {condition: 'treynor >= 0.05 AND treynor < 0.10', min: 0.05, max: 0.1,
  interpretation: 'Moderate systematic risk-adjusted returns. Reasonable compensation for beta exposure.', action: 'Acceptable for diversified equity portfolio. TR 5-10% per unit beta is market-consistent.', confidence: 0.8, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Treynor Ratio'})
CREATE (i:Interpretation {condition: 'treynor >= 0.10', min: 0.1, max: 1.0,
  interpretation: 'Strong systematic risk-adjusted returns. Portfolio generates significant alpha per unit of beta.', action: 'Investigate alpha sources for sustainability. TR > 10% suggests skilled active management.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Information Ratio'});

MATCH (m:Metric {name: 'Information Ratio'})
CREATE (i:Interpretation {condition: 'ir < 0', min: null, max: -10.0,
  interpretation: 'Negative active returns per unit of tracking error. Active management destroys value relative to benchmark.', action: 'Reconsider active strategy or reduce tracking error. Negative IR indicates closet indexing with fees.', confidence: 0.95, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Information Ratio'})
CREATE (i:Interpretation {condition: 'ir >= 0 AND ir < 0.25', min: 0.0, max: 0.25,
  interpretation: 'Weak active management. Minimal value added per unit of active risk taken.', action: 'Review active bets and concentration. IR < 0.25 barely justifies active management fees.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Information Ratio'})
CREATE (i:Interpretation {condition: 'ir >= 0.25 AND ir < 0.50', min: 0.25, max: 0.5,
  interpretation: 'Moderate active management skill. Reasonable value added relative to tracking error.', action: 'Maintain current process with incremental improvements. IR 0.25-0.50 is typical for skilled managers.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Information Ratio'})
CREATE (i:Interpretation {condition: 'ir >= 0.50 AND ir < 0.75', min: 0.5, max: 0.75,
  interpretation: 'Good active management. Strong value added per unit of active risk.', action: 'Consider increasing active share. IR > 0.50 indicates consistent alpha generation.', confidence: 0.9, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Information Ratio'})
CREATE (i:Interpretation {condition: 'ir >= 0.75', min: 0.75, max: 5.0,
  interpretation: 'Excellent active management. Exceptional value added relative to benchmark.', action: 'Monitor capacity constraints. IR > 0.75 is top-decile performance, may not scale.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'VaR (95%)'});

MATCH (m:Metric {name: 'VaR (95%)'})
CREATE (i:Interpretation {condition: 'var_95 < -0.05', min: null, max: -10.0,
  interpretation: 'Extreme daily VaR. Portfolio could lose 5%+ in a single day at 95% confidence.', action: 'Immediate risk review required. VaR > 5% daily indicates very high risk exposure.', confidence: 0.95, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'VaR (95%)'})
CREATE (i:Interpretation {condition: 'var_95 >= -0.05 AND var_95 < -0.03', min: -0.05, max: -0.03,
  interpretation: 'High daily VaR. Portfolio could lose 3-5% in a single day at 95% confidence.', action: 'Consider risk reduction measures. VaR 3-5% daily is aggressive for most mandates.', confidence: 0.9, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'VaR (95%)'})
CREATE (i:Interpretation {condition: 'var_95 >= -0.03 AND var_95 < -0.02', min: -0.03, max: -0.02,
  interpretation: 'Moderate daily VaR. Portfolio could lose 2-3% in a single day at 95% confidence.', action: 'Acceptable for equity-focused strategies. Monitor during volatile periods.', confidence: 0.85, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'VaR (95%)'})
CREATE (i:Interpretation {condition: 'var_95 >= -0.02 AND var_95 < -0.01', min: -0.02, max: -0.01,
  interpretation: 'Conservative daily VaR. Portfolio could lose 1-2% in a single day at 95% confidence.', action: 'Appropriate for balanced portfolios. VaR 1-2% aligns with moderate risk tolerance.', confidence: 0.85, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'VaR (95%)'})
CREATE (i:Interpretation {condition: 'var_95 >= -0.01', min: -0.01, max: 0.0,
  interpretation: 'Very conservative daily VaR. Portfolio could lose <1% in a single day at 95% confidence.', action: 'Low risk profile suitable for capital preservation. May limit return potential.', confidence: 0.8, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'VaR (99%)'});

MATCH (m:Metric {name: 'VaR (99%)'})
CREATE (i:Interpretation {condition: 'var_99 < -0.10', min: null, max: -10.0,
  interpretation: 'Extreme tail risk. Portfolio could lose 10%+ in a single day at 99% confidence.', action: 'Critical risk management intervention needed. VaR(99%) > 10% indicates severe tail exposure.', confidence: 0.95, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'VaR (99%)'})
CREATE (i:Interpretation {condition: 'var_99 >= -0.10 AND var_99 < -0.05', min: -0.1, max: -0.05,
  interpretation: 'Elevated tail risk. Portfolio could lose 5-10% in a single day at 99% confidence.', action: 'Implement tail hedging strategies. VaR(99%) 5-10% requires active monitoring.', confidence: 0.9, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'VaR (99%)'})
CREATE (i:Interpretation {condition: 'var_99 >= -0.05 AND var_99 < -0.03', min: -0.05, max: -0.03,
  interpretation: 'Moderate tail risk. Portfolio could lose 3-5% in a single day at 99% confidence.', action: 'Acceptable for high-risk strategies. Ensure adequate capital buffers.', confidence: 0.85, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'VaR (99%)'})
CREATE (i:Interpretation {condition: 'var_99 >= -0.03', min: -0.03, max: 0.0,
  interpretation: 'Conservative tail risk. Portfolio could lose <3% in a single day at 99% confidence.', action: 'Well-managed tail risk profile. Suitable for most institutional mandates.', confidence: 0.85, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Expected Shortfall (95%)'});

MATCH (m:Metric {name: 'Expected Shortfall (95%)'})
CREATE (i:Interpretation {condition: 'es_95 < -0.08', min: null, max: -10.0,
  interpretation: 'Extreme expected tail loss. Average loss beyond VaR(95%) exceeds 8%.', action: 'Urgent portfolio de-risking recommended. ES > 8% indicates dangerous tail exposure.', confidence: 0.95, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Expected Shortfall (95%)'})
CREATE (i:Interpretation {condition: 'es_95 >= -0.08 AND es_95 < -0.04', min: -0.08, max: -0.04,
  interpretation: 'High expected tail loss. Average loss beyond VaR(95%) is 4-8%.', action: 'Consider tail hedging via options or futures. ES 4-8% requires active management.', confidence: 0.9, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Expected Shortfall (95%)'})
CREATE (i:Interpretation {condition: 'es_95 >= -0.04 AND es_95 < -0.02', min: -0.04, max: -0.02,
  interpretation: 'Moderate expected tail loss. Average loss beyond VaR(95%) is 2-4%.', action: 'Monitor concentration and correlation risk. ES 2-4% is manageable with oversight.', confidence: 0.85, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Expected Shortfall (95%)'})
CREATE (i:Interpretation {condition: 'es_95 >= -0.02', min: -0.02, max: 0.0,
  interpretation: 'Conservative expected tail loss. Average loss beyond VaR(95%) is <2%.', action: 'Well-controlled tail risk. ES < 2% aligns with conservative risk mandates.', confidence: 0.85, menu_context: 'Risk'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Beta'});

MATCH (m:Metric {name: 'Beta'})
CREATE (i:Interpretation {condition: 'beta < 0.5', min: null, max: -10.0,
  interpretation: 'Very low market sensitivity. Portfolio moves less than half as much as the market.', action: 'Suitable for defensive positioning. Low beta provides downside protection but limits upside.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Beta'})
CREATE (i:Interpretation {condition: 'beta >= 0.5 AND beta < 0.8', min: 0.5, max: 0.8,
  interpretation: 'Low market sensitivity. Portfolio is less volatile than the market.', action: 'Defensive stance appropriate for risk-averse investors. Expect underperformance in bull markets.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Beta'})
CREATE (i:Interpretation {condition: 'beta >= 0.8 AND beta < 1.2', min: 0.8, max: 1.2,
  interpretation: 'Market-like sensitivity. Portfolio moves roughly in line with the market.', action: 'Neutral positioning. Beta 0.8-1.2 is appropriate for core equity holdings.', confidence: 0.8, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Beta'})
CREATE (i:Interpretation {condition: 'beta >= 1.2 AND beta < 1.5', min: 1.2, max: 1.5,
  interpretation: 'High market sensitivity. Portfolio amplifies market movements by 20-50%.', action: 'Aggressive stance suitable for risk-tolerant investors. Expect amplified gains and losses.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Beta'})
CREATE (i:Interpretation {condition: 'beta >= 1.5', min: 1.5, max: 10.0,
  interpretation: 'Very high market sensitivity. Portfolio moves 1.5x+ more than the market.', action: 'High-risk positioning. Beta > 1.5 requires strong conviction and risk tolerance.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Alpha'});

MATCH (m:Metric {name: 'Alpha'})
CREATE (i:Interpretation {condition: 'alpha < -0.02', min: null, max: -10.0,
  interpretation: 'Significant negative alpha. Portfolio underperforms CAPM prediction by 2%+ annually.', action: 'Investigate sources of underperformance. Negative alpha suggests poor security selection or timing.', confidence: 0.9, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Alpha'})
CREATE (i:Interpretation {condition: 'alpha >= -0.02 AND alpha < 0.01', min: -0.02, max: 0.01,
  interpretation: 'Slight negative to neutral alpha. Portfolio performs roughly as CAPM predicts.', action: 'Passive exposure may be more cost-effective. Alpha near zero does not justify active fees.', confidence: 0.8, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Alpha'})
CREATE (i:Interpretation {condition: 'alpha >= 0.01 AND alpha < 0.03', min: 0.01, max: 0.03,
  interpretation: 'Modest positive alpha. Portfolio outperforms CAPM prediction by 1-3% annually.', action: 'Reasonable active management value. Alpha 1-3% may justify moderate fees.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Alpha'})
CREATE (i:Interpretation {condition: 'alpha >= 0.03', min: 0.03, max: 0.2,
  interpretation: 'Strong positive alpha. Portfolio outperforms CAPM prediction by 3%+ annually.', action: 'Exceptional skill or risk-taking. Alpha > 3% warrants investigation for sustainability.', confidence: 0.8, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Skewness'});

MATCH (m:Metric {name: 'Skewness'})
CREATE (i:Interpretation {condition: 'skewness < -1.0', min: null, max: -10.0,
  interpretation: 'Extreme negative skew. Portfolio has significant crash risk with fat left tail.', action: 'Implement tail hedging immediately. Skew < -1.0 indicates high probability of extreme losses.', confidence: 0.9, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Skewness'})
CREATE (i:Interpretation {condition: 'skewness >= -1.0 AND skewness < -0.5', min: -1.0, max: -0.5,
  interpretation: 'Moderate negative skew. Portfolio has asymmetric downside risk.', action: 'Monitor for tail events. Negative skew requires compensation via higher expected returns.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Skewness'})
CREATE (i:Interpretation {condition: 'skewness >= -0.5 AND skewness < 0.5', min: -0.5, max: 0.5,
  interpretation: 'Near-symmetric returns. Portfolio distribution approximates normal symmetry.', action: 'Standard risk metrics (Sharpe, VaR) are appropriate. No significant skew concerns.', confidence: 0.8, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Skewness'})
CREATE (i:Interpretation {condition: 'skewness >= 0.5 AND skewness < 1.0', min: 0.5, max: 1.0,
  interpretation: 'Moderate positive skew. Portfolio has occasional large positive returns.', action: 'Attractive for risk-averse investors. Positive skew provides lottery-like payoff.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Skewness'})
CREATE (i:Interpretation {condition: 'skewness >= 1.0', min: 1.0, max: 10.0,
  interpretation: 'High positive skew. Portfolio exhibits significant right-tail asymmetry.', action: 'May indicate option-like payoffs or momentum strategies. Verify return distribution.', confidence: 0.8, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Kurtosis (Excess)'});

MATCH (m:Metric {name: 'Kurtosis (Excess)'})
CREATE (i:Interpretation {condition: 'kurtosis > 5', min: 5.0, max: 50.0,
  interpretation: 'Extreme fat tails. Portfolio has very high probability of extreme returns (both directions).', action: 'Stress test for tail events. Excess kurtosis > 5 indicates non-normal distribution.', confidence: 0.9, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Kurtosis (Excess)'})
CREATE (i:Interpretation {condition: 'kurtosis > 2 AND kurtosis <= 5', min: 2.0, max: 5.0,
  interpretation: 'Moderate fat tails. Portfolio has elevated probability of extreme returns.', action: 'Use robust risk measures (ES, stress tests). Normal-based VaR may underestimate risk.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Kurtosis (Excess)'})
CREATE (i:Interpretation {condition: 'kurtosis > 0 AND kurtosis <= 2', min: 0.0, max: 2.0,
  interpretation: 'Slightly fat tails. Portfolio has modest elevation in extreme return probability.', action: 'Standard risk metrics acceptable with caution. Mild deviation from normality.', confidence: 0.8, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Kurtosis (Excess)'})
CREATE (i:Interpretation {condition: 'kurtosis >= -0.5 AND kurtosis <= 0', min: -0.5, max: 0.0,
  interpretation: 'Near-normal kurtosis. Portfolio return distribution approximates normal.', action: 'Standard risk metrics (VaR, Sharpe) are appropriate. Distribution is well-behaved.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Portfolio Volatility'});

MATCH (m:Metric {name: 'Portfolio Volatility'})
CREATE (i:Interpretation {condition: 'vol < 0.05', min: null, max: -10.0,
  interpretation: 'Very low volatility. Portfolio exhibits minimal return variation.', action: 'Capital preservation mode. Vol < 5% annualized is bond-like, may limit returns.', confidence: 0.8, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Portfolio Volatility'})
CREATE (i:Interpretation {condition: 'vol >= 0.05 AND vol < 0.10', min: 0.05, max: 0.1,
  interpretation: 'Low volatility. Portfolio has below-market return variation.', action: 'Conservative positioning. Vol 5-10% suitable for low-risk mandates.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Portfolio Volatility'})
CREATE (i:Interpretation {condition: 'vol >= 0.10 AND vol < 0.20', min: 0.1, max: 0.2,
  interpretation: 'Moderate volatility. Portfolio has market-like return variation.', action: 'Balanced risk profile. Vol 10-20% is typical for equity portfolios.', confidence: 0.8, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Portfolio Volatility'})
CREATE (i:Interpretation {condition: 'vol >= 0.20 AND vol < 0.30', min: 0.2, max: 0.3,
  interpretation: 'High volatility. Portfolio exhibits significant return variation.', action: 'Aggressive positioning. Vol 20-30% requires high risk tolerance.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Portfolio Volatility'})
CREATE (i:Interpretation {condition: 'vol >= 0.30', min: 0.3, max: 2.0,
  interpretation: 'Very high volatility. Portfolio has extreme return variation.', action: 'Very aggressive or leveraged. Vol > 30% requires careful monitoring.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'M² Modigliani'});

MATCH (m:Metric {name: 'M² Modigliani'})
CREATE (i:Interpretation {condition: 'm2 < 0', min: null, max: -10.0,
  interpretation: 'Negative risk-adjusted return in absolute terms. Portfolio underperforms risk-free rate on risk-adjusted basis.', action: 'Fundamental strategy review needed. Negative M² indicates value destruction.', confidence: 0.95, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'M² Modigliani'})
CREATE (i:Interpretation {condition: 'm2 >= 0 AND m2 < benchmark_return', min: 0.0, max: 0.15,
  interpretation: 'Underperforming on risk-adjusted basis. M² is positive but below benchmark.', action: 'Review active positioning. Positive but sub-benchmark M² suggests partial success.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'M² Modigliani'})
CREATE (i:Interpretation {condition: 'm2 >= benchmark_return AND m2 < benchmark_return + 0.03', min: 0.05, max: 0.2,
  interpretation: 'Competitive risk-adjusted returns. M² meets or slightly exceeds benchmark.', action: 'Acceptable performance. M² ≈ benchmark indicates market-consistent risk-adjusted returns.', confidence: 0.8, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'M² Modigliani'})
CREATE (i:Interpretation {condition: 'm2 >= benchmark_return + 0.03', min: 0.08, max: 1.0,
  interpretation: 'Outstanding risk-adjusted returns. M² exceeds benchmark by 3%+ annually.', action: 'Exceptional performance. M² > benchmark + 3% places portfolio in top tier.', confidence: 0.85, menu_context: 'Portfolio'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Option Delta (Call)'});

MATCH (m:Metric {name: 'Option Delta (Call)'})
CREATE (i:Interpretation {condition: 'delta > 0.8', min: 0.8, max: 1.0,
  interpretation: 'Deep in-the-money. Call option behaves almost like underlying stock (delta ≈ 1).', action: 'High directional exposure. Delta > 0.8 indicates high probability of expiring ITM.', confidence: 0.9, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Delta (Call)'})
CREATE (i:Interpretation {condition: 'delta > 0.6 AND delta <= 0.8', min: 0.6, max: 0.8,
  interpretation: 'In-the-money. Call option has significant intrinsic value.', action: 'Moderate-high directional exposure. Consider profit-taking if target reached.', confidence: 0.85, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Delta (Call)'})
CREATE (i:Interpretation {condition: 'delta > 0.4 AND delta <= 0.6', min: 0.4, max: 0.6,
  interpretation: 'At-the-money. Call option has roughly 50% probability of expiring ITM.', action: 'Maximum gamma exposure. Delta hedging requires frequent rebalancing.', confidence: 0.85, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Delta (Call)'})
CREATE (i:Interpretation {condition: 'delta > 0.2 AND delta <= 0.4', min: 0.2, max: 0.4,
  interpretation: 'Out-of-the-money. Call option has limited intrinsic value.', action: 'Speculative positioning. Delta 0.2-0.4 indicates low probability of expiring ITM.', confidence: 0.8, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Delta (Call)'})
CREATE (i:Interpretation {condition: 'delta <= 0.2', min: 0.0, max: 0.2,
  interpretation: 'Deep out-of-the-money. Call option has very low probability of expiring ITM.', action: 'Lottery-like payoff. Delta < 0.2 suggests <20% risk-neutral probability.', confidence: 0.8, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Option Gamma'});

MATCH (m:Metric {name: 'Option Gamma'})
CREATE (i:Interpretation {condition: 'gamma > 0.05', min: 0.05, max: 1.0,
  interpretation: 'Very high gamma. Delta changes rapidly with underlying price movements.', action: 'High hedging frequency required. Gamma > 0.05 indicates ATM or near-expiry options.', confidence: 0.85, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Gamma'})
CREATE (i:Interpretation {condition: 'gamma > 0.02 AND gamma <= 0.05', min: 0.02, max: 0.05,
  interpretation: 'Elevated gamma. Delta is moderately sensitive to price changes.', action: 'Monitor delta drift. Gamma 0.02-0.05 requires daily hedging adjustment.', confidence: 0.8, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Gamma'})
CREATE (i:Interpretation {condition: 'gamma > 0.005 AND gamma <= 0.02', min: 0.005, max: 0.02,
  interpretation: 'Moderate gamma. Delta changes gradually with underlying.', action: 'Standard hedging frequency. Gamma 0.005-0.02 is typical for equity options.', confidence: 0.8, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Gamma'})
CREATE (i:Interpretation {condition: 'gamma <= 0.005', min: 0.0, max: 0.005,
  interpretation: 'Low gamma. Delta is relatively stable.', action: 'Infrequent hedging sufficient. Low gamma indicates deep ITM/OTM or long-dated options.', confidence: 0.85, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Option Theta (daily)'});

MATCH (m:Metric {name: 'Option Theta (daily)'})
CREATE (i:Interpretation {condition: 'theta < -0.10', min: null, max: -0.1,
  interpretation: 'Extreme time decay. Option loses 10%+ of value per day from time passage.', action: 'Avoid holding long positions. Theta < -0.10 indicates near-expiry ATM options.', confidence: 0.9, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Theta (daily)'})
CREATE (i:Interpretation {condition: 'theta < -0.05 AND theta >= -0.10', min: -0.1, max: -0.05,
  interpretation: 'High time decay. Option loses 5-10% of value daily.', action: 'Short-dated options benefit sellers. Long positions require directional view.', confidence: 0.85, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Theta (daily)'})
CREATE (i:Interpretation {condition: 'theta < -0.02 AND theta >= -0.05', min: -0.05, max: -0.02,
  interpretation: 'Moderate time decay. Option loses 2-5% of value daily.', action: 'Standard theta for equity options. Time decay is manageable for long positions.', confidence: 0.8, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Theta (daily)'})
CREATE (i:Interpretation {condition: 'theta >= -0.02', min: -0.02, max: 0.0,
  interpretation: 'Low time decay. Option loses <2% of value daily.', action: 'Long-dated options have minimal theta. Time is not a significant factor.', confidence: 0.85, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Option Vega (per 1% vol)'});

MATCH (m:Metric {name: 'Option Vega (per 1% vol)'})
CREATE (i:Interpretation {condition: 'vega > 0.5', min: 0.5, max: 5.0,
  interpretation: 'Very high vega. Option value changes 50%+ per 1% volatility move.', action: 'High volatility exposure. Vega > 0.5 indicates long-dated or ATM options.', confidence: 0.85, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Vega (per 1% vol)'})
CREATE (i:Interpretation {condition: 'vega > 0.2 AND vega <= 0.5', min: 0.2, max: 0.5,
  interpretation: 'Elevated vega. Option is moderately sensitive to volatility changes.', action: 'Monitor implied volatility. Vega 0.2-0.5 requires vol risk management.', confidence: 0.8, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Vega (per 1% vol)'})
CREATE (i:Interpretation {condition: 'vega > 0.05 AND vega <= 0.2', min: 0.05, max: 0.2,
  interpretation: 'Moderate vega. Option has typical volatility sensitivity.', action: 'Standard vol exposure. Vega 0.05-0.2 is common for equity options.', confidence: 0.8, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Option Vega (per 1% vol)'})
CREATE (i:Interpretation {condition: 'vega <= 0.05', min: 0.0, max: 0.05,
  interpretation: 'Low vega. Option value is minimally affected by volatility changes.', action: 'Short-dated or deep ITM/OTM options. Volatility risk is secondary concern.', confidence: 0.85, menu_context: 'Pricer'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Black-Litterman View Uncertainty'});

MATCH (m:Metric {name: 'Black-Litterman View Uncertainty'})
CREATE (i:Interpretation {condition: 'omega_ratio < 0.5', min: null, max: -10.0,
  interpretation: 'Very high conviction views. View uncertainty is less than half of prior uncertainty.', action: 'Aggressive active bets. Low omega ratio may lead to concentrated positions.', confidence: 0.85, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Black-Litterman View Uncertainty'})
CREATE (i:Interpretation {condition: 'omega_ratio >= 0.5 AND omega_ratio < 1.0', min: 0.5, max: 1.0,
  interpretation: 'High conviction views. View uncertainty is comparable to prior uncertainty.', action: 'Balanced approach. Omega 0.5-1.0 blends views with equilibrium reasonably.', confidence: 0.8, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Black-Litterman View Uncertainty'})
CREATE (i:Interpretation {condition: 'omega_ratio >= 1.0 AND omega_ratio < 2.0', min: 1.0, max: 2.0,
  interpretation: 'Moderate conviction views. View uncertainty exceeds prior uncertainty.', action: 'Conservative active positioning. High omega ratio keeps weights near equilibrium.', confidence: 0.8, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Black-Litterman View Uncertainty'})
CREATE (i:Interpretation {condition: 'omega_ratio >= 2.0', min: 2.0, max: 10.0,
  interpretation: 'Low conviction views. View uncertainty dominates prior uncertainty.', action: 'Minimal deviation from market weights. Views have limited impact on allocation.', confidence: 0.85, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Kelly Fraction'});

MATCH (m:Metric {name: 'Kelly Fraction'})
CREATE (i:Interpretation {condition: 'kelly_fraction > 1.0', min: 1.0, max: 5.0,
  interpretation: 'Leveraged Kelly fraction. Optimal bet exceeds 100% of capital.', action: 'Requires leverage. Kelly > 1.0 indicates high edge relative to odds.', confidence: 0.8, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Kelly Fraction'})
CREATE (i:Interpretation {condition: 'kelly_fraction > 0.5 AND kelly_fraction <= 1.0', min: 0.5, max: 1.0,
  interpretation: 'Aggressive Kelly fraction. Optimal bet is 50-100% of capital.', action: 'Concentrated positioning. Consider fractional Kelly for risk management.', confidence: 0.85, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Kelly Fraction'})
CREATE (i:Interpretation {condition: 'kelly_fraction > 0.25 AND kelly_fraction <= 0.5', min: 0.25, max: 0.5,
  interpretation: 'Moderate Kelly fraction. Optimal bet is 25-50% of capital.', action: 'Balanced growth vs. volatility. Kelly 0.25-0.50 is reasonable for most investors.', confidence: 0.85, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Kelly Fraction'})
CREATE (i:Interpretation {condition: 'kelly_fraction > 0.1 AND kelly_fraction <= 0.25', min: 0.1, max: 0.25,
  interpretation: 'Conservative Kelly fraction. Optimal bet is 10-25% of capital.', action: 'Cautious positioning. Low Kelly fraction indicates modest edge or high variance.', confidence: 0.8, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Kelly Fraction'})
CREATE (i:Interpretation {condition: 'kelly_fraction <= 0.1', min: 0.0, max: 0.1,
  interpretation: 'Very conservative Kelly fraction. Optimal bet is <10% of capital.', action: 'Minimal exposure warranted. Kelly < 0.1 suggests limited edge or high uncertainty.', confidence: 0.85, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'Risk Parity Risk Contribution'});

MATCH (m:Metric {name: 'Risk Parity Risk Contribution'})
CREATE (i:Interpretation {condition: 'rc_deviation < 0.01', min: null, max: -10.0,
  interpretation: 'Near-perfect risk parity. All assets contribute almost equally to portfolio risk.', action: 'Well-balanced portfolio. RC deviation < 1% indicates successful ERC optimization.', confidence: 0.9, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Risk Parity Risk Contribution'})
CREATE (i:Interpretation {condition: 'rc_deviation >= 0.01 AND rc_deviation < 0.05', min: 0.01, max: 0.05,
  interpretation: 'Good risk balance. Risk contributions are approximately equal.', action: 'Acceptable risk parity. RC deviation 1-5% is typical for practical implementations.', confidence: 0.85, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Risk Parity Risk Contribution'})
CREATE (i:Interpretation {condition: 'rc_deviation >= 0.05 AND rc_deviation < 0.10', min: 0.05, max: 0.1,
  interpretation: 'Moderate risk imbalance. Some assets contribute more than others to portfolio risk.', action: 'Review optimization constraints. RC deviation 5-10% may indicate binding constraints.', confidence: 0.8, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'Risk Parity Risk Contribution'})
CREATE (i:Interpretation {condition: 'rc_deviation >= 0.10', min: 0.1, max: 1.0,
  interpretation: 'Significant risk imbalance. Risk contributions are highly unequal.', action: 'Risk parity objective not achieved. RC deviation > 10% requires constraint relaxation.', confidence: 0.85, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MERGE (m:Metric {name: 'HRP Cluster Stability'});

MATCH (m:Metric {name: 'HRP Cluster Stability'})
CREATE (i:Interpretation {condition: 'cophenetic_corr > 0.8', min: 0.8, max: 1.0,
  interpretation: 'High cluster stability. Hierarchical structure is well-defined and robust.', action: 'Confident in HRP allocation. Cophenetic correlation > 0.8 indicates reliable clustering.', confidence: 0.85, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'HRP Cluster Stability'})
CREATE (i:Interpretation {condition: 'cophenetic_corr > 0.6 AND cophenetic_corr <= 0.8', min: 0.6, max: 0.8,
  interpretation: 'Moderate cluster stability. Hierarchical structure is reasonably well-defined.', action: 'Acceptable for HRP. Cophenetic 0.6-0.8 suggests moderate clustering quality.', confidence: 0.8, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);

MATCH (m:Metric {name: 'HRP Cluster Stability'})
CREATE (i:Interpretation {condition: 'cophenetic_corr <= 0.6', min: 0.0, max: 0.6,
  interpretation: 'Low cluster stability. Hierarchical structure is weak or ill-defined.', action: 'HRP may not add value. Cophenetic < 0.6 suggests assets are not clearly clustered.', confidence: 0.85, menu_context: 'Optimizer'})
MERGE (m)-[:INTERPRETS]->(i);
