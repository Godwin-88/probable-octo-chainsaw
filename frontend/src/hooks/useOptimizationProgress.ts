import { useState, useEffect, useRef } from "react";

export type ProgressStatus =
  | "FETCHING_DATA"
  | "COMPUTING_GRAPH"
  | "GENERATING_PLAN"
  | "WAITING_FOR_SIGNATURE"
  | "BROADCASTING"
  | "DONE"
  | "FAILED";

export type OptimizationProgressMessage = {
  optimizationId: string;
  ts: string;
  status: ProgressStatus;
  progress: number;
  summary?: string;
  partialPlan?: unknown;
  error?: string;
};

const getWsUrl = (): string => {
  const base = import.meta.env.VITE_WS_URL ?? "";
  if (base) return base.replace(/^http/, "ws").replace(/\/?$/, "") + "/ws/progress";
  const { protocol, host } = window.location;
  const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${host}/ws/progress`;
};

export function useOptimizationProgress(optimizationId: string | null) {
  const [lastMessage, setLastMessage] = useState<OptimizationProgressMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!optimizationId) {
      setLastMessage(null);
      return;
    }
    const url = `${getWsUrl()}?optimizationId=${encodeURIComponent(optimizationId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as OptimizationProgressMessage;
        setLastMessage(msg);
      } catch (_) {}
    };
    ws.onerror = () => setLastMessage((m) => (m ? { ...m, error: "WebSocket error" } : null));
    ws.onclose = () => {
      wsRef.current = null;
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [optimizationId]);

  return lastMessage;
}
