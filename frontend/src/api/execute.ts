const getGatewayUrl = (): string => {
  const base = import.meta.env.VITE_GATEWAY_URL ?? "";
  if (base) return base.replace(/\/?$/, "");
  return `${window.location.protocol}//${window.location.hostname}:3000`;
};

export type RecommendedAction = {
  id: string;
  type: string;
  chain_id: string;
  protocol_id: string;
  asset_id: string;
  reason: string;
};

export type OptimizationPlanResponse = {
  actions: RecommendedAction[];
  expected_yield_apy?: number;
  risk_score?: number;
  explanation?: string;
};

export async function getPlan(optimizationId: string): Promise<OptimizationPlanResponse> {
  const res = await fetch(`${getGatewayUrl()}/api/execute/plan/${optimizationId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<OptimizationPlanResponse>;
}

export async function broadcastSignedTx(signedTxHex: string): Promise<{ txHash: string }> {
  const res = await fetch(`${getGatewayUrl()}/api/execute/signed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTxHex }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<{ txHash: string }>;
}
