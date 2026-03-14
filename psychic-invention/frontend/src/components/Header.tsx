import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useHealthCheck } from '@/hooks/useApi';
import { TransactHeader } from './Transact/TransactHeader';

const navLinks = [
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'Quanti🔥Nova', to: '/transact' },
  { label: 'Workspace', to: '/workspace' },
  { label: 'API', to: '/api-playground' },
];

/** Header for landing, marketplace, workspace, API pages — includes nav tabs */
function LandingHeader() {
  const { isHealthy } = useHealthCheck();
  const navigate = useNavigate();

  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 shrink-0">
      <div className="container">
        <div className="flex items-center justify-between gap-6 py-4">
          <button onClick={() => navigate('/')} className="group flex items-center gap-3 text-left shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/90 to-purple-600/90 flex items-center justify-center text-lg shadow-glow-cyan">
              🔥
            </div>
            <div>
              <p className="text-base font-black text-white leading-none group-hover:text-cyan-300 transition-colors">
                Quanti🔥Nova
              </p>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.25em] leading-none mt-0.5">
                Web3 quant & DeFi agent
              </p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/transact'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-300'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className={isHealthy ? 'text-emerald-400' : 'text-red-400'}>
                {isHealthy ? 'API LIVE' : 'API DOWN'}
              </span>
            </div>
            <button
              onClick={() => window.open('https://github.com/Godwin-88/psychic-invention', '_blank')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900 transition-all"
            >
              <span className="text-sm">⌥</span>
              GitHub
            </button>
            <button
              onClick={() => navigate('/transact')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all duration-150 shadow-sm shadow-blue-500/20"
            >
              Launch →
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/** Chooses header: Transact app gets asset selector bar; landing gets nav tabs */
export const Header = () => {
  const location = useLocation();
  const isInTransact = location.pathname.startsWith('/transact');

  if (isInTransact) {
    return <TransactHeader />;
  }
  return <LandingHeader />;
};
