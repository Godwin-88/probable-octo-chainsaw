use pyo3::prelude::*;
use pyo3::types::PyComplex;
use num_complex::Complex;
use std::f64::consts::PI;

/// Heston model parameters validation error
#[derive(Debug)]
pub enum HestonError {
    FellerConditionViolated,
    InvalidParameters,
    NumericalIntegrationFailed,
}

impl std::fmt::Display for HestonError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            HestonError::FellerConditionViolated => write!(f, "Feller condition violated: 2*kappa*theta <= xi^2"),
            HestonError::InvalidParameters => write!(f, "Invalid Heston parameters"),
            HestonError::NumericalIntegrationFailed => write!(f, "Numerical integration failed to converge"),
        }
    }
}

impl std::error::Error for HestonError {}

/// Validate Heston parameters satisfy the Feller condition
pub fn validate_feller_condition(kappa: f64, theta: f64, xi: f64) -> Result<(), HestonError> {
    if 2.0 * kappa * theta <= xi * xi {
        Err(HestonError::FellerConditionViolated)
    } else {
        Ok(())
    }
}

/// Validate all Heston parameters are reasonable
pub fn validate_heston_parameters(v0: f64, kappa: f64, theta: f64, xi: f64, rho: f64) -> Result<(), HestonError> {
    if v0 <= 0.0 || kappa <= 0.0 || theta <= 0.0 || xi <= 0.0 || rho < -1.0 || rho > 1.0 {
        return Err(HestonError::InvalidParameters);
    }
    validate_feller_condition(kappa, theta, xi)
}

/// Characteristic function of log‐asset price under Heston model
#[pyfunction]
pub fn cf_heston(
    py: Python,
    u: f64,
    s: f64,
    v0: f64,
    r: f64,
    kappa: f64,
    theta: f64,
    xi: f64,
    rho: f64,
    tau: f64,
) -> PyResult<PyObject> {
    let cf = cf_heston_impl(u, s, v0, r, kappa, theta, xi, rho, tau);
    let py_c = PyComplex::from_doubles(py, cf.re, cf.im);
    Ok(py_c.into_py(py))
}

/// Internal implementation of Heston characteristic function
fn cf_heston_impl(
    u: f64,
    s: f64,
    v0: f64,
    r: f64,
    kappa: f64,
    theta: f64,
    xi: f64,
    rho: f64,
    tau: f64,
) -> Complex<f64> {
    if tau <= 0.0 {
        return Complex::new(1.0, 0.0);
    }
    
    let i = Complex::i();
    let u_complex = Complex::new(u, 0.0);
    
    // Heston characteristic function parameters
    let d = ((rho * xi * i * u_complex - kappa).powi(2) + xi * xi * (i * u_complex + u_complex * u_complex)).sqrt();
    let g = (kappa - rho * xi * i * u_complex - d) / (kappa - rho * xi * i * u_complex + d);
    
    // Avoid numerical issues when g is close to 1
    let exp_d_tau = (-d * tau).exp();
    let c = if g.norm() < 1e-10 {
        // Use series expansion when g is small
        kappa * theta / (xi * xi) * (-kappa * tau + 2.0 * (1.0 - exp_d_tau) / (1.0 + exp_d_tau))
    } else {
        kappa * theta / (xi * xi) * (
            (kappa - rho * xi * i * u_complex - d) * tau - 
            2.0 * ((1.0 - g * exp_d_tau) / (1.0 - g)).ln()
        )
    };
    
    let d_term = if g.norm() < 1e-10 {
        (1.0 - exp_d_tau) / (1.0 + exp_d_tau)
    } else {
        (1.0 - exp_d_tau) / (1.0 - g * exp_d_tau)
    };
    
    let a = v0 / (xi * xi) * (kappa - rho * xi * i * u_complex - d) * d_term;
    
    // Return the characteristic function
    (i * u_complex * (s.ln() + r * tau) + a + c).exp()
}

