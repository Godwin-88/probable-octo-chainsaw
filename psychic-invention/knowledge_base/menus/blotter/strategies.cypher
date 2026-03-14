// ═══════════════════════════════════════════════════════════════════════════
// knowledge_base/menus/blotter/strategies.cypher
// Blotter-specific TradingStrategy nodes + Metric/Interpretation nodes.
// Sources: Chan (Quantitative Trading), Hull (Options/Futures/Derivatives),
//          O'Neil (How To Make Money In Stocks), Douglas (Trading in the Zone),
//          Tulchinsky (Finding Alphas), Roncalli (Risk Parity).
//
// Run AFTER 06_trading_strategies.cypher (needs KnowledgeSource + Menu nodes).
// ═══════════════════════════════════════════════════════════════════════════

// ── Ensure Blotter Menu node exists ──────────────────────────────────────────
MERGE (m:Menu {name: 'Blotter'})
SET m.description = 'Trade blotter, P&L attribution, position management, and performance analytics.',
    m.icon = '📋',
    m.order = 8;

// ── Position Sizing Strategies ────────────────────────────────────────────────

MERGE (s:TradingStrategy {name: 'Kelly Criterion Position Sizing'})
SET s.category = 'position_sizing',
    s.book_source = 'Quantitative Trading',
    s.book_author = 'Ernest P. Chan',
    s.description = 'Optimal fraction of capital to risk per trade that maximises long-run logarithmic wealth growth. Single-asset: f* = (bp - q)/b where p=win probability, q=1-p, b=win/loss ratio.',
    s.entry_signal = 'Compute win rate (p) and profit factor (b) from trade history. Allocate f*·W to each position.',
    s.exit_signal = 'Re-compute f* after each trade or weekly. Reduce allocation if drawdown exceeds 2·f* threshold.',
    s.risk_management = 'Use fractional Kelly (0.25–0.5·f*) to reduce variance while preserving most of the growth benefit. Never exceed full Kelly.',
    s.timeframe = 'per trade / daily rebalance',
    s.asset_class = 'equities, futures, crypto',
    s.menu_context = 'Blotter';

MERGE (s:TradingStrategy {name: 'Fixed Fractional Position Sizing'})
SET s.category = 'position_sizing',
    s.book_source = 'Quantitative Trading',
    s.book_author = 'Ernest P. Chan',
    s.description = 'Risk a fixed percentage (e.g. 1–2%) of account equity per trade. Position size = (Risk% × Equity) / (Entry - Stop Loss). Simple, robust, and widely used by professional traders.',
    s.entry_signal = 'Set max risk per trade at 1–2% of equity. Determine stop-loss distance first, then back-calculate shares.',
    s.exit_signal = 'Exit at pre-defined stop-loss (capital preservation) or profit target (2–3× risk). Do not widen stops.',
    s.risk_management = 'Reduce risk% to 0.5% during drawdown periods. Increase back to 1–2% only after recovering to new equity highs.',
    s.timeframe = 'per trade',
    s.asset_class = 'equities, futures, options',
    s.menu_context = 'Blotter';

MERGE (s:TradingStrategy {name: 'Volatility-Adjusted Position Sizing'})
SET s.category = 'position_sizing',
    s.book_source = 'Quantitative Trading',
    s.book_author = 'Ernest P. Chan',
    s.description = 'Target constant dollar volatility per position. Shares = (Target Vol × Equity) / (Asset Daily Vol × Price). Naturally reduces size during high-vol regimes and increases during quiet markets.',
    s.entry_signal = 'Set target daily P&L volatility (e.g. 0.5–1% of equity). Divide by asset ATR or realised vol to get share count.',
    s.exit_signal = 'Re-size daily as vol changes. Exit if position vol exceeds 2× target (regime change signal).',
    s.risk_management = 'Cap any single position at 20% of portfolio. Use Exponential Weighted Moving Average vol for faster responsiveness.',
    s.timeframe = 'daily rebalance',
    s.asset_class = 'equities, futures, ETFs',
    s.menu_context = 'Blotter';

// ── Stop-Loss and Exit Strategies ─────────────────────────────────────────────

