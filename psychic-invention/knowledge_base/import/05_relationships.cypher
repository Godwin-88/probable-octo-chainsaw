// 05_relationships.cypher — Run last, after 02_concepts and 03_formulas.
// Creates relationships between Formula and Concept/Formula. Creates missing Concept nodes if needed.

MERGE (a:TransactFormula {name: 'Black-Scholes Call'})
MERGE (b:TransactConcept {name: 'European Option'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Scholes Call'})
MERGE (b:TransactConcept {name: 'Black-Scholes Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Scholes Call'})
MERGE (b:TransactConcept {name: 'Risk-Neutral Measure'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Scholes Call'})
MERGE (b:TransactConcept {name: 'Geometric Brownian Motion'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Scholes Call'})
MERGE (b:TransactConcept {name: 'Log-Normal Distribution'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Scholes Call'})
MERGE (b:TransactConcept {name: 'Delta'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Scholes Call'})
MERGE (b:TransactFormula {name: 'Put-Call Parity'})
WITH a, b MERGE (a)-[r:DERIVES_FROM]->(b);

MERGE (a:TransactFormula {name: 'Black-Scholes Put'})
MERGE (b:TransactConcept {name: 'European Option'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Scholes Put'})
MERGE (b:TransactFormula {name: 'Put-Call Parity'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Scholes Put'})
MERGE (b:TransactConcept {name: 'Black-Scholes Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Heston Call'})
MERGE (b:TransactConcept {name: 'Heston Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Heston Call'})
MERGE (b:TransactConcept {name: 'Stochastic Volatility'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Heston Call'})
MERGE (b:TransactConcept {name: 'Characteristic Function'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Heston Call'})
MERGE (b:TransactConcept {name: 'CIR Process'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Heston Call'})
MERGE (b:TransactFormula {name: 'Feller Condition'})
WITH a, b MERGE (a)-[r:HAS_ASSUMPTION]->(b);

MERGE (a:TransactFormula {name: 'Heston Call'})
MERGE (b:TransactConcept {name: 'FFT Pricing'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Heston Characteristic Function'})
MERGE (b:TransactConcept {name: 'Heston Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Heston Characteristic Function'})
MERGE (b:TransactConcept {name: 'Fourier Analysis'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Heston Characteristic Function'})
MERGE (b:TransactConcept {name: 'Complex Analysis'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Monte Carlo Call'})
MERGE (b:TransactConcept {name: 'Monte Carlo Simulation'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Monte Carlo Call'})
MERGE (b:TransactConcept {name: 'Geometric Brownian Motion'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Monte Carlo Call'})
MERGE (b:TransactConcept {name: 'Risk-Neutral Measure'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Monte Carlo Call'})
MERGE (b:TransactConcept {name: 'Law of Large Numbers'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Monte Carlo Call'})
MERGE (b:TransactConcept {name: 'Central Limit Theorem'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Put-Call Parity'})
MERGE (b:TransactConcept {name: 'European Option'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Put-Call Parity'})
MERGE (b:TransactConcept {name: 'No-Arbitrage'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Put-Call Parity'})
MERGE (b:TransactConcept {name: 'Forward Contracts'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Portfolio Return'})
MERGE (b:TransactConcept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Portfolio Return'})
MERGE (b:TransactConcept {name: 'Portfolio Theory'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Portfolio Variance'})
MERGE (b:TransactConcept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Portfolio Variance'})
MERGE (b:TransactConcept {name: 'Diversification'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Portfolio Variance'})
MERGE (b:TransactConcept {name: 'Covariance Matrix'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Portfolio Beta'})
MERGE (b:TransactConcept {name: 'CAPM'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Portfolio Beta'})
MERGE (b:TransactConcept {name: 'Systematic Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Portfolio Beta'})
MERGE (b:TransactConcept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Global Minimum Variance'})
MERGE (b:TransactConcept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Global Minimum Variance'})
MERGE (b:TransactConcept {name: 'Diversification'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Global Minimum Variance'})
MERGE (b:TransactConcept {name: 'Efficient Frontier'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Tangency Portfolio'})
MERGE (b:TransactConcept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Tangency Portfolio'})
MERGE (b:TransactFormula {name: 'Sharpe Ratio'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Tangency Portfolio'})
MERGE (b:TransactConcept {name: 'Efficient Frontier'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Tangency Portfolio'})
MERGE (b:TransactConcept {name: 'Tobin Separation'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Litterman Posterior'})
MERGE (b:TransactConcept {name: 'Black-Litterman Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Litterman Posterior'})
MERGE (b:TransactConcept {name: 'Bayesian Updating'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Litterman Posterior'})
MERGE (b:TransactConcept {name: 'Reverse Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Litterman Posterior'})
MERGE (b:TransactConcept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Litterman Implied Returns'})
MERGE (b:TransactConcept {name: 'Black-Litterman Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Litterman Implied Returns'})
MERGE (b:TransactConcept {name: 'Reverse Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Black-Litterman Implied Returns'})
MERGE (b:TransactConcept {name: 'CAPM'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Kelly Criterion (Single)'})
MERGE (b:TransactConcept {name: 'Kelly Criterion'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Kelly Criterion (Single)'})
MERGE (b:TransactConcept {name: 'Log Utility'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Kelly Criterion (Single)'})
MERGE (b:TransactConcept {name: 'Gambling Theory'})
WITH a, b MERGE (a)-[r:DERIVES_FROM]->(b);

MERGE (a:TransactFormula {name: 'Kelly Criterion (Multi)'})
MERGE (b:TransactConcept {name: 'Kelly Criterion'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Kelly Criterion (Multi)'})
MERGE (b:TransactConcept {name: 'Log Utility'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Kelly Criterion (Multi)'})
MERGE (b:TransactConcept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:RELATED_TO]->(b);

MERGE (a:TransactFormula {name: 'Kelly Criterion (Multi)'})
MERGE (b:TransactConcept {name: 'Fractional Kelly'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Equal Risk Contribution'})
MERGE (b:TransactConcept {name: 'Risk Parity'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Equal Risk Contribution'})
MERGE (b:TransactConcept {name: 'Diversification'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Equal Risk Contribution'})
MERGE (b:TransactConcept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:RELATED_TO]->(b);

MERGE (a:TransactFormula {name: 'Hierarchical Risk Parity'})
MERGE (b:TransactConcept {name: 'Risk Parity'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Hierarchical Risk Parity'})
MERGE (b:TransactFormula {name: 'Correlation Distance'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Hierarchical Risk Parity'})
MERGE (b:TransactConcept {name: 'Single Linkage Clustering'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Hierarchical Risk Parity'})
MERGE (b:TransactConcept {name: 'Quasi-Diagonalization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Hierarchical Risk Parity'})
MERGE (b:TransactConcept {name: 'Recursive Bisection'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Hierarchical Risk Parity'})
MERGE (b:TransactConcept {name: 'Diversification'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'VaR Historical'})
MERGE (b:TransactConcept {name: 'Value at Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'VaR Historical'})
MERGE (b:TransactConcept {name: 'Empirical Distribution'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'VaR Historical'})
MERGE (b:TransactConcept {name: 'Non-Parametric Statistics'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'VaR Parametric Normal'})
MERGE (b:TransactConcept {name: 'Value at Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'VaR Parametric Normal'})
MERGE (b:TransactConcept {name: 'Normal Distribution'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'VaR Parametric Normal'})
MERGE (b:TransactConcept {name: 'Quantile Function'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'VaR Parametric t'})
MERGE (b:TransactConcept {name: 'Value at Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'VaR Parametric t'})
MERGE (b:TransactConcept {name: 'Student-t Distribution'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'VaR Parametric t'})
MERGE (b:TransactConcept {name: 'Maximum Likelihood Estimation'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Expected Shortfall (ES)'})
MERGE (b:TransactConcept {name: 'Value at Risk'})
WITH a, b MERGE (a)-[r:RELATED_TO]->(b);

MERGE (a:TransactFormula {name: 'Expected Shortfall (ES)'})
MERGE (b:TransactConcept {name: 'Coherent Risk Measure'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Expected Shortfall (ES)'})
MERGE (b:TransactConcept {name: 'Tail Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'VaR Time Scaling'})
MERGE (b:TransactConcept {name: 'Value at Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'VaR Time Scaling'})
MERGE (b:TransactConcept {name: 'I.I.D. Assumption'})
WITH a, b MERGE (a)-[r:HAS_ASSUMPTION]->(b);

MERGE (a:TransactFormula {name: 'VaR Time Scaling'})
MERGE (b:TransactConcept {name: 'Variance Additivity'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Sharpe Ratio'})
MERGE (b:TransactConcept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Sharpe Ratio'})
MERGE (b:TransactConcept {name: 'Performance Metrics'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Sharpe Ratio'})
MERGE (b:TransactConcept {name: 'Normal Distribution'})
WITH a, b MERGE (a)-[r:HAS_ASSUMPTION]->(b);

MERGE (a:TransactFormula {name: 'Sortino Ratio'})
MERGE (b:TransactConcept {name: 'Performance Metrics'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Sortino Ratio'})
MERGE (b:TransactConcept {name: 'Loss Aversion'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Sortino Ratio'})
MERGE (b:TransactConcept {name: 'Downside Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Treynor Ratio'})
MERGE (b:TransactConcept {name: 'Performance Metrics'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Treynor Ratio'})
MERGE (b:TransactConcept {name: 'CAPM'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Treynor Ratio'})
MERGE (b:TransactConcept {name: 'Diversification'})
WITH a, b MERGE (a)-[r:HAS_ASSUMPTION]->(b);

MERGE (a:TransactFormula {name: 'Information Ratio'})
MERGE (b:TransactConcept {name: 'Performance Metrics'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Information Ratio'})
MERGE (b:TransactConcept {name: 'Tracking Error'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Information Ratio'})
MERGE (b:TransactConcept {name: 'Benchmark-Relative'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'M² Modigliani'})
MERGE (b:TransactConcept {name: 'Performance Metrics'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'M² Modigliani'})
MERGE (b:TransactFormula {name: 'Sharpe Ratio'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'M² Modigliani'})
MERGE (b:TransactConcept {name: 'Comparability'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Factor Model'})
MERGE (b:TransactConcept {name: 'Asset Pricing'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Factor Model'})
MERGE (b:TransactConcept {name: 'Linear Regression'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Factor Model'})
MERGE (b:TransactConcept {name: 'Diversification'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Factor Loading'})
MERGE (b:TransactFormula {name: 'Factor Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Factor Loading'})
MERGE (b:TransactConcept {name: 'Systematic Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Factor Covariance'})
MERGE (b:TransactFormula {name: 'Factor Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Factor Covariance'})
MERGE (b:TransactConcept {name: 'Dimensionality Reduction'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Delta (Call)'})
MERGE (b:TransactConcept {name: 'Greeks'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Delta (Call)'})
MERGE (b:TransactConcept {name: 'Hedging'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Delta (Call)'})
MERGE (b:TransactConcept {name: 'Black-Scholes Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Gamma'})
MERGE (b:TransactConcept {name: 'Greeks'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Gamma'})
MERGE (b:TransactConcept {name: 'Delta Hedging'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Gamma'})
MERGE (b:TransactConcept {name: 'Convexity'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Theta (Call)'})
MERGE (b:TransactConcept {name: 'Greeks'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Theta (Call)'})
MERGE (b:TransactConcept {name: 'Time Value'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Theta (Call)'})
MERGE (b:TransactConcept {name: 'Volatility Decay'})
WITH a, b MERGE (a)-[r:RELATED_TO]->(b);

MERGE (a:TransactFormula {name: 'Vega'})
MERGE (b:TransactConcept {name: 'Greeks'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Vega'})
MERGE (b:TransactConcept {name: 'Volatility Trading'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Vega'})
MERGE (b:TransactConcept {name: 'Implied Volatility'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Rho (Call)'})
MERGE (b:TransactConcept {name: 'Greeks'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:TransactFormula {name: 'Rho (Call)'})
MERGE (b:TransactConcept {name: 'Discounting'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Rho (Call)'})
MERGE (b:TransactConcept {name: 'Interest Rate Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Correlation Distance'})
MERGE (b:TransactConcept {name: 'Hierarchical Clustering'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Correlation Distance'})
MERGE (b:TransactConcept {name: 'Correlation Matrix'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Correlation Distance'})
MERGE (b:TransactConcept {name: 'Triangle Inequality'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Feller Condition'})
MERGE (b:TransactConcept {name: 'CIR Process'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Feller Condition'})
MERGE (b:TransactConcept {name: 'Heston Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Feller Condition'})
MERGE (b:TransactConcept {name: 'Boundary Behavior'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Abramowitz-Stegun Normal CDF'})
MERGE (b:TransactConcept {name: 'Numerical Approximation'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Abramowitz-Stegun Normal CDF'})
MERGE (b:TransactConcept {name: 'Black-Scholes Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:TransactFormula {name: 'Abramowitz-Stegun Normal CDF'})
MERGE (b:TransactConcept {name: 'Error Bounds'})
WITH a, b MERGE (a)-[r:USES]->(b);
