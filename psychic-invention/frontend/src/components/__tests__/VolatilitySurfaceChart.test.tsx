import { render, screen } from '@testing-library/react';
import { VolatilitySurfaceChart } from '../VolatilitySurfaceChart';
import type { VolatilitySurfaceData } from '@/types';

// Mock canvas context
const mockGetContext = jest.fn();
const mockCanvas = {
  getContext: mockGetContext,
  width: 600,
  height: 400
};

// Mock canvas methods
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
  // Reset all mocks
  Object.values(mockCanvasContext).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockClear();
    }
  });
});

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockGetContext
});

describe('VolatilitySurfaceChart', () => {
  const mockVolatilitySurfaceData: VolatilitySurfaceData = {
    strikes: [90, 95, 100, 105, 110],
    expirations: [0.25, 0.5, 1.0],
    volatilities: [
      [0.25, 0.22, 0.20, 0.22, 0.25],
      [0.23, 0.21, 0.19, 0.21, 0.23],
      [0.22, 0.20, 0.18, 0.20, 0.22]
    ]
  };

  it('renders empty state when no data provided', () => {
    const emptyData: VolatilitySurfaceData = {
      strikes: [],
      expirations: [],
      volatilities: []
    };

    render(<VolatilitySurfaceChart data={emptyData} />);
    
    expect(screen.getByText('No volatility surface data available')).toBeInTheDocument();
  });

  it('renders canvas when valid data provided', () => {
    render(<VolatilitySurfaceChart data={mockVolatilitySurfaceData} />);
    
    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '600');
    expect(canvas).toHaveAttribute('height', '400');
  });

  it('calls canvas drawing methods when rendering surface', () => {
    render(<VolatilitySurfaceChart data={mockVolatilitySurfaceData} />);
    
    // Verify canvas context was obtained
    expect(mockGetContext).toHaveBeenCalledWith('2d');
    
    // Verify basic drawing operations were called
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    expect(mockCanvasContext.fillRect).toHaveBeenCalled();
    expect(mockCanvasContext.fillText).toHaveBeenCalled();
  });

  it('handles custom dimensions', () => {
    render(
      <VolatilitySurfaceChart 
        data={mockVolatilitySurfaceData} 
        width={800} 
        height={500} 
      />
    );
    
    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '500');
  });

  it('applies custom className', () => {
    const { container } = render(
      <VolatilitySurfaceChart 
        data={mockVolatilitySurfaceData} 
        className="custom-class" 
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles invalid volatility values gracefully', () => {
    const dataWithNaN: VolatilitySurfaceData = {
      strikes: [90, 100, 110],
      expirations: [0.25, 0.5],
      volatilities: [
        [0.25, NaN, 0.25],
        [0.23, 0.21, undefined as any]
      ]
    };

    render(<VolatilitySurfaceChart data={dataWithNaN} />);
    
    // Should still render canvas without throwing
    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toBeInTheDocument();
  });

  it('renders title and axis labels', () => {
    render(<VolatilitySurfaceChart data={mockVolatilitySurfaceData} />);
    
    // Verify text rendering was called (titles and labels)
    expect(mockCanvasContext.fillText).toHaveBeenCalledWith(
      'Implied Volatility Surface', 
      expect.any(Number), 
      expect.any(Number)
    );
    expect(mockCanvasContext.fillText).toHaveBeenCalledWith(
      'Strike Price', 
      expect.any(Number), 
      expect.any(Number)
    );
    expect(mockCanvasContext.fillText).toHaveBeenCalledWith(
      'Time to Expiration', 
      expect.any(Number), 
      expect.any(Number)
    );
  });
});