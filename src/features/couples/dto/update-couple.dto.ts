/**
 * Update Couple DTO - Input validation for couple updates
 */

import { z } from 'zod'
import { PersonNameSchema, EmailSchema, PhoneSchema, DateOnlySchema, AddressSchema } from '@/shared/validation/schemas'

export const UpdateCoupleRequestSchema = z.object({
  // Partner 1 Updates
  partner1Name: PersonNameSchema.optional(),
  partner1Email: EmailSchema.optional(),
  partner1Phone: PhoneSchema.optional(),
  
  // Partner 2 Updates
  partner2Name: PersonNameSchema.optional(),
  partner2Email: EmailSchema.optional(),
  partner2Phone: PhoneSchema.optional(),
  
  // Wedding Details Updates
  weddingDate: DateOnlySchema.optional(),
  venue: z.string().min(1).max(200).optional(),
  guestCount: z.number().int().min(1).max(10000).optional(),
  totalBudget: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  
  // Location Updates
  weddingLocation: AddressSchema.optional(),
  
  // Preferences Updates
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
  
  // Metadata Updates
  notes: z.string().max(1000).optional(),
  planningPhase: z.enum([
    'initial',
    'planning',
    'booking',
    'finalizing',
    'post_wedding'
  ]).optional()
}).strict() // Ensure no extra fields

export type UpdateCoupleRequest = z.infer<typeof UpdateCoupleRequestSchema>

// Internal DTO for database operations
export const UpdateCoupleDataSchema = UpdateCoupleRequestSchema.extend({
  updatedAt: z.date()
})

export type UpdateCoupleData = z.infer<typeof UpdateCoupleDataSchema>

// Patch validation - at least one field must be provided
export const PatchCoupleRequestSchema = UpdateCoupleRequestSchema.refine(
  (data) => Object.values(data).some(value => value !== undefined),
  {
    message: "At least one field must be provided for update",
    path: ["root"]
  }
)

export type PatchCoupleRequest = z.infer<typeof PatchCoupleRequestSchema>