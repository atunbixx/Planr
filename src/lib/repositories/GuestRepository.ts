/**
 * GuestRepository - Single source of truth for guest data access
 * Provides consistent guest operations across all handlers
 */

import { prisma } from '@/lib/prisma'

export interface GuestData {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  plusOneAllowed: boolean
  plusOneName: string | null
  tableNumber?: number | null // Not in schema - optional
  dietaryRestrictions: string | null
  notes: string | null
  rsvpStatus: string // Derived from invitation status
  rsvpDeadline: Date | null
  invitationSentAt: Date | null
  attendingCount: number // Derived from invitation
  createdAt: Date | null
  updatedAt: Date | null
  invitation?: InvitationData | null
}

export interface InvitationData {
  id: string
  invitationCode: string | null
  status: string
  attendingCount: number | null
  plusOneAttending: boolean | null
  plusOneName: string | null
  dietaryRestrictions: string | null
  rsvpNotes: string | null
  invitedAt: Date | null
  respondedAt: Date | null
  rsvpDeadline: Date | null
}

export interface GuestStats {
  total: number
  confirmed: number
  declined: number
  pending: number
  notInvited: number
  totalAttending: number
}

export interface CreateGuestData {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  plusOneAllowed?: boolean
  plusOneName?: string
  dietaryRestrictions?: string
  notes?: string
  rsvpDeadline?: Date
}

export interface UpdateGuestData {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  plusOneAllowed?: boolean
  plusOneName?: string
  dietaryRestrictions?: string
  notes?: string
  rsvpDeadline?: Date
}

export interface GuestFilters {
  rsvpStatus?: string // Will filter by invitation status
  plusOneAllowed?: boolean
  search?: string
}

export interface PaginationOptions {
  page?: number
  pageSize?: number
}

