// ============================================================
// 11_defi_risks.cypher
// DeFi-specific risks with cross-references to quant risk concepts.
// Source: Harvey et al. (DeFi and the Future of Finance, 2021) Ch. VII
//         Taleb (Black Swan); ai-core project risk framework
// ============================================================

MERGE (c:TransactConcept {name: 'Smart Contract Risk'})
SET c.definition = 'Risk of loss from bugs, logic errors, or exploits in smart contract code. Types: reentrancy (The DAO hack 2016: $60M), integer overflow/underflow, access control failures, flash loan manipulation, price oracle manipulation. Mitigations: formal verification, audits (Certik, Trail of Bits), bug bounties, timelocks, circuit breakers. Harvey et al.: "Code is the law — and the law may have bugs."',
    c.category = 'defi_risks',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Risk',
    c.prerequisites = 'smart contracts;audits;reentrancy;access control;formal verification',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'VII: Risks — Smart Contract Risk',
    c.source_pages = '131-134';
MATCH (c:TransactConcept {name: 'Smart Contract Risk'}), (m:Menu {name: 'DeFi Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Oracle Risk'})
SET c.definition = 'Risk from inaccurate, stale, or manipulated price feeds. Single oracle = single point of failure. Flash loan attacks use spot price manipulation to drain lending protocols (bZx attacks 2020). Chainlink manipulation requires 51% of node operators to collude. TWAP oracle requires sustained manipulation over time window. Mitigation: multiple oracle sources, TWAP, circuit breakers.',
    c.category = 'defi_risks',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Risk',
    c.prerequisites = 'oracle;TWAP;flash loans;price manipulation;Chainlink',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'VII: Risks — Oracle Risk',
    c.source_pages = '137-138';
MATCH (c:TransactConcept {name: 'Oracle Risk'}), (m:Menu {name: 'DeFi Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Governance Risk'})
SET c.definition = 'Risk from malicious or misguided protocol governance decisions. Attack vectors: governance takeover via token accumulation, flash loan governance (borrow → vote → repay in one tx), low-participation attacks. Mitigations: timelocks (48h+ delay), vote delegation, quorum thresholds, guardian multisigs. Harvey et al.: governance token concentration = centralization risk.',
    c.category = 'defi_risks',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Risk',
    c.prerequisites = 'governance tokens;DAO;quorum;timelock;proposal threshold',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'VII: Risks — Governance Risk',
    c.source_pages = '135-136';
MATCH (c:TransactConcept {name: 'Governance Risk'}), (m:Menu {name: 'DeFi Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Maximal Extractable Value'})
SET c.definition = 'Value extracted by block producers (miners/validators) or searchers by reordering, inserting, or censoring transactions. Types: (1) Sandwich attacks: frontrun + backrun a large swap; (2) Liquidation MEV: race to liquidate underwater positions; (3) Arbitrage MEV: price discrepancies across DEXs; (4) NFT sniping. Flashbots introduced MEV-boost and PBS (Proposer-Builder Separation) to democratize and reduce harmful MEV.',
    c.category = 'defi_risks',
    c.difficulty = 'advanced',
    c.menu_context = 'MEV',
    c.prerequisites = 'mempool;transaction ordering;priority fee;sandwich attack;frontrunning;PBS',
    c.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';
