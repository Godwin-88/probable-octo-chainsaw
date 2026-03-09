const getGatewayUrl = (): string => {
  const base = import.meta.env.VITE_GATEWAY_URL ?? "";
  if (base) return base.replace(/\/?$/, "");
  return `${window.location.protocol}//${window.location.hostname}:3000`;
};

export type Position = {
  chainId: string;
  assetSymbol: string;
  assetAddress?: string;
  amount: string;
  amountUsd: number;
  type: "native" | "erc20";
};

export type PortfolioResponse = {
  walletAddress: string;
  positions: Position[];
  totalUsd: number;
};

export async function getPortfolio(
  walletAddress: string,
  chainId: string = "ethereum"
): Promise<PortfolioResponse> {
  const url = `${getGatewayUrl()}/api/portfolio?walletAddress=${encodeURIComponent(walletAddress)}&chainId=${encodeURIComponent(chainId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<PortfolioResponse>;
}
