import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BaseApiHandler, NotFoundException } from '../base-handler'
import { prisma } from '@/lib/prisma'
import { toApiFormat, toDbFormat } from '@/lib/db/transformations'

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
  
  // Preferences methods
  async getPreferences(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const userId = this.requireUserId()
      
      // Get user preferences
      const preferences = await prisma.user_preferences.findUnique({
        where: { user_id: userId }
      })
      
      if (!preferences) {
        // Create default preferences if they don't exist
        const defaultPreferences = await prisma.user_preferences.create({
          data: {
            user_id: userId,
            language: 'en',
            timezone: 'UTC',
            currency: 'USD',
            date_format: 'MM/DD/YYYY',
            time_format: '12h',
            first_day_of_week: 0,
            email_notifications: true,
            sms_notifications: false,
            push_notifications: true,
            reminder_settings: {
              enabled: true,
              daysBefore: 7,
              timeOfDay: '09:00'
            },
            privacy_settings: {
              showRsvpPublicly: true,
              allowGuestUploads: true,
              requirePhotoApproval: false
            },
            created_at: new Date(),
            updated_at: new Date()
          }
        })
        
        return toApiFormat(defaultPreferences, 'UserPreference')
      }
      
      return toApiFormat(preferences, 'UserPreference')
    })
  }
  
  async updatePreferences(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const userId = this.requireUserId()
      const data = await this.validateRequest(request, updatePreferencesSchema)
      
      // Transform to database format
      const dbData = toDbFormat(data, 'UserPreference')
      
      // Update or create preferences
      const preferences = await prisma.user_preferences.upsert({
        where: { user_id: userId },
        update: {
          language: dbData.language,
          timezone: dbData.timezone,
          currency: dbData.currency,
          date_format: dbData.dateFormat,
          time_format: dbData.timeFormat,
          first_day_of_week: dbData.firstDayOfWeek,
          email_notifications: dbData.emailNotifications,
          sms_notifications: dbData.smsNotifications,
          push_notifications: dbData.pushNotifications,
          reminder_settings: dbData.reminderSettings,
          privacy_settings: dbData.privacy,
          updated_at: new Date()
        },
        create: {
          user_id: userId,
          language: dbData.language || 'en',
          timezone: dbData.timezone || 'UTC',
          currency: dbData.currency || 'USD',
          date_format: dbData.dateFormat || 'MM/DD/YYYY',
          time_format: dbData.timeFormat || '12h',
          first_day_of_week: dbData.firstDayOfWeek || 0,
          email_notifications: dbData.emailNotifications ?? true,
          sms_notifications: dbData.smsNotifications ?? false,
          push_notifications: dbData.pushNotifications ?? true,
          reminder_settings: dbData.reminderSettings || {
            enabled: true,
            daysBefore: 7,
            timeOfDay: '09:00'
          },
          privacy_settings: dbData.privacy || {
            showRsvpPublicly: true,
            allowGuestUploads: true,
            requirePhotoApproval: false
          },
          created_at: new Date(),
          updated_at: new Date()
        }
      })
      
      return toApiFormat(preferences, 'UserPreference')
    })
  }
  
  // Wedding details methods
  async getWeddingDetails(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      const couple = await prisma.couples.findUnique({
        where: { id: coupleId }
      })
      
      if (!couple) {
        throw new NotFoundException('Wedding details not found')
      }
      
      // Transform couple data to wedding details format
      return {
        partnerOneName: couple.partner1_name,
        partnerTwoName: couple.partner2_name,
        weddingDate: couple.wedding_date?.toISOString(),
        venue: couple.venue_details as any,
        ceremonyTime: couple.ceremony_time,
        receptionTime: couple.reception_time,
        guestCount: couple.estimated_guests,
        budget: couple.total_budget,
        theme: couple.wedding_theme,
        primaryColor: couple.primary_color,
        secondaryColor: couple.secondary_color,
        website: couple.wedding_website,
        hashtag: couple.wedding_hashtag,
        story: couple.our_story
      }
    })
  }
  
  async updateWeddingDetails(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updateWeddingDetailsSchema)
      
      // Update couple details
      const updatedCouple = await prisma.couples.update({
        where: { id: coupleId },
        data: {
          partner1_name: data.partnerOneName,
          partner2_name: data.partnerTwoName,
          wedding_date: data.weddingDate ? new Date(data.weddingDate) : undefined,
          venue_details: data.venue,
          ceremony_time: data.ceremonyTime,
          reception_time: data.receptionTime,
          estimated_guests: data.guestCount,
          total_budget: data.budget,
          wedding_theme: data.theme,
          primary_color: data.primaryColor,
          secondary_color: data.secondaryColor,
          wedding_website: data.website,
          wedding_hashtag: data.hashtag,
          our_story: data.story,
          updated_at: new Date()
        }
      })
      
      // Return in the same format
      return {
        partnerOneName: updatedCouple.partner1_name,
        partnerTwoName: updatedCouple.partner2_name,
        weddingDate: updatedCouple.wedding_date?.toISOString(),
        venue: updatedCouple.venue_details as any,
        ceremonyTime: updatedCouple.ceremony_time,
        receptionTime: updatedCouple.reception_time,
        guestCount: updatedCouple.estimated_guests,
        budget: updatedCouple.total_budget,
        theme: updatedCouple.wedding_theme,
        primaryColor: updatedCouple.primary_color,
        secondaryColor: updatedCouple.secondary_color,
        website: updatedCouple.wedding_website,
        hashtag: updatedCouple.wedding_hashtag,
        story: updatedCouple.our_story
      }
    })
  }
  
  // Collaborator methods
  async listCollaborators(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      const collaborators = await prisma.couple_collaborators.findMany({
        where: { couple_id: coupleId },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              image_url: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })
      
      return collaborators.map(collab => ({
        id: collab.id,
        userId: collab.user_id,
        email: collab.users?.email,
        name: collab.users?.name,
        imageUrl: collab.users?.image_url,
        role: collab.role,
        permissions: collab.permissions,
        invitedAt: collab.created_at.toISOString(),
        acceptedAt: collab.accepted_at?.toISOString()
      }))
    })
  }
  
  async inviteCollaborator(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, createCollaboratorSchema)
      
      // Check if user exists
      const invitedUser = await prisma.users.findUnique({
        where: { email: data.email }
      })
      
      if (!invitedUser) {
        // Create invitation record for non-existing user
        const invitation = await prisma.couple_invitations.create({
          data: {
            couple_id: coupleId,
            email: data.email,
            role: data.role,
            permissions: data.permissions,
            token: crypto.randomBytes(32).toString('hex'),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            created_at: new Date()
          }
        })
        
        // TODO: Send invitation email
        
        return {
          success: true,
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            expiresAt: invitation.expires_at.toISOString()
          }
        }
      }
      
      // Check if already a collaborator
      const existingCollaborator = await prisma.couple_collaborators.findFirst({
        where: {
          couple_id: coupleId,
          user_id: invitedUser.id
        }
      })
      
      if (existingCollaborator) {
        throw new BadRequestException('User is already a collaborator')
      }
      
      // Add as collaborator
      const collaborator = await prisma.couple_collaborators.create({
        data: {
          couple_id: coupleId,
          user_id: invitedUser.id,
          role: data.role,
          permissions: data.permissions,
          accepted_at: new Date(), // Auto-accept for existing users
          created_at: new Date(),
          updated_at: new Date()
        }
      })
      
      return {
        success: true,
        collaborator: {
          id: collaborator.id,
          userId: collaborator.user_id,
          email: invitedUser.email,
          role: collaborator.role,
          permissions: collaborator.permissions
        }
      }
    })
  }
  
  async updateCollaborator(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updateCollaboratorSchema)
      
      // Check if collaborator exists and belongs to this couple
      const existingCollaborator = await prisma.couple_collaborators.findFirst({
        where: {
          id: id,
          couple_id: coupleId
        }
      })
      
      if (!existingCollaborator) {
        throw new NotFoundException('Collaborator not found')
      }
      
      const updatedCollaborator = await prisma.couple_collaborators.update({
        where: { id },
        data: {
          role: data.role,
          permissions: data.permissions,
          updated_at: new Date()
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      })
      
      return {
        id: updatedCollaborator.id,
        userId: updatedCollaborator.user_id,
        email: updatedCollaborator.users?.email,
        name: updatedCollaborator.users?.name,
        role: updatedCollaborator.role,
        permissions: updatedCollaborator.permissions
      }
    })
  }
  
  async removeCollaborator(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Check if collaborator exists and belongs to this couple
      const existingCollaborator = await prisma.couple_collaborators.findFirst({
        where: {
          id: id,
          couple_id: coupleId
        }
      })
      
      if (!existingCollaborator) {
        throw new NotFoundException('Collaborator not found')
      }
      
      await prisma.couple_collaborators.delete({
        where: { id }
      })
      
      return { success: true }
    })
  }
}

// Import crypto for invitation tokens
import crypto from 'crypto'