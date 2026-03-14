#[cfg(test)]
mod greeks_property_tests {
    use crate::greeks::*;
    use proptest::prelude::*;
    use approx::assert_relative_eq;

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
            let call_greeks = calculate_bs_call_greeks(s, k, tau, r, sigma);
            if let Ok(greeks) = call_greeks {
                // Delta bounds for calls: 0 <= delta <= 1
                prop_assert!(
                    greeks.delta >= 0.0 && greeks.delta <= 1.0,
                    "Call delta {} outside bounds [0, 1]", greeks.delta
                );
                
                // Test monotonicity: delta should increase with spot price
                let s_higher = s * 1.01; // 1% higher spot
                let greeks_higher = calculate_bs_call_greeks(s_higher, k, tau, r, sigma);
                if let Ok(greeks_h) = greeks_higher {
                    prop_assert!(
                        greeks_h.delta >= greeks.delta,
                        "Call delta not monotonic: delta({})={} >= delta({})={} failed",
                        s_higher, greeks_h.delta, s, greeks.delta
                    );
                }
            }
            
            // Test put delta bounds and monotonicity
            let put_greeks = calculate_bs_put_greeks(s, k, tau, r, sigma);
            if let Ok(greeks) = put_greeks {
                // Delta bounds for puts: -1 <= delta <= 0
                prop_assert!(
                    greeks.delta >= -1.0 && greeks.delta <= 0.0,
                    "Put delta {} outside bounds [-1, 0]", greeks.delta
                );
                
                // Test monotonicity: put delta should increase (become less negative) with spot price
                let s_higher = s * 1.01;
                let greeks_higher = calculate_bs_put_greeks(s_higher, k, tau, r, sigma);
                if let Ok(greeks_h) = greeks_higher {
                    prop_assert!(
                        greeks_h.delta >= greeks.delta,
                        "Put delta not monotonic: delta({})={} >= delta({})={} failed",
                        s_higher, greeks_h.delta, s, greeks.delta
                    );
                }
            }
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
            
            // Test call gamma non-negativity
            let call_greeks = calculate_bs_call_greeks(s, k, tau, r, sigma);
            if let Ok(greeks) = call_greeks {
                prop_assert!(
                    greeks.gamma >= 0.0,
                    "Call gamma {} should be non-negative", greeks.gamma
                );
                
                // Gamma should be finite and reasonable
                prop_assert!(
                    greeks.gamma.is_finite(),
                    "Call gamma should be finite, got {}", greeks.gamma
                );
                
                // Gamma should be highest near ATM
                let moneyness = (s / k).ln().abs();
                if moneyness < 0.1 { // Near ATM
                    prop_assert!(
                        greeks.gamma > 0.0,
                        "ATM call gamma should be positive, got {}", greeks.gamma
                    );
                }
            }
            
            // Test put gamma non-negativity (same as call gamma)
            let put_greeks = calculate_bs_put_greeks(s, k, tau, r, sigma);
            if let Ok(greeks) = put_greeks {
                prop_assert!(
                    greeks.gamma >= 0.0,
                    "Put gamma {} should be non-negative", greeks.gamma
                );
                
                prop_assert!(
                    greeks.gamma.is_finite(),
                    "Put gamma should be finite, got {}", greeks.gamma
                );
            }
            
