import { NextResponse } from 'next/server'
import { requireSuperAdmin, } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'

async function handler() {
  try {
    const [users, vendors, dirVendors] = await Promise.all([
      prisma.user.count().catch(()=>0),
      prisma.vendor.count().catch(()=>0),
      prisma.directoryVendor.count().catch(()=>0),
    ])
    const regions = await prisma.directoryVendor.groupBy({ by: ['region'], _count: { _all: true } }).catch(()=>[] as any[])
    return NextResponse.json({ success: true, data: { users, vendors, directoryVendors: dirVendors, regions } })
  } catch (e) {
    return NextResponse.json({ success: true, data: { users: 0, vendors: 0, directoryVendors: 0, regions: [] } })
  }
}

export const GET = requireSuperAdmin(handler)

