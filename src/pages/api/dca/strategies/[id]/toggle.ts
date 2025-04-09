import { NextApiResponse } from 'next';
import { connectToDatabase } from '@/models';
import { dcaService } from '@/services/crypto/dca';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';

/**
 * API handler for toggling DCA strategy active state
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

    // Only allow PUT method
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    // Toggle strategy active state
    const strategy = await dcaService.toggleStrategyActive(id, userId, isActive);

    if (!strategy) {
      return res.status(404).json({ message: 'Strategy not found' });
    }

    return res.status(200).json({ strategy });
  } catch (error: any) {
    console.error('DCA strategy toggle API error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

export default withAuth(handler);