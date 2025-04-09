import mongoose, { Schema } from 'mongoose';
import { DCAStrategy, DCAInterval } from '@/types/crypto';

const DCAStrategySchema = new Schema<DCAStrategy>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    interval: {
      type: String,
      enum: Object.values(DCAInterval),
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastExecuted: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create index for fast querying of active strategies
DCAStrategySchema.index({ isActive: 1, interval: 1, lastExecuted: 1 });

// Create model if it doesn't exist, otherwise use the existing one
export const DCAStrategyModel = mongoose.models.DCAStrategy || 
  mongoose.model<DCAStrategy>('DCAStrategy', DCAStrategySchema);