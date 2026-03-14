/**
 * PricerWorkspace — Menu 1: Derivatives Pricer shell
 *
 * Tabs (route-driven via :submenu param):
 *   pricing    → PricingWorkspace  (BS · FFT · Heston · live asset)
 *   greeks     → GreeksDashboard   (Δ/Γ/Θ/ν/ρ · Δ/Γ heatmap)
 *   chain      → OptionChainWorkspace (yfinance live chain · BS theoretical)
 *   capm       → CAPMWorkspace     (live β · SML · Δ-adjusted exposure)
 */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAgentContext, DEFAULT_SUGGESTED_QUESTIONS } from '@/context/AgentContext';
import { MathText } from '@/components/ui/Math';
import { PricingWorkspace }       from '@/components/PricingWorkspace';
import { GreeksDashboard }        from '@/components/Pricer/GreeksDashboard';
import { OptionChainWorkspace }   from '@/components/Transact/workspaces/OptionChainWorkspace';
import { CAPMWorkspace }          from '@/components/Transact/workspaces/CAPMWorkspace';

const TABS = [
  { id: 'pricing', label: 'Pricing',      badge: 'BS · FFT · Heston',  desc: 'Multi-model: $C = SN(d_1) - Ke^{-rT}N(d_2)$ · Carr-Madan FFT · Heston SV · live spot + IV' },
  { id: 'greeks',  label: 'Greeks',       badge: 'Δ Γ Θ ν ρ',         desc: 'Analytical vs numerical · $\\Delta, \\Gamma$ heatmap ($S \\times K$ grid) · all 3 models' },
  { id: 'chain',   label: 'Option Chain', badge: 'yfinance · live',    desc: 'Strike$\\times$Expiry grid · implied vol · BS theoretical · ITM/ATM/OTM' },
  { id: 'capm',    label: 'CAPM',         badge: 'M1 §2 · β live',     desc: '$E(R_i) = R_f + \\beta(R_m - R_f)$ · live beta from 1-year daily log-returns · $\\Delta$-adjusted exposure' },
] as const;

type TabId = typeof TABS[number]['id'];

export const PricerWorkspace = () => {
  const { setWorkspaceContext } = useAgentContext();
  const location = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    setWorkspaceContext({
      menuId: 'pricer',
      summary: 'On-Chain Pricer & Oracle Hub: AMM/Perp/Option pricing, BS/FFT/Heston, oracle & pool state',
      suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS.pricer,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getActive(): TabId {
    const seg = location.pathname.split('/').pop() ?? '';
    if (seg === 'greeks')  return 'greeks';
    if (seg === 'chain')   return 'chain';
    if (seg === 'capm')    return 'capm';
    return 'pricing';
  }
  const active = getActive();
  const meta   = TABS.find(t => t.id === active)!;

  const goTo = (id: TabId) =>
    navigate(id === 'pricing' ? '/transact/pricer' : `/transact/pricer/${id}`);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">⚡</span>
          <h1 className="text-2xl font-black text-white">On-Chain Pricer & Oracle Hub</h1>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
            {meta.badge}
          </span>
        </div>
        <p className="text-sm text-slate-400 ml-9"><MathText text={meta.desc} /></p>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {TABS.map(t => (
          <button key={t.id} onClick={() => goTo(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              active === t.id
                ? 'bg-blue-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="min-h-[500px]">
        {active === 'pricing' && <PricingWorkspace />}
        {active === 'greeks'  && <GreeksDashboard />}
        {active === 'chain'   && <OptionChainWorkspace />}
        {active === 'capm'    && <CAPMWorkspace />}
      </div>
    </div>
  );
};
