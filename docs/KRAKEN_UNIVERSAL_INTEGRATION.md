# Kraken Integration - Universal Execution Provider

**Architecture:** Pluggable CEX Execution Layer for probable-octo-chainsaw  
**Status:** Ready for Deployment  
**Last Updated:** March 31, 2026

---

## Design Principles

This integration treats **Kraken as one execution venue among many** - not a hardcoded silo. The architecture leverages probable-octo-chainsaw's existing WDK (Web3 Data Kit) infrastructure for universal asset access.

### Core Principles

1. **Universal Asset Support** - Any trading pair, not hardcoded assets
2. **Pluggable Execution** - Kraken is one of many potential execution venues
3. **Dynamic Discovery** - Markets and strategies created on-demand
4. **WDK Integration** - Reuses existing oracle, portfolio, and asset resolution
5. **Sandbox-First** - Safe by default, paper trading enabled

---

## Architecture Overview

```
probable-octo-chainsaw/
├── gateway-wdk/
│   └── src/
│       ├── services/
│       │   ├── kraken.ts              ← Kraken CLI wrapper (universal pairs)
│       │   ├── oracle.ts              ← Universal price oracle (Pyth + CoinGecko)
│       │   ├── portfolio.ts           ← Multi-chain portfolio (WDK)
│       │   └── tokenResolver.ts       ← Canonical asset resolution
│       │
│       ├── routes/
│       │   ├── kraken.ts              ← Kraken REST API (pluggable venue)
│       │   └── v2.ts                  ← Universal API (chains, universe, positions)
│       │
│       └── index.ts                   ← Mounts /api/kraken routes
│
├── ai-core/
│   └── ai_core/
│       ├── kraken_signals.py          ← Signal generator (any pair, dynamic strategies)
│       ├── scrapers/
│       │   ├── coingecko.py           ← Price data
│       │   └── defillama.py           ← DeFi protocols
│       └── graphrag.py                ← Knowledge retrieval
│
└── ai-core/cypher/
    └── kraken_knowledge.cypher        ← Schema-only (no hardcoded assets)
```

---

## Key Differences from Original Design

| Original (Hardcoded) | New (Universal) |
|---------------------|-----------------|
| Fixed pairs: XBT/USD, ETH/USD | Any pair: SOL/USDT, MATIC/EUR, etc. |
| Static Neo4j markets | Dynamic market creation on first use |
| Kraken as standalone | Kraken as pluggable execution venue |
| Separate API structure | Integrated with v2 universal API |
| Asset-specific logic | Universal asset resolution via WDK |

---

## Quick Start

### Step 1: Verify Kraken CLI

```bash
# Check installation
kraken --version

# Test API connection (sandbox mode)
kraken balance
```

If not installed:
```bash
git clone https://github.com/krakenfx/kraken-cli.git
cd kraken-cli && cargo build --release
export PATH="$PATH:$(pwd)/target/release"
```

### Step 2: Set Environment Variables

Add to `/home/ed/projects/probable-octo-chainsaw/.env`:

```bash
# Kraken CLI (sandbox by default)
KRAKEN_API_KEY=<your-api-key>
KRAKEN_API_SECRET=<your-api-secret>
KRAKEN_SANDBOX=true

# Kraken Gateway (already configured in gateway-wdk)
KRAKEN_GATEWAY_URL=http://localhost:3000/api/kraken

# Neo4j (existing)
NEO4J_URI=bolt://localhost:7688
NEO4J_PASSWORD=yield-agent-dev

# WDK Oracle (existing)
PYTH_HTTP_URL=https://hermes.pyth.network
```

### Step 3: Run Neo4j Schema Script

1. Start Neo4j:
   ```bash
   cd /home/ed/projects/probable-octo-chainsaw
   docker compose up -d neo4j
   ```

2. Open Neo4j Browser: http://localhost:7474
   - Username: `neo4j`
   - Password: `yield-agent-dev`

3. Run Cypher script:
   ```cypher
   :source /home/ed/projects/probable-octo-chainsaw/ai-core/cypher/kraken_knowledge.cypher
   ```

### Step 4: Restart Gateway

```bash
cd /home/ed/projects/probable-octo-chainsaw
docker compose restart gateway-wdk
```

---

## Testing

### Test Universal Pair Support

```bash
# Any trading pair works - not just hardcoded ones
curl http://localhost:3000/api/kraken/market/ticker/XBT/USD
curl http://localhost:3000/api/kraken/market/ticker/ETH/USDT
curl http://localhost:3000/api/kraken/market/ticker/SOL/EUR
curl http://localhost:3000/api/kraken/market/ticker/MATIC/USD
```

### Test OHLC Data

```bash
# Get candlestick data for any pair
curl "http://localhost:3000/api/kraken/market/ohlc/SOL/USDT?interval=60"
```

