# Web3-native v2 API Reference

This document describes the **gateway `/v2`** REST + WebSocket surface used by the QuantiNova Web3-native TRANSACT UI.

## Base URLs

- **REST**: `http://localhost:3000/v2`
- **WebSocket**: `ws://localhost:3000/v2/ws/...`

## REST endpoints

### Chains (dynamic discovery)

#### `GET /v2/chains`

Returns the runtime chain registry used by the frontend and agent UI to populate the chain selector dynamically.

Response (example):

```json
{
  "chains": [
    { "id": "ethereum", "name": "Ethereum", "kind": "evm", "chainId": "1", "configured": true }
  ]
}
```

### Universe snapshot (Data Universe ingestion)

#### `GET /v2/universe/snapshot`

Builds a single structured snapshot for UI + agent consumption.

Query params:
- `chains`: comma-separated chain slugs (default: all supported)
- `assets`: comma-separated token queries (symbols/names/addresses; default: `UNIVERSE_DEFAULT_ASSETS` or `ETH,BTC,USDC,USDT`)
- `quote`: quote symbol (default: `USDT`)
- `include`: comma-separated sections (supported: `tokens`, `prices`, `positions`; default: `tokens,prices`)
- `wallet`: optional; required if `include` contains `positions`

Example:

`GET /v2/universe/snapshot?chains=ethereum,polygon&assets=ETH,USDC&quote=USDT&include=tokens,prices`

### Positions

#### `GET /v2/positions/:walletOrAgentId?chain=ethereum`

Returns a v2-shaped positions response (currently backed by the gateway portfolio service).

Response (example):

```json
{
  "walletOrAgentId": "0x...",
  "positions": [
    { "chainId": "ethereum", "assetSymbol": "USDC", "amount": "123", "amountUsd": 123.0, "type": "erc20" }
  ],
  "totalUsd": 123.0
}
```

### Oracle prices

#### `GET /v2/oracles/price/:tokenPair?chain=ethereum&dex=uniswap`

Returns an off-chain oracle price for a pair (e.g. `ETH-USDT`).

Current implementation:
- Resolves both legs of `tokenPair` dynamically (no hardcoded pair mappings).
- Oracle priority (current): **Pyth Hermes** (fresh ≤30s) → **CoinGecko** fallback.
- If both Pyth and CoinGecko are available, reconciles them and rejects if deviation >2%.

Response:

```json
{ "price": 1234.56, "timestamp": "2026-03-11T00:00:00.000Z", "source": "coingecko" }
```

### Pool state (EVM)

#### `GET /v2/pool/:poolAddress?chain=ethereum`

Fetches pool state via EVM `eth_call`.

- Tries Uniswap V2 `getReserves()` first (returns `reserve0`, `reserve1`)
- Then tries Uniswap V3 `slot0()` (returns `sqrtPriceX96`, `tick`)

### Swap simulation (EVM)

#### `POST /v2/simulate/swap`

Body:

```json
{ "amountIn": "100000000000000000", "path": ["0xWETH", "0xUSDC"], "chain": "ethereum" }
```

Response:

```json
{ "expectedOut": "123456", "slippage": 0.01, "mevRiskScore": 0.2 }
```

Notes:
- Uses an EVM `eth_call` to a configured router’s `getAmountsOut`.
  - Router address is read from `UNISWAP_V2_ROUTER_<CHAIN>` env var (e.g. `UNISWAP_V2_ROUTER_ETHEREUM`).
- `slippage` is computed vs an oracle reference derived from the actual `path` tokens (no hardcoded `ETH-USDT`).

### MEV-protected submit (EVM)

#### `POST /v2/protect/submit`

Body:

```json
{
  "signedTxHex": "0x...",
  "chain": "ethereum",
  "protection": "flashbots-protect",
  "walletOrSessionId": "0x..."
}
```

Behavior:
- If `protection` is provided, routes submission to relay RPC (Flashbots Protect or MEV Blocker).
- Otherwise routes to the chain’s default public RPC.
- Appends `txHash` to Redis-backed activity for the given `walletOrSessionId`.

### Opportunities

#### `GET /v2/opportunities?limit=20&chain=ethereum`

Returns:

```json
{ "opportunities": [ ... ] }
```

Current implementation:
- Proxies the unified Python gateway (ai-core HTTP) at `AI_CORE_HTTP_URL`:
  - `GET {AI_CORE_HTTP_URL}/assets/search?q=all&type=opportunity&count=<limit>`

### Bundles (EVM / Flashbots)

#### `POST /v2/simulate/bundle`

Body (either key supported):

```json
{ "signedTxs": ["0x...", "0x..."], "chain": "ethereum" }
```

Response:

```json
{ "simulatedPnl": 0, "adversarialOrderings": [] }
```

Current implementation uses Flashbots `eth_callBundle` for real simulation (not a stub).

#### `POST /v2/submit/bundle`

Body:

```json
{ "signedTxs": ["0x...", "0x..."], "chain": "ethereum" }
```

Response:

```json
{ "bundleHash": "0x...", "ok": true }
```

Notes:
- Uses Flashbots relay (`FLASHBOTS_RELAY_URL` default `https://relay.flashbots.net`).
- Ethereum mainnet only.

### Activity (tx audit trail)

#### `GET /v2/activity?wallet=<id>&limit=20&chain=ethereum`

Response:

```json
{
  "items": [
    { "txHash": "0x...", "chain": "ethereum", "timestamp": "...", "explorerUrl": "https://etherscan.io/tx/0x..." }
  ]
}
```

### Agent autonomy

#### `POST /v2/agent/toggle`

Body:

```json
{ "autonomous": true, "sessionOrWalletId": "0x..." }
```

Response:

