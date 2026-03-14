// Custom Hooks - Modular state management
import { useState, useEffect, useCallback, useRef } from 'react';
import { checkHealth, priceCallBS, pricePutBS, priceCallFFT, pricePutFFT, checkMarketDataHealth, getMarketData, getOptionChain, getSupportedSymbols } from '@/utils/api';
import type {
  OptionRequest,
  BlackScholesResult,
  FFTRequest,
  FFTPricingResult,
  MarketDataRequest,
  MarketDataResponse,
  OptionChainRequest,
  OptionChainResponse,
  SupportedSymbolsResponse,
  MarketDataComparison,
} from '@/types';

export const useHealthCheck = () => {
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        await checkHealth();
        setIsHealthy(true);
      } catch {
        setIsHealthy(false);
      } finally {
        setLoading(false);
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, loading };
};

export const useBlackScholesPricing = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BlackScholesResult | null>(null);

  const calculate = async (request: OptionRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const startTime = performance.now();
      const [call, put] = await Promise.all([
        priceCallBS(request),
        pricePutBS(request),
      ]);
      const endTime = performance.now();
      
      setResult({
        callPrice: call.price,
        putPrice: put.price,
        model: call.model,
        responseTime: Math.round(endTime - startTime),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return { calculate, loading, error, result };
};

export const useFFTPricing = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FFTPricingResult | null>(null);

  const calculate = async (request: FFTRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await Promise.all([
        priceCallFFT(request),
        pricePutFFT(request),
      ]);

      const [callSurface, putSurface] = response;
      setResult({
        model: callSurface.model,
        callSurface: callSurface.prices,
        putSurface: putSurface.prices,
        params: {
          k_min: request.k_min,
          delta_k: request.delta_k,
          n: request.n,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'FFT pricing failed');
    } finally {
      setLoading(false);
    }
  };

  return { calculate, loading, error, result };
};

export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState({
    calculationsServed: 0,
    avgResponseTime: 2,
    uptime: 99.9,
  });

  useEffect(() => {
    // Simulate live metrics for demo
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        calculationsServed: prev.calculationsServed + Math.floor(Math.random() * 5) + 1,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};

// Market Data Hooks
export const useMarketDataHealth = () => {
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await checkMarketDataHealth();
        setIsHealthy(response.api_connection);
        setError(null);
      } catch (err) {
        setIsHealthy(false);
        setError(err instanceof Error ? err.message : 'Market data service unavailable');
      } finally {
        setLoading(false);
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, loading, error };
};

export const useMarketData = (symbol?: string, autoRefresh = false, refreshInterval = 30000) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MarketDataResponse | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMarketData = useCallback(async (request: MarketDataRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getMarketData(request);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && symbol) {
      const startAutoRefresh = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        intervalRef.current = setInterval(() => {
          fetchMarketData({ symbol });
        }, refreshInterval);
      };

      // Initial fetch
      fetchMarketData({ symbol });
      startAutoRefresh();

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [symbol, autoRefresh, refreshInterval, fetchMarketData]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { 
    fetchMarketData, 
    loading, 
    error, 
    data, 
    stopAutoRefresh,
    isAutoRefreshing: intervalRef.current !== null 
  };
};

export const useOptionChain = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OptionChainResponse | null>(null);

  const fetchOptionChain = useCallback(async (request: OptionChainRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getOptionChain(request);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch option chain');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchOptionChain, loading, error, data };
};

export const useSupportedSymbols = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SupportedSymbolsResponse | null>(null);

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const response = await getSupportedSymbols();
        setData(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch supported symbols');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSymbols();
  }, []);

  return { loading, error, data };
};

export const useMarketComparison = () => {
  const calculateComparison = useCallback((
    theoreticalPrice: number,
    marketData: MarketDataResponse
  ): MarketDataComparison => {
    const midPrice = (marketData.bid + marketData.ask) / 2;
    const spread = marketData.ask - marketData.bid;
    const priceDifference = theoreticalPrice - midPrice;
    const priceDifferencePercent = (priceDifference / midPrice) * 100;

    return {
      theoretical_price: theoreticalPrice,
      market_price: midPrice,
      bid: marketData.bid,
      ask: marketData.ask,
      spread,
      mid_price: midPrice,
      price_difference: priceDifference,
      price_difference_percent: priceDifferencePercent,
    };
  }, []);

  return { calculateComparison };
};
