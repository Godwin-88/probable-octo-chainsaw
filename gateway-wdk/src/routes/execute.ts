import { Router } from "express";
import { cacheGet, optimizationPlanCacheKey } from "../lib/redis.js";

export const executeRouter = Router();

executeRouter.get("/plan/:optimizationId", async (req, res) => {
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
    console.error(err);
    res.status(500).json({ error: "Failed to get plan" });
  }
});

executeRouter.post("/signed", async (req, res) => {
  try {
    const { chainId, signedTxHex } = req.body as { chainId?: string; signedTxHex?: string };
    if (!signedTxHex) {
      res.status(400).json({ error: "signedTxHex required" });
      return;
    }
    const RPC_URL = process.env.RPC_URL_ETHEREUM ?? process.env.RPC_URL_SEPOLIA ?? "https://eth.llamarpc.com";
    const r = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendRawTransaction",
        params: [signedTxHex],
      }),
    });
    const data = (await r.json()) as { result?: string; error?: { message: string } };
    if (data.error) {
      res.status(400).json({ error: data.error.message ?? "Broadcast failed" });
      return;
    }
    res.json({ txHash: data.result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to broadcast transaction" });
  }
});
