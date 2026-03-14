// ═══════════════════════════════════════════════════════════════════════════
// 06_trading_strategies.cypher
// Trading strategy knowledge graph — sourced from:
//   • Ernest Chan — Quantitative Trading (Wiley 2009)
//   • Igor Tulchinsky et al. — Finding Alphas (Wiley 2020)
//   • John C. Hull — Options, Futures and Other Derivatives
//   • Successful Algorithmic Trading (AAT)
//   • Martin Baxter & Andrew Rennie — Financial Calculus (Cambridge 2012)
//   • Steve Nison — Japanese Candlestick Charting Techniques
//   • William J. O'Neil — How To Make Money In Stocks
//   • Springer — Financial Mathematics, Derivatives and Structured Products
//   • Springer — Actuarial Sciences and Quantitative Finance (ICASQF2016)
//   • Valuation and Volatility: Stakeholder's Perspective
//
// Run AFTER 01_menus.cypher, 02_concepts.cypher.
// ═══════════════════════════════════════════════════════════════════════════

// ── Constraints (idempotent) ─────────────────────────────────────────────────

CREATE CONSTRAINT trading_strategy_name IF NOT EXISTS
  FOR (s:TradingStrategy) REQUIRE s.name IS UNIQUE;

CREATE CONSTRAINT knowledge_source_title IF NOT EXISTS
  FOR (k:KnowledgeSource) REQUIRE k.title IS UNIQUE;

// ── KnowledgeSource nodes (one per reference book) ───────────────────────────

MERGE (ks:KnowledgeSource {title: 'Quantitative Trading'})
SET ks.author = 'Ernest P. Chan',
    ks.publisher = 'John Wiley & Sons',
    ks.year = 2009,
    ks.category = 'algorithmic_trading',
    ks.file_name = '(Wiley trading series) Ernest P Chan - Quantitative trading.pdf',
    ks.description = 'Practical guide to building an algorithmic trading business: strategy development, backtesting, execution, risk management.';

MERGE (ks:KnowledgeSource {title: 'Finding Alphas'})
SET ks.author = 'Igor Tulchinsky et al.',
    ks.publisher = 'Wiley',
    ks.year = 2020,
    ks.category = 'alpha_research',
    ks.file_name = 'Igor Tulchinsky et al. - Finding Alphas.pdf',
    ks.description = 'Quantitative approach to constructing, testing, and deploying trading alphas with IC, decay, and crowding analysis.';

MERGE (ks:KnowledgeSource {title: 'Options, Futures and Other Derivatives'})
SET ks.author = 'John C. Hull',
    ks.publisher = 'Pearson',
    ks.year = 2018,
    ks.category = 'derivatives',
    ks.file_name = 'Options Futures and Other Derivatives by John C Hull (1).PDF',
    ks.description = 'Canonical reference for options pricing, Greeks, hedging strategies, structured products and interest rate models.';

MERGE (ks:KnowledgeSource {title: 'Successful Algorithmic Trading'})
SET ks.author = 'AAT',
    ks.publisher = 'AAT',
    ks.year = 2017,
    ks.category = 'algorithmic_trading',
    ks.file_name = 'Successful Algorithmic Trading.pdf',
    ks.description = 'End-to-end guide covering event-driven backtesting, broker APIs, equity strategies, risk management and execution.';

MERGE (ks:KnowledgeSource {title: 'Financial Calculus'})
SET ks.author = 'Martin Baxter and Andrew Rennie',
    ks.publisher = 'Cambridge University Press',
    ks.year = 2012,
    ks.category = 'mathematical_finance',
    ks.file_name = 'Martin Baxter, Andrew Rennie - Financial Calculus.pdf',
    ks.description = 'Rigorous introduction to Brownian motion, Itô calculus, risk-neutral measure, and derivative pricing.';

MERGE (ks:KnowledgeSource {title: 'Japanese Candlestick Charting Techniques'})
SET ks.author = 'Steve Nison',
    ks.publisher = 'Prentice Hall',
    ks.year = 2001,
    ks.category = 'technical_analysis',
    ks.file_name = 'Steve-Nison-Japanese-Candlestick-Charting-Techniques.pdf',
    ks.description = 'Comprehensive guide to candlestick chart patterns for identifying reversals, continuations, and sentiment shifts.';

MERGE (ks:KnowledgeSource {title: 'How To Make Money In Stocks'})
SET ks.author = 'William J. O\'Neil',
    ks.publisher = 'McGraw-Hill',
    ks.year = 2009,
    ks.category = 'growth_investing',
    ks.file_name = 'How+To+Make+Money+In+Stocks+-+William+J.+O\'Neil.pdf',
    ks.description = 'CAN SLIM growth strategy: earnings acceleration, institutional sponsorship, market timing, and chart patterns.';

MERGE (ks:KnowledgeSource {title: 'Financial Mathematics, Derivatives and Structured Products'})
SET ks.author = 'Springer Finance',
    ks.publisher = 'Springer',
    ks.year = 2020,
    ks.category = 'mathematical_finance',
    ks.file_name = 'Financial Mathematics, Derivatives and Structured Products (Springer Finance).pdf',
    ks.description = 'Mathematical treatment of no-arbitrage pricing, structured products, exotic derivatives, and credit instruments.';

MERGE (ks:KnowledgeSource {title: 'Actuarial Sciences and Quantitative Finance'})
SET ks.author = 'Londoño, Garrido, Jeanblanc (eds.)',
    ks.publisher = 'Springer',
    ks.year = 2017,
    ks.category = 'actuarial_quant_finance',
    ks.file_name = 'Actuarial Sciences and Quantitative Finance ICASQF2016.pdf',
    ks.description = 'Proceedings covering risk measures, insurance-linked securities, longevity risk, and portfolio hedging under uncertainty.';

MERGE (ks:KnowledgeSource {title: 'Valuation and Volatility'})
SET ks.author = 'Springer',
    ks.publisher = 'Springer',
    ks.year = 2023,
    ks.category = 'valuation',
    ks.file_name = 'Valuation and Volatility Stakeholder Perspective.pdf',
    ks.description = 'Stakeholder-centric valuation framework integrating implied volatility, real options, and strategic flexibility.';

MERGE (ks:KnowledgeSource {title: 'Fundamental and Technical Analysis Integrated System'})
SET ks.author = 'Unknown',
    ks.publisher = 'Independent',
    ks.year = 2020,
    ks.category = 'hybrid_analysis',
    ks.file_name = 'Fundamental analysis and technical analysis integrated system.pdf',
    ks.description = 'Integrates fundamental valuation (P/E, DCF, EV/EBITDA) with technical signals for combined buy/sell signals.';

MERGE (ks:KnowledgeSource {title: 'The Disciplined Trader'})
SET ks.author = 'Mark Douglas',
    ks.publisher = 'Prentice Hall',
    ks.year = 1990,
    ks.category = 'trading_psychology',
    ks.file_name = 'The-Disciplined-Trader-Developing-Winning-Attitudes.pdf',
    ks.description = 'Trading psychology: discipline, consistency, loss management, and the psychological framework for professional trading.';

MERGE (ks:KnowledgeSource {title: 'Trading In the Zone'})
SET ks.author = 'Mark Douglas',
    ks.publisher = 'Prentice Hall',
    ks.year = 2000,
    ks.category = 'trading_psychology',
    ks.file_name = 'Trading In the Zone Mark Douglas.pdf',
    ks.description = 'Mental framework for consistent trading: probabilistic thinking, eliminating fear/greed, and achieving the trading zone.';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION A: QUANTITATIVE / SYSTEMATIC STRATEGIES
// Source: Ernest Chan — Quantitative Trading
// ═══════════════════════════════════════════════════════════════════════════

