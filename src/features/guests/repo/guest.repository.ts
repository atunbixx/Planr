import { prisma } from '@/lib/prisma'
import { Guest, Prisma } from '@prisma/client'
import { BaseRepository } from '@/lib/repositories/BaseRepository'

export class GuestRepository extends BaseRepository<Guest> {
  async findById(id: string): Promise<Guest | null> {
    return this.executeQuery(() =>
      prisma.guest.findUnique({ where: { id } })
    )
  }

  async findByCoupleId(coupleId: string): Promise<Guest[]> {
    return this.executeQuery(() =>
      prisma.guest.findMany({ 
        where: { coupleId },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      })
    )
  }

  async findByEmail(email: string, coupleId: string): Promise<Guest | null> {
    return this.executeQuery(() =>
      prisma.guest.findFirst({ 
        where: { 
          email,
          coupleId 
        } 
      })
    )
  }

  async findByInvitationCode(invitationCode: string): Promise<Guest | null> {
    return this.executeQuery(async () => {
      const invitation = await prisma.invitation.findUnique({
        where: { invitationCode },
        include: { guest: true }
      })
      return invitation?.guest || null
    })
  }

  async create(data: Prisma.GuestCreateInput): Promise<Guest> {
    return this.executeQuery(() =>
      prisma.guest.create({ data })
    )
  }

  async createMany(data: Prisma.GuestCreateManyInput[]): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.guest.createMany({ data })
    )
  }

  async update(id: string, data: Prisma.GuestUpdateInput): Promise<Guest> {
    return this.executeQuery(() =>
      prisma.guest.update({ 
        where: { id },
        data 
      })
    )
  }

  async updateRsvp(id: string, attendingStatus: string, additionalGuests?: number, dietaryRestrictions?: string): Promise<Guest> {
    return this.executeQuery(() =>
      prisma.guest.update({
        where: { id },
        data: {
          attendingStatus,
          additionalGuests,
          dietaryRestrictions,
          rsvpDate: new Date()
        }
      })
    )
  }

  async delete(id: string): Promise<Guest> {
    return this.executeQuery(() =>
      prisma.guest.delete({ where: { id } })
    )
  }

  async deleteMany(ids: string[]): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.guest.deleteMany({ 
        where: { 
          id: { in: ids } 
        } 
      })
    )
  }

  async countByCoupleId(coupleId: string): Promise<number> {
    return this.executeQuery(() =>
      prisma.guest.count({ where: { coupleId } })
    )
  }

  async getStatsByCoupleId(coupleId: string): Promise<{
    total: number
    confirmed: number
    declined: number
    pending: number
    dietary: number
    plusOnes: number
  }> {
    return this.executeQuery(async () => {
      const [total, confirmed, declined, pending, dietary, plusOnes] = await Promise.all([
        prisma.guest.count({ where: { coupleId } }),
        prisma.guest.count({ where: { coupleId, attendingStatus: 'confirmed' } }),
        prisma.guest.count({ where: { coupleId, attendingStatus: 'declined' } }),
        prisma.guest.count({ where: { coupleId, attendingStatus: 'pending' } }),
        prisma.guest.count({ where: { coupleId, dietaryRestrictions: { not: null } } }),
        prisma.guest.aggregate({
          where: { coupleId },
          _sum: { additionalGuests: true }
        })
      ])

      return {
        total,
        confirmed,
        declined,
        pending,
        dietary,
        plusOnes: plusOnes._sum.additionalGuests || 0
      }
    })
  }

  async updateTableAssignments(assignments: { guestId: string; tableId: string }[]): Promise<void> {
    return this.withTransaction(async (tx) => {
      await Promise.all(
        assignments.map(({ guestId, tableId }) =>
          tx.guest.update({
            where: { id: guestId },
            data: { tableAssignment: tableId }
          })
        )
      )
    })
  }
}