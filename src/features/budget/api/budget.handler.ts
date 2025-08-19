import { NextRequest, NextResponse } from 'next/server'
import { BudgetService } from '../service/budget.service'

export class BudgetHandler {
  private service = new BudgetService()

  async list(_request: NextRequest, userId: string) {
    const result = await this.service.list(userId)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    return NextResponse.json({ success: true, data: result.data })
  }

  async create(request: NextRequest, userId: string) {
    const body = await request.json()
    const result = await this.service.create(userId, body)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  }

  async get(_request: NextRequest, userId: string, id: string) {
    const result = await this.service.get(userId, id)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    if (!result.data) return NextResponse.json({ success: false, error: { message: 'Budget item not found' } }, { status: 404 })
    return NextResponse.json({ success: true, data: result.data })
  }

  async update(request: NextRequest, userId: string, id: string) {
    const body = await request.json()
    const result = await this.service.update(userId, id, body)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    if (!result.data) return NextResponse.json({ success: false, error: { message: 'Budget item not found' } }, { status: 404 })
    return NextResponse.json({ success: true, data: result.data })
  }

  async delete(_request: NextRequest, userId: string, id: string) {
    const result = await this.service.delete(userId, id)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    if (!result.data) return NextResponse.json({ success: false, error: { message: 'Budget item not found' } }, { status: 404 })
    return NextResponse.json({ success: true, message: 'Budget item deleted successfully' })
  }
}

