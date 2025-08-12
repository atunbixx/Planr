import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/lib/db/services/couple.service'
import { FIELD_MAPPINGS } from '@/lib/db/field-mappings'
import { validateModelFields } from '@/lib/api/validation/field-validator'

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1),
  allocatedAmount: z.number().min(0),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  percentageOfTotal: z.number().optional(),
  industryAveragePercentage: z.number().optional(),
  marketTrends: z.any().optional(),
  vendorInsights: z.any().optional()
})

const updateCategorySchema = createCategorySchema.partial()

const createExpenseSchema = z.object({
  categoryId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  description: z.string().min(1),
  amount: z.number().min(0),
  expenseType: z.enum(['deposit', 'payment', 'final_payment', 'other']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  paymentMethod: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  paidDate: z.string().datetime().optional(),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional()
})

const updateExpenseSchema = createExpenseSchema.partial()

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

export class BudgetCategoriesHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PATCH':
          return await this.handlePatch(request, context)
        case 'DELETE':
          return await this.handleDelete(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)

    // Get couple using the service to check all user ID fields
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get existing categories
    const categories = await prisma.budgetCategory.findMany({
      where: { [FIELD_MAPPINGS.budgetCategory.coupleId]: couple.id },
      orderBy: { [FIELD_MAPPINGS.budgetCategory.createdAt]: 'asc' },
      include: {
        expenses: {
          select: {
            [FIELD_MAPPINGS.budgetExpense.amount]: true
          }
        }
      }
    })

    // Calculate spent amounts
    const categoriesWithSpent = categories.map(category => {
      const spentAmount = category.expenses.reduce((sum, expense) => 
        sum + Number(expense.amount), 0
      )
      
      return {
        ...category,
        spentAmount,
        expenses: undefined // Remove expenses from response
      }
    })

    return this.successResponse({ categories: categoriesWithSpent })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Handle default categories initialization
    if (body.initializeDefaults && couple.totalBudget) {
      const totalBudget = Number(couple.totalBudget)
      
      const defaultCategories = await Promise.all(
        DEFAULT_CATEGORIES.map(category => 
          prisma.budgetCategory.create({
            data: {
              [FIELD_MAPPINGS.budgetCategory.coupleId]: couple.id,
              [FIELD_MAPPINGS.budgetCategory.name]: category.name,
              [FIELD_MAPPINGS.budgetCategory.allocatedAmount]: totalBudget * category.allocatedAmount,
              [FIELD_MAPPINGS.budgetCategory.priority]: category.priority,
              [FIELD_MAPPINGS.budgetCategory.color]: category.color,
              [FIELD_MAPPINGS.budgetCategory.icon]: category.icon
            }
          })
        )
      )

      return this.successResponse({ categories: defaultCategories }, { action: 'initialized' })
    }

    // Validate single category
    const validatedData = createCategorySchema.parse(body)
    
    // Validate fields match database schema
    validateModelFields('budgetCategory', validatedData, true)

    // Create category
    const category = await prisma.budgetCategory.create({
      data: {
        [FIELD_MAPPINGS.budgetCategory.coupleId]: couple.id,
        ...validatedData
      }
    })

    return this.successResponse(category, { action: 'created' })
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const categoryId = context?.params?.id

    if (!categoryId) {
      return this.errorResponse('INVALID_REQUEST', 'Category ID required', 400)
    }

    const validatedData = updateCategorySchema.parse(await this.parseBody(request))
    
    // Validate fields match database schema
    validateModelFields('budgetCategory', validatedData, true)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Verify ownership
    const category = await prisma.budgetCategory.findFirst({
      where: {
        [FIELD_MAPPINGS.budgetCategory.id]: categoryId,
        [FIELD_MAPPINGS.budgetCategory.coupleId]: couple.id
      }
    })

    if (!category) {
      return this.errorResponse('NOT_FOUND', 'Category not found', 404)
    }

    // Update category
    const updatedCategory = await prisma.budgetCategory.update({
      where: { [FIELD_MAPPINGS.budgetCategory.id]: categoryId },
      data: validatedData
    })

    return this.successResponse(updatedCategory, { action: 'updated' })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const categoryId = context?.params?.id

    if (!categoryId) {
      return this.errorResponse('INVALID_REQUEST', 'Category ID required', 400)
    }

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Verify ownership and delete
    const deleted = await prisma.budgetCategory.deleteMany({
      where: {
        [FIELD_MAPPINGS.budgetCategory.id]: categoryId,
        [FIELD_MAPPINGS.budgetCategory.coupleId]: couple.id
      }
    })

    if (deleted.count === 0) {
      return this.errorResponse('NOT_FOUND', 'Category not found', 404)
    }

    return this.successResponse({ id: categoryId }, { action: 'deleted' })
  }
}

