"""
Monte Carlo Portfolio Simulation — M1 L2: multivariate paths, VaR/CVaR, optional multi-chain.
"""

import numpy as np
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field


@dataclass
class MCSimulationResult:
    terminal_wealth_mean: float
    terminal_wealth_std: float
    var_95: float
    var_99: float
    cvar_95: float
    cvar_99: float
    percentiles: dict
    per_chain: Optional[Dict[str, Any]] = None


def monte_carlo_portfolio(
    returns: np.ndarray,
    weights: np.ndarray,
    portfolio_value: float = 1.0,
    horizon_days: int = 1,
    n_paths: int = 100_000,
    use_t_dist: bool = False,
    df: float = 5.0,
    chain_returns: Optional[List[np.ndarray]] = None,
    chain_weights: Optional[List[np.ndarray]] = None,
) -> MCSimulationResult:
    """
    Simulate portfolio P&L over horizon. Returns distribution of terminal wealth.
    If chain_returns and chain_weights are provided, run MC per chain and aggregate (multi-chain).
    """
    per_chain = None
    if chain_returns is not None and chain_weights is not None and len(chain_returns) == len(chain_weights):
        n_chains = len(chain_returns)
        chain_vals = []
        for c in range(n_chains):
            r = np.asarray(chain_returns[c])
            w = np.asarray(chain_weights[c]).flatten()
            if r.ndim == 1:
                r = r.reshape(-1, 1)
            mu_c = np.mean(r, axis=0)
            cov_c = np.cov(r.T, ddof=1) if r.shape[0] > 1 and r.shape[1] > 0 else np.eye(len(w))
            port_mu_c = float(mu_c @ w)
            port_vol_c = float(np.sqrt(w @ cov_c @ w))
            if use_t_dist:
                from scipy.stats import t
                daily_c = t.rvs(df, loc=port_mu_c, scale=port_vol_c, size=(n_paths, horizon_days))
            else:
                daily_c = np.random.normal(port_mu_c, port_vol_c, (n_paths, horizon_days))
            term_c = portfolio_value / n_chains * np.prod(1 + daily_c, axis=1)
            chain_vals.append(term_c)
        terminal = np.sum(chain_vals, axis=0)
        per_chain = {
            f"chain_{i}": {
                "terminal_mean": float(np.mean(chain_vals[i])),
                "terminal_std": float(np.std(chain_vals[i])),
            }
            for i in range(n_chains)
        }
    else:
        mu = np.mean(returns, axis=0)
        cov = np.cov(returns.T, ddof=1)
        w = np.asarray(weights).flatten()
        port_mu = float(mu @ w)
        port_vol = float(np.sqrt(w @ cov @ w))
        if use_t_dist:
            from scipy.stats import t
            daily_ret = t.rvs(df, loc=port_mu, scale=port_vol, size=(n_paths, horizon_days))
        else:
            daily_ret = np.random.normal(port_mu, port_vol, (n_paths, horizon_days))
        terminal = portfolio_value * np.prod(1 + daily_ret, axis=1)

    losses = portfolio_value - terminal
    var_95 = float(np.percentile(losses, 95))
    var_99 = float(np.percentile(losses, 99))
    tail_95 = losses[losses >= var_95]
    tail_99 = losses[losses >= var_99]
    cvar_95 = float(np.mean(tail_95)) if len(tail_95) > 0 else var_95
    cvar_99 = float(np.mean(tail_99)) if len(tail_99) > 0 else var_99

    return MCSimulationResult(
        terminal_wealth_mean=float(np.mean(terminal)),
        terminal_wealth_std=float(np.std(terminal)),
        var_95=var_95,
        var_99=var_99,
        cvar_95=cvar_95,
        cvar_99=cvar_99,
        percentiles={5: float(np.percentile(terminal, 5)), 25: float(np.percentile(terminal, 25)), 50: float(np.percentile(terminal, 50)), 75: float(np.percentile(terminal, 75)), 95: float(np.percentile(terminal, 95))},
        per_chain=per_chain,
    )
