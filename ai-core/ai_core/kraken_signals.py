"""
Kraken Signal Generator - Universal Asset Support

Generates trading signals using:
1. Market data from Kraken CLI (via gateway)
2. Strategy parameters from Neo4j knowledge graph
3. GraphRAG retrieval for context

Design Principles:
- Universal asset support (any trading pair, not hardcoded)
- Dynamic strategy loading from Neo4j
- Integrates with existing probable-octo-chainsaw AI core
- Sandbox-first execution

Usage:
    generator = KrakenSignalGenerator()
    signal = generator.generate_signal('XBT/USD', 'KrakenMomentum')
    signal = generator.generate_signal('ETH/USDT', 'KrakenMeanReversion')
    signal = generator.generate_signal('SOL/EUR', 'KrakenVolatilityBreakout')
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import os
import requests
import logging
import importlib

from neo4j import GraphDatabase, Driver, Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SignalDirection(Enum):
    LONG = 1
    FLAT = 0
    SHORT = -1


@dataclass
class Signal:
    """Trading signal data structure"""
    market: str
    direction: int  # +1 long, -1 short, 0 flat
    strength: float  # 0.0 to 1.0
    timestamp: str
    strategy_id: str
    metadata: Dict
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class StrategyConfig:
    """Strategy configuration from Neo4j"""
    name: str
    lookback: int
    threshold: float
    parameters: Dict
    exchange: Optional[str] = None
    signal_type: Optional[str] = None  # 'momentum', 'mean_reversion', 'breakout'


class KrakenSignalGenerator:
    """
    Generate trading signals using Kraken market data and Neo4j strategy configs.
    
    Supports any trading pair - no hardcoded assets.
    Strategies are loaded dynamically from Neo4j.
    
    Usage:
        generator = KrakenSignalGenerator()
        
        # Any pair works
        signal = generator.generate_signal('XBT/USD', 'KrakenMomentum')
        signal = generator.generate_signal('ETH/USDT', 'KrakenMeanReversion')
        signal = generator.generate_signal('SOL/EUR', 'KrakenVolatilityBreakout')
    """
    
    def __init__(
        self,
        gateway_url: Optional[str] = None,
        neo4j_uri: Optional[str] = None,
        neo4j_password: Optional[str] = None
    ):
        self.gateway_url = gateway_url or os.getenv(
            'KRAKEN_GATEWAY_URL',
            'http://localhost:3000/api/kraken'
        )
        
        # Initialize Neo4j driver
        neo4j_uri = neo4j_uri or os.getenv('NEO4J_URI', 'bolt://localhost:7688')
        neo4j_password = neo4j_password or os.getenv('NEO4J_PASSWORD', 'yield-agent-dev')
        
        self.neo4j_driver: Driver = GraphDatabase.driver(
            neo4j_uri,
            auth=('neo4j', neo4j_password)
        )
        
        logger.info(f"[KrakenSignalGenerator] Initialized")
        logger.info(f"  Gateway: {self.gateway_url}")
        logger.info(f"  Neo4j: {neo4j_uri}")
    
    def __del__(self):
        """Close Neo4j driver on cleanup"""
        if hasattr(self, 'neo4j_driver'):
            self.neo4j_driver.close()
    
    def get_market_data(
        self,
        pair: str,
        interval: int = 60,
        limit: int = 300
    ) -> List[Dict]:
        """
        Fetch OHLC data from Kraken via gateway.
        
        Args:
            pair: Trading pair (e.g., 'XBT/USD', 'ETH/USDT', 'SOL/EUR')
            interval: Candle interval in minutes
            limit: Maximum number of candles to return
            
        Returns:
            List of OHLC candles
        """
        try:
            response = requests.get(
                f'{self.gateway_url}/market/ohlc/{pair}',
                params={'interval': interval},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get('success'):
                ohlc = data['data']
                return ohlc[-limit:] if len(ohlc) > limit else ohlc
            else:
                logger.error(f"Gateway error: {data.get('error')}")
                return []
                
        except requests.RequestException as e:
            logger.error(f"Failed to fetch market data for {pair}: {e}")
            return []
    
    def get_strategy_config(self, strategy_name: str) -> Optional[StrategyConfig]:
        """
        Fetch strategy configuration from Neo4j.
        
        Args:
            strategy_name: Name of the strategy (e.g., 'KrakenMomentum')
            
        Returns:
            StrategyConfig or None if not found
        """
        query = """
        MATCH (s:TradingStrategy {name: $strategy_name})
        RETURN s.lookback AS lookback, 
               s.threshold AS threshold, 
               s.parameters AS parameters,
               s.exchange AS exchange,
               s.type AS signal_type
        """
        
        try:
            with self.neo4j_driver.session() as session:
                result = session.run(query, strategy_name=strategy_name)
                record = result.single()
                
                if record:
                    return StrategyConfig(
                        name=strategy_name,
                        lookback=record['lookback'] or 252,
                        threshold=record['threshold'] or 0.02,
                        parameters=record['parameters'] or {},
                        exchange=record['exchange'],
                        signal_type=record['signal_type']
                    )
                else:
                    logger.warning(f"Strategy '{strategy_name}' not found in Neo4j")
                    return None
                    
        except Exception as e:
            logger.error(f"Neo4j query failed: {e}")
            return None
    
    def list_available_strategies(self, exchange: Optional[str] = None) -> List[StrategyConfig]:
        """
        List all available strategies from Neo4j.
        
        Args:
            exchange: Optional filter by exchange (e.g., 'Kraken')
            
        Returns:
            List of StrategyConfig objects
        """
        if exchange:
            query = """
            MATCH (s:TradingStrategy {exchange: $exchange})
            RETURN s.name AS name, s.lookback AS lookback, 
                   s.threshold AS threshold, s.parameters AS parameters,
                   s.type AS signal_type, s.exchange AS exchange
            """
            params = {'exchange': exchange}
        else:
            query = """
            MATCH (s:TradingStrategy)
            RETURN s.name AS name, s.lookback AS lookback, 
                   s.threshold AS threshold, s.parameters AS parameters,
                   s.type AS signal_type, s.exchange AS exchange
            """
            params = {}
        
        try:
            with self.neo4j_driver.session() as session:
                result = session.run(query, **params)
                strategies = []
                for record in result:
                    strategies.append(StrategyConfig(
                        name=record['name'],
                        lookback=record['lookback'] or 252,
                        threshold=record['threshold'] or 0.02,
                        parameters=record['parameters'] or {},
                        exchange=record['exchange'],
                        signal_type=record['signal_type']
                    ))
                return strategies
        except Exception as e:
            logger.error(f"Failed to list strategies: {e}")
            return []
    
    def calculate_momentum_signal(
        self,
        ohlc: List[Dict],
        config: StrategyConfig
    ) -> Tuple[int, float, Dict]:
        """
        Calculate time-series momentum signal.
        
        Args:
            ohlc: List of OHLC candles
            config: Strategy configuration
            
        Returns:
            Tuple of (direction, strength, metadata)
        """
        if len(ohlc) < config.lookback:
            logger.warning(f"Insufficient data: {len(ohlc)} < {config.lookback}")
            return (0, 0.0, {'error': 'insufficient_data'})
        
        # Extract close prices
        close_prices = [float(candle['close']) for candle in ohlc]
        
        # Calculate momentum
        current_price = close_prices[-1]
        past_price = close_prices[-config.lookback]
        momentum = (current_price - past_price) / past_price
        
        # Determine signal
        if momentum > config.threshold:
            direction = 1  # LONG
            strength = min(1.0, momentum / config.threshold)
        elif momentum < -config.threshold:
            direction = -1  # SHORT
            strength = min(1.0, abs(momentum) / config.threshold)
        else:
            direction = 0  # FLAT
            strength = 0.0
        
        metadata = {
            'momentum': momentum,
            'current_price': current_price,
            'past_price': past_price,
            'lookback': config.lookback,
            'threshold': config.threshold,
            'signal_type': 'momentum'
        }
        
        return (direction, strength, metadata)
    
    def calculate_zscore_signal(
        self,
        ohlc: List[Dict],
        config: StrategyConfig
    ) -> Tuple[int, float, Dict]:
        """
        Calculate z-score mean reversion signal.
        
        Args:
            ohlc: List of OHLC candles
            config: Strategy configuration
            
        Returns:
            Tuple of (direction, strength, metadata)
        """
        try:
            import numpy as np
        except ImportError:
            logger.error("numpy not available - cannot calculate z-score")
            return (0, 0.0, {'error': 'numpy_not_available'})
        
        if len(ohlc) < config.lookback:
            logger.warning(f"Insufficient data: {len(ohlc)} < {config.lookback}")
            return (0, 0.0, {'error': 'insufficient_data'})
        
        # Extract close prices
        close_prices = np.array([float(candle['close']) for candle in ohlc[-config.lookback:]])
        
        # Calculate z-score
        mean = np.mean(close_prices)
        std = np.std(close_prices)
        current_price = close_prices[-1]
        
        if std == 0:
            return (0, 0.0, {'error': 'zero_volatility'})
        
        zscore = (current_price - mean) / std
        
        # Mean reversion: short when zscore high, long when zscore low
        threshold = config.threshold  # e.g., 2.0 standard deviations
        
        if zscore < -threshold:
            direction = 1  # LONG (price below mean)
            strength = min(1.0, abs(zscore) / threshold)
        elif zscore > threshold:
            direction = -1  # SHORT (price above mean)
            strength = min(1.0, abs(zscore) / threshold)
        else:
            direction = 0  # FLAT
            strength = 0.0
        
        metadata = {
            'zscore': zscore,
            'mean': mean,
            'std': std,
            'current_price': current_price,
            'lookback': config.lookback,
            'threshold': threshold,
            'signal_type': 'mean_reversion'
        }
        
        return (direction, strength, metadata)
    
    def calculate_volatility_breakout_signal(
        self,
        ohlc: List[Dict],
        config: StrategyConfig
    ) -> Tuple[int, float, Dict]:
        """
        Calculate volatility breakout signal (Bollinger Bands style).
        
        Args:
            ohlc: List of OHLC candles
            config: Strategy configuration
            
        Returns:
            Tuple of (direction, strength, metadata)
        """
        try:
            import numpy as np
        except ImportError:
            logger.error("numpy not available - cannot calculate volatility breakout")
            return (0, 0.0, {'error': 'numpy_not_available'})
        
        if len(ohlc) < config.lookback:
            logger.warning(f"Insufficient data: {len(ohlc)} < {config.lookback}")
            return (0, 0.0, {'error': 'insufficient_data'})
        
        # Extract close prices
        close_prices = np.array([float(candle['close']) for candle in ohlc[-config.lookback:]])
        
        # Calculate Bollinger Bands
        mean = np.mean(close_prices)
        std = np.std(close_prices)
        current_price = close_prices[-1]
        
        upper_band = mean + (config.threshold * std)
        lower_band = mean - (config.threshold * std)
        
        # Breakout signals
        if current_price > upper_band:
            direction = 1  # LONG (bullish breakout)
            strength = min(1.0, (current_price - upper_band) / (std * 0.5))
        elif current_price < lower_band:
            direction = -1  # SHORT (bearish breakout)
            strength = min(1.0, (lower_band - current_price) / (std * 0.5))
        else:
            direction = 0  # FLAT (within bands)
            strength = 0.0
        
        metadata = {
            'current_price': current_price,
            'mean': mean,
            'std': std,
            'upper_band': upper_band,
            'lower_band': lower_band,
            'lookback': config.lookback,
            'threshold': config.threshold,
            'signal_type': 'volatility_breakout'
        }
        
        return (direction, strength, metadata)
    
    def generate_signal(
        self,
        pair: str,
        strategy: str = 'KrakenMomentum',
        interval: int = 60
    ) -> Optional[Signal]:
        """
        Generate trading signal for any pair and strategy.
        
        Args:
            pair: Trading pair (e.g., 'XBT/USD', 'ETH/USDT', 'SOL/EUR')
            strategy: Strategy name (must exist in Neo4j, or uses defaults)
            interval: Candle interval in minutes
            
        Returns:
            Signal object or None if generation failed
        """
        logger.info(f"Generating signal for {pair} using {strategy}")
        
        # 1. Fetch strategy config from Neo4j
        config = self.get_strategy_config(strategy)
        if not config:
            # Use default config if strategy not found
            config = StrategyConfig(
                name=strategy,
                lookback=252,
                threshold=0.02,
                parameters={},
                signal_type='momentum'  # default
            )
            logger.warning(f"Using default config for {strategy}")
        
        # 2. Fetch market data from Kraken
        ohlc = self.get_market_data(pair, interval)
        if not ohlc:
            logger.error(f"Failed to fetch market data for {pair}")
            return None
        
        # 3. Calculate signal based on strategy type
        signal_type = (config.signal_type or strategy).lower()
        
        if 'momentum' in signal_type:
            direction, strength, metadata = self.calculate_momentum_signal(ohlc, config)
        elif 'mean' in signal_type or 'reversion' in signal_type:
            direction, strength, metadata = self.calculate_zscore_signal(ohlc, config)
        elif 'volatility' in signal_type or 'breakout' in signal_type:
            direction, strength, metadata = self.calculate_volatility_breakout_signal(ohlc, config)
        else:
            # Default to momentum
            direction, strength, metadata = self.calculate_momentum_signal(ohlc, config)
        
        # 4. Create signal object
        signal = Signal(
            market=pair,
            direction=direction,
            strength=strength,
            timestamp=datetime.utcnow().isoformat() + 'Z',
            strategy_id=strategy,
            metadata=metadata
        )
        
        logger.info(f"Signal generated: direction={direction}, strength={strength:.3f}")
        
        return signal
    
    def record_signal_to_neo4j(self, signal: Signal) -> bool:
        """
        Record signal to Neo4j for audit trail.
        
        Args:
            signal: Signal object to record
            
        Returns:
            True if successful, False otherwise
        """
        query = """
        CREATE (s:Signal {
            market: $market,
            direction: $direction,
            strength: $strength,
            timestamp: $timestamp,
            strategy_id: $strategy_id,
            metadata: $metadata
        })
        RETURN s
        """
        
        try:
            with self.neo4j_driver.session() as session:
                session.run(
                    query,
                    market=signal.market,
                    direction=signal.direction,
                    strength=signal.strength,
                    timestamp=signal.timestamp,
                    strategy_id=signal.strategy_id,
                    metadata=signal.metadata
                )
            logger.info(f"Signal recorded to Neo4j: {signal.market}")
            return True
        except Exception as e:
            logger.error(f"Failed to record signal: {e}")
            return False
    
    def execute_signal_via_gateway(self, signal: Signal, volume: Optional[float] = None) -> Optional[Dict]:
        """
        Execute signal by calling the gateway's execute endpoint.
        
        Args:
            signal: Signal object to execute
            volume: Optional position size (uses default if omitted)
            
        Returns:
            Execution result or None if failed
        """
        try:
            response = requests.post(
                f'{self.gateway_url}/signal/execute',
                json={
                    'market': signal.market,
                    'direction': signal.direction,
                    'strength': signal.strength,
                    'volume': volume
                },
                timeout=10
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                logger.info(f"Signal executed: {signal.market} direction={signal.direction}")
                return result['data']
            else:
                logger.error(f"Execution failed: {result.get('error')}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Failed to execute signal: {e}")
            return None


# Example usage
if __name__ == '__main__':
    # Initialize generator
    generator = KrakenSignalGenerator()
    
    # List available strategies
    strategies = generator.list_available_strategies(exchange='Kraken')
    print(f"\nAvailable Kraken strategies: {[s.name for s in strategies]}")
    
    # Generate momentum signal for any pair
    test_pairs = ['XBT/USD', 'ETH/USD', 'SOL/USD']
    
    for pair in test_pairs:
        print(f"\n{'='*60}")
        print(f"Testing {pair}")
        print('='*60)
        
        signal = generator.generate_signal(pair, 'KrakenMomentum')
        if signal:
            print(f"Signal: {signal.to_dict()}")
            
            # Record to Neo4j
            generator.record_signal_to_neo4j(signal)
