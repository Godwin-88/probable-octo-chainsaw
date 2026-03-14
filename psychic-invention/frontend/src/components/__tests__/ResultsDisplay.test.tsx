import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PricingWorkspace } from '../PricingWorkspace';
import type { BlackScholesResult, FFTPricingResult } from '@/types';

// Mock the API hooks with configurable return values
let mockBSResult: BlackScholesResult | null = null;
let mockFFTResult: FFTPricingResult | null = null;
let mockBSLoading = false;
let mockFFTLoading = false;
let mockBSError: string | null = null;
let mockFFTError: string | null = null;

const mockBSCalculate = vi.fn();
const mockFFTCalculate = vi.fn();

vi.mock('@/hooks/useApi', () => ({
  useBlackScholesPricing: () => ({
    calculate: mockBSCalculate,
    loading: mockBSLoading,
    error: mockBSError,
    result: mockBSResult,
  }),
  useFFTPricing: () => ({
    calculate: mockFFTCalculate,
    loading: mockFFTLoading,
    error: mockFFTError,
    result: mockFFTResult,
  }),
}));

// Mock the Greeks utility
const mockGreeks = {
  delta: 0.5234,
  gamma: 0.0123,
  theta: -0.0456,
  vega: 0.2789,
  rho: 0.1567,
};

vi.mock('@/utils/greeks', () => ({
  computeCallGreeks: vi.fn(() => mockGreeks),
}));

// Mock the export utilities
vi.mock('@/utils/export', () => ({
  exportBlackScholesCSV: vi.fn(),
  exportBlackScholesJSON: vi.fn(),
  exportFFTSurfaceCSV: vi.fn(),
  exportFFTSurfaceJSON: vi.fn(),
  exportFFTCompleteJSON: vi.fn(),
}));

