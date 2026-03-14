use pyo3::prelude::*;
use rustfft::{FftPlanner, num_complex::Complex};
use std::f64::consts::PI;

/// Black–Scholes characteristic function of log S_T
fn bs_log_cf(
    u: Complex<f64>,
    s: f64,
    r: f64,
    sigma: f64,
    tau: f64,
) -> Complex<f64> {
    let mu = s.ln() + (r - 0.5 * sigma * sigma) * tau;
    
    // φ(u) = exp(i*u*μ - 0.5*σ²*τ*u²)
    let exponent = Complex::new(0.0, 1.0) * u * mu - 0.5 * sigma * sigma * tau * u * u;
    exponent.exp()
}

/// Carr–Madan ψ(v) integrand for calls:
/// ψ(v) = e^{-r τ} * φ(v - i(α+1)) / (α² + α - v² + i(2α+1)v)
fn psi_carr_madan(
    v: f64,
    alpha: f64,
    s: f64,
    r: f64,
    sigma: f64,
    tau: f64,
) -> Complex<f64> {
    let u = Complex::new(v, -(alpha + 1.0)); // v - i(α+1)

    let cf = bs_log_cf(u, s, r, sigma, tau);
    let discount = (-r * tau).exp();

    // denominator: (iv + α + 1)(iv + α) = -v² + i*v*(2α+1) + α(α+1)
    let denom_re = alpha * (alpha + 1.0) - v * v;
    let denom_im = v * (2.0 * alpha + 1.0);
    let denom = Complex::new(denom_re, denom_im);

    discount * cf / denom
}

/// FFT‐based Carr–Madan pricing for European calls
#[pyfunction]
pub fn price_call_fft(
    s: f64,
    k_min: f64,    // leftmost log-strike
    delta_v: f64,  // frequency step (η)
    delta_k: f64,  // log-strike step (λ), should satisfy λ = 2π / (n * η)
    n: usize,      // number of grid points (power of 2)
    tau: f64,
    r: f64,
    sigma: f64,
    alpha: f64,    // damping factor
) -> PyResult<Vec<f64>> {
    // Optional sanity check (comment out if you don't want a panic on mismatch)
    // let implied_delta_k = 2.0 * PI / (n as f64 * delta_v);
    // assert!(
    //     (implied_delta_k - delta_k).abs() < 1e-10,
    //     "delta_k should be 2π / (n * delta_v)"
    // );

    let mut planner = FftPlanner::<f64>::new();
    let fft = planner.plan_fft_forward(n);

    // Build ψ(v) with correct weights and phase shift for k_min
    let mut input: Vec<Complex<f64>> = Vec::with_capacity(n);
    for m in 0..n {
        let v_m = m as f64 * delta_v;

        let psi = psi_carr_madan(v_m, alpha, s, r, sigma, tau);

        // Trapezoidal rule in v: Δv with 0.5 weight at m=0
        let weight = if m == 0 { 0.5 * delta_v } else { delta_v };

        // Phase shift to anchor grid at k_min: exp(-i v_m k_min)
        let phase = Complex::new(0.0, -v_m * k_min).exp();

        input.push(psi * phase * weight);
    }

    // FFT in-place
    let mut output = input.clone();
    fft.process(&mut output);

    // Recover call prices on log-strike grid k_j = k_min + j * delta_k
    let mut prices = Vec::with_capacity(n);
    for j in 0..n {
        let k_j = k_min + j as f64 * delta_k;

        // C(k_j) = e^{-α k_j} / π * Re(FFT_result_j)
        let c_j = ((-alpha * k_j).exp() / PI) * output[j].re;

        // Numerical noise can give tiny negatives; clip to 0
        prices.push(c_j.max(0.0));
    }

    Ok(prices)
}

/// FFT‐based put pricing via put–call parity
#[pyfunction]
pub fn price_put_fft(
    s: f64,
    k_min: f64,
    delta_v: f64,
    delta_k: f64,
    n: usize,
    tau: f64,
    r: f64,
    sigma: f64,
    alpha: f64,
) -> PyResult<Vec<f64>> {
    // First compute calls via FFT
    let calls = price_call_fft(s, k_min, delta_v, delta_k, n, tau, r, sigma, alpha)?;

    let discount = (-r * tau).exp();
    let mut puts = Vec::with_capacity(n);

    for (j, &c) in calls.iter().enumerate() {
        let k_j = k_min + j as f64 * delta_k;
        let k_strike = k_j.exp();

        // Put–call parity: P(K) = C(K) - S_0 + K e^{-r τ}
        let p = c - s + k_strike * discount;

        // Clip very small negative values from numerical error
        puts.push(p.max(0.0));
    }

    Ok(puts)
}
