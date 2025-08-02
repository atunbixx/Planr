import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { ApiResponse, ApiError } from '../types'
import { createApiError, ErrorCodes, parseSupabaseError } from '../utils/errors'
import { apiLogger } from '../utils/logger'

export class ServerApiClient {
  private supabase = createServerClient()

  // Helper to check authentication
  async requireAuth() {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    
    if (error || !user) {
      throw createApiError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401)
    }
    
    return user
  }

  // Helper to get couple data
  async requireCouple(userId: string) {
    const { data: couple, error } = await this.supabase
      .from('couples')
      .select('*')
      .or(`partner1_user_id.eq.${userId},partner2_user_id.eq.${userId}`)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw createApiError(ErrorCodes.NOT_FOUND, 'Couple profile not found', 404)
      }
      throw parseSupabaseError(error)
    }
    
    return couple
  }

  // Helper to check ownership
  async checkOwnership(
    table: string,
    id: string,
    userId: string,
    coupleId?: string
  ): Promise<boolean> {
    // First check if user belongs to couple
    if (coupleId) {
      const { data: couple } = await this.supabase
        .from('couples')
        .select('id')
        .eq('id', coupleId)
        .or(`partner1_user_id.eq.${userId},partner2_user_id.eq.${userId}`)
        .single()
      
      if (!couple) return false
    }
    
    // Then check if resource belongs to user/couple
    const query = this.supabase.from(table).select('id').eq('id', id)
    
    if (coupleId) {
      query.eq('couple_id', coupleId)
    } else {
      query.eq('user_id', userId)
    }
    
    const { data } = await query.single()
    return !!data
  }

  // Create standard success response
  createSuccessResponse<T>(data: T, message?: string): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    }
    return NextResponse.json(response)
  }

  // Create standard error response
  createErrorResponse(error: ApiError): NextResponse {
    const response: ApiResponse<any> = {
      success: false,
      error
    }
    return NextResponse.json(response, { status: error.status || 500 })
  }

  // Wrap handler with error handling
  withErrorHandling(
    handler: (request: Request) => Promise<NextResponse>
  ): (request: Request) => Promise<NextResponse> {
    return async (request: Request) => {
      const startTime = Date.now()
      
      try {
        const response = await handler(request)
        
        // Log successful request
        if (process.env.NODE_ENV === 'development') {
          apiLogger.log({
            method: request.method,
            url: request.url,
            status: response.status,
            duration: Date.now() - startTime,
          })
        }
        
        return response
      } catch (error: any) {
        // Log error
        apiLogger.log({
          method: request.method,
          url: request.url,
          duration: Date.now() - startTime,
          error,
        })
        
        // Handle known API errors
        if (error.code && error.message) {
          return this.createErrorResponse(error)
        }
        
        // Handle Supabase errors
        if (error.code && error.message) {
          return this.createErrorResponse(parseSupabaseError(error))
        }
        
        // Handle unknown errors
        return this.createErrorResponse(
          createApiError(
            ErrorCodes.INTERNAL_ERROR,
            process.env.NODE_ENV === 'development' 
              ? error.message || 'Internal server error'
              : 'Internal server error',
            500
          )
        )
      }
    }
  }

  // Validate request body with schema
  async validateBody<T>(
    request: Request,
    schema: {
      parse: (data: any) => T
    }
  ): Promise<T> {
    try {
      const body = await request.json()
      return schema.parse(body)
    } catch (error: any) {
      throw createApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid request body',
        400,
        error.errors || error.message
      )
    }
  }

  // Parse query parameters
  parseQueryParams(request: Request): URLSearchParams {
    const url = new URL(request.url)
    return url.searchParams
  }

  // Get pagination params
  getPaginationParams(params: URLSearchParams): {
    page: number
    limit: number
    offset: number
  } {
    const page = Math.max(1, parseInt(params.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20')))
    const offset = (page - 1) * limit
    
    return { page, limit, offset }
  }

  // Get sorting params
  getSortingParams(params: URLSearchParams, allowedFields: string[]): {
    sortBy: string
    sortOrder: 'asc' | 'desc'
  } | null {
    const sortBy = params.get('sort_by') || params.get('sortBy')
    const sortOrder = params.get('sort_order') || params.get('sortOrder') || 'asc'
    
    if (!sortBy || !allowedFields.includes(sortBy)) {
      return null
    }
    
    return {
      sortBy,
      sortOrder: sortOrder === 'desc' ? 'desc' : 'asc'
    }
  }

  // Get filter params
  getFilterParams(
    params: URLSearchParams,
    allowedFilters: string[]
  ): Record<string, any> {
    const filters: Record<string, any> = {}
    
    for (const filter of allowedFilters) {
      const value = params.get(filter)
      if (value !== null) {
        filters[filter] = value
      }
    }
    
    return filters
  }
}

// Default server client instance
export const serverApi = new ServerApiClient()