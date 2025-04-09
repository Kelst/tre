export enum ExchangeName {
    BINANCE = 'BINANCE',
    // Can be expanded with other exchanges later
  }
  
  export type CryptoPair = {
    base: string;
    quote: string;
  }
  
  export type CryptoSymbol = string; // Format: "BTCUSDT"
  
  export type PriceData = {
    symbol: CryptoSymbol;
    price: number;
    timestamp: number;
  }
  
  export type OrderSide = 'BUY' | 'SELL';
  
  export type OrderType = 'MARKET' | 'LIMIT';
  
  export type OrderTimeInForce = 'GTC' | 'IOC' | 'FOK';
  
  export type Order = {
    symbol: CryptoSymbol;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    price?: number;
    timeInForce?: OrderTimeInForce;
  }
  
  export type OrderResponse = {
    orderId: string;
    symbol: CryptoSymbol;
    status: OrderStatus;
    price: number;
    origQty: number;
    executedQty: number;
    cummulativeQuoteQty: number;
    createdAt: Date;
  }
  
  export type OrderStatus = 
    | 'NEW'
    | 'PARTIALLY_FILLED'
    | 'FILLED'
    | 'CANCELED'
    | 'PENDING_CANCEL'
    | 'REJECTED'
    | 'EXPIRED';
  
  export type DCAStrategy = {
    _id?: string;
    userId: string;
    name: string;
    symbol: CryptoSymbol;
    amount: number;
    interval: DCAInterval;
    isActive: boolean;
    startDate: Date;
    lastExecuted?: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export enum DCAInterval {
    HOURLY = 'HOURLY',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY'
  }
  
  export type BalanceInfo = {
    asset: string;
    free: number;
    locked: number;
    total: number;
  }
  
  export type ExchangeCredentials = {
    apiKey: string;
    secretKey: string;
  }
  
  export type MarketInfo = {
    symbol: CryptoSymbol;
    baseAsset: string;
    quoteAsset: string;
    minNotional: number;
    minQty: number;
    stepSize: number;
    tickSize: number;
  }
  
  export type DCAExecutionLog = {
    _id?: string;
    strategyId: string;
    userId: string;
    symbol: CryptoSymbol;
    amount: number;
    price: number;
    quantity: number;
    orderId: string;
    status: 'SUCCESS' | 'FAILED';
    error?: string;
    executedAt: Date;
  }