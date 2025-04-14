
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import { API_BASE_URL } from '@/config/config';

/**
 * Creates a configured Axios instance for API calls
 */
const createApiClient = (baseURL: string = API_BASE_URL): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
  });

  // Request interceptor for adding auth token
  client.interceptors.request.use(
    (config) => {
      // Get token from local storage or other auth state management
      const token = localStorage.getItem('auth_token');
      
      // If token exists, add to headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      logger.error('Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for centralized error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const statusCode = error.response?.status;
      const errorResponse = error.response?.data as any;
      const errorMessage = errorResponse?.message || error.message;
      
      // Log error
      logger.error(`API Error (${statusCode}): ${errorMessage}`, error);
      
      // Handle different error types
      switch (statusCode) {
        case 401:
          // Unauthorized - authentication issue
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please login again.",
            variant: "destructive",
          });
          // Could also redirect to login page or trigger auth refresh
          break;
          
        case 403:
          // Forbidden - permission issue
          toast({
            title: "Access Denied",
            description: "You don't have permission to perform this action.",
            variant: "destructive",
          });
          break;
          
        case 404:
          // Not found
          toast({
            title: "Resource Not Found",
            description: errorMessage || "The requested resource was not found.",
            variant: "destructive",
          });
          break;
          
        case 422:
          // Validation errors
          toast({
            title: "Validation Error",
            description: errorMessage || "Please check your input and try again.",
            variant: "destructive",
          });
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          toast({
            title: "Server Error",
            description: "We're experiencing issues. Please try again later.",
            variant: "destructive",
          });
          break;
          
        default:
          // Generic error
          if (!axios.isCancel(error)) {
            toast({
              title: "Error",
              description: errorMessage || "Something went wrong. Please try again.",
              variant: "destructive",
            });
          }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Export a default instance
export const apiClient = createApiClient();

// Export the factory function for cases where a custom base URL is needed
export default createApiClient;
