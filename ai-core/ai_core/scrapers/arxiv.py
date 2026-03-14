"""
arXiv scraper — latest quantitative finance and DeFi research papers.
Uses arXiv public API (no key required).
"""
from __future__ import annotations

import re
from typing import Any

try:
    import httpx
    _HTTPX = True
except ImportError:
    _HTTPX = False

from .base import BaseScraper, ScraperResult

_BASE = "https://export.arxiv.org/api/query"

# arXiv categories relevant to our domain
_CATEGORIES = {
    "defi": "q-fin.TR+q-fin.PM+cs.CE",
    "quant": "q-fin.PM+q-fin.RM+q-fin.PR",
    "crypto": "cs.CE+q-fin.TR",
    "default": "q-fin.TR+q-fin.PM",
}


class ArxivScraper(BaseScraper):
    name = "arxiv"
    refresh_interval = 3600  # research papers refresh hourly

    async def fetch(self, query: str, max_results: int = 3, **kwargs) -> list[ScraperResult]:
        if not _HTTPX:
            return []
        q_lower = query.lower()

        # Determine which categories to search
        if any(t in q_lower for t in ("defi", "amm", "dex", "impermanent", "mev", "blockchain")):
            cat = _CATEGORIES["defi"]
        elif any(t in q_lower for t in ("crypto", "bitcoin", "ethereum", "token")):
            cat = _CATEGORIES["crypto"]
        else:
            cat = _CATEGORIES["quant"]

        # Build search query — strip common stop words
        stop = {"what", "is", "the", "how", "to", "explain", "me", "a", "an", "about", "in", "of"}
        keywords = [w for w in re.findall(r"\b\w{3,}\b", q_lower) if w not in stop][:5]
        search_terms = " AND ".join(f'all:{kw}' for kw in keywords) if keywords else f"cat:{cat}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(
                    _BASE,
                    params={
                        "search_query": search_terms,
                        "start": 0,
                        "max_results": max_results,
                        "sortBy": "submittedDate",
                        "sortOrder": "descending",
                    },
                )
            if r.status_code != 200:
                return []
            return self._parse_atom(r.text)
        except Exception:
            return []

    @staticmethod
    def _parse_atom(xml: str) -> list[ScraperResult]:
        results: list[ScraperResult] = []
        entries = re.findall(r"<entry>(.*?)</entry>", xml, re.DOTALL)
        for entry in entries:
            title_m = re.search(r"<title>(.*?)</title>", entry, re.DOTALL)
            summary_m = re.search(r"<summary>(.*?)</summary>", entry, re.DOTALL)
            id_m = re.search(r"<id>(.*?)</id>", entry)
            author_m = re.findall(r"<name>(.*?)</name>", entry)
            published_m = re.search(r"<published>(.*?)</published>", entry)

            if not title_m:
                continue
            title = re.sub(r"\s+", " ", title_m.group(1)).strip()
            summary = re.sub(r"\s+", " ", summary_m.group(1) if summary_m else "").strip()[:300]
            arxiv_id = (id_m.group(1) if id_m else "").strip()
            authors = ", ".join(author_m[:3])
            published = (published_m.group(1) if published_m else "")[:10]
            text = f'"{title}" — {authors} ({published}). {summary}...'
            results.append(ScraperResult(
                source="arxiv",
                category="research",
                text=text,
                data={"title": title, "authors": authors, "published": published, "summary": summary},
                url=arxiv_id,
            ))
        return results
