// Core Types - Modular type definitions
export interface OptionRequest {
  s: number;    // Spot price
  k: number;    // Strike price
  tau: number;  // Time to expiration
  r: number;    // Risk-free rate
  sigma: number; // Volatility
}

export interface PricingResponse {
  price: number;
  model: string;
}

export interface BlackScholesResult {
  callPrice: number;
  putPrice: number;
  model: string;
  responseTime: number;
}

export interface FFTRequest extends OptionRequest {
  k_min: number;
  delta_v: number;
  delta_k: number;
  n: number;
  alpha: number;
}

export interface FFTResponse {
  prices: number[];
  model: string;
}

export interface FFTPricingResult {
  model: string;
  callSurface: number[];
  putSurface: number[];
  params: {
    k_min: number;
    delta_k: number;
    n: number;
  };
}

export interface PerformanceMetrics {
  responseTime: number;
  calculationsServed: number;
  uptime: number;
}

export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  metrics: {
    speed: string;
    accuracy: string;
    usage: string;
  };
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

// New types for visualization components
export interface VolatilitySurfaceData {
  strikes: number[];
  expirations: number[];
  volatilities: number[][];
}

export interface OptionChainData {
  strike: number;
  expiration: string;
  callPrice: number;
  putPrice: number;
  callImpliedVol?: number;
  putImpliedVol?: number;
  callGreeks?: Greeks;
  putGreeks?: Greeks;
}

export interface GreeksVisualizationData {
  spotPrices: number[];
  deltas: number[];
  gammas: number[];
  thetas: number[];
  vegas: number[];
  rhos: number[];
}

export interface ChartPoint {
  x: number;
  y: number;
  z?: number;
}

// Market Data Integration Types
export interface MarketDataRequest {
  symbol: string;
  asset_class?: string;
}

export interface MarketDataResponse {
  symbol: string;
  spot_price: number;
  bid: number;
  ask: number;
  timestamp: string;
  implied_volatility?: number;
  volume?: number;
  asset_class?: string;
  data_age_seconds: number;
}

export interface OptionChainRequest {
  underlying: string;
  expiry: string; // YYYY-MM-DD format
}

export interface OptionContractResponse {
  symbol: string;
  underlying: string;
  strike: number;
  expiry: string;
  option_type: string;
  bid: number;
  ask: number;
  last_price: number;
  implied_volatility: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  volume?: number;
  timestamp: string;
}

export interface OptionChainResponse {
  underlying: string;
  expiry: string;
  calls: OptionContractResponse[];
  puts: OptionContractResponse[];
  timestamp: string;
  total_strikes: number;
}

export interface MarketDataComparison {
  theoretical_price: number;
  market_price: number;
  bid: number;
  ask: number;
  spread: number;
  mid_price: number;
  price_difference: number;
  price_difference_percent: number;
}

export interface SupportedSymbolsResponse {
  symbols: {
    stocks: string[];
    indices: string[];
    currencies: string[];
    commodities: string[];
  };
  asset_classes: string[];
  note: string;
}