import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { MessagingService, SendMessageRequest, BulkSendRequest } from '../service/messaging.service'
import { CreditRepository } from '../repo/credit.repository'
import { createErrorResponse, createSuccessResponse, createUnauthorizedResponse, createForbiddenResponse, createRateLimitResponse } from '@/lib/api/response'
import { startSpan } from '@/lib/observability/otel'

/**
 * Messaging API Handler
 * Handles message sending, bulk operations, and service management
 */
export class MessagingHandler {
  private messagingService: MessagingService
  private creditRepository: CreditRepository
  private prisma: PrismaClient

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient()
    this.creditRepository = new CreditRepository(this.prisma)
    this.messagingService = new MessagingService(this.creditRepository)
  }

  /**
   * Send a single message
   * POST /api/messages/send
   */
  async sendMessage(request: NextRequest): Promise<NextResponse> {
    const span = await startSpan('messages.sendMessage')
    try {
      // TODO: Add authentication middleware
      // For now, we'll extract userId from headers or body
      const userId = await this.extractUserId(request)
      if (!userId) {
        return createUnauthorizedResponse('Authentication required')
      }

      // Parse request body
      const body = await request.json()
      
      // Validate input using Zod schema
      const sendMessageSchema = z.object({
        to: z.string().min(1, 'Recipient is required'),
        channel: z.enum(['email', 'sms', 'whatsapp'], {
          errorMap: () => ({ message: 'Channel must be email, sms, or whatsapp' })
        }),
        country: z.string().length(2, 'Country must be 2-letter code').optional(),
        templateId: z.string().optional(),
        subject: z.string().optional(),
        content: z.string().min(1, 'Content is required'),
        variables: z.record(z.string()).optional(),
        metadata: z.record(z.any()).optional(),
        priority: z.enum(['low', 'normal', 'high']).optional(),
        scheduledAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined)
      })

      const validationResult = sendMessageSchema.safeParse(body)
      if (!validationResult.success) {
        return createErrorResponse(
          'Invalid message data',
          400,
          'VALIDATION_ERROR',
          validationResult.error.errors
        )
      }

      const messageData = validationResult.data

      // Create send request
      const sendRequest: SendMessageRequest = {
        userId,
        to: messageData.to,
        channel: messageData.channel,
        country: messageData.country,
        templateId: messageData.templateId,
        subject: messageData.subject,
        content: messageData.content,
        variables: messageData.variables,
        metadata: {
          ...messageData.metadata,
          userAgent: request.headers.get('user-agent'),
          ip: this.getClientIP(request)
        },
        priority: messageData.priority,
        scheduledAt: messageData.scheduledAt
      }

      // Send message via service
      const result = await this.messagingService.sendMessage(sendRequest)

      if (!result.success) {
        // Handle specific error types
        if (result.error?.code === 'INSUFFICIENT_CREDITS') {
          return createErrorResponse(
            result.error.message,
            402,
            'INSUFFICIENT_CREDITS'
          )
        }

        if (result.error?.code === 'RATE_LIMIT_EXCEEDED') {
          return createRateLimitResponse(result.error.message)
        }

        return createErrorResponse(
          result.error?.message || 'Failed to send message',
          result.error?.statusCode || 500,
          result.error?.code || 'MESSAGE_SEND_FAILED'
        )
      }

      // Log successful send
      console.log('Message sent successfully via API', {
        messageId: result.data?.messageId,
        userId,
        channel: messageData.channel,
        provider: result.data?.provider,
        cost: result.data?.cost,
        operation: 'api_message_sent'
      })

      return createSuccessResponse(result.data, 201)
    } catch (error) {
      console.error('Error in sendMessage handler:', error)
      
      // Handle specific error types
      if (error instanceof SyntaxError) {
        return createErrorResponse(
          'Invalid JSON in request body',
          400,
          'INVALID_JSON'
        )
      }

      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    } finally { span.end() }
    }
  }

  /**
   * Send bulk messages
   * POST /api/messages/bulk
   */
  async sendBulkMessages(request: NextRequest): Promise<NextResponse> {
    const span = await startSpan('messages.sendBulkMessages')
    try {
      // TODO: Add authentication middleware
      const userId = await this.extractUserId(request)
      if (!userId) {
        return createUnauthorizedResponse('Authentication required')
      }

      // Parse request body
      const body = await request.json()
      
      // Validate input using Zod schema
      const bulkMessageSchema = z.object({
        messages: z.array(z.object({
          to: z.string().min(1, 'Recipient is required'),
          channel: z.enum(['email', 'sms', 'whatsapp']),
          country: z.string().length(2).optional(),
          templateId: z.string().optional(),
          subject: z.string().optional(),
          content: z.string().min(1, 'Content is required'),
          variables: z.record(z.string()).optional(),
          metadata: z.record(z.any()).optional(),
          priority: z.enum(['low', 'normal', 'high']).optional(),
          scheduledAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined)
        })).min(1, 'At least one message is required').max(100, 'Maximum 100 messages per batch')
      })

      const validationResult = bulkMessageSchema.safeParse(body)
      if (!validationResult.success) {
        return createErrorResponse(
          'Invalid bulk message data',
          400,
          'VALIDATION_ERROR',
          validationResult.error.errors
        )
      }

      const bulkData = validationResult.data

      // Create bulk send request
      const bulkRequest: BulkSendRequest = {
        userId,
        messages: bulkData.messages.map(msg => ({
          userId,
          to: msg.to,
          channel: msg.channel,
          country: msg.country,
          templateId: msg.templateId,
          subject: msg.subject,
          content: msg.content,
          variables: msg.variables,
          metadata: {
            ...msg.metadata,
            userAgent: request.headers.get('user-agent'),
            ip: this.getClientIP(request)
          },
          priority: msg.priority,
          scheduledAt: msg.scheduledAt
        }))
      }

      // Send bulk messages via service
      const result = await this.messagingService.sendBulkMessages(bulkRequest)

      if (!result.success) {
        // Handle specific error types
        if (result.error?.code === 'INSUFFICIENT_CREDITS') {
          return createErrorResponse(
            result.error.message,
            402,
            'INSUFFICIENT_CREDITS'
          )
        }

        return createErrorResponse(
          result.error?.message || 'Failed to send bulk messages',
          result.error?.statusCode || 500,
          result.error?.code || 'BULK_SEND_FAILED'
        )
      }

      // Log successful bulk send
      console.log('Bulk messages sent successfully via API', {
        userId,
        totalMessages: result.data?.totalMessages,
        successCount: result.data?.successCount,
        failureCount: result.data?.failureCount,
        totalCost: result.data?.totalCost,
        operation: 'api_bulk_sent'
      })

      return createSuccessResponse(result.data, 201)
    } catch (error) {
      console.error('Error in sendBulkMessages handler:', error)
      
      if (error instanceof SyntaxError) {
        return createErrorResponse(
          'Invalid JSON in request body',
          400,
          'INVALID_JSON'
        )
      }

      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    } finally { span.end() }
    }
  }

  /**
   * Get message pricing
   * GET /api/messages/pricing?channel=email&country=NG
   */
  async getPricing(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url)
      const channel = searchParams.get('channel')
      const country = searchParams.get('country')

      if (!channel) {
        return createErrorResponse(
          'Channel parameter is required',
          400,
          'CHANNEL_REQUIRED'
        )
      }

      // Validate channel
      const channelSchema = z.enum(['email', 'sms', 'whatsapp'])
      const channelValidation = channelSchema.safeParse(channel)
      
      if (!channelValidation.success) {
        return createErrorResponse(
          'Invalid channel. Must be email, sms, or whatsapp',
          400,
          'INVALID_CHANNEL'
        )
      }

      // Validate country if provided
      if (country) {
        const countrySchema = z.string().length(2, 'Country must be 2-letter code')
        const countryValidation = countrySchema.safeParse(country)
        
        if (!countryValidation.success) {
          return createErrorResponse(
            'Invalid country code. Must be 2-letter ISO code',
            400,
            'INVALID_COUNTRY'
          )
        }
      }

      // Get pricing via service
      const result = this.messagingService.getPricing(channelValidation.data, country || undefined)

      if (!result.success) {
        return createErrorResponse(
          result.error?.message || 'Failed to get pricing',
          result.error?.statusCode || 500,
          result.error?.code || 'PRICING_FAILED'
        )
      }

      return createSuccessResponse(result.data)
    } catch (error) {
      console.error('Error in getPricing handler:', error)
      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Get bulk pricing
   * POST /api/messages/pricing/bulk
   */
  async getBulkPricing(request: NextRequest): Promise<NextResponse> {
    try {
      // Parse request body
      const body = await request.json()
      
      // Validate input
      const bulkPricingSchema = z.object({
        messages: z.array(z.object({
          channel: z.enum(['email', 'sms', 'whatsapp']),
          country: z.string().length(2).optional()
        })).min(1, 'At least one message is required').max(1000, 'Maximum 1000 messages for pricing')
      })

      const validationResult = bulkPricingSchema.safeParse(body)
      if (!validationResult.success) {
        return createErrorResponse(
          'Invalid bulk pricing request',
          400,
          'VALIDATION_ERROR',
          validationResult.error.errors
        )
      }

      const pricingData = validationResult.data

      // Get bulk pricing via service
      const result = this.messagingService.getBulkPricing(pricingData.messages)

      if (!result.success) {
        return createErrorResponse(
          result.error?.message || 'Failed to calculate bulk pricing',
          result.error?.statusCode || 500,
          result.error?.code || 'BULK_PRICING_FAILED'
        )
      }

      return createSuccessResponse(result.data)
    } catch (error) {
      console.error('Error in getBulkPricing handler:', error)
      
      if (error instanceof SyntaxError) {
        return createErrorResponse(
          'Invalid JSON in request body',
          400,
          'INVALID_JSON'
        )
      }

      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Get message delivery status
   * GET /api/messages/status?messageId=xxx&providerMessageId=xxx&provider=xxx
   */
  async getDeliveryStatus(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url)
      const messageId = searchParams.get('messageId')
      const providerMessageId = searchParams.get('providerMessageId')
      const provider = searchParams.get('provider')

      if (!messageId || !providerMessageId || !provider) {
        return createErrorResponse(
          'messageId, providerMessageId, and provider parameters are required',
          400,
          'MISSING_PARAMETERS'
        )
      }

      // Get delivery status via service
      const result = await this.messagingService.getDeliveryStatus(messageId, providerMessageId, provider)

      if (!result.success) {
        return createErrorResponse(
          result.error?.message || 'Failed to get delivery status',
          result.error?.statusCode || 500,
          result.error?.code || 'STATUS_FAILED'
        )
      }

      return createSuccessResponse(result.data)
    } catch (error) {
      console.error('Error in getDeliveryStatus handler:', error)
      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Get messaging service status
   * GET /api/messages/health
   */
  async healthCheck(request: NextRequest): Promise<NextResponse> {
    try {
      // Basic health check - verify database connection and service status
      await this.prisma.$queryRaw`SELECT 1`
      
      const serviceStatus = this.messagingService.getStatus()
      
      return createSuccessResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'messaging-api',
        details: {
          initialized: serviceStatus.initialized,
          adapters: serviceStatus.adapters.adapterCount,
          pricebook: serviceStatus.pricebook.version
        }
      })
    } catch (error) {
      console.error('Messaging API health check failed:', error)
      return createErrorResponse(
        'Service unhealthy',
        503,
        'SERVICE_UNHEALTHY'
      )
    }
  }

  /**
   * Get user credit balance
   * GET /api/messages/credits
   */
  async getCreditBalance(request: NextRequest): Promise<NextResponse> {
    try {
      // TODO: Add authentication middleware
      const userId = await this.extractUserId(request)
      if (!userId) {
        return createUnauthorizedResponse('Authentication required')
      }

      // Get credit balance via repository
      const result = await this.creditRepository.getBalance(userId)

      if (!result.success) {
        return createErrorResponse(
          result.error?.message || 'Failed to get credit balance',
          result.error?.statusCode || 500,
          result.error?.code || 'CREDIT_BALANCE_FAILED'
        )
      }

      return createSuccessResponse(result.data)
    } catch (error) {
      console.error('Error in getCreditBalance handler:', error)
      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Extract user ID from request (placeholder for authentication)
   */
  private async extractUserId(request: NextRequest): Promise<string | null> {
    // TODO: Implement proper authentication
    // For now, extract from header or return test user
    const authHeader = request.headers.get('authorization')
    const userIdHeader = request.headers.get('x-user-id')
    
    if (userIdHeader) {
      return userIdHeader
    }

    if (authHeader?.startsWith('Bearer ')) {
      // TODO: Validate JWT token and extract user ID
      return 'test-user-123'
    }

    return null
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    return 'unknown'
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.prisma.$disconnect()
    } catch (error) {
      console.error('Error during messaging handler cleanup:', error)
    }
  }
}

// Request/Response type definitions
export interface MessageSendRequest {
  to: string
  channel: 'email' | 'sms' | 'whatsapp'
  country?: string
  templateId?: string
  subject?: string
  content: string
  variables?: Record<string, string>
  metadata?: Record<string, any>
  priority?: 'low' | 'normal' | 'high'
  scheduledAt?: string
}

export interface BulkMessageSendRequest {
  messages: MessageSendRequest[]
}

export interface MessageSendResponse {
  messageId: string
  providerMessageId: string
  status: 'sent' | 'queued' | 'failed'
  channel: string
  provider: string
  cost: number
  currency: string
  timestamp: string
  success: boolean
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface BulkMessageSendResponse {
  totalMessages: number
  successCount: number
  failureCount: number
  totalCost: number
  currency: string
  results: MessageSendResponse[]
  timestamp: string
}

export interface PricingResponse {
  cost: number
  currency: string
  provider: string
  country: string
  channel: string
  notes?: string
}

export interface BulkPricingResponse {
  totalCost: number
  breakdown: Array<PricingResponse & { index: number }>
  currency: string
}

export interface CreditBalanceResponse {
  userId: string
  balance: number
  currency: string
  lastUpdated: string
}
