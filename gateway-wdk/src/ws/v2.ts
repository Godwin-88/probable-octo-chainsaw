/**
 * WebSocket endpoints for v2: positions, opportunities, agent, market.
 * Market updates pushed via Redis pubsub subscription + periodic polling.
 */
import { WebSocketServer } from "ws";
import type { Server } from "http";
import {
  subscribeToChannel,
  getAgentAutonomous,
  setAgentAutonomous,
  PUBSUB_CHANNELS,
} from "../lib/redis.js";
import { getPortfolio } from "../services/portfolio.js";
import { getOraclePrice } from "../services/oracle.js";

let v2Wss: WebSocketServer | null = null;

const OPPORTUNITIES_POLL_MS = 60_000;
const POSITIONS_POLL_MS = 30_000;
const MARKET_PRICE_POLL_MS = 15_000;

const opportunityClients: Set<import("ws").WebSocket> = new Set();
const marketClients: Set<import("ws").WebSocket> = new Set();

function safeSend(ws: import("ws").WebSocket, payload: unknown): void {
  try {
    if (ws.readyState === 1) ws.send(JSON.stringify(payload));
  } catch (_) {}
}

function broadcast(clients: Set<import("ws").WebSocket>, payload: unknown): void {
  const msg = JSON.stringify(payload);
  clients.forEach((ws) => {
    try {
      if (ws.readyState === 1) ws.send(msg);
    } catch (_) {}
  });
}

async function fetchOpportunities(): Promise<unknown[]> {
  const base = (process.env.AI_CORE_HTTP_URL || "").replace(/\/$/, "");
  if (!base) return [];
  try {
    const r = await fetch(
      `${base}/assets/search?q=all&type=opportunity&count=50`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (r.ok) return (await r.json()) as unknown[];
  } catch (_) {}
  return [];
}

async function fetchMarketPrices(): Promise<Record<string, unknown>> {
  const pairs = (process.env.MARKET_PRICE_PAIRS ?? "ETH-USDT,BTC-USDT").split(",").map((s) => s.trim());
  const prices: Record<string, unknown> = {};
  await Promise.allSettled(
    pairs.map(async (pair) => {
      try {
        const r = await getOraclePrice(pair, "ethereum");
        prices[pair] = { price: r.price, timestamp: r.timestamp, source: r.source };
      } catch (_) {
        prices[pair] = { error: "unavailable" };
      }
    })
  );
  return prices;
}

export function registerV2WebSockets(httpServer: Server): void {
  v2Wss = new WebSocketServer({ noServer: true });

  v2Wss.on("connection", (ws: import("ws").WebSocket, _request: import("http").IncomingMessage, url: URL) => {
    const pathname = url?.pathname ?? "";
    const params = url?.searchParams;

    safeSend(ws, { type: "connected", path: pathname, ts: new Date().toISOString() });

    // ── /v2/ws/positions/:wallet — live portfolio polling ─────────────────
    if (pathname.startsWith("/v2/ws/positions/")) {
      const wallet = pathname.split("/v2/ws/positions/")[1] ?? "";
      const chain = params?.get("chain") ?? "ethereum";
      const doSend = async () => {
        if (ws.readyState !== 1) return;
        try {
          const portfolio = await getPortfolio(wallet, chain);
          safeSend(ws, { type: "positions_update", ...portfolio, ts: new Date().toISOString() });
        } catch (_) {
          safeSend(ws, { type: "positions_update", error: "fetch failed", ts: new Date().toISOString() });
        }
      };
      doSend();
      const interval = setInterval(doSend, POSITIONS_POLL_MS);
      ws.on("close", () => clearInterval(interval));
    }

    // ── /v2/ws/opportunities — live opportunity stream ────────────────────
    if (pathname.startsWith("/v2/ws/opportunities")) {
      opportunityClients.add(ws);
      fetchOpportunities().then((opps) => safeSend(ws, { type: "opportunities", opportunities: opps }));
      ws.on("close", () => opportunityClients.delete(ws));
    }

    // ── /v2/ws/market — live price stream (Redis pubsub + poll) ──────────
    if (pathname.startsWith("/v2/ws/market")) {
      marketClients.add(ws);
      fetchMarketPrices().then((prices) =>
        safeSend(ws, { type: "market_update", prices, ts: new Date().toISOString() })
      );
      ws.on("close", () => marketClients.delete(ws));
    }

    // ── /v2/ws/agent/:id — agent status, autonomous toggle ───────────────
    if (pathname.startsWith("/v2/ws/agent/")) {
      const agentId = pathname.split("/v2/ws/agent/")[1] ?? "default";
      getAgentAutonomous(agentId)
        .then((autonomous) =>
          safeSend(ws, { type: "agent_status", status: "ready", autonomous, agentId })
        )
        .catch(() => {});

      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(raw.toString()) as { type?: string; autonomous?: boolean };
          if (msg.type === "set_autonomous") {
            setAgentAutonomous(agentId, !!msg.autonomous)
              .then(() => safeSend(ws, { type: "agent_status", autonomous: !!msg.autonomous, agentId }))
              .catch(() => {});
          }
        } catch (_) {}
      });
    }
  });

  // ── Periodic broadcasts ───────────────────────────────────────────────────
  setInterval(() => {
    if (opportunityClients.size === 0) return;
    fetchOpportunities().then((opps) =>
      broadcast(opportunityClients, { type: "opportunities", opportunities: opps })
    );
  }, OPPORTUNITIES_POLL_MS);

  setInterval(() => {
    if (marketClients.size === 0) return;
    fetchMarketPrices().then((prices) =>
      broadcast(marketClients, { type: "market_update", prices, ts: new Date().toISOString() })
    );
  }, MARKET_PRICE_POLL_MS);

  // ── Redis pubsub → market broadcast ──────────────────────────────────────
  subscribeToChannel(PUBSUB_CHANNELS.marketUpdate, (message) => {
    if (marketClients.size === 0) return;
    try {
      const parsed = JSON.parse(message) as Record<string, unknown>;
      broadcast(marketClients, { type: "market_update", ...parsed });
    } catch (_) {}
  }).catch((err) => console.warn("Redis market pubsub unavailable (non-fatal):", err));
}

export function tryUpgradeV2(
  request: import("http").IncomingMessage,
  socket: import("stream").Duplex,
  head: Buffer,
  pathname: string
): boolean {
  if (!pathname.startsWith("/v2/ws/") || !v2Wss) return false;
  const url = new URL(request.url ?? "", `http://${request.headers.host}`);
  v2Wss.handleUpgrade(request, socket, head, (ws) => {
    v2Wss!.emit("connection", ws, request, url);
  });
  return true;
}
