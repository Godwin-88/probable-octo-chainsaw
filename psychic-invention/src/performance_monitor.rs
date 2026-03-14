/*!
 * Performance Monitoring Module
 * 
 * This module provides real-time performance monitoring and optimization
 * capabilities for the pricing engine. It tracks execution times, memory usage,
 * and throughput metrics to ensure production-grade performance.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

use pyo3::prelude::*;
use std::time::{Duration, Instant};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicU64, Ordering};

/// Performance metrics structure
#[derive(Debug, Clone)]
#[pyclass]
pub struct PerformanceMetrics {
    #[pyo3(get)]
    pub operation_count: u64,
    #[pyo3(get)]
    pub total_time_ms: f64,
    #[pyo3(get)]
    pub average_time_ms: f64,
    #[pyo3(get)]
    pub min_time_ms: f64,
    #[pyo3(get)]
    pub max_time_ms: f64,
    #[pyo3(get)]
    pub throughput_ops_per_sec: f64,
}

#[pymethods]
impl PerformanceMetrics {
    fn __repr__(&self) -> String {
        format!(
            "PerformanceMetrics(ops={}, avg={:.3}ms, throughput={:.0} ops/sec)",
            self.operation_count, self.average_time_ms, self.throughput_ops_per_sec
        )
    }
}

/// Performance monitor for tracking operation metrics
pub struct PerformanceMonitor {
    metrics: Arc<Mutex<HashMap<String, Vec<Duration>>>>,
    operation_counts: Arc<Mutex<HashMap<String, AtomicU64>>>,
}

impl PerformanceMonitor {
    pub fn new() -> Self {
        Self {
            metrics: Arc::new(Mutex::new(HashMap::new())),
            operation_counts: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    /// Record the execution time of an operation
    pub fn record_operation(&self, operation_name: &str, duration: Duration) {
        // Record timing
        {
            let mut metrics = self.metrics.lock().unwrap();
            metrics.entry(operation_name.to_string())
                .or_insert_with(Vec::new)
                .push(duration);
        }
        
        // Increment counter
        {
            let mut counts = self.operation_counts.lock().unwrap();
            counts.entry(operation_name.to_string())
                .or_insert_with(|| AtomicU64::new(0))
                .fetch_add(1, Ordering::Relaxed);
        }
    }
    
    /// Get performance metrics for a specific operation
    pub fn get_metrics(&self, operation_name: &str) -> Option<PerformanceMetrics> {
        let metrics = self.metrics.lock().unwrap();
        let counts = self.operation_counts.lock().unwrap();
        
        if let (Some(times), Some(counter)) = (
            metrics.get(operation_name),
            counts.get(operation_name)
        ) {
            if times.is_empty() {
                return None;
            }
            
            let operation_count = counter.load(Ordering::Relaxed);
            let times_ms: Vec<f64> = times.iter()
                .map(|d| d.as_secs_f64() * 1000.0)
                .collect();
            
            let total_time_ms: f64 = times_ms.iter().sum();
            let average_time_ms = total_time_ms / times_ms.len() as f64;
            let min_time_ms = times_ms.iter().fold(f64::INFINITY, |a, &b| a.min(b));
            let max_time_ms = times_ms.iter().fold(0.0f64, |a, &b| a.max(b));
            
            let throughput_ops_per_sec = if total_time_ms > 0.0 {
                (operation_count as f64) / (total_time_ms / 1000.0)
            } else {
                0.0
            };
            
            Some(PerformanceMetrics {
                operation_count,
                total_time_ms,
                average_time_ms,
                min_time_ms,
                max_time_ms,
                throughput_ops_per_sec,
            })
        } else {
            None
        }
    }
    
    /// Clear metrics for a specific operation
    pub fn clear_metrics(&self, operation_name: &str) {
        {
            let mut metrics = self.metrics.lock().unwrap();
            metrics.remove(operation_name);
        }
        {
            let mut counts = self.operation_counts.lock().unwrap();
            counts.remove(operation_name);
        }
    }
    
    /// Get all available operation names
    pub fn get_operation_names(&self) -> Vec<String> {
        let metrics = self.metrics.lock().unwrap();
        metrics.keys().cloned().collect()
    }
}

/// Global performance monitor instance
lazy_static::lazy_static! {
    static ref GLOBAL_MONITOR: PerformanceMonitor = PerformanceMonitor::new();
}

/// Macro for timing operations
#[macro_export]
macro_rules! time_operation {
    ($operation_name:expr, $code:block) => {{
        let start = std::time::Instant::now();
        let result = $code;
        let duration = start.elapsed();
        $crate::performance_monitor::record_operation($operation_name, duration);
        result
    }};
}

/// Record an operation timing
pub fn record_operation(operation_name: &str, duration: Duration) {
    GLOBAL_MONITOR.record_operation(operation_name, duration);
}

/// Performance-aware wrapper for pricing functions
pub struct TimedPricingEngine;

impl TimedPricingEngine {
    /// Timed Black-Scholes call pricing
    pub fn price_call_timed(
        s: f64, k: f64, tau: f64, r: f64, sigma: f64
    ) -> PyResult<f64> {
        let start = Instant::now();
        let result = crate::black_scholes::price_call(s, k, tau, r, sigma);
        let duration = start.elapsed();
        GLOBAL_MONITOR.record_operation("bs_call", duration);
        result
    }
    
    /// Timed Black-Scholes put pricing
    pub fn price_put_timed(
        s: f64, k: f64, tau: f64, r: f64, sigma: f64
    ) -> PyResult<f64> {
        let start = Instant::now();
        let result = crate::black_scholes::price_put(s, k, tau, r, sigma);
        let duration = start.elapsed();
        GLOBAL_MONITOR.record_operation("bs_put", duration);
        result
    }
    
    /// Timed FFT call pricing
    pub fn price_call_fft_timed(
        s: f64, k: f64, tau: f64, r: f64, sigma: f64
    ) -> PyResult<f64> {
        let start = Instant::now();
        let result = crate::fft_pricing_enhanced::price_call_fft_optimized(s, k, tau, r, sigma);
        let duration = start.elapsed();
        GLOBAL_MONITOR.record_operation("fft_call", duration);
        result
    }
    
    /// Timed Heston call pricing
    pub fn price_heston_call_timed(
        s: f64, k: f64, v0: f64, r: f64, kappa: f64, theta: f64, sigma_v: f64, rho: f64, tau: f64
    ) -> PyResult<f64> {
        let start = Instant::now();
        let result = crate::heston::price_heston_call(s, k, v0, r, kappa, theta, sigma_v, rho, tau);
        let duration = start.elapsed();
        GLOBAL_MONITOR.record_operation("heston_call", duration);
        result
    }
    
    /// Timed Greeks calculation
    pub fn calculate_bs_greeks_timed(
        s: f64, k: f64, tau: f64, r: f64, sigma: f64, is_call: bool
    ) -> PyResult<crate::greeks::Greeks> {
        let start = Instant::now();
        let result = crate::greeks::GreeksCalculator::calculate_bs_analytical_greeks(
            s, k, tau, r, sigma, is_call
        );
        let duration = start.elapsed();
        GLOBAL_MONITOR.record_operation("bs_greeks", duration);
        result
    }
}

// Python interface functions
#[pyfunction]
pub fn get_performance_metrics(operation_name: String) -> PyResult<Option<PerformanceMetrics>> {
    Ok(GLOBAL_MONITOR.get_metrics(&operation_name))
}

#[pyfunction]
pub fn clear_performance_metrics(operation_name: String) -> PyResult<()> {
    GLOBAL_MONITOR.clear_metrics(&operation_name);
    Ok(())
}

#[pyfunction]
pub fn get_all_operation_names() -> PyResult<Vec<String>> {
    Ok(GLOBAL_MONITOR.get_operation_names())
}

#[pyfunction]
pub fn reset_all_metrics() -> PyResult<()> {
    let operation_names = GLOBAL_MONITOR.get_operation_names();
    for name in operation_names {
        GLOBAL_MONITOR.clear_metrics(&name);
    }
    Ok(())
}

/// Performance benchmark runner
#[pyfunction]
pub fn run_performance_benchmark(
    operation_type: String,
    iterations: usize
) -> PyResult<PerformanceMetrics> {
    // Clear existing metrics
    GLOBAL_MONITOR.clear_metrics(&operation_type);
    
    // Standard test parameters
    let s = 100.0;
    let k = 100.0;
    let tau = 0.25;
    let r = 0.05;
    let sigma = 0.2;
    
    // Run benchmark based on operation type
    match operation_type.as_str() {
        "bs_call" => {
            for _ in 0..iterations {
                let _ = TimedPricingEngine::price_call_timed(s, k, tau, r, sigma)?;
            }
        }
        "bs_put" => {
            for _ in 0..iterations {
                let _ = TimedPricingEngine::price_put_timed(s, k, tau, r, sigma)?;
            }
        }
        "fft_call" => {
            for _ in 0..iterations {
                let _ = TimedPricingEngine::price_call_fft_timed(s, k, tau, r, sigma)?;
            }
        }
        "heston_call" => {
            let v0 = 0.04;
            let theta = 0.04;
            let kappa = 2.0;
            let sigma_v = 0.3;
            let rho = -0.7;
            for _ in 0..iterations {
                let _ = TimedPricingEngine::price_heston_call_timed(
                    s, k, v0, r, kappa, theta, sigma_v, rho, tau
                )?;
            }
        }
        "bs_greeks" => {
            for _ in 0..iterations {
                let _ = TimedPricingEngine::calculate_bs_greeks_timed(s, k, tau, r, sigma, true)?;
            }
        }
        _ => {
            return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                format!("Unknown operation type: {}", operation_type)
            ));
        }
    }
    
    // Return metrics
    GLOBAL_MONITOR.get_metrics(&operation_type)
        .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(
            "Failed to collect benchmark metrics"
        ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;
    use std::time::Duration;

    #[test]
    fn test_performance_monitor() {
        let monitor = PerformanceMonitor::new();
        
        // Record some operations
        monitor.record_operation("test_op", Duration::from_millis(10));
        monitor.record_operation("test_op", Duration::from_millis(20));
        monitor.record_operation("test_op", Duration::from_millis(15));
        
        // Get metrics
        let metrics = monitor.get_metrics("test_op").unwrap();
        assert_eq!(metrics.operation_count, 3);
        assert!(metrics.average_time_ms > 0.0);
        assert!(metrics.throughput_ops_per_sec > 0.0);
        
        // Clear metrics
        monitor.clear_metrics("test_op");
        assert!(monitor.get_metrics("test_op").is_none());
    }
    
    #[test]
    fn test_timed_pricing_engine() {
        // Test timed Black-Scholes pricing
        let result = TimedPricingEngine::price_call_timed(100.0, 100.0, 0.25, 0.05, 0.2);
        assert!(result.is_ok());
        
        // Check that metrics were recorded
        let metrics = GLOBAL_MONITOR.get_metrics("bs_call");
        assert!(metrics.is_some());
        assert!(metrics.unwrap().operation_count > 0);
    }
}