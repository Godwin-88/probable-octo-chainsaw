"""Neo4j driver wrapper for GraphRAG queries."""

import os
from typing import Optional


class Neo4jDriver:
    """Simple Neo4j wrapper for GraphRAG retrieval."""
    
    def __init__(
        self,
        uri: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
    ):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://neo4j:7687")
        self.user = user or os.getenv("NEO4J_USER", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD", "yield-agent-dev")
        self._driver = None
    
    def _get_driver(self):
        if self._driver is None:
            from neo4j import GraphDatabase
            self._driver = GraphDatabase.driver(
                self.uri, auth=(self.user, self.password)
            )
        return self._driver
    
    def query(self, cypher: str, params: dict = None) -> list[dict]:
        """Execute a Cypher query and return results."""
        driver = self._get_driver()
        with driver.session() as session:
            result = session.run(cypher, params or {})
            return [record.data() for record in result]
    
    def close(self):
        if self._driver:
            self._driver.close()
            self._driver = None
    
    def graphrag_retrieve_strategy(self, strategy_name: str) -> dict:
        """Retrieve strategy with full knowledge graph context."""
        cypher = """
        MATCH (s:TradingStrategy {name: $strategy})
        OPTIONAL MATCH (s)-[:BASED_ON]->(c:TransactConcept)
        OPTIONAL MATCH (s)-[:SOURCED_FROM]->(ks:KnowledgeSource)
        OPTIONAL MATCH (s)-[:GOVERNED_BY]->(r:RiskParameters)
        OPTIONAL MATCH (f:TransactFormula)
        WHERE f.category = s.category
        RETURN s, 
               collect(DISTINCT c {.name, .description}) AS concepts,
               collect(DISTINCT ks {.title, .author, .key_topics}) AS sources,
               collect(DISTINCT f {.name, .formula, .description}) AS formulas,
               r
        """
        results = self.query(cypher, {"strategy": strategy_name})
        return results[0] if results else {}
    
    def graphrag_retrieve_market_context(self, market: str) -> dict:
        """Retrieve market context from knowledge graph."""
        cypher = """
        MATCH (m:Market {symbol: $market})
        OPTIONAL MATCH (m)<-[:FOR_MARKET]-(s:Signal)
        OPTIONAL MATCH (s)-[:GENERATED_BY]->(st:TradingStrategy)
        WITH m, 
             count(s) AS signal_count,
             collect(DISTINCT st.name) AS strategies_used
        RETURN m, signal_count, strategies_used
        """
        results = self.query(cypher, {"market": market})
        return results[0] if results else {"m": None, "signal_count": 0, "strategies_used": []}
    
    def graphrag_find_similar_strategies(self, category: str, limit: int = 3) -> list[dict]:
        """Find similar strategies by category with knowledge citations."""
        cypher = """
        MATCH (s:TradingStrategy {category: $category})
        OPTIONAL MATCH (s)-[:SOURCED_FROM]->(ks:KnowledgeSource)
        RETURN s.name AS name, s.description AS description,
               collect(DISTINCT ks.title) AS sources
        LIMIT $limit
        """
        return self.query(cypher, {"category": category, "limit": limit})
