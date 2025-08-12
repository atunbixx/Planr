import { NextRequest } from 'next/server'
import { PublicRSVPHandler } from '@/lib/api/handlers/rsvp-handler'

const handler = new PublicRSVPHandler()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const resolvedParams = await params
  return handler.handle(request, { params: resolvedParams })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const resolvedParams = await params
  return handler.handle(request, { params: resolvedParams })
}