export class BudgetExpensesHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PATCH':
          return await this.handlePatch(request, context)
        case 'DELETE':
          return await this.handleDelete(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const searchParams = this.getSearchParams(request)
    const { page, pageSize, skip } = this.getPagination(searchParams)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Parse filters
    const categoryId = searchParams.get('categoryId') || undefined
    const paymentStatus = searchParams.get('paymentStatus') || undefined
    const vendorId = searchParams.get('vendorId') || undefined

    // Build where clause
    const where: any = {
      [FIELD_MAPPINGS.budgetExpense.coupleId]: couple.id
    }

    if (categoryId) where[FIELD_MAPPINGS.budgetExpense.categoryId] = categoryId
    if (paymentStatus) where[FIELD_MAPPINGS.budgetExpense.paymentStatus] = paymentStatus
    if (vendorId) where[FIELD_MAPPINGS.budgetExpense.vendorId] = vendorId

    // Get expenses with pagination
    const [expenses, total] = await Promise.all([
      prisma.budgetExpense.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [FIELD_MAPPINGS.budgetExpense.createdAt]: 'desc' },
        include: {
          category: true,
          vendor: true
        }
      }),
      prisma.budgetExpense.count({ where })
    ])

    // Calculate totals
    const totals = await prisma.budgetExpense.aggregate({
      where,
      _sum: {
        [FIELD_MAPPINGS.budgetExpense.amount]: true
      }
    })

    return this.successResponse({
      expenses,
      totals: {
        total: totals._sum.amount?.toNumber() || 0
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = createExpenseSchema.parse(body)
    
    // Validate fields match database schema
    validateModelFields('budgetExpense', validatedData, true)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Parse dates
    const expenseData: any = {
      [FIELD_MAPPINGS.budgetExpense.coupleId]: couple.id,
      ...validatedData
    }

    if (validatedData.dueDate) {
      expenseData[FIELD_MAPPINGS.budgetExpense.dueDate] = new Date(validatedData.dueDate)
    }
    if (validatedData.paidDate) {
      expenseData[FIELD_MAPPINGS.budgetExpense.paidDate] = new Date(validatedData.paidDate)
    }

    // Create expense
    const expense = await prisma.budgetExpense.create({
      data: expenseData,
      include: {
        category: true,
        vendor: true
      }
    })

    // Update category spent amount if applicable
    if (expense.categoryId) {
      const categoryExpenses = await prisma.budgetExpense.aggregate({
        where: {
          [FIELD_MAPPINGS.budgetExpense.categoryId]: expense.categoryId,
          [FIELD_MAPPINGS.budgetExpense.coupleId]: couple.id
        },
        _sum: {
          [FIELD_MAPPINGS.budgetExpense.amount]: true
        }
      })

      await prisma.budgetCategory.update({
        where: { [FIELD_MAPPINGS.budgetCategory.id]: expense.categoryId },
        data: {
          [FIELD_MAPPINGS.budgetCategory.spentAmount]: categoryExpenses._sum.amount || 0
        }
      })
    }

    return this.successResponse(expense, { action: 'created' })
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const expenseId = context?.params?.id

    if (!expenseId) {
      return this.errorResponse('INVALID_REQUEST', 'Expense ID required', 400)
    }

    const validatedData = updateExpenseSchema.parse(await this.parseBody(request))
    
    // Validate fields match database schema
    validateModelFields('budgetExpense', validatedData, true)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Verify ownership
    const expense = await prisma.budgetExpense.findFirst({
      where: {
        [FIELD_MAPPINGS.budgetExpense.id]: expenseId,
        [FIELD_MAPPINGS.budgetExpense.coupleId]: couple.id
      }
    })

    if (!expense) {
      return this.errorResponse('NOT_FOUND', 'Expense not found', 404)
    }

    // Parse dates
    const updateData: any = { ...validatedData }
    if (validatedData.dueDate !== undefined) {
      updateData[FIELD_MAPPINGS.budgetExpense.dueDate] = validatedData.dueDate ? new Date(validatedData.dueDate) : null
    }
    if (validatedData.paidDate !== undefined) {
      updateData[FIELD_MAPPINGS.budgetExpense.paidDate] = validatedData.paidDate ? new Date(validatedData.paidDate) : null
    }

    // Update expense
    const updatedExpense = await prisma.budgetExpense.update({
      where: { [FIELD_MAPPINGS.budgetExpense.id]: expenseId },
      data: updateData,
      include: {
        category: true,
        vendor: true
      }
    })

    // Update category spent amounts if category changed
    const categoriesToUpdate = new Set<string>()
    if (expense.categoryId) categoriesToUpdate.add(expense.categoryId)
    if (updatedExpense.categoryId) categoriesToUpdate.add(updatedExpense.categoryId)

    for (const categoryId of categoriesToUpdate) {
      const categoryExpenses = await prisma.budgetExpense.aggregate({
        where: {
          [FIELD_MAPPINGS.budgetExpense.categoryId]: categoryId,
          [FIELD_MAPPINGS.budgetExpense.coupleId]: couple.id
        },
        _sum: {
          [FIELD_MAPPINGS.budgetExpense.amount]: true
        }
      })

      await prisma.budgetCategory.update({
        where: { [FIELD_MAPPINGS.budgetCategory.id]: categoryId },
        data: {
          [FIELD_MAPPINGS.budgetCategory.spentAmount]: categoryExpenses._sum.amount || 0
        }
      })
    }

    return this.successResponse(updatedExpense, { action: 'updated' })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const expenseId = context?.params?.id

    if (!expenseId) {
      return this.errorResponse('INVALID_REQUEST', 'Expense ID required', 400)
    }

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get expense before deletion to update category
    const expense = await prisma.budgetExpense.findFirst({
      where: {
        [FIELD_MAPPINGS.budgetExpense.id]: expenseId,
        [FIELD_MAPPINGS.budgetExpense.coupleId]: couple.id
      }
    })

    if (!expense) {
      return this.errorResponse('NOT_FOUND', 'Expense not found', 404)
    }

    // Delete expense
    await prisma.budgetExpense.delete({
      where: { [FIELD_MAPPINGS.budgetExpense.id]: expenseId }
    })

    // Update category spent amount if applicable
    if (expense.categoryId) {
      const categoryExpenses = await prisma.budgetExpense.aggregate({
        where: {
          [FIELD_MAPPINGS.budgetExpense.categoryId]: expense.categoryId,
          [FIELD_MAPPINGS.budgetExpense.coupleId]: couple.id
        },
        _sum: {
          [FIELD_MAPPINGS.budgetExpense.amount]: true
        }
      })

      await prisma.budgetCategory.update({
        where: { [FIELD_MAPPINGS.budgetCategory.id]: expense.categoryId },
        data: {
          [FIELD_MAPPINGS.budgetCategory.spentAmount]: categoryExpenses._sum.amount || 0
        }
      })
    }

    return this.successResponse({ id: expenseId }, { action: 'deleted' })
  }
}