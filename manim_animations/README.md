# QuantiFire — Manim Animation Scripts (Season 1)

## Installation

```bash
pip install manim scipy numpy
```

## Render a single episode

```bash
# Low quality (fast preview)
manim -pql ep01_correlation.py CorrelationScene

# High quality (for upload)
manim -pqh ep01_correlation.py CorrelationScene

# 4K
manim -p --resolution=3840,2160 ep01_correlation.py CorrelationScene
```

## Batch render all 36 episodes

```bash
for f in ep*.py; do
  scene=$(grep "class.*Scene" "$f" | head -1 | sed 's/class \(.*\)(Scene):/\1/')
  manim -pql "$f" "$scene"
done
```

## Episode Index

| File | Scene Class | Episode Title |
|------|-------------|---------------|
| ep01_correlation.py | CorrelationScene | Why Correlation Matters More Than Returns |
| ep02_efficient_frontier.py | EfficientFrontierScene | The Efficient Frontier |
| ep03_sharpe_sortino.py | SharpeSortinoScene | Sharpe Ratio vs Sortino |
| ep04_var.py | VaRScene | Value at Risk |
| ep05_factor_models.py | FactorModelsScene | Factor Models |
| ep06_black_litterman.py | BlackLittermanScene | Black-Litterman Model |
| ep07_kelly_criterion.py | KellyScene | The Kelly Criterion |
| ep08_risk_parity.py | RiskParityScene | Risk Parity |
| ep09_momentum.py | MomentumScene | The Momentum Factor |
| ep10_hrp.py | HRPScene | Hierarchical Risk Parity |
| ep11_uniswap_amm.py | UniswapAMMScene | How Uniswap Works (x·y=k) |
| ep12_impermanent_loss.py | ImpermanentLossScene | Impermanent Loss |
| ep13_uniswap_v3.py | UniswapV3Scene | Uniswap V3 Concentrated Liquidity |
| ep14_curve_stableswap.py | CurveStableSwapScene | Curve Finance StableSwap |
| ep15_aave_lending.py | AaveLendingScene | Aave Lending & Liquidations |
| ep16_flash_loans.py | FlashLoanScene | Flash Loans |
| ep17_chainlink_oracles.py | ChainlinkScene | Chainlink Oracles |
| ep18_perpetuals_funding.py | PerpFundingScene | Perpetuals & Funding Rates |
| ep19_mev.py | MEVScene | MEV: The Invisible Tax |
| ep20_sandwich_attacks.py | SandwichScene | Sandwich Attacks |
| ep21_smart_contract_hacks.py | SmartContractHacksScene | Top 5 Smart Contract Hacks |
| ep22_governance_attacks.py | GovernanceAttackScene | Governance Attacks |
| ep23_liquidation_cascades.py | LiquidationCascadeScene | Liquidation Cascades |
| ep24_regulatory_risk.py | RegulatoryRiskScene | Regulatory Risk |
| ep25_defi_momentum.py | DeFiMomentumScene | DeFi Momentum Signals |
| ep26_stat_arb.py | StatArbScene | Statistical Arbitrage |
| ep27_delta_neutral.py | DeltaNeutralScene | Delta-Neutral Yield |
| ep28_defi_valuation.py | DeFiValuationScene | Valuing DeFi Protocols |
| ep29_onchain_alpha.py | OnChainAlphaScene | On-Chain Alpha |
| ep30_ecdsa_wallets.py | ECDSAScene | ECDSA Wallet Creation |
| ep31_gas_model.py | GasModelScene | EVM Gas Model |
| ep32_smart_contract_security.py | SmartContractSecurityScene | Smart Contract Security |
| ep33_pow_vs_pos.py | PoWvPoSScene | PoW vs PoS |
| ep34_prospect_theory.py | ProspectTheoryScene | Prospect Theory |
| ep35_behavioral_portfolio.py | BehavioralPortfolioScene | Behavioral Portfolio Theory |
| ep36_black_swan.py | BlackSwanScene | Black Swans |

## Color Palette (consistent across all episodes)

| Color | Hex | Usage |
|-------|-----|-------|
| Gold | #FFB700 | Titles, key formulas, channel brand |
| Teal | #00C896 | Positive signals, correct patterns, gains |
| Red | #FF4444 | Risk, losses, warnings, attacks |
| Blue | #4A90E2 | Data, secondary concepts |
| BG | #0D0D0D | Background |
