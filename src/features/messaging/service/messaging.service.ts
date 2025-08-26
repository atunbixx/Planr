import { RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'
import { PricebookService, MessageChannel, CountryCode, PricingInfo } from './pricebook.service'
import { adapterRegistry } from '../adapters/registry'
import { MessageRequest, MessageResult, MessageAdapter } from '../adapters/base.adapter'
import { CreditRepository } from '../repo/credit.repository'
import { OperationMonitoring, AnalyticsTracking } from '@/lib/monitoring/operations'
import { logger } from '@/lib/logging/logger'

/**
 * Main messaging service that orchestrates message sending
 * with pricing, provider selection, and credit management
 */
export class MessagingService {
  private pricebookService: PricebookService
  private creditRepository: CreditRepository
  private initialized = false

  constructor(creditRepository: CreditRepository) {
    this.pricebookService = new PricebookService()
    this.creditRepository = creditRepository
  }

  /**
   * Initialize the messaging service
   */
  async initialize(): Promise<RepositoryResult<boolean>> {
    try {
      if (this.initialized) {
        return createSuccessResult(true)
      }

      // Initialize adapter registry
      await adapterRegistry.initialize()

      // Reload pricebook if needed
      if (this.pricebookService.needsRefresh()) {
        await this.pricebookService.reloadPricebook()
      }

      this.initialized = true
      
      console.log('Messaging service initialized successfully', {
        adapters: adapterRegistry.getStatus().adapterCount,
        pricebook: this.pricebookService.getMetadata().version,
        operation: 'messaging_service_init'
      })

      return createSuccessResult(true)
    } catch (error) {
      console.error('Failed to initialize messaging service:', error)
      return createErrorResult(
        'Failed to initialize messaging service',
        'INIT_FAILED',
        500
      )
    }
  }

  /**
   * Send a single message
   */
  async sendMessage(request: SendMessageRequest): Promise<RepositoryResult<MessageSendResult>> {
    // Ensure service is initialized
    const initResult = await this.initialize()
    if (!initResult.success) {
      logger.error(
        'Messaging service not initialized',
        undefined,
        { userId: request.userId },
        'MessagingService',
        'sendMessage'
      )
      return createErrorResult(
        'Messaging service not initialized',
        'SERVICE_NOT_INITIALIZED',
        500
      )
    }

    // Validate request
    const validationResult = this.validateSendRequest(request)
    if (!validationResult.success) {
      logger.warn(
        'Message send request validation failed',
        { validationError: validationResult.error },
        'MessagingService',
        'sendMessage'
      )
      return validationResult
    }

    // Get pricing information
    const pricingResult = this.pricebookService.getPricing(request.channel, request.country)
    if (!pricingResult.success || !pricingResult.data) {
      logger.error(
        'Failed to get pricing information',
        undefined,
        { channel: request.channel, country: request.country },
        'MessagingService',
        'sendMessage'
      )
      return createErrorResult(
        'Failed to get pricing information',
        'PRICING_FAILED',
        400
      )
    }

    const pricing = pricingResult.data

    // Monitor the messaging operation
    const monitoringResult = await OperationMonitoring.monitorMessagingOperation(
      async () => {
        // Check and reserve credits
        const creditResult = await this.reserveCredits(request.userId, pricing.cost)
        if (!creditResult.success) {
          throw new Error('Insufficient credits')
        }

        // Get appropriate adapter
        const adapter = adapterRegistry.getAdapterForChannel(request.channel, pricing.provider)
        if (!adapter) {
          // Refund credits since we can't send
          await this.refundCredits(request.userId, pricing.cost)
          throw new Error(`No adapter available for channel: ${request.channel}`)
        }

        // Prepare message request
        const messageRequest: MessageRequest = {
          to: request.to,
          channel: request.channel,
          templateId: request.templateId,
          subject: request.subject,
          content: request.content,
          variables: request.variables,
          metadata: {
            userId: request.userId,
            messageId: this.generateMessageId(),
            country: request.country,
            pricing: pricing,
            ...request.metadata
          },
          priority: request.priority,
          scheduledAt: request.scheduledAt
        }

        // Send message via adapter
        const sendResult = await adapter.send(messageRequest)

        if (!sendResult.success) {
          // Refund credits on failed send
          await this.refundCredits(request.userId, pricing.cost)
          throw new Error(sendResult.error || 'Message send failed')
        }

        // Deduct credits on successful send
        await this.deductCredits(request.userId, pricing.cost)

        return {
          messageId: sendResult.messageId!,
          providerMessageId: sendResult.providerMessageId,
          status: 'sent',
          cost: pricing.cost,
          provider: pricing.provider,
          channel: request.channel,
          sentAt: new Date().toISOString(),
          metadata: sendResult.metadata
        }
      },
      {
        userId: request.userId,
        provider: pricing.provider,
        messageType: request.channel === 'email' ? 'email' : 'sms',
        recipientCount: Array.isArray(request.to) ? request.to.length : 1,
        creditCost: pricing.cost,
      }
    )

    if (!monitoringResult.success) {
      // Track failed messaging event
      AnalyticsTracking.trackMessagingEvent({
        userId: request.userId,
        provider: pricing.provider,
        messageType: request.channel === 'email' ? 'email' : 'sms',
        recipientCount: Array.isArray(request.to) ? request.to.length : 1,
        creditCost: pricing.cost,
        success: false,
        errorType: monitoringResult.error?.name || 'UnknownError',
      })

      return createErrorResult(
        monitoringResult.error?.message || 'Message send failed',
        'MESSAGE_SEND_FAILED',
        500
      )
    }

    // Track successful messaging event
    AnalyticsTracking.trackMessagingEvent({
      userId: request.userId,
      provider: pricing.provider,
      messageType: request.channel === 'email' ? 'email' : 'sms',
      recipientCount: Array.isArray(request.to) ? request.to.length : 1,
      creditCost: pricing.cost,
      success: true,
    })

    return createSuccessResult(monitoringResult.data!)
      } else {
        // Refund credits on failed send
        await this.refundCredits(request.userId, pricing.cost)
        
        // Log failed send
        console.error('Message send failed', {
          messageId: sendResult.messageId,
          channel: request.channel,
          provider: pricing.provider,
          error: sendResult.error,
          userId: request.userId,
          operation: 'message_send_failed'
        })
      }

      const result: MessageSendResult = {
        messageId: sendResult.messageId,
        providerMessageId: sendResult.providerMessageId,
        status: sendResult.status,
        channel: request.channel,
        provider: pricing.provider,
        cost: pricing.cost,
        currency: pricing.currency,
        timestamp: sendResult.timestamp,
        success: sendResult.success,
        error: sendResult.error
      }

      return createSuccessResult(result)
    } catch (error) {
      console.error('Error sending message:', error)
      return createErrorResult(
        'Failed to send message',
        'SEND_FAILED',
        500
      )
    }
  }

  /**
   * Send multiple messages (bulk send)
   */
  async sendBulkMessages(request: BulkSendRequest): Promise<RepositoryResult<BulkSendResult>> {
    try {
      // Ensure service is initialized
      const initResult = await this.initialize()
      if (!initResult.success) {
        return createErrorResult(
          'Messaging service not initialized',
          'SERVICE_NOT_INITIALIZED',
          500
        )
      }

      // Calculate total cost
      const messages = request.messages.map(msg => ({
        channel: msg.channel,
        country: msg.country
      }))

      const bulkPricingResult = this.pricebookService.getBulkPricing(messages)
      if (!bulkPricingResult.success || !bulkPricingResult.data) {
        return createErrorResult(
          'Failed to calculate bulk pricing',
          'BULK_PRICING_FAILED',
          400
        )
      }

      const totalCost = bulkPricingResult.data.totalCost

      // Check and reserve total credits
      const creditResult = await this.reserveCredits(request.userId, totalCost)
      if (!creditResult.success) {
        return createErrorResult(
          'Insufficient credits for bulk send',
          'INSUFFICIENT_CREDITS',
          402
        )
      }

      // Send messages
      const results: MessageSendResult[] = []
      let successCount = 0
      let failureCount = 0
      let totalCostUsed = 0

      for (let i = 0; i < request.messages.length; i++) {
        const message = request.messages[i]
        const pricingInfo = bulkPricingResult.data.breakdown[i]

        const sendRequest: SendMessageRequest = {
          userId: request.userId,
          to: message.to,
          channel: message.channel,
          country: message.country,
          templateId: message.templateId,
          subject: message.subject,
          content: message.content,
          variables: message.variables,
          metadata: message.metadata,
          priority: message.priority,
          scheduledAt: message.scheduledAt
        }

        // Send individual message (without credit checks since we pre-reserved)
        const result = await this.sendMessageWithoutCreditCheck(sendRequest, pricingInfo)
        results.push(result)

        if (result.success) {
          successCount++
          totalCostUsed += result.cost
        } else {
          failureCount++
        }
      }

      // Adjust credits based on actual usage
      const creditAdjustment = totalCost - totalCostUsed
      if (creditAdjustment > 0) {
        await this.refundCredits(request.userId, creditAdjustment)
      }

      // Deduct used credits
      if (totalCostUsed > 0) {
        await this.deductCredits(request.userId, totalCostUsed)
      }

      const bulkResult: BulkSendResult = {
        totalMessages: request.messages.length,
        successCount,
        failureCount,
        totalCost: totalCostUsed,
        currency: bulkPricingResult.data.currency,
        results,
        timestamp: new Date()
      }

      console.log('Bulk message send completed', {
        userId: request.userId,
        totalMessages: request.messages.length,
        successCount,
        failureCount,
        totalCost: totalCostUsed,
        operation: 'bulk_send_completed'
      })

      return createSuccessResult(bulkResult)
    } catch (error) {
      console.error('Error sending bulk messages:', error)
      return createErrorResult(
        'Failed to send bulk messages',
        'BULK_SEND_FAILED',
        500
      )
    }
  }

  /**
   * Get message delivery status
   */
  async getDeliveryStatus(messageId: string, providerMessageId: string, provider: string): Promise<RepositoryResult<any>> {
    try {
      const adapter = adapterRegistry.getAdapter(provider)
      if (!adapter || !adapter.getDeliveryStatus) {
        return createErrorResult(
          'Delivery status not supported for this provider',
          'STATUS_NOT_SUPPORTED',
          400
        )
      }

      const status = await adapter.getDeliveryStatus(providerMessageId)
      return createSuccessResult(status)
    } catch (error) {
      console.error('Error getting delivery status:', error)
      return createErrorResult(
        'Failed to get delivery status',
        'STATUS_FAILED',
        500
      )
    }
  }

  /**
   * Get pricing for a message
   */
  getPricing(channel: MessageChannel, country?: CountryCode): RepositoryResult<PricingInfo> {
    return this.pricebookService.getPricing(channel, country)
  }

  /**
   * Get bulk pricing
   */
  getBulkPricing(messages: Array<{ channel: MessageChannel; country?: CountryCode }>): RepositoryResult<{
    totalCost: number
    breakdown: Array<PricingInfo & { index: number }>
    currency: string
  }> {
    return this.pricebookService.getBulkPricing(messages)
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean
    adapters: any
    pricebook: any
  } {
    return {
      initialized: this.initialized,
      adapters: adapterRegistry.getStatus(),
      pricebook: this.pricebookService.getMetadata()
    }
  }

  /**
   * Validate send request
   */
  private validateSendRequest(request: SendMessageRequest): RepositoryResult<boolean> {
    if (!request.userId) {
      return createErrorResult('User ID is required', 'USER_ID_REQUIRED', 400)
    }

    if (!request.to) {
      return createErrorResult('Recipient is required', 'RECIPIENT_REQUIRED', 400)
    }

    if (!request.channel) {
      return createErrorResult('Channel is required', 'CHANNEL_REQUIRED', 400)
    }

    if (!this.pricebookService.isChannelSupported(request.channel)) {
      return createErrorResult(`Unsupported channel: ${request.channel}`, 'CHANNEL_UNSUPPORTED', 400)
    }

    if (!request.content) {
      return createErrorResult('Content is required', 'CONTENT_REQUIRED', 400)
    }

    return createSuccessResult(true)
  }

  /**
   * Reserve credits for a message
   */
  private async reserveCredits(userId: string, amount: number): Promise<RepositoryResult<boolean>> {
    return this.creditRepository.reserveCredits(userId, amount)
  }

  /**
   * Deduct credits after successful send
   */
  private async deductCredits(userId: string, amount: number): Promise<RepositoryResult<boolean>> {
    return this.creditRepository.deductCredits(userId, amount)
  }

  /**
   * Refund credits on failed send
   */
  private async refundCredits(userId: string, amount: number): Promise<RepositoryResult<boolean>> {
    return this.creditRepository.refundCredits(userId, amount)
  }

  /**
   * Send message without credit checks (for bulk operations)
   */
  private async sendMessageWithoutCreditCheck(request: SendMessageRequest, pricing: PricingInfo): Promise<MessageSendResult> {
    try {
      const adapter = adapterRegistry.getAdapterForChannel(request.channel, pricing.provider)
      if (!adapter) {
        return {
          messageId: this.generateMessageId(),
          providerMessageId: '',
          status: 'failed',
          channel: request.channel,
          provider: pricing.provider,
          cost: pricing.cost,
          currency: pricing.currency,
          timestamp: new Date(),
          success: false,
          error: {
            code: 'ADAPTER_NOT_AVAILABLE',
            message: `No adapter available for channel: ${request.channel}`
          }
        }
      }

      const messageRequest: MessageRequest = {
        to: request.to,
        channel: request.channel,
        templateId: request.templateId,
        subject: request.subject,
        content: request.content,
        variables: request.variables,
        metadata: {
          userId: request.userId,
          messageId: this.generateMessageId(),
          country: request.country,
          pricing: pricing,
          ...request.metadata
        },
        priority: request.priority,
        scheduledAt: request.scheduledAt
      }

      const sendResult = await adapter.send(messageRequest)

      return {
        messageId: sendResult.messageId,
        providerMessageId: sendResult.providerMessageId,
        status: sendResult.status,
        channel: request.channel,
        provider: pricing.provider,
        cost: pricing.cost,
        currency: pricing.currency,
        timestamp: sendResult.timestamp,
        success: sendResult.success,
        error: sendResult.error
      }
    } catch (error) {
      console.error('Error in sendMessageWithoutCreditCheck:', error)
      return {
        messageId: this.generateMessageId(),
        providerMessageId: '',
        status: 'failed',
        channel: request.channel,
        provider: pricing.provider,
        cost: pricing.cost,
        currency: pricing.currency,
        timestamp: new Date(),
        success: false,
        error: {
          code: 'SEND_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Request/Response interfaces
export interface SendMessageRequest {
  userId: string
  to: string
  channel: MessageChannel
  country?: CountryCode
  templateId?: string
  subject?: string
  content: string
  variables?: Record<string, string>
  metadata?: Record<string, any>
  priority?: 'low' | 'normal' | 'high'
  scheduledAt?: Date
}

export interface MessageSendResult {
  messageId: string
  providerMessageId: string
  status: 'sent' | 'queued' | 'failed'
  channel: MessageChannel
  provider: string
  cost: number
  currency: string
  timestamp: Date
  success: boolean
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface BulkSendRequest {
  userId: string
  messages: SendMessageRequest[]
}

export interface BulkSendResult {
  totalMessages: number
  successCount: number
  failureCount: number
  totalCost: number
  currency: string
  results: MessageSendResult[]
  timestamp: Date
}