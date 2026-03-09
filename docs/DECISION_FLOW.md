# Agent Decision Flow

The dynamic yield optimization agent uses a **Neo4j knowledge graph** as the logical layer: protocols, assets, opportunities, positions, and market context are stored as nodes and relationships. Decisions are driven by graph queries and (in full implementation) GraphRAG and RL policies.

## Data layer (Neo4j)

- **Nodes**: Chain, Protocol, Asset, Opportunity, MarketCondition, User, Position, OptimizationRun. Ingested content: Source, Section, Formula.
- **Relationships**: ON_CHAIN, SUPPORTS, OFFERS, DENOMINATED_IN, BRIDGED_TO, INFLUENCES, HOLDS, IN, FOR_RUN; for content: HAS_SECTION, HAS_FORMULA.
- Schema and indexes are defined in `ai-core/ai_core/neo4j_schema.py`; the indexer and AI core both read/write this graph.

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
3. **Reasoning**: AI core aggregates risk/APY along relationships, runs heuristic or RL policy, and produces a list of recommended actions (e.g. “deposit USDT into Aave on Ethereum”).
4. **Explainability**: Recommendations can be tied back to graph paths; GraphRAG or vector search over the graph can produce natural-language explanations.
5. **Execution**: User approves in the UI; client signs with WDK (or MetaMask); gateway broadcasts via `POST /api/execute/signed`. WebSocket streams status (e.g. WAITING_FOR_SIGNATURE, BROADCASTING, DONE).

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
