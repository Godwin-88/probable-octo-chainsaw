use pyo3::prelude::*;
use rayon::prelude::*;

// Pre-computed constants for optimization
const INV_SQRT_2PI: f64 = 0.3989422804014326779;

/// Greeks calculation result structure
#[derive(Debug, Clone, Copy)]
#[pyclass]
pub struct Greeks {
    #[pyo3(get)]
    pub delta: f64,
    #[pyo3(get)]
    pub gamma: f64,
    #[pyo3(get)]
    pub theta: f64,
    #[pyo3(get)]
    pub vega: f64,
    #[pyo3(get)]
    pub rho: f64,
}

#[pymethods]
impl Greeks {
    #[new]
    pub fn new(delta: f64, gamma: f64, theta: f64, vega: f64, rho: f64) -> Self {
        Greeks { delta, gamma, theta, vega, rho }
    }
    
    fn __repr__(&self) -> String {
        format!(
            "Greeks(delta={:.6}, gamma={:.6}, theta={:.6}, vega={:.6}, rho={:.6})",
            self.delta, self.gamma, self.theta, self.vega, self.rho
        )
    }
}

/// Fast normal PDF approximation for hot path performance
#[inline]
fn fast_normal_pdf(x: f64) -> f64 {
    if x.abs() > 8.0 {
        return 0.0;
    }
    INV_SQRT_2PI * (-0.5 * x * x).exp()
}

/// Fast normal CDF approximation for hot path performance
#[inline]
fn fast_normal_cdf(x: f64) -> f64 {
    if x < -8.0 {
        return 0.0;
    }
    if x > 8.0 {
        return 1.0;
    }
    
    let sign = if x >= 0.0 { 1.0 } else { -1.0 };
    let x_abs = x.abs();
    
    // Abramowitz and Stegun approximation
    let t = 1.0 / (1.0 + 0.2316419 * x_abs);
    let poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    let pdf = INV_SQRT_2PI * (-0.5 * x_abs * x_abs).exp();
    
    if sign > 0.0 {
        1.0 - pdf * poly
    } else {
        pdf * poly
    }
}

/// Greeks calculator with both analytical and numerical methods
pub struct GreeksCalculator;

impl GreeksCalculator {
    /// Calculate all Greeks using numerical finite difference method
    pub fn calculate_numerical_greeks(
        s: f64, k: f64, tau: f64, r: f64, sigma: f64,
        price_fn: impl Fn(f64, f64, f64, f64, f64) -> Result<f64, PyErr>
    ) -> PyResult<Greeks> {
        // Optimized finite difference parameters
        let ds = s * 0.005;  // 0.5% bump for spot (smaller for better accuracy)
        let dt = tau * 0.005; // 0.5% bump for time
        let dsigma = sigma * 0.005; // 0.5% bump for volatility
        let dr = 0.00005; // 0.5 basis point bump for rate
        
        // Base price
        let price_base = price_fn(s, k, tau, r, sigma)?;
        
        // Delta: ∂V/∂S (central difference)
        let price_up = price_fn(s + ds, k, tau, r, sigma)?;
        let price_down = price_fn(s - ds, k, tau, r, sigma)?;
        let delta = (price_up - price_down) / (2.0 * ds);
        
        // Gamma: ∂²V/∂S² (second derivative)
        let gamma = (price_up - 2.0 * price_base + price_down) / (ds * ds);
        
        // Theta: -∂V/∂t (negative because tau is time to expiration)
        let price_theta = price_fn(s, k, tau - dt, r, sigma)?;
        let theta = -(price_base - price_theta) / dt;
        
        // Vega: ∂V/∂σ
        let price_vega = price_fn(s, k, tau, r, sigma + dsigma)?;
        let vega = (price_vega - price_base) / dsigma;
        
        // Rho: ∂V/∂r
        let price_rho = price_fn(s, k, tau, r + dr, sigma)?;
        let rho = (price_rho - price_base) / dr;
        
        Ok(Greeks::new(delta, gamma, theta, vega, rho))
    }
    
