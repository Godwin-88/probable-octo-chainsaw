import React, { useState } from 'react';
import { useEconomyContext, OnChainTx } from '../../context/EconomyContext';
import { 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Database, 
  ArrowRightLeft, 
  Cpu,
  Search,
  BookOpen
} from 'lucide-react';

export const AdminControlCenter: React.FC = () => {
  const { 
    transactions, 
    totalThroughput, 
    totalSavings, 
    agentReputations,
    isGasSponsored 
  } = useEconomyContext();

  const [activeTab, setActiveTab] = useState<'economy' | 'agents' | 'activity'>('economy');

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-auto bg-slate-950">
      {/* --- Header & Summary --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-indigo-500 w-8 h-8" />
            Arc Sovereign Control Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time M2M economy telemetry and agent reputation monitoring.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-3">
            <Zap className="text-amber-500 w-5 h-5" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Gas Status</p>
              <p className="text-sm font-semibold text-white">{isGasSponsored ? 'Sponsered by Circle' : 'Standard'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Economic Metrics Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-start">
            <p className="text-slate-400 text-sm font-medium">Total Arc Savings</p>
            <TrendingUp className="text-emerald-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">${totalSavings.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">vs Ethereum L1 Gas Projection</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-start">
            <p className="text-slate-400 text-sm font-medium">M2M Throughput</p>
            <ArrowRightLeft className="text-indigo-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">{totalThroughput.toFixed(4)} <span className="text-sm text-slate-400 font-normal">USDC</span></p>
          <p className="text-xs text-slate-500 mt-1">Inter-agent service settlement</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-start">
            <p className="text-slate-400 text-sm font-medium">Active Transactions</p>
            <Database className="text-amber-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">{transactions.length}</p>
          <p className="text-xs text-slate-500 mt-1">On-chain events this session</p>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-xl flex-1 flex flex-col min-h-[500px]">
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('economy')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'economy' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-900/50' : 'text-slate-500 hover:text-white'}`}
          >
            Agentic Economy
          </button>
          <button 
            onClick={() => setActiveTab('agents')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'agents' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-900/50' : 'text-slate-500 hover:text-white'}`}
          >
            Sovereign Reputations
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'activity' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-900/50' : 'text-slate-500 hover:text-white'}`}
          >
            Real-time Activity
          </button>
        </div>

        <div className="p-6 flex-1">
          {activeTab === 'economy' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-white">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <ArrowRightLeft className="text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Machine-to-Machine Logic</h3>
                  <p className="text-sm text-slate-400">Agents autonomously settle service fees using Circle Programmable Wallets.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-4">M2M Fee Schedule</h4>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-slate-300 italic">Research Ingestion</span>
                      <span className="text-indigo-400 font-mono">0.0050 USDC</span>
                    </li>
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-slate-300 italic">Quant Formula Reasoning</span>
                      <span className="text-indigo-400 font-mono">0.0020 USDC</span>
                    </li>
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-slate-300 italic">HFT Risk Calculation</span>
                      <span className="text-indigo-400 font-mono">0.0030 USDC</span>
                    </li>
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-slate-300 italic">Portfolio Optimization</span>
                      <span className="text-indigo-400 font-mono">0.0100 USDC</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-indigo-500/5 p-4 rounded-lg border border-indigo-500/20">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-tighter mb-2">Unit Economics Verdict</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    By operating on Arc L1, QuantiNova achieves a <strong>99.9% reduction</strong> in settlement friction. 
                    M2M reasoning loops that would cost $25.00 on Ethereum L1 are settled for less than $0.01.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="grid grid-cols-1 gap-4">
              {agentReputations.map(agent => (
                <div key={agent.did} className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40">
                      <Cpu className="text-indigo-400 w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{agent.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{agent.did}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Reputation</p>
                      <p className="text-xl font-bold text-indigo-400">{(agent.score * 100).toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Accuracy</p>
                      <p className="text-lg font-semibold text-white">{(agent.accuracy * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Uptime</p>
                      <p className="text-lg font-semibold text-white">{(agent.uptime * 100).toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Citations</p>
                      <p className="text-lg font-semibold text-white">{agent.citations.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center py-20 text-slate-500 italic">No on-chain activity detected.</div>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="bg-slate-900/50 border border-slate-800 px-4 py-3 rounded flex items-center justify-between text-xs transition-all hover:bg-slate-900 hover:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="text-emerald-500"><Zap size={14} /></div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">{tx.method}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{tx.hash}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-indigo-400">+{tx.price.toFixed(4)} USDC</p>
                      <p className="text-[10px] text-slate-500">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
