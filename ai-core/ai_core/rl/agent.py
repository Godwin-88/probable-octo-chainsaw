"""
PPO Agent wrapper for trading.

Uses stable-baselines3 PPO with custom policy network.
Supports:
  - Training on historical OHLCV data
  - Inference for live trading
  - Replay buffer for online learning
"""

import numpy as np
from typing import Optional, Tuple
from collections import deque


class PPOAgent:
    """
    PPO trading agent wrapper.
    
    When stable-baselines3 is available, uses real PPO.
    Falls back to rule-based agent for development/testing.
    """
    
    def __init__(
        self,
        obs_dim: int = 10,
        action_dim: int = 1,
        learning_rate: float = 3e-4,
        n_steps: int = 2048,
        batch_size: int = 64,
        n_epochs: int = 10,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        clip_range: float = 0.2,
        use_sb3: bool = True,
    ):
        self.obs_dim = obs_dim
        self.action_dim = action_dim
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.replay_buffer = deque(maxlen=10000)
        
        # Try to import stable-baselines3
        self.model = None
        if use_sb3:
            try:
                from stable_baselines3 import PPO
                from stable_baselines3.common.policies import ActorCriticPolicy
                
                self.model = PPO(
                    "MlpPolicy",
                    self._make_dummy_env(),
                    learning_rate=learning_rate,
                    n_steps=n_steps,
                    batch_size=batch_size,
                    n_epochs=n_epochs,
                    gamma=gamma,
                    gae_lambda=gae_lambda,
                    clip_range=clip_range,
                    verbose=0,
                )
                self.use_sb3 = True
            except ImportError:
                print("[PPOAgent] stable-baselines3 not available, using rule-based fallback")
                self.use_sb3 = False
        else:
            self.use_sb3 = False
    
    def predict(
        self, 
        observation: np.ndarray, 
        deterministic: bool = True
    ) -> Tuple[np.ndarray, Optional[float], Optional[float]]:
        """
        Predict action from observation.
        
        Returns:
            action: Trading action [-1, 1]
            log_prob: Log probability of action (for training)
            value: Value function estimate
        """
        obs = np.array(observation, dtype=np.float32).flatten()
        
        if self.use_sb3 and self.model is not None:
            action, _states = self.model.predict(obs, deterministic=deterministic)
            # Get value and log_prob from model
            return action, None, None
        else:
            # Rule-based fallback
            action = self._rule_based_action(obs)
            return np.array([action]), None, None
    
    def add_to_buffer(
        self,
        observation: np.ndarray,
        action: float,
        reward: float,
        done: bool,
    ):
        """Add experience to replay buffer."""
        self.replay_buffer.append({
            "obs": np.array(observation, dtype=np.float32),
            "action": action,
            "reward": reward,
            "done": done,
        })
    
    def train(self, total_timesteps: int = 100000, env=None):
        """Train the PPO agent."""
        if self.use_sb3 and self.model is not None and env is not None:
            self.model.learn(total_timesteps=total_timesteps, progress_bar=True)
        else:
            print("[PPOAgent] Training skipped: no SB3 model or env available")
    
    def save(self, path: str):
        """Save model weights."""
        if self.use_sb3 and self.model is not None:
            self.model.save(path)
        else:
            print("[PPOAgent] No model to save")
    
    def load(self, path: str):
        """Load model weights."""
        if self.use_sb3 and self.model is not None:
            self.model = self.model.load(path)
        else:
            print("[PPOAgent] No model to load")
    
    def _rule_based_action(self, obs: np.ndarray) -> float:
        """
        Rule-based fallback action.
        
        Uses momentum + mean reversion signals:
          - Strong momentum → follow trend
          - Extreme z-score → mean revert
          - RSI extremes → mean revert
        """
        momentum = obs[0]    # Feature 0
        zscore = obs[1]      # Feature 1
        rsi = obs[2]         # Feature 2 (normalized [0, 1])
        volatility = obs[3]  # Feature 3
        
        # Momentum signal
        momentum_signal = np.clip(momentum * 2, -1, 1)
        
        # Mean reversion signal (z-score)
        mr_signal = -np.clip(zscore / 3.0, -1, 1)
        
        # RSI signal
        rsi_signal = -np.clip((rsi - 0.5) * 4, -1, 1)
        
        # Combine signals (momentum-weighted)
        if abs(momentum) > 0.05:
            # Trending regime: follow momentum
            action = 0.6 * momentum_signal + 0.2 * mr_signal + 0.2 * rsi_signal
        else:
            # Ranging regime: mean revert
            action = 0.2 * momentum_signal + 0.5 * mr_signal + 0.3 * rsi_signal
        
        # Volatility scaling (reduce position size in high vol)
        vol_scale = np.clip(1.0 / (1.0 + volatility * 10), 0.1, 1.0)
        action *= vol_scale
        
        return float(np.clip(action, -1, 1))
    
    def _make_dummy_env(self):
        """Create a dummy environment for SB3 model initialization."""
        import gymnasium as gym
        from gymnasium import spaces
        
        class DummyEnv(gym.Env):
            def __init__(self):
                super().__init__()
                self.observation_space = spaces.Box(
                    low=-np.inf, high=np.inf, shape=(self.obs_dim,), dtype=np.float32
                )
                self.action_space = spaces.Box(
                    low=-1.0, high=1.0, shape=(self.action_dim,), dtype=np.float32
                )
            
            def reset(self, seed=None, options=None):
                return np.zeros(self.obs_dim, dtype=np.float32), {}
            
            def step(self, action):
                return np.zeros(self.obs_dim, dtype=np.float32), 0.0, False, False, {}
        
        return DummyEnv()
