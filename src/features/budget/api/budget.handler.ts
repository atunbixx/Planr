import { NextRequest, NextResponse } from 'next/server'
import { BudgetService } from '../service/budget.service'

export class BudgetHandler {
  private service = new BudgetService()

  async list(_request: NextRequest, userId: string) {
    // Compose items + summary to match client expectations
    const [itemsRes, summaryRes] = await Promise.all([
      this.service.getBudgetItems(userId),
      this.service.getBudgetSummary(userId),
    ])

    if (!itemsRes.success) {
      return NextResponse.json({ success: false, error: itemsRes.error }, { status: itemsRes.error?.statusCode || 500 })
    }
    if (!summaryRes.success) {
      return NextResponse.json({ success: false, error: summaryRes.error }, { status: summaryRes.error?.statusCode || 500 })
    }

    return NextResponse.json({ success: true, data: { items: itemsRes.data || [], summary: summaryRes.data! } })
  }

  async create(request: NextRequest, userId: string) {
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
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
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
    const result = await this.service.updateBudgetItem(userId, id, mapped as any)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    if (!result.data) return NextResponse.json({ success: false, error: { message: 'Budget item not found' } }, { status: 404 })
    return NextResponse.json({ success: true, data: result.data })
  }

  async delete(_request: NextRequest, userId: string, id: string) {
    const result = await this.service.deleteBudgetItem(userId, id)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    if (!result.data) return NextResponse.json({ success: false, error: { message: 'Budget item not found' } }, { status: 404 })
    return NextResponse.json({ success: true, message: 'Budget item deleted successfully' })
  }
}
