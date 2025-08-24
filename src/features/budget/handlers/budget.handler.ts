import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { BudgetService, CreateBudgetItemData, UpdateBudgetItemData } from '../service/budget.service'
import { createErrorResponse, createSuccessResponse, createUnauthorizedResponse, createNotFoundResponse } from '@/lib/api/response'

/**
 * Budget API Handler
 * Handles budget operations with server-side total calculations
 */
export class BudgetHandler {
  private budgetService: BudgetService
  private prisma: PrismaClient

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient()
    this.budgetService = new BudgetService(this.prisma)
  }

  /**
   * Get budget summary with server-calculated totals
   * GET /api/budget/summary
   */
  async getBudgetSummary(request: NextRequest): Promise<NextResponse> {
    try {
      // TODO: Add authentication middleware
      const userId = await this.extractUserId(request)
      if (!userId) {
        return createUnauthorizedResponse('Authentication required')
      }

      const result = await this.budgetService.getBudgetSummary(userId)

      if (!result.success) {
        return createErrorResponse(
          result.error?.message || 'Failed to get budget summary',
          result.error?.statusCode || 500,
          result.error?.code || 'BUDGET_SUMMARY_FAILED'
        )
      }

      // Set cache headers for dashboard performance
      const response = createSuccessResponse(result.data)
      response.headers.set('Cache-Control', 'private, max-age=60') // Cache for 1 minute
      
      return response
    } catch (error) {
      console.error('Error in getBudgetSummary handler:', error)
      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Get budget items with filtering
   * GET /api/budget/items?category=venue&status=over_budget
   */
  async getBudgetItems(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      if (!userId) {
        return createUnauthorizedResponse('Authentication required')
      }

      // Parse query parameters
      const { searchParams } = new URL(request.url)
      const filters = {
        category: searchParams.get('category') || undefined,
        status: searchParams.get('status') as any || undefined,
        minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
        maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
        priority: searchParams.get('priority') as any || undefined
      }

      const result = await this.budgetService.getBudgetItems(userId, filters)

      if (!result.success) {
        return createErrorResponse(
          result.error?.message || 'Failed to get budget items',
          result.error?.statusCode || 500,
          result.error?.code || 'BUDGET_ITEMS_FAILED'
        )
      }

      return createSuccessResponse(result.data)
    } catch (error) {
      console.error('Error in getBudgetItems handler:', error)
      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Create a new budget item
   * POST /api/budget/items
   */
  async createBudgetItem(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      if (!userId) {
        return createUnauthorizedResponse('Authentication required')
      }

      // Parse request body
      const body = await request.json()

      // Validate input using Zod schema
      const createBudgetItemSchema = z.object({
        category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
        name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
        description: z.string().max(500, 'Description too long').optional(),
        budgetedAmount: z.number().min(0, 'Budgeted amount must be positive'),
        actualAmount: z.number().min(0, 'Actual amount must be positive').optional(),
        currency: z.string().length(3, 'Currency must be 3 characters').optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
        vendorId: z.string().uuid('Invalid vendor ID').optional(),
        dueDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
        isPaid: z.boolean().optional(),
        paymentDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
        notes: z.string().max(1000, 'Notes too long').optional()
      })

      const validationResult = createBudgetItemSchema.safeParse(body)
      if (!validationResult.success) {
        return createErrorResponse(
          'Invalid budget item data',
          400,
          'VALIDATION_ERROR',
          validationResult.error.errors
        )
      }

      const budgetItemData = validationResult.data as CreateBudgetItemData

      const result = await this.budgetService.createBudgetItem(userId, budgetItemData)

      if (!result.success) {
        return createErrorResponse(
          result.error?.message || 'Failed to create budget item',
          result.error?.statusCode || 500,
          result.error?.code || 'BUDGET_ITEM_CREATE_FAILED'
        )
      }

      console.log('Budget item created via API', {
        userId,
        itemId: result.data?.id,
        category: result.data?.category,
        budgetedAmount: result.data?.budgetedAmount,
        operation: 'api_budget_item_created'
      })

      return createSuccessResponse(result.data, 201)
    } catch (error) {
      console.error('Error in createBudgetItem handler:', error)
      
      if (error instanceof SyntaxError) {
        return createErrorResponse(
          'Invalid JSON in request body',
          400,
          'INVALID_JSON'
        )
      }

      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Update a budget item
   * PUT /api/budget/items/[id]
   */
  async updateBudgetItem(request: NextRequest, itemId: string): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      if (!userId) {
        return createUnauthorizedResponse('Authentication required')
      }

      // Validate item ID
      if (!itemId || typeof itemId !== 'string') {
        return createErrorResponse(
          'Invalid item ID',
          400,
          'INVALID_ITEM_ID'
        )
      }

      // Parse request body
      const body = await request.json()

      // Validate input using Zod schema
      const updateBudgetItemSchema = z.object({
        category: z.string().min(1).max(50).optional(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        budgetedAmount: z.number().min(0).optional(),
        actualAmount: z.number().min(0).optional(),
        currency: z.string().length(3).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
        vendorId: z.string().uuid().optional(),
        dueDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
        isPaid: z.boolean().optional(),
        paymentDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
        notes: z.string().max(1000).optional()
      })

      const validationResult = updateBudgetItemSchema.safeParse(body)
      if (!validationResult.success) {
        return createErrorResponse(
          'Invalid budget item data',
          400,
          'VALIDATION_ERROR',
          validationResult.error.errors
        )
      }

      const updateData = validationResult.data as UpdateBudgetItemData

      const result = await this.budgetService.updateBudgetItem(userId, itemId, updateData)

      if (!result.success) {
        if (result.error?.code === 'BUDGET_ITEM_NOT_FOUND') {
          return createNotFoundResponse('Budget item')
        }

        return createErrorResponse(
          result.error?.message || 'Failed to update budget item',
          result.error?.statusCode || 500,
          result.error?.code || 'BUDGET_ITEM_UPDATE_FAILED'
        )
      }

      console.log('Budget item updated via API', {
        userId,
        itemId,
        category: result.data?.category,
        operation: 'api_budget_item_updated'
      })

      return createSuccessResponse(result.data)
    } catch (error) {
      console.error('Error in updateBudgetItem handler:', error)
      
      if (error instanceof SyntaxError) {
        return createErrorResponse(
          'Invalid JSON in request body',
          400,
          'INVALID_JSON'
        )
      }

      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Delete a budget item
   * DELETE /api/budget/items/[id]
   */
  async deleteBudgetItem(request: NextRequest, itemId: string): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      if (!userId) {
        return createUnauthorizedResponse('Authentication required')
      }

      // Validate item ID
      if (!itemId || typeof itemId !== 'string') {
        return createErrorResponse(
          'Invalid item ID',
          400,
          'INVALID_ITEM_ID'
        )
      }

      const result = await this.budgetService.deleteBudgetItem(userId, itemId)

      if (!result.success) {
        if (result.error?.code === 'BUDGET_ITEM_NOT_FOUND') {
          return createNotFoundResponse('Budget item')
        }

        return createErrorResponse(
          result.error?.message || 'Failed to delete budget item',
          result.error?.statusCode || 500,
          result.error?.code || 'BUDGET_ITEM_DELETE_FAILED'
        )
      }

      console.log('Budget item deleted via API', {
        userId,
        itemId,
        operation: 'api_budget_item_deleted'
      })

      return createSuccessResponse({ deleted: true })
    } catch (error) {
      console.error('Error in deleteBudgetItem handler:', error)
      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Get budget categories with totals
   * GET /api/budget/categories
   */
  async getBudgetCategories(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.extractUserId(request)
      if (!userId) {
        return createUnauthorizedResponse('Authentication required')
      }

      const result = await this.budgetService.getBudgetCategories(userId)

      if (!result.success) {
        return createErrorResponse(
          result.error?.message || 'Failed to get budget categories',
          result.error?.statusCode || 500,
          result.error?.code || 'BUDGET_CATEGORIES_FAILED'
        )
      }

      return createSuccessResponse(result.data)
    } catch (error) {
      console.error('Error in getBudgetCategories handler:', error)
      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Health check for budget service
   * GET /api/budget/health
   */
  async healthCheck(request: NextRequest): Promise<NextResponse> {
    try {
      // Basic health check - verify database connection
      await this.prisma.$queryRaw`SELECT 1`
      
      return createSuccessResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'budget-api'
      })
    } catch (error) {
      console.error('Budget API health check failed:', error)
      return createErrorResponse(
        'Service unhealthy',
        503,
        'SERVICE_UNHEALTHY'
      )
    }
  }

  /**
   * Extract user ID from request (placeholder for authentication)
   */
  private async extractUserId(request: NextRequest): Promise<string | null> {
    // TODO: Implement proper authentication
    // For now, extract from header or return test user
    const authHeader = request.headers.get('authorization')
    const userIdHeader = request.headers.get('x-user-id')
    
    if (userIdHeader) {
      return userIdHeader
    }

    if (authHeader?.startsWith('Bearer ')) {
      // TODO: Validate JWT token and extract user ID
      return 'test-user-123'
    }

    return null
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.budgetService.cleanup()
    } catch (error) {
      console.error('Error during budget handler cleanup:', error)
    }
  }
}