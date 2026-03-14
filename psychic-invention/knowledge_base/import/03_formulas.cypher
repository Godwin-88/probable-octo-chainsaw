// 03_formulas.cypher — Run after 02_concepts.cypher
// Creates Formula nodes.

MERGE (f:TransactFormula {name: 'Black-Scholes Call'})
  SET f.equation = 'C = S·N(d₁) - K·e^(-rτ)·N(d₂)', f.description = 'Analytical pricing for European call options',
      f.variables = ['S', 'K', 'τ', 'r', 'σ', 'd₁', 'd₂'], f.assumptions = ['constant volatility', 'no dividends', 'European exercise', 'log-normal returns'],
      f.source_file = 'src/black_scholes.rs', f.inference_reasoning = 'Inferred from price_call_internal(): d₁ = (ln(S/K) + (r + σ²/2)τ)/(σ√τ), d₂ = d₁ - σ√τ. Uses Abramowitz-Stegun approximation for N(x) with |x|≤8 boundary conditions';

MERGE (f:TransactFormula {name: 'Black-Scholes Put'})
  SET f.equation = 'P = K·e^(-rτ)·N(-d₂) - S·N(-d₁)', f.description = 'European put pricing via put-call parity',
      f.variables = ['S', 'K', 'τ', 'r', 'σ', 'd₁', 'd₂'], f.assumptions = ['constant volatility', 'no dividends', 'European exercise', 'put-call parity holds'],
      f.source_file = 'src/black_scholes.rs', f.inference_reasoning = 'Inferred from price_put_internal(): P = C - S + K·e^(-rτ). Put-call parity ensures no-arbitrage relationship between calls and puts';

MERGE (f:TransactFormula {name: 'Heston Call'})
  SET f.equation = 'C = S·P₁ - K·e^(-rτ)·P₂ where Pⱼ = 0.5 + (1/π)∫₀^∞ Re[e^(-iu·ln(K))·φ(u-i·(j-1))/(iu·φ(-i))]du', f.description = 'Stochastic volatility option pricing via characteristic function integration',
      f.variables = ['S', 'K', 'v₀', 'r', 'κ', 'θ', 'ξ', 'ρ', 'τ', 'u', 'P₁', 'P₂'], f.assumptions = ['Feller condition 2κθ>ξ²', 'affine jump-diffusion', 'risk-neutral measure'],
      f.source_file = 'src/heston.rs', f.inference_reasoning = 'Inferred from price_heston_call_impl(): Uses adaptive Simpson rule with 20 depth levels. Characteristic function φ(u) derived from Heston SDE: dS=rSdt+√v·S·dW₁, dv=κ(θ-v)dt+ξ√v·dW₂ with correlation ρ';

MERGE (f:TransactFormula {name: 'Heston Characteristic Function'})
  SET f.equation = 'φ(u) = exp[iu(ln(S)+rτ) + (κθ/ξ²)((κ-ρξiu-d)τ - 2ln((1-ge^(-dτ))/(1-g))) + (v₀/ξ²)(κ-ρξiu-d)((1-e^(-dτ))/(1-ge^(-dτ)))]', f.description = 'Fourier transform of log-asset price under Heston dynamics',
      f.variables = ['u', 'S', 'v₀', 'r', 'κ', 'θ', 'ξ', 'ρ', 'τ', 'd', 'g'], f.assumptions = ['d = √((ρξiu-κ)² + ξ²(iu+u²))', 'g = (κ-ρξiu-d)/(κ-ρξiu+d)'],
      f.source_file = 'src/heston.rs', f.inference_reasoning = 'Inferred from cf_heston_impl(): Complex-valued characteristic function enables FFT pricing. Handles g≈0 singularity via series expansion for numerical stability';

MERGE (f:TransactFormula {name: 'Monte Carlo Call'})
  SET f.equation = 'C = e^(-rT)·(1/M)∑ₘ₌₁^M max(S·exp((r-σ²/2)T + σ√T·Zₘ) - K,0)', f.description = 'Simulation-based option pricing using GBM paths',
      f.variables = ['S', 'K', 'T', 'r', 'σ', 'M', 'Zₘ'], f.assumptions = ['GBM dynamics', 'risk-neutral measure', 'law of large numbers', 'finite variance'],
      f.source_file = 'src/monte_carlo.rs', f.inference_reasoning = 'Inferred from price_call_mc(): Uses StandardNormal RNG. Drift = (r-σ²/2)T per Ito lemma. Convergence rate O(1/√M) by Central Limit Theorem';

