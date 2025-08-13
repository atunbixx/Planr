import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/features/couples'
import { FIELD_MAPPINGS } from '@/lib/db/field-mappings'
import { validateModelFields } from '@/lib/api/validation/field-validator'
import { cache } from '@/lib/cache'
import { Prisma } from '@prisma/client'

// Validation schemas
const updateWeddingSettingsSchema = z.object({
  partner1Name: z.string().optional(),
  partner2Name: z.string().optional(),
  weddingDate: z.string().optional(), // Accept any date string format
  venue: z.string().optional(), // Maps to venueName
  location: z.string().optional(), // Maps to venueLocation
  expectedGuests: z.number().optional(), // Maps to guestCountEstimate
  totalBudget: z.number().optional(),
  weddingStyle: z.string().optional(),
  currency: z.string().optional().default('NGN')
})

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.enum(['12h', '24h']).optional()
})

export class WeddingSettingsHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PUT':
          return await this.handlePost(request) // Treat PUT as POST for backward compatibility
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)

    // Check cache first
    const cacheKey = `wedding-settings:couple:${authContext.userId}`
    const cachedData = await cache.get<any>(cacheKey)
    
    if (cachedData) {
      return this.successResponse(cachedData)
    }

    // Get couple using the service to check all user ID fields
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.successResponse({ couple: null })
    }

    // Map database fields to expected frontend fields
    const mappedCouple = {
      id: couple.id,
      partner1Name: couple.partner1Name,
      partner2Name: couple.partner2Name,
      weddingDate: couple.weddingDate,
      venueName: couple.venueName,
      venueLocation: couple.venueLocation,
      guestCountEstimate: couple.guestCountEstimate,
      expectedGuests: couple.guestCountEstimate, // Map for backward compatibility
      totalBudget: couple.totalBudget ? Number(couple.totalBudget) : null,
      weddingStyle: couple.weddingStyle,
      currency: couple.currency || 'NGN',
      onboardingCompleted: couple.onboardingCompleted,
      createdAt: couple.createdAt,
      updatedAt: couple.updatedAt
    }

    const response = { couple: mappedCouple }

    // Cache for 5 minutes
    await cache.set(cacheKey, response, 300000)

    return this.successResponse(response)
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    let validatedData;
    try {
      validatedData = updateWeddingSettingsSchema.parse(body)
    } catch (error) {
      console.error('Validation error:', error)
      return this.errorResponse('Invalid data provided', 400)
    }

    // Map frontend field names to database field names
    const mappedData: any = {
      partner1Name: validatedData.partner1Name,
      partner2Name: validatedData.partner2Name,
      weddingDate: validatedData.weddingDate ? new Date(validatedData.weddingDate) : undefined,
      venueName: validatedData.venue,
      venueLocation: validatedData.location,
      guestCountEstimate: validatedData.expectedGuests,
      totalBudget: validatedData.totalBudget ? new Prisma.Decimal(validatedData.totalBudget) : undefined,
      weddingStyle: validatedData.weddingStyle,
      currency: validatedData.currency
    }

    // Remove undefined values
    Object.keys(mappedData).forEach(key => {
      if (mappedData[key] === undefined) {
        delete mappedData[key]
      }
    })

    // Get or create couple
    let couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (couple) {
      // Update existing couple
      couple = await prisma.couple.update({
        where: { id: couple.id },
        data: mappedData
      })
    } else {
      // Create new couple
      // First ensure user exists
      const dbUser = await prisma.user.findUnique({
        where: { supabase_user_id: authContext.userId }
      })

      if (!dbUser) {
        // Create user if doesn't exist
        const user = await prisma.user.create({
          data: {
            supabase_user_id: authContext.userId,
            email: authContext.email,
            firstName: validatedData.partner1Name?.split(' ')[0] || '',
            lastName: validatedData.partner1Name?.split(' ').slice(1).join(' ') || ''
          }
        })

        couple = await prisma.couple.create({
          data: {
            userId: user.id,
            partner1Name: validatedData.partner1Name || '',
            partner2Name: validatedData.partner2Name || '',
            weddingDate: mappedData.weddingDate || new Date(),
            venueName: validatedData.venue || '',
            venueLocation: validatedData.location || '',
            guestCountEstimate: validatedData.expectedGuests || 100,
            totalBudget: new Prisma.Decimal(validatedData.totalBudget || 5000000),
            weddingStyle: validatedData.weddingStyle || 'traditional',
            currency: validatedData.currency || 'NGN',
            onboardingCompleted: false
          }
        })
      } else {
        couple = await prisma.couple.create({
          data: {
            userId: dbUser.id,
            partner1Name: validatedData.partner1Name || '',
            partner2Name: validatedData.partner2Name || '',
            weddingDate: mappedData.weddingDate || new Date(),
            venueName: validatedData.venue || '',
            venueLocation: validatedData.location || '',
            guestCountEstimate: validatedData.expectedGuests || 100,
            totalBudget: new Prisma.Decimal(validatedData.totalBudget || 5000000),
            weddingStyle: validatedData.weddingStyle || 'traditional',
            currency: validatedData.currency || 'NGN',
            onboardingCompleted: false
          }
        })
      }
    }

    // Clear caches
    await this.clearSettingsCache(authContext.userId, couple.id)

    // Return mapped response
    const mappedResponse = {
      id: couple.id,
      partner1Name: couple.partner1Name,
      partner2Name: couple.partner2Name,
      weddingDate: couple.weddingDate,
      venueName: couple.venueName,
      venueLocation: couple.venueLocation,
      guestCountEstimate: couple.guestCountEstimate,
      expectedGuests: couple.guestCountEstimate,
      totalBudget: couple.totalBudget ? Number(couple.totalBudget) : null,
      weddingStyle: couple.weddingStyle,
      currency: couple.currency || 'NGN',
      onboardingCompleted: couple.onboardingCompleted,
      createdAt: couple.createdAt,
      updatedAt: couple.updatedAt
    }

    return this.successResponse({ 
      couple: mappedResponse 
    }, { 
      action: couple ? 'updated' : 'created' 
    })
  }

  private async clearSettingsCache(userId: string, coupleId: string): Promise<void> {
    await Promise.all([
      cache.delete(`wedding-settings:${userId}`),
      cache.delete(`wedding-settings:couple:${userId}`),
      cache.delete(`dashboard-stats:${userId}`),
      cache.delete(`dashboard-stats:couple:${coupleId}`)
    ])
  }
}

export class PreferencesHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PUT':
          return await this.handlePost(request)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)

    // Get user with preferences
    const user = await prisma.user.findUnique({
      where: { supabase_user_id: authContext.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        preferences: true
      }
    })

    if (!user) {
      return this.errorResponse('USER_NOT_FOUND', 'User not found', 404)
    }

    // Parse preferences JSON
    const preferences = user.preferences ? 
      (typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences) : 
      {
        theme: 'system',
        language: 'en',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        timezone: 'Africa/Lagos',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h'
      }

    return this.successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      },
      preferences
    })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate preferences
    const validatedPreferences = updatePreferencesSchema.parse(body)

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { supabase_user_id: authContext.userId },
      data: {
        preferences: JSON.stringify(validatedPreferences)
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        preferences: true
      }
    })

    // Parse preferences for response
    const preferences = updatedUser.preferences ? 
      (typeof updatedUser.preferences === 'string' ? JSON.parse(updatedUser.preferences) : updatedUser.preferences) : 
      validatedPreferences

    return this.successResponse({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone
      },
      preferences
    }, { action: 'updated' })
  }
}