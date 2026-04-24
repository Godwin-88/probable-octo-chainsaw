# LangGraph Trading Orchestrator

The LangGraph Orchestrator is the **agentic trading harness** for the Dynamic Yield Optimization Agent. It replaces the deprecated OpenClaw/ReAct loop with a structured state-machine based on **LangGraph**, integrating **GraphRAG** and **Deep Reinforcement Learning** for trade execution.

## Architecture

The orchestrator follows a sequential state machine flow:

1.  **fetch_portfolio**: Retrieves current holdings and PnL (integrates with WDK via gateway).
2.  **analyze_market**: Fetches OHLCV data from Kraken and performs feature engineering (RSI, Momentum, Volatility).
3.  **graphrag_retrieve**: Queries Neo4j for relevant quant concepts, formulas, and strategies with PDF citations.
4.  **rl_decide**: Uses a Deep RL (PPO) agent to determine the optimal position size [-1, 1].
5.  **validate_risk**: Validates the proposed trade against risk parameters stored in Neo4j (max position size, drawdown limits).
6.  **execute_trade**: Submits the order to Kraken if all checks pass.
7.  **record_outcome**: Logs the signal and outcome to Neo4j for future RL training and audit trails.

## Components

### 1. LangGraph State Machine
Defined in `ai-core/ai_core/orchestrator/graph.py`. It manages the transitions between nodes and ensures the trading pipeline is followed strictly.

### 2. GraphRAG Integration
The orchestrator uses the `graphrag_retrieve` node to ground its decisions in the knowledge graph. It retrieves:
- **TransactConcept**: Definitions of financial theories being applied.
- **TransactFormula**: Mathematical representations of the strategy.
- **KnowledgeSource**: Citations to original research papers (PDFs).

### 3. Deep RL (PPO Agent)
A Proximal Policy Optimization (PPO) agent trained on historical market data. It takes engineered features and portfolio state as input and outputs a continuous trading signal.

## API Reference

The orchestrator runs on port **8001** by default.

### Execute Full Pipeline
`POST /api/trade/execute`
Runs the complete flow from portfolio fetch to trade execution.

**Request Body:**
```json
{
  "market": "XBT/USD",
  "strategy_name": "KrakenMomentum"
}
```

### Generate Signal Only
`POST /api/trade/signal`
Runs the flow up to the RL decision and risk validation, but does not execute the trade. Returns the rationale and GraphRAG context.

## Setup & Configuration

### Environment Variables
- `ORCHESTRATOR_PORT`: Port for the orchestrator API (default: 8001).
- `NEO4J_URI`: Bolt URL for Neo4j.
- `KRAKEN_GATEWAY_URL`: URL to the gateway's Kraken API routes.

### Docker Service
The orchestrator is included in the `deploy/docker-compose.yml`:

```yaml
orchestrator:
  build:
    context: ..
    dockerfile: deploy/Dockerfile.ai-core-unified
  container_name: yield-agent-orchestrator
  ports:
    - "8001:8001"
  environment:
    NEO4J_URI: bolt://neo4j:7687
    KRAKEN_GATEWAY_URL: http://gateway-wdk:3000/api/kraken
  command: ["python", "-m", "ai_core.orchestrator.server"]
```

## Comparison with OpenClaw (Deprecated)

| Feature | OpenClaw (Deprecated) | LangGraph Orchestrator |
|---------|-----------------------|-------------------------|
| **Logic** | ReAct Loop (LLM-driven) | Structured State Machine |
| **Reliability** | Non-deterministic, loops | Deterministic, sequential |
| **Intelligence** | Prompt-based | Deep RL + GraphRAG |
| **Risk Control** | Ad-hoc | Explicit validation node |
| **Audit Trail** | Chat logs | Neo4j Signal nodes |
