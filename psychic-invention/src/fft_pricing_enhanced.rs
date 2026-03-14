use pyo3::prelude::*;
use rustfft::{FftPlanner, num_complex::Complex};
use std::f64::consts::PI;

/// FFT Parameter optimization structure
#[derive(Debug, Clone)]
pub struct FFTParameters {
    pub alpha: f64,      // Damping factor
    pub n: usize,        // Grid points (power of 2)
    pub delta_v: f64,    // Frequency step
    pub delta_k: f64,    // Log-strike step
    pub k_min: f64,      // Minimum log-strike
}

/// FFT Parameter optimization errors
#[derive(Debug)]
pub enum FFTError {
    NumericalInstability(String),
    InvalidParameters(String),
    ConvergenceError(String),
}

impl std::fmt::Display for FFTError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            FFTError::NumericalInstability(msg) => write!(f, "Numerical instability: {}", msg),
            FFTError::InvalidParameters(msg) => write!(f, "Invalid parameters: {}", msg),
            FFTError::ConvergenceError(msg) => write!(f, "Convergence error: {}", msg),
        }
    }
}

impl std::error::Error for FFTError {}

impl FFTParameters {
    /// Optimize FFT parameters for stability based on option characteristics
    pub fn optimize_for_stability(
        s: f64, 
        k: f64, 
        tau: f64, 
        sigma: f64
    ) -> Result<Self, FFTError> {
        // Validate input parameters
        if s <= 0.0 || k <= 0.0 || tau <= 0.0 || sigma <= 0.0 {
            return Err(FFTError::InvalidParameters(
                "All parameters must be positive".to_string()
            ));
        }
        
        if sigma > 2.0 {
            return Err(FFTError::InvalidParameters(
                "Volatility too high for stable FFT computation".to_string()
            ));
        }

        let moneyness = (s / k).ln();
        let log_k = k.ln();
        
        // Adaptive parameter selection based on option characteristics
        let alpha = if tau < 0.25 {
            // Short-term options need higher damping
            if moneyness.abs() > 0.3 { 2.0 } else { 1.75 }
        } else if tau > 2.0 {
            // Long-term options can use lower damping
            if moneyness.abs() > 0.2 { 1.25 } else { 1.0 }
        } else {
            // Medium-term options
            if moneyness.abs() > 0.2 { 1.5 } else { 1.25 }
        };

        // Grid size based on volatility and time to expiration
        let n = if sigma > 0.5 || tau > 1.5 {
            8192  // High volatility or long maturity needs finer grid
        } else if sigma < 0.15 && tau < 0.25 {
            2048  // Low volatility, short maturity can use coarser grid
        } else {
            4096  // Standard grid size
        };

        // Frequency step based on volatility
        let delta_v = if sigma > 0.4 {
            0.005  // High volatility needs finer frequency resolution
        } else if sigma < 0.15 {
            0.02   // Low volatility can use coarser resolution
        } else {
            0.01   // Standard resolution
        };

        let delta_k = 2.0 * PI / (n as f64 * delta_v);
        
        // Center the grid around the current log-strike
        let k_min = log_k - (n as f64 / 2.0) * delta_k;

        let params = FFTParameters {
            alpha,
            n,
            delta_v,
            delta_k,
            k_min,
        };

        // Validate the optimized parameters
        params.validate()?;
        
        Ok(params)
    }

    /// Validate parameter combination for numerical stability
    pub fn validate(&self) -> Result<(), FFTError> {
        // Check if n is a power of 2
        if !self.n.is_power_of_two() {
            return Err(FFTError::InvalidParameters(
                "Grid size n must be a power of 2".to_string()
            ));
        }

        // Check parameter relationships
        let expected_delta_k = 2.0 * PI / (self.n as f64 * self.delta_v);
        if (self.delta_k - expected_delta_k).abs() > 1e-10 {
            return Err(FFTError::InvalidParameters(
                "Parameter relationship delta_k = 2π/(n*delta_v) not satisfied".to_string()
            ));
        }

        // Check for potential numerical overflow conditions
        if self.alpha < 0.5 || self.alpha > 3.0 {
            return Err(FFTError::NumericalInstability(
                "Alpha parameter outside stable range [0.5, 3.0]".to_string()
            ));
        }

        if self.delta_v < 0.001 || self.delta_v > 0.1 {
            return Err(FFTError::NumericalInstability(
                "Delta_v parameter outside stable range [0.001, 0.1]".to_string()
            ));
        }

        Ok(())
    }
}

