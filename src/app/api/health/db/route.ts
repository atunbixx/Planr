import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const startedAt = Date.now()
  try {
    // Simple connectivity check
    await prisma.$queryRaw`SELECT 1` as unknown
    const latencyMs = Date.now() - startedAt
    return NextResponse.json({
      ok: true,
      provider: 'postgresql',
      latencyMs,
      env: process.env.NODE_ENV,
    })
  } catch (e: any) {
    const latencyMs = Date.now() - startedAt
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || 'DB check failed',
        provider: 'postgresql',
        latencyMs,
        env: process.env.NODE_ENV,
      },
      { status: 503 }
    )
  }
}

