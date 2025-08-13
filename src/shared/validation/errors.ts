/**
 * API Error Classes - Standardized error handling
 */

import { ValidationError } from '@/shared/types/common'

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number
  public readonly validationErrors?: ValidationError[]
  public readonly isApiError = true

  constructor(
    message: string,
    statusCode: number = 500,
    validationErrors?: ValidationError[]
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.validationErrors = validationErrors
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
}

/**
 * Validation Error - 400 Bad Request
 */
export class ValidationError400 extends ApiError {
  constructor(message: string = 'Validation failed', validationErrors?: ValidationError[]) {
    super(message, 400, validationErrors)
    this.name = 'ValidationError'
  }
}

/**
 * Authentication Error - 401 Unauthorized
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

/**
 * Authorization Error - 403 Forbidden
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 403)
    this.name = 'AuthorizationError'
  }
}

/**
 * Not Found Error - 404 Not Found
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

/**
 * Conflict Error - 409 Conflict
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

/**
 * Rate Limit Error - 429 Too Many Requests
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429)
    this.name = 'RateLimitError'
  }
}

/**
 * Database Error - 500 Internal Server Error
 */
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed', originalError?: Error) {
    super(message, 500)
    this.name = 'DatabaseError'
    
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

/**
 * External Service Error - 502 Bad Gateway
 */
export class ExternalServiceError extends ApiError {
  constructor(message: string = 'External service unavailable', service?: string) {
    super(service ? `${service}: ${message}` : message, 502)
    this.name = 'ExternalServiceError'
  }
}

/**
 * Business Logic Error - 422 Unprocessable Entity
 */
export class BusinessLogicError extends ApiError {
  constructor(message: string = 'Business rule violation') {
    super(message, 422)
    this.name = 'BusinessLogicError'
  }
}

/**
 * Concurrency Error - 409 Conflict
 */
export class ConcurrencyError extends ApiError {
  constructor(message: string = 'Resource was modified by another process') {
    super(message, 409)
    this.name = 'ConcurrencyError'
  }
}

/**
 * Transaction Error - 500 Internal Server Error
 */
export class TransactionError extends ApiError {
  constructor(message: string = 'Transaction failed', originalError?: Error) {
    super(message, 500)
    this.name = 'TransactionError'
    
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

/**
 * Type guards for error checking
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && 'isApiError' in error && error.isApiError === true
}

export function isValidationError(error: unknown): error is ValidationError400 {
  return error instanceof ValidationError400
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError
}

/**
 * Error factory functions
 */
export const ErrorFactory = {
  validation: (message?: string, validationErrors?: ValidationError[]) => 
    new ValidationError400(message, validationErrors),
  
  authentication: (message?: string) => 
    new AuthenticationError(message),
  
  authorization: (message?: string) => 
    new AuthorizationError(message),
  
  notFound: (message?: string) => 
    new NotFoundError(message),
  
  conflict: (message?: string) => 
    new ConflictError(message),
  
  rateLimit: (message?: string) => 
    new RateLimitError(message),
  
  database: (message?: string, originalError?: Error) => 
    new DatabaseError(message, originalError),
  
  externalService: (message?: string, service?: string) => 
    new ExternalServiceError(message, service),
  
  businessLogic: (message?: string) => 
    new BusinessLogicError(message),
  
  concurrency: (message?: string) => 
    new ConcurrencyError(message),
  
  transaction: (message?: string, originalError?: Error) => 
    new TransactionError(message, originalError)
}