/// Enhanced Black–Scholes characteristic function with stability checks
fn bs_log_cf_enhanced(
    u: Complex<f64>,
    s: f64,
    r: f64,
    sigma: f64,
    tau: f64,
) -> Result<Complex<f64>, FFTError> {
    let mu = s.ln() + (r - 0.5 * sigma * sigma) * tau;
    
    // Check for potential overflow in the exponent
    let exponent = Complex::new(0.0, 1.0) * u * mu - 0.5 * sigma * sigma * tau * u * u;
    
    // Check if the real part of the exponent is too large
    if exponent.re > 700.0 {
        return Err(FFTError::NumericalInstability(
            format!("Characteristic function exponent too large: {}", exponent.re)
        ));
    }
    
    Ok(exponent.exp())
}

/// Enhanced Carr–Madan integrand with stability checks
fn psi_carr_madan_enhanced(
    v: f64,
    alpha: f64,
    s: f64,
    r: f64,
    sigma: f64,
    tau: f64,
) -> Result<Complex<f64>, FFTError> {
    let u = Complex::new(v, -(alpha + 1.0));

    let cf = bs_log_cf_enhanced(u, s, r, sigma, tau)?;
    let discount = (-r * tau).exp();

    // Enhanced denominator calculation with stability check
    let denom_re = alpha * (alpha + 1.0) - v * v;
    let denom_im = v * (2.0 * alpha + 1.0);
    let denom = Complex::new(denom_re, denom_im);

    // Check for near-zero denominator
    if denom.norm() < 1e-15 {
        return Err(FFTError::NumericalInstability(
            format!("Denominator too small at v={}: {}", v, denom.norm())
        ));
    }

    Ok(discount * cf / denom)
}

/// Enhanced FFT‐based Carr–Madan pricing for European calls with automatic parameter optimization
#[pyfunction]
pub fn price_call_fft_optimized(
    s: f64,
    k: f64,
    tau: f64,
    r: f64,
    sigma: f64,
) -> PyResult<f64> {
    // Optimize parameters automatically
    let params = FFTParameters::optimize_for_stability(s, k, tau, sigma)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;

    // Call the enhanced FFT pricing function
    price_call_fft_enhanced(s, k, params.k_min, params.delta_v, params.delta_k, 
                           params.n, tau, r, sigma, params.alpha)
}

/// Enhanced FFT‐based Carr–Madan pricing for European calls with stability checks
#[pyfunction]
pub fn price_call_fft_enhanced(
    s: f64,
    k: f64,
    k_min: f64,
    delta_v: f64,
    delta_k: f64,
    n: usize,
    tau: f64,
    r: f64,
    sigma: f64,
    alpha: f64,
) -> PyResult<f64> {
    // Create and validate parameters
    let params = FFTParameters {
        alpha,
        n,
        delta_v,
        delta_k,
        k_min,
    };
    
    params.validate()
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;

    let mut planner = FftPlanner::<f64>::new();
    let fft = planner.plan_fft_forward(n);

    // Build integrand with enhanced stability checks
    let mut input: Vec<Complex<f64>> = Vec::with_capacity(n);
    for m in 0..n {
        let v_m = m as f64 * delta_v;

        let psi = psi_carr_madan_enhanced(v_m, alpha, s, r, sigma, tau)
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;

        // Trapezoidal rule with proper weighting
        let weight = if m == 0 { 0.5 * delta_v } else { delta_v };

        // Phase shift for grid positioning
        let phase = Complex::new(0.0, -v_m * k_min).exp();

        input.push(psi * phase * weight);
    }

    // Perform FFT
    let mut output = input.clone();
    fft.process(&mut output);

    // Find the target strike in the grid
    let target_k = k.ln();
    let j_target = ((target_k - k_min) / delta_k).round() as usize;
    
    if j_target >= n {
        return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
            format!("Target strike {} outside grid range", k)
        ));
    }

    // Recover call price with enhanced calculation
    let k_j = k_min + j_target as f64 * delta_k;
    let price = ((-alpha * k_j).exp() / PI) * output[j_target].re;

    // Validate the result
    if price.is_nan() || price.is_infinite() {
        return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
            "FFT calculation resulted in invalid price"
        ));
    }

    // Return non-negative price (clip small negative values from numerical noise)
    Ok(price.max(0.0))
}

