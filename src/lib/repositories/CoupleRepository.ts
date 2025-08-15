/**
 * CoupleRepository - Single source of truth for couple data access
 * Handles both legacy table names and provides consistent API
 */

import { prisma } from '@/lib/prisma'
import { toApiFormat, toDbFormat } from '@/lib/db/transformations'
import { BaseRepository } from './BaseRepository'

export interface CoupleData {
  id: string
  partner1Name: string
  partner2Name: string | null
  weddingDate: Date | null
  venueName: string | null
  venueLocation: string | null
  guestCountEstimate: number | null
  totalBudget: number | null
  currency: string | null
  weddingStyle: string | null
  onboardingCompleted: boolean | null
  userId: string | null
  partner1UserId: string | null
  partner2UserId: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface CreateCoupleData {
  partner1Name: string
  partner2Name?: string
  weddingDate?: Date
  venueName?: string
  venueLocation?: string
  guestCountEstimate?: number
  totalBudget?: number
  currency?: string
  weddingStyle?: string
  onboardingCompleted?: boolean
  userId?: string
  partner1UserId?: string
  partner2UserId?: string
}

export interface UpdateCoupleData {
  partner1Name?: string
  partner2Name?: string
  weddingDate?: Date
  venueName?: string
  venueLocation?: string
  guestCountEstimate?: number
  totalBudget?: number
  currency?: string
  weddingStyle?: string
  onboardingCompleted?: boolean
}

export class CoupleRepository extends BaseRepository<CoupleData> {
  constructor() {
    super('couple')
  }
  /**
   * Find couple by user ID - handles all relationship patterns
   */
  async findByUserId(userId: string): Promise<CoupleData | null> {
    return this.executeQueryWithCache(
      `couple:userId:${userId}`,
      async () => {
        try {
          console.log('🔍 CoupleRepository: Finding couple for userId:', userId)
          
          // Try the main couple table first (current schema)
          let couple = await prisma.couple.findFirst({
            where: {
              OR: [
                { partner1UserId: userId },
                { partner2UserId: userId },
                { userId: userId }
              ]
            }
          })

          console.log('📊 CoupleRepository: Query result:', {
            found: !!couple,
            coupleId: couple?.id,
            userId: couple?.userId,
            partner1UserId: couple?.partner1UserId,
            partner2UserId: couple?.partner2UserId
          })

          // Legacy fallback removed - using unified schema only

          return couple ? this.transformToApiFormat(couple) : null
        } catch (error) {
          console.error('❌ CoupleRepository: Database error finding couple by userId:', {
            userId,
            error: error.message,
            stack: error.stack,
            code: error.code
          })
          throw new Error('Failed to find couple')
        }
      },
      { cacheType: 'user', tags: ['couple', `couple:user:${userId}`] }
    )
  }

  /**
   * Find couple by ID
   */
  async findById(coupleId: string): Promise<CoupleData | null> {
    try {
      const couple = await prisma.couple.findUnique({
        where: { id: coupleId }
      })

      return couple ? this.transformToApiFormat(couple) : null
    } catch (error) {
      console.error('Error finding couple by ID:', error)
      throw new Error('Failed to find couple')
    }
  }


  /**
   * Create or update couple (upsert by userId)
   */
  async upsertByUserId(userId: string, data: CreateCoupleData): Promise<CoupleData> {
    try {
      const existingCouple = await this.findByUserId(userId)
      
      if (existingCouple) {
        return this.update(existingCouple.id, data)
      } else {
        return this.create({ ...data, userId })
      }
    } catch (error) {
      console.error('Error upserting couple:', error)
      throw new Error('Failed to upsert couple')
    }
  }

