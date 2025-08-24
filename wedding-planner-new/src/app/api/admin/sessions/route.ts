import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'

async function handler(request: Request) {
  try {
    const url = new URL(request.url)
    const sp = url.searchParams
    const userId = sp.get('userId') || undefined
    const activeOnly = sp.get('activeOnly') === 'true'
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
    const pageSize = Math.max(1, Math.min(100, parseInt(sp.get('pageSize') || '20', 10)))
    const where: any = {}
    if (userId) where.userId = userId
    if (activeOnly) where.revokedAt = null
    const total = await prisma.session.count({ where }).catch(()=>0)
    const sessions = await prisma.session.findMany({ where, orderBy: { lastActiveAt: 'desc' }, skip: (page-1)*pageSize, take: pageSize }).catch(()=>[])
    const userIds = Array.from(new Set((sessions||[]).map((s:any)=>s.userId)))
    let emailMap: Record<string,string> = {}
    if (userIds.length) {
      const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } }).catch(()=>[])
      emailMap = Object.fromEntries(users.map((u:any)=>[u.id, u.email]))
    }
    const enriched = (sessions||[]).map((s:any)=>({ ...s, userEmail: emailMap[s.userId] || null }))
    return NextResponse.json({ success: true, data: { sessions: enriched, total, page, pageSize } })
  } catch (e) {
    return NextResponse.json({ success: true, data: { sessions: [], total: 0, page: 1, pageSize: 20 } })
  }
}

export const GET = requireSuperAdmin(handler)
