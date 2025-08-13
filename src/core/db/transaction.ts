/**
 * Transaction Management - Enterprise patterns for data consistency
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export type TransactionClient = Prisma.TransactionClient

export interface TransactionOptions {
  maxWait?: number
  timeout?: number
  isolationLevel?: Prisma.TransactionIsolationLevel
}

/**
 * Execute operations within a database transaction
 * Ensures atomicity for multi-step business operations
 */
export async function withTransaction<T>(
  operations: (tx: TransactionClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const {
    maxWait = 5000,    // 5 seconds max wait
    timeout = 30000,   // 30 seconds timeout
    isolationLevel = Prisma.TransactionIsolationLevel.ReadCommitted
  } = options

  try {
    return await prisma.$transaction(
      operations,
      {
        maxWait,
        timeout,
        isolationLevel
      }
    )
  } catch (error) {
    console.error('Transaction failed:', error)
    throw new TransactionError('Transaction failed', error as Error)
  }
}

/**
 * Transaction-specific error handling
 */
export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly cause: Error
  ) {
    super(message)
    this.name = 'TransactionError'
  }
}

/**
 * Retry transaction with exponential backoff
 * Useful for handling temporary deadlocks or conflicts
 */
export async function withRetryableTransaction<T>(
  operations: (tx: TransactionClient) => Promise<T>,
  options: TransactionOptions & { maxRetries?: number } = {}
): Promise<T> {
  const { maxRetries = 3, ...transactionOptions } = options
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(operations, transactionOptions)
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = 100 * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      console.warn(`Transaction attempt ${attempt + 1} failed, retrying in ${delay}ms`)
    }
  }
  
  throw new Error('Max retries exceeded')
}