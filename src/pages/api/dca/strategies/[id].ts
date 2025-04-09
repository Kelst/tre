import { NextApiResponse } from 'next';
import { connectToDatabase } from '@/models';
import { dcaService } from '@/services/crypto/dca';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import { DCAStrategy } from '@/types/crypto';

/**
 * API handler for DCA strategy by ID
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Connect to database
    await connectToDatabase();

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid strategy ID' });
    }

    // Handle different request methods
    switch (req.method) {
      case 'GET':
        return await handleGetStrategy(id, userId, res);
      case 'PUT':
        return await handleUpdateStrategy(id, userId, req.body, res);
      case 'DELETE':
        return await handleDeleteStrategy(id, userId, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('DCA strategy API error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

/**
 * Handle GET request to fetch a DCA strategy by ID
 */
async function handleGetStrategy(id: string, userId: string, res: NextApiResponse) {
  const strategy = await dcaService.getStrategyById(id);

  if (!strategy) {
    return res.status(404).json({ message: 'Strategy not found' });
  }

  // Check if user owns the strategy
  if (strategy.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return res.status(200).json({ strategy });
}

/**
 * Handle PUT request to update a DCA strategy
 */
async function handleUpdateStrategy(
  id: string,
  userId: string,
  data: Partial<DCAStrategy>,
  res: NextApiResponse
) {
  const updatedStrategy = await dcaService.updateStrategy(id, userId, data);

  if (!updatedStrategy) {
    return res.status(404).json({ message: 'Strategy not found' });
  }

  return res.status(200).json({ strategy: updatedStrategy });
}

/**
 * Handle DELETE request to delete a DCA strategy
 */
async function handleDeleteStrategy(id: string, userId: string, res: NextApiResponse) {
  const deleted = await dcaService.deleteStrategy(id, userId);

  if (!deleted) {
    return res.status(404).json({ message: 'Strategy not found' });
  }

  return res.status(200).json({ message: 'Strategy deleted successfully' });
}

export default withAuth(handler);