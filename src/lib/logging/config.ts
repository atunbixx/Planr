import { LogLevel } from './logger'
import { configService } from '@/lib/config/config.service'

/**
 * Logging configuration based on environment
 */
export interface LoggingConfig {
  level: LogLevel
  enableConsole: boolean
  enableStructured: boolean
  maskSensitiveData: boolean
  enableRequestTracking: boolean
  enablePerformanceLogging: boolean
  enableErrorTracking: boolean
  services: {
    [serviceName: string]: {
      level?: LogLevel
      enabled: boolean
    }
  }
}

/**
 * Get logging configuration based on environment
 */
export function getLoggingConfig(): LoggingConfig {
  try {
    const env = configService.getEnvironment()
    
    const baseConfig: LoggingConfig = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStructured: false,
      maskSensitiveData: true,
      enableRequestTracking: true,
      enablePerformanceLogging: true,
      enableErrorTracking: true,
      services: {
        RSVPService: { enabled: true },
        MessagingService: { enabled: true },
        CreditRepository: { enabled: true },
        VendorService: { enabled: true },
        BudgetService: { enabled: true },
        AuthService: { enabled: true },
        DatabaseRepository: { enabled: true, level: LogLevel.WARN },
        MonitoringService: { enabled: true, level: LogLevel.INFO },
        ConfigService: { enabled: true },
      }
    }

    // Environment-specific overrides
    switch (env) {
      case 'development':
        return {
          ...baseConfig,
          level: LogLevel.DEBUG,
          enableStructured: false,
          maskSensitiveData: false,
          services: {
            ...baseConfig.services,
            DatabaseRepository: { enabled: true, level: LogLevel.DEBUG },
          }
        }

      case 'test':
        return {
          ...baseConfig,
          level: LogLevel.WARN,
          enableConsole: false,
          enableStructured: false,
          enableRequestTracking: false,
          enablePerformanceLogging: false,
          services: {
            ...baseConfig.services,
            DatabaseRepository: { enabled: false },
            MonitoringService: { enabled: false },
          }
        }

      case 'production':
        return {
          ...baseConfig,
          level: LogLevel.INFO,
          enableStructured: true,
          maskSensitiveData: true,
          services: {
            ...baseConfig.services,
            DatabaseRepository: { enabled: true, level: LogLevel.ERROR },
          }
        }

      default:
        return baseConfig
    }
  } catch {
    // Fallback configuration if config service is not available
    return {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStructured: false,
      maskSensitiveData: true,
      enableRequestTracking: true,
      enablePerformanceLogging: true,
      enableErrorTracking: true,
      services: {}
    }
  }
}

/**
 * Check if logging is enabled for a specific service
 */
export function isServiceLoggingEnabled(serviceName: string): boolean {
  const config = getLoggingConfig()
  const serviceConfig = config.services[serviceName]
  return serviceConfig?.enabled ?? true
}

/**
 * Get log level for a specific service
 */
export function getServiceLogLevel(serviceName: string): LogLevel {
  const config = getLoggingConfig()
  const serviceConfig = config.services[serviceName]
  return serviceConfig?.level ?? config.level
}

/**
 * Sensitive field patterns for data masking
 */
export const SENSITIVE_FIELD_PATTERNS = [
  // Authentication & Security
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /authorization/i,
  /bearer/i,
  /jwt/i,
  /session/i,
  /cookie/i,
  
  // Personal Information
  /email/i,
  /phone/i,
  /mobile/i,
  /address/i,
  /ssn/i,
  /social/i,
  /credit.*card/i,
  /card.*number/i,
  /cvv/i,
  /cvc/i,
  
  // Financial
  /account.*number/i,
  /routing.*number/i,
  /bank.*account/i,
  /payment/i,
  
  // API Keys & Credentials
  /api.*key/i,
  /client.*secret/i,
  /private.*key/i,
  /access.*key/i,
  /refresh.*token/i,
]

/**
 * Check if a field name matches sensitive patterns
 */
export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(fieldName))
}

/**
 * Performance logging thresholds (in milliseconds)
 */
export const PERFORMANCE_THRESHOLDS = {
  database: {
    slow: 1000,    // Log database operations taking longer than 1s
    warning: 5000, // Warn for operations taking longer than 5s
  },
  api: {
    slow: 2000,    // Log API calls taking longer than 2s
    warning: 10000, // Warn for API calls taking longer than 10s
  },
  messaging: {
    slow: 3000,    // Log messaging operations taking longer than 3s
    warning: 15000, // Warn for messaging operations taking longer than 15s
  },
  rsvp: {
    slow: 1000,    // Log RSVP operations taking longer than 1s
    warning: 5000, // Warn for RSVP operations taking longer than 5s
  },
}

/**
 * Get performance threshold for an operation type
 */
export function getPerformanceThreshold(operationType: keyof typeof PERFORMANCE_THRESHOLDS): {
  slow: number
  warning: number
} {
  return PERFORMANCE_THRESHOLDS[operationType] || PERFORMANCE_THRESHOLDS.api
}