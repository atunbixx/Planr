/**
 * Unit tests for InviteRepository
 * These tests use a mocked Prisma client to test repository logic
 */

import { InviteRepository, InviteCreateData } from '../invite.repository'

// Mock Prisma client
const mockPrisma = {
  invite: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
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

describe('InviteRepository', () => {
  let repository: InviteRepository
  
  beforeEach(() => {
    repository = new InviteRepository()
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create invite successfully', async () => {
      const mockInvite = {
        id: 'invite-123',
        userId: 'user-123',
        email: 'test@example.com',
        token: 'unique-token-123',
        country: 'NG',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.invite.create.mockResolvedValue(mockInvite)

      const data: InviteCreateData = {
        userId: 'user-123',
        email: 'test@example.com',
        token: 'unique-token-123',
        country: 'NG'
      }

      const result = await repository.create(data)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockInvite)
      expect(mockPrisma.invite.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          token: 'unique-token-123',
          country: 'NG'
        }
      })
    })

    it('should handle unique token constraint violation', async () => {
      const error = new Error('Unique constraint failed on the fields: (`token`)')
      mockPrisma.invite.create.mockRejectedValue(error)

      const data: InviteCreateData = {
        userId: 'user-123',
        email: 'test@example.com',
        token: 'duplicate-token'
      }

      const result = await repository.create(data)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Invite token already exists')
      expect(result.error?.code).toBe('INVITE_TOKEN_EXISTS')
      expect(result.error?.statusCode).toBe(409)
    })

    it('should handle general database errors', async () => {
      mockPrisma.invite.create.mockRejectedValue(new Error('Database connection failed'))

      const data: InviteCreateData = {
        userId: 'user-123',
        email: 'test@example.com',
        token: 'token-123'
      }

      const result = await repository.create(data)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Failed to create invite')
      expect(result.error?.code).toBe('INVITE_CREATE_FAILED')
      expect(result.error?.statusCode).toBe(500)
    })
  })

  describe('getByToken', () => {
    it('should find invite by token', async () => {
      const mockInvite = {
        id: 'invite-123',
        userId: 'user-123',
        email: 'test@example.com',
        token: 'token-123',
        country: 'NG',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.invite.findUnique.mockResolvedValue(mockInvite)

      const result = await repository.getByToken('token-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockInvite)
      expect(mockPrisma.invite.findUnique).toHaveBeenCalledWith({
        where: { token: 'token-123' }
      })
    })

    it('should return null when token not found', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue(null)

      const result = await repository.getByToken('nonexistent-token')

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })

    it('should handle database errors', async () => {
      mockPrisma.invite.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await repository.getByToken('token-123')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVITE_GET_FAILED')
    })
  })

  describe('findOrCreateByEmail', () => {
    it('should return existing invite when found', async () => {
      const existingInvite = {
        id: 'invite-123',
        userId: 'user-123',
        email: 'test@example.com',
        token: 'existing-token',
        country: 'NG',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.invite.findFirst.mockResolvedValue(existingInvite)

      const result = await repository.findOrCreateByEmail(
        'user-123',
        'test@example.com',
        'new-token',
        'NG'
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual(existingInvite)
      expect(mockPrisma.invite.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          email: 'test@example.com'
        }
      })
      expect(mockPrisma.invite.create).not.toHaveBeenCalled()
    })

    it('should create new invite when not found', async () => {
      const newInvite = {
        id: 'invite-456',
        userId: 'user-123',
        email: 'new@example.com',
        token: 'new-token',
        country: 'US',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.invite.findFirst.mockResolvedValue(null)
      mockPrisma.invite.create.mockResolvedValue(newInvite)

      const result = await repository.findOrCreateByEmail(
        'user-123',
        'new@example.com',
        'new-token',
        'US'
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual(newInvite)
      expect(mockPrisma.invite.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          email: 'new@example.com',
          token: 'new-token',
          country: 'US'
        }
      })
    })

    it('should handle token collision during creation', async () => {
      mockPrisma.invite.findFirst.mockResolvedValue(null)
      mockPrisma.invite.create.mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`token`)')
      )

      const result = await repository.findOrCreateByEmail(
        'user-123',
        'test@example.com',
        'duplicate-token'
      )

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVITE_TOKEN_EXISTS')
      expect(result.error?.statusCode).toBe(409)
    })
  })

  describe('list', () => {
    it('should list all invites for a user', async () => {
      const mockInvites = [
        {
          id: 'invite-1',
          userId: 'user-123',
          email: 'test1@example.com',
          token: 'token-1',
          country: 'NG',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01')
        },
        {
          id: 'invite-2',
          userId: 'user-123',
          email: 'test2@example.com',
          token: 'token-2',
          country: 'US',
          createdAt: new Date('2025-01-02'),
          updatedAt: new Date('2025-01-02')
        }
      ]

      mockPrisma.invite.findMany.mockResolvedValue(mockInvites)

      const result = await repository.list('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockInvites)
      expect(mockPrisma.invite.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should return empty array when no invites found', async () => {
      mockPrisma.invite.findMany.mockResolvedValue([])

      const result = await repository.list('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  describe('isTokenUnique', () => {
    it('should return true when token is unique', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue(null)

      const result = await repository.isTokenUnique('unique-token')

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockPrisma.invite.findUnique).toHaveBeenCalledWith({
        where: { token: 'unique-token' },
        select: { id: true }
      })
    })

    it('should return false when token already exists', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue({ id: 'invite-123' })

      const result = await repository.isTokenUnique('existing-token')

      expect(result.success).toBe(true)
      expect(result.data).toBe(false)
    })

    it('should handle database errors', async () => {
      mockPrisma.invite.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await repository.isTokenUnique('token-123')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVITE_TOKEN_CHECK_FAILED')
    })
  })

  describe('update', () => {
    it('should update invite successfully', async () => {
      const updatedInvite = {
        id: 'invite-123',
        userId: 'user-123',
        email: 'updated@example.com',
        token: 'token-123',
        country: 'US',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date()
      }

      mockPrisma.invite.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.invite.findUnique.mockResolvedValue(updatedInvite)

      const result = await repository.update('invite-123', 'user-123', {
        email: 'updated@example.com',
        country: 'US'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedInvite)
      expect(mockPrisma.invite.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'invite-123',
          userId: 'user-123'
        },
        data: {
          email: 'updated@example.com',
          country: 'US',
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should return null when invite not found', async () => {
      mockPrisma.invite.updateMany.mockResolvedValue({ count: 0 })

      const result = await repository.update('nonexistent-id', 'user-123', {
        email: 'test@example.com'
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete invite successfully', async () => {
      mockPrisma.invite.deleteMany.mockResolvedValue({ count: 1 })

      const result = await repository.delete('invite-123', 'user-123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockPrisma.invite.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'invite-123',
          userId: 'user-123'
        }
      })
    })

    it('should return false when invite not found', async () => {
      mockPrisma.invite.deleteMany.mockResolvedValue({ count: 0 })

      const result = await repository.delete('nonexistent-id', 'user-123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(false)
    })

    it('should handle database errors', async () => {
      mockPrisma.invite.deleteMany.mockRejectedValue(new Error('Database error'))

      const result = await repository.delete('invite-123', 'user-123')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVITE_DELETE_FAILED')
    })
  })
})