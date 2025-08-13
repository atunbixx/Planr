import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

export interface OnboardingState {
  done: boolean
  lastStep?: string
  stepsCompleted: string[]
}

export interface StepData {
  [key: string]: any
}

// Define the steps in order
export const ONBOARDING_STEPS = [
  'welcome',
  'profile',
  'event',
  'invite',
  'budget',
  'vendors',
  'guests',
  'review',
  'success'
] as const

export type OnboardingStep = typeof ONBOARDING_STEPS[number]

// Track telemetry events
export const trackOnboardingEvent = (event: string, data?: any) => {
  console.log(`[Onboarding Telemetry] ${event}`, data)
  // TODO: Integrate with your analytics provider
}

/**
 * Get the current onboarding state for a user
 */
export async function getOnboardingState(userId: string): Promise<OnboardingState & { stepData?: any }> {
  try {
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId }
    })

    if (!progress) {
      return {
        done: false,
        lastStep: 'welcome',
        stepsCompleted: [],
        stepData: {}
      }
    }

    const stepsCompleted = progress.stepsCompleted as string[]
    const stepData = progress.stepData as StepData || {}
    
    return {
      done: progress.done,
      lastStep: progress.stepCurrent || 'welcome',
      stepsCompleted: stepsCompleted || [],
      stepData
    }
  } catch (error) {
    console.error('Error getting onboarding state:', error)
    return {
      done: false,
      lastStep: 'welcome',
      stepsCompleted: [],
      stepData: {}
    }
  }
}

/**
 * Set/update a step in the onboarding process
 */
export async function setStep(
  userId: string, 
  stepId: string, 
  payload?: StepData
): Promise<void> {
  try {
    const currentProgress = await prisma.onboardingProgress.findUnique({
      where: { userId }
    })

    const stepsCompleted = currentProgress?.stepsCompleted as string[] || []
    const stepData = currentProgress?.stepData as StepData || {}

    // Add step to completed if not already there
    if (!stepsCompleted.includes(stepId) && stepId !== 'welcome') {
      stepsCompleted.push(stepId)
    }

    // Merge step data
    if (payload) {
      stepData[stepId] = { ...stepData[stepId], ...payload }
    }

    // Update or create progress record
    await prisma.onboardingProgress.upsert({
      where: { userId },
      update: {
        stepCurrent: stepId,
        stepsCompleted: stepsCompleted,
        stepData: stepData,
        updatedAt: new Date()
      },
      create: {
        userId,
        stepCurrent: stepId,
        stepsCompleted: stepsCompleted,
        stepData: stepData
      }
    })

    // Track event
    trackOnboardingEvent('ob_step_completed', { 
      userId, 
      step: stepId,
      totalCompleted: stepsCompleted.length 
    })
  } catch (error) {
    console.error('Error setting onboarding step:', error)
    throw error
  }
}

/**
 * Get data for a specific step
 */
export async function getStepData(userId: string, stepId: string): Promise<any> {
  try {
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId }
    })

    if (!progress || !progress.stepData) {
      return null
    }

    const stepData = progress.stepData as StepData
    return stepData[stepId] || null
  } catch (error) {
    console.error('Error getting step data:', error)
    return null
  }
}

/**
 * Complete the onboarding process
 */
