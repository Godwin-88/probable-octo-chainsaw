/**
 * Swap simulation via eth_call to Uniswap V2 Router getAmountsOut.
 * Returns expectedOut, slippage vs oracle, and a simple MEV risk score.
 */
import { getOraclePrice } from "./oracle.js";
import { getPublicRpcUrl } from "../lib/chains.js";
import { resolveCanonicalAsset } from "./tokenResolver.js";

// getAmountsOut(uint256,address[])
const GET_AMOUNTS_OUT_SELECTOR = "0xd06ca61f";

function getRpcUrl(chain: string): string {
  return (
    getPublicRpcUrl(chain) ??
    process.env.RPC_URL_ETHEREUM ??
    "https://eth.llamarpc.com"
  );
}

async function encodeGetAmountsOut(amountIn: string, path: string[]): Promise<string> {
  const { AbiCoder } = await import("ethers");
  const coder = AbiCoder.defaultAbiCoder();
  const encoded = coder.encode(["uint256", "address[]"], [BigInt(amountIn), path]);
  return GET_AMOUNTS_OUT_SELECTOR + encoded.slice(2);
}

export type SimulateSwapResult = {
  expectedOut: string;
  slippage: number;
  mevRiskScore: number;
};

export async function simulateSwap(
  amountIn: string,
  path: string[],
  chain: string = "ethereum"
): Promise<SimulateSwapResult> {
  const rpcUrl = getRpcUrl(chain);
  const routerEnv = `UNISWAP_V2_ROUTER_${chain.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  const router = (process.env[routerEnv] as string | undefined)?.trim();
  let expectedOut = "0";
  try {
    if (!router) {
      throw new Error(`Missing router address env var: ${routerEnv}`);
    }
    const calldata = await encodeGetAmountsOut(amountIn, path);
    const r = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          { to: router, data: calldata },
          "latest",
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = (await r.json()) as { result?: string };
    if (data.result && data.result !== "0x") {
      const { AbiCoder } = await import("ethers");
      const coder = AbiCoder.defaultAbiCoder();
      const decoded = coder.decode(["uint256[]"], data.result) as unknown as [bigint[]];
      const amounts = decoded[0];
      if (amounts.length > 0) expectedOut = amounts[amounts.length - 1].toString();
    }
  } catch (e) {
    console.warn("Simulate swap eth_call failed:", e);
  }

  let slippage = 0;
  try {
    if (path.length >= 2) {
      const [sell, buy] = await Promise.all([
        resolveCanonicalAsset({ chain, query: path[0] }),
        resolveCanonicalAsset({ chain, query: path[path.length - 1] }),
      ]);
      const oracle = await getOraclePrice(`${sell.symbol}-${buy.symbol}`, chain);
      if (oracle.price > 0 && expectedOut !== "0") {
        const inNum = Number(amountIn) / 10 ** sell.decimals;
        const outNum = Number(expectedOut) / 10 ** buy.decimals;
        const fairOut = inNum * oracle.price;
        if (fairOut > 0) slippage = Math.max(0, 1 - outNum / fairOut);
      }
    }
  } catch (_) {}

  const mevRiskScore = 0.2;
  return { expectedOut, slippage, mevRiskScore };
}
