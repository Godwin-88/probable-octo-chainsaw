"""
General Web Scraper for academic and technical content.
Focuses on extracting text and identifying PDF links for deep ingestion.
"""
from __future__ import annotations

import re
import logging
from typing import List, Optional
from .base import BaseScraper, ScraperResult

try:
    import httpx
    _HAS_HTTPX = True
except ImportError:
    _HAS_HTTPX = False

logger = logging.getLogger(__name__)

class WebScraper(BaseScraper):
    name = "web_general"
    refresh_interval = 86400  # Webpages change less frequently than prices

    async def fetch(self, url: str, **kwargs) -> List[ScraperResult]:
        """
        Fetch content from a URL. 
        If it's a PDF, returns metadata for ingestion.
        If it's HTML, extracts text and potential PDF links.
        """
        if not _HAS_HTTPX:
            return []

        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
                response = await client.get(url)
                
            if response.status_code != 200:
                return []

            content_type = response.headers.get("content-type", "").lower()
            
            if "application/pdf" in content_type or url.lower().endswith(".pdf"):
                return [ScraperResult(
                    source="web",
                    category="pdf",
                    text=f"PDF document found at {url}",
                    url=url,
                    data={"is_pdf": True, "size": len(response.content)}
                )]

            # Basic HTML extraction (prioritizing title and main text)
            html = response.text
            title = self._extract_tag(html, "title") or "Webpage Content"
            
            # Simple heuristic for main content (strip scripts, styles, etc.)
            clean_text = re.sub(r'<(script|style|nav|footer|header).*?>.*?</\1>', '', html, flags=re.DOTALL | re.IGNORECASE)
            clean_text = re.sub(r'<.*?>', ' ', clean_text)
            clean_text = re.sub(r'\s+', ' ', clean_text).strip()
            
            # Identify PDF links
            pdf_links = re.findall(r'href=["\'](.*?\.pdf)["\']', html, re.IGNORECASE)
            
            return [ScraperResult(
                source="web",
                category="webpage",
                text=clean_text[:1000], # Snippet
                url=url,
                data={
                    "title": title,
                    "pdf_links": pdf_links,
                    "full_text": clean_text
                }
            )]

        except Exception as e:
            logger.error(f"WebScraper failed for {url}: {e}")
            return []

    def _extract_tag(self, html: str, tag: str) -> Optional[str]:
        m = re.search(f'<{tag}.*?>(.*?)</{tag}>', html, re.DOTALL | re.IGNORECASE)
        return m.group(1).strip() if m else None
