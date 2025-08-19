import { NextRequest, NextResponse } from 'next/server'
import { GuestService } from '../service/guest.service'
import { tempStorage } from '@/lib/db/temp-storage'
import { CreateGuestDto, UpdateGuestDto, GuestFilterDto } from '../dto/guest.dto'

export class GuestHandler {
  private guestService: GuestService

  constructor() {
    this.guestService = new GuestService()
  }

  /**
   * POST /api/guests/bulk - Bulk updates for RSVP, invitation, household
   */
  async bulkUpdate(request: NextRequest, coupleId: string): Promise<NextResponse> {
    try {
      const body = await request.json().catch(() => ({}))
      const action = String(body?.action || '')
      const ids: string[] = Array.isArray(body?.ids) ? body.ids : []
      if (!ids.length) {
        return NextResponse.json({ success: false, error: { message: 'ids required' } }, { status: 400 })
      }
      if (action === 'setRsvpStatus') {
        const status = body?.status
        if (!['pending','accepted','declined'].includes(status)) {
          return NextResponse.json({ success: false, error: { message: 'invalid status' } }, { status: 400 })
        }
        for (const id of ids) {
          await this.guestService.updateGuest(id, { rsvpStatus: status } as any)
        }
        return NextResponse.json({ success: true, data: { updated: ids.length } })
      }
      if (action === 'setInvitationSent') {
        const invited = Boolean(body?.invitationSent)
        for (const id of ids) {
          await this.guestService.updateGuest(id, { invitationSent: invited } as any)
        }
        return NextResponse.json({ success: true, data: { updated: ids.length } })
      }
      if (action === 'setHousehold') {
        const householdId = typeof body?.householdId === 'string' ? body.householdId : null
        for (const id of ids) {
          await this.guestService.updateGuest(id, { householdId } as any)
        }
        return NextResponse.json({ success: true, data: { updated: ids.length } })
      }
      return NextResponse.json({ success: false, error: { message: 'Invalid action' } }, { status: 400 })
    } catch (error) {
      console.error('Error in bulkUpdate handler:', error)
      return NextResponse.json({ success: false, error: { message: 'Internal server error', statusCode: 500 } }, { status: 500 })
    }
  }

