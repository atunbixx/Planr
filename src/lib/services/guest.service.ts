import { BaseService, PaginationOptions, PaginatedResult } from './base.service'
import { Guest, Prisma, Invitation } from '@prisma/client'
import { randomBytes } from 'crypto'
import { guestRepository } from '../repositories/guest.repository'
import { getCacheKey, getCacheTags, CACHE_TTL } from '@/lib/cache'

export interface CreateGuestDto {
  name: string
  email?: string
  phone?: string
  dietaryRestrictions?: string
  notes?: string
  side?: string
  relationship?: string
  plusOneAllowed?: boolean
  plusOneName?: string
  address?: string
}

export interface UpdateGuestDto extends Partial<CreateGuestDto> {}

export interface GuestWithRelations extends Guest {
  couple?: any
  invitations?: any[]
}

export interface GuestStats {
  total: number
  confirmed: number
  declined: number
  pending: number
  withPlusOne: number
}

export class GuestService extends BaseService<Guest> {
  protected entityName = 'guest'
  protected cachePrefix = 'guests'

  protected getTags(coupleId: string): string[] {
    return [getCacheTags.guests(coupleId), getCacheTags.couple(coupleId)]
  }

  async getGuestsForCouple(
    coupleId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<GuestWithRelations>> {
    const { skip, take, page, pageSize } = this.getPaginationParams(options)

    // Use cached query with proper tagging
    const cacheKey = getCacheKey.guestList(coupleId) + `:page:${page}:${pageSize}`
    
    return this.cachedQuery(
      cacheKey,
      async () => {
        // Execute the actual database query
        const [guests, total] = await Promise.all([
          this.prisma.guest.findMany({
            where: { coupleId },
            skip,
            take,
            orderBy: options?.orderBy || { createdAt: 'desc' },
            include: {
              invitations: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          }),
          this.prisma.guest.count({ where: { coupleId } })
        ])

        return this.createPaginatedResult(guests, total, page, pageSize)
      },
      coupleId,
      CACHE_TTL.MEDIUM
    )
  }

  async getGuestStats(coupleId: string): Promise<GuestStats> {
    const cacheKey = `${this.cachePrefix}:${coupleId}:stats`
    
    return this.cachedQuery(
      cacheKey,
      async () => {
        // Get all guests with invitations for stats calculation
        const guests = await this.prisma.guest.findMany({
          where: { coupleId },
          include: {
            invitations: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        })

        // Calculate statistics
        return guests.reduce((acc, guest) => {
          acc.total++
          
          const latestInvitation = guest.invitations[0]
          if (latestInvitation?.status === 'confirmed' || latestInvitation?.status === 'attending') {
            acc.confirmed++
          } else if (latestInvitation?.status === 'declined') {
            acc.declined++
          } else {
            acc.pending++
          }
          
          if (guest.plusOneAllowed) acc.withPlusOne++
          
          return acc
        }, { total: 0, confirmed: 0, declined: 0, pending: 0, withPlusOne: 0 })
      },
      coupleId,
      CACHE_TTL.SHORT // Stats change frequently
    )
  }

  async createGuest(coupleId: string, data: CreateGuestDto): Promise<Guest> {
    // Parse name
    const nameParts = data.name.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || ''

    // Create guest with transaction
    const guest = await this.prisma.$transaction(async (tx) => {
      const newGuest = await tx.guest.create({
        data: {
          coupleId,
          firstName,
          lastName,
          email: data.email,
          phone: data.phone,
          side: data.side,
          relationship: data.relationship,
          plusOneAllowed: data.plusOneAllowed || false,
          dietaryRestrictions: data.dietaryRestrictions,
          notes: data.notes,
          plusOneName: data.plusOneName,
          address: data.address
        },
        include: {
          invitations: true
        }
      })

      return newGuest
    })

    // Clear cache
    await this.clearEntityCache(coupleId)

    return guest
  }

  async bulkImportGuests(coupleId: string, guests: CreateGuestDto[]): Promise<Guest[]> {
    const createdGuests = await this.prisma.$transaction(async (tx) => {
      const results = []

      for (const guestData of guests) {
        const nameParts = guestData.name.split(' ')
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(' ') || ''

        const guest = await tx.guest.create({
          data: {
            coupleId,
            firstName,
            lastName,
            email: guestData.email,
            phone: guestData.phone,
            side: guestData.side,
            relationship: guestData.relationship,
            plusOneAllowed: guestData.plusOneAllowed || false,
            dietaryRestrictions: guestData.dietaryRestrictions,
            notes: guestData.notes,
            plusOneName: guestData.plusOneName,
            address: guestData.address
          },
          include: {
            tags: true
          }
        })
        results.push(guest)
      }

      return results
    })

    // Clear cache
    await this.clearEntityCache(coupleId)

    return createdGuests
  }

  async updateGuest(guestId: string, coupleId: string, data: UpdateGuestDto): Promise<Guest> {
    const updateData: Prisma.GuestUpdateInput = {}

    if (data.name !== undefined) {
      const nameParts = data.name.split(' ')
      updateData.firstName = nameParts[0]
      updateData.lastName = nameParts.slice(1).join(' ') || ''
    }

    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.side !== undefined) updateData.side = data.side
    if (data.relationship !== undefined) updateData.relationship = data.relationship
    if (data.plusOneAllowed !== undefined) updateData.plusOneAllowed = data.plusOneAllowed
    if (data.dietaryRestrictions !== undefined) updateData.dietaryRestrictions = data.dietaryRestrictions
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.plusOneName !== undefined) updateData.plusOneName = data.plusOneName
    if (data.address !== undefined) updateData.address = data.address

    const updatedGuest = await this.prisma.guest.update({
      where: { id: guestId },
      data: updateData,
      include: {
        invitations: true
      }
    })

    // Clear cache
    await this.clearEntityCache(coupleId)

    return updatedGuest
  }

  async deleteGuest(guestId: string, coupleId: string): Promise<void> {
    await this.prisma.guest.delete({
      where: { id: guestId }
    })

    // Clear cache
    await this.clearEntityCache(coupleId)
  }

  async updateRSVP(guestId: string, status: 'confirmed' | 'declined' | 'pending'): Promise<Invitation> {
    // Get the guest to find the couple
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId }
    })
    
    if (!guest) {
      throw new Error('Guest not found')
    }

    // Find or create invitation
    let invitation = await this.prisma.invitation.findFirst({
      where: { guestId }
    })

    if (invitation) {
      // Update existing invitation
      invitation = await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status,
          respondedAt: status !== 'pending' ? new Date() : null
        }
      })
    } else {
      // Create new invitation with response
      invitation = await this.prisma.invitation.create({
        data: {
          guestId,
          couple_id: guest.coupleId,
          invitationCode: randomBytes(4).toString('hex').toUpperCase(),
          status,
          respondedAt: status !== 'pending' ? new Date() : null
        }
      })
    }

    // Clear cache for the couple
    await this.clearEntityCache(guest.coupleId)

    return invitation
  }

  async getGuestByInvitationCode(code: string): Promise<Guest | null> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { invitationCode: code },
      include: {
        guest: {
          include: {
            couple: true
          }
        }
      }
    })

    return invitation?.guest || null
  }
}

// Export singleton instance
export const guestService = new GuestService()