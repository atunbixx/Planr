import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'
import { NotificationRepository } from '@/features/notifications/repo/notification.repository'

type Payload = {
  target: 'all' | 'email' | 'userId'
  emails?: string[]
  userIds?: string[]
  title?: string
  body?: string
}

async function postHandler(request: any) {
  try {
    const body = await request.json().catch(()=>({})) as Payload
    const title = (body?.title || '').trim()
    const message = (body?.body || '').trim()
    if (!title || !message) return NextResponse.json({ success: false, error: { message: 'Title and body are required' } }, { status: 400 })

    let userIds: string[] = []
    if (body.target === 'all') {
      const users = await prisma.user.findMany({ select: { id: true } })
      userIds = users.map(u => u.id)
    } else if (body.target === 'email') {
      const emails = (body.emails || []).map(e => String(e).trim()).filter(Boolean)
      if (!emails.length) return NextResponse.json({ success: false, error: { message: 'Emails required' } }, { status: 400 })
      const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } })
      userIds = users.map(u => u.id)
    } else if (body.target === 'userId') {
      userIds = (body.userIds || []).map(id => String(id).trim()).filter(Boolean)
      if (!userIds.length) return NextResponse.json({ success: false, error: { message: 'User IDs required' } }, { status: 400 })
    } else {
      return NextResponse.json({ success: false, error: { message: 'Invalid target' } }, { status: 400 })
    }

    if (!userIds.length) return NextResponse.json({ success: false, error: { message: 'No recipients found' } }, { status: 404 })

    const repo = new NotificationRepository()
    // Avoid long transactions: create sequentially in batches
    const batch = 200
    for (let i = 0; i < userIds.length; i += batch) {
      const slice = userIds.slice(i, i + batch)
      await Promise.all(slice.map(uid => repo.create(uid, { type: 'admin', title, body: message })))
    }

    try {
      await prisma.adminAuditLog.create({ data: {
        adminUserId: request.user?.id || '00000000-0000-0000-0000-000000000000',
        action: 'notifications.broadcast',
        targetType: 'system',
        targetId: 'broadcast',
        details: { target: body.target, count: userIds.length, title } as any,
        ip: (request.headers.get?.('x-forwarded-for') || request.headers.get?.('x-real-ip') || '') as string,
        ua: (request.headers.get?.('user-agent') || '') as string,
      } })
    } catch {}

    return NextResponse.json({ success: true, data: { recipients: userIds.length } })
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Failed to send notifications' } }, { status: 500 })
  }
}

export const POST = requireSuperAdmin(postHandler)

