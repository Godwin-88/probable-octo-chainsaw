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
const ACTIVITY_TTL_SEC = 7 * 24 * 3600;

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

export function activityKey(walletOrSessionId: string): string {
  return `activity:${(walletOrSessionId || "default").toLowerCase()}`;
}

export type ActivityItem = { txHash: string; chain: string; timestamp: string; label?: string };

export async function appendActivity(
  walletOrSessionId: string,
  item: ActivityItem
): Promise<void> {
  const redis = await getRedis();
  const key = activityKey(walletOrSessionId);
  await redis.lPush(key, JSON.stringify(item));
  await redis.lTrim(key, 0, 999);
  await redis.expire(key, ACTIVITY_TTL_SEC);
}

export async function getActivity(
  walletOrSessionId: string,
  limit: number = 50
): Promise<ActivityItem[]> {
  const redis = await getRedis();
  const key = activityKey(walletOrSessionId);
  const raw = await redis.lRange(key, 0, limit - 1);
  const out: ActivityItem[] = [];
  for (const s of raw) {
    try {
      out.push(JSON.parse(s) as ActivityItem);
    } catch (_) {}
  }
  return out;
}

const AUTONOMOUS_TTL_SEC = 24 * 3600;

export function agentAutonomousKey(sessionOrWalletId: string): string {
  return `agent:autonomous:${(sessionOrWalletId || "default").toLowerCase()}`;
}

export async function setAgentAutonomous(sessionOrWalletId: string, autonomous: boolean): Promise<void> {
  const redis = await getRedis();
  const key = agentAutonomousKey(sessionOrWalletId);
  await redis.setEx(key, AUTONOMOUS_TTL_SEC, autonomous ? "1" : "0");
}

export async function getAgentAutonomous(sessionOrWalletId: string): Promise<boolean> {
  const redis = await getRedis();
  const key = agentAutonomousKey(sessionOrWalletId);
  const v = await redis.get(key);
  return v === "1";
}

// ── Pub/Sub helpers for live market broadcast ─────────────────────────────────

export const PUBSUB_CHANNELS = {
  marketUpdate: "market:update",
  portfolioUpdate: "portfolio:update",
  optimizationUpdate: "optimization:update",
} as const;

let _publisher: RedisClientType | null = null;
let _subscriber: ReturnType<typeof createClient> | null = null;

export async function getPublisher(): Promise<RedisClientType> {
  if (_publisher) return _publisher;
  _publisher = createClient({ url: REDIS_URL }) as RedisClientType;
  _publisher.on("error", (err) => console.error("Redis publisher error:", err));
  await _publisher.connect();
  return _publisher;
}

export async function publishMarketUpdate(payload: unknown): Promise<void> {
  try {
    const pub = await getPublisher();
    await pub.publish(PUBSUB_CHANNELS.marketUpdate, JSON.stringify(payload));
  } catch (_) {}
}

export async function subscribeToChannel(
  channel: string,
  onMessage: (message: string) => void
): Promise<() => Promise<void>> {
  const sub = createClient({ url: REDIS_URL });
  sub.on("error", (err) => console.error("Redis subscriber error:", err));
  await sub.connect();
  await sub.subscribe(channel, onMessage);
  _subscriber = sub;
  return async () => {
    try {
      await sub.unsubscribe(channel);
      await sub.quit();
    } catch (_) {}
  };
}
