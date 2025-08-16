import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

// Simple in-memory storage that will work on both client and server
// This is temporary until we fix the database model
// Note: This Map is recreated on each server request, so data doesn't persist between requests
const onboardingData = new Map<string, { [stepId: string]: any }>()

// Server-side persistent storage using a global variable
// This will persist data across requests in the same Node.js process
if (typeof global !== 'undefined' && !global.onboardingDataStore) {
  global.onboardingDataStore = new Map<string, { [stepId: string]: any }>()
}

// Load data from browser localStorage if available (client-side)
function loadFromLocalStorage(): Map<string, { [stepId: string]: any }> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('onboarding-data')
      if (stored) {
        const data = JSON.parse(stored)
        return new Map(Object.entries(data))
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }
  return new Map()
}

// Save data to browser localStorage if available (client-side)
function saveToLocalStorage(data: Map<string, { [stepId: string]: any }>) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const obj = Object.fromEntries(data.entries())
      localStorage.setItem('onboarding-data', JSON.stringify(obj))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }
}

// Initialize with localStorage data if available
if (typeof window !== 'undefined') {
  const stored = loadFromLocalStorage()
  for (const [key, value] of stored.entries()) {
    onboardingData.set(key, value)
  }
}

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
    // On server, use global store
    if (typeof global !== 'undefined' && global.onboardingDataStore) {
      const serverData = global.onboardingDataStore.get(userId)
      if (serverData) {
        console.log(`[Onboarding Server] Found server-side data for userId: ${userId}:`, serverData)
        const stepsCompleted = Object.keys(serverData)
        const lastStep = stepsCompleted.length > 0 ? stepsCompleted[stepsCompleted.length - 1] : 'welcome'
        return {
          done: false,
          lastStep,
          stepsCompleted,
          stepData: serverData
        }
      }
    }
    
    // On client, reload from localStorage first
    if (typeof window !== 'undefined') {
      const stored = loadFromLocalStorage()
      for (const [key, value] of stored.entries()) {
        onboardingData.set(key, value)
      }
    }
    
    // Try to find data for this user OR any user (to handle ID mismatches)
    let userData = onboardingData.get(userId) || {}
    
    // If no data for this user, check if there's data for any other user
    if (Object.keys(userData).length === 0) {
      for (const [otherUserId, otherUserData] of onboardingData.entries()) {
        if (Object.keys(otherUserData).length > 0) {
          console.log(`[Onboarding] Using data from different user ID: ${otherUserId} for request from: ${userId}`)
          userData = otherUserData
          break
        }
      }
    }
    
    const stepsCompleted = Object.keys(userData)
    const lastStep = stepsCompleted.length > 0 ? stepsCompleted[stepsCompleted.length - 1] : 'welcome'
    
    console.log(`[Onboarding] Getting state for userId: ${userId}`)
    console.log(`[Onboarding] Found data:`, userData)
    console.log(`[Onboarding] All stored data keys:`, Array.from(onboardingData.keys()))
    
    return {
      done: false,
      lastStep,
      stepsCompleted,
      stepData: userData
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
    // Save the step data
    if (payload && Object.keys(payload).length > 0) {
      // Save to server-side global store if available
      if (typeof global !== 'undefined' && global.onboardingDataStore) {
        const userData = global.onboardingDataStore.get(userId) || {}
        userData[stepId] = payload
        global.onboardingDataStore.set(userId, userData)
        console.log(`[Onboarding Server] Saved data for userId: ${userId}, step: ${stepId}:`, payload)
        console.log(`[Onboarding Server] All user data now:`, userData)
      }
      
      // Also save to in-memory cache (for client-side)
      const userData = onboardingData.get(userId) || {}
      userData[stepId] = payload
      onboardingData.set(userId, userData)
      
      // Persist to localStorage on client
      if (typeof window !== 'undefined') {
        saveToLocalStorage(onboardingData)
      }
      
      console.log(`[Onboarding] Saved data for userId: ${userId}, step: ${stepId}:`, payload)
      console.log(`[Onboarding] All user data now:`, userData)
    }
    
    // Track event
    trackOnboardingEvent('ob_step_completed', { 
      userId, 
      step: stepId,
      hasData: !!(payload && Object.keys(payload).length > 0)
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
    // Check server-side global store first
    if (typeof global !== 'undefined' && global.onboardingDataStore) {
      const userData = global.onboardingDataStore.get(userId) || {}
      const stepData = userData[stepId] || null
      if (stepData) {
        console.log(`[Onboarding Server] Retrieved data for userId: ${userId}, stepId: ${stepId}:`, stepData)
        return stepData
      }
    }
    
    // On client, reload from localStorage to get latest data
    if (typeof window !== 'undefined') {
      const stored = loadFromLocalStorage()
      for (const [key, value] of stored.entries()) {
        onboardingData.set(key, value)
      }
    }
    
    // Get data from temporary storage
    const userData = onboardingData.get(userId) || {}
    const stepData = userData[stepId] || null
    
    console.log(`[Onboarding] Retrieved data for userId: ${userId}, stepId: ${stepId}`)
    console.log(`[Onboarding] Step data:`, stepData)
    console.log(`[Onboarding] All user data:`, userData)
    return stepData
  } catch (error) {
    console.error('Error getting step data:', error)
    return null
  }
}

/**
 * Complete the onboarding process
 */
export async function completeOnboarding(userId: string): Promise<void> {
  try {
    // Get the onboarding data from server-side storage
    const onboardingData = await getOnboardingState(userId)
    console.log(`[Onboarding] Completing onboarding for userId: ${userId}`, onboardingData)
    const stepData = onboardingData.stepData || {}
    
    // Extract data from onboarding steps
    const profileData = stepData.profile || {}
    const eventData = stepData.event || {}
    const budgetData = stepData.budget || {}
    
    // Start a transaction to create couple and update user
    await prisma.$transaction(async (tx) => {
      // First update user with profile data
      await tx.user.update({
        where: { id: userId },
        data: {
          hasOnboarded: true,
          firstName: profileData.firstName || profileData.partner1Name?.split(' ')[0] || null,
          lastName: profileData.lastName || profileData.partner1Name?.split(' ')[1] || null,
          updatedAt: new Date()
        }
      })
      
      // Create or update user preferences
      await tx.userPreferences.upsert({
        where: { userId },
        create: {
          id: generateId(),
          userId,
          language: profileData.language || 'en',
          timezone: profileData.timezone || 'America/New_York',
          currency: profileData.currency || 'USD',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          firstDayOfWeek: 0,
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        update: {
          language: profileData.language || 'en',
          timezone: profileData.timezone || 'America/New_York',
          currency: profileData.currency || 'USD',
          updatedAt: new Date()
        }
      })
      
      // Create couple profile with onboarding data matching settings structure
      const couple = await tx.couple.create({
        data: {
          id: generateId(),
          partner1Name: profileData.partner1Name || 'Partner 1',
          partner2Name: profileData.partner2Name || 'Partner 2',
          partner1UserId: userId,
          weddingDate: eventData.weddingDate ? new Date(eventData.weddingDate) : null,
          venueName: eventData.venueName || null,
          venueLocation: eventData.venueLocation || null,
          guestCountEstimate: parseInt(eventData.estimatedGuestCount) || 0,
          budgetEstimate: budgetData.totalBudget || 0,
          weddingStyle: eventData.weddingStyle || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      // Create initial budget categories if budget data exists
      if (budgetData.totalBudget && budgetData.totalBudget > 0) {
        const defaultCategories = [
          { name: 'Venue', icon: '🏛️', allocatedAmount: budgetData.venue || 0 },
          { name: 'Catering', icon: '🍽️', allocatedAmount: budgetData.catering || 0 },
          { name: 'Photography', icon: '📸', allocatedAmount: budgetData.photography || 0 },
          { name: 'Music', icon: '🎵', allocatedAmount: budgetData.music || 0 },
          { name: 'Flowers', icon: '💐', allocatedAmount: budgetData.flowers || 0 },
          { name: 'Attire', icon: '👗', allocatedAmount: budgetData.attire || 0 }
        ].filter(cat => cat.allocatedAmount > 0)
        
        for (const category of defaultCategories) {
          await tx.budgetCategory.create({
            data: {
              id: generateId(),
              coupleId: couple.id,
              name: category.name,
              icon: category.icon,
              allocatedAmount: category.allocatedAmount,
              spentAmount: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        }
      }
      
      // Clear onboarding data after successful completion
      if (typeof global !== 'undefined' && global.onboardingDataStore) {
        global.onboardingDataStore.delete(userId)
        console.log(`[Onboarding Server] Cleared server-side data for userId: ${userId}`)
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('onboarding-data')
      }
    })
    
    // Track completion
    trackOnboardingEvent('ob_completed', { userId })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    throw error
  }
}

// Helper function to generate IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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