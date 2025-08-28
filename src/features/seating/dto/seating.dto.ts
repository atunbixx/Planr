import { z } from 'zod'

// Table DTOs
export const CreateTableDto = z.object({
  name: z.string().min(1, 'Table name is required').max(100, 'Table name too long'),
  shape: z.enum(['round', 'rectangle', 'square', 'oval']).default('round'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(20, 'Capacity cannot exceed 20'),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
  rotation: z.number().default(0),
  width: z.number().optional(),
  height: z.number().optional(),
  diameter: z.number().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  notes: z.string().optional()
})

export const UpdateTableDto = z.object({
  name: z.string().min(1, 'Table name is required').max(100, 'Table name too long').optional(),
  shape: z.enum(['round', 'rectangle', 'square', 'oval']).optional(),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(20, 'Capacity cannot exceed 20').optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  rotation: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  diameter: z.number().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  notes: z.string().optional()
})

export const TableFilterDto = z.object({
  shape: z.enum(['round', 'rectangle', 'square', 'oval']).optional(),
  minCapacity: z.number().int().min(1).optional(),
  maxCapacity: z.number().int().max(20).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0)
})

// Seat DTOs
export const CreateSeatDto = z.object({
  tableId: z.string().uuid('Invalid table ID'),
  seatNumber: z.number().int().min(1, 'Seat number must be at least 1'),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
  isHost: z.boolean().default(false),
  notes: z.string().optional()
})

export const UpdateSeatDto = z.object({
  seatNumber: z.number().int().min(1, 'Seat number must be at least 1').optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  isHost: z.boolean().optional(),
  notes: z.string().optional()
})

export const AssignGuestToSeatDto = z.object({
  // Relaxed in dev to accept non-UUID temp IDs; server can enforce in DB layer
  guestId: z.string().nullable(),
  notes: z.string().optional()
})

// Bulk operations
export const BulkSeatAssignmentDto = z.object({
  assignments: z.array(z.object({
    seatId: z.string(),
    guestId: z.string().nullable()
  }))
})

export const AutoAssignSeatsDto = z.object({
  strategy: z.enum(['random', 'by_side', 'by_relationship', 'by_household']).default('by_relationship'),
  groupByHousehold: z.boolean().default(true),
  separateByRelationship: z.boolean().default(false),
  prioritizeHosts: z.boolean().default(true)
})

// Response DTOs
export const SeatResponseDto = z.object({
  id: z.string(),
  tableId: z.string(),
  guestId: z.string().nullable(),
  seatNumber: z.number(),
  positionX: z.number(),
  positionY: z.number(),
  isHost: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  guest: z.object({
    id: z.string(),
    name: z.string(),
    rsvpStatus: z.enum(['pending', 'accepted', 'declined']),
    side: z.enum(['bride', 'groom']).nullable(),
    relationshipCategory: z.string().nullable(),
    householdId: z.string().nullable()
  }).nullable()
})

export const TableResponseDto = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  shape: z.enum(['round', 'rectangle', 'square', 'oval']),
  capacity: z.number(),
  positionX: z.number(),
  positionY: z.number(),
  rotation: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  diameter: z.number().nullable(),
  color: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  seats: z.array(SeatResponseDto)
})

export const SeatingChartResponseDto = z.object({
  tables: z.array(TableResponseDto),
  stats: z.object({
    totalTables: z.number(),
    totalSeats: z.number(),
    assignedSeats: z.number(),
    unassignedSeats: z.number(),
    totalGuests: z.number(),
    seatedGuests: z.number(),
    unseatedGuests: z.number()
  })
})

export const SeatingStatsResponseDto = z.object({
  totalTables: z.number(),
  totalSeats: z.number(),
  assignedSeats: z.number(),
  unassignedSeats: z.number(),
  totalGuests: z.number(),
  seatedGuests: z.number(),
  unseatedGuests: z.number(),
  assignmentProgress: z.number(), // percentage
  tableUtilization: z.number(), // percentage
  sideBalance: z.object({
    bride: z.number(),
    groom: z.number(),
    unspecified: z.number()
  })
})

// Type exports
export type CreateTableInput = z.infer<typeof CreateTableDto>
export type UpdateTableInput = z.infer<typeof UpdateTableDto>
export type TableFilterInput = z.infer<typeof TableFilterDto>
export type CreateSeatInput = z.infer<typeof CreateSeatDto>
export type UpdateSeatInput = z.infer<typeof UpdateSeatDto>
export type AssignGuestToSeatInput = z.infer<typeof AssignGuestToSeatDto>
export type BulkSeatAssignmentInput = z.infer<typeof BulkSeatAssignmentDto>
export type AutoAssignSeatsInput = z.infer<typeof AutoAssignSeatsDto>
export type SeatResponse = z.infer<typeof SeatResponseDto>
export type TableResponse = z.infer<typeof TableResponseDto>
export type SeatingChartResponse = z.infer<typeof SeatingChartResponseDto>
export type SeatingStatsResponse = z.infer<typeof SeatingStatsResponseDto>

// Table shape utilities
export const TABLE_SHAPES = {
  round: 'Round',
  rectangle: 'Rectangle',
  square: 'Square',
  oval: 'Oval'
} as const

// Default table dimensions by shape
export const DEFAULT_TABLE_DIMENSIONS = {
  round: { diameter: 60, capacity: 8 },
  rectangle: { width: 96, height: 36, capacity: 8 },
  square: { width: 48, height: 48, capacity: 8 },
  oval: { width: 84, height: 48, capacity: 8 }
} as const

// Seating assignment strategies
export const ASSIGNMENT_STRATEGIES = {
  random: 'Random Assignment',
  by_side: 'Group by Side (Bride/Groom)',
  by_relationship: 'Group by Relationship',
  by_household: 'Group by Household'
} as const
