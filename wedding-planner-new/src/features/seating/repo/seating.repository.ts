import { BaseRepository, RepositoryResult, createSuccessResult, createErrorResult } from '@/lib/repositories/BaseRepository'
import { tempStorage } from '@/lib/db/temp-storage'
import { CreateTableInput, UpdateTableInput, TableFilterInput, CreateSeatInput, UpdateSeatInput, AssignGuestToSeatInput, BulkSeatAssignmentInput } from '../dto/seating.dto'

// Type definitions (matches Prisma schema)
type Table = {
  id: string
  userId: string
  name: string
  shape: 'round' | 'rectangle' | 'square' | 'oval'
  capacity: number
  positionX: number
  positionY: number
  rotation: number
  width: number | null
  height: number | null
  diameter: number | null
  color: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

type Seat = {
  id: string
  tableId: string
  guestId: string | null
  seatNumber: number
  positionX: number
  positionY: number
  isHost: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

type TableWithSeats = Table & {
  seats: (Seat & {
    guest: {
      id: string
      name: string
      rsvpStatus: 'pending' | 'accepted' | 'declined'
      side: 'bride' | 'groom' | null
      relationshipCategory: string | null
      householdId: string | null
    } | null
  })[]
}

export class SeatingRepository extends BaseRepository {
  
  /**
   * Find all tables for a user with seats and guest information
   */
  async findTablesByUserId(
    userId: string, 
    filters?: TableFilterInput
  ): Promise<RepositoryResult<TableWithSeats[]>> {
    try {
      const { limit = 50, offset = 0, shape, minCapacity, maxCapacity } = filters || {}
      
      // Try database first
      try {
        const where: any = { userId }
        
        if (shape) where.shape = shape
        if (minCapacity) where.capacity = { gte: minCapacity }
        if (maxCapacity) {
          where.capacity = where.capacity ? { ...where.capacity, lte: maxCapacity } : { lte: maxCapacity }
        }

        const tables = await (this.db as any).table.findMany({
          where,
          include: {
            seats: {
              include: {
                guest: {
                  select: {
                    id: true,
                    name: true,
                    rsvpStatus: true,
                    side: true,
                    relationshipCategory: true,
                    householdId: true
                  }
                }
              },
              orderBy: { seatNumber: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })

        return createSuccessResult(tables)
      } catch (dbError) {
        // Fallback to temp storage
        console.warn('Database not available, using temp storage:', dbError)
        const tempTables = await tempStorage.listSeating(userId)
        
        // Apply filters (temp storage tables may not have shape property)
         let filteredTables = tempTables
         if (shape) filteredTables = filteredTables.filter(t => (t as any).shape === shape)
         if (minCapacity) filteredTables = filteredTables.filter(t => t.capacity >= minCapacity)
         if (maxCapacity) filteredTables = filteredTables.filter(t => t.capacity <= maxCapacity)
        
        const paginatedTables = filteredTables.slice(offset, offset + limit)
        return createSuccessResult(paginatedTables.map(this.transformTempTable))
      }
    } catch (error) {
      console.error('Error in SeatingRepository.findTablesByUserId:', error)
      return createErrorResult('Failed to fetch tables', 'FETCH_ERROR', 500)
    }
  }

  /**
   * Find table by ID with seats and guest information
   */
  async findTableById(tableId: string): Promise<RepositoryResult<TableWithSeats | null>> {
    try {
      // Try database first
      try {
        const table = await (this.db as any).table.findUnique({
          where: { id: tableId },
          include: {
            seats: {
              include: {
                guest: {
                  select: {
                    id: true,
                    name: true,
                    rsvpStatus: true,
                    side: true,
                    relationshipCategory: true,
                    householdId: true
                  }
                }
              },
              orderBy: { seatNumber: 'asc' }
            }
          }
        })
        return createSuccessResult(table)
      } catch (dbError) {
        // Fallback to temp storage
        const tempTable = await tempStorage.findTableById(tableId)
        return createSuccessResult(tempTable ? this.transformTempTable(tempTable) : null)
      }
    } catch (error) {
      console.error('Error in SeatingRepository.findTableById:', error)
      return createErrorResult('Failed to fetch table', 'FETCH_ERROR', 500)
    }
  }

  /**
   * Create a new table
   */
  async createTable(userId: string, data: CreateTableInput): Promise<RepositoryResult<TableWithSeats>> {
    try {
      const tableData = {
        userId,
        name: data.name,
        shape: data.shape,
        capacity: data.capacity,
        positionX: data.positionX,
        positionY: data.positionY,
        rotation: data.rotation,
        width: data.width || null,
        height: data.height || null,
        diameter: data.diameter || null,
        color: data.color || null,
        notes: data.notes || null
      }

      // Try database first
      try {
        const table = await (this.db as any).table.create({
          data: tableData,
          include: {
            seats: {
              include: {
                guest: {
                  select: {
                    id: true,
                    name: true,
                    rsvpStatus: true,
                    side: true,
                    relationshipCategory: true,
                    householdId: true
                  }
                }
              },
              orderBy: { seatNumber: 'asc' }
            }
          }
        })
        return createSuccessResult(table)
      } catch (dbError) {
         // Fallback to temp storage (basic table creation)
         const tempTable = await tempStorage.createTable(userId, {
           name: data.name,
           capacity: data.capacity
         })
         // Enhance with additional properties
         const enhancedTable = {
           ...tempTable,
           shape: data.shape,
           positionX: data.positionX,
           positionY: data.positionY,
           rotation: data.rotation,
           width: data.width,
           height: data.height,
           diameter: data.diameter,
           color: data.color,
           notes: data.notes
         }
        return createSuccessResult(this.transformTempTable(enhancedTable))
      }
    } catch (error) {
      console.error('Error in SeatingRepository.createTable:', error)
      return createErrorResult('Failed to create table', 'CREATE_ERROR', 500)
    }
  }

  /**
   * Update a table
   */
  async updateTable(tableId: string, data: UpdateTableInput): Promise<RepositoryResult<TableWithSeats>> {
    try {
      const updateData: any = {}
      
      if (data.name !== undefined) updateData.name = data.name
      if (data.shape !== undefined) updateData.shape = data.shape
      if (data.capacity !== undefined) updateData.capacity = data.capacity
      if (data.positionX !== undefined) updateData.positionX = data.positionX
      if (data.positionY !== undefined) updateData.positionY = data.positionY
      if (data.rotation !== undefined) updateData.rotation = data.rotation
      if (data.width !== undefined) updateData.width = data.width
      if (data.height !== undefined) updateData.height = data.height
      if (data.diameter !== undefined) updateData.diameter = data.diameter
      if (data.color !== undefined) updateData.color = data.color
      if (data.notes !== undefined) updateData.notes = data.notes
      
      updateData.updatedAt = new Date()

      // Try database first
      try {
        const table = await (this.db as any).table.update({
          where: { id: tableId },
          data: updateData,
          include: {
            seats: {
              include: {
                guest: {
                  select: {
                    id: true,
                    name: true,
                    rsvpStatus: true,
                    side: true,
                    relationshipCategory: true,
                    householdId: true
                  }
                }
              },
              orderBy: { seatNumber: 'asc' }
            }
          }
        })
        return createSuccessResult(table)
      } catch (dbError) {
         // Fallback to temp storage
         const tempTable = await tempStorage.updateTable('', tableId, data as any)
         if (!tempTable) {
           return createErrorResult('Table not found', 'NOT_FOUND', 404)
         }
         return createSuccessResult(this.transformTempTable(tempTable))
      }
    } catch (error) {
      console.error('Error in SeatingRepository.updateTable:', error)
      return createErrorResult('Failed to update table', 'UPDATE_ERROR', 500)
    }
  }

  /**
   * Delete a table
   */
  async deleteTable(tableId: string): Promise<RepositoryResult<boolean>> {
    try {
      // Try database first
      try {
        await (this.db as any).table.delete({
          where: { id: tableId }
        })
        return createSuccessResult(true)
      } catch (dbError) {
         // Fallback to temp storage
         const result = await tempStorage.deleteTable('', tableId)
         return createSuccessResult(result)
      }
    } catch (error) {
      console.error('Error in SeatingRepository.deleteTable:', error)
      return createErrorResult('Failed to delete table', 'DELETE_ERROR', 500)
    }
  }

  /**
   * Create seats for a table
   */
  async createSeats(tableId: string, capacity: number): Promise<RepositoryResult<Seat[]>> {
    try {
      // Try database first
      try {
        const seats = []
        for (let i = 1; i <= capacity; i++) {
          const seat = await (this.db as any).seat.create({
            data: {
              tableId,
              seatNumber: i,
              positionX: 0,
              positionY: 0,
              isHost: false
            }
          })
          seats.push(seat)
        }
        return createSuccessResult(seats)
      } catch (dbError) {
        // Fallback to temp storage
        const seats = await tempStorage.createSeatsForTable(tableId, capacity)
        return createSuccessResult(seats)
      }
    } catch (error) {
      console.error('Error in SeatingRepository.createSeats:', error)
      return createErrorResult('Failed to create seats', 'CREATE_ERROR', 500)
    }
  }

  /**
   * Assign guest to seat
   */
  async assignGuestToSeat(seatId: string, data: AssignGuestToSeatInput): Promise<RepositoryResult<Seat>> {
    try {
      // Try database first
      try {
        const seat = await (this.db as any).seat.update({
          where: { id: seatId },
          data: {
            guestId: data.guestId,
            notes: data.notes,
            updatedAt: new Date()
          }
        })
        return createSuccessResult(seat)
      } catch (dbError) {
        // Fallback to temp storage
        const seat = await tempStorage.assignGuestToSeat(seatId, data.guestId, data.notes)
        return createSuccessResult(seat)
      }
    } catch (error) {
      console.error('Error in SeatingRepository.assignGuestToSeat:', error)
      return createErrorResult('Failed to assign guest to seat', 'ASSIGN_ERROR', 500)
    }
  }

  /**
   * Bulk assign guests to seats
   */
  async bulkAssignGuests(assignments: BulkSeatAssignmentInput['assignments']): Promise<RepositoryResult<Seat[]>> {
    try {
      // Try database first
      try {
        const seats = await Promise.all(
          assignments.map(assignment => 
            (this.db as any).seat.update({
              where: { id: assignment.seatId },
              data: {
                guestId: assignment.guestId,
                updatedAt: new Date()
              }
            })
          )
        )
        return createSuccessResult(seats)
      } catch (dbError) {
        // Fallback to temp storage
        const seats = await tempStorage.bulkAssignGuests(assignments)
        return createSuccessResult(seats)
      }
    } catch (error) {
      console.error('Error in SeatingRepository.bulkAssignGuests:', error)
      return createErrorResult('Failed to bulk assign guests', 'BULK_ASSIGN_ERROR', 500)
    }
  }

  /**
   * Get seating statistics
   */
  async getSeatingStats(userId: string): Promise<RepositoryResult<{
    totalTables: number
    totalSeats: number
    assignedSeats: number
    unassignedSeats: number
    totalGuests: number
    seatedGuests: number
    unseatedGuests: number
  }>> {
    try {
      // Try database first
      try {
        const [totalTables, totalSeats, assignedSeats, totalGuests, seatedGuests] = await Promise.all([
          (this.db as any).table.count({ where: { userId } }),
          (this.db as any).seat.count({ 
            where: { 
              table: { userId } 
            } 
          }),
          (this.db as any).seat.count({ 
            where: { 
              table: { userId },
              guestId: { not: null }
            } 
          }),
          (this.db as any).guest.count({ where: { userId } }),
          (this.db as any).guest.count({ 
            where: { 
              userId,
              seats: { some: {} }
            } 
          })
        ])

        return createSuccessResult({
          totalTables,
          totalSeats,
          assignedSeats,
          unassignedSeats: totalSeats - assignedSeats,
          totalGuests,
          seatedGuests,
          unseatedGuests: totalGuests - seatedGuests
        })
      } catch (dbError) {
        // Fallback to temp storage
        const stats = await tempStorage.getSeatingStats(userId)
        return createSuccessResult(stats)
      }
    } catch (error) {
      console.error('Error in SeatingRepository.getSeatingStats:', error)
      return createErrorResult('Failed to get seating statistics', 'STATS_ERROR', 500)
    }
  }

  /**
   * Transform temp storage table to repository format
   */
  private transformTempTable(tempTable: any): TableWithSeats {
    return {
      id: tempTable.id,
      userId: tempTable.userId,
      name: tempTable.name,
      shape: tempTable.shape || 'round',
      capacity: tempTable.capacity,
      positionX: tempTable.positionX || 0,
      positionY: tempTable.positionY || 0,
      rotation: tempTable.rotation || 0,
      width: tempTable.width || null,
      height: tempTable.height || null,
      diameter: tempTable.diameter || null,
      color: tempTable.color || null,
      notes: tempTable.notes || null,
      createdAt: new Date(tempTable.createdAt),
      updatedAt: new Date(tempTable.updatedAt),
      seats: (tempTable.seats || []).map((seat: any) => ({
        id: seat.id,
        tableId: seat.tableId,
        guestId: seat.guestId || null,
        seatNumber: seat.seatNumber,
        positionX: seat.positionX || 0,
        positionY: seat.positionY || 0,
        isHost: seat.isHost || false,
        notes: seat.notes || null,
        createdAt: new Date(seat.createdAt),
        updatedAt: new Date(seat.updatedAt),
        guest: seat.guest ? {
          id: seat.guest.id,
          name: seat.guest.name,
          rsvpStatus: seat.guest.rsvpStatus || 'pending',
          side: seat.guest.side || null,
          relationshipCategory: seat.guest.relationshipCategory || null,
          householdId: seat.guest.householdId || null
        } : null
      }))
    }
  }
}

