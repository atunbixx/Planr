// API Request/Response Logger
interface LogEntry {
  timestamp: string
  method: string
  url: string
  status?: number
  duration?: number
  error?: any
  requestBody?: any
  responseBody?: any
  userId?: string
  sessionId?: string
}

class ApiLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logQueue: LogEntry[] = []
  private maxQueueSize = 100

  log(entry: Omit<LogEntry, 'timestamp'>) {
    if (!this.isDevelopment && !this.shouldLogInProduction(entry)) {
      return
    }

    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    }

    // In development, log to console
    if (this.isDevelopment) {
      this.logToConsole(logEntry)
    }

    // Add to queue for potential remote logging
    this.addToQueue(logEntry)
  }

  private shouldLogInProduction(entry: Omit<LogEntry, 'timestamp'>): boolean {
    // In production, only log errors and slow requests
    return (entry.status && entry.status >= 400) || (entry.duration && entry.duration > 3000)
  }

  private logToConsole(entry: LogEntry) {
    const { method, url, status, duration, error } = entry
    const emoji = this.getStatusEmoji(status)
    const color = this.getStatusColor(status)

    console.group(
      `%c${emoji} ${method} ${url}`,
      `color: ${color}; font-weight: bold;`
    )
    
    if (duration) {
      console.log(`⏱️ Duration: ${duration}ms`)
    }
    
    if (status) {
      console.log(`📊 Status: ${status}`)
    }
    
    if (entry.requestBody) {
      console.log('📤 Request:', entry.requestBody)
    }
    
    if (entry.responseBody) {
      console.log('📥 Response:', entry.responseBody)
    }
    
    if (error) {
      console.error('❌ Error:', error)
    }
    
    console.groupEnd()
  }

  private getStatusEmoji(status?: number): string {
    if (!status) return '🔄'
    if (status >= 200 && status < 300) return '✅'
    if (status >= 300 && status < 400) return '↪️'
    if (status >= 400 && status < 500) return '⚠️'
    return '❌'
  }

  private getStatusColor(status?: number): string {
    if (!status) return '#666'
    if (status >= 200 && status < 300) return '#4CAF50'
    if (status >= 300 && status < 400) return '#FF9800'
    if (status >= 400 && status < 500) return '#F44336'
    return '#B71C1C'
  }

  private addToQueue(entry: LogEntry) {
    this.logQueue.push(entry)
    
    // Prevent memory leaks
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue.shift()
    }
  }

  // Get logs for debugging
  getLogs(filter?: {
    startTime?: Date
    endTime?: Date
    status?: number
    method?: string
  }): LogEntry[] {
    let logs = [...this.logQueue]

    if (filter) {
      if (filter.startTime) {
        logs = logs.filter(log => new Date(log.timestamp) >= filter.startTime!)
      }
      if (filter.endTime) {
        logs = logs.filter(log => new Date(log.timestamp) <= filter.endTime!)
      }
      if (filter.status) {
        logs = logs.filter(log => log.status === filter.status)
      }
      if (filter.method) {
        logs = logs.filter(log => log.method === filter.method)
      }
    }

    return logs
  }

  // Clear logs
  clear() {
    this.logQueue = []
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logQueue, null, 2)
  }
}

export const apiLogger = new ApiLogger()