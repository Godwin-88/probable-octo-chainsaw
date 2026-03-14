// ============================================================
// 09_defi_primitives.cypher
// DeFi primitives, mechanisms, and core protocols.
// Source: Harvey et al. (DeFi and the Future of Finance, 2021)
//         CoinGecko (How to DeFi: Advanced)
//         Antonopoulos (Mastering Ethereum)
// ============================================================

// ── DEFI INFRASTRUCTURE PRIMITIVES ───────────────────────────

MERGE (c:TransactConcept {name: 'Decentralized Finance'})
SET c.definition = 'Open, permissionless financial system built on public blockchains. Harvey et al. (2021): "DeFi seeks to build and combine open-source financial building blocks into sophisticated products with minimized friction." Solves 5 CeFi problems: centralized control, limited access, inefficiency, lack of interoperability, opacity.',
    c.category = 'defi_fundamentals',
    c.difficulty = 'basic',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'blockchain;smart contracts;tokens;composability',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'I: Introduction',
    c.source_pages = '1-7';
MATCH (c:TransactConcept {name: 'Decentralized Finance'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Composability'})
SET c.definition = '"Money Legos": DeFi protocols interoperate permissionlessly. Any protocol can call any other via smart contracts. Enables novel product combinations (e.g., flash loan + DEX swap + yield deposit in one tx). Network effect multiplies with each new primitive added. Core DeFi superpower vs. siloed TradFi.',
    c.category = 'defi_fundamentals',
    c.difficulty = 'basic',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'smart contracts;protocols;atomic transactions',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'V: Problems DeFi Solves',
    c.source_pages = '65-68';
MATCH (c:TransactConcept {name: 'Composability'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Automated Market Maker'})
SET c.definition = 'Smart contract that acts as perpetual liquidity provider using an invariant function. No order book; price set by mathematical formula. Uniswap V2: x·y=k (CPMM). Trades against liquidity pool. Any user can become LP by depositing both tokens. Enables 24/7 permissionless trading.',
    c.category = 'dex_mechanisms',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'liquidity pools;invariant;price impact;impermanent loss',
    c.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced',
    c.source_chapter = 'VI: DeFi Deep Dive — Decentralized Exchange',
    c.source_pages = '95-104';
MATCH (c:TransactConcept {name: 'Automated Market Maker'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Constant Product Market Maker'})
SET c.definition = 'AMM invariant x·y = k where x,y = token reserves. Trade: buy Δy units costs Δx = x·Δy/(y-Δy). Spot price = y/x. Price impact = f(trade size / pool depth). Pioneered by Uniswap V2. Guarantees liquidity at all prices (k never depletes) but causes impermanent loss for LPs.',
    c.category = 'dex_mechanisms',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'AMM;reserves;invariant;price impact;slippage',
    c.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';
MATCH (c:TransactConcept {name: 'Constant Product Market Maker'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Impermanent Loss'})
SET c.definition = 'Loss suffered by AMM LPs relative to holding tokens 1:1. Caused by price divergence between deposited assets. IL(r) = 2√r/(1+r) - 1 where r = price ratio change. At r=1.25: IL≈0.6%, r=1.5: IL≈2%, r=2: IL≈5.7%, r=4: IL≈20%. Only "permanent" if LP withdraws after divergence. Partially offset by trading fees.',
    c.category = 'lp_risk',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Risk',
    c.prerequisites = 'AMM;liquidity provision;price ratio;fee income;hedging',
    c.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';
MATCH (c:TransactConcept {name: 'Impermanent Loss'}), (m:Menu {name: 'DeFi Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Concentrated Liquidity'})
SET c.definition = 'Uniswap V3 innovation: LPs specify price range [P_a, P_b] for capital deployment. Capital only earns fees when price within range. Virtual reserves: x_virt = x + L/√P_b, y_virt = y + L·√P_a. Up to 4000× capital efficiency vs V2 for stablecoin pairs. Requires active management.',
    c.category = 'dex_mechanisms',
    c.difficulty = 'advanced',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'AMM;tick;liquidity;price range;NFT LP position',
    c.source_ids = 'coingecko_how_to_defi_advanced';
MATCH (c:TransactConcept {name: 'Concentrated Liquidity'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Decentralized Exchange'})
SET c.definition = 'Non-custodial trading venue on-chain. No counterparty risk, no KYC (permissionless), 24/7 operation. Types: AMM-based (Uniswap, Curve, Balancer), order-book (dYdX v3, Serum), aggregators (1inch, Paraswap). Volume grew from ~$1B/month (2020) to ~$100B/month (2021 peak). Harvey et al. Ch. VI.',
    c.category = 'dex_mechanisms',
    c.difficulty = 'basic',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'AMM;liquidity pool;slippage;MEV;front-running',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'VI: DeFi Deep Dive — Decentralized Exchange',
    c.source_pages = '95-104';
MATCH (c:TransactConcept {name: 'Decentralized Exchange'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Liquidity Pool'})
SET c.definition = 'Smart contract holding reserves of two or more tokens funded by LPs. LPs receive LP tokens representing pro-rata share of pool. Fees (typically 0.3% Uniswap V2, 0.05%/0.3%/1% V3) accrue to pool. LP token value = f(pool reserves + accumulated fees). Redeemable anytime.',
    c.category = 'dex_mechanisms',
    c.difficulty = 'basic',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'AMM;LP tokens;fee accrual;reserve ratio',
    c.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';
MATCH (c:TransactConcept {name: 'Liquidity Pool'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Collateralized Lending'})
SET c.definition = 'DeFi lending where borrowers over-collateralize to borrow. Collateral ratio (CR) = collateral_value / loan_value ≥ minimum_CR. If CR falls below liquidation threshold → liquidators repay debt + receive collateral at discount. Aave/Compound: algorithmic interest rates (utilization-based). No credit scoring required.',
    c.category = 'defi_lending',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'collateral;liquidation;health factor;LTV;interest rate model',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'VI: DeFi Deep Dive — Credit/Lending',
    c.source_pages = '69-94';
MATCH (c:TransactConcept {name: 'Collateralized Lending'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Flash Loan'})
SET c.definition = 'Uncollateralized loan borrowed and repaid within one atomic transaction. If not repaid → entire tx reverts (no loss to protocol). Enables: arbitrage, collateral swaps, self-liquidation, governance attacks. First introduced by Aave (2020). Demonstrates composability: borrow → trade → repay in single block.',
    c.category = 'defi_lending',
    c.difficulty = 'advanced',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'atomic transactions;arbitrage;composability;Aave;MEV',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'IV: DeFi Primitives — Flash Loans',
    c.source_pages = '56-57';
MATCH (c:TransactConcept {name: 'Flash Loan'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Stablecoin'})
SET c.definition = 'Cryptocurrency maintaining stable value vs reference asset (usually USD). Types: (1) Fiat-backed: USDC, USDT (centralized, 1:1 reserve); (2) Crypto-collateralized: DAI (MakerDAO, over-collateralized with ETH/WBTC, CDP system); (3) Algorithmic: UST (failed), FRAX (partially collateralized). Harvey et al. Ch. III.',
    c.category = 'tokens',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'peg mechanism;collateral;mint/burn;oracle price feed;depeg risk',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'III: DeFi Infrastructure — Stablecoins',
    c.source_pages = '24-26';
MATCH (c:TransactConcept {name: 'Stablecoin'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Oracle'})
SET c.definition = 'Bridge bringing off-chain data on-chain for smart contracts. Problem: blockchains have no native internet access. Chainlink: decentralized oracle network; node operators fetch data, submit on-chain; aggregated via median. Pyth: high-frequency price data from institutional contributors. Critical for DeFi lending (price feeds) and derivatives. Single point of failure risk.',
    c.category = 'defi_infrastructure',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'price feed;data aggregation;oracle manipulation;TWAP',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'III: DeFi Infrastructure — Oracles',
    c.source_pages = '23-24';
MATCH (c:TransactConcept {name: 'Oracle'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Fungible Token'})
SET c.definition = 'ERC-20 standard token where each unit is interchangeable. Interface: transfer(), transferFrom(), approve(), allowance(), balanceOf(). Total supply fixed at mint. Examples: USDC (stablecoin), UNI (governance), WETH (wrapped ETH). Underpins all DeFi liquidity. Harvey et al. Ch. IV p.32.',
    c.category = 'tokens',
    c.difficulty = 'basic',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'ERC-20;approval;allowance;transfer',
    c.source_ids = 'harvey_defi_future;antonopoulos_mastering_ethereum',
    c.source_chapter = 'IV: DeFi Primitives — Fungible Tokens',
    c.source_pages = '32-36';
MATCH (c:TransactConcept {name: 'Fungible Token'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Non-Fungible Token'})
SET c.definition = 'ERC-721 token with unique tokenId. Each NFT has distinct attributes stored on-chain or via URI to IPFS metadata. Key functions: ownerOf(), safeTransferFrom(), tokenURI(). Use cases: digital art (Bored Apes), DeFi LP positions (Uniswap V3), real-world asset tokenization, gaming. Harvey et al. p.37.',
    c.category = 'tokens',
    c.difficulty = 'basic',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'ERC-721;tokenId;metadata;IPFS;royalties',
    c.source_ids = 'harvey_defi_future;antonopoulos_mastering_ethereum',
    c.source_chapter = 'IV: DeFi Primitives — Non-Fungible Tokens',
    c.source_pages = '37-38';
MATCH (c:TransactConcept {name: 'Non-Fungible Token'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Decentralized Application'})
SET c.definition = 'Application with backend logic on blockchain (smart contracts) and frontend via web interface calling contract ABIs. Properties inherited from blockchain: censorship resistance, trustlessness, global access. Frontend typically hosted on IPFS for full decentralization. Examples: Uniswap, Aave, Compound, MakerDAO.',
    c.category = 'defi_fundamentals',
    c.difficulty = 'basic',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'smart contracts;ABI;web3.js;ethers.js;IPFS;wallet',
    c.source_ids = 'harvey_defi_future;antonopoulos_mastering_ethereum',
    c.source_chapter = 'III: DeFi Infrastructure — Decentralized Applications',
    c.source_pages = '27-28';
MATCH (c:TransactConcept {name: 'Decentralized Application'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Governance Token'})
SET c.definition = 'Token granting voting rights on protocol parameters. Proposals → voting period → timelock → execution. veTokenomics (vote-escrowed): lock tokens for veTOKEN; voting power = tokens × lock duration. Examples: UNI (Uniswap), AAVE (Aave), CRV (Curve veTokenomics). Enables decentralized protocol governance. Governance risk: low participation, whale capture, governance attacks.',
    c.category = 'defi_governance',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'voting;proposal;timelock;quorum;veTokenomics;DAO',
    c.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced',
    c.source_chapter = 'VII: Risks — Governance Risk',
    c.source_pages = '135-136';
MATCH (c:TransactConcept {name: 'Governance Token'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Yield Farming'})
SET c.definition = 'Maximizing yield by actively moving capital across DeFi protocols to capture highest APY. Strategies: provide liquidity + earn governance tokens (liquidity mining), lend assets on multiple protocols, leverage yield positions. Risks: smart contract bugs, IL, gas costs eating returns, governance token inflation. APY often inflated by token rewards.',
    c.category = 'yield_strategies',
    c.difficulty = 'intermediate',
    c.menu_context = 'Yield Strategies',
    c.prerequisites = 'AMM;lending;governance tokens;APY;compounding;gas costs',
    c.source_ids = 'coingecko_how_to_defi_advanced;harvey_defi_future';
MATCH (c:TransactConcept {name: 'Yield Farming'}), (m:Menu {name: 'Yield Strategies'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Liquidity Mining'})
SET c.definition = 'Protocol distributes governance tokens to LPs as additional incentive on top of trading fees. Bootstraps liquidity for new protocols. APY = (fee APR) + (token_reward × token_price / LP_value). Mercenary capital problem: LPs exit when rewards drop. Introduced by Compound (COMP distribution, 2020).',
    c.category = 'yield_strategies',
    c.difficulty = 'intermediate',
    c.menu_context = 'Yield Strategies',
    c.prerequisites = 'governance tokens;LP tokens;farming;token emissions;vesting',
    c.source_ids = 'coingecko_how_to_defi_advanced;harvey_defi_future';
MATCH (c:TransactConcept {name: 'Liquidity Mining'}), (m:Menu {name: 'Yield Strategies'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'TWAP Oracle'})
SET c.definition = 'Time-Weighted Average Price: P_TWAP = (cumPrice_t2 - cumPrice_t1) / (t2 - t1). Uniswap V2/V3 accumulate cumulative prices per second on-chain. TWAP over 30-min window resists manipulation (attacker must hold manipulated price for entire window at profit loss). Preferred over spot price for on-chain oracle.',
    c.category = 'defi_infrastructure',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Risk',
    c.prerequisites = 'oracle;price manipulation;cumulative price;block timestamp',
    c.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';
MATCH (c:TransactConcept {name: 'TWAP Oracle'}), (m:Menu {name: 'DeFi Risk'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Tokenization'})
SET c.definition = 'Representing real-world assets (RWA) as blockchain tokens. Types: (1) Security tokens (equity, debt); (2) Asset-backed (gold: PAXG, real estate); (3) Synthetic assets (Synthetix: sUSD, sETH mimicking TradFi assets). Benefits: fractional ownership, 24/7 trading, programmability. Harvey et al. Ch. VI p.124.',
    c.category = 'tokens',
    c.difficulty = 'intermediate',
    c.menu_context = 'DeFi Protocols',
    c.prerequisites = 'ERC-20;security tokens;synthetic assets;custody;regulatory compliance',
    c.source_ids = 'harvey_defi_future',
    c.source_chapter = 'VI: DeFi Deep Dive — Tokenization',
    c.source_pages = '124-129';
MATCH (c:TransactConcept {name: 'Tokenization'}), (m:Menu {name: 'DeFi Protocols'})
MERGE (c)-[:BELONGS_TO]->(m);
