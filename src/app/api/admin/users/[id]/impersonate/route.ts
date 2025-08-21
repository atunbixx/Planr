import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'
import { JWTService } from '@/lib/auth/jwt'

async function postHandler(request: any) {
  try {
    const id = request.url.split('/').slice(-2, -1)[0] || request.url.split('/').pop()!
    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 })
    if ((target as any).isActive === false) return NextResponse.json({ success: false, error: { message: 'Cannot impersonate deactivated user' } }, { status: 400 })
    const token = JWTService.generateImpersonationToken(target as any, request.user?.id)
    try {
      await prisma.adminAuditLog.create({ data: {
        adminUserId: request.user?.id || '00000000-0000-0000-0000-000000000000',
        action: 'user.impersonate',
        targetType: 'user',
        targetId: id,
        details: { note: 'Issued impersonation token (short-lived)' } as any,
        ip: (request.headers.get?.('x-forwarded-for') || request.headers.get?.('x-real-ip') || '') as string,
        ua: (request.headers.get?.('user-agent') || '') as string,
      } })
    } catch {}
    return NextResponse.json({ success: true, data: { token, user: { id: target.id, email: target.email, role: target.role, onboardingCompleted: target.onboardingCompleted } } })
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Failed' } }, { status: 500 })
  }
}

export const POST = requireSuperAdmin(postHandler)

