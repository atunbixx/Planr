import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fixed to query budget data separately instead of using non-existent relations
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { supabase_user_id: user.id }
    })
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get couple data
    const couple = await prisma.wedding_couples.findFirst({
      where: { 
        OR: [
          { partner1_user_id: dbUser.id },
          { partner2_user_id: dbUser.id }
        ]
      }
    })
    
    if (!couple) {
      return NextResponse.json({ 
        success: true,
        data: {
          totalBudget: 0,
          totalSpent: 0,
          totalAllocated: 0,
          remaining: 0,
          spentPercentage: 0,
          categories: [],
          recentExpenses: []
        }
      })
    }
    
    // Get budget categories and expenses using the couple ID
    const budgetCategories = await prisma.budgetCategory.findMany({
      where: { coupleId: couple.id },
      include: {
        budgetExpenses: {
          orderBy: { dueDate: 'desc' },
          take: 5 // Recent expenses per category
        }
      }
    })
    
    const recentExpenses = await prisma.budgetExpense.findMany({
      where: { coupleId: couple.id },
      include: {
        budgetCategory: {
          select: {
            name: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: { dueDate: 'desc' },
      take: 10 // Recent expenses overall
    })

    // Calculate totals
    const totalBudget = Number(couple.total_budget || 0)
    const categories = budgetCategories || []
    
    const totalSpent = categories.reduce((sum, cat) => 
      sum + Number(cat.spentAmount || 0), 0
    )
    const totalAllocated = categories.reduce((sum, cat) => 
      sum + Number(cat.allocatedAmount || 0), 0
    )
    const remaining = totalBudget - totalSpent
    const spentPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

    // Transform categories for frontend
    const transformedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || '💰',
      color: cat.color || '#667eea',
      allocatedAmount: Number(cat.allocatedAmount || 0),
      spentAmount: Number(cat.spentAmount || 0),
      priority: cat.priority || 'medium',
      industryAveragePercentage: Number(cat.industryAveragePercentage || 0),
      percentageOfTotal: totalBudget > 0 ? 
        Math.round((Number(cat.allocatedAmount || 0) / totalBudget) * 100) : 0,
      expenses: cat.budgetExpenses.map(exp => ({
        id: exp.id,
        description: exp.description,
        amount: Number(exp.amount),
        dueDate: exp.dueDate,
        paymentStatus: exp.paymentStatus
      }))
    }))

    // Transform recent expenses
    const transformedExpenses = recentExpenses.map(exp => ({
      id: exp.id,
      description: exp.description,
      amount: Number(exp.amount),
      dueDate: exp.dueDate,
      paymentStatus: exp.paymentStatus,
      category: exp.budgetCategory ? {
        name: exp.budgetCategory.name,
        icon: exp.budgetCategory.icon,
        color: exp.budgetCategory.color
      } : null
    }))

    return NextResponse.json({
      success: true,
      data: {
        totalBudget,
        totalSpent,
        totalAllocated,
        remaining,
        spentPercentage,
        categories: transformedCategories,
        recentExpenses: transformedExpenses
      }
    })

  } catch (error) {
    console.error('Error fetching budget data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budget data' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { totalBudget } = await request.json()

    if (typeof totalBudget !== 'number' || totalBudget < 0) {
      return NextResponse.json(
        { error: 'Invalid budget amount' },
        { status: 400 }
      )
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { supabase_user_id: user.id }
    })
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update couple's total budget
    const couple = await prisma.wedding_couples.updateMany({
      where: { 
        OR: [
          { partner1_user_id: dbUser.id },
          { partner2_user_id: dbUser.id }
        ]
      },
      data: { total_budget: totalBudget }
    })

    if (couple.count === 0) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { totalBudget }
    })

  } catch (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}