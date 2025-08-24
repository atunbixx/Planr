import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'

async function handler() {
  try {
    const now = new Date()
    const d7 = new Date(now.getTime() - 7*24*60*60*1000)
    const d30 = new Date(now.getTime() - 30*24*60*60*1000)
    const [
      newVendors7,
      newVendors30,
      flagged,
      suspended,
      inquiries7,
      inquiries30,
    ] = await Promise.all([
      prisma.directoryVendor.count({ where: { createdAt: { gte: d7 } } }).catch(()=>0),
      prisma.directoryVendor.count({ where: { createdAt: { gte: d30 } } }).catch(()=>0),
      prisma.directoryVendor.count({ where: { fraudFlags: { isEmpty: false } } }).catch(()=>0),
      prisma.directoryVendor.count({ where: { isSuspended: true } }).catch(()=>0),
      prisma.directoryInquiry.count({ where: { createdAt: { gte: d7 } } }).catch(()=>0),
      prisma.directoryInquiry.count({ where: { createdAt: { gte: d30 } } }).catch(()=>0),
    ])
    return NextResponse.json({ success: true, data: { newVendors7, newVendors30, flagged, suspended, inquiries7, inquiries30 } })
  } catch (e) {
    return NextResponse.json({ success: true, data: { newVendors7: 0, newVendors30: 0, flagged: 0, suspended: 0, inquiries7: 0, inquiries30: 0 } })
  }
}

export const GET = requireSuperAdmin(handler)

