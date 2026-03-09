/**
 * Chain and protocol registry for multi-chain support.
 * Add entries here to support new chains (EVM, Tron, Solana, TON, Bitcoin, Spark) without changing indexer logic.
 */
export type ChainType = "EVM" | "Bitcoin" | "Tron" | "Solana" | "TON" | "Spark";

export interface ChainConfig {
  id: string;
  name: string;
  type: ChainType;
  chainId?: string;
  rpcUrl?: string;
}

export interface ProtocolConfig {
  id: string;
  name: string;
  chainId: string;
  category: "lending" | "dex" | "liquidStaking" | "bridge" | "other";
  contractAddress?: string;
}

export interface Registry {
  chains: ChainConfig[];
  protocols: ProtocolConfig[];
}

export function getRegistry(): Registry {
  return {
    chains: [
      { id: "ethereum", name: "Ethereum", type: "EVM", chainId: "1", rpcUrl: process.env.RPC_URL_ETHEREUM },
      { id: "sepolia", name: "Sepolia", type: "EVM", chainId: "11155111", rpcUrl: process.env.RPC_URL_SEPOLIA },
      { id: "polygon", name: "Polygon", type: "EVM", chainId: "137", rpcUrl: process.env.RPC_URL_POLYGON },
    ],
    protocols: [
      { id: "aave-v3-ethereum", name: "Aave", chainId: "ethereum", category: "lending", contractAddress: "" },
      { id: "aave-v3-sepolia", name: "Aave", chainId: "sepolia", category: "lending", contractAddress: "" },
    ],
  };
}
