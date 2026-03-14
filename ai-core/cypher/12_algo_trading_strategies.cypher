// ============================================================
// 12_algo_trading_strategies.cypher
// Algorithmic trading strategies from PDF master sources.
// Source: Chan (Quantitative Trading), Tulchinsky (Finding Alphas),
//         Halls-Moore (Successful Algorithmic Trading),
//         Nison (Candlestick), O'Neil (CANSLIM), Taleb (Black Swan)
// ============================================================

// ── TRADING STRATEGY NODE TYPE ────────────────────────────────

MERGE (ts:TradingStrategy {name: 'Momentum'})
SET ts.description = 'Buy recent winners, sell recent losers. Jegadeesh & Titman (1993): stocks with high 3-12 month past returns continue to outperform for 3-12 months. Signal: cross-sectional rank of trailing returns. Risk: momentum crashes (sudden reversal in high-vol regimes). DeFi equivalent: token price momentum + funding rate momentum.',
    ts.category = 'trend_following',
    ts.time_horizon = 'medium_term',
    ts.signal_type = 'price_based',
    ts.typical_holding = '1_week_to_3_months',
    ts.risk_profile = 'crash_risk_in_reversals',
    ts.defi_analogy = 'Protocol TVL momentum;token price momentum;funding rate trend',
    ts.source_ids = 'chan_quant_trading;tulchinsky_finding_alphas;m6_factor_anomalies';
MATCH (ts:TradingStrategy {name: 'Momentum'}), (m:Menu {name: 'Algorithmic Trading'})
MERGE (ts)-[:BELONGS_TO]->(m);

MERGE (ts:TradingStrategy {name: 'Mean Reversion'})
SET ts.description = 'Assets that deviate from fair value revert to mean. Time-series: ADF/Hurst exponent test for stationarity. Pairs trading: cointegrated pairs diverge → short the outperformer, long the underperformer. Ornstein-Uhlenbeck process models mean reversion speed. Chan: "The half-life of mean reversion governs trade duration." DeFi: stablecoin depeg arbitrage, funding rate mean reversion.',
    ts.category = 'mean_reversion',
    ts.time_horizon = 'short_to_medium_term',
    ts.signal_type = 'statistical_arbitrage',
    ts.typical_holding = '1_day_to_2_weeks',
    ts.risk_profile = 'trend_risk;correlation_breakdown',
    ts.math_model = 'Ornstein-Uhlenbeck: dX = κ(θ-X)dt + σdW',
    ts.defi_analogy = 'Stablecoin depeg arb;AMM pool imbalance reversion;funding rate reversion',
    ts.source_ids = 'chan_quant_trading;successful_algo_trading';
MATCH (ts:TradingStrategy {name: 'Mean Reversion'}), (m:Menu {name: 'Algorithmic Trading'})
MERGE (ts)-[:BELONGS_TO]->(m);

MERGE (ts:TradingStrategy {name: 'Statistical Arbitrage'})
SET ts.description = 'Exploit statistical mispricing between related assets. Pairs trading, index arbitrage, ETF arbitrage. Requires: cointegration test (Engle-Granger), spread z-score, entry/exit thresholds. Risk: spread divergence (widening not converging). Leverage amplifies both profits and losses. DeFi: cross-DEX price discrepancies, basis trading (spot vs perp).',
    ts.category = 'arbitrage',
    ts.time_horizon = 'short_term',
    ts.signal_type = 'spread_based',
    ts.typical_holding = 'intraday_to_1_week',
    ts.risk_profile = 'divergence_risk;leverage_risk;correlation_instability',
    ts.math_model = 'Spread z-score: z = (S - μ_S) / σ_S; trade at |z| > 2, exit at z → 0',
    ts.defi_analogy = 'Cross-DEX arbitrage;basis trading;AMM vs CEX price arb',
    ts.source_ids = 'chan_quant_trading;math_arbitrage;successful_algo_trading';
MATCH (ts:TradingStrategy {name: 'Statistical Arbitrage'}), (m:Menu {name: 'Algorithmic Trading'})
MERGE (ts)-[:BELONGS_TO]->(m);

MERGE (ts:TradingStrategy {name: 'Cross-DEX Arbitrage'})
SET ts.description = 'Profit from price differences of the same token pair across DEXs. E.g., ETH/USDC price on Uniswap V3 ≠ Curve. Atomic: flash loan asset from Aave → buy on cheaper DEX → sell on expensive DEX → repay flash loan, pocket spread. Gas cost + slippage must be < spread. Competitive: other bots do same, spread often <0.1% after gas.',
    ts.category = 'defi_arbitrage',
    ts.time_horizon = 'intraday_block_level',
    ts.signal_type = 'price_discrepancy',
    ts.typical_holding = 'single_transaction',
    ts.risk_profile = 'gas_cost_risk;competition_risk;slippage_risk',
    ts.math_model = 'Profit = (P_sell - P_buy) × amount - gas_cost - flash_loan_fee',
    ts.defi_analogy = 'AMM cross-protocol price arbitrage',
    ts.source_ids = 'harvey_defi_future;math_arbitrage;coingecko_how_to_defi_advanced';
