/**
 * Create Budget Category DTO - Input validation for budget category creation
 */

import { z } from 'zod'
import { MoneyAmountSchema } from '@/shared/validation/schemas'

export const CreateBudgetCategoryRequestSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
  
  // Budget Allocation
  plannedAmount: MoneyAmountSchema,
  currency: z.string().length(3).default('USD'),
  
  // Category Details
  categoryType: z.enum([
    'venue',
    'catering',
    'photography',
    'videography',
    'music',
    'flowers',
    'attire',
    'rings',
    'transportation',
    'accommodation',
    'invitations',
    'favors',
    'decorations',
    'beauty',
    'honeymoon',
    'other'
  ]),
  
  // Priority and Tracking
  priority: z.enum(['low', 'medium', 'high', 'essential']).default('medium'),
  isEssential: z.boolean().default(false),
  
  // Budget Timeline
  needsByDate: z.string().datetime().optional(),
  finalPaymentDate: z.string().datetime().optional(),
  
  // Vendor Association
  vendorId: z.string().uuid().optional(),
  
  // Metadata
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).default([]),
  
  // Buffer and Flexibility
  bufferPercentage: z.number().min(0).max(100).default(10),
  isFlexible: z.boolean().default(true),
  
  // Tracking Options
  trackPayments: z.boolean().default(true),
  allowOverspend: z.boolean().default(false),
  
  // External References
  externalId: z.string().optional()
})

export type CreateBudgetCategoryRequest = z.infer<typeof CreateBudgetCategoryRequestSchema>

// Internal DTO for database operations
export const CreateBudgetCategoryDataSchema = CreateBudgetCategoryRequestSchema.extend({
  id: z.string().uuid(),
  coupleId: z.string().uuid(),
  actualSpent: z.number().default(0),
  remainingAmount: z.number(), // Calculated: plannedAmount - actualSpent
  percentageUsed: z.number().default(0), // Calculated: (actualSpent / plannedAmount) * 100
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CreateBudgetCategoryData = z.infer<typeof CreateBudgetCategoryDataSchema>

// Budget category templates for quick setup
export const BudgetCategoryTemplate = {
  VENUE: {
    name: 'Venue',
    categoryType: 'venue',
    priority: 'essential',
    isEssential: true,
    bufferPercentage: 5
  },
  CATERING: {
    name: 'Catering & Bar',
    categoryType: 'catering',
    priority: 'essential',
    isEssential: true,
    bufferPercentage: 10
  },
  PHOTOGRAPHY: {
    name: 'Photography',
    categoryType: 'photography',
    priority: 'high',
    isEssential: false,
    bufferPercentage: 15
  },
  VIDEOGRAPHY: {
    name: 'Videography',
    categoryType: 'videography',
    priority: 'medium',
    isEssential: false,
    bufferPercentage: 15
  },
  MUSIC: {
    name: 'Music & Entertainment',
    categoryType: 'music',
    priority: 'high',
    isEssential: false,
    bufferPercentage: 10
  },
  FLOWERS: {
    name: 'Flowers & Decorations',
    categoryType: 'flowers',
    priority: 'medium',
    isEssential: false,
    bufferPercentage: 20
  },
  ATTIRE: {
    name: 'Wedding Attire',
    categoryType: 'attire',
    priority: 'high',
    isEssential: true,
    bufferPercentage: 15
  },
  RINGS: {
    name: 'Wedding Rings',
    categoryType: 'rings',
    priority: 'essential',
    isEssential: true,
    bufferPercentage: 5
  }
} as const

// Bulk category creation for initial setup
export const BulkCreateCategoriesRequestSchema = z.object({
  totalBudget: MoneyAmountSchema,
  currency: z.string().length(3).default('USD'),
  categories: z.array(z.object({
    templateKey: z.string().optional(),
    customCategory: CreateBudgetCategoryRequestSchema.optional(),
    allocation: z.number().min(0).max(100) // Percentage of total budget
  })),
  autoCalculateAmounts: z.boolean().default(true)
})

export type BulkCreateCategoriesRequest = z.infer<typeof BulkCreateCategoriesRequestSchema>