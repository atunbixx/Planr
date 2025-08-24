import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { RSVPHandler } from '../rsvp.handler'
import { PrismaClient } from '@prisma/client'

// Mock the RSVPService
vi.mock('../../service/rsvp.service', () => ({
  RSVPService: vi.fn().mockImplementation(() => ({
    submitRSVP: vi.fn(),
    getStats: vi.fn(),
    getRSVPByInviteId: vi.fn(),
    validateInvite: vi.fn()
  }))
}))

// Mock Prisma
const mockPrisma = {
  $queryRaw: vi.fn(),
  $disconnect: vi.fn()
} as unknown as PrismaClient

describe('RSVPHandler', () => {
  let rsvpHandler: RSVPHandler
  let mockRSVPService: any

  beforeEach(() => {
    rsvpHandler = new RSVPHandler(mockPrisma)
    // Get the mocked service instance
    const { RSVPService } = require('../../service/rsvp.service')
    mockRSVPService = new RSVPService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('submitRSVP', () => {
    const validRSVPData = {
      inviteId: '123e4567-e89b-12d3-a456-426614174000',
      guestName: 'John Doe',
      attending: true,
      partySize: 2,
      dietaryRestrictions: 'Vegetarian',
      notes: 'Looking forward to it!'
    }

    it('should submit RSVP successfully', async () => {
      // Mock successful service response
      mockRSVPService.submitRSVP.mockResolvedValue({
        success: true,
        data: {
          id: 'rsvp_123',
          ...validRSVPData,
          submittedAt: new Date()
        }
      })

      // Create mock request
      const request = new NextRequest('http://localhost/api/rsvp', {
        method: 'POST',
        body: JSON.stringify(validRSVPData)
      })

      const response = await rsvpHandler.submitRSVP(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toBeDefined()
      expect(mockRSVPService.submitRSVP).toHaveBeenCalledWith(validRSVPData)
    })

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        inviteId: 'invalid-uuid',
        guestName: '',
        attending: 'maybe' // Should be boolean
      }

      const request = new NextRequest('http://localhost/api/rsvp', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await rsvpHandler.submitRSVP(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should handle service errors', async () => {
      mockRSVPService.submitRSVP.mockResolvedValue({
        success: false,
        error: {
          message: 'Invite not found',
          code: 'INVITE_NOT_FOUND',
          statusCode: 404
        }
      })

      const request = new NextRequest('http://localhost/api/rsvp', {
        method: 'POST',
        body: JSON.stringify(validRSVPData)
      })

      const response = await rsvpHandler.submitRSVP(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('INVITE_NOT_FOUND')
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/rsvp', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await rsvpHandler.submitRSVP(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('INVALID_JSON')
    })
  })

  describe('getStats', () => {
    const validInviteId = '123e4567-e89b-12d3-a456-426614174000'

    it('should get stats successfully', async () => {
      const mockStats = {
        totalInvited: 100,
        totalResponded: 75,
        totalAttending: 60,
        totalNotAttending: 15,
        responseRate: 0.75,
        attendanceRate: 0.8
      }

      mockRSVPService.getStats.mockResolvedValue({
        success: true,
        data: mockStats
      })

      const request = new NextRequest(`http://localhost/api/rsvp/stats?inviteId=${validInviteId}`)

      const response = await rsvpHandler.getStats(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(mockStats)
      expect(mockRSVPService.getStats).toHaveBeenCalledWith(validInviteId)
    })

    it('should return error for missing invite ID', async () => {
      const request = new NextRequest('http://localhost/api/rsvp/stats')

      const response = await rsvpHandler.getStats(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('INVITE_ID_REQUIRED')
    })

    it('should return error for invalid invite ID format', async () => {
      const request = new NextRequest('http://localhost/api/rsvp/stats?inviteId=invalid-uuid')

      const response = await rsvpHandler.getStats(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('INVALID_INVITE_ID')
    })
  })

  describe('checkRSVP', () => {
    const validInviteId = '123e4567-e89b-12d3-a456-426614174000'

    it('should return existing RSVP', async () => {
      const mockRSVP = {
        id: 'rsvp_123',
        inviteId: validInviteId,
        guestName: 'John Doe',
        attending: true,
        partySize: 2,
        submittedAt: new Date(),
        updatedAt: new Date()
      }

      mockRSVPService.getRSVPByInviteId.mockResolvedValue({
        success: true,
        data: mockRSVP
      })

      const request = new NextRequest(`http://localhost/api/rsvp?inviteId=${validInviteId}`)

      const response = await rsvpHandler.checkRSVP(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(mockRSVP)
    })

    it('should return null for non-existent RSVP', async () => {
      mockRSVPService.getRSVPByInviteId.mockResolvedValue({
        success: false,
        error: {
          code: 'RSVP_NOT_FOUND',
          message: 'RSVP not found'
        }
      })

      const request = new NextRequest(`http://localhost/api/rsvp?inviteId=${validInviteId}`)

      const response = await rsvpHandler.checkRSVP(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toBeNull()
    })
  })

  describe('validateInvite', () => {
    const validToken = 'valid-token-123'

    it('should validate invite successfully', async () => {
      const mockInvite = {
        valid: true,
        invite: {
          id: 'invite_123',
          token: validToken,
          guestName: 'John Doe',
          guestEmail: 'john@example.com',
          maxPartySize: 4,
          vendorId: 'vendor_123',
          createdAt: new Date()
        }
      }

      mockRSVPService.validateInvite.mockResolvedValue({
        success: true,
        data: mockInvite
      })

      const request = new NextRequest(`http://localhost/api/rsvp/validate?token=${validToken}`)

      const response = await rsvpHandler.validateInvite(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(mockInvite)
    })

    it('should return error for missing token', async () => {
      const request = new NextRequest('http://localhost/api/rsvp/validate')

      const response = await rsvpHandler.validateInvite(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('TOKEN_REQUIRED')
    })

    it('should return error for invalid token', async () => {
      mockRSVPService.validateInvite.mockResolvedValue({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
          statusCode: 400
        }
      })

      const request = new NextRequest(`http://localhost/api/rsvp/validate?token=${validToken}`)

      const response = await rsvpHandler.validateInvite(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('INVALID_TOKEN')
    })
  })

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ '1': 1 }])

      const request = new NextRequest('http://localhost/api/rsvp/health')

      const response = await rsvpHandler.healthCheck(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data?.status).toBe('healthy')
      expect(responseData.data?.service).toBe('rsvp-api')
    })

    it('should return unhealthy status on database error', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost/api/rsvp/health')

      const response = await rsvpHandler.healthCheck(request)
      const responseData = await response.json()

      expect(response.status).toBe(503)
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe('SERVICE_UNHEALTHY')
    })
  })

  describe('cleanup', () => {
    it('should disconnect from database', async () => {
      await rsvpHandler.cleanup()
      expect(mockPrisma.$disconnect).toHaveBeenCalled()
    })

    it('should handle cleanup errors gracefully', async () => {
      vi.mocked(mockPrisma.$disconnect).mockRejectedValue(new Error('Disconnect failed'))
      
      // Should not throw
      await expect(rsvpHandler.cleanup()).resolves.toBeUndefined()
    })
  })
})