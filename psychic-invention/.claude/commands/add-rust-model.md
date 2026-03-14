# Add a New Rust Pricing Model

Step-by-step guide for implementing a new quantitative model in the Rust core and exposing it to Python.

## When to Use Rust vs Python

- **Use Rust** for numerically intensive loops, Monte Carlo paths, FFT, or any computation called hundreds of times per second.
- **Use Python** for orchestration, data wrangling, or models that call SciPy/NumPy and don't need sub-millisecond speed.

## Steps

### 1. Create the Rust module

```rust
// src/my_model.rs
use pyo3::prelude::*;

/// Compute something expensive for a European option.
///
/// # Arguments
/// * `s` - Current spot price
/// * `k` - Strike price
/// * `tau` - Time to expiry (years)
/// * `r` - Risk-free rate (continuous compounding)
/// * `sigma` - Volatility (annualised)
#[pyfunction]
pub fn my_model_call(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> PyResult<f64> {
    // Validate inputs
    if s <= 0.0 || k <= 0.0 || tau <= 0.0 || sigma <= 0.0 {
        return Err(pyo3::exceptions::PyValueError::new_err(
            "s, k, tau, sigma must be positive",
        ));
    }

    // Core computation
    let price = 0.0; // replace with real logic
    Ok(price)
}
```

### 2. Register in `src/lib.rs`

```rust
// src/lib.rs
mod my_model;  // add at top

#[pymodule]
fn pricing_engine(_py: Python, m: &PyModule) -> PyResult<()> {
    // ... existing functions ...
    m.add_function(wrap_pyfunction!(my_model::my_model_call, m)?)?;
    Ok(())
}
```

### 3. Add to the mock (for CI without Rust)

```python
# pricing_engine_mock.py
def my_model_call(s, k, tau, r, sigma):
    """Mock fallback — returns Black-Scholes price."""
    return price_call(s, k, tau, r, sigma)
```

### 4. Build

```bash
maturin develop          # dev build
maturin develop --release  # production build
```

### 5. Add Python endpoint

In `app/main.py` (or `app/transact_routes.py`):

```python
@app.post("/price/call/my-model")
def price_call_my_model(request: OptionRequest):
    """My model call pricing."""
    try:
        price = pricing_engine.my_model_call(
            request.s, request.k, request.tau, request.r, request.sigma
        )
        return {"price": price, "model": "MyModel"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### 6. Write Rust unit tests

```rust
// src/my_model.rs (at the bottom)
#[cfg(test)]
mod tests {
    use super::*;
    use approx::assert_abs_diff_eq;

    #[test]
    fn test_put_call_parity() {
        // C - P = S - K * e^(-rT)
        let (s, k, tau, r, sigma) = (100.0, 100.0, 1.0, 0.05, 0.2);
        let call = my_model_call(s, k, tau, r, sigma).unwrap();
        // compare with known BS value
        assert_abs_diff_eq!(call, 10.4506, epsilon = 0.5);
    }
}
```

### 7. Write Python integration test

```python
# app/tests/test_my_model.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_my_model_call_basic():
    resp = client.post("/price/call/my-model", json={
        "s": 100, "k": 100, "tau": 1.0, "r": 0.05, "sigma": 0.20
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["price"] > 0
    assert data["model"] == "MyModel"
```

### 8. Run all checks

```bash
cargo test
pytest app/tests/test_my_model.py -v
```

## Numerical Patterns in This Codebase

- **Normal CDF**: use `statrs::distribution::Normal` (already a dependency).
- **Complex arithmetic**: use `num_complex::Complex`.
- **FFT**: use `rustfft::FftPlanner`.
- **Parallel loops**: use `rayon::prelude::*` with `.par_iter()`.
- **Random numbers**: use `rand` + `rand_distr::Normal`.
