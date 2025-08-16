/**
 * Centralized Logging Service
 * Provides environment-aware logging with proper production handling
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  module?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private isServer: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isServer = typeof window === 'undefined';
    
    // Set log level based on environment
    const configuredLevel = process.env.LOG_LEVEL?.toUpperCase();
    this.logLevel = this.isDevelopment 
      ? LogLevel.DEBUG 
      : LogLevel[configuredLevel as keyof typeof LogLevel] || LogLevel.INFO;
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log(LogLevel.ERROR, message, context, errorObj);
  }

  /**
   * Log a fatal error message
   */
  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log(LogLevel.FATAL, message, context, errorObj);
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Skip if below configured log level
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      stack: error?.stack,
    };

    // Add to buffer
    this.addToBuffer(entry);

    // In development, log to console
    if (this.isDevelopment) {
      this.logToConsole(entry);
    }

    // In production, send to logging service
    if (!this.isDevelopment && this.isServer) {
      this.sendToLoggingService(entry);
    }
  }

  /**
   * Log to console in development
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${LogLevel[entry.level]}] ${entry.timestamp}`;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix}: ${entry.message}${contextStr}`);
        break;
      case LogLevel.INFO:
        console.info(`${prefix}: ${entry.message}${contextStr}`);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix}: ${entry.message}${contextStr}`);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(`${prefix}: ${entry.message}${contextStr}`, entry.error);
        break;
    }
  }

  /**
   * Send logs to external service in production
   */
  private async sendToLoggingService(entry: LogEntry): Promise<void> {
    // In production, you would send to a service like Sentry, LogRocket, etc.
    // For now, we'll just store in buffer and could batch send
    
    // Example integration point:
    // if (process.env.ERROR_TRACKING_DSN && entry.level >= LogLevel.ERROR) {
    //   await sendToSentry(entry);
    // }
    
    // For critical errors, we might want to write to a file or database
    if (entry.level >= LogLevel.ERROR) {
      // Could implement file logging or database logging here
      this.writeToErrorLog(entry);
    }
  }

  /**
   * Write critical errors to error log
   */
  private writeToErrorLog(entry: LogEntry): void {
    // In a real implementation, this would write to a file or database
    // For now, we'll just ensure it's in the buffer
    if (this.isServer) {
      // Server-side error logging
      // Could use fs.appendFile or a database write here
    }
  }

  /**
   * Add entry to buffer
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Keep buffer size limited
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count = 10): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Create a child logger with preset context
   */
  child(context: LogContext): ContextualLogger {
    return new ContextualLogger(this, context);
  }
}

/**
 * Contextual logger that includes preset context
 */
class ContextualLogger {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  debug(message: string, additionalContext?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...additionalContext });
  }

  info(message: string, additionalContext?: LogContext): void {
    this.parent.info(message, { ...this.context, ...additionalContext });
  }

  warn(message: string, additionalContext?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...additionalContext });
  }

  error(message: string, error?: Error | unknown, additionalContext?: LogContext): void {
    this.parent.error(message, error, { ...this.context, ...additionalContext });
  }

  fatal(message: string, error?: Error | unknown, additionalContext?: LogContext): void {
    this.parent.fatal(message, error, { ...this.context, ...additionalContext });
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | unknown, context?: LogContext) => 
    logger.error(message, error, context),
  fatal: (message: string, error?: Error | unknown, context?: LogContext) => 
    logger.fatal(message, error, context),
};

// Helper to create module-specific loggers
export function createLogger(module: string): ContextualLogger {
  return logger.child({ module });
}