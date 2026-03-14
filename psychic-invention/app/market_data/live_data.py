"""
Live market data fetchers — DeFi-only (gateway + Neo4j).

All fetchers are async and use the Redis-backed cache.
Data source: DoraHacks gateway (portfolio) and Neo4j (opportunities, assets).
yfinance removed; OpenBB fallbacks use DeFi data.

Cache TTLs: L2 5 min (quote/options), L3 1 hr (history).
Namespace: "defi:<type>:<symbol>:…"
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import structlog

from app.cache.redis_cache import get_cache, L2_TTL, L3_TTL
from app.defi_data.live import get_quote as defi_get_quote, get_history as defi_get_history, get_options as defi_get_options

logger = structlog.get_logger(__name__)


def _ck(*parts: str) -> str:
    return ":".join(str(p) for p in parts)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


# ── DeFi fetchers (replacing yfinance) ─────────────────────────────────────────

async def get_yf_quote(symbol: str) -> Dict[str, Any]:
    """Quote for *symbol* from DeFi data (gateway portfolio or Neo4j). Cached L2."""
    cache = get_cache()
    key = _ck("defi", "quote", symbol.upper())
    cached = await cache.get(key)
    if cached is not None:
        return cached
    logger.info("defi: fetching quote", symbol=symbol)
    data = await defi_get_quote(symbol)
    await cache.set(key, data, ttl=L2_TTL)
    return data


async def get_yf_history(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
) -> Dict[str, Any]:
    """OHLCV-style history from DeFi (synthetic from Neo4j APY). Cached L3."""
    cache = get_cache()
    key = _ck("defi", "history", symbol.upper(), period, interval)
    cached = await cache.get(key)
    if cached is not None:
        return cached
    logger.info("defi: fetching history", symbol=symbol, period=period, interval=interval)
    data = await defi_get_history(symbol, period=period, interval=interval)
    await cache.set(key, data, ttl=L3_TTL)
    return data


async def get_yf_options(
    symbol: str,
    expiry: Optional[str] = None,
) -> Dict[str, Any]:
    """DeFi has no options chain; returns opportunity list from Neo4j. Cached L2."""
    cache = get_cache()
    key = _ck("defi", "options", symbol.upper(), expiry or "nearest")
    cached = await cache.get(key)
    if cached is not None:
        return cached
    logger.info("defi: fetching options (opportunities)", symbol=symbol, expiry=expiry)
    data = await defi_get_options(symbol, expiry=expiry)
    await cache.set(key, data, ttl=L2_TTL)
    return data


async def get_yf_implied_vol(symbol: str) -> Dict[str, Any]:
    """Yield volatility / implied vol proxy from DeFi (no options chain). Cached L2."""
    cache = get_cache()
    key = _ck("defi", "iv", symbol.upper())
    cached = await cache.get(key)
    if cached is not None:
        return cached

    quote = await get_yf_quote(symbol)
    spot = quote.get("spot_price") or 1.0
    chain_data = await get_yf_options(symbol)
    chain = chain_data.get("chain") or {}
    calls = chain.get("calls", chain_data.get("calls", []))

    iv: Optional[float] = None
    atm_strike: Optional[float] = None
    if calls:
        c = calls[0]
        iv = float(c.get("impliedVolatility") or 0.2)
        atm_strike = c.get("strike")

    data: Dict[str, Any] = {
        "symbol": symbol.upper(),
        "implied_vol": iv,
        "atm_strike": atm_strike,
        "expiry": chain_data.get("expiry"),
        "spot_price": spot,
        "timestamp": _now(),
        "source": "defi",
    }
    await cache.set(key, data, ttl=L2_TTL)
    return data


# ─────────────────────────────────────────────────────────────────────────────
# OpenBB Platform fetchers (optional dependency)
# ─────────────────────────────────────────────────────────────────────────────

async def get_openbb_quote(
    symbol: str,
    provider: str = "yfinance",
) -> Dict[str, Any]:
    """
    Real-time quote via OpenBB Platform SDK.

    Falls back to yfinance if ``openbb`` is not installed or the call fails.
    Cached for CACHE_TTL_L2.
    """
    cache = get_cache()
    key = _ck("openbb", "quote", symbol.upper(), provider)
    cached = await cache.get(key)
    if cached is not None:
        return cached

    data: Dict[str, Any] = {}
    try:
        from openbb import obb  # noqa: PLC0415
        logger.info("OpenBB: fetching quote", symbol=symbol, provider=provider)
        raw = obb.equity.price.quote(symbol=symbol, provider=provider)
        df = raw.to_df()
        if df.empty:
            raise ValueError("OpenBB returned empty DataFrame")
        row = df.iloc[0].to_dict()
        data = {
            "symbol": symbol.upper(),
            "spot_price": _f(row.get("last_price") or row.get("price")),
            "bid": _f(row.get("bid")),
            "ask": _f(row.get("ask")),
            "volume": _f(row.get("volume")),
            "change_percent": _f(row.get("change_percent")),
            "day_high": _f(row.get("high")),
            "day_low": _f(row.get("low")),
            "prev_close": _f(row.get("prev_close")),
            "timestamp": _now(),
            "source": f"openbb/{provider}",
        }
    except ImportError:
        logger.warning("openbb not installed — using defi fallback", symbol=symbol)
        data = {**await get_yf_quote(symbol), "source": "defi_fallback"}
    except Exception as exc:
        logger.error("OpenBB quote error", symbol=symbol, error=str(exc))
        data = {**await get_yf_quote(symbol), "source": "defi_fallback", "openbb_error": str(exc)}

    await cache.set(key, data, ttl=L2_TTL)
    return data


async def get_openbb_history(
    symbol: str,
    start_date: str = "2020-01-01",
    provider: str = "yfinance",
) -> Dict[str, Any]:
    """
    OHLCV history via OpenBB Platform. Falls back to yfinance.
    Cached for CACHE_TTL_L3 (1 hr).
    """
    cache = get_cache()
    key = _ck("openbb", "history", symbol.upper(), start_date, provider)
    cached = await cache.get(key)
    if cached is not None:
        return cached

    data: Dict[str, Any] = {}
    try:
        from openbb import obb  # noqa: PLC0415
        logger.info("OpenBB: fetching history", symbol=symbol, start_date=start_date, provider=provider)
        raw = obb.equity.price.historical(symbol=symbol, start_date=start_date, provider=provider)
        df = raw.to_df()
        df.index = df.index.astype(str)
        data = {
            "symbol": symbol.upper(),
            "start_date": start_date,
            "provider": provider,
            "columns": list(df.columns),
            "rows": df.reset_index().rename(columns={"index": "date"}).fillna(0).to_dict(orient="records"),
            "row_count": len(df),
            "timestamp": _now(),
            "source": f"openbb/{provider}",
        }
    except ImportError:
        logger.warning("openbb not installed — using yfinance fallback", symbol=symbol)
        data = {**await get_yf_history(symbol), "source": "yfinance_fallback"}
    except Exception as exc:
        logger.error("OpenBB history error", symbol=symbol, error=str(exc))
        data = {**await get_yf_history(symbol), "source": "yfinance_fallback", "openbb_error": str(exc)}

    await cache.set(key, data, ttl=L3_TTL)
    return data


async def get_openbb_news(
    symbol: str,
    limit: int = 10,
    provider: str = "benzinga",
) -> Dict[str, Any]:
    """
    Latest news headlines for *symbol* via OpenBB Platform.
    Falls back to an empty list when OpenBB is unavailable.
    Cached for CACHE_TTL_L2 (5 min).
    """
    cache = get_cache()
    key = _ck("openbb", "news", symbol.upper(), str(limit), provider)
    cached = await cache.get(key)
    if cached is not None:
        return cached

    data: Dict[str, Any] = {"symbol": symbol.upper(), "articles": [], "timestamp": _now()}
    try:
        from openbb import obb  # noqa: PLC0415
        logger.info("OpenBB: fetching news", symbol=symbol, provider=provider)
        raw = obb.news.company(symbol=symbol, limit=limit, provider=provider)
        df = raw.to_df()
        articles = []
        for _, row in df.iterrows():
            articles.append({
                "title": str(row.get("title", "")),
                "url": str(row.get("url", "")),
                "published": str(row.get("date", row.get("published", ""))),
                "source": str(row.get("source", provider)),
                "sentiment": str(row.get("sentiment", "")),
            })
        data = {
            "symbol": symbol.upper(),
            "articles": articles,
            "count": len(articles),
            "timestamp": _now(),
            "source": f"openbb/{provider}",
        }
    except ImportError:
        logger.warning("openbb not installed — news unavailable", symbol=symbol)
        data["error"] = "openbb not installed"
    except Exception as exc:
        logger.error("OpenBB news error", symbol=symbol, error=str(exc))
        data["error"] = str(exc)

    await cache.set(key, data, ttl=L2_TTL)
    return data


# ── Private helpers ───────────────────────────────────────────────────────────

def _f(v: Any) -> float:
    """Safely coerce a value to float (returns 0.0 on failure)."""
    try:
        return float(v) if v is not None else 0.0
    except (TypeError, ValueError):
        return 0.0
