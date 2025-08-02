import { prisma } from '@/lib/prisma'

export interface MessageThread {
  id: string
  vendorId: string
  vendorName: string
  lastMessage: string
  lastMessageAt: Date
  unreadCount: number
  messages: Message[]
}

export interface Message {
  id: string
  threadId: string
  senderType: 'couple' | 'vendor'
  senderName: string
  content: string
  isRead: boolean
  readAt?: Date
  createdAt: Date
  attachments?: string[]
}

export interface MessageDeliveryStatus {
  messageId: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: Date
}

export class MessagingService {
  // Get all message threads for a couple
  static async getMessageThreads(coupleId: string): Promise<MessageThread[]> {
    const threads = await prisma.message_threads.findMany({
      where: { couple_id: coupleId },
      include: {
        vendor_messages: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      },
      orderBy: { last_message_at: 'desc' }
    })

    const threadData: MessageThread[] = []

    for (const thread of threads) {
      const vendor = await prisma.vendors.findUnique({
        where: { id: thread.vendor_id || '' },
        select: { business_name: true }
      })

      const unreadCount = await prisma.vendor_messages.count({
        where: {
          thread_id: thread.id,
          is_read: false,
          sender_type: 'vendor'
        }
      })

      const messages = await this.getThreadMessages(thread.id)

      threadData.push({
        id: thread.id,
        vendorId: thread.vendor_id || '',
        vendorName: vendor?.business_name || 'Unknown Vendor',
        lastMessage: thread.vendor_messages[0]?.content || '',
        lastMessageAt: thread.last_message_at,
        unreadCount,
        messages
      })
    }

    return threadData
  }

  // Get messages for a specific thread
  static async getThreadMessages(threadId: string): Promise<Message[]> {
    const messages = await prisma.vendor_messages.findMany({
      where: { thread_id: threadId },
      orderBy: { created_at: 'asc' }
    })

    return messages.map(msg => ({
      id: msg.id,
      threadId: msg.thread_id,
      senderType: msg.sender_type as 'couple' | 'vendor',
      senderName: msg.sender_name || 'Unknown',
      content: msg.content,
      isRead: msg.is_read,
      readAt: msg.read_at || undefined,
      createdAt: msg.created_at
    }))
  }

  // Send a message
  static async sendMessage(data: {
    coupleId: string
    vendorId: string
    senderType: 'couple' | 'vendor'
    senderName: string
    content: string
    threadId?: string
  }) {
    // Get or create thread
    let thread
    if (data.threadId) {
      thread = await prisma.message_threads.findUnique({
        where: { id: data.threadId }
      })
    } else {
      thread = await prisma.message_threads.findFirst({
        where: {
          couple_id: data.coupleId,
          vendor_id: data.vendorId
        }
      })
    }

    if (!thread) {
      thread = await prisma.message_threads.create({
        data: {
          couple_id: data.coupleId,
          vendor_id: data.vendorId,
          last_message_at: new Date()
        }
      })
    }

    // Create the message
    const message = await prisma.vendor_messages.create({
      data: {
        thread_id: thread.id,
        couple_id: data.coupleId,
        vendor_id: data.vendorId,
        sender_type: data.senderType,
        sender_name: data.senderName,
        content: data.content,
        is_read: false
      }
    })

    // Update thread last message time
    await prisma.message_threads.update({
      where: { id: thread.id },
      data: { last_message_at: new Date() }
    })

    return message
  }

  // Mark messages as read
  static async markMessagesAsRead(threadId: string, userId: string) {
    await prisma.vendor_messages.updateMany({
      where: {
        thread_id: threadId,
        is_read: false
      },
      data: {
        is_read: true,
        read_at: new Date()
      }
    })
  }

  // Get unread message count for couple
  static async getUnreadCount(coupleId: string): Promise<number> {
    return await prisma.vendor_messages.count({
      where: {
        couple_id: coupleId,
        is_read: false,
        sender_type: 'vendor'
      }
    })
  }

  // Send message to vendor via external service (SMS/WhatsApp/Email)
  static async sendExternalMessage(data: {
    vendorId: string
    coupleId: string
    content: string
    method: 'sms' | 'whatsapp' | 'email'
  }) {
    // Log the outbound message
    const log = await prisma.outbound_message_log.create({
      data: {
        vendor_id: data.vendorId,
        couple_id: data.coupleId,
        message_content: data.content,
        sms_sent: data.method === 'sms',
        whatsapp_sent: data.method === 'whatsapp',
        email_sent: data.method === 'email',
        metadata: {
          method: data.method,
          timestamp: new Date().toISOString()
        }
      }
    })

    // Here you would integrate with actual SMS/WhatsApp/Email services
    // For now, we'll just return the log entry
    return log
  }

  // Get message delivery status
  static async getDeliveryStatus(messageId: string): Promise<MessageDeliveryStatus | null> {
    const message = await prisma.vendor_messages.findUnique({
      where: { id: messageId }
    })

    if (!message) return null

    let status: 'sent' | 'delivered' | 'read' | 'failed' = 'sent'
    
    if (message.is_read) {
      status = 'read'
    } else if (message.created_at) {
      status = 'delivered'
    }

    return {
      messageId: message.id,
      status,
      timestamp: message.read_at || message.created_at
    }
  }

  // Create quick reply templates
  static async getQuickReplyTemplates(vendorCategory?: string) {
    const templates = [
      'Thank you for your message. We\'ll get back to you soon!',
      'Could you please send us more details about your requirements?',
      'We\'d love to schedule a consultation. When would work best for you?',
      'Thank you for choosing us for your special day!',
      'We have availability on that date. Let\'s discuss the details.',
    ]

    // Add category-specific templates
    if (vendorCategory === 'photography') {
      templates.push(
        'We\'d love to capture your special moments! Let\'s discuss your vision.',
        'Do you have a preferred photography style? (candid, posed, artistic)'
      )
    } else if (vendorCategory === 'catering') {
      templates.push(
        'We can accommodate dietary restrictions. Please let us know your needs.',
        'Would you like to schedule a tasting session?'
      )
    }

    return templates
  }

  // Search messages
  static async searchMessages(coupleId: string, query: string) {
    const messages = await prisma.vendor_messages.findMany({
      where: {
        couple_id: coupleId,
        content: {
          contains: query,
          mode: 'insensitive'
        }
      },
      include: {
        message_threads: {
          include: {
            vendors: {
              select: { business_name: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 50
    })

    return messages
  }
}