MERGE (s:TradingStrategy {name: 'Pairs Trading (Mean Reversion)'})
SET s.category = 'mean_reversion',
    s.description = 'Statistical arbitrage between two cointegrated assets. Trade the spread when it deviates beyond a threshold (measured in standard deviations), expecting mean reversion to the historical equilibrium.',
    s.entry_signal = 'Go long the spread when z-score < -2; go short the spread when z-score > +2. Z-score = (spread - μ) / σ where spread = ln(P_A) - β·ln(P_B).',
    s.exit_signal = 'Close position when z-score reverts to 0 (mean); stop-loss if z-score exceeds ±3 (potential cointegration breakdown).',
    s.risk_management = 'Set maximum drawdown tolerance per pair at 2% of portfolio. Retest cointegration monthly using Engle-Granger or Johansen test. Hedge ratio β must be re-estimated quarterly.',
    s.timeframe = 'Daily to intraday (minutes)',
    s.asset_class = 'Equities, ETFs, Futures, FX',
    s.book_source = 'Quantitative Trading',
    s.book_author = 'Ernest P. Chan',
    s.menu_ids = ['portfolio', 'risk', 'factor'],
    s.keywords = ['pairs trading', 'cointegration', 'mean reversion', 'spread', 'z-score', 'statistical arbitrage', 'ornstein-uhlenbeck'];

MERGE (s:TradingStrategy {name: 'Moving Average Crossover (Trend Following)'})
SET s.category = 'trend_following',
    s.description = 'Captures sustained price trends using two moving averages. The short MA crossing above the long MA signals an uptrend; crossing below signals a downtrend. Works best in trending markets with strong autocorrelation.',
    s.entry_signal = 'Long when SMA(20) crosses above SMA(60). Short (or exit) when SMA(20) crosses below SMA(60). Confirm with volume and ADX > 25.',
    s.exit_signal = 'Reverse on opposite crossover, or trail with ATR-based stop (2×ATR below recent high for longs).',
    s.risk_management = 'Risk 1% of capital per trade. Reduce position size during low-volatility regimes (realized vol < 10 percentile). Avoid during earnings windows.',
    s.timeframe = 'Daily, Weekly',
    s.asset_class = 'Equities, Futures, ETFs, FX',
    s.book_source = 'Quantitative Trading',
    s.book_author = 'Ernest P. Chan',
    s.menu_ids = ['portfolio', 'blotter', 'scenarios'],
    s.keywords = ['moving average', 'crossover', 'trend following', 'SMA', 'EMA', 'momentum', 'ADX', 'trend'];

MERGE (s:TradingStrategy {name: 'ETF Mean Reversion (Bollinger Band)'})
SET s.category = 'mean_reversion',
    s.description = 'Exploits short-term overextension in liquid ETFs. Prices outside Bollinger Bands (2σ) tend to snap back, especially in range-bound markets. Most effective on broad index ETFs (SPY, QQQ, IWM).',
    s.entry_signal = 'Buy when price closes below lower Bollinger Band (20-day MA, 2σ) with RSI < 30. Sell when price closes above upper band with RSI > 70.',
    s.exit_signal = 'Exit at middle band (20-day MA), or after 5 trading days if no reversion occurs.',
    s.risk_management = 'Do not apply during trend markets (ADX > 30). Position size inversely proportional to realized volatility. Stop at 3σ extension.',
    s.timeframe = 'Daily',
    s.asset_class = 'ETFs',
    s.book_source = 'Quantitative Trading',
    s.book_author = 'Ernest P. Chan',
    s.menu_ids = ['portfolio', 'risk'],
    s.keywords = ['bollinger bands', 'mean reversion', 'ETF', 'RSI', 'overbought', 'oversold', 'range-bound'];

MERGE (s:TradingStrategy {name: 'Intraday Momentum (Opening Range Breakout)'})
SET s.category = 'momentum',
    s.description = 'Trades the directional breakout from the first N minutes (typically 15-30 min) of the trading session. The opening range captures overnight information and institutional order flow.',
    s.entry_signal = 'Go long when price breaks above the opening range high with above-average volume. Go short when price breaks below opening range low.',
    s.exit_signal = 'Target: 2× the opening range width from breakout point. Stop-loss: re-entry into the opening range (false breakout).',
    s.risk_management = 'Only trade stocks with average daily volume > 1M shares. Avoid on earnings days. Risk no more than 0.5% of capital per trade. Time stop at 2 hours post-open.',
    s.timeframe = 'Intraday (5-min, 15-min bars)',
    s.asset_class = 'Equities, Futures',
    s.book_source = 'Quantitative Trading',
    s.book_author = 'Ernest P. Chan',
    s.menu_ids = ['blotter', 'portfolio'],
    s.keywords = ['intraday', 'momentum', 'opening range', 'breakout', 'volume', 'gap', 'opening'];

MERGE (s:TradingStrategy {name: 'Kelly Criterion Position Sizing'})
SET s.category = 'risk_management',
    s.description = 'Optimal capital allocation that maximizes long-run portfolio growth. The Kelly fraction f* = (bp - q)/b determines what fraction of capital to risk, where b is the win/loss ratio, p is win probability, q = 1-p.',
    s.entry_signal = 'Apply Kelly sizing after strategy analysis: f* = (μ - r_f) / σ² for continuous returns. Use half-Kelly (f*/2) in practice to reduce variance.',
    s.exit_signal = 'Rebalance position when actual weight deviates more than 20% from Kelly weight.',
    s.risk_management = 'Never use full Kelly — use fractional Kelly (25-50%) to reduce ruin probability. Estimate μ and σ over rolling 252-day window. Maximum single position 10% of portfolio.',
    s.timeframe = 'Weekly rebalancing',
    s.asset_class = 'All asset classes',
    s.book_source = 'Quantitative Trading',
    s.book_author = 'Ernest P. Chan',
    s.menu_ids = ['optimizer', 'portfolio', 'risk'],
    s.keywords = ['Kelly criterion', 'position sizing', 'optimal growth', 'capital allocation', 'fractional Kelly', 'Kelly fraction'];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION B: ALPHA CONSTRUCTION
// Source: Tulchinsky — Finding Alphas
// ═══════════════════════════════════════════════════════════════════════════

MERGE (s:TradingStrategy {name: 'Cross-Sectional Momentum Alpha'})
SET s.category = 'momentum',
    s.description = 'Rank all assets in the universe by trailing 12-month return (excluding last month to avoid short-term reversal). Long top quintile, short bottom quintile. Captures the Jegadeesh-Titman momentum premium.',
    s.entry_signal = 'At month-end: long top 20% by 12-1 momentum, short bottom 20%. Equal-weight or signal-weighted positions. Rebalance monthly.',
    s.exit_signal = 'Exit position at next monthly rebalance. Stop-loss: if individual position draws down 15%.',
    s.risk_management = 'Neutralize market beta (hedge with index futures). Monitor alpha decay: IC should remain > 0.02. Exit crowded trades when crowding index > 0.7.',
    s.timeframe = 'Monthly rebalancing',
    s.asset_class = 'Equities (large-cap universe)',
    s.book_source = 'Finding Alphas',
    s.book_author = 'Igor Tulchinsky',
    s.menu_ids = ['factor', 'optimizer', 'portfolio'],
    s.keywords = ['momentum', 'cross-sectional', 'alpha', 'quintile', 'IC', 'factor', 'Jegadeesh-Titman', 'rebalancing'];

MERGE (s:TradingStrategy {name: 'Short-Term Reversal Alpha'})
SET s.category = 'mean_reversion',
    s.description = 'Exploits the well-documented 1-week return reversal effect (Lehmann 1990, Jegadeesh 1990). Assets that fell hardest last week tend to outperform next week. Strong in liquid markets with high turnover.',
    s.entry_signal = 'Weekly: long bottom decile by prior-week return, short top decile. Equal-weight within each decile. Rebalance every Friday close.',
    s.exit_signal = 'Exit at next weekly rebalance. The signal decays rapidly — holding > 2 weeks eliminates the edge.',
    s.risk_management = 'Market-neutral construction essential. Transaction costs are the primary P&L drag — use low-cost execution. Avoid small/illiquid stocks (bid-ask spreads erode alpha).',
    s.timeframe = 'Weekly',
    s.asset_class = 'Equities',
    s.book_source = 'Finding Alphas',
    s.book_author = 'Igor Tulchinsky',
    s.menu_ids = ['factor', 'portfolio'],
    s.keywords = ['reversal', 'mean reversion', 'short-term', 'weekly', 'alpha', 'Lehmann', 'Jegadeesh'];

