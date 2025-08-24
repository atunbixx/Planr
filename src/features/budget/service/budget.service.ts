import { PrismaClient } from '@prisma/client'
import { RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'

/**
 * Budget service for managing wedding budget items and calculations
 */
export class BudgetService {
  private prisma: PrismaClient

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient()
  }

  /**
   * Get budget summary with server-calculated totals
   */
  async getBudgetSummary(userId: string): Promise<RepositoryResult<BudgetSummary>> {
    try {
      // Get all budget items for the user
      const budgetItems = await this.prisma.budgetItem.findMany({
        where: { userId },
        orderBy: [
          { category: 'asc' },
          { createdAt: 'asc' }
        ]
      })

      // Calculate totals on server-side for accuracy
      const totalBudget = budgetItems.reduce((sum, item) => sum + item.budgetedAmount, 0)
      const totalSpent = budgetItems.reduce((sum, item) => sum + item.actualAmount, 0)
      const totalRemaining = totalBudget - totalSpent

      // Group by category for detailed breakdown
      const categoryBreakdown = this.calculateCategoryBreakdown(budgetItems)

      // Calculate completion percentage
      const completionPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

      // Identify over-budget categories
      const overBudgetCategories = categoryBreakdown.filter(cat => cat.actualAmount > cat.budgetedAmount)

      const summary: BudgetSummary = {
        totalBudget,
        totalSpent,
        totalRemaining,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        itemCount: budgetItems.length,
        categoryBreakdown,
        overBudgetCategories: overBudgetCategories.map(cat => cat.category),
        lastUpdated: new Date(),
        currency: budgetItems[0]?.currency || 'NGN'
      }

      return createSuccessResult(summary)
    } catch (error) {
      console.error('Error getting budget summary:', error)
      return createErrorResult(
        'Failed to get budget summary',
        'BUDGET_SUMMARY_FAILED',
        500
      )
    }
  }

  /**
   * Get all budget items for a user
   */
  async getBudgetItems(userId: string, filters?: BudgetFilters): Promise<RepositoryResult<BudgetItem[]>> {
    try {
      const where: any = { userId }

      // Apply filters
      if (filters?.category) {
        where.category = filters.category
      }

      if (filters?.status) {
        switch (filters.status) {
          case 'over_budget':
            where.actualAmount = { gt: this.prisma.budgetItem.fields.budgetedAmount }
            break
          case 'under_budget':
            where.actualAmount = { lt: this.prisma.budgetItem.fields.budgetedAmount }
            break
          case 'on_budget':
            where.actualAmount = { equals: this.prisma.budgetItem.fields.budgetedAmount }
            break
          case 'not_spent':
            where.actualAmount = 0
            break
        }
      }

      if (filters?.minAmount !== undefined) {
        where.budgetedAmount = { ...where.budgetedAmount, gte: filters.minAmount }
      }

      if (filters?.maxAmount !== undefined) {
        where.budgetedAmount = { ...where.budgetedAmount, lte: filters.maxAmount }
      }

      const budgetItems = await this.prisma.budgetItem.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { budgetedAmount: 'desc' },
          { createdAt: 'asc' }
        ]
      })

      // Transform to service format
      const items: BudgetItem[] = budgetItems.map(item => ({
        id: item.id,
        userId: item.userId,
        category: item.category,
        name: item.name,
        description: item.description,
        budgetedAmount: item.budgetedAmount,
        actualAmount: item.actualAmount,
        currency: item.currency,
        priority: item.priority as BudgetPriority,
        status: this.calculateItemStatus(item.budgetedAmount, item.actualAmount),
        vendorId: item.vendorId,
        dueDate: item.dueDate,
        isPaid: item.isPaid,
        paymentDate: item.paymentDate,
        notes: item.notes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))

      return createSuccessResult(items)
    } catch (error) {
      console.error('Error getting budget items:', error)
      return createErrorResult(
        'Failed to get budget items',
        'BUDGET_ITEMS_FAILED',
        500
      )
    }
  }

  /**
   * Create a new budget item
   */
  async createBudgetItem(userId: string, data: CreateBudgetItemData): Promise<RepositoryResult<BudgetItem>> {
    try {
      // Validate input data
      const validationResult = this.validateBudgetItemData(data)
      if (!validationResult.success) {
        return validationResult
      }

      const budgetItem = await this.prisma.budgetItem.create({
        data: {
          userId,
          category: data.category,
          name: data.name,
          description: data.description,
          budgetedAmount: data.budgetedAmount,
          actualAmount: data.actualAmount || 0,
          currency: data.currency || 'NGN',
          priority: data.priority || 'MEDIUM',
          vendorId: data.vendorId,
          dueDate: data.dueDate,
          isPaid: data.isPaid || false,
          paymentDate: data.paymentDate,
          notes: data.notes
        }
      })

      const item: BudgetItem = {
        id: budgetItem.id,
        userId: budgetItem.userId,
        category: budgetItem.category,
        name: budgetItem.name,
        description: budgetItem.description,
        budgetedAmount: budgetItem.budgetedAmount,
        actualAmount: budgetItem.actualAmount,
        currency: budgetItem.currency,
        priority: budgetItem.priority as BudgetPriority,
        status: this.calculateItemStatus(budgetItem.budgetedAmount, budgetItem.actualAmount),
        vendorId: budgetItem.vendorId,
        dueDate: budgetItem.dueDate,
        isPaid: budgetItem.isPaid,
        paymentDate: budgetItem.paymentDate,
        notes: budgetItem.notes,
        createdAt: budgetItem.createdAt,
        updatedAt: budgetItem.updatedAt
      }

      console.log('Budget item created', {
        userId,
        itemId: item.id,
        category: item.category,
        budgetedAmount: item.budgetedAmount,
        operation: 'budget_item_created'
      })

      return createSuccessResult(item)
    } catch (error) {
      console.error('Error creating budget item:', error)
      return createErrorResult(
        'Failed to create budget item',
        'BUDGET_ITEM_CREATE_FAILED',
        500
      )
    }
  }

  /**
   * Update a budget item
   */
  async updateBudgetItem(userId: string, itemId: string, data: UpdateBudgetItemData): Promise<RepositoryResult<BudgetItem>> {
    try {
      // Validate input data
      const validationResult = this.validateBudgetItemData(data, true)
      if (!validationResult.success) {
        return validationResult
      }

      // Check if item exists and belongs to user
      const existingItem = await this.prisma.budgetItem.findFirst({
        where: { id: itemId, userId }
      })

      if (!existingItem) {
        return createErrorResult(
          'Budget item not found',
          'BUDGET_ITEM_NOT_FOUND',
          404
        )
      }

      const budgetItem = await this.prisma.budgetItem.update({
        where: { id: itemId },
        data: {
          category: data.category,
          name: data.name,
          description: data.description,
          budgetedAmount: data.budgetedAmount,
          actualAmount: data.actualAmount,
          currency: data.currency,
          priority: data.priority,
          vendorId: data.vendorId,
          dueDate: data.dueDate,
          isPaid: data.isPaid,
          paymentDate: data.paymentDate,
          notes: data.notes
        }
      })

      const item: BudgetItem = {
        id: budgetItem.id,
        userId: budgetItem.userId,
        category: budgetItem.category,
        name: budgetItem.name,
        description: budgetItem.description,
        budgetedAmount: budgetItem.budgetedAmount,
        actualAmount: budgetItem.actualAmount,
        currency: budgetItem.currency,
        priority: budgetItem.priority as BudgetPriority,
        status: this.calculateItemStatus(budgetItem.budgetedAmount, budgetItem.actualAmount),
        vendorId: budgetItem.vendorId,
        dueDate: budgetItem.dueDate,
        isPaid: budgetItem.isPaid,
        paymentDate: budgetItem.paymentDate,
        notes: budgetItem.notes,
        createdAt: budgetItem.createdAt,
        updatedAt: budgetItem.updatedAt
      }

      console.log('Budget item updated', {
        userId,
        itemId: item.id,
        category: item.category,
        budgetedAmount: item.budgetedAmount,
        actualAmount: item.actualAmount,
        operation: 'budget_item_updated'
      })

      return createSuccessResult(item)
    } catch (error) {
      console.error('Error updating budget item:', error)
      return createErrorResult(
        'Failed to update budget item',
        'BUDGET_ITEM_UPDATE_FAILED',
        500
      )
    }
  }

  /**
   * Delete a budget item
   */
  async deleteBudgetItem(userId: string, itemId: string): Promise<RepositoryResult<boolean>> {
    try {
      // Check if item exists and belongs to user
      const existingItem = await this.prisma.budgetItem.findFirst({
        where: { id: itemId, userId }
      })

      if (!existingItem) {
        return createErrorResult(
          'Budget item not found',
          'BUDGET_ITEM_NOT_FOUND',
          404
        )
      }

      await this.prisma.budgetItem.delete({
        where: { id: itemId }
      })

      console.log('Budget item deleted', {
        userId,
        itemId,
        category: existingItem.category,
        operation: 'budget_item_deleted'
      })

      return createSuccessResult(true)
    } catch (error) {
      console.error('Error deleting budget item:', error)
      return createErrorResult(
        'Failed to delete budget item',
        'BUDGET_ITEM_DELETE_FAILED',
        500
      )
    }
  }

  /**
   * Get budget categories with totals
   */
  async getBudgetCategories(userId: string): Promise<RepositoryResult<BudgetCategory[]>> {
    try {
      const budgetItems = await this.prisma.budgetItem.findMany({
        where: { userId }
      })

      const categoryBreakdown = this.calculateCategoryBreakdown(budgetItems)

      return createSuccessResult(categoryBreakdown)
    } catch (error) {
      console.error('Error getting budget categories:', error)
      return createErrorResult(
        'Failed to get budget categories',
        'BUDGET_CATEGORIES_FAILED',
        500
      )
    }
  }

  /**
   * Calculate category breakdown
   */
  private calculateCategoryBreakdown(budgetItems: any[]): BudgetCategory[] {
    const categoryMap = new Map<string, BudgetCategory>()

    budgetItems.forEach(item => {
      const existing = categoryMap.get(item.category)
      
      if (existing) {
        existing.budgetedAmount += item.budgetedAmount
        existing.actualAmount += item.actualAmount
        existing.itemCount += 1
      } else {
        categoryMap.set(item.category, {
          category: item.category,
          budgetedAmount: item.budgetedAmount,
          actualAmount: item.actualAmount,
          itemCount: 1,
          remainingAmount: 0, // Will be calculated below
          percentageUsed: 0 // Will be calculated below
        })
      }
    })

    // Calculate derived values
    const categories = Array.from(categoryMap.values()).map(cat => ({
      ...cat,
      remainingAmount: cat.budgetedAmount - cat.actualAmount,
      percentageUsed: cat.budgetedAmount > 0 ? (cat.actualAmount / cat.budgetedAmount) * 100 : 0
    }))

    return categories.sort((a, b) => b.budgetedAmount - a.budgetedAmount)
  }

  /**
   * Calculate item status based on budgeted vs actual amounts
   */
  private calculateItemStatus(budgetedAmount: number, actualAmount: number): BudgetStatus {
    if (actualAmount === 0) return 'not_spent'
    if (actualAmount > budgetedAmount) return 'over_budget'
    if (actualAmount < budgetedAmount) return 'under_budget'
    return 'on_budget'
  }

  /**
   * Validate budget item data
   */
  private validateBudgetItemData(data: any, isUpdate = false): RepositoryResult<boolean> {
    const errors: string[] = []

    if (!isUpdate || data.name !== undefined) {
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Name is required')
      } else if (data.name.length > 100) {
        errors.push('Name must be 100 characters or less')
      }
    }

    if (!isUpdate || data.category !== undefined) {
      if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
        errors.push('Category is required')
      }
    }

    if (!isUpdate || data.budgetedAmount !== undefined) {
      if (typeof data.budgetedAmount !== 'number' || data.budgetedAmount < 0) {
        errors.push('Budgeted amount must be a positive number')
      }
    }

    if (data.actualAmount !== undefined) {
      if (typeof data.actualAmount !== 'number' || data.actualAmount < 0) {
        errors.push('Actual amount must be a positive number')
      }
    }

    if (data.description && data.description.length > 500) {
      errors.push('Description must be 500 characters or less')
    }

    if (data.notes && data.notes.length > 1000) {
      errors.push('Notes must be 1000 characters or less')
    }

    if (errors.length > 0) {
      return createErrorResult(
        errors.join(', '),
        'VALIDATION_ERROR',
        400
      )
    }

    return createSuccessResult(true)
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.prisma.$disconnect()
    } catch (error) {
      console.error('Error during budget service cleanup:', error)
    }
  }
}