/// Numerical integration using adaptive Simpson's rule
fn adaptive_simpson(f: impl Fn(f64) -> f64, a: f64, b: f64, tol: f64, max_depth: usize) -> f64 {
    fn simpson_rule(f: &impl Fn(f64) -> f64, a: f64, b: f64) -> f64 {
        let h = (b - a) / 6.0;
        h * (f(a) + 4.0 * f((a + b) / 2.0) + f(b))
    }
    
    fn adaptive_simpson_rec(
        f: &impl Fn(f64) -> f64,
        a: f64,
        b: f64,
        tol: f64,
        s: f64,
        fa: f64,
        fb: f64,
        fc: f64,
        depth: usize,
        max_depth: usize,
    ) -> f64 {
        if depth >= max_depth {
            return s;
        }
        
        let c = (a + b) / 2.0;
        let h = b - a;
        let d = (a + c) / 2.0;
        let e = (c + b) / 2.0;
        let fd = f(d);
        let fe = f(e);
        
        let s_left = h / 12.0 * (fa + 4.0 * fd + fc);
        let s_right = h / 12.0 * (fc + 4.0 * fe + fb);
        let s2 = s_left + s_right;
        
        if (s2 - s).abs() <= 15.0 * tol {
            s2 + (s2 - s) / 15.0
        } else {
            adaptive_simpson_rec(f, a, c, tol / 2.0, s_left, fa, fc, fd, depth + 1, max_depth) +
            adaptive_simpson_rec(f, c, b, tol / 2.0, s_right, fc, fb, fe, depth + 1, max_depth)
        }
    }
    
    let fa = f(a);
    let fb = f(b);
    let fc = f((a + b) / 2.0);
    let s = simpson_rule(&f, a, b);
    
    adaptive_simpson_rec(&f, a, b, tol, s, fa, fb, fc, 0, max_depth)
}

/// Heston call pricing via numerical integration
fn price_heston_call_impl(
    s: f64,
    k: f64,
    v0: f64,
    r: f64,
    kappa: f64,
    theta: f64,
    xi: f64,
    rho: f64,
    tau: f64,
) -> Result<f64, HestonError> {
    // Validate parameters
    validate_heston_parameters(v0, kappa, theta, xi, rho)?;
    
    if tau <= 0.0 {
        return Ok((s - k).max(0.0));
    }
    
    // Integration bounds - use adaptive bounds based on parameters
    let upper_bound = 100.0 / (xi * tau.sqrt()).max(1.0);
    let tolerance = 1e-8;
    
    // P1 integral: Re[(exp(-iu*ln(K)) * cf(u-i)) / (iu * cf(-i))]
    let cf_minus_i = cf_heston_impl(-1.0, s, v0, r, kappa, theta, xi, rho, tau);
    if cf_minus_i.norm() < 1e-15 {
        return Err(HestonError::NumericalIntegrationFailed);
    }
    
    let p1_integrand = |u: f64| -> f64 {
        if u.abs() < 1e-10 {
            return 0.5; // Limit as u -> 0
        }
        let cf_val = cf_heston_impl(u - 1.0, s, v0, r, kappa, theta, xi, rho, tau);
        let numerator = cf_val / cf_minus_i;
        let exp_term = Complex::new(0.0, -u * k.ln()).exp();
        let result = (exp_term * numerator) / Complex::new(0.0, u);
        result.re
    };
    
    let p1 = 0.5 + (1.0 / PI) * adaptive_simpson(p1_integrand, 0.0, upper_bound, tolerance, 20);
    
    // P2 integral: Re[(exp(-iu*ln(K)) * cf(u)) / (iu)]
    let p2_integrand = |u: f64| -> f64 {
        if u.abs() < 1e-10 {
            return 0.5; // Limit as u -> 0
        }
        let cf_val = cf_heston_impl(u, s, v0, r, kappa, theta, xi, rho, tau);
        let exp_term = Complex::new(0.0, -u * k.ln()).exp();
        let result = (exp_term * cf_val) / Complex::new(0.0, u);
        result.re
    };
    
    let p2 = 0.5 + (1.0 / PI) * adaptive_simpson(p2_integrand, 0.0, upper_bound, tolerance, 20);
    
    // Heston call price formula: C = S*P1 - K*exp(-r*tau)*P2
    let call_price = s * p1 - k * (-r * tau).exp() * p2;
    
    // Ensure non-negative price
    Ok(call_price.max(0.0))
}

/// Heston call pricing via numeric integration
#[pyfunction]
pub fn price_heston_call(
    s: f64,
    k: f64,
    v0: f64,
    r: f64,
    kappa: f64,
    theta: f64,
    xi: f64,
    rho: f64,
    tau: f64,
) -> PyResult<f64> {
    match price_heston_call_impl(s, k, v0, r, kappa, theta, xi, rho, tau) {
        Ok(price) => Ok(price),
        Err(e) => Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string())),
    }
}

/// Validate Feller condition from Python
#[pyfunction]
pub fn validate_feller_condition_py(kappa: f64, theta: f64, xi: f64) -> PyResult<bool> {
    Ok(validate_feller_condition(kappa, theta, xi).is_ok())
}

/// Stub for Heston *put* pricing via put–call parity:
/// P = C - S + K * exp(-r * τ)
#[pyfunction]
pub fn price_heston_put(
    s: f64,
    k: f64,
    v0: f64,
    r: f64,
    kappa: f64,
    theta: f64,
    xi: f64,
    rho: f64,
    tau: f64,
) -> PyResult<f64> {
    let c = price_heston_call(s, k, v0, r, kappa, theta, xi, rho, tau)?;
    let p = c - s + k * (-r * tau).exp();
    Ok(p)
}
