import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'

async function getHandler(request: Request) {
  try {
    const id = request.url.split('/').pop()!
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
    const [vendors, guests, budgets, dirVendors] = await Promise.all([
      prisma.vendor.count({ where: { userId: id } }).catch(()=>0),
      prisma.guest.count({ where: { userId: id } }).catch(()=>0),
      prisma.budget.count({ where: { userId: id } }).catch(()=>0),
      prisma.directoryVendor.count({ where: { ownerUserId: id } }).catch(()=>0),
    ])
    return NextResponse.json({ success: true, data: { user, stats: { vendors, guests, budgets, directoryVendors: dirVendors } } })
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Internal error' } }, { status: 500 })
  }
}

export const GET = requireSuperAdmin(getHandler)

async function patchHandler(request: any) {
  try {
    const id = request.url.split('/').pop()!
    const body = await request.json().catch(()=>({}))
    const updates: any = {}
    if (typeof body?.isActive === 'boolean') updates.isActive = body.isActive
    if (typeof body?.role === 'string') {
      const r = String(body.role).trim()
      const allowed = ['couple','planner','vendor']
      if (!allowed.includes(r)) {
        return NextResponse.json({ success: false, error: { message: 'Invalid role' } }, { status: 400 })
      }
      updates.role = r
    }
    if (!Object.keys(updates).length) {
      return NextResponse.json({ success: false, error: { message: 'No changes' } }, { status: 400 })
    }
    const before = await prisma.user.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
    const updated = await prisma.user.update({ where: { id }, data: updates })
    try {
      await prisma.adminAuditLog.create({ data: {
        adminUserId: request.user?.id || '00000000-0000-0000-0000-000000000000',
        action: 'user.update',
        targetType: 'user',
        targetId: id,
        details: { before: { isActive: (before as any).isActive, role: before.role }, after: { isActive: (updated as any).isActive, role: updated.role } } as any,
        ip: (request.headers.get?.('x-forwarded-for') || request.headers.get?.('x-real-ip') || '') as string,
        ua: (request.headers.get?.('user-agent') || '') as string,
      } })
    } catch {}
    return NextResponse.json({ success: true, data: { id: updated.id, isActive: (updated as any).isActive, role: updated.role } })
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Update failed' } }, { status: 500 })
  }
}

export const PATCH = requireSuperAdmin(patchHandler)
