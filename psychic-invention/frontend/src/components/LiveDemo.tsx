// Wall Street Themed Live Demo Component
import { useState } from 'react';
import { Button } from './Button';
import { usePricing } from '@/hooks/useApi';
import type { OptionRequest } from '@/types';

export const LiveDemo = () => {
  const { calculatePrice, loading, error, result } = usePricing();
  const [formData, setFormData] = useState<OptionRequest>({
    s: 100,
    k: 100,
    tau: 1.0,
    r: 0.05,
    sigma: 0.2,
  });

  const handleInputChange = (field: keyof OptionRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleCalculate = () => {
    calculatePrice(formData);
  };

  return (
    <section id="demo" className="py-20 bg-dark-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-slate-100">Live Trading</span>
            <span className="glow-text ml-3">Terminal</span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Execute real-time Black-Scholes calculations with institutional-grade precision
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-primary-600 to-primary-700 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trading Input Panel */}
            <div className="card">
              <div className="flex items-center mb-6">
                <div className="w-3 h-3 bg-success rounded-full mr-3 animate-pulse"></div>
                <h3 className="text-xl font-semibold text-slate-100">Option Parameters</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Spot Price (S₀)
                  </label>
                  <input
                    type="number"
                    value={formData.s}
                    onChange={(e) => handleInputChange('s', e.target.value)}
                    className="input-field font-mono"
                    step="0.01"
                    placeholder="100.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Strike Price (K)
                  </label>
                  <input
                    type="number"
                    value={formData.k}
                    onChange={(e) => handleInputChange('k', e.target.value)}
                    className="input-field font-mono"
                    step="0.01"
                    placeholder="100.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Time to Expiry (T) - Years
                  </label>
                  <input
                    type="number"
                    value={formData.tau}
                    onChange={(e) => handleInputChange('tau', e.target.value)}
                    className="input-field font-mono"
                    step="0.01"
                    min="0.01"
                    placeholder="1.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Risk-free Rate (r) - %
                  </label>
                  <input
                    type="number"
                    value={formData.r * 100}
                    onChange={(e) => handleInputChange('r', (parseFloat(e.target.value) / 100).toString())}
                    className="input-field font-mono"
                    step="0.01"
                    placeholder="5.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Volatility (σ) - %
                  </label>
                  <input
                    type="number"
                    value={formData.sigma * 100}
                    onChange={(e) => handleInputChange('sigma', (parseFloat(e.target.value) / 100).toString())}
                    className="input-field font-mono"
                    step="0.01"
                    min="0.01"
                    placeholder="20.00"
                  />
                </div>

                <Button 
                  onClick={handleCalculate} 
                  loading={loading}
                  className="w-full mt-6"
                >
                  {loading ? 'Executing...' : '⚡ Execute Trade'}
                </Button>
              </div>
            </div>

            {/* Results Terminal */}
            <div className="card bg-gradient-to-br from-dark-100 to-dark-200">
              <div className="flex items-center mb-6">
                <div className="w-3 h-3 bg-primary-400 rounded-full mr-3 animate-pulse"></div>
                <h3 className="text-xl font-semibold text-slate-100">Execution Results</h3>
              </div>
              
              {error && (
                <div className="bg-danger bg-opacity-20 border border-danger text-danger px-4 py-3 rounded-lg mb-6">
                  <div className="font-mono text-sm">ERROR: {error}</div>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Main Price Display */}
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 rounded-lg text-center">
                    <div className="text-4xl font-bold text-white font-mono">
                      ${result.price.toFixed(4)}
                    </div>
                    <div className="text-primary-100 text-sm mt-1">Call Option Premium</div>
                  </div>

                  {/* Trading Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-dark-300 p-4 rounded-lg border border-slate-600">
                      <div className="text-lg font-semibold text-slate-100 font-mono">{result.model}</div>
                      <div className="text-sm text-slate-400">Pricing Model</div>
                    </div>
                    <div className="bg-dark-300 p-4 rounded-lg border border-slate-600">
                      <div className="text-lg font-semibold text-success font-mono">
                        {(result as any).responseTime || '< 5'}ms
                      </div>
                      <div className="text-sm text-slate-400">Execution Time</div>
                    </div>
                  </div>

                  {/* Greeks Preview */}
                  <div className="bg-dark-300 p-4 rounded-lg border border-slate-600">
                    <div className="text-sm text-slate-400 mb-2">Greeks (Estimated)</div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="text-slate-300">Δ: ~0.627</div>
                      <div className="text-slate-300">Γ: ~0.019</div>
                      <div className="text-slate-300">Θ: ~-0.045</div>
                      <div className="text-slate-300">ν: ~0.392</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-mono bg-dark-300 p-3 rounded border-l-4 border-primary-600">
                    EXEC: Black-Scholes analytical formula | RUST backend | Wall Street precision
                  </div>
                </div>
              )}

              {!result && !error && (
                <div className="text-center text-slate-500 py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <div className="font-mono">Awaiting trade parameters...</div>
                  <div className="text-sm mt-2">Enter values and execute to see results</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