MERGE (f:TransactFormula {name: 'Put-Call Parity'})
  SET f.equation = 'C - P = S - K·e^(-rτ)', f.description = 'No-arbitrage relationship between European calls and puts',
      f.variables = ['C', 'P', 'S', 'K', 'r', 'τ'], f.assumptions = ['no transaction costs', 'European exercise', 'same strike and maturity'],
      f.source_file = 'src/black_scholes.rs;src/heston.rs;src/monte_carlo.rs', f.inference_reasoning = 'Inferred from price_put_internal() across all pricing modules. Fundamental no-arbitrage condition: long call + short put = forward contract';

MERGE (f:TransactFormula {name: 'Portfolio Return'})
  SET f.equation = 'R_p = w^T·r = ∑ᵢ wᵢ·rᵢ', f.description = 'Portfolio return as weighted sum of asset returns',
      f.variables = ['w', 'r', 'R_p'], f.assumptions = ['linear returns', 'no transaction costs', 'self-financing portfolio'],
      f.source_file = 'app/portfolio_engine.py', f.inference_reasoning = 'Inferred from portfolio_returns = returns @ weights. Vector notation enables efficient NumPy computation for N assets';

MERGE (f:TransactFormula {name: 'Portfolio Variance'})
  SET f.equation = 'σ²_p = w^T·Σ·w = ∑ᵢ∑ⱼ wᵢwⱼσᵢⱼ', f.description = 'Portfolio variance via covariance matrix quadratic form',
      f.variables = ['w', 'Σ', 'σ²_p', 'σᵢⱼ'], f.assumptions = ['elliptical distributions', 'finite second moments', 'positive definite Σ'],
      f.source_file = 'app/portfolio_engine.py', f.inference_reasoning = 'Inferred from var_p = weights @ cov @ weights. Quadratic form captures diversification: off-diagonal covariances reduce total risk';

MERGE (f:TransactFormula {name: 'Portfolio Beta'})
  SET f.equation = 'β_p = w^T·β = Cov(R_p,R_m)/Var(R_m)', f.description = 'Portfolio systematic risk relative to market',
      f.variables = ['β_p', 'β', 'R_p', 'R_m'], f.assumptions = ['CAPM holds', 'market portfolio is efficient', 'linear factor model'],
      f.source_file = 'app/portfolio_engine.py', f.inference_reasoning = 'Inferred from betas = cov_im / var_m then beta_p = weights @ betas. Beta measures sensitivity to market movements';

MERGE (f:TransactFormula {name: 'Global Minimum Variance'})
  SET f.equation = 'w_GMV = Σ⁻¹·ι / (ι^T·Σ⁻¹·ι)', f.description = 'Portfolio with minimum variance regardless of expected return',
      f.variables = ['w_GMV', 'Σ', 'ι'], f.assumptions = ['Σ invertible', 'no short-sale constraints (unless specified)'],
      f.source_file = 'app/optimizer/mvo.py', f.inference_reasoning = 'Inferred from gmv_portfolio(): cov_inv @ ones / (ones @ cov_inv @ ones). GMV lies at vertex of efficient frontier';

MERGE (f:TransactFormula {name: 'Tangency Portfolio'})
  SET f.equation = 'w_TAN = Σ⁻¹·(r - r_f·ι) / (ι^T·Σ⁻¹·(r - r_f·ι))', f.description = 'Portfolio maximizing Sharpe ratio (optimal risky portfolio)',
      f.variables = ['w_TAN', 'Σ', 'r', 'r_f', 'ι'], f.assumptions = ['risk-free asset exists', 'homogeneous expectations', 'mean-variance efficiency'],
      f.source_file = 'app/optimizer/mvo.py', f.inference_reasoning = 'Inferred from tangency_portfolio(): v = cov_inv @ (mu - risk_free); w = v / v.sum(). Tangency portfolio is unique optimal risky portfolio per Tobin separation';

