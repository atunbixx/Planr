import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'

export async function POST(request: Request) {
  try {
    const id = request.url.split('/').slice(-2, -1)[0] || request.url.split('/').pop()!
    const body = await request.json().catch(() => ({}))
    const name = String(body?.name || '').trim()
    const email = String(body?.email || '').trim()
    const message = String(body?.message || '').trim()
    const phone = body?.phone ? String(body.phone) : undefined
    const budget = body?.budget !== undefined ? Number(body.budget) : undefined
    const eventDate = body?.eventDate ? new Date(String(body.eventDate)) : undefined
    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: { message: 'name, email and message are required' } }, { status: 400 })
    }
    try {
      const created = await prisma.directoryInquiry.create({ data: { vendorId: id, name, email, phone, message, budget: (budget as any), eventDate } })
      return NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 })
    } catch (e) {
      const created = await tempStorage.addDirectoryInquiry({ vendorId: id, name, email, phone, message, budget, eventDate: eventDate?.toISOString() })
      return NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 })
    }
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Internal error' } }, { status: 500 })
  }
}