MATCH (c:TransactConcept {name: 'Maximal Extractable Value'}), (m:Menu {name: 'MEV'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Sandwich Attack'})
SET c.definition = 'MEV strategy: (1) detect large pending swap in mempool; (2) frontrun with same-direction trade (buy before target buys); (3) target trade executes at worse price; (4) backrun selling immediately after. Profit = price impact on target trade. Mitigation: MEV-protect RPCs (Flashbots Protect, MEV Blocker), private mempools, slippage limits, commit-reveal schemes.',
    c.category = 'mev_types',
    c.difficulty = 'intermediate',
    c.menu_context = 'MEV',
    c.prerequisites = 'mempool;frontrunning;backrunning;price impact;gas priority',
    c.source_ids = 'harvey_defi_future';
MATCH (c:TransactConcept {name: 'Sandwich Attack'}), (m:Menu {name: 'MEV'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Liquidation Risk'})
SET c.definition = 'Risk of collateral being seized when Health Factor < 1 in lending protocols. Health Factor = (collateral_value × liquidation_threshold) / debt_value. Liquidators repay portion of debt + receive collateral at discount (liquidation bonus: 5-15%). Cascading liquidations: price drop → liquidations → more selling → further price drop. Particularly dangerous in concentrated collateral (e.g., ETH in MakerDAO).',
    c.category = 'defi_risks',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Risk',
    c.prerequisites = 'health factor;LTV;liquidation threshold;collateral;price crash;cascade',
    c.source_ids = 'harvey_defi_future';
MATCH (c:TransactConcept {name: 'Liquidation Risk'}), (m:Menu {name: 'DeFi Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Scaling Risk'})
SET c.definition = 'Ethereum mainnet throughput: ~15 TPS. High demand → gas spikes (Bored Apes mint: avg gas 5000+ gwei). During black swan events, gas becomes prohibitive for liquidations/arbitrage. Layer 2 solutions reduce but introduce bridge risk. Fragmented liquidity across L1/L2. Harvey et al. Ch. VII p.138.',
    c.category = 'defi_risks',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Risk',
    c.prerequisites = 'gas;TPS;Layer 2;bridge;liquidity fragmentation',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'VII: Risks — Scaling Risk',
    c.source_pages = '138-141';
MATCH (c:TransactConcept {name: 'Scaling Risk'}), (m:Menu {name: 'DeFi Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'DEX Risk'})
SET c.definition = 'Risks specific to decentralized exchanges: (1) Price impact on low liquidity pools; (2) Failed transactions (slippage exceeded); (3) MEV/sandwich attacks; (4) Pool insolvency (LP withdrawing all liquidity); (5) Routing errors through aggregators; (6) Token approval exploits (unlimited approval to malicious contract). Harvey et al. Ch. VII p.142.',
    c.category = 'defi_risks',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Risk',
    c.prerequisites = 'AMM;price impact;MEV;approvals;routing',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'VII: Risks — DEX Risk',
    c.source_pages = '142-143';
MATCH (c:TransactConcept {name: 'DEX Risk'}), (m:Menu {name: 'DeFi Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Regulatory Risk'})
SET c.definition = 'Risk of government actions restricting DeFi: SEC designating tokens as securities (Howey Test), FATF travel rule applied to DEXs, CFTC jurisdiction over crypto derivatives, MiCA (EU) requiring licensing, sanctions (Tornado Cash OFAC 2022). Affects protocol accessibility, token value, developer liability. Harvey et al. Ch. VII p.147.',
    c.category = 'defi_risks',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Risk',
    c.prerequisites = 'securities law;Howey Test;KYC/AML;MiCA;OFAC;licensing',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'VII: Risks — Regulatory Risk',
    c.source_pages = '147-149';
MATCH (c:TransactConcept {name: 'Regulatory Risk'}), (m:Menu {name: 'DeFi Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Custodial Risk'})
SET c.definition = 'Risk from third-party custody. CeFi custodians (Celsius, BlockFi, FTX) can: freeze withdrawals, misuse funds, become insolvent. DeFi wallets: user controls private key ("not your keys, not your coins"). Smart contract wallets add code risk. Multi-sig adds operational complexity. WDK architecture: non-custodial by design. Harvey et al. p.144.',
    c.category = 'defi_risks',
    c.difficulty = 'basic',
    c.menu_context = 'DeFi Risk',
    c.prerequisites = 'private keys;multi-sig;hardware wallets;non-custodial;CeFi failure',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'VII: Risks — Custodial Risk',
    c.source_pages = '144-145';
MATCH (c:TransactConcept {name: 'Custodial Risk'}), (m:Menu {name: 'DeFi Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Black Swan in DeFi'})
SET c.definition = 'Taleb-style extreme tail events specific to DeFi: (1) Protocol hack draining >$100M (Ronin $625M, PolyNetwork $600M, Wormhole $320M); (2) Algorithmic stablecoin death spiral (UST/LUNA May 2022: $60B wiped); (3) Governance attack; (4) Coordinated oracle manipulation; (5) L1 consensus failure. Unlike TradFi, no FDIC/bailout backstop. Convex payoff structures amplify downside.',
    c.category = 'tail_risk',
    c.difficulty = 'advanced',
    c.menu_context = 'DeFi Risk',
    c.prerequisites = 'black swan;tail risk;protocol hacks;algorithmic stablecoin;death spiral',
    c.source_ids = 'harvey_defi_future;taleb_black_swan';
MATCH (c:TransactConcept {name: 'Black Swan in DeFi'}), (m:Menu {name: 'DeFi Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Funding Rate'})
SET c.definition = 'Periodic payment between long and short perpetual futures holders keeping perp price near spot. Rate = (mark_price - index_price) / index_price × (1/payment_interval). Positive rate: longs pay shorts (perp premium, bullish market). Negative rate: shorts pay longs (bearish). Delta-neutral strategy: go long spot + short perp = earn positive funding rate.',
    c.category = 'derivatives_defi',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'perpetual futures;mark price;index price;delta neutral;basis',
    c.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';
MATCH (c:TransactConcept {name: 'Funding Rate'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

// ── MEV MITIGATION CONCEPTS ───────────────────────────────────
MERGE (c:TransactConcept {name: 'Proposer-Builder Separation'})
SET c.definition = 'MEV-Boost architecture separating block building (builders compete to construct highest-value blocks) from block proposal (validators simply choose highest-paying block from builder market). Prevents validator-level MEV extraction. Introduces builder centralization risk. Implemented by Flashbots post-Merge.',
    c.category = 'mev_mitigation',
    c.difficulty = 'advanced',
    c.menu_context = 'MEV',
    c.prerequisites = 'MEV-boost;builder;relay;validator;block construction',
    c.source_ids = 'harvey_defi_future';
MATCH (c:TransactConcept {name: 'Proposer-Builder Separation'}), (m:Menu {name: 'MEV'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'MEV-Protected RPC'})
SET c.definition = 'Transaction submission endpoints routing to private mempools to prevent frontrunning. Flashbots Protect (FLASHBOTS_RPC_URL): sends tx directly to builders, never public mempool; rebates MEV back to user. MEV Blocker (MEV_BLOCKER_RPC_URL): backrunners compete to offer best rebate. Used by gateway /v2/protect/submit endpoint.',
    c.category = 'mev_mitigation',
    c.difficulty = 'intermediate',
    c.menu_context = 'MEV',
    c.prerequisites = 'private mempool;flashbots;MEV rebate;transaction privacy',
    c.source_ids = 'harvey_defi_future';
MATCH (c:TransactConcept {name: 'MEV-Protected RPC'}), (m:Menu {name: 'MEV'})
MERGE (c)-[:BELONGS_TO]->(m);
