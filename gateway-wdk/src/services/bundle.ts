/**
 * EVM bundle submit and simulate (Flashbots relay).
 */
import { getPublicRpcUrl } from "../lib/chains.js";

const FLASHBOTS_RELAY = process.env.FLASHBOTS_RELAY_URL ?? "https://relay.flashbots.net";

function getRpcUrl(chain: string): string {
  return (
    getPublicRpcUrl(chain) ??
    process.env.RPC_URL_ETHEREUM ??
    "https://eth.llamarpc.com"
  );
}

export type BundleSubmitResult = { bundleHash?: string; ok: boolean; error?: string };

export async function submitBundleEvm(
  signedTxs: string[],
  chain: string
): Promise<BundleSubmitResult> {
  if (chain !== "ethereum") {
    return { ok: false, error: "Bundle submit only supported on Ethereum mainnet" };
  }
  if (!signedTxs.length) {
    return { ok: false, error: "signedTxs required" };
  }
  try {
    const rpcUrl = getRpcUrl(chain);
    const blockRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_blockNumber",
        params: [],
      }),
      signal: AbortSignal.timeout(5000),
    });
    const blockData = (await blockRes.json()) as { result?: string };
    const currentBlock = parseInt(blockData.result ?? "0", 16);
    const targetBlock = "0x" + (currentBlock + 1).toString(16);

    const r = await fetch(FLASHBOTS_RELAY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendBundle",
        params: [
          {
            txs: signedTxs,
            blockNumber: targetBlock,
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await r.json()) as { result?: string; error?: { message: string } };
    if (data.error) {
      return { ok: false, error: data.error.message ?? "Bundle rejected" };
    }
    return { ok: true, bundleHash: data.result };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type BundleSimulateResult = { simulatedPnl: number; adversarialOrderings: unknown[] };

export async function simulateBundleEvm(
  signedTxs: string[],
  chain: string
): Promise<BundleSimulateResult> {
  if (!signedTxs.length) {
    return { simulatedPnl: 0, adversarialOrderings: [] };
  }
  const rpcUrl = getRpcUrl(chain);

  try {
    // Get current block number
    const blockRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
      signal: AbortSignal.timeout(5000),
    });
    const blockData = (await blockRes.json()) as { result?: string };
    const currentBlock = parseInt(blockData.result ?? "0", 16);
    const targetBlock = "0x" + (currentBlock + 1).toString(16);

    // Use flashbots_simulate for MEV-aware simulation
    const r = await fetch(FLASHBOTS_RELAY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_callBundle",
        params: [{ txs: signedTxs, blockNumber: targetBlock, stateBlockNumber: "latest" }],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) {
      return { simulatedPnl: 0, adversarialOrderings: [] };
    }

    type FlashbotsSimResult = {
      result?: {
        results?: Array<{ value?: string; error?: string }>;
        coinbaseDiff?: string;
        gasFees?: string;
      };
      error?: { message: string };
    };
    const data = (await r.json()) as FlashbotsSimResult;

    if (data.error || !data.result) {
      return { simulatedPnl: 0, adversarialOrderings: [] };
    }

    // Estimate PnL from coinbaseDiff (miner profit proxy) in ETH
    const coinbaseDiff = data.result.coinbaseDiff;
    const simulatedPnl = coinbaseDiff
      ? parseInt(coinbaseDiff, 16) / 1e18
      : 0;

    // Adversarial orderings: detect tx errors that suggest front-running vulnerability
    const adversarialOrderings: Array<{ index: number; error: string }> = [];
    for (const [i, r] of (data.result.results ?? []).entries()) {
      if (r.error) {
        adversarialOrderings.push({ index: i, error: r.error });
      }
    }

    return { simulatedPnl, adversarialOrderings };
  } catch (_) {
    return { simulatedPnl: 0, adversarialOrderings: [] };
  }
}
