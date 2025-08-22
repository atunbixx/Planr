import { NextRequest } from 'next/server'
import { JWTService, JWTPayload } from './jwt'
import { prisma } from '../db/prisma'
import { tempStorage } from '../db/temp-storage'
import { hashString } from '../utils/hash'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: string
    onboardingCompleted: boolean
    impersonating?: boolean
    impersonatedBy?: string
  }
}

export type AuthenticatedUser = {
  id: string
  email: string
  role: string
  onboardingCompleted: boolean
  impersonating?: boolean
  impersonatedBy?: string
}

export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean
  user?: AuthenticatedUser
  error?: string
}> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = JWTService.extractTokenFromHeader(authHeader)

    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided'
      }
    }

    // Verify the JWT token
    const payload: JWTPayload = JWTService.verifyToken(token)

    // Fetch the user from database or temp storage to ensure they still exist
    let user: (AuthenticatedUser & { isActive?: boolean }) | null = null
    try {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          onboardingCompleted: true,
          isActive: true,
        }
      })
    } catch (_) {
      console.log('Database not available, using temp storage for auth')
      const tempUser = await tempStorage.findUserById(payload.userId)
      if (tempUser) {
        user = {
          id: tempUser.id,
          email: tempUser.email,
          role: tempUser.role,
          onboardingCompleted: tempUser.onboardingCompleted
        }
      }
    }

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      }
    }

    if (user.isActive === false) {
      return {
        success: false,
        error: 'Account deactivated'
      }
    }

    // Best-effort: record/update a session for analytics/admin
    try {
      const ipHeader = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
      const ip = ipHeader.split(',')[0].trim()
      const ua = request.headers.get('user-agent') || ''
      const region = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || undefined
      const country = region || undefined
      const city = request.headers.get('x-vercel-ip-city') || undefined
      const ipHash = ip ? hashString(ip) : null
      const uaHash = ua ? hashString(ua) : null
      if (prisma && user.id) {
        const existing = await prisma.session.findFirst({ where: { userId: user.id, ipHash: ipHash || undefined, uaHash: uaHash || undefined, revokedAt: null } })
        if (existing) {
          await prisma.session.update({ where: { id: existing.id }, data: { lastActiveAt: new Date() } })
        } else {
          await prisma.session.create({ data: { userId: user.id, ipHash, uaHash, region: region || null, country: country || null, city: city || null } })
        }
      }
    } catch (_) {
      // ignore session persistence errors
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
        impersonating: Boolean(payload.impBy),
        impersonatedBy: payload.impBy,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }
  }
}

export function requireAuth(handler: (request: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const auth = await authenticateRequest(request)

    if (!auth.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: auth.error || 'Unauthorized', statusCode: 401 }
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = auth.user

    return handler(authenticatedRequest)
  }
}

export function requireOnboarding(handler: (request: AuthenticatedRequest) => Promise<Response>) {
  return requireAuth(async (request: AuthenticatedRequest): Promise<Response> => {
    if (!request.user?.onboardingCompleted) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { 
            message: 'Onboarding required', 
            statusCode: 403,
            requiresOnboarding: true
          }
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(request)
  })
}

export function requireRole(roles: string[]) {
  return (handler: (request: AuthenticatedRequest) => Promise<Response>) => {
    return requireAuth(async (request: AuthenticatedRequest): Promise<Response> => {
      if (!request.user || !roles.includes(request.user.role)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { message: 'Insufficient permissions', statusCode: 403 }
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      return handler(request)
    })
  }
}
