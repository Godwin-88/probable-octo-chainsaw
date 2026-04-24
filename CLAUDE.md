# CLAUDE.md — QuantiNova / Dynamic Yield Optimization Agent

> Read this file in full before writing any code. Every section is load-bearing.

---

## 0. Project Identity

**Stack**: Multi-agent DeFi yield optimizer. Web3-native, non-custodial, quant-grade.

| Layer | Tech | Port |
|-------|------|------|
| Frontend | React + TypeScript | 5173 |
| Gateway | Node.js/Express + WDK (`@tetherto/wdk`) | 3000 |
| MCP Server | TypeScript (JSON-RPC 2.0, 9 tools) | 3001 |
| AI Core | Python gRPC + FastAPI (TRANSACT) | 50051 / 8000 |
| Agent Orchestrator | LangGraph Trading Harness | 8001 |
| Knowledge Graph | Neo4j | 7475 (browser) / 7688 (bolt) |
| Cache | Redis | 6379 |

**Non-negotiable constraint**: The server NEVER holds private keys or signs transactions. All signing is user-side via WDK / MetaMask.

---

## 1. Repository Layout

```
/
├── gateway-wdk/          TypeScript gateway — REST /api + /v2 + WebSocket
│   └── src/
│       ├── routes/       agent.ts, auth.ts, execute.ts, health.ts,
│       │                 optimize.ts, portfolio.ts, transactProxy.ts, v2.ts
│       ├── services/     bundle.ts, oracle.ts, portfolio.ts,
│       │                 simulateSwap.ts, tokenResolver.ts
│       ├── lib/          chains.ts, redis.ts, relay.ts
│       └── ws/           progress.ts, v2.ts
├── mcp-server-yield-agent/   MCP server — 7 JSON-RPC 2.0 tools
├── ai-core/
│   └── ai_core/          optimizer_servicer.py, server.py, neo4j_schema.py,
│                          transact_client.py, optimize_pb2*.py
├── frontend/src/
│   ├── App.tsx
│   └── api/agent.ts
├── proto/                optimize.proto (gRPC contract)
├── deploy/               docker-compose.yml, Dockerfiles
├── docs/                 SETUP.md, API_V2.md, DECISION_FLOW.md,
│                          LANGGRAPH_ORCHESTRATOR.md, WDK_INTEGRATION.md
├── AlgorithmicTradingStrategies/   Source PDFs → Neo4j KG (via pdf_ingest)
├── psychic-invention/    TRANSACT platform (submodule / separate repo)
└── .env.example          Canonical env var reference
```

---

## 2. Environment Variables — Canonical Reference

Always check `.env.example` first. Key variables:

```bash
# Neo4j — non-standard ports (avoids collision with local Neo4j)
NEO4J_URI=bolt://localhost:7688          # from host
NEO4J_URI=bolt://neo4j:7687             # from Docker container
NEO4J_PASSWORD=yield-agent-dev

# Redis
REDIS_URL=redis://localhost:6379         # from host
REDIS_URL=redis://redis:6379             # from Docker

# RPC endpoints (at least Ethereum required)
RPC_URL_ETHEREUM=https://eth.llamarpc.com
RPC_URL_POLYGON=https://polygon-rpc.com

# LangGraph Orchestrator
ORCHESTRATOR_PORT=8001

# TRANSACT (REQUIRED for quant features and MCP tools)
TRANSACT_API_URL=http://localhost:8000   # or http://host.docker.internal:8000 from Docker

# MEV relay
FLASHBOTS_RELAY_URL=https://relay.flashbots.net
FLASHBOTS_RPC_URL=https://rpc.flashbots.net
MEV_BLOCKER_RPC_URL=https://rpc.mevblocker.io
```

---

## 3. WDK Rules (from `wdk.mdc`)

These rules are absolute. Never deviate.

- All WDK packages are under the `@tetherto` scope on npm.
- Core: `@tetherto/wdk` — the orchestrator.
- EVM wallet: `@tetherto/wdk-wallet-evm`
- Other chains: `@tetherto/wdk-wallet-btc`, `@tetherto/wdk-wallet-solana`, `@tetherto/wdk-wallet-ton`, `@tetherto/wdk-wallet-tron`
- Protocol modules: `@tetherto/wdk-protocol-swap-velora-evm`, `@tetherto/wdk-protocol-lending-aave-evm`, etc.
- `WalletAccount` extends `WalletAccountReadOnly` — read-only = balance + query; write = sign + send.
- Official docs: https://docs.wallet.tether.io — consult before making any WDK assumption.
- In Node.js: use `@tetherto/wdk` as orchestrator + register individual wallet modules.
- **NEVER implement signing server-side**. WDK is always client / gateway read-only.

