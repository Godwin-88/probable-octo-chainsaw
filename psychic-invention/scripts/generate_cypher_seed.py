#!/usr/bin/env python3
"""
Generate executable Cypher scripts from knowledge_base/import CSV data.
Output: 01_menus.cypher, 02_concepts.cypher, 03_formulas.cypher,
        04_metrics_interpretations.cypher, 05_relationships.cypher
Run from project root: python scripts/generate_cypher_seed.py
"""
import csv
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
IMPORT_DIR = PROJECT_ROOT / "knowledge_base" / "import"

# Cypher string escape: single quote -> double single quote
def cypher_str(s: str | None) -> str:
    if s is None or s == "":
        return "null"
    escaped = (s or "").replace("\\", "\\\\").replace("'", "''")
    return f"'{escaped}'"


def read_csv(name: str) -> list[dict]:
    path = IMPORT_DIR / f"{name}.cypher"
    if not path.exists():
        return []
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({k: (v.strip() if v else "").strip('"') for k, v in row.items()})
    return rows


def write_01_menus():
    concepts = read_csv("concepts")
    interps = read_csv("interpretations")
    menus = set()
    for r in concepts:
        if r.get("menu_context"):
            menus.add(r["menu_context"].strip())
    for r in interps:
        if r.get("menu_context"):
            menus.add(r["menu_context"].strip())
    menu_routes = {
        "Pricer": "/transact/pricer",
        "Portfolio": "/transact/portfolio",
        "Risk": "/transact/risk",
        "Optimizer": "/transact/optimizer",
        "Volatility Lab": "/transact/volatility",
        "Factor Lab": "/transact/factor",
        "Scenarios": "/transact/scenarios",
        "Blotter": "/transact/blotter",
    }
    for m in menu_routes:
        menus.add(m)
    lines = [
        "// 01_menus.cypher — Run first in Neo4j Browser",
        "// Creates Menu nodes for each module.",
        "",
    ]
    for name in sorted(menus):
        route = menu_routes.get(name, f"/transact/{name.lower().replace(' ', '-')}")
        desc = cypher_str(f"Knowledge context for {name}")
        lines.append(f"MERGE (m:Menu {{name: {cypher_str(name)}}})")
        lines.append(f"  SET m.route = {cypher_str(route)}, m.description = {desc};")
        lines.append("")
    (IMPORT_DIR / "01_menus.cypher").write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote 01_menus.cypher ({len(menus)} menus)")


def write_02_concepts():
    rows = read_csv("concepts")
    lines = [
        "// 02_concepts.cypher — Run after 01_menus.cypher",
        "// Creates Concept nodes and BELONGS_TO links to Menu.",
        "",
    ]
    for r in rows:
        name = (r.get("name") or "").strip()
        if not name:
            continue
        definition = cypher_str(r.get("definition"))
        category = cypher_str(r.get("category"))
        difficulty = cypher_str(r.get("difficulty"))
        menu_ctx = (r.get("menu_context") or "").strip()
        prereq = cypher_str(r.get("prerequisites")) if r.get("prerequisites") else "null"
        lines.append(f"MERGE (c:TransactConcept {{name: {cypher_str(name)}}})")
        lines.append(f"  SET c.definition = {definition}, c.category = {category}, c.difficulty = {difficulty},")
        lines.append(f"      c.menu_context = {cypher_str(menu_ctx) if menu_ctx else 'null'}, c.prerequisites = {prereq};")
        if menu_ctx:
            lines.append(f"MATCH (c:TransactConcept {{name: {cypher_str(name)}}})")
            lines.append(f"MATCH (m:Menu {{name: {cypher_str(menu_ctx)}}})")
            lines.append("MERGE (c)-[:BELONGS_TO]->(m);")
        lines.append("")
    (IMPORT_DIR / "02_concepts.cypher").write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote 02_concepts.cypher ({len(rows)} concepts)")


def write_03_formulas():
    rows = read_csv("formulas")
    lines = [
        "// 03_formulas.cypher — Run after 02_concepts.cypher",
        "// Creates Formula nodes.",
        "",
    ]
    for r in rows:
        name = (r.get("name") or "").strip()
        if not name:
            continue
        equation = cypher_str(r.get("equation"))
        description = cypher_str(r.get("description"))
        variables_raw = (r.get("variables") or "").strip()
        variables_list = [cypher_str(x.strip()) for x in variables_raw.split(";") if x.strip()]
        variables_cypher = "[" + ", ".join(variables_list) + "]" if variables_list else "[]"
        assumptions_raw = (r.get("assumptions") or "").strip()
        assumptions_list = [cypher_str(x.strip()) for x in assumptions_raw.split(";") if x.strip()]
        assumptions_cypher = "[" + ", ".join(assumptions_list) + "]" if assumptions_list else "[]"
        source_file = cypher_str(r.get("source_file")) if r.get("source_file") else "null"
        inference = cypher_str(r.get("inference_reasoning")) if r.get("inference_reasoning") else "null"
        lines.append(f"MERGE (f:TransactFormula {{name: {cypher_str(name)}}})")
        lines.append(f"  SET f.equation = {equation}, f.description = {description},")
        lines.append(f"      f.variables = {variables_cypher}, f.assumptions = {assumptions_cypher},")
        lines.append(f"      f.source_file = {source_file}, f.inference_reasoning = {inference};")
        lines.append("")
    (IMPORT_DIR / "03_formulas.cypher").write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote 03_formulas.cypher ({len(rows)} formulas)")


