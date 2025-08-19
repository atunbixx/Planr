import { Guest, PrismaClient } from '@prisma/client'
import { BaseRepository, RepositoryResult, createSuccessResult, createErrorResult } from '@/lib/repositories/BaseRepository'
import { tempStorage } from '@/lib/db/temp-storage'
import { CreateGuestInput, UpdateGuestInput, GuestFilterInput } from '../dto/guest.dto'

export interface GuestWithRelations extends Guest {
  // Add related data when needed
}

export class GuestRepository extends BaseRepository {
  
  /**
   * Find all guests for a couple with optional filtering
   */
  async findByCoupleId(
    coupleId: string, 
    filters?: GuestFilterInput
  ): Promise<RepositoryResult<Guest[]>> {
    try {
      const { limit = 50, offset = 0, side, plusOneAllowed, hasEmail, hasPhone } = filters || {}

      const where: any = { userId: coupleId }
      
      if (side) where.side = side
      // Note: Current schema doesn't have plusOneAllowed, email, phone fields
      // These filters will be implemented when schema is updated

      const guests = await this.db.guest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return createSuccessResult(guests)
    } catch (error) {
      console.error('Database error, falling back to temp storage:', error)
      
      try {
        // Fallback to temp storage - map coupleId to userId for now
        const guests = await tempStorage.findGuestsByUserId(coupleId)
        // Transform temp storage format to match Prisma Guest model
        const transformedGuests = guests.map(guest => ({
          id: guest.id,
          userId: guest.userId, // Keep existing field name for compatibility  
          name: guest.name,
          rsvpStatus: guest.rsvpStatus,
          mealPreference: guest.mealPreference,
          side: guest.side || null,
          invitationSent: guest.invitationSent,
          createdAt: new Date(guest.createdAt),
          updatedAt: new Date(guest.updatedAt)
        })) as Guest[]

        return createSuccessResult(transformedGuests)
      } catch (tempError) {
        console.error('Temp storage error:', tempError)
        return createErrorResult('Failed to fetch guests', 'FETCH_ERROR', 500)
      }
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
      console.error('Database error, falling back to temp storage:', error)
      
      try {
        const guest = await tempStorage.findGuestById(id)
        if (!guest) {
          return createSuccessResult(null)
        }

        const transformedGuest = {
          id: guest.id,
          userId: guest.userId, // Keep original field name for schema compatibility
          name: guest.name,
          rsvpStatus: guest.rsvpStatus,
          mealPreference: guest.mealPreference,
          side: guest.side,
          invitationSent: guest.invitationSent,
          createdAt: new Date(guest.createdAt),
          updatedAt: new Date(guest.updatedAt)
        } as Guest

        return createSuccessResult(transformedGuest)
      } catch (tempError) {
        console.error('Temp storage error:', tempError)
        return createErrorResult('Failed to fetch guest', 'FETCH_ERROR', 500)
      }
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
            invitationSent: false // Default for current schema
          }
        })
      })

      return createSuccessResult(guest)
    } catch (error) {
      console.error('Database error, falling back to temp storage:', error)
      
      try {
        // Fallback to temp storage
        const tempGuest = await tempStorage.createGuest({
          userId: coupleId, // Using coupleId as userId in temp storage
          name: `${data.firstName} ${data.lastName || ''}`.trim(),
          rsvpStatus: 'pending',
          mealPreference: data.dietaryRestrictions,
          side: data.side,
          invitationSent: false
        })

        // Transform temp storage format to match current Prisma Guest model
        const transformedGuest = {
          id: tempGuest.id,
          userId: coupleId, // Use userId field for schema compatibility
          name: tempGuest.name,
          rsvpStatus: tempGuest.rsvpStatus,
          mealPreference: tempGuest.mealPreference,
          side: tempGuest.side,
          invitationSent: tempGuest.invitationSent,
          createdAt: new Date(tempGuest.createdAt),
          updatedAt: new Date(tempGuest.updatedAt)
        } as Guest

        return createSuccessResult(transformedGuest)
      } catch (tempError) {
        console.error('Temp storage error:', tempError)
        return createErrorResult('Failed to create guest', 'CREATE_ERROR', 500)
      }
    }
  }

  /**
   * Update an existing guest
   */
  async update(id: string, data: UpdateGuestInput): Promise<RepositoryResult<Guest | null>> {
    try {
      const guest = await this.withTransaction(async (tx) => {
        // Map enterprise fields to current schema fields
        const updateData: any = {}
        
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
        
        return await tx.guest.update({
          where: { id },
          data: updateData
        })
      })

      return createSuccessResult(guest)
    } catch (error) {
      console.error('Database error, falling back to temp storage:', error)
      
      try {
        const updateData: any = {}
        if (data.firstName || data.lastName) {
          const firstName = data.firstName || ''
          const lastName = data.lastName || ''
          updateData.name = `${firstName} ${lastName}`.trim()
        }
        if (data.dietaryRestrictions !== undefined) {
          updateData.mealPreference = data.dietaryRestrictions
        }
        if (data.side !== undefined) {
          updateData.side = data.side
        }

        const updatedTempGuest = await tempStorage.updateGuest(id, updateData)
        if (!updatedTempGuest) {
          return createSuccessResult(null)
        }

        // Transform temp storage format to match current Prisma Guest model
        const transformedGuest = {
          id: updatedTempGuest.id,
          userId: updatedTempGuest.userId, // Use userId field for schema compatibility
          name: updatedTempGuest.name,
          rsvpStatus: updatedTempGuest.rsvpStatus,
          mealPreference: updatedTempGuest.mealPreference,
          side: updatedTempGuest.side,
          invitationSent: updatedTempGuest.invitationSent,
          createdAt: new Date(updatedTempGuest.createdAt),
          updatedAt: new Date(updatedTempGuest.updatedAt)
        } as Guest

        return createSuccessResult(transformedGuest)
      } catch (tempError) {
        console.error('Temp storage error:', tempError)
        return createErrorResult('Failed to update guest', 'UPDATE_ERROR', 500)
      }
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
      console.error('Database error, falling back to temp storage:', error)
      
      try {
        const deleted = await tempStorage.deleteGuest(id)
        return createSuccessResult(deleted)
      } catch (tempError) {
        console.error('Temp storage error:', tempError)
        return createErrorResult('Failed to delete guest', 'DELETE_ERROR', 500)
      }
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
      console.error('Database error, falling back to temp storage:', error)
      
      try {
        const guests = await tempStorage.findGuestsByUserId(coupleId)
        return createSuccessResult(guests.length)
      } catch (tempError) {
        console.error('Temp storage error:', tempError)
        return createErrorResult('Failed to count guests', 'COUNT_ERROR', 500)
      }
    }
  }
}