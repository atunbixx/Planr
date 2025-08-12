import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { vendorService } from '@/lib/services/vendor.service'
import { coupleService } from '@/lib/services/couple.service'

// Validation schemas
const createVendorSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['potential', 'contacted', 'quoted', 'booked', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  rating: z.number().min(1).max(5).optional(),
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  meetingDate: z.string().datetime().optional(),
  contractSigned: z.boolean().optional()
})

const updateVendorSchema = createVendorSchema.partial()

export class VendorsHandler extends BaseAPIHandler {
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

    // Get couple using Supabase ID
    const coupleData = await coupleService.getCoupleBySupabaseId(authContext.userId)
    if (!coupleData) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }
    const couple = coupleData

    // Parse filters
    const status = searchParams.get('status') || undefined
    const categoryId = searchParams.get('categoryId') || undefined

    // Get vendors using service
    const result = await vendorService.getVendorsForCouple(couple.id, {
      page,
      pageSize,
      status,
      categoryId
    })

    // Get categories
    const categories = await vendorService.getVendorCategories()

    // Calculate stats
    const vendors = result.data
    const stats = {
      total: result.total,
      byStatus: {
        potential: 0,
        contacted: 0,
        quoted: 0,
        booked: 0,
        completed: 0
      },
      costs: {
        estimated: 0,
        actual: 0
      },
      contractsSigned: 0
    }

    vendors.forEach(vendor => {
      const vendorStatus = vendor.status || 'potential'
      if (vendorStatus in stats.byStatus) {
        stats.byStatus[vendorStatus as keyof typeof stats.byStatus]++
      }
      stats.costs.estimated += Number(vendor.estimatedCost || 0)
      stats.costs.actual += Number(vendor.actualCost || 0)
      if (vendor.contractSigned) stats.contractsSigned++
    })

    // Transform vendors data to match frontend expectations
    const transformedVendors = result.data.map(vendor => ({
      id: vendor.id,
      businessName: vendor.name,
      contactName: vendor.contactName,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website,
      category: vendor.categoryId || 'other',
      status: vendor.status || 'potential',
      estimatedCost: vendor.estimatedCost,
      actualCost: vendor.actualCost,
      contractSigned: vendor.contractSigned || false,
      notes: vendor.notes
    }))

    // Flatten stats for frontend
    const flatStats = {
      total: result.total,
      potential: stats.byStatus.potential,
      contacted: stats.byStatus.contacted,
      quoted: stats.byStatus.quoted,
      booked: stats.byStatus.booked,
      completed: stats.byStatus.completed
    }

    return this.successResponse({
      vendors: transformedVendors,
      categories,
      stats: flatStats,
      costs: stats.costs,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages
      }
    })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = createVendorSchema.parse(body)

    // Get couple using Supabase ID
    const coupleData = await coupleService.getCoupleBySupabaseId(authContext.userId)
    if (!coupleData) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }
    const couple = coupleData

    // Parse dates
    const vendorData = {
      ...validatedData,
      meetingDate: validatedData.meetingDate ? new Date(validatedData.meetingDate) : undefined
    }

    // Create vendor using service
    const vendor = await vendorService.createVendor(couple.id, vendorData)

    // Transform vendor to match frontend expectations
    const transformedVendor = {
      id: vendor.id,
      businessName: vendor.name,
      contactName: vendor.contactName,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website,
      category: vendor.categoryId || 'other',
      status: vendor.status || 'potential',
      estimatedCost: vendor.estimatedCost,
      actualCost: vendor.actualCost,
      contractSigned: vendor.contractSigned || false,
      notes: vendor.notes
    }

    return this.successResponse(transformedVendor, { action: 'created' })
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const vendorId = context?.params?.id

    if (!vendorId) {
      return this.errorResponse('INVALID_REQUEST', 'Vendor ID required', 400)
    }

    const validatedData = updateVendorSchema.parse(await this.parseBody(request))

    // Get couple using Supabase ID
    const coupleData = await coupleService.getCoupleBySupabaseId(authContext.userId)
    if (!coupleData) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }
    const couple = coupleData

    // Parse dates
    const vendorData = {
      ...validatedData,
      meetingDate: validatedData.meetingDate ? new Date(validatedData.meetingDate) : undefined
    }

    // Update vendor using service
    const updatedVendor = await vendorService.updateVendor(vendorId, couple.id, vendorData)

    // Transform vendor to match frontend expectations
    const transformedVendor = {
      id: updatedVendor.id,
      businessName: updatedVendor.name,
      contactName: updatedVendor.contactName,
      email: updatedVendor.email,
      phone: updatedVendor.phone,
      website: updatedVendor.website,
      category: updatedVendor.categoryId || 'other',
      status: updatedVendor.status || 'potential',
      estimatedCost: updatedVendor.estimatedCost,
      actualCost: updatedVendor.actualCost,
      contractSigned: updatedVendor.contractSigned || false,
      notes: updatedVendor.notes
    }

    return this.successResponse(transformedVendor, { action: 'updated' })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const vendorId = context?.params?.id

    if (!vendorId) {
      return this.errorResponse('INVALID_REQUEST', 'Vendor ID required', 400)
    }

    // Get couple using Supabase ID
    const coupleData = await coupleService.getCoupleBySupabaseId(authContext.userId)
    if (!coupleData) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }
    const couple = coupleData

    // Delete vendor using service
    await vendorService.deleteVendor(vendorId, couple.id)

    return this.successResponse({ id: vendorId }, { action: 'deleted' })
  }
}