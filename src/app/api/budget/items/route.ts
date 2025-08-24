import { NextRequest } from 'next/server'
import { BudgetHandler } from '@/features/budget/handlers/budget.handler'

// Initialize handler
const budgetHandler = new BudgetHandler()

/**
 * GET /api/budget/items
 * Get budget items with filtering
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  return budgetHandler.getBudgetItems(request)
}

/**
 * POST /api/budget/items
 * Create a new budget item
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  return budgetHandler.createBudgetItem(request)
}