MERGE (s:TradingStrategy {name: 'ATR-Based Stop Loss'})
SET s.category = 'risk_management',
    s.book_source = 'How To Make Money In Stocks',
    s.book_author = "William J. O'Neil",
    s.description = 'Place stop loss at 2–3× Average True Range (ATR) below entry for long positions. ATR captures natural market noise — stops inside ATR get hit randomly. CAN SLIM uses 7–8% hard stop as alternative.',
    s.entry_signal = 'Buy on breakout above resistance or pivot point. ATR(14) gives baseline noise level.',
    s.exit_signal = 'Stop: Entry - 2.5×ATR. Target: Entry + 5×ATR (2:1 R-multiple minimum). Trail stop up 1×ATR after 2×ATR gain.',
    s.risk_management = 'Never hold a position with >8% loss (O\'Neil rule). ATR widens in high-vol markets — reduce position size proportionally.',
    s.timeframe = 'swing trading (days to weeks)',
    s.asset_class = 'equities',
    s.menu_context = 'Blotter';

MERGE (s:TradingStrategy {name: 'Trailing Stop Exit'})
SET s.category = 'risk_management',
    s.book_source = 'Quantitative Trading',
    s.book_author = 'Ernest P. Chan',
    s.description = 'Dynamic stop that trails the highest price reached since entry. Locks in profits while giving room for trend continuation. Chandelier stop: Stop = Highest High - 3×ATR.',
    s.entry_signal = 'Enter on trend confirmation (momentum signal, breakout, moving average crossover).',
    s.exit_signal = 'Trail stop = Peak Price - n×ATR (n=2 for aggressive, n=3 for trend following). Exit when price crosses below trail.',
    s.risk_management = 'Initialise trailing stop at hard 2% max loss. Activate trailing mechanism once position is 1R in profit.',
    s.timeframe = 'momentum / trend following',
    s.asset_class = 'equities, futures, ETFs',
    s.menu_context = 'Blotter';

MERGE (s:TradingStrategy {name: 'R-Multiple Profit Target'})
SET s.category = 'risk_management',
    s.book_source = 'How To Make Money In Stocks',
    s.book_author = "William J. O'Neil",
    s.description = 'Set profit target as a multiple of initial risk (R). Minimum 2R target ensures positive expectancy even with <50% win rate. E[P] = p×reward - (1-p)×R > 0 requires p×(reward/R) > 1-p.',
    s.entry_signal = 'Determine stop loss (= 1R) before entry. Set target at 2R minimum, ideally 3R for trend trades.',
    s.exit_signal = 'Exit half position at 2R, trail stop to breakeven. Let remainder run with trailing stop for extended gains.',
    s.risk_management = 'Track expectancy = (p × avg_win) - ((1-p) × avg_loss). System viable if expectancy > 0 and >2R average win.',
    s.timeframe = 'swing trading',
    s.asset_class = 'equities, options',
    s.menu_context = 'Blotter';

// ── Alpha Generation and Attribution Strategies ───────────────────────────────

MERGE (s:TradingStrategy {name: 'Alpha Separation via Hedged Overlay'})
SET s.category = 'alpha_generation',
    s.book_source = 'Finding Alphas',
    s.book_author = 'Igor Tulchinsky et al.',
    s.description = 'Isolate Jensen alpha by hedging out market beta: hedge = β × index_position. Creates market-neutral exposure to pure stock-specific alpha. Separates skill from beta luck.',
    s.entry_signal = 'When attribution shows high alpha (>0) but elevated beta (>1.2): short β × market ETF to neutralise systematic exposure.',
    s.exit_signal = 'Remove hedge when beta normalises to 0.8–1.0 range or when alpha deteriorates (IC < 0.05 rolling 60d).',
    s.risk_management = 'Monitor alpha decay: if Jensen α turns negative for 10+ consecutive days, exit long leg and reassess factor exposure.',
    s.timeframe = 'medium-term (weeks to months)',
    s.asset_class = 'equities, ETFs',
    s.menu_context = 'Blotter';

MERGE (s:TradingStrategy {name: 'Momentum Tilt on Winning Positions'})
SET s.category = 'alpha_generation',
    s.book_source = 'Finding Alphas',
    s.book_author = 'Igor Tulchinsky et al.',
    s.description = 'Add to positions showing sustained positive alpha and momentum. Winners keep winning in the short run (Jegadeesh & Titman 1993, 3-12mo momentum). Cut underperformers ruthlessly.',
    s.entry_signal = 'Add when: unrealized P&L% > +10%, RSI 40-65 (not overbought), alpha positive in attribution, above 20-day SMA.',
    s.exit_signal = 'Begin trimming when RSI > 70 or position reaches 3× initial size. Full exit if price breaks 20-day SMA decisively.',
    s.risk_management = 'Never let any single position exceed 20% of portfolio. Add in tranches (1/3 at a time) to manage entry risk.',
    s.timeframe = 'medium-term momentum (3–12 months)',
    s.asset_class = 'equities',
    s.menu_context = 'Blotter';