```typescript
// CORRECT: read-only portfolio via WDK
const account = new WalletAccountReadOnly({ address: walletAddress, chain });
const balances = await account.getBalances();

// NEVER: storing keys, signing on behalf of users
```

---

## 4. AI Agent Architecture Rules (from `agentarchitechture.mdc`)

When building or modifying any agent component, apply the **Brain-Perception-Action** model:

```
Environment → PERCEPTION → BRAIN (LLM) → ACTION
```

- **PERCEPTION**: What inputs does this agent receive? (wallet data, on-chain state, oracle prices, user intent)
- **BRAIN**: What does the LLM reason over? Ensure short-term context + long-term Neo4j KG + Redis cache
- **ACTION**: Tool calls only — never raw code execution; always validate tool outputs before acting

### Agent Properties Required in Every Agent Module
| Property | Implementation in This Stack |
|----------|------------------------------|
| Autonomy | `/v2/agent/toggle` persists autonomous mode in Redis |
| Reactivity | WebSocket feeds: positions, opportunities, agent status |
| Pro-activeness | LangGraph loop: fetch → analyze → decide → execute |
| Social ability | Orchestrator ↔ AI Core ↔ Gateway communication |

### Planning Pattern — LangGraph State Machine
1. **fetch_portfolio**: WDK read-only via gateway
2. **analyze_market**: OHLCV + feature engineering
3. **graphrag_retrieve**: Neo4j KG (quant formulas) + web scrapers
4. **rl_decide**: Deep RL (PPO) decision [-1, 1]
5. **validate_risk**: Risk check against Neo4j parameters
6. **execute_trade**: Submit to Kraken via gateway
7. **record_outcome**: Log signal + reward to Neo4j

### Memory Architecture
| Memory Type | Storage | TTL |
|-------------|---------|-----|
| Short-term (context) | In-request context window | Per-request |
| Optimization plans | Redis (`plan:<optimizationId>`) | 1 hour |
| Portfolio cache | Redis (`portfolio:<wallet>:<chain>`) | 120 s |
| Agent autonomy state | Redis (`agent:autonomous:<sessionId>`) | 24 h |
| Activity audit trail | Redis list (`activity:<wallet>`) | 7 days |
| Knowledge / formulas | Neo4j (permanent) | Permanent |

---

## 5. Knowledge Graph + GraphRAG Rules (from `KGGR.mdc`)

### Neo4j Schema Conventions
- Use `ai_core/ai_core/neo4j_schema.py` as the single source of truth for node labels and relationships.
- Core node labels: `Protocol`, `Asset`, `Strategy`, `Formula`, `Opportunity`, `Chain`
- All `MERGE` operations must be idempotent — no duplicate nodes.
- Write results back to Neo4j after every graph algorithm run.

### Cypher Conventions
```cypher
// CORRECT: use MERGE for upserts, never CREATE blindly
MERGE (p:Protocol {name: $name})
ON CREATE SET p.createdAt = timestamp()
ON MATCH SET p.updatedAt = timestamp()

// CORRECT: parameterised queries always
MATCH (a:Asset {symbol: $symbol})-[:LISTED_ON]->(p:Protocol)
RETURN a, p

// NEVER: string interpolation in Cypher
// MATCH (a:Asset {symbol: "' + userInput + '"})  ← SQL/Cypher injection
```

### GraphRAG Pattern for This Stack
```
User/Agent Query
    │
    ▼
Extract entities (asset, protocol, formula name)
    │
    ▼
Cypher lookup: MATCH (f:Formula {name: $name}) RETURN f.explanation
    │
    ▼
Inject Neo4j subgraph context into TRANSACT /agents/explain request
    │
    ▼
Return grounded, structured explanation
```

### KG Embedding Rule
- When enriching Neo4j with embeddings, store as `embedding` property on nodes.
- Use the same embedding model for both indexing and query time — no mixing.
- For DeFi-specific knowledge, prefer domain-adapted embeddings over generic ones.

---

