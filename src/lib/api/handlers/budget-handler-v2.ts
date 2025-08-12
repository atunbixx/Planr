import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BaseApiHandler } from '../base-handler'
import { budgetService } from '@/lib/services/budget.service'

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
  allocatedAmount: z.number().min(0).default(0),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
})

const updateCategorySchema = createCategorySchema.partial()

const createExpenseSchema = z.object({
  categoryId: z.string().uuid(),
  vendorId: z.string().uuid().optional(),
  description: z.string().min(1),
  amount: z.number().min(0),
  expenseType: z.enum(['one_time', 'recurring', 'deposit']).default('one_time'),
  paymentStatus: z.enum(['pending', 'paid', 'overdue']).default('pending'),
  paymentMethod: z.string().optional(),
  dueDate: z.string().optional(),
  paidDate: z.string().optional(),
  notes: z.string().optional()
})

const updateExpenseSchema = createExpenseSchema.partial()

export class BudgetHandlerV2 extends BaseApiHandler {
  
  // Category methods
  async listCategories(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      const categories = await budgetService.getCategoriesForCouple(coupleId)
      
      // Transform using BudgetCategory model
      return categories.map(cat => this.transformCategory(cat))
    })
  }
  
  async createCategory(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, createCategorySchema)
      
      // Transform to database format
      const dbData = this.transformToDb(data, 'BudgetCategory')
      
      const category = await budgetService.createCategory(coupleId, dbData)
      return this.transformCategory(category)
    })
  }
  
  async updateCategory(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updateCategorySchema)
      
      // Transform to database format
      const dbData = this.transformToDb(data, 'BudgetCategory')
      
      const category = await budgetService.updateCategory(id, coupleId, dbData)
      return this.transformCategory(category)
    })
  }
  
  async deleteCategory(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      await budgetService.deleteCategory(id, coupleId)
      return { success: true }
    })
  }
  
  // Expense methods
  async listExpenses(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Parse query parameters
      const url = new URL(request.url)
      const categoryId = url.searchParams.get('categoryId')
      const vendorId = url.searchParams.get('vendorId')
      const status = url.searchParams.get('status')
      
      const expenses = await budgetService.getExpensesForCouple(coupleId, {
        categoryId,
        vendorId,
        status
      })
      
      // Transform using BudgetExpense model
      return expenses.map(exp => this.transformExpense(exp))
    })
  }
  
  async createExpense(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, createExpenseSchema)
      
      // Transform to database format
      const dbData = this.transformToDb({
        ...data,
        coupleId
      }, 'BudgetExpense')
      
      const expense = await budgetService.createExpense(coupleId, dbData)
      return this.transformExpense(expense)
    })
  }
  
  async updateExpense(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updateExpenseSchema)
      
      // Transform to database format
      const dbData = this.transformToDb(data, 'BudgetExpense')
      
      const expense = await budgetService.updateExpense(id, coupleId, dbData)
      return this.transformExpense(expense)
    })
  }
  
  async deleteExpense(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      await budgetService.deleteExpense(id, coupleId)
      return { success: true }
    })
  }
  
  // Get budget summary
  async getBudgetSummary(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      const [categories, expenses, couple] = await Promise.all([
        budgetService.getCategoriesForCouple(coupleId),
        budgetService.getExpensesForCouple(coupleId),
        budgetService.getCoupleById(coupleId)
      ])
      
      const totalBudget = couple?.totalBudget || 0
      const totalAllocated = categories.reduce((sum, cat) => sum + (cat.allocatedAmount || 0), 0)
      const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      
      return {
        totalBudget,
        totalAllocated,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        categories: categories.map(cat => ({
          ...this.transformCategory(cat),
          spent: expenses
            .filter(exp => exp.categoryId === cat.id)
            .reduce((sum, exp) => sum + (exp.amount || 0), 0)
        }))
      }
    })
  }
  
  // Helper methods
  private transformCategory(category: any) {
    return toApiFormat(category, 'BudgetCategory')
  }
  
  private transformExpense(expense: any) {
    return toApiFormat(expense, 'BudgetExpense')
  }
  
  private transformToDb(data: any, model: 'BudgetCategory' | 'BudgetExpense') {
    return toDbFormat(data, model)
  }
}

// Import transformation functions
import { toApiFormat, toDbFormat } from '@/lib/db/transformations'