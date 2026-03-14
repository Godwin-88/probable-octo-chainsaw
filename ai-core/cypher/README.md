# Unified Knowledge Graph — Cypher Seeding Pipeline

Full ingestion pipeline for the QuantiNova unified knowledge base.
Sources: psychic-invention PDFs (M1–M7) + AlgorithmicTradingStrategies PDFs (22 books) + web3 PDFs (9 books).

## Run Order

Execute in Neo4j Browser (http://localhost:7474) **in this exact order**.
All scripts are idempotent (MERGE-safe — re-running will not duplicate nodes).

### Phase 0 — Foundation

| Order | File | Nodes Created | Count |
|-------|------|---------------|-------|
| 1 | `psychic-invention/knowledge_base/import/01_menus.cypher` | `Menu` | 8 |
| 2 | `psychic-invention/knowledge_base/import/02_concepts.cypher` | `TransactConcept` + `BELONGS_TO` | ~80 |
| 3 | `psychic-invention/knowledge_base/import/03_formulas.cypher` | `TransactFormula` | ~50 |
| 4 | `psychic-invention/knowledge_base/import/04_metrics_interpretations.cypher` | `Metric`, `Interpretation` | ~30 |
| 5 | `psychic-invention/knowledge_base/import/05_relationships.cypher` | Formula→Concept relationships | ~120 |
| 6 | `psychic-invention/knowledge_base/import/06_trading_strategies.cypher` | `TradingStrategy` (legacy) | ~6 |

### Phase 1 — DeFi/Web3 Extension (this directory)

| Order | File | Nodes Created | Count |
|-------|------|---------------|-------|
| 7 | `00_knowledge_sources.cypher` | `KnowledgeSource` (all 65 PDFs) | 65 |
| 8 | `07_defi_menus.cypher` | `Menu` (DeFi extension) | 8 |
| 9 | `08_blockchain_infrastructure.cypher` | `TransactConcept` (blockchain/crypto) | 14 |
| 10 | `09_defi_primitives.cypher` | `TransactConcept` (DeFi mechanisms) | 20 |
| 11 | `10_defi_protocols.cypher` | `DeFiProtocol` + protocol relationships | 11 |
| 12 | `11_defi_risks.cypher` | `TransactConcept` (DeFi risk taxonomy) | 13 |
| 13 | `12_algo_trading_strategies.cypher` | `TradingStrategy` (algo/DeFi strategies) | 11 |
| 14 | `13_defi_formulas.cypher` | `TransactFormula` (DeFi/Web3 math) | 17 |

### Phase 2 — Cross-Domain Wiring (run last)

| Order | File | Relationships Created | Count |
|-------|------|-----------------------|-------|
| 15 | `14_cross_domain_relationships.cypher` | Quant↔DeFi bridges, internal DeFi graph, menu membership | ~120 |
| 16 | `15_source_citations.cypher` | `SOURCED_FROM`, `ALSO_IN` (concept/formula/strategy → KnowledgeSource) | ~150 |

---

## Neo4j Schema (Python)

`ai-core/ai_core/neo4j_schema.py` → `init_transact_schema()` creates:

**Constraints (uniqueness)**
- `TransactFormula.name`
- `TransactConcept.name`
- `Menu.name`
- `DeFiProtocol.name` ← NEW
- `TradingStrategy.name` ← NEW
- `KnowledgeSource.id` ← NEW

**Indexes**
- `TransactConcept.domain`, `TransactFormula.domain` ← NEW
- `DeFiProtocol.category`, `TradingStrategy.category`, `KnowledgeSource.domain/category` ← NEW

Initialize with:
```bash
cd ai-core && python -m ai_core.neo4j_schema
```

---

## Node Labels Summary

| Label | Description | Source Files |
|-------|-------------|--------------|
| `TransactConcept` | Quant finance + DeFi concepts | psychic-invention 01-06, 08-11 |
| `TransactFormula` | Math formulas with equations | psychic-invention 03, 13 |
| `Menu` | UI menu items | 01, 07 |
| `Metric` | Output metrics | 04 |
| `Interpretation` | Result interpretations | 04 |
| `DeFiProtocol` | On-chain protocols (Uniswap, Aave, etc.) | 10 |
| `TradingStrategy` | Algo + DeFi trading strategies | 12 |
| `KnowledgeSource` | PDF bibliography (65 sources) | 00 |

---

## Key Relationship Types

| Relationship | Direction | Meaning |
|-------------|-----------|---------|
| `BELONGS_TO` | Concept/Formula → Menu | Menu membership |
| `SOURCED_FROM` | Any → KnowledgeSource | Primary PDF citation with chapter/pages |
| `ALSO_IN` | Any → KnowledgeSource | Secondary citation |
| `HAS_DEFI_EQUIVALENT` | TransactConcept → TransactConcept | TradFi↔DeFi bridge |
| `DEFI_ADAPTED_AS` | TransactConcept → TransactFormula | Adapted metric |
| `APPLIED_IN` | TransactConcept → TradingStrategy | Concept used in strategy |
| `HAS_DEFI_INSTANCE` | TradingStrategy → TradingStrategy | DeFi variant of trad strategy |
| `IMPLEMENTS` | DeFiProtocol → TransactConcept | Protocol implements concept |
| `QUANTIFIES` | TransactFormula → TransactConcept | Formula measures concept |
| `DERIVES_FROM` | Formula → Formula | Mathematical derivation chain |
| `USES` | Formula → Concept | Formula requires concept |
| `CAUSES` / `MITIGATES` | Concept → Concept | Causal DeFi relationships |

---

## GraphRAG Query Examples

### Find PDF source for a concept
```cypher
MATCH (c:TransactConcept {name: 'Impermanent Loss'})-[r:SOURCED_FROM]->(ks:KnowledgeSource)
RETURN c.name, r.chapter, r.pages, ks.title, ks.author, ks.filename
```

### Get all DeFi bridges for a quant concept
```cypher
MATCH (trad:TransactConcept {name: 'Value at Risk'})
      -[:HAS_DEFI_EQUIVALENT|DEFI_ADAPTED_AS|QUANTIFIES_IN_DEFI*1..2]-(defi)
RETURN trad.name, type(r), defi.name, defi.definition
```

### Find formulas in a domain
```cypher
MATCH (f:TransactFormula {domain: 'defi_dex'})
RETURN f.name, f.equation, f.protocol_reference
ORDER BY f.name
```

### Explain a DeFi protocol's math
```cypher
MATCH (p:DeFiProtocol {name: 'Uniswap V3'})
      -[:IMPLEMENTS|PIONEERED]->(c:TransactConcept)
      -[:QUANTIFIED_BY|DEFINES]-(f:TransactFormula)
RETURN p.name, c.name, f.name, f.equation
```

### Full citation chain
```cypher
MATCH (s:TradingStrategy {name: 'Cross-DEX Arbitrage'})
      -[:SOURCED_FROM|ALSO_IN]->(ks:KnowledgeSource)
RETURN s.name, ks.title, ks.author, ks.year, ks.folder
```
