"""
LangGraph Orchestrator — replaces OpenClaw for agentic trading.

Architecture:
  StateGraph with nodes:
    fetch_portfolio → analyze_market → graphrag_retrieve → rl_decide → validate_risk → execute_trade → record_outcome

GraphRAG integration:
  - Retrieves relevant quant concepts, formulas, strategies from Neo4j
  - Combines with live market data for informed decisions
  - Cites PDF sources in decision rationale

Deep RL integration:
  - PPO agent trained on OHLCV data
  - Action space: continuous position sizing [-1, 1] (short to long)
  - Reward: risk-adjusted return (Sharpe-like)
"""

from typing import TypedDict, Optional, Annotated, Sequence
from langgraph.graph import StateGraph, END
import operator


# ── Agent State ──────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    """State passed between LangGraph nodes."""
    # Input
    market: str                          # Trading pair (e.g., "XBT/USD")
    strategy_name: str                   # Strategy to use (e.g., "KrakenMomentum")
    
    # Portfolio
    portfolio: Optional[dict]            # Current holdings, cash, PnL
    
    # Market Data
    ohlcv: Optional[list[dict]]          # OHLCV candles from Kraken
    market_features: Optional[dict]      # Engineered features
    
    # GraphRAG
    relevant_concepts: list[dict]        # TransactConcept nodes from Neo4j
    relevant_formulas: list[dict]        # TransactFormula nodes
    relevant_strategies: list[dict]      # TradingStrategy nodes with citations
    knowledge_rationale: str             # Synthesized reasoning from KG
    
    # RL Decision
    rl_action: Optional[float]           # Continuous action [-1, 1]
    rl_confidence: Optional[float]       # Agent confidence [0, 1]
    rl_rationale: Optional[str]          # Why the RL agent chose this action
    
    # Risk Validation
    risk_check_passed: Optional[bool]
    risk_violations: list[str]
    max_position_allowed: Optional[float]
    
    # Execution
    order_result: Optional[dict]
    signal_recorded: Optional[bool]
    
    # Outcome tracking (for RL replay buffer)
    reward: Optional[float]
    done: bool
    
    # Conversation / audit
    messages: Annotated[list[str], operator.add]


# ── Node Implementations ─────────────────────────────────────────────────────

