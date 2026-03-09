const getGatewayUrl = (): string => {
  const base = import.meta.env.VITE_GATEWAY_URL ?? "";
  if (base) return base.replace(/\/?$/, "");
  return `${window.location.protocol}//${window.location.hostname}:3000`;
};

export type StartOptimizationRequest = {
  walletAddress: string;
  constraints?: {
    riskTolerance?: "low" | "medium" | "high";
    targetChains?: string[];
    maxGasCostUsd?: number;
  };
};

export type StartOptimizationResponse = {
  optimizationId: string;
};

export async function startOptimization(
  walletAddress: string,
  constraints: StartOptimizationRequest["constraints"]
): Promise<StartOptimizationResponse> {
  const res = await fetch(`${getGatewayUrl()}/api/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, constraints } as StartOptimizationRequest),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<StartOptimizationResponse>;
}
