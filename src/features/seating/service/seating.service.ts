import { SeatingRepository } from '../repo/seating.repository'
import { CreateTableInput, UpdateTableInput, TableFilterInput, AssignGuestToSeatInput, BulkSeatAssignmentInput, AutoAssignSeatsInput, TableResponse, SeatingChartResponse, SeatingStatsResponse } from '../dto/seating.dto'

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    statusCode?: number
  }
}

export class SeatingService {
  private repository = new SeatingRepository()

  /**
   * Get seating chart with all tables and seats
   */
  async getSeatingChart(userId: string, filters?: TableFilterInput): Promise<ServiceResult<SeatingChartResponse>> {
    try {
      const [tablesResult, statsResult] = await Promise.all([
        this.repository.findTablesByUserId(userId, filters),
        this.repository.getSeatingStats(userId)
      ])

      if (!tablesResult.success) {
        return {
          success: false,
          error: tablesResult.error
        }
      }

      if (!statsResult.success) {
        return {
          success: false,
          error: statsResult.error
        }
      }

      const tables = tablesResult.data || []
      const stats = statsResult.data!

      return {
        success: true,
        data: {
          tables: tables.map(this.transformTableToResponse),
          stats: {
            totalTables: stats.totalTables,
            totalSeats: stats.totalSeats,
            assignedSeats: stats.assignedSeats,
            unassignedSeats: stats.unassignedSeats,
            totalGuests: stats.totalGuests,
            seatedGuests: stats.seatedGuests,
            unseatedGuests: stats.unseatedGuests
          }
        }
      }
    } catch (error) {
      console.error('Error in SeatingService.getSeatingChart:', error)
      return {
        success: false,
        error: {
          message: 'Failed to fetch seating chart',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Get a single table by ID
   */
  async getTableById(tableId: string): Promise<ServiceResult<TableResponse | null>> {
    try {
      const result = await this.repository.findTableById(tableId)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const table = result.data
      
      return {
        success: true,
        data: table ? this.transformTableToResponse(table) : null
      }
    } catch (error) {
      console.error('Error in SeatingService.getTableById:', error)
      return {
        success: false,
        error: {
          message: 'Failed to fetch table',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Create a new table
   */
  async createTable(userId: string, data: CreateTableInput): Promise<ServiceResult<TableResponse>> {
    try {
      // Validate input
      if (!data.name?.trim()) {
        return {
          success: false,
          error: {
            message: 'Table name is required',
            code: 'VALIDATION_ERROR',
            statusCode: 400
          }
        }
      }

      if (data.capacity < 1 || data.capacity > 20) {
        return {
          success: false,
          error: {
            message: 'Table capacity must be between 1 and 20',
            code: 'VALIDATION_ERROR',
            statusCode: 400
          }
        }
      }

      const result = await this.repository.createTable(userId, data)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const table = result.data!

      // Create seats for the table
      await this.repository.createSeats(table.id, table.capacity)

      // Fetch the table with seats
      const tableWithSeats = await this.repository.findTableById(table.id)
      
      return {
        success: true,
        data: this.transformTableToResponse(tableWithSeats.data!)
      }
    } catch (error) {
      console.error('Error in SeatingService.createTable:', error)
      return {
        success: false,
        error: {
          message: 'Failed to create table',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Update an existing table
   */
  async updateTable(tableId: string, data: UpdateTableInput): Promise<ServiceResult<TableResponse>> {
    try {
      // Validate input
      if (data.name !== undefined && !data.name?.trim()) {
        return {
          success: false,
          error: {
            message: 'Table name cannot be empty',
            code: 'VALIDATION_ERROR',
            statusCode: 400
          }
        }
      }

      if (data.capacity !== undefined && (data.capacity < 1 || data.capacity > 20)) {
        return {
          success: false,
          error: {
            message: 'Table capacity must be between 1 and 20',
            code: 'VALIDATION_ERROR',
            statusCode: 400
          }
        }
      }

      const result = await this.repository.updateTable(tableId, data)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: this.transformTableToResponse(result.data!)
      }
    } catch (error) {
      console.error('Error in SeatingService.updateTable:', error)
      return {
        success: false,
        error: {
          message: 'Failed to update table',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Delete a table
   */
  async deleteTable(tableId: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.repository.deleteTable(tableId)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: result.data!
      }
    } catch (error) {
      console.error('Error in SeatingService.deleteTable:', error)
      return {
        success: false,
        error: {
          message: 'Failed to delete table',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Assign guest to seat
   */
  async assignGuestToSeat(seatId: string, data: AssignGuestToSeatInput): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.repository.assignGuestToSeat(seatId, data)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: true
      }
    } catch (error) {
      console.error('Error in SeatingService.assignGuestToSeat:', error)
      return {
        success: false,
        error: {
          message: 'Failed to assign guest to seat',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Get seating statistics
   */
  async getStats(userId: string): Promise<ServiceResult<SeatingStatsResponse>> {
    try {
      const result = await this.repository.getSeatingStats(userId)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const stats = result.data!
      const assignmentProgress = stats.totalGuests > 0 ? (stats.seatedGuests / stats.totalGuests) * 100 : 0
      const tableUtilization = stats.totalSeats > 0 ? (stats.assignedSeats / stats.totalSeats) * 100 : 0

      return {
        success: true,
        data: {
          totalTables: stats.totalTables,
          totalSeats: stats.totalSeats,
          assignedSeats: stats.assignedSeats,
          unassignedSeats: stats.unassignedSeats,
          totalGuests: stats.totalGuests,
          seatedGuests: stats.seatedGuests,
          unseatedGuests: stats.unseatedGuests,
          assignmentProgress: Math.round(assignmentProgress * 100) / 100,
          tableUtilization: Math.round(tableUtilization * 100) / 100,
          sideBalance: {
            bride: 0, // Placeholder - would calculate from actual data
            groom: 0, // Placeholder - would calculate from actual data
            unspecified: stats.seatedGuests // Placeholder - would calculate from actual data
          }
        }
      }
    } catch (error) {
      console.error('Error in SeatingService.getStats:', error)
      return {
        success: false,
        error: {
          message: 'Failed to get seating statistics',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Transform table entity to TableResponse DTO
   */
  private transformTableToResponse(table: any): TableResponse {
    return {
      id: table.id,
      userId: table.userId,
      name: table.name,
      shape: table.shape,
      capacity: table.capacity,
      positionX: table.positionX,
      positionY: table.positionY,
      rotation: table.rotation,
      width: table.width,
      height: table.height,
      diameter: table.diameter,
      color: table.color,
      notes: table.notes,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
      seats: (table.seats || []).map((seat: any) => ({
        id: seat.id,
        tableId: seat.tableId,
        guestId: seat.guestId,
        seatNumber: seat.seatNumber,
        positionX: seat.positionX,
        positionY: seat.positionY,
        isHost: seat.isHost,
        notes: seat.notes,
        createdAt: seat.createdAt,
        updatedAt: seat.updatedAt,
        guest: seat.guest ? {
          id: seat.guest.id,
          name: seat.guest.name,
          rsvpStatus: seat.guest.rsvpStatus,
          side: seat.guest.side,
          relationshipCategory: seat.guest.relationshipCategory,
          householdId: seat.guest.householdId
        } : null
      }))
    }
  }
}

