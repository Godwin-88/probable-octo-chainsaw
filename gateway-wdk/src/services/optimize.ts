import { broadcastProgress } from "../ws/progress.js";
import { streamOptimizeFromAiCore } from "../lib/grpcClient.js";

export type OptimizationConstraints = {
  riskTolerance?: "low" | "medium" | "high";
  targetChains?: string[];
  maxGasCostUsd?: number;
};

export type OptimizationInput = {
  walletAddress: string;
  constraints: OptimizationConstraints;
};

export type ProgressStatus =
  | "FETCHING_DATA"
  | "COMPUTING_GRAPH"
  | "GENERATING_PLAN"
  | "WAITING_FOR_SIGNATURE"
  | "BROADCASTING"
  | "DONE"
  | "FAILED";

function toWsMessage(
  optimizationId: string,
  msg: { optimizationId: string; status: string; progress: number; summary?: string; error?: string; partialPlan?: unknown }
) {
  return {
    optimizationId,
    ts: new Date().toISOString(),
    status: msg.status as ProgressStatus,
    progress: msg.progress,
    summary: msg.summary,
    error: msg.error,
    partialPlan: msg.partialPlan,
  };
}

export async function streamOptimization(
  optimizationId: string,
  input: OptimizationInput
): Promise<void> {
  const onProgress = (msg: Parameters<Parameters<typeof streamOptimizeFromAiCore>[3]>[0]) => {
    broadcastProgress(optimizationId, toWsMessage(optimizationId, msg));
  };
  try {
    await streamOptimizeFromAiCore(
      optimizationId,
      input.walletAddress,
      {
        riskTolerance: input.constraints.riskTolerance,
        targetChains: input.constraints.targetChains,
        maxGasCostUsd: input.constraints.maxGasCostUsd,
      },
      onProgress
    );
  } catch (err) {
    console.error("AI Core gRPC failed, using mock stream:", err);
    await mockStreamOptimization(optimizationId);
  }
}

async function mockStreamOptimization(optimizationId: string): Promise<void> {
  const steps: Array<{ status: ProgressStatus; progress: number }> = [
    { status: "FETCHING_DATA", progress: 10 },
    { status: "COMPUTING_GRAPH", progress: 35 },
    { status: "GENERATING_PLAN", progress: 70 },
    { status: "WAITING_FOR_SIGNATURE", progress: 85 },
    { status: "DONE", progress: 100 },
  ];
  for (const step of steps) {
    broadcastProgress(optimizationId, {
      optimizationId,
      ts: new Date().toISOString(),
      status: step.status,
      progress: step.progress,
      summary: `Step: ${step.status}`,
    });
    await sleep(800);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
