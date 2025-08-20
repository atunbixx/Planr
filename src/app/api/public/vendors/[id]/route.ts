import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: Request) {
  try {
    const id = request.url.split('/').pop()!
    const vendor = await prisma.directoryVendor.findUnique({ where: { id } })
    if (!vendor) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
    return NextResponse.json({ success: true, data: vendor })
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: 'Internal error' } }, { status: 500 })
  }
}

