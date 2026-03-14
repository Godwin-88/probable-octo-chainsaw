import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { LandingStage } from './components/LandingStage';
import { MarketplaceStage } from './components/MarketplaceStage';
import { PricingWorkspace } from './components/PricingWorkspace';
import { ProcessingStage } from './components/ProcessingStage';
import { ApiPlayground } from './components/ApiPlayground';
import { TransactLayout } from './components/Transact/TransactLayout';
import { Overview } from './components/Transact/Overview';
import { PricerWorkspace } from './components/Transact/workspaces/PricerWorkspace';
import { PortfolioWorkspace } from './components/Transact/workspaces/PortfolioWorkspace';
import { RiskWorkspace } from './components/Transact/workspaces/RiskWorkspace';
import { OptimizerWorkspace } from './components/Transact/workspaces/OptimizerWorkspace';
import { VolatilityWorkspace } from './components/Transact/workspaces/VolatilityWorkspace';
import { FactorWorkspace } from './components/Transact/workspaces/FactorWorkspace';
import { ScenariosWorkspace } from './components/Transact/workspaces/ScenariosWorkspace';
import { BlotterWorkspace } from './components/Transact/workspaces/BlotterWorkspace';
import { DefiWorkspace } from './components/Transact/workspaces/DefiWorkspace';
import { DataUniverseExplorer } from './components/DataUniverse/DataUniverseExplorer';
import { MarketplaceItemPage } from './pages/MarketplaceItemPage';

const LandingPage = () => <LandingStage />;

const MarketplacePage = () => <MarketplaceStage />;

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col">
        <Routes>
          {/* Landing + Marketplace */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:menuId" element={<MarketplaceItemPage />} />

          {/* Legacy routes (keep working) */}
          <Route path="/workspace" element={<PricingWorkspace />} />
          <Route path="/fft" element={<PricingWorkspace defaultTab="fft" />} />
          <Route path="/operations" element={<ProcessingStage />} />
          <Route path="/api-playground" element={<ApiPlayground />} />

          {/* Transact platform with sidebar layout */}
          <Route path="/transact" element={<TransactLayout />}>
            <Route index element={<Overview />} />

            {/* Pricer */}
            <Route path="pricer" element={<PricerWorkspace />} />
            <Route path="pricer/:submenu" element={<PricerWorkspace />} />

            {/* Portfolio */}
            <Route path="portfolio" element={<PortfolioWorkspace />} />
            <Route path="portfolio/:submenu" element={<PortfolioWorkspace />} />

            {/* Risk */}
            <Route path="risk" element={<RiskWorkspace />} />
            <Route path="risk/:submenu" element={<RiskWorkspace />} />

            {/* Optimizer */}
            <Route path="optimizer" element={<OptimizerWorkspace />} />
            <Route path="optimizer/:submenu" element={<OptimizerWorkspace />} />

            {/* Volatility Lab */}
            <Route path="volatility" element={<VolatilityWorkspace />} />
            <Route path="volatility/:submenu" element={<VolatilityWorkspace />} />

            {/* Factor Lab */}
            <Route path="factor" element={<FactorWorkspace />} />
            <Route path="factor/:submenu" element={<FactorWorkspace />} />

            {/* Scenarios */}
            <Route path="scenarios" element={<ScenariosWorkspace />} />
            <Route path="scenarios/:submenu" element={<ScenariosWorkspace />} />

            {/* Blotter */}
            <Route path="blotter" element={<BlotterWorkspace />} />
            <Route path="blotter/:submenu" element={<BlotterWorkspace />} />

            {/* DeFi / Yield */}
            <Route path="defi" element={<DefiWorkspace />} />
            <Route path="defi/:submenu" element={<DefiWorkspace />} />

            {/* Data Universe */}
            <Route path="universe" element={<DataUniverseExplorer />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Footer — hidden inside transact (sidebar layout manages its own space) */}
      <Routes>
        <Route
          path="/transact/*"
          element={null}
        />
        <Route
          path="*"
          element={
            <footer className="bg-slate-950 border-t border-slate-800 py-10">
              <div className="container flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-slate-400">
                <div>
                  <p className="font-semibold text-white">Quanti🔥Nova · Web3-native quant & DeFi agent</p>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Institutional-grade quantitative trading suite</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {['Rust', 'FastAPI', 'React + Tailwind', 'PyO3', 'BS · FFT · Heston'].map(tag => (
                    <span key={tag} className="tag-pill">{tag}</span>
                  ))}
                </div>
              </div>
            </footer>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
