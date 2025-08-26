import { z } from 'zod'

export const BudgetItemDto = z.object({
  id: z.string(),
  userId: z.string(),
  category: z.string(),
  name: z.string().optional(),
  allocated: z.number(),
  actual: z.number(),
  amount: z.number(),
  status: z.enum(['planned', 'quoted', 'booked', 'paid']),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type BudgetItem = z.infer<typeof BudgetItemDto>

export const BudgetSummaryDto = z.object({
  totalAmount: z.number(),
  totalAllocated: z.number(),
  totalActual: z.number(),
  remainingBudget: z.number(),
  percentSpent: z.number(),
})

export type BudgetSummary = z.infer<typeof BudgetSummaryDto>

export const BudgetListResponseDto = z.object({
  items: z.array(BudgetItemDto),
  summary: BudgetSummaryDto,
})

export type BudgetListResponse = z.infer<typeof BudgetListResponseDto>

