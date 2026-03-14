"""
Intent router — classify user message into one of the agent intent categories.

Intent classes:
  FORMULA_EXPLAIN   — asking about a specific formula
  CONCEPT_EXPLAIN   — asking about a financial/DeFi concept
  METRIC_INTERPRET  — asking to interpret a metric value
  STRATEGY_SUGGEST  — asking for trading strategy recommendations
  WORKSPACE_ANALYZE — asking to analyze computed workspace results
  DERIVATION        — asking about formula derivation/lineage
  COMPARE           — comparing two formulas or models
  GRAPH_QUERY       — general graph knowledge retrieval (GraphRAG)
  GENERAL           — general conversation, unclear intent

The router is purely keyword/pattern based (no LLM call) to keep latency <1 ms.
For a production system, swap with a tiny intent classifier fine-tuned on domain vocabulary.
"""
from __future__ import annotations

from enum import Enum
from typing import Optional


class Intent(str, Enum):
    FORMULA_EXPLAIN = "formula_explain"
    CONCEPT_EXPLAIN = "concept_explain"
    METRIC_INTERPRET = "metric_interpret"
    STRATEGY_SUGGEST = "strategy_suggest"
    WORKSPACE_ANALYZE = "workspace_analyze"
    DERIVATION = "derivation"
    COMPARE = "compare"
    GRAPH_QUERY = "graph_query"
    GENERAL = "general"


# ── Pattern tables ────────────────────────────────────────────────────────────

_FORMULA_PATTERNS = [
    "black-scholes", "black scholes", "bs call", "bs put",
    "heston", "kelly criterion", "kelly formula",
    "var formula", "expected shortfall formula",
    "sharpe formula", "black-litterman formula",
    "impermanent loss formula", "amm formula", "constant product",
    "implied volatility formula",
]

_CONCEPT_PATTERNS = [
    "what is ", "explain ", "define ", "meaning of", "tell me about",
    "what does .* mean", "describe ", "concept of", "how does .* work",
]

_CONCEPT_TERMS = [
    "impermanent loss", "value at risk", "mev", "flash loan", "amm",
    "liquidity", "slippage", "volatility", "delta", "gamma", "vega",
    "alpha", "beta", "sharpe", "sortino", "drawdown", "leverage",
    "staking", "yield farming", "dao", "governance token",
    "arbitrage", "market making", "price impact", "collateral",
    "liquidation", "oracle", "defi", "dex", "cex",
]

_METRIC_PATTERNS = [
    "interpret", "what does this mean", "my .* is ", "value of ",
    "result is", "output is", "reading", "gauge",
]

_METRIC_TERMS = [
    "sharpe ratio", "sortino ratio", "var", "es ", "expected shortfall",
    "beta", "alpha", "correlation", "r-squared", "information ratio",
    "max drawdown", "calmar", "profit factor", "win rate",
]

_STRATEGY_PATTERNS = [
    "strateg", "suggest", "recommend", "how to trade", "when to buy",
    "when to sell", "position size", "stop loss", "profit target",
    "entry signal", "exit signal", "trading plan", "trading idea",
    "kelly", "rebalance", "hedge", "delta neutral", "arbitrage",
    "market making", "momentum", "mean reversion",
]

_DERIVATION_PATTERNS = [
    "derive", "derivation", "lineage", "comes from", "derived from",
    "prove", "where does .* come from", "mathematical origin",
]

_COMPARE_PATTERNS = [
    " vs ", " versus ", "compare ", "difference between",
    "better than", "which is better", "pros and cons",
]

_WORKSPACE_PATTERNS = [
    "my result", "my portfolio", "my position", "computed", "calculated",
    "workspace", "the number", "output shows", "analysis shows",
    "it shows", "my sharpe", "my var", "my return", "what should i do",
]


def classify_intent(message: str, context: Optional[dict] = None) -> Intent:
    """
    Classify the user message into an Intent without an LLM call.

    Parameters
    ----------
    message : str — raw user message
    context : dict — optional frontend context (workspace_data, formula_name, etc.)

    Returns the most specific Intent that matches.
    """
    ctx = context or {}
    msg = (message or "").lower().strip()

    # Context hints override pattern matching
    if ctx.get("workspace_data"):
        return Intent.WORKSPACE_ANALYZE
    if ctx.get("formula_name"):
        return Intent.FORMULA_EXPLAIN
    if ctx.get("concept_name"):
        return Intent.CONCEPT_EXPLAIN
    if ctx.get("metric_name") is not None and ctx.get("metric_value") is not None:
        return Intent.METRIC_INTERPRET

    # Pattern matching
    if any(p in msg for p in _COMPARE_PATTERNS):
        return Intent.COMPARE

    if any(p in msg for p in _DERIVATION_PATTERNS):
        return Intent.DERIVATION

    if any(p in msg for p in _FORMULA_PATTERNS):
        return Intent.FORMULA_EXPLAIN

    if any(p in msg for p in _STRATEGY_PATTERNS):
        return Intent.STRATEGY_SUGGEST

    if any(p in msg for p in _METRIC_PATTERNS) and any(t in msg for t in _METRIC_TERMS):
        return Intent.METRIC_INTERPRET

    # Concept: "explain X" or a known concept term
    if any(p in msg for p in _CONCEPT_PATTERNS) or any(t in msg for t in _CONCEPT_TERMS):
        return Intent.CONCEPT_EXPLAIN

    if any(p in msg for p in _WORKSPACE_PATTERNS):
        return Intent.WORKSPACE_ANALYZE

    # Default: GraphRAG generic retrieval
    return Intent.GRAPH_QUERY
