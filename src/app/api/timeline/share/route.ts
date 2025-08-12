import { TimelineHandlerV2 } from '@/lib/api/handlers/timeline-handler-v2'

const handler = new TimelineHandlerV2()

export async function POST(request: Request) {
  return handler.shareTimeline(request)
}