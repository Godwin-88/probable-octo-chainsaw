/**
 * DoraHacks gateway API (portfolio, optimize, plan, execute).
 * Uses VITE_GATEWAY_URL (e.g. http://localhost:3000).
 */
const getBase = (): string => {
  const base = import.meta.env.VITE_GATEWAY_URL ?? '';
  return base ? base.replace(/\/?$/, '') : `${window.location.protocol}//${window.location.hostname}:3000`;
};

export type Position = { chainId: string; assetSymbol: string; amount: string; amountUsd: number; type: string };
export type PortfolioResponse = { walletAddress: string; positions: Position[]; totalUsd: number };

export async function getPortfolio(walletAddress: string, chainId = 'ethereum'): Promise<PortfolioResponse> {
  const r = await fetch(`${getBase()}/api/portfolio?walletAddress=${encodeURIComponent(walletAddress)}&chainId=${encodeURIComponent(chainId)}`);
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error ?? `HTTP ${r.status}`);
  return r.json();
}

export async function startOptimization(walletAddress: string): Promise<{ optimizationId: string }> {
  const r = await fetch(`${getBase()}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, constraints: {} }),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error ?? `HTTP ${r.status}`);
  return r.json();
}

export type PlanAction = { id: string; type: string; chain_id: string; protocol_id: string; asset_id: string; reason: string };
export type PlanResponse = { actions: PlanAction[]; expected_yield_apy?: number; risk_score?: number; explanation?: string };

export async function getPlan(optimizationId: string): Promise<PlanResponse> {
  const r = await fetch(`${getBase()}/api/execute/plan/${optimizationId}`);
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error ?? `HTTP ${r.status}`);
  return r.json();
}
