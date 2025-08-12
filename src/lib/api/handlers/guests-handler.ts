import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BaseApiHandler } from '../base-handler'
import { guestService } from '@/lib/services/guest.service'

// Validation schemas
const createGuestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  plusOneAllowed: z.boolean().default(false),
  side: z.enum(['partner1', 'partner2', 'both']).optional()
})

const updateGuestSchema = createGuestSchema.partial()

export class GuestsHandler extends BaseApiHandler {
  protected model = 'Guest' as const
  
  async list(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Parse query parameters
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const rsvpStatus = url.searchParams.get('rsvpStatus')
      
      return await guestService.getGuestsForCouple(coupleId, {
        page,
        limit,
        rsvpStatus
      })
    })
  }
  
  async create(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, createGuestSchema)
      
      // Transform to database format
      const dbData = this.transformInput({
        ...data,
        coupleId
      })
      
      return await guestService.createGuest(dbData)
    })
  }
  
  async update(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updateGuestSchema)
      
      // Transform to database format
      const dbData = this.transformInput(data)
      
      return await guestService.updateGuest(id, coupleId, dbData)
    })
  }
  
  async delete(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      return await guestService.deleteGuest(id, coupleId)
    })
  }
  
  async updateRsvp(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      const rsvpSchema = z.object({
        status: z.enum(['pending', 'confirmed', 'declined']),
        dietaryRestrictions: z.string().optional(),
        plusOneName: z.string().optional()
      })
      
      const data = await this.validateRequest(request, rsvpSchema)
      const dbData = this.transformInput(data)
      
      return await guestService.updateRsvp(id, coupleId, dbData)
    })
  }
}