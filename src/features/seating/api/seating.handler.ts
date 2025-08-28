import { NextRequest, NextResponse } from 'next/server'
import { SeatingService } from '../service/seating.service'
import { CreateTableDto, UpdateTableDto, TableFilterDto, AssignGuestToSeatDto } from '../dto/seating.dto'

export class SeatingHandler {
  private service = new SeatingService()

  /**
   * GET /api/seating - Get seating chart with all tables and seats
   */
  async getSeatingChart(request: NextRequest, userId: string) {
    try {
      const { searchParams } = new URL(request.url)
      
      // Parse query parameters
      const filters = {
        shape: searchParams.get('shape') || undefined,
        minCapacity: searchParams.get('minCapacity') ? parseInt(searchParams.get('minCapacity')!) : undefined,
        maxCapacity: searchParams.get('maxCapacity') ? parseInt(searchParams.get('maxCapacity')!) : undefined,
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0')
      }

      // Validate filters
      const validationResult = TableFilterDto.safeParse(filters)
      if (!validationResult.success) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Invalid filter parameters',
            details: validationResult.error.issues
          }
        }, { status: 400 })
      }

      const result = await this.service.getSeatingChart(userId, validationResult.data)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }

      return NextResponse.json({ success: true, data: result.data })
    } catch (error) {
      console.error('Error in SeatingHandler.getSeatingChart:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/seating/[id]/seats - Create seats for a table
   */
  async createSeatsForTable(request: NextRequest, tableId: string) {
    try {
      const body = await request.json().catch(() => ({}))
      const capacity = Number(body?.capacity)

      const result = await this.service.createSeats(tableId, capacity)
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }
      return NextResponse.json({ success: true, data: { seats: result.data } }, { status: 201 })
    } catch (error) {
      console.error('Error in SeatingHandler.createSeatsForTable:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    }
  }
  /**
   * POST /api/seating/tables - Create a new table
   */
  async createTable(request: NextRequest, userId: string) {
    try {
      const body = await request.json()
      
      // Validate input
      const validationResult = CreateTableDto.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Invalid table data',
            details: validationResult.error.issues
          }
        }, { status: 400 })
      }

      const result = await this.service.createTable(userId, validationResult.data)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }

      return NextResponse.json(
        { success: true, data: result.data },
        { status: 201 }
      )
    } catch (error) {
      console.error('Error in SeatingHandler.createTable:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    }
  }

  /**
   * GET /api/seating/tables/[id] - Get a single table
   */
  async getTableById(request: NextRequest, tableId: string) {
    try {
      const result = await this.service.getTableById(tableId)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }

      if (!result.data) {
        return NextResponse.json(
          { success: false, error: { message: 'Table not found' } },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: result.data })
    } catch (error) {
      console.error('Error in SeatingHandler.getTableById:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    }
  }

  /**
   * PATCH /api/seating/tables/[id] - Update a table
   */
  async updateTable(request: NextRequest, tableId: string) {
    try {
      const body = await request.json()
      
      // Validate input
      const validationResult = UpdateTableDto.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Invalid table data',
            details: validationResult.error.issues
          }
        }, { status: 400 })
      }

      const result = await this.service.updateTable(tableId, validationResult.data)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }

      return NextResponse.json({ success: true, data: result.data })
    } catch (error) {
      console.error('Error in SeatingHandler.updateTable:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    }
  }

  /**
   * DELETE /api/seating/tables/[id] - Delete a table
   */
  async deleteTable(request: NextRequest, tableId: string) {
    try {
      const result = await this.service.deleteTable(tableId)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }

      return NextResponse.json({ success: true, data: { deleted: result.data } })
    } catch (error) {
      console.error('Error in SeatingHandler.deleteTable:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/seating/seats/[id]/assign - Assign guest to seat
   */
  async assignGuestToSeat(request: NextRequest, seatId: string) {
    try {
      const body = await request.json()
      
      // Validate input
      const validationResult = AssignGuestToSeatDto.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Invalid assignment data',
            details: validationResult.error.issues
          }
        }, { status: 400 })
      }

      const result = await this.service.assignGuestToSeat(seatId, validationResult.data)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }

      return NextResponse.json({ success: true, data: { assigned: result.data } })
    } catch (error) {
      console.error('Error in SeatingHandler.assignGuestToSeat:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    }
  }

  /**
   * GET /api/seating/stats - Get seating statistics
   */
  async getStats(request: NextRequest, userId: string) {
    try {
      const result = await this.service.getStats(userId)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }

      return NextResponse.json({ success: true, data: result.data })
    } catch (error) {
      console.error('Error in SeatingHandler.getStats:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    }
  }
}
