/**
 * Guests API Handler - Enterprise API pattern with validation and error handling
 */

import { NextRequest } from 'next/server'
import { GuestService } from '../service'
import { 
  CreateGuestRequestSchema, 
  UpdateGuestRequestSchema,
  GuestSearchRequestSchema,
  BulkCreateGuestsRequestSchema,
  BulkUpdateGuestsRequestSchema,
  TableAssignmentUpdateSchema,
  RsvpUpdateRequestSchema
} from '../dto'
import { validateRequest, createApiResponse, handleApiError } from '@/shared/validation/middleware'
import { ApiError } from '@/shared/validation/errors'

export class GuestsApiHandler {
  private guestService = new GuestService()

  /**
   * POST /api/guests - Create guest
   */
  async createGuest(request: NextRequest) {
    try {
      const body = await request.json()
      const validatedData = await validateRequest(CreateGuestRequestSchema, body)
      
      const guest = await this.guestService.createGuest(validatedData)
      
      return createApiResponse({
        data: guest,
        message: 'Guest created successfully',
        status: 201
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * POST /api/guests/bulk - Bulk create guests
   */
  async bulkCreateGuests(request: NextRequest) {
    try {
      const body = await request.json()
      const validatedData = await validateRequest(BulkCreateGuestsRequestSchema, body)
      
      const result = await this.guestService.bulkCreateGuests(validatedData)
      
      return createApiResponse({
        data: result.created,
        meta: {
          import: result.errors
        },
        message: `${result.created.length} guests imported successfully`,
        status: 201
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/guests - Get guests for current user's couple
   */
  async getGuests(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const queryData = {
        search: searchParams.get('search') || undefined,
        side: searchParams.get('side') || undefined,
        type: searchParams.get('type') || undefined,
        rsvpStatus: searchParams.get('rsvpStatus') || undefined,
        ceremonyAttending: searchParams.get('ceremonyAttending') ? searchParams.get('ceremonyAttending') === 'true' : undefined,
        receptionAttending: searchParams.get('receptionAttending') ? searchParams.get('receptionAttending') === 'true' : undefined,
        hasPlusOne: searchParams.get('hasPlusOne') ? searchParams.get('hasPlusOne') === 'true' : undefined,
        tableNumber: searchParams.get('tableNumber') ? parseInt(searchParams.get('tableNumber')!) : undefined,
        isVip: searchParams.get('isVip') ? searchParams.get('isVip') === 'true' : undefined,
        invitationSent: searchParams.get('invitationSent') ? searchParams.get('invitationSent') === 'true' : undefined,
        giftReceived: searchParams.get('giftReceived') ? searchParams.get('giftReceived') === 'true' : undefined,
        thankYouSent: searchParams.get('thankYouSent') ? searchParams.get('thankYouSent') === 'true' : undefined,
        needsAccommodation: searchParams.get('needsAccommodation') ? searchParams.get('needsAccommodation') === 'true' : undefined,
        needsTransportation: searchParams.get('needsTransportation') ? searchParams.get('needsTransportation') === 'true' : undefined,
        relationship: searchParams.get('relationship') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || '20'),
        sortBy: searchParams.get('sortBy') || 'name',
        sortOrder: searchParams.get('sortOrder') || 'asc'
      }
      
      // Remove undefined values
      const filteredQuery = Object.fromEntries(
        Object.entries(queryData).filter(([_, v]) => v !== undefined)
      )
      
      const result = await this.guestService.getGuestsForCouple(filteredQuery)
      
      return createApiResponse({
        data: result.data,
        meta: {
          pagination: result.pagination
        },
        message: 'Guests retrieved successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/guests/:id - Get guest by ID
   */
  async getGuestById(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      
      const guest = await this.guestService.getGuestById(id)
      
      return createApiResponse({
        data: guest,
        message: 'Guest retrieved successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * PATCH /api/guests/:id - Update guest
   */
  async updateGuest(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      const body = await request.json()
      const validatedData = await validateRequest(UpdateGuestRequestSchema, body)
      
      const guest = await this.guestService.updateGuest(id, validatedData)
      
      return createApiResponse({
        data: guest,
        message: 'Guest updated successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * DELETE /api/guests/:id - Delete guest
   */
  async deleteGuest(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      
      await this.guestService.deleteGuest(id)
      
      return createApiResponse({
        message: 'Guest deleted successfully',
        status: 204
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/guests/stats - Get guest statistics
   */
  async getGuestStats(request: NextRequest) {
    try {
      const stats = await this.guestService.getGuestStats()
      
      return createApiResponse({
        data: stats,
        message: 'Guest statistics retrieved'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * PATCH /api/guests/bulk - Bulk update guests
   */
  async bulkUpdateGuests(request: NextRequest) {
    try {
      const body = await request.json()
      const validatedData = await validateRequest(BulkUpdateGuestsRequestSchema, body)
      
      const guests = await this.guestService.bulkUpdateGuests(validatedData)
      
      return createApiResponse({
        data: guests,
        message: 'Guests updated successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * POST /api/guests/table-assignments - Update table assignments
   */
  async updateTableAssignments(request: NextRequest) {
    try {
      const body = await request.json()
      const validatedData = await validateRequest(TableAssignmentUpdateSchema, body)
      
      const guests = await this.guestService.updateTableAssignments(validatedData)
      
      return createApiResponse({
        data: guests,
        message: 'Table assignments updated successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/guests/table-assignments - Get table assignments overview
   */
  async getTableAssignments(request: NextRequest) {
    try {
      const assignments = await this.guestService.getTableAssignments()
      
      return createApiResponse({
        data: assignments,
        message: 'Table assignments retrieved successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * PUT /api/guests/rsvp/:invitationCode - Update RSVP (public endpoint)
   */
  async updateRsvp(request: NextRequest, params: { invitationCode: string }) {
    try {
      const { invitationCode } = params
      const body = await request.json()
      const validatedData = await validateRequest(RsvpUpdateRequestSchema, body)
      
      const guest = await this.guestService.updateRsvp(invitationCode, validatedData)
      
      return createApiResponse({
        data: guest,
        message: 'RSVP updated successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }
}