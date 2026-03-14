#!/usr/bin/env python3
"""
Load knowledge base from knowledge_base/import/*.cypher (CSV) into Neo4j.
Run from project root: python scripts/load_knowledge_base.py
Uses env: NEO4J_URI (default bolt://localhost:7687), NEO4J_USER, NEO4J_PASSWORD.
"""
import csv
import os
import sys
from pathlib import Path

# Add project root for app imports if needed
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

try:
    from neo4j import GraphDatabase
except ImportError:
    print("Install neo4j: pip install neo4j")
    sys.exit(1)

# Menu name -> route (from navConfig)
MENU_ROUTES = {
    "Pricer": "/transact/pricer",
    "Portfolio": "/transact/portfolio",
    "Risk": "/transact/risk",
    "Optimizer": "/transact/optimizer",
    "Volatility Lab": "/transact/volatility",
    "Factor Lab": "/transact/factor",
    "Scenarios": "/transact/scenarios",
    "Blotter": "/transact/blotter",
}

IMPORT_DIR = project_root / "knowledge_base" / "import"


def _read_csv(name: str):
    path = IMPORT_DIR / f"{name}.cypher"
    if not path.exists():
        return []
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({k: (v.strip() if v else "").strip('"') for k, v in row.items()})
    return rows


def _safe_float(s):
    if s is None or s == "":
        return None
    try:
        return float(s)
    except ValueError:
        return None


def load_menus(driver):
    """Create Menu nodes from distinct menu_context in concepts and interpretations."""
    menus = set()
    for row in _read_csv("concepts"):
        ctx = row.get("menu_context", "").strip()
        if ctx:
            menus.add(ctx)
    for row in _read_csv("interpretations"):
        ctx = row.get("menu_context", "").strip()
        if ctx:
            menus.add(ctx)
    # Ensure all known menus exist
    for m in MENU_ROUTES:
        menus.add(m)
    with driver.session() as session:
        for name in sorted(menus):
            route = MENU_ROUTES.get(name, f"/transact/{name.lower().replace(' ', '-')}")
            session.run(
                """
                MERGE (m:Menu {name: $name})
                SET m.route = $route,
                    m.description = $description
                """,
                name=name,
                route=route,
                description=f"Knowledge context for {name}",
            )
    print(f"Loaded {len(menus)} Menu nodes.")


def load_concepts(driver):
    """Create TransactConcept nodes and link to Menu via BELONGS_TO where menu_context set."""
    rows = _read_csv("concepts")
    with driver.session() as session:
        for row in rows:
            name = (row.get("name") or "").strip()
            if not name:
                continue
            session.run(
                """
                MERGE (c:TransactConcept {name: $name})
                SET c.definition = $definition,
                    c.category = $category,
                    c.difficulty = $difficulty,
                    c.menu_context = $menu_context,
                    c.prerequisites = $prerequisites
                """,
                name=name,
                definition=(row.get("definition") or "").strip(),
                category=(row.get("category") or "").strip(),
                difficulty=(row.get("difficulty") or "").strip(),
                menu_context=(row.get("menu_context") or "").strip(),
                prerequisites=(row.get("prerequisites") or "").strip(),
            )
            menu_ctx = (row.get("menu_context") or "").strip()
            if menu_ctx:
                session.run(
                    """
                    MATCH (c:TransactConcept {name: $cname})
                    MATCH (m:Menu {name: $mname})
                    MERGE (c)-[:BELONGS_TO]->(m)
                    """,
                    cname=name,
                    mname=menu_ctx,
                )
    print(f"Loaded {len(rows)} TransactConcept nodes.")


def load_formulas(driver):
    """Create TransactFormula nodes (shared Neo4j with DoraHacks)."""
    rows = _read_csv("formulas")
    with driver.session() as session:
        for row in rows:
            name = (row.get("name") or "").strip()
            if not name:
                continue
            variables = row.get("variables") or ""
            assumptions = row.get("assumptions") or ""
            session.run(
                """
                MERGE (f:TransactFormula {name: $name})
                SET f.equation = $equation,
                    f.description = $description,
                    f.variables = $variables,
                    f.assumptions = $assumptions,
                    f.source_file = $source_file,
                    f.inference_reasoning = $inference_reasoning
                """,
                name=name,
                equation=(row.get("equation") or "").strip(),
                description=(row.get("description") or "").strip(),
                variables=[x.strip() for x in variables.split(";") if x.strip()],
                assumptions=[x.strip() for x in assumptions.split(";") if x.strip()],
                source_file=(row.get("source_file") or "").strip(),
                inference_reasoning=(row.get("inference_reasoning") or "").strip(),
            )
    print(f"Loaded {len(rows)} TransactFormula nodes.")


