/**
 * Update Guest DTO - Input validation for guest updates
 */

import { z } from 'zod'
import { PersonNameSchema, EmailSchema, PhoneSchema, AddressSchema, DietaryRestrictionSchema } from '@/shared/validation/schemas'
import { RsvpStatus } from '@/shared/types/common'

export const UpdateGuestRequestSchema = z.object({
  // Basic Information Updates
  name: PersonNameSchema.optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  
  // Relationship Updates
  relationship: z.string().min(1).max(100).optional(),
  side: z.enum(['bride', 'groom', 'both']).optional(),
  
  // Guest Type Updates
  type: z.enum(['adult', 'child', 'infant']).optional(),
  ageGroup: z.enum(['adult', 'child_12_plus', 'child_under_12', 'infant']).optional(),
  
  // Contact Information Updates
  address: AddressSchema.optional(),
  
  // RSVP Information Updates
  rsvpStatus: z.enum([
    RsvpStatus.PENDING,
    RsvpStatus.CONFIRMED,
    RsvpStatus.DECLINED,
    RsvpStatus.MAYBE,
    RsvpStatus.CANCELLED
  ]).optional(),
  rsvpDate: z.string().datetime().optional(),
  rsvpNotes: z.string().max(1000).optional(),
  
  // Meal Preferences Updates
  dietaryRestrictions: z.array(DietaryRestrictionSchema).optional(),
  mealChoice: z.string().max(100).optional(),
  allergies: z.string().max(500).optional(),
  
  // Wedding Attendance Updates
  ceremonyAttending: z.boolean().optional(),
  receptionAttending: z.boolean().optional(),
  
  // Plus One Updates
  hasPlusOne: z.boolean().optional(),
  plusOneName: PersonNameSchema.optional(),
  plusOneEmail: EmailSchema.optional(),
  
  // Accommodation Updates
  needsAccommodation: z.boolean().optional(),
  accommodationNotes: z.string().max(500).optional(),
  
  // Transportation Updates
  needsTransportation: z.boolean().optional(),
  transportationNotes: z.string().max(500).optional(),
  
  // Table Assignment Updates
  tableNumber: z.number().int().min(1).optional(),
  seatNumber: z.number().int().min(1).optional(),
  
  // Gift Information Updates
  giftReceived: z.boolean().optional(),
  giftDescription: z.string().max(500).optional(),
  thankYouSent: z.boolean().optional(),
  
  // Metadata Updates
  tags: z.array(z.string().max(50)).optional(),
  notes: z.string().max(2000).optional(),
  isVip: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  
  // External Updates
  externalId: z.string().optional()
}).strict()

export type UpdateGuestRequest = z.infer<typeof UpdateGuestRequestSchema>

// Internal DTO for database operations
export const UpdateGuestDataSchema = UpdateGuestRequestSchema.extend({
  updatedAt: z.date()
})

export type UpdateGuestData = z.infer<typeof UpdateGuestDataSchema>

// Patch validation - at least one field must be provided
export const PatchGuestRequestSchema = UpdateGuestRequestSchema.refine(
  (data) => Object.values(data).some(value => value !== undefined),
  {
    message: "At least one field must be provided for update",
    path: ["root"]
  }
)

export type PatchGuestRequest = z.infer<typeof PatchGuestRequestSchema>

// RSVP status update with tracking
export const RsvpUpdateRequestSchema = z.object({
  rsvpStatus: z.enum([
    RsvpStatus.CONFIRMED,
    RsvpStatus.DECLINED,
    RsvpStatus.MAYBE
  ]),
  ceremonyAttending: z.boolean().optional(),
  receptionAttending: z.boolean().optional(),
  dietaryRestrictions: z.array(DietaryRestrictionSchema).optional(),
  mealChoice: z.string().max(100).optional(),
  allergies: z.string().max(500).optional(),
  plusOneName: PersonNameSchema.optional(),
  plusOneEmail: EmailSchema.optional(),
  notes: z.string().max(1000).optional(),
  invitationCode: z.string().optional() // For public RSVP updates
})

export type RsvpUpdateRequest = z.infer<typeof RsvpUpdateRequestSchema>

// Bulk update schema for multiple guests
export const BulkUpdateGuestsRequestSchema = z.object({
  guestIds: z.array(z.string().uuid()).min(1).max(100),
  updates: UpdateGuestRequestSchema,
  reason: z.string().max(500).optional()
})

export type BulkUpdateGuestsRequest = z.infer<typeof BulkUpdateGuestsRequestSchema>

// Table assignment updates
export const TableAssignmentUpdateSchema = z.object({
  assignments: z.array(z.object({
    guestId: z.string().uuid(),
    tableNumber: z.number().int().min(1),
    seatNumber: z.number().int().min(1).optional()
  })),
  reason: z.string().max(500).optional()
})

export type TableAssignmentUpdate = z.infer<typeof TableAssignmentUpdateSchema>