/**
 * Budget API - Bulk category operations
 * POST /api/budget/categories/bulk - Bulk create budget categories
 */

import { NextRequest } from 'next/server'
import { BudgetApiHandler } from '@/features/budget'

const handler = new BudgetApiHandler()

export async function POST(request: NextRequest) {
  return handler.bulkCreateCategories(request)
}