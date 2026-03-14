"""
Blotter chart data — Nautilus Trader (optional) or DeFi data.
OHLCV bars for Menu 8 Chart Area. When Nautilus not configured, uses DeFi (Neo4j) bars.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import structlog

logger = structlog.get_logger(__name__)

# Map API timeframe to yfinance interval / period
TIMEFRAME_INTERVAL = {
    "1m": ("1d", "1m"),
    "5m": ("5d", "5m"),
    "15m": ("1mo", "15m"),
    "1h": ("3mo", "1h"),
    "4h": ("1y", "1d"),  # no 4h in yf; use 1d
    "1d": ("1y", "1d"),
    "1w": ("2y", "1wk"),
}
ASSET_TYPES = ["equity", "fx", "crypto", "commodity"]


def get_chart_bars(
    symbol: str,
    timeframe: str = "1d",
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """OHLCV bars for charting. Nautilus when configured, else DeFi (Neo4j) data."""
    symbol = (symbol or "").strip().upper()
    if not symbol:
        return []

    # Try Nautilus first when catalog path is set
    catalog_path = os.getenv("NAUTILUS_CATALOG_PATH") or os.getenv("NAUTILUS_DATA_CATALOG_PATH")
    if catalog_path:
        try:
            return _get_bars_nautilus(symbol, timeframe, from_date, to_date, catalog_path)
        except Exception as e:
            logger.warning("nautilus_chart_bars_fallback", symbol=symbol, error=str(e))

    # Fallback: yfinance (dev / when Nautilus not configured)
    return _get_bars_yfinance(symbol, timeframe, from_date, to_date)


def _get_bars_nautilus(
    symbol: str,
    timeframe: str,
    from_date: Optional[str],
    to_date: Optional[str],
    catalog_path: str,
) -> List[Dict[str, Any]]:
    """Read bars from Nautilus ParquetDataCatalog (bar_types/instrument_ids)."""
    try:
        from nautilus_trader.persistence.catalog import ParquetDataCatalog
        from nautilus_trader.model.data import Bar
    except ImportError:
        raise RuntimeError("nautilus_trader not installed")

    catalog = ParquetDataCatalog(catalog_path)
    # Query bars: instrument_ids filter by symbol; Nautilus uses InstrumentId string
    bars = catalog.bars(
        instrument_ids=None,
        start=from_date,
        end=to_date,
    )
    out: List[Dict[str, Any]] = []
    for b in bars:
        bar_type = str(getattr(b, "bar_type", ""))
        if symbol and symbol not in bar_type:
            continue
        ts = getattr(b, "ts_event", None) or getattr(b, "timestamp", None)
        if ts is not None and hasattr(ts, "timestamp"):
            ts = ts.timestamp()
        out.append({
            "time": ts,
            "open": float(getattr(b, "open", 0)),
            "high": float(getattr(b, "high", 0)),
            "low": float(getattr(b, "low", 0)),
            "close": float(getattr(b, "close", 0)),
            "volume": float(getattr(b, "volume", 0)),
        })
    return out


def _get_bars_defi(
    symbol: str,
    timeframe: str,
    from_date: Optional[str],
    to_date: Optional[str],
) -> List[Dict[str, Any]]:
    """OHLCV from DeFi data (app.defi_data get_history)."""
    import asyncio
    from app.defi_data.live import get_history

    interval_map = TIMEFRAME_INTERVAL.get(timeframe, ("1y", "1d"))
    period, _ = interval_map
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    data = loop.run_until_complete(get_history(symbol.strip(), period=period, interval="1d"))
    rows = data.get("rows") or []
    if not rows:
        return []

    def _num(v):
        try:
            f = float(v)
            return 0.0 if (f != f or abs(f) == float("inf")) else f
        except (TypeError, ValueError):
            return 0.0

    out: List[Dict[str, Any]] = []
    for row in rows:
        date_str = row.get("date", "")
        try:
            from datetime import datetime as dt
            ts = dt.strptime(date_str[:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc).timestamp()
        except Exception:
            ts = 0.0
        open_ = _num(row.get("Open"))
        high = _num(row.get("High"))
        low = _num(row.get("Low"))
        close = _num(row.get("Close"))
        vol = _num(row.get("Volume"))
        out.append({
            "time": ts,
            "open": open_,
            "high": high,
            "low": low,
            "close": close,
            "volume": vol,
        })
    return out


def list_instruments(asset_type: str) -> List[Dict[str, Any]]:
    """
    List instruments by asset type for Chart Area selector.
    Uses Nautilus when configured, else DeFi asset list.
    """
    asset_type = (asset_type or "equity").lower()
    if asset_type not in ASSET_TYPES:
        asset_type = "equity"

    catalog_path = os.getenv("NAUTILUS_CATALOG_PATH") or os.getenv("NAUTILUS_DATA_CATALOG_PATH")
    if catalog_path:
        try:
            return _list_instruments_nautilus(asset_type, catalog_path)
        except Exception as e:
            logger.warning("nautilus_instruments_fallback", asset_type=asset_type, error=str(e))

    return _list_instruments_fallback(asset_type)


def _list_instruments_nautilus(asset_type: str, catalog_path: str) -> List[Dict[str, Any]]:
    """List instruments from Nautilus catalog by asset type."""
    try:
        from nautilus_trader.persistence.catalog import ParquetDataCatalog
    except ImportError:
        raise RuntimeError("nautilus_trader not installed")

    catalog = ParquetDataCatalog(catalog_path)
    instruments = catalog.instruments()
    out: List[Dict[str, Any]] = []
    type_map = {"equity": "EQUITY", "fx": "FOREIGN_EXCHANGE", "crypto": "CRYPTO", "commodity": "COMMODITY"}
    nautilus_type = type_map.get(asset_type, "EQUITY")
    for inv in instruments:
        kind = str(getattr(inv, "asset_class", None) or type(inv).__name__)
        if nautilus_type.lower() not in kind.lower():
            continue
        sym = str(getattr(inv, "symbol", getattr(inv, "id", "")))
        out.append({"symbol": sym, "name": getattr(inv, "name", sym), "asset_type": asset_type})
    return out[:200]


def _list_instruments_fallback(asset_type: str) -> List[Dict[str, Any]]:
    """Fallback: common symbols by asset type (dev only)."""
    fallbacks = {
        "equity": [
            {"symbol": "AAPL", "name": "Apple Inc.", "asset_type": "equity"},
            {"symbol": "MSFT", "name": "Microsoft", "asset_type": "equity"},
            {"symbol": "GOOGL", "name": "Alphabet", "asset_type": "equity"},
            {"symbol": "AMZN", "name": "Amazon", "asset_type": "equity"},
            {"symbol": "SPY", "name": "SPDR S&P 500", "asset_type": "equity"},
        ],
        "fx": [
            {"symbol": "EURUSD=X", "name": "EUR/USD", "asset_type": "fx"},
            {"symbol": "GBPUSD=X", "name": "GBP/USD", "asset_type": "fx"},
            {"symbol": "USDJPY=X", "name": "USD/JPY", "asset_type": "fx"},
        ],
        "crypto": [
            {"symbol": "BTC-USD", "name": "Bitcoin", "asset_type": "crypto"},
            {"symbol": "ETH-USD", "name": "Ethereum", "asset_type": "crypto"},
        ],
        "commodity": [
            {"symbol": "GC=F", "name": "Gold", "asset_type": "commodity"},
            {"symbol": "CL=F", "name": "Crude Oil", "asset_type": "commodity"},
        ],
    }
    return fallbacks.get(asset_type, fallbacks["equity"])
