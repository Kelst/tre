import axios from 'axios';
import crypto from 'crypto';
import { 
  BINANCE_API_URL, 
  BINANCE_API_KEY, 
  BINANCE_SECRET_KEY 
} from '@/config/constants';
import { 
  Order, 
  OrderResponse, 
  BalanceInfo, 
  MarketInfo,
  ExchangeCredentials
} from '@/types/crypto';
import { ExchangeAccountModel } from '@/models';

/**
 * Generate signature for Binance API requests
 */
const generateBinanceSignature = (data: string, secretKey: string): string => {
  return crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('hex');
};

/**
 * Create a timestamp for Binance API requests
 */
const getTimestamp = (): number => {
  return Date.now();
};

/**
 * Base class for crypto exchange integrations
 */
export abstract class ExchangeService {
  abstract getBalance(userId: string, asset: string): Promise<BalanceInfo>;
  abstract placeOrder(userId: string, order: Order): Promise<OrderResponse>;
  abstract getMarketInfo(symbol: string): Promise<MarketInfo>;
}

/**
 * Binance exchange implementation
 */
export class BinanceExchangeService extends ExchangeService {
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;

  constructor(credentials?: ExchangeCredentials) {
    super();
    this.apiKey = credentials?.apiKey || BINANCE_API_KEY;
    this.secretKey = credentials?.secretKey || BINANCE_SECRET_KEY;
    this.baseUrl = BINANCE_API_URL;
  }

  /**
   * Get user credentials from database
   */
  private async getUserCredentials(userId: string): Promise<ExchangeCredentials> {
    const account = await ExchangeAccountModel.findOne({ 
      userId, 
      exchange: 'BINANCE',
      isActive: true 
    });

    if (!account) {
      throw new Error('No active Binance account found for this user');
    }

    return account.credentials;
  }

  /**
   * Make a signed request to Binance API
   */
  private async makeSignedRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    params: Record<string, any> = {},
    userId?: string
  ): Promise<T> {
    // If userId is provided, get credentials from database
    if (userId) {
      const credentials = await this.getUserCredentials(userId);
      this.apiKey = credentials.apiKey;
      this.secretKey = credentials.secretKey;
    }

    // Add timestamp to params
    const timestamp = getTimestamp();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: timestamp.toString(),
    });

    // Generate signature
    const signature = generateBinanceSignature(
      queryParams.toString(),
      this.secretKey
    );
    queryParams.append('signature', signature);

    // Make request
    const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;
    const response = await axios({
      method,
      url,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
      },
    });

    return response.data;
  }

  /**
   * Make a public request to Binance API
   */
  private async makePublicRequest<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    const queryParams = new URLSearchParams(params);
    const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;
    
    const response = await axios.get(url);
    return response.data;
  }

  /**
   * Get account balance for a specific asset
   */
  public async getBalance(userId: string, asset: string): Promise<BalanceInfo> {
    const data = await this.makeSignedRequest<any>(
      '/v3/account',
      'GET',
      {},
      userId
    );

    const balance = data.balances.find(
      (b: any) => b.asset === asset.toUpperCase()
    );

    if (!balance) {
      throw new Error(`Balance for ${asset} not found`);
    }

    return {
      asset: balance.asset,
      free: parseFloat(balance.free),
      locked: parseFloat(balance.locked),
      total: parseFloat(balance.free) + parseFloat(balance.locked),
    };
  }

  /**
   * Place an order on Binance
   */
  public async placeOrder(userId: string, order: Order): Promise<OrderResponse> {
    const params: Record<string, any> = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity.toString(),
    };

    // Add optional parameters
    if (order.price) {
      params.price = order.price.toString();
    }

    if (order.timeInForce) {
      params.timeInForce = order.timeInForce;
    } else if (order.type === 'LIMIT') {
      params.timeInForce = 'GTC'; // Good Till Canceled
    }

    const response = await this.makeSignedRequest<any>(
      '/v3/order',
      'POST',
      params,
      userId
    );

    return {
      orderId: response.orderId,
      symbol: response.symbol,
      status: response.status,
      price: parseFloat(response.price || '0'),
      origQty: parseFloat(response.origQty),
      executedQty: parseFloat(response.executedQty),
      cummulativeQuoteQty: parseFloat(response.cummulativeQuoteQty || '0'),
      createdAt: new Date(response.transactTime),
    };
  }

  /**
   * Get market information (exchange info) for a symbol
   */
  public async getMarketInfo(symbol: string): Promise<MarketInfo> {
    const data = await this.makePublicRequest<any>('/v3/exchangeInfo', {
      symbol,
    });

    const symbolInfo = data.symbols[0];
    if (!symbolInfo) {
      throw new Error(`Symbol ${symbol} not found`);
    }

    // Extract min notional, min quantity, step size, tick size
    const filters = symbolInfo.filters;
    const lotSizeFilter = filters.find((f: any) => f.filterType === 'LOT_SIZE');
    const priceFilter = filters.find((f: any) => f.filterType === 'PRICE_FILTER');
    const minNotionalFilter = filters.find((f: any) => f.filterType === 'MIN_NOTIONAL');

    return {
      symbol: symbolInfo.symbol,
      baseAsset: symbolInfo.baseAsset,
      quoteAsset: symbolInfo.quoteAsset,
      minNotional: parseFloat(minNotionalFilter?.minNotional || '0'),
      minQty: parseFloat(lotSizeFilter?.minQty || '0'),
      stepSize: parseFloat(lotSizeFilter?.stepSize || '0'),
      tickSize: parseFloat(priceFilter?.tickSize || '0'),
    };
  }
}

/**
 * Factory function to get exchange service
 */
export const getExchangeService = (
  exchange: string,
  credentials?: ExchangeCredentials
): ExchangeService => {
  switch (exchange.toUpperCase()) {
    case 'BINANCE':
      return new BinanceExchangeService(credentials);
    default:
      throw new Error(`Unsupported exchange: ${exchange}`);
  }
};