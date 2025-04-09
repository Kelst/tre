import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/models';
import { executeDueStrategies } from '@/bot/strategies/basic-dca';

/**
 * API handler for triggering DCA bot execution
 * This should be protected by an API key or secret in production
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Only allow POST method
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // API key authentication
    const apiKey = req.headers['x-api-key'];
    const configuredApiKey = process.env.BOT_API_KEY;

    if (!apiKey || apiKey !== configuredApiKey) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Connect to database
    await connectToDatabase();

    // Execute due strategies
    await executeDueStrategies();

    return res.status(200).json({ message: 'Execution triggered successfully' });
  } catch (error: any) {
    console.error('Bot execution API error:', error);
    return res.status(500).json({ message: error.message || 'Execution failed' });
  }
}