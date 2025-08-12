import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { vendorService } from '@/lib/services/vendor.service'
import { z } from 'zod'
import { getSupabase } from '@/lib/supabase'
import { CoupleService } from '@/lib/db/services/couple.service'

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  display_order: z.number().int().min(0).optional()
})

const updateCategorySchema = createCategorySchema.partial()

export class VendorCategoriesHandler extends BaseAPIHandler {
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
    // Vendor categories are public data, but we can still check auth for personalization
    let userId: string | null = null
    let couple = null
    
    try {
      const authContext = await this.getAuthContext(request)
      if (authContext?.userId) {
        userId = authContext.userId
        couple = await this.coupleService.getCoupleByUserId(userId)
      }
    } catch (error) {
      // Auth is optional for this endpoint
    }

    // Get all vendor categories
    const categories = await vendorService.getVendorCategories()

    // If authenticated, we could add usage stats
    if (couple) {
      const supabase = getSupabase()
      const { data: vendorCounts } = await supabase
        .from('vendors')
        .select('categoryId')
        .eq('coupleId', couple.id)

      // Add vendor count to each category
      const categoryVendorCounts = vendorCounts?.reduce((acc, vendor) => {
        if (vendor.categoryId) {
          acc[vendor.categoryId] = (acc[vendor.categoryId] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>) || {}

      const categoriesWithCounts = categories.map(category => ({
        ...category,
        vendorCount: categoryVendorCounts[category.id] || 0
      }))

      return this.successResponse({
        categories: categoriesWithCounts,
        authenticated: true
      })
    }

    return this.successResponse({
      categories,
      authenticated: false
    })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    // Only admins can create categories
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Check if user is admin (you might want to implement proper admin check)
    const supabase = getSupabase()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user?.user?.email?.includes('@admin.')) {
      return this.errorResponse('FORBIDDEN', 'Admin access required', 403)
    }

    // Validate data
    const validatedData = createCategorySchema.parse(body)

    // Create category
    const { data: category, error } = await supabase
      .from('vendor_categories')
      .insert(validatedData)
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return this.errorResponse('CREATE_FAILED', 'Failed to create category', 500)
    }

    return this.successResponse(category, { action: 'created' })
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    // Only admins can update categories
    const authContext = await this.requireAuth(request)
    const categoryId = context?.params?.id

    if (!categoryId) {
      return this.errorResponse('INVALID_REQUEST', 'Category ID required', 400)
    }

    // Check if user is admin
    const supabase = getSupabase()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user?.user?.email?.includes('@admin.')) {
      return this.errorResponse('FORBIDDEN', 'Admin access required', 403)
    }

    const body = await this.parseBody<any>(request)
    const validatedData = updateCategorySchema.parse(body)

    // Update category
    const { data: category, error } = await supabase
      .from('vendor_categories')
      .update(validatedData)
      .eq('id', categoryId)
      .select()
      .single()

    if (error || !category) {
      return this.errorResponse('NOT_FOUND', 'Category not found', 404)
    }

    return this.successResponse(category, { action: 'updated' })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    // Only admins can delete categories
    const authContext = await this.requireAuth(request)
    const categoryId = context?.params?.id

    if (!categoryId) {
      return this.errorResponse('INVALID_REQUEST', 'Category ID required', 400)
    }

    // Check if user is admin
    const supabase = getSupabase()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user?.user?.email?.includes('@admin.')) {
      return this.errorResponse('FORBIDDEN', 'Admin access required', 403)
    }

    // Check if category is in use
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id')
      .eq('categoryId', categoryId)
      .limit(1)

    if (vendors && vendors.length > 0) {
      return this.errorResponse('CATEGORY_IN_USE', 'Cannot delete category that is in use', 400)
    }

    // Delete category
    const { error } = await supabase
      .from('vendor_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      return this.errorResponse('DELETE_FAILED', 'Failed to delete category', 500)
    }

    return this.successResponse({ id: categoryId }, { action: 'deleted' })
  }
}