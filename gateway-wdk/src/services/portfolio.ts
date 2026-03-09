import { cacheGet, cacheSet, portfolioCacheKey, CACHE_TTL } from "../lib/redis.js";

const RPC_URL = process.env.RPC_URL_ETHEREUM ?? process.env.RPC_URL_SEPOLIA ?? "https://eth.llamarpc.com";

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

async function fetchBalancesWithWdk(walletAddress: string, chainId: string): Promise<Position[]> {
  try {
    const { WalletAccountReadOnlyEvm } = await import("@tetherto/wdk-wallet-evm");
    const readOnly = new WalletAccountReadOnlyEvm(walletAddress, { provider: RPC_URL });
    const [nativeBalance, usdtBalance, usdcBalance] = await Promise.all([
      readOnly.getBalance().then((b: bigint) => b.toString()),
      readOnly.getTokenBalance("0xdAC17F958D2ee523a2206206994597C13D831ec7").then((b: bigint) => b.toString()),
      readOnly.getTokenBalance("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48").then((b: bigint) => b.toString()),
    ]);
    const positions: Position[] = [];
    const ethDecimals = 18;
    const tokenDecimals = 6;
    const parse = (raw: string, dec: number) => (Number(raw) / 10 ** dec);
    if (nativeBalance && BigInt(nativeBalance) > 0n) {
      positions.push({
        chainId,
        assetSymbol: "ETH",
        amount: nativeBalance,
        amountUsd: 0,
        type: "native",
      });
    }
    if (usdtBalance && BigInt(usdtBalance) > 0n) {
      positions.push({
        chainId,
        assetSymbol: "USDT",
        assetAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        amount: usdtBalance,
        amountUsd: parse(usdtBalance, tokenDecimals),
        type: "erc20",
      });
    }
    if (usdcBalance && BigInt(usdcBalance) > 0n) {
      positions.push({
        chainId,
        assetSymbol: "USDC",
        assetAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        amount: usdcBalance,
        amountUsd: parse(usdcBalance, tokenDecimals),
        type: "erc20",
      });
    }
    return positions;
  } catch (err) {
    console.error("WDK portfolio fetch error:", err);
    return [];
  }
}

export async function getPortfolio(walletAddress: string, chainId: string = "ethereum"): Promise<PortfolioResponse> {
  const cacheKey = portfolioCacheKey(walletAddress, chainId);
  const cached = await cacheGet<PortfolioResponse>(cacheKey);
  if (cached) return cached;

  const positions = await fetchBalancesWithWdk(walletAddress, chainId);
  const totalUsd = positions.reduce((s, p) => s + p.amountUsd, 0);
  const out: PortfolioResponse = { walletAddress, positions, totalUsd };
  await cacheSet(cacheKey, out, CACHE_TTL.portfolio);
  return out;
}