## 6. Graph Algorithm Rules (from `graphalgorithms.mdc` + `GMLandGNN.mdc`)

### GDS Availability Decision Tree
```
Is Neo4j GDS plugin available?
├── YES → Use GDS Cypher procedures (faster, in-database)
└── NO  → Pull graph to Python via NetworkX, compute, write results back
```

### Python-First Graph Pipeline (GDS-free, required on AuraDB Free)
```python
# 1. Extract from Neo4j
G = neo4j_to_networkx(driver, node_label="Protocol", rel_type="CONNECTS_TO")

# 2. Classical algorithms (NetworkX for <100K nodes, igraph for >1M)
pagerank = nx.pagerank(G, alpha=0.85)
communities = community_louvain.best_partition(G.to_undirected())

# 3. Embeddings
node2vec = Node2Vec(G, dimensions=128, walk_length=80, num_walks=10, p=1.0, q=0.5)
model = node2vec.fit(window=10, min_count=1)

# 4. Write back
session.run("UNWIND $rows AS r MATCH (n) WHERE id(n)=r.id SET n.pagerank=r.score", rows=...)
```

### GNN Usage Rules
- Use **GAT** (Graph Attention Network) for opportunity ranking — attention weights reflect protocol importance.
- Use **GraphSAGE** for inductive inference on new protocols/assets not seen during training.
- Use **node2vec** (not GDS-required) for generating protocol/asset embeddings stored in Neo4j.
- Expose GNN inference as an AI Core endpoint (`/gnn/rank`), not inline in the gateway.

---

## 7. Multi-Agent System Rules (from `multiagentsystems.mdc`)

### Agent Topology
```
LangGraph Orchestrator (port 8001)
    │  HTTP / gRPC
    ▼
AI Core / TRANSACT (port 8000)      Gateway (port 3000)
    │  Neo4j GraphRAG                  │  WDK Execution
    │  Deep RL Policy                  │  Market Data
    ▼                                  ▼
Neo4j (port 7688)               Kraken / Chains
```

### MCP Tool Implementation Rules
- Every tool must return `{ content: [{ type: "text", text: JSON.stringify(result) }], isError: false }` on success.
- On failure: `{ content: [{ type: "text", text: JSON.stringify({ error: msg }) }], isError: true }`.
- No tool may mutate state without explicit user consent (`broadcast_signed_tx` requires `signedTxHex` from user — the user already signed client-side).
- Tool names are **snake_case** — never change them without updating orchestrator logic.
- Tool input schemas must be JSON Schema draft-07 compatible.

### Inter-Agent Message Schema
```typescript
interface AgentMessage {
  sender: string;            // e.g. "orchestrator", "mcp-server"
  recipient: string;
  task_id: string;           // UUID
  message_type: "tool_call" | "tool_result" | "error";
  content: unknown;
  metadata: {
    session_id: string;
    wallet_address?: string;
    timestamp: string;       // ISO 8601
    confidence?: number;
  };
}
```

### Failure Mode Mitigations — Required
| Failure | Mitigation in Code |
|---------|-------------------|
| Hallucination cascade | Each MCP tool validates response schema before returning |
| Infinite retry loop | Max 3 retries with exponential backoff (see production rules) |
| Context overflow | Optimization plans summarised before injection; max 10 actions returned |
| TRANSACT unavailable | Return `{ error: "TRANSACT_UNAVAILABLE" }` — never fake quant data |
| Neo4j unavailable | Return cached data if Redis hit; else `503` |

---

## 8. RAG Rules (from `RAG.mdc`)

### RAG Pipeline for This Stack (GraphRAG)
```
Query (formula name / asset / protocol)
    │
    ├── Entity extraction → Cypher → Neo4j subgraph
    └── Embedding search  → Neo4j vector index (if available)
           │
           ▼
    Structured context (triples + properties)
           │
           ▼
    TRANSACT /agents/explain → grounded explanation
```

### Chunking Rules for PDF Ingestion (`AlgorithmicTradingStrategies/`)
- Chunk size: 512 tokens, 10% overlap (general) or sentence-level (formula extraction).
- Each chunk stored with metadata: `source_file`, `page`, `chapter`, `formula_name` (if detected).
- Use the **same embedding model** for both indexing PDFs and querying.
- Embed chunk description into the Neo4j `Formula` node as `embedding` property.
- Never re-ingest a chunk if the source file + page already exists in Neo4j (`MERGE` not `CREATE`).

