import { 
    DCAStrategy, 
    DCAInterval, 
    OrderType, 
    OrderSide, 
    Order 
  } from '@/types/crypto';
  import { dcaService } from '@/services/crypto/dca';
  import { priceService } from '@/services/crypto/price';
  import { getExchangeService } from '@/services/crypto/exchanges';
  import { DCA_INTERVALS } from '@/config/constants';
  import { DCAStrategyModel, ExecutionLogModel } from '@/models';
  
  /**
   * Basic DCA Strategy Implementation
   * This strategy simply executes periodic purchases at specified intervals.
   */
  export class BasicDCAStrategy {
    /**
     * Check if a strategy is due for execution
     */
    public isReadyToExecute(strategy: DCAStrategy): boolean {
      // If strategy is not active, don't execute
      if (!strategy.isActive) {
        return false;
      }
  
      const now = new Date();
      const startDate = new Date(strategy.startDate);
  
      // If start date is in the future, don't execute
      if (startDate > now) {
        return false;
      }
  
      // If strategy has never been executed, it's ready
      if (!strategy.lastExecuted) {
        return true;
      }
  
      const lastExecuted = new Date(strategy.lastExecuted);
      let intervalMs: number;
  
      // Get interval in milliseconds
      switch (strategy.interval) {
        case DCAInterval.HOURLY:
          intervalMs = DCA_INTERVALS.HOURLY;
          break;
        case DCAInterval.DAILY:
          intervalMs = DCA_INTERVALS.DAILY;
          break;
        case DCAInterval.WEEKLY:
          intervalMs = DCA_INTERVALS.WEEKLY;
          break;
        case DCAInterval.MONTHLY:
          intervalMs = DCA_INTERVALS.MONTHLY;
          break;
        default:
          throw new Error(`Invalid interval: ${strategy.interval}`);
      }
  
      // Check if enough time has passed since last execution
      return now.getTime() - lastExecuted.getTime() >= intervalMs;
    }
  
    /**
     * Execute the strategy
     */
    public async execute(strategy: DCAStrategy): Promise<boolean> {
      try {
        // If strategy is not ready to execute, skip
        if (!this.isReadyToExecute(strategy)) {
          return false;
        }
  
        // Execute through the DCA service
        await dcaService.executeStrategy(strategy);
        
        return true;
      } catch (error) {
        console.error(`Error executing DCA strategy ${strategy._id}:`, error);
        return false;
      }
    }
  
    /**
     * Calculate optimal buy quantity based on market conditions
     * For basic DCA, we simply divide amount by current price
     */
    public async calculateBuyQuantity(
      symbol: string,
      amount: number
    ): Promise<number> {
      try {
        // Get current price
        const priceData = await priceService.getCurrentPrice(symbol);
        
        // Get market info to enforce constraints
        const exchangeService = getExchangeService('BINANCE');
        const marketInfo = await exchangeService.getMarketInfo(symbol);
        
        // Calculate quantity
        let quantity = amount / priceData.price;
        
        // Apply step size (lot size) constraints
        const stepSize = marketInfo.stepSize;
        const precision = Math.log10(1 / stepSize);
        quantity = Math.floor(quantity * 10 ** precision) / 10 ** precision;
        
        // Check minimum quantity
        if (quantity < marketInfo.minQty) {
          throw new Error(`Calculated quantity ${quantity} is less than minimum quantity ${marketInfo.minQty}`);
        }
        
        // Check minimum notional value
        const notional = quantity * priceData.price;
        if (notional < marketInfo.minNotional) {
          throw new Error(`Order notional ${notional} is less than minimum notional ${marketInfo.minNotional}`);
        }
        
        return quantity;
      } catch (error) {
        console.error(`Error calculating buy quantity for ${symbol}:`, error);
        throw error;
      }
    }
  
    /**
     * Prepare an order based on the strategy
     */
    public async prepareOrder(strategy: DCAStrategy): Promise<Order> {
      try {
        // Calculate buy quantity
        const quantity = await this.calculateBuyQuantity(
          strategy.symbol,
          strategy.amount
        );
        
        // Create order
        const order: Order = {
          symbol: strategy.symbol,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          quantity,
        };
        
        return order;
      } catch (error) {
        console.error(`Error preparing order for strategy ${strategy._id}:`, error);
        throw error;
      }
    }
  }
  
  /**
   * Main function to execute all due DCA strategies
   */
  export async function executeDueStrategies(): Promise<void> {
    try {
      // Find strategies that need to be executed
      const strategies = await dcaService.findStrategiesToExecute();
      
      if (strategies.length === 0) {
        console.log('No strategies due for execution');
        return;
      }
      
      console.log(`Found ${strategies.length} strategies due for execution`);
      
      // Execute each strategy
      const strategyExecutor = new BasicDCAStrategy();
      
      for (const strategy of strategies) {
        try {
          console.log(`Executing strategy ${strategy._id} (${strategy.name})`);
          await strategyExecutor.execute(strategy);
        } catch (error) {
          console.error(`Error executing strategy ${strategy._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error executing due strategies:', error);
    }
  }