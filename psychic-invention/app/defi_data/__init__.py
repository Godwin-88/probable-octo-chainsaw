"""
DeFi-only data layer for TRANSACT.
Replaces yfinance: quote, history, and asset universe from gateway + Neo4j.
All 8 quant workspaces consume this module.
"""
from .gateway_client import get_portfolio_via_gateway
from .neo4j_assets import (
    get_defi_opportunities,
    get_defi_assets,
    get_asset_quote_from_neo4j,
    get_returns_matrix_from_opportunities,
)
from .live import get_quote, get_history, get_options, get_asset_universe_list

__all__ = [
    "get_portfolio_via_gateway",
    "get_defi_opportunities",
    "get_defi_assets",
    "get_asset_quote_from_neo4j",
    "get_returns_matrix_from_opportunities",
    "get_quote",
    "get_history",
    "get_options",
    "get_asset_universe_list",
]