MERGE (s:TradingStrategy {name: 'Alpha Decay Management'})
SET s.category = 'alpha_management',
    s.description = 'All trading signals degrade over time as they are discovered by more traders (alpha decay). Monitor the Information Coefficient (IC) rolling decay curve. A half-life of 5-20 days is typical for price-based alphas.',
    s.entry_signal = 'Deploy alpha only when rolling IC (past 252 days) > 0.02 and statistically significant (t-stat > 2). Reduce leverage as IC declines.',
    s.exit_signal = 'Retire the alpha or reduce position size by 50% when rolling IC drops below 0.01 for 3+ consecutive months.',
    s.risk_management = 'Diversify across uncorrelated alphas. Monitor pairwise correlations between deployed alphas — keep average < 0.3. Use turnover budget to control transaction costs.',
    s.timeframe = 'Ongoing monitoring',
    s.asset_class = 'All',
    s.book_source = 'Finding Alphas',
    s.book_author = 'Igor Tulchinsky',
    s.menu_ids = ['factor', 'optimizer', 'risk'],
    s.keywords = ['alpha decay', 'IC', 'information coefficient', 'signal degradation', 'crowding', 'turnover'];

MERGE (s:TradingStrategy {name: 'Volume-Weighted Momentum Signal'})
SET s.category = 'momentum',
    s.description = 'Enhance raw price momentum by weighting recent moves by volume. Volume confirmation distinguishes genuine breakouts from low-conviction moves. VWAP deviation is also a useful intraday mean-reversion signal.',
    s.entry_signal = 'Signal = Σ(ret_t × vol_t) / Σ(vol_t) over 20 days. Rank assets by this volume-weighted return. Long top quintile, short bottom quintile.',
    s.exit_signal = 'Rebalance monthly. Individual exit if price falls below 20-day VWAP by > 1σ.',
    s.risk_management = 'Higher volume-weighted signals have higher IC but also higher turnover. Net of transaction costs analysis required before deployment. Monitor for crowding.',
    s.timeframe = 'Daily signals, monthly rebalancing',
    s.asset_class = 'Equities',
    s.book_source = 'Finding Alphas',
    s.book_author = 'Igor Tulchinsky',
    s.menu_ids = ['factor', 'blotter'],
    s.keywords = ['volume', 'momentum', 'VWAP', 'volume-weighted', 'signal', 'alpha'];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION C: OPTIONS STRATEGIES
// Source: John C. Hull — Options, Futures and Other Derivatives
// ═══════════════════════════════════════════════════════════════════════════

MERGE (s:TradingStrategy {name: 'Covered Call Writing'})
SET s.category = 'options_income',
    s.description = 'Hold long stock (100 shares) and sell an OTM call option. Generates premium income in exchange for capping upside. Most appropriate when outlook is neutral-to-slightly bullish. Equivalent to selling a cash-secured put.',
    s.entry_signal = 'Own the stock and sell 1 call per 100 shares, typically 30-45 DTE (days to expiry), at a strike 5-10% OTM. Collect Θ (theta) decay.',
    s.exit_signal = 'Buy back the call if it has lost 50-80% of its value (lock in theta gain). Roll up and out if underlying rises sharply toward the strike.',
    s.risk_management = 'Maximum gain limited to (Strike - Stock price) + Premium. Maximum loss = Stock price - Premium (stock can still go to zero). The premium reduces effective cost basis.',
    s.timeframe = '30-45 DTE, rolled monthly',
    s.asset_class = 'Equities, ETFs',
    s.book_source = 'Options, Futures and Other Derivatives',
    s.book_author = 'John C. Hull',
    s.menu_ids = ['pricer', 'blotter', 'scenarios'],
    s.keywords = ['covered call', 'options', 'income', 'theta', 'call writing', 'neutral', 'premium', 'DTE'];

MERGE (s:TradingStrategy {name: 'Protective Put (Portfolio Insurance)'})
SET s.category = 'options_hedging',
    s.description = 'Buy OTM put options as downside protection for a long equity position. Acts as portfolio insurance. The cost is the premium paid, but limits losses if the market falls sharply. Essential risk management tool for concentrated positions.',
    s.entry_signal = 'Buy put options with strike 5-10% below current price, 2-3 months to expiry. Ratio: 1 put per 100 shares owned. Buy when implied vol is relatively low.',
    s.exit_signal = 'Let expire if not needed. Roll to next expiry cycle 2 weeks before expiry if protection is still desired.',
    s.risk_management = 'Cost of protection should not exceed 1-2% of portfolio per month. Use when VIX < 20 (cheap insurance). Reduce notional if VIX > 35 (insurance is too expensive).',
    s.timeframe = '60-90 DTE, quarterly rolling',
    s.asset_class = 'Equities, ETFs',
    s.book_source = 'Options, Futures and Other Derivatives',
    s.book_author = 'John C. Hull',
    s.menu_ids = ['pricer', 'risk', 'scenarios', 'portfolio'],
    s.keywords = ['protective put', 'portfolio insurance', 'hedging', 'downside', 'put option', 'tail risk'];

MERGE (s:TradingStrategy {name: 'Long Straddle (Volatility Play)'})
SET s.category = 'options_volatility',
    s.description = 'Buy both a call and put at the same strike and expiry. Profits when the underlying moves significantly in either direction. Pure long volatility bet — benefits from high realized volatility exceeding implied volatility paid.',
    s.entry_signal = 'Buy ATM call + ATM put. Deploy when implied vol is low (IV < historical 30th percentile), before an expected catalyst (earnings, FDA, macro event). At-the-money maximizes gamma exposure.',
    s.exit_signal = 'Close when unrealized P&L = 2× cost paid (double your money) or stop-loss at 50% of premium paid. Always exit before earnings announcement to avoid vol crush.',
    s.risk_management = 'Maximum loss = total premium paid (both legs). Break-even: underlying must move > (total premium / ATM strike). Limit straddle exposure to 2-3% of portfolio.',
    s.timeframe = '30-60 DTE',
    s.asset_class = 'Equities, Index, FX',
    s.book_source = 'Options, Futures and Other Derivatives',
    s.book_author = 'John C. Hull',
    s.menu_ids = ['pricer', 'volatility', 'scenarios'],
    s.keywords = ['straddle', 'volatility', 'gamma', 'long vol', 'ATM', 'earnings', 'catalyst', 'implied vol'];

MERGE (s:TradingStrategy {name: 'Iron Condor (Range-Bound Income)'})
SET s.category = 'options_income',
    s.description = 'Sell an OTM call spread + sell an OTM put spread. Collects premium in range-bound markets. Maximum profit if underlying stays between the short strikes. Net short gamma, net positive theta.',
    s.entry_signal = 'Sell call spread (short 1 call + long 1 higher-strike call) + sell put spread (short 1 put + long 1 lower-strike put). Typically 1σ to 2σ OTM on each side, 30-45 DTE. Collect max premium when IV rank > 50.',
    s.exit_signal = 'Close at 50% of max profit (reduce risk). Adjust or close if short strike is tested (delta > 0.25 on any short leg).',
    s.risk_management = 'Max risk = width of widest spread - net credit. Define risk before entering. Do not manage overlapping positions on the same underlying.',
    s.timeframe = '30-45 DTE',
    s.asset_class = 'Index, ETFs (high liquidity required)',
    s.book_source = 'Options, Futures and Other Derivatives',
    s.book_author = 'John C. Hull',
    s.menu_ids = ['pricer', 'volatility', 'scenarios'],
    s.keywords = ['iron condor', 'range bound', 'theta', 'income', 'credit spread', 'options', 'short gamma'];

