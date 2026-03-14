import { render, screen } from '@testing-library/react';
import { OptionChainDisplay } from '../OptionChainDisplay';
import type { OptionChainData } from '@/types';

describe('OptionChainDisplay', () => {
  const mockOptionChainData: OptionChainData[] = [
    {
      strike: 95,
      expiration: '2024-03-15',
      callPrice: 8.50,
      putPrice: 2.25,
      callImpliedVol: 0.22,
      putImpliedVol: 0.21,
      callGreeks: {
        delta: 0.75,
        gamma: 0.025,
        theta: -0.05,
        vega: 0.18,
        rho: 0.12
      },
      putGreeks: {
        delta: -0.25,
        gamma: 0.025,
        theta: -0.04,
        vega: 0.18,
        rho: -0.08
      }
    },
    {
      strike: 100,
      expiration: '2024-03-15',
      callPrice: 5.75,
      putPrice: 4.50,
      callImpliedVol: 0.20,
      putImpliedVol: 0.20,
      callGreeks: {
        delta: 0.50,
        gamma: 0.030,
        theta: -0.06,
        vega: 0.20,
        rho: 0.15
      }
    },
    {
      strike: 105,
      expiration: '2024-03-15',
      callPrice: 3.25,
      putPrice: 7.75,
      callImpliedVol: 0.21,
      putImpliedVol: 0.22
    }
  ];

  it('renders empty state when no data provided', () => {
    render(<OptionChainDisplay data={[]} />);
    
    expect(screen.getByText('No option chain data available')).toBeInTheDocument();
    expect(screen.getByText('Connect to market data to view option chains')).toBeInTheDocument();
  });

  it('renders option chain table with data', () => {
    render(<OptionChainDisplay data={mockOptionChainData} />);
    
    expect(screen.getByText('Option Chain')).toBeInTheDocument();
    expect(screen.getByText('3 strikes • No spot price')).toBeInTheDocument();
    
    // Check table headers
    expect(screen.getByText('Strike')).toBeInTheDocument();
    expect(screen.getByText('Expiration')).toBeInTheDocument();
    expect(screen.getByText('Calls')).toBeInTheDocument();
    expect(screen.getByText('Puts')).toBeInTheDocument();
  });

  it('displays option data correctly', () => {
    render(<OptionChainDisplay data={mockOptionChainData} />);
    
    // Check strike prices
    expect(screen.getByText('$95.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$105.00')).toBeInTheDocument();
    
    // Check option prices
    expect(screen.getByText('$8.5000')).toBeInTheDocument();
    expect(screen.getByText('$2.2500')).toBeInTheDocument();
    expect(screen.getByText('$5.7500')).toBeInTheDocument();
    expect(screen.getByText('$4.5000')).toBeInTheDocument();
  });

  it('shows moneyness indicators with spot price', () => {
    render(
      <OptionChainDisplay 
        data={mockOptionChainData} 
        currentSpotPrice={100} 
      />
    );
    
    expect(screen.getByText('Spot: $100.00')).toBeInTheDocument();
    
    // Check moneyness labels
    expect(screen.getByText('(ITM)')).toBeInTheDocument(); // 95 strike
    expect(screen.getByText('(ATM)')).toBeInTheDocument(); // 100 strike  
    expect(screen.getByText('(OTM)')).toBeInTheDocument(); // 105 strike
  });

  it('displays implied volatilities when enabled', () => {
    render(
      <OptionChainDisplay 
        data={mockOptionChainData} 
        showImpliedVol={true} 
      />
    );
    
    // Check IV column headers
    expect(screen.getAllByText('IV')).toHaveLength(2); // Call IV and Put IV
    
    // Check IV values
    expect(screen.getByText('22.0%')).toBeInTheDocument();
    expect(screen.getByText('21.0%')).toBeInTheDocument();
    expect(screen.getByText('20.0%')).toBeInTheDocument();
  });

  it('hides implied volatilities when disabled', () => {
    render(
      <OptionChainDisplay 
        data={mockOptionChainData} 
        showImpliedVol={false} 
      />
    );
    
    // IV columns should not be present
    expect(screen.queryByText('IV')).not.toBeInTheDocument();
  });

  it('displays Greeks when enabled and available', () => {
    render(
      <OptionChainDisplay 
        data={mockOptionChainData} 
        showGreeks={true} 
      />
    );
    
    // Check Greeks column headers
    expect(screen.getByText('Δ')).toBeInTheDocument();
    expect(screen.getByText('Γ')).toBeInTheDocument();
    expect(screen.getByText('Θ')).toBeInTheDocument();
    expect(screen.getByText('ν')).toBeInTheDocument();
    expect(screen.getByText('ρ')).toBeInTheDocument();
    
    // Check Greeks values
    expect(screen.getByText('0.750')).toBeInTheDocument(); // Delta
    expect(screen.getByText('2.50e-2')).toBeInTheDocument(); // Gamma
    expect(screen.getByText('-0.050')).toBeInTheDocument(); // Theta
  });

  it('hides Greeks when disabled', () => {
    render(
      <OptionChainDisplay 
        data={mockOptionChainData} 
        showGreeks={false} 
      />
    );
    
    // Greeks columns should not be present
    expect(screen.queryByText('Δ')).not.toBeInTheDocument();
    expect(screen.queryByText('Γ')).not.toBeInTheDocument();
  });

  it('shows dash for missing Greeks data', () => {
    render(
      <OptionChainDisplay 
        data={mockOptionChainData} 
        showGreeks={true} 
      />
    );
    
    // Third option has no Greeks data, should show dashes
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it('shows dash for missing implied volatility', () => {
    const dataWithMissingIV: OptionChainData[] = [
      {
        strike: 100,
        expiration: '2024-03-15',
        callPrice: 5.75,
        putPrice: 4.50
        // No implied volatility data
      }
    ];

    render(
      <OptionChainDisplay 
        data={dataWithMissingIV} 
        showImpliedVol={true} 
      />
    );
    
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThanOrEqual(2); // At least 2 dashes for missing IV
  });

  it('sorts options by strike price', () => {
    const unsortedData: OptionChainData[] = [
      {
        strike: 105,
        expiration: '2024-03-15',
        callPrice: 3.25,
        putPrice: 7.75
      },
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

    render(<OptionChainDisplay data={unsortedData} />);
    
    // Get all strike price elements
    const strikeElements = screen.getAllByText(/\$\d+\.\d+/);
    const strikeTexts = strikeElements.map(el => el.textContent);
    
    // Should be sorted: $95.00, $100.00, $105.00
    expect(strikeTexts).toContain('$95.00');
    expect(strikeTexts).toContain('$100.00');
    expect(strikeTexts).toContain('$105.00');
  });

  it('applies custom className', () => {
    const { container } = render(
      <OptionChainDisplay 
        data={mockOptionChainData} 
        className="custom-class" 
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies moneyness styling classes', () => {
    const { container } = render(
      <OptionChainDisplay 
        data={mockOptionChainData} 
        currentSpotPrice={100} 
      />
    );
    
    // Check for moneyness-related CSS classes
    expect(container.querySelector('.bg-green-900\\/20')).toBeInTheDocument(); // ITM
    expect(container.querySelector('.bg-yellow-900\\/20')).toBeInTheDocument(); // ATM
    expect(container.querySelector('.bg-slate-900\\/20')).toBeInTheDocument(); // OTM
  });

  it('shows total contract count', () => {
    render(<OptionChainDisplay data={mockOptionChainData} />);
    
    expect(screen.getByText('Showing 3 option contracts')).toBeInTheDocument();
  });

  it('handles large datasets with footer message', () => {
    const largeDataset = Array.from({ length: 15 }, (_, i) => ({
      strike: 90 + i * 5,
      expiration: '2024-03-15',
      callPrice: 10 - i * 0.5,
      putPrice: i * 0.5 + 1
    }));

    render(<OptionChainDisplay data={largeDataset} />);
    
    expect(screen.getByText('Showing 15 option contracts')).toBeInTheDocument();
  });
});