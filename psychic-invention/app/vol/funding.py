"""
Funding rates for perp markets — fetches from public APIs (e.g. Binance Futures).
Used by Vol & Funding Surface Lab and Realised vs Funding Premium.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

# Binance Futures public API (no key)
BINANCE_FUNDING_URL = "https://fapi.binance.com/fapi/v1/fundingRate"
BINANCE_PREMIUM_URL = "https://fapi.binance.com/fapi/v1/premiumIndex"

SYMBOL_MAP = {
    "ETH": "ETHUSDT",
    "BTC": "BTCUSDT",
    "BTCUSDT": "BTCUSDT",
    "ETHUSDT": "ETHUSDT",
}


def _binance_symbol(symbol: str) -> str:
    s = symbol.upper().replace("-", "").replace("USDT", "").strip()
    if s in ("ETH", "BTC"):
        return f"{s}USDT"
    if symbol.upper().endswith("USDT"):
        return symbol.upper()
    return f"{s}USDT" if s else "ETHUSDT"


async def fetch_funding_rate(symbol: str, limit: int = 1) -> List[Dict[str, Any]]:
    """Fetch funding rate history from Binance Futures. Returns list of { fundingRate, fundingTime }."""
    binance_sym = _binance_symbol(symbol)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                BINANCE_FUNDING_URL,
                params={"symbol": binance_sym, "limit": min(limit, 1000)},
            )
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        logger.warning("Funding rate fetch failed: %s", e)
        return []
    return data if isinstance(data, list) else []


async def fetch_premium_index(symbol: str) -> Optional[Dict[str, Any]]:
    """Fetch current premium index (mark price, index price, last funding rate) for a symbol."""
    binance_sym = _binance_symbol(symbol)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(BINANCE_PREMIUM_URL, params={"symbol": binance_sym})
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        logger.warning("Premium index fetch failed: %s", e)
        return None
    return data if isinstance(data, dict) else None


async def get_funding(symbol: str = "ETH", include_series: bool = False) -> Dict[str, Any]:
    """
    Return current funding rate and optional time series for the given symbol.
    """
    out: Dict[str, Any] = {
        "symbol": symbol,
        "fundingRate": None,
        "nextFundingTime": None,
        "markPrice": None,
        "indexPrice": None,
    }
    premium = await fetch_premium_index(symbol)
    if premium:
        out["fundingRate"] = float(premium.get("lastFundingRate", 0) or 0)
        out["nextFundingTime"] = premium.get("nextFundingTime")
        out["markPrice"] = premium.get("markPrice") and float(premium["markPrice"])
        out["indexPrice"] = premium.get("indexPrice") and float(premium["indexPrice"])
    if include_series:
        series = await fetch_funding_rate(symbol, limit=30)
        out["series"] = [
            {"fundingRate": float(s.get("fundingRate", 0)), "fundingTime": s.get("fundingTime")}
            for s in series
        ]
    return out