MERGE (s:TradingStrategy {name: 'Calendar Spread (Theta Harvesting)'})
SET s.category = 'options_income',
    s.description = 'Sell a near-term option and buy a further-dated option at the same strike. Harvests the faster time decay of the short-dated leg. Profits from time passing and/or volatility contango (near-term IV > long-term IV).',
    s.entry_signal = 'Sell front-month ATM option (30 DTE), buy same strike back-month option (60 DTE). Deploy when term structure is in contango (VX3M > VIX). Net debit strategy.',
    s.exit_signal = 'Close 1-2 weeks before the short leg expires. Profit target: 25-50% of max profit. Avoid carrying through earnings.',
    s.risk_management = 'Vega risk is significant — long the back month means you benefit from vol expansion in the long term. Monitor VIX term structure: exit if contango flattens.',
    s.timeframe = 'Monthly rolling',
    s.asset_class = 'Index ETFs, equities with liquid options',
    s.book_source = 'Options, Futures and Other Derivatives',
    s.book_author = 'John C. Hull',
    s.menu_ids = ['pricer', 'volatility'],
    s.keywords = ['calendar spread', 'theta', 'term structure', 'contango', 'time decay', 'vega'];

MERGE (s:TradingStrategy {name: 'Delta Hedging (Dynamic Replication)'})
SET s.category = 'options_hedging',
    s.description = 'Continuously hedge an options position by maintaining delta-neutral exposure through dynamic trading of the underlying. The net P&L from delta hedging converges to the difference between realized and implied volatility.',
    s.entry_signal = 'For each options position, compute net portfolio delta Δ. Hedge by trading -Δ units of the underlying. Rehedge when delta changes by more than 0.05 (or at fixed intervals).',
    s.exit_signal = 'Unwind hedge when closing the option position. Gamma scalping P&L = ½Γ(ΔS)² - Θ·Δt per rebalance period.',
    s.risk_management = 'Transaction costs of frequent rehedging erode P&L. Use gamma × realized-vol vs theta comparison to decide rehedge frequency. Avoid rehedging in illiquid conditions.',
    s.timeframe = 'Intraday to daily',
    s.asset_class = 'Options on any liquid underlying',
    s.book_source = 'Options, Futures and Other Derivatives',
    s.book_author = 'John C. Hull',
    s.menu_ids = ['pricer', 'risk', 'blotter'],
    s.keywords = ['delta hedging', 'delta neutral', 'dynamic replication', 'gamma scalping', 'rehedging', 'Greeks'];

MERGE (s:TradingStrategy {name: 'Gamma Scalping (Long Gamma Strategy)'})
SET s.category = 'options_volatility',
    s.description = 'Hold a long gamma position (long straddle or long options) and continuously delta hedge to capture realized volatility exceeding the implied vol paid. Profits when σ_realized > σ_implied.',
    s.entry_signal = 'Buy ATM straddle (maximize gamma). Delta hedge continuously. Each rehedge captures ½Γ(ΔS)² — the gamma P&L. Deploy when HV/IV ratio < 0.8 (realized vol likely to expand).',
    s.exit_signal = 'Exit when cumulative gamma scalping P&L covers the theta cost. Stop-loss: close if net P&L < -50% of premium paid after 5 days.',
    s.risk_management = 'Theta is the daily cost: the strategy loses value if realized vol ≤ implied vol. Optimal rehedge frequency balances gamma income vs transaction costs.',
    s.timeframe = 'Daily delta hedging',
    s.asset_class = 'Options on liquid equities/index',
    s.book_source = 'Options, Futures and Other Derivatives',
    s.book_author = 'John C. Hull',
    s.menu_ids = ['pricer', 'volatility', 'risk'],
    s.keywords = ['gamma scalping', 'long gamma', 'realized volatility', 'implied volatility', 'delta hedge', 'theta', 'vol arbitrage'];

MERGE (s:TradingStrategy {name: 'Volatility Arbitrage (Vol Surface Trading)'})
SET s.category = 'volatility_trading',
    s.description = 'Trade the difference between model-implied and market-implied volatility. When implied vol significantly exceeds historical vol, sell options (short vega). When implied vol is below historical vol, buy options (long vega).',
    s.entry_signal = 'Compute VRP = IV - RV_20D. When VRP > +5 vol points: sell short-dated options (delta-hedged). When VRP < -3 vol points: buy options.',
    s.exit_signal = 'Close when VRP normalizes to historical mean (±2 vol points). Time stop: 10 trading days.',
    s.risk_management = 'Always delta hedge to isolate vega exposure. Set vega budget per trade. Be aware of tail risk: short vol positions have unlimited downside in a spike.',
    s.timeframe = 'Daily to weekly',
    s.asset_class = 'Options, VIX products',
    s.book_source = 'Options, Futures and Other Derivatives',
    s.book_author = 'John C. Hull',
    s.menu_ids = ['volatility', 'pricer', 'risk'],
    s.keywords = ['volatility arbitrage', 'vega', 'VRP', 'vol premium', 'implied vol', 'realized vol', 'short vol'];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION D: SYSTEMATIC ALGORITHMIC STRATEGIES
// Source: Successful Algorithmic Trading (AAT)
// ═══════════════════════════════════════════════════════════════════════════

MERGE (s:TradingStrategy {name: 'RSI Mean Reversion (Systematic)'})
SET s.category = 'mean_reversion',
    s.description = 'Systematic mean-reversion strategy using RSI(14) to identify short-term oversold/overbought conditions in equities. Tested across multiple liquid stocks with event-driven backtesting framework.',
    s.entry_signal = 'Buy when RSI(14) < 30 AND price above 200-day MA (not in downtrend). Sell short when RSI(14) > 70 AND price below 200-day MA.',
    s.exit_signal = 'Exit long when RSI > 50 (normalised). Exit short when RSI < 50. Stop-loss: 2% adverse move from entry.',
    s.risk_management = 'Fixed fractional sizing: 2% risk per trade. Never hold through earnings. Run on diversified basket (≥20 stocks) to reduce idiosyncratic risk. Log all trades for attribution.',
    s.timeframe = 'Daily',
    s.asset_class = 'Equities (liquid, S&P 500 universe)',
    s.book_source = 'Successful Algorithmic Trading',
    s.book_author = 'AAT',
    s.menu_ids = ['blotter', 'portfolio', 'risk'],
    s.keywords = ['RSI', 'mean reversion', 'oversold', 'overbought', 'systematic', 'equity', 'signal'];

MERGE (s:TradingStrategy {name: 'MACD Momentum Strategy'})
SET s.category = 'momentum',
    s.description = 'Trend-following strategy using MACD (12,26,9) for entry/exit signals. MACD measures the convergence/divergence of exponential moving averages, capturing medium-term momentum.',
    s.entry_signal = 'Buy when MACD line crosses above signal line (bullish crossover) AND MACD histogram turns positive. Sell when MACD line crosses below signal line.',
    s.exit_signal = 'Close position on opposite crossover. Trailing stop: ATR(14) × 2 below price for longs.',
    s.risk_management = 'Works best in trending markets. Avoid during low-volatility consolidation (many false signals). Combine with ATR filter: only trade when ATR > 20-day average ATR.',
    s.timeframe = 'Daily, 4-hour',
    s.asset_class = 'Equities, FX, Futures',
    s.book_source = 'Successful Algorithmic Trading',
    s.book_author = 'AAT',
    s.menu_ids = ['blotter', 'portfolio'],
    s.keywords = ['MACD', 'momentum', 'EMA', 'crossover', 'histogram', 'trend following', 'signal'];

MERGE (s:TradingStrategy {name: 'Breakout Strategy (Donchian Channel)'})
SET s.category = 'trend_following',
    s.description = 'Buys new N-day highs and sells new N-day lows, capturing breakouts from consolidation ranges. Originated by Richard Donchian, popularized by the Turtle Traders. Works best on futures and commodities.',
    s.entry_signal = 'Buy when price closes above 20-day high (breakout). Short when price closes below 20-day low. Use 10-day exit channel (tighter) to exit positions.',
    s.exit_signal = '10-day exit: close long when price closes below 10-day low; close short when price closes above 10-day high.',
    s.risk_management = 'Use 1% of portfolio per trade. Size positions using ATR-based volatility normalisation (N units = 1% capital / ATR). Diversify across ≥20 uncorrelated markets.',
    s.timeframe = 'Daily',
    s.asset_class = 'Futures (commodities, FX, rates, equity index)',
    s.book_source = 'Successful Algorithmic Trading',
    s.book_author = 'AAT',
    s.menu_ids = ['blotter', 'portfolio', 'scenarios'],
    s.keywords = ['breakout', 'Donchian channel', 'turtle trading', 'trend following', 'new high', 'new low', 'channel'];

