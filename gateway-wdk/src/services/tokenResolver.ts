import { getChainConfig, isEvmChain, type ChainConfig } from "../lib/chains.js";

export type CanonicalAsset = {
  chain: string;
  // EVM: checksummed 0x address; Solana: mint; others: chain-native id
  addressOrMint: string;
  symbol: string;
  name?: string;
  decimals: number;
  coingeckoId?: string;
  // reserved for later (oracle-engine)
  pythPriceId?: string;
  chainlinkFeedAddress?: string;
};

type CacheEntry<T> = { value: T; expiresAt: number };
const cache = new Map<string, CacheEntry<CanonicalAsset>>();

function nowMs(): number {
  return Date.now();
}

function cacheGet(key: string): CanonicalAsset | null {
  const e = cache.get(key);
  if (!e) return null;
  if (e.expiresAt <= nowMs()) {
    cache.delete(key);
    return null;
  }
  return e.value;
}

function cacheSet(key: string, value: CanonicalAsset, ttlMs: number): void {
  cache.set(key, { value, expiresAt: nowMs() + ttlMs });
}

function isHexAddressLike(x: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(x.trim());
}

function normalizeQuery(x: string): string {
  return x.trim();
}

async function evmCall(rpcUrl: string, to: string, data: string): Promise<string | null> {
  const r = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
    signal: AbortSignal.timeout(7000),
  });
  const j = (await r.json()) as { result?: string; error?: { message?: string } };
  if (j.error) return null;
  if (!j.result || j.result === "0x") return null;
  return j.result;
}

async function resolveEvmByAddress(cfg: ChainConfig, address: string): Promise<CanonicalAsset> {
  const rpcUrl = cfg.rpcUrls[0];
  if (!rpcUrl) throw new Error(`RPC not configured for chain ${cfg.id}`);

  const { Interface, getAddress } = await import("ethers");
  const erc20 = new Interface([
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)",
  ]);

  const checksummed = getAddress(address);
  const [symRaw, nameRaw, decRaw] = await Promise.all([
    evmCall(rpcUrl, checksummed, erc20.encodeFunctionData("symbol")).catch(() => null),
    evmCall(rpcUrl, checksummed, erc20.encodeFunctionData("name")).catch(() => null),
    evmCall(rpcUrl, checksummed, erc20.encodeFunctionData("decimals")).catch(() => null),
  ]);

  let symbol = "UNKNOWN";
  let name: string | undefined = undefined;
  let decimals = 18;

  try {
    if (symRaw) symbol = erc20.decodeFunctionResult("symbol", symRaw)[0] as string;
  } catch {}
  try {
    if (nameRaw) name = erc20.decodeFunctionResult("name", nameRaw)[0] as string;
  } catch {}
  try {
    if (decRaw) decimals = Number(erc20.decodeFunctionResult("decimals", decRaw)[0]);
  } catch {}

  if (!Number.isFinite(decimals) || decimals < 0 || decimals > 255) decimals = 18;

  return { chain: cfg.id, addressOrMint: checksummed, symbol, name, decimals };
}

async function coingeckoSearch(query: string): Promise<{ id: string; symbol: string; name: string } | null> {
  const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!r.ok) return null;
  const j = (await r.json()) as { coins?: Array<{ id: string; symbol: string; name: string }> };
  const coins = Array.isArray(j.coins) ? j.coins : [];
  if (!coins.length) return null;
  // Prefer exact symbol match (case-insensitive), otherwise top result
  const exact = coins.find((c) => c.symbol?.toLowerCase() === query.toLowerCase());
  const best = exact ?? coins[0]!;
  return { id: best.id, symbol: best.symbol, name: best.name };
}

async function coingeckoCoinPlatforms(
  coingeckoId: string
): Promise<Record<string, string> | null> {
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coingeckoId)}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
  const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
  if (!r.ok) return null;
  const j = (await r.json()) as { platforms?: Record<string, string> };
  if (!j.platforms || typeof j.platforms !== "object") return null;
  return j.platforms as Record<string, string>;
}

function pickPlatformAddressForChain(platforms: Record<string, string>, cfg: ChainConfig): string | null {
  // Avoid hardcoded platform keys: use heuristic match on chain id/name.
  const keys = Object.keys(platforms);
  const normalizedChain = cfg.id.toLowerCase();
  const candidates = keys
    .map((k) => ({ k, nk: k.toLowerCase() }))
    .filter(({ k }) => typeof platforms[k] === "string" && platforms[k]!.trim().length > 0);

  const direct = candidates.find(({ nk }) => nk === normalizedChain);
  const contains = candidates.find(({ nk }) => nk.includes(normalizedChain));
  const byName = candidates.find(({ nk }) => cfg.name && nk.includes(cfg.name.toLowerCase()));

  const picked = direct ?? contains ?? byName;
  if (!picked) return null;
  return platforms[picked.k]!.trim();
}

async function resolveEvmBySymbolOrName(cfg: ChainConfig, query: string): Promise<CanonicalAsset> {
  const hit = await coingeckoSearch(query);
  if (!hit) throw new Error(`Token not found for query: ${query}`);

  const platforms = await coingeckoCoinPlatforms(hit.id);
  const address = platforms ? pickPlatformAddressForChain(platforms, cfg) : null;
  if (!address || !isHexAddressLike(address)) {
    throw new Error(`No EVM contract address found for ${hit.id} on chain ${cfg.id}`);
  }

  const meta = await resolveEvmByAddress(cfg, address);
  return {
    ...meta,
    // Prefer on-chain symbol/decimals, but keep CoinGecko id for oracle fallback later
    coingeckoId: hit.id,
    name: meta.name ?? hit.name,
    symbol: meta.symbol !== "UNKNOWN" ? meta.symbol : hit.symbol.toUpperCase(),
  };
}

export async function resolveCanonicalAsset(args: {
  chain: string;
  query: string; // symbol/name/address/mint
}): Promise<CanonicalAsset> {
  const chain = args.chain.trim().toLowerCase();
  const q = normalizeQuery(args.query);
  const cacheKey = `${chain}:${q.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const cfg = getChainConfig(chain);
  if (!cfg) throw new Error(`Unsupported chain: ${chain}`);

  let asset: CanonicalAsset;
  if (isEvmChain(chain)) {
    if (isHexAddressLike(q)) asset = await resolveEvmByAddress(cfg, q);
    else asset = await resolveEvmBySymbolOrName(cfg, q);
  } else {
    // Non‑EVM resolution is implemented in later phases (Solana/Jupiter, TON/TRON registries).
    // For now, accept a chain-native identifier as addressOrMint and require decimals explicitly later.
    throw new Error(`Token resolution not yet implemented for chain kind: ${cfg.kind}`);
  }

  cacheSet(cacheKey, asset, 5 * 60_000); // 5 min
  return asset;
}

