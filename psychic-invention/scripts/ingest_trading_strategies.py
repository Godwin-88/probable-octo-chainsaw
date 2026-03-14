#!/usr/bin/env python3
"""
scripts/ingest_trading_strategies.py
─────────────────────────────────────
Extract trading strategy knowledge from the AlgorithmicTradingStrategies PDFs
and persist to Neo4j as TradingStrategy nodes.

Pipeline
────────
1. Extract text chunks from each PDF (pypdf)
2. For each chunk ask Groq/Ollama to extract structured TradingStrategy entities
3. Deduplicate by name (MERGE — safe to re-run)
4. Write to Neo4j; link to Menu + KnowledgeSource nodes

Usage
─────
    cd <project-root>
    source venv/Scripts/activate          # Windows
    pip install pypdf                     # if not installed
    python scripts/ingest_trading_strategies.py

Flags
─────
    --dry-run        Print extracted strategies; do not write to Neo4j
    --limit N        Process only first N chunks per PDF (default: all)
    --file FILENAME  Process only one specific PDF file (base name)
    --chunk-size N   Characters per chunk sent to LLM (default: 3500)

The script is idempotent (MERGE by name) — safe to run multiple times.
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = PROJECT_ROOT / "AlgorithmicTradingStrategies"
PROGRESS_FILE = PROJECT_ROOT / "scripts" / ".ingest_progress.json"

CHUNK_SIZE = 3500          # characters per LLM call
CHUNK_OVERLAP = 200        # character overlap between chunks
MAX_STRATEGIES_PER_CHUNK = 3
LLM_RETRY_DELAY = 2        # seconds between retries on rate limit
LLM_MAX_RETRIES = 3

# Menu id mapping (keyword → menu_ids list)
KEYWORD_TO_MENUS: list[tuple[list[str], list[str]]] = [
    (["option", "call", "put", "derivative", "greek", "delta", "gamma", "theta", "vega", "black-scholes", "heston", "pricer", "barrier", "straddle", "condor"], ["pricer"]),
    (["portfolio", "weight", "allocation", "diversi", "capm", "beta", "return", "sharpe", "sortino", "attribution"], ["portfolio"]),
    (["var", "value at risk", "expected shortfall", "cvar", "covariance", "drawdown", "tail risk", "stress", "basel"], ["risk"]),
    (["optimizer", "optimiz", "mean-variance", "mvo", "black-litterman", "hrp", "risk parity", "kelly", "efficient frontier"], ["optimizer"]),
    (["volatility", "implied vol", "heston", "vol surface", "vrp", "vix", "vol smile", "realized vol", "vol cluster"], ["volatility"]),
    (["factor", "alpha", "fama", "macbeth", "momentum", "value factor", "quality", "low vol", "smart beta", "crowding", "ic ", "information coefficient"], ["factor"]),
    (["scenario", "stress test", "crisis", "gfc", "covid", "monte carlo", "behavioral", "prospect theory", "drawdown scenario"], ["scenarios"]),
    (["blotter", "trade", "execution", "position", "pnl", "p&l", "attribution", "slippage", "fill", "order"], ["blotter"]),
]


def keyword_to_menus(text: str) -> list[str]:
    """Map free-form text to relevant menu ids."""
    t = text.lower()
    menus: set[str] = set()
    for keywords, mids in KEYWORD_TO_MENUS:
        if any(kw in t for kw in keywords):
            menus.update(mids)
    # Default to general menus if nothing matched
    if not menus:
        menus = {"portfolio", "blotter"}
    return sorted(menus)


# ── Load environment ──────────────────────────────────────────────────────────

def load_env() -> None:
    try:
        from dotenv import load_dotenv
        load_dotenv(PROJECT_ROOT / ".env")
    except ImportError:
        pass


# ── PDF text extraction ───────────────────────────────────────────────────────

def extract_pdf_chunks(pdf_path: Path, chunk_size: int = CHUNK_SIZE) -> list[dict]:
    """
    Extract text from a PDF and split into overlapping chunks.
    Returns list of {text, page_start, page_end, file_name}.
    """
    try:
        import pypdf
    except ImportError:
        print("ERROR: pypdf not installed. Run: pip install pypdf")
        sys.exit(1)

    chunks = []
    full_text = []
    page_map: list[tuple[int, int]] = []  # (char_start, page_num)

    try:
        reader = pypdf.PdfReader(str(pdf_path))
        pos = 0
        for page_num, page in enumerate(reader.pages, 1):
            try:
                text = page.extract_text() or ""
                # Clean up: remove excessive whitespace
                text = re.sub(r'\s{3,}', ' ', text).strip()
                if text:
                    page_map.append((pos, page_num))
                    full_text.append(text)
                    pos += len(text) + 1
            except Exception:
                continue
    except Exception as e:
        print(f"  ⚠ Could not read {pdf_path.name}: {e}")
        return []

    combined = "\n".join(full_text)
    if not combined.strip():
        return []

    # Split into overlapping chunks
    start = 0
    while start < len(combined):
        end = min(start + chunk_size, len(combined))
        chunk_text = combined[start:end]

        # Find page numbers that cover this chunk
        pages_in_chunk = [
            page_num for char_start, page_num in page_map
            if start <= char_start < end
        ]
        page_start = pages_in_chunk[0] if pages_in_chunk else 1
        page_end = pages_in_chunk[-1] if pages_in_chunk else 1

        chunks.append({
            "text": chunk_text,
            "page_start": page_start,
            "page_end": page_end,
            "file_name": pdf_path.name,
        })
        start = end - CHUNK_OVERLAP
        if start >= len(combined):
            break

    return chunks


# ── LLM client ───────────────────────────────────────────────────────────────

def get_llm():
    """Get the configured LLM client (Groq or Ollama)."""
    load_env()
    # Add project root to path so we can import app modules
    sys.path.insert(0, str(PROJECT_ROOT))
    from app.agents.llm_client import get_llm_client
    return get_llm_client()


EXTRACTION_SYSTEM = (
    "You are a financial engineer and quantitative analyst extracting trading strategies "
    "from textbook content. Extract only concrete, actionable strategies with clear rules. "
    "Return valid JSON only — no explanation, no markdown fences."
)

EXTRACTION_PROMPT = """Extract all concrete TRADING STRATEGIES from this text. For each strategy found, produce a JSON object.

