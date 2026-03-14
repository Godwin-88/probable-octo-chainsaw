import type { BlackScholesResult, FFTPricingResult, Greeks, OptionRequest, FFTRequest } from '@/types';

export interface ExportData {
  timestamp: string;
  model: string;
  parameters: OptionRequest | FFTRequest;
  results: BlackScholesResult | FFTPricingResult;
  greeks?: Greeks;
}

export interface FFTExportRow {
  strike: number;
  callPrice: number;
  putPrice: number;
}

/**
 * Convert data to CSV format
 */
export function exportToCSV(data: ExportData | FFTExportRow[]): string {
  if (Array.isArray(data)) {
    // FFT surface data export
    const headers = ['Strike', 'Call Price', 'Put Price'];
    const rows = data.map(row => [
      row.strike.toFixed(2),
      row.callPrice.toFixed(4),
      row.putPrice.toFixed(4)
    ]);
    
    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }

  // Single pricing result export
  const headers: string[] = [];
  const values: string[] = [];

  // Basic info
  headers.push('Timestamp', 'Model');
  values.push(data.timestamp, data.model);

  // Parameters
  Object.entries(data.parameters).forEach(([key, value]) => {
    headers.push(`Parameter_${key.toUpperCase()}`);
    values.push(String(value));
  });

  // Results
  if ('callPrice' in data.results) {
    // Black-Scholes results
    headers.push('Call_Price', 'Put_Price', 'Response_Time_ms');
    values.push(
      data.results.callPrice.toFixed(4),
      data.results.putPrice.toFixed(4),
      String(data.results.responseTime)
    );
  }

  // Greeks
  if (data.greeks) {
    Object.entries(data.greeks).forEach(([key, value]) => {
      headers.push(`Greek_${key.toUpperCase()}`);
      values.push(value.toFixed(6));
    });
  }

  return [headers.join(','), values.join(',')].join('\n');
}

/**
 * Convert data to JSON format
 */
export function exportToJSON(data: ExportData | FFTExportRow[]): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Download file with given content
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Export Black-Scholes results as CSV
 */
export function exportBlackScholesCSV(
  parameters: OptionRequest,
  results: BlackScholesResult,
  greeks?: Greeks
): void {
  const exportData: ExportData = {
    timestamp: new Date().toISOString(),
    model: results.model,
    parameters,
    results,
    greeks
  };

  const csv = exportToCSV(exportData);
  const filename = generateFilename('black_scholes_pricing', 'csv');
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export Black-Scholes results as JSON
 */
export function exportBlackScholesJSON(
  parameters: OptionRequest,
  results: BlackScholesResult,
  greeks?: Greeks
): void {
  const exportData: ExportData = {
    timestamp: new Date().toISOString(),
    model: results.model,
    parameters,
    results,
    greeks
  };

  const json = exportToJSON(exportData);
  const filename = generateFilename('black_scholes_pricing', 'json');
  downloadFile(json, filename, 'application/json');
}

/**
 * Export FFT surface data as CSV
 */
export function exportFFTSurfaceCSV(surfaceData: FFTExportRow[]): void {
  const csv = exportToCSV(surfaceData);
  const filename = generateFilename('fft_option_surface', 'csv');
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export FFT surface data as JSON
 */
export function exportFFTSurfaceJSON(surfaceData: FFTExportRow[]): void {
  const json = exportToJSON(surfaceData);
  const filename = generateFilename('fft_option_surface', 'json');
  downloadFile(json, filename, 'application/json');
}

/**
 * Export complete FFT results as JSON
 */
export function exportFFTCompleteJSON(
  parameters: FFTRequest,
  results: FFTPricingResult
): void {
  const exportData: ExportData = {
    timestamp: new Date().toISOString(),
    model: results.model,
    parameters,
    results
  };

  const json = exportToJSON(exportData);
  const filename = generateFilename('fft_complete_results', 'json');
  downloadFile(json, filename, 'application/json');
}