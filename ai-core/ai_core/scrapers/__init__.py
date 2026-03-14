"""Web enrichment scrapers for GraphRAG live data tier."""
from .base import BaseScraper, ScraperResult
from .defillama import DeFiLlamaScraper
from .coingecko import CoinGeckoScraper
from .arxiv import ArxivScraper
from .scheduler import ScraperScheduler, get_scheduler

__all__ = [
    "BaseScraper",
    "ScraperResult",
    "DeFiLlamaScraper",
    "CoinGeckoScraper",
    "ArxivScraper",
    "ScraperScheduler",
    "get_scheduler",
]
