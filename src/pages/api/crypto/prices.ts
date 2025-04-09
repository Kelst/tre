import { NextApiRequest, NextApiResponse } from 'next';
import { priceService } from '@/services/crypto/price';
import { SUPPORTED_CRYPTO_PAIRS } from '@/config/constants';

/**
 * API handler for cryptocurrency prices
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
    const { symbols, symbol } = req.query;

    // Handle single symbol case
    if (symbol && typeof symbol === 'string') {
      const priceData = await priceService.getCurrentPrice(symbol);
      return res.status(200).json({ price: priceData });
    }

    // Handle multiple symbols case
    let symbolsArray: string[];
    
    if (symbols && typeof symbols === 'string') {
      symbolsArray = symbols.split(',');
    } else if (Array.isArray(symbols)) {
      symbolsArray = symbols;
    } else {
      // Default to supported pairs if no symbols provided
      symbolsArray = SUPPORTED_CRYPTO_PAIRS;
    }

    // Validate symbols
    const validSymbols = symbolsArray.filter(s => s.trim().length > 0);
    
    if (validSymbols.length === 0) {
      return res.status(400).json({ message: 'No valid symbols provided' });
    }

    // Fetch prices for symbols
    const prices = await priceService.getPrices(validSymbols);

    return res.status(200).json({ prices });
  } catch (error: any) {
    console.error('Prices API error:', error);
    return res.status(500).json({ message: error.message || 'Failed to fetch prices' });
  }
}