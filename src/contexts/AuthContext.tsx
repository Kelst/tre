import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn, signOut, useSession } from 'next-auth/react';
import axios from 'axios';
import { User, AuthResponse } from '@/types/user';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string; password: string; name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (token: string, password: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    // Update user from session
    if (session?.user) {
      setUser(session.user as any);
      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [session]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      // Redirect to dashboard after successful login
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: { email: string; password: string; name?: string }) => {
    try {
      setLoading(true);
      setError(null);

      // Register the user
      const response = await axios.post<AuthResponse>('/api/auth/register', userData);
      
      // Auto-login after registration
      await signIn('credentials', {
        redirect: false,
        email: userData.email,
        password: userData.password,
      });

      // Redirect to dashboard after successful registration
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut({ redirect: false });
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post('/api/auth/reset-password', { email });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset password email');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (token: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post('/api/auth/update-password', { token, password });
      
      // Redirect to login page after password update
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        resetPassword,
        updatePassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};