/**
 * Unit tests for CreditRepository
 * Focus on atomic operations and race condition prevention
 */

import { CreditRepository, CreditTransaction } from '../credit.repository'

// Mock Prisma client
const mockPrisma = {
  creditBalance: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn()
}

// Mock the BaseRepository
jest.mock('@/lib/repositories/BaseRepository', () => ({
  BaseRepository: class {
    protected db = mockPrisma
    async withTransaction(operation: any) {
      return mockPrisma.$transaction(operation)
    }
  },
  createSuccessResult: (data: any) => ({ success: true, data }),
  createErrorResult: (message: string, code?: string, statusCode?: number) => ({
    success: false,
    error: { message, code, statusCode }
  })
}))

describe('CreditRepository', () => {
  let repository: CreditRepository
  
  beforeEach(() => {
    repository = new CreditRepository()
    jest.clearAllMocks()
  })

  describe('getBalance', () => {
    it('should return user credit balance', async () => {
      mockPrisma.creditBalance.findUnique.mockResolvedValue({ credits: 100 })

      const result = await repository.getBalance('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(100)
      expect(mockPrisma.creditBalance.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: { credits: true }
      })
    })

    it('should return 0 when user has no credit balance', async () => {
      mockPrisma.creditBalance.findUnique.mockResolvedValue(null)

      const result = await repository.getBalance('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(0)
    })

    it('should handle database errors', async () => {
      mockPrisma.creditBalance.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await repository.getBalance('user-123')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('CREDIT_GET_FAILED')
      expect(result.error?.statusCode).toBe(500)
    })
  })

  describe('decrementAtomic', () => {
    it('should successfully decrement credits when sufficient balance exists', async () => {
      mockPrisma.creditBalance.updateMany.mockResolvedValue({ count: 1 })

      const result = await repository.decrementAtomic('user-123', 10)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockPrisma.creditBalance.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          credits: { gte: 10 }
        },
        data: {
          credits: { decrement: 10 },
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should return false when insufficient credits', async () => {
      mockPrisma.creditBalance.updateMany.mockResolvedValue({ count: 0 })
      mockPrisma.creditBalance.findUnique.mockResolvedValue({ credits: 5 })

      const result = await repository.decrementAtomic('user-123', 10)

      expect(result.success).toBe(true)
      expect(result.data).toBe(false)
    })

    it('should create zero balance record when user does not exist', async () => {
      mockPrisma.creditBalance.updateMany.mockResolvedValue({ count: 0 })
      mockPrisma.creditBalance.findUnique.mockResolvedValue(null)
      mockPrisma.creditBalance.create.mockResolvedValue({ userId: 'user-123', credits: 0 })

      const result = await repository.decrementAtomic('user-123', 10)

      expect(result.success).toBe(true)
      expect(result.data).toBe(false)
      expect(mockPrisma.creditBalance.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          credits: 0,
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should reject negative or zero amounts', async () => {
      const result = await repository.decrementAtomic('user-123', 0)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Credit amount must be positive')
      expect(result.error?.code).toBe('INVALID_CREDIT_AMOUNT')
      expect(result.error?.statusCode).toBe(400)
    })

    it('should handle database errors during decrement', async () => {
      mockPrisma.creditBalance.updateMany.mockRejectedValue(new Error('Database error'))

      const result = await repository.decrementAtomic('user-123', 10)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('CREDIT_DECREMENT_FAILED')
    })
  })

  describe('addCredits', () => {
    it('should add credits to existing balance', async () => {
      const mockBalance = {
        userId: 'user-123',
        credits: 150,
        updatedAt: new Date()
      }
      mockPrisma.creditBalance.upsert.mockResolvedValue(mockBalance)

      const result = await repository.addCredits('user-123', 50)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBalance)
      expect(mockPrisma.creditBalance.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: {
          credits: { increment: 50 },
          updatedAt: expect.any(Date)
        },
        create: {
          userId: 'user-123',
          credits: 50,
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should create new balance when user does not exist', async () => {
      const mockBalance = {
        userId: 'user-456',
        credits: 25,
        updatedAt: new Date()
      }
      mockPrisma.creditBalance.upsert.mockResolvedValue(mockBalance)

      const result = await repository.addCredits('user-456', 25)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBalance)
    })

    it('should reject negative or zero amounts', async () => {
      const result = await repository.addCredits('user-123', -10)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVALID_CREDIT_AMOUNT')
    })
  })

  describe('setBalance', () => {
    it('should set credit balance to specific amount', async () => {
      const mockBalance = {
        userId: 'user-123',
        credits: 200,
        updatedAt: new Date()
      }
      mockPrisma.creditBalance.upsert.mockResolvedValue(mockBalance)

      const result = await repository.setBalance('user-123', 200)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBalance)
      expect(mockPrisma.creditBalance.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: {
          credits: 200,
          updatedAt: expect.any(Date)
        },
        create: {
          userId: 'user-123',
          credits: 200,
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should reject negative balance amounts', async () => {
      const result = await repository.setBalance('user-123', -50)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Credit balance cannot be negative')
      expect(result.error?.code).toBe('INVALID_CREDIT_AMOUNT')
    })
  })

  describe('performTransaction', () => {
    it('should perform multiple credit operations in transaction', async () => {
      const transactions: CreditTransaction[] = [
        { userId: 'user-1', amount: 50, operation: 'add' },
        { userId: 'user-2', amount: 25, operation: 'subtract' }
      ]

      const mockResults = [
        { userId: 'user-1', credits: 150, updatedAt: new Date() },
        { userId: 'user-2', credits: 75, updatedAt: new Date() }
      ]

      // Mock transaction function
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          creditBalance: {
            findUnique: jest.fn().mockResolvedValue({ credits: 100 }),
            update: jest.fn().mockResolvedValue(mockResults[1]),
            upsert: jest.fn().mockResolvedValue(mockResults[0])
          }
        }
        return await callback(mockTx)
      })

      const result = await repository.performTransaction(transactions)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('should fail transaction when insufficient credits for subtraction', async () => {
      const transactions: CreditTransaction[] = [
        { userId: 'user-1', amount: 100, operation: 'subtract' }
      ]

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          creditBalance: {
            findUnique: jest.fn().mockResolvedValue({ credits: 50 }) // Insufficient
          }
        }
        return await callback(mockTx)
      })

      const result = await repository.performTransaction(transactions)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INSUFFICIENT_CREDITS')
      expect(result.error?.statusCode).toBe(402)
    })

    it('should reject invalid transaction amounts', async () => {
      const transactions: CreditTransaction[] = [
        { userId: 'user-1', amount: 0, operation: 'add' }
      ]

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {}
        return await callback(mockTx)
      })

      const result = await repository.performTransaction(transactions)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('CREDIT_TRANSACTION_FAILED')
    })
  })

  describe('hasSufficientCredits', () => {
    it('should return true when user has sufficient credits', async () => {
      mockPrisma.creditBalance.findUnique.mockResolvedValue({ credits: 100 })

      const result = await repository.hasSufficientCredits('user-123', 50)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })

    it('should return false when user has insufficient credits', async () => {
      mockPrisma.creditBalance.findUnique.mockResolvedValue({ credits: 30 })

      const result = await repository.hasSufficientCredits('user-123', 50)

      expect(result.success).toBe(true)
      expect(result.data).toBe(false)
    })

    it('should return false when user has no balance record', async () => {
      mockPrisma.creditBalance.findUnique.mockResolvedValue(null)

      const result = await repository.hasSufficientCredits('user-123', 50)

      expect(result.success).toBe(true)
      expect(result.data).toBe(false)
    })
  })

  describe('initializeBalance', () => {
    it('should create new balance with initial credits', async () => {
      const mockBalance = {
        userId: 'user-123',
        credits: 100,
        updatedAt: new Date()
      }

      mockPrisma.creditBalance.findUnique.mockResolvedValue(null)
      mockPrisma.creditBalance.create.mockResolvedValue(mockBalance)

      const result = await repository.initializeBalance('user-123', 100)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBalance)
      expect(mockPrisma.creditBalance.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          credits: 100,
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should return existing balance if already exists', async () => {
      const existingBalance = {
        userId: 'user-123',
        credits: 50,
        updatedAt: new Date()
      }

      mockPrisma.creditBalance.findUnique.mockResolvedValue(existingBalance)

      const result = await repository.initializeBalance('user-123', 100)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(existingBalance)
      expect(mockPrisma.creditBalance.create).not.toHaveBeenCalled()
    })

    it('should reject negative initial credits', async () => {
      const result = await repository.initializeBalance('user-123', -10)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVALID_CREDIT_AMOUNT')
    })
  })

  describe('getMultipleBalances', () => {
    it('should return balances for multiple users', async () => {
      const mockBalances = [
        { userId: 'user-1', credits: 100, updatedAt: new Date() },
        { userId: 'user-2', credits: 200, updatedAt: new Date() }
      ]

      mockPrisma.creditBalance.findMany.mockResolvedValue(mockBalances)

      const result = await repository.getMultipleBalances(['user-1', 'user-2'])

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBalances)
      expect(mockPrisma.creditBalance.findMany).toHaveBeenCalledWith({
        where: {
          userId: { in: ['user-1', 'user-2'] }
        },
        orderBy: { updatedAt: 'desc' }
      })
    })

    it('should return empty array when no users found', async () => {
      mockPrisma.creditBalance.findMany.mockResolvedValue([])

      const result = await repository.getMultipleBalances(['nonexistent'])

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  describe('deleteBalance', () => {
    it('should delete credit balance successfully', async () => {
      mockPrisma.creditBalance.delete.mockResolvedValue({ userId: 'user-123' })

      const result = await repository.deleteBalance('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockPrisma.creditBalance.delete).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      })
    })

    it('should return false when balance does not exist', async () => {
      const error = new Error('Record to delete does not exist')
      mockPrisma.creditBalance.delete.mockRejectedValue(error)

      const result = await repository.deleteBalance('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(false)
    })

    it('should handle other database errors', async () => {
      mockPrisma.creditBalance.delete.mockRejectedValue(new Error('Database connection failed'))

      const result = await repository.deleteBalance('user-123')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('CREDIT_DELETE_FAILED')
    })
  })

  describe('Race Condition Scenarios', () => {
    it('should handle concurrent decrement attempts correctly', async () => {
      // Simulate race condition where two operations try to decrement simultaneously
      // Only one should succeed when there are insufficient credits for both
      
      // First call succeeds (updateMany returns count: 1)
      mockPrisma.creditBalance.updateMany
        .mockResolvedValueOnce({ count: 1 })  // First operation succeeds
        .mockResolvedValueOnce({ count: 0 })  // Second operation fails

      mockPrisma.creditBalance.findUnique.mockResolvedValue({ credits: 5 })

      const result1 = await repository.decrementAtomic('user-123', 10)
      const result2 = await repository.decrementAtomic('user-123', 10)

      expect(result1.success).toBe(true)
      expect(result1.data).toBe(true)   // First operation succeeds
      expect(result2.success).toBe(true)
      expect(result2.data).toBe(false)  // Second operation fails due to insufficient credits
    })

    it('should maintain data consistency in transaction rollback', async () => {
      const transactions: CreditTransaction[] = [
        { userId: 'user-1', amount: 50, operation: 'add' },
        { userId: 'user-2', amount: 1000, operation: 'subtract' } // This will fail
      ]

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          creditBalance: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ credits: 100 }) // user-1 check passes
              .mockResolvedValueOnce({ credits: 50 }),  // user-2 check fails
            update: jest.fn(),
            upsert: jest.fn()
          }
        }
        
        // Simulate transaction failure
        throw new Error('Insufficient credits for user user-2. Required: 1000, Available: 50')
      })

      const result = await repository.performTransaction(transactions)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INSUFFICIENT_CREDITS')
      expect(result.error?.statusCode).toBe(402)
    })
  })
})