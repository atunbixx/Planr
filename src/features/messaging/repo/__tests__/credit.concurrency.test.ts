/**
 * Concurrency and race condition tests for CreditRepository
 * These tests simulate real-world concurrent scenarios
 */

import { CreditRepository } from '../credit.repository'

// Mock Prisma client with more sophisticated concurrency simulation
const mockPrisma = {
  creditBalance: {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    create: jest.fn(),
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

describe('CreditRepository - Concurrency Tests', () => {
  let repository: CreditRepository
  
  beforeEach(() => {
    repository = new CreditRepository()
    jest.clearAllMocks()
  })

  describe('Atomic Decrement Race Conditions', () => {
    it('should handle two concurrent decrements with exactly enough credits for one', async () => {
      // Scenario: User has 10 credits, two operations try to decrement 10 each
      // Only one should succeed due to atomic updateMany with condition
      
      let callCount = 0
      mockPrisma.creditBalance.updateMany.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call succeeds (credits were >= 10)
          return Promise.resolve({ count: 1 })
        } else {
          // Second call fails (credits now < 10 after first decrement)
          return Promise.resolve({ count: 0 })
        }
      })

      // For the failed operation, we need to check existing balance
      mockPrisma.creditBalance.findUnique.mockResolvedValue({ credits: 0 })

      // Simulate concurrent operations
      const [result1, result2] = await Promise.all([
        repository.decrementAtomic('user-123', 10),
        repository.decrementAtomic('user-123', 10)
      ])

      // Exactly one should succeed
      const successes = [result1, result2].filter(r => r.success && r.data === true)
      const failures = [result1, result2].filter(r => r.success && r.data === false)

      expect(successes).toHaveLength(1)
      expect(failures).toHaveLength(1)
      expect(mockPrisma.creditBalance.updateMany).toHaveBeenCalledTimes(2)
    })

    it('should handle multiple concurrent decrements with varying amounts', async () => {
      // Scenario: User has 50 credits, operations try to decrement 30, 25, 15
      // Only one should succeed
      
      const operations = [30, 25, 15]
      let successCount = 0
      
      mockPrisma.creditBalance.updateMany.mockImplementation((params) => {
        const amount = params.data.credits.decrement
        
        if (successCount === 0 && amount <= 50) {
          successCount++
          return Promise.resolve({ count: 1 })
        } else {
          return Promise.resolve({ count: 0 })
        }
      })

      mockPrisma.creditBalance.findUnique.mockResolvedValue({ credits: 20 }) // Remaining after first success

      const results = await Promise.all(
        operations.map(amount => repository.decrementAtomic('user-123', amount))
      )

      const successes = results.filter(r => r.success && r.data === true)
      const failures = results.filter(r => r.success && r.data === false)

      expect(successes).toHaveLength(1)
      expect(failures).toHaveLength(2)
    })

    it('should handle concurrent add and decrement operations', async () => {
      // Scenario: Concurrent add 50 and decrement 30 operations
      // Both should be able to succeed if properly ordered
      
      let balance = 20 // Starting balance
      
      mockPrisma.creditBalance.updateMany.mockImplementation((params) => {
        if (params.data.credits.decrement) {
          const amount = params.data.credits.decrement
          if (balance >= amount) {
            balance -= amount
            return Promise.resolve({ count: 1 })
          } else {
            return Promise.resolve({ count: 0 })
          }
        }
        return Promise.resolve({ count: 1 })
      })

      mockPrisma.creditBalance.upsert.mockImplementation((params) => {
        if (params.update.credits.increment) {
          balance += params.update.credits.increment
        }
        return Promise.resolve({ userId: 'user-123', credits: balance, updatedAt: new Date() })
      })

      mockPrisma.creditBalance.findUnique.mockImplementation(() => {
        return Promise.resolve({ credits: balance })
      })

      // Run add and decrement concurrently
      const [addResult, decrementResult] = await Promise.all([
        repository.addCredits('user-123', 50),
        repository.decrementAtomic('user-123', 30)
      ])

      expect(addResult.success).toBe(true)
      // Decrement might succeed or fail depending on timing, but should be consistent
      expect(decrementResult.success).toBe(true)
    })
  })

  describe('Transaction Concurrency', () => {
    it('should handle concurrent transactions with overlapping users', async () => {
      // Scenario: Two transactions affecting the same users concurrently
      
      const transaction1 = [
        { userId: 'user-1', amount: 50, operation: 'add' as const },
        { userId: 'user-2', amount: 25, operation: 'subtract' as const }
      ]

      const transaction2 = [
        { userId: 'user-1', amount: 30, operation: 'subtract' as const },
        { userId: 'user-3', amount: 100, operation: 'add' as const }
      ]

      let transactionCount = 0
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        transactionCount++
        
        const mockTx = {
          creditBalance: {
            findUnique: jest.fn().mockImplementation((params) => {
              // Simulate different balances for different users
              const userId = params.where.userId
              const balances = {
                'user-1': 100,
                'user-2': 50,
                'user-3': 0
              }
              return Promise.resolve({ credits: balances[userId] || 0 })
            }),
            update: jest.fn().mockResolvedValue({ userId: 'test', credits: 50, updatedAt: new Date() }),
            upsert: jest.fn().mockResolvedValue({ userId: 'test', credits: 100, updatedAt: new Date() })
          }
        }

        return await callback(mockTx)
      })

      const [result1, result2] = await Promise.all([
        repository.performTransaction(transaction1),
        repository.performTransaction(transaction2)
      ])

      // Both transactions should complete successfully
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2)
    })

    it('should handle transaction failure and rollback correctly', async () => {
      const transaction = [
        { userId: 'user-1', amount: 50, operation: 'add' as const },
        { userId: 'user-2', amount: 1000, operation: 'subtract' as const }, // This will fail
        { userId: 'user-3', amount: 25, operation: 'add' as const }
      ]

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          creditBalance: {
            findUnique: jest.fn().mockImplementation((params) => {
              const userId = params.where.userId
              if (userId === 'user-2') {
                return Promise.resolve({ credits: 50 }) // Insufficient for 1000
              }
              return Promise.resolve({ credits: 100 })
            }),
            update: jest.fn(),
            upsert: jest.fn()
          }
        }

        // Simulate the callback execution that will throw an error
        try {
          return await callback(mockTx)
        } catch (error) {
          throw error // Re-throw to simulate transaction rollback
        }
      })

      const result = await repository.performTransaction(transaction)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INSUFFICIENT_CREDITS')
      expect(result.error?.statusCode).toBe(402)
    })
  })

  describe('High Concurrency Scenarios', () => {
    it('should handle many concurrent small decrements', async () => {
      // Scenario: 10 concurrent operations trying to decrement 1 credit each
      // User has 5 credits, so only 5 should succeed
      
      const userCredits = 5
      let successfulDecrements = 0
      
      mockPrisma.creditBalance.updateMany.mockImplementation(() => {
        if (successfulDecrements < userCredits) {
          successfulDecrements++
          return Promise.resolve({ count: 1 })
        } else {
          return Promise.resolve({ count: 0 })
        }
      })

      mockPrisma.creditBalance.findUnique.mockResolvedValue({ credits: 0 })

      // Create 10 concurrent decrement operations
      const operations = Array(10).fill(null).map(() => 
        repository.decrementAtomic('user-123', 1)
      )

      const results = await Promise.all(operations)

      const successes = results.filter(r => r.success && r.data === true)
      const failures = results.filter(r => r.success && r.data === false)

      expect(successes).toHaveLength(userCredits)
      expect(failures).toHaveLength(10 - userCredits)
    })

    it('should maintain consistency under rapid add/subtract cycles', async () => {
      // Scenario: Rapid alternating add and subtract operations
      
      let currentBalance = 100
      const operations = []

      // Create alternating add/subtract operations
      for (let i = 0; i < 20; i++) {
        if (i % 2 === 0) {
          operations.push(repository.addCredits('user-123', 10))
        } else {
          operations.push(repository.decrementAtomic('user-123', 5))
        }
      }

      // Mock implementations that track balance changes
      mockPrisma.creditBalance.upsert.mockImplementation((params) => {
        if (params.update.credits.increment) {
          currentBalance += params.update.credits.increment
        }
        return Promise.resolve({ 
          userId: 'user-123', 
          credits: currentBalance, 
          updatedAt: new Date() 
        })
      })

      mockPrisma.creditBalance.updateMany.mockImplementation((params) => {
        const amount = params.data.credits.decrement
        if (currentBalance >= amount) {
          currentBalance -= amount
          return Promise.resolve({ count: 1 })
        } else {
          return Promise.resolve({ count: 0 })
        }
      })

      mockPrisma.creditBalance.findUnique.mockImplementation(() => {
        return Promise.resolve({ credits: currentBalance })
      })

      const results = await Promise.all(operations)

      // All add operations should succeed
      const addResults = results.filter((_, index) => index % 2 === 0)
      expect(addResults.every(r => r.success)).toBe(true)

      // Most subtract operations should succeed (depending on timing)
      const subtractResults = results.filter((_, index) => index % 2 === 1)
      expect(subtractResults.every(r => r.success)).toBe(true)
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle database connection failures during concurrent operations', async () => {
      mockPrisma.creditBalance.updateMany.mockRejectedValue(new Error('Connection lost'))

      const operations = Array(5).fill(null).map(() => 
        repository.decrementAtomic('user-123', 10)
      )

      const results = await Promise.all(operations)

      // All operations should fail gracefully
      expect(results.every(r => !r.success)).toBe(true)
      expect(results.every(r => r.error?.code === 'CREDIT_DECREMENT_FAILED')).toBe(true)
    })

    it('should handle mixed success and failure in concurrent operations', async () => {
      let callCount = 0
      mockPrisma.creditBalance.updateMany.mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.resolve({ count: 1 }) // First 2 succeed
        } else if (callCount <= 4) {
          return Promise.resolve({ count: 0 }) // Next 2 fail (insufficient credits)
        } else {
          throw new Error('Database error') // Last ones error
        }
      })

      mockPrisma.creditBalance.findUnique.mockResolvedValue({ credits: 0 })

      const operations = Array(6).fill(null).map(() => 
        repository.decrementAtomic('user-123', 10)
      )

      const results = await Promise.all(operations)

      const successes = results.filter(r => r.success && r.data === true)
      const insufficientCredits = results.filter(r => r.success && r.data === false)
      const errors = results.filter(r => !r.success)

      expect(successes).toHaveLength(2)
      expect(insufficientCredits).toHaveLength(2)
      expect(errors).toHaveLength(2)
    })
  })
})