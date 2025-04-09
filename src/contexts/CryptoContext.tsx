import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { 
  DCAStrategy, 
  DCAExecutionLog, 
  PriceData, 
  BalanceInfo, 
  ExchangeName,
  MarketInfo,
  ExchangeCredentials
} from '@/types/crypto';
import { SUPPORTED_CRYPTO_PAIRS } from '@/config/constants';
import { fetchWithAuth } from '@/services/api/client';

interface CryptoContextType {
  // DCA strategies
  strategies: DCAStrategy[];
  loadingStrategies: boolean;
  fetchStrategies: () => Promise<void>;
  createStrategy: (strategy: Partial<DCAStrategy>) => Promise<DCAStrategy>;
  updateStrategy: (id: string, updates: Partial<DCAStrategy>) => Promise<DCAStrategy | null>;
  deleteStrategy: (id: string) => Promise<boolean>;
  toggleStrategyActive: (id: string, isActive: boolean) => Promise<DCAStrategy | null>;
  
  // Execution logs
  executionLogs: DCAExecutionLog[];
  loadingLogs: boolean;
  fetchExecutionLogs: (strategyId?: string) => Promise<void>;
  
  // Prices
  prices: Record<string, PriceData>;
  loadingPrices: boolean;
  fetchPrices: (symbols?: string[]) => Promise<void>;
  
  // Balances
  balances: Record<string, BalanceInfo>;
  loadingBalances: boolean;
  fetchBalance: (asset: string) => Promise<void>;
  
  // Market info
  marketInfo: Record<string, MarketInfo>;
  loadingMarketInfo: boolean;
  fetchMarketInfo: (symbol: string) => Promise<void>;
  
  // Exchange accounts
  addExchangeAccount: (name: string, exchange: ExchangeName, credentials: ExchangeCredentials) => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // DCA Strategies state
  const [strategies, setStrategies] = useState<DCAStrategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState<boolean>(false);
  
