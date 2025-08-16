/**
 * Budget API - Payment recording
 * POST /api/budget/expenses/[id]/payment - Record payment for expense
 */

import { NextRequest } from 'next/server'
import { BudgetApiHandler } from '@/features/budget'

const handler = new BudgetApiHandler()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return handler.recordPayment(request, resolvedParams)
}