MERGE (s:TradingStrategy {name: 'Market Neutral Factor Combination'})
SET s.category = 'factor',
    s.description = 'Combine multiple uncorrelated factors (value, momentum, quality, low-vol) into a composite signal. Long high-scoring assets, short low-scoring assets. Market neutral construction removes systematic beta.',
    s.entry_signal = 'Compute z-score of each factor. Composite signal = weighted average (e.g., 25% each for value, momentum, quality, low-vol). Long top quintile, short bottom quintile. Rebalance monthly.',
    s.exit_signal = 'Monthly rebalance. Individual exit if composite z-score normalises to 0.',
    s.risk_management = 'Hedge portfolio beta with index futures to maintain neutrality. Monitor factor correlations: reduce weights on highly correlated factors. Sector-neutral construction reduces sector bets.',
    s.timeframe = 'Monthly rebalancing',
    s.asset_class = 'Equities',
    s.book_source = 'Successful Algorithmic Trading',
    s.book_author = 'AAT',
    s.menu_ids = ['factor', 'optimizer', 'portfolio'],
    s.keywords = ['factor', 'market neutral', 'multi-factor', 'value', 'momentum', 'quality', 'low volatility', 'composite'];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION E: MATHEMATICAL FINANCE STRATEGIES
// Source: Baxter & Rennie — Financial Calculus
// ═══════════════════════════════════════════════════════════════════════════

MERGE (s:TradingStrategy {name: 'Risk-Neutral Replication (Derivative Hedging)'})
SET s.category = 'derivatives_hedging',
    s.description = 'Price and hedge any derivative by constructing a self-financing replicating portfolio in the risk-neutral measure. The fair price equals the discounted expected payoff under Q. The hedge ratio is the derivative of price w.r.t. underlying.',
    s.entry_signal = 'Construct hedge: Δ = ∂C/∂S. Hold Δ shares and borrow (C - Δ·S) at risk-free rate. Rebalance continuously (in theory) or at discrete intervals (in practice).',
    s.exit_signal = 'Unwind at option expiry. The replicating portfolio converges to the option payoff at T.',
    s.risk_management = 'Discrete rehedging introduces hedging error proportional to Γ·(ΔS)². Minimize hedging error by rebalancing more frequently when gamma is large (near ATM, short-dated).',
    s.timeframe = 'Continuous, rebalanced daily in practice',
    s.asset_class = 'Options, warrants, structured products',
    s.book_source = 'Financial Calculus',
    s.book_author = 'Martin Baxter and Andrew Rennie',
    s.menu_ids = ['pricer', 'risk'],
    s.keywords = ['risk neutral', 'replication', 'hedging', 'delta', 'Itô', 'Brownian motion', 'self-financing'];

MERGE (s:TradingStrategy {name: 'Change of Numeraire (Measure Change Pricing)'})
SET s.category = 'mathematical_finance',
    s.description = 'Simplify exotic derivative pricing by choosing a convenient numeraire. The forward measure Q^T eliminates the need to model the money market account, making interest rate derivative pricing tractable (Geman, El Karoui, Rochet 1995).',
    s.entry_signal = 'Price IR derivatives (caps, swaptions) under the T-forward measure. Caplet price = P(0,T)·[F·N(d₁) - K·N(d₂)] under lognormal forward rate assumption.',
    s.exit_signal = 'Hedge using the forward-measure delta: ∂V/∂F.',
    s.risk_management = 'Model risk is significant for IR derivatives. Calibrate to market swaption/cap surface. Monitor for negative rates (require shifted lognormal or normal model).',
    s.timeframe = 'Any IR derivative horizon',
    s.asset_class = 'Interest rate derivatives',
    s.book_source = 'Financial Calculus',
    s.book_author = 'Martin Baxter and Andrew Rennie',
    s.menu_ids = ['pricer', 'scenarios'],
    s.keywords = ['numeraire', 'measure change', 'forward measure', 'interest rate', 'cap', 'swaption', 'BGM model'];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION F: TECHNICAL ANALYSIS STRATEGIES
// Source: Steve Nison — Japanese Candlestick Charting Techniques
// ═══════════════════════════════════════════════════════════════════════════

MERGE (s:TradingStrategy {name: 'Bullish Engulfing Pattern'})
SET s.category = 'technical_analysis',
    s.description = 'A 2-candle reversal pattern where a bearish candle is completely engulfed by the following bullish candle. Signals a potential trend reversal from bearish to bullish. Most reliable at support levels or after extended downtrends.',
    s.entry_signal = 'Buy at open of the candle following the bullish engulfing pattern. Confirm with above-average volume on the engulfing candle. Use RSI < 40 for additional confirmation.',
    s.exit_signal = 'Target: next significant resistance level. Stop: below the low of the engulfing pattern (the first bearish candle\'s low).',
    s.risk_management = 'False signals common in choppy markets. Require at least 5-day downtrend before pattern. Risk:Reward ratio must be ≥ 2:1 before taking the trade.',
    s.timeframe = 'Daily, Weekly',
    s.asset_class = 'All',
    s.book_source = 'Japanese Candlestick Charting Techniques',
    s.book_author = 'Steve Nison',
    s.menu_ids = ['blotter', 'portfolio'],
    s.keywords = ['candlestick', 'engulfing', 'reversal', 'technical analysis', 'bullish', 'support', 'trend reversal'];

MERGE (s:TradingStrategy {name: 'Doji Indecision Signal'})
SET s.category = 'technical_analysis',
    s.description = 'A doji candle has an open ≈ close price, showing market indecision and a tug-of-war between bulls and bears. Context matters: a doji after a strong trend signals a potential reversal; a doji in a sideways market is neutral.',
    s.entry_signal = 'After a strong uptrend: bearish signal — sell/short on confirmation next day if price closes lower. After a strong downtrend: bullish signal — buy on confirmation if next day closes higher.',
    s.exit_signal = 'Target: prior pivot. Stop: high (for short) or low (for long) of the doji candle.',
    s.risk_management = 'Always require confirmation from the next candle. Doji alone is not sufficient. Use volume analysis: low-volume doji is weaker signal.',
    s.timeframe = 'Daily, Weekly',
    s.asset_class = 'All',
    s.book_source = 'Japanese Candlestick Charting Techniques',
    s.book_author = 'Steve Nison',
    s.menu_ids = ['blotter'],
    s.keywords = ['doji', 'candlestick', 'indecision', 'reversal', 'technical analysis', 'confirmation'];

MERGE (s:TradingStrategy {name: 'Morning Star Reversal Pattern'})
SET s.category = 'technical_analysis',
    s.description = '3-candle bottoming pattern: (1) large bearish candle, (2) small-bodied candle (gap down) showing indecision, (3) large bullish candle closing above 50% of candle 1. Strongest reversal signal in Japanese candlestick analysis.',
    s.entry_signal = 'Buy at close of the third candle or at open of the fourth candle. Volume should increase on the third bullish candle for confirmation.',
    s.exit_signal = 'Target: top of the initial bearish candle (full reversal) or 1.5× pattern height. Stop: below the low of the middle star candle.',
    s.risk_management = 'Highest reliability at major support levels, oversold RSI, or after a clear downtrend. Combine with Fibonacci retracement levels for target setting.',
    s.timeframe = 'Daily, Weekly',
    s.asset_class = 'All',
    s.book_source = 'Japanese Candlestick Charting Techniques',
    s.book_author = 'Steve Nison',
    s.menu_ids = ['blotter'],
    s.keywords = ['morning star', 'candlestick', 'reversal', 'bottom', 'bullish', 'three-candle pattern', 'support'];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION G: GROWTH / FUNDAMENTAL STRATEGIES
