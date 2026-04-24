"""
Neo4j client for DeFi Asset and Opportunity data (DoraHacks schema).
"""
from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

try:
    from neo4j import GraphDatabase
except ImportError:
    GraphDatabase = None  # type: ignore

_DRIVER = None


def _get_driver():
    global _DRIVER
    if _DRIVER is None:
        if GraphDatabase is None:
            raise RuntimeError("neo4j package not installed")
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "pricing-engine-kb")
        _DRIVER = GraphDatabase.driver(uri, auth=(user, password))
    return _DRIVER


def get_defi_opportunities(limit: int = 50) -> List[Dict[str, Any]]:
    """Return Opportunity nodes with APY, asset symbol, protocol from Neo4j."""
    driver = _get_driver()
    with driver.session() as session:
        result = session.run("""
            MATCH (o:Opportunity)-[:DENOMINATED_IN]->(a:Asset)
            OPTIONAL MATCH (o)-[:ON_CHAIN]->(c:Chain)
            RETURN o.id AS id, o.apy AS apy, o.riskScore AS riskScore,
                   o.protocolId AS protocolId, o.assetId AS assetId,
                   a.symbol AS symbol, c.id AS chainId
            ORDER BY o.apy DESC
            LIMIT $limit
        """, limit=limit)
        return [dict(record) for record in result]


def get_defi_assets(limit: int = 100) -> List[Dict[str, Any]]:
    """Return Asset nodes (symbol, chainId, id) for asset universe."""
    driver = _get_driver()
    with driver.session() as session:
        result = session.run("""
            MATCH (a:Asset)
            RETURN a.id AS id, a.symbol AS symbol, a.chainId AS chainId
            ORDER BY a.symbol
            LIMIT $limit
        """, limit=limit)
        return [dict(record) for record in result]


def get_asset_quote_from_neo4j(symbol: str) -> Dict[str, Any]:
    """Quote-like dict for an asset from first opportunity or asset node."""
    driver = _get_driver()
    with driver.session() as session:
        result = session.run("""
            MATCH (o:Opportunity)-[:DENOMINATED_IN]->(a:Asset)
            WHERE a.symbol = $symbol
            RETURN o.apy AS apy, o.riskScore AS riskScore, a.symbol AS symbol
            ORDER BY o.apy DESC LIMIT 1
        """, symbol=symbol.upper())
        record = result.single()
        if record and record.get("apy") is not None:
            apy = float(record["apy"])
            return {
                "symbol": (record.get("symbol") or symbol).upper(),
                "spot_price": 1.0,
                "apy": apy,
                "risk_score": float(record["riskScore"] or 0),
                "source": "defi_neo4j",
            }
        result2 = session.run("MATCH (a:Asset {symbol: $symbol}) RETURN a.symbol AS symbol LIMIT 1", symbol=symbol.upper())
        r2 = result2.single()
        return {
            "symbol": symbol.upper(),
            "spot_price": 1.0,
            "apy": None,
            "source": "defi_neo4j",
        }


def get_returns_matrix_from_opportunities(
    opportunity_ids: Optional[List[str]] = None,
    period_days: int = 252,
) -> List[List[float]]:
    """
    Synthetic returns matrix for opportunities (e.g. from APY).
    Each row = one period (day), each column = one opportunity.
    Used for portfolio moments, VaR, optimizer.
    """
    driver = _get_driver()
    with driver.session() as session:
        if opportunity_ids:
            result = session.run("""
                MATCH (o:Opportunity) WHERE o.id IN $ids
                RETURN o.id AS id, o.apy AS apy, o.riskScore AS riskScore
                ORDER BY o.id
            """, ids=opportunity_ids)
        else:
            result = session.run("""
                MATCH (o:Opportunity) RETURN o.id AS id, o.apy AS apy, o.riskScore AS riskScore
                ORDER BY o.apy DESC LIMIT 20
            """)
        rows = [dict(record) for record in result]
    if not rows:
        return []
    import random
    random.seed(42)
    n_cols = len(rows)
    n_days = min(period_days, 252)
    # Synthetic daily returns: mean = apy/365, vol from riskScore
    matrix = []
    for _ in range(n_days):
        row = []
        for r in rows:
            apy = float(r.get("apy") or 0) / 100.0
            risk = float(r.get("riskScore") or 0.2)
            mu = apy / 365
            sigma = max(0.001, risk / 10)
            row.append(mu + sigma * (random.gauss(0, 1) if sigma else 0))
        matrix.append(row)
    return matrix
