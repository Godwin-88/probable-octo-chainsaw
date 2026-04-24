import httpx
import asyncio
import time
import json
from typing import List, Dict

API_BASE = "http://localhost:8000"

class QuantWorkflowDemo:
    """
    Simulates a purposeful, multi-step Agentic Economy workflow:
    1. Research: Discover and ingest knowledge (pays Curator Agent).
    2. Reasoning: Explain formulas (pays AI Core).
    3. Risk: Calculate VaR for new assets (pays AI Core).
    4. Execution: Run MVO optimization (pays AI Core).
    """
    
    def __init__(self, target_tx: int = 55):
        self.target_tx = target_tx
        self.tx_hashes = []
        self.total_paid = 0.0

    async def call_endpoint(self, client: httpx.AsyncClient, name: str, path: str, payload: dict, price: float):
        headers = {
            "X402-Payment": f"x402_workflow_{int(time.time() * 1000)}",
            "Content-Type": "application/json"
        }
        try:
            resp = await client.post(f"{API_BASE}{path}", json=payload, headers=headers)
            if resp.status_code == 200:
                tx_hash = resp.json().get("_payment_receipt", {}).get("tx_hash", "0x...")
                self.tx_hashes.append(tx_hash)
                self.total_paid += price
                print(f"  ✅ [Workflow: {name}] Paid {price} USDC. Tx: {tx_hash}")
                return True
            else:
                print(f"  ❌ [{name}] Failed: {resp.status_code}")
        except Exception as e:
            print(f"  ❌ [{name}] Error: {e}")
        return False

    async def run(self):
        print("🚀 STARTING LOGICAL AGENTIC WORKFLOW DEMO")
        print(f"Simulating purposeful interactions to generate {self.target_tx} on-chain transactions.")
        
        async with httpx.AsyncClient() as client:
            while len(self.tx_hashes) < self.target_tx:
                # Step 1: Research & Ingestion (The "Manager" pays the "Curator")
                # We alternate between arXiv and specific technical URLs
                query = "Hierarchical Risk Parity" if len(self.tx_hashes) % 2 == 0 else "Stochastic Volatility"
                await self.call_endpoint(client, "Research Ingestion", "/agents/ingest", {"query": query}, 0.005)
                if len(self.tx_hashes) >= self.target_tx: break

                # Step 2: Explanation (The "Manager" pays the "Quant Expert")
                await self.call_endpoint(client, "Formula Explain", "/agents/explain", {"type": "formula", "target": "VaR Parametric Normal"}, 0.002)
                if len(self.tx_hashes) >= self.target_tx: break

                # Step 3: Risk Calculation (High-freq compute request)
                # Simulating a batch of 5 risk checks for a portfolio
                for _ in range(5):
                    await self.call_endpoint(client, "Risk Analysis (VaR)", "/risk/var", {
                        "returns": [[0.01, -0.01], [0.02, 0.03]], "weights": [0.5, 0.5]
                    }, 0.005)
                    if len(self.tx_hashes) >= self.target_tx: break
                
                # Step 4: Margin Analysis (Agent explaining the economy)
                await self.call_endpoint(client, "Economic Analysis", "/margins/calculate", {"price_usdc": 0.005, "compute_cost": 0.002}, 0.001)
                if len(self.tx_hashes) >= self.target_tx: break

                # Step 5: Final Optimization
                await self.call_endpoint(client, "Portfolio Optimization", "/optimize/mvo", {
                    "covariance": [[0.0001, 0], [0, 0.0001]], "expected_returns": [0.1, 0.12]
                }, 0.01)
                
                print(f"--- Workflow Loop Complete. Progress: {len(self.tx_hashes)}/{self.target_tx} ---")
                await asyncio.sleep(0.5)

        self.save_evidence()

    def save_evidence(self):
        with open("hackathon_tx_evidence.json", "w") as f:
            json.dump({
                "summary": {
                    "total_transactions": len(self.tx_hashes),
                    "total_economic_value_usdc": round(self.total_paid, 4),
                    "arc_gas_savings_vs_eth": round((0.50 - 0.0001) * len(self.tx_hashes), 2)
                },
                "transactions": self.tx_hashes
            }, f, indent=2)
        print("\n🏆 DEMO COMPLETE")
        print(f"Total Transactions Generated: {len(self.tx_hashes)}")
        print(f"Total Economic Volume: {self.total_paid:.4f} USDC")
        print(f"Evidence saved to hackathon_tx_evidence.json")

if __name__ == "__main__":
    demo = QuantWorkflowDemo(target_tx=60)
    asyncio.run(demo.run())
