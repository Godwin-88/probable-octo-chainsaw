import React, { useState } from 'react';
import { VolatilitySurfaceChart } from './VolatilitySurfaceChart';
import { GreeksChart } from './GreeksChart';
import { OptionChainDisplay } from './OptionChainDisplay';
import type { VolatilitySurfaceData, GreeksVisualizationData, OptionChainData } from '@/types';

interface MarketDataVisualizationProps {
  volatilitySurface?: VolatilitySurfaceData;
  greeksData?: GreeksVisualizationData;
  optionChain?: OptionChainData[];
  currentSpotPrice?: number;
  className?: string;
}

export const MarketDataVisualization: React.FC<MarketDataVisualizationProps> = ({
  volatilitySurface,
  greeksData,
  optionChain,
  currentSpotPrice,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'volatility' | 'greeks' | 'chain'>('volatility');
  const [selectedGreek, setSelectedGreek] = useState<'delta' | 'gamma' | 'theta' | 'vega' | 'rho'>('delta');

  const tabs = [
    { id: 'volatility', label: 'Volatility Surface', available: !!volatilitySurface },
    { id: 'greeks', label: 'Greeks Analysis', available: !!greeksData },
    { id: 'chain', label: 'Option Chain', available: !!optionChain?.length }
  ] as const;

  const availableTabs = tabs.filter(tab => tab.available);

  // If no data is available, show empty state
  if (availableTabs.length === 0) {
    return (
      <div className={`bg-slate-900 rounded-lg border border-slate-700 p-8 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Market Data Visualization</h3>
          <p className="text-slate-400 text-sm mb-4">No market data available for visualization</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-500">
            <div className="p-4 bg-slate-800/50 rounded border border-slate-700">
              <h4 className="font-semibold mb-2">Volatility Surface</h4>
              <p>3D visualization of implied volatility across strikes and expirations</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded border border-slate-700">
              <h4 className="font-semibold mb-2">Greeks Analysis</h4>
              <p>Interactive charts showing option sensitivities vs spot price</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded border border-slate-700">
              <h4 className="font-semibold mb-2">Option Chain</h4>
              <p>Comprehensive table of option prices, Greeks, and implied volatilities</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Set active tab to first available tab if current tab is not available
  React.useEffect(() => {
    if (!availableTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  return (
    <div className={`bg-slate-900 rounded-lg border border-slate-700 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-white border-blue-500 bg-slate-800/50'
                : 'text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'volatility' && volatilitySurface && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Implied Volatility Surface</h3>
              <p className="text-sm text-slate-400">
                3D visualization of implied volatility across different strikes and expirations
              </p>
            </div>
            <VolatilitySurfaceChart 
              data={volatilitySurface}
              width={800}
              height={500}
            />
          </div>
        )}

        {activeTab === 'greeks' && greeksData && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Greeks Analysis</h3>
                <p className="text-sm text-slate-400">
                  Option sensitivities across different spot prices
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Greek:</label>
                <select
                  value={selectedGreek}
                  onChange={(e) => setSelectedGreek(e.target.value as typeof selectedGreek)}
                  className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm text-white"
                >
                  <option value="delta">Delta (Δ)</option>
                  <option value="gamma">Gamma (Γ)</option>
                  <option value="theta">Theta (Θ)</option>
                  <option value="vega">Vega (ν)</option>
                  <option value="rho">Rho (ρ)</option>
                </select>
              </div>
            </div>
            <GreeksChart 
              data={greeksData}
              selectedGreek={selectedGreek}
              width={800}
              height={400}
            />
            
            {/* Greeks Summary */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              {(['delta', 'gamma', 'theta', 'vega', 'rho'] as const).map((greek) => {
                const values = greeksData[`${greek}s` as keyof GreeksVisualizationData] as number[];
                const currentValue = values[Math.floor(values.length / 2)] || 0;
                return (
                  <div key={greek} className="bg-slate-800/50 rounded p-3 border border-slate-700">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                      {greek === 'delta' ? 'Delta (Δ)' :
                       greek === 'gamma' ? 'Gamma (Γ)' :
                       greek === 'theta' ? 'Theta (Θ)' :
                       greek === 'vega' ? 'Vega (ν)' : 'Rho (ρ)'}
                    </div>
                    <div className="text-lg font-mono text-white">
                      {greek === 'gamma' ? currentValue.toExponential(2) : currentValue.toFixed(3)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'chain' && optionChain && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Option Chain</h3>
              <p className="text-sm text-slate-400">
                Complete option chain with prices, implied volatilities, and Greeks
              </p>
            </div>
            <OptionChainDisplay 
              data={optionChain}
              currentSpotPrice={currentSpotPrice}
              showGreeks={true}
              showImpliedVol={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};