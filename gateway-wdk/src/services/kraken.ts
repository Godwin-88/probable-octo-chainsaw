/**
 * Kraken CLI Execution Provider
 * 
 * Universal CEX execution layer for probable-octo-chainsaw.
 * Works with any trading pair - no hardcoded assets.
 * Integrates with WDK's universal asset resolution and oracle system.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface KrakenBalance {
  [asset: string]: {
    balance: string;
    hold_trade: string;
    available: string;
  };
}

export interface KrakenTicker {
  pair: string;
  bid: string;
  ask: string;
  last: string;
  volume: string;
  vwap: string;
  high: string;
  low: string;
  open: string;
  timestamp: number;
}

export interface KrakenOHLC {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  vwap: string;
  volume: string;
  count: number;
}

export interface KrakenOrder {
  order_id: string;
  status: string;
  pair: string;
  type: 'buy' | 'sell';
  volume: string;
  price: string;
  filled: string;
  fee: string;
  timestamp: number;
}

export interface KrakenTrade {
  trade_id: string;
  pair: string;
  type: 'buy' | 'sell';
  volume: string;
  price: string;
  fee: string;
  timestamp: number;
}

export interface TradingPair {
  base: string;   // e.g., 'XBT', 'ETH', 'SOL'
  quote: string;  // e.g., 'USD', 'EUR', 'USDT'
  symbol: string; // e.g., 'XBT/USD'
}

export class KrakenService {
  private sandboxMode: boolean;

  constructor(sandboxMode: boolean = true) {
    this.sandboxMode = sandboxMode;
    console.log(`[KrakenService] Initialized in ${sandboxMode ? 'SANDBOX' : 'LIVE'} mode`);
  }

  /**
   * Normalize trading pair symbol for Kraken CLI
   * Accepts formats: "XBT/USD", "BTC-USD", "ETHUSD", "SOL/USDT"
   */
  private normalizePair(input: string): string {
    const normalized = input.toUpperCase().trim();
    
    // Already in XBT/USD format
    if (normalized.includes('/')) {
      return normalized;
    }
    
    // Handle BTC-XBT conversion (Kraken uses XBT for Bitcoin)
    let pair = normalized.replace('BTC', 'XBT');
    
    // Handle various separators
    pair = pair.replace(/[-_]/g, '/');
    
    // If no separator found, try to split by common quote currencies
    const quotes = ['USD', 'EUR', 'USDT', 'USDC', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];
    for (const quote of quotes) {
      if (pair.endsWith(quote)) {
        const base = pair.slice(0, pair.length - quote.length);
        if (base.length > 0) {
          return `${base}/${quote}`;
        }
      }
    }
    
    // Fallback: return as-is with slash
    return pair;
  }

  /**
   * Get account balances
   */
  async getBalance(): Promise<KrakenBalance> {
    try {
      const { stdout, stderr } = await execAsync('kraken balance');
      if (stderr) {
        console.error('[KrakenService] Balance error:', stderr);
        throw new Error(stderr);
      }
      return JSON.parse(stdout.trim());
    } catch (error) {
      console.error('[KrakenService] getBalance failed:', error);
      throw error;
    }
  }

  /**
   * Get ticker data for any trading pair
   */
  async getTicker(pair: string): Promise<KrakenTicker> {
    try {
      const normalizedPair = this.normalizePair(pair);
      const { stdout, stderr } = await execAsync(`kraken ticker --pair ${normalizedPair}`);
      if (stderr) {
        console.error('[KrakenService] Ticker error:', stderr);
        throw new Error(stderr);
      }
      return JSON.parse(stdout.trim());
    } catch (error) {
      console.error('[KrakenService] getTicker failed:', error);
      throw error;
    }
  }

  /**
   * Get OHLC (candlestick) data for any pair
   */
  async getOHLC(pair: string, interval: number = 60): Promise<KrakenOHLC[]> {
    try {
      const normalizedPair = this.normalizePair(pair);
      const { stdout, stderr } = await execAsync(
        `kraken ohlc --pair ${normalizedPair} --interval ${interval}`
      );
      if (stderr) {
        console.error('[KrakenService] OHLC error:', stderr);
        throw new Error(stderr);
      }
      return JSON.parse(stdout.trim());
    } catch (error) {
      console.error('[KrakenService] getOHLC failed:', error);
      throw error;
    }
  }

  /**
   * Place a trading order for any pair
   */
  async placeOrder(
    pair: string,
    type: 'buy' | 'sell',
    volume: number,
    price?: number
  ): Promise<KrakenOrder> {
    try {
      const normalizedPair = this.normalizePair(pair);
      const priceArg = price ? `--price ${price}` : '';
      const command = `kraken order ${type} --pair ${normalizedPair} --volume ${volume} ${priceArg}`.trim();
      
      console.log('[KrakenService] Placing order:', command);
      
      const { stdout, stderr } = await execAsync(command);
      if (stderr) {
        console.error('[KrakenService] Order error:', stderr);
        throw new Error(stderr);
      }
      return JSON.parse(stdout.trim());
    } catch (error) {
      console.error('[KrakenService] placeOrder failed:', error);
      throw error;
    }
  }

  /**
   * Get trade history
   */
  async getTrades(pair?: string): Promise<KrakenTrade[]> {
    try {
      const pairArg = pair ? `--pair ${this.normalizePair(pair)}` : '';
      const { stdout, stderr } = await execAsync(`kraken trades ${pairArg}`.trim());
      if (stderr) {
        console.error('[KrakenService] Trades error:', stderr);
        throw new Error(stderr);
      }
      return JSON.parse(stdout.trim());
    } catch (error) {
      console.error('[KrakenService] getTrades failed:', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { stdout, stderr } = await execAsync(`kraken order cancel --id ${orderId}`);
      if (stderr) {
        return { success: false, message: stderr };
      }
      return { success: true };
    } catch (error) {
      console.error('[KrakenService] cancelOrder failed:', error);
      return { success: false, message: (error as Error).message };
    }
  }

  /**
   * Check if service is healthy
   */
  async healthCheck(): Promise<{ status: string; mode: string; timestamp: number }> {
    try {
      await this.getBalance();
      return {
        status: 'healthy',
        mode: this.sandboxMode ? 'sandbox' : 'live',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        mode: this.sandboxMode ? 'sandbox' : 'live',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get supported trading pairs (dynamic discovery)
   * Note: Kraken CLI doesn't expose pair listing, so this is a placeholder
   * for future enhancement or manual configuration via env.
   */
  async getSupportedPairs(): Promise<TradingPair[]> {
    // Common pairs - in production, this could be loaded from config or discovered
    const commonBases = ['XBT', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'MATIC', 'AVAX'];
    const commonQuotes = ['USD', 'EUR', 'USDT', 'USDC'];
    
    const pairs: TradingPair[] = [];
    for (const base of commonBases) {
      for (const quote of commonQuotes) {
        pairs.push({
          base,
          quote,
          symbol: `${base}/${quote}`
        });
      }
    }
    
    return pairs;
  }
}

export default KrakenService;
