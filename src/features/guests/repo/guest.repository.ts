import { Guest } from '@prisma/client'
import { BaseRepository, RepositoryResult, createSuccessResult, createErrorResult } from '@/lib/repositories/BaseRepository'
import { tempStorage } from '@/lib/db/temp-storage'
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
  tags?: string[]
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
    try {
      const { limit = 50, offset = 0, side, rsvpStatus } = filters || {}
      const dietary = (filters as any)?.dietary as string | undefined
      const category = (filters as any)?.category as string | undefined

      const where: GuestWhereClause = { userId: coupleId }
      
      if (side) where.side = side
      if (rsvpStatus) (where as any).rsvpStatus = rsvpStatus
      if (dietary) (where as any).mealPreference = { contains: dietary, mode: 'insensitive' } as any
      if (category) (where as any).relationshipCategory = category
      // Note: Current schema doesn't have plusOneAllowed, email, phone fields
      // These filters will be implemented when schema is updated

      let guests = await this.db.guest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      // Dev-friendly: if DB returns no guests (e.g., rate limited or empty),
      // try reading from temp storage so entries created during fallback persist across refreshes.
      if (!guests || guests.length === 0) {
        try {
          const tempGuests = await tempStorage.findGuestsByUserId(coupleId)
          if (tempGuests && tempGuests.length > 0) {
            guests = tempGuests.map(guest => ({
              id: guest.id,
              userId: guest.userId,
              name: guest.name,
              rsvpStatus: guest.rsvpStatus,
              mealPreference: guest.mealPreference,
              side: guest.side || null,
              invitationSent: guest.invitationSent,
              relationshipCategory: (guest as any).relationshipCategory || null,
              tags: (guest as any).tags || [],
              createdAt: new Date(guest.createdAt),
              updatedAt: new Date(guest.updatedAt)
            })) as Guest[]
          }
        } catch {
          // ignore
        }
      }

      return createSuccessResult(guests)
    } catch (error) {
      console.error('Database error, falling back to temp storage:', error)
      
      try {
        // Fallback to temp storage - map coupleId to userId for now
        const guests = await tempStorage.findGuestsByUserId(coupleId)
        // Transform temp storage format to match Prisma Guest model
        let transformedGuests = guests.map(guest => ({
          id: guest.id,
          userId: guest.userId, // Keep existing field name for compatibility  
          name: guest.name,
          rsvpStatus: guest.rsvpStatus,
          mealPreference: guest.mealPreference,
          side: guest.side || null,
          invitationSent: guest.invitationSent,
          relationshipCategory: (guest as any).relationshipCategory || null,
          tags: (guest as any).tags || [],
          createdAt: new Date(guest.createdAt),
          updatedAt: new Date(guest.updatedAt)
        })) as Guest[]

        if (side) transformedGuests = transformedGuests.filter(g => g.side === side)
        if (rsvpStatus) transformedGuests = transformedGuests.filter(g => g.rsvpStatus === rsvpStatus)
        if (dietary) transformedGuests = transformedGuests.filter(g => (g.mealPreference || '').toLowerCase().includes(String(dietary).toLowerCase()))
        if (category) transformedGuests = (transformedGuests as any).filter((g: any) => (g.relationshipCategory || '').toLowerCase() === String(category).toLowerCase())

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
          tags: (guest as any).tags || [],
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
      console.error('Database error, falling back to temp storage:', error)
      
      try {
        // Fallback to temp storage
        const tempGuest = await tempStorage.createGuest({
          userId: coupleId, // Using coupleId as userId in temp storage
          name: `${data.firstName} ${data.lastName || ''}`.trim(),
          rsvpStatus: 'pending',
          mealPreference: data.dietaryRestrictions,
          side: data.side,
          invitationSent: false,
          relationshipCategory: (data as any).relationshipCategory,
          tags: (data as any).tags || []
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
          tags: (tempGuest as any).tags || [],
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
          data: updateData
        })
      })

      return createSuccessResult(guest)
    } catch (error) {
      console.error('Database error, falling back to temp storage:', error)
      
      try {
        const updateData: GuestUpdateData = {}
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
        if ((data as any).rsvpStatus !== undefined) {
          (updateData as any).rsvpStatus = (data as any).rsvpStatus
        }
        if ((data as any).invitationSent !== undefined) {
          (updateData as any).invitationSent = (data as any).invitationSent
        }
        if ((data as any).householdId !== undefined) {
          updateData.householdId = (data as any).householdId || null
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
          tags: (updatedTempGuest as any).tags || [],
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
      if (count === 0) {
        try {
          const guests = await tempStorage.findGuestsByUserId(coupleId)
          let filtered = guests
          if (filters?.side) filtered = filtered.filter(g => g.side === filters.side)
          if (filters?.rsvpStatus) filtered = filtered.filter(g => g.rsvpStatus === filters.rsvpStatus)
          return createSuccessResult(filtered.length)
        } catch {
          // ignore and return 0
        }
      }
      return createSuccessResult(count)
    } catch (error) {
      try {
        // Fallback to temp storage
        const guests = await tempStorage.findGuestsByUserId(coupleId)
        let filtered = guests
        if (filters?.side) filtered = filtered.filter(g => g.side === filters.side)
        if (filters?.rsvpStatus) filtered = filtered.filter(g => g.rsvpStatus === filters.rsvpStatus)
        return createSuccessResult(filtered.length)
      } catch (tempError) {
        return createErrorResult('Failed to count guests', 'COUNT_ERROR', 500)
      }
    }
  }
}
