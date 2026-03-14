"""
Gateway client: fetch portfolio from DoraHacks gateway (WDK).
"""
from __future__ import annotations

import os
from typing import Any, Dict, List

import httpx

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:3000").rstrip("/")


async def get_portfolio_via_gateway(
    wallet_address: str,
    chain_id: str = "ethereum",
) -> Dict[str, Any]:
    """
    GET /api/portfolio from DoraHacks gateway.
    Returns { walletAddress, positions: [{ chainId, assetSymbol, amount, amountUsd, type }], totalUsd }.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(
                f"{GATEWAY_URL}/api/portfolio",
                params={"walletAddress": wallet_address, "chainId": chain_id},
            )
            r.raise_for_status()
            return r.json()
    except Exception as e:
        return {
            "walletAddress": wallet_address,
            "positions": [],
            "totalUsd": 0.0,
            "error": str(e),
        }


def portfolio_to_quote_response(portfolio: Dict[str, Any], symbol: str) -> Dict[str, Any]:
    """Map gateway portfolio to a quote-like dict (symbol, spot_price, etc.) for one asset."""
    positions: List[Dict[str, Any]] = portfolio.get("positions") or []
    for p in positions:
        if (p.get("assetSymbol") or "").upper() == symbol.upper():
            amount = p.get("amount") or "0"
            amount_usd = float(p.get("amountUsd") or 0)
            try:
                amt = float(amount)
            except (TypeError, ValueError):
                amt = 0.0
            spot = amount_usd / amt if amt else amount_usd
            return {
                "symbol": symbol.upper(),
                "spot_price": spot,
                "bid": spot,
                "ask": spot,
                "volume": None,
                "currency": "USD",
                "exchange": "DeFi",
                "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                "source": "defi_gateway",
                "amount_usd": amount_usd,
            }
    return {
        "symbol": symbol.upper(),
        "spot_price": 0.0,
        "bid": 0.0,
        "ask": 0.0,
        "volume": None,
        "currency": "USD",
        "exchange": "DeFi",
        "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "source": "defi_gateway",
    }
