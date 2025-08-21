import { NextResponse } from 'next/server'
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!
    if (!user?.impersonating || !user?.impersonatedBy) {
      return NextResponse.json({ success: false, error: { message: 'Not impersonating' } }, { status: 400 })
    }
    try {
      await prisma.adminAuditLog.create({ data: {
        adminUserId: user.impersonatedBy,
        action: 'user.impersonate.end',
        targetType: 'user',
        targetId: user.id,
        details: { note: 'Ended impersonation session' } as any,
        ip: (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''),
        ua: (request.headers.get('user-agent') || ''),
      } })
    } catch {}
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Internal error' } }, { status: 500 })
  }
}

export const POST = requireAuth(handler)

