use pyo3::prelude::*;
use rand::rng;
use rand::Rng;
use rand_distr::StandardNormal;

/// Monte Carlo pricing of a European call option
#[pyfunction]
pub fn price_call_mc(
    s: f64,
    k: f64,
    tau: f64,
    r: f64,
    sigma: f64,
    sims: usize
) -> PyResult<f64> {
    let mut rng = rng();
    let drift = (r - 0.5 * sigma * sigma) * tau;
    let vol = sigma * tau.sqrt();
    let mut sum = 0.0;
    for _ in 0..sims {
        let z: f64 = rng.sample(StandardNormal);
        let st = s * (drift + vol * z).exp();
        sum += (st - k).max(0.0);
    }
    let mean = sum / sims as f64;
    Ok((-r * tau).exp() * mean)
}

/// Monte Carlo pricing of a European put option via put-call parity
#[pyfunction]
pub fn price_put_mc(
    s: f64,
    k: f64,
    tau: f64,
    r: f64,
    sigma: f64,
    sims: usize
) -> PyResult<f64> {
    // Compute call price then apply P = C - S + K * exp(-r * tau)
    let c = price_call_mc(s, k, tau, r, sigma, sims)?;
    let p = c - s + k * (-r * tau).exp();
    Ok(p)
}