def write_04_metrics_interpretations():
    rows = read_csv("interpretations")
    metrics_done = set()
    lines = [
        "// 04_metrics_interpretations.cypher — Run after 03_formulas.cypher",
        "// Creates Metric nodes and Interpretation nodes; links Metric-[:INTERPRETS]->Interpretation.",
        "",
    ]
    for r in rows:
        metric_name = (r.get("metric_name") or "").strip()
        if not metric_name:
            continue
        if metric_name not in metrics_done:
            lines.append(f"MERGE (m:Metric {{name: {cypher_str(metric_name)}}});")
            lines.append("")
            metrics_done.add(metric_name)
        condition = cypher_str(r.get("condition"))
        min_s = (r.get("min") or "").strip()
        max_s = (r.get("max") or "").strip()
        try:
            min_val = float(min_s) if min_s else "null"
        except ValueError:
            min_val = "null"
        try:
            max_val = float(max_s) if max_s else "null"
        except ValueError:
            max_val = "null"
        min_cypher = min_val if min_val == "null" else str(min_val)
        max_cypher = max_val if max_val == "null" else str(max_val)
        interpretation = cypher_str(r.get("interpretation"))
        action = cypher_str(r.get("action"))
        conf_s = (r.get("confidence") or "").strip()
        try:
            conf = float(conf_s) if conf_s else 0.85
        except ValueError:
            conf = 0.85
        menu_ctx = cypher_str(r.get("menu_context")) if (r.get("menu_context") or "").strip() else "null"
        lines.append("MATCH (m:Metric {name: " + cypher_str(metric_name) + "})")
        lines.append("CREATE (i:Interpretation {condition: " + condition + ", min: " + min_cypher + ", max: " + max_cypher + ",")
        lines.append("  interpretation: " + interpretation + ", action: " + action + ", confidence: " + str(conf) + ", menu_context: " + menu_ctx + "})")
        lines.append("MERGE (m)-[:INTERPRETS]->(i);")
        lines.append("")
    (IMPORT_DIR / "04_metrics_interpretations.cypher").write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote 04_metrics_interpretations.cypher ({len(metrics_done)} metrics, {len(rows)} interpretations)")


def write_05_relationships():
    rows = read_csv("relationships")
    formula_names = {r["name"] for r in read_csv("formulas") if (r.get("name") or "").strip()}
    rel_types = {"USES", "DERIVES_FROM", "HAS_ASSUMPTION", "BELONGS_TO", "RELATED_TO"}
    lines = [
        "// 05_relationships.cypher — Run last, after 02_concepts and 03_formulas.",
        "// Creates relationships between Formula and Concept/Formula. Creates missing Concept nodes if needed.",
        "",
    ]
    for r in rows:
        from_name = (r.get("from") or "").strip()
        to_name = (r.get("to") or "").strip()
        rel_type = (r.get("relationship_type") or "").strip()
        if not from_name or not to_name or rel_type not in rel_types:
            continue
        to_is_formula = to_name in formula_names
        # Ensure from/to nodes exist (TransactFormula or TransactConcept for shared Neo4j)
        if to_is_formula:
            lines.append(f"MERGE (a:TransactFormula {{name: {cypher_str(from_name)}}})")
            lines.append(f"MERGE (b:TransactFormula {{name: {cypher_str(to_name)}}})")
        else:
            lines.append(f"MERGE (a:TransactFormula {{name: {cypher_str(from_name)}}})")
            lines.append(f"MERGE (b:TransactConcept {{name: {cypher_str(to_name)}}})")
        lines.append(f"WITH a, b MERGE (a)-[r:{rel_type}]->(b);")
        lines.append("")
    (IMPORT_DIR / "05_relationships.cypher").write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote 05_relationships.cypher ({len(rows)} relationships)")


def main():
    IMPORT_DIR.mkdir(parents=True, exist_ok=True)
    write_01_menus()
    write_02_concepts()
    write_03_formulas()
    write_04_metrics_interpretations()
    write_05_relationships()
    print("Done. Run 01_menus.cypher through 05_relationships.cypher in Neo4j Browser in order.")


if __name__ == "__main__":
    main()
