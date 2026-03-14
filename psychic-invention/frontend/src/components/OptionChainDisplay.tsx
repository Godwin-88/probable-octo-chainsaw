import React, { useMemo } from 'react';
import type { OptionChainData } from '@/types';

interface OptionChainDisplayProps {
  data: OptionChainData[];
  currentSpotPrice?: number;
  className?: string;
  showGreeks?: boolean;
  showImpliedVol?: boolean;
}

export const OptionChainDisplay: React.FC<OptionChainDisplayProps> = ({
  data,
  currentSpotPrice,
  className = '',
  showGreeks = true,
  showImpliedVol = true
}) => {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => a.strike - b.strike);
  }, [data]);

  const getMoneyness = (strike: number): 'ITM' | 'ATM' | 'OTM' => {
    if (!currentSpotPrice) return 'OTM';
    const diff = Math.abs(strike - currentSpotPrice);
    if (diff < currentSpotPrice * 0.01) return 'ATM'; // Within 1%
    return strike < currentSpotPrice ? 'ITM' : 'OTM';
  };

  const getMoneynessClass = (strike: number): string => {
    const moneyness = getMoneyness(strike);
    switch (moneyness) {
      case 'ITM': return 'bg-green-900/20 border-green-700/30';
      case 'ATM': return 'bg-yellow-900/20 border-yellow-700/30';
      case 'OTM': return 'bg-slate-900/20 border-slate-700/30';
    }
  };

  if (!data.length) {
    return (
      <div className={`bg-slate-900 rounded-lg border border-slate-700 p-8 ${className}`}>
        <div className="text-center">
          <p className="text-slate-400 text-sm">No option chain data available</p>
          <p className="text-slate-500 text-xs mt-1">Connect to market data to view option chains</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 rounded-lg border border-slate-700 ${className}`}>
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Option Chain</h3>
            <p className="text-sm text-slate-400">
              {data.length} strikes • {currentSpotPrice ? `Spot: $${currentSpotPrice.toFixed(2)}` : 'No spot price'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-slate-400">ITM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-slate-400">ATM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-500 rounded"></div>
              <span className="text-slate-400">OTM</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-700">
              <th className="px-4 py-3 text-left">Strike</th>
              <th className="px-4 py-3 text-left">Expiration</th>
              <th className="px-4 py-3 text-center" colSpan={showImpliedVol ? 2 : 1}>Calls</th>
              <th className="px-4 py-3 text-center" colSpan={showImpliedVol ? 2 : 1}>Puts</th>
              {showGreeks && (
                <th className="px-4 py-3 text-center" colSpan={5}>Greeks (Call)</th>
              )}
            </tr>
            <tr className="text-slate-500 text-xs border-b border-slate-700">
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2 text-center">Price</th>
              {showImpliedVol && <th className="px-4 py-2 text-center">IV</th>}
              <th className="px-4 py-2 text-center">Price</th>
              {showImpliedVol && <th className="px-4 py-2 text-center">IV</th>}
              {showGreeks && (
                <>
                  <th className="px-4 py-2 text-center">Δ</th>
                  <th className="px-4 py-2 text-center">Γ</th>
                  <th className="px-4 py-2 text-center">Θ</th>
                  <th className="px-4 py-2 text-center">ν</th>
                  <th className="px-4 py-2 text-center">ρ</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((option, index) => (
              <tr 
                key={`${option.strike}-${option.expiration}`}
                className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${getMoneynessClass(option.strike)}`}
              >
                <td className="px-4 py-3 font-mono font-semibold text-white">
                  ${option.strike.toFixed(2)}
                  {currentSpotPrice && (
                    <span className="ml-2 text-xs text-slate-400">
                      ({getMoneyness(option.strike)})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                  {option.expiration}
                </td>
                
                {/* Call Price */}
                <td className="px-4 py-3 text-center font-mono text-blue-300">
                  ${option.callPrice.toFixed(4)}
                </td>
                
                {/* Call IV */}
                {showImpliedVol && (
                  <td className="px-4 py-3 text-center font-mono text-slate-400 text-xs">
                    {option.callImpliedVol ? `${(option.callImpliedVol * 100).toFixed(1)}%` : '-'}
                  </td>
                )}
                
                {/* Put Price */}
                <td className="px-4 py-3 text-center font-mono text-amber-300">
                  ${option.putPrice.toFixed(4)}
                </td>
                
                {/* Put IV */}
                {showImpliedVol && (
                  <td className="px-4 py-3 text-center font-mono text-slate-400 text-xs">
                    {option.putImpliedVol ? `${(option.putImpliedVol * 100).toFixed(1)}%` : '-'}
                  </td>
                )}
                
                {/* Greeks */}
                {showGreeks && option.callGreeks && (
                  <>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-300">
                      {option.callGreeks.delta.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-300">
                      {option.callGreeks.gamma.toExponential(2)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-300">
                      {option.callGreeks.theta.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-300">
                      {option.callGreeks.vega.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-300">
                      {option.callGreeks.rho.toFixed(3)}
                    </td>
                  </>
                )}
                
                {/* Empty Greeks cells if no data */}
                {showGreeks && !option.callGreeks && (
                  <>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs">-</td>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs">-</td>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs">-</td>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs">-</td>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs">-</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length > 10 && (
        <div className="p-4 border-t border-slate-700 text-center">
          <p className="text-xs text-slate-500">
            Showing {data.length} option contracts
          </p>
        </div>
      )}
    </div>
  );
};