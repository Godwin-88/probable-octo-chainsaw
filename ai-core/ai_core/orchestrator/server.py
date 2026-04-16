"""
LangGraph Orchestrator HTTP Server.

Exposes the trading orchestrator as a REST API on port 8001.

Endpoints:
  POST /api/trade/execute  — Run full trading pipeline
  POST /api/trade/signal   — Generate signal without execution
  GET  /api/trade/health   — Health check
  POST /api/rl/train       — Train RL agent
  GET  /api/rl/status      — RL agent status
"""

import os
import sys
import json
from typing import Optional

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

from ai_core.orchestrator.neo4j_driver import Neo4jDriver
from ai_core.orchestrator.graph import TradingOrchestrator
from ai_core.rl.agent import PPOAgent


app = FastAPI(title="LangGraph Trading Orchestrator")

# Global instances
neo4j: Optional[Neo4jDriver] = None
orchestrator: Optional[TradingOrchestrator] = None
rl_agent: Optional[PPOAgent] = None


class TradeRequest(BaseModel):
    market: str = "XBT/USD"
    strategy_name: str = "KrakenMomentum"
    execute: bool = False


class TrainRequest(BaseModel):
    market: str = "XBT/USD"
    epochs: int = 100
    learning_rate: float = 3e-4


@app.on_event("startup")
async def startup():
    global neo4j, orchestrator, rl_agent
    
    # Initialize Neo4j driver
    neo4j = Neo4jDriver(
        uri=os.getenv("NEO4J_URI", "bolt://neo4j:7687"),
        user=os.getenv("NEO4J_USER", "neo4j"),
        password=os.getenv("NEO4J_PASSWORD", "yield-agent-dev"),
    )
    
    # Initialize RL agent
    rl_agent = PPOAgent(obs_dim=10, action_dim=1)
    
    # Initialize orchestrator (with mock Kraken service for now)
    # TODO: integrate with actual Kraken service from gateway
    class MockKrakenService:
        def get_ohlcv(self, market, interval=60, limit=252):
            import numpy as np
            np.random.seed(42)
            price = 50000.0
            data = []
            for i in range(limit):
                change = np.random.normal(0, 0.002)
                price *= (1 + change)
                data.append({
                    "time": i, "open": price, "high": price * 1.001,
                    "low": price * 0.999, "close": price, "volume": 500,
                })
            return data
        
        def place_order(self, market, order_type, volume):
            return {"status": "simulated", "market": market, "type": order_type, "volume": volume}
    
    orchestrator = TradingOrchestrator(
        neo4j_driver=neo4j,
        kraken_service=MockKrakenService(),
        rl_agent=rl_agent,
        risk_validator=None,  # TODO: implement
    )
    
    print("[Orchestrator] Started with LangGraph + GraphRAG + Deep RL")


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "components": {
            "neo4j": "connected" if neo4j else "disconnected",
            "rl_agent": "initialized" if rl_agent else "uninitialized",
            "orchestrator": "ready" if orchestrator else "uninitialized",
        },
        "architecture": "LangGraph + GraphRAG + Deep RL (PPO)",
    }


@app.post("/api/trade/execute")
async def execute_trade(req: TradeRequest):
    """Run the full trading pipeline: fetch → analyze → GraphRAG → RL → risk → execute."""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
    
    try:
        result = orchestrator.run(
            market=req.market,
            strategy_name=req.strategy_name,
        )
        
        return {
            "success": True,
            "market": req.market,
            "strategy": req.strategy_name,
            "action": result.get("rl_action"),
            "confidence": result.get("rl_confidence"),
            "risk_passed": result.get("risk_check_passed"),
            "order": result.get("order_result"),
            "reward": result.get("reward"),
            "rationale": result.get("rl_rationale"),
            "knowledge": result.get("knowledge_rationale"),
            "messages": result.get("messages", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/trade/signal")
async def generate_signal(req: TradeRequest):
    """Generate trading signal without execution (up to RL decision)."""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
    
    try:
        result = orchestrator.run(
            market=req.market,
            strategy_name=req.strategy_name,
        )
        
        return {
            "success": True,
            "market": req.market,
            "strategy": req.strategy_name,
            "direction": "LONG" if result.get("rl_action", 0) > 0.1 else "SHORT" if result.get("rl_action", 0) < -0.1 else "FLAT",
            "strength": abs(result.get("rl_action", 0)),
            "confidence": result.get("rl_confidence"),
            "rationale": result.get("rl_rationale"),
            "knowledge_graph": {
                "concepts": result.get("relevant_concepts", []),
                "formulas": result.get("relevant_formulas", []),
                "similar_strategies": result.get("relevant_strategies", []),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rl/train")
async def train_rl(req: TrainRequest):
    """Train the RL agent on historical data."""
    if not rl_agent:
        raise HTTPException(status_code=503, detail="RL agent not initialized")
    
    try:
        from ai_core.rl.train import train
        agent = train(
            market=req.market,
            epochs=req.epochs,
            learning_rate=req.learning_rate,
        )
        
        return {
            "success": True,
            "market": req.market,
            "epochs": req.epochs,
            "model": "PPO",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/rl/status")
async def rl_status():
    """Get RL agent status."""
    return {
        "model": "PPO" if rl_agent and rl_agent.use_sb3 else "Rule-based fallback",
        "obs_dim": 10,
        "action_dim": 1,
        "buffer_size": len(rl_agent.replay_buffer) if rl_agent else 0,
        "use_sb3": rl_agent.use_sb3 if rl_agent else False,
    }


if __name__ == "__main__":
    port = int(os.getenv("ORCHESTRATOR_PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
