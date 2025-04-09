import { NextApiResponse } from 'next';
import { connectToDatabase } from '@/models';
import { dcaService } from '@/services/crypto/dca';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';

/**
 * API handler for DCA execution logs
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Connect to database
    await connectToDatabase();

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only allow GET method
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // Parse query parameters
    const { strategyId, limit = '50', offset = '0' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    // Validate limit and offset
    if (isNaN(limitNum) || isNaN(offsetNum) || limitNum < 1 || offsetNum < 0) {
      return res.status(400).json({ message: 'Invalid limit or offset' });
    }

    // Fetch logs based on strategy ID or for all user strategies
    let logs;
    if (strategyId && typeof strategyId === 'string') {
      logs = await dcaService.getStrategyExecutionLogs(
        strategyId,
        userId,
        limitNum,
        offsetNum
      );
    } else {
      logs = await dcaService.getUserExecutionLogs(
        userId,
        limitNum,
        offsetNum
      );
    }

    return res.status(200).json({ logs });
  } catch (error: any) {
    console.error('DCA logs API error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

export default withAuth(handler);