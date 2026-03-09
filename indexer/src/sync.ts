import neo4j from "neo4j-driver";
import type { Registry } from "./registry.js";

function getDriver() {
  const uri = process.env.NEO4J_URI ?? "bolt://localhost:7687";
  const user = process.env.NEO4J_USER ?? "neo4j";
  const password = process.env.NEO4J_PASSWORD ?? "yield-agent-dev";
  return neo4j.driver(uri, neo4j.auth.basic(user, password));
}

export async function runIndexerCycle(registry: Registry): Promise<void> {
  const driver = getDriver();
  try {
    const session = driver.session();
    try {
      for (const chain of registry.chains) {
        await session.run(
          `
          MERGE (c:Chain {id: $id})
          SET c.name = $name, c.type = $type, c.chainId = $chainId, c.updatedAt = datetime()
          `,
          {
            id: chain.id,
            name: chain.name,
            type: chain.type,
            chainId: chain.chainId ?? chain.id,
          }
        );
      }
      for (const protocol of registry.protocols) {
        await session.run(
          `
          MERGE (p:Protocol {id: $id})
          SET p.name = $name, p.chainId = $chainId, p.category = $category, p.updatedAt = datetime()
          `,
          {
            id: protocol.id,
            name: protocol.name,
            chainId: protocol.chainId,
            category: protocol.category,
          }
        );
      }
    } finally {
      await session.close();
    }
  } finally {
    await driver.close();
  }
}
