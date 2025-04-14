
/**
 * Custom error class that includes HTTP status code
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    // Ensure the correct prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capture stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handler for async route functions to catch errors
 * @param fn Route handler function
 */
export const catchAsync = (fn: Function) => {
  return function(...args: any[]) {
    const next = args[args.length - 1];
    fn(...args).catch(next);
  };
};

/**
 * Centralized error handler for formatting error responses
 * @param error The error object
 */
export const formatErrorResponse = (error: any) => {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      message: error.message,
      isOperational: error.isOperational
    };
  }
  
  // Default error response for unexpected errors
  return {
    status: 500,
    message: 'Internal server error',
    isOperational: false
  };
};
