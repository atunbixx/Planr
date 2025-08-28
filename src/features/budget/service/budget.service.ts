import { RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'
import { BudgetRepository, type BudgetRecord } from '@/features/budget/repo/budget.repository'

/**
 * Budget service for managing wedding budget items and calculations
 */
export class BudgetService {
  private repo: BudgetRepository

  constructor() {
    this.repo = new BudgetRepository()
  }

  /**
   * Get budget summary with server-calculated totals
   */
  async getBudgetSummary(userId: string): Promise<RepositoryResult<BudgetSummary>> {
    try {
      const listRes = await this.repo.list(userId)
      if (!listRes.success) return createErrorResult('Failed to get budget summary', 'BUDGET_SUMMARY_FAILED', listRes.error?.statusCode || 500)
      const items = listRes.data?.items || []
      const totalBudget = items.reduce((sum, i) => sum + Number(i.allocated ?? i.amount ?? 0), 0)
      const totalSpent = items.reduce((sum, i) => sum + Number(i.actual ?? 0), 0)
      const totalRemaining = totalBudget - totalSpent
      const categoryBreakdown = this.calculateCategoryBreakdown(items.map(i => ({
        category: i.category,
        budgetedAmount: Number(i.allocated ?? i.amount ?? 0),
        actualAmount: Number(i.actual ?? 0)
      })) as any)

      // Calculate completion percentage
      const completionPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

      // Identify over-budget categories
      const overBudgetCategories = categoryBreakdown.filter(cat => cat.actualAmount > cat.budgetedAmount)

      const summary: BudgetSummary = {
        totalBudget,
        totalSpent,
        totalRemaining,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        itemCount: items.length,
        categoryBreakdown,
        overBudgetCategories: overBudgetCategories.map(cat => cat.category),
        lastUpdated: new Date(),
        currency: 'NGN'
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
      const listRes = await this.repo.list(userId)
      if (!listRes.success) return createErrorResult('Failed to get budget items', 'BUDGET_ITEMS_FAILED', listRes.error?.statusCode || 500)
      let items: BudgetItem[] = (listRes.data?.items || []).map((i) => this.mapRecordToItem(i))

      // Apply filters in-memory based on service fields
      if (filters?.category) items = items.filter(i => i.category === filters.category)
      if (filters?.status) items = items.filter(i => i.status === filters.status)
      if (filters?.minAmount !== undefined) items = items.filter(i => i.budgetedAmount >= filters.minAmount!)
      if (filters?.maxAmount !== undefined) items = items.filter(i => i.budgetedAmount <= filters.maxAmount!)

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
        return createErrorResult(validationResult.error?.message || 'Invalid budget item data', 'VALIDATION_ERROR', validationResult.error?.statusCode || 400) as any
      }
      const createRes = await this.repo.create(userId, {
        category: data.category,
        amount: data.budgetedAmount,
        allocated: data.budgetedAmount,
        actual: data.actualAmount ?? 0,
        status: data.isPaid ? 'paid' : 'planned'
      })
      if (!createRes.success || !createRes.data) return createErrorResult('Failed to create budget item', 'BUDGET_ITEM_CREATE_FAILED', createRes.error?.statusCode || 500)
      const item = this.mapRecordToItem(createRes.data)

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
        return createErrorResult(validationResult.error?.message || 'Invalid budget item data', 'VALIDATION_ERROR', validationResult.error?.statusCode || 400) as any
      }
      const updateRes = await this.repo.update(userId, itemId, {
        category: data.category as any,
        amount: data.budgetedAmount as any,
        allocated: data.budgetedAmount as any,
        actual: data.actualAmount as any,
        status: data.isPaid ? 'paid' : undefined
      })
      if (!updateRes.success) return createErrorResult('Failed to update budget item', 'BUDGET_ITEM_UPDATE_FAILED', updateRes.error?.statusCode || 500)
      if (!updateRes.data) return createErrorResult('Budget item not found', 'BUDGET_ITEM_NOT_FOUND', 404)
      const item = this.mapRecordToItem(updateRes.data)

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
      const delRes = await this.repo.delete(userId, itemId)
      if (!delRes.success) return createErrorResult('Failed to delete budget item', 'BUDGET_ITEM_DELETE_FAILED', delRes.error?.statusCode || 500)
      if (!delRes.data) return createErrorResult('Budget item not found', 'BUDGET_ITEM_NOT_FOUND', 404)
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
      const listRes = await this.repo.list(userId)
      if (!listRes.success) return createErrorResult('Failed to get budget categories', 'BUDGET_CATEGORIES_FAILED', listRes.error?.statusCode || 500)
      const items = listRes.data?.items || []
      const breakdown = this.calculateCategoryBreakdown(items.map(i => ({
        category: i.category,
        budgetedAmount: Number((i as any).allocated ?? i.amount ?? 0),
        actualAmount: Number(i.actual ?? 0)
      })) as any)
      return createSuccessResult(breakdown)
    } catch (error) {
      console.error('Error getting budget categories:', error)
      return createErrorResult('Failed to get budget categories', 'BUDGET_CATEGORIES_FAILED', 500)
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

  private mapRecordToItem(rec: BudgetRecord): BudgetItem {
    const budgeted = Number((rec as any).allocated ?? rec.amount ?? 0)
    const actual = Number(rec.actual ?? 0)
    return {
      id: rec.id,
      userId: rec.userId,
      category: rec.category,
      name: (rec as any).name || rec.category,
      description: undefined,
      budgetedAmount: budgeted,
      actualAmount: actual,
      currency: 'NGN',
      priority: 'MEDIUM',
      status: this.calculateItemStatus(budgeted, actual),
      vendorId: undefined,
      dueDate: undefined,
      isPaid: rec.status === 'paid',
      paymentDate: undefined,
      notes: undefined,
      createdAt: new Date(rec.createdAt),
      updatedAt: new Date(rec.updatedAt)
    }
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
      // no-op since we use repository which manages prisma internally
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
