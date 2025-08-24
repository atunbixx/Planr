/**
 * Unit tests for RSVPService
 * Tests business logic, validation, and repository orchestration
 */

import { RSVPService } from '../rsvp.service'
import { RSVPRepository } from '../../repo/rsvp.repository'
import { InviteRepository } from '../../repo/invite.repository'
import { RsvpStatus } from '@prisma/client'

// Mock the repositories
jest.mock('../../repo/rsvp.repository')
jest.mock('../../repo/invite.repository')

// Mock crypto for token generation
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mockedtoken123')
  })
}))

describe('RSVPService', () => {
  let service: RSVPService
  let mockRSVPRepo: jest.Mocked<RSVPRepository>
  let mockInviteRepo: jest.Mocked<InviteRepository>

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()

    // Create service instance
    service = new RSVPService()

    // Get mocked repository instances
    mockRSVPRepo = (service as any).rsvpRepo
    mockInviteRepo = (service as any).inviteRepo

    // Setup default mock implementations
    mockRSVPRepo.createOrUpdate = jest.fn()
    mockRSVPRepo.getStats = jest.fn()
    mockRSVPRepo.list = jest.fn()

    mockInviteRepo.getByToken = jest.fn()
    mockInviteRepo.create = jest.fn()
    mockInviteRepo.list = jest.fn()
    mockInviteRepo.update = jest.fn()
    mockInviteRepo.delete = jest.fn()
    mockInviteRepo.isTokenUnique = jest.fn()
  })

  describe('submitRSVP', () => {
    const validRSVPData = {
      inviteId: 'token123',
      email: 'guest@example.com',
      status: 'accepted',
      partySize: 2,
      notes: 'Looking forward to it!'
    }

    const mockInvite = {
      id: 'invite-123',
      userId: 'user-123',
      email: 'guest@example.com',
      token: 'token123',
      country: 'NG',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const mockRSVP = {
      id: 'rsvp-123',
      userId: 'user-123',
      inviteId: 'invite-123',
      email: 'guest@example.com',
      status: 'accepted' as RsvpStatus,
      partySize: 2,
      notes: 'Looking forward to it!',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should successfully submit RSVP with valid data', async () => {
      mockInviteRepo.getByToken.mockResolvedValue({ success: true, data: mockInvite })
      mockRSVPRepo.createOrUpdate.mockResolvedValue({ success: true, data: mockRSVP })

      const result = await service.submitRSVP(validRSVPData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockRSVP)
      expect(mockInviteRepo.getByToken).toHaveBeenCalledWith('token123')
      expect(mockRSVPRepo.createOrUpdate).toHaveBeenCalledWith({
        userId: 'user-123',
        inviteId: 'invite-123',
        email: 'guest@example.com',
        status: 'accepted',
        partySize: 2,
        notes: 'Looking forward to it!'
      })
    })

    it('should reject invalid RSVP data', async () => {
      const invalidData = {
        inviteId: 'invalid-uuid',
        email: 'not-an-email',
        status: 'invalid-status',
        partySize: -1
      }

      const result = await service.submitRSVP(invalidData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('RSVP_VALIDATION_FAILED')
      expect(result.error?.statusCode).toBe(400)
      expect(mockInviteRepo.getByToken).not.toHaveBeenCalled()
    })

    it('should reject RSVP for invalid invite token', async () => {
      mockInviteRepo.getByToken.mockResolvedValue({ success: true, data: null })

      const result = await service.submitRSVP(validRSVPData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVALID_INVITE')
      expect(result.error?.statusCode).toBe(404)
      expect(mockRSVPRepo.createOrUpdate).not.toHaveBeenCalled()
    })

    it('should handle repository errors gracefully', async () => {
      mockInviteRepo.getByToken.mockResolvedValue({ success: true, data: mockInvite })
      mockRSVPRepo.createOrUpdate.mockResolvedValue({ 
        success: false, 
        error: { message: 'Database error', code: 'DB_ERROR', statusCode: 500 }
      })

      const result = await service.submitRSVP(validRSVPData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('RSVP_SAVE_FAILED')
      expect(result.error?.statusCode).toBe(500)
    })

    it('should handle invite validation errors', async () => {
      mockInviteRepo.getByToken.mockResolvedValue({ 
        success: false, 
        error: { message: 'Database error', code: 'DB_ERROR', statusCode: 500 }
      })

      const result = await service.submitRSVP(validRSVPData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVITE_VALIDATION_FAILED')
      expect(result.error?.statusCode).toBe(500)
    })

    it('should normalize email to lowercase', async () => {
      const dataWithUppercaseEmail = {
        ...validRSVPData,
        email: 'GUEST@EXAMPLE.COM'
      }

      mockInviteRepo.getByToken.mockResolvedValue({ success: true, data: mockInvite })
      mockRSVPRepo.createOrUpdate.mockResolvedValue({ success: true, data: mockRSVP })

      await service.submitRSVP(dataWithUppercaseEmail)

      expect(mockRSVPRepo.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'guest@example.com'
        })
      )
    })

    it('should trim and handle optional notes', async () => {
      const dataWithWhitespaceNotes = {
        ...validRSVPData,
        notes: '  Looking forward to it!  '
      }

      mockInviteRepo.getByToken.mockResolvedValue({ success: true, data: mockInvite })
      mockRSVPRepo.createOrUpdate.mockResolvedValue({ success: true, data: mockRSVP })

      await service.submitRSVP(dataWithWhitespaceNotes)

      expect(mockRSVPRepo.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Looking forward to it!'
        })
      )
    })
  })

  describe('getStats', () => {
    const mockStats = {
      total: 10,
      pending: 3,
      accepted: 5,
      declined: 2,
      totalGuests: 12
    }

    it('should return RSVP statistics successfully', async () => {
      mockRSVPRepo.getStats.mockResolvedValue({ success: true, data: mockStats })

      const result = await service.getStats('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockStats)
      expect(mockRSVPRepo.getStats).toHaveBeenCalledWith('user-123')
    })

    it('should handle repository errors', async () => {
      mockRSVPRepo.getStats.mockResolvedValue({ 
        success: false, 
        error: { message: 'Database error', code: 'DB_ERROR', statusCode: 500 }
      })

      const result = await service.getStats('user-123')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('RSVP_STATS_FAILED')
    })
  })

  describe('createInvite', () => {
    const validInviteData = {
      email: 'guest@example.com',
      country: 'NG'
    }

    const mockCreatedInvite = {
      id: 'invite-123',
      userId: 'user-123',
      email: 'guest@example.com',
      token: 'mockedtoken123',
      country: 'NG',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should create invite successfully', async () => {
      mockInviteRepo.isTokenUnique.mockResolvedValue({ success: true, data: true })
      mockInviteRepo.create.mockResolvedValue({ success: true, data: mockCreatedInvite })

      const result = await service.createInvite('user-123', validInviteData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCreatedInvite)
      expect(mockInviteRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        email: 'guest@example.com',
        token: 'mockedtoken123',
        country: 'NG'
      })
    })

    it('should validate invite data', async () => {
      const invalidData = {
        email: 'not-an-email',
        country: 'INVALID'
      }

      const result = await service.createInvite('user-123', invalidData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVITE_VALIDATION_FAILED')
      expect(mockInviteRepo.create).not.toHaveBeenCalled()
    })

    it('should retry on token collision', async () => {
      mockInviteRepo.isTokenUnique.mockResolvedValue({ success: true, data: true })
      mockInviteRepo.create
        .mockResolvedValueOnce({ 
          success: false, 
          error: { message: 'Token exists', code: 'INVITE_TOKEN_EXISTS', statusCode: 409 }
        })
        .mockResolvedValueOnce({ success: true, data: mockCreatedInvite })

      const result = await service.createInvite('user-123', validInviteData)

      expect(result.success).toBe(true)
      expect(mockInviteRepo.create).toHaveBeenCalledTimes(2)
    })

    it('should normalize email and country code', async () => {
      const dataWithCasing = {
        email: 'GUEST@EXAMPLE.COM',
        country: 'ng'
      }

      mockInviteRepo.isTokenUnique.mockResolvedValue({ success: true, data: true })
      mockInviteRepo.create.mockResolvedValue({ success: true, data: mockCreatedInvite })

      await service.createInvite('user-123', dataWithCasing)

      expect(mockInviteRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'guest@example.com',
          country: 'NG'
        })
      )
    })
  })

  describe('listRSVPs', () => {
    const mockRSVPs = [
      {
        id: 'rsvp-1',
        userId: 'user-123',
        inviteId: 'invite-1',
        email: 'guest1@example.com',
        status: 'accepted' as RsvpStatus,
        partySize: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'rsvp-2',
        userId: 'user-123',
        inviteId: 'invite-2',
        email: 'guest2@example.com',
        status: 'declined' as RsvpStatus,
        partySize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    it('should list RSVPs with pagination', async () => {
      mockRSVPRepo.list.mockResolvedValue({ success: true, data: mockRSVPs })

      const filters = { limit: 10, offset: 0 }
      const result = await service.listRSVPs('user-123', filters)

      expect(result.success).toBe(true)
      expect(result.data?.rsvps).toEqual(mockRSVPs)
      expect(result.data?.total).toBe(2)
      expect(result.data?.limit).toBe(10)
      expect(result.data?.offset).toBe(0)
    })

    it('should filter RSVPs by status', async () => {
      mockRSVPRepo.list.mockResolvedValue({ success: true, data: mockRSVPs })

      const filters = { status: 'accepted', limit: 10, offset: 0 }
      await service.listRSVPs('user-123', filters)

      expect(mockRSVPRepo.list).toHaveBeenCalledWith('user-123', { status: 'accepted' })
    })

    it('should validate filter parameters', async () => {
      const invalidFilters = { limit: -1, offset: 'invalid' }
      const result = await service.listRSVPs('user-123', invalidFilters)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('RSVP_FILTER_VALIDATION_FAILED')
    })

    it('should handle pagination correctly', async () => {
      const manyRSVPs = Array(25).fill(null).map((_, i) => ({
        ...mockRSVPs[0],
        id: `rsvp-${i}`,
        email: `guest${i}@example.com`
      }))

      mockRSVPRepo.list.mockResolvedValue({ success: true, data: manyRSVPs })

      const filters = { limit: 10, offset: 15 }
      const result = await service.listRSVPs('user-123', filters)

      expect(result.success).toBe(true)
      expect(result.data?.rsvps).toHaveLength(10)
      expect(result.data?.total).toBe(25)
      expect(result.data?.rsvps[0].email).toBe('guest15@example.com')
    })
  })

  describe('createBulkInvites', () => {
    const validBulkData = {
      invites: [
        { email: 'guest1@example.com', country: 'NG' },
        { email: 'guest2@example.com', country: 'US' },
        { email: 'guest3@example.com' }
      ]
    }

    it('should create multiple invites successfully', async () => {
      mockInviteRepo.isTokenUnique.mockResolvedValue({ success: true, data: true })
      mockInviteRepo.create.mockResolvedValue({ 
        success: true, 
        data: { id: 'invite-123', userId: 'user-123', email: 'test@example.com', token: 'token', createdAt: new Date(), updatedAt: new Date() }
      })

      const result = await service.createBulkInvites('user-123', validBulkData)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(mockInviteRepo.create).toHaveBeenCalledTimes(3)
    })

    it('should validate bulk invite data', async () => {
      const invalidData = {
        invites: [] // Empty array
      }

      const result = await service.createBulkInvites('user-123', invalidData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('BULK_INVITE_VALIDATION_FAILED')
    })

    it('should handle partial failures gracefully', async () => {
      mockInviteRepo.isTokenUnique.mockResolvedValue({ success: true, data: true })
      mockInviteRepo.create
        .mockResolvedValueOnce({ success: true, data: { id: 'invite-1', userId: 'user-123', email: 'guest1@example.com', token: 'token1', createdAt: new Date(), updatedAt: new Date() } })
        .mockResolvedValueOnce({ success: false, error: { message: 'Failed', code: 'ERROR', statusCode: 500 } })
        .mockResolvedValueOnce({ success: true, data: { id: 'invite-3', userId: 'user-123', email: 'guest3@example.com', token: 'token3', createdAt: new Date(), updatedAt: new Date() } })

      const result = await service.createBulkInvites('user-123', validBulkData)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2) // Only successful invites
    })
  })

  describe('updateInvite', () => {
    const validUpdateData = {
      email: 'updated@example.com',
      country: 'US'
    }

    const mockUpdatedInvite = {
      id: 'invite-123',
      userId: 'user-123',
      email: 'updated@example.com',
      token: 'token123',
      country: 'US',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should update invite successfully', async () => {
      mockInviteRepo.update.mockResolvedValue({ success: true, data: mockUpdatedInvite })

      const result = await service.updateInvite('user-123', 'invite-123', validUpdateData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUpdatedInvite)
      expect(mockInviteRepo.update).toHaveBeenCalledWith('invite-123', 'user-123', validUpdateData)
    })

    it('should validate update data', async () => {
      const invalidData = {
        email: 'not-an-email',
        country: 'TOOLONG'
      }

      const result = await service.updateInvite('user-123', 'invite-123', invalidData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVITE_UPDATE_VALIDATION_FAILED')
    })

    it('should handle invite not found', async () => {
      mockInviteRepo.update.mockResolvedValue({ success: true, data: null })

      const result = await service.updateInvite('user-123', 'nonexistent', validUpdateData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVITE_NOT_FOUND')
      expect(result.error?.statusCode).toBe(404)
    })
  })

  describe('deleteInvite', () => {
    it('should delete invite successfully', async () => {
      mockInviteRepo.delete.mockResolvedValue({ success: true, data: true })

      const result = await service.deleteInvite('user-123', 'invite-123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockInviteRepo.delete).toHaveBeenCalledWith('invite-123', 'user-123')
    })

    it('should handle invite not found', async () => {
      mockInviteRepo.delete.mockResolvedValue({ success: true, data: false })

      const result = await service.deleteInvite('user-123', 'nonexistent')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVITE_NOT_FOUND')
    })
  })

  describe('getInviteByToken', () => {
    const mockInvite = {
      id: 'invite-123',
      userId: 'user-123',
      email: 'guest@example.com',
      token: 'token123',
      country: 'NG',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should get invite by token successfully', async () => {
      mockInviteRepo.getByToken.mockResolvedValue({ success: true, data: mockInvite })

      const result = await service.getInviteByToken('token123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockInvite)
    })

    it('should return null for invalid token', async () => {
      mockInviteRepo.getByToken.mockResolvedValue({ success: true, data: null })

      const result = await service.getInviteByToken('invalid-token')

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })
  })
})