/**
 * MEV relay RPC selection — Flashbots Protect, MEV Blocker, or public RPC.
 */
import { getPublicRpcUrl } from "./chains.js";

const FLASHBOTS_PROTECT_RPC = process.env.FLASHBOTS_RPC_URL ?? "https://rpc.flashbots.net";
const MEV_BLOCKER_RPC = process.env.MEV_BLOCKER_RPC_URL ?? "https://rpc.mevblocker.io";

export function getRelayRpcUrl(chain: string, protection?: string): string {
  if (!protection || protection === "none") {
    return (
      getPublicRpcUrl(chain) ??
      process.env.RPC_URL_ETHEREUM ??
      process.env.RPC_URL_SEPOLIA ??
      "https://eth.llamarpc.com"
    );
  }
  const p = protection.toLowerCase();
  if (p === "flashbots-protect" || p === "flashbots") return FLASHBOTS_PROTECT_RPC;
  if (p === "mev-blocker") return MEV_BLOCKER_RPC;
  return (
    getPublicRpcUrl(chain) ??
    process.env.RPC_URL_ETHEREUM ??
    "https://eth.llamarpc.com"
  );
}
