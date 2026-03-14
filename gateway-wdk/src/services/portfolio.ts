import { cacheGet, cacheSet, portfolioCacheKey, CACHE_TTL } from "../lib/redis.js";
import { getPublicRpcUrl, isEvmChain } from "../lib/chains.js";
import { resolveCanonicalAsset } from "./tokenResolver.js";
import { getOraclePrice } from "./oracle.js";

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

function getEvmRpcUrl(chainId: string): string {
  return (
    getPublicRpcUrl(chainId) ??
    process.env.RPC_URL_ETHEREUM ??
    process.env.RPC_URL_SEPOLIA ??
    "https://eth.llamarpc.com"
  );
}

async function fetchBalancesEvm(walletAddress: string, chainId: string): Promise<Position[]> {
  const RPC_URL = getEvmRpcUrl(chainId);
  try {
    const { WalletAccountReadOnlyEvm } = await import("@tetherto/wdk-wallet-evm");
    const readOnly = new WalletAccountReadOnlyEvm(walletAddress, { provider: RPC_URL });

    const tokenSymbols = (process.env.PORTFOLIO_TOKEN_SYMBOLS ?? "USDT,USDC")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const resolvedTokens = (
      await Promise.all(
        tokenSymbols.map((sym) =>
          resolveCanonicalAsset({ chain: chainId, query: sym }).catch(() => null)
        )
      )
    ).filter(Boolean) as Array<Awaited<ReturnType<typeof resolveCanonicalAsset>>>;

    const [nativeBalance, ...tokenBalances] = await Promise.all([
      readOnly.getBalance().then((b: bigint) => b.toString()),
      ...resolvedTokens.map((t) =>
        readOnly.getTokenBalance(t.addressOrMint).then((b: bigint) => b.toString())
      ),
    ]);
    const positions: Position[] = [];
    const parse = (raw: string, dec: number) => Number(raw) / 10 ** dec;

    // Native asset USD price (best effort; fallback 0)
    const nativeSymbol = chainId === "polygon" ? "MATIC" : "ETH";
    const nativeUsd =
      (await getOraclePrice(`${nativeSymbol}-USDT`, chainId).catch(() => null))?.price ?? 0;
    if (nativeBalance && BigInt(nativeBalance) > 0n) {
      positions.push({
        chainId,
        assetSymbol: nativeSymbol,
        amount: nativeBalance,
        amountUsd: (Number(nativeBalance) / 1e18) * nativeUsd,
        type: "native",
      });
    }

    // Token USD values: attempt oracle vs USDT (stable); fallback to raw units (0 USD)
    await Promise.all(
      resolvedTokens.map(async (t, idx) => {
        const bal = tokenBalances[idx] ?? "0";
        if (!bal || BigInt(bal) <= 0n) return;
        let usd = 0;
        try {
          const px = await getOraclePrice(`${t.symbol}-USDT`, chainId).catch(() => null);
          if (px?.price && px.price > 0) usd = parse(bal, t.decimals) * px.price;
        } catch {}
        positions.push({
          chainId,
          assetSymbol: t.symbol,
          assetAddress: t.addressOrMint,
          amount: bal,
          amountUsd: usd,
          type: "erc20",
        });
      })
    );
    return positions;
  } catch (err) {
    console.error("WDK EVM portfolio fetch error:", err);
    return [];
  }
}

async function fetchBalancesSolana(_walletAddress: string, _chainId: string): Promise<Position[]> {
  // When @tetherto/wdk-wallet-solana is installed and RPC_URL_SOLANA is set,
  // instantiate WalletAccountReadOnlySolana and fetch native + stablecoin balances here.
  return [];
}

async function fetchBalancesNonEvmPlaceholder(
  walletAddress: string,
  chainId: string
): Promise<Position[]> {
  if (chainId === "solana") return fetchBalancesSolana(walletAddress, chainId);
  // TON/TRON: return empty until WDK read-only usage is confirmed; UI shows "coming soon"
  return [];
}

export async function getPortfolio(
  walletAddress: string,
  chainId: string = "ethereum"
): Promise<PortfolioResponse> {
  const cacheKey = portfolioCacheKey(walletAddress, chainId);
  const cached = await cacheGet<PortfolioResponse>(cacheKey);
  if (cached) return cached;

  const isEvm = isEvmChain(chainId);
  const positions = isEvm
    ? await fetchBalancesEvm(walletAddress, chainId)
    : await fetchBalancesNonEvmPlaceholder(walletAddress, chainId);

  const totalUsd = positions.reduce((s, p) => s + p.amountUsd, 0);
  const out: PortfolioResponse = { walletAddress, positions, totalUsd };
  await cacheSet(cacheKey, out, CACHE_TTL.portfolio);
  return out;
}
