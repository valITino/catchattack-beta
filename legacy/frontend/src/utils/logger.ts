
/**
 * Enhanced logger utility for consistent logging with additional functionality
 * Designed to be a TypeScript-friendly replacement for a proper logger like Winston
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type MetaData = Record<string, any> | undefined;

interface ILogger {
  debug(message: string, meta?: MetaData): void;
  info(message: string, meta?: MetaData): void;
  warn(message: string, meta?: MetaData): void;
  error(message: string, error?: Error | string | MetaData): void;
  setLevel(level: LogLevel): void;
  getStackTrace(): string;
}

class Logger implements ILogger {
  private logLevel: LogLevel = 'info';
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor() {
    // Initialize with environment-specific settings
    if (process.env.NODE_ENV === 'development') {
      this.logLevel = 'debug';
    }
  }

  /**
   * Set the minimum log level to display
   * @param level - The minimum log level
   */
  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log a debug message
   * @param message - The message to log
   * @param meta - Optional metadata to include
   */
  debug(message: string, meta?: MetaData): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('DEBUG', message), meta ? meta : '');
    }
  }

  /**
   * Log an info message
   * @param message - The message to log
   * @param meta - Optional metadata to include
   */
  info(message: string, meta?: MetaData): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('INFO', message), meta ? meta : '');
    }
  }

  /**
   * Log a warning message
   * @param message - The message to log
   * @param meta - Optional metadata to include
   */
  warn(message: string, meta?: MetaData): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('WARN', message), meta ? meta : '');
    }
  }

  /**
   * Log an error message with optional error object
   * @param message - The error message
   * @param error - Optional error object or additional metadata
   */
  error(message: string, error?: Error | string | MetaData): void {
    if (this.shouldLog('error')) {
      const formattedMessage = this.formatMessage('ERROR', message);
      
      if (error instanceof Error) {
        console.error(formattedMessage, { 
          message: error.message, 
          stack: error.stack,
          name: error.name
        });
      } else {
        console.error(formattedMessage, error ? error : '');
      }
      
      // In a production environment, this could send errors to a monitoring service
      if (process.env.NODE_ENV === 'production') {
        this.sendToErrorMonitoring(message, error);
      }
    }
  }

  /**
   * Get the current stack trace
   * @returns String representation of the stack trace
   */
  getStackTrace(): string {
    const error = new Error();
    return error.stack || '';
  }

  /**
   * Format a log message with timestamp and level
   * @param level - The log level
   * @param message - The message to format
   * @returns Formatted message
   */
  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  /**
   * Determine if a message should be logged based on current log level
   * @param messageLevel - The level of the message
   * @returns Boolean indicating whether to log
   */
  private shouldLog(messageLevel: LogLevel): boolean {
    return this.levels[messageLevel] >= this.levels[this.logLevel];
  }

  /**
   * Send error to monitoring service (placeholder)
   * @param message - Error message
   * @param error - Error details
   */
  private sendToErrorMonitoring(message: string, error?: Error | string | MetaData): void {
    // Placeholder for error monitoring service integration
    // Example implementation would be:
    // errorMonitoringService.captureException({message, error});
  }
}

// Export singleton instance
export const logger = new Logger();

// Default export for convenience
export default logger;
