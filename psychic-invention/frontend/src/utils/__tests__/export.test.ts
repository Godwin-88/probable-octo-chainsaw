import { 
  exportToCSV, 
  exportToJSON, 
  generateFilename,
  type ExportData,
  type FFTExportRow 
} from '../export';
import type { BlackScholesResult, OptionRequest, Greeks } from '@/types';

// Mock data for testing
const mockOptionRequest: OptionRequest = {
  s: 100,
  k: 105,
  tau: 0.25,
  r: 0.05,
  sigma: 0.2
};

const mockBlackScholesResult: BlackScholesResult = {
  callPrice: 2.1234,
  putPrice: 6.5678,
  model: 'Black-Scholes',
  responseTime: 15
};

const mockGreeks: Greeks = {
  delta: 0.456789,
  gamma: 0.012345,
  theta: -0.098765,
  vega: 0.234567,
  rho: 0.345678
};

const mockFFTSurfaceData: FFTExportRow[] = [
  { strike: 95, callPrice: 7.1234, putPrice: 1.5678 },
  { strike: 100, callPrice: 4.2345, putPrice: 3.6789 },
  { strike: 105, callPrice: 2.3456, putPrice: 6.7890 }
];

describe('Export Utilities', () => {
  describe('exportToCSV', () => {
    it('should export Black-Scholes data to CSV format', () => {
      const exportData: ExportData = {
        timestamp: '2024-01-01T12:00:00.000Z',
        model: mockBlackScholesResult.model,
        parameters: mockOptionRequest,
        results: mockBlackScholesResult,
        greeks: mockGreeks
      };

      const csv = exportToCSV(exportData);
      
      // Check that CSV contains headers
      expect(csv).toContain('Timestamp,Model');
      expect(csv).toContain('Parameter_S,Parameter_K');
      expect(csv).toContain('Call_Price,Put_Price');
      expect(csv).toContain('Greek_DELTA,Greek_GAMMA');
      
      // Check that CSV contains values
      expect(csv).toContain('2024-01-01T12:00:00.000Z');
      expect(csv).toContain('Black-Scholes');
      expect(csv).toContain('2.1234');
      expect(csv).toContain('0.456789');
    });

    it('should export FFT surface data to CSV format', () => {
      const csv = exportToCSV(mockFFTSurfaceData);
      
      // Check headers
      expect(csv).toContain('Strike,Call Price,Put Price');
      
      // Check data rows
      expect(csv).toContain('95.00,7.1234,1.5678');
      expect(csv).toContain('100.00,4.2345,3.6789');
      expect(csv).toContain('105.00,2.3456,6.7890');
    });
  });

  describe('exportToJSON', () => {
    it('should export data to JSON format', () => {
      const exportData: ExportData = {
        timestamp: '2024-01-01T12:00:00.000Z',
        model: mockBlackScholesResult.model,
        parameters: mockOptionRequest,
        results: mockBlackScholesResult,
        greeks: mockGreeks
      };

      const json = exportToJSON(exportData);
      const parsed = JSON.parse(json);
      
      expect(parsed.timestamp).toBe('2024-01-01T12:00:00.000Z');
      expect(parsed.model).toBe('Black-Scholes');
      expect(parsed.parameters.s).toBe(100);
      expect(parsed.results.callPrice).toBe(2.1234);
      expect(parsed.greeks.delta).toBe(0.456789);
    });

    it('should export FFT surface data to JSON format', () => {
      const json = exportToJSON(mockFFTSurfaceData);
      const parsed = JSON.parse(json);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toEqual({ strike: 95, callPrice: 7.1234, putPrice: 1.5678 });
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with timestamp', () => {
      const filename = generateFilename('test_export', 'csv');
      
      expect(filename).toMatch(/^test_export_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
    });
  });
});

// Manual test function that can be called in browser console
export function testExportFunctionality() {
  console.log('Testing export functionality...');
  
  try {
    // Test CSV export
    const exportData: ExportData = {
      timestamp: new Date().toISOString(),
      model: 'Black-Scholes',
      parameters: mockOptionRequest,
      results: mockBlackScholesResult,
      greeks: mockGreeks
    };
    
    const csv = exportToCSV(exportData);
    console.log('CSV Export:', csv);
    
    const json = exportToJSON(exportData);
    console.log('JSON Export:', JSON.parse(json));
    
    const fftCsv = exportToCSV(mockFFTSurfaceData);
    console.log('FFT CSV Export:', fftCsv);
    
    console.log('All export tests passed!');
    return true;
  } catch (error) {
    console.error('Export test failed:', error);
    return false;
  }
}