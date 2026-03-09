import express from "express";
import cors from "cors";
import { createServer } from "http";
import { registerWebSocketProgress } from "./ws/progress.js";
import { optimizeRouter } from "./routes/optimize.js";
import { portfolioRouter } from "./routes/portfolio.js";
import { healthRouter } from "./routes/health.js";
import { executeRouter } from "./routes/execute.js";
import { authRouter } from "./routes/auth.js";
import { getRedis } from "./lib/redis.js";

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/optimize", optimizeRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/execute", executeRouter);
app.use("/api/auth", authRouter);

registerWebSocketProgress(httpServer);

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
