/*!
 * Simple performance benchmarks for core mathematical functions.
 * 
 * This module provides basic benchmarks for mathematical operations
 * that don't require the full pricing engine library.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use std::time::Duration;

// Simple mathematical functions for benchmarking
fn normal_cdf(x: f64) -> f64 {
    // Approximation of the cumulative distribution function of the standard normal distribution
    let a1 = 0.254829592;
    let a2 = -0.284496736;
    let a3 = 1.421413741;
    let a4 = -1.453152027;
    let a5 = 1.061405429;
    let p = 0.3275911;

    let sign = if x < 0.0 { -1.0 } else { 1.0 };
    let x = x.abs() / (2.0_f64).sqrt();

    let t = 1.0 / (1.0 + p * x);
    let y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * (-x * x).exp();

    0.5 * (1.0 + sign * y)
}

fn normal_pdf(x: f64) -> f64 {
    // Probability density function of the standard normal distribution
    let inv_sqrt_2pi = 0.3989422804014327;
    inv_sqrt_2pi * (-0.5 * x * x).exp()
}

fn black_scholes_d1(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    ((s / k).ln() + (r + 0.5 * sigma * sigma) * tau) / (sigma * tau.sqrt())
}

fn black_scholes_d2(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    black_scholes_d1(s, k, tau, r, sigma) - sigma * tau.sqrt()
}

fn simple_black_scholes_call(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    let d1 = black_scholes_d1(s, k, tau, r, sigma);
    let d2 = black_scholes_d2(s, k, tau, r, sigma);
    
    s * normal_cdf(d1) - k * (-r * tau).exp() * normal_cdf(d2)
}

fn simple_black_scholes_put(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    let d1 = black_scholes_d1(s, k, tau, r, sigma);
    let d2 = black_scholes_d2(s, k, tau, r, sigma);
    
    k * (-r * tau).exp() * normal_cdf(-d2) - s * normal_cdf(-d1)
}

fn simple_delta_call(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    let d1 = black_scholes_d1(s, k, tau, r, sigma);
    normal_cdf(d1)
}

fn simple_gamma(s: f64, k: f64, tau: f64, r: f64, sigma: f64) -> f64 {
    let d1 = black_scholes_d1(s, k, tau, r, sigma);
    normal_pdf(d1) / (s * sigma * tau.sqrt())
}

// Test parameters
const S: f64 = 100.0;  // Spot price
const K: f64 = 100.0;  // Strike price
const TAU: f64 = 0.25; // Time to expiration (3 months)
const R: f64 = 0.05;   // Risk-free rate (5%)
const SIGMA: f64 = 0.2; // Volatility (20%)

fn benchmark_mathematical_functions(c: &mut Criterion) {
    let mut group = c.benchmark_group("mathematical_functions");
    group.measurement_time(Duration::from_secs(5));
    
    group.bench_function("normal_cdf", |b| {
        b.iter(|| {
            black_box(normal_cdf(black_box(0.5)))
        })
    });
    
    group.bench_function("normal_pdf", |b| {
        b.iter(|| {
            black_box(normal_pdf(black_box(0.5)))
        })
    });
    
    group.bench_function("d1_calculation", |b| {
        b.iter(|| {
            black_box(black_scholes_d1(
                black_box(S),
                black_box(K),
                black_box(TAU),
                black_box(R),
                black_box(SIGMA)
            ))
        })
    });
    
    group.finish();
}

fn benchmark_simple_black_scholes(c: &mut Criterion) {
    let mut group = c.benchmark_group("simple_black_scholes");
    group.measurement_time(Duration::from_secs(10));
    
    group.bench_function("call_pricing", |b| {
        b.iter(|| {
            black_box(simple_black_scholes_call(
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
            black_box(simple_black_scholes_put(
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
                black_box(simple_black_scholes_call(
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

fn benchmark_simple_greeks(c: &mut Criterion) {
    let mut group = c.benchmark_group("simple_greeks");
    group.measurement_time(Duration::from_secs(10));
    
    group.bench_function("delta_calculation", |b| {
        b.iter(|| {
            black_box(simple_delta_call(
                black_box(S),
                black_box(K),
                black_box(TAU),
                black_box(R),
                black_box(SIGMA)
            ))
        })
    });
    
    group.bench_function("gamma_calculation", |b| {
        b.iter(|| {
            black_box(simple_gamma(
                black_box(S),
                black_box(K),
                black_box(TAU),
                black_box(R),
                black_box(SIGMA)
            ))
        })
    });
    
    // Batch Greeks calculations
    group.bench_function("batch_100_deltas", |b| {
        b.iter(|| {
            for i in 0..100 {
                let strike = 90.0 + (i as f64) * 0.2;
                black_box(simple_delta_call(
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

fn benchmark_parameter_variations(c: &mut Criterion) {
    let mut group = c.benchmark_group("parameter_variations");
    group.measurement_time(Duration::from_secs(8));
    
    // Test performance across different volatility levels
    for vol in [0.1, 0.2, 0.5, 1.0].iter() {
        group.bench_with_input(
            BenchmarkId::new("call_varying_vol", vol),
            vol,
            |b, &vol| {
                b.iter(|| {
                    black_box(simple_black_scholes_call(
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
            BenchmarkId::new("call_varying_tau", tau),
            tau,
            |b, &tau| {
                b.iter(|| {
                    black_box(simple_black_scholes_call(
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
            BenchmarkId::new("call_varying_moneyness", moneyness),
            &strike,
            |b, &strike| {
                b.iter(|| {
                    black_box(simple_black_scholes_call(
                        black_box(S),
                        black_box(strike),
                        black_box(TAU),
                        black_box(R),
                        black_box(SIGMA)
                    ))
                })
            }
        );
    }
    
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
                
                // 60% pricing calculations
                if i % 5 < 3 {
                    black_box(simple_black_scholes_call(S, strike, TAU, R, SIGMA));
                }
                // 40% Greeks calculations
                else {
                    black_box(simple_delta_call(S, strike, TAU, R, SIGMA));
                    black_box(simple_gamma(S, strike, TAU, R, SIGMA));
                }
            }
        })
    });
    
    group.bench_function("high_frequency_simulation", |b| {
        b.iter(|| {
            // High-frequency Black-Scholes only workload
            for i in 0..200 {
                let strike = 98.0 + (i as f64) * 0.02;
                black_box(simple_black_scholes_call(S, strike, TAU, R, SIGMA));
            }
        })
    });
    
    group.finish();
}

criterion_group!(
    benches,
    benchmark_mathematical_functions,
    benchmark_simple_black_scholes,
    benchmark_simple_greeks,
    benchmark_parameter_variations,
    benchmark_mixed_workload
);

criterion_main!(benches);