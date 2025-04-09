import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';

/**
 * Create an Axios instance with base configuration
 */
const createApiClient = (baseURL?: string): AxiosInstance => {
  const client = axios.create({
    baseURL: baseURL || '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to attach JWT token
  client.interceptors.request.use(async (config) => {
    try {
      const session = await getSession();
      if (session?.user?.token) {
        config.headers.Authorization = `Bearer ${session.user.token}`;
      }
      return config;
    } catch (error) {
      return config;
    }
  });

  // Response interceptor to handle common errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle common errors
      if (error.response) {
        // Session expired or unauthorized
        if (error.response.status === 401) {
          console.error('Unauthorized access. Please log in again.');
          // You might want to redirect to login page or refresh token here
        }

        // Rate limiting
        if (error.response.status === 429) {
          console.error('Rate limit exceeded. Please try again later.');
        }

        // Server error
        if (error.response.status >= 500) {
          console.error('Server error. Please try again later.');
        }
      } else if (error.request) {
        console.error('Network error. Please check your connection.');
      }

      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Make authenticated API call
 */
export const fetchWithAuth = async <T>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const client = createApiClient();
  const response = await client(url, config);
  return response.data;
};

export default createApiClient;