```json
{ "ok": true, "autonomous": true }
```

Behavior:
- Persists autonomy state in Redis with a TTL (used for UI sync and future execution gating).

## WebSocket endpoints

### `ws://localhost:3000/v2/ws/opportunities`

- Sends initial opportunities payload and refreshes every 60 s.

### `ws://localhost:3000/v2/ws/positions/<walletOrAgentId>`

- Sends live position updates; polls every 30 s.

### `ws://localhost:3000/v2/ws/market`

- Sends live token prices for pairs configured in `MARKET_PRICE_PAIRS` (e.g. `ETH-USDT,BTC-USDT`).
- Polls oracle prices every 15 s and also subscribes to the `market:update` Redis pubsub channel for push updates.
- Used by the `LiveRates` frontend component for real-time price display.

### `ws://localhost:3000/v2/ws/agent/<agentId>`

- Sends `agent_status` payload (includes `autonomous` state if available); supports toggling autonomous mode.

## Legacy `/api` endpoints (gateway)

These are the original REST routes used by the React frontend and proxied by the Yield-Agent MCP server.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/portfolio?walletAddress=0x...&chainId=ethereum` | WDK read-only portfolio (native + ERC-20). Cached 120 s in Redis. |
| `GET` | `/api/auth/nonce?walletAddress=0x...` | Get nonce for Sign-In with Wallet. |
| `POST` | `/api/auth/verify` | Verify wallet signature; returns session token. Body: `{ walletAddress, signature, message }`. |
| `POST` | `/api/optimize` | Start optimization. Body: `{ walletAddress, constraints }`. Returns `{ optimizationId }` (202). |
| `GET` | `/ws/progress?optimizationId=...` | WebSocket stream of optimization progress. |
| `GET` | `/api/execute/plan/:optimizationId` | Cached optimization plan from Redis. |
| `POST` | `/api/execute/signed` | Broadcast signed tx hex. Body: `{ signedTxHex, chainId? }`. Non-custodial. |
| `POST` | `/api/agent/chat` | Proxy to OpenClaw when `OPENCLAW_GATEWAY_URL` is set. Body: `{ message, sessionId? }`. |
| `GET` | `/api/transact/*` | Proxy to ai-core TRANSACT HTTP (`AI_CORE_HTTP_URL`). Used by frontend quant workspaces. |

## ai-core / TRANSACT HTTP (port 8000)

These are served by the unified Python container (gRPC :50051 + FastAPI :8000). Accessible directly on port 8000 or via gateway proxy at `/api/transact/*`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/risk/var` | VaR + Expected Shortfall. Body: `{ returns, weights, alpha, portfolio_value, horizon_days }`. |
| `POST` | `/portfolio/moments` | Return, vol, skew, kurtosis. Body: `{ returns, weights, market_returns? }`. |
| `POST` | `/agents/explain` | Formula explanation from knowledge graph. Body: `{ type: "formula", target: "Sharpe Ratio" }`. |
| `POST` | `/agents/chat` | ReAct agent chat. Body: `{ message, session_id? }`. Returns `{ reply, session_id, intent }`. |
| `POST` | `/agents/chat/stream` | SSE streaming ReAct chat. Body: `{ message, session_id? }`. Response header `X-Session-Id`. SSE events: `intent`, `thinking`, `action`, `observation`, `final_answer`, `done`. |
| `GET` | `/agents/metrics` | In-process telemetry: counters, latency histograms (p99/mean), GraphRAG hit rate. |
| `POST` | `/agents/feedback` | RLHF feedback. Body: `{ session_id, rating (1–5), correction? }`. Stores to Neo4j. |
| `POST` | `/agents/conversations/save` | Save full conversation session for DRL. Body: `{ session_id, messages }`. |
| `GET` | `/agents/menus/{menu_id}/concepts` | List TransactConcept nodes linked to a Menu node in Neo4j. |
| `GET` | `/agents/health` | Agent health check: Neo4j + LLM availability. |
| `GET` | `/funding?symbol=ETH&include_series=true` | Perpetual/spot funding rate data. |
| `GET` | `/factors/onchain?chain=ethereum&protocol=&limit=30` | On-chain risk factors (TVL, utilization, liquidation risk). |
| `GET` | `/assets/search?q=all&type=opportunity&count=20` | Opportunity search (proxied by `/v2/opportunities`). |
| `POST` | `/scenarios/mev-bundle` | MEV bundle adversarial ordering simulation. |
| `POST` | `/scenarios/oracle-spike` | Oracle price spike stress test. |
| `POST` | `/scenarios/monte-carlo` | Monte Carlo multi-chain path simulation. |
| `GET` | `/cache/health` | Redis cache health. |

## MCP server (port 3001)

The Yield-Agent MCP server exposes these gateway and TRANSACT endpoints as JSON-RPC 2.0 tools for OpenClaw. **9 tools total.** See [docs/OPENCLAW_INTEGRATION.md](OPENCLAW_INTEGRATION.md) for full tool schemas and usage.

| MCP Tool | Underlying Endpoint |
|----------|-------------------|
| `get_portfolio` | `GET /api/portfolio` |
| `run_optimization` | `POST /api/optimize` |
| `get_optimization_plan` | `GET /api/execute/plan/:id` |
| `broadcast_signed_tx` | `POST /api/execute/signed` |
| `quant_var` | `POST /risk/var` (TRANSACT) |
| `quant_moments` | `POST /portfolio/moments` (TRANSACT) |
| `explain_formula` | `POST /agents/explain` (TRANSACT) |
| `explain_concept` | Neo4j `TransactConcept` lookup (TRANSACT knowledge graph) |
| `explain_strategy` | Neo4j `TradingStrategy` lookup (TRANSACT knowledge graph) |

