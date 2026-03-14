// ============================================================
// 14_cross_domain_relationships.cypher
// Cross-domain bridge relationships:
//   (A) Traditional quant → DeFi equivalents
//   (B) DeFi concept internal graph (primitives → risks → protocols)
//   (C) Trading strategies ↔ DeFi mechanisms
//   (D) Formula ↔ Concept dependencies (new DeFi formulas)
//   (E) Menu membership for new nodes
// Run after 13_defi_formulas.cypher
// ============================================================

// ── (A) QUANT FINANCE → DEFI BRIDGES ─────────────────────────

// VaR family bridges
MATCH (trad:TransactConcept {name: 'Value at Risk'})
MATCH (defi:TransactConcept {name: 'On-Chain VaR'})
MERGE (trad)-[:HAS_DEFI_EQUIVALENT {
  note: 'On-Chain VaR extends classical VaR with DeFi-specific addons: liquidation cascade risk and smart contract exploit risk',
  source: 'harvey_defi_future;m1_var_classical'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Historical VaR'})
MATCH (defi:TransactConcept {name: 'On-Chain VaR'})
MERGE (defi)-[:DEFI_EXTENDS {
  note: 'DeFi VaR uses historical simulation as base component, then adds on-chain specific layers',
  source: 'harvey_defi_future'
}]->(trad);

MATCH (trad:TransactConcept {name: 'Expected Shortfall'})
MATCH (defi:TransactConcept {name: 'Liquidation Risk'})
MERGE (trad)-[:QUANTIFIES_IN_DEFI {
  note: 'ES measures the average loss in the tail; in DeFi the tail event is a cascade liquidation, making ES the natural risk metric for liquidation risk',
  source: 'harvey_defi_future;m1_var_classical'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Stress Testing'})
MATCH (defi:TransactConcept {name: 'Black Swan in DeFi'})
MERGE (trad)-[:APPLIED_TO {
  note: 'DeFi stress testing must scenario-plan for on-chain black swans: oracle manipulation, governance attacks, flash loan exploits',
  source: 'harvey_defi_future'
}]->(defi);

// Sharpe/performance bridges
MATCH (trad:TransactConcept {name: 'Sharpe Ratio'})
MATCH (defi:TransactFormula {name: 'LP Net APY'})
MERGE (trad)-[:DEFI_ADAPTED_AS {
  note: 'LP Net APY = fee_APY + reward_APY - IL_rate - gas_rate; analogous to Sharpe: total net yield divided by position size is the DeFi LP return metric',
  source: 'coingecko_how_to_defi_advanced;harvey_defi_future'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Information Ratio'})
MATCH (defi:TradingStrategy {name: 'Alpha Signal Construction'})
MERGE (trad)-[:MEASURES_QUALITY_OF {
  note: 'IR = active_return / tracking_error; in DeFi alpha research, IR measures signal quality of on-chain factor signals against the benchmark',
  source: 'm6_factor_investing;algo_trading_chan'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Alpha'})
MATCH (defi:TradingStrategy {name: 'Alpha Signal Construction'})
MERGE (trad)-[:IS_TARGET_OF {
  note: 'Alpha signal construction aims to find the α = r_p - [r_f + β(r_m - r_f)] that is reliably positive across crypto markets',
  source: 'algo_trading_chan;algo_trading_tulchinsky'
}]->(defi);

// Kelly/sizing bridges
MATCH (trad:TransactConcept {name: 'Kelly Criterion'})
MATCH (defi:TradingStrategy {name: 'Liquidity Provision Optimization'})
MERGE (trad)-[:APPLIED_IN {
  note: 'Kelly f* = p - q maximizes log-wealth; LP position sizing across price ranges in Uni V3 adapts Kelly for fee revenue vs IL tradeoff',
  source: 'm5_kelly_risk_parity;harvey_defi_future'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Fractional Kelly'})
MATCH (defi:TradingStrategy {name: 'Liquidity Provision Optimization'})
MERGE (trad)-[:APPLIED_IN {
  note: 'Fractional Kelly (κ<1) used when LP parameters are estimated with uncertainty; avoids overbetting on volatile DeFi fee rates',
  source: 'm5_kelly_risk_parity'
}]->(defi);

// HRP / portfolio construction bridges
MATCH (trad:TransactConcept {name: 'Hierarchical Risk Parity'})
MATCH (defi:TradingStrategy {name: 'Liquidity Provision Optimization'})
MERGE (trad)-[:APPLIED_IN {
  note: 'HRP cluster-then-allocate logic applies to DeFi LP portfolio: cluster correlated pools (same base asset), then allocate capital inversely proportional to cluster variance',
  source: 'm7_info_theory_graphs;harvey_defi_future'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Risk Parity'})
MATCH (defi:TradingStrategy {name: 'Delta-Neutral Yield'})
MERGE (trad)-[:CONCEPTUALLY_SIMILAR_TO {
  note: 'Delta-neutral yield targets equal risk contribution from long spot + short perp legs; mirrors risk parity equal-RC across positions',
  source: 'm5_kelly_risk_parity;harvey_defi_future'
}]->(defi);

// Greeks → DeFi bridges
MATCH (trad:TransactConcept {name: 'Delta'})
MATCH (defi:TradingStrategy {name: 'Delta-Neutral Yield'})
MERGE (trad)-[:IS_CONCEPT_BEHIND {
  note: 'Δ=0 delta-neutral strategy: spot long + perp short to eliminate directional exposure while capturing funding rate',
  source: 'taleb_dynamic_hedging;harvey_defi_future'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Implied Volatility'})
MATCH (defi:TransactConcept {name: 'Impermanent Loss'})
MERGE (trad)-[:POSITIVELY_CORRELATED_WITH {
  note: 'Higher IV → larger price moves → greater IL for LPs. LP providing liquidity during high-IV periods faces higher impermanent loss risk',
  source: 'harvey_defi_future;coingecko_how_to_defi_advanced'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Stochastic Volatility'})
MATCH (defi:TransactConcept {name: 'Concentrated Liquidity'})
MERGE (trad)-[:INFORMS_RANGE_SELECTION_IN {
  note: 'Uni V3 range selection: model stochastic vol (e.g., Heston) to estimate P(price stays in range); range width = f(σ_realized)',
  source: 'hull_options;harvey_defi_future'
}]->(defi);

// Arbitrage pricing
MATCH (trad:TransactConcept {name: 'Risk-Neutral Measure'})
MATCH (defi:TransactFormula {name: 'No-Arbitrage Pricing (FTAP)'})
MERGE (trad)-[:IS_FOUNDATION_OF {
  note: 'FTAP: no arbitrage ⟺ ∃ equivalent martingale measure Q; same Q framework applies to DeFi structured products replacing r with DeFi lending rate',
  source: 'math_arbitrage;baxter_financial_calculus'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Put-Call Parity'})
MATCH (defi:TransactFormula {name: 'Flash Loan Arbitrage Profit'})
MERGE (trad)-[:ANALOGOUS_TO {
  note: 'Put-call parity enforces no-arbitrage bounds in TradFi; flash loan arbitrage enforces price parity across DEXs, playing the same no-arbitrage role',
  source: 'math_arbitrage;harvey_defi_future'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Monte Carlo Simulation'})
MATCH (defi:TradingStrategy {name: 'Cross-DEX Arbitrage'})
MERGE (trad)-[:USED_TO_BACKTEST {
  note: 'Monte Carlo path simulation used to stress-test flash loan arbitrage across simulated DEX liquidity and gas price scenarios',
  source: 'algo_trading_chan;harvey_defi_future'
}]->(defi);

// Factor investing bridges
MATCH (trad:TransactConcept {name: 'Factor Model'})
MATCH (defi:TradingStrategy {name: 'Alpha Signal Construction'})
MERGE (trad)-[:IS_FRAMEWORK_FOR {
  note: 'On-chain factor model: R_i = α + β_on-chain_activity·f_activity + β_TVL·f_tvl + β_fees·f_fees + ε',
  source: 'm6_factor_investing;algo_trading_tulchinsky'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Fama-French Factors'})
MATCH (defi:TradingStrategy {name: 'Alpha Signal Construction'})
MERGE (trad)-[:INSPIRES_ONCHAIN_EQUIVALENT {
  note: 'DeFi factors analogous to FF5: size(TVL), value(P/E ratio proxy via fee yield), momentum(price+volume), profitability(protocol revenue), investment(emissions rate)',
  source: 'm6_factor_investing;harvey_defi_future'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Factor Momentum'})
MATCH (defi:TradingStrategy {name: 'Momentum'})
MERGE (trad)-[:HAS_DEFI_INSTANCE {
  note: 'Crypto momentum: asset-level price/volume momentum is well-documented; factor-level momentum in DeFi TVL/fee factors also exhibits persistence',
  source: 'm6_factor_investing;algo_trading_chan'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Smart Beta'})
MATCH (defi:TradingStrategy {name: 'Machine Learning Alpha'})
MERGE (trad)-[:EVOLVED_INTO_IN_DEFI {
  note: 'Smart beta → ML alpha: systematic rule-based crypto allocation using on-chain signals is the DeFi smart beta analog',
  source: 'm6_factor_investing;algo_trading_tulchinsky'
}]->(defi);

// Behavioral finance bridges
MATCH (trad:TransactConcept {name: 'Prospect Theory'})
MATCH (defi:TransactConcept {name: 'MEV'})
MERGE (trad)-[:EXPLAINS_EXPLOITABILITY_VIA {
  note: 'Retail traders overweight small probability of big gains (Prospect Theory probability weighting) making them predictable targets for MEV bots seeking sandwich opportunities',
  source: 'm4_behavioral_finance;harvey_defi_future'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Loss Aversion'})
MATCH (defi:TransactConcept {name: 'Liquidation Risk'})
MERGE (trad)-[:AMPLIFIES {
  note: 'Loss-averse borrowers delay adding collateral during price drops, increasing liquidation cascade probability (see Harvey: behavioral DeFi risk section)',
  source: 'm4_behavioral_finance;harvey_defi_future'
}]->(defi);

MATCH (trad:TransactConcept {name: 'Crowding'})
MATCH (defi:TransactConcept {name: 'Liquidation Risk'})
MERGE (trad)-[:AMPLIFIES {
  note: 'DeFi liquidation cascades are the crowded-trade analog: all leveraged longs share the same liquidation levels, causing synchronized selling',
  source: 'm6_factor_investing;harvey_defi_future'
}]->(defi);

// Backtesting
MATCH (trad:TransactConcept {name: 'Backtesting'})
MATCH (defi:TradingStrategy {name: 'Momentum'})
MERGE (trad)-[:VALIDATES]->(defi);

MATCH (trad:TransactConcept {name: 'Backtesting'})
MATCH (defi:TradingStrategy {name: 'Mean Reversion'})
MERGE (trad)-[:VALIDATES]->(defi);

MATCH (trad:TransactConcept {name: 'Backtesting'})
MATCH (defi:TradingStrategy {name: 'Statistical Arbitrage'})
MERGE (trad)-[:VALIDATES]->(defi);

MATCH (trad:TransactConcept {name: 'Backtesting'})
MATCH (defi:TradingStrategy {name: 'Cross-DEX Arbitrage'})
MERGE (trad)-[:VALIDATES]->(defi);

// ── (B) DEFI INTERNAL CONCEPT GRAPH ───────────────────────────

// AMM taxonomy
MATCH (parent:TransactConcept {name: 'AMM'})
MATCH (child:TransactConcept {name: 'CPMM'})
MERGE (parent)-[:HAS_VARIANT]->(child);

MATCH (parent:TransactConcept {name: 'AMM'})
MATCH (child:TransactConcept {name: 'Concentrated Liquidity'})
MERGE (parent)-[:HAS_VARIANT]->(child);

MATCH (parent:TransactConcept {name: 'AMM'})
MATCH (child:TransactConcept {name: 'Liquidity Pool'})
MERGE (parent)-[:OPERATES_VIA]->(child);

MATCH (parent:TransactConcept {name: 'AMM'})
MATCH (child:TransactConcept {name: 'DEX'})
MERGE (child)-[:BUILT_ON]->(parent);

// Impermanent loss relationships
MATCH (cause:TransactConcept {name: 'CPMM'})
MATCH (effect:TransactConcept {name: 'Impermanent Loss'})
MERGE (cause)-[:CAUSES]->(effect);

MATCH (mitigator:TransactConcept {name: 'Concentrated Liquidity'})
MATCH (risk:TransactConcept {name: 'Impermanent Loss'})
MERGE (mitigator)-[:AMPLIFIES {
  note: 'Concentrated liquidity increases fee APY but also amplifies IL relative to wide-range LP when price exits the range',
  source: 'harvey_defi_future'
}]->(risk);

MATCH (impact:TransactConcept {name: 'Impermanent Loss'})
MATCH (formula:TransactFormula {name: 'LP Net APY'})
MERGE (impact)-[:REDUCES]->(formula);

// Oracle relationships
MATCH (oracle:TransactConcept {name: 'Oracle'})
MATCH (risk:TransactConcept {name: 'Oracle Risk'})
MERGE (oracle)-[:CREATES_RISK]->(risk);

MATCH (twap:TransactConcept {name: 'TWAP Oracle'})
MATCH (risk:TransactConcept {name: 'Oracle Risk'})
MERGE (twap)-[:MITIGATES]->(risk);

MATCH (twap:TransactConcept {name: 'TWAP Oracle'})
MATCH (oracle:TransactConcept {name: 'Oracle'})
MERGE (twap)-[:IS_VARIANT_OF]->(oracle);

MATCH (oracle:TransactConcept {name: 'Oracle'})
MATCH (lend:TransactConcept {name: 'Collateralized Lending'})
MERGE (oracle)-[:ENABLES]->(lend);

MATCH (oracle:TransactConcept {name: 'Oracle'})
MATCH (liq:TransactConcept {name: 'Liquidation Risk'})
MERGE (oracle)-[:TRIGGERS]->(liq);

// Lending relationships
MATCH (lending:TransactConcept {name: 'Collateralized Lending'})
MATCH (liq:TransactConcept {name: 'Liquidation Risk'})
MERGE (lending)-[:CREATES_RISK]->(liq);

MATCH (formula:TransactFormula {name: 'Health Factor'})
MATCH (liq:TransactConcept {name: 'Liquidation Risk'})
MERGE (formula)-[:QUANTIFIES]->(liq);

MATCH (formula:TransactFormula {name: 'Loan-to-Value'})
MATCH (lending:TransactConcept {name: 'Collateralized Lending'})
MERGE (formula)-[:PARAMETERIZES]->(lending);

MATCH (formula:TransactFormula {name: 'Utilization Rate'})
MATCH (formula2:TransactFormula {name: 'Aave Borrow Rate'})
MERGE (formula2)-[:DEPENDS_ON]->(formula);

// MEV taxonomy
MATCH (parent:TransactConcept {name: 'MEV'})
MATCH (child:TransactConcept {name: 'Sandwich Attack'})
MERGE (parent)-[:HAS_SUBTYPE]->(child);

MATCH (mitigator:TransactConcept {name: 'Proposer-Builder Separation'})
MATCH (mev:TransactConcept {name: 'MEV'})
MERGE (mitigator)-[:MANAGES]->(mev);

MATCH (mitigator:TransactConcept {name: 'MEV-Protected RPC'})
MATCH (attack:TransactConcept {name: 'Sandwich Attack'})
MERGE (mitigator)-[:MITIGATES]->(attack);

MATCH (mev:TransactConcept {name: 'MEV'})
MATCH (risk:TransactConcept {name: 'DEX Risk'})
MERGE (mev)-[:CONTRIBUTES_TO]->(risk);

// Flash loan relationships
MATCH (fl:TransactConcept {name: 'Flash Loan'})
MATCH (strat:TradingStrategy {name: 'Cross-DEX Arbitrage'})
MERGE (fl)-[:ENABLES]->(strat);

MATCH (fl:TransactConcept {name: 'Flash Loan'})
MATCH (formula:TransactFormula {name: 'Flash Loan Arbitrage Profit'})
MERGE (fl)-[:QUANTIFIED_BY]->(formula);

MATCH (fl:TransactConcept {name: 'Flash Loan'})
MATCH (risk:TransactConcept {name: 'Smart Contract Risk'})
MERGE (fl)-[:AMPLIFIES {
  note: 'Flash loans enable capital-efficient exploits; smart contract bugs exposed via flash-loan-powered attacks are more severe',
  source: 'harvey_defi_future'
}]->(risk);

// DeFi fundamentals
MATCH (defi:TransactConcept {name: 'Decentralized Finance'})
MATCH (comp:TransactConcept {name: 'Composability'})
MERGE (defi)-[:ENABLED_BY]->(comp);

MATCH (comp:TransactConcept {name: 'Composability'})
MATCH (risk:TransactConcept {name: 'Smart Contract Risk'})
MERGE (comp)-[:AMPLIFIES {
  note: 'Composability (money legos) creates cascading failure risk; exploit in one protocol propagates through composed protocols',
  source: 'harvey_defi_future'
}]->(risk);

MATCH (comp:TransactConcept {name: 'Composability'})
MATCH (fl:TransactConcept {name: 'Flash Loan'})
MERGE (fl)-[:EXEMPLIFIES]->(comp);

MATCH (gov:TransactConcept {name: 'Governance Token'})
MATCH (risk:TransactConcept {name: 'Governance Risk'})
MERGE (gov)-[:CREATES_RISK]->(risk);

MATCH (stablecoin:TransactConcept {name: 'Stablecoin'})
MATCH (oracle:TransactConcept {name: 'Oracle'})
MERGE (stablecoin)-[:DEPENDS_ON]->(oracle);

MATCH (stablecoin:TransactConcept {name: 'Stablecoin'})
MATCH (risk:TransactConcept {name: 'Regulatory Risk'})
MERGE (stablecoin)-[:SUBJECT_TO]->(risk);

// Layer 2 / EVM
MATCH (l2:TransactConcept {name: 'Layer 2 Scaling'})
MATCH (evm:TransactConcept {name: 'EVM'})
MERGE (l2)-[:EXTENDS]->(evm);

MATCH (zkp:TransactConcept {name: 'Zero-Knowledge Proof'})
MATCH (l2:TransactConcept {name: 'Layer 2 Scaling'})
MERGE (zkp)-[:ENABLES]->(l2);

MATCH (aa:TransactConcept {name: 'Account Abstraction'})
MATCH (evm:TransactConcept {name: 'EVM'})
MERGE (aa)-[:EXTENDS]->(evm);

MATCH (sc:TransactConcept {name: 'Smart Contract'})
MATCH (evm:TransactConcept {name: 'EVM'})
MERGE (sc)-[:RUNS_ON]->(evm);

MATCH (sc:TransactConcept {name: 'Smart Contract'})
MATCH (risk:TransactConcept {name: 'Smart Contract Risk'})
MERGE (sc)-[:CREATES_RISK]->(risk);

MATCH (gas:TransactConcept {name: 'Gas'})
MATCH (evm:TransactConcept {name: 'EVM'})
MERGE (gas)-[:METERS_EXECUTION_IN]->(evm);

MATCH (gas:TransactConcept {name: 'Gas'})
MATCH (formula:TransactFormula {name: 'EVM Gas Cost'})
MERGE (formula)-[:CALCULATES]->(gas);

MATCH (merkle:TransactConcept {name: 'Merkle Tree'})
MATCH (bc:TransactConcept {name: 'Blockchain'})
MERGE (merkle)-[:IS_DATA_STRUCTURE_OF]->(bc);

MATCH (formula:TransactFormula {name: 'Merkle Root'})
MATCH (merkle:TransactConcept {name: 'Merkle Tree'})
MERGE (formula)-[:DEFINES]->(merkle);

MATCH (ecdsa:TransactConcept {name: 'ECDSA Signature'})
MATCH (formula:TransactFormula {name: 'ECDSA Private to Public Key'})
MERGE (formula)-[:IS_COMPONENT_OF]->(ecdsa);

MATCH (ecc:TransactConcept {name: 'ECC'})
MATCH (ecdsa:TransactConcept {name: 'ECDSA Signature'})
MERGE (ecdsa)-[:USES]->(ecc);

MATCH (pos:TransactConcept {name: 'Proof of Stake'})
MATCH (bc:TransactConcept {name: 'Blockchain'})
MERGE (pos)-[:SECURES]->(bc);

MATCH (pos:TransactConcept {name: 'Proof of Stake'})
MATCH (pbs:TransactConcept {name: 'Proposer-Builder Separation'})
MERGE (pbs)-[:OPERATES_WITHIN]->(pos);

MATCH (bft:TransactConcept {name: 'Byzantine Fault Tolerance'})
MATCH (pos:TransactConcept {name: 'Proof of Stake'})
MERGE (bft)-[:IS_PREREQUISITE_FOR]->(pos);

// Yield farming
MATCH (yf:TransactConcept {name: 'Yield Farming'})
MATCH (lm:TransactConcept {name: 'Liquidity Mining'})
MERGE (yf)-[:INCLUDES]->(lm);

MATCH (yf:TransactConcept {name: 'Yield Farming'})
MATCH (formula:TransactFormula {name: 'LP Net APY'})
MERGE (yf)-[:EVALUATED_BY]->(formula);

MATCH (yf:TransactConcept {name: 'Yield Farming'})
MATCH (risk:TransactConcept {name: 'Smart Contract Risk'})
MERGE (yf)-[:EXPOSES_TO]->(risk);

MATCH (lm:TransactConcept {name: 'Liquidity Mining'})
MATCH (gov:TransactConcept {name: 'Governance Token'})
MERGE (lm)-[:DISTRIBUTES]->(gov);

// Tokenization
MATCH (tok:TransactConcept {name: 'Tokenization'})
MATCH (nft:TransactConcept {name: 'NFT'})
MERGE (tok)-[:PRODUCES_VARIANT]->(nft);

MATCH (tok:TransactConcept {name: 'Tokenization'})
MATCH (ft:TransactConcept {name: 'Fungible Token'})
MERGE (tok)-[:PRODUCES_VARIANT]->(ft);

// dApp
MATCH (dapp:TransactConcept {name: 'dApp'})
MATCH (sc:TransactConcept {name: 'Smart Contract'})
MERGE (dapp)-[:POWERED_BY]->(sc);

// Funding rate
MATCH (fr:TransactConcept {name: 'Funding Rate'})
MATCH (strat:TradingStrategy {name: 'Delta-Neutral Yield'})
MERGE (strat)-[:CAPTURES]->(fr);

MATCH (formula:TransactFormula {name: 'Funding Rate Annualized'})
MATCH (fr:TransactConcept {name: 'Funding Rate'})
MERGE (formula)-[:ANNUALIZES]->(fr);

// ── (C) TRADING STRATEGY INTERNAL RELATIONSHIPS ───────────────

MATCH (parent:TradingStrategy {name: 'Statistical Arbitrage'})
MATCH (child:TradingStrategy {name: 'Cross-DEX Arbitrage'})
MERGE (parent)-[:HAS_DEFI_INSTANCE {
  note: 'Cross-DEX arbitrage is statistical arbitrage executed across on-chain venues: same cointegration logic but enforced by MEV bot within single block',
  source: 'algo_trading_chan;harvey_defi_future'
}]->(child);

MATCH (parent:TradingStrategy {name: 'Momentum'})
MATCH (child:TradingStrategy {name: 'CANSLIM Growth'})
MERGE (parent)-[:RELATED_TO {note: 'CANSLIM integrates momentum (recent price highs) with fundamental filters'}]->(child);

MATCH (ml:TradingStrategy {name: 'Machine Learning Alpha'})
MATCH (sig:TradingStrategy {name: 'Alpha Signal Construction'})
MERGE (ml)-[:PRODUCES]->(sig);

MATCH (lpo:TradingStrategy {name: 'Liquidity Provision Optimization'})
MATCH (il:TransactConcept {name: 'Impermanent Loss'})
MERGE (lpo)-[:MINIMIZES]->(il);

MATCH (lpo:TradingStrategy {name: 'Liquidity Provision Optimization'})
MATCH (cl:TransactConcept {name: 'Concentrated Liquidity'})
MERGE (lpo)-[:OPTIMIZES_FOR]->(cl);

MATCH (dn:TradingStrategy {name: 'Delta-Neutral Yield'})
MATCH (fl:TransactConcept {name: 'Flash Loan'})
MERGE (dn)-[:MAY_USE]->(fl);

// ── (D) NEW FORMULA ↔ CONCEPT DEPENDENCY GRAPH ────────────────

// CPMM formula chain
MATCH (f:TransactFormula {name: 'CPMM Invariant'})
MATCH (c:TransactConcept {name: 'CPMM'})
MERGE (f)-[:DEFINES]->(c);

MATCH (f:TransactFormula {name: 'CPMM Price Impact'})
MATCH (base:TransactFormula {name: 'CPMM Invariant'})
MERGE (f)-[:DERIVES_FROM]->(base);

MATCH (f:TransactFormula {name: 'AMM Output Amount'})
MATCH (base:TransactFormula {name: 'CPMM Invariant'})
MERGE (f)-[:DERIVES_FROM]->(base);

MATCH (f:TransactFormula {name: 'AMM Output Amount'})
MATCH (c:TransactConcept {name: 'AMM'})
MERGE (f)-[:IMPLEMENTS]->(c);

MATCH (f:TransactFormula {name: 'Impermanent Loss'})
MATCH (base:TransactFormula {name: 'CPMM Invariant'})
MERGE (f)-[:DERIVES_FROM]->(base);

MATCH (f:TransactFormula {name: 'Impermanent Loss'})
MATCH (c:TransactConcept {name: 'Impermanent Loss'})
MERGE (f)-[:QUANTIFIES]->(c);

MATCH (f:TransactFormula {name: 'LP Net APY'})
MATCH (il:TransactFormula {name: 'Impermanent Loss'})
MERGE (f)-[:INCLUDES]->(il);

MATCH (f:TransactFormula {name: 'LP Net APY'})
MATCH (apy:TransactFormula {name: 'APY from APR'})
MERGE (f)-[:USES]->(apy);

MATCH (f:TransactFormula {name: 'StableSwap Invariant'})
MATCH (c:TransactConcept {name: 'AMM'})
MERGE (f)-[:IS_VARIANT_OF]->(c);

MATCH (f:TransactFormula {name: 'StableSwap Invariant'})
MATCH (cpmm:TransactFormula {name: 'CPMM Invariant'})
MERGE (f)-[:GENERALIZES]->(cpmm);

// Lending formula chain
MATCH (f:TransactFormula {name: 'Utilization Rate'})
MATCH (c:TransactConcept {name: 'Collateralized Lending'})
MERGE (f)-[:PARAMETERIZES]->(c);

MATCH (f:TransactFormula {name: 'Aave Borrow Rate'})
MATCH (c:TransactConcept {name: 'Collateralized Lending'})
MERGE (f)-[:PARAMETERIZES]->(c);

MATCH (f:TransactFormula {name: 'Health Factor'})
MATCH (c:TransactConcept {name: 'Collateralized Lending'})
MERGE (f)-[:MONITORS]->(c);

MATCH (f:TransactFormula {name: 'Loan-to-Value'})
MATCH (hf:TransactFormula {name: 'Health Factor'})
MERGE (f)-[:CONSTRAINS]->(hf);

// No-arb / flash loan
MATCH (f:TransactFormula {name: 'No-Arbitrage Pricing (FTAP)'})
MATCH (rn:TransactConcept {name: 'Risk-Neutral Measure'})
MERGE (f)-[:REQUIRES]->(rn);

MATCH (f:TransactFormula {name: 'Flash Loan Arbitrage Profit'})
MATCH (impact:TransactFormula {name: 'CPMM Price Impact'})
MERGE (f)-[:MUST_ACCOUNT_FOR]->(impact);

MATCH (f:TransactFormula {name: 'Flash Loan Arbitrage Profit'})
MATCH (gas:TransactFormula {name: 'EVM Gas Cost'})
MERGE (f)-[:DEDUCTED_BY]->(gas);

// On-chain VaR dependencies
MATCH (f:TransactFormula {name: 'On-Chain VaR'})
MATCH (hf:TransactFormula {name: 'Health Factor'})
MERGE (f)-[:INCORPORATES]->(hf);

MATCH (f:TransactFormula {name: 'On-Chain VaR'})
MATCH (sc:TransactConcept {name: 'Smart Contract Risk'})
MERGE (f)-[:QUANTIFIES]->(sc);

MATCH (f:TransactFormula {name: 'On-Chain VaR'})
MATCH (liq:TransactConcept {name: 'Liquidation Risk'})
MERGE (f)-[:QUANTIFIES]->(liq);

// ── (E) MENU MEMBERSHIP FOR NEW NODES ─────────────────────────

// Blockchain infrastructure → Blockchain menu
WITH ['Blockchain', 'Proof of Work', 'Proof of Stake', 'EVM', 'Smart Contract', 'Gas',
      'Merkle Tree', 'Hash Function', 'ECC', 'ECDSA Signature', 'Zero-Knowledge Proof',
      'Layer 2 Scaling', 'Byzantine Fault Tolerance', 'Account Abstraction'] AS concepts
UNWIND concepts AS cName
MATCH (c:TransactConcept {name: cName})
MATCH (m:Menu {name: 'Blockchain'})
MERGE (c)-[:BELONGS_TO]->(m);

// DeFi primitives → DeFi Protocols menu
WITH ['Decentralized Finance', 'Composability', 'AMM', 'CPMM', 'Impermanent Loss',
      'Concentrated Liquidity', 'DEX', 'Liquidity Pool', 'Collateralized Lending',
      'Flash Loan', 'Stablecoin', 'Oracle', 'Fungible Token', 'NFT', 'dApp',
      'Governance Token', 'Yield Farming', 'Liquidity Mining', 'TWAP Oracle', 'Tokenization'] AS concepts
UNWIND concepts AS cName
MATCH (c:TransactConcept {name: cName})
MATCH (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

// DeFi risks → DeFi Risk menu
WITH ['Smart Contract Risk', 'Oracle Risk', 'Governance Risk', 'MEV', 'Sandwich Attack',
      'Liquidation Risk', 'Scaling Risk', 'DEX Risk', 'Regulatory Risk', 'Custodial Risk',
      'Black Swan in DeFi', 'Funding Rate', 'Proposer-Builder Separation', 'MEV-Protected RPC'] AS concepts
UNWIND concepts AS cName
MATCH (c:TransactConcept {name: cName})
MATCH (m:Menu {name: 'DeFi Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

// Yield strategies → Yield Strategies menu
WITH ['Yield Farming', 'Liquidity Mining', 'Liquidity Provision Optimization',
      'Delta-Neutral Yield', 'LP Net APY', 'Funding Rate', 'APY from APR',
      'Funding Rate Annualized'] AS names
UNWIND names AS n
OPTIONAL MATCH (c:TransactConcept {name: n})
OPTIONAL MATCH (f:TransactFormula {name: n})
OPTIONAL MATCH (s:TradingStrategy {name: n})
MATCH (m:Menu {name: 'Yield Strategies'})
FOREACH (x IN CASE WHEN c IS NOT NULL THEN [c] ELSE [] END | MERGE (x)-[:BELONGS_TO]->(m))
FOREACH (x IN CASE WHEN f IS NOT NULL THEN [f] ELSE [] END | MERGE (x)-[:BELONGS_TO]->(m))
FOREACH (x IN CASE WHEN s IS NOT NULL THEN [s] ELSE [] END | MERGE (x)-[:BELONGS_TO]->(m));

// MEV menu
WITH ['MEV', 'Sandwich Attack', 'Proposer-Builder Separation', 'MEV-Protected RPC',
      'Flash Loan Arbitrage Profit', 'Flash Loan'] AS names
UNWIND names AS n
OPTIONAL MATCH (c:TransactConcept {name: n})
OPTIONAL MATCH (f:TransactFormula {name: n})
MATCH (m:Menu {name: 'MEV'})
FOREACH (x IN CASE WHEN c IS NOT NULL THEN [c] ELSE [] END | MERGE (x)-[:BELONGS_TO]->(m))
FOREACH (x IN CASE WHEN f IS NOT NULL THEN [f] ELSE [] END | MERGE (x)-[:BELONGS_TO]->(m));

// Algorithmic Trading menu
WITH ['Momentum', 'Mean Reversion', 'Statistical Arbitrage', 'Cross-DEX Arbitrage',
      'Delta-Neutral Yield', 'Trend Following', 'Liquidity Provision Optimization',
      'CANSLIM Growth'] AS strats
UNWIND strats AS sName
MATCH (s:TradingStrategy {name: sName})
MATCH (m:Menu {name: 'Algorithmic Trading'})
MERGE (s)-[:BELONGS_TO]->(m);

// Alpha Research menu
WITH ['Alpha Signal Construction', 'Machine Learning Alpha', 'CANSLIM Growth'] AS strats
UNWIND strats AS sName
MATCH (s:TradingStrategy {name: sName})
MATCH (m:Menu {name: 'Alpha Research'})
MERGE (s)-[:BELONGS_TO]->(m);

// Cryptography menu
WITH ['Merkle Tree', 'Hash Function', 'ECC', 'ECDSA Signature', 'Zero-Knowledge Proof',
      'Merkle Root', 'ECDSA Private to Public Key', 'EVM Gas Cost'] AS names
UNWIND names AS n
OPTIONAL MATCH (c:TransactConcept {name: n})
OPTIONAL MATCH (f:TransactFormula {name: n})
MATCH (m:Menu {name: 'Cryptography'})
FOREACH (x IN CASE WHEN c IS NOT NULL THEN [c] ELSE [] END | MERGE (x)-[:BELONGS_TO]->(m))
FOREACH (x IN CASE WHEN f IS NOT NULL THEN [f] ELSE [] END | MERGE (x)-[:BELONGS_TO]->(m));

// DeFi formulas → DeFi Protocols menu (AMM/lending formulas)
WITH ['CPMM Invariant', 'CPMM Price Impact', 'AMM Output Amount', 'Impermanent Loss',
      'StableSwap Invariant', 'Utilization Rate', 'Aave Borrow Rate', 'Health Factor',
      'Loan-to-Value', 'APY from APR', 'No-Arbitrage Pricing (FTAP)',
      'Flash Loan Arbitrage Profit', 'On-Chain VaR', 'Funding Rate Annualized'] AS formulas
UNWIND formulas AS fName
MATCH (f:TransactFormula {name: fName})
MATCH (m:Menu {name: 'DeFi Protocols'})
MERGE (f)-[:BELONGS_TO]->(m);
