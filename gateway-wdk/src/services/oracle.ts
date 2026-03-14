/**
 * Oracle service — fetch token prices and optional pool state.
 * Uses CoinGecko (no key) or optional Pyth/RedStone; pool state via RPC eth_call.
 */

import { getPublicRpcUrl } from "../lib/chains.js";
import { resolveCanonicalAsset } from "./tokenResolver.js";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const PYTH_HTTP_URL = process.env.PYTH_HTTP_URL ?? "https://hermes.pyth.network";

export type OraclePriceResult = {
  price: number;
  timestamp: string;
  source?: string;
};

async function coingeckoUsdPrice(coingeckoId: string): Promise<number | null> {
  const res = await fetch(
    `${COINGECKO_BASE}/simple/price?ids=${encodeURIComponent(coingeckoId)}&vs_currencies=usd`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, { usd?: number }>;
  const price = data[coingeckoId]?.usd;
  return typeof price === "number" ? price : null;
}

type PythFeedMetadata = { id: string; attributes: Record<string, string> };

async function pythFindPriceFeedId(args: {
  query: string;
  assetType?: "crypto" | "fx" | "equity" | "metal" | "rates";
  // Prefer exact match like "ETH/USD"
  preferSymbol?: string;
}): Promise<string | null> {
  const url = new URL(`${PYTH_HTTP_URL.replace(/\/$/, "")}/v2/price_feeds`);
  url.searchParams.set("query", args.query);
  if (args.assetType) url.searchParams.set("asset_type", args.assetType);

  const r = await fetch(url.toString(), { signal: AbortSignal.timeout(7000) });
  if (!r.ok) return null;
  const feeds = (await r.json()) as PythFeedMetadata[];
  if (!Array.isArray(feeds) || !feeds.length) return null;

  const prefer = (args.preferSymbol ?? "").toUpperCase();
  const findSymbol = (f: PythFeedMetadata) =>
    (f.attributes?.symbol ?? f.attributes?.pair ?? "").toUpperCase();

  const exact = prefer
    ? feeds.find((f) => findSymbol(f) === prefer)
    : null;
  if (exact?.id) return exact.id;

  // Otherwise choose the first feed whose symbol contains the query (case insensitive)
  const q = args.query.toUpperCase();
  const best =
    feeds.find((f) => findSymbol(f).includes(`${q}/USD`)) ??
    feeds.find((f) => findSymbol(f).includes(q)) ??
    feeds[0];

  return best?.id ?? null;
}

async function pythLatestPriceUsd(priceFeedId: string): Promise<{ priceUsd: number; publishTime: number } | null> {
  const url = new URL(`${PYTH_HTTP_URL.replace(/\/$/, "")}/v2/updates/price/latest`);
  url.searchParams.append("ids[]", priceFeedId);
  url.searchParams.set("parsed", "true");

  const r = await fetch(url.toString(), { signal: AbortSignal.timeout(7000) });
  if (!r.ok) return null;
  const j = (await r.json()) as {
    parsed?: Array<{ price?: { price: string; expo: number; publish_time: number } }>;
  };
  const p = j.parsed?.[0]?.price;
  if (!p) return null;
  const num = Number(p.price) * 10 ** Number(p.expo);
  if (!Number.isFinite(num)) return null;
  return { priceUsd: num, publishTime: p.publish_time };
}

function reconcilePrices(a: number, b: number): { price: number; ok: boolean; deviationPct: number } {
  const mid = (a + b) / 2;
  const deviationPct = mid > 0 ? (Math.abs(a - b) / mid) * 100 : 100;
  // Strict: reject if deviation > 2%
  if (deviationPct > 2) return { price: mid, ok: false, deviationPct };
  return { price: mid, ok: true, deviationPct };
}

/**
 * Fetch price for a token pair. Tries CoinGecko first; optional Pyth fallback.
 */
export async function getOraclePrice(
  tokenPair: string,
  _chain?: string,
  _dex?: string
): Promise<OraclePriceResult> {
  const normalized = tokenPair.replace(/\s/g, "").toUpperCase();
  const chain = (_chain ?? "ethereum").toLowerCase();
  const [baseSym, quoteSym] = normalized.split("-");
  const hasPair = !!baseSym && !!quoteSym;
  if (hasPair) {
    try {
      // Resolve canonical identifiers dynamically (no hardcoded pair mappings).
      const [base, quote] = await Promise.all([
        resolveCanonicalAsset({ chain, query: baseSym }),
        resolveCanonicalAsset({ chain, query: quoteSym }),
      ]);

      // Source 1: Pyth (preferred). Discover feed ids dynamically via Hermes metadata.
      const nowSec = Math.floor(Date.now() / 1000);
      let pythPrice: { price: number; publishTime: number } | null = null;
      try {
        const [baseId, quoteId] = await Promise.all([
          pythFindPriceFeedId({ query: base.symbol, assetType: "crypto", preferSymbol: `${base.symbol}/USD` }),
          pythFindPriceFeedId({ query: quote.symbol, assetType: "crypto", preferSymbol: `${quote.symbol}/USD` }),
        ]);
        if (baseId && quoteId) {
          const [baseP, quoteP] = await Promise.all([
            pythLatestPriceUsd(baseId),
            pythLatestPriceUsd(quoteId),
          ]);
          if (baseP && quoteP && quoteP.priceUsd > 0) {
            const fresh = nowSec - baseP.publishTime <= 30 && nowSec - quoteP.publishTime <= 30;
            if (fresh) {
              pythPrice = { price: baseP.priceUsd / quoteP.priceUsd, publishTime: Math.min(baseP.publishTime, quoteP.publishTime) };
            }
          }
        }
      } catch {}

      // Source 2: CoinGecko (absolute fallback / secondary reconciliation source).
      let cgPrice: number | null = null;
      if (base.coingeckoId && quote.coingeckoId) {
        const [baseUsd, quoteUsd] = await Promise.all([
          coingeckoUsdPrice(base.coingeckoId),
          coingeckoUsdPrice(quote.coingeckoId),
        ]);
        if (baseUsd != null && quoteUsd != null && quoteUsd > 0) cgPrice = baseUsd / quoteUsd;
      }

      if (pythPrice && cgPrice != null) {
        const rec = reconcilePrices(pythPrice.price, cgPrice);
        if (!rec.ok) throw new Error(`Conflicting sources (deviation ${rec.deviationPct.toFixed(2)}%)`);
        return {
          price: rec.price,
          timestamp: new Date(pythPrice.publishTime * 1000).toISOString(),
          source: "pyth+coingecko",
        };
      }

      if (pythPrice) {
        return {
          price: pythPrice.price,
          timestamp: new Date(pythPrice.publishTime * 1000).toISOString(),
          source: "pyth",
        };
      }

      if (cgPrice != null) {
        return {
          price: cgPrice,
          timestamp: new Date().toISOString(),
          source: "coingecko",
        };
      }

      throw new Error("No oracle sources available");
    } catch (e) {
      console.warn("Oracle CoinGecko fetch failed:", e);
    }
  }
  // Stub fallback so UI never breaks
  return {
    price: 0,
    timestamp: new Date().toISOString(),
    source: "stub",
  };
}

export type PoolStateResult = {
  reserve0?: string;
  reserve1?: string;
  sqrtPriceX96?: string;
  tick?: number;
  token0?: string;
  token1?: string;
  timestamp?: string;
};

function getRpcUrl(chain: string): string {
  return (
    getPublicRpcUrl(chain) ??
    process.env.RPC_URL_ETHEREUM ??
    "https://eth.llamarpc.com"
  );
}

// Uniswap V2 getReserves(): 0x0902f1
const UNISWAP_V2_GET_RESERVES = "0x0902f1";
// Uniswap V3 slot0(): 0x3850c7bd (tick, sqrtPriceX96)
const UNISWAP_V3_SLOT0 = "0x3850c7bd";

/**
 * Fetch pool state for an EVM Uniswap V2 or V3 pool via eth_call.
 */
export async function getPoolState(
  poolAddress: string,
  chain: string = "ethereum"
): Promise<PoolStateResult> {
  const rpcUrl = getRpcUrl(chain);
  try {
    // Try V2 getReserves first
    const resV2 = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          { to: poolAddress, data: UNISWAP_V2_GET_RESERVES },
          "latest",
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });
    const dataV2 = (await resV2.json()) as { result?: string };
    if (dataV2.result && dataV2.result !== "0x") {
      const hex = dataV2.result.slice(2);
      if (hex.length >= 128) {
        const reserve0 = "0x" + hex.slice(0, 64);
        const reserve1 = "0x" + hex.slice(64, 128);
        return {
          reserve0,
          reserve1,
          timestamp: new Date().toISOString(),
        };
      }
    }
    // Try V3 slot0
    const resV3 = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          { to: poolAddress, data: UNISWAP_V3_SLOT0 },
          "latest",
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });
    const dataV3 = (await resV3.json()) as { result?: string };
    if (dataV3.result && dataV3.result !== "0x") {
      const hex = dataV3.result.slice(2);
      if (hex.length >= 128) {
        const sqrtPriceX96 = "0x" + hex.slice(0, 64);
        const tickHex = hex.slice(64, 128);
        const tick = parseInt(tickHex, 16);
        if (!Number.isNaN(tick)) {
          return { sqrtPriceX96, tick };
        }
      }
    }
  } catch (e) {
    console.warn("Pool state fetch failed:", e);
  }
  return {};
}
