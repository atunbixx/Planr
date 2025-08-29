import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'
import { USE_TEMP_STORAGE_FALLBACK } from '@/lib/config/env'
import { RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'

export type BudgetRecord = {
  id: string
  userId: string
  category: string
  amount: number
  allocated: number
  actual: number
  status: 'planned'|'quoted'|'booked'|'paid'
  createdAt: string
  updatedAt: string
}

export class BudgetRepository {
  async list(userId: string): Promise<RepositoryResult<{ items: BudgetRecord[]; summary: { totalAmount: number; totalAllocated: number; totalActual: number } }>> {
    try {
      const items = await prisma.budget.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
      const summary = items.reduce((acc, item: any) => {
        acc.totalAmount += Number(item.amount)
        acc.totalAllocated += Number(item.allocated)
        acc.totalActual += Number(item.actual)
        return acc
      }, { totalAmount: 0, totalAllocated: 0, totalActual: 0 })
      return createSuccessResult({ items: items as any, summary })
    } catch (err) {
      if (!USE_TEMP_STORAGE_FALLBACK) {
        return createErrorResult('Database unavailable', 'DB_UNAVAILABLE', 503)
      }
      try {
        const { items, summary } = await tempStorage.listBudgets(userId)
        return createSuccessResult({ items: items as any, summary })
      } catch (e) {
        return createErrorResult('Failed to list budget items', 'BUDGET_LIST_FAILED', 500)
      }
    }
  }

  async create(userId: string, data: Partial<BudgetRecord>): Promise<RepositoryResult<BudgetRecord>> {
    try {
      const item = await prisma.budget.create({ data: { ...(data as any), userId } })
      return createSuccessResult(item as any)
    } catch (err) {
      if (!USE_TEMP_STORAGE_FALLBACK) {
        return createErrorResult('Database unavailable', 'DB_UNAVAILABLE', 503)
      }
      try {
        const created = await tempStorage.createBudget(userId, data as any)
        return createSuccessResult(created as any)
      } catch (e) {
        return createErrorResult('Failed to create budget item', 'BUDGET_CREATE_FAILED', 500)
      }
    }
  }

  async get(userId: string, id: string): Promise<RepositoryResult<BudgetRecord | null>> {
    try {
      const item = await prisma.budget.findFirst({ where: { id, userId } })
      return createSuccessResult((item as any) || null)
    } catch (err) {
      return createErrorResult('Failed to get budget item', 'BUDGET_GET_FAILED', 500)
    }
  }

  async update(userId: string, id: string, data: Partial<BudgetRecord>): Promise<RepositoryResult<BudgetRecord | null>> {
    try {
      const updatedCount = await prisma.budget.updateMany({ where: { id, userId }, data: data as any })
      if (updatedCount.count === 0) return createSuccessResult(null)
      const updated = await prisma.budget.findUnique({ where: { id } })
      return createSuccessResult(updated as any)
    } catch (err) {
      return createErrorResult('Failed to update budget item', 'BUDGET_UPDATE_FAILED', 500)
    }
  }

  async delete(userId: string, id: string): Promise<RepositoryResult<boolean>> {
    try {
      const deleted = await prisma.budget.deleteMany({ where: { id, userId } })
      return createSuccessResult(deleted.count > 0)
    } catch (err) {
      return createErrorResult('Failed to delete budget item', 'BUDGET_DELETE_FAILED', 500)
    }
  }
}
