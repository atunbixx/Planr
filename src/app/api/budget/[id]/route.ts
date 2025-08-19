import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createErrorResponse } from '@/lib/auth/jwt'
import { updateBudgetSchema } from '@/lib/validation/budget'

interface RouteParams {
  params: { id: string }
}

// GET /api/budget/[id] - Get a specific budget item
async function getHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const budgetItem = await prisma.budget.findFirst({
      where: {
        id: params.id,
        userId: request.user!.id
      }
    })

    if (!budgetItem) {
      return NextResponse.json(
        createErrorResponse('Budget item not found'),
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: budgetItem
    })
  } catch (error) {
    console.error('Get budget item error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

// PUT /api/budget/[id] - Update a budget item
async function putHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = updateBudgetSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${validationResult.error.issues.map(e => e.message).join(', ')}`
        ),
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Update budget item
    const budgetItem = await prisma.budget.updateMany({
      where: {
        id: params.id,
        userId: request.user!.id
      },
      data: updateData
    })

    if (budgetItem.count === 0) {
      return NextResponse.json(
        createErrorResponse('Budget item not found'),
        { status: 404 }
      )
    }

    // Fetch and return updated budget item
    const updatedBudgetItem = await prisma.budget.findUnique({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      data: updatedBudgetItem
    })

  } catch (error) {
    console.error('Update budget item error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

// DELETE /api/budget/[id] - Delete a budget item
async function deleteHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const budgetItem = await prisma.budget.deleteMany({
      where: {
        id: params.id,
        userId: request.user!.id
      }
    })

    if (budgetItem.count === 0) {
      return NextResponse.json(
        createErrorResponse('Budget item not found'),
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Budget item deleted successfully'
    })

  } catch (error) {
    console.error('Delete budget item error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

export const GET = requireOnboarding(async (request: AuthenticatedRequest) => {
  const params = { id: request.url.split('/').pop()! }
  return getHandler(request, { params })
})

export const PUT = requireOnboarding(async (request: AuthenticatedRequest) => {
  const params = { id: request.url.split('/').pop()! }
  return putHandler(request, { params })
})

export const DELETE = requireOnboarding(async (request: AuthenticatedRequest) => {
  const params = { id: request.url.split('/').pop()! }
  return deleteHandler(request, { params })
})