export async function completeOnboarding(userId: string): Promise<void> {
  const transaction: Prisma.PrismaPromise<any>[] = []

  try {
    // Get the onboarding data
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId }
    })

    if (!progress) {
      throw new Error('No onboarding progress found')
    }

    const stepData = progress.stepData as StepData

    // Mark onboarding as complete
    transaction.push(
      prisma.onboardingProgress.update({
        where: { userId },
        data: {
          done: true,
          stepCurrent: 'success',
          updatedAt: new Date()
        }
      })
    )

    // Update user's has_onboarded flag
    transaction.push(
      prisma.user.update({
        where: { id: userId },
        data: { hasOnboarded: true }
      })
    )

    // Create initial data based on onboarding selections
    // 1. Create or update couple record
    const profileData = stepData.profile || {}
    const eventData = stepData.event || {}
    const budgetData = stepData.budget || {}

    const couple = await prisma.couple.findFirst({
      where: { userId }
    })

    if (!couple) {
      // Create new couple record with all onboarding data
      transaction.push(
        prisma.couple.create({
          data: {
            userId,
            partner1Name: profileData.userName || 'Partner 1',
            partner2Name: profileData.partnerName || '',
            weddingDate: eventData.weddingDate ? new Date(eventData.weddingDate) : null,
            venueLocation: eventData.city || '',
            guestCountEstimate: parseInt(eventData.estimatedGuests) || 100,
            totalBudget: budgetData.exactBudget ? parseFloat(budgetData.exactBudget) : 
                        (budgetData.budgetTier ? 50000 : 25000), // Default based on tier selection
            currency: profileData.currency || 'USD',
            onboardingCompleted: true
          }
        })
      )
    } else {
      // Update existing couple record with onboarding data
      const updateData: any = {
        onboardingCompleted: true,
        updatedAt: new Date()
      }
      
      // Update with onboarding data if not already set
      if (!couple.partner1Name && profileData.userName) {
        updateData.partner1Name = profileData.userName
      }
      if (!couple.partner2Name && profileData.partnerName) {
        updateData.partner2Name = profileData.partnerName
      }
      if (!couple.weddingDate && eventData.weddingDate) {
        updateData.weddingDate = new Date(eventData.weddingDate)
      }
      if (!couple.venueLocation && eventData.city) {
        updateData.venueLocation = eventData.city
      }
      if (!couple.guestCountEstimate && eventData.estimatedGuests) {
        updateData.guestCountEstimate = parseInt(eventData.estimatedGuests)
      }
      if (!couple.totalBudget && (budgetData.exactBudget || budgetData.budgetTier)) {
        updateData.totalBudget = budgetData.exactBudget ? parseFloat(budgetData.exactBudget) : 50000
      }
      if (!couple.currency && profileData.currency) {
        updateData.currency = profileData.currency
      }
      
      transaction.push(
        prisma.couple.update({
          where: { id: couple.id },
          data: updateData
        })
      )
    }

    // 2. Create initial budget categories if they selected vendors
    const vendorData = stepData.vendors || {}
    if (vendorData.categories && vendorData.categories.length > 0) {
      // TODO: Create budget categories based on selected vendor categories
      // This would require the BudgetCategory model to be available
    }

    // 3. Create sample guests if provided
    const guestsData = stepData.guests || {}
    if (guestsData.guests && guestsData.guests.length > 0) {
      // TODO: Create guest records
      // This would require knowing the couple ID
    }

    // Execute all operations in a transaction
    await prisma.$transaction(transaction)

    // Track completion
    trackOnboardingEvent('ob_completed', { userId })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    throw error
  }
}

/**
 * Skip a step in the onboarding process
 */
export async function skipStep(userId: string, stepId: string): Promise<void> {
  try {
    await setStep(userId, stepId, { skipped: true })
    trackOnboardingEvent('ob_skipped', { userId, step: stepId })
  } catch (error) {
    console.error('Error skipping step:', error)
    throw error
  }
}

/**
 * Get the next step in the onboarding flow
 */
export function getNextStep(currentStep: string): string | null {
  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep as OnboardingStep)
  if (currentIndex === -1 || currentIndex === ONBOARDING_STEPS.length - 1) {
    return null
  }
  return ONBOARDING_STEPS[currentIndex + 1]
}

/**
 * Get the previous step in the onboarding flow
 */
export function getPreviousStep(currentStep: string): string | null {
  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep as OnboardingStep)
  if (currentIndex <= 0) {
    return null
  }
  return ONBOARDING_STEPS[currentIndex - 1]
}

/**
 * Check if a step is optional
 */
export function isOptionalStep(step: string): boolean {
  return ['invite', 'guests'].includes(step)
}