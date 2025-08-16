/**
 * Authentication Context - Centralized auth state management
 */

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export interface AuthContext {
  userId: string
  email?: string
  coupleId?: string
  permissions?: string[]
  tenantId?: string // For future multi-tenancy
}

export interface AuthSession {
  user: {
    id: string
    email: string
    emailVerified?: boolean
  }
  couple?: {
    id: string
    role: 'primary' | 'partner' | 'collaborator'
  }
  permissions: string[]
  expiresAt: Date
}

// Cache for auth context to prevent duplicate lookups
const authContextCache = new Map<string, { context: AuthContext | null, timestamp: number }>()
const CONTEXT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Extract auth context from request with caching
 */
export async function getAuthContext(request: Request): Promise<AuthContext | null> {
  try {
    // Get request ID for caching (use Authorization header as cache key)
    const authHeader = request.headers.get('Authorization')
    const cacheKey = authHeader || 'no-auth'
    
    // Check cache first
    const cached = authContextCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CONTEXT_CACHE_TTL) {
      return cached.context
    }
    
    // Get user from Supabase
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      // Cache null result too to prevent repeated lookups
      authContextCache.set(cacheKey, { context: null, timestamp: Date.now() })
      return null
    }
    
    // Get couple information from database
    const couple = await prisma.couple.findFirst({
      where: {
        OR: [
          { partner1UserId: user.id },
          { partner2UserId: user.id },
          { userId: user.id }
        ]
      },
      select: {
        id: true,
        onboardingCompleted: true
      }
    })
    
    // Get user permissions (if applicable)
    let permissions: string[] = []
    
    // Check if user is superadmin
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isSuperAdmin: true }
    })
    
    if (userRecord?.isSuperAdmin) {
      permissions.push('superadmin')
    }
    
    // Build auth context
    const context: AuthContext = {
      userId: user.id,
      email: user.email,
      coupleId: couple?.id,
      permissions
    }
    
    // Cache the context
    authContextCache.set(cacheKey, { context, timestamp: Date.now() })
    
    return context
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth Context] Error getting auth context:', error)
    }
    return null
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(request: Request): Promise<AuthContext> {
  const context = await getAuthContext(request)
  if (!context) {
    throw new UnauthorizedError('Authentication required')
  }
  return context
}

/**
 * Require specific permissions - throws if not authorized
 */
export async function requirePermission(request: Request, permission: string): Promise<AuthContext> {
  const context = await requireAuth(request)
  
  if (!context.permissions?.includes(permission) && !context.permissions?.includes('superadmin')) {
    throw new ForbiddenError(`Permission '${permission}' required`)
  }
  
  return context
}

/**
 * Clear auth context cache (useful after sign out)
 */
export function clearAuthContextCache(userId?: string) {
  if (userId) {
    // Clear specific user's cache
    for (const [key, value] of authContextCache.entries()) {
      if (value.context?.userId === userId) {
        authContextCache.delete(key)
      }
    }
  } else {
    // Clear all cache
    authContextCache.clear()
  }
}

/**
 * Authentication errors
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}