            // Test gamma symmetry: call and put gamma should be equal
            if let (Ok(call_g), Ok(put_g)) = (call_greeks, put_greeks) {
                let gamma_diff = (call_g.gamma - put_g.gamma).abs();
                prop_assert!(
                    gamma_diff < 1e-10,
                    "Call and put gamma should be equal: call={}, put={}, diff={}",
                    call_g.gamma, put_g.gamma, gamma_diff
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
            let analytical_call = calculate_bs_call_greeks(s, k, tau, r, sigma);
            let numerical_call = calculate_numerical_call_greeks(s, k, tau, r, sigma);
            
            if let (Ok(analytical), Ok(numerical)) = (analytical_call, numerical_call) {
                // Delta consistency (should be within 0.1%)
                let delta_error = ((analytical.delta - numerical.delta) / analytical.delta.max(0.01)).abs();
                prop_assert!(
                    delta_error < 0.001,
                    "Call delta inconsistency: analytical={}, numerical={}, error={:.4}%",
                    analytical.delta, numerical.delta, delta_error * 100.0
                );
                
                // Gamma consistency (should be within 1% due to second derivative approximation)
                let gamma_error = ((analytical.gamma - numerical.gamma) / analytical.gamma.max(0.001)).abs();
                prop_assert!(
                    gamma_error < 0.01,
                    "Call gamma inconsistency: analytical={}, numerical={}, error={:.4}%",
                    analytical.gamma, numerical.gamma, gamma_error * 100.0
                );
                
                // Vega consistency (should be within 0.5%)
                let vega_error = ((analytical.vega - numerical.vega) / analytical.vega.max(0.01)).abs();
                prop_assert!(
                    vega_error < 0.005,
                    "Call vega inconsistency: analytical={}, numerical={}, error={:.4}%",
                    analytical.vega, numerical.vega, vega_error * 100.0
                );
                
                // Rho consistency (should be within 0.5%)
                let rho_error = ((analytical.rho - numerical.rho) / analytical.rho.max(0.01)).abs();
                prop_assert!(
                    rho_error < 0.005,
                    "Call rho inconsistency: analytical={}, numerical={}, error={:.4}%",
                    analytical.rho, numerical.rho, rho_error * 100.0
                );
                
                // Theta consistency (should be within 1% due to time derivative approximation)
                let theta_error = ((analytical.theta - numerical.theta) / analytical.theta.abs().max(0.01)).abs();
                prop_assert!(
                    theta_error < 0.01,
                    "Call theta inconsistency: analytical={}, numerical={}, error={:.4}%",
                    analytical.theta, numerical.theta, theta_error * 100.0
                );
            }
            
            // Test put Greeks consistency
            let analytical_put = calculate_bs_put_greeks(s, k, tau, r, sigma);
            let numerical_put = calculate_numerical_put_greeks(s, k, tau, r, sigma);
            
            if let (Ok(analytical), Ok(numerical)) = (analytical_put, numerical_put) {
                // Similar consistency checks for puts
                let delta_error = ((analytical.delta - numerical.delta) / analytical.delta.abs().max(0.01)).abs();
                prop_assert!(
                    delta_error < 0.001,
                    "Put delta inconsistency: analytical={}, numerical={}, error={:.4}%",
                    analytical.delta, numerical.delta, delta_error * 100.0
                );
                
                let gamma_error = ((analytical.gamma - numerical.gamma) / analytical.gamma.max(0.001)).abs();
                prop_assert!(
                    gamma_error < 0.01,
                    "Put gamma inconsistency: analytical={}, numerical={}, error={:.4}%",
                    analytical.gamma, numerical.gamma, gamma_error * 100.0
                );
                
                let vega_error = ((analytical.vega - numerical.vega) / analytical.vega.max(0.01)).abs();
                prop_assert!(
                    vega_error < 0.005,
                    "Put vega inconsistency: analytical={}, numerical={}, error={:.4}%",
                    analytical.vega, numerical.vega, vega_error * 100.0
                );
            }
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
        
        let call_greeks = calculate_bs_call_greeks(s, k, tau, r, sigma).unwrap();
        let put_greeks = calculate_bs_put_greeks(s, k, tau, r, sigma).unwrap();
        
        // ATM call delta should be around 0.5 (slightly higher due to drift)
        assert!(call_greeks.delta > 0.45 && call_greeks.delta < 0.65, 
                "ATM call delta should be around 0.5, got {}", call_greeks.delta);
        
        // ATM put delta should be around -0.5
        assert!(put_greeks.delta > -0.65 && put_greeks.delta < -0.35,
                "ATM put delta should be around -0.5, got {}", put_greeks.delta);
        
        // Call and put gamma should be equal and positive
        assert_relative_eq!(call_greeks.gamma, put_greeks.gamma, epsilon = 1e-10);
        assert!(call_greeks.gamma > 0.0, "ATM gamma should be positive");
        
        // Call and put vega should be equal and positive
        assert_relative_eq!(call_greeks.vega, put_greeks.vega, epsilon = 1e-10);
        assert!(call_greeks.vega > 0.0, "ATM vega should be positive");
    }
    
    #[test]
    fn test_deep_itm_otm_greeks() {
        let s = 100.0;
        let tau = 1.0;
        let r = 0.05;
        let sigma = 0.2;
        
        // Deep ITM call (low strike)
        let k_itm = 70.0;
        let itm_call = calculate_bs_call_greeks(s, k_itm, tau, r, sigma).unwrap();
        assert!(itm_call.delta > 0.8, "Deep ITM call delta should be high, got {}", itm_call.delta);
        
        // Deep OTM call (high strike)
        let k_otm = 130.0;
        let otm_call = calculate_bs_call_greeks(s, k_otm, tau, r, sigma).unwrap();
        assert!(otm_call.delta < 0.2, "Deep OTM call delta should be low, got {}", otm_call.delta);
        
        // Deep ITM put (high strike)
        let itm_put = calculate_bs_put_greeks(s, k_otm, tau, r, sigma).unwrap();
        assert!(itm_put.delta < -0.8, "Deep ITM put delta should be very negative, got {}", itm_put.delta);
        
        // Deep OTM put (low strike)
        let otm_put = calculate_bs_put_greeks(s, k_itm, tau, r, sigma).unwrap();
        assert!(otm_put.delta > -0.2, "Deep OTM put delta should be close to zero, got {}", otm_put.delta);
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
        
        let long_call = calculate_bs_call_greeks(s, k, tau_long, r, sigma).unwrap();
        let short_call = calculate_bs_call_greeks(s, k, tau_short, r, sigma).unwrap();
        
        // Gamma should be higher for shorter time (more convexity near expiration)
        assert!(short_call.gamma > long_call.gamma, 
                "Short-term gamma {} should be higher than long-term {}", 
                short_call.gamma, long_call.gamma);
        
        // Vega should be lower for shorter time (less sensitivity to volatility)
        assert!(short_call.vega < long_call.vega,
                "Short-term vega {} should be lower than long-term {}",
                short_call.vega, long_call.vega);
        
        // Theta should be more negative for shorter time (faster time decay)
        assert!(short_call.theta < long_call.theta,
                "Short-term theta {} should be more negative than long-term {}",
                short_call.theta, long_call.theta);
    }
    
    #[test]
    fn test_greeks_structure_and_units() {
        let s = 100.0;
        let k = 100.0;
        let tau = 1.0;
        let r = 0.05;
        let sigma = 0.2;
        
        let greeks = calculate_bs_call_greeks(s, k, tau, r, sigma).unwrap();
        
        // All Greeks should be finite
        assert!(greeks.delta.is_finite(), "Delta should be finite");
        assert!(greeks.gamma.is_finite(), "Gamma should be finite");
        assert!(greeks.theta.is_finite(), "Theta should be finite");
        assert!(greeks.vega.is_finite(), "Vega should be finite");
        assert!(greeks.rho.is_finite(), "Rho should be finite");
        
        // Greeks should have reasonable magnitudes
        assert!(greeks.delta.abs() <= 1.0, "Delta magnitude should be <= 1");
        assert!(greeks.gamma >= 0.0 && greeks.gamma < 1.0, "Gamma should be reasonable");
        assert!(greeks.vega > 0.0 && greeks.vega < 100.0, "Vega should be reasonable");
        assert!(greeks.rho.abs() < 1000.0, "Rho should be reasonable");
    }
}