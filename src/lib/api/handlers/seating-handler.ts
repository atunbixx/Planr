import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/lib/db/services/couple.service'
import { FIELD_MAPPINGS } from '@/lib/db/field-mappings'

// Validation schemas
const tableSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  name: z.string(),
  capacity: z.number().int().positive(),
  shape: z.enum(['round', 'rectangle', 'square', 'oval']).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  guests: z.array(z.object({
    id: z.string(),
    name: z.string(),
    seatNumber: z.number().int().optional()
  })).optional()
})

const seatingArrangementSchema = z.object({
  tables: z.array(tableSchema),
  unassignedGuests: z.array(z.object({
    id: z.string(),
    name: z.string()
  }))
})

const layoutSchema = z.object({
  name: z.string(),
  venueLayout: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    tables: z.array(z.object({
      id: z.string(),
      x: z.number(),
      y: z.number(),
      rotation: z.number().optional()
    }))
  }),
  isDefault: z.boolean().optional()
})

const seatingPreferencesSchema = z.object({
  preferences: z.array(z.object({
    guestId: z.string(),
    preferWith: z.array(z.string()).optional(),
    avoidWith: z.array(z.string()).optional(),
    specialNeeds: z.string().optional()
  }))
})

const optimizeRequestSchema = z.object({
  preferences: z.array(z.object({
    guestId: z.string(),
    preferWith: z.array(z.string()).optional(),
    avoidWith: z.array(z.string()).optional()
  })).optional(),
  tables: z.array(z.object({
    id: z.string(),
    capacity: z.number().int().positive()
  })),
  guests: z.array(z.object({
    id: z.string(),
    name: z.string(),
    groupId: z.string().optional()
  }))
})

export class SeatingHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PUT':
          return await this.handlePut(request)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)

    // Get couple using the service to check all user ID fields
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get seating arrangement
    const seatingArrangement = await prisma.seating_arrangements.findFirst({
      where: { couple_id: couple.id },
      orderBy: { updated_at: 'desc' }
    })

    if (!seatingArrangement) {
      // Get all guests to show as unassigned
      const guests = await prisma.guest.findMany({
        where: { 
          coupleId: couple.id,
          attendingStatus: { in: ['confirmed', 'yes'] }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          tableAssignment: true
        }
      })

      const unassignedGuests = guests.map(guest => ({
        id: guest.id,
        name: guest.name || `${guest.firstName} ${guest.lastName}`.trim()
      }))

      return this.successResponse({
        tables: [],
        unassignedGuests
      })
    }

    return this.successResponse(seatingArrangement.arrangement_data)
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = seatingArrangementSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Check if seating arrangement exists
    const existingArrangement = await prisma.seating_arrangements.findFirst({
      where: { couple_id: couple.id }
    })

    let seatingArrangement
    if (existingArrangement) {
      // Update existing
      seatingArrangement = await prisma.seating_arrangements.update({
        where: { id: existingArrangement.id },
        data: {
          arrangement_data: validatedData,
          updated_at: new Date()
        }
      })
    } else {
      // Create new
      seatingArrangement = await prisma.seating_arrangements.create({
        data: {
          couple_id: couple.id,
          arrangement_data: validatedData
        }
      })
    }

    // Update guest table assignments
    const updatePromises = []
    
    // Clear all existing assignments
    updatePromises.push(
      prisma.guest.updateMany({
        where: { coupleId: couple.id },
        data: { tableAssignment: null }
      })
    )

    // Set new assignments
    for (const table of validatedData.tables) {
      if (table.guests) {
        for (const guest of table.guests) {
          updatePromises.push(
            prisma.guest.update({
              where: { id: guest.id },
              data: { tableAssignment: table.name }
            })
          )
        }
      }
    }

    await Promise.all(updatePromises)

    return this.successResponse(seatingArrangement, { action: 'saved' })
  }

  private async handlePut(request: NextRequest): Promise<NextResponse> {
    // This is an alias for POST to maintain compatibility
    return this.handlePost(request)
  }
}

