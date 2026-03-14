import { WebSocketServer } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";

export type OptimizationProgressMessage = {
  optimizationId: string;
  ts: string;
  status:
    | "FETCHING_DATA"
    | "COMPUTING_GRAPH"
    | "GENERATING_PLAN"
    | "WAITING_FOR_SIGNATURE"
    | "BROADCASTING"
    | "DONE"
    | "FAILED";
  progress: number;
  summary?: string;
  partialPlan?: unknown;
  error?: string;
};

const subscribers = new Map<string, Set<(msg: OptimizationProgressMessage) => void>>();

const progressWss = new WebSocketServer({ noServer: true });

progressWss.on("connection", (ws: import("ws").WebSocket, _req: IncomingMessage, url: URL) => {
    const optimizationId = url.searchParams.get("optimizationId");
    if (!optimizationId) {
      ws.send(JSON.stringify({ error: "optimizationId query param required" }));
      ws.close();
      return;
    }
    let set = subscribers.get(optimizationId);
    if (!set) {
      set = new Set();
      subscribers.set(optimizationId, set);
    }
    const send = (msg: OptimizationProgressMessage) => {
      try {
        ws.send(JSON.stringify(msg));
      } catch (_) {}
    };
    set.add(send);
    ws.on("close", () => {
      set?.delete(send);
      if (set?.size === 0) subscribers.delete(optimizationId);
    });
  });

export function registerWebSocketProgress(_httpServer: Server): void {
  // Upgrade is handled in index via unified upgrade router (tryUpgradeProgress + tryUpgradeV2).
  // This export kept for API compatibility; progress wss is already created above.
}

export function tryUpgradeProgress(
  request: import("http").IncomingMessage,
  socket: import("stream").Duplex,
  head: Buffer,
  pathname: string
): boolean {
  if (pathname !== "/ws/progress") return false;
  const url = new URL(request.url ?? "", `http://${request.headers.host}`);
  progressWss.handleUpgrade(request, socket, head, (ws) => {
    progressWss.emit("connection", ws, request, url);
  });
  return true;
}

export function broadcastProgress(
  optimizationId: string,
  msg: OptimizationProgressMessage
): void {
  const set = subscribers.get(optimizationId);
  if (!set) return;
  set.forEach((send) => send(msg));
}