MERGE (s:TradingStrategy {name: 'Cut Losers Quickly (Loss Minimisation)'})
SET s.category = 'risk_management',
    s.book_source = 'How To Make Money In Stocks',
    s.book_author = "William J. O'Neil",
    s.description = 'CAN SLIM Rule: Cut all losses at 7-8% maximum without exception. Preserving capital is the first rule. A 50% loss requires 100% gain to recover; a 7% loss requires only 7.5% gain.',
    s.entry_signal = 'Set hard stop at 7–8% below entry cost (O\'Neil) or 2.5×ATR (technical). Whichever is smaller.',
    s.exit_signal = 'No exceptions: exit when stop is hit. Do not average down into losing positions unless thesis explicitly supports it.',
    s.risk_management = 'Keep a loss journal: analyse every stopped-out trade monthly to identify timing/entry errors. Track P&L attribution: are losses alpha or beta-driven?',
    s.timeframe = 'all timeframes',
    s.asset_class = 'equities',
    s.menu_context = 'Blotter';

// ── Portfolio-Level Blotter Strategies ───────────────────────────────────────

MERGE (s:TradingStrategy {name: 'Portfolio Beta Hedging'})
SET s.category = 'hedging',
    s.book_source = 'Options, Futures and Other Derivatives',
    s.book_author = 'John C. Hull',
    s.description = 'Reduce market exposure when portfolio beta is elevated. Hedge ratio: N = (β_target - β_current) × Portfolio_Value / Index_Value. Use index futures or ETFs for cost-effective hedge.',
    s.entry_signal = 'Initiate hedge when attribution shows beta contribution dominates alpha: β·R_m > α. Target β_hedged = 0.5–0.8.',
    s.exit_signal = 'Remove hedge when beta normalises or when market regime shifts bullish (VIX < 15, price above 200-day MA).',
    s.risk_management = 'Monitor hedge ratio daily as portfolio positions change. Rebalance hedge weekly or when portfolio beta drifts >0.2 from target.',
    s.timeframe = 'tactical (days to weeks)',
    s.asset_class = 'equities, index futures',
    s.menu_context = 'Blotter';

MERGE (s:TradingStrategy {name: 'Systematic Trade Journal Review'})
SET s.category = 'process',
    s.book_source = 'The Disciplined Trader',
    s.book_author = 'Mark Douglas',
    s.description = 'Systematic weekly review of blotter trades: categorise by outcome (win/loss), attribution source (alpha/beta/factor/residual), and behavioural pattern. Remove emotional bias through statistical process.',
    s.entry_signal = 'Review every Sunday: (1) rank trades by P&L, (2) compute win rate and profit factor, (3) identify recurring patterns in losers.',
    s.exit_signal = 'Retire any strategy with negative expectancy over 30+ trades. Increase allocation to consistently profitable strategies.',
    s.risk_management = 'Track psychological biases: overconfidence after wins, loss aversion after losses. Keep position sizing consistent regardless of recent performance.',
    s.timeframe = 'weekly review cycle',
    s.asset_class = 'all',
    s.menu_context = 'Blotter';

// ── Link strategies to Blotter Menu ──────────────────────────────────────────

MATCH (m:Menu {name: 'Blotter'})
MATCH (s:TradingStrategy)
WHERE s.menu_context = 'Blotter'
MERGE (m)-[:HAS_STRATEGY]->(s);

// ── Link strategies to KnowledgeSources ──────────────────────────────────────

MATCH (s:TradingStrategy {book_source: 'Quantitative Trading'})
MATCH (ks:KnowledgeSource {title: 'Quantitative Trading'})
MERGE (s)-[:SOURCED_FROM]->(ks);

MATCH (s:TradingStrategy {book_source: 'How To Make Money In Stocks'})
MATCH (ks:KnowledgeSource {title: 'How To Make Money In Stocks'})
MERGE (s)-[:SOURCED_FROM]->(ks);

MATCH (s:TradingStrategy {book_source: 'Options, Futures and Other Derivatives'})
MATCH (ks:KnowledgeSource {title: 'Options, Futures and Other Derivatives'})
MERGE (s)-[:SOURCED_FROM]->(ks);

MATCH (s:TradingStrategy {book_source: 'Finding Alphas'})
MATCH (ks:KnowledgeSource {title: 'Finding Alphas'})
MERGE (s)-[:SOURCED_FROM]->(ks);

// ── Blotter-specific Metric Interpretation nodes ──────────────────────────────

