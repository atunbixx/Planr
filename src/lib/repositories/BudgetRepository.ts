/**
 * BudgetRepository - Single source of truth for budget data access
 * Provides consistent budget operations across all handlers
 */

import { prisma } from '@/lib/prisma'

export interface BudgetSummary {
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  totalRemaining: number
  spentPercentage: number
  categories: BudgetCategoryWithExpenses[]
  recentExpenses: BudgetExpenseWithCategory[]
}

export interface BudgetCategoryWithExpenses {
  id: string
  name: string
  icon: string
  color: string
  allocatedAmount: number
  spentAmount: number
  priority: string
  industryAveragePercentage: number
  percentageOfTotal: number
  expenses: BudgetExpenseData[]
}

export interface BudgetExpenseWithCategory {
  id: string
  description: string
  amount: number
  dueDate: string | null
  paymentStatus: string
  category: {
    name: string
    icon: string
    color: string
  } | null
}

export interface BudgetExpenseData {
  id: string
  description: string
  amount: number
  dueDate: string | null
  paymentStatus: string
}

export interface BudgetCategoryData {
  id: string
  name: string
  icon: string
  color: string
  allocatedAmount: number
  spentAmount: number
  priority: string
  industryAveragePercentage: number
}

export interface CreateBudgetCategoryData {
  name: string
  icon?: string
  color?: string
  allocatedAmount: number
  priority?: string
  industryAveragePercentage?: number
}

export interface UpdateBudgetCategoryData {
  name?: string
  icon?: string
  color?: string
  allocatedAmount?: number
  priority?: string
  industryAveragePercentage?: number
}

export interface CreateBudgetExpenseData {
  categoryId: string
  description: string
  amount: number
  dueDate?: Date
  paymentStatus?: string
  vendorId?: string
  expenseType?: string
}

export interface UpdateBudgetExpenseData {
  categoryId?: string
  description?: string
  amount?: number
  dueDate?: Date
  paymentStatus?: string
  vendorId?: string
  expenseType?: string
}

export class BudgetRepository {
  /**
   * Get complete budget summary for a couple
   */
  async getBudgetSummary(coupleId: string): Promise<BudgetSummary> {
    try {
      // Get couple's total budget
      const couple = await prisma.couple.findUnique({
        where: { id: coupleId },
        select: { totalBudget: true }
      })

      if (!couple) {
        throw new Error('Couple not found')
      }

      // Get categories with expenses
      const categories = await prisma.budgetCategory.findMany({
        where: { coupleId },
        include: {
          budgetExpenses: {
            orderBy: { dueDate: 'desc' },
            take: 5
          }
        }
      })

      // Get recent expenses with category info
      const recentExpenses = await prisma.budgetExpense.findMany({
        where: { coupleId },
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
        take: 10
      })

      // Calculate totals
      const totalBudget = Number(couple.totalBudget || 0)
      const totalSpent = categories.reduce((sum, cat) => sum + Number(cat.spentAmount || 0), 0)
      const totalAllocated = categories.reduce((sum, cat) => sum + Number(cat.allocatedAmount || 0), 0)
      const totalRemaining = totalBudget - totalSpent
      const spentPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

      return {
        totalBudget,
        totalAllocated,
        totalSpent,
        totalRemaining,
        spentPercentage,
        categories: categories.map(cat => this.transformCategoryWithExpenses(cat, totalBudget)),
        recentExpenses: recentExpenses.map(exp => this.transformExpenseWithCategory(exp))
      }
    } catch (error) {
      console.error('Error getting budget summary:', error)
      throw new Error('Failed to get budget summary')
    }
  }

  /**
   * Get all budget categories for a couple
   */
  async getCategories(coupleId: string): Promise<BudgetCategoryData[]> {
    try {
      const categories = await prisma.budgetCategory.findMany({
        where: { coupleId },
        orderBy: { name: 'asc' }
      })

      return categories.map(cat => this.transformCategory(cat))
    } catch (error) {
      console.error('Error getting budget categories:', error)
      throw new Error('Failed to get budget categories')
    }
  }

