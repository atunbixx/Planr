import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'

async function handler(request: Request) {
  try {
    const url = new URL(request.url)
    const sp = url.searchParams
    const q = sp.get('q') || undefined
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
    const pageSize = Math.max(1, Math.min(100, parseInt(sp.get('pageSize') || '20', 10)))
    const where: any = {}
    if (q) where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
    ]
    const total = await prisma.user.count({ where }).catch(()=>0)
    const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page-1)*pageSize, take: pageSize }).catch(()=>[])
    return NextResponse.json({ success: true, data: { users, total, page, pageSize } })
  } catch (e) {
    return NextResponse.json({ success: true, data: { users: [], total: 0, page: 1, pageSize: 20 } })
  }
}

export const GET = requireSuperAdmin(handler)

