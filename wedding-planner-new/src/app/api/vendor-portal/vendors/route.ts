import { NextResponse } from 'next/server'
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { detectDirectoryDuplicate, enrichNormalizedFields } from '@/features/vendors/anti-abuse'

async function listHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  try {
    const vendors = await prisma.directoryVendor.findMany({ where: { ownerUserId: userId }, orderBy: { updatedAt: 'desc' } })
    return NextResponse.json({ success: true, data: { vendors } })
  } catch (e) {
    return NextResponse.json({ success: true, data: { vendors: [] } })
  }
}

async function createHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  const body = await request.json().catch(()=>({}))
  const name = String(body?.name || '').trim()
  const category = String(body?.category || '').trim()
  if (!name || !category) return NextResponse.json({ success: false, error: { message: 'name and category required' } }, { status: 400 })
  try {
    // Anti-duplication check
    const dup = await detectDirectoryDuplicate({
      ownerUserId: userId,
      name,
      category,
      region: body?.region || undefined,
      website: body?.website || undefined,
      email: body?.email || undefined,
      phone: body?.phone || undefined,
    })
    if (dup.isStrongDuplicate) {
      return NextResponse.json({ success: false, error: { message: `Possible duplicate (${dup.strongReason}) detected. Please update your listing instead.`, code: 'DUPLICATE_LISTING' } }, { status: 409 })
    }

    const created = await prisma.directoryVendor.create({ data: {
      ownerUserId: userId,
      name,
      category,
      city: body?.city || null,
      region: body?.region || null,
      priceBand: body?.priceBand || null,
      shortDescription: body?.shortDescription || null,
      description: body?.description || null,
      email: body?.email || null,
      phone: body?.phone || null,
      website: body?.website || null,
      ...enrichNormalizedFields(body),
      tags: Array.isArray(body?.tags) ? body.tags : [],
      fraudFlags: (dup.similarMatches && dup.similarMatches.length) ? ['similar_name'] : [],
    } })
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Failed to create vendor' } }, { status: 500 })
  }
}

export const GET = requireAuth(listHandler)
export const POST = requireAuth(createHandler)