export class SeatingTablesHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PATCH':
          return await this.handlePatch(request, context)
        case 'DELETE':
          return await this.handleDelete(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get seating arrangement
    const seatingArrangement = await prisma.seating_arrangements.findFirst({
      where: { couple_id: couple.id },
      orderBy: { updated_at: 'desc' }
    })

    const tables = seatingArrangement?.arrangement_data?.tables || []

    return this.successResponse({ tables })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate table data
    const validatedTable = tableSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get current seating arrangement
    const seatingArrangement = await prisma.seating_arrangements.findFirst({
      where: { couple_id: couple.id }
    })

    const arrangementData = seatingArrangement?.arrangement_data || { tables: [], unassignedGuests: [] }
    
    // Add new table
    arrangementData.tables.push(validatedTable)

    // Update or create seating arrangement
    if (seatingArrangement) {
      await prisma.seating_arrangements.update({
        where: { id: seatingArrangement.id },
        data: {
          arrangement_data: arrangementData,
          updated_at: new Date()
        }
      })
    } else {
      await prisma.seating_arrangements.create({
        data: {
          couple_id: couple.id,
          arrangement_data: arrangementData
        }
      })
    }

    return this.successResponse(validatedTable, { action: 'created' })
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const tableId = context?.params?.id
    
    if (!tableId) {
      return this.errorResponse('INVALID_REQUEST', 'Table ID required', 400)
    }

    const body = await this.parseBody<any>(request)
    const updates = tableSchema.partial().parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get current seating arrangement
    const seatingArrangement = await prisma.seating_arrangements.findFirst({
      where: { couple_id: couple.id }
    })

    if (!seatingArrangement) {
      return this.errorResponse('NO_ARRANGEMENT', 'No seating arrangement found', 404)
    }

    const arrangementData = seatingArrangement.arrangement_data
    const tableIndex = arrangementData.tables.findIndex((t: any) => t.id === tableId)

    if (tableIndex === -1) {
      return this.errorResponse('TABLE_NOT_FOUND', 'Table not found', 404)
    }

    // Update table
    arrangementData.tables[tableIndex] = {
      ...arrangementData.tables[tableIndex],
      ...updates
    }

    // Save updated arrangement
    await prisma.seating_arrangements.update({
      where: { id: seatingArrangement.id },
      data: {
        arrangement_data: arrangementData,
        updated_at: new Date()
      }
    })

    return this.successResponse(arrangementData.tables[tableIndex], { action: 'updated' })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const tableId = context?.params?.id
    
    if (!tableId) {
      return this.errorResponse('INVALID_REQUEST', 'Table ID required', 400)
    }

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get current seating arrangement
    const seatingArrangement = await prisma.seating_arrangements.findFirst({
      where: { couple_id: couple.id }
    })

    if (!seatingArrangement) {
      return this.errorResponse('NO_ARRANGEMENT', 'No seating arrangement found', 404)
    }

    const arrangementData = seatingArrangement.arrangement_data
    const tableIndex = arrangementData.tables.findIndex((t: any) => t.id === tableId)

    if (tableIndex === -1) {
      return this.errorResponse('TABLE_NOT_FOUND', 'Table not found', 404)
    }

    // Move guests to unassigned
    const table = arrangementData.tables[tableIndex]
    if (table.guests) {
      arrangementData.unassignedGuests.push(...table.guests)
    }

    // Remove table
    arrangementData.tables.splice(tableIndex, 1)

    // Save updated arrangement
    await prisma.seating_arrangements.update({
      where: { id: seatingArrangement.id },
      data: {
        arrangement_data: arrangementData,
        updated_at: new Date()
      }
    })

    // Clear guest table assignments
    if (table.guests) {
      await prisma.guest.updateMany({
        where: {
          id: { in: table.guests.map((g: any) => g.id) },
          coupleId: couple.id
        },
        data: { tableAssignment: null }
      })
    }

    return this.successResponse({ id: tableId }, { action: 'deleted' })
  }
}

export class SeatingLayoutsHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PATCH':
          return await this.handlePatch(request, context)
        case 'DELETE':
          return await this.handleDelete(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get layouts from seating_layouts table
    const layouts = await prisma.seating_layouts.findMany({
      where: { couple_id: couple.id },
      orderBy: { created_at: 'desc' }
    })

    return this.successResponse({ layouts })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate layout data
    const validatedLayout = layoutSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // If this is the default layout, unset other defaults
    if (validatedLayout.isDefault) {
      await prisma.seating_layouts.updateMany({
        where: { couple_id: couple.id },
        data: { is_default: false }
      })
    }

    // Create layout
    const layout = await prisma.seating_layouts.create({
      data: {
        couple_id: couple.id,
        name: validatedLayout.name,
        layout_data: validatedLayout.venueLayout,
        is_default: validatedLayout.isDefault || false
      }
    })

    return this.successResponse(layout, { action: 'created' })
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const layoutId = context?.params?.id
    
    if (!layoutId) {
      return this.errorResponse('INVALID_REQUEST', 'Layout ID required', 400)
    }

    const body = await this.parseBody<any>(request)
    const updates = layoutSchema.partial().parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // If setting as default, unset others
    if (updates.isDefault) {
      await prisma.seating_layouts.updateMany({
        where: { couple_id: couple.id },
        data: { is_default: false }
      })
    }

    // Update layout
    const layout = await prisma.seating_layouts.update({
      where: { 
        id: layoutId,
        couple_id: couple.id
      },
      data: {
        name: updates.name,
        layout_data: updates.venueLayout,
        is_default: updates.isDefault,
        updated_at: new Date()
      }
    })

    return this.successResponse(layout, { action: 'updated' })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const layoutId = context?.params?.id
    
    if (!layoutId) {
      return this.errorResponse('INVALID_REQUEST', 'Layout ID required', 400)
    }

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Delete layout
    await prisma.seating_layouts.delete({
      where: { 
        id: layoutId,
        couple_id: couple.id
      }
    })

    return this.successResponse({ id: layoutId }, { action: 'deleted' })
  }
}