    /// Calculate Black-Scholes Greeks analytically for improved accuracy and speed
    #[inline]
    pub fn calculate_bs_analytical_greeks(
        s: f64, k: f64, tau: f64, r: f64, sigma: f64, is_call: bool
    ) -> PyResult<Greeks> {
        // Pre-compute common terms for efficiency
        let sqrt_tau = tau.sqrt();
        let sigma_sqrt_tau = sigma * sqrt_tau;
        let log_s_k = (s / k).ln();
        let r_plus_half_sigma_sq_tau = (r + 0.5 * sigma * sigma) * tau;
        
        let d1 = (log_s_k + r_plus_half_sigma_sq_tau) / sigma_sqrt_tau;
        let d2 = d1 - sigma_sqrt_tau;
        
        // Use fast approximations for hot path performance
        let n_d1 = fast_normal_cdf(d1);
        let n_d2 = fast_normal_cdf(d2);
        let phi_d1 = fast_normal_pdf(d1);
        
        let discount = (-r * tau).exp();
        
        // Delta
        let delta = if is_call {
            n_d1
        } else {
            n_d1 - 1.0
        };
        
        // Gamma (same for calls and puts)
        let gamma = phi_d1 / (s * sigma_sqrt_tau);
        
        // Theta (daily)
        let theta_annual = if is_call {
            -(s * phi_d1 * sigma) / (2.0 * sqrt_tau) - r * k * discount * n_d2
        } else {
            -(s * phi_d1 * sigma) / (2.0 * sqrt_tau) + r * k * discount * (1.0 - n_d2)
        };
        let theta = theta_annual / 365.0; // Convert to daily theta
        
        // Vega (same for calls and puts, convert to percentage)
        let vega = (s * phi_d1 * sqrt_tau) / 100.0;
        
        // Rho (convert to percentage)
        let rho = if is_call {
            (k * tau * discount * n_d2) / 100.0
        } else {
            -(k * tau * discount * (1.0 - n_d2)) / 100.0
        };
        
        Ok(Greeks::new(delta, gamma, theta, vega, rho))
    }
    
    /// Batch Greeks calculation with parallel processing
    pub fn calculate_bs_greeks_batch(
        s: f64,
        strikes: &[f64],
        tau: f64,
        r: f64,
        sigma: f64,
        is_call: bool
    ) -> Vec<Greeks> {
        // Pre-compute common terms once for all strikes
        let sqrt_tau = tau.sqrt();
        let sigma_sqrt_tau = sigma * sqrt_tau;
        let r_plus_half_sigma_sq_tau = (r + 0.5 * sigma * sigma) * tau;
        let discount = (-r * tau).exp();
        let log_s = s.ln();
        
        // Use parallel processing for large batches
        if strikes.len() > 50 {
            strikes.par_iter()
                .map(|&k| {
                    if k <= 0.0 {
                        Greeks::new(0.0, 0.0, 0.0, 0.0, 0.0)
                    } else {
                        Self::calculate_single_bs_greeks_optimized(
                            s, k, log_s, sqrt_tau, sigma_sqrt_tau, 
                            r_plus_half_sigma_sq_tau, discount, is_call
                        )
                    }
                })
                .collect()
        } else {
            // Sequential processing for small batches
            strikes.iter()
                .map(|&k| {
                    if k <= 0.0 {
                        Greeks::new(0.0, 0.0, 0.0, 0.0, 0.0)
                    } else {
                        Self::calculate_single_bs_greeks_optimized(
                            s, k, log_s, sqrt_tau, sigma_sqrt_tau, 
                            r_plus_half_sigma_sq_tau, discount, is_call
                        )
                    }
                })
                .collect()
        }
    }
    
