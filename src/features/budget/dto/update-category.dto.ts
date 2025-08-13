/**
 * Update Budget Category DTO - Input validation for budget category updates
 */

import { z } from 'zod'
import { MoneyAmountSchema } from '@/shared/validation/schemas'

export const UpdateBudgetCategoryRequestSchema = z.object({
  // Basic Information Updates
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  
  // Budget Allocation Updates
  plannedAmount: MoneyAmountSchema.optional(),
  currency: z.string().length(3).optional(),
  
  // Category Details Updates
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
  ]).optional(),
  
  // Priority and Tracking Updates
  priority: z.enum(['low', 'medium', 'high', 'essential']).optional(),
  isEssential: z.boolean().optional(),
  
  // Budget Timeline Updates
  needsByDate: z.string().datetime().optional(),
  finalPaymentDate: z.string().datetime().optional(),
  
  // Vendor Association Updates
  vendorId: z.string().uuid().optional(),
  
  // Metadata Updates
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).optional(),
  
  // Buffer and Flexibility Updates
  bufferPercentage: z.number().min(0).max(100).optional(),
  isFlexible: z.boolean().optional(),
  
  // Tracking Options Updates
  trackPayments: z.boolean().optional(),
  allowOverspend: z.boolean().optional(),
  
  // External References Updates
  externalId: z.string().optional()
}).strict()

export type UpdateBudgetCategoryRequest = z.infer<typeof UpdateBudgetCategoryRequestSchema>

// Internal DTO for database operations
export const UpdateBudgetCategoryDataSchema = UpdateBudgetCategoryRequestSchema.extend({
  // Calculated fields that might be updated
  remainingAmount: z.number().optional(),
  percentageUsed: z.number().optional(),
  updatedAt: z.date()
})

export type UpdateBudgetCategoryData = z.infer<typeof UpdateBudgetCategoryDataSchema>

// Patch validation - at least one field must be provided
export const PatchBudgetCategoryRequestSchema = UpdateBudgetCategoryRequestSchema.refine(
  (data) => Object.values(data).some(value => value !== undefined),
  {
    message: "At least one field must be provided for update",
    path: ["root"]
  }
)

export type PatchBudgetCategoryRequest = z.infer<typeof PatchBudgetCategoryRequestSchema>

// Budget reallocation schema
export const BudgetReallocationRequestSchema = z.object({
  reallocations: z.array(z.object({
    categoryId: z.string().uuid(),
    newPlannedAmount: MoneyAmountSchema,
    reason: z.string().max(500).optional()
  })),
  totalBudgetChange: MoneyAmountSchema.optional(),
  reason: z.string().max(1000).optional()
})

export type BudgetReallocationRequest = z.infer<typeof BudgetReallocationRequestSchema>

// Category merge schema (for combining similar categories)
export const MergeCategoriesRequestSchema = z.object({
  targetCategoryId: z.string().uuid(),
  sourceCategoryIds: z.array(z.string().uuid()).min(1),
  newName: z.string().min(1).max(100).optional(),
  keepExpenses: z.boolean().default(true),
  reason: z.string().max(500).optional()
})

export type MergeCategoriesRequest = z.infer<typeof MergeCategoriesRequestSchema>

// Category split schema (for dividing a category)
export const SplitCategoryRequestSchema = z.object({
  sourceCategoryId: z.string().uuid(),
  newCategories: z.array(z.object({
    name: z.string().min(1).max(100),
    plannedAmount: MoneyAmountSchema,
    description: z.string().max(500).optional(),
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
    ]).optional()
  })).min(2),
  expenseDistribution: z.enum(['split_equally', 'move_to_first', 'manual']).default('split_equally'),
  reason: z.string().max(500).optional()
})

export type SplitCategoryRequest = z.infer<typeof SplitCategoryRequestSchema>