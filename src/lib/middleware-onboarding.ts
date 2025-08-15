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
      return {
        isComplete: true,
        lastStep: 'success',
        needsRedirect: false
      }
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
    
    return {
      isComplete: false,
      lastStep: nextStep,
      needsRedirect: true,
      redirectPath: `/onboarding/${nextStep}`
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