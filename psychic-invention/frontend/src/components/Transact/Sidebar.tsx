import { useNavigate, useLocation } from 'react-router-dom';
import { menuItems, type MenuItem } from './navConfig';
import { useChain } from '@/context/ChainContext';
import { useWallet } from '@/context/WalletContext';

const BRAND_NAME = 'Quanti🔥Nova';

function chainBadge(chainId: string): { label: string; color: string } {
  const id = chainId.toLowerCase();
  if (id === 'ethereum') return { label: 'ETH', color: 'bg-chain-eth' };
  if (id === 'polygon') return { label: 'POL', color: 'bg-chain-eth' };
  if (id === 'arbitrum') return { label: 'ARB', color: 'bg-chain-eth' };
  if (id === 'base') return { label: 'BASE', color: 'bg-chain-eth' };
  if (id === 'solana') return { label: 'SOL', color: 'bg-chain-sol' };
  if (id === 'ton') return { label: 'TON', color: 'bg-chain-ton' };
  if (id === 'tron') return { label: 'TRX', color: 'bg-chain-tron' };
  return { label: chainId.slice(0, 3).toUpperCase(), color: 'bg-slate-800' };
}

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ collapsed, onToggle }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { chain, setChain, chains, chainLabels } = useChain();
  const { address, isConnecting, connect, disconnect } = useWallet();

  function isActive(item: MenuItem) {
    if (item.path === '/transact') return location.pathname === '/transact';
    return location.pathname.startsWith(item.path);
  }

  return (
    <aside
      className={`relative flex flex-col backdrop-blur-md bg-slate-900/80 border-r border-slate-700/50 transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? 'w-16' : 'w-52'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3.5 top-6 z-10 w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center text-sm"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {/* Multi-chain selector + Connect Wallet */}
      {!collapsed && (
        <div className="px-3 pt-4 pb-3 border-b border-slate-700/50 space-y-3">
          <div className="flex gap-1.5 justify-center">
            {(chains.length ? chains : [{ id: chain, name: chain }]).map((c) => {
              const b = chainBadge(c.id);
              return (
              <button
                key={c.id}
                onClick={() => setChain(c.id)}
                title={chainLabels[c.id] ?? c.id}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                  chain === c.id
                    ? `${b.color} text-white ring-1 ring-white/30`
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {b.label}
              </button>
            )})}
          </div>
          {address ? (
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] text-slate-500 truncate font-mono" title={address}>
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
              <button
                onClick={disconnect}
                className="text-[10px] text-slate-400 hover:text-neon-pink transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="w-full py-2 rounded-lg bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 text-xs font-semibold hover:bg-neon-cyan/30 transition-colors disabled:opacity-50"
            >
              {isConnecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      )}
      {collapsed && <div className="h-20 border-b border-slate-700/50" />}

      {/* Branding */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-3 border-b border-slate-700/50">
          <p className="text-[11px] font-bold text-white leading-tight">{BRAND_NAME}</p>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Web3-native quant & DeFi agent</p>
        </div>
      )}
      {collapsed && <div className="h-14 border-b border-slate-700/50" />}

      {/* Primary nav rail */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
        {menuItems.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mx-1.5 transition-all duration-150 text-left ${
                collapsed ? 'justify-center' : ''
              } ${
                active
                  ? 'bg-primary-600/15 text-neon-cyan border-l-2 border-neon-cyan/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-l-2 border-transparent'
              }`}
              style={{ width: 'calc(100% - 12px)' }}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom status */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Agent Ready</span>
          </div>
        </div>
      )}
    </aside>
  );
};
