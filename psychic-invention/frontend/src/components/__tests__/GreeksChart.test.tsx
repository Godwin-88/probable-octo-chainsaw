import { render, screen } from '@testing-library/react';
import { GreeksChart } from '../GreeksChart';
import type { GreeksVisualizationData } from '@/types';

// Mock canvas context (reuse from VolatilitySurfaceChart test)
const mockGetContext = jest.fn();
const mockCanvasContext = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fillText: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  set fillStyle(value: string) {},
  set strokeStyle(value: string) {},
  set lineWidth(value: number) {},
  set font(value: string) {},
  set textAlign(value: string) {}
};

beforeEach(() => {
  mockGetContext.mockReturnValue(mockCanvasContext);
  Object.values(mockCanvasContext).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockClear();
    }
  });
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockGetContext
});

describe('GreeksChart', () => {
  const mockGreeksData: GreeksVisualizationData = {
    spotPrices: [90, 95, 100, 105, 110],
    deltas: [0.2, 0.4, 0.5, 0.6, 0.8],
    gammas: [0.01, 0.02, 0.025, 0.02, 0.01],
    thetas: [-0.05, -0.04, -0.03, -0.04, -0.05],
    vegas: [0.15, 0.18, 0.20, 0.18, 0.15],
    rhos: [0.08, 0.12, 0.15, 0.18, 0.20]
  };

  it('renders empty state when no data provided', () => {
    const emptyData: GreeksVisualizationData = {
      spotPrices: [],
      deltas: [],
      gammas: [],
      thetas: [],
      vegas: [],
      rhos: []
    };

    render(<GreeksChart data={emptyData} />);
    
    expect(screen.getByText('No Greeks data available')).toBeInTheDocument();
  });

  it('renders canvas when valid data provided', () => {
    render(<GreeksChart data={mockGreeksData} />);
    
    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '500');
    expect(canvas).toHaveAttribute('height', '300');
  });

  it('renders delta by default', () => {
    render(<GreeksChart data={mockGreeksData} />);
    
    // Verify canvas drawing methods were called
    expect(mockGetContext).toHaveBeenCalledWith('2d');
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    expect(mockCanvasContext.stroke).toHaveBeenCalled();
  });

  it('renders different Greeks when selectedGreek changes', () => {
    const { rerender } = render(
      <GreeksChart data={mockGreeksData} selectedGreek="delta" />
    );
    
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    
    // Clear mock calls
    mockCanvasContext.clearRect.mockClear();
    
    rerender(<GreeksChart data={mockGreeksData} selectedGreek="gamma" />);
    
    // Should clear and redraw for new Greek
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
  });

  it('handles all Greek types', () => {
    const greekTypes: Array<'delta' | 'gamma' | 'theta' | 'vega' | 'rho'> = 
      ['delta', 'gamma', 'theta', 'vega', 'rho'];

    greekTypes.forEach(greek => {
      const { unmount } = render(
        <GreeksChart data={mockGreeksData} selectedGreek={greek} />
      );
      
      // Should render without errors
      const canvas = screen.getByRole('img', { hidden: true });
      expect(canvas).toBeInTheDocument();
      
      unmount();
    });
  });

  it('applies custom dimensions', () => {
    render(
      <GreeksChart 
        data={mockGreeksData} 
        width={800} 
        height={400} 
      />
    );
    
    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '400');
  });

  it('applies custom className', () => {
    const { container } = render(
      <GreeksChart 
        data={mockGreeksData} 
        className="custom-class" 
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('draws grid lines and axes', () => {
    render(<GreeksChart data={mockGreeksData} />);
    
    // Verify drawing operations for grid and axes
    expect(mockCanvasContext.beginPath).toHaveBeenCalled();
    expect(mockCanvasContext.moveTo).toHaveBeenCalled();
    expect(mockCanvasContext.lineTo).toHaveBeenCalled();
    expect(mockCanvasContext.stroke).toHaveBeenCalled();
  });

  it('draws data points and curve', () => {
    render(<GreeksChart data={mockGreeksData} />);
    
    // Verify curve drawing
    expect(mockCanvasContext.moveTo).toHaveBeenCalled();
    expect(mockCanvasContext.lineTo).toHaveBeenCalled();
    
    // Verify data points (circles)
    expect(mockCanvasContext.arc).toHaveBeenCalled();
    expect(mockCanvasContext.fill).toHaveBeenCalled();
  });

  it('renders chart title with selected Greek', () => {
    render(<GreeksChart data={mockGreeksData} selectedGreek="gamma" />);
    
    // Verify title rendering
    expect(mockCanvasContext.fillText).toHaveBeenCalledWith(
      'Gamma (Γ) vs Spot Price',
      expect.any(Number),
      expect.any(Number)
    );
  });
});