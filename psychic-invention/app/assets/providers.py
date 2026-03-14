"""
Asset data by provider: defi (gateway + Neo4j). yfinance removed.
Normalized responses for /assets/history, /assets/quote, /assets/options.
"""

from __future__ import annotations

import asyncio
import math
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

import logging

logger = logging.getLogger(__name__)

VALID_PROVIDERS = ("defi",)


def _period_to_dates(period: str) -> tuple[str, str]:
    """Map period to (start_date, end_date) for OpenBB/Nautilus."""
    today = date.today()
    if period == "1d":
        start = today - timedelta(days=2)
    elif period == "5d":
        start = today - timedelta(days=10)
    elif period == "1mo":
        start = today - timedelta(days=35)
    elif period == "3mo":
        start = today - timedelta(days=95)
    elif period == "6mo":
        start = today - timedelta(days=185)
    elif period == "1y":
        start = today - timedelta(days=370)
    elif period == "2y":
        start = today - timedelta(days=730)
    elif period == "5y":
        start = today - timedelta(days=1825)
    elif period == "ytd":
        start = date(today.year, 1, 1)
    else:
        start = today - timedelta(days=370)
    return start.isoformat(), today.isoformat()


def _num(v: Any) -> Optional[float]:
    try:
        f = float(v)
        return None if (math.isnan(f) or math.isinf(f)) else f
    except (TypeError, ValueError):
        return None


# ─── History ─────────────────────────────────────────────────────────────────

def _run_async(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


def history_defi(symbol: str, period: str) -> List[Dict[str, Any]]:
    """OHLCV-style history from DeFi (synthetic from Neo4j). Returns [{ date, open, high, low, close, volume }]."""
    from app.defi_data.live import get_history
    data = _run_async(get_history(symbol.strip(), period=period, interval="1d"))
    rows = data.get("rows") or []
    out = []
    for r in rows:
        out.append({
            "date": r.get("date", ""),
            "open": _num(r.get("Open")),
            "high": _num(r.get("High")),
            "low": _num(r.get("Low")),
            "close": _num(r.get("Close")),
            "volume": _num(r.get("Volume")),
        })
    return out


def get_asset_history_by_provider(symbol: str, period: str, provider: str) -> List[Dict[str, Any]]:
    provider = (provider or "defi").lower()
    if provider not in VALID_PROVIDERS:
        provider = "defi"
    return history_defi(symbol, period)


# ─── Quote ───────────────────────────────────────────────────────────────────

def quote_defi(symbol: str) -> Dict[str, Any]:
    """Current quote from DeFi (Neo4j / gateway). Returns { symbol, spot, name, currency }."""
    from app.defi_data.live import get_quote
    data = _run_async(get_quote(symbol.strip().upper()))
    spot = data.get("spot_price") or data.get("apy") or 1.0
    return {
        "symbol": (data.get("symbol") or symbol).upper(),
        "spot": float(spot) if spot is not None else 1.0,
        "name": (data.get("symbol") or symbol).upper(),
        "currency": data.get("currency", "USD"),
    }


def get_asset_quote_by_provider(symbol: str, provider: str) -> Dict[str, Any]:
    provider = (provider or "defi").lower()
    if provider not in VALID_PROVIDERS:
        provider = "defi"
    return quote_defi(symbol)


# ─── Options ──────────────────────────────────────────────────────────────────

def options_defi(symbol: str, n_expiries: int, moneyness_range: float) -> Dict[str, Any]:
    """DeFi has no options chain; return opportunity-based stub for Heston/vol. Returns { symbol, spot, n_contracts, contracts }."""
    from app.defi_data.live import get_quote, get_options
    quote_data = _run_async(get_quote(symbol.strip().upper()))
    spot = float(quote_data.get("spot_price") or 1.0)
    opt_data = _run_async(get_options(symbol.strip().upper()))
    chain = opt_data.get("chain") or {}
    calls = chain.get("calls") or []
    contracts = []
    for i, c in enumerate(calls[: n_expiries * 5]):
        strike = float(c.get("strike") or 0)
        iv = float(c.get("impliedVolatility") or 0.2)
        tau = 0.25 * (i % 4 + 1)
        contracts.append({
            "strike": strike,
            "expiry": round(tau, 4),
            "expiry_str": "",
            "price": 0.0,
            "implied_vol": round(iv, 4),
            "moneyness": round(strike / spot, 4) if spot else 0,
        })
    if not contracts:
        contracts = [{"strike": spot, "expiry": 0.25, "expiry_str": "", "price": 0.0, "implied_vol": 0.2, "moneyness": 1.0}]
    return {
        "symbol": symbol.upper(),
        "spot": spot,
        "n_contracts": len(contracts),
        "contracts": contracts,
    }


def get_asset_options_by_provider(
    symbol: str, provider: str, n_expiries: int = 3, moneyness_range: float = 0.20
) -> Dict[str, Any]:
    provider = (provider or "defi").lower()
    if provider not in VALID_PROVIDERS:
        provider = "defi"
    return options_defi(symbol, n_expiries, moneyness_range)
