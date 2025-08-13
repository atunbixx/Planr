/**
 * Authentication Context - Centralized auth state management
 */

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

/**
 * Extract auth context from request
 */
export async function getAuthContext(request: Request): Promise<AuthContext | null> {
  // Implementation will use existing auth system
  // This provides a clean interface for all features to use
  return null // TODO: Implement
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