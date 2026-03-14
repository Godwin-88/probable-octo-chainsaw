# Price an Option

Quick option pricing via the local API. Use this when the user asks to price an option or verify model output.

## Usage

Ask the user (or infer from context):
- **Option type**: call or put
- **Model**: `bs` (Black-Scholes), `fft` (optimised FFT), or `heston`
- **Parameters**: S (spot), K (strike), τ (time to expiry in years), r (risk-free rate), σ (volatility)

## API Calls

### Black-Scholes Call
```bash
curl -s -X POST http://localhost:8000/price/call/bs \
  -H "Content-Type: application/json" \
  -d '{"s": 100, "k": 105, "tau": 0.25, "r": 0.05, "sigma": 0.20}' | python -m json.tool
```

### Black-Scholes Put
```bash
curl -s -X POST http://localhost:8000/price/put/bs \
  -H "Content-Type: application/json" \
  -d '{"s": 100, "k": 105, "tau": 0.25, "r": 0.05, "sigma": 0.20}' | python -m json.tool
```

### FFT-Optimised Call
```bash
curl -s -X POST http://localhost:8000/price/call/fft-optimized \
  -H "Content-Type: application/json" \
  -d '{"s": 100, "k": 105, "tau": 0.25, "r": 0.05, "sigma": 0.20}' | python -m json.tool
```

### Heston Model Call
```bash
curl -s -X POST http://localhost:8000/price/call/heston \
  -H "Content-Type: application/json" \
  -d '{
    "s": 100, "k": 105, "tau": 0.25, "r": 0.05,
    "v0": 0.04, "theta": 0.04, "kappa": 2.0, "sigma_v": 0.3, "rho": -0.7
  }' | python -m json.tool
```

### Greeks (call, Black-Scholes)
```bash
curl -s -X POST http://localhost:8000/greeks/call \
  -H "Content-Type: application/json" \
  -d '{"s": 100, "k": 105, "tau": 0.25, "r": 0.05, "sigma": 0.20, "model": "bs"}' | python -m json.tool
```

### Model Comparison
```bash
curl -s -X POST http://localhost:8000/compare/models \
  -H "Content-Type: application/json" \
  -d '{"s": 100, "k": 105, "tau": 0.25, "r": 0.05, "sigma": 0.20}' | python -m json.tool
```

## Steps

1. Make sure the backend is running (`make dev-api` or `./start-local.sh`).
2. Choose the right endpoint based on the requested model.
3. Execute the curl command with the user's parameters.
4. Parse and display the result clearly.
5. If the Heston model is requested, validate the Feller condition first:
   - Feller: `2 × κ × θ > σᵥ²` must hold for mean reversion.
   - If violated, suggest adjusted parameter values.

## Parameter Constraints

| Parameter | Constraint | Typical Range |
|-----------|-----------|---------------|
| s (spot) | > 0 | 50 – 500 |
| k (strike) | > 0 | 80% – 120% of spot |
| tau | > 0 | 1/52 (1 week) – 2.0 (2 years) |
| r (risk-free) | any | 0.01 – 0.08 |
| sigma (vol) | > 0 | 0.10 – 0.60 |
| v0, theta (Heston) | > 0 | 0.01 – 0.25 |
| kappa (Heston) | > 0 | 0.5 – 5.0 |
| sigma_v (Heston) | > 0 | 0.1 – 1.0 |
| rho (Heston) | (-1, 1) | -0.9 – 0.0 (typically negative) |
