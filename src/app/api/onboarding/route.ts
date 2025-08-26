import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createErrorResponse } from '@/lib/auth/jwt'
import { weddingDetailsSchema } from '@/lib/validation/auth'

async function handler(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = weddingDetailsSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('Onboarding validation failed:', {
        body,
        error: validationResult.error,
        issues: validationResult.error.issues
      })
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${validationResult.error.issues?.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') || 'Invalid input'}`
        ),
        { status: 400 }
      )
    }

    const { venue, weddingDate, budget, guestCount } = validationResult.data
    const userId = request.user!.id

    // Check if user is couple (only couples should complete onboarding)
    if (request.user!.role !== 'couple') {
      return NextResponse.json(
        createErrorResponse('Only couples can complete wedding onboarding'),
        { status: 403 }
      )
    }

    // Check if user already completed onboarding
    if (request.user!.onboardingCompleted) {
      return NextResponse.json(
        createErrorResponse('Onboarding already completed'),
        { status: 409 }
      )
    }

    // Create or update wedding details and mark onboarding as complete
    let result
    try {
      result = await prisma.$transaction(async (tx) => {
        // Create/update wedding details
        const weddingDetails = await tx.weddingDetails.upsert({
          where: { userId },
          update: {
            venue,
            weddingDate: weddingDate ? new Date(weddingDate) : undefined,
            budget,
            guestCount
          },
          create: {
            userId,
            venue,
            weddingDate: weddingDate ? new Date(weddingDate) : undefined,
            budget,
            guestCount
          }
        })

        // Mark user as onboarded
        const user = await tx.user.update({
          where: { id: userId },
          data: { onboardingCompleted: true },
          select: {
            id: true,
            email: true,
            role: true,
            onboardingCompleted: true
          }
        })

        return { user, weddingDetails }
      })
    } catch (dbError) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(createErrorResponse('Database unavailable'), { status: 503 })
      }
      console.log('Database not available, using temp storage for onboarding')
      
      // Create wedding details in temp storage
      const weddingDetails = await tempStorage.createOrUpdateWeddingDetails(userId, {
        venue,
        weddingDate: weddingDate || undefined,
        budget,
        guestCount
      })

      // Mark user as onboarded in temp storage
      const user = await tempStorage.updateUser(userId, { onboardingCompleted: true })
      
      if (!user) {
        throw new Error('User not found')
      }

      result = { 
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted
        }, 
        weddingDetails 
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        weddingDetails: result.weddingDetails
      }
    })

  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

export const POST = requireAuth(handler)
