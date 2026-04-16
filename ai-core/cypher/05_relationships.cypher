// 05_relationships.cypher — Run last, after 02_concepts and 03_formulas.
// Creates relationships between Formula and Concept/Formula. Creates missing Concept nodes if needed.

MERGE (a:Formula {name: 'Black-Scholes Call'})
MERGE (b:Concept {name: 'European Option'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Scholes Call'})
MERGE (b:Concept {name: 'Black-Scholes Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Scholes Call'})
MERGE (b:Concept {name: 'Risk-Neutral Measure'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Scholes Call'})
MERGE (b:Concept {name: 'Geometric Brownian Motion'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Scholes Call'})
MERGE (b:Concept {name: 'Log-Normal Distribution'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Scholes Call'})
MERGE (b:Concept {name: 'Delta'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Scholes Call'})
MERGE (b:Formula {name: 'Put-Call Parity'})
WITH a, b MERGE (a)-[r:DERIVES_FROM]->(b);

MERGE (a:Formula {name: 'Black-Scholes Put'})
MERGE (b:Concept {name: 'European Option'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Scholes Put'})
MERGE (b:Formula {name: 'Put-Call Parity'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Scholes Put'})
MERGE (b:Concept {name: 'Black-Scholes Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Heston Call'})
MERGE (b:Concept {name: 'Heston Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Heston Call'})
MERGE (b:Concept {name: 'Stochastic Volatility'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Heston Call'})
MERGE (b:Concept {name: 'Characteristic Function'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Heston Call'})
MERGE (b:Concept {name: 'CIR Process'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Heston Call'})
MERGE (b:Formula {name: 'Feller Condition'})
WITH a, b MERGE (a)-[r:HAS_ASSUMPTION]->(b);

MERGE (a:Formula {name: 'Heston Call'})
MERGE (b:Concept {name: 'FFT Pricing'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Heston Characteristic Function'})
MERGE (b:Concept {name: 'Heston Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Heston Characteristic Function'})
MERGE (b:Concept {name: 'Fourier Analysis'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Heston Characteristic Function'})
MERGE (b:Concept {name: 'Complex Analysis'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Monte Carlo Call'})
MERGE (b:Concept {name: 'Monte Carlo Simulation'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Monte Carlo Call'})
MERGE (b:Concept {name: 'Geometric Brownian Motion'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Monte Carlo Call'})
MERGE (b:Concept {name: 'Risk-Neutral Measure'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Monte Carlo Call'})
MERGE (b:Concept {name: 'Law of Large Numbers'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Monte Carlo Call'})
MERGE (b:Concept {name: 'Central Limit Theorem'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Put-Call Parity'})
MERGE (b:Concept {name: 'European Option'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Put-Call Parity'})
MERGE (b:Concept {name: 'No-Arbitrage'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Put-Call Parity'})
MERGE (b:Concept {name: 'Forward Contracts'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Portfolio Return'})
MERGE (b:Concept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Portfolio Return'})
MERGE (b:Concept {name: 'Portfolio Theory'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Portfolio Variance'})
MERGE (b:Concept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Portfolio Variance'})
MERGE (b:Concept {name: 'Diversification'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Portfolio Variance'})
MERGE (b:Concept {name: 'Covariance Matrix'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Portfolio Beta'})
MERGE (b:Concept {name: 'CAPM'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Portfolio Beta'})
MERGE (b:Concept {name: 'Systematic Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Portfolio Beta'})
MERGE (b:Concept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Global Minimum Variance'})
MERGE (b:Concept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Global Minimum Variance'})
MERGE (b:Concept {name: 'Diversification'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Global Minimum Variance'})
MERGE (b:Concept {name: 'Efficient Frontier'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Tangency Portfolio'})
MERGE (b:Concept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Tangency Portfolio'})
MERGE (b:Formula {name: 'Sharpe Ratio'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Tangency Portfolio'})
MERGE (b:Concept {name: 'Efficient Frontier'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Tangency Portfolio'})
MERGE (b:Concept {name: 'Tobin Separation'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Litterman Posterior'})
MERGE (b:Concept {name: 'Black-Litterman Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Litterman Posterior'})
MERGE (b:Concept {name: 'Bayesian Updating'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Litterman Posterior'})
MERGE (b:Concept {name: 'Reverse Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Litterman Posterior'})
MERGE (b:Concept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Litterman Implied Returns'})
MERGE (b:Concept {name: 'Black-Litterman Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Litterman Implied Returns'})
MERGE (b:Concept {name: 'Reverse Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Black-Litterman Implied Returns'})
MERGE (b:Concept {name: 'CAPM'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Kelly Criterion (Single)'})
MERGE (b:Concept {name: 'Kelly Criterion'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Kelly Criterion (Single)'})
MERGE (b:Concept {name: 'Log Utility'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Kelly Criterion (Single)'})
MERGE (b:Concept {name: 'Gambling Theory'})
WITH a, b MERGE (a)-[r:DERIVES_FROM]->(b);

MERGE (a:Formula {name: 'Kelly Criterion (Multi)'})
MERGE (b:Concept {name: 'Kelly Criterion'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Kelly Criterion (Multi)'})
MERGE (b:Concept {name: 'Log Utility'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Kelly Criterion (Multi)'})
MERGE (b:Concept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:RELATED_TO]->(b);

MERGE (a:Formula {name: 'Kelly Criterion (Multi)'})
MERGE (b:Concept {name: 'Fractional Kelly'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Equal Risk Contribution'})
MERGE (b:Concept {name: 'Risk Parity'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Equal Risk Contribution'})
MERGE (b:Concept {name: 'Diversification'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Equal Risk Contribution'})
MERGE (b:Concept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:RELATED_TO]->(b);

MERGE (a:Formula {name: 'Hierarchical Risk Parity'})
MERGE (b:Concept {name: 'Risk Parity'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Hierarchical Risk Parity'})
MERGE (b:Formula {name: 'Correlation Distance'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Hierarchical Risk Parity'})
MERGE (b:Concept {name: 'Single Linkage Clustering'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Hierarchical Risk Parity'})
MERGE (b:Concept {name: 'Quasi-Diagonalization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Hierarchical Risk Parity'})
MERGE (b:Concept {name: 'Recursive Bisection'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Hierarchical Risk Parity'})
MERGE (b:Concept {name: 'Diversification'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'VaR Historical'})
MERGE (b:Concept {name: 'Value at Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'VaR Historical'})
MERGE (b:Concept {name: 'Empirical Distribution'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'VaR Historical'})
MERGE (b:Concept {name: 'Non-Parametric Statistics'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'VaR Parametric Normal'})
MERGE (b:Concept {name: 'Value at Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'VaR Parametric Normal'})
MERGE (b:Concept {name: 'Normal Distribution'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'VaR Parametric Normal'})
MERGE (b:Concept {name: 'Quantile Function'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'VaR Parametric t'})
MERGE (b:Concept {name: 'Value at Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'VaR Parametric t'})
MERGE (b:Concept {name: 'Student-t Distribution'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'VaR Parametric t'})
MERGE (b:Concept {name: 'Maximum Likelihood Estimation'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Expected Shortfall (ES)'})
MERGE (b:Concept {name: 'Value at Risk'})
WITH a, b MERGE (a)-[r:RELATED_TO]->(b);

MERGE (a:Formula {name: 'Expected Shortfall (ES)'})
MERGE (b:Concept {name: 'Coherent Risk Measure'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Expected Shortfall (ES)'})
MERGE (b:Concept {name: 'Tail Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'VaR Time Scaling'})
MERGE (b:Concept {name: 'Value at Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'VaR Time Scaling'})
MERGE (b:Concept {name: 'I.I.D. Assumption'})
WITH a, b MERGE (a)-[r:HAS_ASSUMPTION]->(b);

MERGE (a:Formula {name: 'VaR Time Scaling'})
MERGE (b:Concept {name: 'Variance Additivity'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Sharpe Ratio'})
MERGE (b:Concept {name: 'Mean-Variance Optimization'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Sharpe Ratio'})
MERGE (b:Concept {name: 'Performance Metrics'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Sharpe Ratio'})
MERGE (b:Concept {name: 'Normal Distribution'})
WITH a, b MERGE (a)-[r:HAS_ASSUMPTION]->(b);

MERGE (a:Formula {name: 'Sortino Ratio'})
MERGE (b:Concept {name: 'Performance Metrics'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Sortino Ratio'})
MERGE (b:Concept {name: 'Loss Aversion'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Sortino Ratio'})
MERGE (b:Concept {name: 'Downside Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Treynor Ratio'})
MERGE (b:Concept {name: 'Performance Metrics'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Treynor Ratio'})
MERGE (b:Concept {name: 'CAPM'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Treynor Ratio'})
MERGE (b:Concept {name: 'Diversification'})
WITH a, b MERGE (a)-[r:HAS_ASSUMPTION]->(b);

MERGE (a:Formula {name: 'Information Ratio'})
MERGE (b:Concept {name: 'Performance Metrics'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Information Ratio'})
MERGE (b:Concept {name: 'Tracking Error'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Information Ratio'})
MERGE (b:Concept {name: 'Benchmark-Relative'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'M² Modigliani'})
MERGE (b:Concept {name: 'Performance Metrics'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'M² Modigliani'})
MERGE (b:Formula {name: 'Sharpe Ratio'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'M² Modigliani'})
MERGE (b:Concept {name: 'Comparability'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Factor Model'})
MERGE (b:Concept {name: 'Asset Pricing'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Factor Model'})
MERGE (b:Concept {name: 'Linear Regression'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Factor Model'})
MERGE (b:Concept {name: 'Diversification'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Factor Loading'})
MERGE (b:Formula {name: 'Factor Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Factor Loading'})
MERGE (b:Concept {name: 'Systematic Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Factor Covariance'})
MERGE (b:Formula {name: 'Factor Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Factor Covariance'})
MERGE (b:Concept {name: 'Dimensionality Reduction'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Delta (Call)'})
MERGE (b:Concept {name: 'Greeks'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Delta (Call)'})
MERGE (b:Concept {name: 'Hedging'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Delta (Call)'})
MERGE (b:Concept {name: 'Black-Scholes Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Gamma'})
MERGE (b:Concept {name: 'Greeks'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Gamma'})
MERGE (b:Concept {name: 'Delta Hedging'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Gamma'})
MERGE (b:Concept {name: 'Convexity'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Theta (Call)'})
MERGE (b:Concept {name: 'Greeks'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Theta (Call)'})
MERGE (b:Concept {name: 'Time Value'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Theta (Call)'})
MERGE (b:Concept {name: 'Volatility Decay'})
WITH a, b MERGE (a)-[r:RELATED_TO]->(b);

MERGE (a:Formula {name: 'Vega'})
MERGE (b:Concept {name: 'Greeks'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Vega'})
MERGE (b:Concept {name: 'Volatility Trading'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Vega'})
MERGE (b:Concept {name: 'Implied Volatility'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Rho (Call)'})
MERGE (b:Concept {name: 'Greeks'})
WITH a, b MERGE (a)-[r:BELONGS_TO]->(b);

MERGE (a:Formula {name: 'Rho (Call)'})
MERGE (b:Concept {name: 'Discounting'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Rho (Call)'})
MERGE (b:Concept {name: 'Interest Rate Risk'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Correlation Distance'})
MERGE (b:Concept {name: 'Hierarchical Clustering'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Correlation Distance'})
MERGE (b:Concept {name: 'Correlation Matrix'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Correlation Distance'})
MERGE (b:Concept {name: 'Triangle Inequality'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Feller Condition'})
MERGE (b:Concept {name: 'CIR Process'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Feller Condition'})
MERGE (b:Concept {name: 'Heston Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Feller Condition'})
MERGE (b:Concept {name: 'Boundary Behavior'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Abramowitz-Stegun Normal CDF'})
MERGE (b:Concept {name: 'Numerical Approximation'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Abramowitz-Stegun Normal CDF'})
MERGE (b:Concept {name: 'Black-Scholes Model'})
WITH a, b MERGE (a)-[r:USES]->(b);

MERGE (a:Formula {name: 'Abramowitz-Stegun Normal CDF'})
MERGE (b:Concept {name: 'Error Bounds'})
WITH a, b MERGE (a)-[r:USES]->(b);
