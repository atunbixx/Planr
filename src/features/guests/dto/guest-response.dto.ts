/**
 * Guest Response DTOs - Output formats for API responses
 */

import { z } from 'zod'
import { PaginatedResponse } from '@/shared/types/common'
import { RsvpStatus } from '@/shared/types/common'

// Core guest response structure
export const GuestResponseSchema = z.object({
  id: z.string().uuid(),
  
  // Basic Information
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  
  // Relationship
  relationship: z.string(),
  side: z.enum(['bride', 'groom', 'both']),
  
  // Guest Type
  type: z.enum(['adult', 'child', 'infant']),
  ageGroup: z.enum(['adult', 'child_12_plus', 'child_under_12', 'infant']).optional(),
  
  // Contact Information
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string()
  }).optional(),
  
  // RSVP Information
  rsvpStatus: z.enum([
    RsvpStatus.PENDING,
    RsvpStatus.CONFIRMED,
    RsvpStatus.DECLINED,
    RsvpStatus.MAYBE,
    RsvpStatus.CANCELLED
  ]),
  rsvpDate: z.string().optional(), // ISO datetime string
  rsvpNotes: z.string().optional(),
  
  // Meal Preferences
  dietaryRestrictions: z.array(z.string()),
  mealChoice: z.string().optional(),
  allergies: z.string().optional(),
  
  // Wedding Attendance
  ceremonyAttending: z.boolean(),
  receptionAttending: z.boolean(),
  
  // Plus One
  hasPlusOne: z.boolean(),
  plusOneName: z.string().optional(),
  plusOneEmail: z.string().email().optional(),
  
  // Accommodation
  needsAccommodation: z.boolean(),
  accommodationNotes: z.string().optional(),
  
  // Transportation
  needsTransportation: z.boolean(),
  transportationNotes: z.string().optional(),
  
  // Table Assignment
  tableNumber: z.number().int().optional(),
  seatNumber: z.number().int().optional(),
  
  // Gift Information
  giftReceived: z.boolean(),
  giftDescription: z.string().optional(),
  thankYouSent: z.boolean(),
  
  // Metadata
  tags: z.array(z.string()),
  notes: z.string().optional(),
  isVip: z.boolean(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  
  // Invitation
  invitationCode: z.string().optional(),
  invitationSent: z.boolean(),
  invitationSentDate: z.string().optional(), // ISO datetime string
  
  // Import Information
  importedFrom: z.string().optional(),
  externalId: z.string().optional(),
  
  // Audit fields
  coupleId: z.string().uuid(),
  createdAt: z.string(), // ISO datetime string
  updatedAt: z.string()  // ISO datetime string
})

export type GuestResponse = z.infer<typeof GuestResponseSchema>

// Summary response for lists and cards
export const GuestSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email().optional(),
  relationship: z.string(),
  side: z.enum(['bride', 'groom', 'both']),
  type: z.enum(['adult', 'child', 'infant']),
  rsvpStatus: z.enum([
    RsvpStatus.PENDING,
    RsvpStatus.CONFIRMED,
    RsvpStatus.DECLINED,
    RsvpStatus.MAYBE,
    RsvpStatus.CANCELLED
  ]),
  ceremonyAttending: z.boolean(),
  receptionAttending: z.boolean(),
  hasPlusOne: z.boolean(),
  tableNumber: z.number().int().optional(),
  isVip: z.boolean(),
  invitationSent: z.boolean(),
  giftReceived: z.boolean(),
  thankYouSent: z.boolean()
})

export type GuestSummaryResponse = z.infer<typeof GuestSummaryResponseSchema>

// Statistics response
export const GuestStatsResponseSchema = z.object({
  totalGuests: z.number().int(),
  totalAdults: z.number().int(),
  totalChildren: z.number().int(),
  totalInfants: z.number().int(),
  byRsvpStatus: z.record(z.string(), z.number().int()),
  bySide: z.record(z.string(), z.number().int()),
  byDietaryRestrictions: z.record(z.string(), z.number().int()),
  ceremonyAttendees: z.number().int(),
  receptionAttendees: z.number().int(),
  plusOnes: z.number().int(),
  needAccommodation: z.number().int(),
  needTransportation: z.number().int(),
  invitationsSent: z.number().int(),
  rsvpReceived: z.number().int(),
  giftsReceived: z.number().int(),
  thankYousSent: z.number().int(),
  vipGuests: z.number().int(),
  assignedTables: z.number().int(),
  unassignedGuests: z.number().int()
})

export type GuestStatsResponse = z.infer<typeof GuestStatsResponseSchema>

// Table assignment overview
export const TableAssignmentResponseSchema = z.object({
  tableNumber: z.number().int(),
  tableName: z.string().optional(),
  capacity: z.number().int(),
  assignedGuests: z.array(GuestSummaryResponseSchema),
  remainingCapacity: z.number().int()
})

export type TableAssignmentResponse = z.infer<typeof TableAssignmentResponseSchema>

// Paginated guests response
export type GuestsPaginatedResponse = PaginatedResponse<GuestSummaryResponse>

// Search/filter request schema
export const GuestSearchRequestSchema = z.object({
  search: z.string().optional(),
  side: z.enum(['bride', 'groom', 'both']).optional(),
  type: z.enum(['adult', 'child', 'infant']).optional(),
  rsvpStatus: z.enum([
    RsvpStatus.PENDING,
    RsvpStatus.CONFIRMED,
    RsvpStatus.DECLINED,
    RsvpStatus.MAYBE,
    RsvpStatus.CANCELLED
  ]).optional(),
  ceremonyAttending: z.boolean().optional(),
  receptionAttending: z.boolean().optional(),
  hasPlusOne: z.boolean().optional(),
  tableNumber: z.number().int().optional(),
  isVip: z.boolean().optional(),
  invitationSent: z.boolean().optional(),
  giftReceived: z.boolean().optional(),
  thankYouSent: z.boolean().optional(),
  needsAccommodation: z.boolean().optional(),
  needsTransportation: z.boolean().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  relationship: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['firstName', 'relationship', 'rsvpStatus', 'side', 'tableNumber', 'createdAt']).default('firstName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export type GuestSearchRequest = z.infer<typeof GuestSearchRequestSchema>

// Import validation result
export const ImportValidationResultSchema = z.object({
  totalRows: z.number().int(),
  validRows: z.number().int(),
  invalidRows: z.number().int(),
  duplicates: z.number().int(),
  errors: z.array(z.object({
    row: z.number().int(),
    field: z.string().optional(),
    message: z.string(),
    data: z.record(z.string(), z.any()).optional()
  })),
  warnings: z.array(z.object({
    row: z.number().int(),
    field: z.string().optional(),
    message: z.string(),
    data: z.record(z.string(), z.any()).optional()
  })),
  preview: z.array(GuestSummaryResponseSchema).optional()
})

export type ImportValidationResult = z.infer<typeof ImportValidationResultSchema>