// Source: William J. O'Neil — How to Make Money In Stocks
// ═══════════════════════════════════════════════════════════════════════════

MERGE (s:TradingStrategy {name: 'CAN SLIM Growth Strategy'})
SET s.category = 'growth_investing',
    s.description = 'Systematic growth stock selection framework: C=Current quarterly EPS (≥25% growth), A=Annual EPS (≥25% for 3 years), N=New product/service/high, S=Supply/demand (volume), L=Leader in sector, I=Institutional sponsorship, M=Market direction.',
    s.entry_signal = 'Buy when all 7 CAN SLIM criteria are met AND price breaks out from a valid base pattern (cup-with-handle, flat base, double bottom) with volume ≥50% above average.',
    s.exit_signal = 'Sell if stock falls 7-8% below purchase price (stop-loss rule). Take profits at 20-25% gain. Sell before earnings if stock is up >25% in less than 3 weeks (climax signal).',
    s.risk_management = 'Never average down on a losing position. Hold at most 5-7 positions at peak. Only buy during confirmed market uptrends (market direction M rule). Reduce exposure during market corrections.',
    s.timeframe = 'Weeks to months',
    s.asset_class = 'Growth equities (NASDAQ, NYSE)',
    s.book_source = 'How To Make Money In Stocks',
    s.book_author = "William J. O'Neil",
    s.menu_ids = ['portfolio', 'factor', 'blotter'],
    s.keywords = ['CAN SLIM', 'growth', 'EPS', 'fundamental', 'breakout', 'institutional', 'earnings', 'O\'Neil'];

MERGE (s:TradingStrategy {name: 'Cup-With-Handle Base Breakout'})
SET s.category = 'chart_pattern',
    s.description = 'Classic O\'Neil base pattern: a U-shaped "cup" forming over 7-65 weeks followed by a smaller "handle" pullback of 8-12%. Breakout above handle pivot on heavy volume signals the entry. Represents institutional accumulation.',
    s.entry_signal = 'Buy 5-10 cents above the handle pivot point on volume ≥50% above 50-day average. The handle should drift sideways-to-slightly down on lower volume (controlled pullback).',
    s.exit_signal = 'Sell on the 7-8% stop rule. Take initial profits at +20-25%. Sell if base becomes too long (>65 weeks) or too wide (>35% depth).',
    s.risk_management = 'Cup depth should not exceed 35% (shallow bases are stronger). Handle should not undercut the left side of the cup. Avoid all base patterns in down-trending markets.',
    s.timeframe = 'Weeks to months',
    s.asset_class = 'Growth equities',
    s.book_source = 'How To Make Money In Stocks',
    s.book_author = "William J. O'Neil",
    s.menu_ids = ['portfolio', 'blotter'],
    s.keywords = ['cup with handle', 'base pattern', 'breakout', 'chart pattern', 'volume', 'pivot', 'accumulation'];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION H: PORTFOLIO CONSTRUCTION & RISK MANAGEMENT
// Source: Multiple books
// ═══════════════════════════════════════════════════════════════════════════

MERGE (s:TradingStrategy {name: 'Hierarchical Risk Parity (HRP)'})
SET s.category = 'portfolio_construction',
    s.description = 'Allocates risk using hierarchical clustering of the correlation matrix (Mantegna MST distance) followed by recursive bisection. Avoids matrix inversion instability of MVO. More robust out-of-sample than equal-weight or MVO.',
    s.entry_signal = 'Compute correlation matrix → Mantegna distance d_ij = √(2(1-ρ_ij)) → Ward linkage clustering → recursive bisection weights. Rebalance monthly or when maximum drawdown constraint is breached.',
    s.exit_signal = 'Rebalance when any asset weight deviates >50% from target. Trigger full rebalance if maximum drawdown > 15%.',
    s.risk_management = 'HRP naturally diversifies across the hierarchical structure. Outperforms MVO in small samples and stressed markets. Combine with maximum volatility constraint per asset.',
    s.timeframe = 'Monthly rebalancing',
    s.asset_class = 'Multi-asset (equities, bonds, commodities)',
    s.book_source = 'Finding Alphas',
    s.book_author = 'Igor Tulchinsky',
    s.menu_ids = ['optimizer', 'risk', 'portfolio'],
    s.keywords = ['HRP', 'hierarchical risk parity', 'clustering', 'Mantegna', 'dendrogram', 'recursive bisection', 'diversification'];

MERGE (s:TradingStrategy {name: 'Equal Risk Contribution (Risk Parity)'})
SET s.category = 'portfolio_construction',
    s.description = 'Each asset contributes equally to portfolio volatility. Risk contribution = w_i × (Σw)_i / σ_p. Unlike equal weight, risk parity accounts for correlations and individual volatilities, over-weighting lower-vol assets (bonds, low-beta stocks).',
    s.entry_signal = 'Solve: min Σᵢ(RCᵢ - σ_p/N)² s.t. w ≥ 0, Σw = 1 via SciPy optimization. Lever the low-vol portfolio to match target volatility (typically using futures).',
    s.exit_signal = 'Monthly rebalancing when risk contributions diverge > 20% from target equality.',
    s.risk_management = 'Leverage amplifies losses in a risk-off event when correlations spike. Use VIX > 30 trigger to de-lever automatically. Maximum leverage cap: 2×.',
    s.timeframe = 'Monthly rebalancing',
    s.asset_class = 'Multi-asset',
    s.book_source = 'Quantitative Trading',
    s.book_author = 'Ernest P. Chan',
    s.menu_ids = ['optimizer', 'portfolio', 'risk'],
    s.keywords = ['risk parity', 'equal risk contribution', 'ERC', 'diversification', 'risk budgeting', 'volatility targeting'];

MERGE (s:TradingStrategy {name: 'Black-Litterman Tactical Allocation'})
SET s.category = 'portfolio_construction',
    s.description = 'Combines market equilibrium returns (CAPM π = δΣw_mkt) with investor views via Bayesian blending. Produces more intuitive, less extreme weights than pure MVO. Ideal for expressing tactical views (e.g., "Tech will outperform by 2% p.a.").',
    s.entry_signal = 'Specify views: Q = P·μ_BL + ε (view matrix). Estimate Ω (uncertainty matrix). Solve for posterior μ_BL and run MVO with these enhanced returns. Rebalance when views change significantly.',
    s.exit_signal = 'Revisit quarterly or when actual returns deviate significantly from view forecasts.',
    s.risk_management = 'Sensitivity to τ (prior confidence) and Ω (view uncertainty). Use Idzorek method for intuitive view uncertainty specification. Conduct Monte Carlo sensitivity analysis before deployment.',
    s.timeframe = 'Quarterly tactical rebalancing',
    s.asset_class = 'Multi-asset, Equities',
    s.book_source = 'Finding Alphas',
    s.book_author = 'Igor Tulchinsky',
    s.menu_ids = ['optimizer', 'portfolio', 'scenarios'],
    s.keywords = ['Black-Litterman', 'tactical allocation', 'Bayesian', 'equilibrium', 'views', 'CAPM', 'MVO', 'posterior'];

MERGE (s:TradingStrategy {name: 'Maximum Drawdown Control Strategy'})
SET s.category = 'risk_management',
    s.description = 'Dynamic risk overlay that reduces exposure as portfolio drawdown approaches a predetermined limit. Preserves capital in adverse markets. Based on the mathematics of ruin theory from actuarial science.',
    s.entry_signal = 'Maintain full allocation when drawdown = 0. Scale exposure linearly: position_size = max(0, 1 - drawdown / max_drawdown_tolerance). Typical max tolerance: 20% portfolio drawdown.',
    s.exit_signal = 'Restore full exposure when portfolio recovers to 50% of the drawdown from peak.',
    s.risk_management = 'Avoids the gambler\'s ruin problem. Be cautious of whipsaw in volatile markets. Combine with VIX-based regime filter to avoid over-trading.',
    s.timeframe = 'Daily monitoring',
    s.asset_class = 'All portfolio types',
    s.book_source = 'Actuarial Sciences and Quantitative Finance',
    s.book_author = 'Londoño, Garrido, Jeanblanc',
    s.menu_ids = ['risk', 'portfolio', 'scenarios'],
    s.keywords = ['drawdown', 'risk management', 'drawdown control', 'position sizing', 'ruin', 'capital preservation'];