MERGE (f:TransactFormula {name: 'Black-Litterman Posterior'})
  SET f.equation = 'μ_BL = [(τΣ)⁻¹ + P^T·Ω⁻¹·P]⁻¹·[(τΣ)⁻¹·π + P^T·Ω⁻¹·q', f.description = 'Bayesian update of equilibrium returns with investor views',
      f.variables = ['μ_BL', 'τ', 'Σ', 'P', 'Ω', 'π', 'q'], f.assumptions = ['views are normally distributed', 'τ scales prior uncertainty', 'Ω diagonal'],
      f.source_file = 'app/optimizer/black_litterman.py', f.inference_reasoning = 'Inferred from blm_posterior(): A = tau_sigma_inv + P.T @ omega_inv @ P; b = tau_sigma_inv @ pi + P.T @ omega_inv @ q. Combines market equilibrium (reverse optimization) with subjective views via Bayes rule';

MERGE (f:TransactFormula {name: 'Black-Litterman Implied Returns'})
  SET f.equation = 'π = δ·Σ·w_m', f.description = 'Equilibrium returns implied by market weights (reverse optimization)',
      f.variables = ['π', 'δ', 'Σ', 'w_m'], f.assumptions = ['market is in equilibrium', 'CAPM holds', 'δ is risk aversion coefficient'],
      f.source_file = 'app/optimizer/black_litterman.py', f.inference_reasoning = 'Inferred from reverse_optimization(): pi = risk_aversion * (cov @ w_m). Derives from first-order condition of market portfolio optimization';

MERGE (f:TransactFormula {name: 'Kelly Criterion (Single)'})
  SET f.equation = 'f* = p/a - q/b', f.description = 'Optimal fraction to maximize expected log wealth',
      f.variables = ['f*', 'p', 'q', 'a', 'b'], f.assumptions = ['binary outcomes', 'known probabilities', 'independent bets', 'log utility'],
      f.source_file = 'app/optimizer/kelly.py', f.inference_reasoning = 'Inferred from kelly_single(): Generalizes p-q for asymmetric payoffs. Derived from maximizing G(f) = p·ln(1+fb) + q·ln(1-fa)';

MERGE (f:TransactFormula {name: 'Kelly Criterion (Multi)'})
  SET f.equation = 'w* = argmax_w E[ln(1 + w^T·r)]', f.description = 'Multi-asset Kelly: maximize expected log growth rate',
      f.variables = ['w', 'r', 'E[·]'], f.assumptions = ['joint return distribution known', 'no transaction costs', 'continuous rebalancing'],
      f.source_file = 'app/optimizer/kelly.py', f.inference_reasoning = 'Inferred from kelly_multi_asset(): Uses convex optimization with log(1 + r_t @ w) objective. Geometric mean maximization yields optimal long-term growth';

MERGE (f:TransactFormula {name: 'Equal Risk Contribution'})
  SET f.equation = 'RC_i = w_i·(Σw)_i / σ_p = σ_p/N ∀i', f.description = 'Risk parity: each asset contributes equally to portfolio volatility',
      f.variables = ['RC_i', 'w', 'Σ', 'σ_p', 'N'], f.assumptions = ['elliptical distributions', 'long-only', 'continuous weights'],
      f.source_file = 'app/optimizer/risk_parity.py', f.inference_reasoning = 'Inferred from _risk_contributions(): RC = w * (cov @ w) / sigma_p. Iterative CCD solves for weights where all RC_i equal';

MERGE (f:TransactFormula {name: 'Hierarchical Risk Parity'})
  SET f.equation = 'w = RecursiveBisection(Σ, Dendrogram(ρ))', f.description = 'HRP: cluster-based allocation via hierarchical tree recursion',
      f.variables = ['w', 'Σ', 'ρ', 'Dendrogram'], f.assumptions = ['ultrametric structure in correlation', 'quasi-diagonalization possible'],
      f.source_file = 'app/optimizer/hrp.py', f.inference_reasoning = 'Inferred from hrp_weights(): 1) Compute correlation distance d_ij = √(2(1-ρ_ij)), 2) Single-linkage clustering, 3) Quasi-diagonal ordering, 4) Recursive bisection with α = 1 - cVar₀/(cVar₀+cVar₁)';

