/**
 * Budget API - Main budget overview
 * GET /api/budget - Get budget summary (legacy endpoint, redirects to /summary)
 */

import { NextRequest } from 'next/server'
import { BudgetApiHandler } from '@/features/budget'

const handler = new BudgetApiHandler()

export async function GET(request: NextRequest) {
  // Legacy endpoint - redirect to budget summary
  return handler.getBudgetSummary(request)
}