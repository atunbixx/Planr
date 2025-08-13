/**
 * Create Guest DTO - Input validation for guest creation
 */

import { z } from 'zod'
import { PersonNameSchema, EmailSchema, PhoneSchema, AddressSchema, DietaryRestrictionSchema } from '@/shared/validation/schemas'
import { RsvpStatus } from '@/shared/types/common'

export const CreateGuestRequestSchema = z.object({
  // Basic Information
  name: PersonNameSchema,
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  
  // Relationship
  relationship: z.string().min(1, 'Relationship is required').max(100),
  side: z.enum(['bride', 'groom', 'both']).default('both'),
  
  // Guest Type
  type: z.enum(['adult', 'child', 'infant']).default('adult'),
  ageGroup: z.enum(['adult', 'child_12_plus', 'child_under_12', 'infant']).optional(),
  
  // Contact Information
  address: AddressSchema.optional(),
  
  // RSVP Information
  rsvpStatus: z.enum([
    RsvpStatus.PENDING,
    RsvpStatus.CONFIRMED,
    RsvpStatus.DECLINED,
    RsvpStatus.MAYBE,
    RsvpStatus.CANCELLED
  ]).default(RsvpStatus.PENDING),
  rsvpDate: z.string().datetime().optional(),
  rsvpNotes: z.string().max(1000).optional(),
  
  // Meal Preferences
  dietaryRestrictions: z.array(DietaryRestrictionSchema).default([]),
  mealChoice: z.string().max(100).optional(),
  allergies: z.string().max(500).optional(),
  
  // Wedding Attendance
  ceremonyAttending: z.boolean().default(true),
  receptionAttending: z.boolean().default(true),
  
  // Plus One
  hasPlusOne: z.boolean().default(false),
  plusOneName: PersonNameSchema.optional(),
  plusOneEmail: EmailSchema.optional(),
  
  // Accommodation
  needsAccommodation: z.boolean().default(false),
  accommodationNotes: z.string().max(500).optional(),
  
  // Transportation
  needsTransportation: z.boolean().default(false),
  transportationNotes: z.string().max(500).optional(),
  
  // Table Assignment
  tableNumber: z.number().int().min(1).optional(),
  seatNumber: z.number().int().min(1).optional(),
  
  // Gift Information
  giftReceived: z.boolean().default(false),
  giftDescription: z.string().max(500).optional(),
  thankYouSent: z.boolean().default(false),
  
  // Metadata
  tags: z.array(z.string().max(50)).default([]),
  notes: z.string().max(2000).optional(),
  isVip: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  
  // Import Information
  importedFrom: z.string().optional(), // CSV, Excel, etc.
  externalId: z.string().optional()
})

export type CreateGuestRequest = z.infer<typeof CreateGuestRequestSchema>

// Internal DTO for database operations
export const CreateGuestDataSchema = CreateGuestRequestSchema.extend({
  id: z.string().uuid(),
  coupleId: z.string().uuid(),
  invitationCode: z.string().optional(), // Generated invitation code
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CreateGuestData = z.infer<typeof CreateGuestDataSchema>

// Bulk import schema for CSV/Excel imports
export const BulkCreateGuestsRequestSchema = z.object({
  guests: z.array(CreateGuestRequestSchema),
  importSource: z.string().optional(),
  overwriteExisting: z.boolean().default(false),
  validateOnly: z.boolean().default(false) // Dry run validation
})

export type BulkCreateGuestsRequest = z.infer<typeof BulkCreateGuestsRequestSchema>

// Guest group creation (for families)
export const CreateGuestGroupRequestSchema = z.object({
  groupName: z.string().min(1, 'Group name is required').max(100),
  groupType: z.enum(['family', 'friends', 'colleagues', 'other']).default('family'),
  primaryGuest: CreateGuestRequestSchema,
  additionalGuests: z.array(CreateGuestRequestSchema).default([]),
  sharedAddress: z.boolean().default(true),
  sharedInvitation: z.boolean().default(true),
  notes: z.string().max(1000).optional()
})

export type CreateGuestGroupRequest = z.infer<typeof CreateGuestGroupRequestSchema>