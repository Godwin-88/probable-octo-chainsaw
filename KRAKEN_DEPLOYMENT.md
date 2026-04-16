# Kraken CLI Integration - Deployment Checklist

**Status:** Files deployed ✅ | Configuration pending ⏳

---

## What Was Done

All Kraken integration files have been copied from `agentic-trading-systems` workspace:

| File | Destination |
|------|-------------|
| `services/kraken.ts` | `gateway-wdk/src/services/kraken.ts` |
| `routes/kraken.ts` | `gateway-wdk/src/routes/kraken.ts` |
| `kraken_signals.py` | `ai-core/ai_core/kraken_signals.py` |
| `kraken_knowledge.cypher` | `ai-core/cypher/kraken_knowledge.cypher` |
| `index.ts` | Updated to mount `/api/kraken` routes |

---

## Deployment Steps

### 1. Run Neo4j Cypher Script

```bash
# Start Neo4j if not running
cd /home/ed/projects/probable-octo-chainsaw
docker compose up -d neo4j

# Open Neo4j Browser
# URL: http://localhost:7474
# Username: neo4j
# Password: yield-agent-dev (or from .env)

# Run this command in Neo4j Browser:
:source /home/ed/projects/probable-octo-chainsaw/ai-core/cypher/kraken_knowledge.cypher
```

**Expected output:**
- 1 Exchange (Kraken)
- 4 Markets (XBT/USD, ETH/USD, XBT/EUR, ETH/EUR)
- 3 Trading Strategies
- 1 Risk Parameters config
- 5 Kraken Commands

---

### 2. Add Environment Variables

Edit `/home/ed/projects/probable-octo-chainsaw/.env`:

```bash
# Kraken CLI Configuration
KRAKEN_API_KEY=your-kraken-api-key
KRAKEN_API_SECRET=your-kraken-api-secret
KRAKEN_SANDBOX=true

# Kraken Gateway (for AI Core signal generator)
KRAKEN_GATEWAY_URL=http://localhost:3000/api/kraken
```

> **Note:** Get API keys from https://www.kraken.com/u/security/api

---

### 3. Restart Services

```bash
cd /home/ed/projects/probable-octo-chainsaw
docker compose restart gateway-wdk ai-core

# Verify services are running
docker compose ps
```

---

### 4. Test Integration

#### Test Gateway Endpoints

```bash
# Health check
curl http://localhost:3000/api/kraken/health

# Get balance (requires API keys)
curl http://localhost:3000/api/kraken/balance

# Get ticker
curl http://localhost:3000/api/kraken/market/ticker/XBT/USD

# Get OHLC data
curl http://localhost:3000/api/kraken/market/ohlc/XBT/USD?interval=60
```

#### Test AI Core Signal Generator

```bash
cd /home/ed/projects/probable-octo-chainsaw/ai-core
source venv/bin/activate
python -m ai_core.kraken_signals
```

**Expected output:**
```
[KrakenSignalGenerator] Initialized
  Gateway: http://localhost:3000/api/kraken
  Neo4j: bolt://localhost:7688
Generating signal for XBT/USD using KrakenMomentum
Signal generated: direction=1, strength=0.750
Signal recorded to Neo4j: XBT/USD

Signal: {'market': 'XBT/USD', 'direction': 1, 'strength': 0.75, ...}
```

---

### 5. Verify Neo4j Integration

Run in Neo4j Browser (http://localhost:7474):

```cypher
// Check Kraken entities
MATCH (k:Exchange {name: 'Kraken'})
OPTIONAL MATCH (k)<-[:LISTED_ON]-(m:Market)
OPTIONAL MATCH (s:TradingStrategy {exchange: 'Kraken'})
RETURN 
    k.name AS exchange,
    collect(DISTINCT m.symbol) AS markets,
    collect(DISTINCT s.name) AS strategies;
```

**Expected:**
```
exchange: "Kraken"
markets: ["XBT/USD", "ETH/USD", "XBT/EUR", "ETH/EUR"]
strategies: ["KrakenMomentum", "KrakenMeanReversion", "KrakenVolatilityBreakout"]
```

---

## API Reference

### Market Data Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/kraken/health` | GET | Health check |
| `/api/kraken/balance` | GET | Account balances |
| `/api/kraken/market/ticker/:pair` | GET | Ticker data |
| `/api/kraken/market/ohlc/:pair` | GET | OHLC data |
| `/api/kraken/market/trades/:pair` | GET | Recent trades |

### Trading Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/kraken/trades` | GET | Trade history |
| `/api/kraken/order` | POST | Place order |
| `/api/kraken/order/:id` | DELETE | Cancel order |

---

## Signal Generator Usage

```python
from ai_core.kraken_signals import KrakenSignalGenerator

# Initialize
generator = KrakenSignalGenerator()

# Generate signal
signal = generator.generate_signal('XBT/USD', 'KrakenMomentum')
print(signal.to_dict())

# Record to Neo4j
generator.record_signal_to_neo4j(signal)
```

---

## Troubleshooting

### Gateway won't start
```bash
docker compose logs gateway-wdk
```

### Kraken CLI not found
```bash
# Check if installed
kraken --version

# If not installed, see integration/kraken/README.md
```

### Signal generator returns None
- Check gateway is running: `curl http://localhost:3000/api/kraken/health`
- Verify Neo4j has strategy: `MATCH (s:TradingStrategy {name: 'KrakenMomentum'}) RETURN s`
- Check market data: `curl http://localhost:3000/api/kraken/market/ohlc/XBT/USD`

---

## Next Steps

After Kraken integration is working:

1. ✅ **Test paper trading** - Generate signals and execute in sandbox mode
2. ⏳ **Add ERC-8004 layer** - Deploy identity contracts, implement TradeIntent signing
3. ⏳ **Integrate Risk Router** - Add validation before execution
4. ⏳ **Build-in-public** - Share progress on Twitter/X

---

**Timeline:**
- Day 1 (Mar 30): ✅ Workspace + Integration files created
- Day 2 (Mar 31): ✅ Files deployed to probable-octo-chainsaw
- Day 2-3: ⏳ Deploy + test Kraken integration (YOU ARE HERE)
- Day 4-5: ERC-8004 contracts
- Day 6-10: Combined integration + optimization
- Day 11-12: Polish + submission prep
- Day 13: Submit

**On Track:** YES ✅
