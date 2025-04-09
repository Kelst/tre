import { NextApiResponse } from 'next';
import { connectToDatabase } from '@/models';
import { dcaService } from '@/services/crypto/dca';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import { DCAStrategy } from '@/types/crypto';
import { VALIDATION } from '@/config/constants';

/**
 * API handler for DCA strategies
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Connect to database
    await connectToDatabase();

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Handle different request methods
    switch (req.method) {
      case 'GET':
        return await handleGetStrategies(userId, res);
      case 'POST':
        return await handleCreateStrategy(userId, req.body, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('DCA strategies API error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

/**
 * Handle GET request to fetch user's DCA strategies
 */
async function handleGetStrategies(userId: string, res: NextApiResponse) {
  const strategies = await dcaService.getUserStrategies(userId);
  return res.status(200).json({ strategies });
}

/**
 * Handle POST request to create a new DCA strategy
 */
async function handleCreateStrategy(
  userId: string,
  data: Partial<DCAStrategy>,
  res: NextApiResponse
) {
  // Check max strategies per user limit
  const userStrategies = await dcaService.getUserStrategies(userId);
  if (userStrategies.length >= VALIDATION.DCA_MAX_STRATEGIES_PER_USER) {
    return res.status(400).json({
      message: `Maximum ${VALIDATION.DCA_MAX_STRATEGIES_PER_USER} strategies allowed per user`,
    });
  }

  // Validate minimum amount
  if (data.amount && data.amount < VALIDATION.DCA_MIN_AMOUNT) {
    return res.status(400).json({
      message: `Minimum amount is ${VALIDATION.DCA_MIN_AMOUNT}`,
    });
  }

  // Create strategy with user ID
  const strategy = await dcaService.createStrategy({
    ...data,
    userId,
    startDate: new Date(),
  });

  return res.status(201).json({ strategy });
}

export default withAuth(handler);