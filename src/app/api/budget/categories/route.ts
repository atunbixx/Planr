import { NextRequest } from 'next/server'
import { BudgetHandler } from '@/features/budget/handlers/budget.handler'

// Initialize handler
const budgetHandler = new BudgetHandler()

/**
 * GET /api/budget/categories
 * Get budget categories with totals
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  return budgetHandler.getBudgetCategories(request)
}