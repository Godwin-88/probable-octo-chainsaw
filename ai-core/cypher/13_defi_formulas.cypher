// ============================================================
// 13_defi_formulas.cypher
// DeFi and Web3 mathematical formulas to extend TransactFormula nodes.
// Source: Harvey et al. (DeFi), Antonopoulos (Mastering Ethereum),
//         CoinGecko (How to DeFi Advanced), Math of Arbitrage (Delbaen)
// ============================================================

// ── AMM FORMULAS ─────────────────────────────────────────────

MERGE (f:TransactFormula {name: 'CPMM Invariant'})
SET f.equation = 'x · y = k',
    f.description = 'Constant Product Market Maker: product of token reserves is constant. Trade Δy units of Y costs Δx = x·Δy/(y-Δy) units of X. Spot price = dy/dx = y/x.',
    f.variables = ['x=reserve_X', 'y=reserve_Y', 'k=invariant'],
    f.assumptions = ['no fees (for pure invariant)', 'lossless computation', 'atomic transactions'],
    f.domain = 'defi_dex',
    f.protocol_reference = 'Uniswap V2',
    f.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

MERGE (f:TransactFormula {name: 'CPMM Price Impact'})
SET f.equation = 'price_impact = Δy/y · 100% ≈ (amountIn / (reserveIn + amountIn)) · 100%',
    f.description = 'Percentage price impact of a trade in a CPMM. Large trades relative to pool depth have higher impact. Slippage = difference between expected and executed price.',
    f.variables = ['amountIn', 'reserveIn', 'reserveOut', 'Δy=amountOut'],
    f.assumptions = ['CPMM invariant', 'fee ignored for estimate'],
    f.domain = 'defi_dex',
    f.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

MERGE (f:TransactFormula {name: 'AMM Output Amount'})
SET f.equation = 'amountOut = (reserveOut · amountIn · (1-fee)) / (reserveIn + amountIn · (1-fee))',
    f.description = 'Exact output of a Uniswap V2 swap given input amount, reserves, and fee. Derivation from x·y=k with fee applied to input.',
    f.variables = ['amountIn', 'amountOut', 'reserveIn', 'reserveOut', 'fee=0.003'],
    f.assumptions = ['CPMM invariant', 'fee applied to amountIn'],
    f.domain = 'defi_dex',
    f.protocol_reference = 'Uniswap V2',
    f.source_ids = 'coingecko_how_to_defi_advanced';

MERGE (f:TransactFormula {name: 'Impermanent Loss'})
SET f.equation = 'IL(r) = 2√r/(1+r) - 1  where r = P_new/P_initial',
    f.description = 'Percentage loss of an LP position vs holding 50/50. r=1.25: IL=-0.6%; r=1.5: IL=-2.0%; r=2: IL=-5.7%; r=4: IL=-20.0%. Always negative for price-diverging assets. Offset by fee income over time.',
    f.variables = ['r=price_ratio_change', 'P_new', 'P_initial'],
    f.assumptions = ['CPMM invariant', '50/50 initial position', 'no fee income'],
    f.domain = 'lp_risk',
    f.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

MERGE (f:TransactFormula {name: 'LP Net APY'})
SET f.equation = 'Net_APY = fee_APY + reward_APY - IL_rate - gas_cost_rate',
    f.description = 'Total net APY for an LP position. fee_APY = trading_fees_annualized / LP_value. reward_APY = governance_token_rewards_annualized / LP_value. Must be positive after IL and gas to be profitable vs holding.',
    f.variables = ['fee_APY', 'reward_APY', 'IL_rate', 'gas_cost_rate'],
    f.assumptions = ['constant token prices for simplification', 'fees accrue continuously'],
    f.domain = 'yield_calculation',
    f.source_ids = 'coingecko_how_to_defi_advanced;harvey_defi_future';

MERGE (f:TransactFormula {name: 'StableSwap Invariant'})
SET f.equation = 'A · n^n · Σxᵢ + D = A · D · n^n + D^(n+1) / (n^n · Πxᵢ)',
    f.description = 'Curve Finance StableSwap: hybrid CSMM+CPMM controlled by amplification A. A→0: CPMM (low slippage far from peg); A→∞: CSMM (zero slippage at peg). Optimal for stablecoins/pegged assets. D = total liquidity invariant.',
    f.variables = ['A=amplification_coefficient', 'n=number_of_tokens', 'xᵢ=token_reserves', 'D=invariant'],
    f.assumptions = ['equal-value pegged assets initially', 'A calibrated to target peg tolerance'],
    f.domain = 'defi_dex',
    f.protocol_reference = 'Curve Finance',
    f.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

// ── LENDING FORMULAS ──────────────────────────────────────────