MERGE (s:TradingStrategy {name: 'VaR-Constrained Optimization'})
SET s.category = 'risk_management',
    s.description = 'Portfolio optimization with an explicit Value at Risk constraint: maximize expected return subject to VaR ≤ V* at confidence level α. Ensures regulatory (Basel III) compliance while maintaining return potential.',
    s.entry_signal = 'Maximize E[R_p] s.t. VaR_α ≤ V* and w ≥ 0, Σw = 1. With normal returns: VaR_α = μ_p·h - z_α·σ_p·√h. Run monthly.',
    s.exit_signal = 'Rebalance immediately if VaR breaches limit due to market moves. Reduce positions proportionally to bring VaR back within limit.',
    s.risk_management = 'Parametric VaR underestimates tail risk. Use stressed VaR (2008 financial crisis window) for regulatory capital. Consider CVaR constraint instead for better tail coverage.',
    s.timeframe = 'Daily VaR monitoring, monthly rebalancing',
    s.asset_class = 'All',
    s.book_source = 'Actuarial Sciences and Quantitative Finance',
    s.book_author = 'Londoño, Garrido, Jeanblanc',
    s.menu_ids = ['risk', 'optimizer', 'portfolio'],
    s.keywords = ['VaR', 'constraint', 'optimization', 'Basel III', 'regulatory', 'risk budget', 'CVaR'];

MERGE (s:TradingStrategy {name: 'Volatility Targeting (Risk-Adjusted Sizing)'})
SET s.category = 'risk_management',
    s.description = 'Scale portfolio exposure inversely with realized volatility to maintain constant portfolio volatility over time. When markets are calm, lever up; when volatile, scale down. Improves Sharpe ratio by smoothing the risk profile.',
    s.entry_signal = 'Target vol σ* (e.g., 15% p.a.). Position multiplier = σ* / σ_realized(20D). Recompute daily and rebalance when multiplier changes by > 10%.',
    s.exit_signal = 'No explicit exit — this is a sizing overlay applied to any underlying strategy.',
    s.risk_management = 'Effective only if realized vol is predictive of future vol (usually true: vol clustering). Can cause over-exposure if vol drops to very low levels — cap multiplier at 2×.',
    s.timeframe = 'Daily rebalancing',
    s.asset_class = 'All (applied as overlay)',
    s.book_source = 'Quantitative Trading',
    s.book_author = 'Ernest P. Chan',
    s.menu_ids = ['risk', 'portfolio', 'optimizer'],
    s.keywords = ['volatility targeting', 'risk sizing', 'position sizing', 'vol scaling', 'realized vol', 'leverage'];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION I: TRADING PSYCHOLOGY PRINCIPLES
// Source: Mark Douglas — The Disciplined Trader / Trading in the Zone
// ═══════════════════════════════════════════════════════════════════════════

MERGE (s:TradingStrategy {name: 'Probabilistic Trade Framework'})
SET s.category = 'trading_psychology',
    s.description = 'Treat every trade as one observation in a statistically independent series. Focus on execution quality and adherence to rules, not on individual trade outcomes. A correct process with positive edge produces profitable outcomes over many trades — not every single trade.',
    s.entry_signal = 'Enter any trade that meets all pre-defined criteria — no additional mental filters based on fear of loss. Define entry rules mechanically BEFORE looking at the chart.',
    s.exit_signal = 'Exit only at pre-defined levels (target or stop). Never move stops against the position to avoid a loss.',
    s.risk_management = 'Risk the exact pre-defined amount on every trade — no exceptions. Never add to a losing position. Keep a trade journal: record entry, exit, reason, and emotional state.',
    s.timeframe = 'All timeframes',
    s.asset_class = 'All',
    s.book_source = 'Trading In the Zone',
    s.book_author = 'Mark Douglas',
    s.menu_ids = ['blotter', 'portfolio'],
    s.keywords = ['trading psychology', 'discipline', 'probabilistic', 'process', 'edge', 'consistency', 'emotional control'];

MERGE (s:TradingStrategy {name: 'Fixed Risk Position Sizing Rule'})
SET s.category = 'risk_management',
    s.description = 'Never risk more than a fixed percentage (1-2%) of total capital on any single trade, regardless of conviction. This rule ensures that no sequence of losses can cause catastrophic drawdown. Mathematically: even 10 consecutive losses at 2% risk leaves 82% of capital intact.',
    s.entry_signal = 'Position size = (Account equity × Risk%) / (Entry price - Stop price). Example: $100k account, 1% risk, entry $50, stop $49 → size = $1000/$1 = 1000 shares.',
    s.exit_signal = 'Honor the stop-loss unconditionally. Do not close early out of fear or let profits run out of greed — use a predetermined profit target.',
    s.risk_management = 'Scale down to 0.5% risk per trade after a drawdown exceeding 10%. Scale back up to 1% after recovering to previous peak. Never risk more than 5% of capital across all open positions simultaneously.',
    s.timeframe = 'All timeframes',
    s.asset_class = 'All',
    s.book_source = 'The Disciplined Trader',
    s.book_author = 'Mark Douglas',
    s.menu_ids = ['blotter', 'portfolio', 'risk'],
    s.keywords = ['position sizing', 'risk management', 'fixed risk', '1 percent rule', 'stop loss', 'capital preservation', 'sizing'];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION J: STRUCTURED PRODUCTS & EXOTIC STRATEGIES
// Source: Springer — Financial Mathematics, Derivatives and Structured Products
// ═══════════════════════════════════════════════════════════════════════════

MERGE (s:TradingStrategy {name: 'Capital Protected Note Replication'})
SET s.category = 'structured_product',
    s.description = 'Construct a capital-protected investment by combining a zero-coupon bond (floors the return at 0%) with long call options (captures upside). Principal protection level set at 100%; participation rate depends on interest rates and option prices.',
    s.entry_signal = 'Allocate X% to ZCB (e.g. X = 100/(1+r)^T for T-year protection at rate r). Remaining (1-X)% buys call options on the risky asset. Participation rate = (1-X) / Call_price.',
    s.exit_signal = 'Hold to maturity for full principal protection. Can be unwound in secondary market at mark-to-market price.',
    s.risk_management = 'Counterparty risk on issuer (credit risk). Low participation in high-rate/high-vol environments. Liquidity risk if sold before maturity. Not capital-protected if issuer defaults.',
    s.timeframe = '3-7 years',
    s.asset_class = 'Structured products, Bonds + Options',
    s.book_source = 'Financial Mathematics, Derivatives and Structured Products',
    s.book_author = 'Springer Finance',
    s.menu_ids = ['pricer', 'scenarios', 'optimizer'],
    s.keywords = ['capital protection', 'structured product', 'zero coupon bond', 'participation rate', 'note', 'principal'];

MERGE (s:TradingStrategy {name: 'Barrier Option Hedging Strategy'})
SET s.category = 'derivatives_hedging',
    s.description = 'Hedge barrier options (knock-in, knock-out) using static or semi-static replication with vanilla options. Static replication is model-independent and avoids the high delta/gamma near the barrier. Brunner (1994) approach: replicate barrier payoff with a portfolio of standard options.',
    s.entry_signal = 'For a down-and-out call: hold a vanilla call and short a position in binary options near the barrier. Re-hedge only when the underlying approaches within 2% of the barrier.',
    s.exit_signal = 'Unwind replication at option expiry or when barrier is touched (knockout) / activated (knockin).',
    s.risk_management = 'Delta and gamma are discontinuous near barrier — conventional delta hedging is unstable. Use static replication to avoid hedging errors. Monitor pin risk near expiry.',
    s.timeframe = 'Contract horizon',
    s.asset_class = 'FX barrier options, equity barrier options',
    s.book_source = 'Financial Mathematics, Derivatives and Structured Products',
    s.book_author = 'Springer Finance',
    s.menu_ids = ['pricer', 'risk'],
    s.keywords = ['barrier option', 'knock-out', 'knock-in', 'static replication', 'hedging', 'pin risk', 'exotic'];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION K: FUNDAMENTAL / INTEGRATED ANALYSIS