### Test Signal Generator (Python)

```bash
cd /home/ed/projects/probable-octo-chainsaw/ai-core
source venv/bin/activate

# Test with any pair
python -c "
from ai_core.kraken_signals import KrakenSignalGenerator

generator = KrakenSignalGenerator()

# Universal pair support - not hardcoded
pairs = ['XBT/USD', 'ETH/USDT', 'SOL/EUR', 'MATIC/USD']

for pair in pairs:
    signal = generator.generate_signal(pair, 'KrakenMomentum')
    if signal:
        print(f'{pair}: direction={signal.direction}, strength={signal.strength:.3f}')
"
```

### Test Signal Execution

```bash
# Execute a signal (sandbox mode)
curl -X POST http://localhost:3000/api/kraken/signal/execute \
  -H "Content-Type: application/json" \
  -d '{
    "market": "XBT/USD",
    "direction": 1,
    "strength": 0.75,
    "volume": 0.001
  }'
```

### Verify Neo4j Integration

```cypher
// Check Kraken exchange entity
MATCH (k:Exchange {name: 'Kraken'})
RETURN k.name, k.universalPairs, k.features;

// Check available strategies (not tied to specific assets)
MATCH (s:TradingStrategy {exchange: 'Kraken'})
RETURN s.name, s.type, s.universal, s.applicableMarkets;

// Check signals (markets created dynamically)
MATCH (sig:Signal)
RETURN sig.market, sig.strategy_id, sig.direction, sig.strength
ORDER BY sig.timestamp DESC
LIMIT 10;
```

---

## API Reference

### Market Data (Universal Pairs)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/kraken/health` | GET | Health check |
| `/api/kraken/pairs` | GET | Get supported trading pairs |
| `/api/kraken/balance` | GET | Account balances |
| `/api/kraken/market/ticker/:pair` | GET | Ticker for any pair |
| `/api/kraken/market/ohlc/:pair` | GET | OHLC for any pair |
| `/api/kraken/market/trades/:pair` | GET | Recent trades |

### Trading

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/kraken/trades` | GET | Trade history |
| `/api/kraken/order` | POST | Place order (any pair) |
| `/api/kraken/order/:id` | DELETE | Cancel order |
| `/api/kraken/signal/execute` | POST | Execute AI signal |

### Pair Format Support

The integration accepts multiple pair formats:
- `XBT/USD` (standard)
- `BTC-USD` (dash-separated, auto-converts BTC→XBT)
- `ETHUSD` (no separator)
- `SOL/USDT` (stablecoin pairs)
- `MATIC/EUR` (fiat pairs)

---

## Neo4j Schema Design

### Exchange Entity (Execution Venue)

```cypher
(:Exchange {
    name: 'Kraken',
    type: 'centralized',
    universalPairs: true,
    api: 'kraken-cli',
    features: ['spot', 'futures', 'margin']
})
```

### Strategy Templates (Not Asset-Specific)

```cypher
(:TradingStrategy {
    name: 'KrakenMomentum',
    type: 'momentum',
    exchange: 'Kraken',
    universal: true,
    applicableMarkets: 'all',  // Works with ANY pair
    lookback: 252,
    threshold: 0.02
})
```

### Dynamic Market Creation

Markets are **created on-demand** when first used:

```cypher
// Auto-created when signal generated for new pair
(:Market {
    symbol: 'SOL/USDT',
    base: 'SOL',
    quote: 'USDT',
    exchange: 'Kraken',
    autoDiscovered: true
})-[:LISTED_ON]->(:Exchange {name: 'Kraken'})
```

### Signal Audit Trail

```cypher
(:Signal {
    market: 'SOL/USDT',  // Any pair
    direction: 1,
    strength: 0.75,
    strategy_id: 'KrakenMomentum',
    timestamp: '2026-03-31T...'
})
```

---

## Integration with WDK Ecosystem

### Oracle Integration

Kraken prices can be cross-validated with WDK's universal oracle:

```python
# Compare Kraken price with Pyth/CoinGecko
from ai_core.kraken_signals import KrakenSignalGenerator
import requests

generator = KrakenSignalGenerator()

# Get Kraken price
kraken_ticker = generator.get_market_data('XBT/USD')[-1]
kraken_price = float(kraken_ticker['close'])

# Get WDK oracle price
oracle_response = requests.get('http://localhost:3000/v2/oracles/price/XBT-USD')
oracle_price = oracle_response.json()['price']

# Compare
print(f"Kraken: ${kraken_price:,}")
print(f"Oracle: ${oracle_price:,}")
```

### Portfolio Integration

Kraken balances can be viewed alongside on-chain positions:

```bash
# Kraken balances
curl http://localhost:3000/api/kraken/balance

