/**
 * Proxy /api/transact/* to the unified Python gateway (ai-core HTTP/TRANSACT on port 8000).
 * Single frontend (TRANSACT UI) calls gateway; gateway forwards quant API to ai-core.
 */
import { Router, Request, Response } from "express";

export const transactProxyRouter = Router();

const AI_CORE_HTTP_URL = (process.env.AI_CORE_HTTP_URL || "").replace(/\/$/, "");

function getUpstreamUrl(req: Request): string | null {
  if (!AI_CORE_HTTP_URL) return null;
  // When mounted at /api/transact, req.path is e.g. /portfolio/moments
  const path = req.path || "/";
  const query = req.originalUrl?.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
  return `${AI_CORE_HTTP_URL}${path}${query}`;
}

transactProxyRouter.use(async (req: Request, res: Response) => {
  const url = getUpstreamUrl(req);
  if (!url) {
    res.status(503).json({
      error: "TRANSACT API not configured",
      hint: "Set AI_CORE_HTTP_URL to the unified Python gateway HTTP base (e.g. http://ai-core:8000).",
    });
    return;
  }

  const headers: Record<string, string> = {
    "Content-Type": req.headers["content-type"] || "application/json",
  };
  const forwardHeaders = ["accept", "authorization"];
  for (const h of forwardHeaders) {
    const v = req.headers[h];
    if (typeof v === "string") headers[h] = v;
  }

  try {
    const body = req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined;
    const r = await fetch(url, {
      method: req.method,
      headers,
      body,
    });
    const text = await r.text();
    res.status(r.status);
    const contentType = r.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    res.send(text);
  } catch (err) {
    console.error("Transact proxy error:", err);
    res.status(502).json({
      error: "Bad gateway",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});
