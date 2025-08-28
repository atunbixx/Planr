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
      if (!coupleId || typeof coupleId !== 'string') {
        return { success: false, error: { message: 'Invalid couple ID', code: 'INVALID_COUPLE_ID', statusCode: 400 } }
      }

      const result = await this.guestRepository.findByCoupleId(coupleId, filters)
      if (!result.success) {
        return { success: false, error: result.error }
      }

      const guests = result.data || []
      const totalRes = await this.guestRepository.countByCoupleIdWithFilters(coupleId, filters)
      const total = totalRes.success && typeof totalRes.data === 'number' ? totalRes.data : guests.length
      const { limit = 50, offset = 0 } = filters || {}

      const response: GuestListResponse = {
        guests: guests.map(this.transformToResponse),
        total,
        limit,
        offset,
      }

      return { success: true, data: response }
    } catch (error) {
      console.error('Error in getGuestsByCoupleId:', error)
      return { success: false, error: { message: 'Failed to fetch guests', code: 'FETCH_ERROR', statusCode: 500 } }
    }
  }

  /**
   * Get a single guest by ID
   */
  async getGuestById(id: string): Promise<ServiceResult<GuestResponse | null>> {
    try {
      if (!id || typeof id !== 'string') {
        return { success: false, error: { message: 'Invalid guest ID', code: 'INVALID_GUEST_ID', statusCode: 400 } }
      }

      const result = await this.guestRepository.findById(id)
      if (!result.success) {
        return { success: false, error: result.error }
      }

      const guest = result.data
      if (!guest) {
        return { success: false, error: { message: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 } }
      }

      return { success: true, data: this.transformToResponse(guest) }
    } catch (error) {
      console.error('Error in getGuestById:', error)
      return { success: false, error: { message: 'Failed to fetch guest', code: 'FETCH_ERROR', statusCode: 500 } }
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
      if (!coupleId || typeof coupleId !== 'string') {
        return { success: false, error: { message: 'Invalid couple ID', code: 'INVALID_COUPLE_ID', statusCode: 400 } }
      }

      if (data.plusOneAllowed && data.attendingCount > 2) {
        return { success: false, error: { message: 'Attending count cannot exceed 2 when plus one is allowed', code: 'INVALID_ATTENDING_COUNT', statusCode: 400 } }
      }

      if (data.plusOneName && !data.plusOneAllowed) {
        return { success: false, error: { message: 'Plus one name provided but plus one not allowed', code: 'PLUS_ONE_NOT_ALLOWED', statusCode: 400 } }
      }

      // Check for duplicate guests by email if provided
      if (data.email) {
        const existingGuests = await this.guestRepository.findByCoupleId(coupleId, { hasEmail: true })
        if (existingGuests.success && existingGuests.data) {
          const duplicate = existingGuests.data.find(g => g.email === data.email)
          if (duplicate) {
            return { success: false, error: { message: 'Guest with this email already exists', code: 'DUPLICATE_EMAIL', statusCode: 409 } }
          }
        }
      }

      const result = await this.guestRepository.create(coupleId, data)
      if (!result.success) {
        return { success: false, error: result.error }
      }

      return { success: true, data: this.transformToResponse(result.data!) }
    } catch (error) {
      console.error('Error in createGuest:', error)
      return { success: false, error: { message: 'Failed to create guest', code: 'CREATE_ERROR', statusCode: 500 } }
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
        return { success: false, error: { message: 'Invalid guest ID', code: 'INVALID_GUEST_ID', statusCode: 400 } }
      }

      const result = await this.guestRepository.update(id, data)
      if (!result.success) {
        return { success: false, error: result.error }
      }

      if (!result.data) {
        return { success: false, error: { message: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 } }
      }

      return { success: true, data: this.transformToResponse(result.data) }
    } catch (error) {
      console.error('Error in updateGuest:', error)
      return { success: false, error: { message: 'Failed to update guest', code: 'UPDATE_ERROR', statusCode: 500 } }
    }
  }

  /**
   * Delete a guest
   */
  async deleteGuest(id: string): Promise<ServiceResult<void>> {
    try {
      if (!id || typeof id !== 'string') {
        return { success: false, error: { message: 'Invalid guest ID', code: 'INVALID_GUEST_ID', statusCode: 400 } }
      }

      const result = await this.guestRepository.delete(id)
      if (!result.success) {
        return { success: false, error: result.error }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteGuest:', error)
      return { success: false, error: { message: 'Failed to delete guest', code: 'DELETE_ERROR', statusCode: 500 } }
    }
  }

  /**
   * Get guest statistics for a couple
   */
  async getGuestStats(coupleId: string): Promise<ServiceResult<any>> {
    try {
      if (!coupleId || typeof coupleId !== 'string') {
        return { success: false, error: { message: 'Invalid couple ID', code: 'INVALID_COUPLE_ID', statusCode: 400 } }
      }

      const result = await this.guestRepository.findByCoupleId(coupleId, { limit: 1000 }) // Get all guests
      if (!result.success) {
        return { success: false, error: result.error }
      }

      const guests = result.data || []
      const stats = {
        total: guests.length,
        bridesSide: guests.filter(g => g.side === 'bride').length,
        groomsSide: guests.filter(g => g.side === 'groom').length,
        withEmail: guests.filter(g => !!g.email).length,
        withPhone: guests.filter(g => !!g.phone).length,
        plusOnesAllowed: guests.filter(g => g.plusOneAllowed).length,
        totalAttending: guests.reduce((sum, g) => sum + (g.attendingCount || 0), 0),
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error in getGuestStats:', error)
      return { success: false, error: { message: 'Failed to fetch guest statistics', code: 'STATS_ERROR', statusCode: 500 } }
    }
  }

  /**
   * Transform Guest model to response DTO
   */
  private transformToResponse(guest: Guest): GuestResponse {
    return {
      id: guest.id,
      coupleId: guest.userId,
      firstName: guest.firstName,
      lastName: guest.lastName || '',
      email: guest.email || undefined,
      phone: guest.phone || undefined,
      address: guest.address || undefined,
      relationship: guest.relationship || undefined,
      relationshipCategory: (guest.relationshipCategory as any) || undefined,
      side: guest.side || undefined,
      rsvpStatus: guest.rsvpStatus,
      plusOneAllowed: guest.plusOneAllowed,
      plusOneName: guest.plusOneName || undefined,
      attendingCount: guest.attendingCount,
      dietaryRestrictions: guest.dietaryRestrictions || undefined,
      notes: guest.notes || undefined,
      tags: guest.tags ? guest.tags.split(',') : [],
      invitationSent: guest.invitationSent,
      invitationSentAt: guest.invitationSentAt || undefined,
      rsvpDeadline: guest.rsvpDeadline || undefined,
      createdAt: guest.createdAt,
      updatedAt: guest.updatedAt,
    }
  }
}
