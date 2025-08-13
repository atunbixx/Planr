/**
 * Budget API - Reallocation endpoint
 * POST /api/budget/reallocate - Reallocate budget across categories
 */

import { NextRequest } from 'next/server'
import { BudgetApiHandler } from '@/features/budget'

const handler = new BudgetApiHandler()

export async function POST(request: NextRequest) {
  return handler.reallocateBudget(request)
}