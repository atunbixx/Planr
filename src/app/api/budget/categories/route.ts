/**
 * Budget API - Category management
 * GET /api/budget/categories - Get budget categories
 * POST /api/budget/categories - Create budget category
 */

import { NextRequest } from 'next/server'
import { BudgetApiHandler } from '@/features/budget'

const handler = new BudgetApiHandler()

export async function GET(request: NextRequest) {
  return handler.getBudgetCategories(request)
}

export async function POST(request: NextRequest) {
  return handler.createBudgetCategory(request)
}