import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { prisma } from '@/lib/prisma'
import { toApiFormat, toDbFormat, ModelName } from '@/lib/db/transformations'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'
import { BudgetRepository } from '@/lib/repositories/BudgetRepository'
import { VendorRepository } from '@/lib/repositories/VendorRepository'
import { GuestRepository } from '@/lib/repositories/GuestRepository'
import { getUser } from '@/lib/supabase/server'
import { smartNormalize } from '@/lib/utils/casing'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: ValidationError[]
  timestamp: string
}

export interface ValidationError {
  field: string
  message: string
}

export interface AuthContext {
  userId: string
  email?: string
  coupleId?: string
}

function normalizeAny(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((v) => normalizeAny(v))
  }
  if (value && typeof value === 'object') {
    return smartNormalize(value as Record<string, any>)
  }
  return value
}

export abstract class BaseApiHandler {
  protected model?: ModelName
  protected authContext?: AuthContext
  
  // Repository instances - ONLY way to access data
  protected coupleRepo = new CoupleRepository()
  protected budgetRepo = new BudgetRepository()
  protected vendorRepo = new VendorRepository()
  protected guestRepo = new GuestRepository()
  
  /**
   * Main request handler with automatic field transformation
   */
  protected async handleRequest<T>(
    request: NextRequest,
    handler: () => Promise<T>
  ): Promise<NextResponse<ApiResponse<T>>> {
    const start = Date.now()
    
    try {
      // Authenticate request
      this.authContext = await this.requireAuth(request)
      
      // Execute handler
      const result = await handler()
      
      // Transform response if model is specified
      const transformed = this.model && result
        ? toApiFormat(result, this.model)
        : result
      
      return this.successResponse(transformed as T)
    } catch (error) {
      return this.handleError(error)
    } finally {
      // Log performance metrics
      const duration = Date.now() - start
      console.log(`[API] ${request.method} ${request.url} - ${duration}ms`)
    }
  }
  
  /**
   * Transform request input from API format to database format
   */
  protected transformInput<T extends Record<string, any>>(data: T): T {
    if (!this.model || !data) return data
    // Normalize to camelCase first, then map to DB format (snake_case/field mappings)
    const normalized = smartNormalize(data)
    return toDbFormat(normalized, this.model) as T
  }
  
  /**
   * Validate request data against a Zod schema
   */
  protected async validateRequest<T>(
    request: NextRequest,
    schema: z.Schema<T>
  ): Promise<T> {
    try {
      const body: unknown = await request.json()
      // Accept snake_case input by normalizing to camelCase before validation (supports arrays)
      const normalized = normalizeAny(body)
      return schema.parse(normalized)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationException(
          'Validation failed',
          error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        )
      }
      throw error
    }
  }
  
  /**
   * Require authentication and return user context
   */
  protected async requireAuth(request: NextRequest): Promise<AuthContext> {
    // Use enhanced getUser helper that handles JWT signature validation and refresh
    const user = await getUser()
    
    if (!user) {
      throw new UnauthorizedException('Authentication required')
    }
    
    // Get user's couple information using repository
    const couple = await this.coupleRepo.findByUserId(user.id)
    
    return {
      userId: user.id,
      email: user.email,
      coupleId: couple?.id
    }
  }
  
  /**
   * Get user ID from auth context (with validation)
   */
  protected requireUserId(): string {
    if (!this.authContext?.userId) {
      throw new UnauthorizedException('Authentication required')
    }
    return this.authContext.userId
  }

  /**
   * Get couple ID from auth context (with validation)
   */
  protected requireCoupleId(): string {
    if (!this.authContext?.coupleId) {
      throw new BadRequestException('Please complete your wedding setup to access this feature')
    }
    return this.authContext.coupleId
  }
  
  /**
   * Success response helper
   */
  protected successResponse<T>(data: T): NextResponse<ApiResponse<T>> {
    // Ensure camelCase output including arrays of objects
    const normalizedData = normalizeAny(data) as T
    return NextResponse.json({
      success: true,
      data: normalizedData,
      timestamp: new Date().toISOString()
    })
  }
  
  /**
   * Error handler with proper status codes
   */
  protected handleError(error: unknown): NextResponse<ApiResponse<never>> {
    console.error('[API Error]', error)
    
    if (error instanceof ApiException) {
      return NextResponse.json({
        success: false,
        error: error.message,
        errors: error.errors,
        timestamp: new Date().toISOString()
      }, { status: error.statusCode })
    }
    
    // Default error response
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Custom exception classes
export class ApiException extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: ValidationError[]
  ) {
    super(message)
  }
}

export class BadRequestException extends ApiException {
  constructor(message: string, errors?: ValidationError[]) {
    super(400, message, errors)
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message: string) {
    super(401, message)
  }
}

export class ForbiddenException extends ApiException {
  constructor(message: string) {
    super(403, message)
  }
}

export class NotFoundException extends ApiException {
  constructor(message: string) {
    super(404, message)
  }
}

export class ValidationException extends ApiException {
  constructor(message: string, errors: ValidationError[]) {
    super(400, message, errors)
  }
}

// Alias export for backward compatibility
export { BaseApiHandler as BaseAPIHandler }