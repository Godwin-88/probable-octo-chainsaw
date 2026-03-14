/**
 * MarketplaceStage — Marketplace card grid
 *
 * Filter dimensions:
 *   - Text search
 *   - User Role (Portfolio Manager, Quant Analyst, Risk Manager, …)
 *   - Category (Pricing, Portfolio Management, Risk Analytics, …)
 *   - Complexity (Basic, Intermediate, Advanced)
 *
 * Card CTA navigates to /marketplace/:id for the 5-tab detail page.
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MENU_ITEMS, ALL_USER_ROLES, type MenuCategory, type UserRole } from '@/data/marketplaceData';

type Complexity = 'Basic' | 'Intermediate' | 'Advanced';

const ALL_CATEGORIES: MenuCategory[] = [
  'Pricing',
  'Portfolio Management',
  'Risk Analytics',
  'Optimization',
  'Volatility',
  'Factor Analysis',
  'Scenarios',
  'Execution',
];
const ALL_COMPLEXITIES: Complexity[] = ['Basic', 'Intermediate', 'Advanced'];

const accentMap: Record<string, string> = {
  blue:    'border-blue-500/40 group-hover:border-blue-500/70',
  indigo:  'border-indigo-500/40 group-hover:border-indigo-500/70',
  emerald: 'border-emerald-500/40 group-hover:border-emerald-500/70',
  violet:  'border-violet-500/40 group-hover:border-violet-500/70',
  cyan:    'border-cyan-500/40 group-hover:border-cyan-500/70',
  amber:   'border-amber-500/40 group-hover:border-amber-500/70',
  rose:    'border-rose-500/40 group-hover:border-rose-500/70',
  slate:   'border-slate-500/40 group-hover:border-slate-500/70',
};

const badgeMap: Record<string, string> = {
  blue:    'bg-blue-500/10 text-blue-300 border-blue-500/20',
  indigo:  'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  violet:  'bg-violet-500/10 text-violet-300 border-violet-500/20',
  cyan:    'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  amber:   'bg-amber-500/10 text-amber-300 border-amber-500/20',
  rose:    'bg-rose-500/10 text-rose-300 border-rose-500/20',
  slate:   'bg-slate-500/10 text-slate-300 border-slate-500/20',
};

const ctaMap: Record<string, string> = {
  blue:    'bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 hover:border-blue-500',
  indigo:  'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500',
  emerald: 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-500',
  violet:  'bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 hover:border-violet-500',
  cyan:    'bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-500',
  amber:   'bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 hover:border-amber-500',
  rose:    'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-500',
  slate:   'bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600',
};

const complexityColor: Record<Complexity, string> = {
  Basic:        'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  Intermediate: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  Advanced:     'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

const accentLineMap: Record<string, string> = {
  blue: 'from-blue-600 to-blue-400', indigo: 'from-indigo-600 to-indigo-400',
  emerald: 'from-emerald-600 to-emerald-400', violet: 'from-violet-600 to-violet-400',
  cyan: 'from-cyan-600 to-cyan-400', amber: 'from-amber-600 to-amber-400',
  rose: 'from-rose-600 to-rose-400', slate: 'from-slate-600 to-slate-400',
};

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
        active
          ? 'bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/20'
          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
      }`}>
      {label}
    </button>
  );
}

export const MarketplaceStage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeRoles, setActiveRoles] = useState<UserRole[]>([]);
  const [activeCategories, setActiveCategories] = useState<MenuCategory[]>([]);
  const [activeComplexities, setActiveComplexities] = useState<Complexity[]>([]);

  const toggle = <T,>(list: T[], setList: React.Dispatch<React.SetStateAction<T[]>>, item: T) =>
    setList(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);

  const hasFilters = activeRoles.length > 0 || activeCategories.length > 0 || activeComplexities.length > 0 || search.trim();

  function clearFilters() {
    setActiveRoles([]); setActiveCategories([]); setActiveComplexities([]); setSearch('');
  }

  const filtered = useMemo(() => MENU_ITEMS.filter(o => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const hit = o.title.toLowerCase().includes(q) || o.tagline.toLowerCase().includes(q) ||
        o.overview.capabilities.some(c => c.toLowerCase().includes(q)) ||
        (o.web3Focus ?? []).some(c => c.toLowerCase().includes(q));
      if (!hit) return false;
    }
    if (activeRoles.length > 0 && !activeRoles.some(r => o.userRoles.includes(r))) return false;
    if (activeCategories.length > 0 && !activeCategories.includes(o.category)) return false;
    if (activeComplexities.length > 0 && !activeComplexities.includes(o.complexity as Complexity)) return false;
    return true;
  }), [search, activeRoles, activeCategories, activeComplexities]);

  return (
    <section className="section-padding bg-slate-950 border-b border-slate-800/60">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3 font-semibold">Workspaces & Agent Tools</p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Browse All Web3 Quant Workspaces</h2>
              <p className="text-slate-400 max-w-2xl">
                Filter by your role, category, or complexity level — then explore how each workspace supports the Dynamic Yield
                Optimization Agent before you connect a wallet or register.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>
                {filtered.length} of {MENU_ITEMS.length} workspaces
              </span>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-8 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search workspaces, features, strategies…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Role filter */}
          <div className="flex flex-wrap items-start gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1.5 mr-1 shrink-0 w-14">Role</span>
            <div className="flex flex-wrap gap-2">
              {ALL_USER_ROLES.map(r => (
                <FilterChip key={r} label={r} active={activeRoles.includes(r)} onClick={() => toggle(ALL_USER_ROLES, setActiveRoles as React.Dispatch<React.SetStateAction<UserRole[]>>, r)} />
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap items-start gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1.5 mr-1 shrink-0 w-14">Category</span>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(c => (
                <FilterChip key={c} label={c} active={activeCategories.includes(c)} onClick={() => toggle(ALL_CATEGORIES, setActiveCategories as React.Dispatch<React.SetStateAction<MenuCategory[]>>, c)} />
              ))}
            </div>
          </div>

          {/* Complexity + clear */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mr-1 shrink-0 w-14">Level</span>
            {ALL_COMPLEXITIES.map(c => (
              <FilterChip key={c} label={c} active={activeComplexities.includes(c)} onClick={() => toggle(ALL_COMPLEXITIES, setActiveComplexities as React.Dispatch<React.SetStateAction<Complexity[]>>, c)} />
            ))}
            {hasFilters && (
              <button onClick={clearFilters}
                className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-all">
                Clear filters ✕
              </button>
            )}
          </div>
        </div>

        {/* Cards grid */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-slate-300 font-semibold text-lg">No workspaces match your filters</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting or clearing the filters above</p>
            <button onClick={clearFilters} className="mt-4 px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {filtered.map(item => (
              <div key={item.id}
                className={`group relative flex flex-col rounded-2xl bg-slate-900/70 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${accentMap[item.accentColor]}`}>
                {/* Top accent line */}
                <div className={`h-0.5 w-full bg-gradient-to-r ${accentLineMap[item.accentColor]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="p-6 flex flex-col flex-1">
                  {/* Icon + complexity */}
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-3xl">{item.icon}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${complexityColor[item.complexity as Complexity]}`}>
                      {item.complexity}
                    </span>
                  </div>

                  {/* Title + tagline */}
                  <h3 className="text-lg font-bold text-white mb-1.5 leading-snug">{item.title}</h3>
                  <p className={`text-xs font-semibold mb-1.5 ${badgeMap[item.accentColor].split(' ')[1]}`}>{item.tagline}</p>
                  {item.onboardingJourney && (
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-1 line-clamp-2">
                      {item.onboardingJourney}
                    </p>
                  )}
                  <p className="text-sm text-slate-400 leading-relaxed mb-3 flex-1 line-clamp-3">
                    {item.overview.body.slice(0, 140)}…
                  </p>

                  {/* Capability pills (first 3) */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.overview.capabilities.slice(0, 3).map(cap => (
                      <span key={cap} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700 line-clamp-1">
                        {cap.split(':')[0]}
                      </span>
                    ))}
                    {(item.web3Focus ?? []).slice(0, 1).map(point => (
                      <span key={point} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900 text-slate-300 border border-slate-700 line-clamp-1">
                        {point}
                      </span>
                    ))}
                  </div>

                  {/* Target users */}
                  <div className="flex flex-wrap gap-1 mb-5">
                    {item.targetUsers.map(u => (
                      <span key={u} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeMap[item.accentColor]}`}>{u}</span>
                    ))}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-800/60 text-slate-400 border-slate-700">{item.category}</span>
                  </div>

                  {/* Dual CTA */}
                  <div className="space-y-2">
                    <button onClick={() => navigate(`/marketplace/${item.id}`)}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${ctaMap[item.accentColor]}`}>
                      Explore Details →
                    </button>
                    <button onClick={() => navigate(item.route)}
                      className="w-full py-2 rounded-xl text-xs font-medium bg-slate-800/60 hover:bg-slate-700 text-slate-500 hover:text-slate-300 border border-slate-700/60 transition-all">
                      Open Workspace / Connect Wallet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
