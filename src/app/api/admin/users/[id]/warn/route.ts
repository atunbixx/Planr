import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { NotificationRepository } from '@/features/notifications/repo/notification.repository'
import { prisma } from '@/lib/db/prisma'

async function postHandler(request: any) {
  try {
    const segments = request.url.split('/')
    const id = segments[segments.indexOf('users') + 1]
    if (!id) return NextResponse.json({ success: false, error: { message: 'User id required' } }, { status: 400 })

    const body = await request.json().catch(()=>({})) as { title?: string; body?: string }
    const title = (body?.title || '').trim()
    const message = (body?.body || '').trim()
    if (!title || !message) {
      return NextResponse.json({ success: false, error: { message: 'Title and body are required' } }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 })

    const repo = new NotificationRepository()
    await repo.create(id, { type: 'admin', title, body: message })

    try {
      await prisma.adminAuditLog.create({ data: {
        adminUserId: request.user?.id || '00000000-0000-0000-0000-000000000000',
        action: 'user.warn',
        targetType: 'user',
        targetId: id,
        details: { title, body: message } as any,
        ip: (request.headers.get?.('x-forwarded-for') || request.headers.get?.('x-real-ip') || '') as string,
        ua: (request.headers.get?.('user-agent') || '') as string,
      } })
    } catch {}

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Failed to send warning' } }, { status: 500 })
  }
}

export const POST = requireSuperAdmin(postHandler)

