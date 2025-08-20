import { NextResponse } from 'next/server'
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'

async function updateHandler(request: AuthenticatedRequest, id: string) {
  const userId = request.user!.id
  const body = await request.json().catch(()=>({}))
  try {
    const existing = await prisma.directoryVendor.findUnique({ where: { id } })
    if (!existing || existing.ownerUserId !== userId) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
    const updated = await prisma.directoryVendor.update({ where: { id }, data: {
      name: body?.name ?? undefined,
      category: body?.category ?? undefined,
      city: body?.city ?? undefined,
      region: body?.region ?? undefined,
      priceBand: body?.priceBand ?? undefined,
      shortDescription: body?.shortDescription ?? undefined,
      description: body?.description ?? undefined,
      email: body?.email ?? undefined,
      phone: body?.phone ?? undefined,
      website: body?.website ?? undefined,
      tags: Array.isArray(body?.tags) ? body.tags : undefined,
    } })
    return NextResponse.json({ success: true, data: updated })
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Update failed' } }, { status: 500 })
  }
}

export const PUT = requireAuth(async (request: AuthenticatedRequest) => {
  const id = request.url.split('/').pop()!
  return updateHandler(request, id)
})

