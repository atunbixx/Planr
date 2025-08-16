/**
 * Request Validation Middleware
 * Provides comprehensive input validation for API endpoints using Zod schemas
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/monitoring/Logger'

interface ValidationConfig {
  body?: z.ZodSchema<any>
  query?: z.ZodSchema<any>
  params?: z.ZodSchema<any>
  headers?: z.ZodSchema<any>
}

interface ValidationResult<T = any> {
  body?: T
  query?: T
  params?: T
  headers?: T
}

interface ValidationError {
  field: string
  message: string
  code: string
}

export class RequestValidationError extends Error {
  constructor(
    public validationErrors: ValidationError[],
    message: string = 'Request validation failed'
  ) {
    super(message)
    this.name = 'RequestValidationError'
  }
}

/**
 * Validate request against provided schemas
 */
export async function validateRequest<T = any>(
  request: NextRequest,
  config: ValidationConfig
): Promise<ValidationResult<T>> {
  const result: ValidationResult<T> = {}
  const errors: ValidationError[] = []

  try {
    // Validate request body
    if (config.body) {
      try {
        const body = await request.json()
        result.body = config.body.parse(body)
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(...formatZodErrors(error, 'body'))
        } else {
          errors.push({
            field: 'body',
            message: 'Invalid JSON in request body',
            code: 'invalid_json'
          })
        }
      }
    }

    // Validate query parameters
    if (config.query) {
      try {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries())
        result.query = config.query.parse(queryParams)
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(...formatZodErrors(error, 'query'))
        }
      }
    }

    // Validate URL parameters (would need to be passed in)
    if (config.params) {
      try {
        // Note: URL params would need to be extracted from the route context
        // This is a placeholder for when params are available
        const params = {} // Would be populated from route context
        result.params = config.params.parse(params)
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(...formatZodErrors(error, 'params'))
        }
      }
    }

    // Validate headers
    if (config.headers) {
      try {
        const headers = Object.fromEntries(request.headers.entries())
        result.headers = config.headers.parse(headers)
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(...formatZodErrors(error, 'headers'))
        }
      }
    }

    // If there are validation errors, throw them
    if (errors.length > 0) {
      logger.warn('Request validation failed', {
        path: request.nextUrl.pathname,
        method: request.method,
        errors: errors.length,
        validationErrors: errors
      })
      
      throw new RequestValidationError(errors)
    }

    logger.debug('Request validation passed', {
      path: request.nextUrl.pathname,
      method: request.method,
      validatedFields: Object.keys(result)
    })

    return result

  } catch (error) {
    if (error instanceof RequestValidationError) {
      throw error
    }
    
    logger.error('Request validation error', error instanceof Error ? error : new Error(String(error)), {
      path: request.nextUrl.pathname,
      method: request.method
    })
    
    throw new RequestValidationError([
      {
        field: 'request',
        message: 'Request validation failed',
        code: 'validation_error'
      }
    ])
  }
}

/**
 * Format Zod validation errors into a consistent format
 */
function formatZodErrors(error: z.ZodError, prefix: string = ''): ValidationError[] {
  return error.issues.map(issue => ({
    field: prefix ? `${prefix}.${issue.path.join('.')}` : issue.path.join('.'),
    message: issue.message,
    code: issue.code
  }))
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(error: RequestValidationError): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: {
        message: error.message,
        validationErrors: error.validationErrors
      },
      timestamp: new Date().toISOString()
    },
    { status: 400 }
  )
}

/**
 * Middleware wrapper for request validation
 */
export function withRequestValidation(config: ValidationConfig) {
  return function <T>(
    handler: (request: NextRequest, validated: ValidationResult<T>) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest, context?: any): Promise<NextResponse> {
      try {
        const validated = await validateRequest<T>(request, config)
        return await handler(request, validated)
      } catch (error) {
        if (error instanceof RequestValidationError) {
          return createValidationErrorResponse(error)
        }
        
        // Re-throw other errors to be handled by global error handler
        throw error
      }
    }
  }
}

// Common validation schemas
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)).optional().default(() => 1),
    pageSize: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional().default(() => 20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().uuid('Invalid ID format')
  }),

  // Common headers
  authHeaders: z.object({
    authorization: z.string().startsWith('Bearer ', 'Invalid authorization header format')
  }),

  // Content type headers
  jsonHeaders: z.object({
    'content-type': z.string().includes('application/json')
  }),

  // Search query
  searchQuery: z.object({
    q: z.string().min(1, 'Search query cannot be empty').max(100, 'Search query too long'),
    limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(50)).optional().default(() => 10)
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional()
  }).refine(
    data => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate)
      }
      return true
    },
    {
      message: 'Start date must be before end date',
      path: ['dateRange']
    }
  )
}

// Export validation utilities
export { z } from 'zod'
export type { ValidationConfig, ValidationResult, ValidationError }