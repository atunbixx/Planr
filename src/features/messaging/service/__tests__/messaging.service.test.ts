import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MessagingService, SendMessageRequest } from '../messaging.service'
import { CreditRepository } from '../../repo/credit.repository'
import { PrismaClient } from '@prisma/client'

// Mock the adapter registry
vi.mock('../../adapters/registry', () => ({
  adapterRegistry: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getAdapterForChannel: vi.fn().mockReturnValue({
      send: vi.fn().mockResolvedValue({
        success: true,
        messageId: 'msg_123',
        providerMessageId: 'provider_123',
        status: 'sent',
        timestamp: new Date()
      }),
      getInfo: vi.fn().mockReturnValue({
        name: 'Test Adapter',
        provider: 'test',
        supportedChannels: ['email']
      })
    }),
    getStatus: vi.fn().mockReturnValue({
      initialized: true,
      adapterCount: 1,
      adapters: []
    })
  }
}))

describe('MessagingService', () => {
  let messagingService: MessagingService
  let creditRepository: CreditRepository
  let prisma: PrismaClient

  beforeEach(async () => {
    prisma = new PrismaClient()
    creditRepository = new CreditRepository(prisma)
    messagingService = new MessagingService(creditRepository)

    // Mock credit repository methods
    vi.spyOn(creditRepository, 'reserveCredits').mockResolvedValue({
      success: true,
      data: true
    })
    vi.spyOn(creditRepository, 'deductCredits').mockResolvedValue({
      success: true,
      data: true
    })
    vi.spyOn(creditRepository, 'refundCredits').mockResolvedValue({
      success: true,
      data: true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const result = await messagingService.initialize()
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })

    it('should return true if already initialized', async () => {
      await messagingService.initialize()
      const result = await messagingService.initialize()
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })
  })

  describe('sendMessage', () => {
    const validRequest: SendMessageRequest = {
      userId: 'user_123',
      to: 'test@example.com',
      channel: 'email',
      country: 'NG',
      content: 'Test message content',
      subject: 'Test Subject'
    }

    it('should send a message successfully', async () => {
      const result = await messagingService.sendMessage(validRequest)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.messageId).toBeDefined()
      expect(result.data?.success).toBe(true)
      expect(result.data?.channel).toBe('email')
    })

    it('should validate required fields', async () => {
      const invalidRequest = { ...validRequest, userId: '' }
      const result = await messagingService.sendMessage(invalidRequest)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('USER_ID_REQUIRED')
    })

    it('should validate recipient', async () => {
      const invalidRequest = { ...validRequest, to: '' }
      const result = await messagingService.sendMessage(invalidRequest)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('RECIPIENT_REQUIRED')
    })

    it('should validate channel', async () => {
      const invalidRequest = { ...validRequest, channel: '' as any }
      const result = await messagingService.sendMessage(invalidRequest)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('CHANNEL_REQUIRED')
    })

    it('should validate content', async () => {
      const invalidRequest = { ...validRequest, content: '' }
      const result = await messagingService.sendMessage(invalidRequest)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('CONTENT_REQUIRED')
    })

    it('should handle insufficient credits', async () => {
      vi.spyOn(creditRepository, 'reserveCredits').mockResolvedValue({
        success: false,
        error: { message: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }
      })

      const result = await messagingService.sendMessage(validRequest)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INSUFFICIENT_CREDITS')
    })

    it('should refund credits on send failure', async () => {
      const { adapterRegistry } = await import('../../adapters/registry')
      vi.mocked(adapterRegistry.getAdapterForChannel).mockReturnValue({
        send: vi.fn().mockResolvedValue({
          success: false,
          messageId: 'msg_123',
          providerMessageId: '',
          status: 'failed',
          timestamp: new Date(),
          error: { code: 'SEND_FAILED', message: 'Send failed' }
        }),
        getInfo: vi.fn().mockReturnValue({
          name: 'Test Adapter',
          provider: 'test',
          supportedChannels: ['email']
        })
      } as any)

      const result = await messagingService.sendMessage(validRequest)
      
      expect(result.success).toBe(true) // Service call succeeds
      expect(result.data?.success).toBe(false) // But message send fails
      expect(creditRepository.refundCredits).toHaveBeenCalled()
    })
  })

  describe('sendBulkMessages', () => {
    const bulkRequest = {
      userId: 'user_123',
      messages: [
        {
          userId: 'user_123',
          to: 'test1@example.com',
          channel: 'email' as const,
          country: 'NG' as const,
          content: 'Test message 1'
        },
        {
          userId: 'user_123',
          to: 'test2@example.com',
          channel: 'email' as const,
          country: 'US' as const,
          content: 'Test message 2'
        }
      ]
    }

    it('should send bulk messages successfully', async () => {
      const result = await messagingService.sendBulkMessages(bulkRequest)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.totalMessages).toBe(2)
      expect(result.data?.successCount).toBe(2)
      expect(result.data?.failureCount).toBe(0)
    })

    it('should handle mixed success/failure in bulk send', async () => {
      const { adapterRegistry } = await import('../../adapters/registry')
      let callCount = 0
      vi.mocked(adapterRegistry.getAdapterForChannel).mockReturnValue({
        send: vi.fn().mockImplementation(() => {
          callCount++
          return Promise.resolve({
            success: callCount === 1, // First call succeeds, second fails
            messageId: `msg_${callCount}`,
            providerMessageId: callCount === 1 ? 'provider_123' : '',
            status: callCount === 1 ? 'sent' : 'failed',
            timestamp: new Date(),
            error: callCount === 1 ? undefined : { code: 'SEND_FAILED', message: 'Send failed' }
          })
        }),
        getInfo: vi.fn().mockReturnValue({
          name: 'Test Adapter',
          provider: 'test',
          supportedChannels: ['email']
        })
      } as any)

      const result = await messagingService.sendBulkMessages(bulkRequest)
      
      expect(result.success).toBe(true)
      expect(result.data?.totalMessages).toBe(2)
      expect(result.data?.successCount).toBe(1)
      expect(result.data?.failureCount).toBe(1)
    })
  })

  describe('getPricing', () => {
    it('should get pricing for email in Nigeria', () => {
      const result = messagingService.getPricing('email', 'NG')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.channel).toBe('email')
      expect(result.data?.country).toBe('NG')
      expect(result.data?.cost).toBe(1)
    })

    it('should get pricing for SMS in US', () => {
      const result = messagingService.getPricing('sms', 'US')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.channel).toBe('sms')
      expect(result.data?.country).toBe('US')
      expect(result.data?.cost).toBe(10)
    })

    it('should use default pricing for unsupported country', () => {
      const result = messagingService.getPricing('email', 'XX' as any)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.country).toBe('NG') // Default country
    })
  })

  describe('getBulkPricing', () => {
    it('should calculate bulk pricing correctly', () => {
      const messages = [
        { channel: 'email' as const, country: 'NG' as const },
        { channel: 'sms' as const, country: 'US' as const },
        { channel: 'whatsapp' as const, country: 'NG' as const }
      ]

      const result = messagingService.getBulkPricing(messages)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.totalCost).toBe(13) // 1 + 10 + 2
      expect(result.data?.breakdown).toHaveLength(3)
      expect(result.data?.currency).toBe('credits')
    })
  })

  describe('getStatus', () => {
    it('should return service status', async () => {
      await messagingService.initialize()
      const status = messagingService.getStatus()
      
      expect(status.initialized).toBe(true)
      expect(status.adapters).toBeDefined()
      expect(status.pricebook).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle adapter initialization failure', async () => {
      const { adapterRegistry } = await import('../../adapters/registry')
      vi.mocked(adapterRegistry.initialize).mockRejectedValue(new Error('Init failed'))

      const newService = new MessagingService(creditRepository)
      const result = await newService.initialize()
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INIT_FAILED')
    })

    it('should handle missing adapter for channel', async () => {
      const { adapterRegistry } = await import('../../adapters/registry')
      vi.mocked(adapterRegistry.getAdapterForChannel).mockReturnValue(null)

      const request: SendMessageRequest = {
        userId: 'user_123',
        to: 'test@example.com',
        channel: 'email',
        content: 'Test message'
      }

      const result = await messagingService.sendMessage(request)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('ADAPTER_NOT_AVAILABLE')
      expect(creditRepository.refundCredits).toHaveBeenCalled()
    })
  })
})