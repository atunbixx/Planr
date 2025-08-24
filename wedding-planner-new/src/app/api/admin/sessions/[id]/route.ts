import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'

async function patchHandler(request: any) {
  try {
    const id = request.url.split('/').pop()!
    const body = await request.json().catch(()=>({}))
    const revoke = body?.revoke === true
    if (!revoke) return NextResponse.json({ success: false, error: { message: 'Unsupported' } }, { status: 400 })
    const existing = await prisma.session.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
    const updated = await prisma.session.update({ where: { id }, data: { revokedAt: new Date() } })
    try {
      await prisma.adminAuditLog.create({ data: {
        adminUserId: request.user?.id || '00000000-0000-0000-0000-000000000000',
        action: 'session.revoke',
        targetType: 'session',
        targetId: id,
        details: { userId: existing.userId } as any,
        ip: (request.headers.get?.('x-forwarded-for') || request.headers.get?.('x-real-ip') || '') as string,
        ua: (request.headers.get?.('user-agent') || '') as string,
      } })
    } catch {}
    return NextResponse.json({ success: true, data: { id: updated.id, revokedAt: updated.revokedAt } })
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Update failed' } }, { status: 500 })
  }
}

export const PATCH = requireSuperAdmin(patchHandler)

