export type ChainKind = "evm" | "solana" | "ton" | "tron" | "btc" | "spark" | "unknown";

export type ChainConfig = {
  id: string; // canonical slug used across APIs (e.g. "ethereum", "arbitrum", "solana")
  name: string;
  kind: ChainKind;
  // Optional numeric EVM chain id (as string) for UI display / validation
  chainId?: string;
  // Explorer base for tx links; must end with trailing slash where appropriate
  explorerTxBase?: string;
  // RPC URLs are configuration, not hardcoded into logic
  rpcUrls: string[];
};

export type ChainsRegistry = {
  chains: ChainConfig[];
  // Fast lookup
  byId: Record<string, ChainConfig>;
};

function normalizeChainId(id: string): string {
  return id.trim().toLowerCase();
}

function envList(name: string): string[] {
  const raw = process.env[name];
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function tryParseJson<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function rpcEnvVarForChain(chainId: string): string {
  // Convention: RPC_URL_<CHAIN> where <CHAIN> is upper snake-ish.
  // Examples: ethereum -> RPC_URL_ETHEREUM, arbitrum -> RPC_URL_ARBITRUM, base -> RPC_URL_BASE
  return `RPC_URL_${chainId.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

function defaultChainCatalog(): Omit<ChainConfig, "rpcUrls">[] {
  // These are *metadata defaults* only. RPC URLs are always sourced from env/config.
  // Add new chains via SUPPORTED_CHAINS and RPC_URL_<CHAIN>, or via CHAIN_CONFIG_JSON.
  return [
    { id: "ethereum", name: "Ethereum", kind: "evm", chainId: "1", explorerTxBase: "https://etherscan.io/tx/" },
    { id: "sepolia", name: "Sepolia", kind: "evm", chainId: "11155111", explorerTxBase: "https://sepolia.etherscan.io/tx/" },
    { id: "polygon", name: "Polygon", kind: "evm", chainId: "137", explorerTxBase: "https://polygonscan.com/tx/" },
    { id: "arbitrum", name: "Arbitrum", kind: "evm", chainId: "42161", explorerTxBase: "https://arbiscan.io/tx/" },
    { id: "base", name: "Base", kind: "evm", chainId: "8453", explorerTxBase: "https://basescan.org/tx/" },
    { id: "solana", name: "Solana", kind: "solana", explorerTxBase: "https://solscan.io/tx/" },
    { id: "ton", name: "TON", kind: "ton", explorerTxBase: "https://tonscan.org/tx/" },
    { id: "tron", name: "TRON", kind: "tron", explorerTxBase: "https://tronscan.org/#/transaction/" },
  ];
}

let _registry: ChainsRegistry | null = null;

export function getChainsRegistry(): ChainsRegistry {
  if (_registry) return _registry;

  // Optional full override via JSON (lets you add new chains without code changes)
  const json = tryParseJson<{ chains?: ChainConfig[] }>(process.env.CHAIN_CONFIG_JSON);
  const jsonChains = Array.isArray(json?.chains) ? json!.chains : null;

  const supported = envList("SUPPORTED_CHAINS").map(normalizeChainId);
  const supportedSet = supported.length ? new Set(supported) : null;

  const baseCatalog = jsonChains ?? defaultChainCatalog().map((c) => ({ ...c, rpcUrls: [] }));
  const chains: ChainConfig[] = [];

  for (const raw of baseCatalog) {
    const id = normalizeChainId(raw.id);
    if (supportedSet && !supportedSet.has(id)) continue;

    const rpcUrls: string[] = [];
    // 1) Chain-specific env var
    const envVar = rpcEnvVarForChain(id);
    const fromEnv = envList(envVar);
    if (fromEnv.length) rpcUrls.push(...fromEnv);
    // 2) If config JSON provided rpcUrls, honor them too
    if (Array.isArray((raw as ChainConfig).rpcUrls) && (raw as ChainConfig).rpcUrls.length) {
      rpcUrls.push(...(raw as ChainConfig).rpcUrls);
    }

    // If no RPC configured, we still expose the chain as "configured: false"
    chains.push({
      ...raw,
      id,
      rpcUrls: rpcUrls.filter(Boolean),
    });
  }

  const byId: Record<string, ChainConfig> = {};
  for (const c of chains) byId[c.id] = c;

  _registry = { chains, byId };
  return _registry;
}

export function getChainConfig(chainId: string | undefined): ChainConfig | null {
  if (!chainId) return null;
  const id = normalizeChainId(chainId);
  const reg = getChainsRegistry();
  return reg.byId[id] ?? null;
}

export function getPublicRpcUrl(chainId: string | undefined): string | null {
  const cfg = getChainConfig(chainId);
  if (!cfg) return null;
  return cfg.rpcUrls[0] ?? null;
}

export function isEvmChain(chainId: string | undefined): boolean {
  const cfg = getChainConfig(chainId);
  return cfg?.kind === "evm";
}

