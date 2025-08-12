import { BaseService, PaginationOptions, PaginatedResult } from './base.service'
import { BudgetCategory, BudgetExpense, Prisma } from '@prisma/client'

export interface CreateBudgetCategoryDto {
  name: string
  icon?: string
  color?: string
  allocatedAmount?: number
  priority?: string
  percentageOfTotal?: number
}

export interface UpdateBudgetCategoryDto extends Partial<CreateBudgetCategoryDto> {}

export interface CreateBudgetExpenseDto {
  categoryId: string
  description: string
  amount: number
  vendorId?: string
  expenseType?: string
  paymentStatus?: string
  paymentMethod?: string
  dueDate?: Date
  paidDate?: Date
  receiptUrl?: string
  notes?: string
}

export interface UpdateBudgetExpenseDto extends Partial<CreateBudgetExpenseDto> {}

export interface BudgetCategoryWithExpenses extends BudgetCategory {
  budgetExpenses?: BudgetExpense[]
  _count?: {
    budgetExpenses: number
  }
}

export interface BudgetSummary {
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  remainingBudget: number
  percentageSpent: number
  categories: BudgetCategoryWithExpenses[]
}

export class BudgetService extends BaseService<BudgetCategory> {
  protected entityName = 'budgetCategory'
  protected cachePrefix = 'budget'
  
  async getCategoriesForCouple(coupleId: string) {
    return this.prisma.budgetCategory.findMany({
      where: { coupleId },
      orderBy: { createdAt: 'desc' }
    })
  }
  
  async createCategory(coupleId: string, data: any) {
    return this.prisma.budgetCategory.create({
      data: {
        ...data,
        coupleId
      }
    })
  }
  
  async updateCategory(id: string, coupleId: string, data: any) {
    return this.prisma.budgetCategory.update({
      where: { id },
      data
    })
  }
  
  async deleteCategory(id: string, coupleId: string) {
    return this.prisma.budgetCategory.delete({
      where: { id }
    })
  }
  
  async getExpensesForCouple(coupleId: string, filters?: any) {
    const where: any = { coupleId }
    if (filters?.categoryId) where.categoryId = filters.categoryId
    if (filters?.vendorId) where.vendorId = filters.vendorId
    if (filters?.status) where.paymentStatus = filters.status
    
    return this.prisma.budgetExpense.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
  }
  
  async createExpense(coupleId: string, data: any) {
    return this.prisma.budgetExpense.create({
      data: {
        ...data,
        coupleId
      }
    })
  }
  
  async updateExpense(id: string, coupleId: string, data: any) {
    return this.prisma.budgetExpense.update({
      where: { id },
      data
    })
  }
  
  async deleteExpense(id: string, coupleId: string) {
    return this.prisma.budgetExpense.delete({
      where: { id }
    })
  }
  
  async getCoupleById(coupleId: string) {
    return this.prisma.couple.findUnique({
      where: { id: coupleId }
    })
  }

