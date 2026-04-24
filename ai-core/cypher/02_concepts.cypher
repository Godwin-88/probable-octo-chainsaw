// 02_concepts.cypher — Run after 01_menus.cypher
// Creates Concept nodes and BELONGS_TO links to Menu.

MERGE (c:Concept {name: 'European Option'})
  SET c.definition = 'Financial contract giving holder the right (but not obligation) to buy/sell underlying at strike price K at maturity T', c.category = 'derivatives', c.difficulty = 'basic',
      c.menu_context = 'Pricer', c.prerequisites = 'option payoff;strike price;expiration';
MATCH (c:Concept {name: 'European Option'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Call Option'})
  SET c.definition = 'European option with payoff max(S_T - K, 0) at expiration', c.category = 'derivatives', c.difficulty = 'basic',
      c.menu_context = 'Pricer', c.prerequisites = 'European Option;payoff function';
MATCH (c:Concept {name: 'Call Option'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Put Option'})
  SET c.definition = 'European option with payoff max(K - S_T, 0) at expiration', c.category = 'derivatives', c.difficulty = 'basic',
      c.menu_context = 'Pricer', c.prerequisites = 'European Option;payoff function;put-call parity';
MATCH (c:Concept {name: 'Put Option'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Geometric Brownian Motion'})
  SET c.definition = 'Stochastic process dS = μS·dt + σS·dW modeling asset prices with constant drift and volatility', c.category = 'stochastic_processes', c.difficulty = 'intermediate',
      c.menu_context = 'Pricer', c.prerequisites = 'Itô calculus;log-normal distribution;Wiener process';
MATCH (c:Concept {name: 'Geometric Brownian Motion'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Log-Normal Distribution'})
  SET c.definition = 'Distribution of X where ln(X) is normal; S_T ~ LogNormal under GBM', c.category = 'probability_distributions', c.difficulty = 'intermediate',
      c.menu_context = 'Pricer', c.prerequisites = 'normal distribution;exponential transformation';
MATCH (c:Concept {name: 'Log-Normal Distribution'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Risk-Neutral Measure'})
  SET c.definition = 'Equivalent martingale measure Q where discounted asset prices are martingales; enables derivative pricing', c.category = 'measure_theory', c.difficulty = 'advanced',
      c.menu_context = 'Pricer', c.prerequisites = 'Girsanov theorem;martingale;no-arbitrage';
MATCH (c:Concept {name: 'Risk-Neutral Measure'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Black-Scholes Model'})
  SET c.definition = 'Continuous-time option pricing framework assuming GBM dynamics and constant volatility', c.category = 'option_pricing', c.difficulty = 'intermediate',
      c.menu_context = 'Pricer', c.prerequisites = 'GBM;risk-neutral measure;Ito lemma';
MATCH (c:Concept {name: 'Black-Scholes Model'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Implied Volatility'})
  SET c.definition = 'Volatility parameter σ that equates model price to market price; market expectation of future volatility', c.category = 'volatility', c.difficulty = 'intermediate',
      c.menu_context = 'Pricer', c.prerequisites = 'Black-Scholes;numerical root-finding;volatility smile';
MATCH (c:Concept {name: 'Implied Volatility'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Volatility Smile'})
  SET c.definition = 'Pattern where implied volatility varies with strike; contradicts BS constant volatility assumption', c.category = 'volatility', c.difficulty = 'advanced',
      c.menu_context = 'Pricer', c.prerequisites = 'implied volatility;Black-Scholes limitations';
MATCH (c:Concept {name: 'Volatility Smile'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Stochastic Volatility'})
  SET c.definition = 'Model where volatility follows its own stochastic process (e.g., mean-reverting)', c.category = 'volatility', c.difficulty = 'advanced',
      c.menu_context = 'Pricer', c.prerequisites = 'Brownian motion;correlation;variance risk premium';
MATCH (c:Concept {name: 'Stochastic Volatility'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Heston Model'})
  SET c.definition = 'Stochastic volatility model: dS=rS·dt+√v·S·dW₁, dv=κ(θ-v)·dt+ξ√v·dW₂ with correlation ρ', c.category = 'option_pricing', c.difficulty = 'advanced',
      c.menu_context = 'Pricer', c.prerequisites = 'stochastic volatility;CIR process;characteristic functions';
MATCH (c:Concept {name: 'Heston Model'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'CIR Process'})
  SET c.definition = 'Square-root diffusion process dv=κ(θ-v)dt+ξ√v·dW ensuring non-negative variance', c.category = 'stochastic_processes', c.difficulty = 'advanced',
      c.menu_context = 'Pricer', c.prerequisites = 'mean reversion;Feller condition;non-centrality';
MATCH (c:Concept {name: 'CIR Process'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Feller Condition'})
  SET c.definition = 'Condition 2κθ > ξ² ensuring CIR process stays strictly positive (never hits zero)', c.category = 'stochastic_processes', c.difficulty = 'advanced',
      c.menu_context = 'Pricer', c.prerequisites = 'CIR process;boundary behavior;ergodicity';
MATCH (c:Concept {name: 'Feller Condition'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Characteristic Function'})
  SET c.definition = 'Fourier transform φ(u)=E[e^(iuX)] of probability distribution; enables FFT pricing', c.category = 'mathematical_finance', c.difficulty = 'advanced',
      c.menu_context = 'Pricer', c.prerequisites = 'Fourier analysis;complex analysis;Lévy processes';
MATCH (c:Concept {name: 'Characteristic Function'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'FFT Pricing'})
  SET c.definition = 'Option pricing via Fast Fourier Transform of characteristic function; O(N·logN) complexity', c.category = 'numerical_methods', c.difficulty = 'advanced',
      c.menu_context = 'Pricer', c.prerequisites = 'characteristic functions;Fourier inversion;numerical integration';
MATCH (c:Concept {name: 'FFT Pricing'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Monte Carlo Simulation'})
  SET c.definition = 'Numerical method using random sampling to estimate expected values; converges as O(1/√N)', c.category = 'numerical_methods', c.difficulty = 'intermediate',
      c.menu_context = 'Pricer', c.prerequisites = 'law of large numbers;central limit theorem;variance reduction';
MATCH (c:Concept {name: 'Monte Carlo Simulation'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Variance Reduction'})
  SET c.definition = 'Techniques (antithetic variates, control variates, importance sampling) to reduce Monte Carlo error', c.category = 'numerical_methods', c.difficulty = 'advanced',
      c.menu_context = 'Pricer', c.prerequisites = 'Monte Carlo;covariance;bias-variance tradeoff';
MATCH (c:Concept {name: 'Variance Reduction'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Put-Call Parity'})
  SET c.definition = 'No-arbitrage relationship: C - P = S - K·e^(-rτ); enables put pricing from call', c.category = 'arbitrage', c.difficulty = 'basic',
      c.menu_context = 'Pricer', c.prerequisites = 'no-arbitrage;forward contracts;replication';
MATCH (c:Concept {name: 'Put-Call Parity'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Greeks'})
  SET c.definition = 'Partial derivatives of option price w.r.t. parameters (Δ,Γ,Θ,ν,ρ); measure risk sensitivities', c.category = 'risk_management', c.difficulty = 'intermediate',
      c.menu_context = 'Pricer', c.prerequisites = 'partial derivatives;hedging;risk measurement';
MATCH (c:Concept {name: 'Greeks'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Delta'})
  SET c.definition = 'Δ = ∂V/∂S; sensitivity to underlying price; hedge ratio for delta-neutral position', c.category = 'greeks', c.difficulty = 'intermediate',
      c.menu_context = 'Pricer', c.prerequisites = 'partial derivatives;hedging;taylor expansion';
MATCH (c:Concept {name: 'Delta'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Gamma'})
  SET c.definition = 'Γ = ∂²V/∂S²; rate of change of delta; measures convexity/hedging error', c.category = 'greeks', c.difficulty = 'intermediate',
      c.menu_context = 'Pricer', c.prerequisites = 'second derivatives;delta hedging;rebalancing frequency';
MATCH (c:Concept {name: 'Gamma'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Theta'})
  SET c.definition = 'Θ = ∂V/∂t; time decay; daily loss in option value as expiration approaches', c.category = 'greeks', c.difficulty = 'intermediate',
      c.menu_context = 'Pricer', c.prerequisites = 'time value;volatility decay;option aging';
MATCH (c:Concept {name: 'Theta'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Vega'})
  SET c.definition = 'ν = ∂V/∂σ; sensitivity to implied volatility; same for calls and puts', c.category = 'greeks', c.difficulty = 'intermediate',
      c.menu_context = 'Pricer', c.prerequisites = 'volatility risk;volatility trading;vega hedging';
MATCH (c:Concept {name: 'Vega'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Rho'})
  SET c.definition = 'ρ = ∂V/∂r; sensitivity to interest rate changes; important for long-dated options', c.category = 'greeks', c.difficulty = 'basic',
      c.menu_context = 'Pricer', c.prerequisites = 'interest rate risk;discounting;rate sensitivity';
MATCH (c:Concept {name: 'Rho'})
MATCH (m:Menu {name: 'Pricer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Mean-Variance Optimization'})
  SET c.definition = 'Portfolio selection framework: minimize variance for given expected return (Markowitz 1952)', c.category = 'portfolio_theory', c.difficulty = 'intermediate',
      c.menu_context = 'Portfolio', c.prerequisites = 'quadratic programming;efficient frontier;diversification';
MATCH (c:Concept {name: 'Mean-Variance Optimization'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Efficient Frontier'})
  SET c.definition = 'Set of portfolios offering maximum expected return for given risk (minimum variance for given return)', c.category = 'portfolio_theory', c.difficulty = 'intermediate',
      c.menu_context = 'Portfolio', c.prerequisites = 'MVO;dominance;Pareto optimality';
MATCH (c:Concept {name: 'Efficient Frontier'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Global Minimum Variance'})
  SET c.definition = 'Portfolio with absolute minimum variance regardless of expected return; w_GMV = Σ⁻¹ι/(ιᵀΣ⁻¹ι)', c.category = 'portfolio_theory', c.difficulty = 'intermediate',
      c.menu_context = 'Portfolio', c.prerequisites = 'MVO;variance minimization;diversification';
MATCH (c:Concept {name: 'Global Minimum Variance'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Tangency Portfolio'})
  SET c.definition = 'Portfolio maximizing Sharpe ratio; optimal risky portfolio when risk-free asset exists', c.category = 'portfolio_theory', c.difficulty = 'intermediate',
      c.menu_context = 'Portfolio', c.prerequisites = 'MVO;Sharpe ratio;Tobin separation';
MATCH (c:Concept {name: 'Tangency Portfolio'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Sharpe Ratio'})
  SET c.definition = 'SR = (r_p - r_f)/σ_p; excess return per unit of total risk; most common performance metric', c.category = 'performance_metrics', c.difficulty = 'basic',
      c.menu_context = 'Portfolio', c.prerequisites = 'risk-adjusted returns;excess return;volatility normalization';
MATCH (c:Concept {name: 'Sharpe Ratio'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Treynor Ratio'})
  SET c.definition = 'TR = (r_p - r_f)/β_p; excess return per unit of systematic risk; appropriate for diversified portfolios', c.category = 'performance_metrics', c.difficulty = 'intermediate',
      c.menu_context = 'Portfolio', c.prerequisites = 'CAPM;beta;systematic risk';
MATCH (c:Concept {name: 'Treynor Ratio'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Sortino Ratio'})
  SET c.definition = 'SR_D = (r_p - MAR)/σ_downside; downside risk-adjusted return; penalizes only negative deviations', c.category = 'performance_metrics', c.difficulty = 'intermediate',
      c.menu_context = 'Portfolio', c.prerequisites = 'downside risk;loss aversion;MAR threshold';
MATCH (c:Concept {name: 'Sortino Ratio'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Information Ratio'})
  SET c.definition = 'IR = (r_p - r_b)/σ(r_p - r_b); active return per unit of tracking error', c.category = 'performance_metrics', c.difficulty = 'intermediate',
      c.menu_context = 'Portfolio', c.prerequisites = 'active management;tracking error;benchmark-relative';
MATCH (c:Concept {name: 'Information Ratio'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'M² Modigliani'})
  SET c.definition = 'M² = r_f + SR·σ_benchmark; risk-adjusted performance in return units (directly comparable)', c.category = 'performance_metrics', c.difficulty = 'intermediate',
      c.menu_context = 'Portfolio', c.prerequisites = 'Sharpe ratio;risk adjustment;performance attribution';
MATCH (c:Concept {name: 'M² Modigliani'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Alpha'})
  SET c.definition = 'α = r_p - [r_f + β_p(r_m - r_f)]; abnormal return unexplained by market exposure (CAPM)', c.category = 'performance_metrics', c.difficulty = 'intermediate',
      c.menu_context = 'Portfolio', c.prerequisites = 'CAPM;abnormal returns;skill vs luck';
MATCH (c:Concept {name: 'Alpha'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Beta'})
  SET c.definition = 'β_i = Cov(R_i,R_m)/Var(R_m); systematic risk sensitivity to market movements', c.category = 'risk_metrics', c.difficulty = 'basic',
      c.menu_context = 'Portfolio', c.prerequisites = 'covariance;market risk;CAPM';
MATCH (c:Concept {name: 'Beta'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Systematic Risk'})
  SET c.definition = 'Risk that cannot be diversified away; β²·σ²_m portion of total variance', c.category = 'risk_metrics', c.difficulty = 'intermediate',
      c.menu_context = 'Portfolio', c.prerequisites = 'beta;market risk;diversification limits';
MATCH (c:Concept {name: 'Systematic Risk'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Idiosyncratic Risk'})
  SET c.definition = 'Asset-specific risk that can be diversified away; σ²_u = σ²_p - β²σ²_m', c.category = 'risk_metrics', c.difficulty = 'basic',
      c.menu_context = 'Portfolio', c.prerequisites = 'diversification;firm-specific risk;residual variance';
MATCH (c:Concept {name: 'Idiosyncratic Risk'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Skewness'})
  SET c.definition = 'γ = E[(R-μ)³]/σ³; asymmetry of return distribution; negative skew indicates crash risk', c.category = 'higher_moments', c.difficulty = 'intermediate',
      c.menu_context = 'Portfolio', c.prerequisites = 'third moment;tail risk;asymmetry';
MATCH (c:Concept {name: 'Skewness'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Kurtosis'})
  SET c.definition = 'κ = E[(R-μ)⁴]/σ⁴ - 3; tail fatness relative to normal; positive excess kurtosis = fat tails', c.category = 'higher_moments', c.difficulty = 'intermediate',
      c.menu_context = 'Portfolio', c.prerequisites = 'fourth moment;tail risk;extreme events';
MATCH (c:Concept {name: 'Kurtosis'})
MATCH (m:Menu {name: 'Portfolio'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Value at Risk'})
  SET c.definition = 'VaR_α = inf{l: P(L>l) ≤ 1-α}; maximum loss at confidence level α over specified horizon', c.category = 'risk_metrics', c.difficulty = 'intermediate',
      c.menu_context = 'Risk', c.prerequisites = 'quantiles;loss distribution;regulatory capital';
MATCH (c:Concept {name: 'Value at Risk'})
MATCH (m:Menu {name: 'Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Expected Shortfall'})
  SET c.definition = 'ES_α = E[L|L>VaR_α]; average loss in tail beyond VaR; coherent risk measure', c.category = 'risk_metrics', c.difficulty = 'advanced',
      c.menu_context = 'Risk', c.prerequisites = 'tail risk;coherence;subadditivity';
MATCH (c:Concept {name: 'Expected Shortfall'})
MATCH (m:Menu {name: 'Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Parametric VaR'})
  SET c.definition = 'VaR assuming specific distribution (normal or t); VaR = -μ + σ·F⁻¹(α)', c.category = 'risk_metrics', c.difficulty = 'intermediate',
      c.menu_context = 'Risk', c.prerequisites = 'distributional assumptions;normal/t distributions;MLE';
MATCH (c:Concept {name: 'Parametric VaR'})
MATCH (m:Menu {name: 'Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Historical VaR'})
  SET c.definition = 'Non-parametric VaR using empirical quantile of historical returns; no distributional assumptions', c.category = 'risk_metrics', c.difficulty = 'basic',
      c.menu_context = 'Risk', c.prerequisites = 'empirical distribution;quantiles;stationarity assumption';
MATCH (c:Concept {name: 'Historical VaR'})
MATCH (m:Menu {name: 'Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Monte Carlo VaR'})
  SET c.definition = 'VaR estimated from simulated return distribution; flexible for complex portfolios', c.category = 'risk_metrics', c.difficulty = 'advanced',
      c.menu_context = 'Risk', c.prerequisites = 'simulation;scenario generation;path dependence';
MATCH (c:Concept {name: 'Monte Carlo VaR'})
MATCH (m:Menu {name: 'Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Square-Root-of-Time'})
  SET c.definition = 'VaR_T = VaR₁·√T; scaling rule under i.i.d. returns assumption', c.category = 'risk_metrics', c.difficulty = 'basic',
      c.menu_context = 'Risk', c.prerequisites = 'i.i.d. assumption;variance additivity;time aggregation';
MATCH (c:Concept {name: 'Square-Root-of-Time'})
MATCH (m:Menu {name: 'Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Feller Condition Violation'})
  SET c.definition = 'When 2κθ ≤ ξ² in Heston model; variance can hit zero causing numerical instability', c.category = 'model_risk', c.difficulty = 'advanced',
      c.menu_context = 'Risk', c.prerequisites = 'Heston model;boundary behavior;numerical convergence';
MATCH (c:Concept {name: 'Feller Condition Violation'})
MATCH (m:Menu {name: 'Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Backtesting'})
  SET c.definition = 'Comparing VaR predictions to actual outcomes; Kupiec test for coverage adequacy', c.category = 'risk_management', c.difficulty = 'intermediate',
      c.menu_context = 'Risk', c.prerequisites = 'model validation;hypothesis testing;regulatory compliance';
MATCH (c:Concept {name: 'Backtesting'})
MATCH (m:Menu {name: 'Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Black-Litterman Model'})
  SET c.definition = 'Bayesian framework combining market equilibrium with subjective views; μ_BL = [(τΣ)⁻¹+PᵀΩ⁻¹P]⁻¹[(τΣ)⁻¹π+PᵀΩ⁻¹q]', c.category = 'portfolio_optimization', c.difficulty = 'advanced',
      c.menu_context = 'Optimizer', c.prerequisites = 'reverse optimization;Bayesian updating;view uncertainty';
MATCH (c:Concept {name: 'Black-Litterman Model'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Reverse Optimization'})
  SET c.definition = 'Deriving implied returns from market weights: π = δ·Σ·w_m; starts from observed equilibrium', c.category = 'portfolio_optimization', c.difficulty = 'intermediate',
      c.menu_context = 'Optimizer', c.prerequisites = 'equilibrium;market portfolio;risk aversion';
MATCH (c:Concept {name: 'Reverse Optimization'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Bayesian Updating'})
  SET c.definition = 'Combining prior (equilibrium) with likelihood (views) to obtain posterior distribution', c.category = 'statistics', c.difficulty = 'advanced',
      c.menu_context = 'Optimizer', c.prerequisites = 'Bayes theorem;prior/likelihood;posterior inference';
MATCH (c:Concept {name: 'Bayesian Updating'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Kelly Criterion'})
  SET c.definition = 'Optimal betting fraction maximizing expected log wealth: f* = p - q (binary) or w* = argmax E[ln(1+wᵀr)]', c.category = 'portfolio_optimization', c.difficulty = 'advanced',
      c.menu_context = 'Optimizer', c.prerequisites = 'log utility;geometric mean;growth optimal';
MATCH (c:Concept {name: 'Kelly Criterion'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Fractional Kelly'})
  SET c.definition = 'Scaling Kelly bets by κ∈(0,1) to reduce volatility; half-Kelly = 0.5×f*', c.category = 'portfolio_optimization', c.difficulty = 'intermediate',
      c.menu_context = 'Optimizer', c.prerequisites = 'Kelly criterion;risk management;drawdown control';
MATCH (c:Concept {name: 'Fractional Kelly'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Risk Parity'})
  SET c.definition = 'Allocation where each asset contributes equally to portfolio risk: RC_i = σ_p/N', c.category = 'portfolio_optimization', c.difficulty = 'advanced',
      c.menu_context = 'Optimizer', c.prerequisites = 'risk contribution;equal weighting;diversification';
MATCH (c:Concept {name: 'Risk Parity'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Equal Risk Contribution'})
  SET c.definition = 'ERC: w_i·(Σw)_i/σ_p = σ_p/N ∀i; balances risk across assets rather than capital', c.category = 'portfolio_optimization', c.difficulty = 'advanced',
      c.menu_context = 'Optimizer', c.prerequisites = 'marginal risk contribution;iterative optimization;CCD algorithm';
MATCH (c:Concept {name: 'Equal Risk Contribution'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Hierarchical Risk Parity'})
  SET c.definition = 'HRP: cluster assets by correlation, then allocate via recursive bisection on dendrogram', c.category = 'portfolio_optimization', c.difficulty = 'advanced',
      c.menu_context = 'Optimizer', c.prerequisites = 'hierarchical clustering;ultrametric;quasi-diagonalization';
MATCH (c:Concept {name: 'Hierarchical Risk Parity'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Correlation Distance'})
  SET c.definition = 'd_ij = √(2(1-ρ_ij)); metric transformation of correlation for clustering', c.category = 'clustering', c.difficulty = 'intermediate',
      c.menu_context = 'Optimizer', c.prerequisites = 'correlation matrix;metric space;triangle inequality';
MATCH (c:Concept {name: 'Correlation Distance'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Single Linkage Clustering'})
  SET c.definition = 'Hierarchical clustering merging closest pairs first; produces chain-like clusters', c.category = 'clustering', c.difficulty = 'intermediate',
      c.menu_context = 'Optimizer', c.prerequisites = 'dendrogram;minimum spanning tree;ultrametric';
MATCH (c:Concept {name: 'Single Linkage Clustering'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Quasi-Diagonalization'})
  SET c.definition = 'Reordering covariance matrix via dendrogram leaf order to reveal block structure', c.category = 'linear_algebra', c.difficulty = 'advanced',
      c.menu_context = 'Optimizer', c.prerequisites = 'permutation matrices;block diagonal;hierarchical structure';
MATCH (c:Concept {name: 'Quasi-Diagonalization'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Recursive Bisection'})
  SET c.definition = 'HRP allocation: split cluster variance α = 1 - cVar₀/(cVar₀+cVar₁); recurse down tree', c.category = 'portfolio_optimization', c.difficulty = 'advanced',
      c.menu_context = 'Optimizer', c.prerequisites = 'binary tree;variance allocation;top-down recursion';
MATCH (c:Concept {name: 'Recursive Bisection'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Mean-Variance Utility'})
  SET c.definition = 'U(w) = wᵀμ - (δ/2)wᵀΣw; trade-off between return and variance via risk aversion δ', c.category = 'utility_theory', c.difficulty = 'intermediate',
      c.menu_context = 'Optimizer', c.prerequisites = 'quadratic utility;risk aversion;certainty equivalent';
MATCH (c:Concept {name: 'Mean-Variance Utility'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Risk Aversion'})
  SET c.definition = 'δ coefficient in utility function; higher δ = more risk-averse; typical δ ≈ 2.5', c.category = 'behavioral_finance', c.difficulty = 'basic',
      c.menu_context = 'Optimizer', c.prerequisites = 'utility theory;prospect theory;loss aversion';
MATCH (c:Concept {name: 'Risk Aversion'})
MATCH (m:Menu {name: 'Optimizer'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Factor Model'})
  SET c.definition = 'R_it = α_i + β_iᵀf_t + ε_it; asset returns driven by common factors plus idiosyncratic component', c.category = 'asset_pricing', c.difficulty = 'intermediate',
      c.menu_context = 'Factors', c.prerequisites = 'linear regression;systematic risk;diversification';
MATCH (c:Concept {name: 'Factor Model'})
MATCH (m:Menu {name: 'Factors'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Factor Loading'})
  SET c.definition = 'β_ik = Cov(R_i,f_k)/Var(f_k); sensitivity of asset i to factor k', c.category = 'factor_investing', c.difficulty = 'basic',
      c.menu_context = 'Factors', c.prerequisites = 'regression coefficients;beta;systematic exposure';
MATCH (c:Concept {name: 'Factor Loading'})
MATCH (m:Menu {name: 'Factors'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Fama-French Factors'})
  SET c.definition = '3-factor (MKT,SMB,HML) or 5-factor (adding RMW,CMA) model explaining cross-section of returns', c.category = 'factor_investing', c.difficulty = 'intermediate',
      c.menu_context = 'Factors', c.prerequisites = 'market factor;size premium;value premium;profitability;investment';
MATCH (c:Concept {name: 'Fama-French Factors'})
MATCH (m:Menu {name: 'Factors'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Smart Beta'})
  SET c.definition = 'Rules-based strategies targeting specific factors (value, momentum, quality, low vol)', c.category = 'factor_investing', c.difficulty = 'intermediate',
      c.menu_context = 'Factors', c.prerequisites = 'factor exposure;passive investing;alternative indexing';
MATCH (c:Concept {name: 'Smart Beta'})
MATCH (m:Menu {name: 'Factors'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Factor Momentum'})
  SET c.definition = 'Persistence in factor returns; winners continue winning, losers continue losing', c.category = 'factor_investing', c.difficulty = 'advanced',
      c.menu_context = 'Factors', c.prerequisites = 'momentum anomaly;behavioral bias;factor timing';
MATCH (c:Concept {name: 'Factor Momentum'})
MATCH (m:Menu {name: 'Factors'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Crowding'})
  SET c.definition = 'Multiple investors holding similar factor exposures; increases correlation and crash risk', c.category = 'factor_investing', c.difficulty = 'advanced',
      c.menu_context = 'Factors', c.prerequisites = 'herding;systemic risk;factor capacity';
MATCH (c:Concept {name: 'Crowding'})
MATCH (m:Menu {name: 'Factors'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Idiosyncratic Volatility'})
  SET c.definition = 'σ²_ε,i = Var(ε_i); asset-specific variance unexplained by factors', c.category = 'risk_metrics', c.difficulty = 'intermediate',
      c.menu_context = 'Factors', c.prerequisites = 'residual variance;diversification;anomaly';
MATCH (c:Concept {name: 'Idiosyncratic Volatility'})
MATCH (m:Menu {name: 'Factors'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Covariance Shrinkage'})
  SET c.definition = 'Σ̂_shrink = (1-λ)Σ̂_sample + λ·F; improves estimation by shrinking toward structured target', c.category = 'estimation', c.difficulty = 'advanced',
      c.menu_context = 'Factors', c.prerequisites = 'Ledoit-Wolf;regularization;condition number';
MATCH (c:Concept {name: 'Covariance Shrinkage'})
MATCH (m:Menu {name: 'Factors'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Ledoit-Wolf Shrinkage'})
  SET c.definition = 'Optimal shrinkage intensity λ* minimizing MSE; F = constant correlation or single-index model', c.category = 'estimation', c.difficulty = 'advanced',
      c.menu_context = 'Factors', c.prerequisites = 'covariance estimation;regularization;finite-sample correction';
MATCH (c:Concept {name: 'Ledoit-Wolf Shrinkage'})
MATCH (m:Menu {name: 'Factors'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Principal Components'})
  SET c.definition = 'Eigendecomposition of covariance; orthogonal factors explaining maximum variance', c.category = 'dimensionality_reduction', c.difficulty = 'advanced',
      c.menu_context = 'Factors', c.prerequisites = 'eigenvalues;eigenvectors;variance explained';
MATCH (c:Concept {name: 'Principal Components'})
MATCH (m:Menu {name: 'Factors'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Scenario Analysis'})
  SET c.definition = 'Evaluating portfolio under hypothetical market scenarios (stress, historical, hypothetical)', c.category = 'risk_management', c.difficulty = 'intermediate',
      c.menu_context = 'Scenarios', c.prerequisites = 'what-if analysis;stress testing;scenario generation';
MATCH (c:Concept {name: 'Scenario Analysis'})
MATCH (m:Menu {name: 'Scenarios'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Stress Testing'})
  SET c.definition = 'Extreme scenario analysis: historical crises or hypothetical shocks beyond normal experience', c.category = 'risk_management', c.difficulty = 'intermediate',
      c.menu_context = 'Scenarios', c.prerequisites = 'tail risk;crisis scenarios;regulatory requirements';
MATCH (c:Concept {name: 'Stress Testing'})
MATCH (m:Menu {name: 'Scenarios'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Monte Carlo Scenarios'})
  SET c.definition = 'Generating thousands of random return paths from fitted distribution for scenario analysis', c.category = 'risk_management', c.difficulty = 'advanced',
      c.menu_context = 'Scenarios', c.prerequisites = 'simulation;path generation;distribution fitting';
MATCH (c:Concept {name: 'Monte Carlo Scenarios'})
MATCH (m:Menu {name: 'Scenarios'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Historical Scenarios'})
  SET c.definition = 'Using actual historical periods (2008, 2020, etc.) as scenarios for stress testing', c.category = 'risk_management', c.difficulty = 'basic',
      c.menu_context = 'Scenarios', c.prerequisites = 'historical simulation;crisis periods;drawdown analysis';
MATCH (c:Concept {name: 'Historical Scenarios'})
MATCH (m:Menu {name: 'Scenarios'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Prospect Theory'})
  SET c.definition = 'Descriptive model of decision-making under risk: loss aversion, probability weighting, reference dependence', c.category = 'behavioral_finance', c.difficulty = 'intermediate',
      c.menu_context = 'Scenarios', c.prerequisites = 'Kahneman-Tversky;loss aversion;framing effects';
MATCH (c:Concept {name: 'Prospect Theory'})
MATCH (m:Menu {name: 'Scenarios'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Loss Aversion'})
  SET c.definition = 'Losses loom larger than gains: v(x) steeper for x<0; λ ≈ 2.25 (losses hurt 2.25× more)', c.category = 'behavioral_finance', c.difficulty = 'intermediate',
      c.menu_context = 'Scenarios', c.prerequisites = 'prospect theory;reference point;endowment effect';
MATCH (c:Concept {name: 'Loss Aversion'})
MATCH (m:Menu {name: 'Scenarios'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Probability Weighting'})
  SET c.definition = 'Decision weights π(p) ≠ p: overweight small probabilities, underweight moderate/large', c.category = 'behavioral_finance', c.difficulty = 'advanced',
      c.menu_context = 'Scenarios', c.prerequisites = 'prospect theory;certainty effect;possibility effect';
MATCH (c:Concept {name: 'Probability Weighting'})
MATCH (m:Menu {name: 'Scenarios'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Behavioral Portfolio Theory'})
  SET c.definition = 'BPT: investors construct layered portfolios (safety, income, growth) rather than mean-variance optimal', c.category = 'behavioral_finance', c.difficulty = 'advanced',
      c.menu_context = 'Scenarios', c.prerequisites = 'mental accounting;safety-first;aspiration levels';
MATCH (c:Concept {name: 'Behavioral Portfolio Theory'})
MATCH (m:Menu {name: 'Scenarios'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Mental Accounting'})
  SET c.definition = 'Treating money differently based on source/intended use; violates fungibility principle', c.category = 'behavioral_finance', c.difficulty = 'basic',
      c.menu_context = 'Scenarios', c.prerequisites = 'prospect theory;framing;self-control';
MATCH (c:Concept {name: 'Mental Accounting'})
MATCH (m:Menu {name: 'Scenarios'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Implied Volatility Surface'})
  SET c.definition = '3D surface of IV as function of strike and maturity; captures volatility smile/skew dynamics', c.category = 'volatility', c.difficulty = 'advanced',
      c.menu_context = 'Volatility', c.prerequisites = 'volatility smile;term structure;interpolation';
MATCH (c:Concept {name: 'Implied Volatility Surface'})
MATCH (m:Menu {name: 'Volatility'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Volatility Smile'})
  SET c.definition = 'Pattern where IV increases for deep ITM/OTM options; contradicts BS log-normal assumption', c.category = 'volatility', c.difficulty = 'intermediate',
      c.menu_context = 'Volatility', c.prerequisites = 'fat tails;crashophobia;stochastic volatility';
MATCH (c:Concept {name: 'Volatility Smile'})
MATCH (m:Menu {name: 'Volatility'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Volatility Term Structure'})
  SET c.definition = 'IV as function of maturity; typically upward sloping (contango) but can invert', c.category = 'volatility', c.difficulty = 'intermediate',
      c.menu_context = 'Volatility', c.prerequisites = 'mean reversion;volatility risk premium;forward volatility';
MATCH (c:Concept {name: 'Volatility Term Structure'})
MATCH (m:Menu {name: 'Volatility'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'VIX Index'})
  SET c.definition = "CBOE Volatility Index; 30-day implied volatility from S&P 500 options; 'fear gauge'",
      c.category = 'volatility',

      c.difficulty = 'basic',
      c.menu_context = 'Volatility',
      c.prerequisites = 'implied volatility;variance swap;market sentiment';
      
MERGE (c:Concept {name: 'Variance Risk Premium'})
  SET c.definition = 'Difference between realized and implied variance; investors pay premium for volatility protection', c.category = 'volatility', c.difficulty = 'advanced',
      c.menu_context = 'Volatility', c.prerequisites = 'variance swaps;volatility selling;risk premium';
MATCH (c:Concept {name: 'Variance Risk Premium'})
MATCH (m:Menu {name: 'Volatility'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Local Volatility'})
  SET c.definition = 'σ(S,t) deterministic function of spot and time; calibrated to match vanilla prices', c.category = 'volatility', c.difficulty = 'advanced',
      c.menu_context = 'Volatility', c.prerequisites = 'Dupire formula;calibration;path-independent';
MATCH (c:Concept {name: 'Local Volatility'})
MATCH (m:Menu {name: 'Volatility'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Stochastic Volatility Risk Premium'})
  SET c.definition = 'Compensation for bearing volatility risk; E[v_T] > v₀ under physical measure', c.category = 'volatility', c.difficulty = 'advanced',
      c.menu_context = 'Volatility', c.prerequisites = 'variance risk premium;affine models;market price of risk';
MATCH (c:Concept {name: 'Stochastic Volatility Risk Premium'})
MATCH (m:Menu {name: 'Volatility'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'SABR Model'})
  SET c.definition = 'Stochastic-alpha-beta-rho model for volatility smile; popular in rates/FX derivatives', c.category = 'volatility', c.difficulty = 'advanced',
      c.menu_context = 'Volatility', c.prerequisites = 'stochastic volatility;asymptotic expansion;smile parametrization';
MATCH (c:Concept {name: 'SABR Model'})
MATCH (m:Menu {name: 'Volatility'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Attribution Analysis'})
  SET c.definition = 'Decomposing portfolio returns into factor exposures, security selection, and interaction effects', c.category = 'performance_attribution', c.difficulty = 'intermediate',
      c.menu_context = 'Blotter', c.prerequisites = 'factor models;active return;selection vs allocation';
MATCH (c:Concept {name: 'Attribution Analysis'})
MATCH (m:Menu {name: 'Blotter'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Brinson Attribution'})
  SET c.definition = 'Decomposition into allocation, selection, and interaction effects relative to benchmark', c.category = 'performance_attribution', c.difficulty = 'intermediate',
      c.menu_context = 'Blotter', c.prerequisites = 'active management;benchmark-relative;attribution arithmetic';
MATCH (c:Concept {name: 'Brinson Attribution'})
MATCH (m:Menu {name: 'Blotter'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Returns-Based Attribution'})
  SET c.definition = 'Inferring exposures from return series via regression; no holdings data required', c.category = 'performance_attribution', c.difficulty = 'intermediate',
      c.menu_context = 'Blotter', c.prerequisites = 'factor regression;style analysis;R-squared';
MATCH (c:Concept {name: 'Returns-Based Attribution'})
MATCH (m:Menu {name: 'Blotter'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Holdings-Based Attribution'})
  SET c.definition = 'Direct calculation from portfolio weights and returns; more accurate but requires position data', c.category = 'performance_attribution', c.difficulty = 'intermediate',
      c.menu_context = 'Blotter', c.prerequisites = 'portfolio weights;security-level returns;exact attribution';
MATCH (c:Concept {name: 'Holdings-Based Attribution'})
MATCH (m:Menu {name: 'Blotter'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Active Share'})
  SET c.definition = 'AS = (1/2)∑|w_p,i - w_b,i|; measure of active management (0=clone, 1=completely active)', c.category = 'performance_attribution', c.difficulty = 'intermediate',
      c.menu_context = 'Blotter', c.prerequisites = 'tracking error;closet indexing;active management';
MATCH (c:Concept {name: 'Active Share'})
MATCH (m:Menu {name: 'Blotter'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Tracking Error'})
  SET c.definition = 'TE = σ(r_p - r_b); volatility of active returns; measures consistency of active bets', c.category = 'risk_metrics', c.difficulty = 'intermediate',
      c.menu_context = 'Blotter', c.prerequisites = 'active risk;relative volatility;information ratio';
MATCH (c:Concept {name: 'Tracking Error'})
MATCH (m:Menu {name: 'Blotter'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Transaction Costs'})
  SET c.definition = 'Explicit (commissions, taxes) and implicit (bid-ask, market impact) costs of trading', c.category = 'trading', c.difficulty = 'basic',
      c.menu_context = 'Blotter', c.prerequisites = 'implementation shortfall;market impact;liquidity';
MATCH (c:Concept {name: 'Transaction Costs'})
MATCH (m:Menu {name: 'Blotter'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:Concept {name: 'Implementation Shortfall'})
  SET c.definition = 'Difference between paper portfolio return and actual return; measures execution quality', c.category = 'trading', c.difficulty = 'intermediate',
      c.menu_context = 'Blotter', c.prerequisites = 'transaction costs;opportunity cost;delay cost';
MATCH (c:Concept {name: 'Implementation Shortfall'})
MATCH (m:Menu {name: 'Blotter'})
MERGE (c)-[:BELONGS_TO]->(m);