MATCH (ts:TradingStrategy {name: 'Cross-DEX Arbitrage'}), (m:Menu {name: 'MEV'})
MERGE (ts)-[:BELONGS_TO]->(m);

MERGE (ts:TradingStrategy {name: 'Delta-Neutral Yield'})
SET ts.description = 'Harvest funding rate or liquidity mining yield while hedging directional price risk. Construction: (1) Long spot asset X; (2) Short equivalent notional of X perpetual futures. Net delta ≈ 0. Yield = positive funding rate (when perp premium) + LP fees. Risk: funding rate flips negative; LP impermanent loss; liquidation on short leg. Optimal when funding rate > borrowing cost + IL.',
    ts.category = 'yield_strategies',
    ts.time_horizon = 'medium_term',
    ts.signal_type = 'funding_rate_carry',
    ts.typical_holding = 'days_to_weeks',
    ts.risk_profile = 'funding_flip_risk;IL_risk;liquidation_risk',
    ts.math_model = 'Net yield = funding_rate_annualized - IL_rate - borrowing_cost',
    ts.defi_analogy = 'Cash-and-carry in DeFi perp markets',
    ts.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced;taleb_dynamic_hedging';
MATCH (ts:TradingStrategy {name: 'Delta-Neutral Yield'}), (m:Menu {name: 'Yield Strategies'})
MERGE (ts)-[:BELONGS_TO]->(m);

MERGE (ts:TradingStrategy {name: 'Trend Following'})
SET ts.description = 'Follow price trends using moving averages, breakouts, or momentum indicators. Simple: MA crossover (50/200 day). Advanced: Dual Momentum (Antonacci) — absolute + relative momentum. Performs well in trending markets; suffers in choppy/mean-reverting markets (whipsaws). Convex payoff profile: loses small in ranging, profits large in trending. Complementary to value/mean-reversion strategies.',
    ts.category = 'trend_following',
    ts.time_horizon = 'medium_to_long_term',
    ts.signal_type = 'price_based',
    ts.typical_holding = 'weeks_to_months',
    ts.risk_profile = 'whipsaw_risk;drawdown_in_ranging',
    ts.math_model = 'Signal = sign(r_t,t-L) where L = lookback period',
    ts.defi_analogy = 'On-chain TVL trend;protocol revenue trend;token price breakout',
    ts.source_ids = 'chan_quant_trading;successful_algo_trading;taleb_dynamic_hedging';
MATCH (ts:TradingStrategy {name: 'Trend Following'}), (m:Menu {name: 'Algorithmic Trading'})
MERGE (ts)-[:BELONGS_TO]->(m);

MERGE (ts:TradingStrategy {name: 'Quantitative Value'})
SET ts.description = 'Screen and rank assets by valuation metrics. TradFi: P/E, P/B, EV/EBITDA, free cash flow yield. DeFi equivalents: Price/TVL ratio, Price/Revenue, P/E via protocol fees, fully diluted valuation (FDV) vs realized TVL. Fama-French HML factor: buy low B/M (value), sell high B/M (growth). DeFi metrics sourced from on-chain data (Dune Analytics, DefiLlama).',
    ts.category = 'value_investing',
    ts.time_horizon = 'long_term',
    ts.signal_type = 'fundamental',
    ts.typical_holding = 'months_to_years',
    ts.risk_profile = 'value_trap;crowding;factor_drawdown',
    ts.math_model = 'Value score = rank(P/TVL) + rank(P/Revenue) + rank(FDV/TVL)',
    ts.defi_analogy = 'Protocol P/TVL;token P/Revenue;FDV/TVL ratio',
    ts.source_ids = 'tulchinsky_finding_alphas;m6_factor_anomalies;m2_factor_models';
MATCH (ts:TradingStrategy {name: 'Quantitative Value'}), (m:Menu {name: 'Alpha Research'})
MERGE (ts)-[:BELONGS_TO]->(m);

MERGE (ts:TradingStrategy {name: 'Candlestick Pattern Trading'})
SET ts.description = 'Technical analysis using Japanese candlestick patterns (Nison, 1991). Reversal patterns: Doji (indecision), Hammer (bullish reversal after downtrend), Engulfing (strong reversal), Morning Star (3-candle bullish). Continuation: Rising Three Methods. Effectiveness improved by combining with volume and support/resistance levels. DeFi: applicable to on-chain OHLCV data from DEXs.',
    ts.category = 'technical_analysis',
    ts.time_horizon = 'short_to_medium_term',
    ts.signal_type = 'price_pattern',
    ts.typical_holding = 'days_to_weeks',
    ts.risk_profile = 'signal_noise;low_win_rate_without_filters',
    ts.defi_analogy = 'On-chain OHLCV from DEX data;token chart patterns',
    ts.source_ids = 'nison_candlestick';
MATCH (ts:TradingStrategy {name: 'Candlestick Pattern Trading'}), (m:Menu {name: 'Algorithmic Trading'})
MERGE (ts)-[:BELONGS_TO]->(m);

