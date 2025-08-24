import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { MessagingHandler } from '../messaging.handler'
import { PrismaClient } from '@prisma/client'

// Mock the MessagingService
vi.mock('../../service/messaging.service', () => ({
  MessagingService: vi.fn().mockImplementation(() => ({
    sendMessage: vi.fn(),
    sendBulkMessages: vi.fn(),
    getPricing: vi.fn(),
    getBulkPricing: vi.fn(),
    getDeliveryStatus: vi.fn(),
    getStatus: vi.fn()
  }))
}))

// Mock the CreditRepository
vi.mock('../../repo/credit.repository', () => ({
  CreditRepository: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn()
  }))
}))

// Mock Prisma
const mockPrisma = {
  $queryRaw: vi.fn(),
  $disconnect: vi.fn()
} as unknown as PrismaClient

describe('MessagingHandler', () => {
  let messagingHandler: MessagingHandler
  let mockMessagingService: any
  let mockCreditRepository: any

  beforeEach(() => {
    messagingHandler = new MessagingHandler(mockPrisma)
    
    // Get the mocked service instances
    const { MessagingService } = require('../../service/messaging.service')
    const { CreditRepository } = require('../../repo/credit.repository')
    
    mockMessagingService = new MessagingService()
    mockCreditRepository = new CreditRepository()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('sendMessage', () => {
    const validMessageData = {
      to: 'test@example.com',
      channel: 'email',
      country: 'NG',
      content: 'Test message content',
      subject: 'Test Subject'
    }

    it('should send message successfully', async () => {
      // Mock successful service response
      mockMessagingService.sendMessage.mockResolvedValue({
        success: true,
        data: {
          messageId: 'msg_123',
          providerMessageId: 'provider_123',
          status: 'sent',
          channel: 'email',
          provider: 'resend',
          cost: 1,
          currency: 'credits',
          timestamp: new Date(),
          success: true
        }
      })

      // Create mock request with authentication
      const request = new NextRequest('http://localhost/api/messages/send', {
        method: 'POST',
        headers: {
          'x-user-id': 'user_123',
          'content-type': 'application/json'
        },
        body: JSON.stringify(validMessageData)
      })

      const response = await messagingHandler.sendMessage(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toBeDefined()
      expect(responseData.data.messageId).toBe('msg_123')
      expect(mockMessagingService.sendMessage).toHaveBeenCalled()
    })

    it('should return unauthorized for missing authentication', async () => {
      const request = new NextRequest('http://localhost/api/messages/send', {
        method: 'POST',
        body: JSON.stringify(validMessageData)
      })

      const response = await messagingHandler.sendMessage(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('UNAUTHORIZED')
    })

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        to: '',
        channel: 'invalid',
        content: ''
      }

      const request = new NextRequest('http://localhost/api/messages/send', {
        method: 'POST',
        headers: { 'x-user-id': 'user_123' },
        body: JSON.stringify(invalidData)
      })

      const response = await messagingHandler.sendMessage(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should handle insufficient credits error', async () => {
      mockMessagingService.sendMessage.mockResolvedValue({
        success: false,
        error: {
          message: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS',
          statusCode: 402
        }
      })

      const request = new NextRequest('http://localhost/api/messages/send', {
        method: 'POST',
        headers: { 'x-user-id': 'user_123' },
        body: JSON.stringify(validMessageData)
      })

      const response = await messagingHandler.sendMessage(request)
      const responseData = await response.json()

      expect(response.status).toBe(402)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('INSUFFICIENT_CREDITS')
    })

    it('should handle rate limit error', async () => {
      mockMessagingService.sendMessage.mockResolvedValue({
        success: false,
        error: {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429
        }
      })

      const request = new NextRequest('http://localhost/api/messages/send', {
        method: 'POST',
        headers: { 'x-user-id': 'user_123' },
        body: JSON.stringify(validMessageData)
      })

      const response = await messagingHandler.sendMessage(request)
      const responseData = await response.json()

      expect(response.status).toBe(429)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/messages/send', {
        method: 'POST',
        headers: { 'x-user-id': 'user_123' },
        body: 'invalid json'
      })

      const response = await messagingHandler.sendMessage(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('INVALID_JSON')
    })
  })

  describe('sendBulkMessages', () => {
    const validBulkData = {
      messages: [
        {
          to: 'test1@example.com',
          channel: 'email',
          country: 'NG',
          content: 'Test message 1'
        },
        {
          to: 'test2@example.com',
          channel: 'email',
          country: 'US',
          content: 'Test message 2'
        }
      ]
    }

    it('should send bulk messages successfully', async () => {
      const mockBulkResult = {
        totalMessages: 2,
        successCount: 2,
        failureCount: 0,
        totalCost: 2,
        currency: 'credits',
        results: [],
        timestamp: new Date()
      }

      mockMessagingService.sendBulkMessages.mockResolvedValue({
        success: true,
        data: mockBulkResult
      })

      const request = new NextRequest('http://localhost/api/messages/bulk', {
        method: 'POST',
        headers: { 'x-user-id': 'user_123' },
        body: JSON.stringify(validBulkData)
      })

      const response = await messagingHandler.sendBulkMessages(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.data.totalMessages).toBe(2)
      expect(responseData.data.successCount).toBe(2)
    })

    it('should validate bulk message limits', async () => {
      const tooManyMessages = {
        messages: Array(101).fill({
          to: 'test@example.com',
          channel: 'email',
          content: 'Test'
        })
      }

      const request = new NextRequest('http://localhost/api/messages/bulk', {
        method: 'POST',
        headers: { 'x-user-id': 'user_123' },
        body: JSON.stringify(tooManyMessages)
      })

      const response = await messagingHandler.sendBulkMessages(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('getPricing', () => {
    it('should get pricing successfully', async () => {
      const mockPricing = {
        cost: 1,
        currency: 'credits',
        provider: 'resend',
        country: 'NG',
        channel: 'email'
      }

      mockMessagingService.getPricing.mockReturnValue({
        success: true,
        data: mockPricing
      })

      const request = new NextRequest('http://localhost/api/messages/pricing?channel=email&country=NG')

      const response = await messagingHandler.getPricing(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(mockPricing)
    })

    it('should return error for missing channel', async () => {
      const request = new NextRequest('http://localhost/api/messages/pricing')

      const response = await messagingHandler.getPricing(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('CHANNEL_REQUIRED')
    })

    it('should return error for invalid channel', async () => {
      const request = new NextRequest('http://localhost/api/messages/pricing?channel=invalid')

      const response = await messagingHandler.getPricing(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('INVALID_CHANNEL')
    })

    it('should return error for invalid country code', async () => {
      const request = new NextRequest('http://localhost/api/messages/pricing?channel=email&country=INVALID')

      const response = await messagingHandler.getPricing(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('INVALID_COUNTRY')
    })
  })

  describe('getBulkPricing', () => {
    const validPricingData = {
      messages: [
        { channel: 'email', country: 'NG' },
        { channel: 'sms', country: 'US' }
      ]
    }

    it('should calculate bulk pricing successfully', async () => {
      const mockBulkPricing = {
        totalCost: 11,
        breakdown: [
          { cost: 1, currency: 'credits', provider: 'resend', country: 'NG', channel: 'email', index: 0 },
          { cost: 10, currency: 'credits', provider: 'twilio', country: 'US', channel: 'sms', index: 1 }
        ],
        currency: 'credits'
      }

      mockMessagingService.getBulkPricing.mockReturnValue({
        success: true,
        data: mockBulkPricing
      })

      const request = new NextRequest('http://localhost/api/messages/pricing/bulk', {
        method: 'POST',
        body: JSON.stringify(validPricingData)
      })

      const response = await messagingHandler.getBulkPricing(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.totalCost).toBe(11)
      expect(responseData.data.breakdown).toHaveLength(2)
    })

    it('should validate pricing request limits', async () => {
      const tooManyMessages = {
        messages: Array(1001).fill({ channel: 'email' })
      }

      const request = new NextRequest('http://localhost/api/messages/pricing/bulk', {
        method: 'POST',
        body: JSON.stringify(tooManyMessages)
      })

      const response = await messagingHandler.getBulkPricing(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('getDeliveryStatus', () => {
    it('should get delivery status successfully', async () => {
      const mockStatus = {
        messageId: 'msg_123',
        status: 'delivered',
        timestamp: new Date(),
        details: 'Message delivered successfully'
      }

      mockMessagingService.getDeliveryStatus.mockResolvedValue({
        success: true,
        data: mockStatus
      })

      const request = new NextRequest('http://localhost/api/messages/status?messageId=msg_123&providerMessageId=provider_123&provider=resend')

      const response = await messagingHandler.getDeliveryStatus(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(mockStatus)
    })

    it('should return error for missing parameters', async () => {
      const request = new NextRequest('http://localhost/api/messages/status?messageId=msg_123')

      const response = await messagingHandler.getDeliveryStatus(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('MISSING_PARAMETERS')
    })
  })

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ '1': 1 }])
      
      mockMessagingService.getStatus.mockReturnValue({
        initialized: true,
        adapters: { adapterCount: 3 },
        pricebook: { version: '1.0' }
      })

      const request = new NextRequest('http://localhost/api/messages/health')

      const response = await messagingHandler.healthCheck(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data?.status).toBe('healthy')
      expect(responseData.data?.service).toBe('messaging-api')
    })

    it('should return unhealthy status on database error', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost/api/messages/health')

      const response = await messagingHandler.healthCheck(request)
      const responseData = await response.json()

      expect(response.status).toBe(503)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('SERVICE_UNHEALTHY')
    })
  })

  describe('getCreditBalance', () => {
    it('should get credit balance successfully', async () => {
      const mockBalance = {
        userId: 'user_123',
        balance: 100,
        currency: 'credits',
        lastUpdated: new Date()
      }

      mockCreditRepository.getBalance.mockResolvedValue({
        success: true,
        data: mockBalance
      })

      const request = new NextRequest('http://localhost/api/messages/credits', {
        headers: { 'x-user-id': 'user_123' }
      })

      const response = await messagingHandler.getCreditBalance(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(mockBalance)
    })

    it('should return unauthorized for missing authentication', async () => {
      const request = new NextRequest('http://localhost/api/messages/credits')

      const response = await messagingHandler.getCreditBalance(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('UNAUTHORIZED')
    })
  })

  describe('cleanup', () => {
    it('should disconnect from database', async () => {
      await messagingHandler.cleanup()
      expect(mockPrisma.$disconnect).toHaveBeenCalled()
    })

    it('should handle cleanup errors gracefully', async () => {
      vi.mocked(mockPrisma.$disconnect).mockRejectedValue(new Error('Disconnect failed'))
      
      // Should not throw
      await expect(messagingHandler.cleanup()).resolves.toBeUndefined()
    })
  })
})