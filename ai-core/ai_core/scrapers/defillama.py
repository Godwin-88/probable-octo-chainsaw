"""
DeFiLlama scraper — TVL, yields, protocols.
Public API, no key required.
Docs: https://defillama.com/docs/api
"""
from __future__ import annotations

import asyncio
from typing import Any

try:
    import httpx
    _HTTPX = True
except ImportError:
    _HTTPX = False

from .base import BaseScraper, ScraperResult

_BASE = "https://api.llama.fi"
_YIELDS_BASE = "https://yields.llama.fi"

# Protocol name aliases for fuzzy matching
_PROTOCOL_ALIASES: dict[str, str] = {
    "uniswap": "uniswap",
    "aave": "aave",
    "compound": "compound-v3",
    "curve": "curve-dex",
    "balancer": "balancer",
    "maker": "makerdao",
    "lido": "lido",
    "convex": "convex-finance",
    "yearn": "yearn-finance",
}


class DeFiLlamaScraper(BaseScraper):
    name = "defillama"
    refresh_interval = 120  # TVL updates every 2 min

    async def fetch(self, query: str, protocols: list[str] | None = None, **kwargs) -> list[ScraperResult]:
        """
        Fetch:
        1. Top protocol TVL for any protocol names found in query
        2. Top yield pools matching query keywords
        """
        if not _HTTPX:
            return []
        results: list[ScraperResult] = []
        q_lower = query.lower()

        # Identify protocols mentioned in query
        matched = [llama_id for alias, llama_id in _PROTOCOL_ALIASES.items() if alias in q_lower]
        if protocols:
            matched += protocols

        async with httpx.AsyncClient(timeout=8.0) as client:
            tasks = []
            if matched:
                tasks.append(self._fetch_protocol_tvl(client, matched[:3]))
            tasks.append(self._fetch_top_yields(client, query))
            fetched = await asyncio.gather(*tasks, return_exceptions=True)

        for r in fetched:
            if isinstance(r, list):
                results.extend(r)
        return results

    async def _fetch_protocol_tvl(self, client: "httpx.AsyncClient", protocol_ids: list[str]) -> list[ScraperResult]:
        results: list[ScraperResult] = []
        for pid in protocol_ids:
            try:
                r = await client.get(f"{_BASE}/protocol/{pid}")
                if r.status_code != 200:
                    continue
                data: dict[str, Any] = r.json()
                tvl = self._safe_float(data.get("tvl"))
                name = data.get("name", pid)
                chain = data.get("chain", "multi")
                category = data.get("category", "")
                text = (
                    f"{name} ({category}) TVL: ${tvl:,.0f} on {chain}. "
                    f"Description: {(data.get('description') or '')[:200]}"
                )
                results.append(ScraperResult(
                    source="defillama",
                    category="tvl",
                    text=text,
                    data={"id": pid, "tvl": tvl, "chain": chain},
                    url=f"https://defillama.com/protocol/{pid}",
                ))
            except Exception:
                continue
        return results

    async def _fetch_top_yields(self, client: "httpx.AsyncClient", query: str) -> list[ScraperResult]:
        try:
            r = await client.get(f"{_YIELDS_BASE}/pools")
            if r.status_code != 200:
                return []
            data = r.json()
            pools: list[dict[str, Any]] = data.get("data", [])
            q = query.lower()
            # Filter pools matching query (symbol or project name)
            matching = [
                p for p in pools
                if q in (p.get("symbol") or "").lower()
                or q in (p.get("project") or "").lower()
            ]
            # Sort by TVL descending, take top 3
            matching.sort(key=lambda p: self._safe_float(p.get("tvlUsd")), reverse=True)
            results: list[ScraperResult] = []
            for pool in matching[:3]:
                apy = self._safe_float(pool.get("apy"))
                tvl = self._safe_float(pool.get("tvlUsd"))
                symbol = pool.get("symbol", "")
                project = pool.get("project", "")
                chain = pool.get("chain", "")
                text = (
                    f"{symbol} on {project} ({chain}): APY {apy:.2f}%, "
                    f"TVL ${tvl:,.0f}"
                )
                if pool.get("ilRisk") not in (None, "no"):
                    text += f", IL risk: {pool.get('ilRisk')}"
                results.append(ScraperResult(
                    source="defillama",
                    category="yield",
                    text=text,
                    data=pool,
                    url=f"https://defillama.com/yields?project={project}",
                ))
            return results
        except Exception:
            return []
