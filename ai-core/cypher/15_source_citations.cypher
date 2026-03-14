// ============================================================
// 15_source_citations.cypher
// SOURCED_FROM relationships from all concept/formula/strategy
// nodes to KnowledgeSource nodes with page/chapter context.
// Run last — after all other files (00–14).
// All source IDs reference nodes created in 00_knowledge_sources.cypher.
// ============================================================

// ── HELPER: relationship type guide ──────────────────────────
// SOURCED_FROM {chapter, pages, relevance}  — primary citation
// ALSO_IN      {note}                       — secondary/supporting reference
// ─────────────────────────────────────────────────────────────

// ── BLOCKCHAIN INFRASTRUCTURE (08_blockchain_infrastructure) ──

MATCH (c:TransactConcept {name: 'Blockchain'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 1', pages: '1-30', relevance: 'foundational definition of blockchain as distributed ledger'}]->(ks);

MATCH (c:TransactConcept {name: 'Blockchain'})
MATCH (ks:KnowledgeSource {id: 'learn_ethereum_2e'})
MERGE (c)-[:ALSO_IN {note: 'introductory blockchain architecture coverage'}]->(ks);

MATCH (c:TransactConcept {name: 'Proof of Work'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 10', pages: '215-240', relevance: 'Nakamoto consensus, hash puzzles, difficulty adjustment'}]->(ks);

MATCH (c:TransactConcept {name: 'Proof of Stake'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 15', pages: '310-340', relevance: 'Ethereum PoS transition, validators, slashing'}]->(ks);

MATCH (c:TransactConcept {name: 'Proof of Stake'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:ALSO_IN {note: 'PoS as foundation for DeFi validator economics and staking yields'}]->(ks);

MATCH (c:TransactConcept {name: 'EVM'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 13', pages: '275-308', relevance: 'EVM architecture, opcodes, stack machine, gas metering'}]->(ks);

MATCH (c:TransactConcept {name: 'Smart Contract'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 7', pages: '155-185', relevance: 'Solidity contract lifecycle, deployment, ABI'}]->(ks);

MATCH (c:TransactConcept {name: 'Smart Contract'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:ALSO_IN {note: 'smart contracts as DeFi building blocks, Ch. 2'}]->(ks);

MATCH (c:TransactConcept {name: 'Gas'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 13', pages: '295-310', relevance: 'gas cost table, EIP-1559 fee market, base_fee burn'}]->(ks);

MATCH (c:TransactConcept {name: 'Merkle Tree'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 9', pages: '195-212', relevance: 'Patricia Merkle Trie, state root, receipt trie'}]->(ks);

MATCH (c:TransactConcept {name: 'Hash Function'})
MATCH (ks:KnowledgeSource {id: 'cryptographic_primitives_blockchain'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 2', pages: '15-40', relevance: 'SHA-256, Keccak-256 collision resistance, pre-image resistance'}]->(ks);

MATCH (c:TransactConcept {name: 'ECC'})
MATCH (ks:KnowledgeSource {id: 'cryptographic_primitives_blockchain'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 3', pages: '41-75', relevance: 'secp256k1, elliptic curve group law, discrete log hardness'}]->(ks);

MATCH (c:TransactConcept {name: 'ECDSA Signature'})
MATCH (ks:KnowledgeSource {id: 'cryptographic_primitives_blockchain'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '76-105', relevance: 'ECDSA sign/verify, signature malleability, Ethereum v,r,s encoding'}]->(ks);

MATCH (c:TransactConcept {name: 'ECDSA Signature'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:ALSO_IN {note: 'Ch. 4: key derivation, address generation, HD wallets'}]->(ks);

MATCH (c:TransactConcept {name: 'Zero-Knowledge Proof'})
MATCH (ks:KnowledgeSource {id: 'cryptographic_primitives_blockchain'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 7', pages: '150-195', relevance: 'zk-SNARKs, Groth16, Plonk, zk-rollup construction'}]->(ks);

MATCH (c:TransactConcept {name: 'Layer 2 Scaling'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 14', pages: '295-315', relevance: 'channels, rollups, plasma, state channel security model'}]->(ks);

MATCH (c:TransactConcept {name: 'Layer 2 Scaling'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:ALSO_IN {note: 'scaling as prerequisite for mass DeFi adoption, Ch. 8'}]->(ks);

MATCH (c:TransactConcept {name: 'Byzantine Fault Tolerance'})
MATCH (ks:KnowledgeSource {id: 'cryptographic_primitives_blockchain'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 1', pages: '5-14', relevance: 'BFT consensus, PBFT, Tendermint, 2/3 honest majority'}]->(ks);

MATCH (c:TransactConcept {name: 'Account Abstraction'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 15', pages: '320-340', relevance: 'ERC-4337, UserOperation, bundler, paymaster pattern'}]->(ks);

// ── DEFI PRIMITIVES (09_defi_primitives) ─────────────────────

MATCH (c:TransactConcept {name: 'Decentralized Finance'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 1-2', pages: '1-55', relevance: '5 problems of CeFi, DeFi solution thesis, open/transparent/composable'}]->(ks);

MATCH (c:TransactConcept {name: 'Composability'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 2', pages: '30-52', relevance: 'money legos, atomic composability, protocol interoperability'}]->(ks);

MATCH (c:TransactConcept {name: 'AMM'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '80-120', relevance: 'AMM types, bonding curves, CPMM vs CSMM comparison'}]->(ks);

MATCH (c:TransactConcept {name: 'AMM'})
MATCH (ks:KnowledgeSource {id: 'coingecko_how_to_defi_advanced'})
MERGE (c)-[:ALSO_IN {note: 'Ch. 2-3: DEX mechanics, LP positions, fee tiers'}]->(ks);

MATCH (c:TransactConcept {name: 'CPMM'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '82-95', relevance: 'x*y=k derivation, price impact, arbitrage convergence'}]->(ks);

MATCH (c:TransactConcept {name: 'Impermanent Loss'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '100-115', relevance: 'IL formula derivation, IL vs price ratio chart, fee offset analysis'}]->(ks);

MATCH (c:TransactConcept {name: 'Impermanent Loss'})
MATCH (ks:KnowledgeSource {id: 'coingecko_how_to_defi_advanced'})
MERGE (c)-[:ALSO_IN {note: 'numerical examples for IL at r=1.25, 1.5, 2, 4'}]->(ks);

MATCH (c:TransactConcept {name: 'Concentrated Liquidity'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '116-130', relevance: 'Uni V3 tick system, virtual reserves, capital efficiency vs IL tradeoff'}]->(ks);

MATCH (c:TransactConcept {name: 'DEX'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 3-4', pages: '60-130', relevance: 'DEX vs CEX, order book vs AMM, slippage and execution'}]->(ks);

MATCH (c:TransactConcept {name: 'Liquidity Pool'})
MATCH (ks:KnowledgeSource {id: 'coingecko_how_to_defi_advanced'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 2', pages: '18-40', relevance: 'LP token mechanics, fee accrual, pool rebalancing'}]->(ks);

MATCH (c:TransactConcept {name: 'Collateralized Lending'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '130-165', relevance: 'over-collateralization rationale, CDP mechanics, liquidation cascade'}]->(ks);

MATCH (c:TransactConcept {name: 'Flash Loan'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '155-170', relevance: 'flash loan atomicity, Aave implementation, arbitrage and exploit use cases'}]->(ks);

MATCH (c:TransactConcept {name: 'Stablecoin'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 6', pages: '170-210', relevance: 'fiat-backed, crypto-collateralized, algorithmic stablecoin taxonomy; DAI CDP'}]->(ks);

MATCH (c:TransactConcept {name: 'Oracle'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 7', pages: '215-245', relevance: 'oracle problem, Chainlink DON, TWAP vs spot, manipulation vectors'}]->(ks);

MATCH (c:TransactConcept {name: 'Fungible Token'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 10', pages: '220-240', relevance: 'ERC-20 standard, token lifecycle, approve/transferFrom pattern'}]->(ks);

MATCH (c:TransactConcept {name: 'NFT'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 10', pages: '240-255', relevance: 'ERC-721 standard, tokenURI, marketplace mechanics'}]->(ks);

MATCH (c:TransactConcept {name: 'dApp'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 12', pages: '265-282', relevance: 'dApp architecture, frontend-contract interaction, Web3.js/ethers.js'}]->(ks);

MATCH (c:TransactConcept {name: 'Governance Token'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 9', pages: '265-290', relevance: 'governance token design, voting power, plutocracy risks, Compound COMP launch'}]->(ks);

MATCH (c:TransactConcept {name: 'Yield Farming'})
MATCH (ks:KnowledgeSource {id: 'coingecko_how_to_defi_advanced'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '80-110', relevance: 'yield farming strategies, APY calculation, risk layers (IL, smart contract, liquidity)'}]->(ks);

MATCH (c:TransactConcept {name: 'Liquidity Mining'})
MATCH (ks:KnowledgeSource {id: 'coingecko_how_to_defi_advanced'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '85-95', relevance: 'liquidity mining incentive mechanics, mercenary capital risk'}]->(ks);

MATCH (c:TransactConcept {name: 'TWAP Oracle'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 7', pages: '230-245', relevance: 'Uniswap V2/V3 TWAP accumulator, manipulation cost analysis'}]->(ks);

MATCH (c:TransactConcept {name: 'Tokenization'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 10', pages: '290-310', relevance: 'real-world asset tokenization, security token frameworks, regulatory overlay'}]->(ks);

// ── DEFI RISKS (11_defi_risks) ────────────────────────────────

MATCH (c:TransactConcept {name: 'Smart Contract Risk'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 8', pages: '245-265', relevance: 'exploit taxonomy, reentrancy, integer overflow, economic exploits; DeFi hack history'}]->(ks);

MATCH (c:TransactConcept {name: 'Oracle Risk'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 7', pages: '215-245', relevance: 'oracle manipulation attack vector, Mango Markets case study'}]->(ks);

MATCH (c:TransactConcept {name: 'Governance Risk'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 9', pages: '265-290', relevance: 'governance attack vectors, flash-loan governance manipulation, Beanstalk exploit'}]->(ks);

MATCH (c:TransactConcept {name: 'MEV'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '120-135', relevance: 'MEV taxonomy, miner/validator extractable value, front/back/sandwich running'}]->(ks);

MATCH (c:TransactConcept {name: 'Sandwich Attack'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '125-132', relevance: 'sandwich attack mechanics, slippage tolerance as partial defense'}]->(ks);

MATCH (c:TransactConcept {name: 'Liquidation Risk'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '150-170', relevance: 'liquidation cascade mechanism, incentive to liquidate, health factor triggers'}]->(ks);

MATCH (c:TransactConcept {name: 'Scaling Risk'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 8', pages: '260-275', relevance: 'DeFi scalability constraints, gas spike during peak demand, failed transactions'}]->(ks);

MATCH (c:TransactConcept {name: 'DEX Risk'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '80-135', relevance: 'AMM-specific risks: price impact, IL, MEV, pool manipulation'}]->(ks);

MATCH (c:TransactConcept {name: 'Regulatory Risk'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 11', pages: '315-350', relevance: 'global DeFi regulatory landscape, SEC enforcement, AML/KYC requirements'}]->(ks);

MATCH (c:TransactConcept {name: 'Custodial Risk'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 1', pages: '10-30', relevance: 'non-custodial vs custodial comparison; centralized exchange counter-party risk'}]->(ks);

MATCH (c:TransactConcept {name: 'Black Swan in DeFi'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 8', pages: '245-280', relevance: 'DeFi black swans: March 2020 crash, LUNA collapse, Euler hack case studies'}]->(ks);

MATCH (c:TransactConcept {name: 'Black Swan in DeFi'})
MATCH (ks:KnowledgeSource {id: 'taleb_dynamic_hedging'})
MERGE (c)-[:ALSO_IN {note: 'fat-tail dynamics, tail hedging under jumps — applied to DeFi cascade risk'}]->(ks);

MATCH (c:TransactConcept {name: 'Funding Rate'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 6', pages: '195-215', relevance: 'perpetual futures funding mechanism, 8h payment cycle, delta-neutral capture'}]->(ks);

MATCH (c:TransactConcept {name: 'Proposer-Builder Separation'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '130-140', relevance: 'PBS design, MEV-Boost, proposer/builder role separation, censorship resistance'}]->(ks);

MATCH (c:TransactConcept {name: 'MEV-Protected RPC'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '135-140', relevance: 'private mempool RPC, Flashbots Protect, back-running fee share'}]->(ks);

// ── DEFI FORMULAS (13_defi_formulas) ─────────────────────────

MATCH (f:TransactFormula {name: 'CPMM Invariant'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '82-90', relevance: 'x*y=k formula derivation, spot price, trade execution formula'}]->(ks);

MATCH (f:TransactFormula {name: 'CPMM Invariant'})
MATCH (ks:KnowledgeSource {id: 'coingecko_how_to_defi_advanced'})
MERGE (f)-[:ALSO_IN {note: 'worked numerical examples of CPMM trades'}]->(ks);

MATCH (f:TransactFormula {name: 'CPMM Price Impact'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '90-98', relevance: 'price impact derivation, slippage vs liquidity depth'}]->(ks);

MATCH (f:TransactFormula {name: 'AMM Output Amount'})
MATCH (ks:KnowledgeSource {id: 'coingecko_how_to_defi_advanced'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 2', pages: '25-35', relevance: 'Uniswap V2 getAmountOut formula with 0.3% fee'}]->(ks);

MATCH (f:TransactFormula {name: 'Impermanent Loss'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '100-115', relevance: 'IL(r) = 2√r/(1+r) - 1 derived from CPMM, numerical table, fee offset analysis'}]->(ks);

MATCH (f:TransactFormula {name: 'LP Net APY'})
MATCH (ks:KnowledgeSource {id: 'coingecko_how_to_defi_advanced'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '80-110', relevance: 'net APY = fee_APY + reward_APY - IL_rate - gas; profitability analysis'}]->(ks);

MATCH (f:TransactFormula {name: 'StableSwap Invariant'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '107-120', relevance: 'Curve StableSwap invariant, amplification coefficient A, hybrid CSMM+CPMM'}]->(ks);

MATCH (f:TransactFormula {name: 'Utilization Rate'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '132-145', relevance: 'U = borrows/supply, kink utilization, rate model motivation'}]->(ks);

MATCH (f:TransactFormula {name: 'Utilization Rate'})
MATCH (ks:KnowledgeSource {id: 'coingecko_how_to_defi_advanced'})
MERGE (f)-[:ALSO_IN {note: 'Aave/Compound utilization rate worked examples'}]->(ks);

MATCH (f:TransactFormula {name: 'Aave Borrow Rate'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '140-155', relevance: 'two-slope kink rate model, R0+R1+R2 parameters, governance calibration'}]->(ks);

MATCH (f:TransactFormula {name: 'Health Factor'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '148-162', relevance: 'HF formula, liquidation threshold per asset, partial liquidation with bonus'}]->(ks);

MATCH (f:TransactFormula {name: 'Loan-to-Value'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '132-148', relevance: 'max LTV per asset class, borrowing at safe LTV vs max LTV safety margin'}]->(ks);

MATCH (f:TransactFormula {name: 'APY from APR'})
MATCH (ks:KnowledgeSource {id: 'coingecko_how_to_defi_advanced'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 1', pages: '8-15', relevance: 'APY=(1+APR/n)^n-1, daily/hourly/continuous compounding comparison'}]->(ks);

MATCH (f:TransactFormula {name: 'Funding Rate Annualized'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 6', pages: '195-215', relevance: '8h funding cycle, annualization, delta-neutral strategy yield calculation'}]->(ks);

MATCH (f:TransactFormula {name: 'On-Chain VaR'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 8', pages: '260-280', relevance: 'DeFi-augmented VaR: traditional VaR + liquidation addon + exploit addon'}]->(ks);

MATCH (f:TransactFormula {name: 'On-Chain VaR'})
MATCH (ks:KnowledgeSource {id: 'm1_var_classical'})
MERGE (f)-[:ALSO_IN {note: 'classical VaR foundation extended to DeFi context'}]->(ks);

MATCH (f:TransactFormula {name: 'Merkle Root'})
MATCH (ks:KnowledgeSource {id: 'cryptographic_primitives_blockchain'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '106-128', relevance: 'Merkle root construction, inclusion proofs, O(log n) verification'}]->(ks);

MATCH (f:TransactFormula {name: 'EVM Gas Cost'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 13', pages: '295-312', relevance: 'gas cost table, EIP-1559 base_fee+tip formula, SSTORE/SLOAD costs'}]->(ks);

MATCH (f:TransactFormula {name: 'ECDSA Private to Public Key'})
MATCH (ks:KnowledgeSource {id: 'cryptographic_primitives_blockchain'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '76-100', relevance: 'K=k*G derivation, address = Keccak256(K)[12:], secp256k1 parameters'}]->(ks);

MATCH (f:TransactFormula {name: 'ECDSA Private to Public Key'})
MATCH (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
MERGE (f)-[:ALSO_IN {note: 'Ch. 4: private key generation, key hierarchy, BIP32/44 HD derivation'}]->(ks);

MATCH (f:TransactFormula {name: 'No-Arbitrage Pricing (FTAP)'})
MATCH (ks:KnowledgeSource {id: 'math_arbitrage'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 1-2', pages: '1-60', relevance: 'Fundamental Theorem of Asset Pricing, Delbaen-Schachermayer, NFLVR condition'}]->(ks);

MATCH (f:TransactFormula {name: 'No-Arbitrage Pricing (FTAP)'})
MATCH (ks:KnowledgeSource {id: 'baxter_financial_calculus'})
MERGE (f)-[:ALSO_IN {note: 'risk-neutral pricing, martingale measure construction, Girsanov theorem'}]->(ks);

MATCH (f:TransactFormula {name: 'Flash Loan Arbitrage Profit'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (f)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '155-170', relevance: 'flash loan arbitrage P&L: V_sell - V_buy - fee - gas; Aave 0.09% fee'}]->(ks);

MATCH (f:TransactFormula {name: 'Flash Loan Arbitrage Profit'})
MATCH (ks:KnowledgeSource {id: 'math_arbitrage'})
MERGE (f)-[:ALSO_IN {note: 'no-arbitrage condition: profit must exceed friction costs (fee + gas) to execute'}]->(ks);

// ── TRADING STRATEGIES (12_algo_trading_strategies) ──────────

MATCH (s:TradingStrategy {name: 'Momentum'})
MATCH (ks:KnowledgeSource {id: 'algo_trading_chan'})
MERGE (s)-[:SOURCED_FROM {chapter: 'Ch. 3', pages: '45-75', relevance: 'time-series momentum, cross-sectional momentum, lookback windows, Sharpe benchmarks'}]->(ks);

MATCH (s:TradingStrategy {name: 'Momentum'})
MATCH (ks:KnowledgeSource {id: 'algo_trading_tulchinsky'})
MERGE (s)-[:ALSO_IN {note: 'alpha design: momentum signals in multi-factor frameworks'}]->(ks);

MATCH (s:TradingStrategy {name: 'Mean Reversion'})
MATCH (ks:KnowledgeSource {id: 'algo_trading_chan'})
MERGE (s)-[:SOURCED_FROM {chapter: 'Ch. 4-5', pages: '77-120', relevance: 'ADF test, half-life estimation, Ornstein-Uhlenbeck mean reversion speed'}]->(ks);

MATCH (s:TradingStrategy {name: 'Mean Reversion'})
MATCH (ks:KnowledgeSource {id: 'algo_trading_chan_2'})
MERGE (s)-[:ALSO_IN {note: 'Kalman filter mean reversion, cointegration pair selection'}]->(ks);

MATCH (s:TradingStrategy {name: 'Statistical Arbitrage'})
MATCH (ks:KnowledgeSource {id: 'algo_trading_chan'})
MERGE (s)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '100-135', relevance: 'pairs trading, cointegration, z-score entry/exit, Johansen test'}]->(ks);

MATCH (s:TradingStrategy {name: 'Statistical Arbitrage'})
MATCH (ks:KnowledgeSource {id: 'algo_trading_chan_2'})
MERGE (s)-[:ALSO_IN {note: 'basket trading, PCA-based stat arb, transaction cost adjustment'}]->(ks);

MATCH (s:TradingStrategy {name: 'Cross-DEX Arbitrage'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (s)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '95-108', relevance: 'cross-DEX price discrepancies, flash loan arbitrage anatomy, gas cost as friction'}]->(ks);

MATCH (s:TradingStrategy {name: 'Delta-Neutral Yield'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (s)-[:SOURCED_FROM {chapter: 'Ch. 6', pages: '195-220', relevance: 'funding rate capture, delta-neutral spot + perp strategy, basis risk'}]->(ks);

MATCH (s:TradingStrategy {name: 'Delta-Neutral Yield'})
MATCH (ks:KnowledgeSource {id: 'taleb_dynamic_hedging'})
MERGE (s)-[:ALSO_IN {note: 'delta neutrality mechanics, dynamic rebalancing, gamma exposure management'}]->(ks);

MATCH (s:TradingStrategy {name: 'Trend Following'})
MATCH (ks:KnowledgeSource {id: 'algo_trading_chan'})
MERGE (s)-[:SOURCED_FROM {chapter: 'Ch. 3', pages: '45-65', relevance: 'trend-following vs momentum distinction, channel breakout, ATR position sizing'}]->(ks);

MATCH (s:TradingStrategy {name: 'Trend Following'})
MATCH (ks:KnowledgeSource {id: 'systematic_trading_carver'})
MERGE (s)-[:ALSO_IN {note: 'trend rules, forecast scaling, portfolio diversification of trend signals'}]->(ks);

MATCH (s:TradingStrategy {name: 'Quantitative Value'})
MATCH (ks:KnowledgeSource {id: 'algo_trading_tulchinsky'})
MERGE (s)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '58-80', relevance: 'value factor construction, P/B, P/E, EV/EBITDA in alpha formula context'}]->(ks);

MATCH (s:TradingStrategy {name: 'Candlestick Pattern Trading'})
MATCH (ks:KnowledgeSource {id: 'technical_analysis_murphy'})
MERGE (s)-[:SOURCED_FROM {chapter: 'Ch. 8', pages: '155-195', relevance: 'Japanese candlestick patterns: doji, hammer, engulfing, evening star, confirmation rules'}]->(ks);

MATCH (s:TradingStrategy {name: 'Alpha Signal Construction'})
MATCH (ks:KnowledgeSource {id: 'algo_trading_tulchinsky'})
MERGE (s)-[:SOURCED_FROM {chapter: 'Ch. 1-5', pages: '1-100', relevance: 'WorldQuant alpha framework, signal design, decay, turnover, backtesting regime'}]->(ks);

MATCH (s:TradingStrategy {name: 'Machine Learning Alpha'})
MATCH (ks:KnowledgeSource {id: 'ml_asset_management'})
MERGE (s)-[:SOURCED_FROM {chapter: 'Ch. 3-4', pages: '60-120', relevance: 'feature engineering, SHAP values, feature importance, purged k-fold CV for time series'}]->(ks);

MATCH (s:TradingStrategy {name: 'Machine Learning Alpha'})
MATCH (ks:KnowledgeSource {id: 'advances_fin_ml'})
MERGE (s)-[:ALSO_IN {note: 'Marcos Lopez de Prado: bars, labels, meta-labeling, feature importance, strategy risk'}]->(ks);

MATCH (s:TradingStrategy {name: 'Liquidity Provision Optimization'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (s)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '116-135', relevance: 'concentrated liquidity range selection, fee income vs IL optimization, rebalancing frequency'}]->(ks);

MATCH (s:TradingStrategy {name: 'Liquidity Provision Optimization'})
MATCH (ks:KnowledgeSource {id: 'm5_kelly_risk_parity'})
MERGE (s)-[:ALSO_IN {note: 'Kelly criterion adapted for LP position sizing across multiple pools'}]->(ks);

MATCH (s:TradingStrategy {name: 'CANSLIM Growth'})
MATCH (ks:KnowledgeSource {id: 'technical_analysis_murphy'})
MERGE (s)-[:SOURCED_FROM {chapter: 'Ch. 17', pages: '340-365', relevance: 'William O''Neil CANSLIM criteria: C,A,N,S,L,I,M mnemonic with filtering rules'}]->(ks);

// ── DEFI PROTOCOLS (10_defi_protocols) ───────────────────────

MATCH (p:DeFiProtocol {name: 'Uniswap V2'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (p)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '82-100', relevance: 'Uniswap V2 CPMM implementation, 0.3% fee, LP tokens, factory/router pattern'}]->(ks);

MATCH (p:DeFiProtocol {name: 'Uniswap V3'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (p)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '116-132', relevance: 'Uni V3 concentrated liquidity, tick system, 4 fee tiers, NFT LP positions'}]->(ks);

MATCH (p:DeFiProtocol {name: 'Curve Finance'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (p)-[:SOURCED_FROM {chapter: 'Ch. 4', pages: '107-118', relevance: 'StableSwap invariant, A parameter, veCRV governance model, 3pool'}]->(ks);

MATCH (p:DeFiProtocol {name: 'Aave'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (p)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '132-170', relevance: 'Aave V2/V3 architecture, interest rate model, health factor, flash loans, aTokens'}]->(ks);

MATCH (p:DeFiProtocol {name: 'Compound'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (p)-[:SOURCED_FROM {chapter: 'Ch. 5', pages: '130-155', relevance: 'Compound cToken model, COMP token launch, decentralized interest rate markets'}]->(ks);

MATCH (p:DeFiProtocol {name: 'MakerDAO'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (p)-[:SOURCED_FROM {chapter: 'Ch. 6', pages: '170-200', relevance: 'DAI stability mechanism, CDP, stability fee, liquidation, emergency shutdown'}]->(ks);

MATCH (p:DeFiProtocol {name: 'Chainlink'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (p)-[:SOURCED_FROM {chapter: 'Ch. 7', pages: '215-245', relevance: 'Chainlink DON, oracle aggregation, deviation threshold, heartbeat, LINK incentives'}]->(ks);

MATCH (p:DeFiProtocol {name: 'Lido'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (p)-[:SOURCED_FROM {chapter: 'Ch. 9', pages: '275-290', relevance: 'liquid staking mechanics, stETH rebase, validator node operator risk'}]->(ks);

MATCH (p:DeFiProtocol {name: 'dYdX'})
MATCH (ks:KnowledgeSource {id: 'harvey_defi_future'})
MERGE (p)-[:SOURCED_FROM {chapter: 'Ch. 6', pages: '195-220', relevance: 'perpetual DEX order book, funding rate mechanism, isolated vs cross-margin'}]->(ks);

// ── EXISTING PSYCHIC-INVENTION CONCEPTS → M1-M7 SOURCES ──────

// M1: VaR and Classical Portfolio Theory
MATCH (c:TransactConcept {name: 'Value at Risk'})
MATCH (ks:KnowledgeSource {id: 'm1_var_classical'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 1, Ch. 2', pages: '1-45', relevance: 'VaR_α definition, parametric/historical/MC methods, backtesting, regulatory context'}]->(ks);

MATCH (c:TransactConcept {name: 'Expected Shortfall'})
MATCH (ks:KnowledgeSource {id: 'm1_var_classical'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 1, Ch. 2', pages: '30-50', relevance: 'CVaR/ES as coherent risk measure, ES vs VaR comparison'}]->(ks);

MATCH (c:TransactConcept {name: 'Mean-Variance Optimization'})
MATCH (ks:KnowledgeSource {id: 'm1_classical_portfolio'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 1, Ch. 3-4', pages: '50-105', relevance: 'Markowitz 1952, efficient frontier derivation, two-fund separation'}]->(ks);

MATCH (c:TransactConcept {name: 'Sharpe Ratio'})
MATCH (ks:KnowledgeSource {id: 'm1_sample_moments'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 1 Sample Moments', pages: '1-40', relevance: 'sample Sharpe ratio, estimation error, bias corrections'}]->(ks);

// M2: Advanced portfolio theory
MATCH (c:TransactConcept {name: 'Risk Parity'})
MATCH (ks:KnowledgeSource {id: 'm2_beyond_mv'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 2, Beyond MV', pages: '1-35', relevance: 'equal risk contribution, risk parity vs MVO, implementation'}]->(ks);

MATCH (c:TransactConcept {name: 'Factor Model'})
MATCH (ks:KnowledgeSource {id: 'm2_factor_models'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 2, Factor Models', pages: '1-40', relevance: 'APT, multi-factor models, risk decomposition'}]->(ks);

// M3: Black-Litterman
MATCH (c:TransactConcept {name: 'Black-Litterman Model'})
MATCH (ks:KnowledgeSource {id: 'm3_blm'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 3, BLM', pages: '1-55', relevance: 'BL posterior formula, view matrix P, uncertainty matrix Omega, τ calibration'}]->(ks);

MATCH (c:TransactConcept {name: 'Reverse Optimization'})
MATCH (ks:KnowledgeSource {id: 'm3_blm'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 3, BLM', pages: '10-25', relevance: 'implied returns π = δΣw_mkt, CAPM equilibrium as prior'}]->(ks);

// M4: Behavioral finance
MATCH (c:TransactConcept {name: 'Prospect Theory'})
MATCH (ks:KnowledgeSource {id: 'm4_behavioral'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 4, Ch. 2', pages: '20-50', relevance: 'Kahneman-Tversky value function, probability weighting, framing effects'}]->(ks);

MATCH (c:TransactConcept {name: 'Loss Aversion'})
MATCH (ks:KnowledgeSource {id: 'm4_behavioral'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 4, Ch. 2', pages: '25-40', relevance: 'λ≈2.25 loss aversion coefficient, disposition effect, reference point'}]->(ks);

MATCH (c:TransactConcept {name: 'Behavioral Portfolio Theory'})
MATCH (ks:KnowledgeSource {id: 'm4_behavioral_bpt'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 4, BPT', pages: '1-35', relevance: 'layered portfolio construction, safety-first aspiration levels'}]->(ks);

// M5: Kelly / Risk Parity
MATCH (c:TransactConcept {name: 'Kelly Criterion'})
MATCH (ks:KnowledgeSource {id: 'm5_kelly_risk_parity'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 5, Ch. 1', pages: '1-45', relevance: 'log-wealth maximization, f* derivation, binary and continuous Kelly'}]->(ks);

MATCH (c:TransactConcept {name: 'Hierarchical Risk Parity'})
MATCH (ks:KnowledgeSource {id: 'm5_hrp'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 5 / M7, HRP', pages: '1-30', relevance: 'HRP: correlation distance, single-linkage clustering, quasi-diag, recursive bisection'}]->(ks);

// M6: Factor investing
MATCH (c:TransactConcept {name: 'Fama-French Factors'})
MATCH (ks:KnowledgeSource {id: 'm6_factor_investing'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 6, Ch. 3', pages: '40-75', relevance: 'FF3/FF5 factor construction, Fama-MacBeth cross-sectional regression'}]->(ks);

MATCH (c:TransactConcept {name: 'Smart Beta'})
MATCH (ks:KnowledgeSource {id: 'm6_factor_investing'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 6, Ch. 2', pages: '20-40', relevance: 'smart beta products, factor tilts, index construction methodology'}]->(ks);

MATCH (c:TransactConcept {name: 'Covariance Shrinkage'})
MATCH (ks:KnowledgeSource {id: 'm6_factor_investing'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 6, Ch. 4', pages: '70-100', relevance: 'Ledoit-Wolf shrinkage, analytical shrinkage formula, oracle estimator'}]->(ks);

// M7: Information theory and graphs
MATCH (c:TransactConcept {name: 'Hierarchical Risk Parity'})
MATCH (ks:KnowledgeSource {id: 'm7_hrp_info_theory'})
MERGE (c)-[:ALSO_IN {note: 'HRP graph perspective: minimum spanning tree from correlation distance matrix'}]->(ks);

MATCH (c:TransactConcept {name: 'Correlation Distance'})
MATCH (ks:KnowledgeSource {id: 'm7_hrp_info_theory'})
MERGE (c)-[:SOURCED_FROM {chapter: 'Module 7', pages: '1-20', relevance: 'correlation distance d=√(2(1-ρ)), ultrametric, dendrogram construction'}]->(ks);

// ── INDEXES FOR NEW RELATIONSHIP TYPES ────────────────────────

CREATE INDEX sourced_from_relevance IF NOT EXISTS
FOR ()-[r:SOURCED_FROM]-() ON (r.relevance);
