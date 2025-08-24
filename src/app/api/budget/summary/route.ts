import { NextRequest } from 'next/server'
import { BudgetHandler } from '@/features/budget/handlers/budget.handler'

// Initialize handler
const budgetHandler = new BudgetHandler()

/**
 * GET /api/budget/summary
 * Get budget summary with server-calculated totals
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  return budgetHandler.getBudgetSummary(request)
}