import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'
import { checkRateLimit } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0].trim()
    const rl = checkRateLimit(`pub:inquire:${ip || 'unknown'}`, { windowMs: 60000, max: 30 })
    if (!rl.ok) {
      const res = NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 })
      res.headers.set('X-RateLimit-Limit', String(rl.limit))
      res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
      res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
      res.headers.set('Retry-After', String(Math.ceil(rl.retryAfter / 1000)))
      return res
    }
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
      const res = NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 })
      res.headers.set('X-RateLimit-Limit', String(rl.limit))
      res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
      res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
      return res
    } catch (e) {
      const created = await tempStorage.addDirectoryInquiry({ vendorId: id, name, email, phone, message, budget, eventDate: eventDate?.toISOString() })
      const res = NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 })
      res.headers.set('X-RateLimit-Limit', String(rl.limit))
      res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
      res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
      return res
    }
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Internal error' } }, { status: 500 })
  }
}