MERGE (f:TransactFormula {name: 'VaR Historical'})
  SET f.equation = 'VaR_α = M·q̂_α where q̂_α = inf{l: F̂(l) ≥ α}', f.description = 'Non-parametric VaR via empirical quantile of losses',
      f.variables = ['VaR_α', 'M', 'q̂_α', 'F̂'], f.assumptions = ['i.i.d. returns', 'stationary distribution', 'no parametric assumptions'],
      f.source_file = 'app/risk/var_engine.py', f.inference_reasoning = 'Inferred from var_historical(): q_alpha = np.percentile(losses, alpha*100). Distribution-free but requires large sample for tail accuracy';

MERGE (f:TransactFormula {name: 'VaR Parametric Normal'})
  SET f.equation = 'VaR_α = M·(-μ + σ·Φ⁻¹(α))', f.description = 'Parametric VaR assuming normal returns',
      f.variables = ['VaR_α', 'M', 'μ', 'σ', 'Φ⁻¹'], f.assumptions = ['normal distribution', 'known parameters', 'elliptical symmetry'],
      f.source_file = 'app/risk/var_engine.py', f.inference_reasoning = 'Inferred from var_parametric_normal(): q_alpha = stats.norm.ppf(alpha). Closed-form but underestimates tail risk for fat-tailed returns';

MERGE (f:TransactFormula {name: 'VaR Parametric t'})
  SET f.equation = 'VaR_α = M·(-μ + σ·t_ν⁻¹(α))', f.description = 'Parametric VaR with Student-t distribution (fat tails)',
      f.variables = ['VaR_α', 'M', 'μ', 'σ', 'ν', 't_ν⁻¹'], f.assumptions = ['Student-t distribution', 'ν > 2 for finite variance', 'MLE parameter estimation'],
      f.source_file = 'app/risk/var_engine.py', f.inference_reasoning = 'Inferred from var_parametric_t(): nu, mu, sigma = stats.t.fit(). Captures fat tails: ES factor = (ν+t²)/(ν-1) > 1 for small ν';

MERGE (f:TransactFormula {name: 'Expected Shortfall (ES)'})
  SET f.equation = 'ES_α = E[L | L > VaR_α] = (1/(1-α))·∫_α¹ VaR_u du', f.description = 'Average loss in tail beyond VaR (coherent risk measure)',
      f.variables = ['ES_α', 'L', 'VaR_α'], f.assumptions = ['subadditivity holds', 'tail distribution integrable'],
      f.source_file = 'app/risk/var_engine.py', f.inference_reasoning = 'Inferred from var_historical(): tail = losses[losses >= q_alpha]; es = mean(tail). ES is coherent (subadditive) unlike VaR';

MERGE (f:TransactFormula {name: 'VaR Time Scaling'})
  SET f.equation = 'VaR_T = VaR₁·√T', f.description = 'Square-root-of-time rule for VaR horizon scaling',
      f.variables = ['VaR_T', 'VaR₁', 'T'], f.assumptions = ['i.i.d. returns', 'no autocorrelation', 'normal or stable distributions'],
      f.source_file = 'app/risk/var_engine.py', f.inference_reasoning = 'Inferred from _scale_var(): var * sqrt(horizon_days). Follows from variance additivity: Var(∑X_t) = T·Var(X) for independent X_t';

MERGE (f:TransactFormula {name: 'Sharpe Ratio'})
  SET f.equation = 'SR = (r̄_p - r_f) / σ_p', f.description = 'Risk-adjusted return per unit of total volatility',
      f.variables = ['SR', 'r̄_p', 'r_f', 'σ_p'], f.assumptions = ['normal returns', 'stationary distribution', 'annualized consistently'],
      f.source_file = 'app/portfolio_engine.py', f.inference_reasoning = 'Inferred from sharpe = (r_p - risk_free_rate) / sigma_p. Higher SR indicates better risk-adjusted performance; SR > 1.5 is excellent';

MERGE (f:TransactFormula {name: 'Sortino Ratio'})
  SET f.equation = 'SR_D = (r̄_p - MAR) / σ_downside', f.description = 'Downside risk-adjusted return (penalizes only negative deviations)',
      f.variables = ['SR_D', 'MAR', 'σ_downside'], f.assumptions = ['MAR specified', 'downside semivariance meaningful', 'asymmetric loss aversion'],
      f.source_file = 'app/portfolio_engine.py', f.inference_reasoning = 'Inferred from sortino = (r_p - mar_val) / sigma_down where sigma_down uses only returns < MAR. Aligns with loss aversion in prospect theory';

