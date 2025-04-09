import mongoose, { Schema } from 'mongoose';
import { DCAExecutionLog } from '@/types/crypto';

const ExecutionLogSchema = new Schema<DCAExecutionLog>(
  {
    strategyId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    orderId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: true,
    },
    error: {
      type: String,
    },
    executedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create indexes for faster queries
ExecutionLogSchema.index({ executedAt: -1 });
ExecutionLogSchema.index({ userId: 1, executedAt: -1 });

// Create model if it doesn't exist, otherwise use the existing one
export const ExecutionLogModel = mongoose.models.ExecutionLog ||
  mongoose.model<DCAExecutionLog>('ExecutionLog', ExecutionLogSchema);