### Retrieval Quality Rule
- Prefer **hybrid search** (dense embedding + BM25 keyword) over pure dense for financial formulas.
- Always **rerank** with a cross-encoder before injecting context — top-3 after reranking.
- Log query + retrieved chunks + LLM response for every `explain_formula` call (observability).

---

## 9. LLM + Prompt Engineering Rules (from `llm.mdc`)

### Model Selection for Agent Tasks
| Task | Preferred Model | Fallback |
|------|----------------|----------|
| Orchestration / planning | claude-sonnet-4-6 | claude-haiku-4-5 |
| Formula explanation | claude-opus-4-6 | claude-sonnet-4-6 |
| Tool routing (fast) | claude-haiku-4-5 | — |
| Embedding generation | text-embedding-3-small | sentence-transformers |

### Prompt Engineering Conventions
- Always use **Chain-of-Thought** for optimization decisions: "Analyse the portfolio, identify risk, then generate actions step by step."
- Use **ReAct** pattern when agent must query tools iteratively (portfolio → VaR → opportunities → plan).
- For orchestrator system prompts: explicitly list available tools and their input schemas.
- **Never** interpolate raw user input into Cypher or SQL — always parameterise.
- System prompts must include: role, available tools, output format, safety guardrails (no signing on behalf of user).

### LLM Limitation Compensations
| Limitation | Compensation Used in This Stack |
|------------|-------------------------------|
| Knowledge cutoff | Live oracle prices + on-chain data via WDK |
| Hallucination | Neo4j KG grounding + TRANSACT quant validation |
| No persistent memory | Redis session state + Neo4j long-term KG |
| Context overflow | Optimization plan summarised to max 10 actions |

---

## 10. Production Rules (from `prod.mdc`)

### Async Pattern — Gateway (TypeScript)
```typescript
// CORRECT: async route handlers, no blocking calls
router.post("/optimize", async (req, res) => {
  const { walletAddress, constraints } = req.body;
  const optimizationId = crypto.randomUUID();

  // Non-blocking: fire and forget to ai-core via gRPC
  setImmediate(() => runOptimizationAsync(optimizationId, walletAddress, constraints));

  res.status(202).json({ optimizationId });
});

// CORRECT: retry with exponential backoff for LLM/external calls
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw new Error("unreachable");
}
```

### Async Pattern — AI Core (Python)
```python
import asyncio

async def process_concurrent_tool_calls(queries: list[str]) -> list[dict]:
    """Parallel tool calls — use asyncio.gather for independence."""
    tasks = [call_transact(q) for q in queries]
    return await asyncio.gather(*tasks)

# asyncio.timeout() on every external call — never hang
async def safe_transact_call(payload: dict) -> dict:
    async with asyncio.timeout(10.0):
        return await transact_client.call(payload)
```

### Redis Cache Rules
```typescript
// Cache key conventions — always namespaced
const portfolioKey = `portfolio:${walletAddress}:${chainId}`;  // TTL: 120s
const planKey      = `plan:${optimizationId}`;                  // TTL: 3600s
const autonomyKey  = `agent:autonomous:${sessionId}`;           // TTL: 86400s
const activityKey  = `activity:${walletAddress}`;               // List, RPUSH, LTRIM 100

// ALWAYS set TTL — no unbounded keys
await redis.set(key, JSON.stringify(value), "EX", 120);
```

### Structured Logging — Required on Every Service
```typescript
// gateway-wdk: every route must log
logger.info({ event: "optimize.start", walletAddress, optimizationId, constraints });
logger.info({ event: "optimize.done",  optimizationId, duration_ms, action_count });
logger.error({ event: "optimize.error", optimizationId, error: err.message });
```

```python
# ai-core: every gRPC handler and HTTP endpoint
import structlog
logger = structlog.get_logger()
logger.info("grpc.optimize.start", optimization_id=optimization_id, wallet=wallet)
```

### Security Non-Negotiables
- No private keys, mnemonics, or seeds anywhere in the codebase or logs.
- Scrub `signedTxHex` from logs after broadcast (log only txHash).
- Validate all `walletAddress` inputs as EIP-55 checksummed addresses before use.
- Rate-limit all `/api/*` routes (100 req/min per IP default).
- Cypher queries: always parameterised — `session.run(query, { param: value })`.
- Never expose `NEO4J_PASSWORD`, `OPENCLAW_TOKEN`, or `TRANSACT_API_URL` in responses.

