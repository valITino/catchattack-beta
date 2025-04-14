
/**
 * Simple logger utility for consistent logging
 * This would ideally be replaced with a proper logger like Winston when integrating with a backend
 */
export const logger = {
  info: (message: string, meta?: any) => {
    console.info(`[INFO] ${message}`, meta ? meta : '');
  },
  
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta ? meta : '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error ? error : '');
    
    // In a production environment, this could send errors to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorMonitoring(message, error);
    }
  },
  
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, meta ? meta : '');
    }
  }
};

export default logger;
