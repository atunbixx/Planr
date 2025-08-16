import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createErrorResponse } from '@/lib/auth/jwt'
import { createBudgetSchema } from '@/lib/validation/budget'

// GET /api/budget - List all budget items for the authenticated user
async function getHandler(request: AuthenticatedRequest) {
  try {
    const budgetItems = await prisma.budget.findMany({
      where: { userId: request.user!.id },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate summary statistics
    const summary = budgetItems.reduce((acc, item) => {
      acc.totalAmount += Number(item.amount)
      acc.totalAllocated += Number(item.allocated)
      acc.totalActual += Number(item.actual)
      return acc
    }, {
      totalAmount: 0,
      totalAllocated: 0,
      totalActual: 0
    })

    return NextResponse.json({
      success: true,
      data: {
        items: budgetItems,
        summary: {
          ...summary,
          remainingBudget: summary.totalAmount - summary.totalActual,
          percentSpent: summary.totalAmount > 0 ? (summary.totalActual / summary.totalAmount) * 100 : 0
        }
      }
    })
  } catch (error) {
    console.error('Get budget error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

// POST /api/budget - Create a new budget item
async function postHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = createBudgetSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`
        ),
        { status: 400 }
      )
    }

    const { category, amount, allocated, actual, status } = validationResult.data

    // Create budget item
    const budgetItem = await prisma.budget.create({
      data: {
        userId: request.user!.id,
        category,
        amount,
        allocated,
        actual,
        status
      }
    })

    return NextResponse.json({
      success: true,
      data: budgetItem
    }, { status: 201 })

  } catch (error) {
    console.error('Create budget error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

export const GET = requireOnboarding(getHandler)
export const POST = requireOnboarding(postHandler)