import { NextRequest, NextResponse } from 'next/server'
import { BudgetService } from '../service/budget.service'
import { tempStorage } from '@/lib/db/temp-storage'
import { BudgetItemDto, BudgetListResponseDto } from '@/contracts/budget'
import { NotificationRepository } from '@/features/notifications/repo/notification.repository'

export class BudgetHandler {
  private service = new BudgetService()
  private notifications = new NotificationRepository()

  async list(_request: NextRequest, userId: string) {
    try {
      // Compose items + summary from service
      const [itemsRes, summaryRes] = await Promise.all([
        this.service.getBudgetItems(userId),
        this.service.getBudgetSummary(userId),
      ])

      // Fallbacks if service fails (e.g., migrations not applied yet)
      const rawItems = itemsRes.success ? (itemsRes.data || []) : []
      const rawSummary = summaryRes.success ? summaryRes.data! : {
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        completionPercentage: 0,
        itemCount: 0,
        categoryBreakdown: [],
        overBudgetCategories: [],
        lastUpdated: new Date(),
        currency: 'NGN',
      }

      // Map service BudgetItem -> client RawBudgetItem
      const items = rawItems.map((it: any) => ({
        id: it.id,
        userId: it.userId,
        category: it.category,
        // Some older UI expects these fields
        allocated: Number(it.budgetedAmount ?? it.allocated ?? 0),
        actual: Number(it.actualAmount ?? it.actual ?? 0),
        amount: Number(it.budgetedAmount ?? it.amount ?? 0),
        status: (it.isPaid ? 'paid' : (it.status ?? 'planned')) as 'planned'|'quoted'|'booked'|'paid',
        createdAt: (it.createdAt instanceof Date ? it.createdAt.toISOString() : it.createdAt) ?? new Date().toISOString(),
        updatedAt: (it.updatedAt instanceof Date ? it.updatedAt.toISOString() : it.updatedAt) ?? new Date().toISOString(),
        // Optionals the UI may read
        name: it.name,
      }))

      // Map service summary -> client summary
      const summary = {
        totalAmount: Number(rawSummary.totalBudget ?? 0),
        totalAllocated: Number(rawSummary.totalBudget ?? 0), // best approximation without separate allocated
        totalActual: Number(rawSummary.totalSpent ?? 0),
        remainingBudget: Number(rawSummary.totalRemaining ?? 0),
        percentSpent: Number(rawSummary.completionPercentage ?? 0),
      }

      // Validate against contract schemas to guarantee shape
      const data = BudgetListResponseDto.parse({ items, summary })
      return NextResponse.json({ success: true, data })
    } catch (error) {
      console.error('BudgetHandler.list error:', error)
      // Soft-fail with empty payload to avoid breaking UI during migrations/setup
      return NextResponse.json({ success: true, data: { items: [], summary: { totalAmount: 0, totalAllocated: 0, totalActual: 0, remainingBudget: 0, percentSpent: 0 } } })
    }
  }

  async create(request: NextRequest, userId: string) {
    try {
      const body = await request.json()
      // Adapter: accept legacy payload shape and map to service input
      const mapped = {
        category: body.category,
        name: body.name || body.title || `${body.category || 'Item'}`,
        description: body.description,
        budgetedAmount: Number(body.allocated ?? body.budgetedAmount ?? body.amount ?? 0),
        actualAmount: Number(body.actual ?? body.actualAmount ?? 0),
        currency: body.currency || 'NGN',
        priority: body.priority,
        vendorId: body.vendorId,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        isPaid: Boolean(body.isPaid),
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
        notes: body.notes,
      }

      const result = await this.service.createBudgetItem(userId, mapped as any)
      if (result.success) {
        const data = BudgetItemDto.parse(result.data)
        // Create notification (best-effort)
        try {
          await this.notifications.create(userId, { type: 'budget', title: 'Budget item added', body: data.name || data.category, entityRef: data.id })
          const allocated = Number((result.data as any).budgetedAmount ?? 0)
          const actual = Number((result.data as any).actualAmount ?? 0)
          if (allocated > 0) {
            const ratio = actual / allocated
            if (actual > allocated) {
              await this.notifications.createOnce(userId, { type: 'budget', title: 'Budget over allocated', body: `${data.name || data.category}: ${actual.toLocaleString()} > ${allocated.toLocaleString()}`, entityRef: data.id })
            } else if (ratio >= 0.9) {
              await this.notifications.createOnce(userId, { type: 'budget', title: 'Budget nearing limit', body: `${data.name || data.category}: ${Math.round(ratio*100)}% used`, entityRef: data.id })
            }
          }
        } catch {}
        return NextResponse.json({ success: true, data }, { status: 201 })
      }

      // Dev fallback: only allow in non-production
      if (process.env.NODE_ENV !== 'production') {
        const temp = await tempStorage.createBudgetItem({
          userId,
          category: mapped.category,
          allocated: Number(body.allocated ?? mapped.budgetedAmount ?? 0),
          actual: Number(body.actual ?? mapped.actualAmount ?? 0),
          amount: Number(body.amount ?? mapped.budgetedAmount ?? 0),
          status: body.status || (mapped.isPaid ? 'paid' : 'planned'),
          name: mapped.name,
        })
      try {
        await this.notifications.create(userId, { type: 'budget', title: 'Budget item added', body: temp.name || temp.category, entityRef: temp.id })
        const allocated = Number((temp as any).allocated ?? (temp as any).amount ?? 0)
        const actual = Number((temp as any).actual ?? 0)
        if (allocated > 0) {
          const ratio = actual / allocated
          if (actual > allocated) {
            await this.notifications.createOnce(userId, { type: 'budget', title: 'Budget over allocated', body: `${temp.name || temp.category}: ${actual.toLocaleString()} > ${allocated.toLocaleString()}`, entityRef: temp.id })
          } else if (ratio >= 0.9) {
            await this.notifications.createOnce(userId, { type: 'budget', title: 'Budget nearing limit', body: `${temp.name || temp.category}: ${Math.round(ratio*100)}% used`, entityRef: temp.id })
          }
        }
      } catch {}
      return NextResponse.json({ success: true, data: BudgetItemDto.parse(temp) }, { status: 201 })
      }
      return NextResponse.json({ success: false, error: { message: 'Database unavailable' } }, { status: 500 })
    } catch (e: any) {
      // As a last resort, return a generic error
      return NextResponse.json({ success: false, error: { message: e?.message || 'Failed to create budget item' } }, { status: 500 })
    }
  }