// Source: Fundamental and Technical Analysis Integrated System
// ═══════════════════════════════════════════════════════════════════════════

MERGE (s:TradingStrategy {name: 'Integrated FA/TA Signal System'})
SET s.category = 'hybrid_analysis',
    s.description = 'Combines fundamental screens (low P/E, high ROE, growing earnings, healthy balance sheet) with technical confirmation (uptrend, breakout, volume). Fundamental analysis determines WHAT to buy; technical analysis determines WHEN to buy.',
    s.entry_signal = 'Screen for: P/E < sector median, ROE > 15%, EPS growth > 15% YoY, debt/equity < 1. Then apply technical filter: price above 200-day MA, RSI 40-60 (room to run), volume above average.',
    s.exit_signal = 'Sell on fundamental deterioration (earnings miss, guidance cut) OR technical breakdown (price below 200-day MA for 3+ days, volume-confirmed breakdown).',
    s.risk_management = 'Diversify across 15-20 positions, max 5% per position. Sector exposure limit: 25% in any single sector. Recheck fundamentals quarterly.',
    s.timeframe = 'Medium-term (weeks to months)',
    s.asset_class = 'Equities',
    s.book_source = 'Fundamental and Technical Analysis Integrated System',
    s.book_author = 'Unknown',
    s.menu_ids = ['portfolio', 'factor', 'blotter'],
    s.keywords = ['fundamental', 'technical', 'P/E', 'ROE', 'earnings', 'integrated', 'combined signal', 'moving average'];

MERGE (s:TradingStrategy {name: 'Real Options Valuation Strategy'})
SET s.category = 'valuation',
    s.description = 'Value managerial flexibility (expand, abandon, defer, switch) embedded in corporate projects using options pricing models. NPV analysis ignores this flexibility — real options capture it. Black-Scholes adapted: S=project value, K=investment cost, σ=project vol, T=decision horizon.',
    s.entry_signal = 'Invest when real option value significantly exceeds the conventional NPV. Real Option Value = Project NPV + Option Value of Flexibility. Deploy capital when uncertainty resolves favorably.',
    s.exit_signal = 'Abandon project if abandonment option value exceeds continuation value. Switch to alternative production if switch option is in-the-money.',
    s.risk_management = 'The key risk is model error in estimating project volatility σ. Use scenario analysis to bound σ. Real options expand value; do not use to justify unprofitable projects.',
    s.timeframe = 'Strategic (years)',
    s.asset_class = 'Corporate investments, natural resources, R&D projects',
    s.book_source = 'Valuation and Volatility',
    s.book_author = 'Springer',
    s.menu_ids = ['scenarios', 'pricer', 'optimizer'],
    s.keywords = ['real options', 'NPV', 'flexibility', 'project valuation', 'managerial', 'abandon', 'defer', 'expand'];

// ═══════════════════════════════════════════════════════════════════════════
// RELATIONSHIPS: TradingStrategy → Menu
// ═══════════════════════════════════════════════════════════════════════════

// Pricer menu strategies
MATCH (s:TradingStrategy), (m:Menu {name: 'Pricer'})
WHERE any(mid IN s.menu_ids WHERE mid = 'pricer')
MERGE (s)-[:APPLICABLE_TO]->(m);

// Portfolio menu strategies
MATCH (s:TradingStrategy), (m:Menu {name: 'Portfolio'})
WHERE any(mid IN s.menu_ids WHERE mid = 'portfolio')
MERGE (s)-[:APPLICABLE_TO]->(m);

// Risk menu strategies
MATCH (s:TradingStrategy), (m:Menu {name: 'Risk'})
WHERE any(mid IN s.menu_ids WHERE mid = 'risk')
MERGE (s)-[:APPLICABLE_TO]->(m);

// Optimizer menu strategies
MATCH (s:TradingStrategy), (m:Menu {name: 'Optimizer'})
WHERE any(mid IN s.menu_ids WHERE mid = 'optimizer')
MERGE (s)-[:APPLICABLE_TO]->(m);

// Volatility Lab menu strategies
MATCH (s:TradingStrategy), (m:Menu {name: 'Volatility Lab'})
WHERE any(mid IN s.menu_ids WHERE mid = 'volatility')
MERGE (s)-[:APPLICABLE_TO]->(m);

// Factor Lab menu strategies
MATCH (s:TradingStrategy), (m:Menu {name: 'Factor Lab'})
WHERE any(mid IN s.menu_ids WHERE mid = 'factor')
MERGE (s)-[:APPLICABLE_TO]->(m);

// Scenarios menu strategies
MATCH (s:TradingStrategy), (m:Menu {name: 'Scenarios'})
WHERE any(mid IN s.menu_ids WHERE mid = 'scenarios')
MERGE (s)-[:APPLICABLE_TO]->(m);

// Blotter menu strategies
MATCH (s:TradingStrategy), (m:Menu {name: 'Blotter'})
WHERE any(mid IN s.menu_ids WHERE mid = 'blotter')
MERGE (s)-[:APPLICABLE_TO]->(m);

// ═══════════════════════════════════════════════════════════════════════════
// RELATIONSHIPS: TradingStrategy → KnowledgeSource
// ═══════════════════════════════════════════════════════════════════════════

MATCH (s:TradingStrategy), (ks:KnowledgeSource)
WHERE s.book_source = ks.title
MERGE (s)-[:SOURCED_FROM]->(ks);

// ═══════════════════════════════════════════════════════════════════════════
// RELATIONSHIPS: TradingStrategy → Concept (where concepts already exist)
// ═══════════════════════════════════════════════════════════════════════════

MATCH (s:TradingStrategy {name: 'Pairs Trading (Mean Reversion)'}), (c:TransactConcept)
WHERE c.name IN ['Cointegration', 'Sharpe Ratio', 'Value at Risk']
MERGE (s)-[:USES_CONCEPT]->(c);

MATCH (s:TradingStrategy {name: 'Delta Hedging (Dynamic Replication)'}), (c:TransactConcept)
WHERE c.name IN ['Delta', 'Gamma', 'Theta', 'Black-Scholes Model', 'Greeks']
MERGE (s)-[:USES_CONCEPT]->(c);

MATCH (s:TradingStrategy {name: 'Kelly Criterion Position Sizing'}), (c:TransactConcept)
WHERE c.name IN ['Kelly Criterion', 'Expected Value', 'Sharpe Ratio']
MERGE (s)-[:USES_CONCEPT]->(c);

MATCH (s:TradingStrategy {name: 'Hierarchical Risk Parity (HRP)'}), (c:TransactConcept)
WHERE c.name IN ['Hierarchical Risk Parity', 'Covariance Matrix', 'Sharpe Ratio']
MERGE (s)-[:USES_CONCEPT]->(c);

MATCH (s:TradingStrategy {name: 'Black-Litterman Tactical Allocation'}), (c:TransactConcept)
WHERE c.name IN ['Black-Litterman Model', 'CAPM', 'Expected Return']
MERGE (s)-[:USES_CONCEPT]->(c);

MATCH (s:TradingStrategy {name: 'Gamma Scalping (Long Gamma Strategy)'}), (c:TransactConcept)
WHERE c.name IN ['Gamma', 'Theta', 'Implied Volatility', 'Delta']
MERGE (s)-[:USES_CONCEPT]->(c);

MATCH (s:TradingStrategy {name: 'Volatility Arbitrage (Vol Surface Trading)'}), (c:TransactConcept)
WHERE c.name IN ['Implied Volatility', 'Volatility Surface', 'Volatility Risk Premium']
MERGE (s)-[:USES_CONCEPT]->(c);

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION QUERY (optional — run in Neo4j Browser to confirm)
// MATCH (s:TradingStrategy)-[:APPLICABLE_TO]->(m:Menu)
// RETURN m.name, count(s) AS strategy_count ORDER BY m.name;
// ═══════════════════════════════════════════════════════════════════════════
