// ============================================================
// 10_defi_protocols.cypher
// Specific DeFi protocol nodes, their mechanisms, and parameters.
// Source: Harvey et al. (2021), CoinGecko How to DeFi: Advanced
// ============================================================

// ── PROTOCOL NODE TYPE ────────────────────────────────────────

MERGE (p:DeFiProtocol {name: 'Uniswap V2'})
SET p.category = 'dex_amm',
    p.chain = 'ethereum',
    p.invariant = 'x * y = k',
    p.fee_tiers = ['0.3%'],
    p.token_standard = 'ERC-20',
    p.lp_token = 'ERC-20',
    p.launched = 2020,
    p.description = 'Constant product AMM. Any ERC-20/ERC-20 pair. Trading fee 0.3% to LPs. Introduced TWAP oracle. No concentrated liquidity.',
    p.tvl_peak_usd = '10B+',
    p.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

MERGE (p:DeFiProtocol {name: 'Uniswap V3'})
SET p.category = 'dex_amm',
    p.chain = 'ethereum,polygon,arbitrum,optimism',
    p.invariant = 'concentrated_liquidity_ranged',
    p.fee_tiers = ['0.01%', '0.05%', '0.3%', '1%'],
    p.token_standard = 'ERC-20',
    p.lp_token = 'ERC-721 NFT (position)',
    p.launched = 2021,
    p.description = 'Concentrated liquidity AMM. LPs set price ranges [Pa,Pb]. Up to 4000x capital efficiency for stable pairs. Active liquidity management required. TWAP oracle v2.',
    p.tvl_peak_usd = '5B+',
    p.source_ids = 'coingecko_how_to_defi_advanced';

MERGE (p:DeFiProtocol {name: 'Curve Finance'})
SET p.category = 'dex_amm_stablecoin',
    p.chain = 'ethereum,polygon,arbitrum,avalanche',
    p.invariant = 'StableSwap: A*n^n*sum(x_i) + D = A*D*n^n + D^(n+1)/(n^n*prod(x_i))',
    p.fee_tiers = ['0.01%-0.04%'],
    p.launched = 2020,
    p.description = 'Stablecoin/pegged asset AMM. StableSwap invariant blends CPMM+CSMM for low slippage near peg. veCRV tokenomics: lock CRV for voting power on gauge weights (emissions). Critical infrastructure for stablecoin trading.',
    p.tvl_peak_usd = '20B+',
    p.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

MERGE (p:DeFiProtocol {name: 'Balancer'})
SET p.category = 'dex_amm_weighted',
    p.chain = 'ethereum,polygon,arbitrum',
    p.invariant = 'prod(x_i^w_i) = k (weighted geometric mean)',
    p.fee_tiers = ['0.0001%-10% (pool-configurable)'],
    p.launched = 2020,
    p.description = 'Multi-token weighted AMM. Generalizes Uniswap to n assets with arbitrary weights (e.g., 80/20 ETH/USDC). Enables self-rebalancing index portfolios on-chain. Boosted pools (yield-bearing). veBAL tokenomics.',
    p.source_ids = 'coingecko_how_to_defi_advanced';

MERGE (p:DeFiProtocol {name: 'Aave'})
SET p.category = 'lending_borrowing',
    p.chain = 'ethereum,polygon,arbitrum,avalanche,optimism',
    p.launched = 2020,
    p.description = 'Over-collateralized lending protocol. Interest rates: utilization-based kink model. aTokens: interest-bearing ERC-20 (1:1 with underlying, appreciate in balance). Flash loans (fee 0.09%). Risk parameters per asset: LTV, liquidation threshold, liquidation bonus. Safety module: AAVE stakers cover shortfall events.',
    p.interest_rate_model = 'utilization kink: R = R_0 + U*R_1 if U<U_opt else R_0 + R_1 + (U-U_opt)/(1-U_opt)*R_2',
    p.tvl_peak_usd = '18B+',
    p.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced',
    p.source_pages = '69-94';

MERGE (p:DeFiProtocol {name: 'Compound'})
SET p.category = 'lending_borrowing',
    p.chain = 'ethereum',
    p.launched = 2019,
    p.description = 'First major DeFi lending protocol. cTokens: interest-bearing (exchange rate increases). Pioneered liquidity mining (COMP token distribution). Governance: COMP holders vote on risk params. Borrowing capacity = collateral * collateral factor. Account liquidity maintained; liquidation if negative.',
    p.interest_rate_model = 'linear/jump utilization model',
    p.tvl_peak_usd = '12B+',
    p.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

MERGE (p:DeFiProtocol {name: 'MakerDAO'})
SET p.category = 'stablecoin_cdp',
    p.chain = 'ethereum',
    p.launched = 2017,
    p.description = 'Decentralized stablecoin protocol. DAI: over-collateralized, USD-pegged. Collateralized Debt Position (CDP): lock ETH/WBTC/LP tokens → mint DAI. Stability fee = interest on DAI debt. Liquidation penalty 13%. DSR (DAI Savings Rate) for demand. MKR token: governance + recapitalization.',
    p.dai_peg_mechanism = 'collateral + PSM (Peg Stability Module) + DSR',
    p.min_collateral_ratio = '150% for ETH',
    p.tvl_peak_usd = '20B+',
    p.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

