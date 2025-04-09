import cron from 'node-cron';
import { connectToDatabase } from '@/models';
import { executeDueStrategies } from './strategies/basic-dca';

/**
 * Initialize cron jobs for DCA bot
 */
export function initCronJobs() {
  // Run every minute to check for due strategies
  cron.schedule('* * * * *', async () => {
    try {
      console.log('Running DCA bot cron job...');
      
      // Connect to database
      await connectToDatabase();
      
      // Execute due strategies
      await executeDueStrategies();
      
      console.log('DCA bot cron job completed');
    } catch (error) {
      console.error('Error in DCA bot cron job:', error);
    }
  });

  console.log('DCA bot cron jobs initialized');
}