/**
 * Budget Service - Use-case orchestration with transaction boundaries
 */

import { withTransaction } from '@/core/db/transaction'
import { BudgetRepository } from '@/lib/repositories/BudgetRepository'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'
import { VendorRepository } from '@/lib/repositories/VendorRepository'
import { hasPermission } from '@/core/auth/permissions'
import { 
  CreateBudgetCategoryRequest,
  UpdateBudgetCategoryRequest,
  CreateBudgetExpenseRequest,
  UpdateBudgetExpenseRequest,
  BudgetCategorySearchRequest,
  BudgetExpenseSearchRequest,
  BulkCreateCategoriesRequest,
  BulkCreateExpensesRequest,
  PaymentUpdateRequest,
  BudgetReallocationRequest,
  ImportExpensesRequest
} from '../dto'
import { 
  BudgetCategoryResponse,
  BudgetExpenseResponse,
  BudgetSummaryResponse,
  BudgetAnalyticsResponse,
  BudgetCategoriesPaginatedResponse,
  BudgetExpensesPaginatedResponse
} from '../dto'
import { ApiError } from '@/shared/validation/errors'
import { generateId } from '@/shared/utils/id'
import { getCurrentUser } from '@/core/auth/user'

export class BudgetService {
  private budgetRepo = new BudgetRepository()
  private coupleRepo = new CoupleRepository()
  private vendorRepo = new VendorRepository()

