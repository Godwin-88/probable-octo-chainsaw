// ============================================================
// 08_blockchain_infrastructure.cypher
// Run after 07_defi_menus.cypher
// Blockchain and cryptography foundation concepts.
// Source: Antonopoulos (Mastering Ethereum), Bolfing (Cryptographic Primitives),
//         Harvey et al. (DeFi and the Future of Finance), Learn Ethereum 2e
// ============================================================

// ── BLOCKCHAIN FUNDAMENTALS ──────────────────────────────────

MERGE (c:TransactConcept {name: 'Blockchain'})
SET c.definition = 'Distributed append-only ledger of cryptographically linked blocks. Each block contains a hash of the previous block, timestamp, and transaction data. First described by Haber & Stornetta (1991); combined with PoW by Back (2002); deployed by Nakamoto (2008).',
    c.category = 'blockchain_infrastructure',
    c.difficulty = 'basic',
    c.menu_context = 'Blockchain',
    c.prerequisites = 'hash functions;distributed systems;cryptographic commitment',
    c.source_ids = 'harvey_defi_future;antonopoulos_mastering_ethereum;cryptographic_primitives_blockchain';
MATCH (c:TransactConcept {name: 'Blockchain'}), (m:Menu {name: 'Blockchain'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Proof of Work'})
SET c.definition = 'Consensus mechanism requiring computational effort (hash puzzle: find nonce s.t. H(block) < target). Introduced by Back (2002) as Hashcash; used in Bitcoin. Difficulty adjusts to maintain ~10 min block time. Energy-intensive but provides Sybil resistance.',
    c.category = 'consensus',
    c.difficulty = 'intermediate',
    c.menu_context = 'Blockchain',
    c.prerequisites = 'hash functions;nonce;difficulty target;mining',
    c.source_ids = 'harvey_defi_future;cryptographic_primitives_blockchain;math_blockchain';
MATCH (c:TransactConcept {name: 'Proof of Work'}), (m:Menu {name: 'Blockchain'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Proof of Stake'})
SET c.definition = 'Consensus where validators are chosen proportional to staked collateral. Validators sign blocks; slashing penalizes equivocation. Ethereum switched to PoS (The Merge, Sep 2022). Energy use ~99.95% lower than PoW. Security budget = economic cost of slashing.',
    c.category = 'consensus',
    c.difficulty = 'intermediate',
    c.menu_context = 'Blockchain',
    c.prerequisites = 'staking;slashing;validator;fork choice rule;finality',
    c.source_ids = 'learn_ethereum_2e;antonopoulos_mastering_ethereum;harvey_defi_future';
MATCH (c:TransactConcept {name: 'Proof of Stake'}), (m:Menu {name: 'Blockchain'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Ethereum Virtual Machine'})
SET c.definition = 'Stack-based virtual machine executing EVM bytecode. Quasi-Turing-complete (gas limit provides halting). 256-bit word size. Every Ethereum node runs identical EVM ensuring determinism. State = mapping of address → {balance, nonce, code, storage}.',
    c.category = 'smart_contract_platform',
    c.difficulty = 'intermediate',
    c.menu_context = 'Blockchain',
    c.prerequisites = 'stack machine;bytecode;gas;determinism;state transition',
    c.source_ids = 'antonopoulos_mastering_ethereum;solorio_smart_contracts;learn_ethereum_2e';
MATCH (c:TransactConcept {name: 'Ethereum Virtual Machine'}), (m:Menu {name: 'Blockchain'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Smart Contract'})
SET c.definition = 'Self-executing code deployed on a blockchain that runs deterministically. Functions as a trust-minimized intermediary. Key properties: immutability (after deployment), transparency (code on-chain), trustlessness (execution enforced by consensus), composability (can call other contracts).',
    c.category = 'smart_contract_platform',
    c.difficulty = 'basic',
    c.menu_context = 'Blockchain',
    c.prerequisites = 'EVM;Solidity;ABI;deployment;gas',
    c.source_ids = 'harvey_defi_future;antonopoulos_mastering_ethereum;solorio_smart_contracts';
MATCH (c:TransactConcept {name: 'Smart Contract'}), (m:Menu {name: 'Blockchain'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Gas'})
SET c.definition = 'Unit measuring computational cost in the EVM. Every opcode costs a fixed gas amount. Gas price (gwei) × gas used = ETH fee paid to validator. EIP-1559 introduced base fee (burned) + priority tip. Prevents Halting Problem by bounding computation.',
    c.category = 'blockchain_economics',
    c.difficulty = 'basic',
    c.menu_context = 'Blockchain',
    c.prerequisites = 'EVM;gwei;base fee;priority fee;gas limit',
    c.source_ids = 'antonopoulos_mastering_ethereum;learn_ethereum_2e;harvey_defi_future';
MATCH (c:TransactConcept {name: 'Gas'}), (m:Menu {name: 'Blockchain'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Merkle Tree'})
SET c.definition = 'Binary tree of hash values where each parent = H(left_child || right_child). Root (Merkle root) commits to all leaves. Enables O(log n) inclusion proofs. Used in Bitcoin (transaction Merkle root) and Ethereum (Merkle-Patricia trie for state, transactions, receipts).',
    c.category = 'cryptography',
    c.difficulty = 'intermediate',
    c.menu_context = 'Cryptography',
    c.prerequisites = 'hash functions;binary tree;inclusion proof;Patricia trie',
    c.source_ids = 'cryptographic_primitives_blockchain;antonopoulos_mastering_ethereum;math_blockchain';
MATCH (c:TransactConcept {name: 'Merkle Tree'}), (m:Menu {name: 'Cryptography'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Hash Function'})
SET c.definition = 'Deterministic function H: {0,1}* → {0,1}^n with properties: preimage resistance (given h, hard to find x s.t. H(x)=h), second preimage resistance, collision resistance. Bitcoin uses SHA-256; Ethereum uses Keccak-256. Used for block linking, address derivation, Merkle trees.',
    c.category = 'cryptography',
    c.difficulty = 'basic',
    c.menu_context = 'Cryptography',
    c.prerequisites = 'one-way function;collision resistance;SHA-256;Keccak-256',
    c.source_ids = 'cryptographic_primitives_blockchain;math_blockchain;antonopoulos_mastering_ethereum';
MATCH (c:TransactConcept {name: 'Hash Function'}), (m:Menu {name: 'Cryptography'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Elliptic Curve Cryptography'})
SET c.definition = 'Public-key cryptography using elliptic curves over finite fields. Ethereum uses secp256k1: y² = x³ + 7 over F_p. Private key k ∈ [1, n-1]; public key K = k·G (scalar multiplication). 256-bit security equivalent to ~3072-bit RSA but more compact.',
    c.category = 'cryptography',
    c.difficulty = 'advanced',
    c.menu_context = 'Cryptography',
    c.prerequisites = 'group theory;finite fields;discrete logarithm;secp256k1',
    c.source_ids = 'cryptographic_primitives_blockchain;antonopoulos_mastering_ethereum;math_blockchain';
MATCH (c:TransactConcept {name: 'Elliptic Curve Cryptography'}), (m:Menu {name: 'Cryptography'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'ECDSA Signature'})
SET c.definition = 'Elliptic Curve Digital Signature Algorithm. Sign: k_eph random; r = (k_eph·G).x mod n; s = k_eph⁻¹(hash + r·privkey) mod n. Verify: u₁ = s⁻¹·hash, u₂ = s⁻¹·r; check (u₁·G + u₂·K).x = r. Ethereum transaction signatures use (v,r,s) for sender recovery.',
    c.category = 'cryptography',
    c.difficulty = 'advanced',
    c.menu_context = 'Cryptography',
    c.prerequisites = 'ECC;private key;public key;message hash;transaction signing',
    c.source_ids = 'cryptographic_primitives_blockchain;antonopoulos_mastering_ethereum';
MATCH (c:TransactConcept {name: 'ECDSA Signature'}), (m:Menu {name: 'Cryptography'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Zero-Knowledge Proof'})
SET c.definition = 'Cryptographic protocol where a prover convinces a verifier of statement truth without revealing the witness. Properties: completeness, soundness, zero-knowledge. Types: ZK-SNARKs (succinct, non-interactive; used in Zcash, zkSync), ZK-STARKs (transparent, post-quantum). Critical for Layer 2 privacy and scalability.',
    c.category = 'cryptography',
    c.difficulty = 'advanced',
    c.menu_context = 'Cryptography',
    c.prerequisites = 'interactive proofs;circuit satisfiability;polynomial commitments;trusted setup',
    c.source_ids = 'cryptographic_primitives_blockchain;math_blockchain';
MATCH (c:TransactConcept {name: 'Zero-Knowledge Proof'}), (m:Menu {name: 'Cryptography'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Layer 2 Scaling'})
SET c.definition = 'Off-chain computation with on-chain security inheritance. Types: Optimistic Rollups (fraud proofs, 7-day withdrawal delay; Optimism, Arbitrum), ZK-Rollups (validity proofs, instant finality; zkSync, StarkNet), State Channels (payment channels; Lightning Network), Sidechains (separate consensus; Polygon PoS).',
    c.category = 'blockchain_scaling',
    c.difficulty = 'advanced',
    c.menu_context = 'Blockchain',
    c.prerequisites = 'rollups;fraud proofs;validity proofs;data availability;sequencer',
    c.source_ids = 'harvey_defi_future;coingecko_how_to_defi_advanced;learn_ethereum_2e';
MATCH (c:TransactConcept {name: 'Layer 2 Scaling'}), (m:Menu {name: 'Blockchain'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Byzantine Fault Tolerance'})
SET c.definition = 'System property of reaching consensus despite up to f faulty/malicious nodes out of n total, where n ≥ 3f+1 (classical BFT). PBFT achieves O(n²) message complexity. Ethereum\'s Casper uses BFT-inspired finality. Fundamental to understanding DeFi protocol security assumptions.',
    c.category = 'distributed_systems',
    c.difficulty = 'advanced',
    c.menu_context = 'Blockchain',
    c.prerequisites = 'consensus;fault tolerance;validators;slashing',
    c.source_ids = 'math_blockchain;cryptographic_primitives_blockchain';
MATCH (c:TransactConcept {name: 'Byzantine Fault Tolerance'}), (m:Menu {name: 'Blockchain'})
MERGE (c)-[:BELONGS_TO]->(m);

MERGE (c:TransactConcept {name: 'Account Abstraction'})
SET c.definition = 'ERC-4337: enables smart contract wallets to be transaction initiators without EOAs. EntryPoint contract validates UserOps. Enables: gasless transactions (paymaster), social recovery, batching, session keys. Fundamental for WDK integration and improved DeFi UX.',
    c.category = 'smart_contract_platform',
    c.difficulty = 'advanced',
    c.menu_context = 'Blockchain',
    c.prerequisites = 'ERC-4337;UserOperation;EntryPoint;Bundler;Paymaster;smart wallet',
    c.source_ids = 'learn_ethereum_2e;antonopoulos_mastering_ethereum';
MATCH (c:TransactConcept {name: 'Account Abstraction'}), (m:Menu {name: 'Blockchain'})
MERGE (c)-[:BELONGS_TO]->(m);

// ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX concept_category IF NOT EXISTS FOR (c:TransactConcept) ON (c.category);
