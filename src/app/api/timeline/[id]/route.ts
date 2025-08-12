import { TimelineHandlerV2 } from '@/lib/api/handlers/timeline-handler-v2'

const handler = new TimelineHandlerV2()

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return handler.update(request, params.id)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return handler.delete(request, params.id)
}