import { prisma } from '@/lib/prisma'
import { Message, Prisma } from '@prisma/client'
import { BaseRepository } from '@/lib/repositories/BaseRepository'

export class MessageRepository extends BaseRepository<Message> {
  async findById(id: string): Promise<Message | null> {
    return this.executeQuery(() =>
      prisma.message.findUnique({ 
        where: { id }
      })
    )
  }

  async findByCoupleId(coupleId: string, filters?: {
    type?: 'email' | 'sms'
    status?: 'draft' | 'sent' | 'failed'
    recipientId?: string
    limit?: number
    offset?: number
  }): Promise<Message[]> {
    return this.executeQuery(() => {
      const where: Prisma.MessageWhereInput = { couple_id: coupleId }
      
      if (filters?.type) where.type = filters.type
      if (filters?.status) where.status = filters.status
      if (filters?.recipientId) where.recipient_id = filters.recipientId

      return prisma.message.findMany({ 
        where,
        orderBy: { created_at: 'desc' },
        take: filters?.limit,
        skip: filters?.offset
      })
    })
  }

  async create(data: Prisma.MessageCreateInput): Promise<Message> {
    return this.executeQuery(() =>
      prisma.message.create({ data })
    )
  }

  async createBulk(messages: Prisma.MessageCreateManyInput[]): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.message.createMany({ data: messages })
    )
  }

  async update(id: string, data: Prisma.MessageUpdateInput): Promise<Message> {
    return this.executeQuery(() =>
      prisma.message.update({ 
        where: { id },
        data
      })
    )
  }

  async updateStatus(id: string, status: 'sent' | 'failed', sentAt?: Date, error?: string): Promise<Message> {
    return this.executeQuery(() =>
      prisma.message.update({
        where: { id },
        data: {
          status,
          sent_at: sentAt,
          error_message: error
        }
      })
    )
  }

  async delete(id: string): Promise<Message> {
    return this.executeQuery(() =>
      prisma.message.delete({ where: { id } })
    )
  }

  async deleteMany(ids: string[]): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.message.deleteMany({ 
        where: { 
          id: { in: ids } 
        } 
      })
    )
  }

  async getStatsByCoupleId(coupleId: string): Promise<{
    totalMessages: number
    sentMessages: number
    failedMessages: number
    draftMessages: number
    emailMessages: number
    smsMessages: number
    successRate: number
  }> {
    return this.executeQuery(async () => {
      const [total, sent, failed, draft, email, sms] = await Promise.all([
        prisma.message.count({ where: { couple_id: coupleId } }),
        prisma.message.count({ where: { couple_id: coupleId, status: 'sent' } }),
        prisma.message.count({ where: { couple_id: coupleId, status: 'failed' } }),
        prisma.message.count({ where: { couple_id: coupleId, status: 'draft' } }),
        prisma.message.count({ where: { couple_id: coupleId, type: 'email' } }),
        prisma.message.count({ where: { couple_id: coupleId, type: 'sms' } })
      ])

      const successRate = total > 0 ? (sent / total) * 100 : 0

      return {
        totalMessages: total,
        sentMessages: sent,
        failedMessages: failed,
        draftMessages: draft,
        emailMessages: email,
        smsMessages: sms,
        successRate
      }
    })
  }

  async getRecentActivity(coupleId: string, days: number = 7): Promise<Array<{
    date: Date
    emailCount: number
    smsCount: number
    totalCount: number
  }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return this.executeQuery(async () => {
      const messages = await prisma.message.findMany({
        where: {
          couple_id: coupleId,
          created_at: { gte: startDate }
        },
        select: {
          created_at: true,
          type: true
        }
      })

      // Group by date
      const activityMap = messages.reduce((acc, message) => {
        const dateKey = message.created_at.toISOString().split('T')[0]
        
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: new Date(dateKey),
            emailCount: 0,
            smsCount: 0,
            totalCount: 0
          }
        }
        
        acc[dateKey].totalCount++
        if (message.type === 'email') {
          acc[dateKey].emailCount++
        } else if (message.type === 'sms') {
          acc[dateKey].smsCount++
        }
        
        return acc
      }, {} as Record<string, any>)

      return Object.values(activityMap).sort((a, b) => a.date.getTime() - b.date.getTime())
    })
  }

  async getMessagesByGuest(coupleId: string, guestId: string): Promise<Message[]> {
    return this.executeQuery(() =>
      prisma.message.findMany({
        where: {
          couple_id: coupleId,
          recipient_id: guestId
        },
        orderBy: { created_at: 'desc' }
      })
    )
  }

  async sendBulkMessages(coupleId: string, guestIds: string[], templateId: string, type: 'email' | 'sms'): Promise<{ count: number }> {
    return this.executeQuery(async () => {
      // Get template
      const template = await prisma.message.findFirst({
        where: {
          id: templateId,
          couple_id: coupleId,
          is_template: true
        }
      })

      if (!template) throw new Error('Template not found')

      // Get guests
      const guests = await prisma.guest.findMany({
        where: {
          id: { in: guestIds },
          coupleId
        }
      })

      // Create messages
      const messages = guests.map(guest => ({
        couple_id: coupleId,
        recipient_id: guest.id,
        recipient_name: guest.name || `${guest.firstName} ${guest.lastName}`,
        recipient_email: type === 'email' ? guest.email : null,
        recipient_phone: type === 'sms' ? guest.phone : null,
        type,
        subject: template.subject,
        content: template.content,
        status: 'draft' as const,
        metadata: {
          templateId: template.id,
          bulkSend: true
        }
      }))

      return prisma.message.createMany({ data: messages })
    })
  }
}