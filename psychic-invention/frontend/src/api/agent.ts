/**
 * Gateway agent API helpers.
 * Uses VITE_GATEWAY_URL (default: http://localhost:3000).
 */
const getBase = (): string => {
  const base = import.meta.env.VITE_GATEWAY_URL ?? '';
  return base ? base.replace(/\/?$/, '') : `${window.location.protocol}//${window.location.hostname}:3000`;
};

export type AgentChatResponse = { reply: string } | { error: string; hint?: string };

export async function sendAgentMessage(message: string, sessionId?: string): Promise<AgentChatResponse> {
  const r = await fetch(`${getBase()}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });
  const data = (await r.json()) as AgentChatResponse & { reply?: string };
  if (!r.ok) return { error: (data as { error?: string }).error ?? 'Request failed', hint: (data as { hint?: string }).hint };
  return { reply: (data as { reply?: string }).reply ?? '' };
}