    /// Optimized single Greeks calculation with pre-computed terms
    #[inline]
    fn calculate_single_bs_greeks_optimized(
        s: f64,
        k: f64,
        log_s: f64,
        sqrt_tau: f64,
        sigma_sqrt_tau: f64,
        r_plus_half_sigma_sq_tau: f64,
        discount: f64,
        is_call: bool
    ) -> Greeks {
        let log_k = k.ln();
        let d1 = (log_s - log_k + r_plus_half_sigma_sq_tau) / sigma_sqrt_tau;
        let d2 = d1 - sigma_sqrt_tau;
        
        let n_d1 = fast_normal_cdf(d1);
        let n_d2 = fast_normal_cdf(d2);
        let phi_d1 = fast_normal_pdf(d1);
        
        // Delta
        let delta = if is_call { n_d1 } else { n_d1 - 1.0 };
        
        // Gamma
        let gamma = phi_d1 / (s * sigma_sqrt_tau);
        
        // Theta (daily)
        let theta_annual = if is_call {
            -(s * phi_d1 * sigma_sqrt_tau.powi(2) / sigma_sqrt_tau) / (2.0 * sqrt_tau) 
            - r_plus_half_sigma_sq_tau / sqrt_tau.powi(2) * k * discount * n_d2
        } else {
            -(s * phi_d1 * sigma_sqrt_tau.powi(2) / sigma_sqrt_tau) / (2.0 * sqrt_tau) 
            + r_plus_half_sigma_sq_tau / sqrt_tau.powi(2) * k * discount * (1.0 - n_d2)
        };
        let theta = theta_annual / 365.0;
        
        // Vega (percentage)
        let vega = (s * phi_d1 * sqrt_tau) / 100.0;
        
        // Rho (percentage)
        let rho = if is_call {
            (k * sqrt_tau.powi(2) * discount * n_d2) / 100.0
        } else {
            -(k * sqrt_tau.powi(2) * discount * (1.0 - n_d2)) / 100.0
        };
        
        Greeks::new(delta, gamma, theta, vega, rho)
    }
}

// Python interface functions
#[pyfunction]
pub fn calculate_bs_call_greeks(
    s: f64, k: f64, tau: f64, r: f64, sigma: f64
) -> PyResult<Greeks> {
    GreeksCalculator::calculate_bs_analytical_greeks(s, k, tau, r, sigma, true)
}

#[pyfunction]
pub fn calculate_bs_put_greeks(
    s: f64, k: f64, tau: f64, r: f64, sigma: f64
) -> PyResult<Greeks> {
    GreeksCalculator::calculate_bs_analytical_greeks(s, k, tau, r, sigma, false)
}

/// Batch Greeks calculation for calls
#[pyfunction]
pub fn calculate_bs_call_greeks_batch(
    s: f64,
    strikes: Vec<f64>,
    tau: f64,
    r: f64,
    sigma: f64
) -> PyResult<Vec<Greeks>> {
    Ok(GreeksCalculator::calculate_bs_greeks_batch(s, &strikes, tau, r, sigma, true))
}

/// Batch Greeks calculation for puts
#[pyfunction]
pub fn calculate_bs_put_greeks_batch(
    s: f64,
    strikes: Vec<f64>,
    tau: f64,
    r: f64,
    sigma: f64
) -> PyResult<Vec<Greeks>> {
    Ok(GreeksCalculator::calculate_bs_greeks_batch(s, &strikes, tau, r, sigma, false))
}

#[pyfunction]
pub fn calculate_numerical_call_greeks(
    s: f64, k: f64, tau: f64, r: f64, sigma: f64
) -> PyResult<Greeks> {
    use crate::black_scholes::price_call;
    GreeksCalculator::calculate_numerical_greeks(s, k, tau, r, sigma, price_call)
}

