import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'

async function handler(request: Request) {
  try {
    const url = new URL(request.url)
    const sp = url.searchParams
    const q = sp.get('q') || undefined
    const adminUserId = sp.get('adminUserId') || undefined
    const targetType = sp.get('targetType') || undefined
    const targetId = sp.get('targetId') || undefined
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
    const pageSize = Math.max(1, Math.min(100, parseInt(sp.get('pageSize') || '20', 10)))
    const where: any = {}
    if (adminUserId) where.adminUserId = adminUserId
    if (targetType) where.targetType = targetType
    if (targetId) where.targetId = targetId
    if (q) where.OR = [
      { action: { contains: q, mode: 'insensitive' } },
      { targetType: { contains: q, mode: 'insensitive' } },
      { targetId: { contains: q, mode: 'insensitive' } },
      // details JSON search not supported in a portable way here
    ]
    const total = await prisma.adminAuditLog.count({ where }).catch(()=>0)
    const logs = await prisma.adminAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page-1)*pageSize, take: pageSize }).catch(()=>[])
    // Enrich with admin emails
    const adminIds = Array.from(new Set((logs || []).map((l: any)=>l.adminUserId).filter(Boolean)))
    let adminMap: Record<string, string> = {}
    if (adminIds.length) {
      const admins = await prisma.user.findMany({ where: { id: { in: adminIds } }, select: { id: true, email: true } }).catch(()=>[])
      adminMap = Object.fromEntries(admins.map((u:any)=>[u.id, u.email]))
    }
    const enriched = (logs || []).map((l: any)=>({ ...l, adminEmail: adminMap[l.adminUserId] || null }))
    return NextResponse.json({ success: true, data: { logs: enriched, total, page, pageSize } })
  } catch (e) {
    return NextResponse.json({ success: true, data: { logs: [], total: 0, page: 1, pageSize: 20 } })
  }
}

export const GET = requireSuperAdmin(handler)
