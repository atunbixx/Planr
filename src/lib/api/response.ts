import { NextResponse } from 'next/server'

/**
 * Standard API response utilities
 */

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
  timestamp: string
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T, 
  status: number = 200
): NextResponse<APIResponse<T>> {
  const response: APIResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  }

  return NextResponse.json(response, { status })
}

/**
 * Create an error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  code: string = 'UNKNOWN_ERROR',
  details?: any
): NextResponse<APIResponse> {
  const response: APIResponse = {
    success: false,
    error: {
      message,
      code,
      details
    },
    timestamp: new Date().toISOString()
  }

  return NextResponse.json(response, { status })
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  errors: any[],
  message: string = 'Validation failed'
): NextResponse<APIResponse> {
  return createErrorResponse(
    message,
    400,
    'VALIDATION_ERROR',
    errors
  )
}

/**
 * Create a not found response
 */
export function createNotFoundResponse(
  resource: string = 'Resource'
): NextResponse<APIResponse> {
  return createErrorResponse(
    `${resource} not found`,
    404,
    'NOT_FOUND'
  )
}

/**
 * Create an unauthorized response
 */
export function createUnauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<APIResponse> {
  return createErrorResponse(
    message,
    401,
    'UNAUTHORIZED'
  )
}

/**
 * Create a forbidden response
 */
export function createForbiddenResponse(
  message: string = 'Forbidden'
): NextResponse<APIResponse> {
  return createErrorResponse(
    message,
    403,
    'FORBIDDEN'
  )
}

/**
 * Create a rate limit exceeded response
 */
export function createRateLimitResponse(
  message: string = 'Rate limit exceeded'
): NextResponse<APIResponse> {
  return createErrorResponse(
    message,
    429,
    'RATE_LIMIT_EXCEEDED'
  )
}

/**
 * Create a service unavailable response
 */
export function createServiceUnavailableResponse(
  message: string = 'Service temporarily unavailable'
): NextResponse<APIResponse> {
  return createErrorResponse(
    message,
    503,
    'SERVICE_UNAVAILABLE'
  )
}