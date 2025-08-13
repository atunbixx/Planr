import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BaseApiHandler, NotFoundException, BadRequestException } from '../base-handler'
import { prisma } from '@/lib/prisma'
import { toApiFormat, toDbFormat } from '@/lib/db/transformations'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'

// Validation schemas
const updatePreferencesSchema = z.object({
  language: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional(),
  firstDayOfWeek: z.number().min(0).max(6).optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  reminderSettings: z.object({
    enabled: z.boolean(),
    daysBefore: z.number().min(1).max(365),
    timeOfDay: z.string()
  }).optional(),
  privacy: z.object({
    showRsvpPublicly: z.boolean(),
    allowGuestUploads: z.boolean(),
    requirePhotoApproval: z.boolean()
  }).optional()
})

const updateWeddingDetailsSchema = z.object({
  partnerOneName: z.string().optional(),
  partnerTwoName: z.string().optional(),
  weddingDate: z.string().optional(),
  venue: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }).optional(),
  ceremonyTime: z.string().optional(),
  receptionTime: z.string().optional(),
  guestCount: z.number().min(0).optional(),
  budget: z.number().min(0).optional(),
  theme: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  website: z.string().url().optional(),
  hashtag: z.string().optional(),
  story: z.string().optional()
})

const createCollaboratorSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
  permissions: z.array(z.string()).default([])
})

const updateCollaboratorSchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
  permissions: z.array(z.string()).optional()
})

export class SettingsHandlerV2 extends BaseApiHandler {
  private coupleRepository = new CoupleRepository()
  