  async get(_request: NextRequest, userId: string, id: string) {
    // Service does not expose get-by-id; fall back to list and find
    const itemsRes = await this.service.getBudgetItems(userId)
    if (!itemsRes.success) return NextResponse.json({ success: false, error: itemsRes.error }, { status: itemsRes.error?.statusCode || 500 })
    const item = (itemsRes.data || []).find((i: any) => i.id === id) || null
    if (!item) return NextResponse.json({ success: false, error: { message: 'Budget item not found' } }, { status: 404 })
    return NextResponse.json({ success: true, data: item })
  }

  async update(request: NextRequest, userId: string, id: string) {
    const body = await request.json()
    const mapped = {
      category: body.category,
      name: body.name || body.title,
      description: body.description,
      budgetedAmount: body.allocated ?? body.budgetedAmount,
      actualAmount: body.actual ?? body.actualAmount,
      currency: body.currency,
      priority: body.priority,
      vendorId: body.vendorId,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      isPaid: body.isPaid,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
      notes: body.notes,
    }
    try {
      const result = await this.service.updateBudgetItem(userId, id, mapped as any)
      if (result.success && result.data) return NextResponse.json({ success: true, data: BudgetItemDto.parse(result.data) })

      // Dev fallback: only allow in non-production
      if (process.env.NODE_ENV !== 'production') {
        const updated = await tempStorage.updateBudgetItem(id, {
          category: mapped.category,
          name: mapped.name,
          allocated: typeof mapped.budgetedAmount === 'number' ? mapped.budgetedAmount : undefined as any,
          actual: typeof mapped.actualAmount === 'number' ? mapped.actualAmount : undefined as any,
          status: body.status,
        } as any)
      if (updated) {
        try {
          await this.notifications.create(userId, { type: 'budget', title: 'Budget item updated', body: updated.name || updated.category, entityRef: updated.id })
          const allocated = Number((updated as any).allocated ?? (updated as any).amount ?? 0)
          const actual = Number((updated as any).actual ?? 0)
          if (allocated > 0) {
            const ratio = actual / allocated
            if (actual > allocated) {
              await this.notifications.createOnce(userId, { type: 'budget', title: 'Budget over allocated', body: `${updated.name || updated.category}: ${actual.toLocaleString()} > ${allocated.toLocaleString()}`, entityRef: updated.id })
            } else if (ratio >= 0.9) {
              await this.notifications.createOnce(userId, { type: 'budget', title: 'Budget nearing limit', body: `${updated.name || updated.category}: ${Math.round(ratio*100)}% used`, entityRef: updated.id })
            }
          }
        } catch {}
        return NextResponse.json({ success: true, data: BudgetItemDto.parse(updated) })
      }
      }
      return NextResponse.json({ success: false, error: { message: 'Budget item not found' } }, { status: 404 })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: { message: e?.message || 'Failed to update budget item' } }, { status: 500 })
    }
  }

  async delete(_request: NextRequest, userId: string, id: string) {
    try {
      const result = await this.service.deleteBudgetItem(userId, id)
      if (result.success && result.data) return NextResponse.json({ success: true, message: 'Budget item deleted successfully' })
      // Dev fallback: only allow in non-production
      if (process.env.NODE_ENV !== 'production') {
        const ok = await tempStorage.deleteBudgetItem(id)
        if (ok) return NextResponse.json({ success: true, message: 'Budget item deleted successfully' })
      }
      return NextResponse.json({ success: false, error: { message: 'Budget item not found' } }, { status: 404 })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: { message: e?.message || 'Failed to delete budget item' } }, { status: 500 })
    }
  }
}
