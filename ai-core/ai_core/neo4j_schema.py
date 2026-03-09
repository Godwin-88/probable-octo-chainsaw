"""
Neo4j logical layer / knowledge graph: schema (constraints, indexes) and seed data.
Single source of truth for DeFi entities and relationships; used by AI core and indexer.
"""
from __future__ import annotations

from neo4j import GraphDatabase
import os


def get_driver():
    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    user = os.environ.get("NEO4J_USER", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "yield-agent-dev")
    return GraphDatabase.driver(uri, auth=(user, password))


def init_schema(driver) -> None:
    """Create uniqueness constraints and indexes for the knowledge graph."""
    with driver.session() as session:
        # Uniqueness constraints (Neo4j 5: named constraint with IF NOT EXISTS)
        constraints = [
            "CREATE CONSTRAINT chain_id IF NOT EXISTS FOR (c:Chain) REQUIRE c.id IS UNIQUE",
            "CREATE CONSTRAINT protocol_id IF NOT EXISTS FOR (p:Protocol) REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT asset_id IF NOT EXISTS FOR (a:Asset) REQUIRE a.id IS UNIQUE",
            "CREATE CONSTRAINT opportunity_id IF NOT EXISTS FOR (o:Opportunity) REQUIRE o.id IS UNIQUE",
            "CREATE CONSTRAINT market_condition_id IF NOT EXISTS FOR (m:MarketCondition) REQUIRE m.id IS UNIQUE",
            "CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
            "CREATE CONSTRAINT position_id IF NOT EXISTS FOR (p:Position) REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT optimization_run_id IF NOT EXISTS FOR (o:OptimizationRun) REQUIRE o.id IS UNIQUE",
        ]
        for cypher in constraints:
            try:
                session.run(cypher)
            except Exception as e:
                if "EquivalentSchemaRuleAlreadyExists" not in str(e) and "already exists" not in str(e).lower():
                    raise

        # Lookup indexes (Neo4j 5: CREATE INDEX name IF NOT EXISTS FOR ...)
        indexes = [
            "CREATE INDEX idx_asset_symbol_chain IF NOT EXISTS FOR (a:Asset) ON (a.symbol, a.chainId)",
            "CREATE INDEX idx_protocol_name_chain IF NOT EXISTS FOR (p:Protocol) ON (p.name, p.chainId)",
            "CREATE INDEX idx_opportunity_protocol_asset IF NOT EXISTS FOR (o:Opportunity) ON (o.protocolId, o.assetId)",
            "CREATE INDEX idx_position_user IF NOT EXISTS FOR (p:Position) ON (p.userId)",
            "CREATE INDEX idx_market_condition_chain_ts IF NOT EXISTS FOR (m:MarketCondition) ON (m.chainId, m.timestamp)",
        ]
        for cypher in indexes:
            try:
                session.run(cypher)
            except Exception as e:
                if "EquivalentSchemaRuleAlreadyExists" not in str(e) and "already exists" not in str(e).lower():
                    raise


def seed_minimal(driver) -> None:
    """Seed minimal chains, protocols, assets, and opportunities for demo."""
    with driver.session() as session:
        # Chains
        session.run("""
            MERGE (c:Chain {id: 'ethereum'})
            SET c.name = 'Ethereum', c.type = 'EVM', c.chainId = '1', c.updatedAt = datetime()
        """)
        session.run("""
            MERGE (c:Chain {id: 'sepolia'})
            SET c.name = 'Sepolia', c.type = 'EVM', c.chainId = '11155111', c.updatedAt = datetime()
        """)
        # Protocol
        session.run("""
            MERGE (p:Protocol {id: 'aave-v3-ethereum'})
            SET p.name = 'Aave', p.chainId = 'ethereum', p.category = 'lending',
                p.tvlUsd = 12000000, p.riskScore = 0.3, p.updatedAt = datetime()
        """)
        # Assets
        session.run("""
            MERGE (a:Asset {id: 'usdt-ethereum'})
            SET a.symbol = 'USDT', a.chainId = 'ethereum', a.decimals = 6,
                a.isStablecoin = true, a.updatedAt = datetime()
        """)
        session.run("""
            MERGE (a:Asset {id: 'usdc-ethereum'})
            SET a.symbol = 'USDC', a.chainId = 'ethereum', a.decimals = 6,
                a.isStablecoin = true, a.updatedAt = datetime()
        """)
        # Opportunity
        session.run("""
            MERGE (o:Opportunity {id: 'aave-usdt-supply-ethereum'})
            SET o.protocolId = 'aave-v3-ethereum', o.assetId = 'usdt-ethereum',
                o.apy = 4.2, o.apyType = 'variable', o.minDeposit = 0, o.lockPeriod = 'instant',
                o.liquidityUsd = 5000000, o.riskScore = 0.25, o.updatedAt = datetime()
        """)
        # Link Protocol -> Asset (SUPPORTS), Protocol -> Opportunity (OFFERS), Opportunity -> Asset (DENOMINATED_IN)
        session.run("""
            MATCH (p:Protocol {id: 'aave-v3-ethereum'}), (a:Asset {id: 'usdt-ethereum'})
            MERGE (p)-[:SUPPORTS]->(a)
        """)
        session.run("""
            MATCH (p:Protocol {id: 'aave-v3-ethereum'}), (o:Opportunity {id: 'aave-usdt-supply-ethereum'})
            MERGE (p)-[:OFFERS]->(o)
        """)
        session.run("""
            MATCH (o:Opportunity {id: 'aave-usdt-supply-ethereum'}), (a:Asset {id: 'usdt-ethereum'})
            MERGE (o)-[:DENOMINATED_IN]->(a)
        """)
        # ON_CHAIN links
        session.run("""
            MATCH (c:Chain {id: 'ethereum'}), (p:Protocol {id: 'aave-v3-ethereum'})
            MERGE (p)-[:ON_CHAIN]->(c)
        """)
        session.run("""
            MATCH (c:Chain {id: 'ethereum'}), (a:Asset) WHERE a.chainId = 'ethereum'
            MERGE (a)-[:ON_CHAIN]->(c)
        """)
        session.run("""
            MATCH (c:Chain {id: 'ethereum'}), (o:Opportunity {id: 'aave-usdt-supply-ethereum'})
            MERGE (o)-[:ON_CHAIN]->(c)
        """)


def init_and_seed() -> None:
    driver = get_driver()
    try:
        driver.verify_connectivity()
        init_schema(driver)
        seed_minimal(driver)
        print("Neo4j schema and seed data applied.")
    finally:
        driver.close()


if __name__ == "__main__":
    init_and_seed()