def load_metrics_and_interpretations(driver):
    """Create Metric nodes and Interpretation nodes; link Metric-[:INTERPRETS]->Interpretation."""
    rows = _read_csv("interpretations")
    metrics_created = set()
    with driver.session() as session:
        for row in rows:
            metric_name = (row.get("metric_name") or "").strip()
            if not metric_name:
                continue
            if metric_name not in metrics_created:
                session.run(
                    "MERGE (m:Metric {name: $name})",
                    name=metric_name,
                )
                metrics_created.add(metric_name)
            min_val = _safe_float(row.get("min"))
            max_val = _safe_float(row.get("max"))
            session.run(
                """
                MATCH (m:Metric {name: $metric_name})
                CREATE (i:Interpretation {
                    condition: $condition,
                    min: $min_val,
                    max: $max_val,
                    interpretation: $interpretation,
                    action: $action,
                    confidence: $confidence,
                    menu_context: $menu_context
                })
                MERGE (m)-[:INTERPRETS]->(i)
                """,
                metric_name=metric_name,
                condition=(row.get("condition") or "").strip(),
                min_val=min_val,
                max_val=max_val,
                interpretation=(row.get("interpretation") or "").strip(),
                action=(row.get("action") or "").strip(),
                confidence=_safe_float(row.get("confidence")) or 0.85,
                menu_context=(row.get("menu_context") or "").strip(),
            )
    print(f"Loaded {len(metrics_created)} Metric nodes and {len(rows)} Interpretation nodes.")


ALLOWED_REL_TYPES = {"USES", "DERIVES_FROM", "HAS_ASSUMPTION", "BELONGS_TO", "RELATED_TO"}


def load_relationships(driver, formula_names: set, concept_names: set):
    """Create relationships from relationships.cypher. from=TransactFormula, to=TransactFormula or TransactConcept."""
    rows = _read_csv("relationships")
    if not rows:
        print("No relationships to load.")
        return
    rel_type_queries = {}
    for rel_type in ALLOWED_REL_TYPES:
        rel_type_queries[rel_type] = (
            f"MERGE (a:TransactFormula {{name: $from_name}}) "
            f"WITH a "
            f"MERGE (b:TransactConcept {{name: $to_name}}) "
            f"WITH a, b "
            f"MERGE (a)-[r:{rel_type}]->(b) RETURN r"
        )
    with driver.session() as session:
        for row in rows:
            from_name = (row.get("from") or "").strip()
            to_name = (row.get("to") or "").strip()
            rel_type = (row.get("relationship_type") or "").strip()
            if not from_name or not to_name or rel_type not in ALLOWED_REL_TYPES:
                continue
            to_is_formula = to_name in formula_names
            if to_is_formula:
                q = (
                    f"MERGE (a:TransactFormula {{name: $from_name}}) WITH a "
                    f"MERGE (b:TransactFormula {{name: $to_name}}) WITH a, b "
                    f"MERGE (a)-[r:{rel_type}]->(b) RETURN r"
                )
            else:
                q = rel_type_queries[rel_type]
            session.run(q, from_name=from_name, to_name=to_name)
    print(f"Loaded {len(rows)} relationships.")


def main():
    load_dotenv = None
    try:
        from dotenv import load_dotenv
    except ImportError:
        pass
    if load_dotenv:
        load_dotenv(project_root / ".env")

    uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "pricing-engine-kb")

    if not IMPORT_DIR.exists():
        print(f"Import directory not found: {IMPORT_DIR}")
        sys.exit(1)

    driver = GraphDatabase.driver(uri, auth=(user, password))
    try:
        driver.verify_connectivity()
    except Exception as e:
        print(f"Neo4j connection failed: {e}")
        sys.exit(1)

    try:
        load_menus(driver)
        load_concepts(driver)
        load_formulas(driver)
        load_metrics_and_interpretations(driver)

        formula_names = {r["name"] for r in _read_csv("formulas") if (r.get("name") or "").strip()}
        concept_names = {r["name"] for r in _read_csv("concepts") if (r.get("name") or "").strip()}
        # For relationships, "from" is always Formula in our CSV; "to" can be Concept or Formula
        load_relationships(driver, formula_names, concept_names)
    finally:
        driver.close()

    print("Knowledge base load complete.")


if __name__ == "__main__":
    main()
