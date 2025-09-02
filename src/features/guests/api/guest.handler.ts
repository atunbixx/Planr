import { NextRequest, NextResponse } from 'next/server'
import { startSpan } from '@/lib/observability/otel'
import { GuestService } from '../service/guest.service'
import { tempStorage } from '@/lib/db/temp-storage'
import { CreateGuestDto, UpdateGuestDto, GuestFilterDto } from '../dto/guest.dto'
import { GuestListResponseDto, GuestResponseDto } from '@/contracts/guests'

export class GuestHandler {
  private guestService: GuestService

  constructor() {
    this.guestService = new GuestService()
  }

  /**
   * POST /api/guests/bulk - Bulk updates for RSVP, invitation, household
   */
  async bulkUpdate(request: NextRequest, coupleId: string): Promise<NextResponse> {
    const span = await startSpan('guests.bulkUpdate', { coupleId })
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
    } finally {
      span.end()
    }
  }

  /**
   * GET /api/guests - List all guests for the authenticated couple
   */
  async getGuests(request: NextRequest, coupleId: string): Promise<NextResponse> {
    const span = await startSpan('guests.getGuests', { coupleId })
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
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }

      const data = GuestListResponseDto.parse({
        guests: result.data!.guests,
        total: result.data!.total,
        limit: result.data!.limit,
        offset: result.data!.offset,
      })
      const res = NextResponse.json({ success: true, data })
      res.headers.set('cache-control', 'private, max-age=30, stale-while-revalidate=120')
      return res
    } catch (error) {
      console.error('Error in getGuests handler:', error)
      return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
    } finally {
      span.end()
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

      const data = result.data ? GuestResponseDto.parse(result.data) : null
      const res = NextResponse.json({ success: true, data })
      res.headers.set('cache-control', 'private, max-age=30, stale-while-revalidate=120')
      return res
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
    const span = await startSpan('guests.createGuest', { coupleId })
    try {
      const body = await request.json()

      // Validate input
      const validation = CreateGuestDto.safeParse(body)
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

      const data = GuestResponseDto.parse(result.data)
      return NextResponse.json({ success: true, data }, { status: 201 })
    } catch (error) {
      console.error('Error in createGuest handler:', error)
      return NextResponse.json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500
        }
      }, { status: 500 })
    } finally {
      span.end()
    }
  }

  /**
   * PUT /api/guests/[id] - Update a guest
   */
  async updateGuest(request: NextRequest, guestId: string): Promise<NextResponse> {
    const span = await startSpan('guests.updateGuest', { guestId })
    try {
      const body = await request.json()

      // Validate input
      const validation = UpdateGuestDto.safeParse(body)
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

      const result = await this.guestService.updateGuest(guestId, validation.data as any)

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: result.error?.statusCode || 500 })
      }

      const data = GuestResponseDto.parse(result.data)
      return NextResponse.json({ success: true, data })
    } catch (error) {
      console.error('Error in updateGuest handler:', error)
      return NextResponse.json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500
        }
      }, { status: 500 })
    } finally {
      span.end()
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
