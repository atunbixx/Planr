import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const startedAt = Date.now()

  let dbHealthy = false
  let dbError: string | undefined
  try {
    await prisma.$queryRaw`SELECT 1`
    dbHealthy = true
  } catch (err: any) {
    dbHealthy = false
    dbError = err?.message || 'Unknown database error'
  }

  const payload = {
    ok: true,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: {
      db: { healthy: dbHealthy, error: dbError },
    },
    durationMs: Date.now() - startedAt,
  }

  const status = dbHealthy ? 200 : 200 // Still return 200 to remain non-intrusive
  return NextResponse.json(payload, { status })
}

export const HEAD = GET

