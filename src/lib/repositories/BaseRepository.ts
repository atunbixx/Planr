import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

export abstract class BaseRepository {
  protected db: PrismaClient

  constructor() {
    this.db = prisma
  }

  /**
   * Execute operations within a transaction
   * Automatically rolls back on error
   */
  async withTransaction<T>(
    operation: (tx: PrismaClient) => Promise<T>
  ): Promise<T> {
    return await this.db.$transaction(operation)
  }

  /**
   * Check if database is available
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.db.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }
}

export interface RepositoryResult<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    statusCode?: number
  }
}

export function createSuccessResult<T>(data: T): RepositoryResult<T> {
  return {
    success: true,
    data
  }
}

export function createErrorResult<T>(
  message: string,
  code?: string,
  statusCode?: number
): RepositoryResult<T> {
  return {
    success: false,
    error: {
      message,
      code,
      statusCode
    }
  }
}