/**
 * Marketplace data — rich content for all 8 platform menu items.
 * Used by LandingStage sections, MarketplaceStage cards, and MarketplaceItemPage tabs.
 */

export type UserRole =
  | 'Portfolio Manager'
  | 'Quant Analyst'
  | 'Risk Manager'
  | 'Derivatives Trader'
  | 'Research Analyst'
  | 'Academic / Researcher'
  | 'Student'
  | 'Fintech Developer'
  | 'Fund Manager';

export type MenuCategory =
  | 'Pricing'
  | 'Portfolio Management'
  | 'Risk Analytics'
  | 'Optimization'
  | 'Volatility'
  | 'Factor Analysis'
  | 'Scenarios'
  | 'Execution';

export interface FormulaEntry {
  name: string;
  formula: string;   // plain-text fallback / short label
  latex: string;     // KaTeX LaTeX string for rendering
  desc: string;
}

export interface FeatureEntry {
  name: string;
  desc: string;
  icon: string;
}

export interface SignificanceEntry {
  title: string;
  body: string;
}

export interface MenuItem {
  id: string;
  icon: string;
  title: string;
  tagline: string;
  category: MenuCategory;
  accentColor: string;
  complexity: 'Basic' | 'Intermediate' | 'Advanced';
  route: string;
  targetUsers: string[];
  userRoles: UserRole[];
  /** Where this workspace sits in the Dynamic Yield Optimization Agent journey (for unlogged users). */
  onboardingJourney?: string;
  /** Short Web3-specific bullets (wallets, chains, MEV, agents, graph, etc.). */
  web3Focus?: string[];
  /** Copy shown on registration/last tab to explain why to connect wallet / register. */
  registrationCTA?: string;
  overview: {
    headline: string;
    body: string;
    capabilities: string[];
  };
  featureBreakdown: FeatureEntry[];
  significance: SignificanceEntry[];
  formulas: FormulaEntry[];
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'pricer',
    icon: '⚡',
    title: 'On-Chain Pricer & Oracle Hub',
    tagline: 'AMM/Perp/Option pricing, oracle feeds, and pool state for DeFi routes.',
    category: 'Pricing',
    accentColor: 'blue',
    complexity: 'Advanced',
    route: '/transact/pricer',
    targetUsers: ['Derivatives Trader', 'Quant Analyst', 'Risk Manager'],
    userRoles: ['Derivatives Trader', 'Quant Analyst', 'Risk Manager', 'Research Analyst', 'Academic / Researcher', 'Student'],
    onboardingJourney: 'Workspace: price and sanity-check on-chain routes before the agent executes.',
    web3Focus: [
      'Pulls oracle prices and pool reserves via gateway /v2/oracles/price and /v2/pool.',
      'Shapes MEV-aware pricing by comparing on-chain quotes to off-chain fair value.',
      'Feeds the Yield & Agent workspace with execution prices and risk metrics.',
    ],
    registrationCTA: 'Register and connect your wallet to let the agent price and route your swaps using on-chain oracles and AMM state specific to your portfolio.',
    overview: {
      headline: 'Three-model derivatives and AMM pricing with live market + on-chain data',
      body: 'The On-Chain Pricer & Oracle Hub combines closed-form Black-Scholes, FFT-based Carr-Madan, and Heston stochastic volatility models into a single unified workspace. Live spot prices and implied volatility are fetched from yfinance, while oracle feeds and pool reserves are pulled from the gateway /v2 surface. Model outputs and on-chain prices are compared in real-time — any deviation beyond threshold triggers an agreement warning, enabling arbitrage and execution sanity checks for the agent.',
      capabilities: [
        'Live spot price + ATM implied vol from yfinance',
        'Three models priced in parallel (BS · FFT · Heston SV)',
        'Full Greeks: Δ Γ Θ ν ρ — analytical and numerical',
        'Δ/Γ sensitivity heatmap (7×7 S×K grid)',
        'Live option chain with BS theoretical overlay',
        'CAPM: live beta β from 1-year daily log-returns',
        'Delta-adjusted exposure βₒₚₜ = Δ × βᵤₙₐ',
      ],
    },
    featureBreakdown: [
      { name: 'Black-Scholes Model', desc: 'Analytical closed-form pricing for European calls and puts. Serves as the benchmark model and powers all Greek computations. Put-call parity verified automatically.', icon: '📐' },
      { name: 'FFT Carr-Madan Pricing', desc: 'Fast Fourier Transform method for option pricing via characteristic function. Auto-optimised grid (N, Δv, α) using Rust core — recovers full volatility surface in O(N log N).', icon: '🔢' },
      { name: 'Heston Stochastic Volatility', desc: 'Mean-reverting variance process dv = κ(θ−v)dt + ξ√v dW₂. Captures volatility smile/skew effects absent from BS. Feller condition 2κθ > ξ² validated before pricing.', icon: '🌊' },
      { name: 'Greeks Dashboard', desc: 'Analytical Greeks for all three models. Interactive Δ/Γ heatmap over a 7×7 S×K grid (±30% from spot/strike). Colour-coded risk intuition at a glance.', icon: '🎛️' },
      { name: 'Live Option Chain', desc: 'yfinance-backed option chain with moneyness classification (ITM/ATM/OTM), market price, implied vol, BS theoretical, and Mkt−BS spread per strike and expiry.', icon: '📊' },
      { name: 'CAPM Integration', desc: 'Live beta computed from 1-year daily log-returns vs benchmark (SPY default). SML visualisation with delta-adjusted beta for options overlaid on the security market line.', icon: '📈' },
    ],
    significance: [
      { title: 'Industry standard for options desks', body: 'Black-Scholes remains the universal quoting convention on options desks worldwide despite its limitations. Every volatility surface, every trading system, and every risk report is expressed in BS implied vol — making deep BS fluency non-negotiable for practitioners.' },
      { title: 'Volatility smile and Heston calibration', body: 'The implied volatility smile — where OTM options trade at higher IV than ATM — invalidates the constant-σ assumption of BS. Heston\'s model endogenously generates the smile via mean-reverting stochastic variance, making it the workhorse of structured product desks.' },
      { title: 'FFT for exotic and vanilla pricing', body: 'Carr-Madan (1999) showed that option prices can be recovered from the characteristic function via FFT, reducing O(N²) naive integration to O(N log N). This technique underlies virtually all modern exotic option pricing systems.' },
      { title: 'Delta-adjusted CAPM exposure', body: 'Incorporating option delta into CAPM beta (βₒₚₜ = Δ·βᵤₙₐ) gives the effective equity exposure of an options position — critical for portfolio-level risk decomposition and regulatory capital computation under FRTB.' },
    ],
    formulas: [
      { name: 'Black-Scholes Call Price', formula: 'C = SN(d₁) − Ke⁻ʳᵗN(d₂)',
        latex: 'C = S N(d_1) - K e^{-r\\tau} N(d_2), \\quad d_1 = \\dfrac{\\ln(S/K)+\\left(r+\\tfrac{1}{2}\\sigma^2\\right)\\tau}{\\sigma\\sqrt{\\tau}}',
        desc: 'Fundamental European call pricing formula. d₁ and d₂ determine the risk-neutral probability weights on spot and strike.' },
      { name: 'Heston Variance Dynamics', formula: 'dv = κ(θ−v)dt + ξ√v dW₂',
        latex: 'dv = \\kappa(\\theta - v)\\,dt + \\xi\\sqrt{v}\\,dW_2, \\qquad 2\\kappa\\theta > \\xi^2',
        desc: 'Mean-reverting CIR process for instantaneous variance. κ=mean-reversion speed, θ=long-run variance, ξ=vol-of-vol. Feller condition ensures v stays positive.' },
      { name: 'Delta (Δ)', formula: 'Δ_call = N(d₁),  Δ_put = N(d₁)−1',
        latex: '\\Delta_{\\text{call}} = N(d_1), \\qquad \\Delta_{\\text{put}} = N(d_1) - 1',
        desc: 'First derivative of option price with respect to spot. Measures hedge ratio — units of stock needed to delta-hedge one option.' },
      { name: 'Gamma (Γ)', formula: 'Γ = N\'(d₁) / (Sσ√τ)',
        latex: '\\Gamma = \\dfrac{N\'(d_1)}{S\\,\\sigma\\,\\sqrt{\\tau}}',
        desc: 'Rate of change of delta w.r.t. spot. Peaks ATM near expiry — the "gamma trap" for short-option desks.' },
      { name: 'Vega (ν)', formula: 'ν = S·N\'(d₁)·√τ',
        latex: '\\nu = S\\cdot N\'(d_1)\\cdot\\sqrt{\\tau}',
        desc: 'Sensitivity to a 1% shift in implied volatility. Critical for volatility surface hedging.' },
      { name: 'Delta-Adjusted Beta', formula: 'β_opt = Δ · β_underlying',
        latex: '\\beta_{\\text{opt}} = \\Delta \\cdot \\beta_{\\text{underlying}}',
        desc: 'Scales underlying equity beta by option delta to give effective portfolio market exposure for CAPM risk decomposition.' },
    ],
  },

  {
    id: 'portfolio',
    icon: '📊',
    title: 'Position & Yield Tracker',
    tagline: 'Wallet & chain portfolio, yield metrics, DeFi Brinson attribution.',
    category: 'Portfolio Management',
    accentColor: 'indigo',
    complexity: 'Intermediate',
    route: '/transact/portfolio',
    targetUsers: ['Portfolio Manager', 'Fund Manager', 'Research Analyst'],
    userRoles: ['Portfolio Manager', 'Fund Manager', 'Quant Analyst', 'Research Analyst', 'Academic / Researcher', 'Student'],
    onboardingJourney: 'Workspace: how the agent sees and explains your multi-chain DeFi portfolio.',
    web3Focus: [
      'Ingests on-chain positions via /v2/positions and the Data Universe snapshot.',
      'Tracks realised / unrealised P&L and yield across chains and protocols.',
      'Provides attribution views the agent uses to justify reallocations.',
    ],
    registrationCTA: 'Register and share a wallet address so the agent can build a live multi-chain position and yield view instead of demo data.',
    overview: {
      headline: 'Multi-chain position and yield analytics from raw on-chain data to performance appraisal',
      body: 'Build a portfolio from any set of yfinance-listed assets or on-chain positions, compute sample moments, risk-adjusted performance metrics, higher-order statistics, and Brinson-style return attribution — all in one integrated workflow. The portfolio context is shared across all sub-modules and the Yield & Agent workspace, so changes to weights instantly propagate to moments, performance, attribution, and the agent’s optimisation decisions.',
      capabilities: [
        'Multi-asset universe builder with live yfinance prices',
        'Sample moments: E[Rₚ], σ²ₚ, βₚ, skewness γ̂, excess kurtosis κ̂',
        'Sharpe, Sortino, Treynor, M², Jensen α, Information Ratio',
        'Coskewness matrix M₃ heatmap (M2 §2)',
        'Brinson return attribution: allocation + selection + interaction',
        'Benchmark-relative performance vs SPY / custom index',
      ],
    },
    featureBreakdown: [
      { name: 'Asset Universe Builder', desc: 'Search and add any yfinance-listed equity, ETF, or index. Set portfolio weights with live validation. Dates are automatically aligned across all assets.', icon: '🏗️' },
      { name: 'Sample Moments Panel', desc: 'Portfolio return E[Rₚ], variance σ²ₚ, portfolio beta βₚ estimated against benchmark, skewness γ̂, and excess kurtosis κ̂ — from log-return time series.', icon: '📐' },
      { name: 'Performance Appraisal', desc: 'Sharpe ratio, Sortino ratio (downside deviation), Treynor ratio, Modigliani M², Jensen\'s alpha, and Information Ratio vs benchmark — all computed against a configurable risk-free rate.', icon: '🏆' },
      { name: 'Coskewness Heatmap', desc: 'Full third-order coskewness matrix M₃ (n×n×n tensor flattened to n×n) — capturing asymmetric co-movement. Critical for non-normal portfolio distributions.', icon: '🌡️' },
      { name: 'Return Attribution', desc: 'Brinson-Hood-Beebower attribution: active return decomposed into allocation effect (sector weights vs benchmark), selection effect (stock picking), and interaction effect.', icon: '🔍' },
    ],
    significance: [
      { title: 'Mean-variance theory in practice', body: 'Markowitz (1952) established that portfolio variance σ²ₚ = wᵀΣw is the foundational risk metric. Modern CFA curriculum, GIPS compliance reporting, and fund factsheets all centre on these moment estimates.' },
      { title: 'Higher moments matter in non-Gaussian returns', body: 'Equity return distributions exhibit negative skewness (crash risk) and excess kurtosis (fat tails). Ignoring M₃ and M₄ leads to underestimation of VaR by 20-40% in stress periods — a finding central to WQU\'s M2 curriculum.' },
      { title: 'Performance appraisal for fund evaluation', body: 'Institutional investors evaluate managers on Sharpe, Information Ratio, and alpha persistence across regimes. The M² metric (Modigliani & Modigliani 1997) expresses risk-adjusted return in percentage terms comparable across strategies.' },
    ],
    formulas: [
      { name: 'Portfolio Return', formula: 'E[Rₚ] = wᵀ E[R]',
        latex: 'E[R_p] = \\mathbf{w}^\\top \\mathbf{\\mu} = \\sum_{i=1}^n w_i E[R_i]',
        desc: 'Weighted average expected return — linear in portfolio weights.' },
      { name: 'Portfolio Variance', formula: 'σ²ₚ = wᵀΣw',
        latex: '\\sigma^2_p = \\mathbf{w}^\\top \\Sigma\\, \\mathbf{w} = \\sum_i \\sum_j w_i w_j \\sigma_{ij}',
        desc: 'Quadratic form of the covariance matrix. Diversification occurs when σᵢⱼ < σᵢ·σⱼ (imperfect correlation).' },
      { name: 'Sharpe Ratio', formula: 'SR = (E[Rₚ]−Rƒ) / σₚ',
        latex: '\\text{SR} = \\dfrac{E[R_p] - R_f}{\\sigma_p}',
        desc: 'Risk-adjusted excess return per unit of total volatility. Used as the primary performance benchmark in the industry.' },
      { name: "Jensen's Alpha", formula: 'αⱼ = E[Rₚ] − Rƒ − βₚ(E[Rₘ]−Rƒ)',
        latex: '\\alpha_J = E[R_p] - \\left[R_f + \\beta_p\\bigl(E[R_m] - R_f\\bigr)\\right]',
        desc: 'Excess return above CAPM-predicted benchmark-adjusted return. Positive α implies genuine managerial skill.' },
      { name: 'Coskewness', formula: 'M₃(i,j) = E[(Rᵢ−μᵢ)(Rⱼ−μⱼ)²] / (σᵢσⱼ²)',
        latex: 'M_3(i,j) = \\dfrac{E\\left[(R_i-\\mu_i)(R_j-\\mu_j)^2\\right]}{\\sigma_i\\,\\sigma_j^2}',
        desc: 'Third cross-central moment. Negative diagonal entries flag assets that amplify portfolio downturns — critical for non-normal distributions.' },
    ],
  },

  {
    id: 'risk',
    icon: '🛡️',
    title: 'Risk & MEV Shield',
    tagline: 'On-chain VaR/ES, MEV delta, and protocol dependency graph.',
    category: 'Risk Analytics',
    accentColor: 'emerald',
    complexity: 'Advanced',
    route: '/transact/risk',
    targetUsers: ['Risk Manager', 'Portfolio Manager', 'Quant Analyst'],
    userRoles: ['Risk Manager', 'Portfolio Manager', 'Quant Analyst', 'Derivatives Trader', 'Fund Manager', 'Academic / Researcher', 'Student'],
    onboardingJourney: 'Workspace: how the agent measures tail risk and MEV impact before moving your capital.',
    web3Focus: [
      'Combines DeFi P&L paths with VaR/ES and MEV-adjusted Greeks.',
      'Uses protocol dependency graphs to understand cross-chain and cross-protocol contagion.',
      'Shares risk budgets and alerts back into the Yield & Agent execution loop.',
    ],
    registrationCTA: 'Register so the agent can compute VaR, ES, and MEV-adjusted risk metrics on your actual DeFi positions instead of a sample portfolio.',
    overview: {
      headline: 'Comprehensive on-chain risk analytics: VaR, CVaR, Greeks aggregation, and dependency diagnostics',
      body: 'The Risk & MEV Shield workspace unifies five distinct risk disciplines: parametric and non-parametric tail risk (VaR/CVaR), options book Greeks aggregation with Delta-VaR and Gamma-adjusted VaR, covariance matrix health diagnostics (Ledoit-Wolf shrinkage, eigenspectrum), minimum spanning tree (MST) graph for protocol and chain topology, and a Basel III multi-confidence, multi-horizon risk dashboard. These outputs are consumed by the Dynamic Yield Optimization Agent when sizing and throttling on-chain strategies.',
      capabilities: [
        'VaR: Historical simulation, Parametric (normal), Monte Carlo (50k paths)',
        'CVaR (Expected Shortfall) at 95% and 99% confidence',
        'Portfolio Greeks aggregation: net Δ Γ ν θ from any options book',
        'Delta-VaR and Gamma-adjusted VaR (second-order Taylor expansion)',
        'Covariance matrix: condition number κ, Ledoit-Wolf shrinkage, OAS',
        'Minimum Spanning Tree graph for correlation topology',
        'Basel III multi-horizon (1d, 5d, 10d) VaR + ES dashboard',
      ],
    },
    featureBreakdown: [
      { name: 'VaR Calculator Panel', desc: 'Three VaR methods side-by-side: historical percentile, parametric σ-scaling, and 50,000-path Monte Carlo. Horizon scaling via √T rule. Confidence 95% and 99%.', icon: '📉' },
      { name: 'Greeks Risk Aggregation', desc: 'Enter any options position book. Computes net portfolio Delta, Gamma, Vega, Theta. Delta-VaR = Δ·S·σ·√T·z_α. Gamma-adjusted VaR adds ½Γ·(S·σ·√T·z_α)² to capture non-linearity.', icon: '🔣' },
      { name: 'Covariance Matrix Health', desc: 'Condition number κ (eigenvalue ratio). Ledoit-Wolf and Oracle Approximating Shrinkage (OAS) estimators. SVG correlation heatmaps (raw / LW / OAS / distance). Eigenspectrum bar chart.', icon: '🧮' },
      { name: 'MST Correlation Graph', desc: 'Distance matrix d(ρ) = √(2(1−ρ)) converted to minimum spanning tree. Pure SVG circular layout. Toggle all edges vs MST-only. Reveals asset cluster structure and systemic risk channels.', icon: '🕸️' },
      { name: 'Basel III Risk Dashboard', desc: 'Multi-confidence (90/95/99%) × multi-horizon (1d/5d/10d) VaR + ES grid. 10-day 99% VaR highlighted per Basel II minimum capital requirements.', icon: '🏛️' },
    ],
    significance: [
      { title: 'Basel III capital adequacy', body: '10-day 99% VaR is the Basel III standard for market risk capital charges. All major banks are required to report and maintain capital buffers scaled to this measure — making robust VaR computation a regulatory necessity, not an academic exercise.' },
      { title: 'Greeks aggregation for options books', body: 'In practice, options desks carry hundreds of positions. Aggregating to net Delta, Gamma, and Vega then computing second-order Greek-based VaR (Δ-VaR + Gamma correction) is the industry standard for rapid intraday risk checks.' },
      { title: 'Covariance matrix ill-conditioning', body: 'Sample covariance matrices with p ≫ n are singular. Ledoit-Wolf (2004) shrinkage toward a structured estimator reduces estimation error by ~50% in realistic portfolio sizes — critical for any MVO or risk parity optimizer downstream.' },
      { title: 'Systemic risk via MST', body: 'Minimum spanning trees (Mantegna 1999) filter the N(N−1)/2 pairwise correlations down to N−1 edges that preserve the most information. The resulting tree topology reveals contagion pathways during crises — a key tool in macro risk management.' },
    ],
    formulas: [
      { name: 'Value at Risk', formula: 'VaR_α = −inf{l : P(L>l) ≤ 1−α}',
        latex: '\\text{VaR}_\\alpha = -\\inf\\{l \\in \\mathbb{R} : P(L > l) \\leq 1-\\alpha\\}',
        desc: 'Loss quantile at confidence level α. Historical: empirical percentile of sorted P&L; Parametric normal: −μ + z_α·σ.' },
      { name: 'Expected Shortfall (CVaR)', formula: 'ES_α = E[−L | L ≤ VaR_α]',
        latex: '\\text{ES}_\\alpha = -E[L \\mid L \\leq \\text{VaR}_\\alpha] = \\dfrac{1}{1-\\alpha}\\int_\\alpha^1 \\text{VaR}_u\\,du',
        desc: 'Mean loss in the worst (1−α)% of scenarios. Coherent risk measure — sub-additive, unlike VaR.' },
      { name: 'Delta-VaR', formula: 'VaR_Δ = |Δ|·S·σ·√T·z_α',
        latex: '\\text{VaR}_\\Delta = |\\Delta|\\cdot S\\cdot\\sigma\\cdot\\sqrt{T}\\cdot z_\\alpha',
        desc: 'Linear (first-order) approximation of options book VaR using net portfolio delta and spot volatility.' },
      { name: 'Gamma-Adjusted VaR', formula: 'VaR_ΔΓ ≈ VaR_Δ + ½Γ(Sσ√T z_α)²',
        latex: '\\text{VaR}_{\\Delta\\Gamma} \\approx \\text{VaR}_\\Delta + \\tfrac{1}{2}\\Gamma\\cdot(S\\sigma\\sqrt{T}\\,z_\\alpha)^2',
        desc: 'Second-order Taylor expansion adds the convexity (gamma) term — essential for short-option portfolios.' },
      { name: 'Ledoit-Wolf Shrinkage', formula: 'Σ̂ = (1−α)S + αF',
        latex: '\\hat{\\Sigma} = (1-\\alpha)\\,S + \\alpha\\,F',
        desc: 'Convex combination of sample covariance S and structured target F. Minimises Frobenius-norm estimation error — critical for p≈T portfolios.' },
      { name: 'MST Distance', formula: 'd(i,j) = √(2(1−ρᵢⱼ))',
        latex: 'd(i,j) = \\sqrt{2(1-\\rho_{ij})}',
        desc: 'Correlation-derived ultrametric satisfying the triangle inequality. Edge weights for minimum spanning tree construction (Mantegna 1999).' },
    ],
  },

  {
    id: 'optimizer',
    icon: '🎛️',
    title: 'Capital Allocator & Strategy Optimizer',
    tagline: 'Efficient frontier for DeFi, Black–Litterman, risk parity, and Kelly sizing.',
    category: 'Optimization',
    accentColor: 'violet',
    complexity: 'Advanced',
    route: '/transact/optimizer',
    targetUsers: ['Portfolio Manager', 'Fund Manager', 'Quant Analyst'],
    userRoles: ['Portfolio Manager', 'Fund Manager', 'Quant Analyst', 'Research Analyst', 'Academic / Researcher', 'Student'],
    onboardingJourney: 'Workspace: how the agent allocates across chains, protocols, and strategies.',
    web3Focus: [
      'Optimises allocations using on-chain yields and funding rates ingested from the Data Universe.',
      'Supports Kelly-style sizing of DeFi strategies, not just traditional assets.',
      'Feeds target weights and constraints directly into the Yield & Agent execution pipeline.',
    ],
    registrationCTA: 'Register to let the agent run these optimisation frameworks on your real DeFi positions and preferred risk constraints.',
    overview: {
      headline: 'Five optimisation frameworks from classical MVO to Kelly growth criterion for DeFi portfolios',
      body: 'The Capital Allocator & Strategy Optimizer workspace provides five allocation methodologies, each solving a different objective under different market assumptions. MVO and Black-Litterman assume mean-variance preferences; Risk Parity and HRP target risk diversification; Kelly maximises long-run wealth growth. All frameworks share the same live asset data and covariance estimation pipeline and are used by the agent when proposing multi-chain yield allocations.',
      capabilities: [
        'MVO: efficient frontier, GMV, tangency portfolio via cvxpy',
        'Black-Litterman: posterior return integration with investor views',
        'Hierarchical Risk Parity (HRP): clustering-based diversification',
        'Equal Risk Contribution (ERC) and Relaxed Risk Parity (RRP)',
        'Kelly Criterion: single-asset fractional Kelly + multi-asset',
        'Efficient frontier visualisation with all five portfolios overlaid',
      ],
    },
    featureBreakdown: [
      { name: 'Mean-Variance Optimization (MVO)', desc: 'Solves min wᵀΣw s.t. wᵀμ ≥ R̄, Σw=1, w≥0 via cvxpy. Traces efficient frontier, identifies GMV (minimum variance) and tangency (max Sharpe) portfolios.', icon: '📐' },
      { name: 'Black-Litterman Model', desc: 'Blends market equilibrium returns π = δΣw_mkt with investor views Q using confidence matrix Ω. Posterior μ_BL = [(τΣ)⁻¹ + PᵀΩ⁻¹P]⁻¹[(τΣ)⁻¹π + PᵀΩ⁻¹Q] fed into MVO.', icon: '🔭' },
      { name: 'Hierarchical Risk Parity', desc: 'López de Prado (2016): cluster assets by correlation hierarchy (Ward linkage), then allocate via inverse-variance within and between clusters. Avoids covariance inversion entirely.', icon: '🌳' },
      { name: 'Risk Parity / ERC', desc: 'Equal Risk Contribution: solve for w such that each asset contributes equally to portfolio volatility MRC_i = w_i (Σw)_i / σ_p. Relaxed RP allows bounded deviation from ERC target.', icon: '⚖️' },
      { name: 'Kelly Criterion', desc: 'Maximises E[log(1+rₚ)] for long-run geometric wealth growth. Full-Kelly, half-Kelly, fractional variants. Multi-asset Kelly via quadratic approximation f = Σ⁻¹μ / max_i(μᵢ/σ²ᵢ).', icon: '📈' },
    ],
    significance: [
      { title: 'MVO: canonical institutional framework', body: 'Every institutional mandate references mean-variance optimality. CFA exams, risk budgeting frameworks, and factor allocation models are built on MVO foundations. Practitioners use it despite its well-known sensitivity to input estimation error.' },
      { title: 'Black-Litterman resolves MVO sensitivity', body: 'BL (1990) showed that combining market-implied equilibrium returns with investor views via Bayesian updating produces stable, investable portfolios. It is the industry standard at large asset managers for systematic active allocation.' },
      { title: 'HRP for estimation-error robustness', body: 'López de Prado proved HRP outperforms MVO out-of-sample when n is comparable to T. By avoiding matrix inversion, HRP eliminates the primary source of instability in classical MVO — making it the preferred method in machine learning finance.' },
      { title: 'Kelly for maximum long-run growth', body: 'The Kelly criterion maximises the expected logarithm of terminal wealth, which is equivalent to maximising long-run geometric growth rate. Broadly used by systematic macro funds and algorithmic traders as a position-sizing framework.' },
    ],
    formulas: [
      { name: 'MVO Objective', formula: 'min wᵀΣw  s.t.  wᵀμ≥R̄',
        latex: '\\min_{\\mathbf{w}}\\;\\mathbf{w}^\\top\\Sigma\\mathbf{w} \\quad \\text{s.t.}\\quad \\mathbf{w}^\\top\\boldsymbol{\\mu}\\geq\\bar{R},\\;\\mathbf{1}^\\top\\mathbf{w}=1,\\;\\mathbf{w}\\geq 0',
        desc: 'Quadratic programme on the mean-variance efficient frontier. Solved via cvxpy (OSQP solver).' },
      { name: 'Black-Litterman Posterior', formula: 'μ_BL = [(τΣ)⁻¹+PᵀΩ⁻¹P]⁻¹[(τΣ)⁻¹π+PᵀΩ⁻¹Q]',
        latex: '\\boldsymbol{\\mu}_{BL} = \\bigl[(\\tau\\Sigma)^{-1}+P^\\top\\Omega^{-1}P\\bigr]^{-1}\\bigl[(\\tau\\Sigma)^{-1}\\boldsymbol{\\pi}+P^\\top\\Omega^{-1}\\mathbf{Q}\\bigr]',
        desc: 'Precision-weighted Bayesian update blending market equilibrium prior π with investor views Q via confidence matrix Ω.' },
      { name: 'Equal Risk Contribution', formula: 'MRC_i = w_i(Σw)_i/σ_p = MRC_j',
        latex: '\\text{MRC}_i = \\dfrac{w_i(\\Sigma\\mathbf{w})_i}{\\sigma_p} = \\text{MRC}_j \\quad \\forall\\,i,j',
        desc: 'Solves for weights where every asset contributes equally to portfolio total volatility. Diversifies risk rather than capital.' },
      { name: 'Kelly Fraction', formula: 'f* = (μ−r)/σ² = SR/σ',
        latex: 'f^* = \\dfrac{\\mu - r}{\\sigma^2} = \\dfrac{\\text{SR}}{\\sigma}',
        desc: 'Optimal leverage maximising E[log W_T]. Half-Kelly (f*/2) reduces variance at the cost of ≈25% lower geometric growth.' },
    ],
  },

  {
    id: 'volatility',
    icon: '🔬',
    title: 'Vol & Funding Surface Lab',
    tagline: 'Perp funding, implied vol surfaces, and stochastic volatility calibration.',
    category: 'Volatility',
    accentColor: 'cyan',
    complexity: 'Advanced',
    route: '/transact/volatility',
    targetUsers: ['Derivatives Trader', 'Quant Analyst', 'Risk Manager'],
    userRoles: ['Derivatives Trader', 'Quant Analyst', 'Risk Manager', 'Research Analyst', 'Academic / Researcher', 'Student'],
    onboardingJourney: 'Workspace: how the agent understands funding, volatility, and risk premia on your DeFi positions.',
    web3Focus: [
      'Ingests perp funding rates and implied vols for on-chain assets.',
      'Computes volatility risk premia that inform yield vs. risk trade-offs.',
      'Feeds calibrated parameters back into the pricer and optimisation layers.',
    ],
    registrationCTA: 'Register so the agent can calibrate volatility and funding surfaces on the exact assets and venues you use on-chain.',
    overview: {
      headline: 'Full implied volatility and funding surface analysis with Heston calibration',
      body: 'The Vol & Funding Surface Lab provides a complete toolkit for implied and realised volatility analysis. Load any yfinance-listed ticker or DeFi underlying, view the live option chain, calibrate the Heston model via L-BFGS-B optimisation, compare historical realised vol against ATM implied vol (Volatility Risk Premium), and decompose total volatility into systematic and idiosyncratic components that inform the agent’s risk-adjusted yield decisions.',
      capabilities: [
        'Live yfinance option chain: IV per strike × expiry',
        'Heston model calibration via L-BFGS-B (minimises RMSE to market IVs)',
        'Implied vol surface heatmap + smile + term structure',
        'Historical realised vol (21d/63d rolling) vs ATM implied vol',
        'Volatility Risk Premium (VRP) = IV − realised vol bar chart',
        'Systematic vs idiosyncratic vol decomposition (OLS factor model)',
      ],
    },
    featureBreakdown: [
      { name: 'IV Surface Heatmap', desc: 'Strike × Expiry grid of implied volatilities from yfinance market prices. Colour-coded surface heatmap with smile cross-section (fixed expiry) and term structure (ATM across expiries).', icon: '🌡️' },
      { name: 'Heston Calibration', desc: 'L-BFGS-B calibration of 5 Heston parameters (κ, θ, ξ, ρ, v₀) to minimise RMSE between model and market implied vols. Auto-populates from live option chain. Shows RMSE, parameter table, and convergence.', icon: '🔧' },
      { name: 'Historical vs Implied Vol', desc: 'Rolling 21-day and 63-day realised volatility (√(252 × var(log-returns))) vs ATM implied vol from live chain. VRP bars show vol risk premium magnitude and direction.', icon: '📊' },
      { name: 'Vol Decomposition', desc: 'OLS regression of asset log-returns on benchmark (SPY default). Systematic vol = |β|·σ_mkt; Idiosyncratic vol = √(σ²_total − σ²_systematic). Donut chart visualisation.', icon: '🍩' },
    ],
    significance: [
      { title: 'Volatility surface arbitrage-free constraints', body: 'The implied vol surface encodes all market information about risk-neutral density. Arbitrage-free constraints (Gatheral 2006) — no calendar spread, butterfly arbitrage — must hold for any usable surface. Heston calibration enforces these by construction via a parametric model.' },
      { title: 'VRP as a risk premium signal', body: 'The Volatility Risk Premium (VRP = IV − realised vol) is systematically positive (on average 2-3 vol points in equities). This persistence makes VRP a tradeable risk premium — the basis for systematic short-vol strategies and variance swap pricing.' },
      { title: 'Idiosyncratic vol in factor investing', body: 'Decomposing volatility into systematic and idiosyncratic components (residual risk) allows portfolio managers to distinguish factor risk from stock-specific risk — critical for risk budgeting and factor-pure portfolio construction.' },
    ],
    formulas: [
      { name: 'Heston Characteristic Function', formula: 'φ(u,τ) = exp(iu·ln Fₜ + C(u,τ)θ + D(u,τ)v₀)',
        latex: '\\varphi(u,\\tau) = \\exp\\!\\left(iu\\ln F_t + C(u,\\tau)\\theta + D(u,\\tau)v_0\\right)',
        desc: 'Closed-form characteristic function of log-price under Heston dynamics. Inverted via FFT (Carr-Madan) to recover full option price surface.' },
      { name: 'Implied Vol (BS Newton)', formula: 'σ_IV ← σ − (C_BS(σ)−C_mkt)/ν_BS(σ)',
        latex: '\\sigma_{IV} \\leftarrow \\sigma - \\dfrac{C_{BS}(\\sigma) - C_{\\text{mkt}}}{\\nu_{BS}(\\sigma)}',
        desc: 'Newton-Raphson root-finding to invert the BS pricing formula for implied vol. Converges in ≤5 iterations from a warm start.' },
      { name: 'Realised Volatility', formula: 'σ̂_real = √(252·var(log-returns))',
        latex: '\\hat{\\sigma}_{\\text{real}} = \\sqrt{\\dfrac{252}{n}\\sum_{t=1}^n r_t^2}, \\quad r_t = \\ln\\dfrac{S_t}{S_{t-1}}',
        desc: 'Annualised close-to-close realised volatility from daily log-returns. Rolling 21-day and 63-day windows available.' },
      { name: 'Volatility Risk Premium', formula: 'VRP = IV_ATM − σ̂_real',
        latex: '\\text{VRP} = \\text{IV}_{ATM} - \\hat{\\sigma}_{\\text{real}}',
        desc: 'Difference between forward-looking ATM implied vol and backward-looking realised vol. Positive VRP compensates variance sellers.' },
    ],
  },

  {
    id: 'factor',
    icon: '🧬',
    title: 'On-Chain Signals & Edge Discovery',
    tagline: 'Factor regressions, DeFi smart beta, MEV crowding, and mempool PCA.',
    category: 'Factor Analysis',
    accentColor: 'amber',
    complexity: 'Advanced',
    route: '/transact/factor',
    targetUsers: ['Quant Analyst', 'Research Analyst', 'Fund Manager', 'Academic / Researcher'],
    userRoles: ['Quant Analyst', 'Research Analyst', 'Fund Manager', 'Academic / Researcher', 'Student', 'Portfolio Manager'],
    onboardingJourney: 'Workspace: how the agent discovers on-chain edges and factor premia to target.',
    web3Focus: [
      'Runs factor models and Fama–MacBeth regressions on DeFi returns and yields.',
      'Computes crowding and MEV crowding indexes for on-chain strategies.',
      'Provides signals that drive the agent’s opportunity queue and bundle selection.',
    ],
    registrationCTA: 'Register so the agent can align on-chain factor and crowding analytics with the assets, chains, and protocols relevant to your portfolio.',
    overview: {
      headline: 'Fama–MacBeth factor regression, on-chain smart beta, and crowding risk analytics',
      body: 'On-Chain Signals & Edge Discovery implements the full quantitative research pipeline: OLS factor model estimation, Fama–MacBeth two-stage cross-sectional regression for factor risk premium estimation, quintile smart beta sorts, signal-weighted factor portfolios, and a crowding/herding index to flag overcrowded factor or MEV trades — a leading indicator of factor crashes and degraded DeFi yield strategies.',
      capabilities: [
        'OLS factor model: α, β, R² per asset vs any factor set',
        'Fama-MacBeth two-stage regression: λ̂ risk premia, SE, t-stats, p-values',
        'Smart beta: quintile sort and signal-weighted factor portfolios',
        'Factor crowding index: herding signal for factor crash risk',
        'Multi-asset benchmark: SPY, QQQ, or custom benchmark',
        'Cross-sectional return dispersion diagnostics',
      ],
    },
    featureBreakdown: [
      { name: 'OLS Factor Model', desc: 'Regresses each asset\'s excess returns on factor returns (β₁F₁ + β₂F₂ + … + ε). Outputs α, factor loadings β_i, t-statistics, R², residual variance — across all assets simultaneously.', icon: '📐' },
      { name: 'Fama-MacBeth Regression', desc: 'Stage 1: cross-sectional OLS betas (time-series). Stage 2: regress cross-sectional returns on betas for each period t → λ̂_t. Final: λ̂ = T⁻¹ΣΛ̂_t with Newey-West SEs and t-stats for premium significance.', icon: '🔬' },
      { name: 'Smart Beta Portfolios', desc: 'Quintile sort: rank assets by factor signal, long top quintile, short bottom quintile. Signal-weighted: weights proportional to normalised factor signal. Both computed monthly with Sharpe evaluation.', icon: '📊' },
      { name: 'Factor Crowding Index', desc: 'Herding index: correlation between factor signal ranks and position size ranks. High crowding (>0.6) signals elevated crash risk — when funds simultaneously unwind, factor returns can reverse sharply.', icon: '🦠' },
    ],
    significance: [
      { title: 'CAPM and the factor zoo', body: 'Fama & French (1992, 1993) showed that size (SMB) and value (HML) factors explain most of the CAPM alpha. Since then, hundreds of "factors" have been documented — the factor zoo. Fama-MacBeth regression is the standard test for whether a factor carries a genuine risk premium.' },
      { title: 'Factor investing AUM explosion', body: 'Smart beta ETFs manage over $2 trillion globally. Understanding factor tilts, crowding risk, and regime dependence is essential for any practitioner managing or evaluating factor strategies.' },
      { title: 'Factor crowding and crash risk', body: 'When many investors load on the same factor simultaneously, unwinding is correlated. Quantifying crowding (Stein 2009, Khandani & Lo 2007) is increasingly demanded by risk committees as a leading indicator of drawdown risk.' },
    ],
    formulas: [
      { name: 'OLS Factor Model', formula: 'Rᵢₜ−Rƒ = αᵢ + Σₖ βᵢₖFₖₜ + εᵢₜ',
        latex: 'R_{it} - R_f = \\alpha_i + \\sum_k \\beta_{ik}\\,F_{kt} + \\varepsilon_{it}',
        desc: 'Time-series regression of excess returns on factor returns. OLS estimator: β̂ = (FᵀF)⁻¹Fᵀr.' },
      { name: 'Fama-MacBeth Stage 2', formula: 'λ̂ = (1/T)Σₜλ̂ₜ,  SE = σ(λ̂ₜ)/√T',
        latex: '\\hat{\\lambda} = \\dfrac{1}{T}\\sum_t \\hat{\\lambda}_t, \\qquad \\text{SE} = \\dfrac{\\sigma(\\hat{\\lambda}_t)}{\\sqrt{T}}',
        desc: 'Cross-sectional factor premium estimated as average of period-by-period lambdas. Newey-West SE corrects for autocorrelation.' },
      { name: 'Smart Beta (Signal-Weighted)', formula: 'wᵢ = sᵢ / Σⱼ|sⱼ|',
        latex: 'w_i = \\dfrac{s_i}{\\sum_j |s_j|}, \\qquad s_i = z\\text{-score}(\\text{signal}_i)',
        desc: 'Signal-proportional weights from cross-sectionally z-scored factor signals. Long when s>0, short when s<0.' },
      { name: 'Factor Crowding Index', formula: 'ρ_crowd = corr(rank(signal_i), rank(position_i))',
        latex: '\\rho_{\\text{crowd}} = \\text{corr}\\!\\left(\\text{rank}(\\text{signal}_i),\\,\\text{rank}(\\text{position}_i)\\right)',
        desc: 'Spearman rank correlation between factor signal ranks and fund position size ranks. Near 1 signals maximal herding and elevated crash risk.' },
    ],
  },

  {
    id: 'scenarios',
    icon: '🎯',
    title: 'Stress & MEV Scenario Simulator',
    tagline: 'Chain shocks, liquidation cascades, and multi-chain Monte Carlo paths.',
    category: 'Scenarios',
    accentColor: 'rose',
    complexity: 'Intermediate',
    route: '/transact/scenarios',
    targetUsers: ['Risk Manager', 'Portfolio Manager', 'Quant Analyst'],
    userRoles: ['Risk Manager', 'Portfolio Manager', 'Quant Analyst', 'Fund Manager', 'Academic / Researcher', 'Student'],
    onboardingJourney: 'Workspace: how the agent stress-tests your DeFi portfolio before pursuing aggressive yield.',
    web3Focus: [
      'Supports chain-level shocks, oracle spikes, and MEV-driven liquidation cascades.',
      'Runs Monte Carlo and behavioural scenarios on portfolios built from on-chain data.',
      'Feeds scenario-aware risk limits into the optimisation and execution layers.',
    ],
    registrationCTA: 'Register to let the agent run scenario and stress testing on your live DeFi positions, not just simulated portfolios.',
    overview: {
      headline: 'Multi-regime stress testing for DeFi: custom shocks, historical crises, behavioural, and Monte Carlo',
      body: 'The Stress & MEV Scenario Simulator allows practitioners to interrogate portfolio resilience under a wide variety of adverse on-chain scenarios. Define custom factor shocks (parallel shifts in equity, rates, FX), replay historical crisis episodes (GFC 2008, COVID-2020, Quant Melt 2007, Dot-com 2000), apply behavioural prospect-theory utility distortions, and run Monte Carlo simulations to derive full P&L distributions under normal and fat-tailed regimes — all of which the agent uses to bound yield-seeking behaviour.',
      capabilities: [
        'Custom scenarios: equity shock Δ, rate shock Δr, FX shock ΔFX',
        'Historical episodes: GFC, COVID, Dot-com, Quant Melt, Flash Crash',
        'Probabilistic portfolio optimization under scenario constraints',
        'Monte Carlo: normal and Student-t (ν=3) P&L distribution, 10,000 paths',
        'Behavioural: prospect-theory utility with loss aversion λ, probability weighting',
        'Herding-adjusted VaR: crowding effect amplifies tail risk',
      ],
    },
    featureBreakdown: [
      { name: 'Custom Stress Scenarios', desc: 'Define up to 6 simultaneous factor shocks: equity level (±%), interest rate (±bps), FX (±%), credit spread (±bps), commodity (±%). Applies shocks to portfolio P&L using pre-estimated factor sensitivities.', icon: '⚡' },
      { name: 'Historical Crisis Replay', desc: 'Pre-loaded episodes: GFC 2008 (−54% equity, +300bps credit), COVID-2020 (−34% in 33 days), Quant Melt Aug 2007, Dot-com bust 2000−2002, Flash Crash 2010. Shows portfolio P&L relative to historical benchmarks.', icon: '📜' },
      { name: 'Probabilistic Optimization', desc: 'Maximise expected utility under scenario-probability weighting. Allocates more defensively when high-severity scenarios have elevated probability. Outputs scenario-conditional weights and Sharpe decomposition.', icon: '🎲' },
      { name: 'Monte Carlo Simulation', desc: '10,000 portfolio P&L paths with configurable distribution (normal / Student-t ν=3). Histogram, 5th/50th/95th percentile, VaR and ES extracted directly from empirical distribution.', icon: '📉' },
      { name: 'Behavioural Scenarios', desc: 'Prospect theory utility: U(x) = x^α for x≥0, −λ(−x)^α for x<0 (Kahneman-Tversky 1979). Loss aversion λ=2.25 default. Herding VaR amplifies standard VaR by a crowding factor.', icon: '🧠' },
    ],
    significance: [
      { title: 'Stress testing as regulatory requirement', body: 'Basel III DFAST (US) and EBA stress testing (EU) mandate scenario-based capital adequacy assessments annually for systemic institutions. IFRS 9 requires forward-looking "multiple economic scenarios" for Expected Credit Loss computation.' },
      { title: 'Historical scenario validity', body: 'Market crises tend to exhibit non-linearity and correlation breakdown. Historical simulation reuses actual joint-return distributions from crisis periods — capturing fat tails, correlation spikes, and liquidity effects that parametric models systematically underestimate.' },
      { title: 'Behavioural bias in risk management', body: 'Loss aversion (Kahneman-Tversky 1979) causes systematic underweighting of tail risks in portfolio construction. Prospect theory utility quantifies this distortion, enabling advisors to design portfolios aligned with actual client risk preferences.' },
    ],
    formulas: [
      { name: 'Prospect Theory Utility', formula: 'U(x) = xᵅ if x≥0; −λ(−x)ᵅ if x<0',
        latex: 'U(x) = \\begin{cases} x^\\alpha & x \\geq 0 \\\\ -\\lambda(-x)^\\alpha & x < 0 \\end{cases}, \\quad \\alpha=0.88,\\;\\lambda=2.25',
        desc: 'Kahneman-Tversky (1979). Loss aversion λ=2.25 means losses hurt 2.25× more than equivalent gains. Reference point is current wealth.' },
      { name: 'Monte Carlo Portfolio P&L', formula: 'rₚ = wᵀr,  r∼N(μ,Σ) or t(ν,μ,Σ)',
        latex: 'r_p = \\mathbf{w}^\\top\\mathbf{r}, \\quad \\mathbf{r}\\sim\\mathcal{N}(\\boldsymbol{\\mu},\\Sigma)\\;\\text{or}\\;t(\\nu,\\boldsymbol{\\mu},\\Sigma)',
        desc: 'Sample 10,000 joint return realisations, compute portfolio return, extract empirical quantiles for VaR and ES.' },
      { name: 'Herding-Adjusted VaR', formula: 'VaR_herd = VaR_std·(1+ρ_crowd·k)',
        latex: '\\text{VaR}_{\\text{herd}} = \\text{VaR}_{\\text{std}}\\cdot(1+\\rho_{\\text{crowd}}\\cdot k)',
        desc: 'Amplifies standard VaR by a crowding term. ρ_crowd is the herding index; k is a calibrated scaling constant for correlated liquidation impact.' },
      { name: 'Probabilistic Scenario Optimisation', formula: 'max Σₛ pₛ·U(wᵀrₛ)  s.t. Σw=1, w≥0',
        latex: '\\max_{\\mathbf{w}}\\;\\sum_s p_s\\,U(\\mathbf{w}^\\top\\mathbf{r}_s) \\quad \\text{s.t.}\\;\\mathbf{1}^\\top\\mathbf{w}=1,\\;\\mathbf{w}\\geq 0',
        desc: 'Scenario-probability weighted utility maximisation. Allocates defensively when adverse scenarios carry elevated probability weights.' },
    ],
  },

  {
    id: 'blotter',
    icon: '📋',
    title: 'Positions & Activity',
    tagline: 'Opportunity queue, P&L + MEV attribution, and on-chain transaction audit.',
    category: 'Execution',
    accentColor: 'slate',
    complexity: 'Basic',
    route: '/transact/blotter',
    targetUsers: ['Derivatives Trader', 'Portfolio Manager', 'Fund Manager'],
    userRoles: ['Derivatives Trader', 'Portfolio Manager', 'Fund Manager', 'Quant Analyst', 'Student'],
    onboardingJourney: 'Workspace: how the agent tracks live positions, P&L, and MEV impact after execution.',
    web3Focus: [
      'Reads gateway /v2/activity for on-chain transaction audit and explorer links.',
      'Tracks realised and unrealised P&L, including MEV-aware attribution.',
      'Provides feedback loops so the agent can learn from past execution quality.',
    ],
    registrationCTA: 'Register so the agent can track P&L, MEV impact, and activity on your real wallets instead of a demo blotter.',
    overview: {
      headline: 'Full trade lifecycle: opportunity queue, positions, P&L, and MEV-aware performance attribution',
      body: 'The Positions & Activity workspace closes the loop between analytical outputs, agent decisions, and on-chain reality. Enter trades and bundles across any asset class, monitor real-time positions and cumulative P&L, and decompose returns into CAPM alpha, beta exposure, factor attribution, and idiosyncratic residual — augmented with MEV-aware attribution and a full on-chain transaction audit via the gateway /v2 activity surface.',
      capabilities: [
        'Trade entry: symbol, side (buy/sell), quantity, price, asset class',
        'Real-time position monitoring: net position, average cost, unrealised P&L',
        'Cumulative P&L tracking with chart',
        'Performance attribution: CAPM alpha, beta return, factor, residual',
        'Transaction history with filter and export',
        'Commission and slippage tracking',
      ],
    },
    featureBreakdown: [
      { name: 'Trade Entry Form', desc: 'Enter any trade: symbol, buy/sell, quantity, price, asset class (equity/option/ETF/crypto). Validates against live price. Timestamps all entries.', icon: '✏️' },
      { name: 'Position Monitor', desc: 'Aggregates all trades into net positions per symbol. Shows average entry cost, current market price (live yfinance), unrealised P&L, and % return per position.', icon: '📡' },
      { name: 'Cumulative P&L', desc: 'Time-series P&L chart across all positions. Mark-to-market daily. Realised + unrealised breakdown. Waterfall view for win/loss contribution per trade.', icon: '📈' },
      { name: 'Performance Attribution', desc: 'Brinson-BHB attribution: CAPM α (skill), β·(Rₘ−Rƒ) (market exposure), factor returns (sector, size, value), residual. Quantifies how much return came from alpha vs market beta.', icon: '🔍' },
    ],
    significance: [
      { title: 'Trade attribution for fund accountability', body: 'GIPS (Global Investment Performance Standards) require performance attribution for institutional funds. Decomposing returns into alpha vs beta vs factor exposure is the primary tool for demonstrating genuine active management skill.' },
      { title: 'Execution analytics reduce trading costs', body: 'Post-trade analytics on slippage, timing, and venue selection can reduce implementation shortfall by 20-50% annually for active managers. The blotter is the data source for all execution quality analysis.' },
    ],
    formulas: [
      { name: 'Unrealised P&L', formula: 'P&L = (P_current−P_entry) × Q × Mult',
        latex: '\\text{P\\&L} = (P_{\\text{current}} - P_{\\text{entry}}) \\times Q \\times \\text{Multiplier}',
        desc: 'Mark-to-market using live yfinance price vs weighted average entry cost.' },
      { name: 'CAPM Attribution', formula: 'Rₚ = αⱼ + βₚ(Rₘ−Rƒ) + εₚ',
        latex: 'R_p = \\alpha_J + \\beta_p(R_m - R_f) + \\varepsilon_p',
        desc: "Jensen's alpha αⱼ is the excess return unexplained by market beta exposure — the measure of active skill." },
    ],
  },
  {
    id: 'universe',
    icon: '🪐',
    title: 'Data Universe',
    tagline: 'Multi-chain tokens, prices, and positions for the yield agent and workspaces.',
    category: 'Scenarios',
    accentColor: 'cyan',
    complexity: 'Basic',
    route: '/transact/universe',
    targetUsers: ['Portfolio Manager', 'Quant Analyst', 'Fintech Developer'],
    userRoles: ['Portfolio Manager', 'Quant Analyst', 'Research Analyst', 'Fintech Developer', 'Academic / Researcher', 'Student'],
    onboardingJourney: 'Workspace: where the agent and workspaces ingest multi-chain on-chain data.',
    web3Focus: [
      'Backed by gateway /v2/chains and /v2/universe/snapshot for dynamic chain and asset discovery.',
      'Provides a single view of tokens, prices, and optional positions across chains.',
      'Feeds all other workspaces and the Yield & Agent loop with consistent data.',
    ],
    registrationCTA: 'Register and connect a wallet so the Data Universe can include your live positions alongside reference market data.',
    overview: {
      headline: 'Dynamic Data Universe for multi-chain tokens, prices, and positions',
      body: 'The Data Universe workspace sits on top of the gateway’s Web3-native /v2 surface. It calls /v2/chains and /v2/universe/snapshot to discover supported chains, ingest token universes, pull oracle-quality prices, and optionally include user positions. This unified Data Universe is the foundation for the Dynamic Yield Optimization Agent and every quant workspace in the platform.',
      capabilities: [
        'Dynamic chain discovery via /v2/chains (EVM and non-EVM where configured)',
        'Token and price ingestion via /v2/universe/snapshot with configurable chain and asset filters',
        'Optional inclusion of wallet positions when a wallet or agent id is provided',
        'Single source of truth for downstream workspaces (risk, optimizer, scenarios, factor lab)',
      ],
    },
    featureBreakdown: [
      { name: 'Chain Registry', desc: 'Uses /v2/chains to list supported chains, their ids, and configuration status so that both the agent and UI can present only viable deployment targets.', icon: '🧭' },
      { name: 'Token & Price Snapshot', desc: 'Calls /v2/universe/snapshot with chain and asset filters to build a canonical view of the token universe and reference prices used for P&L, risk, and optimisation.', icon: '🪙' },
      { name: 'Positions Overlay', desc: 'When a wallet or agent id is available, extends the snapshot with positions so that risk, optimiser, and scenarios work on a live holdings view.', icon: '📈' },
      { name: 'Agent & Workspace Bridge', desc: 'Provides a shared data layer for the Dynamic Yield Optimization Agent, OpenClaw tools, and frontend workspaces so that all components agree on inputs.', icon: '🧬' },
    ],
    significance: [
      { title: 'Single source of truth for multi-chain data', body: 'Without a unified data layer, yield agents and analytics drift apart. The Data Universe ensures that every optimisation, risk calculation, and scenario uses the same token and price inputs.' },
      { title: 'Bridging off-chain and on-chain views', body: 'By combining off-chain price feeds, on-chain positions, and chain metadata, the Data Universe lets traditional quant models operate directly on DeFi portfolios.' },
    ],
    formulas: [
      { name: 'Portfolio Market Value', formula: 'V = Σᵢ qᵢ · Pᵢ', latex: 'V = \\sum_i q_i P_i', desc: 'Computes market value across chains using quantities qᵢ and Data-Universe prices Pᵢ for each asset.' },
    ],
  },
  {
    id: 'defi',
    icon: '🌾',
    title: 'Yield & Agent',
    tagline: 'Dynamic Yield Optimization Agent for multi-chain DeFi portfolios.',
    category: 'Execution',
    accentColor: 'emerald',
    complexity: 'Intermediate',
    route: '/transact/defi',
    targetUsers: ['Portfolio Manager', 'Risk Manager', 'Fund Manager'],
    userRoles: ['Portfolio Manager', 'Fund Manager', 'Risk Manager', 'Quant Analyst', 'Fintech Developer', 'Academic / Researcher', 'Student'],
    onboardingJourney: 'Workspace: the main control surface for the Dynamic Yield Optimization Agent.',
    web3Focus: [
      'Non-custodial wallet integration via Tether WDK (Sign-In with Wallet, read-only portfolios, signed-tx broadcast).',
      'Uses the Data Universe, risk, optimiser, and scenarios workspaces as tools when building yield plans.',
      'Executes via gateway /v2/protect/submit, /v2/submit/bundle, and tracks activity through /v2/activity.',
    ],
    registrationCTA: 'Register and connect a wallet to allow the agent to monitor your on-chain positions, propose optimised yield plans, and execute via MEV-aware routes while you stay in control of signatures.',
    overview: {
      headline: 'Dynamic Yield Optimization Agent for multi-chain DeFi portfolios',
      body: 'The Yield & Agent workspace is the front-door to the Dynamic Yield Optimization Agent. It connects to your wallet via the Tether Wallet Development Kit (WDK), ingests holdings through the Data Universe and /v2/positions, calls into optimisation, risk, factor, volatility, and scenario workspaces, and then proposes and executes non-custodial yield strategies across chains. You approve every step — the agent orchestrates analysis and transaction building.',
      capabilities: [
        'Wallet connection and portfolio ingestion via Tether WDK and /v2/positions',
        'End-to-end agent flow: get portfolio → run optimisation → review plan → execute',
        'MEV-aware execution using /v2/protect/submit and Flashbots-style bundle submit',
        'Agent autonomy toggle and audit trail via /v2/agent/toggle and /v2/activity',
      ],
    },
    featureBreakdown: [
      { name: 'Wallet & Chain Portfolio', desc: 'Connects one or more wallets, discovers supported chains via /v2/chains, and loads your on-chain positions and yields as the starting point for optimisation.', icon: '👛' },
      { name: 'Agent-Guided Optimisation', desc: 'Calls the optimisation, risk, volatility, factor, and scenarios workspaces behind the scenes to construct yield strategies aligned with your risk preferences.', icon: '🤖' },
      { name: 'Non-Custodial Execution', desc: 'Builds and signs transactions client-side via WDK or your wallet, then broadcasts through gateway endpoints, optionally using MEV-protected relays.', icon: '🔐' },
      { name: 'Audit & Control', desc: 'Shows every step the agent takes — inputs, recommendations, and executed transactions — with links to explorers and the Positions & Activity workspace.', icon: '📜' },
    ],
    significance: [
      { title: 'From tools to autonomous DeFi portfolio management', body: 'Quant workspaces and APIs are powerful, but most users need automated guidance. The Dynamic Yield Optimization Agent composes all underlying analytics into a continuous multi-chain yield strategy while preserving user control over keys.' },
      { title: 'Bridging institutional quant and on-chain execution', body: 'By combining portfolio theory, risk management, volatility modelling, and factor research with Web3-native infrastructure, the agent brings institutional-grade discipline to DeFi yield farming.' },
    ],
    formulas: [
      { name: 'Risk-Adjusted Yield Objective', formula: 'maximize E[Y] − λ·Risk', latex: '\\max\\;E[Y] - \\lambda\\,\\text{Risk}', desc: 'Abstract objective the agent optimises, combining expected yield with a tunable risk penalty informed by VaR/ES and scenario analytics.' },
    ],
  },
];

/** Helper: look up a menu item by id */
export const getMenuItem = (id: string): MenuItem | undefined =>
  MENU_ITEMS.find(m => m.id === id);

/** All unique user roles across all items (for filters) */
export const ALL_USER_ROLES: UserRole[] = [
  'Portfolio Manager', 'Quant Analyst', 'Risk Manager', 'Derivatives Trader',
  'Research Analyst', 'Academic / Researcher', 'Student', 'Fintech Developer', 'Fund Manager',
];

/** Registration form roles (subdivided for strategic segmentation) */
export const REGISTRATION_ROLES = [
  'Portfolio Manager',
  'Quantitative Analyst',
  'Quantitative Developer',
  'Risk Manager',
  'Derivatives Trader / Structurer',
  'Research Analyst',
  'Fund Manager / CIO',
  'Academic Researcher',
  'Masters / PhD Student',
  'CFA / FRM Candidate',
  'Fintech Developer',
  'Other',
] as const;
