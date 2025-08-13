/**
 * Vendor Response DTOs - Output formats for API responses
 */

import { z } from 'zod'
import { PaginatedResponse } from '@/shared/types/common'
import { VendorStatus } from '@/shared/types/common'

// Core vendor response structure
export const VendorResponseSchema = z.object({
  id: z.string().uuid(),
  
  // Basic Info
  name: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  
  // Contact Information
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  
  // Business Details
  businessAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string()
  }).optional(),
  description: z.string().optional(),
  specialties: z.array(z.string()),
  
  // Pricing
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  estimatedCost: z.number().optional(),
  currency: z.string(),
  
  // Status
  status: z.enum([
    VendorStatus.POTENTIAL,
    VendorStatus.CONTACTED,
    VendorStatus.QUOTED,
    VendorStatus.BOOKED,
    VendorStatus.COMPLETED,
    VendorStatus.CANCELLED
  ]),
  
  // Contract Details
  contractSigned: z.boolean(),
  contractDate: z.string().optional(), // ISO datetime string
  contractAmount: z.number().optional(),
  
  // Dates
  serviceDate: z.string().optional(), // ISO datetime string
  bookingDeadline: z.string().optional(), // ISO datetime string
  
  // Ratings and Reviews
  rating: z.number().min(1).max(5).optional(),
  reviewNotes: z.string().optional(),
  
  // Metadata
  tags: z.array(z.string()),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  isRecommended: z.boolean(),
  
  // External References
  externalId: z.string().optional(),
  source: z.string().optional(),
  
  // Audit fields
  coupleId: z.string().uuid(),
  createdAt: z.string(), // ISO datetime string
  updatedAt: z.string()  // ISO datetime string
})

export type VendorResponse = z.infer<typeof VendorResponseSchema>

// Summary response for lists and cards
export const VendorSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  status: z.enum([
    VendorStatus.POTENTIAL,
    VendorStatus.CONTACTED,
    VendorStatus.QUOTED,
    VendorStatus.BOOKED,
    VendorStatus.COMPLETED,
    VendorStatus.CANCELLED
  ]),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  estimatedCost: z.number().optional(),
  currency: z.string(),
  rating: z.number().min(1).max(5).optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  contractSigned: z.boolean(),
  isRecommended: z.boolean(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  daysUntilDeadline: z.number().optional()
})

export type VendorSummaryResponse = z.infer<typeof VendorSummaryResponseSchema>

// Statistics response
export const VendorStatsResponseSchema = z.object({
  totalVendors: z.number().int(),
  byCategory: z.record(z.string(), z.number().int()),
  byStatus: z.record(z.string(), z.number().int()),
  byPriceRange: z.record(z.string(), z.number().int()),
  totalEstimatedCost: z.number(),
  totalContractAmount: z.number(),
  averageRating: z.number().optional(),
  contractedVendors: z.number().int(),
  pendingDeadlines: z.number().int(),
  recommendedVendors: z.number().int()
})

export type VendorStatsResponse = z.infer<typeof VendorStatsResponseSchema>

// Category breakdown response
export const VendorCategoryStatsSchema = z.object({
  category: z.string(),
  totalVendors: z.number().int(),
  bookedVendors: z.number().int(),
  averageCost: z.number().optional(),
  averageRating: z.number().optional(),
  recommendedCount: z.number().int()
})

export type VendorCategoryStats = z.infer<typeof VendorCategoryStatsSchema>

// Paginated vendors response
export type VendorsPaginatedResponse = PaginatedResponse<VendorSummaryResponse>

// Search/filter request schema
export const VendorSearchRequestSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum([
    VendorStatus.POTENTIAL,
    VendorStatus.CONTACTED,
    VendorStatus.QUOTED,
    VendorStatus.BOOKED,
    VendorStatus.COMPLETED,
    VendorStatus.CANCELLED
  ]).optional(),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  minCost: z.number().min(0).optional(),
  maxCost: z.number().min(0).optional(),
  minRating: z.number().min(1).max(5).optional(),
  contractSigned: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  tags: z.array(z.string()).optional(),
  deadlineFrom: z.string().optional(),
  deadlineTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'category', 'status', 'estimatedCost', 'rating', 'createdAt', 'bookingDeadline']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export type VendorSearchRequest = z.infer<typeof VendorSearchRequestSchema>

// Vendor recommendations request
export const VendorRecommendationRequestSchema = z.object({
  category: z.string(),
  budget: z.number().min(0).optional(),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string()
  }).optional(),
  preferences: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(50).default(10)
})

export type VendorRecommendationRequest = z.infer<typeof VendorRecommendationRequestSchema>