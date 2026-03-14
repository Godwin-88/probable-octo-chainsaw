"""
DeFi live data API: quote, history, options (stub), asset universe.
Same logical surface as former yfinance layer for drop-in replacement.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .gateway_client import get_portfolio_via_gateway, portfolio_to_quote_response
from .neo4j_assets import (
    get_defi_assets,
    get_defi_opportunities,
    get_asset_quote_from_neo4j,
    get_returns_matrix_from_opportunities,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


async def get_quote(
    symbol: str,
    wallet_address: Optional[str] = None,
    chain_id: str = "ethereum",
) -> Dict[str, Any]:
    """
    Quote for a DeFi asset. If wallet_address given and symbol matches a position, use gateway portfolio.
    Else use Neo4j opportunity/asset data.
    """
    if wallet_address and wallet_address.startswith("0x"):
        portfolio = await get_portfolio_via_gateway(wallet_address, chain_id)
        if "error" not in portfolio:
            out = portfolio_to_quote_response(portfolio, symbol)
            return out
    return get_asset_quote_from_neo4j(symbol)


async def get_history(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
) -> Dict[str, Any]:
    """
    Synthetic OHLCV history from Neo4j (APY-based). Returns same shape as yfinance history.
    """
    matrix = get_returns_matrix_from_opportunities(period_days=365 if "y" in period else 30)
    if not matrix:
        return {
            "symbol": symbol.upper(),
            "rows": [],
            "period": period,
            "interval": interval,
            "timestamp": _now(),
            "source": "defi_neo4j",
        }
    # Build fake OHLC from first column returns (or use 1.0 + daily return chain)
    rows = []
    from datetime import timedelta
    base = datetime.now(timezone.utc) - timedelta(days=len(matrix))
    close = 1.0
    for i, row in enumerate(matrix):
        r = row[0] if row else 0.0
        close = close * (1.0 + r)
        d = base + timedelta(days=i)
        rows.append({
            "date": d.strftime("%Y-%m-%d %H:%M:%S"),
            "Open": close / (1 + r),
            "High": max(close, close / (1 + r)),
            "Low": min(close, close / (1 + r)),
            "Close": close,
            "Volume": 0,
        })
    return {
        "symbol": symbol.upper(),
        "period": period,
        "interval": interval,
        "columns": ["Open", "High", "Low", "Close", "Volume"],
        "rows": rows,
        "row_count": len(rows),
        "timestamp": _now(),
        "source": "defi_neo4j",
    }


async def get_options(
    symbol: str,
    expiry: Optional[str] = None,
) -> Dict[str, Any]:
    """
    DeFi has no options chain; return opportunity "chain" (pools per protocol) or empty.
    """
    opportunities = get_defi_opportunities(limit=20)
    contracts = []
    for o in opportunities:
        contracts.append({
            "symbol": symbol.upper(),
            "contractSymbol": o.get("id") or "",
            "strike": 0,
            "expiry": "",
            "type": "call",
            "impliedVolatility": 0,
            "lastPrice": 0,
        })
    return {
        "symbol": symbol.upper(),
        "spot": 1.0,
        "chain": {"calls": contracts, "puts": []},
        "timestamp": _now(),
        "source": "defi_neo4j",
    }


def get_asset_universe_list(
    asset_type: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    Asset universe for dropdowns: DeFi assets + opportunities from Neo4j.
    """
    assets = get_defi_assets(limit=limit)
    opportunities = get_defi_opportunities(limit=limit)
    seen = set()
    out = []
    for a in assets:
        sym = (a.get("symbol") or "").upper()
        if sym and sym not in seen:
            seen.add(sym)
            if not query or query.upper() in sym:
                out.append({"id": a.get("id"), "symbol": sym, "name": sym, "type": "asset"})
    for o in opportunities:
        sym = (o.get("symbol") or "").upper()
        pid = o.get("id") or ""
        if pid and pid not in seen:
            seen.add(pid)
            if not query or query.upper() in sym or query in (o.get("protocolId") or ""):
                out.append({
                    "id": pid,
                    "symbol": sym,
                    "name": f"{sym} @ {o.get('protocolId', '')}",
                    "type": "opportunity",
                    "apy": o.get("apy"),
                })
    return out[:limit]
