import { Router } from "express";
import { randomBytes } from "crypto";
import { cacheSet, cacheGet } from "../lib/redis.js";

export const authRouter = Router();

const NONCE_PREFIX = "auth_nonce:";
const NONCE_TTL = 300;

authRouter.get("/nonce", async (req, res) => {
  try {
    const walletAddress = (req.query.walletAddress as string)?.trim();
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      res.status(400).json({ error: "Valid walletAddress (0x...) required" });
      return;
    }
    const nonce = randomBytes(16).toString("hex");
    await cacheSet(`${NONCE_PREFIX}${walletAddress.toLowerCase()}`, { nonce, walletAddress }, NONCE_TTL);
    res.json({ nonce, message: `Sign this message to authenticate: ${nonce}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate nonce" });
  }
});

authRouter.post("/verify", async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body as {
      walletAddress?: string;
      signature?: string;
      message?: string;
    };
    if (!walletAddress || !signature) {
      res.status(400).json({ error: "walletAddress and signature required" });
      return;
    }
    const stored = await cacheGet<{ nonce: string }>(`${NONCE_PREFIX}${walletAddress.toLowerCase()}`);
    if (!stored?.nonce) {
      res.status(401).json({ error: "Nonce expired or invalid" });
      return;
    }
    const expectedMessage = message ?? `Sign this message to authenticate: ${stored.nonce}`;
    if (!expectedMessage.includes(stored.nonce)) {
      res.status(401).json({ error: "Message does not match nonce" });
      return;
    }
    const recovered = await recoverAddress(expectedMessage, signature);
    if (recovered?.toLowerCase() !== walletAddress.toLowerCase()) {
      res.status(401).json({ error: "Signature verification failed" });
      return;
    }
    const token = randomBytes(24).toString("hex");
    await cacheSet(`auth_session:${token}`, { walletAddress: walletAddress.toLowerCase() }, 3600);
    res.json({ token, walletAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});

async function recoverAddress(message: string, signature: string): Promise<string | null> {
  try {
    const { ethers } = await import("ethers");
    const digest = ethers.hashMessage(message);
    return ethers.recoverAddress(digest, signature);
  } catch {
    return null;
  }
}
