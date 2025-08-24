import { BaseRepository, RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'

export type CreditBalanceRecord = {
  userId: string
  credits: number
  updatedAt: Date
}

export type CreditTransaction = {
  userId: string
  amount: number
  operation: 'add' | 'subtract'
  reason?: string
}

export class CreditRepository extends BaseRepository {
  /**
   * Get current credit balance for a user
   */
  async getBalance(userId: string): Promise<RepositoryResult<number>> {
    try {
      const balance = await this.db.creditBalance.findUnique({
        where: { userId },
        select: { credits: true }
      })

      return createSuccessResult(balance?.credits || 0)
    } catch (error) {
      console.error('Failed to get credit balance:', error)
      return createErrorResult('Failed to get credit balance', 'CREDIT_GET_FAILED', 500)
    }
  }

  /**
   * Get full credit balance record for a user
   */
  async getBalanceRecord(userId: string): Promise<RepositoryResult<CreditBalanceRecord | null>> {
    try {
      const balance = await this.db.creditBalance.findUnique({
        where: { userId }
      })

      return createSuccessResult(balance as CreditBalanceRecord | null)
    } catch (error) {
      console.error('Failed to get credit balance record:', error)
      return createErrorResult('Failed to get credit balance record', 'CREDIT_RECORD_GET_FAILED', 500)
    }
  }

  /**
   * Atomically decrement credits with condition check
   * Returns true if successful, false if insufficient credits
   */
  async decrementAtomic(userId: string, units: number): Promise<RepositoryResult<boolean>> {
    try {
      if (units <= 0) {
        return createErrorResult('Credit amount must be positive', 'INVALID_CREDIT_AMOUNT', 400)
      }

      // Use updateMany with condition to ensure atomic operation
      const result = await this.db.creditBalance.updateMany({
        where: {
          userId,
          credits: { gte: units } // Only update if sufficient credits
        },
        data: {
          credits: { decrement: units },
          updatedAt: new Date()
        }
      })

      // If count is 0, either user doesn't exist or insufficient credits
      if (result.count === 0) {
        // Check if user exists to provide better error message
        const existing = await this.db.creditBalance.findUnique({
          where: { userId },
          select: { credits: true }
        })

        if (!existing) {
          // User doesn't have credit balance record, create one with 0 credits
          await this.db.creditBalance.create({
            data: {
              userId,
              credits: 0,
              updatedAt: new Date()
            }
          })
          return createSuccessResult(false) // Still insufficient credits
        }

        return createSuccessResult(false) // Insufficient credits
      }

      return createSuccessResult(true)
    } catch (error) {
      console.error('Failed to decrement credits atomically:', error)
      return createErrorResult('Failed to decrement credits', 'CREDIT_DECREMENT_FAILED', 500)
    }
  }

  /**
   * Add credits to user balance
   */
  async addCredits(userId: string, units: number): Promise<RepositoryResult<CreditBalanceRecord>> {
    try {
      if (units <= 0) {
        return createErrorResult('Credit amount must be positive', 'INVALID_CREDIT_AMOUNT', 400)
      }

      const balance = await this.db.creditBalance.upsert({
        where: { userId },
        update: {
          credits: { increment: units },
          updatedAt: new Date()
        },
        create: {
          userId,
          credits: units,
          updatedAt: new Date()
        }
      })

      return createSuccessResult(balance as CreditBalanceRecord)
    } catch (error) {
      console.error('Failed to add credits:', error)
      return createErrorResult('Failed to add credits', 'CREDIT_ADD_FAILED', 500)
    }
  }

  /**
   * Set credit balance to specific amount (for admin operations)
   */
  async setBalance(userId: string, amount: number): Promise<RepositoryResult<CreditBalanceRecord>> {
    try {
      if (amount < 0) {
        return createErrorResult('Credit balance cannot be negative', 'INVALID_CREDIT_AMOUNT', 400)
      }

      const balance = await this.db.creditBalance.upsert({
        where: { userId },
        update: {
          credits: amount,
          updatedAt: new Date()
        },
        create: {
          userId,
          credits: amount,
          updatedAt: new Date()
        }
      })

      return createSuccessResult(balance as CreditBalanceRecord)
    } catch (error) {
      console.error('Failed to set credit balance:', error)
      return createErrorResult('Failed to set credit balance', 'CREDIT_SET_FAILED', 500)
    }
  }

  /**
   * Perform multiple credit operations in a transaction
   * Useful for complex operations like refunds or transfers
   */
  async performTransaction(transactions: CreditTransaction[]): Promise<RepositoryResult<CreditBalanceRecord[]>> {
    try {
      const results = await this.withTransaction(async (tx) => {
        const balanceResults: CreditBalanceRecord[] = []

        for (const transaction of transactions) {
          const { userId, amount, operation } = transaction

          if (amount <= 0) {
            throw new Error(`Invalid amount for user ${userId}: ${amount}`)
          }

          if (operation === 'subtract') {
            // Check if sufficient credits exist
            const current = await tx.creditBalance.findUnique({
              where: { userId },
              select: { credits: true }
            })

            if (!current || current.credits < amount) {
              throw new Error(`Insufficient credits for user ${userId}. Required: ${amount}, Available: ${current?.credits || 0}`)
            }

            const updated = await tx.creditBalance.update({
              where: { userId },
              data: {
                credits: { decrement: amount },
                updatedAt: new Date()
              }
            })

            balanceResults.push(updated as CreditBalanceRecord)
          } else {
            // Add credits
            const updated = await tx.creditBalance.upsert({
              where: { userId },
              update: {
                credits: { increment: amount },
                updatedAt: new Date()
              },
              create: {
                userId,
                credits: amount,
                updatedAt: new Date()
              }
            })

            balanceResults.push(updated as CreditBalanceRecord)
          }
        }

        return balanceResults
      })

      return createSuccessResult(results)
    } catch (error) {
      console.error('Failed to perform credit transaction:', error)
      
      if (error instanceof Error && error.message.includes('Insufficient credits')) {
        return createErrorResult(error.message, 'INSUFFICIENT_CREDITS', 402)
      }
      
      return createErrorResult('Failed to perform credit transaction', 'CREDIT_TRANSACTION_FAILED', 500)
    }
  }

  /**
   * Get credit balances for multiple users (for admin/reporting)
   */
  async getMultipleBalances(userIds: string[]): Promise<RepositoryResult<CreditBalanceRecord[]>> {
    try {
      const balances = await this.db.creditBalance.findMany({
        where: {
          userId: { in: userIds }
        },
        orderBy: { updatedAt: 'desc' }
      })

      return createSuccessResult(balances as CreditBalanceRecord[])
    } catch (error) {
      console.error('Failed to get multiple credit balances:', error)
      return createErrorResult('Failed to get credit balances', 'CREDIT_MULTI_GET_FAILED', 500)
    }
  }

  /**
   * Check if user has sufficient credits without modifying balance
   */
  async hasSufficientCredits(userId: string, requiredAmount: number): Promise<RepositoryResult<boolean>> {
    try {
      const balance = await this.db.creditBalance.findUnique({
        where: { userId },
        select: { credits: true }
      })

      const currentCredits = balance?.credits || 0
      return createSuccessResult(currentCredits >= requiredAmount)
    } catch (error) {
      console.error('Failed to check credit sufficiency:', error)
      return createErrorResult('Failed to check credits', 'CREDIT_CHECK_FAILED', 500)
    }
  }

  /**
   * Initialize credit balance for new user
   */
  async initializeBalance(userId: string, initialCredits: number = 0): Promise<RepositoryResult<CreditBalanceRecord>> {
    try {
      if (initialCredits < 0) {
        return createErrorResult('Initial credits cannot be negative', 'INVALID_CREDIT_AMOUNT', 400)
      }

      // Only create if doesn't exist
      const existing = await this.db.creditBalance.findUnique({
        where: { userId }
      })

      if (existing) {
        return createSuccessResult(existing as CreditBalanceRecord)
      }

      const balance = await this.db.creditBalance.create({
        data: {
          userId,
          credits: initialCredits,
          updatedAt: new Date()
        }
      })

      return createSuccessResult(balance as CreditBalanceRecord)
    } catch (error) {
      console.error('Failed to initialize credit balance:', error)
      return createErrorResult('Failed to initialize credits', 'CREDIT_INIT_FAILED', 500)
    }
  }

  /**
   * Delete credit balance (for user cleanup)
   */
  async deleteBalance(userId: string): Promise<RepositoryResult<boolean>> {
    try {
      const deleted = await this.db.creditBalance.delete({
        where: { userId }
      })

      return createSuccessResult(!!deleted)
    } catch (error) {
      console.error('Failed to delete credit balance:', error)
      
      // Handle case where balance doesn't exist
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return createSuccessResult(false)
      }
      
      return createErrorResult('Failed to delete credit balance', 'CREDIT_DELETE_FAILED', 500)
    }
  }
}