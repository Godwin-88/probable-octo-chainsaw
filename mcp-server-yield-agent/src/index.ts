/**
 * Yield-Agent MCP Server: exposes gateway-wdk REST API and TRANSACT quant tools for OpenClaw.
 * TRANSACT integration is mandatory for quant-level financial-engineering DeFi yield strategies.
 * Transport: HTTP (JSON-RPC 2.0 over POST). OpenClaw connects via HTTP/SSE or this endpoint.
 */
import express, { Request, Response } from "express";

const GATEWAY_URL = (process.env.GATEWAY_URL || "http://localhost:3000").replace(/\/$/, "");
const TRANSACT_API_URL = (process.env.TRANSACT_API_URL || "").replace(/\/$/, "");
const PORT = Number(process.env.PORT) || 3001;

if (!TRANSACT_API_URL) {
  console.error("ERROR: TRANSACT_API_URL is required for quant-level DeFi yield strategies. Set it to the TRANSACT (psychic-invention) API base URL.");
  process.exit(1);
}

const TOOLS: Array<{
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}> = [
  {
    name: "get_portfolio",
    description: "Get DeFi portfolio (native + ERC-20 balances) for a wallet address. Returns positions and total USD value.",
    inputSchema: {
      type: "object",
      properties: {
        walletAddress: { type: "string", description: "EVM address (0x...)" },
        chainId: { type: "string", description: "Optional: ethereum, sepolia, etc.", default: "ethereum" },
      },
      required: ["walletAddress"],
    },
  },
  {
    name: "run_optimization",
    description: "Start a yield optimization run for a wallet. Returns optimizationId; use get_optimization_plan with that id to fetch the plan (may poll briefly until DONE).",
    inputSchema: {
      type: "object",
      properties: {
        walletAddress: { type: "string", description: "EVM address (0x...)" },
        riskTolerance: { type: "string", enum: ["low", "medium", "high"] },
        targetChains: { type: "array", items: { type: "string" } },
        maxGasCostUsd: { type: "number" },
      },
      required: ["walletAddress"],
    },
  },
  {
    name: "get_optimization_plan",
    description: "Get the cached optimization plan for a given optimizationId (from run_optimization). Returns recommended actions, expected APY, risk score, explanation.",
    inputSchema: {
      type: "object",
      properties: {
        optimizationId: { type: "string", description: "UUID returned by run_optimization" },
      },
      required: ["optimizationId"],
    },
  },
  {
    name: "broadcast_signed_tx",
    description: "Broadcast an already-signed raw transaction hex. Non-custodial: client signs elsewhere; this only submits to the network.",
    inputSchema: {
      type: "object",
      properties: {
        chainId: { type: "string", description: "Optional: ethereum, sepolia", default: "ethereum" },
        signedTxHex: { type: "string", description: "0x-prefixed signed transaction hex" },
      },
      required: ["signedTxHex"],
    },
  },
  {
    name: "quant_var",
    description: "Compute VaR/ES for a returns matrix via TRANSACT. Returns historical/parametric VaR and expected shortfall.",
    inputSchema: {
      type: "object",
      properties: {
        returns: { type: "array", items: { type: "array", items: { type: "number" } }, description: "T x N returns matrix" },
        weights: { type: "array", items: { type: "number" } },
        alpha: { type: "number", default: 0.05 },
        portfolioValue: { type: "number", default: 1 },
      },
      required: ["returns"],
    },
  },
  {
    name: "quant_moments",
    description: "Compute portfolio moments (return, vol, skew, kurtosis) via TRANSACT.",
    inputSchema: {
      type: "object",
      properties: {
        returns: { type: "array", items: { type: "array", items: { type: "number" } } },
        weights: { type: "array", items: { type: "number" } },
      },
      required: ["returns"],
    },
  },
  {
    name: "explain_formula",
    description: "Get explanation of a quant formula (e.g. Sharpe Ratio, Black-Scholes) from TRANSACT knowledge graph.",
    inputSchema: {
      type: "object",
      properties: {
        formulaName: { type: "string", description: "Formula name, e.g. Sharpe Ratio, VaR Historical" },
      },
      required: ["formulaName"],
    },
  },
  {
    name: "explain_concept",
    description: "Explain a financial or DeFi concept from the knowledge graph (e.g. 'Impermanent Loss', 'Value at Risk', 'Kelly Criterion'). Returns definition, domain, and PDF citations.",
    inputSchema: {
      type: "object",
      properties: {
        conceptName: { type: "string", description: "Concept name, e.g. Impermanent Loss, Sharpe Ratio, MEV" },
        menuContext: { type: "string", description: "Optional module context: pricer, portfolio, risk, optimizer, volatility, factor, scenarios, blotter" },
      },
      required: ["conceptName"],
    },
  },
  {
    name: "explain_strategy",
    description: "Get a DeFi or algorithmic trading strategy from the knowledge graph with entry/exit signals, risk management rules, and book citations.",
    inputSchema: {
      type: "object",
      properties: {
        strategyName: { type: "string", description: "Strategy name or keyword, e.g. 'Cross-DEX Arbitrage', 'Momentum', 'Delta Neutral'" },
        menuContext: { type: "string", description: "Optional module context for filtering" },
      },
      required: ["strategyName"],
    },
  },
];

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
};

