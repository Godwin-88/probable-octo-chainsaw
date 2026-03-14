/**
 * Web3-native v2 API — maps UI-facing endpoints to existing gateway services.
 * Response shapes align with frontend gatewayV2.ts and Overview/DefiWorkspace.
 */
import { Router } from "express";
import { getPortfolio } from "../services/portfolio.js";
import { getOraclePrice, getPoolState } from "../services/oracle.js";
import { simulateSwap } from "../services/simulateSwap.js";
import { submitBundleEvm, simulateBundleEvm } from "../services/bundle.js";
import { getRelayRpcUrl } from "../lib/relay.js";
import { getChainsRegistry } from "../lib/chains.js";
import { resolveCanonicalAsset } from "../services/tokenResolver.js";
import {
  cacheGet,
  cacheSet,
  optimizationPlanCacheKey,
  appendActivity,
  getActivity,
  setAgentAutonomous,
  getAgentAutonomous,
  CACHE_TTL,
} from "../lib/redis.js";

export const v2Router = Router();

// ── Chains registry (dynamic chain discovery for frontend/agents) ────────────
v2Router.get("/chains", async (_req, res) => {
  try {
    const reg = getChainsRegistry();
    res.json({
      chains: reg.chains.map((c) => ({
        id: c.id,
        name: c.name,
        kind: c.kind,
        chainId: c.chainId,
        explorerTxBase: c.explorerTxBase,
        configured: c.rpcUrls.length > 0,
      })),
    });
  } catch (err) {
    console.error("v2 chains error:", err);
    res.status(500).json({ error: "Failed to list chains" });
  }
});

