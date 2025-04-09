import { NextApiResponse } from 'next';
import { getExchangeService } from '@/services/crypto/exchanges';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';

/**
 * API handler for cryptocurrency balance
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only allow GET method
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // Parse query parameters
    const { asset, exchange = 'BINANCE' } = req.query;

    if (!asset || typeof asset !== 'string') {
      return res.status(400).json({ message: 'Asset is required' });
    }

    // Get the exchange service
    const exchangeService = getExchangeService(exchange as string);

    // Fetch balance
    const balance = await exchangeService.getBalance(userId, asset);

    return res.status(200).json({ balance });
  } catch (error: any) {
    console.error('Balance API error:', error);
    return res.status(500).json({ message: error.message || 'Failed to fetch balance' });
  }
}

export default withAuth(handler);