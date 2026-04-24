"""
Actual Python implementation of pricing and Greeks.
Standardized for the psychic-invention app to fulfill USP requirements.
"""
import numpy as np
from scipy.stats import norm
from scipy.integrate import quad
from typing import List, NamedTuple, Optional, Tuple, Callable
import cmath

class Greeks(NamedTuple):
    delta: float
    gamma: float
    theta: float
    vega: float
    rho: float

    def __repr__(self) -> str:
        return f"Greeks(delta={self.delta:.6f}, gamma={self.gamma:.6f}, theta={self.theta:.6f}, vega={self.vega:.6f}, rho={self.rho:.6f})"

# --- Black-Scholes Implementation ---

def price_call(s: float, k: float, tau: float, r: float, sigma: float) -> float:
    if s <= 0 or k <= 0 or tau <= 0 or sigma <= 0:
        return 0.0
    d1 = (np.log(s / k) + (r + 0.5 * sigma**2) * tau) / (sigma * np.sqrt(tau))
    d2 = d1 - sigma * np.sqrt(tau)
    return s * norm.cdf(d1) - k * np.exp(-r * tau) * norm.cdf(d2)

def price_put(s: float, k: float, tau: float, r: float, sigma: float) -> float:
    if s <= 0 or k <= 0 or tau <= 0 or sigma <= 0:
        return 0.0
    d1 = (np.log(s / k) + (r + 0.5 * sigma**2) * tau) / (sigma * np.sqrt(tau))
    d2 = d1 - sigma * np.sqrt(tau)
    return k * np.exp(-r * tau) * norm.cdf(-d2) - s * norm.cdf(-d1)

# --- Greeks Analytical Implementation ---

def calculate_bs_call_greeks(s: float, k: float, tau: float, r: float, sigma: float) -> Greeks:
    if s <= 0 or k <= 0 or tau <= 0 or sigma <= 0:
        return Greeks(0, 0, 0, 0, 0)
    
    sqrt_tau = np.sqrt(tau)
    d1 = (np.log(s / k) + (r + 0.5 * sigma**2) * tau) / (sigma * sqrt_tau)
    d2 = d1 - sigma * sqrt_tau
    
    delta = norm.cdf(d1)
    gamma = norm.pdf(d1) / (s * sigma * sqrt_tau)
    vega = s * norm.pdf(d1) * sqrt_tau / 100.0
    theta = (-(s * norm.pdf(d1) * sigma) / (2 * sqrt_tau) - r * k * np.exp(-r * tau) * norm.cdf(d2)) / 365.0
    rho = (k * tau * np.exp(-r * tau) * norm.cdf(d2)) / 100.0
    
    return Greeks(delta, gamma, theta, vega, rho)

def calculate_bs_put_greeks(s: float, k: float, tau: float, r: float, sigma: float) -> Greeks:
    if s <= 0 or k <= 0 or tau <= 0 or sigma <= 0:
        return Greeks(0, 0, 0, 0, 0)
        
    sqrt_tau = np.sqrt(tau)
    d1 = (np.log(s / k) + (r + 0.5 * sigma**2) * tau) / (sigma * sqrt_tau)
    d2 = d1 - sigma * sqrt_tau
    
    delta = norm.cdf(d1) - 1.0
    gamma = norm.pdf(d1) / (s * sigma * sqrt_tau)
    vega = s * norm.pdf(d1) * sqrt_tau / 100.0
    theta = (-(s * norm.pdf(d1) * sigma) / (2 * sqrt_tau) + r * k * np.exp(-r * tau) * norm.cdf(-d2)) / 365.0
    rho = (-k * tau * np.exp(-r * tau) * norm.cdf(-d2)) / 100.0
    
    return Greeks(delta, gamma, theta, vega, rho)

# --- Numerical Greeks Helper ---

