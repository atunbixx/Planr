"use client"

import { api } from '@/lib/api/fetcher'
import { BudgetListResponseDto, BudgetItemDto, BudgetSummaryDto } from '@/contracts/budget'

// Keep exported types for compatibility
export type RawBudgetItem = {
  id: string
  userId: string
  category: string
  amount: string | number
  allocated: string | number
  actual: string | number
  status: 'planned'|'quoted'|'booked'|'paid'
  createdAt: string
  updatedAt: string
  name?: string
}

export type BudgetSummary = {
  totalAmount: number
  totalAllocated: number
  totalActual: number
  remainingBudget: number
  percentSpent: number
}

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message: string } }

export const BudgetClient = {
  async list(): Promise<{ items: RawBudgetItem[]; summary: BudgetSummary }>{
    const env = await api.get<ApiEnvelope<unknown>>('/api/budget')
    if (!env.success) throw new Error(env.error?.message || 'Failed to load budget')
    const parsed = BudgetListResponseDto.safeParse(env.data)
    if (!parsed.success) throw new Error('Invalid budget response shape')
    // Cast to legacy RawBudgetItem shape (numbers ok)
    return parsed.data as any
  },
  async create(data: Partial<RawBudgetItem>): Promise<RawBudgetItem> {
    const env = await api.post<ApiEnvelope<unknown>>('/api/budget', data)
    if (!env.success) throw new Error(env.error?.message || 'Failed to create budget item')
    const parsed = BudgetItemDto.safeParse(env.data)
    if (!parsed.success) throw new Error('Invalid budget item shape')
    return parsed.data as any
  },
  async update(id: string, data: Partial<RawBudgetItem>): Promise<RawBudgetItem> {
    const env = await api.put<ApiEnvelope<unknown>>(`/api/budget/${id}`, data)
    if (!env.success) throw new Error(env.error?.message || 'Failed to update budget item')
    const parsed = BudgetItemDto.safeParse(env.data)
    if (!parsed.success) throw new Error('Invalid budget item shape')
    return parsed.data as any
  },
  async remove(id: string): Promise<void> {
    const env = await api.delete<ApiEnvelope<unknown>>(`/api/budget/${id}`)
    if (!env.success) throw new Error(env.error?.message || 'Failed to delete budget item')
  }
}
