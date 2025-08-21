import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'
import { detectDirectoryDuplicate } from '@/features/vendors/anti-abuse'

async function patchHandler(request: any) {
  try {
    const id = request.url.split('/').pop()!
    const body = await request.json().catch(()=>({}))
    const updates: any = {}
    if (typeof body?.isSuspended === 'boolean') updates.isSuspended = body.isSuspended
    if (Array.isArray(body?.fraudFlags)) updates.fraudFlags = body.fraudFlags
    if (typeof body?.resolveFlags === 'boolean' && body.resolveFlags === true) updates.fraudFlags = []
    if (typeof body?.duplicateOfId === 'string') updates.duplicateOfId = body.duplicateOfId || null
    if (!Object.keys(updates).length) {
      return NextResponse.json({ success: false, error: { message: 'No changes' } }, { status: 400 })
    }

    const before = await prisma.directoryVendor.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })

    const updated = await prisma.directoryVendor.update({ where: { id }, data: updates })

    // Audit log
    try {
      const adminUserId = request.user?.id || '00000000-0000-0000-0000-000000000000'
      await prisma.adminAuditLog.create({ data: {
        adminUserId,
        action: 'directory_vendor.update',
        targetType: 'directory_vendor',
        targetId: id,
        details: { before: { isSuspended: before.isSuspended, fraudFlags: before.fraudFlags, duplicateOfId: (before as any).duplicateOfId || null }, after: { isSuspended: updated.isSuspended, fraudFlags: updated.fraudFlags, duplicateOfId: (updated as any).duplicateOfId || null } } as any,
        ip: (request.headers.get?.('x-forwarded-for') || request.headers.get?.('x-real-ip') || '') as string,
        ua: (request.headers.get?.('user-agent') || '') as string,
      } })
    } catch {}

    return NextResponse.json({ success: true, data: updated })
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Update failed' } }, { status: 500 })
  }
}

export const PATCH = requireSuperAdmin(patchHandler)

async function getHandler(request: any) {
  try {
    const id = request.url.split('/').pop()!
    const v = await prisma.directoryVendor.findUnique({ where: { id } })
    if (!v) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
    const owner = v.ownerUserId ? await prisma.user.findUnique({ where: { id: v.ownerUserId }, select: { id: true, email: true } }) : null
    const inquiries = await prisma.directoryInquiry.findMany({ where: { vendorId: id }, orderBy: { createdAt: 'desc' }, take: 10 }).catch(()=>[])
    const dup = await detectDirectoryDuplicate({ id: v.id, name: v.name, website: v.website || undefined, email: v.email || undefined, phone: v.phone || undefined, category: v.category, region: v.region || undefined })
    // Also collect hard candidates by same normalized fields
    const candidates = await prisma.directoryVendor.findMany({ where: {
      OR: [
        v.websiteHost ? { websiteHost: v.websiteHost } : undefined,
        v.emailLower ? { emailLower: v.emailLower } : undefined,
        v.phoneDigits ? { phoneDigits: v.phoneDigits } : undefined,
      ].filter(Boolean) as any[],
      NOT: { id: v.id },
    } }).catch(()=>[])
    return NextResponse.json({ success: true, data: { vendor: v, owner, inquiries, similar: dup.similarMatches || [], candidates } })
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Internal error' } }, { status: 500 })
  }
}

export const GET = requireSuperAdmin(getHandler)
