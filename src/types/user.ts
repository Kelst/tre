import { ExchangeCredentials } from './crypto';

export type User = {
  _id?: string;
  email: string;
  name?: string;
  password: string; // Will be hashed
  role: UserRole;
  isEmailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export type UserSession = {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export type AuthResponse = {
  user: Omit<User, 'password' | 'verificationToken' | 'resetPasswordToken' | 'resetPasswordExpires'>;
  token: string;
}

export type ExchangeAccount = {
  _id?: string;
  userId: string;
  name: string;
  exchange: string;
  credentials: ExchangeCredentials;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ApiKey = {
  _id?: string;
  userId: string;
  name: string;
  key: string;
  secret: string;
  permissions: ApiKeyPermission[];
  createdAt: Date;
  updatedAt: Date;
}

export enum ApiKeyPermission {
  READ = 'READ',
  TRADE = 'TRADE',
  WITHDRAW = 'WITHDRAW'
}