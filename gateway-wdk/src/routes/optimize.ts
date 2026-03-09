import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { streamOptimization } from "../services/optimize.js";

export const optimizeRouter = Router();

export type StartOptimizationRequest = {
  walletAddress: string;
  constraints?: {
    riskTolerance?: "low" | "medium" | "high";
    targetChains?: string[];
    maxGasCostUsd?: number;
  };
};

optimizeRouter.post("/", async (req, res) => {
  try {
    const body = req.body as StartOptimizationRequest;
    const walletAddress = body?.walletAddress;
    if (!walletAddress || typeof walletAddress !== "string") {
      res.status(400).json({ error: "walletAddress is required" });
      return;
    }
    const optimizationId = uuidv4();
    res.status(202).json({ optimizationId });

    streamOptimization(optimizationId, {
      walletAddress,
      constraints: body.constraints ?? {},
    }).catch((err) => {
      console.error("Optimization stream error:", err);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start optimization" });
  }
});
