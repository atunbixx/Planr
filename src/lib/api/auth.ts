import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { AuthContext, ApiResponse } from '@/types/api'
import { 
  UnauthorizedException, 
  NotFoundException, 
  handleApiError 
} from './errors'

// Main authentication function
export async function getAuthContext(): Promise<AuthContext> {
  const { userId: clerkUserId } = await auth()
  
  if (!clerkUserId) {
    throw new UnauthorizedException()
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkUserId }
  })

  if (!user) {
    throw new NotFoundException('User')
  }

  // Get couple associated with user (optional - user might not have created profile yet)
  // Note: We'll skip couple lookup for now to avoid schema issues
  // This will be handled when the user completes their profile setup
  const couple = null

  return {
    userId: clerkUserId,
    user,
    couple // This will be null until user completes wedding profile
  }
}

// Higher-order function for authenticated routes
export function withAuth<TParams = any, TResponse = any>(
  handler: (
    request: NextRequest,
    context: AuthContext,
    params?: TParams
  ) => Promise<NextResponse<ApiResponse<TResponse>>>
) {
  return async (
    request: NextRequest, 
    params?: TParams
  ): Promise<NextResponse<ApiResponse<TResponse>>> => {
    try {
      const authContext = await getAuthContext()
      return await handler(request, authContext, params)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// Alternative middleware pattern for more control
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthContext | NextResponse> {
  try {
    return await getAuthContext()
  } catch (error) {
    return handleApiError(error)
  }
}

// Utility to check if response is an error
export function isErrorResponse(
  response: AuthContext | NextResponse
): response is NextResponse {
  return response instanceof NextResponse
}

// Optional: Role-based authentication
export async function requireRole(
  authContext: AuthContext,
  requiredRole: string
): Promise<void> {
  // This is a placeholder - implement based on your role system
  // For now, we'll just check if the user exists
  if (!authContext.user) {
    throw new UnauthorizedException('Insufficient permissions')
  }
}

// Optional: Resource ownership check
export async function requireOwnership(
  resourceId: string,
  resourceType: 'vendor' | 'photo' | 'guest' | 'expense',
  coupleId: string
): Promise<void> {
  let isOwner = false

  switch (resourceType) {
    case 'vendor':
      const vendor = await prisma.vendor.findFirst({
        where: { id: resourceId, coupleId }
      })
      isOwner = !!vendor
      break
    
    case 'photo':
      const photo = await prisma.photo.findFirst({
        where: { id: resourceId, coupleId }
      })
      isOwner = !!photo
      break
    
    case 'guest':
      const guest = await prisma.guest.findFirst({
        where: { id: resourceId, coupleId }
      })
      isOwner = !!guest
      break
    
    case 'expense':
      const expense = await prisma.budgetExpense.findFirst({
        where: { id: resourceId, coupleId }
      })
      isOwner = !!expense
      break
  }

  if (!isOwner) {
    throw new UnauthorizedException('You do not have access to this resource')
  }
}