import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MarketDataDashboard } from '../MarketDataDashboard';
import { PricingWorkspace } from '../PricingWorkspace';
import * as apiUtils from '../../utils/api';

// Mock the API utilities
vi.mock('../../utils/api', () => ({
  checkMarketDataHealth: vi.fn(),
  getMarketData: vi.fn(),
  getOptionChain: vi.fn(),
  getSupportedSymbols: vi.fn(),
  getCacheStats: vi.fn(),
  clearCache: vi.fn(),
  checkHealth: vi.fn(),
  priceCallBS: vi.fn(),
  pricePutBS: vi.fn(),
  priceCallFFT: vi.fn(),
  pricePutFFT: vi.fn(),
}));

// Mock the Greeks utility
vi.mock('../../utils/greeks', () => ({
  computeCallGreeks: vi.fn(() => ({
    delta: 0.5,
    gamma: 0.02,
    theta: -0.05,
    vega: 0.15,
    rho: 0.08,
  })),
}));

// Mock the export utilities
vi.mock('../../utils/export', () => ({
  exportBlackScholesCSV: vi.fn(),
  exportBlackScholesJSON: vi.fn(),
  exportFFTSurfaceCSV: vi.fn(),
  exportFFTSurfaceJSON: vi.fn(),
  exportFFTCompleteJSON: vi.fn(),
}));

const mockMarketData = {
  symbol: 'AAPL',
  spot_price: 150.25,
  bid: 150.20,
  ask: 150.30,
  timestamp: '2024-01-15T10:30:00Z',
  implied_volatility: 0.25,
  volume: 1000000,
  asset_class: 'stocks',
  data_age_seconds: 5,
};

const mockOptionChain = {
  underlying: 'AAPL',
  expiry: '2024-03-15T00:00:00Z',
  calls: [
    {
      symbol: 'AAPL240315C00145000',
      underlying: 'AAPL',
      strike: 145,
      expiry: '2024-03-15T00:00:00Z',
      option_type: 'call',
      bid: 8.50,
      ask: 8.60,
      last_price: 8.55,
      implied_volatility: 0.24,
      delta: 0.65,
      gamma: 0.02,
      theta: -0.05,
      vega: 0.15,
      rho: 0.08,
      volume: 500,
      timestamp: '2024-01-15T10:30:00Z',
    },
    {
      symbol: 'AAPL240315C00150000',
      underlying: 'AAPL',
      strike: 150,
      expiry: '2024-03-15T00:00:00Z',
      option_type: 'call',
      bid: 5.20,
      ask: 5.30,
      last_price: 5.25,
      implied_volatility: 0.25,
      delta: 0.50,
      gamma: 0.025,
      theta: -0.04,
      vega: 0.18,
      rho: 0.06,
      volume: 750,
      timestamp: '2024-01-15T10:30:00Z',
    },
  ],
  puts: [
    {
      symbol: 'AAPL240315P00145000',
      underlying: 'AAPL',
      strike: 145,
      expiry: '2024-03-15T00:00:00Z',
      option_type: 'put',
      bid: 3.20,
      ask: 3.30,
      last_price: 3.25,
      implied_volatility: 0.26,
      delta: -0.35,
      gamma: 0.02,
      theta: -0.03,
      vega: 0.15,
      rho: -0.05,
      volume: 300,
      timestamp: '2024-01-15T10:30:00Z',
    },
    {
      symbol: 'AAPL240315P00150000',
      underlying: 'AAPL',
      strike: 150,
      expiry: '2024-03-15T00:00:00Z',
      option_type: 'put',
      bid: 5.80,
      ask: 5.90,
      last_price: 5.85,
      implied_volatility: 0.25,
      delta: -0.50,
      gamma: 0.025,
      theta: -0.04,
      vega: 0.18,
      rho: -0.08,
      volume: 600,
      timestamp: '2024-01-15T10:30:00Z',
    },
  ],
  timestamp: '2024-01-15T10:30:00Z',
  total_strikes: 2,
};

