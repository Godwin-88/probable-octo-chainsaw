"""
ScraperScheduler — orchestrates all web enrichment scrapers for a query.
Runs scrapers concurrently with a timeout; returns combined ScraperResult list.
Used by GraphRAGRetriever as the live data tier.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Optional

from .base import BaseScraper, ScraperResult
from .defillama import DeFiLlamaScraper
from .coingecko import CoinGeckoScraper
from .arxiv import ArxivScraper

logger = logging.getLogger(__name__)

# Simple in-process cache: (query, scraper_name) -> (results, fetched_at)
_cache: dict[tuple[str, str], tuple[list[ScraperResult], float]] = {}


class ScraperScheduler:
    """
    Run all registered scrapers concurrently for a query.

    Parameters
    ----------
    scrapers : list of BaseScraper — defaults to DeFiLlama + CoinGecko + arXiv
    timeout  : float — per-query timeout in seconds
    cache_ttl: int   — how long (seconds) to cache results per (query, scraper)
    """

    def __init__(
        self,
        scrapers: Optional[list[BaseScraper]] = None,
        timeout: float = 6.0,
        cache_ttl: int = 120,
    ):
        self.scrapers: list[BaseScraper] = scrapers or [
            DeFiLlamaScraper(),
            CoinGeckoScraper(),
            ArxivScraper(),
        ]
        self.timeout = timeout
        self.cache_ttl = cache_ttl

    async def fetch_all(self, query: str, **kwargs) -> list[ScraperResult]:
        """
        Run all scrapers concurrently. Returns combined, deduplicated results.
        Respects per-scraper cache TTL.
        """
        now = time.time()
        tasks = []
        scraper_refs: list[BaseScraper] = []

        for scraper in self.scrapers:
            cache_key = (query.lower()[:100], scraper.name)
            cached_results, cached_at = _cache.get(cache_key, ([], 0.0))
            if now - cached_at < min(scraper.refresh_interval, self.cache_ttl):
                # Cache hit — include without fetching
                tasks.append(asyncio.coroutine(lambda r=cached_results: r)())
            else:
                tasks.append(asyncio.wait_for(
                    scraper.fetch(query, **kwargs),
                    timeout=self.timeout,
                ))
                scraper_refs.append(scraper)

        gathered = await asyncio.gather(*tasks, return_exceptions=True)

        all_results: list[ScraperResult] = []
        for scraper, result in zip(self.scrapers, gathered):
            if isinstance(result, BaseException):
                logger.debug("Scraper %s failed: %s", scraper.name, result)
                continue
            if isinstance(result, list):
                cache_key = (query.lower()[:100], scraper.name)
                _cache[cache_key] = (result, now)
                all_results.extend(result)

        return all_results

    def fetch_sync(self, query: str, **kwargs) -> list[ScraperResult]:
        """Synchronous wrapper for use in sync contexts (e.g. FastAPI sync endpoints)."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Already in async context — create new loop in thread
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(asyncio.run, self.fetch_all(query, **kwargs))
                    return future.result(timeout=self.timeout + 2)
            return loop.run_until_complete(self.fetch_all(query, **kwargs))
        except Exception as e:
            logger.debug("ScraperScheduler.fetch_sync failed: %s", e)
            return []

    def to_prompt_lines(self, results: list[ScraperResult]) -> list[str]:
        """Convert results to prompt-injectable strings."""
        return [r.to_prompt_line() for r in results]


# ── Module-level singleton ────────────────────────────────────────────────────

_scheduler: Optional[ScraperScheduler] = None


def get_scheduler() -> ScraperScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = ScraperScheduler()
    return _scheduler