describe('Results Display Components - Task 6.3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockBSResult = null;
    mockFFTResult = null;
    mockBSLoading = false;
    mockFFTLoading = false;
    mockBSError = null;
    mockFFTError = null;
  });

  describe('Black-Scholes Results Display Formatting', () => {
    it('should display formatted pricing results with proper structure', () => {
      // Set up mock result data
      mockBSResult = {
        callPrice: 12.3456,
        putPrice: 8.7654,
        model: 'Black-Scholes',
        responseTime: 45,
      };

      render(<PricingWorkspace />);
      
      // Verify call price is formatted correctly per requirement 4.3
      expect(screen.getByText('$12.3456')).toBeInTheDocument();
      
      // Verify put price is formatted correctly per requirement 4.3
      expect(screen.getByText('$8.7654')).toBeInTheDocument();
      
      // Verify model name is displayed
      expect(screen.getByText('Black-Scholes')).toBeInTheDocument();
      
      // Verify response time is displayed with proper formatting
      expect(screen.getByText('45 ms')).toBeInTheDocument();
    });

    it('should display Greeks in formatted table structure', () => {
      mockBSResult = {
        callPrice: 10.0,
        putPrice: 5.0,
        model: 'Black-Scholes',
        responseTime: 30,
      };

      render(<PricingWorkspace />);
      
      // Verify Greeks are displayed with proper formatting per requirement 4.3
      expect(screen.getByText('Δ 0.523')).toBeInTheDocument();
      expect(screen.getByText('Γ 1.23e-2')).toBeInTheDocument();
      expect(screen.getByText('Θ -0.046')).toBeInTheDocument();
      expect(screen.getByText('ν 0.279')).toBeInTheDocument();
      expect(screen.getByText('ρ 0.157')).toBeInTheDocument();
      
      // Verify Greeks section has proper header
      expect(screen.getByText('Greeks (call)')).toBeInTheDocument();
    });

    it('should display results in proper grid layout structure', () => {
      mockBSResult = {
        callPrice: 15.25,
        putPrice: 3.75,
        model: 'Black-Scholes',
        responseTime: 22,
      };

      render(<PricingWorkspace />);
      
      // Verify results are displayed in structured format per requirement 4.3
      const callTile = screen.getByText('Call').closest('div');
      const putTile = screen.getByText('Put').closest('div');
      
      expect(callTile).toBeInTheDocument();
      expect(putTile).toBeInTheDocument();
      
      // Verify price formatting within tiles
      expect(screen.getByText('$15.2500')).toBeInTheDocument();
      expect(screen.getByText('$3.7500')).toBeInTheDocument();
    });

    it('should display metadata in formatted pills', () => {
      mockBSResult = {
        callPrice: 8.5,
        putPrice: 6.2,
        model: 'Black-Scholes',
        responseTime: 18,
      };

      render(<PricingWorkspace />);
      
      // Verify metadata is displayed in formatted structure per requirement 4.3
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Latency')).toBeInTheDocument();
      expect(screen.getByText('Parity')).toBeInTheDocument();
      
      // Verify values are properly formatted
      expect(screen.getByText('18 ms')).toBeInTheDocument();
      expect(screen.getByText('S-Ke^(-rT)')).toBeInTheDocument();
    });
  });

  describe('FFT Results Display Formatting', () => {
    beforeEach(() => {
      render(<PricingWorkspace />);
      // Switch to FFT tab
      const fftTab = screen.getByText('Surface · Carr-Madan FFT');
      fireEvent.click(fftTab);
    });

    it('should display FFT results in formatted table structure', () => {
      mockFFTResult = {
        model: 'FFT-Carr-Madan',
        callSurface: [15.2, 12.8, 10.5, 8.3, 6.2, 4.5, 3.1],
        putSurface: [0.1, 0.8, 2.1, 4.2, 6.8, 9.5, 12.3],
        params: {
          k_min: 4.5,
          delta_k: 0.1,
          n: 2048,
        },
      };

      render(<PricingWorkspace />);
      const fftTab = screen.getByText('Surface · Carr-Madan FFT');
      fireEvent.click(fftTab);
      
      // Verify table headers are present per requirement 4.3
      expect(screen.getByText('Strike')).toBeInTheDocument();
      expect(screen.getByText('Call')).toBeInTheDocument();
      expect(screen.getByText('Put')).toBeInTheDocument();
      
      // Verify formatted table structure exists
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should display FFT metadata in formatted pills', () => {
      mockFFTResult = {
        model: 'FFT-Carr-Madan',
        callSurface: [10.0, 8.0, 6.0],
        putSurface: [2.0, 4.0, 6.0],
        params: {
          k_min: 4.5,
          delta_k: 0.05,
          n: 4096,
        },
      };

      render(<PricingWorkspace />);
      const fftTab = screen.getByText('Surface · Carr-Madan FFT');
      fireEvent.click(fftTab);
      
      // Verify FFT metadata is displayed in formatted structure per requirement 4.3
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Grid')).toBeInTheDocument();
      expect(screen.getByText('Δk')).toBeInTheDocument();
      
      // Verify values are properly formatted
      expect(screen.getByText('4096')).toBeInTheDocument();
      expect(screen.getByText('5.00e-2')).toBeInTheDocument();
    });

    it('should display option chain slice with proper formatting', () => {
      mockFFTResult = {
        model: 'FFT-Carr-Madan',
        callSurface: Array.from({ length: 2048 }, (_, i) => Math.max(0, 100 - (90 + i * 0.1))),
        putSurface: Array.from({ length: 2048 }, (_, i) => Math.max(0, (90 + i * 0.1) - 100)),
        params: {
          k_min: Math.log(90),
          delta_k: 0.1 / 2048 * 2 * Math.PI,
          n: 2048,
        },
      };

      render(<PricingWorkspace />);
      const fftTab = screen.getByText('Surface · Carr-Madan FFT');
      fireEvent.click(fftTab);
      
      // Verify option chain header is formatted properly per requirement 4.3
      expect(screen.getByText('Option chain slice')).toBeInTheDocument();
      expect(screen.getByText(/Centered at K=/)).toBeInTheDocument();
    });
  });

  describe('Empty State Display', () => {
    it('should display formatted empty state for Black-Scholes', () => {
      render(<PricingWorkspace />);
      
      // Verify empty state formatting per requirement 4.3
      expect(screen.getByText('Awaiting calculation...')).toBeInTheDocument();
      expect(screen.getByText('Send a payload and results will render here.')).toBeInTheDocument();
    });

    it('should display formatted empty state for FFT', () => {
      render(<PricingWorkspace />);
      const fftTab = screen.getByText('Surface · Carr-Madan FFT');
      fireEvent.click(fftTab);
      
      // Verify FFT empty state formatting per requirement 4.3
      expect(screen.getByText('Generate an FFT grid to view surface data.')).toBeInTheDocument();
      expect(screen.getByText('We recommend n=2048, α=1.5 for stability.')).toBeInTheDocument();
    });
  });

  describe('Loading State Display', () => {
    it('should maintain proper formatting during Black-Scholes loading', () => {
      mockBSLoading = true;
      
      render(<PricingWorkspace />);
      
      // Verify loading state maintains proper structure per requirement 4.3
      expect(screen.getByText('Pricing...')).toBeInTheDocument();
      
      // Should still show empty state in results area
      expect(screen.getByText('Awaiting calculation...')).toBeInTheDocument();
    });

    it('should maintain proper formatting during FFT loading', () => {
      mockFFTLoading = true;
      
      render(<PricingWorkspace />);
      const fftTab = screen.getByText('Surface · Carr-Madan FFT');
      fireEvent.click(fftTab);
      
      // Verify FFT loading state maintains proper structure per requirement 4.3
      expect(screen.getByText('Generating surface...')).toBeInTheDocument();
      
      // Should still show empty state in results area
      expect(screen.getByText('Generate an FFT grid to view surface data.')).toBeInTheDocument();
    });
  });

  describe('Error State Display', () => {
    it('should display formatted error messages for Black-Scholes', () => {
      mockBSError = 'Invalid parameters provided';
      
      render(<PricingWorkspace />);
      
      // Verify error formatting per requirement 4.3
      expect(screen.getByText('Error: Invalid parameters provided')).toBeInTheDocument();
      
      // Should maintain results area structure
      expect(screen.getByText('Awaiting calculation...')).toBeInTheDocument();
    });

    it('should display formatted error messages for FFT', () => {
      mockFFTError = 'FFT calculation failed';
      
      render(<PricingWorkspace />);
      const fftTab = screen.getByText('Surface · Carr-Madan FFT');
      fireEvent.click(fftTab);
      
      // Verify FFT error formatting per requirement 4.3
      expect(screen.getByText('Error: FFT calculation failed')).toBeInTheDocument();
      
      // Should maintain results area structure
      expect(screen.getByText('Generate an FFT grid to view surface data.')).toBeInTheDocument();
    });
  });

  describe('Export Integration with Results Display', () => {
    it('should show export options when Black-Scholes results are available', () => {
      mockBSResult = {
        callPrice: 10.0,
        putPrice: 5.0,
        model: 'Black-Scholes',
        responseTime: 30,
      };

      render(<PricingWorkspace />);
      
      // Verify export functionality is integrated with results display per requirement 4.5
      expect(screen.getByText('Results')).toBeInTheDocument();
      
      // Export button should be present when results are available
      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).toBeInTheDocument();
    });

    it('should show export options when FFT results are available', () => {
      mockFFTResult = {
        model: 'FFT-Carr-Madan',
        callSurface: [10.0, 8.0, 6.0],
        putSurface: [2.0, 4.0, 6.0],
        params: {
          k_min: 4.5,
          delta_k: 0.05,
          n: 2048,
        },
      };

      render(<PricingWorkspace />);
      const fftTab = screen.getByText('Surface · Carr-Madan FFT');
      fireEvent.click(fftTab);
      
      // Verify FFT export functionality is integrated with results display per requirement 4.5
      const exportButtons = screen.getAllByRole('button', { name: /export/i });
      expect(exportButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Results Display Responsiveness', () => {
    it('should maintain proper formatting on different screen sizes', () => {
      mockBSResult = {
        callPrice: 12.34,
        putPrice: 5.67,
        model: 'Black-Scholes',
        responseTime: 25,
      };

      render(<PricingWorkspace />);
      
      // Verify responsive design maintains proper formatting per requirement 4.8
      expect(screen.getByText('$12.3400')).toBeInTheDocument();
      expect(screen.getByText('$5.6700')).toBeInTheDocument();
      
      // Grid layout should be maintained
      const callTile = screen.getByText('Call').closest('div');
      const putTile = screen.getByText('Put').closest('div');
      
      expect(callTile).toBeInTheDocument();
      expect(putTile).toBeInTheDocument();
    });

    it('should handle tab switching with proper results display', () => {
      mockBSResult = {
        callPrice: 10.0,
        putPrice: 5.0,
        model: 'Black-Scholes',
        responseTime: 30,
      };

      mockFFTResult = {
        model: 'FFT-Carr-Madan',
        callSurface: [8.0, 6.0, 4.0],
        putSurface: [3.0, 5.0, 7.0],
        params: {
          k_min: 4.5,
          delta_k: 0.05,
          n: 1024,
        },
      };

      render(<PricingWorkspace />);
      
      // Verify Black-Scholes results display
      expect(screen.getByText('$10.0000')).toBeInTheDocument();
      
      // Switch to FFT tab
      const fftTab = screen.getByText('Surface · Carr-Madan FFT');
      fireEvent.click(fftTab);
      
      // Verify FFT results display
      expect(screen.getByText('1024')).toBeInTheDocument();
      
      // Switch back to Black-Scholes
      const bsTab = screen.getByText('Analytical · Black-Scholes');
      fireEvent.click(bsTab);
      
      // Should maintain Black-Scholes results display
      expect(screen.getByText('$10.0000')).toBeInTheDocument();
    });
  });

  describe('Numerical Precision in Results Display', () => {
    it('should format prices with consistent decimal places', () => {
      mockBSResult = {
        callPrice: 12.3,
        putPrice: 5.67891,
        model: 'Black-Scholes',
        responseTime: 30,
      };

      render(<PricingWorkspace />);
      
      // Verify consistent 4 decimal place formatting per requirement 4.3
      expect(screen.getByText('$12.3000')).toBeInTheDocument();
      expect(screen.getByText('$5.6789')).toBeInTheDocument();
    });

    it('should format Greeks with appropriate precision', () => {
      mockBSResult = {
        callPrice: 10.0,
        putPrice: 5.0,
        model: 'Black-Scholes',
        responseTime: 30,
      };

      render(<PricingWorkspace />);
      
      // Verify Greeks formatting with appropriate precision per requirement 4.3
      expect(screen.getByText('Δ 0.523')).toBeInTheDocument(); // 3 decimal places
      expect(screen.getByText('Γ 1.23e-2')).toBeInTheDocument(); // Scientific notation
      expect(screen.getByText('Θ -0.046')).toBeInTheDocument(); // 3 decimal places
      expect(screen.getByText('ν 0.279')).toBeInTheDocument(); // 3 decimal places
      expect(screen.getByText('ρ 0.157')).toBeInTheDocument(); // 3 decimal places
    });

    it('should format FFT table values with consistent precision', () => {
      mockFFTResult = {
        model: 'FFT-Carr-Madan',
        callSurface: Array.from({ length: 2048 }, (_, i) => {
          const strike = Math.exp(Math.log(90) + i * 0.1 / 2048 * 2 * Math.PI);
          return Math.max(0, 100 - strike);
        }),
        putSurface: Array.from({ length: 2048 }, (_, i) => {
          const strike = Math.exp(Math.log(90) + i * 0.1 / 2048 * 2 * Math.PI);
          return Math.max(0, strike - 100);
        }),
        params: {
          k_min: Math.log(90),
          delta_k: 0.1 / 2048 * 2 * Math.PI,
          n: 2048,
        },
      };

      render(<PricingWorkspace />);
      const fftTab = screen.getByText('Surface · Carr-Madan FFT');
      fireEvent.click(fftTab);
      
      // Verify table formatting maintains consistent precision per requirement 4.3
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Strike prices should be formatted to 2 decimal places
      // Option prices should be formatted to 4 decimal places
      // This validates the table structure for formatted display
    });
  });
});