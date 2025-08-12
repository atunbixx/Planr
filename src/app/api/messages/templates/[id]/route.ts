import { MessagesHandlerV2 } from '@/lib/api/handlers/messages-handler-v2'

const handler = new MessagesHandlerV2()

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return handler.updateTemplate(request, params.id)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return handler.deleteTemplate(request, params.id)
}