import { NextApiResponse } from 'next';
import { connectToDatabase, ExchangeAccountModel } from '@/models';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import { ExchangeAccount } from '@/types/user';

/**
 * API handler for exchange accounts
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
        return await handleGetAccounts(userId, res);
      case 'POST':
        return await handleCreateAccount(userId, req.body, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Exchange accounts API error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

/**
 * Handle GET request to fetch user's exchange accounts
 */
async function handleGetAccounts(userId: string, res: NextApiResponse) {
  const accounts = await ExchangeAccountModel.find({ userId });
  
  // Don't expose API keys in response
  const safeAccounts = accounts.map(account => {
    const accountObj = account.toJSON();
    return {
      ...accountObj,
      credentials: {
        apiKey: '********',
        secretKey: '********',
      },
    };
  });

  return res.status(200).json({ accounts: safeAccounts });
}

/**
 * Handle POST request to create a new exchange account
 */
async function handleCreateAccount(
  userId: string,
  data: Partial<ExchangeAccount>,
  res: NextApiResponse
) {
  // Validate input
  if (!data.name || !data.exchange) {
    return res.status(400).json({ message: 'Name and exchange are required' });
  }

  if (!data.credentials || !data.credentials.apiKey || !data.credentials.secretKey) {
    return res.status(400).json({ message: 'API key and secret key are required' });
  }

  // Create new account
  const newAccount = await ExchangeAccountModel.create({
    userId,
    name: data.name,
    exchange: data.exchange,
    credentials: {
      apiKey: data.credentials.apiKey,
      secretKey: data.credentials.secretKey,
    },
    isActive: true,
  });

  // Don't expose API keys in response
  const safeAccount = {
    ...newAccount.toJSON(),
    credentials: {
      apiKey: '********',
      secretKey: '********',
    },
  };

  return res.status(201).json({ account: safeAccount });
}

export default withAuth(handler);