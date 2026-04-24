"""
Curator Agent logic: Ingests external sources (arXiv, URLs, PDFs) into the Knowledge Graph.
Aligned with ERC-8004: Ingestion actions contribute to the agent's reputation.
"""
from __future__ import annotations

import logging
import httpx
import tempfile
import os
from pathlib import Path
from typing import Optional

from ai_core.neo4j_schema import get_driver
from ai_core.scrapers.arxiv import ArxivScraper
from ai_core.scrapers.web import WebScraper
from ai_core.pdf_ingest import generate_cypher_for_pdf
from ai_core.circle_nanopayments import agent_wallet_manager

logger = logging.getLogger(__name__)

class CuratorAgent:
    def __init__(self):
        self.arxiv_scraper = ArxivScraper()
        self.web_scraper = WebScraper()
        self.driver = get_driver()
        self.role = "curator"

    async def ingest_from_arxiv(self, query: str, agent_did: str = "did:arc:agent_research_specialist") -> dict:
        """Search arXiv and ingest metadata."""
        # 1. Simulate M2M payment from Manager to Curator
        await agent_wallet_manager.transfer_usdc("manager", "curator", 0.005)
        
        results = await self.arxiv_scraper.fetch(query, max_results=1)
        if not results:
            return {"status": "error", "message": "No results found on arXiv"}

        paper = results[0]
        data = paper.data
        source_id = paper.url.split('/')[-1]

        # Note: In a full implementation, we'd also download the PDF from arXiv here.
        return self._save_metadata_to_graph(
            source_id=source_id,
            title=data['title'],
            authors=data['authors'],
            published=data['published'],
            summary=data['summary'],
            url=paper.url,
            source_type='research_paper',
            agent_did=agent_did
        )

    async def ingest_from_url(self, url: str, agent_did: str = "did:arc:agent_research_specialist") -> dict:
        """
        Ingest content from a URL. Prioritizes PDF processing.
        """
        results = await self.web_scraper.fetch(url)
        if not results:
            return {"status": "error", "message": f"Could not fetch content from {url}"}

        res = results[0]
        
        if res.category == "pdf" or url.lower().endswith(".pdf"):
            return await self._ingest_pdf_from_url(url, agent_did)
        else:
            # General webpage ingestion
            data = res.data
            source_id = url.replace("https://", "").replace("http://", "").replace("/", "_")
            return self._save_metadata_to_graph(
                source_id=source_id,
                title=data.get('title', 'Webpage'),
                authors='Unknown',
                published='N/A',
                summary=res.text, # snippet
                url=url,
                source_type='webpage',
                agent_did=agent_did
            )

    async def _ingest_pdf_from_url(self, url: str, agent_did: str) -> dict:
        """Download and deep-parse a PDF."""
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return {"status": "error", "message": f"Failed to download PDF: {resp.status_code}"}
            
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(resp.content)
                tmp_path = Path(tmp.name)

            # Extract formulas and concepts using pdf_ingest logic
            cypher_statements = []
            generate_cypher_for_pdf(tmp_path, cypher_statements)
            
            # Clean up temp file
            os.unlink(tmp_path)

            # Execute the generated Cypher
            with self.driver.session() as session:
                for stmt in cypher_statements:
                    session.run(stmt)

            # Metadata is already handled by generate_cypher_for_pdf (as MERGE (s:KnowledgeSource))
            # We just need to link it to the agent and update reputation
            source_id = tmp_path.stem.lower().replace(" ", "_") # Match logic in pdf_ingest
            self._link_agent_and_update_reputation(agent_did, source_id)

            return {
                "status": "success",
                "message": "Deep PDF ingestion complete",
                "source_id": source_id,
                "url": url,
                "agent": agent_did
            }

        except Exception as e:
            logger.exception("PDF Ingestion failed")
            return {"status": "error", "message": str(e)}

    def _save_metadata_to_graph(self, source_id, title, authors, published, summary, url, source_type, agent_did):
        with self.driver.session() as session:
            session.run("""
                MERGE (k:KnowledgeSource {id: $id})
                SET k.title = $title, 
                    k.authors = $authors, 
                    k.published = $published,
                    k.summary = $summary,
                    k.url = $url,
                    k.type = $type,
                    k.domain = 'quant_finance',
                    k.updatedAt = datetime()
            """, id=source_id, title=title, authors=authors, 
                 published=published, summary=summary, url=url, type=source_type)

            self._link_agent_and_update_reputation(agent_did, source_id)

        return {
            "status": "success", 
            "source_id": source_id, 
            "title": title,
            "agent": agent_did
        }

    def _link_agent_and_update_reputation(self, agent_did, source_id):
        with self.driver.session() as session:
            # 1. Link to Curator Agent via CITES
            session.run("""
                MATCH (a:Agent {did: $agent_did})
                MATCH (k:KnowledgeSource {id: $id})
                MERGE (a)-[:CITES]->(k)
                SET a.citations = a.citations + 1
            """, agent_did=agent_did, id=source_id)

            # 2. Trigger reputation re-calculation
            session.run("""
                MATCH (a:Agent {did: $agent_did})
                WITH a
                SET a.reputation_score = 
                    (0.4 * a.signal_accuracy) + 
                    (0.3 * log(a.citations + 1) / 12.0) + 
                    (0.3 * a.uptime_ratio)
            """, agent_did=agent_did)

curator_agent = CuratorAgent()
