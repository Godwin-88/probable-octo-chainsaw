# Add a New API Endpoint

Guide for adding a new FastAPI endpoint to the Derivatives Pricing Engine.

## Checklist

Gather the following before writing any code:
- **Route path** (e.g., `/portfolio/sharpe`)
- **HTTP method** (usually `POST` for computation, `GET` for retrieval)
- **Which router file** it belongs to:
  - Pricing (BS/FFT/Heston) → `app/main.py`
  - Portfolio / Risk / Optimizer / Blotter / Scenarios / Factors → `app/transact_routes.py`
  - Market data → `app/market_data_endpoints.py`
- **Input fields** and their types
- **Output fields**

## Implementation Steps

### 1. Define Request and Response models

Add a Pydantic `BaseModel` in the target route file:

```python
from pydantic import BaseModel
from typing import List, Optional

class MyRequest(BaseModel):
    returns: List[List[float]]   # T × N matrix
    weights: List[float]         # N weights
    risk_free_rate: float = 0.0  # optional with default
```

### 2. Add the route handler

```python
@router.post("/portfolio/my-metric")
def post_my_metric(req: MyRequest):
    """One-line docstring shown in Swagger UI."""
    try:
        result = my_domain_function(
            np.array(req.returns),
            np.array(req.weights),
            req.risk_free_rate,
        )
        return {"my_metric": result, "model": "descriptive-name"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### 3. Implement domain logic (if new)

Add the computation to the appropriate module under `app/`:
- Portfolio metrics → `app/portfolio_engine.py`
- Risk metrics → `app/risk/var_engine.py`
- Optimizers → `app/optimizer/`
- Scenario analysis → `app/scenarios/`
- Factor models → `app/factors/`

Use `numpy` arrays for all numerical work.

### 4. Write a test

Add a test in `app/tests/`:

```python
# app/tests/test_my_metric.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_my_metric_basic():
    response = client.post("/portfolio/my-metric", json={
        "returns": [[0.01, -0.02], [0.03, 0.01]],
        "weights": [0.6, 0.4],
    })
    assert response.status_code == 200
    data = response.json()
    assert "my_metric" in data
```

### 5. Verify in Swagger

Restart the backend and check `http://localhost:8000/docs` for the new endpoint.

## Conventions

- Always wrap the body in `try/except Exception as e → HTTPException(400)`.
- Return a `model` or `method` field in the response to identify the computation used.
- Use `Optional` with sensible defaults to keep the API backwards-compatible.
- Document the endpoint with a one-line docstring (shown in Swagger).
