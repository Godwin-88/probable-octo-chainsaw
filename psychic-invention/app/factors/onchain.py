"""
On-chain factor data for factor regressions: TVL momentum, whale flow, mempool/pool activity.
Fetches from DefiLlama (TVL); whale/mempool stubbed until external APIs are wired.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

DEFILLAMA_TVL_URL = "https://api.llama.fi/tvl"
DEFILLAMA_PROTOCOLS_URL = "https://api.llama.fi/protocols"


async def fetch_tvl_series(protocol_or_chain: str, limit: int = 30) -> List[Dict[str, Any]]:
    """Fetch TVL time series from DefiLlama (chain or protocol). Returns list of { date, tvl }."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(
                "https://api.llama.fi/v2/historicalChainTvl/" + protocol_or_chain.lower()
            )
            if r.status_code != 200:
                return []
            data = r.json()
    except Exception as e:
        logger.warning("TVL fetch failed: %s", e)
        return []
    if not isinstance(data, list):
        return []
    out = []
    for point in data[-limit:]:
        if isinstance(point, dict) and "tvl" in point:
            out.append({"date": point.get("date"), "tvl": point.get("tvl", 0)})
        elif isinstance(point, (int, float)):
            out.append({"tvl": point})
    return out


def _tvl_momentum_from_series(series: List[Dict[str, Any]]) -> List[float]:
    """Compute period-over-period TVL momentum (percentage change)."""
    if len(series) < 2:
        return [0.0] * len(series)
    out = []
    for i in range(len(series)):
        tvl = series[i].get("tvl") or 0
        prev = series[i - 1].get("tvl") or tvl if i > 0 else tvl
        if prev and prev > 0:
            out.append((tvl - prev) / prev)
        else:
            out.append(0.0)
    return out


async def get_onchain_factors(
    chain: str = "ethereum",
    protocol: Optional[str] = None,
    limit: int = 30,
) -> Dict[str, Any]:
    """
    Return on-chain factor series for use in factor model / Fama-MacBeth.
    Keys: tvl_momentum, whale_flow (stub), mempool_activity (stub).
    """
    target = protocol or chain
    series = await fetch_tvl_series(target, limit=limit)
    tvl_momentum = _tvl_momentum_from_series(series) if series else [0.0] * limit
    return {
        "chain": chain,
        "protocol": protocol,
        "tvl_momentum": tvl_momentum,
        "whale_flow": [0.0] * len(tvl_momentum),
        "mempool_activity": [0.0] * len(tvl_momentum),
        "series_length": len(tvl_momentum),
    }
