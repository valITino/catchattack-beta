import { logger } from './logger';

/**
 * Custom error class that includes HTTP status code and operational status
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: Record<string, any>;

  constructor(
    message: string, 
    statusCode: number = 500, 
    isOperational: boolean = true,
    code?: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    
    // Ensure the correct prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capture stack trace for debugging
    Error.captureStackTrace(this, this.constructor);

    // Log the error when it's created
    logger.error(`AppError: ${message}`, {
      statusCode,
      isOperational,
      code,
      details,
      stack: this.stack
    });
  }
}

/**
 * Create common error types for consistent error handling
 */
export const ErrorTypes = {
  BAD_REQUEST: (message: string, details?: Record<string, any>) => 
    new AppError(message, 400, true, 'BAD_REQUEST', details),
  
  UNAUTHORIZED: (message: string = 'Unauthorized access') => 
    new AppError(message, 401, true, 'UNAUTHORIZED'),
  
  FORBIDDEN: (message: string = 'Access forbidden') => 
    new AppError(message, 403, true, 'FORBIDDEN'),
  
  NOT_FOUND: (message: string = 'Resource not found') => 
    new AppError(message, 404, true, 'NOT_FOUND'),
  
  VALIDATION_ERROR: (message: string, details?: Record<string, any>) => 
    new AppError(message, 422, true, 'VALIDATION_ERROR', details),
  
  CONFLICT: (message: string, details?: Record<string, any>) => 
    new AppError(message, 409, true, 'CONFLICT', details),
  
  INTERNAL_ERROR: (message: string = 'Internal server error', details?: Record<string, any>) => 
    new AppError(message, 500, false, 'INTERNAL_ERROR', details),
  
  EXTERNAL_API_ERROR: (message: string, details?: Record<string, any>) => 
    new AppError(message, 502, false, 'EXTERNAL_API_ERROR', details)
};

/**
 * Handler for async functions to catch errors
 * @param fn Function to wrap with try/catch
 */
export function catchAsync<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      // If it's already an AppError, just throw it
      if (error instanceof AppError) {
        throw error;
      }
      
      // Otherwise wrap it in an AppError
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      logger.error(`Uncaught error in async function: ${message}`, error);
      throw ErrorTypes.INTERNAL_ERROR(message, { originalError: error });
    }
  }) as T;
}

/**
 * Format error object for consistent API responses
 * @param error Error object
 * @returns Formatted error response
 */
export const formatErrorResponse = (error: unknown): {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, any>;
} => {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details
    };
  }
  
  // Handle unexpected errors
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  logger.error(`Unhandled error: ${message}`, error);
  
  return {
    status: 500,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };
};