def calculate_numerical_greeks(s: float, k: float, tau: float, r: float, sigma: float, price_fn: Callable) -> Greeks:
    ds = s * 0.001
    dt = tau * 0.001
    dsigma = sigma * 0.001
    dr = 0.0001
    
    # Delta and Gamma
    p_up = price_fn(s + ds, k, tau, r, sigma)
    p_down = price_fn(s - ds, k, tau, r, sigma)
    p_base = price_fn(s, k, tau, r, sigma)
    
    delta = (p_up - p_down) / (2 * ds)
    gamma = (p_up - 2 * p_base + p_down) / (ds**2)
    
    # Theta
    p_t = price_fn(s, k, tau - dt, r, sigma)
    theta = -(p_base - p_t) / (dt * 365.0)
    
    # Vega
    p_v = price_fn(s, k, tau, r, sigma + dsigma)
    vega = (p_v - p_base) / (dsigma * 100.0)
    
    # Rho
    p_r = price_fn(s, k, tau, r + dr, sigma)
    rho = (p_r - p_base) / (dr * 100.0)
    
    return Greeks(delta, gamma, theta, vega, rho)

def calculate_numerical_call_greeks(s: float, k: float, tau: float, r: float, sigma: float) -> Greeks:
    return calculate_numerical_greeks(s, k, tau, r, sigma, price_call)

def calculate_numerical_put_greeks(s: float, k: float, tau: float, r: float, sigma: float) -> Greeks:
    return calculate_numerical_greeks(s, k, tau, r, sigma, price_put)

# --- Heston Implementation ---

def heston_cf(u, s, v0, r, kappa, theta, xi, rho, tau):
    i = complex(0, 1)
    d = cmath.sqrt((rho * xi * i * u - kappa)**2 + xi**2 * (i * u + u**2))
    g = (kappa - rho * xi * i * u - d) / (kappa - rho * xi * i * u + d)
    
    exp_dt = cmath.exp(-d * tau)
    c = (kappa * theta / xi**2) * ((kappa - rho * xi * i * u - d) * tau - 2 * cmath.log((1 - g * exp_dt) / (1 - g)))
    a = (v0 / xi**2) * (kappa - rho * xi * i * u - d) * (1 - exp_dt) / (1 - g * exp_dt)
    
    return cmath.exp(i * u * (np.log(s) + r * tau) + a + c)

def price_heston_call(s: float, k: float, v0: float, r: float, kappa: float, theta: float, sigma_v: float, rho: float, tau: float) -> float:
    if tau <= 0: return max(0.0, s - k)
    
    def integrand(u, p_num):
        if p_num == 1:
            cf = heston_cf(u - 1j, s, v0, r, kappa, theta, sigma_v, rho, tau) / heston_cf(-1j, s, v0, r, kappa, theta, sigma_v, rho, tau)
        else:
            cf = heston_cf(u, s, v0, r, kappa, theta, sigma_v, rho, tau)
        
        val = cmath.exp(-1j * u * np.log(k)) * cf / (1j * u)
        return val.real

    p1 = 0.5 + (1 / np.pi) * quad(integrand, 0, 100, args=(1,))[0]
    p2 = 0.5 + (1 / np.pi) * quad(integrand, 0, 100, args=(2,))[0]
    
    return s * p1 - k * np.exp(-r * tau) * p2

def price_heston_put(s: float, k: float, v0: float, r: float, kappa: float, theta: float, sigma_v: float, rho: float, tau: float) -> float:
    c = price_heston_call(s, k, v0, r, kappa, theta, sigma_v, rho, tau)
    return c - s + k * np.exp(-r * tau)

def validate_feller_condition_py(kappa: float, theta: float, sigma_v: float) -> bool:
    return 2 * kappa * theta > sigma_v**2

def calculate_heston_call_greeks(s: float, k: float, tau: float, r: float, v0: float, theta: float, kappa: float, sigma_v: float, rho: float) -> Greeks:
    def p_fn(s_in, k_in, tau_in, r_in, sig_in):
        return price_heston_call(s_in, k_in, v0, r_in, kappa, theta, sigma_v, rho, tau_in)
    return calculate_numerical_greeks(s, k, tau, r, np.sqrt(v0), p_fn)

