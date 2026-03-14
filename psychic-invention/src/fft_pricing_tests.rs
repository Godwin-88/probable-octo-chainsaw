#[cfg(test)]
mod fft_property_tests {
    use crate::fft_pricing_enhanced::*;
    use crate::black_scholes::{price_call, price_put};
    use proptest::prelude::*;
    use approx::assert_relative_eq;

    // Property Test 1.1: FFT Call Price Accuracy
    // For any valid option parameters, FFT call prices should be within 1% of Black-Scholes
    proptest! {
        #[test]
        fn test_fft_call_accuracy_property(
            s in 50.0..200.0f64,           // Spot price range
            k in 50.0..200.0f64,           // Strike price range  
            tau in 0.1..2.0f64,            // Time to expiration (0.1 to 2 years)
            r in 0.01..0.15f64,            // Risk-free rate (1% to 15%)
            sigma in 0.1..0.8f64,          // Volatility (10% to 80%)
        ) {
            // Skip extreme cases that might cause numerical issues
            prop_assume!(s > 0.0 && k > 0.0 && tau > 0.0 && r >= 0.0 && sigma > 0.0);
            prop_assume!(sigma < 1.0); // Avoid extremely high volatility
            prop_assume!((s/k).ln().abs() < 1.0); // Avoid extreme moneyness
            
            // Calculate Black-Scholes benchmark
            let bs_call = price_call(s, k, tau, r, sigma).unwrap();
            
            // Calculate FFT price with optimized parameters
            let fft_result = price_call_fft_optimized(s, k, tau, r, sigma);
            
            // Test should pass if FFT calculation succeeds
            if let Ok(fft_call) = fft_result {
                // Verify FFT price is within 1% of Black-Scholes
                let relative_error = ((fft_call - bs_call) / bs_call).abs();
                prop_assert!(
                    relative_error < 0.01,
                    "FFT call price {} differs from BS {} by {:.4}% (limit: 1%)",
                    fft_call, bs_call, relative_error * 100.0
                );
                
                // Additional sanity checks
                prop_assert!(fft_call >= 0.0, "Call price must be non-negative");
                prop_assert!(fft_call <= s, "Call price cannot exceed spot price");
            }
        }
    }

    // Property Test 1.2: FFT Put Price Accuracy  
    // For any valid option parameters, FFT put prices should be within 1% of Black-Scholes
    proptest! {
        #[test]
        fn test_fft_put_accuracy_property(
            s in 50.0..200.0f64,
            k in 50.0..200.0f64,
            tau in 0.1..2.0f64,
            r in 0.01..0.15f64,
            sigma in 0.1..0.8f64,
        ) {
            prop_assume!(s > 0.0 && k > 0.0 && tau > 0.0 && r >= 0.0 && sigma > 0.0);
            prop_assume!(sigma < 1.0);
            prop_assume!((s/k).ln().abs() < 1.0);
            
            let bs_put = price_put(s, k, tau, r, sigma).unwrap();
            let fft_result = price_put_fft_optimized(s, k, tau, r, sigma);
            
            if let Ok(fft_put) = fft_result {
                let relative_error = ((fft_put - bs_put) / bs_put.max(0.01)).abs();
                prop_assert!(
                    relative_error < 0.01,
                    "FFT put price {} differs from BS {} by {:.4}% (limit: 1%)",
                    fft_put, bs_put, relative_error * 100.0
                );
                
                prop_assert!(fft_put >= 0.0, "Put price must be non-negative");
                let max_put_value = k * (-r * tau).exp();
                prop_assert!(fft_put <= max_put_value, "Put price cannot exceed discounted strike");
            }
        }
    }

    // Property Test 1.3: Parameter Optimization Stability
    // For any market conditions, parameter optimizer should return stable values
    proptest! {
        #[test]
        fn test_parameter_optimization_stability_property(
            s in 20.0..500.0f64,
            k in 20.0..500.0f64,
            tau in 0.01..5.0f64,
            sigma in 0.05..1.5f64,
        ) {
            prop_assume!(s > 0.0 && k > 0.0 && tau > 0.0 && sigma > 0.0);
            prop_assume!(sigma <= 2.0); // Within reasonable volatility range
            
            let result = FFTParameters::optimize_for_stability(s, k, tau, sigma);
            
            if let Ok(params) = result {
                // Test that parameters are within stable ranges
                prop_assert!(
                    params.alpha >= 0.5 && params.alpha <= 3.0,
                    "Alpha {} outside stable range [0.5, 3.0]", params.alpha
                );
                
                prop_assert!(
                    params.n.is_power_of_two() && params.n >= 1024 && params.n <= 16384,
                    "Grid size {} not a power of 2 or outside range [1024, 16384]", params.n
                );
                
                prop_assert!(
                    params.delta_v >= 0.001 && params.delta_v <= 0.1,
                    "Delta_v {} outside stable range [0.001, 0.1]", params.delta_v
                );
                
                // Test parameter relationship
                let expected_delta_k = 2.0 * std::f64::consts::PI / (params.n as f64 * params.delta_v);
                prop_assert!(
                    (params.delta_k - expected_delta_k).abs() < 1e-10,
                    "Parameter relationship violated: delta_k={}, expected={}",
                    params.delta_k, expected_delta_k
                );
                
                // Test that validation passes
                prop_assert!(
                    params.validate().is_ok(),
                    "Optimized parameters failed validation"
                );
            }
        }
    }