MERGE (f:TransactFormula {name: 'Utilization Rate'})
SET f.equation = 'U = total_borrows / (total_borrows + total_cash)',
    f.description = 'Fraction of supplied liquidity currently borrowed. U=0: no borrowing, low rates. U=optimal (typically 80%): kink point. U=1: all liquidity borrowed, maximum rates (no exits possible). Used in Aave/Compound interest rate model.',
    f.variables = ['total_borrows', 'total_cash=available_liquidity'],
    f.assumptions = ['all borrows are outstanding', 'no defaults counted'],
    f.domain = 'defi_lending',
    f.protocol_reference = 'Aave;Compound',
    f.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

MERGE (f:TransactFormula {name: 'Aave Borrow Rate'})
SET f.equation = 'R_borrow = R₀ + (U/U_opt)·R₁  if U≤U_opt;  R_borrow = R₀ + R₁ + ((U-U_opt)/(1-U_opt))·R₂  if U>U_opt',
    f.description = 'Aave V2/V3 interest rate model with kink at U_opt. Below kink: linear increase. Above kink: steep increase to incentivize repayment. R₀=base rate, R₁=slope1, R₂=slope2 (jump multiplier). Calibrated per asset by DAO governance.',
    f.variables = ['U=utilization', 'U_opt=optimal_utilization', 'R₀', 'R₁', 'R₂'],
    f.assumptions = ['continuous compounding', 'kink model', 'parameters set by governance'],
    f.domain = 'defi_lending',
    f.protocol_reference = 'Aave',
    f.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

MERGE (f:TransactFormula {name: 'Health Factor'})
SET f.equation = 'HF = Σ(collateral_value_i × liquidation_threshold_i) / total_debt_value',
    f.description = 'Aave health factor. HF ≥ 1: position safe. HF < 1: eligible for liquidation. Collateral valued at oracle price. Liquidation threshold per asset (e.g., ETH=82.5%, USDC=86%). A liquidator repays up to 50% of debt + receives collateral + liquidation bonus (5-10%).',
    f.variables = ['collateral_value_i', 'liquidation_threshold_i', 'total_debt_value'],
    f.assumptions = ['oracle prices accurate', 'no extreme market movements mid-block'],
    f.domain = 'defi_lending',
    f.protocol_reference = 'Aave',
    f.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

MERGE (f:TransactFormula {name: 'Loan-to-Value'})
SET f.equation = 'LTV = loan_value / collateral_value × 100%',
    f.description = 'Maximum borrow amount as % of collateral value. Max LTV set by governance per asset (e.g., ETH=80%, wBTC=70%, USDC=86%). Borrow at max LTV → HF near 1 → high liquidation risk. Recommended: borrow at 50-60% LTV for safety margin.',
    f.variables = ['loan_value', 'collateral_value'],
    f.assumptions = ['oracle price accurate at time of borrowing'],
    f.domain = 'defi_lending',
    f.source_ids = 'harvey_defi_future';

// ── YIELD AND RETURN FORMULAS ─────────────────────────────────

MERGE (f:TransactFormula {name: 'APY from APR'})
SET f.equation = 'APY = (1 + APR/n)^n - 1',
    f.description = 'Annual Percentage Yield accounting for compounding. n=compounding periods per year. n=365 (daily), n=8760 (hourly), n→∞: APY = e^APR - 1 (continuous). DeFi protocols often display APY with auto-compounding assumed. Important: compare APY to APY, not APR to APY.',
    f.variables = ['APR=annual_percentage_rate', 'n=compounding_periods'],
    f.assumptions = ['constant APR', 'no gas costs for compounding'],
    f.domain = 'yield_calculation',
    f.source_ids = 'coingecko_how_to_defi_advanced';

MERGE (f:TransactFormula {name: 'Funding Rate Annualized'})
SET f.equation = 'Funding_Annual = funding_rate × payments_per_year  (typically ×3 per day × 365)',
    f.description = 'Perpetual futures funding rate annualized. dYdX/most perp DEXs: 3 payments/day. Rate = (mark - index) / index × (1/24h). Example: 0.01% per 8h = 0.03%/day = 10.95%/year. Delta-neutral strategy captures this yield.',
    f.variables = ['funding_rate=per_period_rate', 'mark_price', 'index_price', 'payments_per_year'],
    f.assumptions = ['stable funding rate assumption', 'ignores funding rate variance'],
    f.domain = 'derivatives_defi',
    f.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced';

MERGE (f:TransactFormula {name: 'On-Chain VaR'})
SET f.equation = 'DeFi_VaR_α = VaR_α(trad) + Liquidation_Risk_addon + Smart_Contract_Risk_addon',
    f.description = 'DeFi-augmented VaR adding on-chain specific risks to traditional parametric/historical VaR. Liquidation addon: probability of cascade liquidation × expected shortfall. Smart contract addon: probability of exploit × expected loss given exploit. Estimated from historical DeFi hack data.',
    f.variables = ['alpha', 'historical_returns', 'liquidation_threshold', 'exploit_probability'],
    f.assumptions = ['independent risk layers', 'historical hack data as proxy'],
    f.domain = 'defi_risk',
    f.source_ids = 'harvey_defi_future;m1_var_classical';

