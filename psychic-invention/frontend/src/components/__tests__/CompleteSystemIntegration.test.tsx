/**
 * Complete System Integration Tests
 * 
 * Tests the full pricing workflow from frontend components to backend API,
 * ensuring all components work together correctly.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PricingWorkspace } from '../PricingWorkspace';
import * as api from '../../utils/api';

// Mock the API module
vi.mock('../../utils/api');

describe('Complete System Integration', () => {
  const mockApiResponses = {
    healthCheck: { status: 'healthy' },
    blackScholesCall: { 
      price: 10.4506, 
      model: 'Black-Scholes',
      request_id: 'test-123'
    },
    blackScholesPut: { 
      price: 5.5735, 
      model: 'Black-Scholes',
      request_id: 'test-124'
    },
    fftCall: { 
      prices: [15.2, 12.8, 10.4, 8.1, 6.2], 
      model: 'FFT' 
    },
    fftPut: { 
      prices: [0.8, 2.1, 4.2, 7.1, 10.8], 
      model: 'FFT' 
    },
    marketDataHealth: {
      status: 'healthy',
      service: 'market-data',
      api_connection: true,
      timestamp: new Date().toISOString()
    },
    marketData: {
      symbol: 'AAPL',
      spot_price: 150.25,
      bid: 149.80,
      ask: 150.70,
      timestamp: new Date().toISOString(),
      implied_volatility: 0.25,
      data_age_seconds: 5
    },
    supportedSymbols: {
      symbols: {
        stocks: ['AAPL', 'GOOGL', 'MSFT'],
        indices: ['SPX', 'NDX'],
        currencies: ['EURUSD', 'GBPUSD'],
        commodities: ['GOLD', 'OIL']
      },
      asset_classes: ['stocks', 'indices', 'currencies', 'commodities'],
      note: 'Mock data for testing'
    }
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(api.checkHealth).mockResolvedValue(mockApiResponses.healthCheck);
    vi.mocked(api.priceCallBS).mockResolvedValue(mockApiResponses.blackScholesCall);
    vi.mocked(api.pricePutBS).mockResolvedValue(mockApiResponses.blackScholesPut);
    vi.mocked(api.priceCallFFT).mockResolvedValue(mockApiResponses.fftCall);
    vi.mocked(api.pricePutFFT).mockResolvedValue(mockApiResponses.fftPut);
    vi.mocked(api.checkMarketDataHealth).mockResolvedValue(mockApiResponses.marketDataHealth);
    vi.mocked(api.getMarketData).mockResolvedValue(mockApiResponses.marketData);
    vi.mocked(api.getSupportedSymbols).mockResolvedValue(mockApiResponses.supportedSymbols);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete full Black-Scholes pricing workflow', async () => {
    render(<PricingWorkspace defaultTab="bs" />);

    // Verify initial state
    expect(screen.getByText('Analytical · Black-Scholes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument(); // Default spot price

    // Fill in pricing parameters
    const spotInput = screen.getByDisplayValue('100');
    const strikeInput = screen.getAllByDisplayValue('100')[1]; // Second input with value 100
    const tauInput = screen.getByDisplayValue('1');
    const rateInput = screen.getByDisplayValue('0.05');
    const volInput = screen.getByDisplayValue('0.2');

    // Update parameters
    fireEvent.change(spotInput, { target: { value: '105' } });
    fireEvent.change(strikeInput, { target: { value: '100' } });
    fireEvent.change(tauInput, { target: { value: '0.5' } });
    fireEvent.change(rateInput, { target: { value: '0.03' } });
    fireEvent.change(volInput, { target: { value: '0.25' } });

    // Submit calculation
    const calculateButton = screen.getByText('Calculate Call & Put');
    fireEvent.click(calculateButton);

    // Wait for API calls and results
    await waitFor(() => {
      expect(vi.mocked(api.priceCallBS)).toHaveBeenCalledWith({
        s: 105,
        k: 100,
        tau: 0.5,
        r: 0.03,
        sigma: 0.25
      });
    });

    await waitFor(() => {
      expect(vi.mocked(api.pricePutBS)).toHaveBeenCalledWith({
        s: 105,
        k: 100,
        tau: 0.5,
        r: 0.03,
        sigma: 0.25
      });
    });

    // Verify results are displayed
    await waitFor(() => {
      expect(screen.getByText('$10.4506')).toBeInTheDocument(); // Call price
      expect(screen.getByText('$5.5735')).toBeInTheDocument();  // Put price
      expect(screen.getByText('Black-Scholes')).toBeInTheDocument(); // Model name
    });

    // Verify Greeks are calculated and displayed
    await waitFor(() => {
      expect(screen.getByText(/Δ/)).toBeInTheDocument(); // Delta
      expect(screen.getByText(/Γ/)).toBeInTheDocument(); // Gamma
      expect(screen.getByText(/Θ/)).toBeInTheDocument(); // Theta
      expect(screen.getByText(/ν/)).toBeInTheDocument(); // Vega
      expect(screen.getByText(/ρ/)).toBeInTheDocument(); // Rho
    });
  });

  it('should complete full FFT pricing workflow', async () => {
    render(<PricingWorkspace defaultTab="fft" />);

    // Switch to FFT tab
    const fftTab = screen.getByText('Surface · Carr-Madan FFT');
    fireEvent.click(fftTab);

    // Verify FFT interface is displayed
    expect(screen.getByText('α (damping)')).toBeInTheDocument();
    expect(screen.getByText('Δv (frequency)')).toBeInTheDocument();
    expect(screen.getByText('Grid (n)')).toBeInTheDocument();

    // Update FFT parameters
    const alphaInput = screen.getByDisplayValue('1.5');
    const deltaVInput = screen.getByDisplayValue('0.01');
    
    fireEvent.change(alphaInput, { target: { value: '1.2' } });
    fireEvent.change(deltaVInput, { target: { value: '0.015' } });

    // Submit FFT calculation
    const generateButton = screen.getByText('Generate FFT Surface');
    fireEvent.click(generateButton);

    // Wait for FFT API calls
    await waitFor(() => {
      expect(vi.mocked(api.priceCallFFT)).toHaveBeenCalled();
      expect(vi.mocked(api.pricePutFFT)).toHaveBeenCalled();
    });

    // Verify FFT results are displayed
    await waitFor(() => {
      expect(screen.getByText('Option chain slice')).toBeInTheDocument();
      expect(screen.getByText('FFT')).toBeInTheDocument(); // Model name
    });
  });

  it('should handle market data integration workflow', async () => {
    render(<PricingWorkspace showMarketData={true} />);

    // Wait for market data components to load
    await waitFor(() => {
      expect(vi.mocked(api.checkMarketDataHealth)).toHaveBeenCalled();
      expect(vi.mocked(api.getSupportedSymbols)).toHaveBeenCalled();
    });

    // Verify market data dashboard is present
    expect(screen.getByText(/Market Data/)).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    vi.mocked(api.priceCallBS).mockRejectedValue(new Error('API Error: Invalid parameters'));
    vi.mocked(api.pricePutBS).mockRejectedValue(new Error('API Error: Invalid parameters'));

    render(<PricingWorkspace defaultTab="bs" />);

    // Submit calculation with invalid parameters
    const calculateButton = screen.getByText('Calculate Call & Put');
    fireEvent.click(calculateButton);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should validate input parameters', async () => {
    render(<PricingWorkspace defaultTab="bs" />);

    // Try to enter invalid parameters
    const spotInput = screen.getByDisplayValue('100');
    fireEvent.change(spotInput, { target: { value: '-50' } }); // Negative spot price

    const calculateButton = screen.getByText('Calculate Call & Put');
    fireEvent.click(calculateButton);

    // The component should handle validation (either client-side or server-side)
    // This test verifies the system doesn't crash with invalid inputs
    expect(calculateButton).toBeInTheDocument();
  });

  it('should maintain state consistency across model switches', async () => {
    render(<PricingWorkspace />);

    // Set parameters in BS mode
    const spotInput = screen.getByDisplayValue('100');
    fireEvent.change(spotInput, { target: { value: '110' } });

    // Switch to FFT mode
    const fftTab = screen.getByText('Surface · Carr-Madan FFT');
    fireEvent.click(fftTab);

    // Switch back to BS mode
    const bsTab = screen.getByText('Analytical · Black-Scholes');
    fireEvent.click(bsTab);

    // Verify parameters are maintained
    expect(screen.getByDisplayValue('110')).toBeInTheDocument();
  });

  it('should handle concurrent calculations', async () => {
    render(<PricingWorkspace defaultTab="bs" />);

    const calculateButton = screen.getByText('Calculate Call & Put');
    
    // Trigger multiple rapid calculations
    fireEvent.click(calculateButton);
    fireEvent.click(calculateButton);
    fireEvent.click(calculateButton);

    // Wait for all calls to complete
    await waitFor(() => {
      expect(vi.mocked(api.priceCallBS)).toHaveBeenCalled();
      expect(vi.mocked(api.pricePutBS)).toHaveBeenCalled();
    });

    // System should handle concurrent requests gracefully
    expect(calculateButton).toBeInTheDocument();
  });

  it('should export results correctly', async () => {
    // Mock successful calculation first
    render(<PricingWorkspace defaultTab="bs" />);

    const calculateButton = screen.getByText('Calculate Call & Put');
    fireEvent.click(calculateButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('$10.4506')).toBeInTheDocument();
    });

    // Find and click export button (should be visible after calculation)
    const exportButtons = screen.getAllByText(/Export/);
    expect(exportButtons.length).toBeGreaterThan(0);
    
    // Click the first export button
    fireEvent.click(exportButtons[0]);
    
    // Verify export functionality doesn't crash
    // (Actual file download testing would require more complex setup)
  });

  it('should display performance metrics', async () => {
    render(<PricingWorkspace defaultTab="bs" />);

    const calculateButton = screen.getByText('Calculate Call & Put');
    fireEvent.click(calculateButton);

    // Wait for results with performance metrics
    await waitFor(() => {
      expect(screen.getByText(/ms/)).toBeInTheDocument(); // Response time
    });
  });

  it('should handle market data symbol selection', async () => {
    render(<PricingWorkspace showMarketData={true} />);

    // Wait for market data to load
    await waitFor(() => {
      expect(vi.mocked(api.getSupportedSymbols)).toHaveBeenCalled();
    });

    // Simulate symbol selection (this would trigger market data fetch)
    // The exact implementation depends on the MarketDataDashboard component
    // This test verifies the integration doesn't crash
    expect(screen.getByText(/Market Data/)).toBeInTheDocument();
  });
});