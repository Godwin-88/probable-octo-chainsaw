/**
 * On-chain indexer: fetches protocol/asset/opportunity data and writes to Neo4j.
 * Uses chain/protocol registry for extensibility across 6+ chains.
 */
import { getRegistry } from "./registry.js";
import { runIndexerCycle } from "./sync.js";

const CYCLE_MS = 60 * 1000; // 1 minute

async function main() {
  const registry = getRegistry();
  console.log(`Indexer started. Chains: ${registry.chains.map((c) => c.id).join(", ")}`);
  for (;;) {
    try {
      await runIndexerCycle(registry);
    } catch (e) {
      console.error("Indexer cycle error:", e);
    }
    await new Promise((r) => setTimeout(r, CYCLE_MS));
  }
}

main();
