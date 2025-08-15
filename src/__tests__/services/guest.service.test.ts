import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { GuestService } from '../../features/guests/service/guest.service'
import { 
  createMockPrismaClient, 
  createMockCache, 
  createMockGuest, 
  createMockCouple,
  clearAllMocks,
  expectCacheToBeCalledWith 
} from '../lib/test-utils'

// Mock dependencies
const mockPrisma = createMockPrismaClient()
const mockCache = createMockCache()

jest.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
}))

jest.mock('../../lib/cache', () => ({
  cache: mockCache,
  getCacheKey: {
    guestList: (coupleId: string) => `guests-${coupleId}`,
  },
  getCacheTags: {
    guests: (coupleId: string) => `guests:${coupleId}`,
    couple: (coupleId: string) => `couple:${coupleId}`,
  },
  CACHE_TTL: {
    MEDIUM: 300000,
    SHORT: 60000,
  },
}))

describe('GuestService', () => {
  let guestService: GuestService
  const mockCoupleId = 'test-couple-id'
  const mockGuestId = 'test-guest-id'

  beforeEach(() => {
    clearAllMocks()
    guestService = new GuestService()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getGuestsForCouple', () => {
    it('should return cached guests when cache hit', async () => {
      // Arrange
      const mockGuests = [createMockGuest()]
      const cachedResult = {
        data: mockGuests,
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }
      mockCache.get.mockReturnValue(cachedResult)

      // Act
      const result = await guestService.getGuestsForCouple(mockCoupleId)

      // Assert
      expect(result).toEqual(cachedResult)
      expectCacheToBeCalledWith(mockCache, `guests-${mockCoupleId}:page:1:20`)
      expect(mockPrisma.guest.findMany).not.toHaveBeenCalled()
    })

    it('should query database and cache result when cache miss', async () => {
      // Arrange
      const mockGuests = [createMockGuest(), createMockGuest({ id: 'guest-2' })]
      mockCache.get.mockReturnValue(null)
      mockPrisma.guest.findMany.mockResolvedValue(mockGuests)
      mockPrisma.guest.count.mockResolvedValue(2)

      // Act
      const result = await guestService.getGuestsForCouple(mockCoupleId)

      // Assert
      expect(result).toEqual({
        data: mockGuests,
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      })
      
      expect(mockPrisma.guest.findMany).toHaveBeenCalledWith({
        where: { coupleId: mockCoupleId },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })
      
      expect(mockPrisma.guest.count).toHaveBeenCalledWith({
        where: { coupleId: mockCoupleId },
      })
      
      expect(mockCache.set).toHaveBeenCalledWith(
        `guests-${mockCoupleId}:page:1:20`,
        result,
        300000, // CACHE_TTL.MEDIUM
        [`guests:${mockCoupleId}`, `couple:${mockCoupleId}`]
      )
    })

    it('should handle pagination correctly', async () => {
      // Arrange
      const options = { page: 2, pageSize: 10 }
      mockCache.get.mockReturnValue(null)
      mockPrisma.guest.findMany.mockResolvedValue([])
      mockPrisma.guest.count.mockResolvedValue(25)

      // Act
      await guestService.getGuestsForCouple(mockCoupleId, options)

      // Assert
      expect(mockPrisma.guest.findMany).toHaveBeenCalledWith({
        where: { coupleId: mockCoupleId },
        skip: 10, // (page - 1) * pageSize
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })
    })

    it('should handle custom ordering', async () => {
      // Arrange
      const options = { orderBy: { firstName: 'asc' as const } }
      mockCache.get.mockReturnValue(null)
      mockPrisma.guest.findMany.mockResolvedValue([])
      mockPrisma.guest.count.mockResolvedValue(0)

      // Act
      await guestService.getGuestsForCouple(mockCoupleId, options)

      // Assert
      expect(mockPrisma.guest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { firstName: 'asc' },
        })
      )
    })
  })

  describe('getGuestStats', () => {
    it('should return cached stats when cache hit', async () => {
      // Arrange
      const cachedStats = {
        total: 10,
        confirmed: 5,
        declined: 2,
        pending: 3,
        withPlusOne: 4,
      }
      mockCache.get.mockReturnValue(cachedStats)

      // Act
      const result = await guestService.getGuestStats(mockCoupleId)

      // Assert
      expect(result).toEqual(cachedStats)
      expect(mockPrisma.guest.findMany).not.toHaveBeenCalled()
    })

    it('should calculate stats correctly from database', async () => {
      // Arrange
      const mockGuests = [
        createMockGuest({ 
          id: 'guest-1',
          plusOneAllowed: true,
          invitations: [{ status: 'confirmed' }] as any
        }),
        createMockGuest({ 
          id: 'guest-2',
          plusOneAllowed: false,
          invitations: [{ status: 'declined' }] as any
        }),
        createMockGuest({ 
          id: 'guest-3',
          plusOneAllowed: true,
          invitations: [] as any
        }),
      ]
      
      mockCache.get.mockReturnValue(null)
      mockPrisma.guest.findMany.mockResolvedValue(mockGuests)

      // Act
      const result = await guestService.getGuestStats(mockCoupleId)

      // Assert
      expect(result).toEqual({
        total: 3,
        confirmed: 1,
        declined: 1,
        pending: 1,
        withPlusOne: 2,
      })

      expect(mockPrisma.guest.findMany).toHaveBeenCalledWith({
        where: { coupleId: mockCoupleId },
        include: {
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })
    })

    it('should handle different invitation statuses', async () => {
      // Arrange
      const mockGuests = [
        createMockGuest({ 
          invitations: [{ status: 'attending' }] as any // Should count as confirmed
        }),
        createMockGuest({ 
          invitations: [{ status: 'confirmed' }] as any // Should count as confirmed
        }),
        createMockGuest({ 
          invitations: [{ status: 'declined' }] as any // Should count as declined
        }),
        createMockGuest({ 
          invitations: [{ status: 'sent' }] as any // Should count as pending
        }),
      ]
      
      mockCache.get.mockReturnValue(null)
      mockPrisma.guest.findMany.mockResolvedValue(mockGuests)

      // Act
      const result = await guestService.getGuestStats(mockCoupleId)

      // Assert
      expect(result).toEqual({
        total: 4,
        confirmed: 2, // attending + confirmed
        declined: 1,
        pending: 1, // sent
        withPlusOne: 0,
      })
    })
  })

  describe('createGuest', () => {
    it('should create guest with parsed name', async () => {
      // Arrange
      const guestData = {
        name: 'John Doe Smith',
        email: 'john@example.com',
        phone: '+1234567890',
      }
      const mockCreatedGuest = createMockGuest({
        firstName: 'John',
        lastName: 'Doe Smith',
      })
      
      mockPrisma.$transaction.mockImplementation(async (callback) => 
        callback(mockPrisma)
      )
      mockPrisma.guest.create.mockResolvedValue(mockCreatedGuest)

      // Act
      const result = await guestService.createGuest(mockCoupleId, guestData)

      // Assert
      expect(result).toEqual(mockCreatedGuest)
      
      expect(mockPrisma.guest.create).toHaveBeenCalledWith({
        data: {
          coupleId: mockCoupleId,
          firstName: 'John',
          lastName: 'Doe Smith',
          email: 'john@example.com',
          phone: '+1234567890',
          side: undefined,
          relationship: undefined,
          plusOneAllowed: false,
          dietaryRestrictions: undefined,
          notes: undefined,
          plusOneName: undefined,
          address: undefined,
        },
        include: {
          invitations: true,
        },
      })
    })

    it('should handle single name correctly', async () => {
      // Arrange
      const guestData = { name: 'John' }
      const mockCreatedGuest = createMockGuest({
        firstName: 'John',
        lastName: '',
      })
      
      mockPrisma.$transaction.mockImplementation(async (callback) => 
        callback(mockPrisma)
      )
      mockPrisma.guest.create.mockResolvedValue(mockCreatedGuest)

      // Act
      await guestService.createGuest(mockCoupleId, guestData)

      // Assert
      expect(mockPrisma.guest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'John',
            lastName: '',
          }),
        })
      )
    })

    it('should clear cache after creating guest', async () => {
      // Arrange
      const guestData = { name: 'John Doe' }
      mockPrisma.$transaction.mockImplementation(async (callback) => 
        callback(mockPrisma)
      )
      mockPrisma.guest.create.mockResolvedValue(createMockGuest())

      // Act
      await guestService.createGuest(mockCoupleId, guestData)

      // Assert
      expect(mockCache.invalidateByTag).toHaveBeenCalledWith(`guests:${mockCoupleId}`)
      expect(mockCache.invalidateByTag).toHaveBeenCalledWith(`couple:${mockCoupleId}`)
    })
  })

  describe('updateGuest', () => {
    it('should update guest with new data', async () => {
      // Arrange
      const updateData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        plusOneAllowed: true,
      }
      const mockUpdatedGuest = createMockGuest({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        plusOneAllowed: true,
      })
      
      mockPrisma.guest.update.mockResolvedValue(mockUpdatedGuest)

      // Act
      const result = await guestService.updateGuest(mockGuestId, mockCoupleId, updateData)

      // Assert
      expect(result).toEqual(mockUpdatedGuest)
      
      expect(mockPrisma.guest.update).toHaveBeenCalledWith({
        where: { id: mockGuestId },
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          plusOneAllowed: true,
        },
        include: {
          invitations: true,
        },
      })
    })

    it('should clear cache after updating guest', async () => {
      // Arrange
      mockPrisma.guest.update.mockResolvedValue(createMockGuest())

      // Act
      await guestService.updateGuest(mockGuestId, mockCoupleId, { name: 'Updated Name' })

      // Assert
      expect(mockCache.invalidateByTag).toHaveBeenCalledWith(`guests:${mockCoupleId}`)
      expect(mockCache.invalidateByTag).toHaveBeenCalledWith(`couple:${mockCoupleId}`)
    })
  })

  describe('deleteGuest', () => {
    it('should delete guest and clear cache', async () => {
      // Arrange
      mockPrisma.guest.delete.mockResolvedValue(createMockGuest())

      // Act
      await guestService.deleteGuest(mockGuestId, mockCoupleId)

      // Assert
      expect(mockPrisma.guest.delete).toHaveBeenCalledWith({
        where: { id: mockGuestId },
      })
      
      expect(mockCache.invalidateByTag).toHaveBeenCalledWith(`guests:${mockCoupleId}`)
      expect(mockCache.invalidateByTag).toHaveBeenCalledWith(`couple:${mockCoupleId}`)
    })
  })

  describe('bulkImportGuests', () => {
    it('should create multiple guests in transaction', async () => {
      // Arrange
      const guestsData = [
        { name: 'Guest One', email: 'one@example.com' },
        { name: 'Guest Two', email: 'two@example.com' },
      ]
      const mockCreatedGuests = [
        createMockGuest({ id: 'guest-1', firstName: 'Guest', lastName: 'One' }),
        createMockGuest({ id: 'guest-2', firstName: 'Guest', lastName: 'Two' }),
      ]
      
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = { ...mockPrisma }
        tx.guest.create
          .mockResolvedValueOnce(mockCreatedGuests[0])
          .mockResolvedValueOnce(mockCreatedGuests[1])
        return callback(tx)
      })

      // Act
      const result = await guestService.bulkImportGuests(mockCoupleId, guestsData)

      // Assert
      expect(result).toEqual(mockCreatedGuests)
      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(mockCache.invalidateByTag).toHaveBeenCalledWith(`guests:${mockCoupleId}`)
    })
  })

  describe('updateRSVP', () => {
    it('should create new invitation when none exists', async () => {
      // Arrange
      const mockGuest = createMockGuest()
      const mockInvitation = {
        id: 'invitation-id',
        guestId: mockGuestId,
        couple_id: mockCoupleId,
        invitationCode: 'ABC123',
        status: 'confirmed',
        respondedAt: new Date(),
      }
      
      mockPrisma.guest.findUnique.mockResolvedValue(mockGuest)
      mockPrisma.invitation.findFirst.mockResolvedValue(null)
      mockPrisma.invitation.create.mockResolvedValue(mockInvitation)

      // Act
      const result = await guestService.updateRSVP(mockGuestId, 'confirmed')

      // Assert
      expect(result).toEqual(mockInvitation)
      
      expect(mockPrisma.invitation.create).toHaveBeenCalledWith({
        data: {
          guestId: mockGuestId,
          couple_id: mockCoupleId,
          invitationCode: expect.any(String),
          status: 'confirmed',
          respondedAt: expect.any(Date),
        },
      })
    })

    it('should update existing invitation', async () => {
      // Arrange
      const mockGuest = createMockGuest()
      const existingInvitation = {
        id: 'invitation-id',
        guestId: mockGuestId,
        status: 'pending',
      }
      const updatedInvitation = {
        ...existingInvitation,
        status: 'confirmed',
        respondedAt: new Date(),
      }
      
      mockPrisma.guest.findUnique.mockResolvedValue(mockGuest)
      mockPrisma.invitation.findFirst.mockResolvedValue(existingInvitation as any)
      mockPrisma.invitation.update.mockResolvedValue(updatedInvitation as any)

      // Act
      const result = await guestService.updateRSVP(mockGuestId, 'confirmed')

      // Assert
      expect(result).toEqual(updatedInvitation)
      
      expect(mockPrisma.invitation.update).toHaveBeenCalledWith({
        where: { id: 'invitation-id' },
        data: {
          status: 'confirmed',
          respondedAt: expect.any(Date),
        },
      })
    })

    it('should throw error when guest not found', async () => {
      // Arrange
      mockPrisma.guest.findUnique.mockResolvedValue(null)

      // Act & Assert
      await expect(guestService.updateRSVP(mockGuestId, 'confirmed'))
        .rejects.toThrow('Guest not found')
    })
  })

  describe('getGuestByInvitationCode', () => {
    it('should return guest for valid invitation code', async () => {
      // Arrange
      const mockInvitation = {
        invitationCode: 'ABC123',
        guest: createMockGuest({
          couple: createMockCouple() as any,
        }),
      }
      
      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation as any)

      // Act
      const result = await guestService.getGuestByInvitationCode('ABC123')

      // Assert
      expect(result).toEqual(mockInvitation.guest)
      
      expect(mockPrisma.invitation.findUnique).toHaveBeenCalledWith({
        where: { invitationCode: 'ABC123' },
        include: {
          guest: {
            include: {
              couple: true,
            },
          },
        },
      })
    })

    it('should return null for invalid invitation code', async () => {
      // Arrange
      mockPrisma.invitation.findUnique.mockResolvedValue(null)

      // Act
      const result = await guestService.getGuestByInvitationCode('INVALID')

      // Assert
      expect(result).toBeNull()
    })
  })
})