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
  echo "  → $(basename "$file")"
  cypher-shell -a "$BOLT" -u "$NEO4J_USER" -p "$NEO4J_PASS" --file "$file"
}

echo "=== QuantiNova Knowledge Graph Seeder ==="
echo "Target: $BOLT"
echo ""

echo "[Phase 0] Foundation (psychic-invention M1–M7)"
cypher /psychic-import/01_menus.cypher
cypher /psychic-import/02_concepts.cypher
cypher /psychic-import/03_formulas.cypher
cypher /psychic-import/04_metrics_interpretations.cypher
cypher /psychic-import/05_relationships.cypher
cypher /psychic-import/06_trading_strategies.cypher

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

echo ""
echo "=== Seeding complete ==="