### Docker Compose Rules
- Use `deploy/docker-compose.yml` as the canonical compose file.
- Service names are fixed: `gateway`, `ai-core`, `mcp-server`, `neo4j`, `redis`, `frontend`.
- Internal service DNS: `http://gateway:3000`, `bolt://neo4j:7687`, `redis://redis:6379`.
- Host-exposed ports: neo4j browser on **7475** (not 7474), bolt on **7688** (not 7687) — avoids collision with local Neo4j.
- Always `depends_on: [redis, neo4j]` for gateway and ai-core.

---

## 11. Common Dev Commands

### Start Full Stack
```bash
# Docker (recommended)
cd deploy && docker compose up --build

# Local dev (all services separate terminals)
# Terminal 1 — Neo4j (Docker only)
docker compose -f deploy/docker-compose.yml up neo4j redis

# Terminal 2 — AI Core / TRANSACT
cd ai-core && python -m ai_core.server

# Terminal 3 — Gateway
cd gateway-wdk && npm run dev

# Terminal 4 — MCP Server
cd mcp-server-yield-agent && npm run dev

# Terminal 5 — Frontend
cd frontend && npm run dev
```

### Test Endpoints
```bash
# Health checks
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:8000/cache/health

# Portfolio (replace address)
curl "http://localhost:3000/api/portfolio?walletAddress=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&chainId=ethereum"

# Chains
curl http://localhost:3000/v2/chains

# MCP tools list
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# VaR (TRANSACT direct)
curl -X POST http://localhost:8000/risk/var \
  -H "Content-Type: application/json" \
  -d '{"returns":[[0.01,-0.02],[-0.03,0.01],[0.02,0.03]],"weights":[0.6,0.4],"alpha":0.05,"portfolio_value":10000,"horizon_days":1,"include_monte_carlo":false,"mc_simulations":1000}'
```

### Proto Regeneration
```bash
cd proto
python -m grpc_tools.protoc \
  -I. \
  --python_out=../ai-core/ai_core \
  --grpc_python_out=../ai-core/ai_core \
  optimize.proto
```

### Neo4j Browser
Open http://localhost:7475 → connect to `bolt://localhost:7688` with user `neo4j` / password from `NEO4J_PASSWORD`.

### Ingest AlgorithmicTradingStrategies PDFs into Neo4j
```bash
cd ai-core
python -m ai_core.pdf_ingest --dir ../AlgorithmicTradingStrategies --neo4j-uri bolt://localhost:7688
```

---

## 12. Code Style Rules

### TypeScript (gateway-wdk, mcp-server-yield-agent, frontend)
- Strict TypeScript (`"strict": true` in tsconfig).
- No `any` — use `unknown` + type guards or proper interfaces.
- All route handlers: `async (req: Request, res: Response): Promise<void>`.
- Error responses: always `res.status(code).json({ error: string, code?: string })`.
- Export types from `src/types/` — no inline type definitions in route files.
- Use `zod` for request body validation on all POST endpoints.

### Python (ai-core)
- Python 3.11+. Type hints on all function signatures.
- `async def` for all I/O-bound operations (Neo4j, TRANSACT HTTP, Redis).
- Use `pydantic` models for all FastAPI request/response schemas.
- gRPC servicers: one method per RPC, delegate heavy logic to `services/` modules.
- NumPy arrays for all return matrices — no nested Python lists in quant code.
- Tests in `ai-core/tests/` using `pytest` + `pytest-asyncio`.

### Cypher (Neo4j)
- Always parameterised — no string formatting.
- Use `MERGE` for upserts, `CREATE` only when guaranteed uniqueness.
- Index on: `Protocol.name`, `Asset.symbol`, `Formula.name`, `Asset.address`.
- Relationship types: `SCREAMING_SNAKE_CASE`. Node labels: `PascalCase`.

---

## 13. What NOT to Do

