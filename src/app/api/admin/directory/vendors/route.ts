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
    const isSuspended = sp.get('isSuspended')
    const flag = sp.get('flag') || undefined // filter vendors that include given fraud flag
    const where: any = {}
    if (q) where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { website: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
      { region: { contains: q, mode: 'insensitive' } },
    ]
    if (isSuspended === 'true') where.isSuspended = true
    if (isSuspended === 'false') where.isSuspended = false
    if (flag) where.fraudFlags = { has: flag }
    const total = await prisma.directoryVendor.count({ where }).catch(()=>0)
    const vendors = await prisma.directoryVendor.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (page-1)*pageSize, take: pageSize }).catch(()=>[])
    return NextResponse.json({ success: true, data: { vendors, total, page, pageSize } })
  } catch (e) {
    return NextResponse.json({ success: true, data: { vendors: [], total: 0, page: 1, pageSize: 20 } })
  }
}

export const GET = requireSuperAdmin(handler)