def calculate_heston_put_greeks(s: float, k: float, tau: float, r: float, v0: float, theta: float, kappa: float, sigma_v: float, rho: float) -> Greeks:
    def p_fn(s_in, k_in, tau_in, r_in, sig_in):
        return price_heston_put(s_in, k_in, v0, r_in, kappa, theta, sigma_v, rho, tau_in)
    return calculate_numerical_greeks(s, k, tau, r, np.sqrt(v0), p_fn)

# --- FFT Implementation ---

def price_call_fft(s: float, k_min: float, delta_v: float, delta_k: float, n: int, tau: float, r: float, sigma: float, alpha: float) -> List[float]:
    def bs_log_cf(u):
        mu = np.log(s) + (r - 0.5 * sigma**2) * tau
        return np.exp(1j * u * mu - 0.5 * sigma**2 * tau * u**2)

    def psi(v):
        u = v - (alpha + 1) * 1j
        denom = (alpha + 1j * v) * (alpha + 1 + 1j * v)
        return np.exp(-r * tau) * bs_log_cf(u) / denom

    m = np.arange(n)
    v_m = m * delta_v
    weights = np.ones(n)
    weights[0] = 0.5
    
    input_vals = psi(v_m) * np.exp(-1j * v_m * k_min) * weights * delta_v
    fft_res = np.fft.fft(input_vals)
    
    k_j = k_min + np.arange(n) * delta_k
    prices = (np.exp(-alpha * k_j) / np.pi) * fft_res.real
    return np.maximum(prices, 0).tolist()

def price_put_fft(s: float, k_min: float, delta_v: float, delta_k: float, n: int, tau: float, r: float, sigma: float, alpha: float) -> List[float]:
    calls = price_call_fft(s, k_min, delta_v, delta_k, n, tau, r, sigma, alpha)
    discount = np.exp(-r * tau)
    strikes = np.exp(k_min + np.arange(n) * delta_k)
    return np.maximum(np.array(calls) - s + strikes * discount, 0).tolist()

def price_call_fft_optimized(s: float, k: float, tau: float, r: float, sigma: float) -> float:
    # Use a default grid and find closest strike
    n = 4096
    delta_v = 0.25
    delta_k = (2 * np.pi) / (n * delta_v)
    k_min = np.log(s) - (n // 2) * delta_k
    prices = price_call_fft(s, k_min, delta_v, delta_k, n, tau, r, sigma, alpha=1.5)
    idx = int((np.log(k) - k_min) / delta_k)
    if 0 <= idx < n: return prices[idx]
    return price_call(s, k, tau, r, sigma)

def price_put_fft_optimized(s: float, k: float, tau: float, r: float, sigma: float) -> float:
    n = 4096
    delta_v = 0.25
    delta_k = (2 * np.pi) / (n * delta_v)
    k_min = np.log(s) - (n // 2) * delta_k
    prices = price_put_fft(s, k_min, delta_v, delta_k, n, tau, r, sigma, alpha=1.5)
    idx = int((np.log(k) - k_min) / delta_k)
    if 0 <= idx < n: return prices[idx]
    return price_put(s, k, tau, r, sigma)

def calculate_fft_call_greeks(s: float, k: float, tau: float, r: float, sigma: float) -> Greeks:
    return calculate_numerical_greeks(s, k, tau, r, sigma, price_call_fft_optimized)

def calculate_fft_put_greeks(s: float, k: float, tau: float, r: float, sigma: float) -> Greeks:
    return calculate_numerical_greeks(s, k, tau, r, sigma, price_put_fft_optimized)

# Backwards compatibility / common interface
price_call_fft_enhanced = price_call_fft_optimized
price_put_fft_enhanced = price_put_fft_optimized
