import { useState } from 'react';
import { postBlotterTrade } from '@/utils/api';

export const TradeEntryForm = () => {
  const [asset, setAsset] = useState('AAPL');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [quantity, setQuantity] = useState(100);
  const [entryPrice, setEntryPrice] = useState(150);
  const [strategyTag, setStrategyTag] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    try {
      const res = await postBlotterTrade({
        asset,
        direction,
        quantity,
        entry_price: entryPrice,
        strategy_tag: strategyTag || undefined,
      });
      setSuccess(`Trade ${res.id} recorded`);
      setQuantity(100);
      setEntryPrice(150);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add trade');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Trade Entry</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Asset</label>
          <input
            type="text"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
            placeholder="AAPL"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Direction</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'long' | 'short')}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Entry Price</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={entryPrice}
            onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
          />
        </div>
        <div className="grid-cols-2">
          <label className="block text-sm text-slate-400 mb-1">Strategy Tag</label>
          <input
            type="text"
            value={strategyTag}
            onChange={(e) => setStrategyTag(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
            placeholder="Momentum, HRP, etc."
          />
        </div>
      </div>
      <button
        type="submit"
        className="mt-4 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium"
      >
        Add Trade
      </button>
      {success && <p className="mt-2 text-sm text-green-400">{success}</p>}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </form>
  );
};