  // Preferences methods
  async getPreferences(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const userId = this.requireUserId()
      
      // Get user's couple information first
      const couple = await this.coupleRepository.findByUserId(userId)
      if (!couple) {
        throw new BadRequestException('User must be part of a couple to have preferences')
      }
      
      // Get user preferences by couple_id
      const preferences = await prisma.user_preferences.findMany({
        where: { couple_id: couple.id }
      })
      
      if (!preferences.length) {
        // Return empty preferences object
        return { preferences: {} }
      }
      
      // Convert preferences array to object
      const preferencesObj = preferences.reduce((acc, pref) => {
        if (!acc[pref.preference_type]) {
          acc[pref.preference_type] = {}
        }
        acc[pref.preference_type][pref.preference_key] = pref.preference_value
        return acc
      }, {} as any)
      
      return { preferences: preferencesObj }
    })
  }
  
  async updatePreferences(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const userId = this.requireUserId()
      const data = await this.validateRequest(request, updatePreferencesSchema)
      
      // Get couple first
      const couple = await this.coupleRepository.findByUserId(userId)
      if (!couple) {
        throw new BadRequestException('User must be part of a couple to have preferences')
      }
      
      // Prepare preference updates
      const updates = []
      
      // Convert flat object to preference entries
      for (const [key, value] of Object.entries(data)) {
        let preferenceType = 'general'
        let preferenceKey = key
        
        // Categorize preferences
        if (['emailNotifications', 'smsNotifications', 'pushNotifications'].includes(key)) {
          preferenceType = 'notifications'
        } else if (['language', 'timezone', 'currency', 'dateFormat', 'timeFormat', 'firstDayOfWeek'].includes(key)) {
          preferenceType = 'localization'
        } else if (key === 'reminderSettings') {
          preferenceType = 'reminders'
        } else if (key === 'privacy') {
          preferenceType = 'privacy'
        }
        
        updates.push({
          couple_id: couple.id,
          preference_type: preferenceType,
          preference_key: preferenceKey,
          preference_value: value
        })
      }
      
      // Upsert each preference
      const updatedPreferences = await Promise.all(
        updates.map(update => 
          prisma.user_preferences.upsert({
            where: {
              couple_id_preference_type_preference_key: {
                couple_id: update.couple_id,
                preference_type: update.preference_type,
                preference_key: update.preference_key
              }
            },
            update: {
              preference_value: update.preference_value,
              updated_at: new Date()
            },
            create: update
          })
        )
      )
      
      // Convert back to object format
      const preferencesObj = updatedPreferences.reduce((acc, pref) => {
        if (!acc[pref.preference_type]) {
          acc[pref.preference_type] = {}
        }
        acc[pref.preference_type][pref.preference_key] = pref.preference_value
        return acc
      }, {} as any)
      
      return { preferences: preferencesObj }
    })
  }
  
  // Wedding details methods
  async getWeddingDetails(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const userId = this.requireUserId()
      
      // Use repository to get couple data
      const couple = await this.coupleRepository.findByUserId(userId)
      
      if (couple) {
        // Transform couple data to wedding details format
        return {
          partnerOneName: couple.partner1Name,
          partnerTwoName: couple.partner2Name,
          weddingDate: couple.weddingDate?.toISOString(),
          venue: couple.venueLocation ? {
            name: couple.venueName || couple.venueLocation,
            city: couple.venueLocation,
            state: '',
            country: '',
            address: ''
          } : null,
          ceremonyTime: null,
          receptionTime: null,
          guestCount: couple.guestCountEstimate,
          budget: couple.budget,
          theme: couple.weddingStyle,
          primaryColor: null,
          secondaryColor: null,
          website: null,
          hashtag: null,
          story: null
        }
      }
      
      // If no couple data, try to get from onboarding progress
      const { getOnboardingState } = await import('@/lib/onboarding')
      const onboardingState = await getOnboardingState(userId)
      
      if (onboardingState.stepData) {
        const { mapOnboardingToSettings } = await import('@/lib/onboarding-mapping')
        const mappedSettings = mapOnboardingToSettings(onboardingState.stepData)
        
        return {
          partnerOneName: mappedSettings.partner1Name || '',
          partnerTwoName: mappedSettings.partner2Name || '',
          weddingDate: mappedSettings.weddingDate || null,
          venue: mappedSettings.location ? {
            name: mappedSettings.venue || `TBD - ${mappedSettings.location} Venue`,
            city: mappedSettings.location,
            state: '',
            country: '',
            address: ''
          } : null,
          ceremonyTime: null,
          receptionTime: null,
          guestCount: mappedSettings.expectedGuests || 0,
          budget: mappedSettings.totalBudget || 0,
          theme: mappedSettings.weddingStyle || '',
          primaryColor: null,
          secondaryColor: null,
          website: null,
          hashtag: null,
          story: null
        }
      }
      
      // Return empty data if neither couple nor onboarding data exists
      return {
        partnerOneName: '',
        partnerTwoName: '',
        weddingDate: null,
        venue: null,
        ceremonyTime: null,
        receptionTime: null,
        guestCount: 0,
        budget: 0,
        theme: '',
        primaryColor: null,
        secondaryColor: null,
        website: null,
        hashtag: null,
        story: null
      }
    })
  }
  
  async updateWeddingDetails(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updateWeddingDetailsSchema)
      
      // Update couple details
      const updatedCouple = await prisma.couple.update({
        where: { id: coupleId },
        data: {
          partner1Name: data.partnerOneName,
          partner2Name: data.partnerTwoName,
          weddingDate: data.weddingDate ? new Date(data.weddingDate) : undefined,
          venueName: data.venue?.name,
          venueLocation: data.venue ? `${data.venue.city}, ${data.venue.state}` : undefined,
          guestCountEstimate: data.guestCount,
          totalBudget: data.budget,
          weddingStyle: data.theme,
          updatedAt: new Date()
        }
      })
      
      // Return in the same format
      return {
        partnerOneName: updatedCouple.partner1Name,
        partnerTwoName: updatedCouple.partner2Name,
        weddingDate: updatedCouple.weddingDate?.toISOString(),
        venue: updatedCouple.venueName ? {
          name: updatedCouple.venueName,
          city: updatedCouple.venueLocation?.split(',')[0]?.trim() || '',
          state: updatedCouple.venueLocation?.split(',')[1]?.trim() || '',
          country: '',
          address: ''
        } : null,
        ceremonyTime: null,
        receptionTime: null,
        guestCount: updatedCouple.guestCountEstimate,
        budget: updatedCouple.totalBudget,
        theme: updatedCouple.weddingStyle,
        primaryColor: null,
        secondaryColor: null,
        website: null,
        hashtag: null,
        story: null
      }
    })
  }
  
  // Collaborator methods
  async listCollaborators(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Note: Collaborators feature not yet implemented in schema
      // Return empty array for now
      return []
    })
  }
  
  async inviteCollaborator(request: NextRequest) {
    return this.handleRequest(request, async () => {
      // Note: Collaborators feature not yet implemented in schema
      throw new BadRequestException('Collaborators feature not yet available')
    })
  }
  
  async updateCollaborator(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      // Note: Collaborators feature not yet implemented in schema
      throw new BadRequestException('Collaborators feature not yet available')
    })
  }
  
  async removeCollaborator(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      // Note: Collaborators feature not yet implemented in schema
      throw new BadRequestException('Collaborators feature not yet available')
    })
  }
}