MERGE (ts:TradingStrategy {name: 'Alpha Signal Construction'})
SET ts.description = 'Tulchinsky/WorldQuant framework: Alpha = f(data). Key attributes: (1) Predictive power (IC > 0.05); (2) Turnover (daily to weekly); (3) Capacity ($10M+); (4) Decay (half-life of predictability); (5) Neutralization (industry/market cap). Alpha combination: optimize weight vector on Sharpe ratio. DeFi alphas: on-chain data (gas usage, active addresses, DEX volume, TVL changes, protocol revenue).',
    ts.category = 'alpha_research',
    ts.time_horizon = 'varies',
    ts.signal_type = 'composite',
    ts.typical_holding = 'varies',
    ts.risk_profile = 'overfitting;alpha_decay;crowding',
    ts.math_model = 'IC = corr(alpha_signal_t, forward_return_t+h)',
    ts.defi_analogy = 'On-chain alpha signals from DEX/lending/governance data',
    ts.source_ids = 'tulchinsky_finding_alphas';
MATCH (ts:TradingStrategy {name: 'Alpha Signal Construction'}), (m:Menu {name: 'Alpha Research'})
MERGE (ts)-[:BELONGS_TO]->(m);

MERGE (ts:TradingStrategy {name: 'Machine Learning Alpha'})
SET ts.description = 'ML for return prediction: (1) Random Forests / Gradient Boosting (XGBoost, LightGBM) — best tabular performance; (2) LSTM / Transformer — time series; (3) Graph Neural Networks — relational data (DeFi protocol graph). Gu, Kelly, Xiu (2020): GBM outperforms linear models for US equity cross-section. DeFi: predict LP fee APR, liquidation probability, protocol TVL next 7 days.',
    ts.category = 'ml_based',
    ts.time_horizon = 'varies',
    ts.signal_type = 'ml_prediction',
    ts.risk_profile = 'overfitting;regime_change;feature_instability;data_leakage',
    ts.math_model = 'E[r_t+h | X_t] = f_ML(X_t) where X_t = on-chain features',
    ts.defi_analogy = 'Predict LP APY;predict liquidation cascades;protocol TVL forecasting',
    ts.source_ids = 'm6_empirical_ml;m6_neural_factor;finance_ai_blockchain;tulchinsky_finding_alphas';
MATCH (ts:TradingStrategy {name: 'Machine Learning Alpha'}), (m:Menu {name: 'Alpha Research'})
MERGE (ts)-[:BELONGS_TO]->(m);

MERGE (ts:TradingStrategy {name: 'Liquidity Provision Optimization'})
SET ts.description = 'Optimal LP strategy for Uniswap V3 concentrated liquidity: choose [Pa, Pb] range to maximize fee APR vs IL exposure. Narrow range: higher capital efficiency + fees, but range exits more frequently requiring rebalancing. Wide range: lower fees but less IL. Optimal width = f(realized volatility, rebalancing cost, fee tier). Active management strategies: JIT liquidity, dynamic range adjustment, hedging IL with options.',
    ts.category = 'defi_yield',
    ts.time_horizon = 'continuous',
    ts.signal_type = 'volatility_based',
    ts.risk_profile = 'IL_risk;gas_cost_rebalancing;out_of_range_loss',
    ts.math_model = 'Net APY = fee_APY × (1 - IL_rate) - rebalancing_gas_cost',
    ts.defi_analogy = 'Core QuantiNova yield optimization strategy',
    ts.source_ids = 'coingecko_how_to_defi_advanced;harvey_defi_future;m5_kelly_criterion';
MATCH (ts:TradingStrategy {name: 'Liquidity Provision Optimization'}), (m:Menu {name: 'Yield Strategies'})
MERGE (ts)-[:BELONGS_TO]->(m);

MERGE (ts:TradingStrategy {name: 'CANSLIM Growth'})
SET ts.description = 'O\'Neil growth stock selection framework: C=Current earnings (>25% QoQ), A=Annual earnings (>25% YoY 3yr), N=New product/service/high, S=Supply (shares outstanding <25M preferred), L=Leader in sector, I=Institutional sponsorship, M=Market direction (uptrend). DeFi adaptation: C=protocol revenue growth, A=TVL CAGR, N=new feature launch, L=protocol market share.',
    ts.category = 'growth_momentum',
    ts.time_horizon = 'medium_to_long_term',
    ts.signal_type = 'fundamental_technical',
    ts.risk_profile = 'concentration_risk;growth_stock_premium',
    ts.defi_analogy = 'Protocol revenue growth;new feature catalysts;TVL leadership',
    ts.source_ids = 'oneil_how_to_stocks';
MATCH (ts:TradingStrategy {name: 'CANSLIM Growth'}), (m:Menu {name: 'Alpha Research'})
MERGE (ts)-[:BELONGS_TO]->(m);

// ── STRATEGY INDEXES ──────────────────────────────────────────
CREATE INDEX trading_strategy_name IF NOT EXISTS FOR (ts:TradingStrategy) ON (ts.name);
CREATE INDEX trading_strategy_category IF NOT EXISTS FOR (ts:TradingStrategy) ON (ts.category);