MERGE (mi:MetricInterpretation {
  metric_name: 'Win Rate',
  condition: 'low',
  min_value: 0.0,
  max_value: 40.0
})
SET mi.interpretation = 'Win rate below 40% — requires high reward/risk ratio (>3R) to maintain positive expectancy. Review entry criteria and stop placement.',
    mi.action = 'Analyse losing trades for common patterns. Widen stop to reduce premature exits or tighten entry criteria.',
    mi.menu_context = 'Blotter',
    mi.confidence = 0.85;

MERGE (mi:MetricInterpretation {
  metric_name: 'Win Rate',
  condition: 'acceptable',
  min_value: 40.0,
  max_value: 60.0
})
SET mi.interpretation = 'Win rate 40–60% — typical for trend-following systems. Ensure R-multiple > 1.5 for positive expectancy.',
    mi.action = 'Calculate profit factor = total wins / total losses. System viable if profit factor > 1.5.',
    mi.menu_context = 'Blotter',
    mi.confidence = 0.8;

MERGE (mi:MetricInterpretation {
  metric_name: 'Win Rate',
  condition: 'high',
  min_value: 60.0,
  max_value: 100.0
})
SET mi.interpretation = 'Win rate >60% — good consistency. Verify average winner is not being cut too short (mean reversion tendency).',
    mi.action = 'Check average win vs average loss. If avg_win < avg_loss, the system may be running losers too long.',
    mi.menu_context = 'Blotter',
    mi.confidence = 0.8;

MERGE (mi:MetricInterpretation {
  metric_name: 'Jensen Alpha',
  condition: 'negative',
  min_value: -100.0,
  max_value: 0.0
})
SET mi.interpretation = 'Negative Jensen alpha — portfolio underperforming its CAPM-predicted return after accounting for beta risk. Market exposure (beta) is not being rewarded.',
    mi.action = 'Review stock selection process. Consider reducing beta exposure and focusing on securities with confirmed positive alpha.',
    mi.menu_context = 'Blotter',
    mi.confidence = 0.9;

MERGE (mi:MetricInterpretation {
  metric_name: 'Jensen Alpha',
  condition: 'marginal_positive',
  min_value: 0.0,
  max_value: 2.0
})
SET mi.interpretation = 'Marginal positive alpha (0–2% annualised). Statistically marginal — likely within noise band of CAPM. Monitor closely over next quarter.',
    mi.action = 'Run Appraisal Ratio = α / σ_residual. Value >0.5 indicates alpha is statistically significant relative to idiosyncratic risk.',
    mi.menu_context = 'Blotter',
    mi.confidence = 0.75;

MERGE (mi:MetricInterpretation {
  metric_name: 'Jensen Alpha',
  condition: 'strong_positive',
  min_value: 2.0,
  max_value: 100.0
})
SET mi.interpretation = 'Strong positive alpha (>2% annualised) — genuine stock-picking skill or factor edge. Preserve this by avoiding benchmark-hugging and maintaining active share.',
    mi.action = 'Consider adding to top alpha contributors. Hedge beta with index ETF to isolate pure alpha. Monitor for alpha decay.',
    mi.menu_context = 'Blotter',
    mi.confidence = 0.85;

MERGE (mi:MetricInterpretation {
  metric_name: 'Portfolio Beta',
  condition: 'low',
  min_value: 0.0,
  max_value: 0.6
})
SET mi.interpretation = 'Low beta (<0.6) — defensive positioning. Portfolio will underperform in strong bull markets but provides downside protection.',
    mi.action = 'Appropriate in risk-off environments. Consider increasing beta exposure if market regime is bullish (VIX < 15).',
    mi.menu_context = 'Blotter',
    mi.confidence = 0.8;

MERGE (mi:MetricInterpretation {
  metric_name: 'Portfolio Beta',
  condition: 'market_neutral',
  min_value: 0.6,
  max_value: 1.2
})
SET mi.interpretation = 'Market-aligned beta (0.6–1.2) — portfolio moves broadly with market. Alpha contribution is the key differentiator.',
    mi.action = 'Focus on stock selection and attribution analysis to identify alpha sources. Maintain beta near 1.0 for benchmark tracking.',
    mi.menu_context = 'Blotter',
    mi.confidence = 0.8;

MERGE (mi:MetricInterpretation {
  metric_name: 'Portfolio Beta',
  condition: 'elevated',
  min_value: 1.2,
  max_value: 10.0
})
SET mi.interpretation = 'Elevated beta (>1.2) — concentrated market risk. Portfolio amplifies both gains and losses. Drawdown risk is elevated.',
    mi.action = 'Consider beta hedge: short N = (β - 1.0) × Portfolio_Value / SPY_Price of index ETF. Review position sizes.',
    mi.menu_context = 'Blotter',
    mi.confidence = 0.85;
