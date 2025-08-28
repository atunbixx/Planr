import { z } from 'zod'

export const SeatDto = z.object({
  id: z.string(),
  tableId: z.string(),
  guestId: z.string().nullable(),
  seatNumber: z.number(),
  positionX: z.number().optional().nullable(),
  positionY: z.number().optional().nullable(),
  isHost: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  guest: z
    .object({
      id: z.string(),
      name: z.string().optional(),
      rsvpStatus: z.enum(['pending', 'accepted', 'declined']).optional(),
      side: z.enum(['bride', 'groom']).nullable().optional(),
      relationshipCategory: z.string().nullable().optional(),
      householdId: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
})

export const TableDto = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  shape: z.enum(['round', 'rectangle', 'square', 'oval']).optional(),
  capacity: z.number(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  rotation: z.number().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  diameter: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
})

export const TableWithSeatsDto = TableDto.extend({
  seats: z.array(SeatDto),
})

export const SeatingStatsDto = z.object({
  totalTables: z.number(),
  totalSeats: z.number(),
  assignedSeats: z.number(),
  unassignedSeats: z.number(),
})

export type Seat = z.infer<typeof SeatDto>
export type Table = z.infer<typeof TableDto>
export type TableWithSeats = z.infer<typeof TableWithSeatsDto>
export type SeatingStats = z.infer<typeof SeatingStatsDto>

