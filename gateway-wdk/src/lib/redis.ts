import { createClient, type RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let client: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType> {
  if (client) return client;
  client = createClient({ url: REDIS_URL });
  client.on("error", (err) => console.error("Redis error:", err));
  await client.connect();
  return client;
}

const DEFAULT_TTL_SEC = 60;
const PORTFOLIO_TTL_SEC = 120;
const OPTIMIZATION_PLAN_TTL_SEC = 300;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  const raw = await redis.get(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSec: number = DEFAULT_TTL_SEC
): Promise<void> {
  const redis = await getRedis();
  await redis.setEx(key, ttlSec, JSON.stringify(value));
}

export function portfolioCacheKey(walletAddress: string, chainId: string): string {
  return `portfolio:${walletAddress.toLowerCase()}:${chainId}`;
}

export function optimizationPlanCacheKey(optimizationId: string): string {
  return `optimization_plan:${optimizationId}`;
}

export const CACHE_TTL = {
  portfolio: PORTFOLIO_TTL_SEC,
  optimizationPlan: OPTIMIZATION_PLAN_TTL_SEC,
} as const;
