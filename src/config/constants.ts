// MongoDB Configuration
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongoAdmin:45199trv@194.8.147.138:27017/mydatabase?authSource=admin';
export const DB_NAME = process.env.DB_NAME || 'tra';

// Binance API Configuration
export const BINANCE_API_URL = 'https://testnet.binance.vision/api';
export const BINANCE_API_KEY = process.env.BINANCE_API_KEY || 'idYWuNtxBk2tjAwMhYVC9JyQ4gCUKT49XYcRgO65fw66uPE3QEUqJne9J5nO5lZn';
export const BINANCE_SECRET_KEY = process.env.BINANCE_SECRET_KEY || 'i3wvKcMDT9IZcvpjmMNlI5EB96r33wVLrVhZoHMuSMvzDBheqaG4vMiZKYVhHkdK';

// Application Configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// DCA Bot Configuration
export const DCA_EXECUTION_INTERVAL = 60 * 1000; // 1 minute in milliseconds

// API Rate Limits
export const API_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
export const API_RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per window

// Supported Cryptocurrency Pairs
export const SUPPORTED_CRYPTO_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'ADAUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'DOTUSDT',
  'AVAXUSDT',
  'MATICUSDT'
];

// DCA Intervals (milliseconds)
export const DCA_INTERVALS = {
  HOURLY: 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid or expired token',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this operation',
  EXCHANGE_ERROR: 'Error communicating with exchange',
  STRATEGY_NOT_FOUND: 'DCA strategy not found',
  INVALID_STRATEGY: 'Invalid DCA strategy configuration',
  EXECUTION_FAILED: 'Strategy execution failed'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Registration successful',
  LOGIN_SUCCESS: 'Login successful',
  PASSWORD_RESET_EMAIL: 'Password reset email sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  STRATEGY_CREATED: 'DCA strategy created successfully',
  STRATEGY_UPDATED: 'DCA strategy updated successfully',
  STRATEGY_DELETED: 'DCA strategy deleted successfully',
  ORDER_PLACED: 'Order placed successfully'
};

// Validation Constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  DCA_MIN_AMOUNT: 10,
  DCA_MAX_STRATEGIES_PER_USER: 10
};