# On-chain positions (WDK)
curl http://localhost:3000/v2/positions/0xYourWalletAddress

# Unified view (future enhancement)
curl http://localhost:3000/v2/universe/snapshot?include=positions,prices
```

### Strategy Cross-Reference

Strategies in Neo4j can reference both on-chain and CEX opportunities:

```cypher
// Find all strategies (DeFi + CEX)
MATCH (s:TradingStrategy)
RETURN s.name, s.exchange, s.type, s.universal

// Results might include:
// - KrakenMomentum (CEX)
// - UniswapV3LP (DeFi)
// - AaveArbitrage (DeFi)
// - KrakenMeanReversion (CEX)
```

---

## Extending to Other Exchanges

The architecture supports adding more execution venues:

```
services/
├── kraken.ts          ← CEX execution (done)
├── binance.ts         ← CEX execution (future)
├── coinbase.ts        ← CEX execution (future)
└── uniswap.ts         ← DEX execution (via WDK)
```

Each venue implements the same interface:
- `getBalance()`
- `getTicker(pair)`
- `getOHLC(pair, interval)`
- `placeOrder(pair, type, volume, price?)`

---

## Security Considerations

### API Key Management

```bash
# Never commit .env to git
echo ".env" >> .gitignore

# Use separate keys for sandbox vs production
KRAKEN_SANDBOX_API_KEY=<sandbox-key>
KRAKEN_LIVE_API_KEY=<live-key>  # Only set when ready
```

### Sandbox Mode (Default)

```bash
# Always start in sandbox mode
KRAKEN_SANDBOX=true

# Test thoroughly before switching to live
KRAKEN_SANDBOX=false  # ⚠️ Real money!
```

### Position Limits

Default risk parameters (in Neo4j):
- Max 10% of portfolio per position
- Max 5 concurrent positions
- 5% stop loss, 10% take profit
- 3 consecutive losses → circuit breaker

---

## Troubleshooting

### Kraken CLI Not Found

```bash
# Add to PATH
export PATH="$PATH:/path/to/kraken-cli/target/release"

# Verify
kraken --version
```

### Pair Format Issues

```bash
# Kraken uses XBT for Bitcoin
# These are equivalent:
curl http://localhost:3000/api/kraken/market/ticker/XBT/USD
curl http://localhost:3000/api/kraken/market/ticker/BTC/USD  # Auto-converted
```

### Neo4j Market Not Found

Markets are created dynamically. If a market doesn't exist:
1. Generate a signal for that pair (creates Market node)
2. Or manually create:
   ```cypher
   MATCH (k:Exchange {name: 'Kraken'})
   CREATE (m:Market {
       symbol: 'SOL/USDT',
       base: 'SOL',
       quote: 'USDT',
       exchange: 'Kraken'
   })
   ON CREATE SET
       m.active = true,
       m.createdAt = datetime().epochMillis
   MERGE (m)-[:LISTED_ON]->(k)
   ```

### Signal Generator Returns None

- Check gateway is running: `curl http://localhost:3000/api/kraken/health`
- Verify pair is supported by Kraken
- Check you have enough OHLC data (lookback periods)

---

## Next Steps

### Phase 1: Testing (Current)
- [x] Universal pair support implemented
- [x] Dynamic Neo4j schema
- [ ] Test with multiple pairs
- [ ] Verify signal generation across assets

### Phase 2: ERC-8004 Integration
- [ ] Deploy identity contracts (Base Sepolia)
- [ ] Implement TradeIntent signing (EIP-712)
- [ ] Connect signals to Risk Router
- [ ] Record validation artifacts to Neo4j

### Phase 3: Multi-Venue Execution
- [ ] Add Binance/Coinbase support
- [ ] Smart order routing (best price across venues)
- [ ] Unified portfolio view (CEX + DeFi)

### Phase 4: Production Deployment
- [ ] Switch to live mode (carefully!)
- [ ] Add monitoring/alerting
- [ ] Implement position rebalancing
- [ ] Performance tracking (Sharpe, drawdown)

---

## Files in This Integration

| File | Purpose |
|------|---------|
| `gateway-wdk/src/services/kraken.ts` | Kraken CLI wrapper (universal pairs) |
| `gateway-wdk/src/routes/kraken.ts` | REST API routes |
| `ai-core/ai_core/kraken_signals.py` | Signal generator (any pair, dynamic strategies) |
| `ai-core/cypher/kraken_knowledge.cypher` | Neo4j schema (no hardcoded assets) |
| `docs/KRAKEN_UNIVERSAL_INTEGRATION.md` | This documentation |

---

**Estimated Setup Time:** 30-60 minutes  
**Risk Level:** Low (sandbox mode by default)  
**Universal Support:** ✅ Any trading pair, not hardcoded
