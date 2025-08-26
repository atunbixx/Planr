import { configService } from '@/lib/config/config.service'

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Structured log entry interface
 */
export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  service?: string
  operation?: string
  userId?: string
  requestId?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableStructured: boolean
  maskSensitiveData: boolean
}

/**
 * Structured logger service
 * Provides consistent logging across the application with context and sensitive data masking
 */
class Logger {
  private static instance: Logger
  private config: LoggerConfig
  private requestId: string | null = null

  private constructor() {
    // Initialize with default configuration
    this.config = this.getDefaultConfig()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * Set request ID for correlation
   */
  public setRequestId(requestId: string): void {
    this.requestId = requestId
  }

  /**
   * Clear request ID
   */
  public clearRequestId(): void {
    this.requestId = null
  }

  /**
   * Log debug message
   */
  public debug(message: string, context?: Record<string, any>, service?: string, operation?: string): void {
    this.log(LogLevel.DEBUG, message, context, service, operation)
  }

  /**
   * Log info message
   */
  public info(message: string, context?: Record<string, any>, service?: string, operation?: string): void {
    this.log(LogLevel.INFO, message, context, service, operation)
  }

  /**
   * Log warning message
   */
  public warn(message: string, context?: Record<string, any>, service?: string, operation?: string): void {
    this.log(LogLevel.WARN, message, context, service, operation)
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error, context?: Record<string, any>, service?: string, operation?: string): void {
    const errorContext = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: this.config.enableStructured ? error.stack : undefined,
      }
    } : undefined

    const combinedContext = { ...context, ...errorContext }
    this.log(LogLevel.ERROR, message, combinedContext, service, operation)
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    service?: string,
    operation?: string,
    userId?: string
  ): void {
    // Skip if log level is below configured threshold
    if (level < this.config.level) {
      return
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.config.maskSensitiveData ? this.maskSensitiveData(context) : context,
      service,
      operation,
      userId,
      requestId: this.requestId || undefined,
    }

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry)
    }

    // In production, you might want to send to external logging service
    if (this.config.enableStructured && configService.isProduction()) {
      this.outputStructured(logEntry)
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level]
    const prefix = `[${entry.timestamp}] ${levelName}`
    const suffix = entry.service ? ` (${entry.service}${entry.operation ? `::${entry.operation}` : ''})` : ''
    
    const logMessage = `${prefix} ${entry.message}${suffix}`
    
    // Use appropriate console method based on level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, entry.context || '')
        break
      case LogLevel.INFO:
        console.info(logMessage, entry.context || '')
        break
      case LogLevel.WARN:
        console.warn(logMessage, entry.context || '')
        break
      case LogLevel.ERROR:
        console.error(logMessage, entry.context || '', entry.error || '')
        break
    }
  }

  /**
   * Output structured log entry (for external services)
   */
  private outputStructured(entry: LogEntry): void {
    // In a real application, this would send to services like:
    // - DataDog, New Relic, CloudWatch, etc.
    // For now, we'll just output as JSON
    console.log(JSON.stringify(entry))
  }

  /**
   * Mask sensitive data in context
   */
  private maskSensitiveData(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return context

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization',
      'email', 'phone', 'phoneNumber', 'creditCard', 'ssn'
    ]

    const masked = { ...context }

    const maskValue = (obj: any, path: string[] = []): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj
      }

      if (Array.isArray(obj)) {
        return obj.map((item, index) => maskValue(item, [...path, index.toString()]))
      }

      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = [...path, key]
        const fieldName = key.toLowerCase()
        
        // Check if this field should be masked
        const shouldMask = sensitiveFields.some(sensitive => 
          fieldName.includes(sensitive) || 
          fieldName.endsWith(sensitive) ||
          sensitive.includes(fieldName)
        )

        if (shouldMask && typeof value === 'string') {
          // Mask email addresses partially
          if (fieldName.includes('email') && value.includes('@')) {
            const [local, domain] = value.split('@')
            result[key] = `${local.substring(0, 2)}***@${domain}`
          }
          // Mask phone numbers partially
          else if (fieldName.includes('phone') && value.length > 4) {
            result[key] = `***${value.slice(-4)}`
          }
          // Mask other sensitive fields completely
          else {
            result[key] = '***MASKED***'
          }
        } else {
          result[key] = maskValue(value, currentPath)
        }
      }
      return result
    }

    return maskValue(masked)
  }

  /**
   * Get default logger configuration
   */
  private getDefaultConfig(): LoggerConfig {
    try {
      const env = configService.getEnvironment()
      
      return {
        level: env === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
        enableConsole: true,
        enableStructured: env === 'production',
        maskSensitiveData: env === 'production',
      }
    } catch {
      // Fallback if config service not initialized
      return {
        level: LogLevel.INFO,
        enableConsole: true,
        enableStructured: false,
        maskSensitiveData: true,
      }
    }
  }

  /**
   * Update logger configuration
   */
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  public getConfig(): LoggerConfig {
    return { ...this.config }
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Export types
export type { LoggerConfig }