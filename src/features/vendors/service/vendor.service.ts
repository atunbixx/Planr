/**
 * Vendor Service - Use-case orchestration with transaction boundaries
 */

import { withTransaction } from '@/core/db/transaction'
import { VendorRepository } from '@/lib/repositories/VendorRepository'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'
import { hasPermission } from '@/core/auth/permissions'
import { CreateVendorRequest, UpdateVendorRequest, VendorSearchRequest, BulkUpdateVendorsRequest } from '../dto'
import { VendorResponse, VendorSummaryResponse, VendorStatsResponse, VendorsPaginatedResponse, VendorCategoryStats } from '../dto'
import { ApiError } from '@/shared/validation/errors'
import { generateId } from '@/shared/utils/id'
import { getCurrentUser } from '@/core/auth/user'

export class VendorService {
  private vendorRepo = new VendorRepository()
  private coupleRepo = new CoupleRepository()

  /**
   * Create a new vendor
   * Use Case: User adds a vendor to their wedding planning
   */
  async createVendor(request: CreateVendorRequest): Promise<VendorResponse> {
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

      // Check for duplicate vendor by name and category
      const existingVendor = await this.vendorRepo.findByCoupleAndNameCategory(
        couple.id, 
        request.name, 
        request.category
      )
      if (existingVendor) {
        throw new ApiError('Vendor with this name and category already exists', 409)
      }

      // Create vendor data
      const vendorData = {
        ...request,
        id: generateId(),
        coupleId: couple.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Save to database
      const vendor = await this.vendorRepo.create(vendorData, tx)
      
      return this.mapToResponse(vendor)
    })
  }

  /**
   * Get vendor by ID
   * Use Case: View vendor details
   */
  async getVendorById(vendorId: string): Promise<VendorResponse> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const vendor = await this.vendorRepo.findById(vendorId)
    if (!vendor) {
      throw new ApiError('Vendor not found', 404)
    }

    // Check ownership
    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple || (vendor.coupleId !== couple.id && !hasPermission(user, 'vendor:read_all'))) {
      throw new ApiError('Forbidden', 403)
    }

    return this.mapToResponse(vendor)
  }

  /**
   * Update vendor
   * Use Case: Update vendor details, status, contract info, etc.
   */
  async updateVendor(vendorId: string, request: UpdateVendorRequest): Promise<VendorResponse> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Verify ownership
      const existingVendor = await this.vendorRepo.findById(vendorId)
      if (!existingVendor) {
        throw new ApiError('Vendor not found', 404)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple || (existingVendor.coupleId !== couple.id && !hasPermission(user, 'vendor:write_all'))) {
        throw new ApiError('Forbidden', 403)
      }

      // Check for name/category conflicts if those are being updated
      if (request.name || request.category) {
        const name = request.name || existingVendor.name
        const category = request.category || existingVendor.category
        
        const conflictVendor = await this.vendorRepo.findByCoupleAndNameCategory(
          existingVendor.coupleId,
          name,
          category
        )
        
        if (conflictVendor && conflictVendor.id !== vendorId) {
          throw new ApiError('Vendor with this name and category already exists', 409)
        }
      }

      // Update data
      const updateData = {
        ...request,
        updatedAt: new Date()
      }

      const updatedVendor = await this.vendorRepo.update(vendorId, updateData, tx)
      return this.mapToResponse(updatedVendor)
    })
  }

  /**
   * Delete vendor
   * Use Case: Remove vendor from wedding planning
   */
  async deleteVendor(vendorId: string): Promise<void> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Verify ownership
      const vendor = await this.vendorRepo.findById(vendorId)
      if (!vendor) {
        throw new ApiError('Vendor not found', 404)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple || (vendor.coupleId !== couple.id && !hasPermission(user, 'vendor:delete_all'))) {
        throw new ApiError('Forbidden', 403)
      }

      await this.vendorRepo.delete(vendorId, tx)
    })
  }

  /**
   * Get vendors for current user's couple
   * Use Case: Load vendor list on vendors page
   */
  async getVendorsForCouple(searchRequest?: Partial<VendorSearchRequest>): Promise<VendorsPaginatedResponse> {
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

    const result = await this.vendorRepo.search(searchParams)
    
    return {
      data: result.data.map(vendor => this.mapToSummaryResponse(vendor)),
      pagination: result.pagination
    }
  }

  /**
   * Search vendors (Admin or cross-couple search)
   * Use Case: Admin dashboard, analytics
   */
  async searchVendors(request: VendorSearchRequest): Promise<VendorsPaginatedResponse> {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, 'vendor:read_all')) {
      throw new ApiError('Forbidden', 403)
    }

    const result = await this.vendorRepo.search(request)
    
    return {
      data: result.data.map(vendor => this.mapToSummaryResponse(vendor)),
      pagination: result.pagination
    }
  }

  /**
   * Get vendor statistics
   * Use Case: Dashboard analytics, budget planning
   */
  async getVendorStats(): Promise<VendorStatsResponse> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple) {
      throw new ApiError('Couple profile not found', 404)
    }

    return await this.vendorRepo.getStatsByCouple(couple.id)
  }

  /**
   * Get vendor statistics by category
   * Use Case: Category-wise budget analysis
   */
  async getVendorStatsByCategory(): Promise<VendorCategoryStats[]> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple) {
      throw new ApiError('Couple profile not found', 404)
    }

    return await this.vendorRepo.getCategoryStatsByCouple(couple.id)
  }

  /**
   * Bulk update vendors
   * Use Case: Mass status updates, bulk contract signing
   */
  async bulkUpdateVendors(request: BulkUpdateVendorsRequest): Promise<VendorSummaryResponse[]> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple) {
        throw new ApiError('Couple profile not found', 404)
      }

      // Verify ownership of all vendors
      const vendors = await Promise.all(
        request.vendorIds.map(id => this.vendorRepo.findById(id))
      )

      const invalidVendors = vendors.filter(v => !v || v.coupleId !== couple.id)
      if (invalidVendors.length > 0) {
        throw new ApiError('Some vendors not found or access denied', 403)
      }

      // Perform bulk update
      const updateData = {
        ...request.updates,
        updatedAt: new Date()
      }

      const updatedVendors = await this.vendorRepo.bulkUpdate(request.vendorIds, updateData, tx)
      
      return updatedVendors.map(vendor => this.mapToSummaryResponse(vendor))
    })
  }

  /**
   * Get vendors by category
   * Use Case: Category-specific vendor lists
   */
  async getVendorsByCategory(category: string): Promise<VendorSummaryResponse[]> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple) {
      throw new ApiError('Couple profile not found', 404)
    }

    const vendors = await this.vendorRepo.findByCoupleAndCategory(couple.id, category)
    return vendors.map(vendor => this.mapToSummaryResponse(vendor))
  }

  /**
   * Get vendors with upcoming deadlines
   * Use Case: Dashboard alerts, deadline notifications
   */
  async getVendorsWithUpcomingDeadlines(days: number = 30): Promise<VendorSummaryResponse[]> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple) {
      throw new ApiError('Couple profile not found', 404)
    }

    const vendors = await this.vendorRepo.findWithUpcomingDeadlines(couple.id, days)
    return vendors.map(vendor => this.mapToSummaryResponse(vendor))
  }

  /**
   * Map database entity to API response
   */
  private mapToResponse(vendor: any): VendorResponse {
    return {
      id: vendor.id,
      name: vendor.name,
      category: vendor.category,
      subcategory: vendor.subcategory,
      contactName: vendor.contactName,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website,
      businessAddress: vendor.businessAddress,
      description: vendor.description,
      specialties: vendor.specialties || [],
      priceRange: vendor.priceRange,
      estimatedCost: vendor.estimatedCost,
      currency: vendor.currency,
      status: vendor.status,
      contractSigned: vendor.contractSigned,
      contractDate: vendor.contractDate?.toISOString(),
      contractAmount: vendor.contractAmount,
      serviceDate: vendor.serviceDate?.toISOString(),
      bookingDeadline: vendor.bookingDeadline?.toISOString(),
      rating: vendor.rating,
      reviewNotes: vendor.reviewNotes,
      tags: vendor.tags || [],
      notes: vendor.notes,
      priority: vendor.priority,
      isRecommended: vendor.isRecommended,
      externalId: vendor.externalId,
      source: vendor.source,
      coupleId: vendor.coupleId,
      createdAt: vendor.createdAt.toISOString(),
      updatedAt: vendor.updatedAt.toISOString()
    }
  }

  /**
   * Map database entity to summary response
   */
  private mapToSummaryResponse(vendor: any): VendorSummaryResponse {
    const today = new Date()
    const deadline = vendor.bookingDeadline ? new Date(vendor.bookingDeadline) : null
    const daysUntilDeadline = deadline ? 
      Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 
      undefined

    return {
      id: vendor.id,
      name: vendor.name,
      category: vendor.category,
      status: vendor.status,
      priceRange: vendor.priceRange,
      estimatedCost: vendor.estimatedCost,
      currency: vendor.currency,
      rating: vendor.rating,
      contactName: vendor.contactName,
      phone: vendor.phone,
      email: vendor.email,
      contractSigned: vendor.contractSigned,
      isRecommended: vendor.isRecommended,
      priority: vendor.priority,
      daysUntilDeadline
    }
  }
}