use pyo3::prelude::*;

pub mod black_scholes;
pub mod monte_carlo;
pub mod fft_pricing;
pub mod fft_pricing_enhanced;
pub mod heston;
pub mod greeks;
pub mod performance_monitor;

#[cfg(test)]
mod fft_pricing_tests;

#[cfg(test)]
mod greeks_tests;

#[cfg(test)]
mod greeks_core_tests;

#[pymodule]
pub fn pricing_engine(m: &Bound<'_, PyModule>) -> PyResult<()> {
    // Phase 1 - Black-Scholes (Optimized)
    m.add_function(wrap_pyfunction!(black_scholes::price_call, m)?)?;
    m.add_function(wrap_pyfunction!(black_scholes::price_put, m)?)?;
    
    // Phase 1 - Batch Processing (Performance Optimized)
    m.add_function(wrap_pyfunction!(black_scholes::price_calls_batch, m)?)?;
    m.add_function(wrap_pyfunction!(black_scholes::price_puts_batch, m)?)?;
    m.add_function(wrap_pyfunction!(black_scholes::price_option_chain, m)?)?;
    
    // Phase 2 - Monte Carlo
    m.add_function(wrap_pyfunction!(monte_carlo::price_call_mc, m)?)?;
    m.add_function(wrap_pyfunction!(monte_carlo::price_put_mc, m)?)?;
    
    // Phase 3 - FFT Pricing (Original)
    m.add_function(wrap_pyfunction!(fft_pricing::price_call_fft, m)?)?;
    m.add_function(wrap_pyfunction!(fft_pricing::price_put_fft, m)?)?;
    
    // Phase 3 - FFT Pricing (Enhanced)
    m.add_function(wrap_pyfunction!(fft_pricing_enhanced::price_call_fft_optimized, m)?)?;
    m.add_function(wrap_pyfunction!(fft_pricing_enhanced::price_put_fft_optimized, m)?)?;
    m.add_function(wrap_pyfunction!(fft_pricing_enhanced::price_call_fft_enhanced, m)?)?;
    m.add_function(wrap_pyfunction!(fft_pricing_enhanced::price_put_fft_enhanced, m)?)?;
    
    // Phase 4 - Heston Model
    m.add_function(wrap_pyfunction!(heston::cf_heston, m)?)?;
    m.add_function(wrap_pyfunction!(heston::price_heston_call, m)?)?;
    m.add_function(wrap_pyfunction!(heston::price_heston_put, m)?)?;
    m.add_function(wrap_pyfunction!(heston::validate_feller_condition_py, m)?)?;
    
    // Phase 5 - Greeks Calculator (Optimized)
    m.add_function(wrap_pyfunction!(greeks::calculate_bs_call_greeks, m)?)?;
    m.add_function(wrap_pyfunction!(greeks::calculate_bs_put_greeks, m)?)?;
    m.add_function(wrap_pyfunction!(greeks::calculate_bs_call_greeks_batch, m)?)?;
    m.add_function(wrap_pyfunction!(greeks::calculate_bs_put_greeks_batch, m)?)?;
    m.add_function(wrap_pyfunction!(greeks::calculate_numerical_call_greeks, m)?)?;
    m.add_function(wrap_pyfunction!(greeks::calculate_numerical_put_greeks, m)?)?;
    m.add_function(wrap_pyfunction!(greeks::calculate_fft_call_greeks, m)?)?;
    m.add_function(wrap_pyfunction!(greeks::calculate_fft_put_greeks, m)?)?;
    m.add_function(wrap_pyfunction!(greeks::calculate_heston_call_greeks, m)?)?;
    m.add_function(wrap_pyfunction!(greeks::calculate_heston_put_greeks, m)?)?;
    
    // Phase 6 - Performance Monitoring
    m.add_function(wrap_pyfunction!(performance_monitor::get_performance_metrics, m)?)?;
    m.add_function(wrap_pyfunction!(performance_monitor::clear_performance_metrics, m)?)?;
    m.add_function(wrap_pyfunction!(performance_monitor::get_all_operation_names, m)?)?;
    m.add_function(wrap_pyfunction!(performance_monitor::reset_all_metrics, m)?)?;
    m.add_function(wrap_pyfunction!(performance_monitor::run_performance_benchmark, m)?)?;
    
    Ok(())
}