// Type definitions
export interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  completionPercentage: number
  itemCount: number
  categoryBreakdown: BudgetCategory[]
  overBudgetCategories: string[]
  lastUpdated: Date
  currency: string
}

export interface BudgetItem {
  id: string
  userId: string
  category: string
  name: string
  description?: string
  budgetedAmount: number
  actualAmount: number
  currency: string
  priority: BudgetPriority
  status: BudgetStatus
  vendorId?: string
  dueDate?: Date
  isPaid: boolean
  paymentDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface BudgetCategory {
  category: string
  budgetedAmount: number
  actualAmount: number
  remainingAmount: number
  percentageUsed: number
  itemCount: number
}

export interface CreateBudgetItemData {
  category: string
  name: string
  description?: string
  budgetedAmount: number
  actualAmount?: number
  currency?: string
  priority?: BudgetPriority
  vendorId?: string
  dueDate?: Date
  isPaid?: boolean
  paymentDate?: Date
  notes?: string
}

export interface UpdateBudgetItemData {
  category?: string
  name?: string
  description?: string
  budgetedAmount?: number
  actualAmount?: number
  currency?: string
  priority?: BudgetPriority
  vendorId?: string
  dueDate?: Date
  isPaid?: boolean
  paymentDate?: Date
  notes?: string
}

export interface BudgetFilters {
  category?: string
  status?: BudgetStatus
  minAmount?: number
  maxAmount?: number
  priority?: BudgetPriority
}

export type BudgetPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type BudgetStatus = 'not_spent' | 'under_budget' | 'on_budget' | 'over_budget'