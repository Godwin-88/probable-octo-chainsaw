#!/usr/bin/env bash
# Seed the Neo4j knowledge graph in the correct order.
# Runs inside the graph-seeder container which mounts:
#   /cypher          → ai-core/cypher/
#   /psychic-import  → psychic-invention/knowledge_base/import/
# Environment: NEO4J_BOLT_URL, NEO4J_AUTH (user/password)

set -euo pipefail

NEO4J_USER="${NEO4J_AUTH%%/*}"
NEO4J_PASS="${NEO4J_AUTH##*/}"
BOLT="${NEO4J_BOLT_URL:-bolt://neo4j:7687}"

cypher() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "  ! File not found: $file (skipping)"
    return 0
  fi
  echo "  → $(basename "$file")"
  cypher-shell -a "$BOLT" -u "$NEO4J_USER" -p "$NEO4J_PASS" --file "$file"
}

echo "=== QuantiNova Knowledge Graph Seeder ==="
echo "Target: $BOLT"
echo ""

echo "[Phase 0] Foundation"
cypher /cypher/01_menus.cypher
cypher /cypher/02_concepts.cypher
cypher /cypher/03_formulas.cypher
cypher /cypher/04_metrics_interpretations.cypher
cypher /cypher/05_relationships.cypher
cypher /cypher/06_trading_strategies.cypher

echo ""
echo "[Phase 1] DeFi/Web3 Extension"
cypher /cypher/00_knowledge_sources.cypher
cypher /cypher/07_defi_menus.cypher
cypher /cypher/08_blockchain_infrastructure.cypher
cypher /cypher/09_defi_primitives.cypher
cypher /cypher/10_defi_protocols.cypher
cypher /cypher/11_defi_risks.cypher
cypher /cypher/12_algo_trading_strategies.cypher
cypher /cypher/13_defi_formulas.cypher

echo ""
echo "[Phase 2] Cross-Domain Wiring"
cypher /cypher/14_cross_domain_relationships.cypher
cypher /cypher/15_source_citations.cypher
cypher /cypher/16_algorithmic_trading_ingest.cypher

echo ""
echo "[Phase 3] External Integrations"
cypher /cypher/17_kraken_knowledge.cypher

echo ""
echo "[Phase 4] Hackathon Economy (ERC-8004)"
cypher /cypher/18_agent_reputation.cypher

echo ""
echo "=== Seeding complete ==="
