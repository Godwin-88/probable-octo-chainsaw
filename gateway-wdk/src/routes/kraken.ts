/**
 * Kraken Execution Provider API Routes
 * 
 * Integrates Kraken CLI as a pluggable execution venue.
 * Mount these routes in gateway-wdk/src/index.ts
 * 
 * Design principles:
 * - Universal asset support (any trading pair)
 * - Consistent with v2 API patterns
 * - Sandbox-first (safe by default)
 */

import { Router, Request, Response } from 'express';
import KrakenService from '../services/kraken.js';

const krakenRouter = Router();

// Initialize Kraken service (sandbox mode by default)
const kraken = new KrakenService(process.env.KRAKEN_SANDBOX !== 'false');

/**
 * @route   GET /api/kraken/health
 * @desc    Health check for Kraken execution provider
 * @access  Public
 */
krakenRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await kraken.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: (error as Error).message
    });
  }
});

/**
 * @route   GET /api/kraken/balance
 * @desc    Get account balances (all assets)
 * @access  Private (requires API key)
 */
krakenRouter.get('/balance', async (_req: Request, res: Response) => {
  try {
    const balance = await kraken.getBalance();
    res.json({
      success: true,
      data: balance,
      mode: process.env.KRAKEN_SANDBOX !== 'false' ? 'sandbox' : 'live'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * @route   GET /api/kraken/pairs
 * @desc    Get supported trading pairs
 * @access  Public
 */
krakenRouter.get('/pairs', async (_req: Request, res: Response) => {
  try {
    const pairs = await kraken.getSupportedPairs();
    res.json({
      success: true,
      data: { pairs, count: pairs.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * @route   GET /api/kraken/market/ticker/:pair
 * @desc    Get ticker data for any trading pair
 * @access  Public
 * @param   pair - Trading pair (e.g., XBT/USD, ETH/USDT, SOL/EUR)
 */
krakenRouter.get('/market/ticker/:pair', async (req: Request, res: Response) => {
  try {
    const { pair } = req.params;
    const ticker = await kraken.getTicker(pair);
    res.json({
      success: true,
      data: ticker
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * @route   GET /api/kraken/market/ohlc/:pair
 * @desc    Get OHLC (candlestick) data for any pair
 * @access  Public
 * @param   pair - Trading pair
 * @query   interval - Candle interval in minutes (default: 60)
 */
krakenRouter.get('/market/ohlc/:pair', async (req: Request, res: Response) => {
  try {
    const { pair } = req.params;
    const interval = parseInt(req.query.interval as string) || 60;
    const ohlc = await kraken.getOHLC(pair, interval);
    res.json({
      success: true,
      data: ohlc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * @route   GET /api/kraken/market/trades/:pair
 * @desc    Get recent trades for a pair
 * @access  Public
 * @param   pair - Trading pair
 */
krakenRouter.get('/market/trades/:pair', async (req: Request, res: Response) => {
  try {
    const { pair } = req.params;
    const trades = await kraken.getTrades(pair);
    res.json({
      success: true,
      data: trades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * @route   GET /api/kraken/trades
 * @desc    Get trade history (all pairs or filtered)
 * @access  Private (requires API key)
 * @query   pair - Optional filter by trading pair
 */
krakenRouter.get('/trades', async (req: Request, res: Response) => {
  try {
    const pair = req.query.pair as string | undefined;
    const trades = await kraken.getTrades(pair);
    res.json({
      success: true,
      data: trades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * @route   POST /api/kraken/order
 * @desc    Place a trading order (universal pair support)
 * @access  Private (requires API key)
 * @body    pair - Trading pair (e.g., XBT/USD, ETH/USDT)
 * @body    type - 'buy' or 'sell'
 * @body    volume - Order volume
 * @body    price - Optional limit price (market order if omitted)
 */
krakenRouter.post('/order', async (req: Request, res: Response) => {
  try {
    const { pair, type, volume, price } = req.body;
    
    // Validate required fields
    if (!pair || !type || volume == null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pair, type, volume'
      });
    }
    
    // Validate order type
    if (type !== 'buy' && type !== 'sell') {
      return res.status(400).json({
        success: false,
        error: 'Invalid order type. Must be "buy" or "sell"'
      });
    }
    
    // Validate volume
    if (volume <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Volume must be positive'
      });
    }
    
    // Execute order
    const order = await kraken.placeOrder(pair, type, volume, price);
    
    res.json({
      success: true,
      data: order,
      warning: process.env.KRAKEN_SANDBOX !== 'false' 
        ? 'SANDBOX MODE - No real execution' 
        : 'LIVE MODE - Real order placed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * @route   DELETE /api/kraken/order/:id
 * @desc    Cancel an order
 * @access  Private (requires API key)
 * @param   id - Order ID to cancel
 */
krakenRouter.delete('/order/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await kraken.cancelOrder(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * @route   POST /api/kraken/signal/execute
 * @desc    Execute a trading signal (integration with AI core)
 * @access  Private
 * @body    market - Trading pair
 * @body    direction - 1 (long), -1 (short), 0 (flat/close)
 * @body    strength - Signal strength 0.0-1.0
 * @body    volume - Position size (optional, uses default if omitted)
 */
krakenRouter.post('/signal/execute', async (req: Request, res: Response) => {
  try {
    const { market, direction, strength, volume } = req.body;
    
    if (!market || direction == null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: market, direction'
      });
    }
    
    // Flat signal = close position (not implemented yet)
    if (direction === 0) {
      return res.json({
        success: true,
        message: 'Flat signal received - no action taken',
        note: 'Position closing logic to be implemented'
      });
    }
    
    // Default volume if not specified (10% of portfolio placeholder)
    const execVolume = volume || 0.001; // Default small size for safety
    
    const orderType: 'buy' | 'sell' = direction > 0 ? 'buy' : 'sell';
    const order = await kraken.placeOrder(market, orderType, execVolume);
    
    res.json({
      success: true,
      data: {
        signal: { market, direction, strength },
        order,
        mode: process.env.KRAKEN_SANDBOX !== 'false' ? 'sandbox' : 'live'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export { krakenRouter };
