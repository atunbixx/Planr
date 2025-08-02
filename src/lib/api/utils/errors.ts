import { ApiError } from '../types'

// Error codes enum for consistency
export enum ErrorCodes {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  
  // Rate limiting
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  OFFLINE = 'OFFLINE',
}

// Error factory functions
export function createApiError(
  code: ErrorCodes | string,
  message: string,
  status?: number,
  details?: any
): ApiError {
  return {
    code,
    message,
    status,
    details
  }
}

export function isApiError(error: any): error is ApiError {
  return error && typeof error.code === 'string' && typeof error.message === 'string'
}

// Common error handlers
export const ErrorHandlers = {
  unauthorized: () => createApiError(
    ErrorCodes.UNAUTHORIZED,
    'You must be logged in to perform this action',
    401
  ),
  
  forbidden: () => createApiError(
    ErrorCodes.FORBIDDEN,
    'You do not have permission to perform this action',
    403
  ),
  
  notFound: (resource: string) => createApiError(
    ErrorCodes.NOT_FOUND,
    `${resource} not found`,
    404
  ),
  
  validation: (details: any) => createApiError(
    ErrorCodes.VALIDATION_ERROR,
    'Validation failed',
    400,
    details
  ),
  
  conflict: (message: string) => createApiError(
    ErrorCodes.CONFLICT,
    message,
    409
  ),
  
  internal: (message: string = 'An unexpected error occurred') => createApiError(
    ErrorCodes.INTERNAL_ERROR,
    message,
    500
  ),
  
  timeout: () => createApiError(
    ErrorCodes.TIMEOUT,
    'Request timed out',
    408
  ),
  
  rateLimited: (retryAfter?: number) => createApiError(
    ErrorCodes.RATE_LIMITED,
    'Too many requests. Please try again later.',
    429,
    { retryAfter }
  ),
  
  network: () => createApiError(
    ErrorCodes.NETWORK_ERROR,
    'Network error. Please check your connection.',
    0
  )
}

// Error parsing utilities
export function parseSupabaseError(error: any): ApiError {
  if (!error) {
    return ErrorHandlers.internal()
  }
  
  // Handle Supabase auth errors
  if (error.status === 401 || error.message?.includes('JWT')) {
    return ErrorHandlers.unauthorized()
  }
  
  // Handle RLS errors
  if (error.code === 'PGRST301' || error.message?.includes('row-level security')) {
    return ErrorHandlers.forbidden()
  }
  
  // Handle not found
  if (error.code === 'PGRST116') {
    return ErrorHandlers.notFound('Resource')
  }
  
  // Handle unique constraint violations
  if (error.code === '23505') {
    return ErrorHandlers.conflict('This item already exists')
  }
  
  // Handle foreign key violations
  if (error.code === '23503') {
    return ErrorHandlers.validation({ message: 'Invalid reference' })
  }
  
  // Default error
  return createApiError(
    error.code || ErrorCodes.INTERNAL_ERROR,
    error.message || 'An error occurred',
    error.status || 500,
    error.details
  )
}

// Retry logic
export function shouldRetry(error: ApiError, attempt: number, maxRetries: number): boolean {
  // Don't retry if we've exceeded max attempts
  if (attempt >= maxRetries) return false
  
  // Don't retry client errors (4xx) except for specific cases
  if (error.status && error.status >= 400 && error.status < 500) {
    // Retry on rate limit or timeout
    return error.code === ErrorCodes.RATE_LIMITED || error.code === ErrorCodes.TIMEOUT
  }
  
  // Retry server errors (5xx) and network errors
  return true
}

// Calculate retry delay with exponential backoff
export function getRetryDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000
}