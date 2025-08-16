import { NextRequest } from 'next/server'
import { TimelineHandlerV2 } from '@/lib/api/handlers/timeline-handler-v2'

const handler = new TimelineHandlerV2()

export async function GET(request: NextRequest) {
  return handler.list(request)
}

export async function POST(request: NextRequest) {
  return handler.create(request)
}