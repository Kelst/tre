import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { UserSession } from '@/types/user';

const secret = process.env.NEXTAUTH_SECRET;

/**
 * Interface for extended request with user information
 */
export interface AuthenticatedRequest extends NextApiRequest {
  user?: UserSession;
}

/**
 * Middleware to verify authentication
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) {
  try {
    // Get token from request
    const token = await getToken({ req, secret });

    // No token, unauthorized
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Add user to request
    req.user = token as UserSession;

    // Continue to handler
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

/**
 * Factory function to create a protected API handler
 */
export function withAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    return new Promise<void>((resolve) => {
      authMiddleware(req, res, () => {
        return handler(req, res)
          .then(() => resolve())
          .catch((error) => {
            console.error('API handler error:', error);
            res.status(500).json({ message: 'Internal server error' });
            resolve();
          });
      });
    });
  };
}