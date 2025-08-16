/**
 * Budget API - Individual category management
 * PATCH /api/budget/categories/[id] - Update budget category
 * DELETE /api/budget/categories/[id] - Delete budget category
 */

import { NextRequest } from 'next/server'
import { BudgetApiHandler } from '@/features/budget'

const handler = new BudgetApiHandler()

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return handler.updateBudgetCategory(request, resolvedParams)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return handler.deleteBudgetCategory(request, resolvedParams)
}