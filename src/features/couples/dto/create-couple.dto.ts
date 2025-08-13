/**
 * Create Couple DTO - Input validation for couple creation
 */

import { z } from 'zod'
import { PersonNameSchema, EmailSchema, PhoneSchema, DateOnlySchema, AddressSchema } from '@/shared/validation/schemas'

export const CreateCoupleRequestSchema = z.object({
  // Partner 1 (Primary User)
  partner1Name: PersonNameSchema,
  partner1Email: EmailSchema,
  partner1Phone: PhoneSchema.optional(),
  
  // Partner 2
  partner2Name: PersonNameSchema,
  partner2Email: EmailSchema.optional(),
  partner2Phone: PhoneSchema.optional(),
  
  // Wedding Details
  weddingDate: DateOnlySchema,
  venue: z.string().min(1, 'Venue is required').max(200),
  guestCount: z.number().int().min(1).max(10000).default(100),
  totalBudget: z.number().min(0).optional(),
  currency: z.string().length(3).default('USD'),
  
  // Location
  weddingLocation: AddressSchema.optional(),
  
  // Preferences
  timezone: z.string().default('UTC'),
  language: z.string().length(2).default('en'),
  
  // Metadata
  notes: z.string().max(1000).optional(),
  planningPhase: z.enum([
    'initial',
    'planning',
    'booking',
    'finalizing',
    'post_wedding'
  ]).default('initial')
})

export type CreateCoupleRequest = z.infer<typeof CreateCoupleRequestSchema>

// Internal DTO for database operations
export const CreateCoupleDataSchema = CreateCoupleRequestSchema.extend({
  id: z.string().uuid(),
  userId: z.string(), // Clerk user ID
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CreateCoupleData = z.infer<typeof CreateCoupleDataSchema>