  // Execution logs state
  const [executionLogs, setExecutionLogs] = useState<DCAExecutionLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  
  // Prices state
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loadingPrices, setLoadingPrices] = useState<boolean>(false);
  
  // Balances state
  const [balances, setBalances] = useState<Record<string, BalanceInfo>>({});
  const [loadingBalances, setLoadingBalances] = useState<boolean>(false);
  
  // Market info state
  const [marketInfo, setMarketInfo] = useState<Record<string, MarketInfo>>({});
  const [loadingMarketInfo, setLoadingMarketInfo] = useState<boolean>(false);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Initialize
  useEffect(() => {
    if (user) {
      fetchStrategies();
      fetchPrices();
    }
  }, [user]);

  // Fetch user's DCA strategies
  const fetchStrategies = async () => {
    if (!user) return;
    
    try {
      setLoadingStrategies(true);
      const response = await fetchWithAuth<{ strategies: DCAStrategy[] }>('/api/dca/strategies');
      setStrategies(response.strategies);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch DCA strategies');
    } finally {
      setLoadingStrategies(false);
    }
  };

  // Create a new DCA strategy
  const createStrategy = async (strategy: Partial<DCAStrategy>): Promise<DCAStrategy> => {
    try {
      const response = await fetchWithAuth<{ strategy: DCAStrategy }>('/api/dca/strategies', {
        method: 'POST',
        data: strategy,
      });
      
      // Update strategies list
      setStrategies(prev => [...prev, response.strategy]);
      
      return response.strategy;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create DCA strategy');
      throw err;
    }
  };

  // Update an existing DCA strategy
  const updateStrategy = async (id: string, updates: Partial<DCAStrategy>): Promise<DCAStrategy | null> => {
    try {
      const response = await fetchWithAuth<{ strategy: DCAStrategy }>(`/api/dca/strategies/${id}`, {
        method: 'PUT',
        data: updates,
      });
      
      // Update strategies list
      setStrategies(prev => 
        prev.map(s => s._id === id ? response.strategy : s)
      );
      
      return response.strategy;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update DCA strategy');
      throw err;
    }
  };

  // Delete a DCA strategy
  const deleteStrategy = async (id: string): Promise<boolean> => {
    try {
      await fetchWithAuth(`/api/dca/strategies/${id}`, {
        method: 'DELETE',
      });
      
      // Update strategies list
      setStrategies(prev => prev.filter(s => s._id !== id));
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete DCA strategy');
      throw err;
    }
  };

  // Toggle DCA strategy active status
  const toggleStrategyActive = async (id: string, isActive: boolean): Promise<DCAStrategy | null> => {
    try {
      const response = await fetchWithAuth<{ strategy: DCAStrategy }>(`/api/dca/strategies/${id}/toggle`, {
        method: 'PUT',
        data: { isActive },
      });
      
      // Update strategies list
      setStrategies(prev => 
        prev.map(s => s._id === id ? response.strategy : s)
      );
      
      return response.strategy;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle DCA strategy status');
      throw err;
    }
  };

  // Fetch execution logs
  const fetchExecutionLogs = async (strategyId?: string) => {
    if (!user) return;
    
    try {
      setLoadingLogs(true);
      
      const url = strategyId 
        ? `/api/dca/logs?strategyId=${strategyId}` 
        : '/api/dca/logs';
      
      const response = await fetchWithAuth<{ logs: DCAExecutionLog[] }>(url);
      setExecutionLogs(response.logs);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch execution logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch cryptocurrency prices
  const fetchPrices = async (symbols: string[] = SUPPORTED_CRYPTO_PAIRS) => {
    try {
      setLoadingPrices(true);
      
      const response = await axios.get<{ prices: PriceData[] }>('/api/crypto/prices', {
        params: { symbols: symbols.join(',') },
      });
      
      const pricesMap: Record<string, PriceData> = {};
      response.data.prices.forEach(price => {
        pricesMap[price.symbol] = price;
      });
      
      setPrices(pricesMap);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch prices');
    } finally {
      setLoadingPrices(false);
    }
  };

  // Fetch balance for a specific asset
  const fetchBalance = async (asset: string) => {
    if (!user) return;
    
    try {
      setLoadingBalances(true);
      
      const response = await fetchWithAuth<{ balance: BalanceInfo }>(
        `/api/crypto/balance?asset=${asset}`
      );
      
      setBalances(prev => ({
        ...prev,
        [asset]: response.balance,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch balance');
    } finally {
      setLoadingBalances(false);
    }
  };

  // Fetch market info for a specific symbol
  const fetchMarketInfo = async (symbol: string) => {
    try {
      setLoadingMarketInfo(true);
      
      const response = await axios.get<{ marketInfo: MarketInfo }>(
        `/api/crypto/market-info?symbol=${symbol}`
      );
      
      setMarketInfo(prev => ({
        ...prev,
        [symbol]: response.marketInfo,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch market info');
    } finally {
      setLoadingMarketInfo(false);
    }
  };

  // Add exchange account
  const addExchangeAccount = async (
    name: string,
    exchange: ExchangeName,
    credentials: ExchangeCredentials
  ) => {
    if (!user) return;
    
    try {
      await fetchWithAuth('/api/crypto/exchange-accounts', {
        method: 'POST',
        data: { name, exchange, credentials },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add exchange account');
      throw err;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <CryptoContext.Provider
      value={{
        // DCA strategies
        strategies,
        loadingStrategies,
        fetchStrategies,
        createStrategy,
        updateStrategy,
        deleteStrategy,
        toggleStrategyActive,
        
        // Execution logs
        executionLogs,
        loadingLogs,
        fetchExecutionLogs,
        
        // Prices
        prices,
        loadingPrices,
        fetchPrices,
        
        // Balances
        balances,
        loadingBalances,
        fetchBalance,
        
        // Market info
        marketInfo,
        loadingMarketInfo,
        fetchMarketInfo,
        
        // Exchange accounts
        addExchangeAccount,
        
        // Error handling
        error,
        clearError,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => {
  const context = useContext(CryptoContext);
  if (context === undefined) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
};