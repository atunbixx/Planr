import { NextRequest } from 'next/server'
import { GuestRSVPHandler } from '@/lib/api/handlers/rsvp-handler'

const handler = new GuestRSVPHandler()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return handler.handle(request, { params: resolvedParams })
}