function jsonRpcSuccess(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}
function jsonRpcError(id: string | number | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function callGateway(path: string, options: RequestInit = {}): Promise<{ status: number; body: string }> {
  const url = `${GATEWAY_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers as Record<string, string>) },
  });
  const body = await res.text();
  return { status: res.status, body };
}

async function callTransact(path: string, options: RequestInit = {}): Promise<{ status: number; body: string }> {
  if (!TRANSACT_API_URL) throw new Error("TRANSACT_API_URL not configured");
  const url = `${TRANSACT_API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers as Record<string, string>) },
  });
  const body = await res.text();
  return { status: res.status, body };
}

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "get_portfolio": {
      const walletAddress = args.walletAddress as string;
      const chainId = (args.chainId as string) || "ethereum";
      if (!walletAddress) throw new Error("walletAddress is required");
      const { status, body } = await callGateway(`/api/portfolio?walletAddress=${encodeURIComponent(walletAddress)}&chainId=${encodeURIComponent(chainId)}`);
      if (status !== 200) throw new Error(`Gateway returned ${status}: ${body}`);
      return body;
    }
    case "run_optimization": {
      const walletAddress = args.walletAddress as string;
      if (!walletAddress) throw new Error("walletAddress is required");
      const constraints: Record<string, unknown> = {};
      if (args.riskTolerance) constraints.riskTolerance = args.riskTolerance;
      if (args.targetChains) constraints.targetChains = args.targetChains;
      if (args.maxGasCostUsd != null) constraints.maxGasCostUsd = args.maxGasCostUsd;
      const { status, body } = await callGateway("/api/optimize", {
        method: "POST",
        body: JSON.stringify({ walletAddress, constraints }),
      });
      if (status !== 202) throw new Error(`Gateway returned ${status}: ${body}`);
      const data = JSON.parse(body) as { optimizationId?: string };
      return JSON.stringify({
        optimizationId: data.optimizationId,
        message: "Optimization started. Use get_optimization_plan with this optimizationId to fetch the plan (wait a few seconds if needed).",
      });
    }
    case "get_optimization_plan": {
      const optimizationId = args.optimizationId as string;
      if (!optimizationId) throw new Error("optimizationId is required");
      const { status, body } = await callGateway(`/api/execute/plan/${encodeURIComponent(optimizationId)}`);
      if (status === 404) return JSON.stringify({ error: "Plan not found or expired. Run optimization again." });
      if (status !== 200) throw new Error(`Gateway returned ${status}: ${body}`);
      return body;
    }
    case "broadcast_signed_tx": {
      const signedTxHex = args.signedTxHex as string;
      const chainId = (args.chainId as string) || "ethereum";
      if (!signedTxHex) throw new Error("signedTxHex is required");
      const { status, body } = await callGateway("/api/execute/signed", {
        method: "POST",
        body: JSON.stringify({ chainId, signedTxHex }),
      });
      if (status !== 200) throw new Error(`Gateway returned ${status}: ${body}`);
      return body;
    }
    case "quant_var": {
      const returns = args.returns as number[][];
      const weights = args.weights as number[] | undefined;
      const alpha = (args.alpha as number) ?? 0.05;
      const portfolioValue = (args.portfolioValue as number) ?? 1;
      if (!returns?.length) throw new Error("returns (T x N matrix) is required");
      const { status, body } = await callTransact("/risk/var", {
        method: "POST",
        body: JSON.stringify({
          returns,
          weights: weights ?? returns[0]?.map(() => 1 / (returns[0]?.length || 1)),
          alpha,
          portfolio_value: portfolioValue,
          horizon_days: 1,
          include_monte_carlo: false,
          mc_simulations: 1000,
        }),
      });
      if (status !== 200) throw new Error(`TRANSACT returned ${status}: ${body}`);
      return body;
    }
    case "quant_moments": {
      const returns = args.returns as number[][];
      const weights = args.weights as number[] | undefined;
      if (!returns?.length) throw new Error("returns is required");
      const n = returns[0]?.length ?? 0;
      const w = weights ?? (n ? Array.from({ length: n }, () => 1 / n) : [1]);
      const { status, body } = await callTransact("/portfolio/moments", {
        method: "POST",
        body: JSON.stringify({ returns, weights: w, market_returns: null }),
      });
      if (status !== 200) throw new Error(`TRANSACT returned ${status}: ${body}`);
      return body;
    }
    case "explain_formula": {
      const formulaName = args.formulaName as string;
      if (!formulaName) throw new Error("formulaName is required");
      const { status, body } = await callTransact("/agents/explain", {
        method: "POST",
        body: JSON.stringify({ type: "formula", target: formulaName }),
      });
      if (status !== 200) throw new Error(`TRANSACT returned ${status}: ${body}`);
      const data = JSON.parse(body) as { explanation?: string; reply?: string };
      return JSON.stringify({ explanation: data.explanation ?? data.reply ?? body });
    }
    case "explain_concept": {
      const conceptName = args.conceptName as string;
      const menuContext = (args.menuContext as string) || undefined;
      if (!conceptName) throw new Error("conceptName is required");
      const { status, body } = await callTransact("/agents/explain", {
        method: "POST",
        body: JSON.stringify({ type: "concept", target: conceptName, menu_context: menuContext }),
      });
      if (status !== 200) throw new Error(`TRANSACT returned ${status}: ${body}`);
      const data = JSON.parse(body) as { explanation?: string; reply?: string; sources?: unknown[] };
      return JSON.stringify({
        concept: conceptName,
        explanation: data.explanation ?? data.reply ?? body,
        sources: data.sources ?? [],
      });
    }
    case "explain_strategy": {
      const strategyName = args.strategyName as string;
      const menuContext = (args.menuContext as string) || undefined;
      if (!strategyName) throw new Error("strategyName is required");
      const { status, body } = await callTransact("/agents/chat", {
        method: "POST",
        body: JSON.stringify({
          message: `Explain the trading strategy: ${strategyName}`,
          menu_id: menuContext || "overview",
          context: {},
        }),
      });
      if (status !== 200) throw new Error(`TRANSACT returned ${status}: ${body}`);
      const data = JSON.parse(body) as { reply?: string; sources?: unknown[] };
      return JSON.stringify({
        strategy: strategyName,
        explanation: data.reply ?? body,
        sources: data.sources ?? [],
      });
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleMcpRequest(req: JsonRpcRequest): Promise<JsonRpcResponse> {
  const id = req.id ?? null;
  try {
    if (req.method === "initialize") {
      return jsonRpcSuccess(id, {
        protocolVersion: "2024-11-05",
        serverInfo: { name: "yield-agent-mcp", version: "1.0.0" },
        capabilities: { tools: {} },
      });
    }
    if (req.method === "tools/list") {
      return jsonRpcSuccess(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });
    }
    if (req.method === "tools/call") {
      const params = (req.params as { name?: string; arguments?: Record<string, unknown> }) || {};
      const toolName = params.name;
      const toolArgs = params.arguments || {};
      if (!toolName) return jsonRpcError(id, -32602, "Missing tool name");
      const text = await handleToolCall(toolName, toolArgs);
      return jsonRpcSuccess(id, {
        content: [{ type: "text", text }],
        isError: false,
      });
    }
    return jsonRpcError(id, -32601, `Method not found: ${req.method}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonRpcSuccess(id, {
      content: [{ type: "text", text: JSON.stringify({ error: message }) }],
      isError: true,
    });
  }
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "yield-agent-mcp" });
});

const mcpHandler = async (req: Request, res: Response) => {
  const body = req.body as JsonRpcRequest | JsonRpcRequest[];
  try {
    if (Array.isArray(body)) {
      const results = await Promise.all(body.map((r) => handleMcpRequest(r)));
      res.json(results);
    } else {
      const result = await handleMcpRequest(body);
      res.json(result);
    }
  } catch (err) {
    console.error("MCP request error:", err);
    res.status(500).json(jsonRpcError(null, -32603, "Internal error"));
  }
};

app.post("/mcp", mcpHandler);
app.post("/", mcpHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Yield-Agent MCP server listening on http://0.0.0.0:${PORT} (GATEWAY_URL=${GATEWAY_URL})`);
});
