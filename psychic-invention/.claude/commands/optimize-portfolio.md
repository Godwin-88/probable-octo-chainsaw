# Optimize a Portfolio

Run portfolio optimisation via the local API. Supports MVO, Black-Litterman, Risk Parity, HRP, and Kelly.

## Quick Reference — Endpoints

| Method | Endpoint | Required Inputs |
|--------|---------|----------------|
| MVO (single point) | `POST /optimize/mvo` | covariance, expected_returns, [target_return] |
| Efficient Frontier | `POST /optimize/mvo/frontier` | covariance, expected_returns, [n_points] |
| Black-Litterman | `POST /optimize/blm` | covariance, market_weights, P, Q, [tau, risk_aversion] |
| Risk Parity (ERC) | `POST /optimize/risk-parity` | covariance |
| HRP | `POST /optimize/hrp` | covariance |
| Kelly (single) | `POST /optimize/kelly/single` | p, q, [a, b] |
| Kelly (multi) | `POST /optimize/kelly` | returns (T×N matrix) |

## Example API Calls

### MVO — Tangency Portfolio
```bash
curl -s -X POST http://localhost:8000/optimize/mvo \
  -H "Content-Type: application/json" \
  -d '{
    "covariance": [[0.04, 0.01], [0.01, 0.09]],
    "expected_returns": [0.08, 0.12],
    "risk_free_rate": 0.03,
    "long_only": true
  }' | python -m json.tool
```

### Efficient Frontier (50 points)
```bash
curl -s -X POST http://localhost:8000/optimize/mvo/frontier \
  -H "Content-Type: application/json" \
  -d '{
    "covariance": [[0.04, 0.01], [0.01, 0.09]],
    "expected_returns": [0.08, 0.12],
    "risk_free_rate": 0.03,
    "n_points": 50
  }' | python -m json.tool
```

### Black-Litterman (1 view: asset 0 outperforms asset 1 by 2%)
```bash
curl -s -X POST http://localhost:8000/optimize/blm \
  -H "Content-Type: application/json" \
  -d '{
    "covariance": [[0.04, 0.01], [0.01, 0.09]],
    "market_weights": [0.6, 0.4],
    "P": [[1, -1]],
    "Q": [0.02],
    "tau": 0.05,
    "risk_aversion": 2.5,
    "risk_free_rate": 0.03
  }' | python -m json.tool
```

### Risk Parity (Equal Risk Contribution)
```bash
curl -s -X POST http://localhost:8000/optimize/risk-parity \
  -H "Content-Type: application/json" \
  -d '{
    "covariance": [[0.04, 0.01], [0.01, 0.09]]
  }' | python -m json.tool
```

### HRP
```bash
curl -s -X POST http://localhost:8000/optimize/hrp \
  -H "Content-Type: application/json" \
  -d '{
    "covariance": [[0.04, 0.01, 0.005], [0.01, 0.09, 0.02], [0.005, 0.02, 0.0625]]
  }' | python -m json.tool
```

## Steps

1. Confirm the backend is running.
2. Determine which method the user wants. If unclear, ask.
3. Build the request payload from the user's data.
4. Execute the API call.
5. Interpret and display the results:
   - Weights (as percentages)
   - Expected return and volatility (annualised)
   - Sharpe ratio
   - For Risk Parity: risk contributions per asset
   - For HRP: dendrogram sort order
6. Highlight if any weights are near 0 (effectively excluded assets).

## Conventions

- `covariance` is an N×N matrix (annualised).
- `expected_returns` is an N-length vector (annualised).
- `long_only: true` enforces no short selling.
- MVO requires **cvxpy** installed in the venv (`pip install cvxpy`).
