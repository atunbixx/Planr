import { NextRequest, NextResponse } from 'next/server'
import { VendorsService } from '../service/vendors.service'
import { VendorDto, VendorListResponseDto } from '@/contracts/vendors'

export class VendorsHandler {
  private service = new VendorsService()

  async list(request: NextRequest, userId: string) {
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
    }
  }

  async create(request: NextRequest, userId: string) {
    const body = await request.json()
    const result = await this.service.create(userId, body)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    return NextResponse.json({ success: true, data: VendorDto.parse(result.data) }, { status: 201 })
  }

  async get(_request: NextRequest, userId: string, id: string) {
    const result = await this.service.get(userId, id)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    if (!result.data) return NextResponse.json({ success: false, error: { message: 'Vendor not found' } }, { status: 404 })
    return NextResponse.json({ success: true, data: VendorDto.parse(result.data) })
  }

  async update(request: NextRequest, userId: string, id: string) {
    const body = await request.json()
    const result = await this.service.update(userId, id, body)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    if (!result.data) return NextResponse.json({ success: false, error: { message: 'Vendor not found' } }, { status: 404 })
    return NextResponse.json({ success: true, data: VendorDto.parse(result.data) })
  }

  async delete(_request: NextRequest, userId: string, id: string) {
    const result = await this.service.delete(userId, id)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    if (!result.data) return NextResponse.json({ success: false, error: { message: 'Vendor not found' } }, { status: 404 })
    return NextResponse.json({ success: true, message: 'Vendor deleted successfully' })
  }
}
