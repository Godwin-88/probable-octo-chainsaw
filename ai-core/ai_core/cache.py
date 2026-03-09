"""Redis cache for data-intensive paths: optimization plans, graph aggregates."""
from __future__ import annotations

import json
import os
from typing import Any, Optional

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
_redis_client: Any = None

def _get_redis():
    global _redis_client
    if _redis_client is None:
        import redis
        _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client

def cache_get(key: str) -> Optional[dict]:
    try:
        r = _get_redis()
        raw = r.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None

def cache_set(key: str, value: dict, ttl_sec: int = 300) -> None:
    try:
        r = _get_redis()
        r.setex(key, ttl_sec, json.dumps(value))
    except Exception:
        pass

def optimization_plan_key(optimization_id: str) -> str:
    return f"optimization_plan:{optimization_id}"  # must match gateway-wdk optimizationPlanCacheKey

def portfolio_key(wallet: str, chain_id: str) -> str:
    return f"portfolio:{wallet}:{chain_id}"

PLAN_TTL = 300
PORTFOLIO_TTL = 120
