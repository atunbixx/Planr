/**
 * Vendors API Handler - Enterprise API pattern with validation and error handling
 */

import { NextRequest } from 'next/server'
import { VendorService } from '../service'
import { 
  CreateVendorRequestSchema, 
  UpdateVendorRequestSchema,
  VendorSearchRequestSchema,
  BulkUpdateVendorsRequestSchema
} from '../dto'
import { validateRequest, validateQueryParams, createApiResponse, handleApiError } from '@/shared/validation/middleware'
import { ApiError } from '@/shared/validation/errors'
import { getCurrentUser } from '@/core/auth/user'

export class VendorsApiHandler {
  private vendorService = new VendorService()

  /**
   * POST /api/vendors - Create vendor
   */
  async createVendor(request: NextRequest) {
    try {
      const body = await request.json()
      const validatedData = await validateRequest(CreateVendorRequestSchema, body)
      
      const vendor = await this.vendorService.createVendor(validatedData)
      
      return createApiResponse({
        data: vendor,
        message: 'Vendor created successfully',
        status: 201
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/vendors - Get vendors for current user's couple
   */
  async getVendors(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const queryData = {
        search: searchParams.get('search') || undefined,
        category: searchParams.get('category') || undefined,
        status: searchParams.get('status') || undefined,
        priceRange: searchParams.get('priceRange') || undefined,
        minCost: searchParams.get('minCost') ? parseFloat(searchParams.get('minCost')!) : undefined,
        maxCost: searchParams.get('maxCost') ? parseFloat(searchParams.get('maxCost')!) : undefined,
        minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
        contractSigned: searchParams.get('contractSigned') ? searchParams.get('contractSigned') === 'true' : undefined,
        isRecommended: searchParams.get('isRecommended') ? searchParams.get('isRecommended') === 'true' : undefined,
        priority: searchParams.get('priority') || undefined,
        deadlineFrom: searchParams.get('deadlineFrom') || undefined,
        deadlineTo: searchParams.get('deadlineTo') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || '20'),
        sortBy: searchParams.get('sortBy') || 'name',
        sortOrder: searchParams.get('sortOrder') || 'asc'
      }
      
      // Remove undefined values
      const filteredQuery = Object.fromEntries(
        Object.entries(queryData).filter(([_, v]) => v !== undefined)
      )
      
      const result = await this.vendorService.getVendorsForCouple(filteredQuery)
      
      return createApiResponse({
        data: result.data,
        meta: {
          pagination: result.pagination
        },
        message: 'Vendors retrieved successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/vendors/:id - Get vendor by ID
   */
  async getVendorById(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      
      const vendor = await this.vendorService.getVendorById(id)
      
      return createApiResponse({
        data: vendor,
        message: 'Vendor retrieved successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * PATCH /api/vendors/:id - Update vendor
   */
  async updateVendor(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      const body = await request.json()
      const validatedData = await validateRequest(UpdateVendorRequestSchema, body)
      
      const vendor = await this.vendorService.updateVendor(id, validatedData)
      
      return createApiResponse({
        data: vendor,
        message: 'Vendor updated successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * DELETE /api/vendors/:id - Delete vendor
   */
  async deleteVendor(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      
      await this.vendorService.deleteVendor(id)
      
      return createApiResponse({
        message: 'Vendor deleted successfully',
        status: 204
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/vendors/stats - Get vendor statistics
   */
  async getVendorStats(request: NextRequest) {
    try {
      const stats = await this.vendorService.getVendorStats()
      
      return createApiResponse({
        data: stats,
        message: 'Vendor statistics retrieved'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/vendors/stats/categories - Get vendor statistics by category
   */
  async getVendorStatsByCategory(request: NextRequest) {
    try {
      const stats = await this.vendorService.getVendorStatsByCategory()
      
      return createApiResponse({
        data: stats,
        message: 'Vendor category statistics retrieved'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/vendors/category/:category - Get vendors by category
   */
  async getVendorsByCategory(request: NextRequest, params: { category: string }) {
    try {
      const { category } = params
      
      const vendors = await this.vendorService.getVendorsByCategory(category)
      
      return createApiResponse({
        data: vendors,
        message: `Vendors in ${category} category retrieved`
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/vendors/deadlines - Get vendors with upcoming deadlines
   */
  async getVendorsWithUpcomingDeadlines(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const days = parseInt(searchParams.get('days') || '30')
      
      const vendors = await this.vendorService.getVendorsWithUpcomingDeadlines(days)
      
      return createApiResponse({
        data: vendors,
        message: 'Vendors with upcoming deadlines retrieved'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * PATCH /api/vendors/bulk - Bulk update vendors
   */
  async bulkUpdateVendors(request: NextRequest) {
    try {
      const body = await request.json()
      const validatedData = await validateRequest(BulkUpdateVendorsRequestSchema, body)
      
      const vendors = await this.vendorService.bulkUpdateVendors(validatedData)
      
      return createApiResponse({
        data: vendors,
        message: 'Vendors updated successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/vendors/search - Search vendors (Admin only)
   */
  async searchVendors(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const queryData = {
        search: searchParams.get('search') || undefined,
        category: searchParams.get('category') || undefined,
        status: searchParams.get('status') || undefined,
        priceRange: searchParams.get('priceRange') || undefined,
        minCost: searchParams.get('minCost') ? parseFloat(searchParams.get('minCost')!) : undefined,
        maxCost: searchParams.get('maxCost') ? parseFloat(searchParams.get('maxCost')!) : undefined,
        minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
        contractSigned: searchParams.get('contractSigned') ? searchParams.get('contractSigned') === 'true' : undefined,
        isRecommended: searchParams.get('isRecommended') ? searchParams.get('isRecommended') === 'true' : undefined,
        priority: searchParams.get('priority') || undefined,
        deadlineFrom: searchParams.get('deadlineFrom') || undefined,
        deadlineTo: searchParams.get('deadlineTo') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || '20'),
        sortBy: searchParams.get('sortBy') || 'name',
        sortOrder: searchParams.get('sortOrder') || 'asc'
      }
      
      const validatedQuery = await validateRequest(VendorSearchRequestSchema, queryData)
      const result = await this.vendorService.searchVendors(validatedQuery)
      
      return createApiResponse({
        data: result.data,
        meta: {
          pagination: result.pagination
        },
        message: 'Vendor search results retrieved'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }
}