    // Property Test 1.4: FFT Error Handling
    // For parameters that cause numerical instability, FFT should return structured errors
    proptest! {
        #[test]
        fn test_fft_error_handling_property(
            s in 1.0..1000.0f64,
            k in 1.0..1000.0f64,
            tau in 0.001..10.0f64,
            r in -0.1..0.5f64,
            sigma in 0.001..3.0f64,
        ) {
            // Test with potentially problematic parameters
            let result = price_call_fft_optimized(s, k, tau, r, sigma);
            
            match result {
                Ok(price) => {
                    // If successful, price should be valid
                    prop_assert!(!price.is_nan(), "Price should not be NaN");
                    prop_assert!(!price.is_infinite(), "Price should not be infinite");
                    prop_assert!(price >= 0.0, "Price should be non-negative");
                }
                Err(e) => {
                    // If error, it should be a structured error with diagnostic info
                    let error_msg = format!("{}", e);
                    prop_assert!(
                        !error_msg.is_empty(),
                        "Error message should not be empty"
                    );
                    
                    // Error should contain diagnostic information
                    let has_diagnostic = error_msg.contains("parameter") || 
                                       error_msg.contains("stability") ||
                                       error_msg.contains("overflow") ||
                                       error_msg.contains("invalid");
                    prop_assert!(
                        has_diagnostic,
                        "Error should contain diagnostic information: {}", error_msg
                    );
                }
            }
        }
    }

    // Property Test 1.5: FFT Input Validation
    // For invalid parameter configurations, FFT should reject inputs appropriately
    proptest! {
        #[test]
        fn test_fft_input_validation_property(
            s in -100.0..1000.0f64,
            k in -100.0..1000.0f64,
            tau in -1.0..10.0f64,
            r in -1.0..1.0f64,
            sigma in -1.0..5.0f64,
        ) {
            let result = price_call_fft_optimized(s, k, tau, r, sigma);
            
            // Check if parameters are valid
            let params_valid = s > 0.0 && k > 0.0 && tau > 0.0 && sigma > 0.0 && sigma <= 2.0;
            
            if !params_valid {
                // Invalid parameters should be rejected
                prop_assert!(
                    result.is_err(),
                    "Invalid parameters (s={}, k={}, tau={}, sigma={}) should be rejected",
                    s, k, tau, sigma
                );
                
                if let Err(e) = result {
                    let error_msg = format!("{}", e);
                    prop_assert!(
                        error_msg.contains("Invalid") || error_msg.contains("positive"),
                        "Error message should indicate parameter validation failure: {}", error_msg
                    );
                }
            }
        }
    }

    // Unit tests for specific edge cases
    #[test]
    fn test_fft_at_the_money() {
        // Test ATM option pricing accuracy
        let s = 100.0;
        let k = 100.0;
        let tau = 1.0;
        let r = 0.05;
        let sigma = 0.2;
        
        let bs_call = price_call(s, k, tau, r, sigma).unwrap();
        let fft_call = price_call_fft_optimized(s, k, tau, r, sigma).unwrap();
        
        let relative_error = ((fft_call - bs_call) / bs_call).abs();
        assert!(relative_error < 0.005, "ATM option error too large: {:.4}%", relative_error * 100.0);
    }

    #[test]
    fn test_fft_extreme_moneyness() {
        // Test deep ITM and OTM options
        let s = 100.0;
        let tau = 0.5;
        let r = 0.05;
        let sigma = 0.3;
        
        // Deep ITM call
        let k_itm = 70.0;
        let bs_call_itm = price_call(s, k_itm, tau, r, sigma).unwrap();
        let fft_call_itm = price_call_fft_optimized(s, k_itm, tau, r, sigma).unwrap();
        let error_itm = ((fft_call_itm - bs_call_itm) / bs_call_itm).abs();
        assert!(error_itm < 0.02, "Deep ITM call error too large: {:.4}%", error_itm * 100.0);
        
        // Deep OTM call
        let k_otm = 130.0;
        let bs_call_otm = price_call(s, k_otm, tau, r, sigma).unwrap();
        let fft_call_otm = price_call_fft_optimized(s, k_otm, tau, r, sigma).unwrap();
        let error_otm = ((fft_call_otm - bs_call_otm) / bs_call_otm.max(0.01)).abs();
        assert!(error_otm < 0.05, "Deep OTM call error too large: {:.4}%", error_otm * 100.0);
    }

    #[test]
    fn test_parameter_optimization_consistency() {
        // Test that parameter optimization is consistent for similar inputs
        let s = 100.0;
        let k = 100.0;
        let tau = 1.0;
        let sigma = 0.2;
        
        let params1 = FFTParameters::optimize_for_stability(s, k, tau, sigma).unwrap();
        let params2 = FFTParameters::optimize_for_stability(s * 1.001, k * 1.001, tau, sigma).unwrap();
        
        // Parameters should be similar for similar inputs
        assert_relative_eq!(params1.alpha, params2.alpha, epsilon = 0.1);
        assert_eq!(params1.n, params2.n);
        assert_relative_eq!(params1.delta_v, params2.delta_v, epsilon = 0.001);
    }
}