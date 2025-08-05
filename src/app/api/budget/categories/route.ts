import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

// Default budget categories based on wedding industry standards
const DEFAULT_CATEGORIES = [
  { name: 'Venue', allocatedAmount: 0.40, priority: 'high', color: '#8B5CF6', icon: '🏛️' },
  { name: 'Catering', allocatedAmount: 0.25, priority: 'high', color: '#06B6D4', icon: '🍽️' },
  { name: 'Photography', allocatedAmount: 0.10, priority: 'high', color: '#10B981', icon: '📸' },
  { name: 'Music/DJ', allocatedAmount: 0.08, priority: 'medium', color: '#F59E0B', icon: '🎵' },
  { name: 'Flowers', allocatedAmount: 0.05, priority: 'medium', color: '#EF4444', icon: '💐' },
  { name: 'Attire', allocatedAmount: 0.05, priority: 'medium', color: '#8B5CF6', icon: '👗' },
  { name: 'Transportation', allocatedAmount: 0.03, priority: 'low', color: '#6B7280', icon: '🚗' },
  { name: 'Other', allocatedAmount: 0.04, priority: 'low', color: '#9CA3AF', icon: '📝' }
]

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and couple
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await prisma.couple.findFirst({
      where: { userId: dbUser.id }
    })

    if (!couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    // Get existing categories
    const categories = await prisma.budgetCategory.findMany({
      where: { coupleId: couple.id },
      include: {
        expenses: {
          select: {
            amount: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Calculate spent amounts
    const categoriesWithSpent = categories.map(category => ({
      ...category,
      spentAmount: category.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    }))

    return NextResponse.json(categoriesWithSpent)
  } catch (error) {
    console.error('Error fetching budget categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await prisma.couple.findFirst({
      where: { userId: dbUser.id }
    })

    if (!couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, allocatedAmount, priority, color, icon, initializeDefaults } = body

    // If initializing defaults, create all default categories
    if (initializeDefaults && couple.totalBudget) {
      const totalBudget = Number(couple.totalBudget)
      
      const defaultCategories = await Promise.all(
        DEFAULT_CATEGORIES.map(category => 
          prisma.budgetCategory.create({
            data: {
              coupleId: couple.id,
              name: category.name,
              allocatedAmount: totalBudget * category.allocatedAmount,
              priority: category.priority,
              color: category.color,
              icon: category.icon
            }
          })
        )
      )

      return NextResponse.json(defaultCategories)
    }

    // Create single category
    const category = await prisma.budgetCategory.create({
      data: {
        coupleId: couple.id,
        name,
        allocatedAmount: Number(allocatedAmount),
        priority: priority || 'medium',
        color,
        icon
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating budget category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}