import { 
    DCAStrategy, 
    DCAInterval, 
    DCAExecutionLog,
    Order,
    OrderType,
    OrderSide
  } from '@/types/crypto';
  import { DCA_INTERVALS } from '@/config/constants';
  import { 
    DCAStrategyModel, 
    ExecutionLogModel 
  } from '@/models';
  import { getExchangeService } from './exchanges';
  import { priceService } from './price';
  
  /**
   * Service for managing DCA strategies
   */
  export class DCAService {
    /**
     * Create a new DCA strategy
     */
    public async createStrategy(strategy: Omit<DCAStrategy, '_id' | 'createdAt' | 'updatedAt'>): Promise<DCAStrategy> {
      try {
        // Validate the strategy
        this.validateStrategy(strategy);
  
        // Create the strategy in database
        const newStrategy = await DCAStrategyModel.create(strategy);
        return newStrategy.toJSON();
      } catch (error: any) {
        console.error('Failed to create DCA strategy:', error.message);
        throw error;
      }
    }
  
    /**
     * Get DCA strategy by ID
     */
    public async getStrategyById(id: string): Promise<DCAStrategy | null> {
      try {
        const strategy = await DCAStrategyModel.findById(id);
        return strategy ? strategy.toJSON() : null;
      } catch (error: any) {
        console.error(`Failed to get DCA strategy with ID ${id}:`, error.message);
        throw error;
      }
    }
  
    /**
     * Get all DCA strategies for a user
     */
    public async getUserStrategies(userId: string): Promise<DCAStrategy[]> {
      try {
        const strategies = await DCAStrategyModel.find({ userId });
        return strategies.map(strategy => strategy.toJSON());
      } catch (error: any) {
        console.error(`Failed to get DCA strategies for user ${userId}:`, error.message);
        throw error;
      }
    }
  
    /**
     * Update an existing DCA strategy
     */
    public async updateStrategy(
      id: string,
      userId: string,
      updates: Partial<DCAStrategy>
    ): Promise<DCAStrategy | null> {
      try {
        // Remove fields that shouldn't be updated
        const { _id, userId: _, createdAt, updatedAt, ...validUpdates } = updates;
  
        // Update the strategy in database
        const strategy = await DCAStrategyModel.findOneAndUpdate(
          { _id: id, userId },
          validUpdates,
          { new: true }
        );
  
        return strategy ? strategy.toJSON() : null;
      } catch (error: any) {
        console.error(`Failed to update DCA strategy with ID ${id}:`, error.message);
        throw error;
      }
    }
  
    /**
     * Delete a DCA strategy
     */
    public async deleteStrategy(id: string, userId: string): Promise<boolean> {
      try {
        const result = await DCAStrategyModel.deleteOne({ _id: id, userId });
        return result.deletedCount === 1;
      } catch (error: any) {
        console.error(`Failed to delete DCA strategy with ID ${id}:`, error.message);
        throw error;
      }
    }
  
    /**
     * Toggle DCA strategy active state
     */
    public async toggleStrategyActive(
      id: string,
      userId: string,
      isActive: boolean
    ): Promise<DCAStrategy | null> {
      try {
        const strategy = await DCAStrategyModel.findOneAndUpdate(
          { _id: id, userId },
          { isActive },
          { new: true }
        );
  
        return strategy ? strategy.toJSON() : null;
      } catch (error: any) {
        console.error(`Failed to toggle DCA strategy with ID ${id}:`, error.message);
        throw error;
      }
    }
  
    /**
     * Find strategies that need to be executed
     */
    public async findStrategiesToExecute(): Promise<DCAStrategy[]> {
      try {
        const now = new Date();
        
        // Find active strategies that need execution
        const strategies = await DCAStrategyModel.find({
          isActive: true,
          $or: [
            // Never executed
            { lastExecuted: { $exists: false } },
            // HOURLY strategies
            {
              interval: DCAInterval.HOURLY,
              lastExecuted: { $lt: new Date(now.getTime() - DCA_INTERVALS.HOURLY) }
            },
            // DAILY strategies
            {
              interval: DCAInterval.DAILY,
              lastExecuted: { $lt: new Date(now.getTime() - DCA_INTERVALS.DAILY) }
            },
            // WEEKLY strategies
            {
              interval: DCAInterval.WEEKLY,
              lastExecuted: { $lt: new Date(now.getTime() - DCA_INTERVALS.WEEKLY) }
            },
            // MONTHLY strategies
            {
              interval: DCAInterval.MONTHLY,
              lastExecuted: { $lt: new Date(now.getTime() - DCA_INTERVALS.MONTHLY) }
            }
          ]
        });
  
        return strategies.map(strategy => strategy.toJSON());
      } catch (error: any) {
        console.error('Failed to find strategies to execute:', error.message);
        throw error;
      }
    }
  
    /**
     * Execute a DCA strategy
     */
    public async executeStrategy(strategy: DCAStrategy): Promise<DCAExecutionLog> {
      try {
        // Get the current price
        const priceData = await priceService.getCurrentPrice(strategy.symbol);
        
        // Calculate quantity based on amount and price
        const quantity = strategy.amount / priceData.price;
        
        // Get the exchange service
        const exchangeService = getExchangeService('BINANCE');
        
        // Get market info to ensure our quantity is valid
        const marketInfo = await exchangeService.getMarketInfo(strategy.symbol);
        
        // Round quantity to respect step size
        const stepSize = marketInfo.stepSize;
        const precision = Math.log10(1 / stepSize);
        const roundedQuantity = Math.floor(quantity * 10 ** precision) / 10 ** precision;
        
        // Check min notional
        const notional = roundedQuantity * priceData.price;
        if (notional < marketInfo.minNotional) {
          throw new Error(`Order notional ${notional} is less than minimum notional ${marketInfo.minNotional}`);
        }
        
        // Create order
        const order: Order = {
          symbol: strategy.symbol,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          quantity: roundedQuantity
        };
        
        // Place order
        const orderResponse = await exchangeService.placeOrder(strategy.userId, order);
        
        // Update strategy last executed time
        await DCAStrategyModel.updateOne(
          { _id: strategy._id },
          { lastExecuted: new Date() }
        );
        
        // Create execution log
        const executionLog: Omit<DCAExecutionLog, '_id'> = {
          strategyId: strategy._id!,
          userId: strategy.userId,
          symbol: strategy.symbol,
          amount: strategy.amount,
          price: priceData.price,
          quantity: roundedQuantity,
          orderId: orderResponse.orderId,
          status: 'SUCCESS',
          executedAt: new Date()
        };
        
        const log = await ExecutionLogModel.create(executionLog);
        return log.toJSON();
      } catch (error: any) {
        console.error(`Failed to execute DCA strategy ${strategy._id}:`, error.message);
        
        // Create failed execution log
        const executionLog: Omit<DCAExecutionLog, '_id'> = {
          strategyId: strategy._id!,
          userId: strategy.userId,
          symbol: strategy.symbol,
          amount: strategy.amount,
          price: 0,
          quantity: 0,
          orderId: '0',
          status: 'FAILED',
          error: error.message,
          executedAt: new Date()
        };
        
        const log = await ExecutionLogModel.create(executionLog);
        return log.toJSON();
      }
    }
  
    /**
     * Get execution logs for a strategy
     */
    public async getStrategyExecutionLogs(
      strategyId: string,
      userId: string,
      limit = 50,
      offset = 0
    ): Promise<DCAExecutionLog[]> {
      try {
        const logs = await ExecutionLogModel.find({ strategyId, userId })
          .sort({ executedAt: -1 })
          .skip(offset)
          .limit(limit);
  
        return logs.map(log => log.toJSON());
      } catch (error: any) {
        console.error(`Failed to get execution logs for strategy ${strategyId}:`, error.message);
        throw error;
      }
    }
  
    /**
     * Get user execution logs
     */
    public async getUserExecutionLogs(
      userId: string,
      limit = 50,
      offset = 0
    ): Promise<DCAExecutionLog[]> {
      try {
        const logs = await ExecutionLogModel.find({ userId })
          .sort({ executedAt: -1 })
          .skip(offset)
          .limit(limit);
  
        return logs.map(log => log.toJSON());
      } catch (error: any) {
        console.error(`Failed to get execution logs for user ${userId}:`, error.message);
        throw error;
      }
    }
  
    /**
     * Validate DCA strategy
     */
    private validateStrategy(strategy: Partial<DCAStrategy>): void {
      // Check required fields
      if (!strategy.userId) throw new Error('User ID is required');
      if (!strategy.name) throw new Error('Strategy name is required');
      if (!strategy.symbol) throw new Error('Symbol is required');
      if (!strategy.amount) throw new Error('Amount is required');
      if (!strategy.interval) throw new Error('Interval is required');
  
      // Check amount
      if (strategy.amount <= 0) throw new Error('Amount must be greater than 0');
  
      // Check interval
      if (!Object.values(DCAInterval).includes(strategy.interval as DCAInterval)) {
        throw new Error('Invalid interval');
      }
    }
  }
  
  // Export singleton instance
  export const dcaService = new DCAService();