- **Do not** implement private key management anywhere in the gateway or MCP server.
- **Do not** use `CREATE` in Cypher where `MERGE` is correct.
- **Do not** skip `TRANSACT_API_URL` env var — `ai-core` and MCP server both refuse to start without it.
- **Do not** hard-code token addresses or chain IDs — use `gateway-wdk/src/lib/chains.ts` registry.
- **Do not** block the Node.js event loop — all DB calls must be async.
- **Do not** return raw Neo4j internal node IDs to clients — use `elementId()` or business-key properties.
- **Do not** add new MCP tools without updating orchestrator logic if they require the tool.
- **Do not** change `proto/optimize.proto` without regenerating both Python and TypeScript stubs.
- **Do not** use `GNN` model inference inline in gateway routes — delegate to AI Core HTTP endpoints.
- **Do not** skip structured logging on new routes or agent calls.

---

## 14. Key Files — Quick Navigation

| File | What It Does |
|------|-------------|
| [gateway-wdk/src/routes/v2.ts](gateway-wdk/src/routes/v2.ts) | All /v2 Web3-native endpoints |
| [gateway-wdk/src/routes/optimize.ts](gateway-wdk/src/routes/optimize.ts) | gRPC trigger → Redis cache |
| [gateway-wdk/src/services/oracle.ts](gateway-wdk/src/services/oracle.ts) | Pyth + CoinGecko dual-source oracle |
| [gateway-wdk/src/lib/chains.ts](gateway-wdk/src/lib/chains.ts) | Runtime chain registry |
| [gateway-wdk/src/lib/redis.ts](gateway-wdk/src/lib/redis.ts) | Redis client singleton + key helpers |
| [ai-core/ai_core/optimizer_servicer.py](ai-core/ai_core/optimizer_servicer.py) | gRPC handler → Neo4j + TRANSACT |
| [ai-core/ai_core/neo4j_schema.py](ai-core/ai_core/neo4j_schema.py) | Neo4j node/rel schema definitions |
| [ai-core/ai_core/transact_client.py](ai-core/ai_core/transact_client.py) | TRANSACT HTTP client (VaR, moments, explain) |
| [ai-core/ai_core/server.py](ai-core/ai_core/server.py) | FastAPI app + gRPC server entrypoint |
| [ai-core/ai_core/orchestrator/](ai-core/ai_core/orchestrator/) | LangGraph Orchestrator logic |
| [deploy/docker-compose.yml](deploy/docker-compose.yml) | Canonical full-stack compose |
| [proto/optimize.proto](proto/optimize.proto) | gRPC contract (source of truth) |
| [docs/LANGGRAPH_ORCHESTRATOR.md](docs/LANGGRAPH_ORCHESTRATOR.md) | LangGraph architecture guide |
| [docs/SETUP.md](docs/SETUP.md) | Full dev environment setup |
| [docs/API_V2.md](docs/API_V2.md) | /v2 endpoint reference |
| [.env.example](.env.example) | All env vars with comments |
| [docs/QuantiNova_API.postman_collection.json](docs/QuantiNova_API.postman_collection.json) | Complete API test collection (67 requests) |

---

## 15. Quant / DeFi Domain Rules

When writing or reviewing any optimization, risk, or strategy code:

### Strategy Selection Logic
```
Compute portfolio moments (via TRANSACT /portfolio/moments)
    │
    ├── High kurtosis (>3) or non-normal returns → use HRP (Hierarchical Risk Parity)
    └── Normal-ish returns, liquid assets       → use MVO (Mean-Variance Optimization)
                                                   or Black-Litterman with Neo4j KG views
```

### Risk Management Hierarchy
1. **VaR at 95% confidence** — primary risk metric (historical method preferred)
2. **Expected Shortfall (CVaR)** — tail risk, always compute alongside VaR
3. **Funding rate** — delta-neutral strategy viability check (TRANSACT `/funding`)
4. **On-chain factors** — TVL momentum, utilization, liquidation risk (`/factors/onchain`)
5. **MEV risk score** — from swap simulation (`/v2/simulate/swap` → `mevRiskScore`)
6. **Oracle deviation check** — Pyth vs CoinGecko >2% deviation = reject and alert

### Units and Precision
- Amounts on-chain: always **wei** (BigInt) — never floating point for token amounts.
- Prices: **USDT** denomination unless otherwise specified.
- Returns matrix: `float64` NumPy array, shape `(T, N)` — T time periods, N assets.
- Weights: sum to exactly 1.0 — validate before passing to TRANSACT.
- Basis points (bps): slippage and fees in bps (integer) — 50 bps = 0.5%.

---

*Last updated: 2026-03-13*
