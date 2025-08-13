/**
 * Create Vendor DTO - Input validation for vendor creation
 */

import { z } from 'zod'
import { PersonNameSchema, EmailSchema, PhoneSchema, UrlSchema, AddressSchema, MoneyAmountSchema } from '@/shared/validation/schemas'
import { VendorStatus } from '@/shared/types/common'

export const CreateVendorRequestSchema = z.object({
  // Basic Info
  name: z.string().min(1, 'Vendor name is required').max(200),
  category: z.string().min(1, 'Category is required').max(100),
  subcategory: z.string().max(100).optional(),
  
  // Contact Information
  contactName: PersonNameSchema.optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  website: UrlSchema.optional(),
  
  // Business Details
  businessAddress: AddressSchema.optional(),
  description: z.string().max(2000).optional(),
  specialties: z.array(z.string().max(100)).default([]),
  
  // Pricing
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  estimatedCost: MoneyAmountSchema.optional(),
  currency: z.string().length(3).default('USD'),
  
  // Status
  status: z.enum([
    VendorStatus.POTENTIAL,
    VendorStatus.CONTACTED,
    VendorStatus.QUOTED,
    VendorStatus.BOOKED,
    VendorStatus.COMPLETED,
    VendorStatus.CANCELLED
  ]).default(VendorStatus.POTENTIAL),
  
  // Contract Details
  contractSigned: z.boolean().default(false),
  contractDate: z.string().datetime().optional(),
  contractAmount: MoneyAmountSchema.optional(),
  
  // Dates
  serviceDate: z.string().datetime().optional(),
  bookingDeadline: z.string().datetime().optional(),
  
  // Ratings and Reviews
  rating: z.number().min(1).max(5).optional(),
  reviewNotes: z.string().max(1000).optional(),
  
  // Metadata
  tags: z.array(z.string().max(50)).default([]),
  notes: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  isRecommended: z.boolean().default(false),
  
  // External References
  externalId: z.string().optional(), // For imported vendors
  source: z.string().optional() // Where vendor was found
})

export type CreateVendorRequest = z.infer<typeof CreateVendorRequestSchema>

// Internal DTO for database operations
export const CreateVendorDataSchema = CreateVendorRequestSchema.extend({
  id: z.string().uuid(),
  coupleId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CreateVendorData = z.infer<typeof CreateVendorDataSchema>

// Vendor categories enum for consistency
export const VendorCategory = {
  VENUE: 'venue',
  CATERING: 'catering',
  PHOTOGRAPHY: 'photography',
  VIDEOGRAPHY: 'videography',
  FLORIST: 'florist',
  MUSIC: 'music',
  ENTERTAINMENT: 'entertainment',
  TRANSPORTATION: 'transportation',
  ACCOMMODATION: 'accommodation',
  BEAUTY: 'beauty',
  ATTIRE: 'attire',
  JEWELRY: 'jewelry',
  INVITATIONS: 'invitations',
  DECORATIONS: 'decorations',
  CAKE: 'cake',
  OFFICIANT: 'officiant',
  COORDINATOR: 'coordinator',
  OTHER: 'other'
} as const

export type VendorCategoryType = typeof VendorCategory[keyof typeof VendorCategory]

// Vendor category validation schema
export const VendorCategorySchema = z.enum([
  VendorCategory.VENUE,
  VendorCategory.CATERING,
  VendorCategory.PHOTOGRAPHY,
  VendorCategory.VIDEOGRAPHY,
  VendorCategory.FLORIST,
  VendorCategory.MUSIC,
  VendorCategory.ENTERTAINMENT,
  VendorCategory.TRANSPORTATION,
  VendorCategory.ACCOMMODATION,
  VendorCategory.BEAUTY,
  VendorCategory.ATTIRE,
  VendorCategory.JEWELRY,
  VendorCategory.INVITATIONS,
  VendorCategory.DECORATIONS,
  VendorCategory.CAKE,
  VendorCategory.OFFICIANT,
  VendorCategory.COORDINATOR,
  VendorCategory.OTHER
])