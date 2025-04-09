import axios from 'axios';
import { BINANCE_API_URL } from '@/config/constants';
import { PriceData, CryptoSymbol } from '@/types/crypto';

// Cache prices to reduce API calls
interface PriceCache {
  [symbol: string]: {
    price: number;
    timestamp: number;
  };
}

const priceCache: PriceCache = {};
// Cache validity period (5 seconds)
const CACHE_VALIDITY_MS = 5000;

/**
 * Price service for fetching cryptocurrency prices
 */
export class PriceService {
  private baseUrl: string;

  constructor(baseUrl: string = BINANCE_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get current price for a symbol
   */
  public async getCurrentPrice(symbol: string): Promise<PriceData> {
    try {
      const now = Date.now();
      const cachedPrice = priceCache[symbol];

      // Return from cache if valid
      if (cachedPrice && now - cachedPrice.timestamp < CACHE_VALIDITY_MS) {
        return {
          symbol,
          price: cachedPrice.price,
          timestamp: cachedPrice.timestamp,
        };
      }

      // Fetch from API
      const url = `${this.baseUrl}/v3/ticker/price`;
      const response = await axios.get(url, {
        params: { symbol },
      });

      if (!response.data || !response.data.price) {
        throw new Error(`Failed to get price for ${symbol}`);
      }

      const price = parseFloat(response.data.price);
      
      // Update cache
      priceCache[symbol] = {
        price,
        timestamp: now,
      };

      return {
        symbol,
        price,
        timestamp: now,
      };
    } catch (error: any) {
      console.error(`Failed to fetch price for ${symbol}:`, error.message);
      throw new Error(`Failed to fetch price for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get prices for multiple symbols
   */
  public async getPrices(symbols: CryptoSymbol[]): Promise<PriceData[]> {
    try {
      // Check if any symbols need to be fetched from API
      const now = Date.now();
      const symbolsToFetch = symbols.filter(
        (symbol) => !priceCache[symbol] || now - priceCache[symbol].timestamp >= CACHE_VALIDITY_MS
      );

      if (symbolsToFetch.length > 0) {
        // Fetch all prices
        const url = `${this.baseUrl}/v3/ticker/price`;
        const response = await axios.get(url);

        if (!response.data) {
          throw new Error('Failed to get prices');
        }

        // Update cache for requested symbols
        const allPrices = response.data;
        allPrices.forEach((item: any) => {
          if (symbols.includes(item.symbol)) {
            priceCache[item.symbol] = {
              price: parseFloat(item.price),
              timestamp: now,
            };
          }
        });
      }

      // Return prices for requested symbols
      return symbols.map((symbol) => ({
        symbol,
        price: priceCache[symbol]?.price || 0,
        timestamp: priceCache[symbol]?.timestamp || 0,
      }));
    } catch (error: any) {
      console.error('Failed to fetch prices:', error.message);
      throw new Error(`Failed to fetch prices: ${error.message}`);
    }
  }

  /**
   * Get 24hr price change statistics
   */
  public async get24hPriceChange(symbol: string): Promise<{
    symbol: string;
    priceChange: number;
    priceChangePercent: number;
    weightedAvgPrice: number;
    prevClosePrice: number;
    lastPrice: number;
    lastQty: number;
    bidPrice: number;
    bidQty: number;
    askPrice: number;
    askQty: number;
    openPrice: number;
    highPrice: number;
    lowPrice: number;
    volume: number;
    quoteVolume: number;
    openTime: number;
    closeTime: number;
    firstId: number;
    lastId: number;
    count: number;
  }> {
    try {
      const url = `${this.baseUrl}/v3/ticker/24hr`;
      const response = await axios.get(url, {
        params: { symbol },
      });

      if (!response.data) {
        throw new Error(`Failed to get 24h price change for ${symbol}`);
      }

      const data = response.data;
      
      // Convert string values to numbers
      return {
        symbol: data.symbol,
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        weightedAvgPrice: parseFloat(data.weightedAvgPrice),
        prevClosePrice: parseFloat(data.prevClosePrice),
        lastPrice: parseFloat(data.lastPrice),
        lastQty: parseFloat(data.lastQty),
        bidPrice: parseFloat(data.bidPrice),
        bidQty: parseFloat(data.bidQty),
        askPrice: parseFloat(data.askPrice),
        askQty: parseFloat(data.askQty),
        openPrice: parseFloat(data.openPrice),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
        openTime: data.openTime,
        closeTime: data.closeTime,
        firstId: data.firstId,
        lastId: data.lastId,
        count: data.count,
      };
    } catch (error: any) {
      console.error(`Failed to fetch 24h price change for ${symbol}:`, error.message);
      throw new Error(`Failed to fetch 24h price change for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get historical kline data (candlesticks)
   */
  public async getKlines(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit = 500
  ): Promise<{
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
    quoteAssetVolume: number;
    trades: number;
    takerBuyBaseAssetVolume: number;
    takerBuyQuoteAssetVolume: number;
  }[]> {
    try {
      const url = `${this.baseUrl}/v3/klines`;
      const params: Record<string, any> = {
        symbol,
        interval,
        limit,
      };

      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;

      const response = await axios.get(url, { params });

      if (!response.data) {
        throw new Error(`Failed to get klines for ${symbol}`);
      }

      return response.data.map((kline: any[]) => ({
        openTime: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        closeTime: kline[6],
        quoteAssetVolume: parseFloat(kline[7]),
        trades: kline[8],
        takerBuyBaseAssetVolume: parseFloat(kline[9]),
        takerBuyQuoteAssetVolume: parseFloat(kline[10]),
      }));
    } catch (error: any) {
      console.error(`Failed to fetch klines for ${symbol}:`, error.message);
      throw new Error(`Failed to fetch klines for ${symbol}: ${error.message}`);
    }
  }
}

// Export singleton instance
export const priceService = new PriceService();