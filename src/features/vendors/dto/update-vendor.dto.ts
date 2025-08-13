/**
 * Update Vendor DTO - Input validation for vendor updates
 */

import { z } from 'zod'
import { PersonNameSchema, EmailSchema, PhoneSchema, UrlSchema, AddressSchema, MoneyAmountSchema } from '@/shared/validation/schemas'
import { VendorStatus } from '@/shared/types/common'

export const UpdateVendorRequestSchema = z.object({
  // Basic Info Updates
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  subcategory: z.string().max(100).optional(),
  
  // Contact Information Updates
  contactName: PersonNameSchema.optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  website: UrlSchema.optional(),
  
  // Business Details Updates
  businessAddress: AddressSchema.optional(),
  description: z.string().max(2000).optional(),
  specialties: z.array(z.string().max(100)).optional(),
  
  // Pricing Updates
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  estimatedCost: MoneyAmountSchema.optional(),
  currency: z.string().length(3).optional(),
  
  // Status Updates
  status: z.enum([
    VendorStatus.POTENTIAL,
    VendorStatus.CONTACTED,
    VendorStatus.QUOTED,
    VendorStatus.BOOKED,
    VendorStatus.COMPLETED,
    VendorStatus.CANCELLED
  ]).optional(),
  
  // Contract Details Updates
  contractSigned: z.boolean().optional(),
  contractDate: z.string().datetime().optional(),
  contractAmount: MoneyAmountSchema.optional(),
  
  // Dates Updates
  serviceDate: z.string().datetime().optional(),
  bookingDeadline: z.string().datetime().optional(),
  
  // Ratings and Reviews Updates
  rating: z.number().min(1).max(5).optional(),
  reviewNotes: z.string().max(1000).optional(),
  
  // Metadata Updates
  tags: z.array(z.string().max(50)).optional(),
  notes: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  isRecommended: z.boolean().optional(),
  
  // External References Updates
  externalId: z.string().optional(),
  source: z.string().optional()
}).strict()

export type UpdateVendorRequest = z.infer<typeof UpdateVendorRequestSchema>

// Internal DTO for database operations
export const UpdateVendorDataSchema = UpdateVendorRequestSchema.extend({
  updatedAt: z.date()
})

export type UpdateVendorData = z.infer<typeof UpdateVendorDataSchema>

// Patch validation - at least one field must be provided
export const PatchVendorRequestSchema = UpdateVendorRequestSchema.refine(
  (data) => Object.values(data).some(value => value !== undefined),
  {
    message: "At least one field must be provided for update",
    path: ["root"]
  }
)

export type PatchVendorRequest = z.infer<typeof PatchVendorRequestSchema>

// Status transition validation
export const VendorStatusTransitionSchema = z.object({
  fromStatus: z.enum([
    VendorStatus.POTENTIAL,
    VendorStatus.CONTACTED,
    VendorStatus.QUOTED,
    VendorStatus.BOOKED,
    VendorStatus.COMPLETED,
    VendorStatus.CANCELLED
  ]),
  toStatus: z.enum([
    VendorStatus.POTENTIAL,
    VendorStatus.CONTACTED,
    VendorStatus.QUOTED,
    VendorStatus.BOOKED,
    VendorStatus.COMPLETED,
    VendorStatus.CANCELLED
  ]),
  reason: z.string().max(500).optional(),
  timestamp: z.date()
})

export type VendorStatusTransition = z.infer<typeof VendorStatusTransitionSchema>

// Bulk update schema for multiple vendors
export const BulkUpdateVendorsRequestSchema = z.object({
  vendorIds: z.array(z.string().uuid()).min(1).max(100),
  updates: UpdateVendorRequestSchema,
  reason: z.string().max(500).optional()
})

export type BulkUpdateVendorsRequest = z.infer<typeof BulkUpdateVendorsRequestSchema>