  /**
   * Delete couple (soft delete to preserve data integrity)
   */
  async softDelete(coupleId: string, tx: any = null): Promise<void> {
    try {
      const client = tx || prisma
      await client.couple.update({
        where: { id: coupleId },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error soft deleting couple:', error)
      throw new Error('Failed to delete couple')
    }
  }

  /**
   * Delete couple (hard delete)
   */
  async delete(coupleId: string): Promise<void> {
    try {
      await prisma.couple.delete({
        where: { id: coupleId }
      })
    } catch (error) {
      console.error('Error deleting couple:', error)
      throw new Error('Failed to delete couple')
    }
  }

  /**
   * Create couple with transaction support
   */
  async create(data: CreateCoupleData, tx: any = null): Promise<CoupleData> {
    try {
      const client = tx || prisma
      const dbData = this.transformToDbFormat(data)
      
      const couple = await client.couple.create({
        data: {
          ...dbData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return this.transformToApiFormat(couple)
    } catch (error) {
      console.error('Error creating couple:', error)
      throw new Error('Failed to create couple')
    }
  }

  /**
   * Update couple with transaction support
   */
  async update(coupleId: string, data: UpdateCoupleData, tx: any = null): Promise<CoupleData> {
    try {
      const client = tx || prisma
      const dbData = this.transformToDbFormat(data)
      
      const couple = await client.couple.update({
        where: { id: coupleId },
        data: {
          ...dbData,
          updatedAt: new Date()
        }
      })

      return this.transformToApiFormat(couple)
    } catch (error) {
      console.error('Error updating couple:', error)
      throw new Error('Failed to update couple')
    }
  }

  /**
   * Search couples with pagination (Admin only)
   */
  async search(params: any): Promise<{ data: CoupleData[], pagination: any }> {
    try {
      const {
        search,
        planningPhase,
        weddingDateFrom,
        weddingDateTo,
        page = 1,
        pageSize = 20,
        sortBy = 'weddingDate',
        sortOrder = 'asc'
      } = params

      const where: any = {}
      
      if (search) {
        where.OR = [
          { partner1Name: { contains: search, mode: 'insensitive' } },
          { partner2Name: { contains: search, mode: 'insensitive' } },
          { venueName: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (weddingDateFrom || weddingDateTo) {
        where.weddingDate = {}
        if (weddingDateFrom) where.weddingDate.gte = new Date(weddingDateFrom)
        if (weddingDateTo) where.weddingDate.lte = new Date(weddingDateTo)
      }

      const total = await prisma.couple.count({ where })
      const totalPages = Math.ceil(total / pageSize)
      const skip = (page - 1) * pageSize

      const couples = await prisma.couple.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize
      })

      return {
        data: couples.map(couple => this.transformToApiFormat(couple)),
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('Error searching couples:', error)
      throw new Error('Failed to search couples')
    }
  }

  /**
   * Get couple statistics
   */
  async getStats(): Promise<any> {
    try {
      const totalCouples = await prisma.couple.count()
      
      const upcomingWeddings = await prisma.couple.count({
        where: {
          weddingDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
          }
        }
      })

      // Get average guest count and budget
      const aggregates = await prisma.couple.aggregate({
        _avg: {
          guestCountEstimate: true,
          totalBudget: true
        }
      })

      return {
        totalCouples,
        upcomingWeddings,
        averageGuestCount: Math.round(aggregates._avg.guestCountEstimate || 0),
        averageBudget: aggregates._avg.totalBudget || undefined,
        byPlanningPhase: {
          initial: 0, // Would need to add planningPhase field
          planning: 0,
          booking: 0,
          finalizing: 0,
          post_wedding: 0
        }
      }
    } catch (error) {
      console.error('Error getting couple stats:', error)
      throw new Error('Failed to get couple statistics')
    }
  }

  /**
   * Get upcoming weddings
   */
  async findUpcomingWeddings(days: number = 30): Promise<CoupleData[]> {
    try {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + days)

      const couples = await prisma.couple.findMany({
        where: {
          weddingDate: {
            gte: new Date(),
            lte: endDate
          }
        },
        orderBy: {
          weddingDate: 'asc'
        }
      })

      return couples.map(couple => this.transformToApiFormat(couple))
    } catch (error) {
      console.error('Error finding upcoming weddings:', error)
      throw new Error('Failed to find upcoming weddings')
    }
  }

  /**
   * Transform database record to API format
   */
  private transformToApiFormat(couple: any): CoupleData {
    return {
      id: couple.id,
      partner1Name: couple.partner1Name || couple.partner1_name || '',
      partner2Name: couple.partner2Name || couple.partner2_name || null,
      weddingDate: couple.weddingDate || couple.wedding_date || null,
      venueName: couple.venueName || couple.venue_name || null,
      venueLocation: couple.venueLocation || couple.venue_location || null,
      guestCountEstimate: couple.guestCountEstimate || couple.guest_count_estimate || null,
      totalBudget: couple.totalBudget ? Number(couple.totalBudget) : 
                   couple.total_budget ? Number(couple.total_budget) : null,
      currency: couple.currency || 'USD',
      weddingStyle: couple.weddingStyle || couple.wedding_style || null,
      onboardingCompleted: couple.onboardingCompleted ?? couple.onboarding_completed ?? false,
      userId: couple.userId || couple.user_id || null,
      partner1UserId: couple.partner1UserId || null,
      partner2UserId: couple.partner2UserId || null,
      createdAt: couple.createdAt || couple.created_at || null,
      updatedAt: couple.updatedAt || couple.updated_at || null
    }
  }

  /**
   * Transform API data to database format
   */
  private transformToDbFormat(data: CreateCoupleData | UpdateCoupleData): any {
    const dbData: any = {}
    
    if (data.partner1Name !== undefined) dbData.partner1Name = data.partner1Name
    if (data.partner2Name !== undefined) dbData.partner2Name = data.partner2Name
    if (data.weddingDate !== undefined) dbData.weddingDate = data.weddingDate
    if (data.venueName !== undefined) dbData.venueName = data.venueName
    if (data.venueLocation !== undefined) dbData.venueLocation = data.venueLocation
    if (data.guestCountEstimate !== undefined) dbData.guestCountEstimate = data.guestCountEstimate
    if (data.totalBudget !== undefined) dbData.totalBudget = data.totalBudget
    if (data.currency !== undefined) dbData.currency = data.currency
    if (data.weddingStyle !== undefined) dbData.weddingStyle = data.weddingStyle
    if (data.onboardingCompleted !== undefined) dbData.onboardingCompleted = data.onboardingCompleted
    
    if ('userId' in data && data.userId !== undefined) dbData.userId = data.userId
    if ('partner1UserId' in data && data.partner1UserId !== undefined) dbData.partner1UserId = data.partner1UserId
    if ('partner2UserId' in data && data.partner2UserId !== undefined) dbData.partner2UserId = data.partner2UserId

    return dbData
  }

  /**
   * Transform legacy couple data to current format
   */
  private transformLegacyCouple(legacyCouple: any): any {
    return {
      id: legacyCouple.id,
      partner1Name: legacyCouple.partner1_name || '',
      partner2Name: legacyCouple.partner2_name || null,
      weddingDate: legacyCouple.wedding_date || null,
      venueName: legacyCouple.venue_name || null,
      venueLocation: legacyCouple.venue_location || null,
      guestCountEstimate: legacyCouple.guest_count_estimate || null,
      totalBudget: legacyCouple.total_budget || null,
      currency: legacyCouple.currency || 'USD',
      weddingStyle: legacyCouple.wedding_style || null,
      onboardingCompleted: legacyCouple.onboarding_completed || false,
      userId: legacyCouple.user_id || null,
      partner1UserId: legacyCouple.partner1_user_id || null,
      partner2UserId: legacyCouple.partner2_user_id || null,
      createdAt: legacyCouple.created_at || null,
      updatedAt: legacyCouple.updated_at || null
    }
  }
}