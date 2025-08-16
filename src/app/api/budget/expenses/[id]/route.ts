/**
 * Budget API - Individual expense management
 * PATCH /api/budget/expenses/[id] - Update budget expense
 * DELETE /api/budget/expenses/[id] - Delete budget expense
 */

import { NextRequest } from 'next/server'
import { BudgetApiHandler } from '@/features/budget'

const handler = new BudgetApiHandler()

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return handler.updateBudgetExpense(request, resolvedParams)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return handler.deleteBudgetExpense(request, resolvedParams)
}