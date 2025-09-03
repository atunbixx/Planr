import { NextRequest, NextResponse } from 'next/server'
import { VendorsService } from '../service/vendors.service'
import { startSpan } from '@/lib/observability/otel'
import { VendorDto, VendorListResponseDto } from '@/contracts/vendors'
import { NotificationRepository } from '@/features/notifications/repo/notification.repository'

export class VendorsHandler {
  private service = new VendorsService()
  private notifications = new NotificationRepository()

  async list(request: NextRequest, userId: string) {
    const span = await startSpan('vendors.list', { userId })
    try {
      const url = new URL(request.url)
      const sp = url.searchParams
      const q = sp.get('q') || undefined
      const category = sp.get('category') || undefined
      const status = sp.get('status') || undefined
      const page = sp.get('page') ? Math.max(1, parseInt(sp.get('page') || '1', 10)) : undefined
      const pageSize = sp.get('pageSize') ? Math.max(1, Math.min(100, parseInt(sp.get('pageSize') || '20', 10))) : undefined
      
      console.log('VendorsHandler.list called with:', { userId, q, category, status, page, pageSize })
      
      const result = await this.service.list(userId, { q, category, status, page, pageSize })
      console.log('Service result:', { success: result.success, error: result.error, dataLength: result.data?.vendors?.length })
      
      if (!result.success) {
        console.error('Service error:', result.error)
        return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
      }
      
      const vendors = (result.data?.vendors || []).map(v => {
        try {
          return VendorDto.parse(v)
        } catch (parseError) {
          console.error('VendorDto parse error for vendor:', v, 'Error:', parseError)
          throw parseError
        }
      })
      
      const data = VendorListResponseDto.parse({ vendors, total: result.data?.total ?? null, page: page ?? null, pageSize: pageSize ?? null })
      return NextResponse.json({ success: true, data })
    } catch (error) {
      console.error('VendorsHandler.list error:', error)
      return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Internal server error' } }, { status: 500 })
    } finally {
      span.end()
    }
  }

  async create(request: NextRequest, userId: string) {
    const span = await startSpan('vendors.create', { userId })
    try {
      const body = await request.json()
      const result = await this.service.create(userId, body)
      if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
      const data = VendorDto.parse(result.data)
      try { await this.notifications.create(userId, { type: 'vendor', title: 'Vendor added', body: data.name || data.category, entityRef: data.id }) } catch {}
      return NextResponse.json({ success: true, data }, { status: 201 })
    } finally { span.end() }
  }

  async get(_request: NextRequest, userId: string, id: string) {
    const span = await startSpan('vendors.get', { userId, id })
    try {
      const result = await this.service.get(userId, id)
      if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
      if (!result.data) return NextResponse.json({ success: false, error: { message: 'Vendor not found' } }, { status: 404 })
      return NextResponse.json({ success: true, data: VendorDto.parse(result.data) })
    } finally { span.end() }
  }

  async update(request: NextRequest, userId: string, id: string) {
    const span = await startSpan('vendors.update', { userId, id })
    try {
      const body = await request.json()
      const result = await this.service.update(userId, id, body)
      if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
      if (!result.data) return NextResponse.json({ success: false, error: { message: 'Vendor not found' } }, { status: 404 })
      const data = VendorDto.parse(result.data)
      if ((body as any).status) {
        try { await this.notifications.create(userId, { type: 'vendor', title: `Vendor ${String((body as any).status).toLowerCase()}`, body: data.name, entityRef: data.id }) } catch {}
      }
      return NextResponse.json({ success: true, data })
    } finally { span.end() }
  }

  async delete(_request: NextRequest, userId: string, id: string) {
    const span = await startSpan('vendors.delete', { userId, id })
    try {
      const result = await this.service.delete(userId, id)
      if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
      if (!result.data) return NextResponse.json({ success: false, error: { message: 'Vendor not found' } }, { status: 404 })
      return NextResponse.json({ success: true, message: 'Vendor deleted successfully' })
    } finally { span.end() }
  }
}
