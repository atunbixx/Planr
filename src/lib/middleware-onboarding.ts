import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface OnboardingStatus {
  isComplete: boolean
  lastStep: string
  needsRedirect: boolean
  redirectPath?: string
}

export async function checkOnboardingStatus(request: NextRequest, userId: string): Promise<OnboardingStatus> {
  try {
    // Quick check: if user has onboardingCompleted cookie, they're done
    const onboardingCookie = request.cookies.get('onboardingCompleted')?.value
    if (onboardingCookie === 'true') {
      return {
        isComplete: true,
        lastStep: 'success',
        needsRedirect: false
      }
    }

    // Check onboarding progress in database
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId },
      select: {
        done: true,
        stepCurrent: true,
        stepsCompleted: true
      }
    })

    // If no progress record, user needs to start onboarding
    if (!progress) {
      return {
        isComplete: false,
        lastStep: 'welcome',
        needsRedirect: true,
        redirectPath: '/onboarding/welcome'
      }
    }

    // If onboarding is marked as done, check couple record
    if (progress.done) {
      const couple = await prisma.couple.findFirst({
        where: {
          OR: [
            { partner1_user_id: userId },
            { partner2_user_id: userId },
            { userId: userId }
          ]
        },
        select: { onboardingCompleted: true }
      })

      const isComplete = couple?.onboardingCompleted || false
      return {
        isComplete,
        lastStep: progress.stepCurrent || 'success',
        needsRedirect: !isComplete,
        redirectPath: isComplete ? undefined : '/onboarding/review'
      }
    }

    // User has progress but hasn't completed onboarding
    const lastStep = progress.stepCurrent || 'welcome'
    return {
      isComplete: false,
      lastStep,
      needsRedirect: true,
      redirectPath: `/onboarding/${lastStep}`
    }

  } catch (error) {
    console.error('Error checking onboarding status in middleware:', error)
    // On error, assume they need to complete onboarding
    return {
      isComplete: false,
      lastStep: 'welcome',
      needsRedirect: true,
      redirectPath: '/onboarding/welcome'
    }
  }
}

export async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {
            // Middleware can't set cookies
          },
          remove() {
            // Middleware can't remove cookies
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return null
    }

    return user.id
  } catch (error) {
    console.error('Error getting user ID in middleware:', error)
    return null
  }
}