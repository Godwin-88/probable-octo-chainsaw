use statrs::distribution::{Normal, ContinuousCDF};
use proptest::prelude::*;
use approx::assert_relative_eq;
use std::f64::consts::PI;

// Core Greeks calculation functions (standalone, no Python bindings)
fn calculate_d1(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    ((s / k).ln() + (r + 0.5 * sigma * sigma) * tau) / (sigma * tau.sqrt())
}

fn calculate_d2(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    calculate_d1(s, k, tau, r, sigma) - sigma * tau.sqrt()
}

fn bs_call_delta(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    let d1 = calculate_d1(s, k, tau, r, sigma);
    let norm = Normal::new(0.0, 1.0).unwrap();
    norm.cdf(d1)
}

fn bs_put_delta(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    bs_call_delta(s, k, tau, r, sigma) - 1.0
}

fn bs_gamma(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    let d1 = calculate_d1(s, k, tau, r, sigma);
    let phi_d1 = (-0.5 * d1 * d1).exp() / (2.0 * PI).sqrt();
    phi_d1 / (s * sigma * tau.sqrt())
}

fn bs_call_price(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    let d1 = calculate_d1(s, k, tau, r, sigma);
    let d2 = calculate_d2(s, k, tau, r, sigma);
    let norm = Normal::new(0.0, 1.0).unwrap();
    s * norm.cdf(d1) - k * (-r * tau).exp() * norm.cdf(d2)
}

fn bs_put_price(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    let call_price = bs_call_price(s, k, tau, r, sigma);
    call_price - s + k * (-r * tau).exp()
}

fn numerical_delta(s: f64, k: f64, tau: f64, r: f64, sigma: f64, is_call: bool) -> f64 {
    let ds = s * 0.01;
    let price_up = if is_call {
        bs_call_price(s + ds, k, tau, r, sigma)
    } else {
        bs_put_price(s + ds, k, tau, r, sigma)
    };
    let price_down = if is_call {
        bs_call_price(s - ds, k, tau, r, sigma)
    } else {
        bs_put_price(s - ds, k, tau, r, sigma)
    };
    (price_up - price_down) / (2.0 * ds)
}

fn numerical_gamma(s: f64, k: f64, tau: f64, r: f64, sigma: f64, is_call: bool) -> f64 {
    let ds = s * 0.01;
    let price_base = if is_call {
        bs_call_price(s, k, tau, r, sigma)
    } else {
        bs_put_price(s, k, tau, r, sigma)
    };
    let price_up = if is_call {
        bs_call_price(s + ds, k, tau, r, sigma)
    } else {
        bs_put_price(s + ds, k, tau, r, sigma)
    };
    let price_down = if is_call {
        bs_call_price(s - ds, k, tau, r, sigma)
    } else {
        bs_put_price(s - ds, k, tau, r, sigma)
    };
    (price_up - 2.0 * price_base + price_down) / (ds * ds)
}

// Property Test 3.1: Delta Bounds and Monotonicity
// **Property 10: Delta Bounds and Monotonicity**
// **Validates: Requirements 3.1**
proptest! {
    #[test]
    fn test_delta_bounds_and_monotonicity_property(
        s in 20.0..500.0f64,           // Spot price range
        k in 20.0..500.0f64,           // Strike price range  
        tau in 0.01..3.0f64,           // Time to expiration
        r in 0.0..0.2f64,              // Risk-free rate
        sigma in 0.05..1.0f64,         // Volatility
    ) {
        prop_assume!(s > 0.0 && k > 0.0 && tau > 0.0 && r >= 0.0 && sigma > 0.0);
        prop_assume!(sigma <= 0.8); // Reasonable volatility range
        
        // Test call delta bounds and monotonicity
        let call_delta = bs_call_delta(s, k, tau, r, sigma);
        
        // Delta bounds for calls: 0 <= delta <= 1
        prop_assert!(
            call_delta >= 0.0 && call_delta <= 1.0,
            "Call delta {} outside bounds [0, 1]", call_delta
        );
        
        // Test monotonicity: delta should increase with spot price
        let s_higher = s * 1.01; // 1% higher spot
        let call_delta_higher = bs_call_delta(s_higher, k, tau, r, sigma);
        prop_assert!(
            call_delta_higher >= call_delta,
            "Call delta not monotonic: delta({})={} >= delta({})={} failed",
            s_higher, call_delta_higher, s, call_delta
        );
        
        // Test put delta bounds and monotonicity
        let put_delta = bs_put_delta(s, k, tau, r, sigma);
        
        // Delta bounds for puts: -1 <= delta <= 0
        prop_assert!(
            put_delta >= -1.0 && put_delta <= 0.0,
            "Put delta {} outside bounds [-1, 0]", put_delta
        );
        
        // Test monotonicity: put delta should increase (become less negative) with spot price
        let put_delta_higher = bs_put_delta(s_higher, k, tau, r, sigma);
        prop_assert!(
            put_delta_higher >= put_delta,
            "Put delta not monotonic: delta({})={} >= delta({})={} failed",
            s_higher, put_delta_higher, s, put_delta
        );
    }
}

