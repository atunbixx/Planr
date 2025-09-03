import { Guest } from '@prisma/client'
import { BaseRepository, RepositoryResult, createSuccessResult, createErrorResult } from '@/lib/repositories/BaseRepository'
import { CreateGuestInput, UpdateGuestInput, GuestFilterInput } from '../dto/guest.dto'

interface GuestWhereClause {
  userId: string
  side?: 'bride' | 'groom'
  rsvpStatus?: 'pending' | 'accepted' | 'declined'
  relationshipCategory?: string
}

interface GuestUpdateData {
  name?: string
  mealPreference?: string
  side?: 'bride' | 'groom'
  plusOneAllowed?: boolean
  plusOneName?: string | null
  householdId?: string | null
  rsvpStatus?: 'pending' | 'accepted' | 'declined'
  invitationSent?: boolean
}

export class GuestRepository extends BaseRepository {
  
  /**
   * Find all guests for a couple with optional filtering
   */
  async findByCoupleId(
    coupleId: string, 
    filters?: GuestFilterInput
  ): Promise<RepositoryResult<Guest[]>> {
    const { limit = 50, offset = 0, side, rsvpStatus } = filters || {}
    const dietary = (filters as any)?.dietary as string | undefined
    const category = (filters as any)?.category as string | undefined
    try {
      const where: GuestWhereClause = { userId: coupleId }
      if (side) where.side = side
      if (rsvpStatus) (where as any).rsvpStatus = rsvpStatus
      if (dietary) (where as any).mealPreference = { contains: dietary, mode: 'insensitive' } as any
      if (category) (where as any).relationshipCategory = category

      const guests = await this.db.guest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return createSuccessResult(guests)
    } catch (error) {
      console.error('Database error in findByCoupleId:', error)
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
      console.error('Database error in findById:', error)
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
            userId: coupleId, // Using userId field from current schema
            name: `${data.firstName} ${data.lastName || ''}`.trim(), // Combine names, lastName optional
            rsvpStatus: 'pending', // Default for current schema
            mealPreference: data.dietaryRestrictions || undefined, // Map to current schema field
            side: data.side,
            invitationSent: false, // Default for current schema
            plusOneAllowed: data.plusOneAllowed ?? false,
            plusOneName: data.plusOneName || undefined,
            householdId: undefined,
            relationshipCategory: (data as any).relationshipCategory || undefined
          }
        })
      })

      return createSuccessResult(guest)
    } catch (error) {
      console.error('Database error in create:', error)
      return createErrorResult('Failed to create guest', 'CREATE_ERROR', 500)
    }
  }

  /**
   * Update an existing guest
   */
  async update(id: string, data: UpdateGuestInput): Promise<RepositoryResult<Guest | null>> {
    try {
      const guest = await this.withTransaction(async (tx) => {
        const updateData: GuestUpdateData = {}
        
        // Combine firstName/lastName into name field for current schema
        if (data.firstName || data.lastName) {
          const firstName = data.firstName || ''
          const lastName = data.lastName || ''
          updateData.name = `${firstName} ${lastName}`.trim()
        }
        
        // Map dietary restrictions to meal preference
        if (data.dietaryRestrictions !== undefined) {
          updateData.mealPreference = data.dietaryRestrictions
        }
        
        // Only update fields that exist in current schema
        if (data.side !== undefined) {
          updateData.side = data.side
        }
        if (data.plusOneAllowed !== undefined) {
          updateData.plusOneAllowed = data.plusOneAllowed
        }
        if (data.plusOneName !== undefined) {
          updateData.plusOneName = data.plusOneName || null
        }
        if ((data as any).relationshipCategory !== undefined) {
          (updateData as any).relationshipCategory = (data as any).relationshipCategory || null
        }
        
        return await tx.guest.update({
          where: { id },
          data: updateData as any
        })
      })

      return createSuccessResult(guest)
    } catch (error) {
      console.error('Database error in update:', error)
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
      console.error('Database error in delete:', error)
      return createErrorResult('Failed to delete guest', 'DELETE_ERROR', 500)
    }
  }

  /**
   * Count guests for a couple
   */
  async countByCoupleId(coupleId: string): Promise<RepositoryResult<number>> {
    try {
      const count = await this.db.guest.count({
        where: { userId: coupleId } // Use userId field from current schema
      })

      return createSuccessResult(count)
    } catch (error) {
      console.error('Database error in countByCoupleId:', error)
      return createErrorResult('Failed to count guests', 'COUNT_ERROR', 500)
    }
  }

  /**
   * Count guests with filters
   */
  async countByCoupleIdWithFilters(coupleId: string, filters?: GuestFilterInput): Promise<RepositoryResult<number>> {
    try {
      const { side, rsvpStatus } = filters || {}
      const where: any = { userId: coupleId }
      if (side) where.side = side
      if (rsvpStatus) where.rsvpStatus = rsvpStatus
      const count = await this.db.guest.count({ where })
      return createSuccessResult(count)
    } catch (error) {
      console.error('Database error in countByCoupleIdWithFilters:', error)
      return createErrorResult('Failed to count guests', 'COUNT_ERROR', 500)
    }
  }
}
