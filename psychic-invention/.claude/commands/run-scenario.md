# Run a Portfolio Scenario or Stress Test

Apply historical crisis scenarios, custom shocks, or Monte Carlo simulation to a portfolio.

## Available Scenario Endpoints

| Type | Endpoint | Description |
|------|---------|-------------|
| Custom / Historical | `POST /scenarios/run` | Apply return/vol/correlation shocks |
| Probabilistic | `POST /scenarios/probabilistic` | Scenario-weighted optimisation |
| Monte Carlo | `POST /scenarios/monte-carlo` | Path simulation (Normal or t-dist) |
| Behavioural | `POST /scenarios/behavioral` | Prospect theory / herding VaR |

## Built-in Historical Crisis Scenarios

Pass `historical` as one of:
- `"GFC_2008"` — Global Financial Crisis 2008
- `"COVID_2020"` — COVID crash March 2020
- `"Quant_Melt_2007"` — Quant meltdown 2007

## Example API Calls

### Historical Stress Test (GFC 2008)
```bash
curl -s -X POST http://localhost:8000/scenarios/run \
  -H "Content-Type: application/json" \
  -d '{
    "returns": [[0.01, -0.02, 0.005], [0.03, 0.01, -0.01], [-0.05, -0.03, 0.02]],
    "weights": [0.5, 0.3, 0.2],
    "historical": "GFC_2008"
  }' | python -m json.tool
```

### Custom Shock (−5% return, +20% vol, +0.3 correlation shift)
```bash
curl -s -X POST http://localhost:8000/scenarios/run \
  -H "Content-Type: application/json" \
  -d '{
    "returns": [[0.01, -0.02, 0.005], [0.03, 0.01, -0.01]],
    "weights": [0.5, 0.3, 0.2],
    "return_shocks": [-0.05, -0.05, -0.05],
    "vol_shocks": [0.20, 0.20, 0.20],
    "corr_shift": 0.3
  }' | python -m json.tool
```

### Monte Carlo (100k paths, 1-day horizon)
```bash
curl -s -X POST http://localhost:8000/scenarios/monte-carlo \
  -H "Content-Type: application/json" \
  -d '{
    "returns": [[0.01, -0.02], [0.03, 0.01], [-0.01, 0.02]],
    "weights": [0.6, 0.4],
    "portfolio_value": 1000000,
    "horizon_days": 1,
    "n_paths": 100000,
    "use_t_dist": false
  }' | python -m json.tool
```

### Herding Stress VaR
```bash
curl -s -X POST http://localhost:8000/scenarios/behavioral \
  -H "Content-Type: application/json" \
  -d '{
    "returns": [[0.01, -0.02], [0.03, 0.01], [-0.01, 0.02]],
    "weights": [0.6, 0.4],
    "mode": "herding",
    "correlation_shift": 0.3,
    "alpha": 0.05,
    "portfolio_value": 1000000
  }' | python -m json.tool
```

## Steps

1. Confirm the backend is running.
2. Determine which scenario type the user wants.
3. Build the request with the portfolio `returns` (T×N matrix) and `weights`.
4. Execute and display:
   - Stressed portfolio return
   - Stressed portfolio volatility
   - For Monte Carlo: VaR at 95%/99%, CVaR, terminal wealth distribution
   - For herding: base vs stressed VaR comparison
5. Interpret the results in financial terms (e.g., "Under GFC conditions, the portfolio would lose X% with Y% annualised volatility").

## Data Format

- `returns`: T×N matrix — rows are time periods, columns are assets.
- `weights`: N-length vector summing to 1.0 (approximately).
- `portfolio_value`: dollar value for P&L interpretation.
- `horizon_days`: 1 for daily VaR, 10 for regulatory 10-day VaR.