/// Enhanced FFT‐based put pricing with automatic parameter optimization
#[pyfunction]
pub fn price_put_fft_optimized(
    s: f64,
    k: f64,
    tau: f64,
    r: f64,
    sigma: f64,
) -> PyResult<f64> {
    // Get call price using optimized parameters
    let call_price = price_call_fft_optimized(s, k, tau, r, sigma)?;
    
    // Apply put-call parity
    let discount = (-r * tau).exp();
    let put_price = call_price - s + k * discount;
    
    // Return non-negative price
    Ok(put_price.max(0.0))
}

/// Enhanced FFT‐based put pricing with stability checks
#[pyfunction]
pub fn price_put_fft_enhanced(
    s: f64,
    k: f64,
    k_min: f64,
    delta_v: f64,
    delta_k: f64,
    n: usize,
    tau: f64,
    r: f64,
    sigma: f64,
    alpha: f64,
) -> PyResult<f64> {
    // Get call price using enhanced method
    let call_price = price_call_fft_enhanced(s, k, k_min, delta_v, delta_k, n, tau, r, sigma, alpha)?;
    
    // Apply put-call parity: P = C - S + K*exp(-r*tau)
    let discount = (-r * tau).exp();
    let put_price = call_price - s + k * discount;
    
    Ok(put_price.max(0.0))
}

#[cfg(test)]
mod tests {
    use super::*;
    use approx::assert_relative_eq;

    #[test]
    fn test_parameter_optimization() {
        let params = FFTParameters::optimize_for_stability(100.0, 100.0, 1.0, 0.2).unwrap();
        
        assert!(params.alpha >= 0.5 && params.alpha <= 3.0);
        assert!(params.n.is_power_of_two());
        assert!(params.delta_v > 0.0);
        
        // Test parameter relationship
        let expected_delta_k = 2.0 * PI / (params.n as f64 * params.delta_v);
        assert_relative_eq!(params.delta_k, expected_delta_k, epsilon = 1e-10);
    }

    #[test]
    fn test_parameter_validation() {
        let mut params = FFTParameters {
            alpha: 1.5,
            n: 4096,
            delta_v: 0.01,
            delta_k: 2.0 * PI / (4096.0 * 0.01),
            k_min: 4.0,
        };
        
        assert!(params.validate().is_ok());
        
        // Test invalid n (not power of 2)
        params.n = 4095;
        assert!(params.validate().is_err());
        
        // Test invalid alpha
        params.n = 4096;
        params.alpha = 0.1;
        assert!(params.validate().is_err());
    }

    #[test]
    fn test_enhanced_characteristic_function() {
        let u = Complex::new(1.0, -2.0);
        let result = bs_log_cf_enhanced(u, 100.0, 0.05, 0.2, 1.0);
        assert!(result.is_ok());
        
        let cf = result.unwrap();
        assert!(cf.norm() > 0.0);
        assert!(!cf.re.is_nan());
        assert!(!cf.im.is_nan());
    }
}