import { BaseService } from './base.service'
import { BudgetExpense, BudgetCategory, Prisma } from '@prisma/client'
import { BudgetCategoryWithExpenses, BudgetStats } from '@/types/api'
import { BadRequestException } from '@/lib/api/errors'

export class BudgetService extends BaseService<BudgetExpense> {
  protected modelName = 'budgetExpense' as const

  // Get all expenses for a couple
  async getExpensesByCouple(coupleId: string) {
    return await this.prisma.budgetExpense.findMany({
      where: { coupleId },
      include: {
        category: {
          select: {
            name: true,
            color: true,
            icon: true
          }
        },
        vendor: {
          select: {
            businessName: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })
  }

  // Get categories with expenses
  async getCategoriesWithExpenses(coupleId: string): Promise<BudgetCategoryWithExpenses[]> {
    const categories = await this.prisma.budgetCategory.findMany({
      where: { coupleId },
      include: {
        expenses: {
          orderBy: { date: 'desc' }
        }
      }
    })

    // Calculate totals for each category
    return categories.map(category => ({
      ...category,
      _sum: {
        expenses: {
          amount: category.expenses.reduce((sum, expense) => sum + expense.amount.toNumber(), 0)
        }
      }
    }))
  }

  // Get budget statistics
  async getBudgetStats(coupleId: string): Promise<BudgetStats> {
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      select: { budgetTotal: true }
    })

    const expenses = await this.prisma.budgetExpense.findMany({
      where: { coupleId },
      select: { amount: true, isPaid: true }
    })

    const totalBudget = couple?.budgetTotal?.toNumber() || 0
    const totalSpent = expenses
      .filter(e => e.isPaid)
      .reduce((sum, e) => sum + e.amount.toNumber(), 0)
    const totalEstimated = expenses
      .reduce((sum, e) => sum + e.amount.toNumber(), 0)

    return {
      totalBudget,
      totalSpent,
      totalEstimated,
      remainingBudget: totalBudget - totalEstimated,
      percentageUsed: totalBudget > 0 ? (totalEstimated / totalBudget) * 100 : 0
    }
  }

  // Create expense
  async createExpense(coupleId: string, data: {
    categoryId: string
    vendorId?: string
    description: string
    amount: number
    date: string
    isPaid: boolean
    notes?: string
  }): Promise<BudgetExpense> {
    // Validate required fields
    if (!data.categoryId || !data.description || !data.amount) {
      throw new BadRequestException('Category, description, and amount are required')
    }

    // Verify category belongs to couple
    const category = await this.prisma.budgetCategory.findFirst({
      where: { id: data.categoryId, coupleId }
    })

    if (!category) {
      throw new BadRequestException('Invalid category')
    }

    return await this.create({
      ...data,
      coupleId,
      amount: new Prisma.Decimal(data.amount),
      date: new Date(data.date)
    })
  }

  // Update expense
  async updateExpense(
    id: string,
    coupleId: string,
    data: Partial<{
      categoryId: string
      vendorId: string
      description: string
      amount: number
      date: string
      isPaid: boolean
      notes: string
    }>
  ): Promise<BudgetExpense> {
    // Verify ownership
    const expense = await this.findFirst({ id, coupleId })
    if (!expense) {
      throw new BadRequestException('Expense not found')
    }

    const updateData: any = { ...data }
    
    if (data.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(data.amount)
    }
    
    if (data.date !== undefined) {
      updateData.date = new Date(data.date)
    }

    return await this.update(id, updateData)
  }

  // Create budget category
  async createCategory(coupleId: string, data: {
    name: string
    estimatedCost?: number
    color?: string
    icon?: string
  }): Promise<BudgetCategory> {
    if (!data.name) {
      throw new BadRequestException('Category name is required')
    }

    return await this.prisma.budgetCategory.create({
      data: {
        ...data,
        coupleId,
        estimatedCost: data.estimatedCost ? new Prisma.Decimal(data.estimatedCost) : null
      }
    })
  }

  // Update budget category
  async updateCategory(
    id: string,
    coupleId: string,
    data: Partial<{
      name: string
      estimatedCost: number
      color: string
      icon: string
    }>
  ): Promise<BudgetCategory> {
    // Verify ownership
    const category = await this.prisma.budgetCategory.findFirst({
      where: { id, coupleId }
    })

    if (!category) {
      throw new BadRequestException('Category not found')
    }

    const updateData: any = { ...data }
    
    if (data.estimatedCost !== undefined) {
      updateData.estimatedCost = new Prisma.Decimal(data.estimatedCost)
    }

    return await this.prisma.budgetCategory.update({
      where: { id },
      data: updateData
    })
  }

  // Get expenses by category
  async getExpensesByCategory(
    coupleId: string,
    categoryId: string
  ): Promise<BudgetExpense[]> {
    return await this.findMany({
      where: { coupleId, categoryId },
      include: {
        vendor: {
          select: {
            businessName: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })
  }

  // Get expenses by date range
  async getExpensesByDateRange(
    coupleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BudgetExpense[]> {
    return await this.findMany({
      where: {
        coupleId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        category: true,
        vendor: true
      },
      orderBy: { date: 'desc' }
    })
  }
}