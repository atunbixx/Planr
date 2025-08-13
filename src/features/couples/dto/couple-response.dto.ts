/**
 * Couple Response DTOs - Output formats for API responses
 */

import { z } from 'zod'
import { BaseEntity, PaginatedResponse } from '@/shared/types/common'

// Core couple response structure
export const CoupleResponseSchema = z.object({
  id: z.string().uuid(),
  
  // Partner 1 (Primary)
  partner1Name: z.string(),
  partner1Email: z.string().email(),
  partner1Phone: z.string().optional(),
  
  // Partner 2
  partner2Name: z.string(),
  partner2Email: z.string().email().optional(),
  partner2Phone: z.string().optional(),
  
  // Wedding Details
  weddingDate: z.string(), // ISO date string
  venue: z.string(),
  guestCount: z.number().int(),
  totalBudget: z.number().optional(),
  currency: z.string(),
  
  // Location
  weddingLocation: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string()
  }).optional(),
  
  // Preferences
  timezone: z.string(),
  language: z.string(),
  
  // Metadata
  notes: z.string().optional(),
  planningPhase: z.enum([
    'initial',
    'planning',
    'booking',
    'finalizing',
    'post_wedding'
  ]),
  
  // Audit fields
  userId: z.string(),
  createdAt: z.string(), // ISO datetime string
  updatedAt: z.string()  // ISO datetime string
})

export type CoupleResponse = z.infer<typeof CoupleResponseSchema>

// Summary response for dashboard/lists
export const CoupleSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  partner1Name: z.string(),
  partner2Name: z.string(),
  weddingDate: z.string(),
  venue: z.string(),
  guestCount: z.number().int(),
  planningPhase: z.enum([
    'initial',
    'planning',
    'booking',
    'finalizing',
    'post_wedding'
  ]),
  daysUntilWedding: z.number().int()
})

export type CoupleSummaryResponse = z.infer<typeof CoupleSummaryResponseSchema>

// Statistics response
export const CoupleStatsResponseSchema = z.object({
  totalCouples: z.number().int(),
  byPlanningPhase: z.record(z.string(), z.number().int()),
  upcomingWeddings: z.number().int(),
  averageGuestCount: z.number(),
  averageBudget: z.number().optional()
})

export type CoupleStatsResponse = z.infer<typeof CoupleStatsResponseSchema>

// Paginated couples response
export type CouplesPaginatedResponse = PaginatedResponse<CoupleSummaryResponse>

// Search/filter request schema
export const CoupleSearchRequestSchema = z.object({
  search: z.string().optional(),
  planningPhase: z.enum([
    'initial',
    'planning',
    'booking',
    'finalizing',
    'post_wedding'
  ]).optional(),
  weddingDateFrom: z.string().optional(),
  weddingDateTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['weddingDate', 'createdAt', 'partner1Name']).default('weddingDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export type CoupleSearchRequest = z.infer<typeof CoupleSearchRequestSchema>