import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkRateLimit } from '@/lib/security/rate-limit'

export async function GET(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0].trim()
    const rl = checkRateLimit(`pub:vendor:${ip || 'unknown'}`, { windowMs: 60000, max: 600 })
    if (!rl.ok) {
      const res = NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 })
      res.headers.set('X-RateLimit-Limit', String(rl.limit))
      res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
      res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
      res.headers.set('Retry-After', String(Math.ceil(rl.retryAfter / 1000)))
      return res
    }
    const id = request.url.split('/').pop()!
    const vendor = await prisma.directoryVendor.findUnique({ where: { id } })
    if (!vendor) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
    const res = NextResponse.json({ success: true, data: vendor })
    res.headers.set('X-RateLimit-Limit', String(rl.limit))
    res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
    res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
    return res
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Internal error' } }, { status: 500 })
  }
}
