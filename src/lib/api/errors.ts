import { NextResponse } from 'next/server'
import { ApiError, ApiResponse } from '@/types/api'

export class ApiException extends Error {
  statusCode: number
  code?: string
  details?: any

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message)
    this.name = 'ApiException'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class NotFoundException extends ApiException {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class BadRequestException extends ApiException {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, 400, 'BAD_REQUEST', details)
  }
}

export class ConflictException extends ApiException {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT')
  }
}

export class ValidationException extends ApiException {
  constructor(errors: any) {
    super('Validation failed', 422, 'VALIDATION_ERROR', errors)
  }
}

// Error response handler
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error)

  if (error instanceof ApiException) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    // Check for Prisma errors
    if (error.message.includes('P2002')) {
      return NextResponse.json(
        {
          success: false,
          error: 'A record with this data already exists',
          code: 'DUPLICATE_ENTRY'
        },
        { status: 409 }
      )
    }

    if (error.message.includes('P2025')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Record not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error.message
      },
      { status: 500 }
    )
  }

  // Unknown error
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred'
    },
    { status: 500 }
  )
}

// Success response helper
export function successResponse<T>(
  data: T, 
  message?: string, 
  metadata?: any
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    metadata
  })
}

// Validation helper
export function validateRequired(data: any, fields: string[]): void {
  const missing = fields.filter(field => !data[field])
  
  if (missing.length > 0) {
    throw new ValidationException({
      missing_fields: missing,
      message: `Required fields missing: ${missing.join(', ')}`
    })
  }
}

// Type guard for checking if error has statusCode
export function isApiException(error: any): error is ApiException {
  return error instanceof ApiException
}

// Async error wrapper for cleaner try-catch
export async function asyncHandler<T>(
  fn: () => Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await fn()
    return [result, null]
  } catch (error) {
    return [null, error as Error]
  }
}