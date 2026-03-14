// ============================================================
// 07_defi_menus.cypher — Run after 01_menus.cypher
// Creates DeFi / Web3 Menu nodes for the QuantiNova agent.
// These extend the TRANSACT workspace menus with on-chain equivalents.
// ============================================================

MERGE (m:Menu {name: 'DeFi Protocols'})
  SET m.route = '/defi/protocols',
      m.description = 'Decentralized Finance protocol knowledge: AMM, lending, stablecoins, derivatives',
      m.domain = 'web3_defi';

MERGE (m:Menu {name: 'DeFi Risk'})
  SET m.route = '/defi/risk',
      m.description = 'DeFi-specific risks: smart contract, oracle, MEV, liquidation, impermanent loss',
      m.domain = 'web3_defi';

MERGE (m:Menu {name: 'Blockchain'})
  SET m.route = '/blockchain',
      m.description = 'Blockchain infrastructure: consensus, cryptography, EVM, Layer 2',
      m.domain = 'blockchain_crypto';

MERGE (m:Menu {name: 'Yield Strategies'})
  SET m.route = '/defi/yield',
      m.description = 'On-chain yield optimization: liquidity provision, lending, farming, staking',
      m.domain = 'web3_defi';

MERGE (m:Menu {name: 'MEV'})
  SET m.route = '/defi/mev',
      m.description = 'Maximal Extractable Value: sandwich attacks, frontrunning, arbitrage, bundle submission',
      m.domain = 'web3_defi';

MERGE (m:Menu {name: 'Algorithmic Trading'})
  SET m.route = '/algo/trading',
      m.description = 'Algorithmic trading strategies: momentum, mean reversion, arbitrage, ML-based',
      m.domain = 'quant_finance';

MERGE (m:Menu {name: 'Alpha Research'})
  SET m.route = '/algo/alpha',
      m.description = 'Alpha signal construction, decay analysis, neutralization, cross-sectional signals',
      m.domain = 'quant_finance';

MERGE (m:Menu {name: 'Cryptography'})
  SET m.route = '/blockchain/crypto',
      m.description = 'Cryptographic primitives: hash functions, ECDSA, ZK proofs, Merkle trees',
      m.domain = 'blockchain_crypto';
