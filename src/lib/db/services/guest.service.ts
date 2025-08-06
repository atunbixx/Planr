import { BaseService } from './base.service'
import { Guest, Prisma } from '@prisma/client'
import { GuestWithRelations, GuestStats, GuestImportData } from '@/types/api'
import { BadRequestException } from '@/lib/api/errors'

export class GuestService extends BaseService<Guest> {
  protected modelName = 'guest' as const

  // Get all guests for a couple with statistics
  async getGuestsByCouple(coupleId: string): Promise<{
    guests: GuestWithRelations[]
    stats: GuestStats
  }> {
    const guests = await this.prisma.guest.findMany({
      where: { coupleId },
      orderBy: [
        { group: 'asc' },
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    // Calculate statistics
    const stats: GuestStats = {
      total: guests.length,
      invited: guests.filter(g => g.inviteSent).length,
      attending: guests.filter(g => g.rsvpStatus === 'attending').length,
      notAttending: guests.filter(g => g.rsvpStatus === 'not_attending').length,
      pending: guests.filter(g => g.rsvpStatus === 'pending').length,
      withPlusOne: guests.filter(g => g.plusOne).length,
      withDietaryRestrictions: guests.filter(g => g.dietaryRestrictions).length
    }

    return { guests, stats }
  }

  // Get guests by group
  async getGuestsByGroup(
    coupleId: string,
    group: string
  ): Promise<GuestWithRelations[]> {
    return await this.findMany({
      where: { coupleId, group },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })
  }

  // Get guests by RSVP status
  async getGuestsByRsvpStatus(
    coupleId: string,
    rsvpStatus: 'pending' | 'attending' | 'not_attending'
  ): Promise<GuestWithRelations[]> {
    return await this.findMany({
      where: { coupleId, rsvpStatus },
      orderBy: [
        { group: 'asc' },
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })
  }

  // Create guest with validation
  async createGuest(coupleId: string, data: {
    firstName: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    group?: string
    tableNumber?: number
    dietaryRestrictions?: string
    notes?: string
    plusOne?: boolean
    inviteSent?: boolean
    rsvpStatus?: 'pending' | 'attending' | 'not_attending'
    rsvpDate?: string
  }): Promise<Guest> {
    if (!data.firstName) {
      throw new BadRequestException('First name is required')
    }

    // Validate email format if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new BadRequestException('Invalid email format')
    }

    return await this.create({
      ...data,
      coupleId,
      rsvpStatus: data.rsvpStatus || 'pending',
      rsvpDate: data.rsvpDate ? new Date(data.rsvpDate) : null
    })
  }

  // Update guest
  async updateGuest(
    id: string,
    coupleId: string,
    data: Partial<{
      firstName: string
      lastName: string
      email: string
      phone: string
      address: string
      group: string
      tableNumber: number
      dietaryRestrictions: string
      notes: string
      plusOne: boolean
      inviteSent: boolean
      rsvpStatus: 'pending' | 'attending' | 'not_attending'
      rsvpDate: string
    }>
  ): Promise<Guest> {
    // Verify ownership
    const guest = await this.findFirst({ id, coupleId })
    if (!guest) {
      throw new BadRequestException('Guest not found')
    }

    // Validate email format if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new BadRequestException('Invalid email format')
    }

    const updateData: any = { ...data }
    
    if (data.rsvpDate !== undefined) {
      updateData.rsvpDate = data.rsvpDate ? new Date(data.rsvpDate) : null
    }

    return await this.update(id, updateData)
  }

  // Bulk import guests
  async importGuests(
    coupleId: string,
    guests: GuestImportData[]
  ): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = []
    const validGuests: any[] = []

    guests.forEach((guest, index) => {
      if (!guest.firstName) {
        errors.push(`Row ${index + 1}: First name is required`)
        return
      }

      if (guest.email && !this.isValidEmail(guest.email)) {
        errors.push(`Row ${index + 1}: Invalid email format`)
        return
      }

      validGuests.push({
        ...guest,
        coupleId,
        rsvpStatus: guest.rsvpStatus || 'pending',
        rsvpDate: guest.rsvpDate ? new Date(guest.rsvpDate) : null
      })
    })

    if (validGuests.length === 0) {
      throw new BadRequestException('No valid guests to import')
    }

    const result = await this.createMany(validGuests)

    return {
      count: result.count,
      errors
    }
  }

  // Update RSVP status
  async updateRsvpStatus(
    id: string,
    coupleId: string,
    rsvpStatus: 'pending' | 'attending' | 'not_attending'
  ): Promise<Guest> {
    const guest = await this.findFirst({ id, coupleId })
    if (!guest) {
      throw new BadRequestException('Guest not found')
    }

    return await this.update(id, {
      rsvpStatus,
      rsvpDate: new Date()
    })
  }

  // Bulk update RSVP status
  async bulkUpdateRsvpStatus(
    coupleId: string,
    guestIds: string[],
    rsvpStatus: 'pending' | 'attending' | 'not_attending'
  ): Promise<{ count: number }> {
    return await this.updateMany(
      {
        id: { in: guestIds },
        coupleId
      },
      {
        rsvpStatus,
        rsvpDate: new Date()
      }
    )
  }

  // Send invites
  async markInvitesSent(
    coupleId: string,
    guestIds: string[]
  ): Promise<{ count: number }> {
    return await this.updateMany(
      {
        id: { in: guestIds },
        coupleId
      },
      {
        inviteSent: true,
        inviteSentDate: new Date()
      }
    )
  }

  // Search guests
  async searchGuests(
    coupleId: string,
    searchTerm: string
  ): Promise<GuestWithRelations[]> {
    return await this.findMany({
      where: {
        coupleId,
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })
  }

  // Get guest groups
  async getGuestGroups(coupleId: string): Promise<string[]> {
    const guests = await this.prisma.guest.findMany({
      where: { coupleId },
      select: { group: true },
      distinct: ['group']
    })

    return guests
      .map(g => g.group)
      .filter(Boolean) as string[]
  }

  // Get dietary restrictions summary
  async getDietaryRestrictionsSummary(coupleId: string): Promise<{
    restriction: string
    count: number
  }[]> {
    const guests = await this.prisma.guest.findMany({
      where: {
        coupleId,
        dietaryRestrictions: { not: null }
      },
      select: { dietaryRestrictions: true }
    })

    const summary = guests.reduce((acc, guest) => {
      const restriction = guest.dietaryRestrictions!
      acc[restriction] = (acc[restriction] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(summary)
      .map(([restriction, count]) => ({ restriction, count }))
      .sort((a, b) => b.count - a.count)
  }

  // Helper method to validate email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}