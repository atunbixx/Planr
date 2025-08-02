import { NextRequest, NextResponse } from 'next/server'
import { BudgetService } from '@/lib/services/budget.service'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// GET /api/budget/overview - Get comprehensive budget overview
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    // Get couple ID
    const couple = await prisma.couples.findFirst({
      where: {
        OR: [
          { partner1_user_id: user.id },
          { partner2_user_id: user.id }
        ]
      }
    })

    if (!couple) {
      return createErrorResponse('Couple not found', 404)
    }

    const overview = await BudgetService.getBudgetOverview(couple.id)
    
    return createSuccessResponse(overview)
  } catch (error) {
    console.error('Budget overview error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// POST /api/budget/overview - Initialize budget with default categories
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json()
    const { totalBudget } = body

    if (!totalBudget || totalBudget <= 0) {
      return createErrorResponse('Valid total budget is required', 400)
    }

    // Get couple ID
    const couple = await prisma.couples.findFirst({
      where: {
        OR: [
          { partner1_user_id: user.id },
          { partner2_user_id: user.id }
        ]
      }
    })

    if (!couple) {
      return createErrorResponse('Couple not found', 404)
    }

    // Update couple's total budget
    await prisma.couples.update({
      where: { id: couple.id },
      data: { total_budget: totalBudget }
    })

    // Create default categories
    const categories = await BudgetService.createDefaultCategories(couple.id, totalBudget)
    
    // Get updated overview
    const overview = await BudgetService.getBudgetOverview(couple.id)
    
    return createSuccessResponse({
      overview,
      categoriesCreated: categories.length
    }, 'Budget initialized successfully')
  } catch (error) {
    console.error('Initialize budget error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}