/**
 * Budget API Handler - Enterprise API pattern with validation and error handling
 */

import { NextRequest } from 'next/server'
import { BudgetService } from '../service'
import { 
  CreateBudgetCategoryRequestSchema,
  UpdateBudgetCategoryRequestSchema,
  CreateBudgetExpenseRequestSchema,
  UpdateBudgetExpenseRequestSchema,
  BudgetCategorySearchRequestSchema,
  BudgetExpenseSearchRequestSchema,
  BulkCreateCategoriesRequestSchema,
  PaymentUpdateRequestSchema,
  BudgetReallocationRequestSchema
} from '../dto'
import { validateRequest, createApiResponse, handleApiError } from '@/shared/validation/middleware'

export class BudgetApiHandler {
  private budgetService = new BudgetService()

  /**
   * POST /api/budget/categories - Create budget category
   */
  async createBudgetCategory(request: NextRequest) {
    try {
      const body = await request.json()
      const validatedData = await validateRequest(CreateBudgetCategoryRequestSchema, body)
      
      const category = await this.budgetService.createBudgetCategory(validatedData)
      
      return createApiResponse({
        data: category,
        message: 'Budget category created successfully',
        status: 201
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * POST /api/budget/categories/bulk - Bulk create budget categories
   */
  async bulkCreateCategories(request: NextRequest) {
    try {
      const body = await request.json()
      const validatedData = await validateRequest(BulkCreateCategoriesRequestSchema, body)
      
      const categories = await this.budgetService.bulkCreateCategories(validatedData)
      
      return createApiResponse({
        data: categories,
        message: `${categories.length} budget categories created successfully`,
        status: 201
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/budget/categories - Get budget categories
   */
  async getBudgetCategories(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const queryData = {
        search: searchParams.get('search') || undefined,
        categoryType: searchParams.get('categoryType') || undefined,
        priority: searchParams.get('priority') || undefined,
        isEssential: searchParams.get('isEssential') ? searchParams.get('isEssential') === 'true' : undefined,
        isOverBudget: searchParams.get('isOverBudget') ? searchParams.get('isOverBudget') === 'true' : undefined,
        minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
        maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
        needsByDateFrom: searchParams.get('needsByDateFrom') || undefined,
        needsByDateTo: searchParams.get('needsByDateTo') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || '20'),
        sortBy: searchParams.get('sortBy') || 'name',
        sortOrder: searchParams.get('sortOrder') || 'asc'
      }
      
      const filteredQuery = Object.fromEntries(
        Object.entries(queryData).filter(([_, v]) => v !== undefined)
      )
      
      const result = await this.budgetService.getBudgetCategories(filteredQuery)
      
      return createApiResponse({
        data: result.data,
        meta: {
          pagination: result.pagination
        },
        message: 'Budget categories retrieved successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * PATCH /api/budget/categories/:id - Update budget category
   */
  async updateBudgetCategory(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      const body = await request.json()
      const validatedData = await validateRequest(UpdateBudgetCategoryRequestSchema, body)
      
      const category = await this.budgetService.updateBudgetCategory(id, validatedData)
      
      return createApiResponse({
        data: category,
        message: 'Budget category updated successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * DELETE /api/budget/categories/:id - Delete budget category
   */
  async deleteBudgetCategory(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      
      await this.budgetService.deleteBudgetCategory(id)
      
      return createApiResponse({
        message: 'Budget category deleted successfully',
        status: 204
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * POST /api/budget/expenses - Create budget expense
   */
  async createBudgetExpense(request: NextRequest) {
    try {
      const body = await request.json()
      const validatedData = await validateRequest(CreateBudgetExpenseRequestSchema, body)
      
      const expense = await this.budgetService.createBudgetExpense(validatedData)
      
      return createApiResponse({
        data: expense,
        message: 'Budget expense created successfully',
        status: 201
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/budget/expenses - Get budget expenses
   */
  async getBudgetExpenses(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const queryData = {
        search: searchParams.get('search') || undefined,
        categoryId: searchParams.get('categoryId') || undefined,
        vendorId: searchParams.get('vendorId') || undefined,
        paymentStatus: searchParams.get('paymentStatus') || undefined,
        paymentMethod: searchParams.get('paymentMethod') || undefined,
        isPlanned: searchParams.get('isPlanned') ? searchParams.get('isPlanned') === 'true' : undefined,
        isRecurring: searchParams.get('isRecurring') ? searchParams.get('isRecurring') === 'true' : undefined,
        isOverdue: searchParams.get('isOverdue') ? searchParams.get('isOverdue') === 'true' : undefined,
        requiresApproval: searchParams.get('requiresApproval') ? searchParams.get('requiresApproval') === 'true' : undefined,
        minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
        maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
        expenseDateFrom: searchParams.get('expenseDateFrom') || undefined,
        expenseDateTo: searchParams.get('expenseDateTo') || undefined,
        dueDateFrom: searchParams.get('dueDateFrom') || undefined,
        dueDateTo: searchParams.get('dueDateTo') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || '20'),
        sortBy: searchParams.get('sortBy') || 'expenseDate',
        sortOrder: searchParams.get('sortOrder') || 'desc'
      }
      
      const filteredQuery = Object.fromEntries(
        Object.entries(queryData).filter(([_, v]) => v !== undefined)
      )
      
      const result = await this.budgetService.getBudgetExpenses(filteredQuery)
      
      return createApiResponse({
        data: result.data,
        meta: {
          pagination: result.pagination
        },
        message: 'Budget expenses retrieved successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * PATCH /api/budget/expenses/:id - Update budget expense
   */
  async updateBudgetExpense(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      const body = await request.json()
      const validatedData = await validateRequest(UpdateBudgetExpenseRequestSchema, body)
      
      const expense = await this.budgetService.updateBudgetExpense(id, validatedData)
      
      return createApiResponse({
        data: expense,
        message: 'Budget expense updated successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * DELETE /api/budget/expenses/:id - Delete budget expense
   */
  async deleteBudgetExpense(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      
      await this.budgetService.deleteBudgetExpense(id)
      
      return createApiResponse({
        message: 'Budget expense deleted successfully',
        status: 204
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * POST /api/budget/expenses/:id/payment - Record payment for expense
   */
  async recordPayment(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      const body = await request.json()
      const validatedData = await validateRequest(PaymentUpdateRequestSchema, body)
      
      const expense = await this.budgetService.recordPayment(id, validatedData)
      
      return createApiResponse({
        data: expense,
        message: 'Payment recorded successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/budget/summary - Get budget summary
   */
  async getBudgetSummary(request: NextRequest) {
    try {
      const summary = await this.budgetService.getBudgetSummary()
      
      return createApiResponse({
        data: summary,
        message: 'Budget summary retrieved successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/budget/analytics - Get budget analytics
   */
  async getBudgetAnalytics(request: NextRequest) {
    try {
      const analytics = await this.budgetService.getBudgetAnalytics()
      
      return createApiResponse({
        data: analytics,
        message: 'Budget analytics retrieved successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * POST /api/budget/reallocate - Reallocate budget across categories
   */
  async reallocateBudget(request: NextRequest) {
    try {
      const body = await request.json()
      const validatedData = await validateRequest(BudgetReallocationRequestSchema, body)
      
      const categories = await this.budgetService.reallocateBudget(validatedData)
      
      return createApiResponse({
        data: categories,
        message: 'Budget reallocated successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }
}