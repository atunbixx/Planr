import { TimelineHandlerV2 } from '@/lib/api/handlers/timeline-handler-v2'

const handler = new TimelineHandlerV2()

export async function GET(request: Request) {
  return handler.list(request)
}

export async function POST(request: Request) {
  return handler.create(request)
}