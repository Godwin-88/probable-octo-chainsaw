# Agent Decision Flow

The dynamic yield optimization agent uses a **Neo4j knowledge graph** as the logical layer: protocols, assets, opportunities, positions, and market context are stored as nodes and relationships. Decisions are driven by graph queries and (in full implementation) GraphRAG and RL policies.

## Data layer (Neo4j)

- **Nodes**: Chain, Protocol, Asset, Opportunity, MarketCondition, User, Position, OptimizationRun. Ingested content: Source, Section, Formula.
- **TRANSACT namespace nodes** (coexist with legacy): TransactConcept, TransactFormula, Menu, DeFiProtocol, TradingStrategy, KnowledgeSource.
- **Relationships**: ON_CHAIN, SUPPORTS, OFFERS, DENOMINATED_IN, BRIDGED_TO, INFLUENCES, HOLDS, IN, FOR_RUN; for content: HAS_SECTION, HAS_FORMULA.
- **TRANSACT namespace relationships**: SOURCED_FROM (formula/concept → KnowledgeSource), HAS_DEFI_EQUIVALENT (TransactConcept → DeFiProtocol), DEFI_ADAPTED_AS, BELONGS_TO (concept/formula → Menu), APPLIED_IN (TradingStrategy → protocol/opportunity).
- Schema and indexes are defined in `ai-core/ai_core/neo4j_schema.py`; the indexer and AI core both read/write this graph.
- Knowledge graph is seeded by the `graph-seeder` Docker service (`ai-core/scripts/seed_graph.sh`), which runs after Neo4j is healthy, loads all 16 Cypher files in correct dependency order, then exits.

### Schema overview

```mermaid
erDiagram
  Chain ||--o{ Protocol : ON_CHAIN
  Chain ||--o{ Asset : ON_CHAIN
  Chain ||--o{ Opportunity : ON_CHAIN
  Protocol ||--o{ Asset : SUPPORTS
  Protocol ||--o{ Opportunity : OFFERS
  Opportunity ||--o| Asset : DENOMINATED_IN
  Asset ||--o| Asset : BRIDGED_TO
  MarketCondition ||--o{ Opportunity : INFLUENCES
  User ||--o{ Position : HOLDS
  Position ||--o| Opportunity : IN
  OptimizationRun ||--o| User : FOR_RUN
  Source ||--o{ Section : HAS_SECTION
  Section ||--o{ Formula : HAS_FORMULA
  TransactConcept ||--o{ Menu : BELONGS_TO
  TransactFormula ||--o{ Menu : BELONGS_TO
  TransactFormula ||--o{ KnowledgeSource : SOURCED_FROM
  TransactConcept ||--o{ KnowledgeSource : SOURCED_FROM
  TransactConcept ||--o| DeFiProtocol : HAS_DEFI_EQUIVALENT
  DeFiProtocol ||--o{ TransactConcept : DEFI_ADAPTED_AS
  TradingStrategy ||--o{ Opportunity : APPLIED_IN
```

## Optimization flow (high level)

```mermaid
flowchart TB
  A[User_Triggers_Optimize] --> B[Gateway_Returns_optimizationId]
  B --> C[Frontend_Connects_WebSocket]
  C --> D[Gateway_Calls_AI_Core_gRPC]
  D --> E[AI_Core_Loads_Subgraph_Neo4j]
  E --> F[Aggregate_Risk_APY]
  F --> G[Produce_Recommended_Actions]
  G --> H[Stream_Progress_to_Gateway]
  H --> I[Gateway_Forwards_to_WebSocket]
  I --> J[Frontend_Shows_Plan]
  J --> K[User_Approves]
  K --> L[Client_Signs_via_WDK]
  L --> M[Gateway_Broadcasts_Signed_Tx]
  M --> N[DONE]
```

1. **Request**: User clicks “Analyze & Optimize”; gateway receives wallet and constraints, returns `optimizationId`, then streams progress over WebSocket.
2. **Data**: Gateway calls AI core via gRPC. AI core loads the subgraph around the user’s positions and candidate opportunities from Neo4j (and optionally market conditions).
3. **Reasoning**: AI core aggregates risk/APY along relationships, runs heuristic or RL policy, and produces a list of recommended actions. The **LangGraph Orchestrator** manages the trading lifecycle, integrating GraphRAG and Deep RL for intelligent execution.
4. **Explainability**: Recommendations include citations from quant formulas and concepts in Neo4j; TRANSACT provides underlying financial rationale.
5. **Execution**: User approves in the UI; client signs with WDK; gateway broadcasts via `POST /api/execute/signed`. WebSocket streams status (e.g. WAITING_FOR_SIGNATURE, BROADCASTING, DONE).

## LangGraph Trading Orchestrator

The trading flow is managed by a **LangGraph state machine**, which provides a structured, deterministic pipeline for agentic trading. It replaces the legacy ReAct loop and OpenClaw orchestration with a sequential flow of specialized nodes.

```mermaid
flowchart TD
  A[Start] --> B[fetch_portfolio]
  B --> C[analyze_market]
  C --> D[graphrag_retrieve]
  D --> E[rl_decide]
  E --> F[validate_risk]
  F --> G{Risk Passed?}
  G -->|Yes| H[execute_trade]
  G -->|No| I[Reject Trade]
  H --> J[record_outcome]
  I --> J
  J --> K[End]
```

### Orchestrator Nodes

