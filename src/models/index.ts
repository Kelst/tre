import mongoose from 'mongoose';
import { MONGODB_URI } from '@/config/constants';

let isConnected = false;

/**
 * Connect to MongoDB
 */
export const connectToDatabase = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = !!db.connections[0].readyState;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export * from './user.model';
export * from './dcaStrategy.model';
export * from './exchangeAccount.model';
export * from './executionLog.model';