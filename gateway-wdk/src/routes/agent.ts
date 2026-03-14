/**
 * Agent chat proxy: forwards to OpenClaw gateway OpenAI-compat /v1/chat/completions when configured.
 */
import { Router, Request, Response } from "express";

export const agentRouter = Router();

const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "";
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || "";

// ── In-process rate limiter ──────────────────────────────────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = parseInt(process.env.AGENT_RATE_LIMIT_PER_MIN ?? "30", 10);
const _rateMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(req: Request, res: Response): boolean {
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim()
    ?? req.socket?.remoteAddress
    ?? "unknown";
  const now = Date.now();
  const entry = _rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    _rateMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_MAX) {
    res.status(429).json({ error: "Too many agent requests; try again in a minute." });
    return false;
  }
  entry.count += 1;
  return true;
}

agentRouter.post("/chat", async (req: Request, res: Response) => {
  if (!checkRateLimit(req, res)) return;
  if (!OPENCLAW_GATEWAY_URL) {
    res.status(503).json({
      error: "Agent chat not configured",
      hint: "Set OPENCLAW_GATEWAY_URL (e.g. http://openclaw:18789) and enable chat completions in OpenClaw. Use OpenClaw Control UI at http://localhost:18789 for full agent UI.",
    });
    return;
  }

  const { message, sessionId } = req.body as { message?: string; sessionId?: string };
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message (string) is required" });
    return;
  }

  const url = `${OPENCLAW_GATEWAY_URL.replace(/\/$/, "")}/v1/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (OPENCLAW_TOKEN) headers["Authorization"] = `Bearer ${OPENCLAW_TOKEN}`;

  const body = {
    model: "openclaw:main",
    messages: [{ role: "user" as const, content: message }],
    stream: false,
    ...(sessionId && { user: sessionId }),
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = (await r.json()) as { choices?: Array<{ message?: { content?: string } }>; error?: { message: string } };
    if (!r.ok) {
      res.status(r.status).json({
        error: data?.error?.message || `OpenClaw returned ${r.status}`,
      });
      return;
    }
    const content = data.choices?.[0]?.message?.content ?? "";
    res.json({ reply: content });
  } catch (err) {
    console.error("OpenClaw proxy error:", err);
    res.status(502).json({
      error: "Failed to reach OpenClaw",
      hint: "Ensure OpenClaw is running and chat completions are enabled. Use Control UI at http://localhost:18789.",
    });
  }
});