// ── CRYPTOGRAPHIC FORMULAS ────────────────────────────────────

MERGE (f:TransactFormula {name: 'Merkle Root'})
SET f.equation = 'root = H(H(H(d₁)||H(d₂)) || H(H(d₃)||H(d₄)))',
    f.description = 'Merkle root computation by iterative pairwise hashing. Inclusion proof for leaf dᵢ: provide sibling hashes on path from leaf to root (O(log n) hashes). Verifier recomputes root and checks against stored root. Used in Ethereum state trie, transaction inclusion proofs.',
    f.variables = ['H=hash_function', 'dᵢ=data_leaves', 'root=Merkle_root'],
    f.assumptions = ['collision-resistant hash function', 'balanced binary tree'],
    f.domain = 'cryptography',
    f.source_ids = 'cryptographic_primitives_blockchain;antonopoulos_mastering_ethereum';

MERGE (f:TransactFormula {name: 'EVM Gas Cost'})
SET f.equation = 'tx_fee_eth = gas_used × (base_fee + priority_tip) / 1e9',
    f.description = 'Ethereum transaction fee after EIP-1559. base_fee: burned (adjusts ±12.5% per block based on congestion target). priority_tip: paid to validator. gas_used: sum of opcode costs. SSTORE (cold write) = 20000 gas; SLOAD (cold read) = 2100 gas. Key QuantiNova constraint: max_gas_cost_usd.',
    f.variables = ['gas_used', 'base_fee_gwei', 'priority_tip_gwei', 'eth_price_usd'],
    f.assumptions = ['EIP-1559 fee market', 'accurate gas estimation'],
    f.domain = 'blockchain_economics',
    f.source_ids = 'antonopoulos_mastering_ethereum;learn_ethereum_2e';

MERGE (f:TransactFormula {name: 'ECDSA Private to Public Key'})
SET f.equation = 'K = k · G  (elliptic curve point multiplication on secp256k1)',
    f.description = 'Ethereum address derivation: private key k → public key K = k·G → address = last 20 bytes of Keccak-256(K). Security: discrete log problem on secp256k1 (256-bit key) — computationally infeasible to reverse. G is the generator point of secp256k1.',
    f.variables = ['k=private_key', 'G=generator_point', 'K=public_key'],
    f.assumptions = ['secp256k1 curve', 'uniform random k', 'collision-resistant Keccak-256'],
    f.domain = 'cryptography',
    f.source_ids = 'cryptographic_primitives_blockchain;antonopoulos_mastering_ethereum';

// ── ARBITRAGE PRICING FORMULAS ────────────────────────────────

MERGE (f:TransactFormula {name: 'No-Arbitrage Pricing (FTAP)'})
SET f.equation = 'V₀ = e^(-rT) · E^Q[V_T]  (risk-neutral pricing)',
    f.description = 'Fundamental Theorem of Asset Pricing (Delbaen-Schachermayer): No arbitrage ⟺ ∃ equivalent martingale measure Q. Asset price = discounted expected payoff under Q. DeFi extension: replace r with DeFi lending rate; VT = protocol payoff. Foundation of derivatives pricing applied to DeFi structured products.',
    f.variables = ['V₀=current_price', 'V_T=terminal_payoff', 'Q=risk_neutral_measure', 'r=risk_free_rate'],
    f.assumptions = ['no transaction costs', 'frictionless markets', 'continuous trading', 'NFLVR condition'],
    f.domain = 'mathematical_finance',
    f.source_ids = 'math_arbitrage;baxter_financial_calculus';

MERGE (f:TransactFormula {name: 'Flash Loan Arbitrage Profit'})
SET f.equation = 'Profit = V_sell - V_buy - flash_loan_fee - gas_cost\nwhere V_sell = amountOut_dex2, V_buy = amountIn_dex1\nflash_loan_fee = principal × 0.0009 (Aave)',
    f.description = 'Net profit from flash loan arbitrage: borrow X on Aave (0.09% fee) → buy Y on DEX1 → sell Y on DEX2 → repay X + fee. Requires: (V_sell - V_buy) > fee + gas. In practice: must account for both DEX price impacts reducing the spread.',
    f.variables = ['V_sell', 'V_buy', 'principal', 'flash_loan_fee=0.0009', 'gas_cost_eth'],
    f.assumptions = ['atomic transaction', 'deterministic DEX pricing', 'no MEV competition'],
    f.domain = 'defi_arbitrage',
    f.source_ids = 'harvey_defi_future;math_arbitrage';