Text:
{text}

Return a JSON array. Each item MUST have these exact keys:
{{
  "name": "Unique descriptive strategy name",
  "category": "one of: momentum | mean_reversion | trend_following | options_hedging | options_income | options_volatility | volatility_trading | factor | portfolio_construction | risk_management | technical_analysis | algorithmic | mathematical_finance | growth_investing | trading_psychology | structured_product | hybrid_analysis",
  "description": "2-4 sentence explanation of what the strategy does and when it works",
  "entry_signal": "Specific entry rule with numbers/formulas where possible",
  "exit_signal": "Specific exit rule or stop-loss",
  "risk_management": "Risk control rule (position sizing, stop, max drawdown)",
  "timeframe": "e.g. Daily | Weekly | Intraday | Monthly",
  "asset_class": "e.g. Equities | Options | FX | Futures | Multi-asset",
  "keywords": ["list", "of", "relevant", "keywords"]
}}

Rules:
- Only include strategies with clear entry AND exit rules
- If fewer than 2 concrete strategies are present, return []
- Maximum {max_strategies} strategies per response
- Return [] if the text is introductory/definitional with no actionable strategy
- Output ONLY the JSON array, nothing else"""


def extract_strategies_from_chunk(llm, chunk: dict, max_strategies: int = MAX_STRATEGIES_PER_CHUNK) -> list[dict]:
    """Ask the LLM to extract strategies from one text chunk."""
    prompt = EXTRACTION_PROMPT.format(
        text=chunk["text"][:3000],  # safety cap
        max_strategies=max_strategies,
    )
    for attempt in range(LLM_MAX_RETRIES):
        try:
            raw = llm.generate(prompt, system=EXTRACTION_SYSTEM, temperature=0.1)
            # Extract JSON array from response
            match = re.search(r'\[[\s\S]*\]', raw)
            if not match:
                return []
            items = json.loads(match.group())
            if not isinstance(items, list):
                return []
            # Validate and enrich each item
            valid = []
            for item in items:
                if not isinstance(item, dict):
                    continue
                name = str(item.get("name", "")).strip()
                description = str(item.get("description", "")).strip()
                if not name or not description or len(description) < 30:
                    continue
                # Enrich with source info
                item["name"] = name
                item["book_source"] = chunk.get("book_source", "Unknown")
                item["book_author"] = chunk.get("book_author", "Unknown")
                item["file_name"] = chunk.get("file_name", "")
                item["page_refs"] = f"pp.{chunk.get('page_start', '?')}-{chunk.get('page_end', '?')}"
                item["keywords"] = item.get("keywords") or []
                # Infer menu_ids from description + keywords
                combined = f"{description} {' '.join(item['keywords'])}"
                item["menu_ids"] = keyword_to_menus(combined)
                valid.append(item)
            return valid
        except (json.JSONDecodeError, ValueError):
            pass
        except Exception as e:
            err = str(e).lower()
            if "rate" in err or "429" in err:
                time.sleep(LLM_RETRY_DELAY * (attempt + 1))
            else:
                break
    return []


# ── Neo4j writing ─────────────────────────────────────────────────────────────

MENU_NAME_MAP = {
    "pricer": "Pricer",
    "portfolio": "Portfolio",
    "risk": "Risk",
    "optimizer": "Optimizer",
    "volatility": "Volatility Lab",
    "factor": "Factor Lab",
    "scenarios": "Scenarios",
    "blotter": "Blotter",
}

UPSERT_STRATEGY_Q = """
MERGE (s:TradingStrategy {name: $name})
SET s.category      = $category,
    s.description   = $description,
    s.entry_signal  = $entry_signal,
    s.exit_signal   = $exit_signal,
    s.risk_management = $risk_management,
    s.timeframe     = $timeframe,
    s.asset_class   = $asset_class,
    s.book_source   = $book_source,
    s.book_author   = $book_author,
    s.file_name     = $file_name,
    s.page_refs     = $page_refs,
    s.keywords      = $keywords,
    s.menu_ids      = $menu_ids,
    s.auto_extracted = true
