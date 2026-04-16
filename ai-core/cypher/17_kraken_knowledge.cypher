// Kraken Integration - Dynamic Knowledge Graph Schema
// DESIGN: No hardcoded tickers. Markets discovered dynamically from live data.
// Strategies linked to quant knowledge sources via GraphRAG.

// ============================================================================
// 1. KRAKEN EXCHANGE (Execution Venue)
// ============================================================================

MERGE (kraken:Exchange {name: 'Kraken', type: 'centralized'})
ON CREATE SET
    kraken.api = 'kraken-cli',
    kraken.features = ['spot', 'futures', 'margin'],
    kraken.sandbox = true,
    kraken.createdAt = datetime().epochMillis,
    kraken.universalPairs = true,
    kraken.pairFormat = 'BASE/QUOTE',
    kraken.description = 'CEX execution venue with CLI support for programmatic trading'
RETURN kraken;

// ============================================================================
// 2. STRATEGY TEMPLATES (linked to quant knowledge graph)
// ============================================================================

// Momentum Strategy - linked to quant concepts
MERGE (momentum:TradingStrategy {name: 'KrakenMomentum', type: 'momentum', exchange: 'Kraken'})
ON CREATE SET
    momentum.lookback = 252,
    momentum.threshold = 0.02,
    momentum.description = 'Time-series momentum. Works with ANY pair. Long when momentum > threshold.',
    momentum.category = 'trend_following',
    momentum.riskLevel = 'medium',
    momentum.universal = true,
    momentum.applicableMarkets = 'all',
    momentum.signalFormula = 'sign(ts_rank(close, lookback))',
    momentum.createdAt = datetime().epochMillis;

// Mean Reversion Strategy
MERGE (meanrev:TradingStrategy {name: 'KrakenMeanReversion', type: 'mean_reversion', exchange: 'Kraken'})
ON CREATE SET
    meanrev.lookback = 63,
    meanrev.threshold = 2.0,
    meanrev.description = 'Z-score mean reversion. Long when z < -threshold, short when z > threshold.',
    meanrev.category = 'mean_reversion',
    meanrev.riskLevel = 'medium',
    meanrev.universal = true,
    meanrev.applicableMarkets = 'all',
    meanrev.signalFormula = 'sign(-zscore(close, lookback))',
    meanrev.mathModel = 'Ornstein-Uhlenbeck: dX = κ(θ-X)dt + σdW',
    meanrev.createdAt = datetime().epochMillis;

// Volatility Breakout Strategy
MERGE (volbreakout:TradingStrategy {name: 'KrakenVolatilityBreakout', type: 'breakout', exchange: 'Kraken'})
ON CREATE SET
    volbreakout.lookback = 20,
    volbreakout.threshold = 2.5,
    volbreakout.description = 'Bollinger Band breakout. Trades breakouts above/below volatility bands.',
    volbreakout.category = 'breakout',
    volbreakout.riskLevel = 'high',
    volbreakout.universal = true,
    volbreakout.applicableMarkets = 'all',
    volbreakout.signalFormula = 'sign(close - bb_mid) * (abs(close - bb_mid) > threshold * bb_std)',
    volbreakout.createdAt = datetime().epochMillis;

// ============================================================================
// 3. LINK STRATEGIES TO QUANT KNOWLEDGE (GraphRAG)
// ============================================================================

// Link Momentum to quant concepts
OPTIONAL MATCH (mom:TransactConcept {name: 'Momentum'})
MATCH (s:TradingStrategy {name: 'KrakenMomentum'})
FOREACH (m IN CASE WHEN mom IS NOT NULL THEN [mom] ELSE [] END |
    MERGE (s)-[:BASED_ON]->(m))
WITH s
OPTIONAL MATCH (ts:TransactConcept {name: 'Time Series'})
FOREACH (t IN CASE WHEN ts IS NOT NULL THEN [ts] ELSE [] END |
    MERGE (s)-[:BASED_ON]->(t))
WITH s
OPTIONAL MATCH (ks:KnowledgeSource {id: 'chan_quant_trading'})
FOREACH (k IN CASE WHEN ks IS NOT NULL THEN [ks] ELSE [] END |
    MERGE (s)-[:SOURCED_FROM {chapter: 'Momentum Strategies'}]->(k))
WITH s
OPTIONAL MATCH (ks2:KnowledgeSource {id: 'tulchinsky_finding_alphas'})
FOREACH (k IN CASE WHEN ks2 IS NOT NULL THEN [ks2] ELSE [] END |
    MERGE (s)-[:SOURCED_FROM {chapter: 'Cross-Sectional Momentum'}]->(k2));

// Link Mean Reversion to quant concepts
OPTIONAL MATCH (mr:TransactConcept {name: 'Mean Reversion'})
MATCH (s:TradingStrategy {name: 'KrakenMeanReversion'})
FOREACH (m IN CASE WHEN mr IS NOT NULL THEN [mr] ELSE [] END |
    MERGE (s)-[:BASED_ON]->(m))
WITH s
OPTIONAL MATCH (vol:TransactConcept {name: 'Volatility'})
FOREACH (v IN CASE WHEN vol IS NOT NULL THEN [vol] ELSE [] END |
    MERGE (s)-[:BASED_ON]->(v))
