import { BaseRepository } from './base.repository'
import { Guest, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export class GuestRepository extends BaseRepository<Guest> {
  protected model = this.prisma.guest

  async findByCouple(coupleId: string, options?: {
    skip?: number
    take?: number
    orderBy?: any
    include?: any
  }): Promise<Guest[]> {
    return await this.model.findMany({
      where: { coupleId },
      ...options
    })
  }

  async findByInvitationCode(code: string): Promise<Guest | null> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { invitationCode: code },
      include: {
        guest: true
      }
    })
    return invitation?.guest || null
  }

  async countByCouple(coupleId: string): Promise<number> {
    return await this.model.count({
      where: { coupleId }
    })
  }

  async findWithInvitations(guestId: string): Promise<Guest | null> {
    return await this.model.findUnique({
      where: { id: guestId },
      include: {
        invitations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }

  async bulkCreate(coupleId: string, guests: Prisma.GuestCreateInput[]): Promise<number> {
    const data = guests.map(guest => ({
      ...guest,
      coupleId
    }))
    return await this.createMany(data)
  }

  async getStatsByCouple(coupleId: string): Promise<{
    total: number
    withPlusOne: number
    byRelationship: Record<string, number>
    bySide: Record<string, number>
  }> {
    const guests = await this.findByCouple(coupleId)
    
    const stats = {
      total: guests.length,
      withPlusOne: 0,
      byRelationship: {} as Record<string, number>,
      bySide: {} as Record<string, number>
    }

    guests.forEach(guest => {
      if (guest.plusOneAllowed) stats.withPlusOne++
      
      const relationship = guest.relationship || 'other'
      stats.byRelationship[relationship] = (stats.byRelationship[relationship] || 0) + 1
      
      const side = guest.side || 'both'
      stats.bySide[side] = (stats.bySide[side] || 0) + 1
    })

    return stats
  }
}

// Export singleton instance
export const guestRepository = new GuestRepository()