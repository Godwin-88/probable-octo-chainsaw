"""
Train RL trading agent on historical Kraken data.

Usage:
  python -m ai_core.rl.train --market XBT/USD --epochs 100
  python -m ai_core.rl.train --market ETH/USD --epochs 200 --lr 1e-4
"""

import argparse
import os
import sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ai_core.rl.env import TradingEnv
from ai_core.rl.agent import PPOAgent


def fetch_ohlcv_from_kraken(market: str, interval: int = 60, limit: int = 1000) -> list[dict]:
    """Fetch OHLCV data from Kraken CLI."""
    import subprocess
    import json
    
    base, quote = market.split("/")
    try:
        result = subprocess.run(
            ["kraken", "ohlc", "-o", "json", "--pair", market, "--interval", str(interval)],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            print(f"[WARN] Kraken CLI error: {result.stderr}")
            return _generate_synthetic_data(limit)
        
        data = json.loads(result.stdout)
        return data[:limit] if isinstance(data, list) else _generate_synthetic_data(limit)
    except Exception as e:
        print(f"[WARN] Failed to fetch from Kraken: {e}")
        return _generate_synthetic_data(limit)


def _generate_synthetic_data(n: int = 1000) -> list[dict]:
    """Generate synthetic OHLCV data for testing."""
    np.random.seed(42)
    price = 50000.0
    data = []
    for i in range(n):
        change = np.random.normal(0, 0.002)
        price *= (1 + change)
        data.append({
            "time": i,
            "open": price,
            "high": price * (1 + abs(np.random.normal(0, 0.001))),
            "low": price * (1 - abs(np.random.normal(0, 0.001))),
            "close": price,
            "volume": np.random.uniform(100, 1000),
        })
    return data


def train(
    market: str = "XBT/USD",
    epochs: int = 100,
    learning_rate: float = 3e-4,
    timesteps_per_epoch: int = 5000,
    save_path: str = None,
):
    """Train the RL agent."""
    print(f"[TRAIN] Market: {market}, Epochs: {epochs}, LR: {learning_rate}")
    
    # Fetch data
    ohlcv = fetch_ohlcv_from_kraken(market)
    print(f"[TRAIN] Loaded {len(ohlcv)} candles")
    
    if len(ohlcv) < 100:
        print("[ERROR] Not enough data for training")
        return
    
    # Create environment
    env = TradingEnv(
        ohlcv_data=ohlcv,
        initial_balance=10000.0,
        transaction_cost=0.001,
        max_steps=min(len(ohlcv) - 61, 2000),
    )
    
    # Create agent
    agent = PPOAgent(
        obs_dim=10,
        action_dim=1,
        learning_rate=learning_rate,
    )
    
    # Training loop
    best_reward = -np.inf
    for epoch in range(epochs):
        obs, info = env.reset()
        total_reward = 0.0
        done = False
        step_count = 0
        
        while not done:
            action, _, _ = agent.predict(obs, deterministic=False)
            next_obs, reward, terminated, truncated, info = env.step(action)
            done = terminated or truncated
            
            agent.add_to_buffer(obs, float(action[0]), reward, done)
            
            total_reward += reward
            obs = next_obs
            step_count += 1
        
        # Log progress
        net_worth = info.get("net_worth", 10000)
        drawdown = info.get("drawdown", 0)
        
        if epoch % 10 == 0:
            print(f"  Epoch {epoch:4d}: Reward={total_reward:.4f}, "
                  f"NW={net_worth:.2f}, DD={drawdown:.3f}, Steps={step_count}")
        
        if total_reward > best_reward:
            best_reward = total_reward
            if save_path:
                agent.save(save_path)
    
    # Final evaluation
    print(f"\n[TRAIN] Best reward: {best_reward:.4f}")
    if save_path:
        print(f"[TRAIN] Model saved to {save_path}")
    
    return agent


def main():
    parser = argparse.ArgumentParser(description="Train RL trading agent")
    parser.add_argument("--market", type=str, default="XBT/USD", help="Trading pair")
    parser.add_argument("--epochs", type=int, default=100, help="Training epochs")
    parser.add_argument("--lr", type=float, default=3e-4, help="Learning rate")
    parser.add_argument("--timesteps", type=int, default=5000, help="Timesteps per epoch")
    parser.add_argument("--save", type=str, default=None, help="Save path for model")
    args = parser.parse_args()
    
    save_path = args.save or f"/tmp/ppo_{args.market.replace('/', '_')}.zip"
    
    train(
        market=args.market,
        epochs=args.epochs,
        learning_rate=args.lr,
        timesteps_per_epoch=args.timesteps,
        save_path=save_path,
    )


if __name__ == "__main__":
    main()