WITH s
OPTIONAL MATCH (ks:KnowledgeSource {id: 'chan_quant_trading'})
FOREACH (k IN CASE WHEN ks IS NOT NULL THEN [ks] ELSE [] END |
    MERGE (s)-[:SOURCED_FROM {chapter: 'Mean Reversion'}]->(k))
WITH s
OPTIONAL MATCH (ks2:KnowledgeSource {id: 'successful_algo_trading'})
FOREACH (k IN CASE WHEN ks2 IS NOT NULL THEN [ks2] ELSE [] END |
    MERGE (s)-[:SOURCED_FROM {chapter: 'Statistical Arbitrage'}]->(k));

// Link Volatility Breakout to quant concepts
OPTIONAL MATCH (vol:TransactConcept {name: 'Volatility'})
MATCH (s:TradingStrategy {name: 'KrakenVolatilityBreakout'})
FOREACH (v IN CASE WHEN vol IS NOT NULL THEN [vol] ELSE [] END |
    MERGE (s)-[:BASED_ON]->(v))
WITH s
OPTIONAL MATCH (bb:TransactConcept {name: 'Bollinger Bands'})
FOREACH (b IN CASE WHEN bb IS NOT NULL THEN [bb] ELSE [] END |
    MERGE (s)-[:BASED_ON]->(b))
WITH s
OPTIONAL MATCH (ks:KnowledgeSource {id: 'nison_candlestick'})
FOREACH (k IN CASE WHEN ks IS NOT NULL THEN [ks] ELSE [] END |
    MERGE (s)-[:SOURCED_FROM {chapter: 'Volatility Patterns'}]->(k));

// ============================================================================
// 4. RISK PARAMETERS (Exchange-level)
// ============================================================================

MERGE (risk:RiskParameters {exchange: 'Kraken', id: 'kraken_default_risk'})
ON CREATE SET
    risk.max_position_size = 0.1,
    risk.max_leverage = 2.0,
    risk.daily_loss_limit = 0.05,
    risk.max_drawdown = 0.20,
    risk.circuit_breaker_losses = 3,
    risk.max_open_positions = 5,
    risk.stop_loss_pct = 0.05,
    risk.take_profit_pct = 0.10,
    risk.universal = true;

MATCH (s:TradingStrategy {exchange: 'Kraken'}), (r:RiskParameters {exchange: 'Kraken'})
MERGE (s)-[:GOVERNED_BY]->(r);

// ============================================================================
// 5. SIGNAL TYPES
// ============================================================================

MERGE (longSignal:SignalType {name: 'LONG', value: 1, description: 'Buy signal'})
MERGE (shortSignal:SignalType {name: 'SHORT', value: -1, description: 'Sell signal'})
MERGE (flatSignal:SignalType {name: 'FLAT', value: 0, description: 'No position'});

// ============================================================================
// 6. DYNAMIC MARKET DISCOVERY (run periodically)
// ============================================================================

// This query auto-discovers markets from Signal nodes and creates Market entities
MATCH (s:Signal)
WHERE NOT EXISTS {
    MATCH (:Market {symbol: s.market})-[:LISTED_ON]->(:Exchange)
}
WITH s, s.market AS symbol
WHERE symbol CONTAINS '/'
WITH symbol,
     split(symbol, '/')[0] AS base,
     split(symbol, '/')[1] AS quote
MERGE (m:Market {symbol: symbol, exchange: 'Kraken'})
ON CREATE SET
    m.base = base,
    m.quote = quote,
    m.active = true,
    m.discoveredAt = datetime().epochMillis,
    m.autoDiscovered = true
WITH m
MATCH (k:Exchange {name: 'Kraken'})
MERGE (m)-[:LISTED_ON]->(k)
RETURN m.symbol, m.base, m.quote;

// ============================================================================
// 7. VALIDATION ARTIFACT TYPES (for ERC-8004 / Audit Trail)
// ============================================================================

MERGE (artifactSignal:ValidationArtifactType {name: 'SIGNAL_GENERATION'})
ON CREATE SET artifactSignal.description = 'Trading signal with strategy, strength, timestamp'

MERGE (artifactRisk:ValidationArtifactType {name: 'RISK_CHECK'})
ON CREATE SET artifactRisk.description = 'Risk validation before trade execution'

MERGE (artifactExecution:ValidationArtifactType {name: 'TRADE_EXECUTION'})
ON CREATE SET artifactExecution.description = 'Trade execution record with price, volume, fees'

MERGE (artifactPerformance:ValidationArtifactType {name: 'PERFORMANCE_UPDATE'})
ON CREATE SET artifactPerformance.description = 'PnL and performance metrics update';

// ============================================================================
// 8. SUMMARY
// ============================================================================

MATCH (k:Exchange {name: 'Kraken'})
OPTIONAL MATCH (m:Market {exchange: 'Kraken'})
OPTIONAL MATCH (s:TradingStrategy {exchange: 'Kraken'})
OPTIONAL MATCH (r:RiskParameters {exchange: 'Kraken'})
RETURN
    k.name AS exchange,
    k.universalPairs AS supports_universal_pairs,
    count(DISTINCT m) AS markets,
    count(DISTINCT s) AS strategies,
    count(DISTINCT r) AS risk_configs;