MERGE (f:TransactFormula {name: 'Treynor Ratio'})
  SET f.equation = 'TR = (r̄_p - r_f) / β_p', f.description = 'Risk-adjusted return per unit of systematic risk',
      f.variables = ['TR', 'r̄_p', 'r_f', 'β_p'], f.assumptions = ['CAPM holds', 'beta is appropriate risk measure', 'diversified portfolio'],
      f.source_file = 'app/portfolio_engine.py', f.inference_reasoning = 'Inferred from treynor = (r_p - risk_free_rate) / portfolio_beta. Appropriate for well-diversified portfolios where idiosyncratic risk is negligible';

MERGE (f:TransactFormula {name: 'Information Ratio'})
  SET f.equation = 'IR = (r̄_p - r̄_b) / σ(r_p - r_b)', f.description = 'Active return per unit of tracking error',
      f.variables = ['IR', 'r̄_p', 'r̄_b', 'tracking_error'], f.assumptions = ['benchmark specified', 'active management', 'tracking error stationary'],
      f.source_file = 'app/portfolio_engine.py', f.inference_reasoning = 'Inferred from ir = mean(excess) / std(excess) where excess = portfolio_returns - benchmark_returns. IR > 0.5 indicates skilled active management';

MERGE (f:TransactFormula {name: 'M² Modigliani'})
  SET f.equation = 'M² = r_f + SR·σ_benchmark', f.description = 'Risk-adjusted performance in return units (comparable across portfolios)',
      f.variables = ['M²', 'SR', 'σ_benchmark'], f.assumptions = ['benchmark volatility meaningful', 'leverage possible at r_f'],
      f.source_file = 'app/portfolio_engine.py', f.inference_reasoning = 'Inferred from m2 = risk_free_rate + sharpe * sigma_bench. M² allows direct return comparison: M² > benchmark return indicates outperformance';

MERGE (f:TransactFormula {name: 'Factor Model'})
  SET f.equation = 'R_it = α_i + β_i^T·f_t + ε_it', f.description = 'Time-series regression of asset returns on factors',
      f.variables = ['R_it', 'α_i', 'β_i', 'f_t', 'ε_it'], f.assumptions = ['factors are exogenous', 'ε_it ~ iid(0,σ²_ε)', 'no omitted variables'],
      f.source_file = 'app/factors/factor_model.py', f.inference_reasoning = 'Inferred from estimate_factor_model_ols(): OLS per asset: b = lstsq(F, y). Captures systematic risk exposures via factor loadings β';

MERGE (f:TransactFormula {name: 'Factor Covariance'})
  SET f.equation = 'Σ̂ = B·Σ_f·B^T + D', f.description = 'Implied asset covariance from factor structure',
      f.variables = ['Σ̂', 'B', 'Σ_f', 'D'], f.assumptions = ['factors explain correlations', 'D diagonal (idiosyncratic uncorrelated)'],
      f.source_file = 'app/factors/factor_model.py', f.inference_reasoning = 'Inferred from factor_covariance(): B @ Sigma_f @ B.T + diag(D). Dimensionality reduction: K<<N factors drive N×N covariance';

MERGE (f:TransactFormula {name: 'Delta (Call)'})
  SET f.equation = 'Δ = ∂C/∂S = N(d₁)', f.description = 'Sensitivity of option price to underlying spot price',
      f.variables = ['Δ', 'C', 'S', 'N(d₁)'], f.assumptions = ['Black-Scholes assumptions', 'continuous hedging possible'],
      f.source_file = 'src/greeks.rs', f.inference_reasoning = 'Inferred from calculate_bs_analytical_greeks(): delta = n_d1 for calls. Delta hedging: hold -Δ shares per short call to achieve delta-neutrality';

MERGE (f:TransactFormula {name: 'Gamma'})
  SET f.equation = 'Γ = ∂²C/∂S² = φ(d₁)/(S·σ√τ)', f.description = 'Rate of change of delta (convexity of option price)',
      f.variables = ['Γ', 'φ(d₁)', 'S', 'σ', 'τ'], f.assumptions = ['smooth price paths', 'continuous rebalancing for delta-hedging'],
      f.source_file = 'src/greeks.rs', f.inference_reasoning = 'Inferred from gamma = phi_d1 / (s * sigma_sqrt_tau). Gamma is highest for ATM options; gamma scalping profits from large price moves';