export class SeatingOptimizeHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    if (request.method !== 'POST') {
      return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }

    try {
      return await this.handlePost(request)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate request
    const validatedData = optimizeRequestSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Simple optimization algorithm
    const optimizedArrangement = this.optimizeSeating(
      validatedData.tables,
      validatedData.guests,
      validatedData.preferences
    )

    // Save the optimized arrangement
    const existingArrangement = await prisma.seating_arrangements.findFirst({
      where: { couple_id: couple.id }
    })

    if (existingArrangement) {
      await prisma.seating_arrangements.update({
        where: { id: existingArrangement.id },
        data: {
          arrangement_data: optimizedArrangement,
          updated_at: new Date()
        }
      })
    } else {
      await prisma.seating_arrangements.create({
        data: {
          couple_id: couple.id,
          arrangement_data: optimizedArrangement
        }
      })
    }

    return this.successResponse({
      optimized: true,
      arrangement: optimizedArrangement,
      stats: {
        totalGuests: validatedData.guests.length,
        seatedGuests: optimizedArrangement.tables.reduce((sum: number, table: any) => 
          sum + (table.guests?.length || 0), 0
        ),
        unassignedGuests: optimizedArrangement.unassignedGuests.length
      }
    })
  }

  private optimizeSeating(tables: any[], guests: any[], preferences?: any[]): any {
    // Simple greedy algorithm for seating optimization
    const optimizedTables = tables.map(t => ({
      ...t,
      guests: []
    }))

    const unassignedGuests: any[] = []
    const guestMap = new Map(guests.map(g => [g.id, g]))
    const preferenceMap = new Map(preferences?.map(p => [p.guestId, p]) || [])

    // Sort guests by number of preferences (those with more constraints first)
    const sortedGuests = [...guests].sort((a, b) => {
      const aPref = preferenceMap.get(a.id)
      const bPref = preferenceMap.get(b.id)
      const aConstraints = (aPref?.preferWith?.length || 0) + (aPref?.avoidWith?.length || 0)
      const bConstraints = (bPref?.preferWith?.length || 0) + (bPref?.avoidWith?.length || 0)
      return bConstraints - aConstraints
    })

    // Try to seat each guest
    for (const guest of sortedGuests) {
      const preference = preferenceMap.get(guest.id)
      let seated = false

      // Find best table for this guest
      let bestTable = null
      let bestScore = -Infinity

      for (const table of optimizedTables) {
        if (table.guests.length >= table.capacity) continue

        let score = 0

        // Check preferences
        if (preference) {
          // Positive score for sitting with preferred guests
          if (preference.preferWith) {
            for (const preferredId of preference.preferWith) {
              if (table.guests.some((g: any) => g.id === preferredId)) {
                score += 10
              }
            }
          }

          // Negative score for sitting with avoided guests
          if (preference.avoidWith) {
            for (const avoidedId of preference.avoidWith) {
              if (table.guests.some((g: any) => g.id === avoidedId)) {
                score -= 20
              }
            }
          }
        }

        // Prefer tables that are partially filled (encourages fuller tables)
        score += table.guests.length

        if (score > bestScore) {
          bestScore = score
          bestTable = table
        }
      }

      // Seat the guest at the best table if score is acceptable
      if (bestTable && bestScore >= 0) {
        bestTable.guests.push({
          id: guest.id,
          name: guest.name,
          seatNumber: bestTable.guests.length + 1
        })
        seated = true
      }

      if (!seated) {
        unassignedGuests.push({
          id: guest.id,
          name: guest.name
        })
      }
    }

    return {
      tables: optimizedTables,
      unassignedGuests
    }
  }
}