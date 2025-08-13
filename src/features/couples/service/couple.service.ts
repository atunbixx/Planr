/**
 * Couple Service - Use-case orchestration with transaction boundaries
 */

import { withTransaction } from '@/core/db/transaction'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'
import { hasPermission } from '@/core/auth/permissions'
import { CreateCoupleRequest, UpdateCoupleRequest, CoupleSearchRequest } from '../dto'
import { CoupleResponse, CoupleSummaryResponse, CoupleStatsResponse, CouplesPaginatedResponse } from '../dto'
import { ApiError } from '@/shared/validation/errors'
import { generateId } from '@/shared/utils/id'
import { getCurrentUser } from '@/core/auth/user'

export class CoupleService {
  private coupleRepo = new CoupleRepository()

  /**
   * Create a new couple profile
   * Use Case: User completes onboarding and creates wedding profile
   */
  async createCouple(request: CreateCoupleRequest): Promise<CoupleResponse> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Check if user already has a couple profile
      const existingCouple = await this.coupleRepo.findByUserId(user.id)
      if (existingCouple) {
        throw new ApiError('User already has a couple profile', 409)
      }

      // Create couple data
      const coupleData = {
        ...request,
        id: generateId(),
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Save to database
      const couple = await this.coupleRepo.create(coupleData, tx)
      
      // Transform to response format
      return this.mapToResponse(couple)
    })
  }

  /**
   * Get couple by user ID
   * Use Case: Load user's wedding profile on dashboard
   */
  async getCoupleByUserId(userId: string): Promise<CoupleResponse | null> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    // Users can only access their own couple profile
    if (user.id !== userId && !hasPermission(user, 'couple:read_all')) {
      throw new ApiError('Forbidden', 403)
    }

    const couple = await this.coupleRepo.findByUserId(userId)
    return couple ? this.mapToResponse(couple) : null
  }

  /**
   * Update couple profile
   * Use Case: User updates wedding details, venue, guest count, etc.
   */
  async updateCouple(coupleId: string, request: UpdateCoupleRequest): Promise<CoupleResponse> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Verify ownership
      const existingCouple = await this.coupleRepo.findById(coupleId)
      if (!existingCouple) {
        throw new ApiError('Couple not found', 404)
      }

      if (existingCouple.userId !== user.id && !hasPermission(user, 'couple:write_all')) {
        throw new ApiError('Forbidden', 403)
      }

      // Update data
      const updateData = {
        ...request,
        updatedAt: new Date()
      }

      const updatedCouple = await this.coupleRepo.update(coupleId, updateData, tx)
      return this.mapToResponse(updatedCouple)
    })
  }

  /**
   * Delete couple profile
   * Use Case: User wants to delete their wedding profile
   */
  async deleteCouple(coupleId: string): Promise<void> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Verify ownership
      const couple = await this.coupleRepo.findById(coupleId)
      if (!couple) {
        throw new ApiError('Couple not found', 404)
      }

      if (couple.userId !== user.id && !hasPermission(user, 'couple:delete_all')) {
        throw new ApiError('Forbidden', 403)
      }

      // Soft delete to preserve data integrity
      await this.coupleRepo.softDelete(coupleId, tx)
    })
  }

  /**
   * Search couples (Admin only)
   * Use Case: Admin dashboard, analytics, support
   */
  async searchCouples(request: CoupleSearchRequest): Promise<CouplesPaginatedResponse> {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, 'couple:read_all')) {
      throw new ApiError('Forbidden', 403)
    }

    const result = await this.coupleRepo.search(request)
    
    return {
      data: result.data.map(couple => this.mapToSummaryResponse(couple)),
      pagination: result.pagination
    }
  }

  /**
   * Get couple statistics (Admin only)
   * Use Case: Admin analytics, reporting
   */
  async getCoupleStats(): Promise<CoupleStatsResponse> {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, 'couple:read_all')) {
      throw new ApiError('Forbidden', 403)
    }

    return await this.coupleRepo.getStats()
  }

  /**
   * Get upcoming weddings
   * Use Case: Dashboard widgets, notifications
   */
  async getUpcomingWeddings(days: number = 30): Promise<CoupleSummaryResponse[]> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const couples = await this.coupleRepo.findUpcomingWeddings(days)
    return couples.map(couple => this.mapToSummaryResponse(couple))
  }

  /**
   * Map database entity to API response
   */
  private mapToResponse(couple: any): CoupleResponse {
    return {
      id: couple.id,
      partner1Name: couple.partner1Name,
      partner1Email: couple.partner1Email,
      partner1Phone: couple.partner1Phone,
      partner2Name: couple.partner2Name,
      partner2Email: couple.partner2Email,
      partner2Phone: couple.partner2Phone,
      weddingDate: couple.weddingDate.toISOString().split('T')[0], // YYYY-MM-DD
      venue: couple.venue,
      guestCount: couple.guestCount,
      totalBudget: couple.totalBudget,
      currency: couple.currency,
      weddingLocation: couple.weddingLocation,
      timezone: couple.timezone,
      language: couple.language,
      notes: couple.notes,
      planningPhase: couple.planningPhase,
      userId: couple.userId,
      createdAt: couple.createdAt.toISOString(),
      updatedAt: couple.updatedAt.toISOString()
    }
  }

  /**
   * Map database entity to summary response
   */
  private mapToSummaryResponse(couple: any): CoupleSummaryResponse {
    const today = new Date()
    const weddingDate = new Date(couple.weddingDate)
    const daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return {
      id: couple.id,
      partner1Name: couple.partner1Name,
      partner2Name: couple.partner2Name,
      weddingDate: couple.weddingDate.toISOString().split('T')[0],
      venue: couple.venue,
      guestCount: couple.guestCount,
      planningPhase: couple.planningPhase,
      daysUntilWedding
    }
  }
}