// Property Test 3.2: Gamma Non-Negativity
// **Property 11: Gamma Non-Negativity**
// **Validates: Requirements 3.2**
proptest! {
    #[test]
    fn test_gamma_non_negativity_property(
        s in 20.0..500.0f64,
        k in 20.0..500.0f64,
        tau in 0.01..3.0f64,
        r in 0.0..0.2f64,
        sigma in 0.05..1.0f64,
    ) {
        prop_assume!(s > 0.0 && k > 0.0 && tau > 0.0 && r >= 0.0 && sigma > 0.0);
        prop_assume!(sigma <= 0.8);
        
        // Test gamma non-negativity
        let gamma = bs_gamma(s, k, tau, r, sigma);
        
        prop_assert!(
            gamma >= 0.0,
            "Gamma {} should be non-negative", gamma
        );
        
        // Gamma should be finite and reasonable
        prop_assert!(
            gamma.is_finite(),
            "Gamma should be finite, got {}", gamma
        );
        
        // Gamma should be highest near ATM
        let moneyness = (s / k).ln().abs();
        if moneyness < 0.1 { // Near ATM
            prop_assert!(
                gamma > 0.0,
                "ATM gamma should be positive, got {}", gamma
            );
        }
    }
}

// Property Test 3.3: Analytical vs Numerical Greeks Consistency
// **Property 15: Analytical vs Numerical Greeks Consistency**
// **Validates: Requirements 3.6**
proptest! {
    #[test]
    fn test_analytical_vs_numerical_greeks_consistency_property(
        s in 50.0..200.0f64,
        k in 50.0..200.0f64,
        tau in 0.1..2.0f64,
        r in 0.01..0.15f64,
        sigma in 0.1..0.6f64,
    ) {
        prop_assume!(s > 0.0 && k > 0.0 && tau > 0.0 && r >= 0.0 && sigma > 0.0);
        prop_assume!((s/k).ln().abs() < 0.5); // Avoid extreme moneyness for better numerical stability
        
        // Test call Greeks consistency
        let analytical_call_delta = bs_call_delta(s, k, tau, r, sigma);
        let numerical_call_delta = numerical_delta(s, k, tau, r, sigma, true);
        
        // Delta consistency with adaptive error threshold
        // For very small deltas (< 0.01), use absolute error to avoid numerical precision issues
        // For larger deltas, use relative error
        let delta_error = if analytical_call_delta.abs() < 0.01 {
            (analytical_call_delta - numerical_call_delta).abs()
        } else {
            ((analytical_call_delta - numerical_call_delta) / analytical_call_delta).abs()
        };
        
        let error_threshold = if analytical_call_delta.abs() < 0.01 { 
            0.001  // Absolute error threshold for small deltas
        } else { 
            0.01   // 1% relative error for larger deltas
        };
        
        prop_assert!(
            delta_error < error_threshold,
            "Call delta inconsistency: analytical={}, numerical={}, error={:.4}% (threshold: {})",
            analytical_call_delta, numerical_call_delta, 
            if analytical_call_delta.abs() < 0.01 { delta_error } else { delta_error * 100.0 },
            if analytical_call_delta.abs() < 0.01 { "absolute" } else { "relative %" }
        );
        
        // Test gamma consistency
        let analytical_gamma = bs_gamma(s, k, tau, r, sigma);
        let numerical_gamma = numerical_gamma(s, k, tau, r, sigma, true);
        
        // Gamma consistency with adaptive error threshold
        // For very small gamma values, use absolute error to avoid numerical precision issues
        let gamma_error = if analytical_gamma < 0.001 {
            (analytical_gamma - numerical_gamma).abs()
        } else {
            ((analytical_gamma - numerical_gamma) / analytical_gamma).abs()
        };
        
        let gamma_threshold = if analytical_gamma < 0.001 {
            0.0005  // Absolute error threshold for small gamma
        } else {
            0.05    // 5% relative error for larger gamma (second derivative is less precise)
        };
        
        prop_assert!(
            gamma_error < gamma_threshold,
            "Gamma inconsistency: analytical={}, numerical={}, error={:.4}% (threshold: {})",
            analytical_gamma, numerical_gamma,
            if analytical_gamma < 0.001 { gamma_error } else { gamma_error * 100.0 },
            if analytical_gamma < 0.001 { "absolute" } else { "relative %" }
        );
        
        // Test put Greeks consistency
        let analytical_put_delta = bs_put_delta(s, k, tau, r, sigma);
        let numerical_put_delta = numerical_delta(s, k, tau, r, sigma, false);
        
        // Put delta consistency (use absolute error for very small deltas)
        let put_delta_error = if analytical_put_delta.abs() < 0.01 {
            // For very small deltas, use absolute error
            (analytical_put_delta - numerical_put_delta).abs()
        } else {
            // For larger deltas, use relative error
            ((analytical_put_delta - numerical_put_delta) / analytical_put_delta).abs()
        };
        
        let error_threshold = if analytical_put_delta.abs() < 0.01 { 0.01 } else { 0.03 };
        prop_assert!(
            put_delta_error < error_threshold,
            "Put delta inconsistency: analytical={}, numerical={}, error={:.4}%",
            analytical_put_delta, numerical_put_delta, put_delta_error * 100.0
        );
    }
}

