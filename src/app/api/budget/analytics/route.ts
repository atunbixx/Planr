/**
 * Budget API - Analytics endpoint
 * GET /api/budget/analytics - Get budget analytics
 */

import { NextRequest } from 'next/server'
import { BudgetApiHandler } from '@/features/budget'

const handler = new BudgetApiHandler()

export async function GET(request: NextRequest) {
  return handler.getBudgetAnalytics(request)
}