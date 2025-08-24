import { NextResponse } from 'next/server'
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { checkRateLimit } from '@/lib/security/rate-limit'

export function isSuperAdmin(user?: { email?: string|null }): boolean {
  if (!process.env.ADMIN_ENABLED) return false
  const emails = (process.env.ADMIN_EMAILS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)
  const u = (user?.email || '').toLowerCase()
  return !!u && emails.includes(u)
}

export function requireSuperAdmin<TArgs extends any[], TReturn>(handler: (req: AuthenticatedRequest, ...args: TArgs) => Promise<TReturn>) {
  return requireAuth(async (request: AuthenticatedRequest, ...args: TArgs) => {
    // Basic admin rate limiting by IP
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0].trim()
    const rl = checkRateLimit(`admin:${ip || 'unknown'}`)
    if (!rl.ok) {
      const res = NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 })
      res.headers.set('X-RateLimit-Limit', String(rl.limit))
      res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
      res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
      res.headers.set('Retry-After', String(Math.ceil(rl.retryAfter / 1000)))
      return res
    }
    if (process.env.ADMIN_ENABLED !== 'true') {
      return NextResponse.json({ success: false, error: { message: 'Admin disabled' } }, { status: 404 })
    }
    if (!isSuperAdmin(request.user)) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 403 })
    }
    const resp: any = await handler(request, ...args)
    try {
      if (resp && resp.headers) {
        resp.headers.set('X-RateLimit-Limit', String(rl.limit))
        resp.headers.set('X-RateLimit-Remaining', String(rl.remaining))
        resp.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
      }
    } catch {}
    return resp
  })
}
