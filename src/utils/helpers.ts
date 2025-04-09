/**
 * Format number with specified decimal places
 */
export function formatNumber(value: number, decimals = 2): string {
    return value.toFixed(decimals);
  }
  
  /**
   * Format currency with symbol
   */
  export function formatCurrency(value: number, currency = 'USD', decimals = 2): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
  
  /**
   * Format date to locale string
   */
  export function formatDate(date: Date | string | number): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  /**
   * Format interval to human-readable string
   */
  export function formatInterval(interval: string): string {
    switch (interval) {
      case 'HOURLY':
        return 'Every hour';
      case 'DAILY':
        return 'Every day';
      case 'WEEKLY':
        return 'Every week';
      case 'MONTHLY':
        return 'Every month';
      default:
        return interval;
    }
  }
  
  /**
   * Calculate percentage change
   */
  export function calculatePercentageChange(
    currentValue: number,
    previousValue: number
  ): number {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }
  
  /**
   * Truncate string with ellipsis
   */
  export function truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }
  
  /**
   * Validate email format
   */
  export function isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  /**
   * Validate password strength
   */
  export function isStrongPassword(password: string): boolean {
    // At least 8 characters, contain at least 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
  }
  
  /**
   * Sleep for specified milliseconds
   */
  export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Retry a function with exponential backoff
   */
  export async function retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000,
    backoff = 2
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      await sleep(delay);
      return retry(fn, retries - 1, delay * backoff, backoff);
    }
  }
  
  /**
   * Generate a random API key
   */
  export function generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }