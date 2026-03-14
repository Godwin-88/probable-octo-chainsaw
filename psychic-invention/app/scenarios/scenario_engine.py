"""
Scenario Engine — M3 L4: custom/historical scenarios, probabilistic scenario optimization
E[r] = Σ p_k · r_k, Σ = Σ p_k · (r_k - E[r])(r_k - E[r])^T
"""

import numpy as np
from typing import List, Optional
from dataclasses import dataclass

try:
    import cvxpy as cp
    CVXPY_AVAILABLE = True
except ImportError:
    CVXPY_AVAILABLE = False

CRISIS_PERIODS = {
    "GFC_2008": {"return_shift": -0.37, "corr_shift": 0.5},
    "COVID_2020": {"return_shift": -0.20, "corr_shift": 0.3},
    "Quant_Melt_2007": {"return_shift": -0.10, "corr_shift": 0.4},
}

# MEV bundle: adverse slippage/latency shock in bps (converted to return)
MEV_BUNDLE_DEFAULT_BPS = 50


@dataclass
class ScenarioResult:
    stressed_returns: np.ndarray
    stressed_cov: np.ndarray
    portfolio_var: float
    portfolio_return: float


def apply_custom_scenario(
    returns: np.ndarray,
    weights: np.ndarray,
    return_shocks: Optional[np.ndarray] = None,
    vol_shocks: Optional[np.ndarray] = None,
    corr_shift: float = 0.0,
) -> ScenarioResult:
    """Apply user-defined shocks: r_i + Δr_i, σ_i*(1+Δσ_i), ρ_ij + Δρ."""
    mu = np.mean(returns, axis=0)
    cov = np.cov(returns.T, ddof=1)
    n = len(weights)

    if return_shocks is not None:
        mu = mu + np.asarray(return_shocks).flatten()[:n]
    if vol_shocks is not None:
        vol = np.sqrt(np.diag(cov))
        vol = vol * (1 + np.asarray(vol_shocks).flatten()[:n])
        D = np.diag(vol)
        corr = np.corrcoef(returns.T) if returns.shape[0] > 1 else np.eye(n)
        corr = np.clip(corr + corr_shift, -0.99, 0.99)
        np.fill_diagonal(corr, 1.0)
        cov = D @ corr @ D
    elif corr_shift != 0:
        corr = np.corrcoef(returns.T) if returns.shape[0] > 1 else np.eye(n)
        corr = np.clip(corr + corr_shift, -0.99, 0.99)
        np.fill_diagonal(corr, 1.0)
        vol = np.sqrt(np.diag(cov))
        cov = np.diag(vol) @ corr @ np.diag(vol)

    r_p = float(mu @ weights)
    var_p = float(weights @ cov @ weights)
    return ScenarioResult(stressed_returns=mu, stressed_cov=cov, portfolio_var=var_p, portfolio_return=r_p)


def probabilistic_scenario_optimization(
    scenario_returns: List[np.ndarray],
    scenario_probs: List[float],
    target_return: float,
    long_only: bool = True,
) -> np.ndarray:
    """
    min w^T Σ w  s.t.  w^T E[r] >= target, w^T ι = 1, w >= 0
    E[r] = Σ p_k · r_k, Σ = Σ p_k · (r_k - E[r])(r_k - E[r])^T
    """
    if not CVXPY_AVAILABLE:
        raise ImportError("cvxpy required")
    R = np.array(scenario_returns)
    p = np.array(scenario_probs)
    p = p / p.sum()
    mu = (R.T @ p).flatten()
    R_centered = R - mu
    cov = (R_centered.T @ (p.reshape(-1, 1) * R_centered))
    n = mu.shape[0]

    w = cp.Variable(n)
    objective = cp.Minimize(0.5 * cp.quad_form(w, cov))
    constraints = [cp.sum(w) == 1, mu @ w >= target_return]
    if long_only:
        constraints.append(w >= 0)

    prob = cp.Problem(objective, constraints)
    prob.solve(solver=cp.ECOS, verbose=False)
    if prob.status not in ["optimal", "optimal_inaccurate"]:
        raise ValueError(f"QP failed: {prob.status}")
    w_val = np.array(w.value).flatten()
    w_val = np.maximum(w_val, 0)
    return w_val / w_val.sum()


def apply_mev_bundle_scenario(
    returns: np.ndarray,
    weights: np.ndarray,
    slippage_bps: float = MEV_BUNDLE_DEFAULT_BPS,
    asset_indices: Optional[List[int]] = None,
) -> ScenarioResult:
    """MEV bundle scenario: apply adverse slippage (bps) as return shock to selected assets."""
    n = returns.shape[1]
    shock = -slippage_bps / 10_000.0
    return_shocks = np.zeros(n)
    if asset_indices is not None:
        for i in asset_indices:
            if 0 <= i < n:
                return_shocks[i] = shock
    else:
        return_shocks[:] = shock
    return apply_custom_scenario(returns, weights, return_shocks=return_shocks)


def apply_oracle_spike_scenario(
    returns: np.ndarray,
    weights: np.ndarray,
    asset_index: int = 0,
    vol_mult: float = 2.0,
) -> ScenarioResult:
    """Oracle spike scenario: multiply volatility for one asset (e.g. 2x vol for 1 day)."""
    n = returns.shape[1]
    vol_shocks = np.zeros(n)
    if 0 <= asset_index < n:
        vol_shocks[asset_index] = vol_mult - 1.0
    return apply_custom_scenario(returns, weights, vol_shocks=vol_shocks)
