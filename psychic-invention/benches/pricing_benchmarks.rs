/*!
 * Performance benchmarks for the Rust pricing engine core.
 * 
 * This module provides comprehensive benchmarks for all pricing models
 * to ensure they meet performance requirements:
 * - Black-Scholes: under 100ms
 * - FFT pricing: under 100ms  
 * - Heston model: under 500ms
 * - Greeks calculations: under 200ms
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use pricing_engine::black_scholes::{price_call, price_put};
use pricing_engine::fft_pricing_enhanced::{price_call_fft_optimized, price_put_fft_optimized, price_call_fft_enhanced, price_put_fft_enhanced};
use pricing_engine::heston::{price_heston_call, price_heston_put};
use pricing_engine::greeks::{calculate_bs_call_greeks, calculate_bs_put_greeks, calculate_numerical_call_greeks, 
             calculate_numerical_put_greeks, calculate_fft_call_greeks, calculate_fft_put_greeks,
             calculate_heston_call_greeks, calculate_heston_put_greeks};
use std::time::Duration;

// Test parameters
const S: f64 = 100.0;  // Spot price
const K: f64 = 100.0;  // Strike price
const TAU: f64 = 0.25; // Time to expiration (3 months)
const R: f64 = 0.05;   // Risk-free rate (5%)
const SIGMA: f64 = 0.2; // Volatility (20%)

// Heston parameters
const V0: f64 = 0.04;      // Initial variance
const THETA: f64 = 0.04;   // Long-term variance
const KAPPA: f64 = 2.0;    // Mean reversion speed
const SIGMA_V: f64 = 0.3;  // Volatility of volatility
const RHO: f64 = -0.7;     // Correlation

fn benchmark_black_scholes(c: &mut Criterion) {
    let mut group = c.benchmark_group("black_scholes");
    group.measurement_time(Duration::from_secs(10));
    
    group.bench_function("call_pricing", |b| {
        b.iter(|| {
            black_box(price_call(
                black_box(S),
                black_box(K), 
                black_box(TAU),
                black_box(R),
                black_box(SIGMA)
            ))
        })
    });
    
    group.bench_function("put_pricing", |b| {
        b.iter(|| {
            black_box(price_put(
                black_box(S),
                black_box(K),
                black_box(TAU), 
                black_box(R),
                black_box(SIGMA)
            ))
        })
    });
    
    // Batch pricing benchmark
    group.bench_function("batch_100_calls", |b| {
        b.iter(|| {
            for i in 0..100 {
                let strike = 90.0 + (i as f64) * 0.2;
                black_box(price_call(
                    black_box(S),
                    black_box(strike),
                    black_box(TAU),
                    black_box(R), 
                    black_box(SIGMA)
                ));
            }
        })
    });
    
    group.finish();
}

fn benchmark_fft_pricing(c: &mut Criterion) {
    let mut group = c.benchmark_group("fft_pricing");
    group.measurement_time(Duration::from_secs(15));
    
    group.bench_function("optimized_call", |b| {
        b.iter(|| {
            black_box(price_call_fft_optimized(
                black_box(S),
                black_box(K),
                black_box(TAU),
                black_box(R),
                black_box(SIGMA)
            ))
        })
    });
    
    group.bench_function("optimized_put", |b| {
        b.iter(|| {
            black_box(price_put_fft_optimized(
                black_box(S),
                black_box(K),
                black_box(TAU),
                black_box(R),
                black_box(SIGMA)
            ))
        })
    });
    
    // Enhanced FFT with manual parameters
    group.bench_function("enhanced_call", |b| {
        let k_min = 50.0;
        let delta_v = 0.01;
        let delta_k = 0.5;
        let n = 2048;
        let alpha = 1.5;
        
        b.iter(|| {
            black_box(price_call_fft_enhanced(
                black_box(S),
                black_box(K),
                black_box(k_min),
                black_box(delta_v),
                black_box(delta_k),
                black_box(n),
                black_box(TAU),
                black_box(R),
                black_box(SIGMA),
                black_box(alpha)
            ))
        })
    });
    
    // Batch FFT pricing
    group.bench_function("batch_50_optimized_calls", |b| {
        b.iter(|| {
            for i in 0..50 {
                let strike = 90.0 + (i as f64) * 0.4;
                black_box(price_call_fft_optimized(
                    black_box(S),
                    black_box(strike),
                    black_box(TAU),
                    black_box(R),
                    black_box(SIGMA)
                ));
            }
        })
    });
    
    group.finish();
}

fn benchmark_heston_pricing(c: &mut Criterion) {
    let mut group = c.benchmark_group("heston_pricing");
    group.measurement_time(Duration::from_secs(20));
    
    group.bench_function("call_pricing", |b| {
        b.iter(|| {
            black_box(price_heston_call(
                black_box(S),
                black_box(K),
                black_box(V0),
                black_box(R),
                black_box(KAPPA),
                black_box(THETA),
                black_box(SIGMA_V),
                black_box(RHO),
                black_box(TAU)
            ))
        })
    });
    
    group.bench_function("put_pricing", |b| {
        b.iter(|| {
            black_box(price_heston_put(
                black_box(S),
                black_box(K),
                black_box(V0),
                black_box(R),
                black_box(KAPPA),
                black_box(THETA),
                black_box(SIGMA_V),
                black_box(RHO),
                black_box(TAU)
            ))
        })
    });
    
    // Batch Heston pricing (smaller batch due to complexity)
    group.bench_function("batch_20_calls", |b| {
        b.iter(|| {
            for i in 0..20 {
                let strike = 90.0 + (i as f64) * 1.0;
                black_box(price_heston_call(
                    black_box(S),
                    black_box(strike),
                    black_box(V0),
                    black_box(R),
                    black_box(KAPPA),
                    black_box(THETA),
                    black_box(SIGMA_V),
                    black_box(RHO),
                    black_box(TAU)
                ));
            }
        })
    });
    
    group.finish();
}

fn benchmark_greeks_calculations(c: &mut Criterion) {
    let mut group = c.benchmark_group("greeks");
    group.measurement_time(Duration::from_secs(10));
    
    group.bench_function("bs_call_greeks", |b| {
        b.iter(|| {
            black_box(calculate_bs_call_greeks(
                black_box(S),
                black_box(K),
                black_box(TAU),
                black_box(R),
                black_box(SIGMA)
            ))
        })
    });
    
    group.bench_function("bs_put_greeks", |b| {
        b.iter(|| {
            black_box(calculate_bs_put_greeks(
                black_box(S),
                black_box(K),
                black_box(TAU),
                black_box(R),
                black_box(SIGMA)
            ))
        })
    });
    
    group.bench_function("numerical_call_greeks", |b| {
        b.iter(|| {
            black_box(calculate_numerical_call_greeks(
                black_box(S),
                black_box(K),
                black_box(TAU),
                black_box(R),
                black_box(SIGMA)
            ))
        })
    });
    
    group.bench_function("fft_call_greeks", |b| {
        b.iter(|| {
            black_box(calculate_fft_call_greeks(
                black_box(S),
                black_box(K),
                black_box(TAU),
                black_box(R),
                black_box(SIGMA)
            ))
        })
    });
    
    group.bench_function("heston_call_greeks", |b| {
        b.iter(|| {
            black_box(calculate_heston_call_greeks(
                black_box(S),
                black_box(K),
                black_box(TAU),
                black_box(R),
                black_box(V0),
                black_box(THETA),
                black_box(KAPPA),
                black_box(SIGMA_V),
                black_box(RHO)
            ))
        })
    });
    
    // Batch Greeks calculations
    group.bench_function("batch_100_bs_greeks", |b| {
        b.iter(|| {
            for i in 0..100 {
                let strike = 90.0 + (i as f64) * 0.2;
                black_box(calculate_bs_call_greeks(
                    black_box(S),
                    black_box(strike),
                    black_box(TAU),
                    black_box(R),
                    black_box(SIGMA)
                ));
            }
        })
    });
    
    group.finish();
}

fn benchmark_mixed_workload(c: &mut Criterion) {
    let mut group = c.benchmark_group("mixed_workload");
    group.measurement_time(Duration::from_secs(15));
    
    group.bench_function("realistic_trading_simulation", |b| {
        b.iter(|| {
            // Simulate a realistic trading workload with mixed operations
            for i in 0..50 {
                let strike = 95.0 + (i as f64) * 0.2;
                
                // 40% Black-Scholes pricing
                if i % 5 < 2 {
                    black_box(price_call(S, strike, TAU, R, SIGMA));
                }
                // 30% FFT pricing
                else if i % 5 < 3 {
                    black_box(price_call_fft_optimized(S, strike, TAU, R, SIGMA));
                }
                // 20% Greeks calculations
                else if i % 5 < 4 {
                    black_box(calculate_bs_call_greeks(S, strike, TAU, R, SIGMA));
                }
                // 10% Heston pricing (more expensive)
                else {
                    black_box(price_heston_call(S, strike, V0, R, KAPPA, THETA, SIGMA_V, RHO, TAU));
                }
            }
        })
    });
    
    group.bench_function("high_frequency_bs_only", |b| {
        b.iter(|| {
            // High-frequency Black-Scholes only workload
            for i in 0..200 {
                let strike = 98.0 + (i as f64) * 0.02;
                black_box(price_call(S, strike, TAU, R, SIGMA));
                black_box(calculate_bs_call_greeks(S, strike, TAU, R, SIGMA));
            }
        })
    });
    
    group.finish();
}

fn benchmark_parameter_variations(c: &mut Criterion) {
    let mut group = c.benchmark_group("parameter_variations");
    group.measurement_time(Duration::from_secs(10));
    
    // Test performance across different volatility levels
    for vol in [0.1, 0.2, 0.5, 1.0].iter() {
        group.bench_with_input(
            BenchmarkId::new("bs_call_varying_vol", vol),
            vol,
            |b, &vol| {
                b.iter(|| {
                    black_box(price_call(
                        black_box(S),
                        black_box(K),
                        black_box(TAU),
                        black_box(R),
                        black_box(vol)
                    ))
                })
            }
        );
    }
    
    // Test performance across different time to expiration
    for tau in [0.01, 0.25, 1.0, 2.0].iter() {
        group.bench_with_input(
            BenchmarkId::new("fft_call_varying_tau", tau),
            tau,
            |b, &tau| {
                b.iter(|| {
                    black_box(price_call_fft_optimized(
                        black_box(S),
                        black_box(K),
                        black_box(tau),
                        black_box(R),
                        black_box(SIGMA)
                    ))
                })
            }
        );
    }
    
    // Test performance across different moneyness levels
    for moneyness in [0.8, 0.9, 1.0, 1.1, 1.2].iter() {
        let strike = S * moneyness;
        group.bench_with_input(
            BenchmarkId::new("heston_call_varying_moneyness", moneyness),
            &strike,
            |b, &strike| {
                b.iter(|| {
                    black_box(price_heston_call(
                        black_box(S),
                        black_box(strike),
                        black_box(V0),
                        black_box(R),
                        black_box(KAPPA),
                        black_box(THETA),
                        black_box(SIGMA_V),
                        black_box(RHO),
                        black_box(TAU)
                    ))
                })
            }
        );
    }
    
    group.finish();
}

criterion_group!(
    benches,
    benchmark_black_scholes,
    benchmark_fft_pricing,
    benchmark_heston_pricing,
    benchmark_greeks_calculations,
    benchmark_mixed_workload,
    benchmark_parameter_variations
);

criterion_main!(benches);