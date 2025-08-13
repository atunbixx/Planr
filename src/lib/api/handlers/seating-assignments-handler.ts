import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/features/couples'

// Validation schemas
const assignGuestSchema = z.object({
  tableId: z.string(),
  guestId: z.string(),
  seatNumber: z.number().int().positive().optional(),
  notes: z.string().optional()
})

export class SeatingAssignmentsHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'POST':
          return await this.handlePost(request)
        case 'DELETE':
          return await this.handleDelete(request)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = assignGuestSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get guest to verify ownership
    const guest = await prisma.guest.findFirst({
      where: {
        id: validatedData.guestId,
        coupleId: couple.id
      }
    })

    if (!guest) {
      return this.errorResponse('GUEST_NOT_FOUND', 'Guest not found', 404)
    }

    // Get current seating arrangement
    const seatingArrangement = await prisma.seating_arrangements.findFirst({
      where: { couple_id: couple.id }
    })

    if (!seatingArrangement) {
      return this.errorResponse('NO_ARRANGEMENT', 'No seating arrangement found', 404)
    }

    const arrangementData = seatingArrangement.arrangement_data

    // Find the table
    const tableIndex = arrangementData.tables.findIndex((t: any) => t.id === validatedData.tableId)
    if (tableIndex === -1) {
      return this.errorResponse('TABLE_NOT_FOUND', 'Table not found', 404)
    }

    const table = arrangementData.tables[tableIndex]

    // Remove guest from any existing table
    for (const t of arrangementData.tables) {
      if (t.guests) {
        t.guests = t.guests.filter((g: any) => g.id !== validatedData.guestId)
      }
    }

    // Remove from unassigned if present
    arrangementData.unassignedGuests = arrangementData.unassignedGuests.filter(
      (g: any) => g.id !== validatedData.guestId
    )

    // Add guest to new table
    if (!table.guests) {
      table.guests = []
    }

    table.guests.push({
      id: guest.id,
      name: guest.name || `${guest.firstName} ${guest.lastName}`.trim(),
      seatNumber: validatedData.seatNumber || table.guests.length + 1
    })

    // Save updated arrangement
    await prisma.seating_arrangements.update({
      where: { id: seatingArrangement.id },
      data: {
        arrangement_data: arrangementData,
        updated_at: new Date()
      }
    })

    // Update guest table assignment
    await prisma.guest.update({
      where: { id: guest.id },
      data: { 
        tableAssignment: table.name,
        notes: validatedData.notes ? `${guest.notes || ''}\n${validatedData.notes}`.trim() : guest.notes
      }
    })

    return this.successResponse({
      tableId: validatedData.tableId,
      guestId: validatedData.guestId,
      tableName: table.name,
      seatNumber: validatedData.seatNumber || table.guests.length
    }, { action: 'assigned' })
  }

  private async handleDelete(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const searchParams = this.getSearchParams(request)
    
    const tableId = searchParams.get('tableId')
    const guestId = searchParams.get('guestId')

    if (!tableId || !guestId) {
      return this.errorResponse('INVALID_REQUEST', 'Table ID and Guest ID required', 400)
    }

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Verify guest ownership
    const guest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        coupleId: couple.id
      }
    })

    if (!guest) {
      return this.errorResponse('GUEST_NOT_FOUND', 'Guest not found', 404)
    }

    // Get current seating arrangement
    const seatingArrangement = await prisma.seating_arrangements.findFirst({
      where: { couple_id: couple.id }
    })

    if (!seatingArrangement) {
      return this.errorResponse('NO_ARRANGEMENT', 'No seating arrangement found', 404)
    }

    const arrangementData = seatingArrangement.arrangement_data

    // Find the table
    const tableIndex = arrangementData.tables.findIndex((t: any) => t.id === tableId)
    if (tableIndex === -1) {
      return this.errorResponse('TABLE_NOT_FOUND', 'Table not found', 404)
    }

    const table = arrangementData.tables[tableIndex]

    // Remove guest from table
    if (table.guests) {
      const guestIndex = table.guests.findIndex((g: any) => g.id === guestId)
      if (guestIndex !== -1) {
        table.guests.splice(guestIndex, 1)
      }
    }

    // Add to unassigned
    arrangementData.unassignedGuests.push({
      id: guest.id,
      name: guest.name || `${guest.firstName} ${guest.lastName}`.trim()
    })

    // Save updated arrangement
    await prisma.seating_arrangements.update({
      where: { id: seatingArrangement.id },
      data: {
        arrangement_data: arrangementData,
        updated_at: new Date()
      }
    })

    // Clear guest table assignment
    await prisma.guest.update({
      where: { id: guest.id },
      data: { tableAssignment: null }
    })

    return this.successResponse({
      tableId,
      guestId,
      message: 'Guest removed from table'
    }, { action: 'removed' })
  }
}