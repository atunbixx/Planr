import { NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'
import { TEAM_ROLES } from '@/data/dashboard-config'

function normalize(str?: string | null) {
  return (str || '').trim().toLowerCase()
}

function computeRoles(vendors: Array<{ category?: string | null; status?: any }>) {
  return TEAM_ROLES.map(role => {
    const hired = vendors.some(v => role.categories.includes(normalize(v.category)) && ['booked','contracted','paid'].includes((v.status as any) || ''))
    return { role: role.label, key: role.key, status: hired ? 'hired' : 'needed' }
  })
}

async function handler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  try {
    const vendors = await prisma.vendor.findMany({ where: { userId }, select: { category: true, status: true } })
    return NextResponse.json({ success: true, data: computeRoles(vendors) })
  } catch (_) {
    try {
      const { vendors } = await tempStorage.listVendors(userId)
      return NextResponse.json({ success: true, data: computeRoles(vendors as any) })
    } catch (err) {
      return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
    }
  }
}

export const GET = requireOnboarding(handler)