class TradingOrchestrator:
    """LangGraph-based trading orchestrator with GraphRAG + Deep RL."""
    
    def __init__(self, neo4j_driver, kraken_service, rl_agent, risk_validator):
        self.neo4j = neo4j_driver
        self.kraken = kraken_service
        self.rl_agent = rl_agent
        self.risk = risk_validator
        self.graph = self._build_graph()
    
    # ── Graph Nodes ──────────────────────────────────────────────────────────
    
    def fetch_portfolio(self, state: AgentState) -> dict:
        """Get current portfolio state."""
        # TODO: integrate with WDK portfolio API
        portfolio = {"cash": 10000, "positions": {}, "total_value": 10000}
        return {"portfolio": portfolio, "messages": ["Fetched portfolio"]}
    
    def analyze_market(self, state: AgentState) -> dict:
        """Fetch OHLCV data and engineer features from Kraken."""
        ohlcv = self.kraken.get_ohlcv(state["market"], interval=60, limit=252)
        
        # Feature engineering
        closes = [c["close"] for c in ohlcv]
        features = {
            "returns": [(closes[i] - closes[i-1]) / closes[i-1] for i in range(1, len(closes))],
            "volatility": self._rolling_std(closes, 20),
            "momentum": self._momentum(closes, 252),
            "zscore": self._zscore(closes, 63),
            "rsi": self._rsi(closes, 14),
        }
        
        return {
            "ohlcv": ohlcv,
            "market_features": features,
            "messages": [f"Analyzed {state['market']}: {len(ohlcv)} candles"]
        }
    
    def graphrag_retrieve(self, state: AgentState) -> dict:
        """Retrieve relevant knowledge from Neo4j knowledge graph."""
        market = state["market"]
        strategy = state["strategy_name"]
        
        # 1. Get strategy definition with quant citations
        strategy_query = """
        MATCH (s:TradingStrategy {name: $strategy})
        OPTIONAL MATCH (s)-[:BASED_ON]->(c:TransactConcept)
        OPTIONAL MATCH (s)-[:SOURCED_FROM]->(ks:KnowledgeSource)
        OPTIONAL MATCH (s)-[:GOVERNED_BY]->(r:RiskParameters)
        RETURN s, collect(DISTINCT c) AS concepts, collect(DISTINCT ks) AS sources, r
        """
        strategy_result = self.neo4j.query(strategy_query, {"strategy": strategy})
        
        # 2. Get relevant formulas for the strategy type
        formula_query = """
        MATCH (s:TradingStrategy {name: $strategy})
        OPTIONAL MATCH (f:TransactFormula)
        WHERE f.category = s.category OR f.related_to IN s.keywords
        RETURN f LIMIT 5
        """
        formulas = self.neo4j.query(formula_query, {"strategy": strategy})
        
        # 3. Get similar strategies (for ensemble reasoning)
        similar_query = """
        MATCH (s:TradingStrategy {name: $strategy})
        MATCH (other:TradingStrategy)
        WHERE other <> s AND other.category = s.category
        OPTIONAL MATCH (other)-[:SOURCED_FROM]->(ks:KnowledgeSource)
        RETURN other, collect(ks) AS sources LIMIT 3
        """
        similar = self.neo4j.query(similar_query, {"strategy": strategy})
        
        # 4. Synthesize rationale from knowledge graph
        rationale = self._synthesize_rationale(strategy_result, formulas, similar, market)
        
        concepts = strategy_result[0]["concepts"] if strategy_result else []
        sources = strategy_result[0]["sources"] if strategy_result else []
        
        return {
            "relevant_concepts": [c for c in concepts if c],
            "relevant_formulas": [f["f"] for f in formulas] if formulas else [],
            "relevant_strategies": [
                {
                    "name": s["other"]["name"],
                    "sources": [ks["title"] for ks in s["sources"] if ks]
                }
                for s in similar
            ] if similar else [],
            "knowledge_rationale": rationale,
            "messages": [f"Retrieved {len(concepts)} concepts, {len(formulas)} formulas from KG"]
        }
    
    def rl_decide(self, state: AgentState) -> dict:
        """Use Deep RL agent to make trading decision."""
        features = state["market_features"]
        if not features:
            return {"rl_action": 0.0, "rl_confidence": 0.0, "rl_rationale": "No features available"}
        
        # Build observation vector for RL agent
        observation = self._build_observation(features, state["portfolio"])
        
        # Get action from PPO agent
        action, log_prob, value = self.rl_agent.predict(observation, deterministic=True)
        
        # Map action [-1, 1] to trading signal
        # -1 = full short, 0 = flat, 1 = full long
        action_float = float(action[0]) if hasattr(action, '__iter__') else float(action)
        
        # Confidence from value function
        confidence = min(abs(action_float), 1.0)
        
        rationale = self._explain_rl_action(action_float, confidence, state["knowledge_rationale"])
        
        return {
            "rl_action": action_float,
            "rl_confidence": confidence,
            "rl_rationale": rationale,
            "messages": [f"RL action: {action_float:.3f}, confidence: {confidence:.3f}"]
        }
    
    def validate_risk(self, state: AgentState) -> dict:
        """Validate trade against risk parameters from Neo4j."""
        action = state["rl_action"]
        portfolio = state["portfolio"]
        market = state["market"]
        
        violations = []
        
        # Get risk params from Neo4j
        risk_query = """
        MATCH (r:RiskParameters {exchange: 'Kraken'})
        RETURN r
        """
        risk_result = self.neo4j.query(risk_query)
        risk = risk_result[0]["r"] if risk_result else {}
        
        # Check position size
        position_value = abs(action) * portfolio.get("total_value", 0)
        max_position = risk.get("max_position_size", 0.1) * portfolio.get("total_value", 0)
        
        if position_value > max_position:
            violations.append(f"Position ${position_value:.0f} exceeds max ${max_position:.0f}")
        
        # Check drawdown
        # TODO: implement drawdown check
        
        # Check daily loss limit
        # TODO: implement daily loss check
        
        passed = len(violations) == 0
        
        return {
            "risk_check_passed": passed,
            "risk_violations": violations,
            "max_position_allowed": max_position,
            "messages": [f"Risk check: {'PASS' if passed else 'FAIL'} - {violations}"]
        }
    
    def execute_trade(self, state: AgentState) -> dict:
        """Execute trade via Kraken if risk check passes."""
        if not state["risk_check_passed"]:
            return {
                "order_result": {"status": "rejected", "reason": state["risk_violations"]},
                "messages": ["Trade rejected by risk validator"]
            }
        
        action = state["rl_action"]
        market = state["market"]
        portfolio = state["portfolio"]
        
        # Determine order type
        if abs(action) < 0.1:
            return {
                "order_result": {"status": "flat", "action": action},
                "messages": ["Action too small, staying flat"]
            }
        
        order_type = "buy" if action > 0 else "sell"
        volume = abs(action) * portfolio.get("total_value", 0) * 0.01  # Scale to volume
        
        # Execute via Kraken
        try:
            order = self.kraken.place_order(market, order_type, volume)
            return {
                "order_result": order,
                "messages": [f"Executed {order_type} {volume} {market}"]
            }
        except Exception as e:
            return {
                "order_result": {"status": "error", "error": str(e)},
                "messages": [f"Execution error: {e}"]
            }
    
    def record_outcome(self, state: AgentState) -> dict:
        """Record signal and outcome to Neo4j for RL training."""
        market = state["market"]
        action = state["rl_action"]
        order = state.get("order_result", {})
        
        # Record signal node
        signal_query = """
        CREATE (s:Signal {
            market: $market,
            direction: CASE WHEN $action > 0.1 THEN 1 WHEN $action < -0.1 THEN -1 ELSE 0 END,
            strength: abs($action),
            confidence: $confidence,
            timestamp: datetime().epochMillis,
            strategy: $strategy,
            orderStatus: $order_status,
            rationale: $rationale
        })
        WITH s
        MERGE (m:Market {symbol: $market, exchange: 'Kraken'})
        ON CREATE SET m.base = split($market, '/')[0], m.quote = split($market, '/')[1], m.active = true
        MERGE (st:TradingStrategy {name: $strategy})
        MERGE (s)-[:FOR_MARKET]->(m)
        MERGE (s)-[:GENERATED_BY]->(st)
        RETURN s
        """
        
        self.neo4j.query(signal_query, {
            "market": market,
            "action": action,
            "confidence": state.get("rl_confidence", 0),
            "strategy": state["strategy_name"],
            "order_status": order.get("status", "unknown"),
            "rationale": state.get("rl_rationale", "")
        })
        
        # Compute reward for RL training
        reward = self._compute_reward(state)
        
        # Add to RL replay buffer
        self.rl_agent.add_to_buffer(
            observation=self._build_observation(state["market_features"], state["portfolio"]),
            action=action,
            reward=reward,
            done=True
        )
        
        return {
            "signal_recorded": True,
            "reward": reward,
            "done": True,
            "messages": [f"Signal recorded, reward: {reward:.4f}"]
        }
    
    # ── Graph Construction ───────────────────────────────────────────────────
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph state machine."""
        graph = StateGraph(AgentState)
        
        # Add nodes
        graph.add_node("fetch_portfolio", self.fetch_portfolio)
        graph.add_node("analyze_market", self.analyze_market)
        graph.add_node("graphrag_retrieve", self.graphrag_retrieve)
        graph.add_node("rl_decide", self.rl_decide)
        graph.add_node("validate_risk", self.validate_risk)
        graph.add_node("execute_trade", self.execute_trade)
        graph.add_node("record_outcome", self.record_outcome)
        
        # Define edges (sequential flow with conditional branching)
        graph.set_entry_point("fetch_portfolio")
        graph.add_edge("fetch_portfolio", "analyze_market")
        graph.add_edge("analyze_market", "graphrag_retrieve")
        graph.add_edge("graphrag_retrieve", "rl_decide")
        graph.add_edge("rl_decide", "validate_risk")
        graph.add_edge("validate_risk", "execute_trade")
        graph.add_edge("execute_trade", "record_outcome")
        graph.add_edge("record_outcome", END)
        
        return graph.compile()
    
    def run(self, market: str, strategy_name: str) -> dict:
        """Execute the full trading pipeline."""
        initial_state = AgentState(
            market=market,
            strategy_name=strategy_name,
            portfolio=None,
            ohlcv=None,
            market_features=None,
            relevant_concepts=[],
            relevant_formulas=[],
            relevant_strategies=[],
            knowledge_rationale="",
            rl_action=None,
            rl_confidence=None,
            rl_rationale=None,
            risk_check_passed=None,
            risk_violations=[],
            max_position_allowed=None,
            order_result=None,
            signal_recorded=None,
            reward=None,
            done=False,
            messages=[]
        )
        
        result = self.graph.invoke(initial_state)
        return result
    
    # ── Helper Methods ───────────────────────────────────────────────────────
    
    def _synthesize_rationale(self, strategy_result, formulas, similar, market):
        """Synthesize decision rationale from knowledge graph retrieval."""
        if not strategy_result:
            return f"No knowledge found for strategy in {market}"
        
        s = strategy_result[0]
        strategy = s.get("s", {})
        concepts = [c.get("name", "") for c in s.get("concepts", []) if c]
        sources = [ks.get("title", "") for ks in s.get("sources", []) if ks]
        
        rationale = f"Strategy: {strategy.get('name', 'Unknown')}. "
        rationale += f"Category: {strategy.get('category', 'N/A')}. "
        rationale += f"Based on concepts: {', '.join(concepts)}. "
        rationale += f"Sourced from: {', '.join(sources[:3])}. "
        rationale += f"Applied to market: {market}."
        
        return rationale
    
    def _explain_rl_action(self, action, confidence, kg_rationale):
        """Generate human-readable explanation of RL decision."""
        direction = "LONG" if action > 0.1 else "SHORT" if action < -0.1 else "FLAT"
        return (
            f"RL Agent decides {direction} with strength {abs(action):.3f} "
            f"(confidence: {confidence:.3f}). "
            f"KG context: {kg_rationale}"
        )
    
    def _compute_reward(self, state: AgentState) -> float:
        """Compute reward for RL training (risk-adjusted return)."""
        action = state["rl_action"]
        order = state.get("order_result", {})
        
        if order.get("status") == "error":
            return -1.0
        if order.get("status") == "rejected":
            return -0.5
        
        # Simple reward: alignment with market direction (will be replaced with actual PnL)
        # TODO: use actual PnL from portfolio tracking
        features = state.get("market_features", {})
        returns = features.get("returns", [])
        if not returns:
            return 0.0
        
        # Reward = action * next_return (directional accuracy)
        next_return = returns[-1] if returns else 0
        reward = action * next_return
        
        # Penalty for excessive trading
        reward -= 0.001 * abs(action)  # Transaction cost proxy
        
        return reward
    
    def _build_observation(self, features, portfolio):
        """Build observation vector for RL agent."""
        if not features:
            return [0.0] * 10
        
        obs = [
            features.get("momentum", 0),
            features.get("zscore", 0),
            features.get("rsi", 50) / 100.0,
            features.get("volatility", 0),
            portfolio.get("total_value", 10000) / 10000.0,
        ]
        
        # Pad to fixed size
        while len(obs) < 10:
            obs.append(0.0)
        
        return obs[:10]
    
    @staticmethod
    def _rolling_std(prices, window):
        if len(prices) < window:
            return 0.0
        import statistics
        returns = [(prices[i] - prices[i-1]) / prices[i-1] for i in range(1, len(prices))]
        return statistics.stdev(returns[-window:]) if len(returns) >= window else 0.0
    
    @staticmethod
    def _momentum(prices, lookback):
        if len(prices) < lookback:
            return 0.0
        return (prices[-1] - prices[-lookback]) / prices[-lookback]
    
    @staticmethod
    def _zscore(prices, lookback):
        if len(prices) < lookback:
            return 0.0
        import statistics
        window = prices[-lookback:]
        mean = statistics.mean(window)
        std = statistics.stdev(window) if len(window) > 1 else 1
        return (prices[-1] - mean) / std if std > 0 else 0
    
    @staticmethod
    def _rsi(prices, period=14):
        if len(prices) < period + 1:
            return 50.0
        gains = []
        losses = []
        for i in range(1, len(prices)):
            change = prices[i] - prices[i-1]
            gains.append(max(0, change))
            losses.append(max(0, -change))
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        return 100 - (100 / (1 + rs))
