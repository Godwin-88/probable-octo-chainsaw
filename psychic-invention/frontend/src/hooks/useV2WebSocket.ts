/**
 * WebSocket hooks for v2 gateway: positions, opportunities, agent.
 * Connect when useV2Api() is true and backend exposes /v2/ws/*.
 */
import { useEffect, useState, useRef } from 'react';
import { useV2Api } from '@/api/gatewayV2';

const getWsBase = (): string => {
  const base = import.meta.env.VITE_GATEWAY_URL ?? '';
  const url = base ? base.replace(/\/?$/, '') : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:3000`;
  return url.replace(/^http/, 'ws');
};

export function useV2PositionsStream(walletAddress: string | null) {
  const [data, setData] = useState<unknown>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const useV2 = useV2Api();

  useEffect(() => {
    if (!useV2 || !walletAddress) return;
    const ws = new WebSocket(`${getWsBase()}/v2/ws/positions/${encodeURIComponent(walletAddress)}`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        setData(JSON.parse(e.data));
      } catch {
        setData(e.data);
      }
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [useV2, walletAddress]);

  return { data, connected };
}

export function useV2OpportunitiesStream() {
  const [data, setData] = useState<unknown>(null);
  const [connected, setConnected] = useState(false);
  const useV2 = useV2Api();

  useEffect(() => {
    if (!useV2) return;
    const ws = new WebSocket(`${getWsBase()}/v2/ws/opportunities`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        setData(JSON.parse(e.data));
      } catch {
        setData(e.data);
      }
    };
    return () => ws.close();
  }, [useV2]);

  return { data, connected };
}

export function useV2AgentStream(agentId: string | null) {
  const [data, setData] = useState<unknown>(null);
  const [connected, setConnected] = useState(false);
  const useV2 = useV2Api();

  useEffect(() => {
    if (!useV2 || !agentId) return;
    const ws = new WebSocket(`${getWsBase()}/v2/ws/agent/${encodeURIComponent(agentId)}`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        setData(JSON.parse(e.data));
      } catch {
        setData(e.data);
      }
    };
    return () => ws.close();
  }, [useV2, agentId]);

  return { data, connected };
}
