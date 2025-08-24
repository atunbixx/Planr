import { BudgetRepository, BudgetRecord } from '../repo/budget.repository'
import { RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'
import { createBudgetSchema, updateBudgetSchema } from '@/lib/validation/budget'

export class BudgetService {
  private repo = new BudgetRepository()

  async list(userId: string): Promise<RepositoryResult<{ items: BudgetRecord[]; summary: { totalAmount: number; totalAllocated: number; totalActual: number; remainingBudget: number; percentSpent: number } }>> {
    const base = await this.repo.list(userId)
    if (!base.success) return base as any
    const s = base.data!.summary
    const enhanced = {
      totalAmount: s.totalAmount,
      totalAllocated: s.totalAllocated,
      totalActual: s.totalActual,
      remainingBudget: s.totalAmount - s.totalActual,
      percentSpent: s.totalAmount > 0 ? (s.totalActual / s.totalAmount) * 100 : 0,
    }
    return createSuccessResult({ items: base.data!.items, summary: enhanced })
  }

  async create(userId: string, body: any): Promise<RepositoryResult<BudgetRecord>> {
    const parsed = createBudgetSchema.safeParse(body)
    if (!parsed.success) return createErrorResult('Validation error', 'VALIDATION_ERROR', 400)
    return this.repo.create(userId, parsed.data as any)
  }

  async get(userId: string, id: string) {
    return this.repo.get(userId, id)
  }

  async update(userId: string, id: string, body: any) {
    const parsed = updateBudgetSchema.safeParse(body)
    if (!parsed.success) return createErrorResult('Validation error', 'VALIDATION_ERROR', 400)
    return this.repo.update(userId, id, parsed.data as any)
  }

  async delete(userId: string, id: string) {
    return this.repo.delete(userId, id)
  }
}

