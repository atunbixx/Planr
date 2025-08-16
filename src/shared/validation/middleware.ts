/**
 * Validation Middleware - Enterprise validation patterns
 */

import { z } from 'zod'
import { NextResponse } from 'next/server'
import { ApiResponse, ValidationError } from '@/shared/types/common'
import { ApiError } from './errors'
import { smartNormalize } from '@/lib/utils/casing'

function normalizeAny(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(v => normalizeAny(v))
  if (value && typeof value === 'object') return smartNormalize(value as Record<string, any>)
  return value
}

/**
 * Validate request data against a Zod schema
 */
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    const normalized = normalizeAny(data) as unknown
    return schema.parse(normalized)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: ValidationError[] = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      
      throw new ApiError('Validation failed', 400, validationErrors)
    }
    throw error
  }
}

/**
 * Create standardized API response
 */
export function createApiResponse<T = any>(options: {
  data?: T
  message?: string
  status?: number
  meta?: Record<string, any>
}): NextResponse {
  const { data, message = 'Success', status = 200, meta } = options
  
  const response: ApiResponse<T> = {
    success: status >= 200 && status < 300,
    data,
    timestamp: new Date().toISOString(),
    ...(meta && { meta })
  }
  
  if (message && status >= 200 && status < 300) {
    response.message = message
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Handle API errors with standardized format
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)
  
  if (error instanceof ApiError) {
    const response: ApiResponse = {
      success: false,
      error: error.message,
      errors: error.validationErrors,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(response, { status: error.statusCode })
  }
  
  // Unhandled errors
  const response: ApiResponse = {
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(response, { status: 500 })
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): T {
  const data: Record<string, any> = {}
  
  for (const [rawKey, value] of searchParams.entries()) {
    // Convert snake_case keys to camelCase automatically
    const key = rawKey.includes('_')
      ? rawKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      : rawKey

    // Handle arrays (e.g., ?tags=a&tags=b)
    if (data[key]) {
      if (Array.isArray(data[key])) {
        data[key].push(value)
      } else {
        data[key] = [data[key], value]
      }
    } else {
      data[key] = value
    }
  }
  
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: ValidationError[] = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      
      throw new ApiError('Invalid query parameters', 400, validationErrors)
    }
    throw error
  }
}

/**
 * Validation middleware for route handlers
 */
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return function (handler: (data: T) => Promise<NextResponse>) {
    return async function (request: Request): Promise<NextResponse> {
      try {
        const body = await request.json()
        const validatedData = await validateRequest(schema, body)
        return await handler(validatedData)
      } catch (error) {
        return handleApiError(error)
      }
    }
  }
}

/**
 * Query validation middleware for route handlers
 */
export function withQueryValidation<T>(schema: z.ZodSchema<T>) {
  return function (handler: (data: T) => Promise<NextResponse>) {
    return async function (request: Request): Promise<NextResponse> {
      try {
        const url = new URL(request.url)
        const validatedQuery = validateQueryParams(schema, url.searchParams)
        return await handler(validatedQuery)
      } catch (error) {
        return handleApiError(error)
      }
    }
  }
}

/**
 * Combined body and query validation
 */
export function withBodyAndQueryValidation<TBody, TQuery>(
  bodySchema: z.ZodSchema<TBody>,
  querySchema: z.ZodSchema<TQuery>
) {
  return function (handler: (body: TBody, query: TQuery) => Promise<NextResponse>) {
    return async function (request: Request): Promise<NextResponse> {
      try {
        const body = await request.json()
        const validatedBody = await validateRequest(bodySchema, body)
        
        const url = new URL(request.url)
        const validatedQuery = validateQueryParams(querySchema, url.searchParams)
        
        return await handler(validatedBody, validatedQuery)
      } catch (error) {
        return handleApiError(error)
      }
    }
  }
}