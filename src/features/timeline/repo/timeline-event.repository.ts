import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { BaseRepository } from '@/lib/repositories/BaseRepository'

export class TimelineEventRepository extends BaseRepository<any> {
  async findById(id: string): Promise<any | null> {
    return this.executeQuery(() =>
      prisma.timeline_events.findUnique({ 
        where: { id },
        include: {
          vendors: true
        }
      })
    )
  }

  async findByCoupleId(coupleId: string): Promise<any[]> {
    return this.executeQuery(() =>
      prisma.timeline_events.findMany({ 
        where: { couple_id: coupleId },
        include: {
          vendors: true
        },
        orderBy: { time: 'asc' }
      })
    )
  }

  async create(data: any): Promise<any> {
    return this.executeQuery(() =>
      prisma.timeline_events.create({ 
        data,
        include: {
          vendors: true
        }
      })
    )
  }

  async update(id: string, data: any): Promise<any> {
    return this.executeQuery(() =>
      prisma.timeline_events.update({ 
        where: { id },
        data,
        include: {
          vendors: true
        }
      })
    )
  }

  async delete(id: string): Promise<any> {
    return this.executeQuery(() =>
      prisma.timeline_events.delete({ 
        where: { id },
        include: {
          vendors: true
        }
      })
    )
  }

  async getByDate(coupleId: string, date: Date): Promise<any[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return this.executeQuery(() =>
      prisma.timeline_events.findMany({
        where: {
          couple_id: coupleId,
          time: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          vendors: true
        },
        orderBy: { time: 'asc' }
      })
    )
  }

  async toggleComplete(id: string): Promise<any> {
    return this.executeQuery(async () => {
      const event = await prisma.timeline_events.findUnique({ where: { id } })
      if (!event) throw new Error('Event not found')

      return prisma.timeline_events.update({
        where: { id },
        data: { is_completed: !event.is_completed },
        include: {
          vendors: true
        }
      })
    })
  }
}