MERGE (f:TransactFormula {name: 'Theta (Call)'})
  SET f.equation = 'Θ = ∂C/∂t = -[S·φ(d₁)·σ/(2√τ) + r·K·e^(-rτ)·N(d₂)]/365', f.description = 'Time decay: daily loss in option value as expiration approaches',
      f.variables = ['Θ', 'φ(d₁)', 'σ', 'τ', 'r', 'K'], f.assumptions = ['ceteris paribus', 'time passes continuously', 'volatility constant'],
      f.source_file = 'src/greeks.rs', f.inference_reasoning = 'Inferred from theta_annual then divided by 365. Theta is negative for long options; ATM options have highest time decay';

MERGE (f:TransactFormula {name: 'Vega'})
  SET f.equation = 'ν = ∂C/∂σ = S·φ(d₁)·√τ/100', f.description = 'Sensitivity to implied volatility changes (per 1% vol move)',
      f.variables = ['ν', 'S', 'φ(d₁)', '√τ'], f.assumptions = ['volatility is stochastic but treated as parameter', 'vega same for calls/puts'],
      f.source_file = 'src/greeks.rs', f.inference_reasoning = 'Inferred from vega = (s * phi_d1 * sqrt_tau) / 100. Vega is highest for ATM options; long vega profits from volatility increase';

MERGE (f:TransactFormula {name: 'Rho (Call)'})
  SET f.equation = 'ρ = ∂C/∂r = K·τ·e^(-rτ)·N(d₂)/100', f.description = 'Sensitivity to risk-free rate changes (per 1% rate move)',
      f.variables = ['ρ', 'K', 'τ', 'N(d₂)'], f.assumptions = ['parallel yield curve shifts', 'rate changes are small'],
      f.source_file = 'src/greeks.rs', f.inference_reasoning = 'Inferred from rho = (k * tau * discount * n_d2) / 100. Rho is positive for calls (higher rates increase call value via lower PV of strike)';

MERGE (f:TransactFormula {name: 'Correlation Distance'})
  SET f.equation = 'd_ij = √(2(1-ρ_ij))', f.description = 'Metric transformation of correlation for hierarchical clustering',
      f.variables = ['d_ij', 'ρ_ij'], f.assumptions = ['ρ_ij ∈ [-1,1]', 'd satisfies triangle inequality', 'ultrametric approximation'],
      f.source_file = 'app/optimizer/hrp.py', f.inference_reasoning = 'Inferred from correlation_distance(): sqrt(2*(1-clip(corr,-1,1))). Maps ρ∈[-1,1] to d∈[0,2]; d=0 when ρ=1 (perfectly correlated)';

MERGE (f:TransactFormula {name: 'Feller Condition'})
  SET f.equation = '2κθ > ξ²', f.description = 'Condition for CIR process to stay strictly positive (no zero absorption)',
      f.variables = ['κ', 'θ', 'ξ'], f.assumptions = ['CIR variance process', 'mean reversion strong enough vs volatility'],
      f.source_file = 'src/heston.rs', f.inference_reasoning = 'Inferred from validate_feller_condition(): Ensures variance v_t never hits zero in Heston model. Violation leads to boundary behavior and numerical instability';

MERGE (f:TransactFormula {name: 'Abramowitz-Stegun Normal CDF'})
  SET f.equation = 'N(x) ≈ 1 - φ(x)·(b₁t + b₂t² + b₃t³ + b₄t⁴ + b₅t⁵) where t=1/(1+px)', f.description = 'Fast approximation of normal CDF for computational efficiency',
      f.variables = ['N(x)', 'φ(x)', 't', 'p', 'bᵢ'], f.assumptions = ['|x|≤8', 'approximation error < 7.5×10⁻⁸'],
      f.source_file = 'src/black_scholes.rs;src/greeks.rs', f.inference_reasoning = 'Inferred from fast_normal_cdf(): p=0.2316419, b₁=0.319381530, b₂=-0.356563782, b₃=1.781477937, b₄=-1.821255978, b₅=1.330274429. Used for hot-path performance in pricing loops';