1.  **fetch_portfolio**: Retrieves user holdings and cash balance from the WDK-backed gateway.
2.  **analyze_market**: Fetches OHLCV candles from Kraken and computes technical features (RSI, Z-Score, Momentum).
3.  **graphrag_retrieve**: Performs two-tier retrieval:
    - **Neo4j Subgraph**: Extracts TransactConcept, TransactFormula, and TradingStrategy nodes from the knowledge graph.
    - **Web Scrapers**: Gathers live data from DeFiLlama (TVL), CoinGecko (prices), and Arxiv (quant papers).
4.  **rl_decide**: A Deep RL (PPO) agent makes a positioning decision [-1, 1] based on market features and KG context.
5.  **validate_risk**: Compares the proposed action against risk parameters (max position size, drawdown limits) stored in Neo4j.
6.  **execute_trade**: Submits the trade to Kraken via the gateway if validated.
7.  **record_outcome**: Creates a `Signal` node in Neo4j linking the strategy, market, and outcome for audit and future RL training.

## GraphRAG Retrieval

Two-tier retrieval backs every orchestrator decision:

- **Tier 1 — Static Neo4j subgraph**: queries TransactConcept, TransactFormula, TradingStrategy, and DeFiProtocol nodes plus `SOURCED_FROM` citations. Returns structured knowledge with PDF source references rendered as `[N]` notation.
- **Tier 2 — Live web scrapers** (`ai-core/ai_core/scrapers/`): `DeFiLlamaScraper`, `CoinGeckoScraper`, `ArxivScraper`.

---

## Progress states (WebSocket)

The frontend subscribes to `ws://<gateway>/ws/progress?optimizationId=...` and receives JSON messages with a `status` field. State flow:

```mermaid
stateDiagram-v2
  [*] --> FETCHING_DATA
  FETCHING_DATA --> COMPUTING_GRAPH
  COMPUTING_GRAPH --> GENERATING_PLAN
  GENERATING_PLAN --> WAITING_FOR_SIGNATURE
  WAITING_FOR_SIGNATURE --> BROADCASTING
  WAITING_FOR_SIGNATURE --> DONE
  BROADCASTING --> DONE
  GENERATING_PLAN --> DONE
  FETCHING_DATA --> FAILED
  COMPUTING_GRAPH --> FAILED
  GENERATING_PLAN --> FAILED
  DONE --> [*]
  FAILED --> [*]
```

| Status | Meaning |
|--------|--------|
| `FETCHING_DATA` | Loading portfolio and graph data. |
| `COMPUTING_GRAPH` | Running graph queries and embeddings. |
| `GENERATING_PLAN` | Producing recommended actions. |
| `WAITING_FOR_SIGNATURE` | Plan ready; awaiting user approval. |
| `BROADCASTING` | Transaction(s) submitted. |
| `DONE` | Optimization and (if any) execution complete. |
| `FAILED` | Error; see `error` field in message. |

The frontend uses the `useOptimizationProgress(optimizationId)` hook to subscribe and show live progress and results.

---

## Quantitative Strategy Layer (TRANSACT)

TRANSACT is **mandatory**: the AI core will not start without `TRANSACT_API_URL` set. It provides quant-grade metrics that enrich every optimization plan.

### Strategy selection logic

| Market Condition | Preferred Strategy | Why |
|-----------------|-------------------|-----|
| Low correlation, fat-tailed returns | **HRP** (Hierarchical Risk Parity) | Avoids inversion of ill-conditioned covariance; robust to DeFi return instability |
| Sufficient return history (≥60 periods) | **MVO** (Mean-Variance Optimization) | Classic efficient frontier; use only when data is reliable |
| High-confidence edge on a protocol | **Kelly Criterion** | Maximizes log-growth given known edge; size ½-Kelly to cap drawdown |
| Correlated macro views (e.g. ETH bull/bear) | **Black-Litterman** | Blends market-implied returns with analyst views |

### Risk metrics produced per optimization run

| Metric | Endpoint | Meaning |
|--------|----------|---------|
| **VaR (95%)** | `POST /risk/var` | Maximum expected loss over 1 day at 95% confidence |
| **Expected Shortfall** | `POST /risk/var` | Average loss in worst 5% of scenarios |
| **Return / Volatility / Skew / Kurtosis** | `POST /portfolio/moments` | Full distributional characterization of proposed allocation |
| **Funding Rate** | `GET /funding` | Perp/spot funding rate for delta-neutral strategies |
| **On-chain Factors** | `GET /factors/onchain` | TVL, utilization, liquidation risk per protocol |

### MEV and execution risk

The gateway adds execution-layer risk assessment to every recommended action:

- **Swap simulation** (`POST /v2/simulate/swap`): Uniswap V2 `getAmountsOut` via `eth_call`; computes slippage vs oracle reference; flags high-MEV paths
- **MEV protection routing** (`POST /v2/protect/submit`): routes to Flashbots Protect or MEV Blocker based on `protection` parameter
- **Bundle simulation** (`POST /v2/simulate/bundle`): uses Flashbots `eth_callBundle` for real simulation (not a stub)
- **Oracle reconciliation**: Pyth Hermes + CoinGecko cross-validation; rejects if deviation >2%

### Resilience

The Neo4j optimizer query is wrapped with `@circuit_breaker(name="neo4j_optimizer", failure_threshold=5, recovery_timeout=60)` and `@retry_with_backoff(max_attempts=2)` from `ai-core/ai_core/resilience.py`. The circuit breaker transitions through CLOSED → OPEN → HALF_OPEN states; a `CircuitOpenError` is raised when open and returned as a graceful error to the caller. HTTP calls to external services use `async_retry_with_backoff`.