MERGE (p:DeFiProtocol {name: 'Chainlink'})
SET p.category = 'oracle_network',
    p.chain = 'ethereum,polygon,arbitrum,avalanche,bsc',
    p.launched = 2019,
    p.description = 'Decentralized oracle network. Node operators: fetch data from APIs, aggregate off-chain, submit on-chain. Aggregation: median of node responses. Data feeds: price feeds (ETH/USD, BTC/USD), randomness (VRF), proof of reserve. DON (Decentralized Oracle Network) for each feed. LINK token: payment for node services.',
    p.update_mechanism = 'deviation threshold (0.5%) OR heartbeat (1h)',
    p.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced',
    p.source_pages = '23-24';

MERGE (p:DeFiProtocol {name: 'Synthetix'})
SET p.category = 'synthetic_assets',
    p.chain = 'ethereum,optimism',
    p.launched = 2018,
    p.description = 'Synthetic asset protocol. SNX stakers collateralize synthetic assets (Synths). C-ratio maintained (>400% default). sUSD: synthetic USD; sETH, sBTC, sFX, sStocks. Infinite liquidity (no LP needed): trades against debt pool. Stakers take on proportional debt exposure. Perps V2 on Optimism: funding rate mechanism.',
    p.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

MERGE (p:DeFiProtocol {name: 'Lido'})
SET p.category = 'liquid_staking',
    p.chain = 'ethereum',
    p.launched = 2020,
    p.description = 'Liquid staking protocol. Stake ETH → receive stETH (1:1, rebasing). stETH accrues staking rewards daily. Solves ETH staking illiquidity: stETH tradeable on DEXs. Node operator set curated by DAO. stETH/ETH peg risk during market stress. ~30% of all staked ETH by 2023.',
    p.source_ids = 'coingecko_how_to_defi_advanced';

MERGE (p:DeFiProtocol {name: 'dYdX'})
SET p.category = 'derivatives_dex',
    p.chain = 'starkware_l2,cosmos',
    p.launched = 2020,
    p.description = 'Decentralized perpetual futures exchange. Funding rate mechanism (same as CEX perps). Up to 25x leverage. Order book matching via off-chain engine, settlement on-chain. V4: sovereign app-chain on Cosmos. Largest decentralized perp venue by volume.',
    p.funding_mechanism = 'hourly funding rate = (mark_price - index_price) / index_price * (1/24)',
    p.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

// ── PROTOCOL → CONCEPT RELATIONSHIPS ─────────────────────────

MATCH (p:DeFiProtocol {name: 'Uniswap V2'}), (c:TransactConcept {name: 'Constant Product Market Maker'})
MERGE (p)-[:IMPLEMENTS]->(c);

MATCH (p:DeFiProtocol {name: 'Uniswap V3'}), (c:TransactConcept {name: 'Concentrated Liquidity'})
MERGE (p)-[:IMPLEMENTS]->(c);

MATCH (p:DeFiProtocol {name: 'Uniswap V2'}), (c:TransactConcept {name: 'TWAP Oracle'})
MERGE (p)-[:PROVIDES]->(c);

MATCH (p:DeFiProtocol {name: 'Aave'}), (c:TransactConcept {name: 'Flash Loan'})
MERGE (p)-[:IMPLEMENTS]->(c);

MATCH (p:DeFiProtocol {name: 'Aave'}), (c:TransactConcept {name: 'Collateralized Lending'})
MERGE (p)-[:IMPLEMENTS]->(c);

MATCH (p:DeFiProtocol {name: 'Compound'}), (c:TransactConcept {name: 'Collateralized Lending'})
MERGE (p)-[:IMPLEMENTS]->(c);

MATCH (p:DeFiProtocol {name: 'Compound'}), (c:TransactConcept {name: 'Liquidity Mining'})
MERGE (p)-[:PIONEERED]->(c);

MATCH (p:DeFiProtocol {name: 'MakerDAO'}), (c:TransactConcept {name: 'Stablecoin'})
MERGE (p)-[:IMPLEMENTS]->(c);

MATCH (p:DeFiProtocol {name: 'Chainlink'}), (c:TransactConcept {name: 'Oracle'})
MERGE (p)-[:IMPLEMENTS]->(c);

MATCH (p:DeFiProtocol {name: 'Curve Finance'}), (c:TransactConcept {name: 'Liquidity Pool'})
MERGE (p)-[:OPTIMIZES]->(c);

MATCH (p:DeFiProtocol {name: 'Lido'}), (c:TransactConcept {name: 'Fungible Token'})
MERGE (p)-[:ISSUES {token: 'stETH', type: 'liquid_staking_token'}]->(c);

MATCH (p:DeFiProtocol {name: 'dYdX'}), (c:TransactConcept {name: 'Decentralized Exchange'})
MERGE (p)-[:IMPLEMENTS]->(c);

// ── PROTOCOL INDEXES ─────────────────────────────────────────
CREATE INDEX defi_protocol_name IF NOT EXISTS FOR (p:DeFiProtocol) ON (p.name);
CREATE INDEX defi_protocol_category IF NOT EXISTS FOR (p:DeFiProtocol) ON (p.category);
