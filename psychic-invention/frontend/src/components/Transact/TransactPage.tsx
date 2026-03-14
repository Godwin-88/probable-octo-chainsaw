import { useState } from 'react';
import { PortfolioBuilder } from '@/components/Portfolio/PortfolioBuilder';
import { RiskWorkspace } from './workspaces/RiskWorkspace';
import { EfficientFrontierChart } from '@/components/Optimizer/EfficientFrontierChart';
import { ScenariosWorkspace } from './workspaces/ScenariosWorkspace';
import { TradeEntryForm } from '@/components/Blotter/TradeEntryForm';
import { PositionTable } from '@/components/Blotter/PositionTable';
import { AttributionCard } from '@/components/Blotter/AttributionCard';

const BlotterTab = () => (
  <div className="space-y-6">
    <TradeEntryForm />
    <PositionTable />
    <AttributionCard />
  </div>
);

const tabs = [
  { id: 'portfolio', label: 'Portfolio', component: PortfolioBuilder },
  { id: 'risk', label: 'Risk', component: RiskWorkspace },
  { id: 'optimizer', label: 'Optimizer', component: EfficientFrontierChart },
  { id: 'scenarios', label: 'Scenarios', component: ScenariosWorkspace },
  { id: 'blotter', label: 'Blotter', component: BlotterTab },
] as const;

export const TransactPage = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('portfolio');
  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Quanti<span className="text-orange-400">🔥</span></h1>
        <p className="text-slate-400 mt-1">
          Portfolio · Risk · Optimizer · Scenarios (M3, M4) · Blotter
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === t.id
                ? 'bg-primary-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};
