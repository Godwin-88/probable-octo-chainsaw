"""
Asset Universe API — DeFi-only (Neo4j + gateway).

Asset universe from DoraHacks Neo4j: Asset and Opportunity nodes.
Search returns DeFi assets and yield opportunities.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging

router = APIRouter(prefix="/assets", tags=["assets"])

logger = logging.getLogger(__name__)

DEFI_ASSET_TYPES = ["all", "asset", "opportunity"]
ASSET_TYPE_LABELS = {"all": "All", "asset": "Assets", "opportunity": "Opportunities"}


@router.get("/providers")
def get_data_providers() -> List[str]:
    """Return available data providers (DeFi only; yfinance removed)."""
    try:
        from app.assets.providers import VALID_PROVIDERS
        return list(VALID_PROVIDERS)
    except ImportError:
        return ["defi"]


@router.get("/types")
def get_asset_types() -> List[dict]:
    """Return asset types for DeFi (asset, opportunity)."""
    return [{"id": t, "label": ASSET_TYPE_LABELS.get(t, t)} for t in DEFI_ASSET_TYPES]


@router.get("/search")
def search_assets(
    q: str = Query(..., min_length=1, description="Search query (symbol or name fragment)"),
    type: str = Query("all", description="Asset type: all, asset, opportunity"),
    count: int = Query(50, ge=5, le=100, description="Max results to return"),
) -> List[dict]:
    """Search DeFi assets and opportunities from Neo4j."""
    if type and type not in DEFI_ASSET_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid type. Use one of: {', '.join(DEFI_ASSET_TYPES)}")
    try:
        from app.defi_data.live import get_asset_universe_list
        items = get_asset_universe_list(query=q.strip(), limit=count)
        out = []
        for item in items:
            if type != "all" and item.get("type") != type:
                continue
            out.append({
                "symbol": item.get("symbol") or item.get("id", ""),
                "type": item.get("type", "asset"),
                "name": item.get("name", item.get("symbol", ""))[:80],
            })
            if len(out) >= count:
                break
        return out
    except Exception as e:
        logger.exception("Asset search failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── Market Movers ─────────────────────────────────────────────────────────────

# Per-category watchlists — broad cross-asset coverage for the ticker
_MOVERS_BY_CATEGORY: dict[str, dict] = {
    "equities": {
        "label": "Equities",
        "color": "blue",
        "symbols": [
            "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "JPM",
            "GS", "BAC", "XOM", "CVX", "UNH", "JNJ", "V", "MA", "WMT", "HD",
            "PG", "KO", "NFLX", "ADBE", "AMD", "INTC", "ORCL", "CRM", "PYPL",
            "DIS", "NKE", "PFE",
        ],
    },
    "etfs": {
        "label": "ETFs",
        "color": "indigo",
        "symbols": [
            "SPY", "QQQ", "IWM", "DIA", "VTI", "VOO", "GLD", "SLV", "TLT",
            "XLF", "XLK", "XLE", "XLV", "XLI", "XLY", "ARKK", "ARKG", "HYG",
            "LQD", "EEM",
        ],
    },
    "indices": {
        "label": "Indices",
        "color": "violet",
        "symbols": [
            "^GSPC", "^IXIC", "^DJI", "^RUT", "^FTSE", "^N225", "^HSI",
            "^DAX", "^CAC40", "^STOXX50E", "^AXJO", "^BSESN",
        ],
    },
    "crypto": {
        "label": "Crypto",
        "color": "orange",
        "symbols": [
            "BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD", "ADA-USD",
            "AVAX-USD", "DOT-USD", "DOGE-USD", "MATIC-USD", "LINK-USD",
            "LTC-USD", "ATOM-USD", "UNI-USD", "NEAR-USD",
        ],
    },
    "forex": {
        "label": "Forex",
        "color": "teal",
        "symbols": [
            "EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X", "USDCAD=X",
            "USDCHF=X", "NZDUSD=X", "EURGBP=X", "USDINR=X", "USDCNY=X",
            "USDMXN=X", "USDBRL=X",
        ],
    },
    "futures": {
        "label": "Futures",
        "color": "amber",
        "symbols": [
            "CL=F", "BZ=F", "GC=F", "SI=F", "HG=F", "NG=F",
            "ZC=F", "ZW=F", "ZS=F", "KC=F", "SB=F", "CT=F",
        ],
    },
    "volatility": {
        "label": "Volatility",
        "color": "red",
        "symbols": [
            "^VIX", "^VVIX", "^VXN", "^OVX", "^GVZ", "^SKEW",
        ],
    },
    "mutualfunds": {
        "label": "Mutual Funds",
        "color": "emerald",
        "symbols": [
            "VFINX", "FXAIX", "VTSAX", "FCNTX", "AGTHX", "DODGX",
            "PRGFX", "VTSMX",
        ],
    },
}

# Human-readable labels for non-obvious symbols
_DISPLAY_NAMES: dict[str, str] = {
    "^GSPC": "S&P 500", "^IXIC": "NASDAQ", "^DJI": "Dow Jones",
    "^RUT": "Russell 2000", "^FTSE": "FTSE 100", "^N225": "Nikkei 225",
    "^HSI": "Hang Seng", "^DAX": "DAX", "^CAC40": "CAC 40",
    "^STOXX50E": "Euro Stoxx 50", "^AXJO": "ASX 200", "^BSESN": "Sensex",
    "^VIX": "VIX", "^VVIX": "VVIX", "^VXN": "VXN (NASDAQ Vol)",
    "^OVX": "OVX (Oil Vol)", "^GVZ": "GVZ (Gold Vol)", "^SKEW": "SKEW",
    "CL=F": "WTI Crude", "BZ=F": "Brent Crude", "GC=F": "Gold",
    "SI=F": "Silver", "HG=F": "Copper", "NG=F": "Nat Gas",
    "ZC=F": "Corn", "ZW=F": "Wheat", "ZS=F": "Soybeans",
    "KC=F": "Coffee", "SB=F": "Sugar", "CT=F": "Cotton",
    "EURUSD=X": "EUR/USD", "GBPUSD=X": "GBP/USD", "USDJPY=X": "USD/JPY",
    "AUDUSD=X": "AUD/USD", "USDCAD=X": "USD/CAD", "USDCHF=X": "USD/CHF",
    "NZDUSD=X": "NZD/USD", "EURGBP=X": "EUR/GBP", "USDINR=X": "USD/INR",
    "USDCNY=X": "USD/CNY", "USDMXN=X": "USD/MXN", "USDBRL=X": "USD/BRL",
}

# Module-level cache — avoid repeated slow batch downloads
import time as _time
_movers_cache: dict = {"data": None, "ts": 0.0}
_MOVERS_CACHE_TTL = 300  # 5 minutes


def _ticker_label(sym: str) -> str:
    if sym in _DISPLAY_NAMES:
        return _DISPLAY_NAMES[sym]
    return sym.replace("=X", "").replace("-USD", "/USD").replace("^", "")


@router.get("/movers")
def get_market_movers(top: int = Query(5, ge=2, le=10)) -> dict:
    """
    Return top gainers and top losers per asset class (equities, ETFs, indices,
    crypto, forex, futures, volatility, mutual funds). Cached in-process for 5 min.
    """
    global _movers_cache

    # Return cached result if fresh
    now = _time.time()
    if _movers_cache["data"] is not None and (now - _movers_cache["ts"]) < _MOVERS_CACHE_TTL:
        return _movers_cache["data"]

    try:
        from app.defi_data.neo4j_assets import get_defi_opportunities
        opps = get_defi_opportunities(limit=50)
        cat_results = []
        for o in opps:
            apy = o.get("apy")
            sym = (o.get("symbol") or o.get("id") or "").upper()
            if apy is None or not sym:
                continue
            apy_f = float(apy)
            risk = float(o.get("riskScore") or 0.2)
            cat_results.append({
                "symbol": o.get("id") or sym,
                "label": f"{sym} ({o.get('protocolId', '')})",
                "price": round(apy_f, 2),
                "change_pct": round(apy_f - risk * 10, 2),
            })
        cat_results.sort(key=lambda x: x["change_pct"], reverse=True)
        gainers = cat_results[:top]
        losers = list(reversed(cat_results[-top:])) if len(cat_results) >= top else []
        from datetime import datetime, timezone
        ts = datetime.now(timezone.utc).strftime("%H:%M UTC")
        result = {
            "categories": {
                "defi": {
                    "label": "DeFi Yield",
                    "color": "green",
                    "gainers": gainers,
                    "losers": losers,
                },
            },
            "timestamp": ts,
        }
        _movers_cache["data"] = result
        _movers_cache["ts"] = now
        return result
    except Exception as e:
        logger.exception("Market movers failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


YF_PERIODS = ("1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "ytd")

try:
    from app.assets.providers import VALID_PROVIDERS, get_asset_history_by_provider
except ImportError:
    VALID_PROVIDERS = ("defi",)
    get_asset_history_by_provider = None


@router.get("/history")
def get_asset_history(
    symbol: str = Query(..., min_length=1, description="Asset symbol (e.g. USDT, USDC)"),
    period: str = Query("1mo", description="Period: 1d, 5d, 1mo, 3mo, 6mo, 1y, ytd"),
    provider: str = Query("defi", description="Data source: defi"),
) -> List[dict]:
    """Fetch OHLC-style history for charting. DeFi data from Neo4j."""
    if period not in YF_PERIODS:
        raise HTTPException(status_code=400, detail=f"Invalid period. Use one of: {', '.join(YF_PERIODS)}")
    if get_asset_history_by_provider is None:
        raise HTTPException(status_code=503, detail="Asset providers not available")
    try:
        return get_asset_history_by_provider(symbol, period, provider or "defi")
    except Exception as e:
        logger.exception("Asset history failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quote/{symbol}")
def get_asset_quote(
    symbol: str,
    provider: str = Query("defi", description="Data source: defi"),
) -> dict:
    """Fetch current spot/APY and name. DeFi data from gateway/Neo4j."""
    try:
        from app.assets.providers import get_asset_quote_by_provider
        return get_asset_quote_by_provider(symbol, provider or "defi")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Asset quote failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/options/{symbol}")
def get_asset_options(
    symbol: str,
    n_expiries: int = Query(3, ge=1, le=6, description="Number of nearest expiries to include"),
    moneyness_range: float = Query(0.20, ge=0.05, le=0.50, description="Strike range around ATM as fraction"),
    provider: str = Query("defi", description="Data source: defi"),
) -> dict:
    """DeFi: opportunity-based option-like data for vol calibration."""
    try:
        from app.assets.providers import get_asset_options_by_provider
        return get_asset_options_by_provider(symbol, provider or "defi", n_expiries, moneyness_range)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Options fetch failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
