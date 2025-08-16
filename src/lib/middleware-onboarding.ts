import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface OnboardingStatus {
  isComplete: boolean
  lastStep: string
  needsRedirect: boolean
  redirectPath?: string
}

// Cache for onboarding status to reduce database queries
const onboardingCache = new Map<string, { status: OnboardingStatus, timestamp: number }>()
const ONBOARDING_CACHE_TTL = 60 * 1000 // 1 minute cache

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
    
    // Check cache first
    const cached = onboardingCache.get(userId)
    if (cached && Date.now() - cached.timestamp < ONBOARDING_CACHE_TTL) {
      return cached.status
    }

    // First get couple_id for the user  
    const couple = await prisma.couple.findFirst({
      where: {
        OR: [
          { partner1UserId: userId },
          { partner2UserId: userId },
          { userId: userId }
        ]
      },
      select: { 
        id: true,
        onboardingCompleted: true 
      }
    })

    if (!couple) {
      return {
        isComplete: false,
        lastStep: 'welcome',
        needsRedirect: true,
        redirectPath: '/onboarding/welcome'
      }
    }

    // Check onboarding progress in database
    const progress = await prisma.onboarding_progress.findMany({
      where: { couple_id: couple.id },
      select: {
        step: true,
        completed: true,
        completed_at: true
      }
    })

    // If no progress records, user needs to start onboarding
    if (!progress || progress.length === 0) {
      return {
        isComplete: false,
        lastStep: 'welcome',
        needsRedirect: true,
        redirectPath: '/onboarding/welcome'
      }
    }

    // Check if couple has marked onboarding as completed
    if (couple.onboardingCompleted) {
      const status: OnboardingStatus = {
        isComplete: true,
        lastStep: 'success',
        needsRedirect: false
      }
      
      // Cache the completed status
      onboardingCache.set(userId, {
        status,
        timestamp: Date.now()
      })
      
      return status
    }

    // Find the last completed step and current step  
    const completedSteps = progress.filter(p => p.completed)
    const lastCompletedStep = completedSteps[completedSteps.length - 1]
    
    // Determine next step based on progress
    const stepOrder = ['welcome', 'names', 'basics', 'budget', 'review', 'success']
    let nextStepIndex = 0
    
    if (lastCompletedStep) {
      const currentIndex = stepOrder.indexOf(lastCompletedStep.step)
      nextStepIndex = Math.min(currentIndex + 1, stepOrder.length - 1)
    }
    
    const nextStep = stepOrder[nextStepIndex]
    
    const status: OnboardingStatus = {
      isComplete: false,
      lastStep: nextStep,
      needsRedirect: true,
      redirectPath: `/onboarding/${nextStep}`
    }
    
    // Cache the status
    onboardingCache.set(userId, {
      status,
      timestamp: Date.now()
    })
    
    return status

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error checking status:', error)
    }
    // On error, assume they need to complete onboarding but don't cache
    return {
      isComplete: false,
      lastStep: 'welcome',
      needsRedirect: true,
      redirectPath: '/onboarding/welcome'
    }
  }
}

// Clear onboarding cache for a specific user
export function clearOnboardingCache(userId?: string) {
  if (userId) {
    onboardingCache.delete(userId)
  } else {
    onboardingCache.clear()
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