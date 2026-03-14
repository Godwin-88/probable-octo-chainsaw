import { render, screen, fireEvent } from '@testing-library/react';
import { MarketDataVisualization } from '../MarketDataVisualization';
import type { VolatilitySurfaceData, GreeksVisualizationData, OptionChainData } from '@/types';

// Mock the chart components
jest.mock('../VolatilitySurfaceChart', () => ({
  VolatilitySurfaceChart: ({ data }: { data: VolatilitySurfaceData }) => (
    <div data-testid="volatility-surface-chart">
      Volatility Surface Chart - {data.strikes.length} strikes
    </div>
  )
}));

jest.mock('../GreeksChart', () => ({
  GreeksChart: ({ data, selectedGreek }: { data: GreeksVisualizationData, selectedGreek: string }) => (
    <div data-testid="greeks-chart">
      Greeks Chart - {selectedGreek} - {data.spotPrices.length} points
    </div>
  )
}));

jest.mock('../OptionChainDisplay', () => ({
  OptionChainDisplay: ({ data }: { data: OptionChainData[] }) => (
    <div data-testid="option-chain-display">
      Option Chain - {data.length} options
    </div>
  )
}));

describe('MarketDataVisualization', () => {
  const mockVolatilitySurface: VolatilitySurfaceData = {
    strikes: [90, 95, 100, 105, 110],
    expirations: [0.25, 0.5, 1.0],
    volatilities: [
      [0.25, 0.22, 0.20, 0.22, 0.25],
      [0.23, 0.21, 0.19, 0.21, 0.23],
      [0.22, 0.20, 0.18, 0.20, 0.22]
    ]
  };

  const mockGreeksData: GreeksVisualizationData = {
    spotPrices: [90, 95, 100, 105, 110],
    deltas: [0.2, 0.4, 0.5, 0.6, 0.8],
    gammas: [0.01, 0.02, 0.025, 0.02, 0.01],
    thetas: [-0.05, -0.04, -0.03, -0.04, -0.05],
    vegas: [0.15, 0.18, 0.20, 0.18, 0.15],
    rhos: [0.08, 0.12, 0.15, 0.18, 0.20]
  };

  const mockOptionChain: OptionChainData[] = [
    {
      strike: 95,
      expiration: '2024-03-15',
      callPrice: 8.50,
      putPrice: 2.25
    },
    {
      strike: 100,
      expiration: '2024-03-15',
      callPrice: 5.75,
      putPrice: 4.50
    }
  ];

  it('renders empty state when no data provided', () => {
    render(<MarketDataVisualization />);
    
    expect(screen.getByText('Market Data Visualization')).toBeInTheDocument();
    expect(screen.getByText('No market data available for visualization')).toBeInTheDocument();
    
    // Should show description cards
    expect(screen.getByText('Volatility Surface')).toBeInTheDocument();
    expect(screen.getByText('Greeks Analysis')).toBeInTheDocument();
    expect(screen.getByText('Option Chain')).toBeInTheDocument();
  });

  it('renders tabs for available data', () => {
    render(
      <MarketDataVisualization 
        volatilitySurface={mockVolatilitySurface}
        greeksData={mockGreeksData}
        optionChain={mockOptionChain}
      />
    );
    
    expect(screen.getByText('Volatility Surface')).toBeInTheDocument();
    expect(screen.getByText('Greeks Analysis')).toBeInTheDocument();
    expect(screen.getByText('Option Chain')).toBeInTheDocument();
  });

  it('shows only available tabs when some data is missing', () => {
    render(
      <MarketDataVisualization 
        volatilitySurface={mockVolatilitySurface}
        // No Greeks or option chain data
      />
    );
    
    expect(screen.getByText('Volatility Surface')).toBeInTheDocument();
    expect(screen.queryByText('Greeks Analysis')).not.toBeInTheDocument();
    expect(screen.queryByText('Option Chain')).not.toBeInTheDocument();
  });

  it('defaults to volatility surface tab when available', () => {
    render(
      <MarketDataVisualization 
        volatilitySurface={mockVolatilitySurface}
        greeksData={mockGreeksData}
      />
    );
    
    // Volatility surface tab should be active
    const volTab = screen.getByText('Volatility Surface');
    expect(volTab.closest('button')).toHaveClass('text-white', 'border-blue-500');
    
    // Should show volatility surface chart
    expect(screen.getByTestId('volatility-surface-chart')).toBeInTheDocument();
  });

  it('switches tabs correctly', () => {
    render(
      <MarketDataVisualization 
        volatilitySurface={mockVolatilitySurface}
        greeksData={mockGreeksData}
        optionChain={mockOptionChain}
      />
    );
    
    // Click Greeks tab
    fireEvent.click(screen.getByText('Greeks Analysis'));
    
    // Should show Greeks chart
    expect(screen.getByTestId('greeks-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('volatility-surface-chart')).not.toBeInTheDocument();
    
    // Click Option Chain tab
    fireEvent.click(screen.getByText('Option Chain'));
    
    // Should show option chain
    expect(screen.getByTestId('option-chain-display')).toBeInTheDocument();
    expect(screen.queryByTestId('greeks-chart')).not.toBeInTheDocument();
  });

  it('renders volatility surface content correctly', () => {
    render(
      <MarketDataVisualization 
        volatilitySurface={mockVolatilitySurface}
      />
    );
    
    expect(screen.getByText('Implied Volatility Surface')).toBeInTheDocument();
    expect(screen.getByText('3D visualization of implied volatility across different strikes and expirations')).toBeInTheDocument();
    expect(screen.getByTestId('volatility-surface-chart')).toBeInTheDocument();
  });

  it('renders Greeks analysis content with selector', () => {
    render(
      <MarketDataVisualization 
        greeksData={mockGreeksData}
      />
    );
    
    // Should default to Greeks tab since it's the only available data
    expect(screen.getByText('Greeks Analysis')).toBeInTheDocument();
    expect(screen.getByText('Option sensitivities across different spot prices')).toBeInTheDocument();
    
    // Should have Greek selector
    const selector = screen.getByDisplayValue('Delta (Δ)');
    expect(selector).toBeInTheDocument();
    
    // Should show Greeks chart
    expect(screen.getByTestId('greeks-chart')).toBeInTheDocument();
  });

  it('changes selected Greek in Greeks analysis', () => {
    render(
      <MarketDataVisualization 
        greeksData={mockGreeksData}
      />
    );
    
    const selector = screen.getByDisplayValue('Delta (Δ)');
    
    // Change to Gamma
    fireEvent.change(selector, { target: { value: 'gamma' } });
    
    // Should update the chart (mocked component will show the selected Greek)
    expect(screen.getByText(/Greeks Chart - gamma/)).toBeInTheDocument();
  });

  it('renders Greeks summary cards', () => {
    render(
      <MarketDataVisualization 
        greeksData={mockGreeksData}
      />
    );
    
    // Should show summary cards for all Greeks
    expect(screen.getByText('Delta (Δ)')).toBeInTheDocument();
    expect(screen.getByText('Gamma (Γ)')).toBeInTheDocument();
    expect(screen.getByText('Theta (Θ)')).toBeInTheDocument();
    expect(screen.getByText('Vega (ν)')).toBeInTheDocument();
    expect(screen.getByText('Rho (ρ)')).toBeInTheDocument();
  });

  it('renders option chain content correctly', () => {
    render(
      <MarketDataVisualization 
        optionChain={mockOptionChain}
        currentSpotPrice={100}
      />
    );
    
    expect(screen.getByText('Option Chain')).toBeInTheDocument();
    expect(screen.getByText('Complete option chain with prices, implied volatilities, and Greeks')).toBeInTheDocument();
    expect(screen.getByTestId('option-chain-display')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MarketDataVisualization 
        volatilitySurface={mockVolatilitySurface}
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles tab switching when active tab becomes unavailable', () => {
    const { rerender } = render(
      <MarketDataVisualization 
        volatilitySurface={mockVolatilitySurface}
        greeksData={mockGreeksData}
      />
    );
    
    // Switch to Greeks tab
    fireEvent.click(screen.getByText('Greeks Analysis'));
    expect(screen.getByTestId('greeks-chart')).toBeInTheDocument();
    
    // Remove Greeks data, should switch to volatility surface
    rerender(
      <MarketDataVisualization 
        volatilitySurface={mockVolatilitySurface}
      />
    );
    
    expect(screen.getByTestId('volatility-surface-chart')).toBeInTheDocument();
  });

  it('passes correct props to child components', () => {
    render(
      <MarketDataVisualization 
        volatilitySurface={mockVolatilitySurface}
        greeksData={mockGreeksData}
        optionChain={mockOptionChain}
        currentSpotPrice={100}
      />
    );
    
    // Check volatility surface chart props
    expect(screen.getByText('Volatility Surface Chart - 5 strikes')).toBeInTheDocument();
    
    // Switch to Greeks and check props
    fireEvent.click(screen.getByText('Greeks Analysis'));
    expect(screen.getByText('Greeks Chart - delta - 5 points')).toBeInTheDocument();
    
    // Switch to option chain and check props
    fireEvent.click(screen.getByText('Option Chain'));
    expect(screen.getByText('Option Chain - 2 options')).toBeInTheDocument();
  });
});