
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG } from '@/config/config';
import { logger } from '@/utils/logger';

/**
 * Enhanced API client built on Axios with improved error handling,
 * request/response interceptors, and retry capabilities.
 */
class ApiClient {
  private client: AxiosInstance;
  private retryDelay: number = 1000; // ms
  
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseUrl,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  /**
   * Configure request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Add tenant ID if available
        const tenantId = localStorage.getItem('tenant_id');
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }
        
        // Log the request
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, { 
          headers: config.headers,
          params: config.params,
          // Redact sensitive data from body if needed
          data: config.data ? '(request data)' : undefined
        });
        
        return config;
      },
      (error) => {
        logger.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log successful response
        logger.debug(`API Response: ${response.status} ${response.config.url}`, {
          status: response.status,
          statusText: response.statusText,
          // Log data length rather than full data to avoid bloating logs
          dataSize: response.data ? JSON.stringify(response.data).length : 0
        });
        
        return response;
      },
      async (error: AxiosError) => {
        // Handle response errors
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          logger.error(`API Error ${error.response.status}: ${error.config?.url || 'unknown'}`, {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers,
          });
          
          // Handle authentication errors
          if (error.response.status === 401) {
            // Redirect to login or refresh token
            // For now, just log it
            logger.warn('Authentication error, redirecting to login...');
            // window.location.href = '/login';
          }
          
          // Retry logic for 5xx errors
          if (error.response.status >= 500 && error.config && !error.config['_isRetry']) {
            return this.retryRequest(error);
          }
        } else if (error.request) {
          // The request was made but no response was received
          logger.error('API No Response Error', {
            request: error.request,
            message: error.message
          });
        } else {
          // Something happened in setting up the request that triggered an Error
          logger.error('API Request Setup Error', {
            message: error.message,
            stack: error.stack
          });
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Retry a failed request with exponential backoff
   * @param error The original axios error
   * @returns Promise with the retry attempt
   */
  private async retryRequest(error: AxiosError): Promise<AxiosResponse> {
    const config = error.config;
    
    if (!config) {
      return Promise.reject(error);
    }
    
    // Set retry count
    config['_retryCount'] = config['_retryCount'] || 0;
    config['_retryCount'] += 1;
    config['_isRetry'] = true;
    
    // Check if we've maxed out the retries
    if (config['_retryCount'] >= API_CONFIG.retryAttempts) {
      logger.error(`Max retries reached for ${config.url}`, {
        retries: config['_retryCount']
      });
      return Promise.reject(error);
    }
    
    // Exponential backoff
    const delay = this.retryDelay * Math.pow(2, config['_retryCount'] - 1);
    logger.info(`Retrying request to ${config.url} (${config['_retryCount']}/${API_CONFIG.retryAttempts}) after ${delay}ms`);
    
    // Wait for the delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Return the retry request
    return this.client(config);
  }
  
  /**
   * Make a GET request
   * @param url The endpoint URL
   * @param params URL parameters
   * @returns Promise with response data
   */
  async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }
  
  /**
   * Make a POST request
   * @param url The endpoint URL
   * @param data Request body data
   * @returns Promise with response data
   */
  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }
  
  /**
   * Make a PUT request
   * @param url The endpoint URL
   * @param data Request body data
   * @returns Promise with response data
   */
  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }
  
  /**
   * Make a PATCH request
   * @param url The endpoint URL
   * @param data Request body data
   * @returns Promise with response data
   */
  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }
  
  /**
   * Make a DELETE request
   * @param url The endpoint URL
   * @param params URL parameters
   * @returns Promise with response data
   */
  async delete<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.client.delete<T>(url, { params });
    return response.data;
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Export default for convenience
export default apiClient;