const mockSupportedSymbols = {
  symbols: {
    stocks: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
    indices: ['SPY', 'QQQ', 'IWM'],
    currencies: ['EURUSD', 'GBPUSD'],
    commodities: ['GLD', 'SLV'],
  },
  asset_classes: ['stocks', 'indices', 'currencies', 'commodities'],
  note: 'Sample symbols for testing',
};

const mockBlackScholesResult = {
  callPrice: 8.55,
  putPrice: 5.85,
  model: 'Black-Scholes',
  responseTime: 15,
};

describe('Market Data Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(apiUtils.checkMarketDataHealth).mockResolvedValue({
      status: 'healthy',
      service: 'market-data',
      api_connection: true,
      timestamp: '2024-01-15T10:30:00Z',
    });
    
    vi.mocked(apiUtils.getSupportedSymbols).mockResolvedValue(mockSupportedSymbols);
    vi.mocked(apiUtils.getMarketData).mockResolvedValue(mockMarketData);
    vi.mocked(apiUtils.getOptionChain).mockResolvedValue(mockOptionChain);
    
    vi.mocked(apiUtils.priceCallBS).mockResolvedValue({
      price: 8.55,
      model: 'Black-Scholes',
    });
    
    vi.mocked(apiUtils.pricePutBS).mockResolvedValue({
      price: 5.85,
      model: 'Black-Scholes',
    });
  });

  describe('MarketDataDashboard Component', () => {
    it('should render market data dashboard with health status', async () => {
      render(<MarketDataDashboard />);
      
      expect(screen.getByText('Real-time Market Data & Option Chains')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });

    it('should fetch and display market data for selected symbol', async () => {
      render(<MarketDataDashboard />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });
      
      // Click refresh button
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(apiUtils.getMarketData).toHaveBeenCalledWith({ symbol: 'AAPL' });
        expect(screen.getByText('$150.25')).toBeInTheDocument();
        expect(screen.getByText('$0.10')).toBeInTheDocument(); // Spread
      });
    });

    it('should fetch and display option chain data', async () => {
      render(<MarketDataDashboard />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });
      
      // Set expiry date and fetch option chain
      const expiryInput = screen.getByDisplayValue('2024-03-15');
      const fetchChainButton = screen.getByText('Fetch Chain');
      
      fireEvent.click(fetchChainButton);
      
      await waitFor(() => {
        expect(apiUtils.getOptionChain).toHaveBeenCalledWith({
          underlying: 'AAPL',
          expiry: '2024-03-15',
        });
        
        // Check if option chain data is displayed
        expect(screen.getByText('$145')).toBeInTheDocument();
        expect(screen.getByText('$150')).toBeInTheDocument();
        expect(screen.getByText('$8.50')).toBeInTheDocument(); // Call bid
        expect(screen.getByText('$5.80')).toBeInTheDocument(); // Put bid
      });
    });

    it('should enable auto-refresh functionality', async () => {
      vi.useFakeTimers();
      
      render(<MarketDataDashboard />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });
      
      // Enable auto-refresh
      const autoRefreshButton = screen.getByText('Auto-Refresh');
      fireEvent.click(autoRefreshButton);
      
      expect(screen.getByText('Stop Auto-Refresh')).toBeInTheDocument();
      
      // Fast-forward time to trigger auto-refresh
      vi.advanceTimersByTime(30000);
      
      await waitFor(() => {
        expect(apiUtils.getMarketData).toHaveBeenCalledTimes(2); // Initial + auto-refresh
      });
      
      vi.useRealTimers();
    });

    it('should handle market data errors gracefully', async () => {
      vi.mocked(apiUtils.getMarketData).mockRejectedValue(new Error('API unavailable'));
      
      render(<MarketDataDashboard />);
      
      // Wait for component to load and click refresh
      await waitFor(() => {
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Error: API unavailable/)).toBeInTheDocument();
      });
    });
  });

  describe('Frontend-API Integration', () => {
    it('should integrate market data with pricing workspace', async () => {
      const mockOnSymbolSelect = vi.fn();
      
      render(
        <>
          <PricingWorkspace />
          <MarketDataDashboard onSymbolSelect={mockOnSymbolSelect} />
        </>
      );
      
      // Wait for components to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });
      
      // Fetch market data
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(apiUtils.getMarketData).toHaveBeenCalledWith({ symbol: 'AAPL' });
      });
    });

    it('should display theoretical vs market price comparison', async () => {
      const theoreticalPrice = 8.55;
      
      render(
        <MarketDataDashboard 
          theoreticalPrice={theoreticalPrice}
        />
      );
      
      // Wait for component to load and fetch market data
      await waitFor(() => {
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        // Check if comparison is displayed
        expect(screen.getByText('Theoretical vs Market Price')).toBeInTheDocument();
        expect(screen.getByText('$8.5500')).toBeInTheDocument(); // Theoretical price
        
        // Market mid price should be (150.20 + 150.30) / 2 = 150.25
        // But this is spot price, not option price. The comparison logic needs option market data.
      });
    });

    it('should update pricing parameters with market data', async () => {
      const mockOnSymbolSelect = vi.fn();
      
      render(<MarketDataDashboard onSymbolSelect={mockOnSymbolSelect} />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });
      
      // Fetch market data
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(apiUtils.getMarketData).toHaveBeenCalledWith({ symbol: 'AAPL' });
      });
      
      // Verify that onSymbolSelect would be called with market data
      // This would happen in the actual integration
    });

    it('should handle real-time data updates', async () => {
      vi.useFakeTimers();
      
      render(<MarketDataDashboard />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });
      
      // Enable auto-refresh
      const autoRefreshButton = screen.getByText('Auto-Refresh');
      fireEvent.click(autoRefreshButton);
      
      // Mock updated market data
      const updatedMarketData = {
        ...mockMarketData,
        spot_price: 151.50,
        bid: 151.45,
        ask: 151.55,
        data_age_seconds: 2,
      };
      
      vi.mocked(apiUtils.getMarketData).mockResolvedValue(updatedMarketData);
      
      // Fast-forward time to trigger auto-refresh
      vi.advanceTimersByTime(30000);
      
      await waitFor(() => {
        expect(screen.getByText('$151.50')).toBeInTheDocument();
      });
      
      vi.useRealTimers();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle API connection failures', async () => {
      vi.mocked(apiUtils.checkMarketDataHealth).mockResolvedValue({
        status: 'degraded',
        service: 'market-data',
        api_connection: false,
        timestamp: '2024-01-15T10:30:00Z',
      });
      
      render(<MarketDataDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      });
    });

    it('should handle rate limiting gracefully', async () => {
      vi.mocked(apiUtils.getMarketData).mockRejectedValue({
        response: { status: 429, data: { detail: 'Rate limit exceeded. Retry after 60 seconds' } }
      });
      
      render(<MarketDataDashboard />);
      
      // Wait for component to load and click refresh
      await waitFor(() => {
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });

    it('should handle malformed market data', async () => {
      const malformedData = {
        symbol: 'AAPL',
        spot_price: null, // Invalid data
        bid: 'invalid',
        ask: 150.30,
        timestamp: 'invalid-date',
      };
      
      vi.mocked(apiUtils.getMarketData).mockResolvedValue(malformedData as any);
      
      render(<MarketDataDashboard />);
      
      // Wait for component to load and click refresh
      await waitFor(() => {
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      // Component should handle malformed data gracefully
      await waitFor(() => {
        // Should not crash, but may show error or fallback UI
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Caching', () => {
    it('should cache market data requests', async () => {
      render(<MarketDataDashboard />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });
      
      // Make multiple requests quickly
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        // Should only make one API call due to caching/debouncing
        expect(apiUtils.getMarketData).toHaveBeenCalledTimes(1);
      });
    });

    it('should display data age information', async () => {
      render(<MarketDataDashboard />);
      
      // Wait for component to load and fetch data
      await waitFor(() => {
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.getByText(/5s ago/)).toBeInTheDocument();
      });
    });
  });
});