import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BaseApiHandler, NotFoundException, BadRequestException } from '../base-handler'
import { prisma } from '@/lib/prisma'
import { toApiFormat, toDbFormat } from '@/lib/db/transformations'

// Validation schemas
const createMessageSchema = z.object({
  recipientId: z.string().uuid(),
  subject: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['email', 'sms', 'whatsapp']).default('email'),
  status: z.enum(['draft', 'scheduled', 'sent', 'failed']).default('draft'),
  scheduledFor: z.string().optional(),
  templateId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional()
})

const updateMessageSchema = createMessageSchema.partial().omit({ recipientId: true })

const createTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['email', 'sms', 'whatsapp']).default('email'),
  category: z.string().default('general'),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
})

const updateTemplateSchema = createTemplateSchema.partial()

const sendMessageSchema = z.object({
  recipientIds: z.array(z.string().uuid()).min(1),
  subject: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['email', 'sms', 'whatsapp']).default('email'),
  templateId: z.string().uuid().optional(),
  variables: z.record(z.string()).optional(),
  scheduledFor: z.string().optional()
})

export class MessagesHandlerV2 extends BaseApiHandler {
  protected model = 'Message' as const
  
  // Message methods
  async listMessages(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Parse query parameters
      const url = new URL(request.url)
      const status = url.searchParams.get('status')
      const type = url.searchParams.get('type')
      const recipientId = url.searchParams.get('recipientId')
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      
      let whereClause: any = { coupleId }
      
      if (status) whereClause.status = status
      if (type) whereClause.messageType = type
      if (recipientId) whereClause.recipient_id = recipientId
      
      const skip = (page - 1) * limit
      
      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' as const },
          skip,
          take: limit
        }),
        prisma.message.count({ where: whereClause })
      ])
      
      // Get message statistics
      const stats = await prisma.message.groupBy({
        by: ['status', 'messageType'],
        where: { coupleId },
        _count: true
      })
      
      return {
        messages: messages.map(message => ({
          ...toApiFormat(message, 'Message')
        })),
        stats: {
          total,
          byStatus: stats.reduce((acc, stat) => {
            acc[stat.status] = (acc[stat.status] || 0) + stat._count
            return acc
          }, {} as Record<string, number>),
          byType: stats.reduce((acc, stat) => {
            acc[stat.messageType] = (acc[stat.messageType] || 0) + stat._count
            return acc
          }, {} as Record<string, number>)
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  }
  
  async createMessage(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, createMessageSchema)
      
      // Verify recipient belongs to this couple
      const recipient = await prisma.guest.findFirst({
        where: {
          id: data.recipientId,
          coupleId
        }
      })
      
      if (!recipient) {
        throw new NotFoundException('Recipient not found')
      }
      
      // Transform to database format
      const dbData = toDbFormat({
        ...data,
        coupleId
      }, 'Message')
      
      const message = await prisma.message.create({
        data: {
          coupleId,
          recipient_id: dbData.recipientId,
          subject: dbData.subject,
          content: dbData.content,
          messageType: dbData.type,
          status: dbData.status,
          sentAt: dbData.status === 'sent' ? new Date() : new Date(),
          metadata: dbData.metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      return toApiFormat(message, 'Message')
    })
  }
  
  async updateMessage(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updateMessageSchema)
      
      // Check if message belongs to this couple
      const existingMessage = await prisma.message.findFirst({
        where: {
          id: id,
          coupleId
        }
      })
      
      if (!existingMessage) {
        throw new NotFoundException('Message not found')
      }
      
      // Can't update sent messages
      if (existingMessage.status === 'sent') {
        throw new BadRequestException('Cannot update sent messages')
      }
      
      // Transform to database format
      const dbData = toDbFormat(data, 'Message')
      
      const updatedMessage = await prisma.message.update({
        where: { id },
        data: {
          subject: dbData.subject,
          content: dbData.content,
          messageType: dbData.type,
          status: dbData.status,
          metadata: dbData.metadata,
          updatedAt: new Date()
        }
      })
      
      return toApiFormat(updatedMessage, 'Message')
    })
  }
  
  async deleteMessage(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Check if message belongs to this couple
      const existingMessage = await prisma.message.findFirst({
        where: {
          id: id,
          coupleId
        }
      })
      
      if (!existingMessage) {
        throw new NotFoundException('Message not found')
      }
      
      // Can't delete sent messages
      if (existingMessage.status === 'sent') {
        throw new BadRequestException('Cannot delete sent messages')
      }
      
      await prisma.message.delete({
        where: { id }
      })
      
      return { success: true }
    })
  }
  
  // Send messages
  async sendMessages(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, sendMessageSchema)
      
      // Verify all recipients belong to this couple
      const recipients = await prisma.guest.findMany({
        where: {
          id: { in: data.recipientIds },
          coupleId
        }
      })
      
      if (recipients.length !== data.recipientIds.length) {
        throw new NotFoundException('One or more recipients not found')
      }
      
      // If using template, fetch it
      let template = null
      if (data.templateId) {
        template = await prisma.messageTemplate.findFirst({
          where: {
            id: data.templateId,
            coupleId
          }
        })
        
        if (!template) {
          throw new NotFoundException('Template not found')
        }
      }
      
      // Create messages for each recipient
      const messages = await prisma.$transaction(async (tx) => {
        const createdMessages = []
        
        for (const recipientId of data.recipientIds) {
          const recipient = recipients.find(r => r.id === recipientId)!
          
          // Process template variables if template is used
          let subject = data.subject || template?.subject || ''
          let content = data.content || template?.content || ''
          
          if (data.variables) {
            // Replace variables in content
            Object.entries(data.variables).forEach(([key, value]) => {
              subject = subject.replace(`{{${key}}}`, String(value))
              content = content.replace(`{{${key}}}`, String(value))
            })
          }
          
          // Add recipient-specific variables
          subject = subject.replace('{{firstName}}', recipient.firstName || '')
          subject = subject.replace('{{lastName}}', recipient.lastName || '')
          content = content.replace('{{firstName}}', recipient.firstName || '')
          content = content.replace('{{lastName}}', recipient.lastName || '')
          
          const message = await tx.message.create({
            data: {
              coupleId,
              recipient_id: recipientId,
              subject,
              content,
              messageType: data.type,
              status: data.scheduledFor ? 'scheduled' : 'sent',
              sentAt: data.scheduledFor ? new Date() : new Date(),
              template_id: data.templateId,
              metadata: data.variables,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
          
          createdMessages.push(message)
          
          // Here you would integrate with actual messaging services
          // For now, we'll just mark as sent
          if (!data.scheduledFor) {
            // TODO: Send actual email/SMS/WhatsApp
            console.log(`Sending ${data.type} to ${recipient.email || recipient.phone}`)
          }
        }
        
        return createdMessages
      })
      
      return {
        success: true,
        count: messages.length,
        messages: messages.map(msg => toApiFormat(msg, 'Message'))
      }
    })
  }
  
  // Template methods
  async listTemplates(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      const templates = await prisma.messageTemplate.findMany({
        where: { coupleId },
        orderBy: { createdAt: 'desc' }
      })
      
      return templates.map(template => toApiFormat(template, 'MessageTemplate'))
    })
  }
  
  async createTemplate(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, createTemplateSchema)
      
      // Transform to database format
      const dbData = toDbFormat({
        ...data,
        coupleId
      }, 'MessageTemplate')
      
      const template = await prisma.messageTemplate.create({
        data: {
          coupleId,
          name: dbData.name,
          subject: dbData.subject,
          content: dbData.content,
          type: dbData.type,
          category: dbData.category,
          variables: dbData.variables,
          isActive: dbData.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      return toApiFormat(template, 'MessageTemplate')
    })
  }
  
  async updateTemplate(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updateTemplateSchema)
      
      // Check if template belongs to this couple
      const existingTemplate = await prisma.messageTemplate.findFirst({
        where: {
          id: id,
          coupleId
        }
      })
      
      if (!existingTemplate) {
        throw new NotFoundException('Template not found')
      }
      
      // Transform to database format
      const dbData = toDbFormat(data, 'MessageTemplate')
      
      const updatedTemplate = await prisma.messageTemplate.update({
        where: { id },
        data: {
          name: dbData.name,
          subject: dbData.subject,
          content: dbData.content,
          type: dbData.type,
          category: dbData.category,
          variables: dbData.variables,
          isActive: dbData.isActive,
          updatedAt: new Date()
        }
      })
      
      return toApiFormat(updatedTemplate, 'MessageTemplate')
    })
  }
  
  async deleteTemplate(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Check if template belongs to this couple
      const existingTemplate = await prisma.messageTemplate.findFirst({
        where: {
          id: id,
          coupleId
        }
      })
      
      if (!existingTemplate) {
        throw new NotFoundException('Template not found')
      }
      
      await prisma.messageTemplate.delete({
        where: { id }
      })
      
      return { success: true }
    })
  }
  
  // Get message logs
  async getMessageLogs(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Parse query parameters
      const url = new URL(request.url)
      const messageId = url.searchParams.get('messageId')
      const startDate = url.searchParams.get('startDate')
      const endDate = url.searchParams.get('endDate')
      
      let whereClause: any = { coupleId }
      
      if (messageId) whereClause.messageId = messageId
      if (startDate || endDate) {
        whereClause.created_at = {}
        if (startDate) whereClause.created_at.gte = new Date(startDate)
        if (endDate) whereClause.created_at.lte = new Date(endDate)
      }
      
      const logs = await prisma.messageLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' as const },
        include: {
          message: {
            select: {
              id: true,
              subject: true,
              messageType: true
            }
          }
        }
      })
      
      return logs.map(log => ({
        ...toApiFormat(log, 'MessageLog'),
        message: log.message ? {
          id: log.message.id,
          subject: log.message.subject,
          type: log.message.messageType
        } : null
      }))
    })
  }
}