"""
CoinGecko scraper — token prices, market cap, volume.
Uses free public API (no key required for basic endpoints).
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

_BASE = "https://api.coingecko.com/api/v3"

# Symbol → CoinGecko ID mapping for common tokens
_TOKEN_IDS: dict[str, str] = {
    "eth": "ethereum",
    "ethereum": "ethereum",
    "btc": "bitcoin",
    "bitcoin": "bitcoin",
    "usdc": "usd-coin",
    "usdt": "tether",
    "dai": "dai",
    "wbtc": "wrapped-bitcoin",
    "link": "chainlink",
    "uni": "uniswap",
    "aave": "aave",
    "crv": "curve-dao-token",
    "mkr": "maker",
    "snx": "synthetix-network-token",
    "ldo": "lido-dao",
    "cvx": "convex-finance",
    "sol": "solana",
    "matic": "matic-network",
    "bnb": "binancecoin",
    "arb": "arbitrum",
    "op": "optimism",
}


class CoinGeckoScraper(BaseScraper):
    name = "coingecko"
    refresh_interval = 60

    async def fetch(self, query: str, tokens: list[str] | None = None, **kwargs) -> list[ScraperResult]:
        if not _HTTPX:
            return []
        q_lower = query.lower()

        # Identify tokens from query
        token_ids = list({v for k, v in _TOKEN_IDS.items() if k in q_lower})
        if tokens:
            token_ids += [_TOKEN_IDS.get(t.lower(), t.lower()) for t in tokens]
        if not token_ids:
            # Default: fetch ETH + BTC as market pulse
            token_ids = ["ethereum", "bitcoin"]

        token_ids = list(dict.fromkeys(token_ids))[:5]  # deduplicate, limit

        async with httpx.AsyncClient(timeout=8.0) as client:
            tasks = [self._fetch_price(client, token_ids)]
            if any(k in q_lower for k in ("market", "cap", "volume", "dominance")):
                tasks.append(self._fetch_global(client))
            results_list = await asyncio.gather(*tasks, return_exceptions=True)

        results: list[ScraperResult] = []
        for r in results_list:
            if isinstance(r, list):
                results.extend(r)
        return results

    async def _fetch_price(self, client: "httpx.AsyncClient", ids: list[str]) -> list[ScraperResult]:
        try:
            ids_str = ",".join(ids)
            r = await client.get(
                f"{_BASE}/simple/price",
                params={
                    "ids": ids_str,
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                    "include_market_cap": "true",
                    "include_24hr_vol": "true",
                },
            )
            if r.status_code != 200:
                return []
            data: dict[str, Any] = r.json()
            results: list[ScraperResult] = []
            for coin_id, vals in data.items():
                if not isinstance(vals, dict):
                    continue
                price = self._safe_float(vals.get("usd"))
                change_24h = self._safe_float(vals.get("usd_24h_change"))
                mcap = self._safe_float(vals.get("usd_market_cap"))
                text = (
                    f"{coin_id.upper()} price: ${price:,.4f} "
                    f"(24h: {change_24h:+.2f}%)"
                )
                if mcap > 0:
                    text += f", Market Cap: ${mcap:,.0f}"
                results.append(ScraperResult(
                    source="coingecko",
                    category="price",
                    text=text,
                    data={"id": coin_id, "price_usd": price, "change_24h": change_24h, "mcap_usd": mcap},
                    url=f"https://www.coingecko.com/en/coins/{coin_id}",
                ))
            return results
        except Exception:
            return []

    async def _fetch_global(self, client: "httpx.AsyncClient") -> list[ScraperResult]:
        try:
            r = await client.get(f"{_BASE}/global")
            if r.status_code != 200:
                return []
            g = r.json().get("data", {})
            total_mcap = self._safe_float(g.get("total_market_cap", {}).get("usd"))
            btc_dom = self._safe_float(g.get("market_cap_percentage", {}).get("btc"))
            eth_dom = self._safe_float(g.get("market_cap_percentage", {}).get("eth"))
            text = (
                f"Global crypto market cap: ${total_mcap / 1e12:.2f}T. "
                f"BTC dominance: {btc_dom:.1f}%, ETH dominance: {eth_dom:.1f}%"
            )
            return [ScraperResult(source="coingecko", category="market", text=text, data=g)]
        except Exception:
            return []
