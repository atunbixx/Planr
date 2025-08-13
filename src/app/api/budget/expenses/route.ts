/**
 * Budget API - Expense management
 * GET /api/budget/expenses - Get budget expenses
 * POST /api/budget/expenses - Create budget expense
 */

import { NextRequest } from 'next/server'
import { BudgetApiHandler } from '@/features/budget'

const handler = new BudgetApiHandler()

export async function GET(request: NextRequest) {
  return handler.getBudgetExpenses(request)
}

export async function POST(request: NextRequest) {
  return handler.createBudgetExpense(request)
}