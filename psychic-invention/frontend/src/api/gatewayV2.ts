/**
 * Web3-native v2 gateway API (oracles, simulation, execution, MEV protection, agent).
 * Uses VITE_GATEWAY_URL; all paths under /v2/. Enable with VITE_USE_V2_API=true when backend is ready.
 */
const getBase = (): string => {
  const base = import.meta.env.VITE_GATEWAY_URL ?? '';
  return base ? base.replace(/\/?$/, '') : `${window.location.protocol}//${window.location.hostname}:3000`;
};

const v2 = (path: string) => `${getBase()}/v2${path}`;

export const useV2Api = (): boolean =>
  (import.meta.env.VITE_USE_V2_API ?? '').toLowerCase() === 'true';

// ── Positions & data ─────────────────────────────────────────────────────────
export type V2Position = { chainId: string; assetSymbol: string; amount: string; amountUsd: number; type: string };
export type V2PositionsResponse = { walletOrAgentId: string; positions: V2Position[]; totalUsd: number };

export async function getV2Positions(
  walletOrAgentId: string,
  chain?: string
): Promise<V2PositionsResponse> {
  const q = chain ? `?chain=${encodeURIComponent(chain)}` : '';
  const r = await fetch(v2(`/positions/${encodeURIComponent(walletOrAgentId)}${q}`));
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error ?? `HTTP ${r.status}`);
  return r.json();
}

export async function getV2OraclePrice(
  tokenPair: string,
  chain?: string,
  dex?: string
): Promise<{ price: number; timestamp?: string }> {
  const params = new URLSearchParams();
  if (chain) params.set('chain', chain);
  if (dex) params.set('dex', dex);
  const q = params.toString() ? `?${params.toString()}` : '';
  const r = await fetch(v2(`/oracles/price/${encodeURIComponent(tokenPair)}${q}`));
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error ?? `HTTP ${r.status}`);
  return r.json();
}

export type V2Chain = {
  id: string;
  name: string;
  kind?: string;
  chainId?: string;
  explorerTxBase?: string;
  configured?: boolean;
};

export async function getV2Chains(): Promise<{ chains: V2Chain[] }> {
  const r = await fetch(v2('/chains'));
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error ?? `HTTP ${r.status}`);
  return r.json();
}

export type V2UniverseSnapshot = {
  requested: {
    chains: string[];
    assets: string[];
    quote: string;
    include: string[];
    wallet: string | null;
  };
  chains: V2Chain[];
  tokens: Array<{ chain: string; query: string; asset?: unknown; error?: string }>;
  prices: Array<{ chain: string; pair: string; price?: number; timestamp?: string; source?: string; error?: string }>;
  positions: Record<string, unknown> | null;
  timestamp: string;
};

export async function getV2UniverseSnapshot(params: {
  chains?: string[];
  assets?: string[];
  quote?: string;
  include?: string[];
  wallet?: string;
}): Promise<V2UniverseSnapshot> {
  const q = new URLSearchParams();
  if (params.chains?.length) q.set('chains', params.chains.join(','));
  if (params.assets?.length) q.set('assets', params.assets.join(','));
  if (params.quote) q.set('quote', params.quote);
  if (params.include?.length) q.set('include', params.include.join(','));
  if (params.wallet) q.set('wallet', params.wallet);
  const url = v2(`/universe/snapshot${q.toString() ? `?${q.toString()}` : ''}`);
  const r = await fetch(url);
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error ?? `HTTP ${r.status}`);
  return r.json();
}

// ── Simulation ─────────────────────────────────────────────────────────────────
export type SimulateSwapBody = { amountIn: string; path: string[]; chain: string };
export type SimulateSwapResponse = { expectedOut: string; slippage: number; mevRiskScore?: number };

export async function postV2SimulateSwap(body: SimulateSwapBody): Promise<SimulateSwapResponse> {
  const r = await fetch(v2('/simulate/swap'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error ?? `HTTP ${r.status}`);
  return r.json();
}

export type SimulateBundleBody = { txs: unknown[]; chain?: string };
export type SimulateBundleResponse = { simulatedPnl?: number; adversarialOrderings?: unknown[] };

export async function postV2SimulateBundle(body: SimulateBundleBody): Promise<SimulateBundleResponse> {
  const r = await fetch(v2('/simulate/bundle'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error ?? `HTTP ${r.status}`);
  return r.json();
}

// ── Execution & MEV protection ────────────────────────────────────────────────
export type ExecuteSwapBody = {
  from: string;
  to: string;
  amount: string;
  slippageTolerance?: number;
  chain: string;
  protection?: 'jito' | 'flashbots-protect' | 'mev-blocker';
};

export async function postV2ExecuteSwap(body: ExecuteSwapBody): Promise<{ txHash?: string }> {
  const r = await fetch(v2('/execute/swap'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error ?? `HTTP ${r.status}`);
  return r.json();
}

export async function postV2ProtectSubmit(body: { signedTxHex: string; chain?: string }): Promise<{ txHash?: string }> {
  const r = await fetch(v2('/protect/submit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error ?? `HTTP ${r.status}`);
  return r.json();
}

// ── Agent ─────────────────────────────────────────────────────────────────────
export async function postV2AgentToggle(autonomous: boolean): Promise<{ ok: boolean }> {
  const r = await fetch(v2('/agent/toggle'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autonomous }),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})) as { error?: string }).error ?? `HTTP ${r.status}`);
  return r.json();
}
