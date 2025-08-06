import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { coupleService } from '@/lib/db/services'
import { successResponse } from '@/lib/api/errors'
import { ApiResponse } from '@/types/api'
import { Couple } from '@prisma/client'

// POST /api/couples - Create or update couple profile (public route for onboarding)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use the service to handle all the logic
    const couple = await coupleService.upsertCoupleFromOnboarding(body)
    
    return successResponse({
      message: 'Couple profile created successfully',
      data: couple
    })
  } catch (error) {
    // The service will throw appropriate exceptions
    // Our global error handler will catch and format them
    throw error
  }
}

// GET /api/couples - Get couple profile
export const GET = withAuth<any, Couple>(async (request, context) => {
  const { searchParams } = new URL(request.url)
  const clerkUserId = searchParams.get('clerk_user_id')
  
  // If clerk_user_id is provided, fetch by that (for backwards compatibility)
  if (clerkUserId) {
    const couple = await coupleService.getCoupleByClerkId(clerkUserId)
    if (!couple) {
      return successResponse({ data: null })
    }
    return successResponse({ data: couple })
  }
  
  // Otherwise, use the authenticated user's couple
  return successResponse({ data: context.couple })
})

// PUT /api/couples - Update couple profile
export const PUT = withAuth<any, Couple>(async (request, context) => {
  const body = await request.json()
  
  const updatedCouple = await coupleService.updateCoupleDetails(
    context.couple.id,
    context.user.id,
    body
  )
  
  return successResponse({
    message: 'Couple profile updated successfully',
    data: updatedCouple
  })
})

// GET /api/couples/statistics - Get couple statistics
export const getStatistics = withAuth(async (request, context) => {
  const stats = await coupleService.getCoupleStatistics(context.couple.id)
  
  return successResponse({ data: stats })
})