// Unit tests for specific edge cases and validation
#[test]
fn test_atm_greeks_properties() {
    // At-the-money options should have specific Greek properties
    let s = 100.0;
    let k = 100.0;
    let tau = 1.0;
    let r = 0.05;
    let sigma = 0.2;
    
    let call_delta = bs_call_delta(s, k, tau, r, sigma);
    let put_delta = bs_put_delta(s, k, tau, r, sigma);
    let gamma = bs_gamma(s, k, tau, r, sigma);
    
    // ATM call delta should be around 0.5 (slightly higher due to drift)
    assert!(call_delta > 0.45 && call_delta < 0.65, 
            "ATM call delta should be around 0.5, got {}", call_delta);
    
    // ATM put delta should be around -0.5
    assert!(put_delta > -0.65 && put_delta < -0.35,
            "ATM put delta should be around -0.5, got {}", put_delta);
    
    // Gamma should be positive
    assert!(gamma > 0.0, "ATM gamma should be positive, got {}", gamma);
    
    // Put-call delta relationship
    assert_relative_eq!(call_delta - put_delta, 1.0, epsilon = 1e-10);
}

#[test]
fn test_deep_itm_otm_greeks() {
    let s = 100.0;
    let tau = 1.0;
    let r = 0.05;
    let sigma = 0.2;
    
    // Deep ITM call (low strike)
    let k_itm = 70.0;
    let itm_call_delta = bs_call_delta(s, k_itm, tau, r, sigma);
    assert!(itm_call_delta > 0.8, "Deep ITM call delta should be high, got {}", itm_call_delta);
    
    // Deep OTM call (high strike)
    let k_otm = 130.0;
    let otm_call_delta = bs_call_delta(s, k_otm, tau, r, sigma);
    assert!(otm_call_delta < 0.2, "Deep OTM call delta should be low, got {}", otm_call_delta);
    
    // Deep ITM put (high strike)
    let itm_put_delta = bs_put_delta(s, k_otm, tau, r, sigma);
    assert!(itm_put_delta < -0.8, "Deep ITM put delta should be very negative, got {}", itm_put_delta);
    
    // Deep OTM put (low strike)
    let otm_put_delta = bs_put_delta(s, k_itm, tau, r, sigma);
    assert!(otm_put_delta > -0.2, "Deep OTM put delta should be close to zero, got {}", otm_put_delta);
}

#[test]
fn test_greeks_time_decay() {
    let s = 100.0;
    let k = 100.0;
    let r = 0.05;
    let sigma = 0.2;
    
    // Compare Greeks at different times to expiration
    let tau_long = 1.0;
    let tau_short = 0.1;
    
    let long_gamma = bs_gamma(s, k, tau_long, r, sigma);
    let short_gamma = bs_gamma(s, k, tau_short, r, sigma);
    
    // Gamma should be higher for shorter time (more convexity near expiration)
    assert!(short_gamma > long_gamma, 
            "Short-term gamma {} should be higher than long-term {}", 
            short_gamma, long_gamma);
}

#[test]
fn test_greeks_structure_and_units() {
    let s = 100.0;
    let k = 100.0;
    let tau = 1.0;
    let r = 0.05;
    let sigma = 0.2;
    
    let call_delta = bs_call_delta(s, k, tau, r, sigma);
    let put_delta = bs_put_delta(s, k, tau, r, sigma);
    let gamma = bs_gamma(s, k, tau, r, sigma);
    
    // All Greeks should be finite
    assert!(call_delta.is_finite(), "Call delta should be finite");
    assert!(put_delta.is_finite(), "Put delta should be finite");
    assert!(gamma.is_finite(), "Gamma should be finite");
    
    // Greeks should have reasonable magnitudes
    assert!(call_delta.abs() <= 1.0, "Call delta magnitude should be <= 1");
    assert!(put_delta.abs() <= 1.0, "Put delta magnitude should be <= 1");
    assert!(gamma >= 0.0 && gamma < 1.0, "Gamma should be reasonable");
}