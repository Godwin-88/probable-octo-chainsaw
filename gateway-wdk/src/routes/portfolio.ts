import { Router } from "express";
import { getPortfolio } from "../services/portfolio.js";

export const portfolioRouter = Router();

portfolioRouter.get("/", async (req, res) => {
  try {
    const walletAddress = (req.query.walletAddress as string)?.trim();
    const chainId = (req.query.chainId as string) || "ethereum";
    if (!walletAddress) {
      res.status(400).json({ error: "walletAddress query parameter is required" });
      return;
    }
    const portfolio = await getPortfolio(walletAddress, chainId);
    res.json(portfolio);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});
