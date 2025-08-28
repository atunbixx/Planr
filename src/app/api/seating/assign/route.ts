import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { success: false, error: { message: 'Deprecated endpoint. Use /api/seating/seats/[id]/assign.' } },
    { status: 410 }
  )
}
