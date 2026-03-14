"""
HTTP client to TRANSACT FastAPI for risk/portfolio metrics.
Mandatory: enriches optimization plan with VaR and moments for quant-level DeFi yield strategies.
TRANSACT_API_URL must be set or the ai-core server will not start.
"""
from __future__ import annotations

import os
import urllib.request
import urllib.error
import json

TRANSACT_API_URL = os.environ.get("TRANSACT_API_URL", "").rstrip("/")
_TIMEOUT = 10.0


def _post(path: str, body: dict) -> dict | None:
    if not TRANSACT_API_URL:
        raise ValueError("TRANSACT_API_URL is required for quant-level strategies; not set.")
    url = f"{TRANSACT_API_URL}{path}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read().decode())
    except (urllib.error.URLError, OSError, json.JSONDecodeError, ValueError):
        return None


def fetch_var(
    returns: list[list[float]],
    weights: list[float] | None = None,
    alpha: float = 0.05,
    portfolio_value: float = 1.0,
) -> dict | None:
    """POST /risk/var. returns: T x N matrix."""
    if not returns:
        return None
    body = {
        "returns": returns,
        "weights": weights or [1.0 / len(returns[0])] * len(returns[0]) if returns[0] else None,
        "alpha": alpha,
        "horizon_days": 1,
        "portfolio_value": portfolio_value,
        "include_monte_carlo": False,
        "mc_simulations": 1000,
    }
    return _post("/risk/var", body)


def fetch_moments(returns: list[list[float]], weights: list[float] | None = None) -> dict | None:
    """POST /portfolio/moments. returns: N x T (asset returns per period) or T x N."""
    if not returns:
        return None
    # TRANSACT expects returns as list of lists; check transact_routes for exact shape
    n_periods = len(returns)
    n_assets = len(returns[0]) if returns[0] else 0
    w = weights or ([1.0 / n_assets] * n_assets if n_assets else [1.0])
    body = {"returns": returns, "weights": w, "market_returns": None}
    return _post("/portfolio/moments", body)


def enrich_explanation_with_transact(
    opportunity_apys: list[float],
    opportunity_risks: list[float],
    base_explanation: str,
) -> str:
    """
    Build a minimal returns matrix from APYs, call TRANSACT for VaR/moments, return enriched explanation.
    TRANSACT is mandatory; TRANSACT_API_URL must be set (validated at ai-core startup).
    """
    if not opportunity_apys:
        return base_explanation
    if not TRANSACT_API_URL:
        raise ValueError("TRANSACT_API_URL is required for quant-level strategies; not set.")

    import random
    random.seed(42)
    n_assets = len(opportunity_apys)
    n_days = 20
    returns = []
    for _ in range(n_days):
        row = []
        for i in range(n_assets):
            mu = (opportunity_apys[i] / 100.0) / 365 if i < len(opportunity_apys) else 0.01 / 365
            sigma = (opportunity_risks[i] / 10.0) if i < len(opportunity_risks) else 0.02
            row.append(mu + sigma * random.gauss(0, 1))
        returns.append(row)

    weights = [1.0 / n_assets] * n_assets
    var_result = fetch_var(returns, weights=weights, alpha=0.05)
    moments_result = fetch_moments(returns, weights=weights)

    parts = [base_explanation]
    if var_result and isinstance(var_result, dict):
        var_hist = var_result.get("var_historical") or var_result.get("var_95") or var_result.get("var")
        if var_hist is not None:
            parts.append(f" VaR 95% (TRANSACT): {float(var_hist):.4f}.")
    if moments_result and isinstance(moments_result, dict):
        vol = moments_result.get("portfolio_volatility")
        if vol is not None:
            parts.append(f" Portfolio vol (TRANSACT): {float(vol):.4f}.")
    return "".join(parts)
