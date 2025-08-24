import { NextRequest } from 'next/server'
import { BudgetHandler } from '@/features/budget/handlers/budget.handler'

// Initialize handler
const budgetHandler = new BudgetHandler()

/**
 * PUT /api/budget/items/[id]
 * Update a budget item
 * Requires authentication
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return budgetHandler.updateBudgetItem(request, params.id)
}

/**
 * DELETE /api/budget/items/[id]
 * Delete a budget item
 * Requires authentication
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return budgetHandler.deleteBudgetItem(request, params.id)
}