import { useState, useEffect } from "react";
import { useOptimizationProgress } from "./hooks/useOptimizationProgress";
import { startOptimization } from "./api/optimize";
import { getPortfolio, type PortfolioResponse } from "./api/portfolio";
import { getPlan, type OptimizationPlanResponse } from "./api/execute";

function App() {
  const [wallet, setWallet] = useState("");
  const [optimizationId, setOptimizationId] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [plan, setPlan] = useState<OptimizationPlanResponse | null>(null);
  const progress = useOptimizationProgress(optimizationId);

  useEffect(() => {
    if (!wallet.trim()) {
      setPortfolio(null);
      return;
    }
    getPortfolio(wallet.trim()).then(setPortfolio).catch(() => setPortfolio(null));
  }, [wallet]);

  useEffect(() => {
    if (progress?.status === "DONE" && optimizationId && !plan) {
      getPlan(optimizationId).then(setPlan).catch(() => {});
    }
  }, [progress?.status, optimizationId, plan]);

  const handleOptimize = async () => {
    if (!wallet.trim()) return;
    setPlan(null);
    try {
      const { optimizationId: id } = await startOptimization(wallet.trim(), {});
      setOptimizationId(id);
    } catch (e) {
      console.error(e);
    }
  };

  const canOptimize = wallet.trim() && (progress?.status === "DONE" || progress?.status === "FAILED" || !optimizationId);

  return (
    <div style={{ padding: "2rem", maxWidth: 720 }}>
      <h1>Dynamic Yield Optimization Agent</h1>
      <p>Connect wallet, view portfolio, run optimization. Progress streams via WebSocket.</p>

      <section style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: 4 }}>Wallet address</label>
        <input
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="0x..."
          style={{
            width: "100%",
            padding: 8,
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 4,
            color: "#e2e8f0",
          }}
        />
      </section>

      {portfolio && (
        <section style={{ marginBottom: "1.5rem", padding: 16, background: "#1e293b", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>Portfolio</h2>
          <p>Total (stablecoins USD): ${portfolio.totalUsd.toFixed(2)}</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {portfolio.positions.map((p, i) => (
              <li key={i}>
                {p.assetSymbol}: {p.type === "native" ? p.amount : (Number(p.amount) / 1e6).toFixed(2)}
                {p.amountUsd > 0 && ` ($${p.amountUsd.toFixed(2)})`}
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        onClick={handleOptimize}
        disabled={!canOptimize}
        style={{
          padding: "8px 16px",
          background: "#3b82f6",
          border: "none",
          borderRadius: 4,
          color: "white",
          cursor: "pointer",
        }}
      >
        {optimizationId && progress?.status !== "DONE" && progress?.status !== "FAILED"
          ? "Optimizing…"
          : "Analyze & Optimize"}
      </button>

      {progress && (
        <div style={{ marginTop: "1.5rem", padding: 16, background: "#1e293b", borderRadius: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Status:</strong> {progress.status}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Progress:</strong> {progress.progress}%
          </div>
          {progress.summary && (
            <div style={{ marginBottom: 8 }}>
              <strong>Summary:</strong> {progress.summary}
            </div>
          )}
          {progress.error && (
            <div style={{ color: "#f87171" }}>
              <strong>Error:</strong> {progress.error}
            </div>
          )}
        </div>
      )}

      {plan && (
        <div style={{ marginTop: "1.5rem", padding: 16, background: "#1e293b", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>Recommended plan</h2>
          {plan.explanation && <p>{plan.explanation}</p>}
          {plan.expected_yield_apy != null && (
            <p>Expected yield APY: {plan.expected_yield_apy.toFixed(2)}%</p>
          )}
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {plan.actions.map((a) => (
              <li key={a.id}>
                <strong>{a.type}</strong> – {a.asset_id} on {a.protocol_id}: {a.reason}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 12, color: "#94a3b8" }}>
            Execute via your wallet (sign and broadcast). Use API POST /api/execute/signed with signedTxHex to broadcast.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
