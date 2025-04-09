import { NextApiRequest, NextApiResponse } from 'next';
import { getExchangeService } from '@/services/crypto/exchanges';

/**
 * API handler for market information
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Only allow GET method
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // Parse query parameters
    const { symbol, exchange = 'BINANCE' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ message: 'Symbol is required' });
    }

    // Get the exchange service
    const exchangeService = getExchangeService(exchange as string);

    // Fetch market info
    const marketInfo = await exchangeService.getMarketInfo(symbol);

    return res.status(200).json({ marketInfo });
  } catch (error: any) {
    console.error('Market info API error:', error);
    return res.status(500).json({ message: error.message || 'Failed to fetch market info' });
  }
}