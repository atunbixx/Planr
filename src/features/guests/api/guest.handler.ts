import { NextRequest, NextResponse } from 'next/server'
import { GuestService } from '../service/guest.service'
import { CreateGuestDto, UpdateGuestDto, GuestFilterDto } from '../dto/guest.dto'

export class GuestHandler {
  private guestService: GuestService

  constructor() {
    this.guestService = new GuestService()
  }

  /**
   * GET /api/guests - List all guests for the authenticated couple
   */
  async getGuests(request: NextRequest, coupleId: string): Promise<NextResponse> {
    try {
      // Parse query parameters for filtering
      const url = new URL(request.url)
      const filters = {
        side: url.searchParams.get('side') as 'bride' | 'groom' | undefined,
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
      console.error('Error in getGuests handler:', error)
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

      return NextResponse.json({
        success: true,
        data: result.data
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

      const result = await this.guestService.updateGuest(guestId, validation.data)

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