RETURN s.name AS name
"""

LINK_MENU_Q = """
MATCH (s:TradingStrategy {name: $name})
MATCH (m:Menu {name: $menu_name})
MERGE (s)-[:APPLICABLE_TO]->(m)
"""

LINK_SOURCE_Q = """
MATCH (s:TradingStrategy {name: $name})
MERGE (ks:KnowledgeSource {title: $book_source})
  ON CREATE SET ks.author = $book_author, ks.file_name = $file_name
MERGE (s)-[:SOURCED_FROM]->(ks)
"""


def write_strategy_to_neo4j(kb, strategy: dict) -> bool:
    """Upsert a single TradingStrategy node and link to Menus + KnowledgeSource."""
    try:
        kb._run(
            UPSERT_STRATEGY_Q,
            name=strategy["name"],
            category=strategy.get("category", ""),
            description=strategy.get("description", "")[:2000],
            entry_signal=strategy.get("entry_signal", "")[:1000],
            exit_signal=strategy.get("exit_signal", "")[:1000],
            risk_management=strategy.get("risk_management", "")[:1000],
            timeframe=strategy.get("timeframe", ""),
            asset_class=strategy.get("asset_class", ""),
            book_source=strategy.get("book_source", ""),
            book_author=strategy.get("book_author", ""),
            file_name=strategy.get("file_name", ""),
            page_refs=strategy.get("page_refs", ""),
            keywords=strategy.get("keywords", []),
            menu_ids=strategy.get("menu_ids", []),
        )
        # Link to menus
        for mid in strategy.get("menu_ids", []):
            menu_name = MENU_NAME_MAP.get(mid)
            if menu_name:
                try:
                    kb._run(LINK_MENU_Q, name=strategy["name"], menu_name=menu_name)
                except Exception:
                    pass
        # Link to source
        try:
            kb._run(
                LINK_SOURCE_Q,
                name=strategy["name"],
                book_source=strategy.get("book_source", ""),
                book_author=strategy.get("book_author", ""),
                file_name=strategy.get("file_name", ""),
            )
        except Exception:
            pass
        return True
    except Exception as e:
        print(f"    ⚠ Neo4j write failed for '{strategy['name']}': {e}")
        return False


# ── Progress tracking ─────────────────────────────────────────────────────────

def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        try:
            return json.loads(PROGRESS_FILE.read_text())
        except Exception:
            pass
    return {}


def save_progress(progress: dict) -> None:
    PROGRESS_FILE.parent.mkdir(exist_ok=True)
    PROGRESS_FILE.write_text(json.dumps(progress, indent=2))


# ── Book metadata ─────────────────────────────────────────────────────────────

BOOK_METADATA: dict[str, dict] = {
    "(Wiley trading series) Ernest P Chan": {
        "title": "Quantitative Trading",
        "author": "Ernest P. Chan",
    },
    "Igor Tulchinsky et al. - Finding Alphas": {
        "title": "Finding Alphas",
        "author": "Igor Tulchinsky",
    },
    "Options Futures and Other Derivatives by John C Hull": {
        "title": "Options, Futures and Other Derivatives",
        "author": "John C. Hull",
    },
    "Successful Algorithmic Trading": {
        "title": "Successful Algorithmic Trading",
        "author": "AAT",
    },
    "aat-ebook": {
        "title": "Successful Algorithmic Trading",
        "author": "AAT",
    },
    "Martin Baxter, Andrew Rennie - Financial Calculus": {
        "title": "Financial Calculus",
        "author": "Martin Baxter and Andrew Rennie",
    },
    "Steve-Nison-Japanese-Candlestick": {
        "title": "Japanese Candlestick Charting Techniques",
        "author": "Steve Nison",
    },
    "How+To+Make+Money+In+Stocks": {
        "title": "How To Make Money In Stocks",
        "author": "William J. O'Neil",
    },
    "Financial Mathematics, Derivatives and Structured Products": {
        "title": "Financial Mathematics, Derivatives and Structured Products",
        "author": "Springer Finance",
    },
    "Actuarial Sciences": {
        "title": "Actuarial Sciences and Quantitative Finance",
        "author": "Londoño, Garrido, Jeanblanc",
    },
    "Fundamental analysis": {
        "title": "Fundamental and Technical Analysis Integrated System",
        "author": "Unknown",
    },
    "The-Disciplined-Trader": {
        "title": "The Disciplined Trader",
        "author": "Mark Douglas",
    },
    "Trading In the Zone": {
        "title": "Trading In the Zone",
        "author": "Mark Douglas",
    },
    "Valuation and Volatility": {
        "title": "Valuation and Volatility",
        "author": "Springer",
    },
}


def get_book_meta(file_name: str) -> dict:
    """Look up book metadata from partial filename match."""
    for key, meta in BOOK_METADATA.items():
        if key.lower() in file_name.lower():
            return meta
    return {"title": file_name.replace(".pdf", ""), "author": "Unknown"}


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest trading strategies from PDFs into Neo4j")
    parser.add_argument("--dry-run", action="store_true", help="Print extracted strategies; do not write to Neo4j")
    parser.add_argument("--limit", type=int, default=0, help="Max chunks per PDF (0 = all)")
    parser.add_argument("--file", type=str, default="", help="Process only this PDF file (base name)")
    parser.add_argument("--chunk-size", type=int, default=CHUNK_SIZE, help="Characters per LLM chunk")
    parser.add_argument("--reset-progress", action="store_true", help="Clear progress tracker and restart")
    args = parser.parse_args()

    load_env()

    # Connect to Neo4j
    kb = None
    if not args.dry_run:
        try:
            sys.path.insert(0, str(PROJECT_ROOT))
            from app.knowledge_base.neo4j_client import Neo4jKnowledgeClient, get_neo4j_driver
            driver = get_neo4j_driver()
            kb = Neo4jKnowledgeClient(driver)
            if not kb.health_check():
                print("ERROR: Neo4j is not reachable. Use --dry-run or start Neo4j.")
                sys.exit(1)
            print("✓ Connected to Neo4j")
        except Exception as e:
            print(f"ERROR: Cannot connect to Neo4j: {e}")
            sys.exit(1)

    # Get LLM
    try:
        llm = get_llm()
        print("✓ LLM client ready")
    except Exception as e:
        print(f"ERROR: Cannot initialise LLM: {e}")
        sys.exit(1)

    # Load progress
    if args.reset_progress and PROGRESS_FILE.exists():
        PROGRESS_FILE.unlink()
        print("✓ Progress reset")
    progress = load_progress()

    # Discover PDFs
    if not PDF_DIR.exists():
        print(f"ERROR: PDF directory not found: {PDF_DIR}")
        sys.exit(1)

    pdfs = sorted(PDF_DIR.glob("*.pdf")) + sorted(PDF_DIR.glob("*.PDF"))
    if args.file:
        pdfs = [p for p in pdfs if args.file.lower() in p.name.lower()]
        if not pdfs:
            print(f"ERROR: No PDF matching '{args.file}' found in {PDF_DIR}")
            sys.exit(1)

    print(f"\n{'DRY RUN — ' if args.dry_run else ''}Processing {len(pdfs)} PDFs from {PDF_DIR}\n")

    total_strategies = 0
    total_written = 0

    for pdf_path in pdfs:
        print(f"📖 {pdf_path.name}")
        meta = get_book_meta(pdf_path.name)
        print(f"   Book: {meta['title']} by {meta['author']}")

        # Skip fully processed files (unless reset)
        if progress.get(pdf_path.name) == "done":
            print("   ↳ Already processed — skipping (use --reset-progress to redo)\n")
            continue

        # Extract chunks
        chunks = extract_pdf_chunks(pdf_path, args.chunk_size)
        if not chunks:
            print("   ↳ No text extracted (possibly scanned PDF)\n")
            progress[pdf_path.name] = "done"
            save_progress(progress)
            continue

        print(f"   ↳ {len(chunks)} chunks extracted")

        # Apply chunk limit
        process_chunks = chunks[:args.limit] if args.limit > 0 else chunks

        file_strategies = 0
        file_written = 0

        for i, chunk in enumerate(process_chunks):
            chunk["book_source"] = meta["title"]
            chunk["book_author"] = meta["author"]

            strategies = extract_strategies_from_chunk(llm, chunk)
            if not strategies:
                continue

            file_strategies += len(strategies)

            for strat in strategies:
                if args.dry_run:
                    print(f"\n   [{strat['category']}] {strat['name']}")
                    print(f"   Source: {strat['book_source']} p.{strat['page_refs']}")
                    print(f"   Menus: {strat['menu_ids']}")
                    print(f"   Entry: {strat.get('entry_signal', '')[:120]}")
                    print(f"   Risk:  {strat.get('risk_management', '')[:120]}")
                else:
                    if write_strategy_to_neo4j(kb, strat):
                        file_written += 1
                        print(f"   ✓ [{strat['category']}] {strat['name']}")

            # Brief pause to respect rate limits
            time.sleep(0.5)

        total_strategies += file_strategies
        total_written += file_written
        progress[pdf_path.name] = "done"
        save_progress(progress)

        if args.dry_run:
            print(f"\n   → Found {file_strategies} strategies\n")
        else:
            print(f"   → Found {file_strategies}, wrote {file_written} to Neo4j\n")

    print("─" * 60)
    if args.dry_run:
        print(f"DRY RUN complete: {total_strategies} strategies extracted across {len(pdfs)} PDFs")
        print("Run without --dry-run to write to Neo4j.")
    else:
        print(f"Ingestion complete: {total_written} strategies written to Neo4j")
        print(f"Run in Neo4j Browser to verify:")
        print("  MATCH (s:TradingStrategy)-[:APPLICABLE_TO]->(m:Menu)")
        print("  RETURN m.name, count(s) AS strategies ORDER BY m.name;")


if __name__ == "__main__":
    main()
