"""
GraphRAG retriever — two-tier knowledge retrieval for grounded LLM responses.

Tier 1 (Static):  Neo4j subgraph lookup — concepts, formulas, strategies, protocols
                  with PDF KnowledgeSource citations (chapter + pages).
Tier 2 (Dynamic): Live web enrichment via scrapers (DeFiLlama, CoinGecko, arXiv …)
                  injected as supplemental context with [LIVE] provenance tag.

Usage:
    retriever = GraphRAGRetriever()
    ctx = retriever.retrieve_for_query("explain impermanent loss in Uniswap V3")
    # ctx is a dict with keys: concepts, formulas, strategies, protocols,
    #                          citations, prompt_context (formatted string)
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from typing import Any, Optional

try:
    from neo4j import GraphDatabase
    from neo4j.exceptions import ServiceUnavailable
    _NEO4J_AVAILABLE = True
except ImportError:
    GraphDatabase = None  # type: ignore
    ServiceUnavailable = Exception  # type: ignore
    _NEO4J_AVAILABLE = False


# ── Entity extraction helpers ────────────────────────────────────────────────

# Known node names for fast lookup — extended at runtime from Neo4j index
_CONCEPT_HINTS = {
    "impermanent loss", "value at risk", "sharpe ratio", "volatility",
    "liquidity pool", "amm", "mev", "flash loan", "yield farming",
    "black-scholes", "delta", "gamma", "vega", "theta",
    "expected shortfall", "beta", "alpha", "kelly criterion",
    "arbitrage", "market making", "slippage", "price impact",
    "liquidation", "collateral", "leverage", "margin",
}

_PROTOCOL_HINTS = {
    "uniswap", "aave", "compound", "curve", "balancer",
    "maker", "synthetix", "lido", "convex", "yearn",
}

_STRATEGY_HINTS = {
    "momentum", "mean reversion", "pairs trading", "arbitrage",
    "market making", "trend following", "cross-dex arbitrage",
    "yield optimization", "delta neutral", "carry trade",
}

# DeFi-specific domain terms for query classification
_DEFI_TERMS = {
    "defi", "web3", "crypto", "blockchain", "ethereum", "solana",
    "nft", "dao", "dex", "cex", "tvl", "apy", "apr", "staking",
    "liquidity", "pool", "swap", "bridge", "l2", "layer 2",
    "gas", "gwei", "smart contract", "wallet", "token",
}


def _extract_entities(query: str) -> dict[str, list[str]]:
    """Extract concept, protocol, and strategy names from a natural language query."""
    lower = query.lower()
    found_concepts = [c for c in _CONCEPT_HINTS if c in lower]
    found_protocols = [p for p in _PROTOCOL_HINTS if p in lower]
    found_strategies = [s for s in _STRATEGY_HINTS if s in lower]
    is_defi = any(t in lower for t in _DEFI_TERMS)
    return {
        "concepts": found_concepts,
        "protocols": found_protocols,
        "strategies": found_strategies,
        "is_defi": is_defi,
    }


# ── Data classes ─────────────────────────────────────────────────────────────

@dataclass
class Citation:
    source_id: str
    title: str
    author: str
    year: Optional[str]
    chapter: Optional[str]
    pages: Optional[str]
    filename: Optional[str]
    relevance: Optional[str] = None

    def to_str(self) -> str:
        parts = [f'"{self.title}"']
        if self.author:
            parts.append(f"— {self.author}")
        if self.year:
            parts.append(f"({self.year})")
        if self.chapter:
            parts.append(f"{self.chapter}")
        if self.pages:
            parts.append(f"pp. {self.pages}")
        if self.filename:
            parts.append(f"[{self.filename}]")
        return " ".join(parts)


@dataclass
class GraphRAGContext:
    concepts: list[dict[str, Any]] = field(default_factory=list)
    formulas: list[dict[str, Any]] = field(default_factory=list)
    strategies: list[dict[str, Any]] = field(default_factory=list)
    protocols: list[dict[str, Any]] = field(default_factory=list)
    citations: list[Citation] = field(default_factory=list)
    live_snippets: list[str] = field(default_factory=list)
    prompt_context: str = ""
    retrieval_hits: int = 0


# ── Main retriever ────────────────────────────────────────────────────────────

class GraphRAGRetriever:
    """
    Retrieve structured context from the Neo4j knowledge graph for a query.

    Parameters
    ----------
    driver : optional neo4j.Driver — pass in test/DI scenarios; auto-created otherwise.
    max_hops : int — graph traversal depth for related concept lookup.
    concept_limit : int — max concepts returned per query.
    """

    def __init__(
        self,
        driver=None,
        max_hops: int = 2,
        concept_limit: int = 6,
        formula_limit: int = 4,
        strategy_limit: int = 3,
        protocol_limit: int = 4,
    ):
        self._driver = driver
        self.max_hops = max_hops
        self.concept_limit = concept_limit
        self.formula_limit = formula_limit
        self.strategy_limit = strategy_limit
        self.protocol_limit = protocol_limit

    def _get_driver(self):
        if self._driver:
            return self._driver
        if not _NEO4J_AVAILABLE:
            return None
        uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
        user = os.environ.get("NEO4J_USER", "neo4j")
        password = os.environ.get("NEO4J_PASSWORD", "yield-agent-dev")
        try:
            self._driver = GraphDatabase.driver(uri, auth=(user, password))
        except Exception:
            self._driver = None
        return self._driver

    def _run(self, query: str, **params) -> list[dict[str, Any]]:
        driver = self._get_driver()
        if driver is None:
            return []
        try:
            with driver.session() as session:
                result = session.run(query, params)
                return [dict(record) for record in result]
        except Exception:
            return []

    # ── Subgraph queries ──────────────────────────────────────────────────────

    def _fetch_concepts_by_names(self, names: list[str]) -> list[dict[str, Any]]:
        if not names:
            return []
        q = """
        MATCH (c:TransactConcept)
        WHERE any(n IN $names WHERE toLower(c.name) CONTAINS n)
        OPTIONAL MATCH (c)-[r:SOURCED_FROM]->(ks:KnowledgeSource)
        RETURN c.name AS name, c.definition AS definition, c.category AS category,
               c.domain AS domain, c.difficulty AS difficulty,
               collect(DISTINCT {
                 id: ks.id, title: ks.title, author: ks.author, year: ks.year,
                 chapter: r.chapter, pages: r.pages, filename: ks.filename,
                 relevance: r.relevance
               }) AS sources
        LIMIT $limit
        """
        return self._run(q, names=names, limit=self.concept_limit)

    def _fetch_concepts_fulltext(self, query: str) -> list[dict[str, Any]]:
        """Fallback: CONTAINS search when entity hints don't match."""
        q_lower = query.lower()
        q = """
        MATCH (c:TransactConcept)
        WHERE toLower(c.name) CONTAINS $q OR toLower(c.definition) CONTAINS $q
        OPTIONAL MATCH (c)-[r:SOURCED_FROM]->(ks:KnowledgeSource)
        RETURN c.name AS name, c.definition AS definition, c.category AS category,
               c.domain AS domain,
               collect(DISTINCT {
                 id: ks.id, title: ks.title, author: ks.author, year: ks.year,
                 chapter: r.chapter, pages: r.pages, filename: ks.filename,
                 relevance: r.relevance
               }) AS sources
        ORDER BY size(c.name) ASC
        LIMIT $limit
        """
        return self._run(q, q=q_lower, limit=self.concept_limit)

    def _fetch_defi_equivalent_chain(self, concept_names: list[str]) -> list[dict[str, Any]]:
        """Traverse HAS_DEFI_EQUIVALENT and DEFI_ADAPTED_AS bridges (1–2 hops)."""
        if not concept_names:
            return []
        q = """
        MATCH (trad:TransactConcept)
        WHERE any(n IN $names WHERE toLower(trad.name) CONTAINS n)
        MATCH (trad)-[:HAS_DEFI_EQUIVALENT|DEFI_ADAPTED_AS*1..2]->(defi)
        OPTIONAL MATCH (defi)-[r:SOURCED_FROM]->(ks:KnowledgeSource)
        RETURN defi.name AS name, defi.definition AS definition,
               defi.category AS category, defi.domain AS domain,
               collect(DISTINCT {
                 id: ks.id, title: ks.title, author: ks.author, year: ks.year,
                 chapter: r.chapter, pages: r.pages, filename: ks.filename
               }) AS sources
        LIMIT $limit
        """
        return self._run(q, names=concept_names, limit=self.concept_limit)

    def _fetch_formulas(self, concept_names: list[str], query_lower: str) -> list[dict[str, Any]]:
        q = """
        MATCH (f:TransactFormula)
        WHERE any(n IN $names WHERE toLower(f.name) CONTAINS n OR toLower(f.description) CONTAINS n)
           OR toLower(f.name) CONTAINS $q OR toLower(f.description) CONTAINS $q
        OPTIONAL MATCH (f)-[r:SOURCED_FROM]->(ks:KnowledgeSource)
        RETURN f.name AS name, f.equation AS equation, f.description AS description,
               f.variables AS variables, f.domain AS domain,
               f.protocol_reference AS protocol_reference,
               collect(DISTINCT {
                 id: ks.id, title: ks.title, author: ks.author, year: ks.year,
                 chapter: r.chapter, pages: r.pages, filename: ks.filename
               }) AS sources
        LIMIT $limit
        """
        return self._run(q, names=concept_names, q=query_lower, limit=self.formula_limit)

    def _fetch_protocols(self, protocol_names: list[str], concept_names: list[str]) -> list[dict[str, Any]]:
        if not protocol_names and not concept_names:
            return []
        q = """
        MATCH (p:DeFiProtocol)
        WHERE any(n IN $pnames WHERE toLower(p.name) CONTAINS n)
           OR exists {
             MATCH (p)-[:IMPLEMENTS]->(c:TransactConcept)
             WHERE any(n IN $cnames WHERE toLower(c.name) CONTAINS n)
           }
        OPTIONAL MATCH (p)-[r:SOURCED_FROM]->(ks:KnowledgeSource)
        RETURN p.name AS name, p.category AS category, p.description AS description,
               p.tvl_usd AS tvl_usd, p.chain AS chain,
               collect(DISTINCT {
                 id: ks.id, title: ks.title, author: ks.author, year: ks.year,
                 chapter: r.chapter, pages: r.pages, filename: ks.filename
               }) AS sources
        LIMIT $limit
        """
        return self._run(q, pnames=protocol_names or ["__none__"],
                         cnames=concept_names or ["__none__"],
                         limit=self.protocol_limit)

    def _fetch_strategies(self, strategy_names: list[str], query_lower: str) -> list[dict[str, Any]]:
        q = """
        MATCH (s:TradingStrategy)
        WHERE any(n IN $names WHERE toLower(s.name) CONTAINS n OR toLower(s.category) CONTAINS n)
           OR toLower(s.name) CONTAINS $q OR toLower(s.description) CONTAINS $q
        OPTIONAL MATCH (s)-[r:SOURCED_FROM]->(ks:KnowledgeSource)
        RETURN s.name AS name, s.category AS category, s.description AS description,
               s.entry_signal AS entry_signal, s.exit_signal AS exit_signal,
               s.risk_management AS risk_management,
               collect(DISTINCT {
                 id: ks.id, title: ks.title, author: ks.author, year: ks.year,
                 chapter: r.chapter, pages: r.pages, filename: ks.filename
               }) AS sources
        LIMIT $limit
        """
        return self._run(q, names=strategy_names or ["__none__"],
                         q=query_lower, limit=self.strategy_limit)

    # ── Citation extraction ───────────────────────────────────────────────────

    @staticmethod
    def _extract_citations(rows: list[dict[str, Any]]) -> list[Citation]:
        seen: set[str] = set()
        citations: list[Citation] = []
        for row in rows:
            for src in row.get("sources") or []:
                if not isinstance(src, dict):
                    continue
                sid = src.get("id")
                if not sid or sid in seen:
                    continue
                seen.add(sid)
                citations.append(Citation(
                    source_id=sid,
                    title=src.get("title") or sid,
                    author=src.get("author") or "",
                    year=src.get("year"),
                    chapter=src.get("chapter"),
                    pages=src.get("pages"),
                    filename=src.get("filename"),
                    relevance=src.get("relevance"),
                ))
        return citations

    # ── Prompt context builder ────────────────────────────────────────────────

    @staticmethod
    def build_prompt_context(ctx: GraphRAGContext) -> str:
        """
        Render a structured text block suitable for injection into an LLM system prompt.
        Sections: CONCEPTS, FORMULAS, PROTOCOLS, STRATEGIES, CITATIONS, LIVE DATA.
        """
        lines: list[str] = ["=== KNOWLEDGE GRAPH CONTEXT ===\n"]

        if ctx.concepts:
            lines.append("## CONCEPTS")
            for c in ctx.concepts:
                lines.append(f"• **{c.get('name')}** [{c.get('domain','quant')}]")
                if c.get("definition"):
                    lines.append(f"  {c['definition']}")
            lines.append("")

        if ctx.formulas:
            lines.append("## FORMULAS")
            for f in ctx.formulas:
                lines.append(f"• **{f.get('name')}**")
                if f.get("equation"):
                    lines.append(f"  Eq: `{f['equation']}`")
                if f.get("description"):
                    lines.append(f"  {f['description']}")
                if f.get("protocol_reference"):
                    lines.append(f"  Protocol: {f['protocol_reference']}")
            lines.append("")

        if ctx.protocols:
            lines.append("## DeFi PROTOCOLS")
            for p in ctx.protocols:
                tvl = f"  TVL: ${p['tvl_usd']:,.0f}" if p.get("tvl_usd") else ""
                lines.append(f"• **{p.get('name')}** ({p.get('category','')}) {tvl}")
                if p.get("description"):
                    lines.append(f"  {p['description']}")
            lines.append("")

        if ctx.strategies:
            lines.append("## TRADING STRATEGIES")
            for s in ctx.strategies:
                lines.append(f"• **{s.get('name')}** [{s.get('category','')}]")
                if s.get("description"):
                    lines.append(f"  {s['description']}")
                if s.get("entry_signal"):
                    lines.append(f"  Entry: {s['entry_signal']}")
                if s.get("risk_management"):
                    lines.append(f"  Risk: {s['risk_management']}")
            lines.append("")

        if ctx.citations:
            lines.append("## CITATIONS (PDF Knowledge Base)")
            for i, cit in enumerate(ctx.citations[:8], 1):
                lines.append(f"[{i}] {cit.to_str()}")
            lines.append("")

        if ctx.live_snippets:
            lines.append("## LIVE MARKET DATA")
            for snippet in ctx.live_snippets[:5]:
                lines.append(f"[LIVE] {snippet}")
            lines.append("")

        lines.append("=== END KNOWLEDGE GRAPH CONTEXT ===")
        return "\n".join(lines)

    # ── Public API ────────────────────────────────────────────────────────────

    def retrieve_for_query(
        self,
        query: str,
        menu_context: Optional[str] = None,
        live_snippets: Optional[list[str]] = None,
    ) -> GraphRAGContext:
        """
        Full retrieval pipeline for a user query.

        1. Entity extraction (concept / protocol / strategy names in query)
        2. Neo4j subgraph fetch with SOURCED_FROM citations
        3. DeFi bridge traversal (HAS_DEFI_EQUIVALENT chain)
        4. Build formatted prompt_context string

        Returns a GraphRAGContext dataclass.
        """
        ctx = GraphRAGContext()
        query_lower = query.lower()
        entities = _extract_entities(query)

        # --- Concepts ---
        concepts = self._fetch_concepts_by_names(entities["concepts"])
        if not concepts and entities["is_defi"]:
            # Broader DeFi term search
            concepts = self._fetch_concepts_fulltext(query_lower)
        elif not concepts:
            concepts = self._fetch_concepts_fulltext(query_lower)

        # Bridge to DeFi equivalents when quant concept found
        if concepts and entities["is_defi"]:
            defi_concepts = self._fetch_defi_equivalent_chain(entities["concepts"])
            seen = {c["name"] for c in concepts}
            concepts += [c for c in defi_concepts if c.get("name") not in seen]

        ctx.concepts = concepts[:self.concept_limit]

        # --- Formulas ---
        all_concept_names = [c.get("name", "").lower() for c in ctx.concepts]
        ctx.formulas = self._fetch_formulas(all_concept_names + entities["concepts"], query_lower)

        # --- Protocols ---
        ctx.protocols = self._fetch_protocols(entities["protocols"], entities["concepts"])

        # --- Strategies ---
        ctx.strategies = self._fetch_strategies(entities["strategies"], query_lower)

        # --- Citations ---
        all_rows = ctx.concepts + ctx.formulas + ctx.protocols + ctx.strategies
        ctx.citations = self._extract_citations(all_rows)

        # --- Live snippets: scraper layer (Tier 2) ---
        if live_snippets is not None:
            ctx.live_snippets = live_snippets
        else:
            try:
                from .scrapers.scheduler import get_scheduler
                scraper_results = get_scheduler().fetch_sync(query)
                ctx.live_snippets = [r.to_prompt_line() for r in scraper_results]
            except Exception:
                ctx.live_snippets = []

        # --- Count retrieval hits ---
        ctx.retrieval_hits = (
            len(ctx.concepts) + len(ctx.formulas) +
            len(ctx.protocols) + len(ctx.strategies)
        )

        # --- Build prompt context ---
        ctx.prompt_context = self.build_prompt_context(ctx)

        return ctx

    def close(self) -> None:
        if self._driver:
            try:
                self._driver.close()
            except Exception:
                pass
            self._driver = None


# ── Module-level singleton ────────────────────────────────────────────────────

_retriever: Optional[GraphRAGRetriever] = None


def get_retriever() -> GraphRAGRetriever:
    """Return the shared GraphRAGRetriever singleton."""
    global _retriever
    if _retriever is None:
        _retriever = GraphRAGRetriever()
    return _retriever
