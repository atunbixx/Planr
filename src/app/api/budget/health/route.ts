import { NextRequest } from 'next/server'
import { BudgetHandler } from '@/features/budget/handlers/budget.handler'

// Initialize handler
const budgetHandler = new BudgetHandler()

/**
 * GET /api/budget/health
 * Health check for budget service
 * Public endpoint for monitoring
 */
export async function GET(request: NextRequest) {
  return budgetHandler.healthCheck(request)
}