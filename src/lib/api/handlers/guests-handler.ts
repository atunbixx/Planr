import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BaseApiHandler } from '../base-handler'
import { GuestService } from '@/features/guests/service/guest.service'

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
  private guestService = new GuestService()
  
  async list(request: NextRequest) {
    return this.handleRequest(request, async () => {
      // Parse query parameters
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const rsvpStatus = url.searchParams.get('rsvpStatus')
      
      return await this.guestService.getGuestsForCouple({
        page,
        pageSize: limit,
        rsvpStatus
      })
    })
  }
  
  async create(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const data = await this.validateRequest(request, createGuestSchema)
      
      // Transform to enterprise service format
      const createRequest = {
        name: `${data.firstName} ${data.lastName || ''}`.trim(),
        email: data.email,
        phone: data.phone,
        relationship: data.side, // Map side to relationship
        side: data.side,
        hasPlusOne: data.plusOneAllowed,
        dietaryRestrictions: data.dietaryRestrictions ? [data.dietaryRestrictions] : []
      }
      
      return await this.guestService.createGuest(createRequest)
    })
  }
  
  async update(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const data = await this.validateRequest(request, updateGuestSchema)
      
      // Transform to enterprise service format
      const updateRequest = {
        ...(data.firstName && { name: `${data.firstName} ${data.lastName || ''}`.trim() }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.side && { side: data.side, relationship: data.side }),
        ...(data.plusOneAllowed !== undefined && { hasPlusOne: data.plusOneAllowed }),
        ...(data.dietaryRestrictions && { dietaryRestrictions: [data.dietaryRestrictions] })
      }
      
      return await this.guestService.updateGuest(id, updateRequest)
    })
  }
  
  async delete(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      return await this.guestService.deleteGuest(id)
    })
  }
  
  async updateRsvp(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const rsvpSchema = z.object({
        status: z.enum(['pending', 'confirmed', 'declined']),
        dietaryRestrictions: z.string().optional(),
        plusOneName: z.string().optional()
      })
      
      const data = await this.validateRequest(request, rsvpSchema)
      
      // Transform to enterprise service format
      const updateRequest = {
        rsvpStatus: data.status,
        ...(data.dietaryRestrictions && { dietaryRestrictions: [data.dietaryRestrictions] }),
        ...(data.plusOneName && { plusOneName: data.plusOneName })
      }
      
      return await this.guestService.updateGuest(id, updateRequest)
    })
  }
}