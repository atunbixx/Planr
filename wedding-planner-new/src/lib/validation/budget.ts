import { z } from 'zod'

export const createBudgetSchema = z.object({
  category: z.string().min(1, 'Category is required').trim(),
  amount: z.number().positive('Amount must be positive'),
  allocated: z.number().nonnegative('Allocated amount cannot be negative'),
  actual: z.number().nonnegative('Actual amount cannot be negative').default(0),
  status: z.enum(['planned', 'quoted', 'booked', 'paid']).default('planned')
})

export const updateBudgetSchema = z.object({
  category: z.string().min(1, 'Category is required').trim().optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  allocated: z.number().nonnegative('Allocated amount cannot be negative').optional(),
  actual: z.number().nonnegative('Actual amount cannot be negative').optional(),
  status: z.enum(['planned', 'quoted', 'booked', 'paid']).optional()
})

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>