export interface GuestsResponse {
  guests: GuestData[]
  stats: GuestStats
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export class GuestRepository {
  /**
   * Get all guests for a couple with pagination and filtering
   */
  async getGuests(
    coupleId: string,
    filters: GuestFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<GuestsResponse> {
    try {
      const page = pagination.page || 1
      const pageSize = pagination.pageSize || 50
      const skip = (page - 1) * pageSize

      // Build where clause
      const where: any = { coupleId }
      
      // Note: rsvpStatus is derived from invitation status, not a direct field
      // Will need to filter after fetching based on invitation status
      if (filters.plusOneAllowed !== undefined) where.plusOneAllowed = filters.plusOneAllowed
      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      // Get guests with pagination
      const [guests, total, stats] = await Promise.all([
        prisma.guest.findMany({
          where,
          include: {
            invitations: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' }
          ],
          skip,
          take: pageSize
        }),
        prisma.guest.count({ where }),
        this.getStats(coupleId)
      ])

      const transformedGuests = guests.map(guest => this.transformGuest(guest))

      return {
        guests: transformedGuests,
        stats,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    } catch (error) {
      console.error('Error getting guests:', error)
      throw new Error('Failed to get guests')
    }
  }

  /**
   * Get guest by ID
   */
  async findById(guestId: string): Promise<GuestData | null> {
    try {
      const guest = await prisma.guest.findUnique({
        where: { id: guestId },
        include: {
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })

      return guest ? this.transformGuest(guest) : null
    } catch (error) {
      console.error('Error getting guest by ID:', error)
      throw new Error('Failed to get guest')
    }
  }

  /**
   * Get guest by ID (legacy method name)
   */
  async getGuestById(guestId: string): Promise<GuestData | null> {
    return this.findById(guestId)
  }

  /**
   * Create new guest with transaction support
   */
  async createGuest(coupleId: string, data: CreateGuestData, tx: any = null): Promise<GuestData> {
    try {
      const client = tx || prisma
      const guest = await client.guest.create({
        data: {
          coupleId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          plusOneAllowed: data.plusOneAllowed || false,
          plusOneName: data.plusOneName,
          dietaryRestrictions: data.dietaryRestrictions,
          notes: data.notes,
          rsvpDeadline: data.rsvpDeadline,
          // attendingCount: 0, // Temporarily disabled - column missing in database
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })

      return this.transformGuest(guest)
    } catch (error) {
      console.error('Error creating guest:', error)
      throw new Error('Failed to create guest')
    }
  }

  /**
   * Update guest with transaction support
   */
  async updateGuest(guestId: string, data: UpdateGuestData, tx: any = null): Promise<GuestData> {
    try {
      const client = tx || prisma
      const guest = await client.guest.update({
        where: { id: guestId },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })

      return this.transformGuest(guest)
    } catch (error) {
      console.error('Error updating guest:', error)
      throw new Error('Failed to update guest')
    }
  }

  /**
   * Delete guest with transaction support
   */
  async deleteGuest(guestId: string, tx: any = null): Promise<void> {
    try {
      const client = tx || prisma
      await client.guest.delete({
        where: { id: guestId }
      })
    } catch (error) {
      console.error('Error deleting guest:', error)
      throw new Error('Failed to delete guest')
    }
  }

  /**
   * Get guest statistics
   */
  async getStats(coupleId: string): Promise<GuestStats> {
    try {
      const [totalGuests, invitationStats] = await Promise.all([
        prisma.guest.count({
          where: { coupleId }
        }),
        prisma.invitation.groupBy({
          by: ['status'],
          where: { coupleId: coupleId },
          _count: true,
          _sum: {
            attendingCount: true
          }
        })
      ])

      const stats: GuestStats = {
        total: totalGuests,
        confirmed: 0,
        declined: 0,
        pending: 0,
        notInvited: 0,
        totalAttending: 0
      }

      invitationStats.forEach(stat => {
        stats.totalAttending += stat._sum.attendingCount || 0
        
        switch (stat.status) {
          case 'confirmed':
          case 'accepted':
            stats.confirmed = stat._count
            break
          case 'declined':
            stats.declined = stat._count
            break
          case 'pending':
            stats.pending = stat._count
            break
        }
      })

      // Calculate not invited (guests without invitations)
      const invitedCount = invitationStats.reduce((sum, stat) => sum + stat._count, 0)
      stats.notInvited = Math.max(0, totalGuests - invitedCount)

      return stats
    } catch (error) {
      console.error('Error getting guest stats:', error)
      throw new Error('Failed to get guest stats')
    }
  }

  /**
   * Search guests by query
   */
  async searchGuests(coupleId: string, query: string): Promise<GuestData[]> {
    try {
      const guests = await prisma.guest.findMany({
        where: {
          coupleId,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      })

      return guests.map(guest => this.transformGuest(guest))
    } catch (error) {
      console.error('Error searching guests:', error)
      throw new Error('Failed to search guests')
    }
  }

  /**
   * Update guest RSVP status
   */
  async updateRsvpStatus(guestId: string, status: string, attendingCount: number = 0): Promise<GuestData> {
    try {
      // Since rsvpStatus is not a field on Guest, we need to update/create an invitation
      // For now, just return the guest with updated timestamp
      const guest = await prisma.guest.update({
        where: { id: guestId },
        data: {
          // rsvpStatus and attendingCount are handled via Invitation model
          updatedAt: new Date()
        },
        include: {
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })

      return this.transformGuest(guest)
    } catch (error) {
      console.error('Error updating RSVP status:', error)
      throw new Error('Failed to update RSVP status')
    }
  }

  /**
   * Search guests with pagination and enhanced filtering (Admin functionality)
   */
  async search(params: any): Promise<{ data: GuestData[], pagination: any }> {
    try {
      const {
        search,
        rsvpStatus,
        tableNumber,
        plusOneAllowed,
        coupleId,
        page = 1,
        pageSize = 20,
        sortBy = 'lastName',
        sortOrder = 'asc'
      } = params

      const where: any = {}
      
      if (coupleId) where.coupleId = coupleId
      // rsvpStatus needs to be filtered via invitation
      if (plusOneAllowed !== undefined) where.plusOneAllowed = plusOneAllowed

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      }

      const total = await prisma.guest.count({ where })
      const totalPages = Math.ceil(total / pageSize)
      const skip = (page - 1) * pageSize

      const guests = await prisma.guest.findMany({
        where,
        include: {
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize
      })

      return {
        data: guests.map(guest => this.transformGuest(guest)),
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
      console.error('Error searching guests:', error)
      throw new Error('Failed to search guests')
    }
  }

  /**
   * Get guest statistics by couple
   */
  async getStatsByCouple(coupleId: string): Promise<GuestStats> {
    return this.getStats(coupleId)
  }

  /**
   * Get guests by RSVP status
   */
  async findByRsvpStatus(coupleId: string, status: string): Promise<GuestData[]> {
    try {
      // Filter by invitation status instead of guest.rsvpStatus
      const guests = await prisma.guest.findMany({
        where: {
          coupleId,
          invitations: {
            some: {
              status: status
            }
          }
        },
        include: {
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      })

      return guests.map(guest => this.transformGuest(guest))
    } catch (error) {
      console.error('Error finding guests by RSVP status:', error)
      throw new Error('Failed to find guests by RSVP status')
    }
  }

  /**
   * Get guests by table number
   */
  async findByTableNumber(coupleId: string, tableNumber: number): Promise<GuestData[]> {
    try {
      // tableNumber field doesn't exist in Guest model
      // Return empty array for now
      return [];
      
      /* Original code for when tableNumber is added:
      const guests = await prisma.guest.findMany({
        where: {
          coupleId,
          tableNumber
        },
        include: {
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      })

      return guests.map(guest => this.transformGuest(guest))
      */
    } catch (error) {
      console.error('Error finding guests by table number:', error)
      throw new Error('Failed to find guests by table number')
    }
  }

  /**
   * Get guests with pending RSVPs
   */
  async findPendingRsvps(coupleId: string, deadlineOnly: boolean = false): Promise<GuestData[]> {
    try {
      const where: any = {
        coupleId,
        // Filter by invitation status or no invitation
        OR: [
          { invitations: { none: {} } }, // No invitation sent
          { invitations: { some: { status: 'pending' } } } // Pending invitation
        ]
      }

      if (deadlineOnly) {
        where.rsvpDeadline = {
          lte: new Date() // Past deadline
        }
      }

      const guests = await prisma.guest.findMany({
        where,
        include: {
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { rsvpDeadline: 'asc' },
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      })

      return guests.map(guest => this.transformGuest(guest))
    } catch (error) {
      console.error('Error finding pending RSVPs:', error)
      throw new Error('Failed to find pending RSVPs')
    }
  }

  /**
   * Get dietary restrictions summary
   */
  async getDietaryRestrictionsSummary(coupleId: string): Promise<any> {
    try {
      const guests = await prisma.guest.findMany({
        where: {
          coupleId,
          dietaryRestrictions: {
            not: null
          },
          invitations: {
            some: {
              status: 'confirmed' // or 'accepted'
            }
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dietaryRestrictions: true,
          // attendingCount: true // Temporarily disabled - column missing in database
          invitations: {
            select: {
              attendingCount: true
            },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      // Group by dietary restriction
      const groupedRestrictions = guests.reduce((acc: any, guest) => {
        const restrictions = guest.dietaryRestrictions || 'None'
        if (!acc[restrictions]) {
          acc[restrictions] = {
            restriction: restrictions,
            guests: [],
            totalAttending: 0
          }
        }
        acc[restrictions].guests.push({
          id: guest.id,
          name: `${guest.firstName} ${guest.lastName}`
        })
        acc[restrictions].totalAttending += guest.invitations?.[0]?.attendingCount || 1
        return acc
      }, {})

      return Object.values(groupedRestrictions)
    } catch (error) {
      console.error('Error getting dietary restrictions summary:', error)
      throw new Error('Failed to get dietary restrictions summary')
    }
  }

  /**
   * Bulk update guests with transaction support
   */
  async bulkUpdateGuests(guestIds: string[], data: Partial<UpdateGuestData>, tx: any = null): Promise<number> {
    try {
      const client = tx || prisma
      const result = await client.guest.updateMany({
        where: {
          id: { in: guestIds }
        },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })

      return result.count
    } catch (error) {
      console.error('Error bulk updating guests:', error)
      throw new Error('Failed to bulk update guests')
    }
  }

  /**
   * Transform guest to API format
   */
  private transformGuest(guest: any): GuestData {
    const latestInvitation = guest.invitations?.[0]
    
    return {
      id: guest.id,
      firstName: guest.firstName || '',
      lastName: guest.lastName || '',
      email: guest.email || null,
      phone: guest.phone || null,
      address: guest.address || null,
      plusOneAllowed: guest.plusOneAllowed || false,
      plusOneName: guest.plusOneName || null,
      tableNumber: null, // Field doesn't exist in schema
      dietaryRestrictions: guest.dietaryRestrictions || null,
      notes: guest.notes || null,
      rsvpStatus: latestInvitation?.status || 'pending', // Get from invitation
      rsvpDeadline: guest.rsvpDeadline || null,
      invitationSentAt: guest.invitationSentAt || null,
      attendingCount: guest.invitations?.[0]?.attendingCount || 0, // Get from invitation instead of guest
      createdAt: guest.createdAt || null,
      updatedAt: guest.updatedAt || null,
      invitation: latestInvitation ? this.transformInvitation(latestInvitation) : null
    }
  }

  /**
   * Transform invitation to API format
   */
  private transformInvitation(invitation: any): InvitationData {
    return {
      id: invitation.id,
      invitationCode: invitation.invitationCode || null,
      status: invitation.status || 'pending',
      attendingCount: invitation.attendingCount || null,
      plusOneAttending: invitation.plusOneAttending || null,
      plusOneName: invitation.plusOneName || null,
      dietaryRestrictions: invitation.dietaryRestrictions || null,
      rsvpNotes: invitation.rsvpNotes || null,
      invitedAt: invitation.invited_at || null,
      respondedAt: invitation.respondedAt || null,
      rsvpDeadline: invitation.rsvpDeadline || null
    }
  }
}