#[pyfunction]
pub fn calculate_numerical_put_greeks(
    s: f64, k: f64, tau: f64, r: f64, sigma: f64
) -> PyResult<Greeks> {
    use crate::black_scholes::price_put;
    GreeksCalculator::calculate_numerical_greeks(s, k, tau, r, sigma, price_put)
}

// FFT Greeks calculation
#[pyfunction]
pub fn calculate_fft_call_greeks(
    s: f64, k: f64, tau: f64, r: f64, sigma: f64
) -> PyResult<Greeks> {
    use crate::fft_pricing_enhanced::price_call_fft_optimized;
    GreeksCalculator::calculate_numerical_greeks(s, k, tau, r, sigma, price_call_fft_optimized)
}

#[pyfunction]
pub fn calculate_fft_put_greeks(
    s: f64, k: f64, tau: f64, r: f64, sigma: f64
) -> PyResult<Greeks> {
    use crate::fft_pricing_enhanced::price_put_fft_optimized;
    GreeksCalculator::calculate_numerical_greeks(s, k, tau, r, sigma, price_put_fft_optimized)
}

// Heston Greeks calculation
#[pyfunction]
pub fn calculate_heston_call_greeks(
    s: f64, k: f64, tau: f64, r: f64, v0: f64, theta: f64, kappa: f64, sigma_v: f64, rho: f64
) -> PyResult<Greeks> {
    use crate::heston::price_heston_call;
    let price_fn = |s: f64, k: f64, tau: f64, r: f64, _sigma: f64| -> Result<f64, PyErr> {
        price_heston_call(s, k, v0, r, kappa, theta, sigma_v, rho, tau)
    };
    GreeksCalculator::calculate_numerical_greeks(s, k, tau, r, v0.sqrt(), price_fn)
}

#[pyfunction]
pub fn calculate_heston_put_greeks(
    s: f64, k: f64, tau: f64, r: f64, v0: f64, theta: f64, kappa: f64, sigma_v: f64, rho: f64
) -> PyResult<Greeks> {
    use crate::heston::price_heston_put;
    let price_fn = |s: f64, k: f64, tau: f64, r: f64, _sigma: f64| -> Result<f64, PyErr> {
        price_heston_put(s, k, v0, r, kappa, theta, sigma_v, rho, tau)
    };
    GreeksCalculator::calculate_numerical_greeks(s, k, tau, r, v0.sqrt(), price_fn)
}

#[cfg(test)]
mod tests {
    use super::*;
    use approx::assert_relative_eq;

    #[test]
    fn test_bs_analytical_greeks_basic() {
        let s = 100.0;
        let k = 100.0;
        let tau = 1.0;
        let r = 0.05;
        let sigma = 0.2;
        
        let greeks = calculate_bs_call_greeks(s, k, tau, r, sigma).unwrap();
        
        // Basic sanity checks
        assert!(greeks.delta > 0.0 && greeks.delta < 1.0, "Call delta should be between 0 and 1");
        assert!(greeks.gamma > 0.0, "Gamma should be positive");
        assert!(greeks.vega > 0.0, "Vega should be positive");
        assert!(greeks.rho > 0.0, "Call rho should be positive");
    }
    
    #[test]
    fn test_numerical_vs_analytical_consistency() {
        let s = 100.0;
        let k = 100.0;
        let tau = 1.0;
        let r = 0.05;
        let sigma = 0.2;
        
        let analytical = calculate_bs_call_greeks(s, k, tau, r, sigma).unwrap();
        let numerical = calculate_numerical_call_greeks(s, k, tau, r, sigma).unwrap();
        
        // Should be close but not exact due to finite difference approximation
        assert_relative_eq!(analytical.delta, numerical.delta, epsilon = 0.01);
        assert_relative_eq!(analytical.gamma, numerical.gamma, epsilon = 0.05);
        assert_relative_eq!(analytical.vega, numerical.vega, epsilon = 0.01);
        assert_relative_eq!(analytical.rho, numerical.rho, epsilon = 0.01);
    }
}