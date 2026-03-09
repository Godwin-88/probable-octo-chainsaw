"""
PDF → Knowledge Graph ingestion pipeline for quant / algorithmic trading books.

Goals (aligned with your instructions):
- Start from the TABLE OF CONTENTS to understand the logical state (sections / hierarchy).
- Use that context to extract:
  - Quantitative CONCEPTS (e.g. Bayesian inference, stochastic volatility, Kelly criterion).
  - FORMULAS and their informal MEANING (nearby explanatory text).
- Emit Cypher suitable for ingestion into the Neo4j logical layer / knowledge graph.

This module is intentionally conservative and deterministic: it does not use LLMs at runtime,
only structured PDF parsing + regex heuristics. You can run it offline and review the generated
Cypher before loading it into Neo4j.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Tuple

import re

# Use pymupdf (not "fitz") to avoid conflict with unrelated PyPI package named fitz
import pymupdf


@dataclass
class Section:
    source_id: str
    id: str
    title: str
    level: int
    page_start: int
    page_end: int


FORMULA_LINE_RE = re.compile(
    r"""
    (?:^|\s)          # start or whitespace
    [A-Za-zμσΣβγρλϵα] # typical math variable
    [\w\s]*           # optional stuff
    =                 # equality
    [^=]{2,}          # something non-trivial on RHS
    """,
    re.VERBOSE,
)


def cypher_escape(value: str) -> str:
    """Escape a Python string for single-quoted Cypher."""
    return value.replace("\\", "\\\\").replace("'", "\\'")


def extract_toc_from_text_lines(
    source_id: str, lines: List[str], max_pages: int = 5
) -> List[Section]:
    """
    Heuristic TOC extraction from text lines of the first ~pages of a PDF.

    We handle patterns like:
    - 'I Introduction 1'
    - '1 Introduction To Advanced Algorithmic Trading . . . . . . . 3'
    - '1.2.3 Subsection Title . . . . . . . . 17'
    """
    sections: List[Section] = []
    # Rough guess of lines per page for page_start; refine via fitz TOC when available.
    lines_per_page = max(1, len(lines) // max_pages)

    toc_entry_re = re.compile(
        r"""
        ^\s*
        (?P<num>
            (?:[IVXLCDM]+|[0-9]+(?:\.[0-9]+)*)
        )
        \s+
        (?P<title>.+?)
        \s+
        (?P<page>[0-9]{1,4})
        \s*$
        """,
        re.VERBOSE,
    )
    for idx, raw in enumerate(lines[: lines_per_page * max_pages]):
        line = raw.strip()
        if not line:
            continue
        m = toc_entry_re.match(line)
        if not m:
            continue
        num = m.group("num")
        title = m.group("title").strip(" .")
        page = int(m.group("page"))
        # Level: count dots or roman vs numeric
        if "." in num:
            level = num.count(".") + 1
        elif num.isdigit():
            level = 1
        else:
            # roman numeral (Part I, II, III)
            level = 0
        sec_id = f"{source_id}:{num}"
        sections.append(
            Section(
                source_id=source_id,
                id=sec_id,
                title=title,
                level=level,
                page_start=page,
                page_end=page,  # temporary; we fill page_end after sorting
            )
        )

    # Sort by page and set page_end based on next section start
    sections.sort(key=lambda s: (s.page_start, s.level))
    for i, sec in enumerate(sections):
        if i < len(sections) - 1:
            sections[i].page_end = max(sec.page_start, sections[i + 1].page_start - 1)
        else:
            # last section: let caller clamp to doc page count
            sections[i].page_end = sec.page_start
    return sections


def extract_formulas_from_text(text: str) -> List[Tuple[str, str]]:
    """
    Extract candidate formulas and their 'meaning' from a section's text.

    Heuristics:
    - A formula is any line matching FORMULA_LINE_RE.
    - Meaning is the sentence immediately following the formula line, when present.
    """
    lines = [ln.strip() for ln in text.splitlines()]
    formulas: List[Tuple[str, str]] = []

    for idx, line in enumerate(lines):
        if not line:
            continue
        if FORMULA_LINE_RE.search(line):
            formula = line
            # Meaning: look ahead a few lines for an explanatory sentence.
            meaning = ""
            for j in range(idx + 1, min(idx + 5, len(lines))):
                cand = lines[j]
                if len(cand) < 20:
                    continue
                if cand.endswith((".", "?", "!")):
                    meaning = cand
                    break
            formulas.append((formula, meaning))
    return formulas


def extract_text_for_section(doc: pymupdf.Document, section: Section, last_page: int) -> str:
    page_start = max(1, section.page_start)
    page_end = min(last_page, section.page_end or last_page)
    chunks: List[str] = []
    for page_num in range(page_start - 1, page_end):
        page = doc.load_page(page_num)
        chunks.append(page.get_text("text"))
    return "\n".join(chunks)


def generate_cypher_for_pdf(pdf_path: Path, out: List[str]) -> None:
    """
    Process a single PDF:
    - Derive Source node.
    - Extract TOC → Section nodes and hierarchy.
    - For each Section, extract formulas + meanings.
    - Emit Cypher MERGE statements into `out`.
    """
    doc = pymupdf.open(pdf_path.as_posix())
    source_id = pdf_path.stem.lower().replace(" ", "_")
    source_title = doc.metadata.get("title") or pdf_path.stem

    # Read first few pages as raw text for TOC heuristics
    preview_lines: List[str] = []
    for page_index in range(min(5, doc.page_count)):
        page = doc.load_page(page_index)
        preview_lines.extend(page.get_text("text").splitlines())

    sections = extract_toc_from_text_lines(source_id, preview_lines, max_pages=5)
    if not sections:
        # Fallback: single synthetic section covering the whole book
        sections = [
            Section(
                source_id=source_id,
                id=f"{source_id}:1",
                title="Full Book",
                level=0,
                page_start=1,
                page_end=doc.page_count,
            )
        ]
    else:
        # Clamp last section page_end to doc page_count
        sections[-1].page_end = doc.page_count

    # Source node
    out.append(
        f"MERGE (s:Source {{id: '{cypher_escape(source_id)}'}})\n"
        f"SET s.title = '{cypher_escape(source_title)}', "
        f"s.path = '{cypher_escape(str(pdf_path))}', "
        f"s.type = 'book';\n"
    )

    # Section nodes and HAS_SECTION hierarchy (flat by default; hierarchy by level if desired)
    for sec in sections:
        out.append(
            "MERGE (sec:Section {id: '%s'})\n"
            "SET sec.title = '%s', sec.level = %d, sec.pageStart = %d, sec.pageEnd = %d;\n"
            "MATCH (s:Source {id: '%s'}), (sec:Section {id: '%s'})\n"
            "MERGE (s)-[:HAS_SECTION]->(sec);\n"
            % (
                cypher_escape(sec.id),
                cypher_escape(sec.title),
                sec.level,
                sec.page_start,
                sec.page_end,
                cypher_escape(source_id),
                cypher_escape(sec.id),
            )
        )

    # Formulas per section
    for sec in sections:
        sec_text = extract_text_for_section(doc, sec, doc.page_count)
        formulas = extract_formulas_from_text(sec_text)
        for idx, (formula, meaning) in enumerate(formulas, start=1):
            formula_id = f"{sec.id}:f{idx}"
            out.append(
                "MERGE (f:Formula {id: '%s'})\n"
                "SET f.text = '%s', f.meaning = '%s', f.sourceId = '%s', f.sectionId = '%s';\n"
                "MATCH (sec:Section {id: '%s'}), (f:Formula {id: '%s'})\n"
                "MERGE (sec)-[:HAS_FORMULA]->(f);\n"
                % (
                    cypher_escape(formula_id),
                    cypher_escape(formula),
                    cypher_escape(meaning),
                    cypher_escape(source_id),
                    cypher_escape(sec.id),
                    cypher_escape(sec.id),
                    cypher_escape(formula_id),
                )
            )


def generate_cypher_for_algorithmic_trading_books(
    books_dir: Path,
    output_path: Path,
) -> None:
    """
    Entry point: iterate over all PDFs in the AlgorithmicTradingStrategies directory
    and write a Cypher script that can be loaded into Neo4j.
    """
    out: List[str] = [
        "// Auto-generated Cypher from pdf_ingest.py",
        "// Load into Neo4j AFTER core schema is in place.",
    ]
    for pdf in sorted(books_dir.glob("*.pdf")):
        generate_cypher_for_pdf(pdf, out)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(out), encoding="utf-8")


if __name__ == "__main__":
    # Default to your AlgorithmicTradingStrategies directory and write a cypher script under ai-core/cypher/\n"
    base = Path(__file__).resolve().parents[2]
    books_dir = base / "AlgorithmicTradingStrategies"
    out_path = base / "ai-core" / "cypher" / "algorithmic_trading_ingest.cypher"
    generate_cypher_for_algorithmic_trading_books(books_dir, out_path)
    print(f"Wrote Cypher ingestion script to {out_path}")