  /**
   * Create a new budget category
   * Use Case: User sets up budget categories for wedding planning
   */
  async createBudgetCategory(request: CreateBudgetCategoryRequest): Promise<BudgetCategoryResponse> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Get user's couple profile
      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple) {
        throw new ApiError('Couple profile not found. Please complete onboarding first.', 404)
      }

      // Check for duplicate category by name
      const existingCategory = await this.budgetRepo.findCategoryByCoupleAndName(
        couple.id, 
        request.name
      )
      if (existingCategory) {
        throw new ApiError('Budget category with this name already exists', 409)
      }

      // Validate vendor association if provided
      if (request.vendorId) {
        const vendor = await this.vendorRepo.findById(request.vendorId)
        if (!vendor || vendor.coupleId !== couple.id) {
          throw new ApiError('Vendor not found or access denied', 404)
        }
      }

      // Create category data
      const categoryData = {
        ...request,
        id: generateId(),
        coupleId: couple.id,
        actualSpent: 0,
        remainingAmount: request.plannedAmount,
        percentageUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Save to database
      const category = await this.budgetRepo.createCategory(categoryData, tx)
      
      return this.mapCategoryToResponse(category)
    })
  }

  /**
   * Bulk create budget categories
   * Use Case: Initial budget setup with predefined categories
   */
  async bulkCreateCategories(request: BulkCreateCategoriesRequest): Promise<BudgetCategoryResponse[]> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple) {
        throw new ApiError('Couple profile not found', 404)
      }

      const createdCategories: any[] = []

      for (const categoryRequest of request.categories) {
        const plannedAmount = request.autoCalculateAmounts 
          ? (request.totalBudget * categoryRequest.allocation) / 100
          : categoryRequest.customCategory?.plannedAmount || 0

        const categoryData = {
          ...(categoryRequest.customCategory || {}),
          id: generateId(),
          coupleId: couple.id,
          plannedAmount,
          currency: request.currency,
          actualSpent: 0,
          remainingAmount: plannedAmount,
          percentageUsed: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const category = await this.budgetRepo.createCategory(categoryData, tx)
        createdCategories.push(category)
      }

      return createdCategories.map(category => this.mapCategoryToResponse(category))
    })
  }

  /**
   * Create a new budget expense
   * Use Case: User records an expense for their wedding
   */
  async createBudgetExpense(request: CreateBudgetExpenseRequest): Promise<BudgetExpenseResponse> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple) {
        throw new ApiError('Couple profile not found', 404)
      }

      // Validate category ownership
      const category = await this.budgetRepo.findCategoryById(request.categoryId)
      if (!category || category.coupleId !== couple.id) {
        throw new ApiError('Budget category not found or access denied', 404)
      }

      // Validate vendor if provided
      if (request.vendorId) {
        const vendor = await this.vendorRepo.findById(request.vendorId)
        if (!vendor || vendor.coupleId !== couple.id) {
          throw new ApiError('Vendor not found or access denied', 404)
        }
      }

      // Check if category allows overspend
      const newCategoryTotal = category.actualSpent + request.amount
      if (!category.allowOverspend && newCategoryTotal > category.plannedAmount) {
        throw new ApiError(
          `This expense would exceed the category budget by ${newCategoryTotal - category.plannedAmount}. ` +
          'Enable "Allow Overspend" for this category to proceed.',
          422
        )
      }

      // Create expense data
      const expenseData = {
        ...request,
        id: generateId(),
        coupleId: couple.id,
        remainingAmount: request.amount - request.paidAmount,
        isOverdue: false, // Will be calculated
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Save expense and update category totals
      const expense = await this.budgetRepo.createExpense(expenseData, tx)
      await this.budgetRepo.updateCategoryTotals(request.categoryId, tx)
      
      return this.mapExpenseToResponse(expense, category.name)
    })
  }

  /**
   * Update budget category
   * Use Case: Adjust budget allocation, change priorities, etc.
   */
  async updateBudgetCategory(categoryId: string, request: UpdateBudgetCategoryRequest): Promise<BudgetCategoryResponse> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Verify ownership
      const existingCategory = await this.budgetRepo.findCategoryById(categoryId)
      if (!existingCategory) {
        throw new ApiError('Budget category not found', 404)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple || (existingCategory.coupleId !== couple.id && !hasPermission(user, 'budget:write_all'))) {
        throw new ApiError('Forbidden', 403)
      }

      // Check for name conflicts if name is being updated
      if (request.name && request.name !== existingCategory.name) {
        const conflictCategory = await this.budgetRepo.findCategoryByCoupleAndName(
          existingCategory.coupleId,
          request.name
        )
        
        if (conflictCategory && conflictCategory.id !== categoryId) {
          throw new ApiError('Budget category with this name already exists', 409)
        }
      }

      // Update data with recalculation if planned amount changed
      const updateData = {
        ...request,
        updatedAt: new Date()
      }

      if (request.plannedAmount && request.plannedAmount !== existingCategory.plannedAmount) {
        updateData.remainingAmount = request.plannedAmount - existingCategory.actualSpent
        updateData.percentageUsed = existingCategory.actualSpent > 0 
          ? (existingCategory.actualSpent / request.plannedAmount) * 100 
          : 0
      }

      const updatedCategory = await this.budgetRepo.updateCategory(categoryId, updateData, tx)
      return this.mapCategoryToResponse(updatedCategory)
    })
  }

  /**
   * Update budget expense
   * Use Case: Edit expense details, record payments, etc.
   */
  async updateBudgetExpense(expenseId: string, request: UpdateBudgetExpenseRequest): Promise<BudgetExpenseResponse> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Verify ownership
      const existingExpense = await this.budgetRepo.findExpenseById(expenseId)
      if (!existingExpense) {
        throw new ApiError('Budget expense not found', 404)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple || (existingExpense.coupleId !== couple.id && !hasPermission(user, 'budget:write_all'))) {
        throw new ApiError('Forbidden', 403)
      }

      // If category is being changed, validate new category
      if (request.categoryId && request.categoryId !== existingExpense.categoryId) {
        const newCategory = await this.budgetRepo.findCategoryById(request.categoryId)
        if (!newCategory || newCategory.coupleId !== couple.id) {
          throw new ApiError('New budget category not found or access denied', 404)
        }
      }

      // Auto-update payment status if paid amount changes
      const updateData = { ...request, updatedAt: new Date() }
      
      if (request.paidAmount !== undefined) {
        const newPaidAmount = request.paidAmount
        const amount = request.amount || existingExpense.amount
        
        updateData.remainingAmount = amount - newPaidAmount
        
        if (newPaidAmount === 0) {
          updateData.paymentStatus = 'pending'
        } else if (newPaidAmount >= amount) {
          updateData.paymentStatus = 'paid'
          updateData.paidDate = updateData.paidDate || new Date().toISOString()
        } else {
          updateData.paymentStatus = 'partial'
        }
      }

      const updatedExpense = await this.budgetRepo.updateExpense(expenseId, updateData, tx)
      
      // Update category totals if amount or category changed
      if (request.amount || request.categoryId) {
        await this.budgetRepo.updateCategoryTotals(existingExpense.categoryId, tx)
        if (request.categoryId && request.categoryId !== existingExpense.categoryId) {
          await this.budgetRepo.updateCategoryTotals(request.categoryId, tx)
        }
      }

      const category = await this.budgetRepo.findCategoryById(updatedExpense.categoryId)
      return this.mapExpenseToResponse(updatedExpense, category?.name || '')
    })
  }

  /**
   * Record payment for expense
   * Use Case: Mark expense as paid with payment details
   */
  async recordPayment(expenseId: string, request: PaymentUpdateRequest): Promise<BudgetExpenseResponse> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const expense = await this.budgetRepo.findExpenseById(expenseId)
      if (!expense) {
        throw new ApiError('Budget expense not found', 404)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple || expense.coupleId !== couple.id) {
        throw new ApiError('Forbidden', 403)
      }

      const newPaidAmount = (expense.paidAmount || 0) + request.paidAmount
      const remainingAmount = expense.amount - newPaidAmount

      // Determine payment status
      let paymentStatus = expense.paymentStatus
      if (request.markAsPaid && remainingAmount <= 0) {
        paymentStatus = 'paid'
      } else if (newPaidAmount > 0 && remainingAmount > 0) {
        paymentStatus = 'partial'
      }

      const updateData = {
        paidAmount: newPaidAmount,
        remainingAmount,
        paymentStatus,
        paymentMethod: request.paymentMethod,
        paidDate: request.paymentDate,
        transactionId: request.transactionId,
        confirmationNumber: request.confirmationNumber,
        receiptUrl: request.receiptUrl,
        notes: request.notes || expense.notes,
        updatedAt: new Date()
      }

      const updatedExpense = await this.budgetRepo.updateExpense(expenseId, updateData, tx)
      await this.budgetRepo.updateCategoryTotals(expense.categoryId, tx)

      const category = await this.budgetRepo.findCategoryById(expense.categoryId)
      return this.mapExpenseToResponse(updatedExpense, category?.name || '')
    })
  }

  /**
   * Get budget summary
   * Use Case: Dashboard overview of budget status
   */
  async getBudgetSummary(): Promise<BudgetSummaryResponse> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple) {
      throw new ApiError('Couple profile not found', 404)
    }

    return await this.budgetRepo.getBudgetSummaryByCouple(couple.id)
  }

  /**
   * Get budget analytics
   * Use Case: Advanced budget insights and projections
   */
  async getBudgetAnalytics(): Promise<BudgetAnalyticsResponse> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple) {
      throw new ApiError('Couple profile not found', 404)
    }

    return await this.budgetRepo.getBudgetAnalyticsByCouple(couple.id)
  }

  /**
   * Get budget categories for couple
   * Use Case: Load categories list on budget page
   */
  async getBudgetCategories(searchRequest?: Partial<BudgetCategorySearchRequest>): Promise<BudgetCategoriesPaginatedResponse> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple) {
      throw new ApiError('Couple profile not found', 404)
    }

    const searchParams = {
      ...searchRequest,
      coupleId: couple.id
    }

    const result = await this.budgetRepo.searchCategories(searchParams)
    
    return {
      data: result.data.map(category => this.mapCategoryToResponse(category)),
      pagination: result.pagination
    }
  }

  /**
   * Get budget expenses for couple
   * Use Case: Load expenses list on budget page
   */
  async getBudgetExpenses(searchRequest?: Partial<BudgetExpenseSearchRequest>): Promise<BudgetExpensesPaginatedResponse> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple) {
      throw new ApiError('Couple profile not found', 404)
    }

    const searchParams = {
      ...searchRequest,
      coupleId: couple.id
    }

    const result = await this.budgetRepo.searchExpenses(searchParams)
    
    return {
      data: result.data.map(expense => this.mapExpenseToResponse(expense, expense.categoryName)),
      pagination: result.pagination
    }
  }

  /**
   * Reallocate budget across categories
   * Use Case: Adjust budget allocation based on actual needs
   */
  async reallocateBudget(request: BudgetReallocationRequest): Promise<BudgetCategoryResponse[]> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple) {
        throw new ApiError('Couple profile not found', 404)
      }

      const updatedCategories: any[] = []

      // Validate all categories belong to the couple
      for (const reallocation of request.reallocations) {
        const category = await this.budgetRepo.findCategoryById(reallocation.categoryId)
        if (!category || category.coupleId !== couple.id) {
          throw new ApiError(`Category ${reallocation.categoryId} not found or access denied`, 404)
        }

        // Update category with new planned amount
        const updateData = {
          plannedAmount: reallocation.newPlannedAmount,
          remainingAmount: reallocation.newPlannedAmount - category.actualSpent,
          percentageUsed: category.actualSpent > 0 
            ? (category.actualSpent / reallocation.newPlannedAmount) * 100 
            : 0,
          updatedAt: new Date()
        }

        const updatedCategory = await this.budgetRepo.updateCategory(reallocation.categoryId, updateData, tx)
        updatedCategories.push(updatedCategory)
      }

      return updatedCategories.map(category => this.mapCategoryToResponse(category))
    })
  }

  /**
   * Delete budget category
   * Use Case: Remove unused budget category
   */
  async deleteBudgetCategory(categoryId: string): Promise<void> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const category = await this.budgetRepo.findCategoryById(categoryId)
      if (!category) {
        throw new ApiError('Budget category not found', 404)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple || category.coupleId !== couple.id) {
        throw new ApiError('Forbidden', 403)
      }

      // Check if category has expenses
      const expenseCount = await this.budgetRepo.getExpenseCountByCategory(categoryId)
      if (expenseCount > 0) {
        throw new ApiError(
          'Cannot delete category with existing expenses. Please move or delete expenses first.',
          422
        )
      }

      await this.budgetRepo.deleteCategory(categoryId, tx)
    })
  }

  /**
   * Delete budget expense
   * Use Case: Remove incorrect or duplicate expense
   */
  async deleteBudgetExpense(expenseId: string): Promise<void> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const expense = await this.budgetRepo.findExpenseById(expenseId)
      if (!expense) {
        throw new ApiError('Budget expense not found', 404)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple || expense.coupleId !== couple.id) {
        throw new ApiError('Forbidden', 403)
      }

      await this.budgetRepo.deleteExpense(expenseId, tx)
      await this.budgetRepo.updateCategoryTotals(expense.categoryId, tx)
    })
  }

  /**
   * Map category entity to API response
   */
  private mapCategoryToResponse(category: any): BudgetCategoryResponse {
    const bufferAmount = (category.plannedAmount * category.bufferPercentage) / 100
    const isOverBudget = category.actualSpent > category.plannedAmount

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      plannedAmount: category.plannedAmount,
      actualSpent: category.actualSpent,
      remainingAmount: category.remainingAmount,
      percentageUsed: category.percentageUsed,
      currency: category.currency,
      categoryType: category.categoryType,
      priority: category.priority,
      isEssential: category.isEssential,
      isOverBudget,
      needsByDate: category.needsByDate?.toISOString(),
      finalPaymentDate: category.finalPaymentDate?.toISOString(),
      vendorId: category.vendorId,
      vendorName: category.vendorName,
      bufferPercentage: category.bufferPercentage,
      bufferAmount,
      isFlexible: category.isFlexible,
      trackPayments: category.trackPayments,
      allowOverspend: category.allowOverspend,
      expenseCount: category.expenseCount || 0,
      paidExpenseCount: category.paidExpenseCount || 0,
      pendingPayments: category.pendingPayments || 0,
      notes: category.notes,
      tags: category.tags || [],
      externalId: category.externalId,
      coupleId: category.coupleId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    }
  }

  /**
   * Map expense entity to API response
   */
  private mapExpenseToResponse(expense: any, categoryName: string): BudgetExpenseResponse {
    const totalAmount = expense.amount + (expense.taxAmount || 0) + (expense.tipAmount || 0) + (expense.serviceCharges || 0)
    const isOverdue = expense.dueDate && new Date(expense.dueDate) < new Date() && expense.paymentStatus !== 'paid'

    return {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      paidAmount: expense.paidAmount || 0,
      remainingAmount: expense.remainingAmount,
      currency: expense.currency,
      categoryId: expense.categoryId,
      categoryName,
      vendorId: expense.vendorId,
      vendorName: expense.vendorName,
      paymentStatus: expense.paymentStatus,
      expenseDate: expense.expenseDate.toISOString(),
      dueDate: expense.dueDate?.toISOString(),
      paidDate: expense.paidDate?.toISOString(),
      paymentMethod: expense.paymentMethod,
      transactionId: expense.transactionId,
      confirmationNumber: expense.confirmationNumber,
      receiptUrl: expense.receiptUrl,
      invoiceNumber: expense.invoiceNumber,
      isPlanned: expense.isPlanned,
      isRecurring: expense.isRecurring,
      isOverdue: !!isOverdue,
      requiresApproval: expense.requiresApproval,
      isApproved: !!expense.approvedDate,
      taxAmount: expense.taxAmount,
      tipAmount: expense.tipAmount,
      serviceCharges: expense.serviceCharges,
      totalAmount,
      approvedBy: expense.approvedBy,
      approvedDate: expense.approvedDate?.toISOString(),
      recurringFrequency: expense.recurringFrequency,
      recurringEndDate: expense.recurringEndDate?.toISOString(),
      nextRecurringDate: expense.nextRecurringDate?.toISOString(),
      notes: expense.notes,
      tags: expense.tags || [],
      priority: expense.priority,
      importedFrom: expense.importedFrom,
      externalId: expense.externalId,
      coupleId: expense.coupleId,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString()
    }
  }
}