  async getBudgetSummary(coupleId: string): Promise<BudgetSummary> {
    const cacheKey = `${this.cachePrefix}:${coupleId}:summary`
    const cached = await this.getCached<BudgetSummary>(cacheKey)
    if (cached) {
      return cached
    }

    // Get couple for total budget
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId }
    })

    // Get all categories with expenses
    const categories = await this.prisma.budgetCategory.findMany({
      where: { coupleId },
      include: {
        budgetExpenses: true,
        _count: {
          select: { budgetExpenses: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { allocatedAmount: 'desc' }
      ]
    })

    // Calculate totals
    const totalBudget = Number(couple?.totalBudget || 0)
    const totalAllocated = categories.reduce((sum, cat) => sum + Number(cat.allocatedAmount || 0), 0)
    const totalSpent = categories.reduce((sum, cat) => sum + Number(cat.spentAmount || 0), 0)

    const summary: BudgetSummary = {
      totalBudget,
      totalAllocated,
      totalSpent,
      remainingBudget: totalBudget - totalSpent,
      percentageSpent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      categories
    }

    await this.setCached(cacheKey, summary)

    return summary
  }

  async createBudgetCategory(coupleId: string, data: CreateBudgetCategoryDto): Promise<BudgetCategory> {
    // Calculate percentage if total budget is available
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId }
    })

    const percentageOfTotal = couple?.totalBudget && data.allocatedAmount
      ? (Number(data.allocatedAmount) / Number(couple.totalBudget)) * 100
      : 0

    const category = await this.prisma.budgetCategory.create({
      data: {
        coupleId,
        name: data.name,
        icon: data.icon || '💰',
        color: data.color || '#667eea',
        allocatedAmount: data.allocatedAmount || 0,
        priority: data.priority || 'important',
        percentageOfTotal: data.percentageOfTotal || percentageOfTotal
      }
    })

    // Clear cache
    await this.clearEntityCache(coupleId)

    return category
  }

  async updateBudgetCategory(
    categoryId: string,
    coupleId: string,
    data: UpdateBudgetCategoryDto
  ): Promise<BudgetCategory> {
    // Recalculate percentage if allocated amount changed
    let percentageOfTotal = data.percentageOfTotal
    if (data.allocatedAmount !== undefined && !data.percentageOfTotal) {
      const couple = await this.prisma.couple.findUnique({
        where: { id: coupleId }
      })
      if (couple?.totalBudget) {
        percentageOfTotal = (Number(data.allocatedAmount) / Number(couple.totalBudget)) * 100
      }
    }

    const category = await this.prisma.budgetCategory.update({
      where: { id: categoryId },
      data: {
        ...data,
        percentageOfTotal
      }
    })

    // Clear cache
    await this.clearEntityCache(coupleId)

    return category
  }

  async createBudgetExpense(coupleId: string, data: CreateBudgetExpenseDto): Promise<BudgetExpense> {
    const expense = await this.prisma.$transaction(async (tx) => {
      // Create expense
      const newExpense = await tx.budgetExpense.create({
        data: {
          coupleId,
          categoryId: data.categoryId,
          description: data.description,
          amount: data.amount,
          vendorId: data.vendorId,
          expenseType: data.expenseType || 'actual',
          paymentStatus: data.paymentStatus || 'pending',
          paymentMethod: data.paymentMethod,
          dueDate: data.dueDate,
          paidDate: data.paidDate,
          receiptUrl: data.receiptUrl,
          notes: data.notes
        }
      })

      // Update category spent amount
      const categoryExpenses = await tx.budgetExpense.aggregate({
        where: {
          categoryId: data.categoryId,
          expenseType: 'actual'
        },
        _sum: { amount: true }
      })

      await tx.budgetCategory.update({
        where: { id: data.categoryId },
        data: {
          spentAmount: categoryExpenses._sum.amount || 0
        }
      })

      return newExpense
    })

    // Clear cache
    await this.clearEntityCache(coupleId)

    return expense
  }

  async updateBudgetExpense(
    expenseId: string,
    coupleId: string,
    data: UpdateBudgetExpenseDto
  ): Promise<BudgetExpense> {
    const expense = await this.prisma.$transaction(async (tx) => {
      // Get current expense
      const currentExpense = await tx.budgetExpense.findUnique({
        where: { id: expenseId }
      })

      if (!currentExpense) {
        throw new Error('Expense not found')
      }

      // Update expense
      const updatedExpense = await tx.budgetExpense.update({
        where: { id: expenseId },
        data
      })

      // Recalculate category spent amount if amount or category changed
      const categoryId = data.categoryId || currentExpense.categoryId
      if (data.amount !== undefined || data.categoryId !== undefined) {
        const categoryExpenses = await tx.budgetExpense.aggregate({
          where: {
            categoryId,
            expenseType: 'actual'
          },
          _sum: { amount: true }
        })

        await tx.budgetCategory.update({
          where: { id: categoryId },
          data: {
            spentAmount: categoryExpenses._sum.amount || 0
          }
        })

        // If category changed, update old category too
        if (data.categoryId && data.categoryId !== currentExpense.categoryId) {
          const oldCategoryExpenses = await tx.budgetExpense.aggregate({
            where: {
              categoryId: currentExpense.categoryId,
              expenseType: 'actual'
            },
            _sum: { amount: true }
          })

          await tx.budgetCategory.update({
            where: { id: currentExpense.categoryId },
            data: {
              spentAmount: oldCategoryExpenses._sum.amount || 0
            }
          })
        }
      }

      return updatedExpense
    })

    // Clear cache
    await this.clearEntityCache(coupleId)

    return expense
  }

  async deleteBudgetExpense(expenseId: string, coupleId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Get expense
      const expense = await tx.budgetExpense.findUnique({
        where: { id: expenseId }
      })

      if (!expense) {
        throw new Error('Expense not found')
      }

      // Delete expense
      await tx.budgetExpense.delete({
        where: { id: expenseId }
      })

      // Update category spent amount
      const categoryExpenses = await tx.budgetExpense.aggregate({
        where: {
          categoryId: expense.categoryId,
          expenseType: 'actual'
        },
        _sum: { amount: true }
      })

      await tx.budgetCategory.update({
        where: { id: expense.categoryId },
        data: {
          spentAmount: categoryExpenses._sum.amount || 0
        }
      })
    })

    // Clear cache
    await this.clearEntityCache(coupleId)
  }

  async getExpensesByCategory(
    coupleId: string,
    categoryId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<BudgetExpense>> {
    const { skip, take, page, pageSize } = this.getPaginationParams(options)

    const where = {
      coupleId,
      categoryId
    }

    const [expenses, total] = await Promise.all([
      this.prisma.budgetExpense.findMany({
        where,
        orderBy: options?.orderBy || { createdAt: 'desc' },
        skip,
        take
      }),
      this.prisma.budgetExpense.count({ where })
    ])

    return this.createPaginatedResult(expenses, total, page, pageSize)
  }
}

// Export singleton instance
export const budgetService = new BudgetService()