/**
 * API Compatibility Layer for Naming Convention Migration
 * Provides backward compatibility for snake_case while migrating to camelCase
 */

import { NextRequest, NextResponse } from 'next/server'
import { normalizeInput, smartNormalize, detectCasingStyle, CasingStyle } from '@/lib/utils/casing'

export interface CompatibilityOptions {
  /** Always return camelCase (default: true) */
  alwaysCamelCaseOutput?: boolean
  /** Support legacy snake_case inputs (default: true) */
  supportLegacyInput?: boolean
  /** Log conversion warnings (default: false) */
  logWarnings?: boolean
  /** Deprecation warning header (default: false) */
  addDeprecationWarning?: boolean
}

const DEFAULT_OPTIONS: CompatibilityOptions = {
  alwaysCamelCaseOutput: true,
  supportLegacyInput: true,
  logWarnings: false,
  addDeprecationWarning: false
}

/**
 * API Handler wrapper that provides naming convention compatibility
 */
export function withCompatibility<T = any>(
  handler: (request: NextRequest, normalizedBody?: any) => Promise<NextResponse<T>>,
  options: CompatibilityOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return async (request: NextRequest): Promise<NextResponse<T>> => {
    let normalizedBody: any = undefined
    let inputStyle: CasingStyle = 'camelCase'

    // Handle request body normalization
    if (request.body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
      try {
        const rawBody = await request.json()
        inputStyle = detectCasingStyle(rawBody)
        
        if (opts.supportLegacyInput && inputStyle === 'snake_case') {
          normalizedBody = normalizeInput(rawBody)
          
          if (opts.logWarnings) {
            console.warn(`[API Compatibility] Converting snake_case input to camelCase for ${request.url}`)
          }
        } else {
          normalizedBody = smartNormalize(rawBody)
        }
      } catch (error) {
        // If body parsing fails, let the handler deal with it
        normalizedBody = undefined
      }
    }

    // Handle query parameters normalization
    const url = new URL(request.url)
    const searchParams = new URLSearchParams()
    
    for (const [key, value] of url.searchParams.entries()) {
      if (key.includes('_') && opts.supportLegacyInput) {
        // Convert snake_case query param to camelCase
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        searchParams.set(camelKey, value)
        
        if (opts.logWarnings) {
          console.warn(`[API Compatibility] Converting query param ${key} to ${camelKey}`)
        }
      } else {
        searchParams.set(key, value)
      }
    }

    // Create a new request with normalized query params
    const normalizedUrl = new URL(url.pathname, url.origin)
    normalizedUrl.search = searchParams.toString()
    
    const normalizedRequest = new NextRequest(normalizedUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: normalizedBody ? JSON.stringify(normalizedBody) : request.body,
    })

    // Call the actual handler
    const response = await handler(normalizedRequest, normalizedBody)

    // Add deprecation warnings if legacy input was detected
    if (opts.addDeprecationWarning && inputStyle === 'snake_case') {
      response.headers.set(
        'X-Deprecation-Warning', 
        'snake_case field names are deprecated. Use camelCase instead.'
      )
      response.headers.set(
        'X-Migration-Guide',
        'See /docs/api-migration for camelCase field mappings'
      )
    }

    return response
  }
}

/**
 * Body transformation middleware for legacy compatibility
 */
export function transformRequestBody(body: any, options: CompatibilityOptions = {}): any {
  if (!body || typeof body !== 'object') {
    return body
  }

  const opts = { ...DEFAULT_OPTIONS, ...options }
  const inputStyle = detectCasingStyle(body)

  if (opts.supportLegacyInput && inputStyle === 'snake_case') {
    if (opts.logWarnings) {
      console.warn('[API Compatibility] Converting snake_case request body to camelCase')
    }
    return normalizeInput(body)
  }

  return smartNormalize(body)
}

/**
 * Response transformation for legacy clients (if needed)
 */
export function transformResponseBody(body: any, targetStyle: CasingStyle = 'camelCase'): any {
  if (!body || typeof body !== 'object') {
    return body
  }

  if (targetStyle === 'camelCase') {
    return smartNormalize(body)
  }

  // For legacy clients that still expect snake_case (rare)
  return body // Keep as camelCase by default - force migration
}

/**
 * Validation helper to ensure camelCase consistency
 */
export function validateCamelCase(obj: Record<string, any>): { isValid: boolean; violations: string[] } {
  const violations: string[] = []
  
  function checkKeys(current: any, path: string = ''): void {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return
    }

    for (const key of Object.keys(current)) {
      const fullPath = path ? `${path}.${key}` : key
      
      // Check if key contains underscores (snake_case)
      if (key.includes('_')) {
        violations.push(`${fullPath}: snake_case key "${key}"`)
      }
      
      // Recursively check nested objects
      if (current[key] && typeof current[key] === 'object' && !Array.isArray(current[key])) {
        checkKeys(current[key], fullPath)
      }
    }
  }

  checkKeys(obj)
  
  return {
    isValid: violations.length === 0,
    violations
  }
}

/**
 * Express/Next.js middleware factory for automatic compatibility
 */
export const compatibilityMiddleware = (options: CompatibilityOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return (req: any, res: any, next: any) => {
    // Transform request body if present
    if (req.body) {
      req.body = transformRequestBody(req.body, opts)
      req.originalBody = req.body // Keep reference to original
    }

    // Transform query parameters
    if (req.query) {
      const normalizedQuery: any = {}
      for (const [key, value] of Object.entries(req.query)) {
        if (key.includes('_') && opts.supportLegacyInput) {
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
          normalizedQuery[camelKey] = value
          
          if (opts.logWarnings) {
            console.warn(`[API Compatibility] Converting query param ${key} to ${camelKey}`)
          }
        } else {
          normalizedQuery[key] = value
        }
      }
      req.query = normalizedQuery
    }

    // Set compatibility headers for legacy clients
    if (opts.addDeprecationWarning) {
      res.setHeader('X-API-Version', '2.0')
      res.setHeader('X-Supports-CamelCase', 'true')
      res.setHeader('X-Supports-SnakeCase', 'deprecated')
    }

    next()
  }
}

/**
 * Quick validation for API responses to ensure camelCase compliance
 */
export function ensureCamelCaseResponse<T>(data: T): T {
  if (data && typeof data === 'object') {
    const validation = validateCamelCase(data as Record<string, any>)
    if (!validation.isValid) {
      console.warn('[API Response] Non-camelCase fields detected:', validation.violations)
    }
  }
  return data
}