  /**
   * GET /api/guests - List all guests for the authenticated couple
   */
  async getGuests(request: NextRequest, coupleId: string): Promise<NextResponse> {
    try {
      // Parse query parameters for filtering
      const url = new URL(request.url)
      const sideParam = url.searchParams.get('side')
      const statusParam = url.searchParams.get('status')
      const filters = {
        side: sideParam === 'bride' || sideParam === 'groom' ? sideParam : undefined,
        rsvpStatus: statusParam === 'pending' || statusParam === 'accepted' || statusParam === 'declined' ? statusParam : undefined,
        dietary: url.searchParams.get('dietary') || undefined,
        category: url.searchParams.get('category') || undefined,
        plusOneAllowed: url.searchParams.get('plusOneAllowed') === 'true' ? true : 
                        url.searchParams.get('plusOneAllowed') === 'false' ? false : undefined,
        hasEmail: url.searchParams.get('hasEmail') === 'true' ? true :
                  url.searchParams.get('hasEmail') === 'false' ? false : undefined,
        hasPhone: url.searchParams.get('hasPhone') === 'true' ? true :
                  url.searchParams.get('hasPhone') === 'false' ? false : undefined,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50,
        offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0
      }

      // Validate filters
      const filterValidation = GuestFilterDto.safeParse(filters)
      if (!filterValidation.success) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Invalid query parameters',
            details: filterValidation.error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message
            })),
            statusCode: 400
          }
        }, { status: 400 })
      }

      const result = await this.guestService.getGuestsByCoupleId(coupleId, filterValidation.data)

      if (!result.success) {
        try {
          const raw = await tempStorage.findGuestsByUserId(coupleId)
          const legacyGuests = raw.map((guest: any) => ({
            id: guest.id,
            name: String(guest.name || '').trim(),
            rsvpStatus: guest.rsvpStatus || 'pending',
            mealPreference: guest.mealPreference,
            side: guest.side,
            invitationSent: Boolean(guest.invitationSent),
            relationshipCategory: guest.relationshipCategory,
            rsvp: { id: `rsvp_${guest.id}`, status: 'pending', dateResponded: null },
          }))
          return NextResponse.json({ success: true, data: legacyGuests, total: legacyGuests.length, limit: filterValidation.data.limit, offset: filterValidation.data.offset })
        } catch (e) {
          return NextResponse.json({
            success: false,
            error: result.error
          }, { status: result.error?.statusCode || 500 })
        }
      }

      // Transform response to legacy format for frontend compatibility
      const legacyGuests = result.data!.guests.map(guest => ({
        id: guest.id,
        name: `${guest.firstName} ${guest.lastName}`.trim(),
        rsvpStatus: 'pending' as const, // Default for legacy compatibility
        mealPreference: guest.dietaryRestrictions,
        side: guest.side,
        invitationSent: Boolean(guest.invitationSentAt),
        relationshipCategory: (guest as any).relationshipCategory,
        rsvp: {
          id: `rsvp_${guest.id}`,
          status: 'pending',
          dateResponded: null
        }
      }))

      return NextResponse.json({
        success: true,
        data: legacyGuests, // Keep legacy array shape
        total: result.data!.total,
        limit: result.data!.limit,
        offset: result.data!.offset,
      })
    } catch (error) {
      console.error('Error in getGuests handler:', error)
      // Final fallback: try temp storage directly
      try {
        const raw = await tempStorage.findGuestsByUserId(coupleId)
        const legacyGuests = raw.map((guest: any) => ({
          id: guest.id,
          name: String(guest.name || '').trim(),
          rsvpStatus: guest.rsvpStatus || 'pending',
          mealPreference: guest.mealPreference,
          side: guest.side,
          invitationSent: Boolean(guest.invitationSent),
          relationshipCategory: guest.relationshipCategory,
          rsvp: { id: `rsvp_${guest.id}`, status: 'pending', dateResponded: null },
        }))
        return NextResponse.json({ success: true, data: legacyGuests, total: legacyGuests.length, limit: 50, offset: 0 })
      } catch (e) {
        // Last-resort: return empty list to avoid client crash
        return NextResponse.json({ success: true, data: [], total: 0, limit: 50, offset: 0 })
      }
    }
  }

  /**
   * GET /api/guests/[id] - Get a single guest
   */
  async getGuest(guestId: string): Promise<NextResponse> {
    try {
      const result = await this.guestService.getGuestById(guestId)

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: result.error?.statusCode || 500 })
      }

      return NextResponse.json({
        success: true,
        data: result.data
      })
    } catch (error) {
      console.error('Error in getGuest handler:', error)
      return NextResponse.json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500
        }
      }, { status: 500 })
    }
  }

  /**
   * POST /api/guests - Create a new guest
   */
  async createGuest(request: NextRequest, coupleId: string): Promise<NextResponse> {
    try {
      const body = await request.json()

      // Handle legacy format from frontend (name field) 
      let processedBody = body
      if (body.name && !body.firstName && !body.lastName) {
        const nameParts = body.name.trim().split(' ')
        processedBody = {
          ...body,
          firstName: nameParts[0] || body.name,
          lastName: nameParts.slice(1).join(' ') || '',
          dietaryRestrictions: body.mealPreference // Map legacy field
        }
        delete processedBody.name
        delete processedBody.mealPreference
        delete processedBody.rsvpStatus // Remove legacy RSVP field
        delete processedBody.invitationSent // Remove legacy field for now
      }

      // Validate input
      const validation = CreateGuestDto.safeParse(processedBody)
      if (!validation.success) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Validation error',
            details: validation.error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message
            })),
            statusCode: 400
          }
        }, { status: 400 })
      }

      const result = await this.guestService.createGuest(coupleId, validation.data)

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: result.error?.statusCode || 500 })
      }

      // Transform response to legacy format for frontend compatibility
      const legacyResponse = {
        id: result.data!.id,
        name: `${result.data!.firstName} ${result.data!.lastName}`.trim(),
        rsvpStatus: 'pending', // Default for legacy compatibility
        mealPreference: result.data!.dietaryRestrictions,
        side: result.data!.side,
        invitationSent: Boolean(result.data!.invitationSentAt),
        relationshipCategory: (result.data as any).relationshipCategory,
        rsvp: {
          id: `rsvp_${result.data!.id}`,
          status: 'pending',
          dateResponded: null
        }
      }

      return NextResponse.json({
        success: true,
        data: legacyResponse
      }, { status: 201 })
    } catch (error) {
      console.error('Error in createGuest handler:', error)
      return NextResponse.json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500
        }
      }, { status: 500 })
    }
  }

  /**
   * PUT /api/guests/[id] - Update a guest
   */
  async updateGuest(request: NextRequest, guestId: string): Promise<NextResponse> {
    try {
      const body = await request.json()

      // Handle legacy format from frontend (name field)
      let processedBody = body
      if (body.name && !body.firstName && !body.lastName) {
        const nameParts = body.name.trim().split(' ')
        processedBody = {
          ...body,
          firstName: nameParts[0] || body.name,
          lastName: nameParts.slice(1).join(' ') || '',
          dietaryRestrictions: body.mealPreference // Map legacy field
        }
        delete processedBody.name
        delete processedBody.mealPreference
        delete processedBody.rsvpStatus // Remove legacy RSVP field
        delete processedBody.invitationSent // Remove legacy field for now
      }

      // Validate input
      const validation = UpdateGuestDto.safeParse(processedBody)
      if (!validation.success) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Validation error',
            details: validation.error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message
            })),
            statusCode: 400
          }
        }, { status: 400 })
      }

      // Merge legacy fields back in (RSVP + invitation flags) for current schema
      const legacy: any = {}
      if (typeof (processedBody as any).rsvpStatus !== 'undefined') legacy.rsvpStatus = (processedBody as any).rsvpStatus
      if (typeof (processedBody as any).invitationSent !== 'undefined') legacy.invitationSent = (processedBody as any).invitationSent
      if (typeof (processedBody as any).householdId !== 'undefined') legacy.householdId = (processedBody as any).householdId

      const result = await this.guestService.updateGuest(guestId, { ...(validation as any).data, ...legacy } as any)

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: result.error?.statusCode || 500 })
      }

      // Transform response to legacy format for frontend compatibility
      const legacyResponse = result.data ? {
        id: result.data.id,
        name: `${result.data.firstName} ${result.data.lastName}`.trim(),
        rsvpStatus: 'pending', // Default for legacy compatibility
        mealPreference: result.data.dietaryRestrictions,
        side: result.data.side,
        invitationSent: Boolean(result.data.invitationSentAt),
        relationshipCategory: (result.data as any).relationshipCategory,
        rsvp: {
          id: `rsvp_${result.data.id}`,
          status: 'pending',
          dateResponded: null
        }
      } : null

      return NextResponse.json({
        success: true,
        data: legacyResponse
      })
    } catch (error) {
      console.error('Error in updateGuest handler:', error)
      return NextResponse.json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500
        }
      }, { status: 500 })
    }
  }

  /**
   * DELETE /api/guests/[id] - Delete a guest
   */
  async deleteGuest(guestId: string): Promise<NextResponse> {
    try {
      const result = await this.guestService.deleteGuest(guestId)

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: result.error?.statusCode || 500 })
      }

      return NextResponse.json({
        success: true,
        data: { deleted: true }
      })
    } catch (error) {
      console.error('Error in deleteGuest handler:', error)
      return NextResponse.json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500
        }
      }, { status: 500 })
    }
  }

  /**
   * GET /api/guests/stats - Get guest statistics
   */
  async getGuestStats(coupleId: string): Promise<NextResponse> {
    try {
      const result = await this.guestService.getGuestStats(coupleId)

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: result.error?.statusCode || 500 })
      }

      return NextResponse.json({
        success: true,
        data: result.data
      })
    } catch (error) {
      console.error('Error in getGuestStats handler:', error)
      return NextResponse.json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500
        }
      }, { status: 500 })
    }
  }
}
