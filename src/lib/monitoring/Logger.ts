export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  coupleId?: string
  sessionId?: string
  requestId?: string
  performanceMetrics?: {
    duration?: number
    memoryUsage?: number
    queryCount?: number
  }
  stack?: string
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  maxEntries: number
  includeSensitive: boolean
}

export class Logger {
  private static instance: Logger
  private config: LoggerConfig
  private logs: LogEntry[] = []
  private sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /auth/i,
    /credential/i
  ]

  private constructor(config: LoggerConfig) {
    this.config = config
  }

  static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config || {
        level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
        enableConsole: true,
        enableFile: false,
        maxEntries: 10000,
        includeSensitive: false
      })
    }
    return Logger.instance
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    if (this.config.includeSensitive) return context
    
    const sanitized: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(context)) {
      const isSensitive = this.sensitivePatterns.some(pattern => 
        pattern.test(key) || (typeof value === 'string' && pattern.test(value))
      )
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value)
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      context: context ? this.sanitizeContext(context) : undefined,
      stack: error?.stack,
      performanceMetrics: {
        memoryUsage: process.memoryUsage().heapUsed,
        duration: context?.duration
      }
    }
  }

  private addToStorage(entry: LogEntry): void {
    this.logs.push(entry)
    
    // Maintain max entries limit
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries)
    }
  }

  private formatForConsole(entry: LogEntry): string {
    const levelName = LogLevel[entry.level]
    const timestamp = entry.timestamp.toISOString()
    const context = entry.context ? JSON.stringify(entry.context, null, 2) : ''
    
    let formatted = `[${timestamp}] ${levelName}: ${entry.message}`
    
    if (context) {
      formatted += `\nContext: ${context}`
    }
    
    if (entry.stack && entry.level >= LogLevel.ERROR) {
      formatted += `\nStack: ${entry.stack}`
    }
    
    return formatted
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context)
    this.addToStorage(entry)
    
    if (this.config.enableConsole) {
      console.debug(this.formatForConsole(entry))
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return
    
    const entry = this.createLogEntry(LogLevel.INFO, message, context)
    this.addToStorage(entry)
    
    if (this.config.enableConsole) {
      console.info(this.formatForConsole(entry))
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return
    
    const entry = this.createLogEntry(LogLevel.WARN, message, context)
    this.addToStorage(entry)
    
    if (this.config.enableConsole) {
      console.warn(this.formatForConsole(entry))
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error)
    this.addToStorage(entry)
    
    if (this.config.enableConsole) {
      console.error(this.formatForConsole(entry))
    }
  }

  critical(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.CRITICAL)) return
    
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context, error)
    this.addToStorage(entry)
    
    if (this.config.enableConsole) {
      console.error(`🚨 CRITICAL: ${this.formatForConsole(entry)}`)
    }
  }

  // Specialized logging methods
  logQuery(queryName: string, duration: number, success: boolean, context?: Record<string, any>): void {
    const level = success ? LogLevel.DEBUG : LogLevel.WARN
    const message = `Query ${queryName} ${success ? 'completed' : 'failed'} in ${duration}ms`
    
    const entry = this.createLogEntry(level, message, {
      ...context,
      queryName,
      duration,
      success,
      type: 'database_query'
    })
    
    this.addToStorage(entry)
    
    if (this.config.enableConsole && this.shouldLog(level)) {
      console.log(this.formatForConsole(entry))
    }
  }

  logApiCall(method: string, path: string, statusCode: number, duration: number, context?: Record<string, any>): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    const message = `${method} ${path} - ${statusCode} (${duration}ms)`
    
    const entry = this.createLogEntry(level, message, {
      ...context,
      method,
      path,
      statusCode,
      duration,
      type: 'api_call'
    })
    
    this.addToStorage(entry)
    
    if (this.config.enableConsole && this.shouldLog(level)) {
      console.log(this.formatForConsole(entry))
    }
  }

  logCacheOperation(operation: string, key: string, hit: boolean, context?: Record<string, any>): void {
    const message = `Cache ${operation} - ${key} (${hit ? 'HIT' : 'MISS'})`
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, {
      ...context,
      operation,
      key,
      hit,
      type: 'cache_operation'
    })
    
    this.addToStorage(entry)
    
    if (this.config.enableConsole && this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatForConsole(entry))
    }
  }

  logUserAction(userId: string, action: string, context?: Record<string, any>): void {
    const message = `User action: ${action}`
    
    const entry = this.createLogEntry(LogLevel.INFO, message, {
      ...context,
      userId,
      action,
      type: 'user_action'
    })
    
    this.addToStorage(entry)
    
    if (this.config.enableConsole && this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatForConsole(entry))
    }
  }

  // Query methods
  getLogs(filter?: {
    level?: LogLevel
    startTime?: Date
    endTime?: Date
    userId?: string
    type?: string
    limit?: number
  }): LogEntry[] {
    let filtered = this.logs
    
    if (filter) {
      if (filter.level !== undefined) {
        filtered = filtered.filter(log => log.level >= filter.level!)
      }
      
      if (filter.startTime) {
        filtered = filtered.filter(log => log.timestamp >= filter.startTime!)
      }
      
      if (filter.endTime) {
        filtered = filtered.filter(log => log.timestamp <= filter.endTime!)
      }
      
      if (filter.userId) {
        filtered = filtered.filter(log => log.userId === filter.userId)
      }
      
      if (filter.type) {
        filtered = filtered.filter(log => log.context?.type === filter.type)
      }
      
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit)
      }
    }
    
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getLogStats(): {
    totalLogs: number
    levelDistribution: Record<string, number>
    averageMemoryUsage: number
    recentErrors: number
  } {
    const levelDistribution = this.logs.reduce((acc, log) => {
      const levelName = LogLevel[log.level]
      acc[levelName] = (acc[levelName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const memoryUsages = this.logs
      .map(log => log.performanceMetrics?.memoryUsage)
      .filter((usage): usage is number => usage !== undefined)
    
    const averageMemoryUsage = memoryUsages.length > 0
      ? memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length
      : 0
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentErrors = this.logs.filter(log => 
      log.level >= LogLevel.ERROR && log.timestamp >= oneHourAgo
    ).length
    
    return {
      totalLogs: this.logs.length,
      levelDistribution,
      averageMemoryUsage,
      recentErrors
    }
  }

  clear(): void {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      config: this.config,
      stats: this.getLogStats(),
      logs: this.logs
    }, null, 2)
  }
}

// Export singleton instance
export const logger = Logger.getInstance()