  /**
   * Create new budget category with transaction support
   */
  async createCategory(coupleId: string, data: CreateBudgetCategoryData, tx: any = null): Promise<BudgetCategoryData> {
    try {
      const client = tx || prisma
      const category = await client.budgetCategory.create({
        data: {
          coupleId,
          name: data.name,
          icon: data.icon || '💰',
          color: data.color || '#667eea',
          allocatedAmount: data.allocatedAmount,
          spentAmount: 0,
          priority: data.priority || 'medium',
          industryAveragePercentage: data.industryAveragePercentage || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return this.transformCategory(category)
    } catch (error) {
      console.error('Error creating budget category:', error)
      throw new Error('Failed to create budget category')
    }
  }

  /**
   * Update budget category with transaction support
   */
  async updateCategory(categoryId: string, data: UpdateBudgetCategoryData, tx: any = null): Promise<BudgetCategoryData> {
    try {
      const client = tx || prisma
      const category = await client.budgetCategory.update({
        where: { id: categoryId },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })

      return this.transformCategory(category)
    } catch (error) {
      console.error('Error updating budget category:', error)
      throw new Error('Failed to update budget category')
    }
  }

  /**
   * Delete budget category with transaction support
   */
  async deleteCategory(categoryId: string, tx: any = null): Promise<void> {
    try {
      const client = tx || prisma
      await client.budgetCategory.delete({
        where: { id: categoryId }
      })
    } catch (error) {
      console.error('Error deleting budget category:', error)
      throw new Error('Failed to delete budget category')
    }
  }

  /**
   * Get all expenses for a couple
   */
  async getExpenses(coupleId: string): Promise<BudgetExpenseWithCategory[]> {
    try {
      const expenses = await prisma.budgetExpense.findMany({
        where: { coupleId },
        include: {
          budgetCategory: {
            select: {
              name: true,
              icon: true,
              color: true
            }
          }
        },
        orderBy: { dueDate: 'desc' }
      })

      return expenses.map(exp => this.transformExpenseWithCategory(exp))
    } catch (error) {
      console.error('Error getting budget expenses:', error)
      throw new Error('Failed to get budget expenses')
    }
  }

  /**
   * Create new budget expense with transaction support
   */
  async createExpense(coupleId: string, data: CreateBudgetExpenseData, tx: any = null): Promise<BudgetExpenseWithCategory> {
    try {
      const client = tx || prisma
      const expense = await client.budgetExpense.create({
        data: {
          coupleId,
          categoryId: data.categoryId,
          description: data.description,
          amount: data.amount,
          dueDate: data.dueDate,
          paymentStatus: data.paymentStatus || 'pending',
          vendorId: data.vendorId,
          expenseType: data.expenseType || 'expense',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          budgetCategory: {
            select: {
              name: true,
              icon: true,
              color: true
            }
          }
        }
      })

      // Update category spent amount
      await this.updateCategorySpentAmount(data.categoryId, client)

      return this.transformExpenseWithCategory(expense)
    } catch (error) {
      console.error('Error creating budget expense:', error)
      throw new Error('Failed to create budget expense')
    }
  }

  /**
   * Update budget expense with transaction support
   */
  async updateExpense(expenseId: string, data: UpdateBudgetExpenseData, tx: any = null): Promise<BudgetExpenseWithCategory> {
    try {
      const client = tx || prisma
      const oldExpense = await client.budgetExpense.findUnique({
        where: { id: expenseId },
        select: { categoryId: true }
      })

      const expense = await client.budgetExpense.update({
        where: { id: expenseId },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          budgetCategory: {
            select: {
              name: true,
              icon: true,
              color: true
            }
          }
        }
      })

      // Update spent amounts for affected categories
      if (oldExpense) {
        await this.updateCategorySpentAmount(oldExpense.categoryId, client)
      }
      if (data.categoryId && data.categoryId !== oldExpense?.categoryId) {
        await this.updateCategorySpentAmount(data.categoryId, client)
      }

      return this.transformExpenseWithCategory(expense)
    } catch (error) {
      console.error('Error updating budget expense:', error)
      throw new Error('Failed to update budget expense')
    }
  }

  /**
   * Delete budget expense with transaction support
   */
  async deleteExpense(expenseId: string, tx: any = null): Promise<void> {
    try {
      const client = tx || prisma
      const expense = await client.budgetExpense.findUnique({
        where: { id: expenseId },
        select: { categoryId: true }
      })

      await client.budgetExpense.delete({
        where: { id: expenseId }
      })

      // Update category spent amount
      if (expense) {
        await this.updateCategorySpentAmount(expense.categoryId, client)
      }
    } catch (error) {
      console.error('Error deleting budget expense:', error)
      throw new Error('Failed to delete budget expense')
    }
  }

  /**
   * Update total budget for couple
   */
  async updateTotalBudget(coupleId: string, totalBudget: number): Promise<void> {
    try {
      await prisma.couple.update({
        where: { id: coupleId },
        data: { totalBudget }
      })
    } catch (error) {
      console.error('Error updating total budget:', error)
      throw new Error('Failed to update total budget')
    }
  }

  /**
   * Search budget categories and expenses (Admin functionality)
   */
  async search(params: any): Promise<{ data: any[], pagination: any }> {
    try {
      const {
        search,
        coupleId,
        categoryName,
        page = 1,
        pageSize = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params

      const where: any = {}
      
      if (coupleId) where.coupleId = coupleId
      if (categoryName) where.budgetCategory = { name: { contains: categoryName, mode: 'insensitive' } }

      if (search) {
        where.OR = [
          { description: { contains: search, mode: 'insensitive' } },
          { budgetCategory: { name: { contains: search, mode: 'insensitive' } } }
        ]
      }

      const total = await prisma.budgetExpense.count({ where })
      const totalPages = Math.ceil(total / pageSize)
      const skip = (page - 1) * pageSize

      const expenses = await prisma.budgetExpense.findMany({
        where,
        include: {
          budgetCategory: {
            select: {
              name: true,
              icon: true,
              color: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder } as const,
        skip,
        take: pageSize
      })

      return {
        data: expenses.map(expense => this.transformExpenseWithCategory(expense)),
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('Error searching budget data:', error)
      throw new Error('Failed to search budget data')
    }
  }

  /**
   * Get budget analytics for a couple
   */
  async getBudgetAnalytics(coupleId: string): Promise<any> {
    try {
      const summary = await this.getBudgetSummary(coupleId)
      
      // Get monthly spending trend (last 12 months)
      const monthlySpending = await prisma.budgetExpense.groupBy({
        by: ['createdAt'],
        where: {
          coupleId,
          paymentStatus: { in: ['paid', 'completed'] },
          createdAt: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
          }
        },
        _sum: { amount: true }
      })

      // Get category spending distribution
      const categorySpending = await prisma.budgetExpense.groupBy({
        by: ['categoryId'],
        where: {
          coupleId,
          paymentStatus: { in: ['paid', 'completed'] }
        },
        _sum: { amount: true }
      })

      return {
        summary,
        monthlySpending: this.groupByMonth(monthlySpending),
        categorySpending: await this.enrichCategorySpending(categorySpending),
        trends: {
          averageMonthlySpend: summary.totalSpent / 12,
          projectedTotal: this.calculateProjectedTotal(summary),
          savingsOpportunities: this.identifySavingsOpportunities(summary)
        }
      }
    } catch (error) {
      console.error('Error getting budget analytics:', error)
      throw new Error('Failed to get budget analytics')
    }
  }

  /**
   * Reallocate budget between categories
   */
  async reallocateBudget(coupleId: string, reallocations: Array<{ categoryId: string, newAmount: number }>, tx: any = null): Promise<BudgetCategoryData[]> {
    try {
      const client = tx || prisma
      const updatedCategories = []

      for (const reallocation of reallocations) {
        const category = await client.budgetCategory.update({
          where: { 
            id: reallocation.categoryId,
            coupleId // Ensure couple owns this category
          },
          data: {
            allocatedAmount: reallocation.newAmount,
            updatedAt: new Date()
          }
        })
        updatedCategories.push(this.transformCategory(category))
      }

      return updatedCategories
    } catch (error) {
      console.error('Error reallocating budget:', error)
      throw new Error('Failed to reallocate budget')
    }
  }

  /**
   * Get budget statistics for couple
   */
  async getStatsByCouple(coupleId: string): Promise<any> {
    try {
      const summary = await this.getBudgetSummary(coupleId)
      
      return {
        totalCategories: summary.categories.length,
        totalExpenses: summary.recentExpenses.length,
        totalBudget: summary.totalBudget,
        totalAllocated: summary.totalAllocated,
        totalSpent: summary.totalSpent,
        totalRemaining: summary.totalRemaining,
        spentPercentage: summary.spentPercentage,
        averageCategorySpend: summary.categories.length > 0 ? 
          summary.totalSpent / summary.categories.length : 0,
        categoriesOverBudget: summary.categories.filter(cat => 
          cat.spentAmount > cat.allocatedAmount).length
      }
    } catch (error) {
      console.error('Error getting budget stats by couple:', error)
      throw new Error('Failed to get budget statistics')
    }
  }

  /**
   * Update category spent amount based on expenses with transaction support
   */
  private async updateCategorySpentAmount(categoryId: string, tx: any = null): Promise<void> {
    try {
      const client = tx || prisma
      const result = await client.budgetExpense.aggregate({
        where: { 
          categoryId,
          paymentStatus: { in: ['paid', 'completed'] }
        },
        _sum: { amount: true }
      })

      const spentAmount = Number(result._sum.amount || 0)

      await client.budgetCategory.update({
        where: { id: categoryId },
        data: { spentAmount }
      })
    } catch (error) {
      console.error('Error updating category spent amount:', error)
      // Don't throw here to avoid breaking the main operation
    }
  }

  /**
   * Helper methods for analytics
   */
  private groupByMonth(monthlyData: any[]): any[] {
    // Group expenses by month for trend analysis
    const monthMap = new Map()
    monthlyData.forEach(item => {
      const month = new Date(item.createdAt).toISOString().slice(0, 7) // YYYY-MM
      const current = monthMap.get(month) || 0
      monthMap.set(month, current + Number(item._sum.amount || 0))
    })
    
    return Array.from(monthMap.entries()).map(([month, amount]) => ({
      month,
      amount
    }))
  }

  private async enrichCategorySpending(categoryData: any[]): Promise<any[]> {
    return Promise.all(categoryData.map(async (item) => {
      const category = await prisma.budgetCategory.findUnique({
        where: { id: item.categoryId },
        select: { name: true, icon: true, color: true }
      })
      
      return {
        categoryId: item.categoryId,
        categoryName: category?.name || 'Unknown',
        categoryIcon: category?.icon || '💰',
        categoryColor: category?.color || '#667eea',
        totalSpent: Number(item._sum.amount || 0)
      }
    }))
  }

  private calculateProjectedTotal(summary: BudgetSummary): number {
    // Simple projection based on current spending rate
    const currentDate = new Date()
    const weddingDate = new Date(currentDate.getTime() + 365 * 24 * 60 * 60 * 1000) // Assume 1 year planning
    const monthsRemaining = Math.max(1, (weddingDate.getTime() - currentDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
    const averageMonthlySpend = summary.totalSpent / Math.max(1, 12 - monthsRemaining)
    
    return summary.totalSpent + (averageMonthlySpend * monthsRemaining)
  }

  private identifySavingsOpportunities(summary: BudgetSummary): any[] {
    return summary.categories
      .filter(cat => cat.spentAmount > cat.allocatedAmount * 0.8) // Categories at 80%+ of budget
      .map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        currentSpend: cat.spentAmount,
        budget: cat.allocatedAmount,
        potentialSavings: cat.spentAmount - cat.allocatedAmount * 0.7, // Could save 30%
        recommendation: `Consider reviewing ${cat.name} expenses for cost optimization`
      }))
  }

  /**
   * Transform category to API format
   */
  private transformCategory(category: any): BudgetCategoryData {
    return {
      id: category.id,
      name: category.name,
      icon: category.icon || '💰',
      color: category.color || '#667eea',
      allocatedAmount: Number(category.allocatedAmount || 0),
      spentAmount: Number(category.spentAmount || 0),
      priority: category.priority || 'medium',
      industryAveragePercentage: Number(category.industryAveragePercentage || 0)
    }
  }

  /**
   * Transform category with expenses to API format
   */
  private transformCategoryWithExpenses(category: any, totalBudget: number): BudgetCategoryWithExpenses {
    const allocatedAmount = Number(category.allocatedAmount || 0)
    const spentAmount = Number(category.spentAmount || 0)
    
    return {
      id: category.id,
      name: category.name,
      icon: category.icon || '💰',
      color: category.color || '#667eea',
      allocatedAmount,
      spentAmount,
      priority: category.priority || 'medium',
      industryAveragePercentage: Number(category.industryAveragePercentage || 0),
      percentageOfTotal: totalBudget > 0 ? Math.round((allocatedAmount / totalBudget) * 100) : 0,
      expenses: (category.budgetExpenses || []).map((exp: any) => ({
        id: exp.id,
        description: exp.description,
        amount: Number(exp.amount),
        dueDate: exp.dueDate?.toISOString() || null,
        paymentStatus: exp.paymentStatus || 'pending'
      }))
    }
  }

  /**
   * Transform expense with category to API format
   */
  private transformExpenseWithCategory(expense: any): BudgetExpenseWithCategory {
    return {
      id: expense.id,
      description: expense.description,
      amount: Number(expense.amount),
      dueDate: expense.dueDate?.toISOString() || null,
      paymentStatus: expense.paymentStatus || 'pending',
      category: expense.budgetCategory ? {
        name: expense.budgetCategory.name,
        icon: expense.budgetCategory.icon || '💰',
        color: expense.budgetCategory.color || '#667eea'
      } : null
    }
  }

  /**
   * Find category by ID
   */
  async findCategoryById(categoryId: string): Promise<BudgetCategoryData | null> {
    try {
      const category = await prisma.budgetCategory.findUnique({
        where: { id: categoryId }
      })
      
      return category ? this.transformCategory(category) : null
    } catch (error) {
      console.error('Error finding category by ID:', error)
      throw new Error('Failed to find category')
    }
  }

  /**
   * Find category by couple ID and name
   */
  async findCategoryByCoupleAndName(coupleId: string, name: string): Promise<BudgetCategoryData | null> {
    try {
      const category = await prisma.budgetCategory.findFirst({
        where: { 
          coupleId,
          name: {
            equals: name,
            mode: 'insensitive'
          }
        }
      })
      
      return category ? this.transformCategory(category) : null
    } catch (error) {
      console.error('Error finding category by name:', error)
      throw new Error('Failed to find category')
    }
  }

  /**
   * Find expense by ID
   */
  async findExpenseById(expenseId: string): Promise<BudgetExpenseData | null> {
    try {
      const expense = await prisma.budgetExpense.findUnique({
        where: { id: expenseId }
      })
      
      return expense ? this.transformExpense(expense) : null
    } catch (error) {
      console.error('Error finding expense by ID:', error)
      throw new Error('Failed to find expense')
    }
  }

  /**
   * Update category totals
   */
  async updateCategoryTotals(categoryId: string, tx: any = null): Promise<void> {
    try {
      const client = tx || prisma
      
      // Calculate total spent from expenses
      const expenses = await client.budgetExpense.findMany({
        where: { 
          categoryId,
          paymentStatus: 'paid'
        }
      })
      
      const spentAmount = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0)
      
      await client.budgetCategory.update({
        where: { id: categoryId },
        data: { 
          spentAmount,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error updating category totals:', error)
      throw new Error('Failed to update category totals')
    }
  }

  /**
   * Get expense count by category
   */
  async getExpenseCountByCategory(categoryId: string): Promise<number> {
    try {
      return await prisma.budgetExpense.count({
        where: { categoryId }
      })
    } catch (error) {
      console.error('Error getting expense count:', error)
      throw new Error('Failed to get expense count')
    }
  }

  /**
   * Get budget analytics by couple
   */
  async getBudgetAnalyticsByCouple(coupleId: string): Promise<any> {
    try {
      const couple = await prisma.couple.findUnique({
        where: { id: coupleId },
        select: { totalBudget: true }
      })

      if (!couple) {
        throw new Error('Couple not found')
      }

      const categories = await prisma.budgetCategory.findMany({
        where: { coupleId },
        include: {
          budgetExpenses: true
        }
      })

      const totalBudget = Number(couple.totalBudget || 0)
      const totalSpent = categories.reduce((sum, cat) => sum + Number(cat.spentAmount || 0), 0)
      const totalAllocated = categories.reduce((sum, cat) => sum + Number(cat.allocatedAmount || 0), 0)

      // Calculate spending by month
      const expenses = await prisma.budgetExpense.findMany({
        where: { coupleId },
        orderBy: { createdAt: 'asc' as const }
      })

      const spendingByMonth = expenses.reduce((acc: any, exp: any) => {
        const month = new Date(exp.createdAt).toISOString().substring(0, 7)
        if (!acc[month]) acc[month] = 0
        acc[month] += Number(exp.amount)
        return acc
      }, {})

      // Calculate category breakdown
      const categoryBreakdown = categories.map(cat => ({
        name: cat.name,
        allocated: Number(cat.allocatedAmount || 0),
        spent: Number(cat.spentAmount || 0),
        percentage: totalAllocated > 0 ? (Number(cat.allocatedAmount || 0) / totalAllocated) * 100 : 0
      }))

      return {
        overview: {
          totalBudget,
          totalAllocated,
          totalSpent,
          totalRemaining: totalBudget - totalSpent,
          spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
          allocatedPercentage: totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0
        },
        spendingByMonth,
        categoryBreakdown,
        topExpenses: expenses
          .sort((a: any, b: any) => Number(b.amount) - Number(a.amount))
          .slice(0, 5)
          .map((exp: any) => ({
            description: exp.description,
            amount: Number(exp.amount),
            date: exp.createdAt
          }))
      }
    } catch (error) {
      console.error('Error getting budget analytics:', error)
      throw new Error('Failed to get budget analytics')
    }
  }

  /**
   * Search categories
   */
  async searchCategories(params: any): Promise<any> {
    try {
      const {
        search,
        coupleId,
        priority,
        page = 1,
        pageSize = 20,
        sortBy = 'name',
        sortOrder = 'asc'
      } = params

      const where: any = {}
      
      if (coupleId) where.coupleId = coupleId
      if (priority) where.priority = priority

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } }
        ]
      }

      const total = await prisma.budgetCategory.count({ where })
      const totalPages = Math.ceil(total / pageSize)
      const skip = (page - 1) * pageSize

      const categories = await prisma.budgetCategory.findMany({
        where,
        orderBy: { [sortBy]: sortOrder } as const,
        skip,
        take: pageSize
      })

      return {
        data: categories.map((cat: any) => this.transformCategory(cat)),
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasMore: page < totalPages
        }
      }
    } catch (error) {
      console.error('Error searching categories:', error)
      throw new Error('Failed to search categories')
    }
  }
}