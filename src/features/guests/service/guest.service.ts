import { Guest } from '@prisma/client'
import { GuestRepository } from '../repo/guest.repository'
import { CreateGuestInput, UpdateGuestInput, GuestFilterInput, GuestResponse, GuestListResponse } from '../dto/guest.dto'

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    statusCode?: number
  }
}

export class GuestService {
  private guestRepository: GuestRepository

  constructor() {
    this.guestRepository = new GuestRepository()
  }

  /**
   * Get all guests for a couple with filtering and pagination
   */
  async getGuestsByCoupleId(
    coupleId: string,
    filters?: GuestFilterInput
  ): Promise<ServiceResult<GuestListResponse>> {
    try {
      // Validate coupleId
      if (!coupleId || typeof coupleId !== 'string') {
        return {
          success: false,
          error: {
            message: 'Invalid couple ID',
            code: 'INVALID_COUPLE_ID',
            statusCode: 400
          }
        }
      }

      const result = await this.guestRepository.findByCoupleId(coupleId, filters)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const guests = result.data || []
      // Accurate total with filters
      const totalRes = await this.guestRepository.countByCoupleIdWithFilters(coupleId, filters)
      const total = totalRes.success && typeof totalRes.data === 'number' ? totalRes.data : guests.length
      const { limit = 50, offset = 0 } = filters || {}

      const response: GuestListResponse = {
        guests: guests.map(this.transformToResponse),
        total,
        limit,
        offset
      }

      return {
        success: true,
        data: response
      }
    } catch (error) {
      console.error('Error in getGuestsByCoupleId:', error)
      return {
        success: false,
        error: {
          message: 'Failed to fetch guests',
          code: 'FETCH_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Get a single guest by ID
   */
  async getGuestById(id: string): Promise<ServiceResult<GuestResponse | null>> {
    try {
      if (!id || typeof id !== 'string') {
        return {
          success: false,
          error: {
            message: 'Invalid guest ID',
            code: 'INVALID_GUEST_ID',
            statusCode: 400
          }
        }
      }

      const result = await this.guestRepository.findById(id)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const guest = result.data
      if (!guest) {
        return {
          success: false,
          error: {
            message: 'Guest not found',
            code: 'GUEST_NOT_FOUND',
            statusCode: 404
          }
        }
      }

      return {
        success: true,
        data: this.transformToResponse(guest)
      }
    } catch (error) {
      console.error('Error in getGuestById:', error)
      return {
        success: false,
        error: {
          message: 'Failed to fetch guest',
          code: 'FETCH_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Create a new guest
   */
  async createGuest(
    coupleId: string,
    data: CreateGuestInput
  ): Promise<ServiceResult<GuestResponse>> {
    try {
      // Validate inputs
      if (!coupleId || typeof coupleId !== 'string') {
        return {
          success: false,
          error: {
            message: 'Invalid couple ID',
            code: 'INVALID_COUPLE_ID',
            statusCode: 400
          }
        }
      }

      // Business logic validations
      if (data.plusOneAllowed && data.attendingCount > 2) {
        return {
          success: false,
          error: {
            message: 'Attending count cannot exceed 2 when plus one is allowed',
            code: 'INVALID_ATTENDING_COUNT',
            statusCode: 400
          }
        }
      }

      if (data.plusOneName && !data.plusOneAllowed) {
        return {
          success: false,
          error: {
            message: 'Plus one name provided but plus one not allowed',
            code: 'PLUS_ONE_NOT_ALLOWED',
            statusCode: 400
          }
        }
      }

      // Note: Email field not in current schema - duplicate check disabled
      // TODO: Re-enable when schema includes email field
      // Check for duplicate guests (by name for now)
      const existingGuests = await this.guestRepository.findByCoupleId(coupleId)
      if (existingGuests.success && existingGuests.data) {
        const fullName = `${data.firstName} ${data.lastName || ''}`.trim()
        const duplicate = existingGuests.data.find(g => g.name === fullName)
        if (duplicate) {
          return {
            success: false,
            error: {
              message: 'Guest with this name already exists',
              code: 'DUPLICATE_NAME',
              statusCode: 409
            }
          }
        }
      }

      const result = await this.guestRepository.create(coupleId, data)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: this.transformToResponse(result.data!)
      }
    } catch (error) {
      console.error('Error in createGuest:', error)
      return {
        success: false,
        error: {
          message: 'Failed to create guest',
          code: 'CREATE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Update an existing guest
   */
  async updateGuest(
    id: string,
    data: UpdateGuestInput
  ): Promise<ServiceResult<GuestResponse>> {
    try {
      if (!id || typeof id !== 'string') {
        return {
          success: false,
          error: {
            message: 'Invalid guest ID',
            code: 'INVALID_GUEST_ID',
            statusCode: 400
          }
        }
      }

      // Business logic validations
      if (data.plusOneAllowed !== undefined && data.attendingCount !== undefined) {
        if (data.plusOneAllowed && data.attendingCount > 2) {
          return {
            success: false,
            error: {
              message: 'Attending count cannot exceed 2 when plus one is allowed',
              code: 'INVALID_ATTENDING_COUNT',
              statusCode: 400
            }
          }
        }
      }

      if (data.plusOneName && data.plusOneAllowed === false) {
        return {
          success: false,
          error: {
            message: 'Plus one name provided but plus one not allowed',
            code: 'PLUS_ONE_NOT_ALLOWED',
            statusCode: 400
          }
        }
      }

      const result = await this.guestRepository.update(id, data)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      if (!result.data) {
        return {
          success: false,
          error: {
            message: 'Guest not found',
            code: 'GUEST_NOT_FOUND',
            statusCode: 404
          }
        }
      }

      return {
        success: true,
        data: this.transformToResponse(result.data)
      }
    } catch (error) {
      console.error('Error in updateGuest:', error)
      return {
        success: false,
        error: {
          message: 'Failed to update guest',
          code: 'UPDATE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Delete a guest
   */
  async deleteGuest(id: string): Promise<ServiceResult<void>> {
    try {
      if (!id || typeof id !== 'string') {
        return {
          success: false,
          error: {
            message: 'Invalid guest ID',
            code: 'INVALID_GUEST_ID',
            statusCode: 400
          }
        }
      }

      const result = await this.guestRepository.delete(id)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      if (!result.data) {
        return {
          success: false,
          error: {
            message: 'Guest not found',
            code: 'GUEST_NOT_FOUND',
            statusCode: 404
          }
        }
      }

      return {
        success: true
      }
    } catch (error) {
      console.error('Error in deleteGuest:', error)
      return {
        success: false,
        error: {
          message: 'Failed to delete guest',
          code: 'DELETE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Get guest statistics for a couple
   */
  async getGuestStats(coupleId: string): Promise<ServiceResult<{
    total: number
    bridesSide: number
    groomsSide: number
    withEmail: number
    withPhone: number
    plusOnesAllowed: number
    totalAttending: number
  }>> {
    try {
      if (!coupleId || typeof coupleId !== 'string') {
        return {
          success: false,
          error: {
            message: 'Invalid couple ID',
            code: 'INVALID_COUPLE_ID',
            statusCode: 400
          }
        }
      }

      const result = await this.guestRepository.findByCoupleId(coupleId)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const guests = result.data || []
      
      const stats = {
        total: guests.length,
        bridesSide: guests.filter(g => g.side === 'bride').length,
        groomsSide: guests.filter(g => g.side === 'groom').length,
        withEmail: 0, // Email field not in current schema
        withPhone: 0, // Phone field not in current schema
        plusOnesAllowed: guests.filter((g: any) => (g as any).plusOneAllowed === true).length,
        totalAttending: guests.length // Assume 1 per guest since attendingCount not in schema
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      console.error('Error in getGuestStats:', error)
      return {
        success: false,
        error: {
          message: 'Failed to fetch guest statistics',
          code: 'STATS_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Transform Guest model to response DTO
   */
  private transformToResponse(guest: Guest): GuestResponse {
    // Parse name field to extract firstName and lastName
    const nameParts = guest.name ? guest.name.trim().split(' ') : ['', '']
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    
    return {
      id: guest.id,
      coupleId: guest.userId, // Map userId to coupleId for enterprise response
      firstName: firstName,
      lastName: lastName,
      rsvpStatus: (guest as any).rsvpStatus || 'pending',
      email: undefined, // Not in current schema
      phone: undefined, // Not in current schema
      address: undefined, // Not in current schema
      relationship: undefined, // Not in current schema
      relationshipCategory: (guest as any).relationshipCategory || undefined,
      side: guest.side as 'bride' | 'groom' | undefined,
      plusOneAllowed: (guest as any).plusOneAllowed === true,
      plusOneName: (guest as any).plusOneName || undefined,
      dietaryRestrictions: guest.mealPreference || undefined,
      notes: undefined, // Not in current schema
      attendingCount: 1, // Not in current schema, default 1
      invitationSentAt: guest.invitationSent ? guest.createdAt : undefined, // Use createdAt if sent
      rsvpDeadline: undefined, // Not in current schema
      createdAt: guest.createdAt,
      updatedAt: guest.updatedAt
    }
  }
}
