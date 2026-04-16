"""
Deep RL Trading Environment for Gymnasium.

State space:
  - Market features: momentum, zscore, RSI, volatility, volume profile
  - Portfolio features: cash ratio, position weights, drawdown
  - GraphRAG features: strategy confidence, knowledge alignment score

Action space:
  - Continuous: [-1, 1] (short to long position sizing)

Reward:
  - Risk-adjusted return (Sharpe-like)
  - Penalty for drawdown, excessive turnover
"""

import gymnasium as gym
from gymnasium import spaces
import numpy as np
from typing import Optional


class TradingEnv(gym.Env):
    """
    Custom trading environment for Deep RL training.
    
    Observations: 10-dim feature vector
    Actions: Continuous [-1, 1]
    """
    
    metadata = {"render_modes": ["human"], "render_fps": 4}
    
    def __init__(
        self,
        ohlcv_data: list[dict],
        initial_balance: float = 10000.0,
        transaction_cost: float = 0.001,
        max_steps: int = 1000,
        render_mode: Optional[str] = None,
    ):
        super().__init__()
        
        self.ohlcv = ohlcv_data
        self.initial_balance = initial_balance
        self.transaction_cost = transaction_cost
        self.max_steps = max_steps
        self.render_mode = render_mode
        
        # Observation space: 10 features
        # [momentum, zscore, rsi_norm, volatility, cash_ratio, 
        #  position_weight, drawdown, volume_ratio, trend_strength, kg_confidence]
        self.observation_space = spaces.Box(
            low=-np.inf, high=np.inf, shape=(10,), dtype=np.float32
        )
        
        # Action space: continuous [-1, 1]
        # -1 = full short, 0 = flat, 1 = full long
        self.action_space = spaces.Box(low=-1.0, high=1.0, shape=(1,), dtype=np.float32)
        
        # State
        self.current_step = 0
        self.balance = initial_balance
        self.position = 0.0  # -1 to 1
        self.net_worth = initial_balance
        self.max_net_worth = initial_balance
        self.drawdown = 0.0
        self.prev_net_worth = initial_balance
        self.returns_history = []
    
    def _get_observation(self) -> np.ndarray:
        """Extract feature vector from current OHLCV state."""
        if self.current_step < 60:
            return np.zeros(10, dtype=np.float32)
        
        closes = [self.ohlcv[i]["close"] for i in range(self.current_step + 1)]
        volumes = [self.ohlcv[i].get("volume", 0) for i in range(self.current_step + 1)]
        
        # Feature 1: Momentum (20-period)
        momentum = (closes[-1] - closes[-20]) / closes[-20] if len(closes) >= 20 else 0
        
        # Feature 2: Z-score (63-period)
        window = closes[-63:] if len(closes) >= 63 else closes
        zscore = (closes[-1] - np.mean(window)) / (np.std(window) + 1e-8)
        
        # Feature 3: RSI (normalized to [0, 1])
        rsi = self._compute_rsi(closes, 14) / 100.0
        
        # Feature 4: Volatility (20-period std of returns)
        returns = np.diff(np.log(closes[-21:])) if len(closes) >= 21 else np.array([0])
        volatility = np.std(returns)
        
        # Feature 5: Cash ratio
        cash_ratio = self.balance / (self.net_worth + 1e-8)
        
        # Feature 6: Position weight
        position_weight = self.position
        
        # Feature 7: Drawdown
        drawdown = (self.max_net_worth - self.net_worth) / (self.max_net_worth + 1e-8)
        
        # Feature 8: Volume ratio (current vs 20-period avg)
        vol_ratio = volumes[-1] / (np.mean(volumes[-20:]) + 1e-8) if len(volumes) >= 20 else 1.0
        
        # Feature 9: Trend strength (ADX proxy)
        trend_strength = abs(momentum) / (volatility + 1e-8)
        trend_strength = np.clip(trend_strength, 0, 5) / 5.0  # Normalize
        
        # Feature 10: Knowledge graph confidence (placeholder)
        kg_confidence = 0.5  # TODO: integrate with GraphRAG
        
        return np.array([
            momentum, zscore, rsi, volatility, cash_ratio,
            position_weight, drawdown, vol_ratio, trend_strength, kg_confidence
        ], dtype=np.float32)
    
    def _compute_reward(self, action: float) -> float:
        """
        Compute risk-adjusted reward.
        
        Components:
          1. Return: action * price_change
          2. Sharpe penalty: penalize volatile returns
          3. Drawdown penalty: exponential penalty for large drawdowns
          4. Turnover penalty: penalize excessive trading
        """
        if self.current_step < 1:
            return 0.0
        
        # Price return
        price_return = (self.ohlcv[self.current_step]["close"] - 
                       self.ohlcv[self.current_step - 1]["close"]) / \
                       (self.ohlcv[self.current_step - 1]["close"] + 1e-8)
        
        # Strategy return
        strategy_return = action * price_return
        
        # Transaction cost
        turnover = abs(action - self.position)
        cost = turnover * self.transaction_cost
        
        # Net return
        net_return = strategy_return - cost
        
        # Track returns for Sharpe calculation
        self.returns_history.append(net_return)
        
        # Drawdown penalty
        dd_penalty = -0.5 * (self.drawdown ** 2)
        
        # Sharpe-like bonus (if enough history)
        sharpe_bonus = 0.0
        if len(self.returns_history) >= 20:
            mean_ret = np.mean(self.returns_history[-20:])
            std_ret = np.std(self.returns_history[-20:]) + 1e-8
            sharpe_bonus = 0.1 * (mean_ret / std_ret)
        
        reward = net_return + dd_penalty + sharpe_bonus
        return float(reward)
    
    def step(self, action: np.ndarray):
        """Execute one time step in the environment."""
        action_float = float(np.clip(action[0], -1.0, 1.0))
        
        # Update portfolio
        old_position = self.position
        self.position = action_float
        
        # Calculate net worth
        if self.current_step > 0:
            price_change = (self.ohlcv[self.current_step]["close"] - 
                          self.ohlcv[self.current_step - 1]["close"]) / \
                          (self.ohlcv[self.current_step - 1]["close"] + 1e-8)
            
            # PnL from position
            pnl = old_position * price_change * self.balance
            self.balance += pnl
            
            # Transaction cost
            turnover = abs(action_float - old_position)
            self.balance -= turnover * self.transaction_cost * self.balance
        
        self.net_worth = self.balance
        self.max_net_worth = max(self.max_net_worth, self.net_worth)
        self.drawdown = (self.max_net_worth - self.net_worth) / (self.max_net_worth + 1e-8)
        
        # Compute reward
        reward = self._compute_reward(action_float)
        
        # Advance step
        self.current_step += 1
        
        # Get observation
        obs = self._get_observation()
        
        # Check termination
        done = self.current_step >= len(self.ohlcv) - 1 or self.current_step >= self.max_steps
        truncated = self.drawdown > 0.20  # 20% max drawdown
        
        info = {
            "net_worth": self.net_worth,
            "drawdown": self.drawdown,
            "position": self.position,
            "step": self.current_step,
        }
        
        return obs, reward, done, truncated, info
    
    def reset(self, seed: Optional[int] = None, options: Optional[dict] = None):
        """Reset the environment to initial state."""
        super().reset(seed=seed)
        
        self.current_step = 60  # Start with enough history for features
        self.balance = self.initial_balance
        self.position = 0.0
        self.net_worth = self.initial_balance
        self.max_net_worth = self.initial_balance
        self.drawdown = 0.0
        self.returns_history = []
        
        obs = self._get_observation()
        info = {"net_worth": self.net_worth, "drawdown": 0.0}
        
        return obs, info
    
    def render(self):
        if self.render_mode == "human":
            print(f"Step {self.current_step}: NW={self.net_worth:.2f}, "
                  f"DD={self.drawdown:.3f}, Pos={self.position:.3f}")
    
    @staticmethod
    def _compute_rsi(prices, period=14):
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
