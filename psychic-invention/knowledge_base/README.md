# Knowledge Base Structure

This directory contains the structured knowledge base for the Functional Agency system.

## Directory Structure

```
knowledge_base/
├── import/                 # Neo4j import directory
│   ├── 01_menus.cypher     # Executable: Menu nodes (run first)
│   ├── 02_concepts.cypher  # Executable: Concept nodes + BELONGS_TO
│   ├── 03_formulas.cypher  # Executable: Formula nodes
│   ├── 04_metrics_interpretations.cypher  # Executable: Metric + Interpretation + INTERPRETS
│   ├── 05_relationships.cypher  # Executable: Formula–Concept/Formula relationships
│   ├── concepts.cypher     # CSV source for concepts (used by generator)
│   ├── formulas.cypher     # CSV source for formulas
│   ├── interpretations.cypher  # CSV source for interpretations
│   └── relationships.cypher    # CSV source for relationships
├── menus/                  # Per-menu knowledge
│   ├── pricer/
│   ├── portfolio/
│   ├── risk/
│   ├── optimizer/
│   ├── volatility/
│   ├── factor/
│   ├── scenarios/
│   └── blotter/
├── formulas/               # Mathematical formulas
├── concepts/               # Financial concepts
└── examples/               # Example outputs
```

## Knowledge Graph Schema

### Node Labels

1. **Formula** - Mathematical formulas
   - Properties: `name`, `equation`, `description`, `variables`, `assumptions`
   
2. **Concept** - Financial concepts
   - Properties: `name`, `definition`, `category`, `difficulty`
   
3. **Metric** - Output metrics
   - Properties: `name`, `formula`, `interpretation`, `range`, `unit`
   
4. **Assumption** - Model assumptions
   - Properties: `name`, `description`, `impact`
   
5. **Interpretation** - Output interpretations
   - Properties: `condition`, `interpretation`, `action`, `confidence`
   
6. **Menu** - Menu items
   - Properties: `name`, `route`, `description`

### Relationship Types

1. **DERIVES_FROM** - Formula derives from another
2. **USES** - Formula uses a concept
3. **HAS_ASSUMPTION** - Formula has an assumption
4. **INTERPRETS** - Metric has an interpretation
5. **BELONGS_TO** - Concept belongs to a menu
6. **RELATED_TO** - Concepts are related
7. **IMPLIES** - One interpretation implies another

---

## Neo4j Setup

### 1. Start Neo4j

```bash
docker-compose -f docker-compose.kb.yml up -d
```

### 2. Access Neo4j Browser

- **URL:** http://localhost:7474
- **Username:** neo4j
- **Password:** pricing-engine-kb

### 3. Seed the graph from Neo4j Browser (UI)

Run the scripts in **order** in Neo4j Browser (http://localhost:7474). Each file is a Cypher script you can paste and run.

| Order | File | Purpose |
|-------|------|--------|
| 1 | `import/01_menus.cypher` | Create `Menu` nodes |
| 2 | `import/02_concepts.cypher` | Create `Concept` nodes and `BELONGS_TO` → Menu |
| 3 | `import/03_formulas.cypher` | Create `Formula` nodes |
| 4 | `import/04_metrics_interpretations.cypher` | Create `Metric` and `Interpretation` nodes, `INTERPRETS` links |
| 5 | `import/05_relationships.cypher` | Create `USES`, `DERIVES_FROM`, `HAS_ASSUMPTION`, `BELONGS_TO`, `RELATED_TO` between Formula and Concept/Formula |

**Steps:**

1. In Neo4j Browser, open the first script (e.g. copy the contents of `knowledge_base/import/01_menus.cypher`).
2. Paste into the query box and run (Ctrl+Enter or click Run).
3. Repeat for `02_concepts.cypher` through `05_relationships.cypher` in order.

Scripts use `MERGE` where appropriate so re-running is idempotent (you can run again without duplicating nodes).

### 4. Regenerating the executable scripts (optional)

The `01_*.cypher`–`05_*.cypher` files are generated from the CSV-style sources (`concepts.cypher`, `formulas.cypher`, etc.). To regenerate them after editing the CSVs:

```bash
python scripts/generate_cypher_seed.py
```

Run from the project root. Output is written to `knowledge_base/import/`.

---

## Query Examples

### Get Formula Explanation

```cypher
MATCH (f:Formula {name: 'Black-Scholes'})
RETURN f.equation, f.description, f.variables, f.assumptions
```

### Get Interpretation for Metric

```cypher
MATCH (m:Metric {name: 'Sharpe Ratio'})-[:INTERPRETS]->(i:Interpretation)
WHERE $value >= i.min AND $value <= i.max
RETURN i.interpretation, i.confidence, i.action
```

### Get Related Concepts

```cypher
MATCH (c:Concept {name: 'Volatility'})-[:RELATED_TO*1..2]-(related:Concept)
RETURN c, collect(DISTINCT related)
```

### Menu-Specific Knowledge

```cypher
MATCH (m:Menu {name: 'Pricer'})<-[:BELONGS_TO]-(c:Concept)
RETURN c.name, c.definition
```

---

## Next Steps

1. **Populate Knowledge Base** - Add formulas, concepts, interpretations
2. **Create Agent Endpoints** - API endpoints for agent queries
3. **Integrate with Frontend** - Add agent popup per menu item
4. **Test Queries** - Verify Neo4j queries return correct results
5. **Deploy** - Deploy with Docker Compose

---

**Last Updated:** 2026-03-05
