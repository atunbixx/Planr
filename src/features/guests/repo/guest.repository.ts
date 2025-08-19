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

      const where: any = { userId: coupleId } // Using userId field from current schema
      
      if (side) where.side = side
      if (plusOneAllowed !== undefined) where.plusOneAllowed = plusOneAllowed
      if (hasEmail !== undefined) {
        where.email = hasEmail ? { not: null } : null
      }
      if (hasPhone !== undefined) {
        where.phone = hasPhone ? { not: null } : null
      }

      const guests = await this.db.guest.findMany({
        where,
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ],
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
          coupleId: guest.userId,
          firstName: guest.name.split(' ')[0] || guest.name,
          lastName: guest.name.split(' ').slice(1).join(' ') || '',
          email: null,
          phone: null,
          address: null,
          relationship: null,
          side: guest.side || null,
          plusOneAllowed: false,
          plusOneName: null,
          dietaryRestrictions: guest.mealPreference || null,
          notes: null,
          createdAt: new Date(guest.createdAt),
          updatedAt: new Date(guest.updatedAt),
          attendingCount: 1,
          invitationSentAt: guest.invitationSent ? new Date() : null,
          rsvpDeadline: null
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
            name: `${data.firstName} ${data.lastName}`, // Combine names for current schema
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
          name: `${data.firstName} ${data.lastName}`,
          rsvpStatus: 'pending',
          mealPreference: data.dietaryRestrictions,
          side: data.side,
          invitationSent: false
        })

        const transformedGuest = {
          id: tempGuest.id,
          coupleId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          relationship: data.relationship || null,
          side: data.side || null,
          plusOneAllowed: data.plusOneAllowed,
          plusOneName: data.plusOneName || null,
          dietaryRestrictions: data.dietaryRestrictions || null,
          notes: data.notes || null,
          createdAt: new Date(tempGuest.createdAt),
          updatedAt: new Date(tempGuest.updatedAt),
          attendingCount: data.attendingCount,
          invitationSentAt: null,
          rsvpDeadline: data.rsvpDeadline ? new Date(data.rsvpDeadline) : null
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
        return await tx.guest.update({
          where: { id },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            relationship: data.relationship,
            side: data.side,
            plusOneAllowed: data.plusOneAllowed,
            plusOneName: data.plusOneName,
            dietaryRestrictions: data.dietaryRestrictions,
            notes: data.notes,
            attendingCount: data.attendingCount,
            rsvpDeadline: data.rsvpDeadline ? new Date(data.rsvpDeadline) : undefined
          }
        })
      })

      return createSuccessResult(guest)
    } catch (error) {
      console.error('Database error, falling back to temp storage:', error)
      
      try {
        const updateData: any = {}
        if (data.firstName && data.lastName) {
          updateData.name = `${data.firstName} ${data.lastName}`
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

        const transformedGuest = {
          id: updatedTempGuest.id,
          coupleId: updatedTempGuest.userId,
          firstName: data.firstName || updatedTempGuest.name.split(' ')[0],
          lastName: data.lastName || updatedTempGuest.name.split(' ').slice(1).join(' '),
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          relationship: data.relationship || null,
          side: data.side || updatedTempGuest.side || null,
          plusOneAllowed: data.plusOneAllowed || false,
          plusOneName: data.plusOneName || null,
          dietaryRestrictions: data.dietaryRestrictions || updatedTempGuest.mealPreference || null,
          notes: data.notes || null,
          createdAt: new Date(updatedTempGuest.createdAt),
          updatedAt: new Date(updatedTempGuest.updatedAt),
          attendingCount: data.attendingCount || 1,
          invitationSentAt: updatedTempGuest.invitationSent ? new Date() : null,
          rsvpDeadline: data.rsvpDeadline ? new Date(data.rsvpDeadline) : null
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
        where: { coupleId }
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