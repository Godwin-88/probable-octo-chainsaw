# Setup Guide: Agentic Economy on Arc

This guide covers one-command Docker setup, all environment variables, and the specific configurations for **Circle Programmable Wallets** and **USDC Nanopayments**.

---

## Prerequisites

- **Docker Engine 24+** and **Docker Compose v2+**
- **Circle Developer Account** (For API Key and Programmable Wallets)
- **Node.js 20+** and **Python 3.12+** (For local development)
- At least one EVM RPC URL (Ethereum, Base, or Arc Testnet)

---

## One-Command Docker Run

```bash
# Clone the repository
git clone <repo-url>
cd probable-octo-chainsaw

# Configure environment
cp .env.example .env 
# REQUIRED: Edit .env and add CIRCLE_API_KEY and RPC_URL_ETHEREUM

# Launch all 10+ services
docker compose -f deploy/docker-compose.yml up --build
```

### Infrastructure Map
- **Neo4j**: Knowledge Graph + Reputation (ERC-8004)
- **Redis**: Fast cache for micro-payment state
- **Gateway**: Orchestration of WDK, Kraken, and AI Core
- **AI Core**: Quant Engine + Curator Agent
- **Frontend**: Sovereign Admin Control Center

---

## Service Endpoints

| Service | Port | Endpoint / Purpose |
|---------|------|--------------------|
| **Admin UI** | 5173 | http://localhost:5173/transact/admin |
| **API Gateway** | 3000 | http://localhost:3000/health |
| **AI Core (Quant)** | 8000 | http://localhost:8000/risk/var |
| **Agent gRPC** | 50051 | Internal M2M Communication |
| **Neo4j Browser** | 7474 | http://localhost:7474 (user: neo4j) |

---

## Environment Variables (Circle Focus)

| Variable | Description |
|----------|-------------|
| `CIRCLE_API_KEY` | Your API key from Circle Developer Console. |
| `CIRCLE_MANAGER_WALLET_ID` | Wallet ID for the Manager Agent (PW). |
| `CIRCLE_CURATOR_WALLET_ID` | Wallet ID for the Curator Agent (PW). |
| `RPC_URL_ETHEREUM` | Primary RPC for portfolio reads. |
| `NEO4J_PASSWORD` | Database password (default: `yield-agent-dev`). |

---

## Running the Agentic Demo

To generate the 60+ transactions required for hackathon evidence:

1. Ensure the backend is running via Docker.
2. Execute the workflow script:
   ```bash
   python scripts/hackathon_demo_runner.py
   ```
3. Check `hackathon_tx_evidence.json` for the generated transaction hashes on Arc.

---

## Dynamic Knowledge Ingestion

Agents can be paid to ingest new data. Test the endpoint via curl:

```bash
curl -X POST http://localhost:8000/agents/ingest \
  -H "Content-Type: application/json" \
  -H "X402-Payment: pay_demo_123" \
  -d '{"query": "Stochastic Volatility Models"}'
```

---

## Troubleshooting

### Transaction Settlement
If transactions fail, ensure your **Circle Gas Station** is configured in the console to sponsor transactions for your `walletId`s.

### Knowledge Graph Permissions
If the seeder fails, ensure the `knowledge_base/import` directory is readable:
```bash
sudo chmod -R +rx psychic-invention/knowledge_base/import/
```

### Neo4j Seeding
The graph seeder runs automatically. You can verify reputation scores in the Neo4j Browser:
```cypher
MATCH (a:Agent)-[:CITES]->(k:KnowledgeSource)
RETURN a.name, a.reputation_score, k.title;
```