// ── Universe snapshot (dynamic ingestion surface for UI + agent) ─────────────
v2Router.get("/universe/snapshot", async (req, res) => {
  try {
    const reg = getChainsRegistry();
    const chainsParam = (req.query.chains as string | undefined)?.trim();
    const assetsParam = (req.query.assets as string | undefined)?.trim();
    const includeParam = (req.query.include as string | undefined)?.trim();
    const quote = ((req.query.quote as string | undefined) ?? "USDT").trim().toUpperCase();
    const wallet = (req.query.wallet as string | undefined)?.trim();

    const chains =
      chainsParam?.length
        ? chainsParam.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean)
        : reg.chains.map((c) => c.id);

    const assets =
      assetsParam?.length
        ? assetsParam.split(",").map((a) => a.trim()).filter(Boolean)
        : (process.env.UNIVERSE_DEFAULT_ASSETS ?? "ETH,BTC,USDC,USDT").split(",").map((a) => a.trim()).filter(Boolean);

    const include = new Set(
      (includeParam?.length ? includeParam : "tokens,prices")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );

    const cacheKey = `v2:universe:${chains.join("|")}:${assets.join("|")}:${quote}:${includeParam ?? ""}:${wallet ?? ""}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) return res.json(cached);

    const tokens: Array<{ chain: string; query: string; asset?: unknown; error?: string }> = [];
    const prices: Array<{ chain: string; pair: string; price?: number; timestamp?: string; source?: string; error?: string }> = [];
    const positions: Record<string, unknown> = {};

    // Token resolution
    const resolvedByChain: Record<string, Array<{ query: string; asset: Awaited<ReturnType<typeof resolveCanonicalAsset>> }>> = {};
    await Promise.all(
      chains.map(async (chain) => {
        resolvedByChain[chain] = [];
        for (const q of assets) {
          try {
            const asset = await resolveCanonicalAsset({ chain, query: q });
            resolvedByChain[chain].push({ query: q, asset });
            tokens.push({ chain, query: q, asset });
          } catch (e) {
            tokens.push({ chain, query: q, error: (e as Error).message });
          }
        }
      })
    );

    // Prices (symbol-quote)
    if (include.has("prices")) {
      await Promise.all(
        Object.entries(resolvedByChain).map(async ([chain, list]) => {
          for (const it of list) {
            const pair = `${it.asset.symbol}-${quote}`;
            try {
              const r = await getOraclePrice(pair, chain);
              prices.push({ chain, pair, price: r.price, timestamp: r.timestamp, source: r.source });
            } catch (e) {
              prices.push({ chain, pair, error: (e as Error).message });
            }
          }
        })
      );
    }

    // Optional positions snapshot
    if (include.has("positions") && wallet) {
      await Promise.all(
        chains.map(async (chain) => {
          try {
            positions[chain] = await getPortfolio(wallet, chain);
          } catch (e) {
            positions[chain] = { error: (e as Error).message };
          }
        })
      );
    }

    const out = {
      requested: { chains, assets, quote, include: Array.from(include), wallet: wallet ?? null },
      chains: reg.chains
        .filter((c) => chains.includes(c.id))
        .map((c) => ({ id: c.id, name: c.name, kind: c.kind, chainId: c.chainId, configured: c.rpcUrls.length > 0 })),
      tokens: include.has("tokens") ? tokens : [],
      prices: include.has("prices") ? prices : [],
      positions: include.has("positions") ? positions : null,
      timestamp: new Date().toISOString(),
    };

    await cacheSet(cacheKey, out, 15); // 15s snapshot cache
    return res.json(out);
  } catch (err) {
    console.error("v2 universe/snapshot error:", err);
    res.status(500).json({ error: "Universe snapshot unavailable" });
  }
});

// ── Positions (alias for portfolio; same data, v2 shape) ─────────────────────
v2Router.get("/positions/:walletOrAgentId", async (req, res) => {
  try {
    const walletOrAgentId = req.params.walletOrAgentId;
    const chain = (req.query.chain as string) || "ethereum";
    if (!walletOrAgentId) {
      res.status(400).json({ error: "walletOrAgentId required" });
      return;
    }
    const portfolio = await getPortfolio(walletOrAgentId, chain);
    res.json({
      walletOrAgentId: portfolio.walletAddress,
      positions: portfolio.positions,
      totalUsd: portfolio.totalUsd,
    });
  } catch (err) {
    console.error("v2 positions error:", err);
    res.status(500).json({ error: "Failed to fetch positions" });
  }
});

// ── Oracles / price (oracle service: CoinGecko) ──────────────────────────────
v2Router.get("/oracles/price/:tokenPair", async (req, res) => {
  try {
    const pair = req.params.tokenPair;
    const chain = (req.query.chain as string) || "ethereum";
    const dex = req.query.dex as string | undefined;
    if (!pair) {
      res.status(400).json({ error: "tokenPair required" });
      return;
    }
    const result = await getOraclePrice(pair, chain, dex);
    res.json({
      price: result.price,
      timestamp: result.timestamp,
      ...(result.source && { source: result.source }),
    });
  } catch (err) {
    console.error("v2 oracles/price error:", err);
    res.status(500).json({ error: "Oracle price unavailable" });
  }
});

// ── Pool state (EVM Uniswap V2/V3 via eth_call) ─────────────────────────────
v2Router.get("/pool/:poolAddress", async (req, res) => {
  try {
    const poolAddress = req.params.poolAddress;
    const chain = (req.query.chain as string) || "ethereum";
    if (!poolAddress) {
      res.status(400).json({ error: "poolAddress required" });
      return;
    }
    const state = await getPoolState(poolAddress, chain);
    res.json(state);
  } catch (err) {
    console.error("v2 pool error:", err);
    res.status(500).json({ error: "Pool state unavailable" });
  }
});

// ── Simulation (Uniswap V2 getAmountsOut + oracle slippage) ──────────────────
v2Router.post("/simulate/swap", async (req, res) => {
  try {
    const body = req.body as { amountIn?: string; path?: string[]; chain?: string };
    if (!body?.amountIn || !body?.path?.length) {
      res.status(400).json({ error: "amountIn and path required" });
      return;
    }
    const result = await simulateSwap(
      body.amountIn,
      body.path,
      body.chain ?? "ethereum"
    );
    res.json({
      expectedOut: result.expectedOut,
      slippage: result.slippage,
      mevRiskScore: result.mevRiskScore,
    });
  } catch (err) {
    console.error("v2 simulate/swap error:", err);
    res.status(500).json({ error: "Simulation unavailable" });
  }
});

v2Router.post("/simulate/bundle", async (req, res) => {
  try {
    const body = req.body as { txs?: string[]; signedTxs?: string[]; chain?: string };
    const txs = body?.signedTxs ?? body?.txs ?? [];
    const chain = body?.chain ?? "ethereum";
    const result = await simulateBundleEvm(Array.isArray(txs) ? (txs as string[]) : [], chain);
    res.json({
      simulatedPnl: result.simulatedPnl,
      adversarialOrderings: result.adversarialOrderings,
    });
  } catch (err) {
    console.error("v2 simulate/bundle error:", err);
    res.status(500).json({ error: "Bundle simulation unavailable" });
  }
});

v2Router.post("/submit/bundle", async (req, res) => {
  try {
    const body = req.body as { chain?: string; signedTxs: string[] };
    if (!body?.signedTxs?.length) {
      res.status(400).json({ error: "signedTxs array required" });
      return;
    }
    const result = await submitBundleEvm(body.signedTxs, body.chain ?? "ethereum");
    if (!result.ok) {
      res.status(400).json({ error: result.error ?? "Bundle submit failed" });
      return;
    }
    res.json({ bundleHash: result.bundleHash, ok: true });
  } catch (err) {
    console.error("v2 submit/bundle error:", err);
    res.status(500).json({ error: "Bundle submit failed" });
  }
});

// ── Execution & protect (stubs; real impl would use WDK + relays) ───────────
v2Router.post("/execute/swap", async (req, res) => {
  try {
    const body = req.body as { from?: string; to?: string; amount?: string; chain?: string; protection?: string };
    if (!body?.from || !body?.to || body?.amount == null) {
      res.status(400).json({ error: "from, to, amount required" });
      return;
    }
    res.status(501).json({
      error: "Execute swap not implemented; use /api/execute/signed with signed tx",
      _hint: "Sign in wallet and POST signedTxHex to /api/execute/signed",
    });
  } catch (err) {
    console.error("v2 execute/swap error:", err);
    res.status(500).json({ error: "Execution failed" });
  }
});

v2Router.post("/protect/submit", async (req, res) => {
  try {
    const body = req.body as {
      signedTxHex?: string;
      chain?: string;
      protection?: string;
      walletOrSessionId?: string;
    };
    if (!body?.signedTxHex) {
      res.status(400).json({ error: "signedTxHex required" });
      return;
    }
    const chain = body.chain ?? "ethereum";
    const protection = body.protection;
    const rpcUrl = getRelayRpcUrl(chain, protection);
    const r = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendRawTransaction",
        params: [body.signedTxHex],
      }),
    });
    const data = (await r.json()) as { result?: string; error?: { message: string } };
    if (data.error) {
      res.status(400).json({ error: data.error.message ?? "Broadcast failed" });
      return;
    }
    if (data.result) {
      await appendActivity(body.walletOrSessionId ?? "default", {
        txHash: data.result,
        chain,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }
    res.json({ txHash: data.result });
  } catch (err) {
    console.error("v2 protect/submit error:", err);
    res.status(500).json({ error: "Protected submit failed" });
  }
});

// ── Agent toggle (persisted in Redis) ───────────────────────────────────────
v2Router.post("/agent/toggle", async (req, res) => {
  try {
    const body = req.body as { autonomous?: boolean; sessionOrWalletId?: string };
    const autonomous = !!body?.autonomous;
    const id = body?.sessionOrWalletId ?? "default";
    await setAgentAutonomous(id, autonomous);
    res.json({ ok: true, autonomous });
  } catch (err) {
    console.error("v2 agent/toggle error:", err);
    res.status(500).json({ error: "Agent toggle failed" });
  }
});

// ── Activity (tx audit trail) ──────────────────────────────────────────────
function explorerUrl(chain: string, txHash: string): string {
  const base: Record<string, string> = {
    ethereum: "https://etherscan.io/tx/",
    sepolia: "https://sepolia.etherscan.io/tx/",
    polygon: "https://polygonscan.com/tx/",
    solana: "https://solscan.io/tx/",
    ton: "https://tonscan.org/tx/",
    tron: "https://tronscan.org/#/transaction/",
  };
  return (base[chain] ?? base.ethereum) + txHash;
}

v2Router.get("/activity", async (req, res) => {
  try {
    const wallet = (req.query.wallet as string) || (req.query.walletOrSessionId as string) || "default";
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const chainFilter = req.query.chain as string | undefined;
    const items = await getActivity(wallet, limit);
    const out = items.map((it) => ({
      ...it,
      explorerUrl: explorerUrl(it.chain, it.txHash),
    }));
    const filtered = chainFilter ? out.filter((it) => it.chain === chainFilter) : out;
    res.json({ items: filtered });
  } catch (err) {
    console.error("v2 activity error:", err);
    res.status(500).json({ error: "Activity unavailable" });
  }
});

// ── Opportunities (proxy to ai-core /assets/search or return stub) ─────────
v2Router.get("/opportunities", async (req, res) => {
  try {
    const chain = (req.query.chain as string) || "";
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const base = (process.env.AI_CORE_HTTP_URL || "").replace(/\/$/, "");
    if (base) {
      const q = "all";
      const r = await fetch(
        `${base}/assets/search?q=${encodeURIComponent(q)}&type=opportunity&count=${limit}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (r.ok) {
        const data = (await r.json()) as unknown[];
        return res.json({ opportunities: data });
      }
    }
    res.json({ opportunities: [] });
  } catch (err) {
    console.error("v2 opportunities error:", err);
    res.json({ opportunities: [] });
  }
});

// ── Optional: plan by optimizationId (same as /api/execute/plan/:id) ────────
v2Router.get("/plan/:optimizationId", async (req, res) => {
  try {
    const optimizationId = req.params.optimizationId;
    if (!optimizationId) {
      res.status(400).json({ error: "optimizationId required" });
      return;
    }
    const plan = await cacheGet<{ actions: unknown[]; expected_yield_apy?: number; risk_score?: number; explanation?: string }>(
      optimizationPlanCacheKey(optimizationId)
    );
    if (!plan) {
      res.status(404).json({ error: "Plan not found or expired. Run optimization again." });
      return;
    }
    res.json(plan);
  } catch (err) {
    console.error("v2 plan error:", err);
    res.status(500).json({ error: "Failed to get plan" });
  }
});
