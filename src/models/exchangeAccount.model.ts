import mongoose, { Schema } from 'mongoose';
import { ExchangeAccount } from '@/types/user';
import crypto from 'crypto';

// Encryption/decryption helpers for API keys
const algorithm = 'aes-256-ctr';
const secretKey = process.env.ENCRYPTION_KEY || 'your-encryption-key-should-be-in-env';
const iv = crypto.randomBytes(16);

const encrypt = (text: string): string => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (hash: string): string => {
  const [ivHex, content] = hash.split(':');
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(ivHex, 'hex')
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(content, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString();
};

const ExchangeAccountSchema = new Schema<ExchangeAccount>(
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
    exchange: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    credentials: {
      apiKey: {
        type: String,
        required: true,
        set: encrypt,
        get: decrypt,
      },
      secretKey: {
        type: String,
        required: true,
        set: encrypt,
        get: decrypt,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      getters: true,
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create model if it doesn't exist, otherwise use the existing one
export const ExchangeAccountModel = mongoose.models.ExchangeAccount ||
  mongoose.model<ExchangeAccount>('ExchangeAccount', ExchangeAccountSchema);