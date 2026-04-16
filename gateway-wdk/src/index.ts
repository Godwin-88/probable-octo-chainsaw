import express from "express";
import cors from "cors";
import { createServer } from "http";
import { registerWebSocketProgress, tryUpgradeProgress } from "./ws/progress.js";
import { optimizeRouter } from "./routes/optimize.js";
import { portfolioRouter } from "./routes/portfolio.js";
import { healthRouter } from "./routes/health.js";
import { executeRouter } from "./routes/execute.js";
import { authRouter } from "./routes/auth.js";
import { agentRouter } from "./routes/agent.js";
import { transactProxyRouter } from "./routes/transactProxy.js";
import { v2Router } from "./routes/v2.js";
import { krakenRouter } from "./routes/kraken.js";
import { getRedis } from "./lib/redis.js";
import { registerV2WebSockets, tryUpgradeV2 } from "./ws/v2.js";

// Fail fast on missing required environment variables
const REQUIRED_ENV = ["TRANSACT_API_URL", "NEO4J_URI", "REDIS_URL"] as const;
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/optimize", optimizeRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/execute", executeRouter);
app.use("/api/auth", authRouter);
app.use("/api/agent", agentRouter);
// Proxy quant/TRANSACT REST to unified Python gateway (ai-core:8000)
app.use("/api/transact", transactProxyRouter);
// Kraken CLI trading integration
app.use("/api/kraken", krakenRouter);
// Web3-native v2 API (positions, oracles, simulate, execute, agent)
app.use("/v2", v2Router);

registerWebSocketProgress(httpServer);
registerV2WebSockets(httpServer);

httpServer.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "", `http://${request.headers.host}`);
  const pathname = url.pathname;
  if (tryUpgradeV2(request, socket, head, pathname)) return;
  if (tryUpgradeProgress(request, socket, head, pathname)) return;
  socket.destroy();
});

const PORT = Number(process.env.PORT) || 3000;
getRedis()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Gateway listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Redis connection failed (set REDIS_URL):", err);
    process.exit(1);
  });
