import { WebSocketServer } from "ws";
import type { Server } from "http";

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

export function registerWebSocketProgress(httpServer: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    if (url.pathname !== "/ws/progress") {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, url);
    });
  });

  wss.on("connection", (ws, _req, url) => {
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
}

export function broadcastProgress(
  optimizationId: string,
  msg: OptimizationProgressMessage
): void {
  const set = subscribers.get(optimizationId);
  if (!set) return;
  set.forEach((send) => send(msg));
}
