import { NextRequest, NextResponse } from 'next/server'
import { SeatingService } from '../service/seating.service'

export class SeatingHandler {
  private service: SeatingService

  constructor() {
    this.service = new SeatingService()
  }

  async list(request: NextRequest, userId: string): Promise<NextResponse> {
    const result = await this.service.listTables(userId)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    return NextResponse.json({ success: true, data: { tables: result.data } })
  }

  async create(request: NextRequest, userId: string): Promise<NextResponse> {
    const body = await request.json()
    const result = await this.service.createTable(userId, { name: String(body?.name || 'Table'), capacity: Number(body?.capacity || 0) })
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  }

  async update(request: NextRequest, userId: string, id: string): Promise<NextResponse> {
    const body = await request.json()
    const result = await this.service.updateTable(userId, id, { name: body?.name, capacity: body?.capacity })
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    if (!result.data) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
    return NextResponse.json({ success: true, data: result.data })
  }

  async delete(_request: NextRequest, userId: string, id: string): Promise<NextResponse> {
    const result = await this.service.deleteTable(userId, id)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    if (!result.data) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
    return NextResponse.json({ success: true })
  }

  async assign(request: NextRequest, userId: string): Promise<NextResponse> {
    const body = await request.json()
    const action = body?.action || 'assign'
    if (action === 'assign') {
      const result = await this.service.assignGuests(userId, String(body?.tableId || ''), Array.isArray(body?.guestIds) ? body.guestIds : [])
      if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
      if (!result.data) return NextResponse.json({ success: false, error: { message: 'Table not found' } }, { status: 404 })
      return NextResponse.json({ success: true, data: result.data })
    }
    if (action === 'unassign') {
      const result = await this.service.unassignGuest(userId, String(body?.guestId || ''))
      if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
      return NextResponse.json({ success: true, data: { unassigned: result.data } })
    }
    if (action === 'autoAssign') {
      const result = await this.service.autoAssign(userId, Array.isArray(body?.guestIds) ? body.guestIds : [], Boolean(body?.groupByRelationship))
      if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
      return NextResponse.json({ success: true, data: { tables: result.data } })
    }
    return NextResponse.json({ success: false, error: { message: 'Invalid action' } }, { status: 400 })
  }
}

