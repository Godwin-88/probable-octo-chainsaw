import * as grpc from "@grpc/grpc-js";
import * as path from "path";
import * as protoLoader from "@grpc/proto-loader";

const PROTO_PATH = process.env.PROTO_PATH ?? path.join(process.cwd(), "proto", "optimize.proto");
const AI_CORE_URL = process.env.AI_CORE_GRPC_URL ?? "localhost:50051";

let client: any = null;

function getClient(): any {
  if (client) return client;
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const pkg = grpc.loadPackageDefinition(packageDefinition) as any;
  const yieldagent = pkg?.yieldagent;
  if (!yieldagent?.Optimizer) {
    throw new Error("Proto Optimizer service not found. Ensure proto/optimize.proto is available.");
  }
  client = new yieldagent.Optimizer(AI_CORE_URL, grpc.credentials.createInsecure());
  return client;
}

export type OptimizeProgressCallback = (msg: {
  optimizationId: string;
  status: string;
  progress: number;
  summary?: string;
  error?: string;
  partialPlan?: unknown;
}) => void;

export function streamOptimizeFromAiCore(
  optimizationId: string,
  walletAddress: string,
  constraints: { riskTolerance?: string; targetChains?: string[]; maxGasCostUsd?: number },
  onProgress: OptimizeProgressCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    let c: any;
    try {
      c = getClient();
    } catch (e) {
      reject(e);
      return;
    }
    const request = {
      optimization_id: optimizationId,
      wallet_address: walletAddress,
      constraints: {
        risk_tolerance: constraints.riskTolerance ?? "",
        target_chains: constraints.targetChains ?? [],
        max_gas_cost_usd: constraints.maxGasCostUsd ?? 0,
      },
    };
    let stream: any;
    try {
      stream = c.Optimize(request);
    } catch (err) {
      reject(err);
      return;
    }
    if (!stream || typeof stream.on !== "function") {
      resolve();
      return;
    }
    stream.on("data", (msg: any) => {
      onProgress({
        optimizationId: msg.optimization_id ?? optimizationId,
        status: msg.status ?? "",
        progress: msg.progress ?? 0,
        summary: msg.summary,
        error: msg.error,
        partialPlan: msg.partial_plan
          ? {
              actions: (msg.partial_plan.actions ?? []).map((a: any) => ({
                id: a.id,
                type: a.type,
                chain_id: a.chain_id,
                protocol_id: a.protocol_id,
                asset_id: a.asset_id,
                amount: a.amount,
                amount_usd: a.amount_usd,
                reason: a.reason,
              })),
              expected_yield_apy: msg.partial_plan.expected_yield_apy,
              risk_score: msg.partial_plan.risk_score,
              explanation: msg.partial_plan.explanation,
            }
          : undefined,
      });
    });
    stream.on("end", () => resolve());
    stream.on("error", (e: Error) => reject(e));
  });
}
