"""Base scraper interface for all live web enrichment sources."""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class ScraperResult:
    """Single enrichment snippet from a live source."""
    source: str              # e.g. "defillama", "coingecko", "arxiv"
    category: str            # e.g. "tvl", "price", "research"
    text: str                # Human-readable snippet for LLM injection
    data: dict[str, Any] = field(default_factory=dict)   # Raw structured data
    url: Optional[str] = None
    fetched_at: float = field(default_factory=time.time)

    def to_prompt_line(self) -> str:
        return f"[{self.source.upper()}] {self.text}"


class BaseScraper(ABC):
    """Abstract base for all live data scrapers."""

    name: str = "base"
    # How often (seconds) this source should be refreshed
    refresh_interval: int = 300

    @abstractmethod
    async def fetch(self, query: str, **kwargs) -> list[ScraperResult]:
        """Fetch live data relevant to `query`. Returns list of ScraperResult."""
        ...

    @staticmethod
    def _safe_float(val: Any, default: float = 0.0) -> float:
        try:
            return float(val)
        except (TypeError, ValueError):
            return default
