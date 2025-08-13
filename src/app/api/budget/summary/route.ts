/**
 * Budget API - Summary endpoint
 * GET /api/budget/summary - Get budget summary
 */

import { NextRequest } from 'next/server'
import { BudgetApiHandler } from '@/features/budget'

const handler = new BudgetApiHandler()

export async function GET(request: NextRequest) {
  return handler.getBudgetSummary(request)
}