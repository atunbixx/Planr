/**
 * Unit tests for RSVPRepository
 * These tests use a mocked Prisma client to test repository logic
 */

import { RSVPRepository, RSVPCreateData } from '../rsvp.repository'
import { RsvpStatus } from '@prisma/client'

// Mock Prisma client
const mockPrisma = {
  inviteRSVP: {
    upsert: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
  }
}

// Mock the BaseRepository
jest.mock('@/lib/repositories/BaseRepository', () => ({
  BaseRepository: class {
    protected db = mockPrisma
  },
  createSuccessResult: (data: any) => ({ success: true, data }),
  createErrorResult: (message: string, code?: string, statusCode?: number) => ({
    success: false,
    error: { message, code, statusCode }
  })
}))

describe('RSVPRepository', () => {
  let repository: RSVPRepository
  
  beforeEach(() => {
    repository = new RSVPRepository()
    jest.clearAllMocks()
  })

  describe('createOrUpdate', () => {
    it('should create new RSVP successfully', async () => {
      const mockRSVP = {
        id: 'rsvp-123',
        userId: 'user-123',
        inviteId: 'invite-123',
        email: 'test@example.com',
        status: 'accepted' as RsvpStatus,
        partySize: 2,
        notes: 'Looking forward to it!',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.inviteRSVP.upsert.mockResolvedValue(mockRSVP)

      const data: RSVPCreateData = {
        userId: 'user-123',
        inviteId: 'invite-123',
        email: 'test@example.com',
        status: 'accepted',
        partySize: 2,
        notes: 'Looking forward to it!'
      }

      const result = await repository.createOrUpdate(data)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockRSVP)
      expect(mockPrisma.inviteRSVP.upsert).toHaveBeenCalledWith({
        where: {
          userId_email: {
            userId: 'user-123',
            email: 'test@example.com'
          }
        },
        update: {
          status: 'accepted',
          partySize: 2,
          notes: 'Looking forward to it!',
          updatedAt: expect.any(Date)
        },
        create: {
          userId: 'user-123',
          inviteId: 'invite-123',
          email: 'test@example.com',
          status: 'accepted',
          partySize: 2,
          notes: 'Looking forward to it!'
        }
      })
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.inviteRSVP.upsert.mockRejectedValue(new Error('Database error'))

      const data: RSVPCreateData = {
        userId: 'user-123',
        inviteId: 'invite-123',
        email: 'test@example.com',
        status: 'accepted',
        partySize: 1
      }

      const result = await repository.createOrUpdate(data)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Failed to create/update RSVP')
      expect(result.error?.code).toBe('RSVP_UPSERT_FAILED')
      expect(result.error?.statusCode).toBe(500)
    })

    it('should update existing RSVP with idempotency', async () => {
      const mockUpdatedRSVP = {
        id: 'rsvp-123',
        userId: 'user-123',
        inviteId: 'invite-123',
        email: 'test@example.com',
        status: 'declined' as RsvpStatus,
        partySize: 1,
        notes: 'Cannot make it',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date()
      }

      mockPrisma.inviteRSVP.upsert.mockResolvedValue(mockUpdatedRSVP)

      const data: RSVPCreateData = {
        userId: 'user-123',
        inviteId: 'invite-123',
        email: 'test@example.com',
        status: 'declined',
        partySize: 1,
        notes: 'Cannot make it'
      }

      const result = await repository.createOrUpdate(data)

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('declined')
      expect(result.data?.notes).toBe('Cannot make it')
    })
  })

  describe('getStats', () => {
    it('should return formatted RSVP statistics', async () => {
      const mockStats = [
        { status: 'accepted', _count: { _all: 5 }, _sum: { partySize: 12 } },
        { status: 'declined', _count: { _all: 2 }, _sum: { partySize: 3 } },
        { status: 'pending', _count: { _all: 3 }, _sum: { partySize: 5 } }
      ]

      mockPrisma.inviteRSVP.groupBy.mockResolvedValue(mockStats)

      const result = await repository.getStats('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        total: 10,
        pending: 3,
        accepted: 5,
        declined: 2,
        totalGuests: 20
      })

      expect(mockPrisma.inviteRSVP.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { userId: 'user-123' },
        _count: { _all: true },
        _sum: { partySize: true }
      })
    })

    it('should handle empty stats gracefully', async () => {
      mockPrisma.inviteRSVP.groupBy.mockResolvedValue([])

      const result = await repository.getStats('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        total: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        totalGuests: 0
      })
    })

    it('should handle database errors in stats', async () => {
      mockPrisma.inviteRSVP.groupBy.mockRejectedValue(new Error('Database error'))

      const result = await repository.getStats('user-123')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('RSVP_STATS_FAILED')
    })
  })

  describe('findByInviteAndEmail', () => {
    it('should find RSVP by invite and email', async () => {
      const mockRSVP = {
        id: 'rsvp-123',
        userId: 'user-123',
        inviteId: 'invite-123',
        email: 'test@example.com',
        status: 'accepted' as RsvpStatus,
        partySize: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.inviteRSVP.findFirst.mockResolvedValue(mockRSVP)

      const result = await repository.findByInviteAndEmail('invite-123', 'test@example.com')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockRSVP)
      expect(mockPrisma.inviteRSVP.findFirst).toHaveBeenCalledWith({
        where: {
          inviteId: 'invite-123',
          email: 'test@example.com'
        }
      })
    })

    it('should return null when RSVP not found', async () => {
      mockPrisma.inviteRSVP.findFirst.mockResolvedValue(null)

      const result = await repository.findByInviteAndEmail('invite-123', 'test@example.com')

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })
  })

  describe('list', () => {
    it('should list RSVPs with optional filtering', async () => {
      const mockRSVPs = [
        {
          id: 'rsvp-1',
          userId: 'user-123',
          inviteId: 'invite-1',
          email: 'test1@example.com',
          status: 'accepted' as RsvpStatus,
          partySize: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          invite: { token: 'token-1', country: 'NG' }
        }
      ]

      mockPrisma.inviteRSVP.findMany.mockResolvedValue(mockRSVPs)

      const result = await repository.list('user-123', { status: 'accepted' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockRSVPs)
      expect(mockPrisma.inviteRSVP.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', status: 'accepted' },
        orderBy: { createdAt: 'desc' },
        include: {
          invite: {
            select: {
              token: true,
              country: true
            }
          }
        }
      })
    })
  })

  describe('delete', () => {
    it('should delete RSVP successfully', async () => {
      mockPrisma.inviteRSVP.deleteMany.mockResolvedValue({ count: 1 })

      const result = await repository.delete('user-123', 'rsvp-123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockPrisma.inviteRSVP.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'rsvp-123',
          userId: 'user-123'
        }
      })
    })

    it('should return false when RSVP not found', async () => {
      mockPrisma.inviteRSVP.deleteMany.mockResolvedValue({ count: 0 })

      const result = await repository.delete('user-123', 'rsvp-123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(false)
    })
  })
})