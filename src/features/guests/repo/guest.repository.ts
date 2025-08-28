import { Guest } from '@prisma/client'
import { BaseRepository, RepositoryResult, createSuccessResult, createErrorResult } from '@/lib/repositories/BaseRepository'
import { CreateGuestInput, UpdateGuestInput, GuestFilterInput } from '../dto/guest.dto'

interface GuestWhereClause {
  userId: string
  side?: 'bride' | 'groom'
  rsvpStatus?: 'pending' | 'accepted' | 'declined'
  relationshipCategory?: string
  dietaryRestrictions?: { contains: string; mode: 'insensitive' }
  email?: { not: null } | { equals: null }
  phone?: { not: null } | { equals: null }
}

export class GuestRepository extends BaseRepository {
  
  /**
   * Find all guests for a couple with optional filtering
   */
  async findByCoupleId(
    coupleId: string, 
    filters?: GuestFilterInput
  ): Promise<RepositoryResult<Guest[]>> {
    const { limit = 50, offset = 0, side, rsvpStatus, dietary, category, hasEmail, hasPhone } = filters || {}
    try {
      const where: GuestWhereClause = { userId: coupleId }
      
      if (side) where.side = side
      if (rsvpStatus) where.rsvpStatus = rsvpStatus
      if (dietary) where.dietaryRestrictions = { contains: dietary, mode: 'insensitive' }
      if (category) where.relationshipCategory = category
      if (hasEmail === true) where.email = { not: null }
      if (hasEmail === false) where.email = { equals: null }
      if (hasPhone === true) where.phone = { not: null }
      if (hasPhone === false) where.phone = { equals: null }

      const guests = await this.db.guest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return createSuccessResult(guests)
    } catch (error) {
      console.error('Error in findByCoupleId:', error)
      return createErrorResult('Failed to fetch guests', 'FETCH_ERROR', 500)
    }
  }

  /**
   * Find a guest by ID
   */
  async findById(id: string): Promise<RepositoryResult<Guest | null>> {
    try {
      const guest = await this.db.guest.findUnique({
        where: { id }
      })
      return createSuccessResult(guest)
    } catch (error) {
      console.error('Error in findById:', error)
      return createErrorResult('Failed to fetch guest', 'FETCH_ERROR', 500)
    }
  }

  /**
   * Create a new guest
   */
  async create(coupleId: string, data: CreateGuestInput): Promise<RepositoryResult<Guest>> {
    try {
      const guest = await this.withTransaction(async (tx) => {
        return await tx.guest.create({
          data: {
            userId: coupleId,
            ...data,
            tags: data.tags ? data.tags.join(',') : undefined,
          }
        })
      })
      return createSuccessResult(guest)
    } catch (error) {
      console.error('Error in create guest:', error)
      return createErrorResult('Failed to create guest', 'CREATE_ERROR', 500)
    }
  }

  /**
   * Update an existing guest
   */
  async update(id: string, data: UpdateGuestInput): Promise<RepositoryResult<Guest | null>> {
    try {
      const guest = await this.withTransaction(async (tx) => {
        return await tx.guest.update({
          where: { id },
          data: {
            ...data,
            tags: data.tags ? data.tags.join(',') : undefined,
          }
        })
      })
      return createSuccessResult(guest)
    } catch (error) {
      console.error('Error in update guest:', error)
      return createErrorResult('Failed to update guest', 'UPDATE_ERROR', 500)
    }
  }

  /**
   * Delete a guest
   */
  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      await this.withTransaction(async (tx) => {
        await tx.guest.delete({
          where: { id }
        })
      })
      return createSuccessResult(true)
    } catch (error) {
      console.error('Error in delete guest:', error)
      return createErrorResult('Failed to delete guest', 'DELETE_ERROR', 500)
    }
  }

  /**
   * Count guests for a couple
   */
  async countByCoupleId(coupleId: string): Promise<RepositoryResult<number>> {
    try {
      const count = await this.db.guest.count({
        where: { userId: coupleId }
      })
      return createSuccessResult(count)
    } catch (error) {
      console.error('Error in countByCoupleId:', error)
      return createErrorResult('Failed to count guests', 'COUNT_ERROR', 500)
    }
  }

  /**
   * Count guests with filters
   */
  async countByCoupleIdWithFilters(coupleId: string, filters?: GuestFilterInput): Promise<RepositoryResult<number>> {
    try {
      const { side, rsvpStatus, dietary, category, hasEmail, hasPhone } = filters || {}
      const where: GuestWhereClause = { userId: coupleId }

      if (side) where.side = side
      if (rsvpStatus) where.rsvpStatus = rsvpStatus
      if (dietary) where.dietaryRestrictions = { contains: dietary, mode: 'insensitive' }
      if (category) where.relationshipCategory = category
      if (hasEmail === true) where.email = { not: null }
      if (hasEmail === false) where.email = { equals: null }
      if (hasPhone === true) where.phone = { not: null }
      if (hasPhone === false) where.phone = { equals: null }

      const count = await this.db.guest.count({ where })
      return createSuccessResult(count)
    } catch (error) {
      console.error('Error in countByCoupleIdWithFilters:', error)
      return createErrorResult('Failed to count guests', 'COUNT_ERROR', 500)
    }
  }
}
