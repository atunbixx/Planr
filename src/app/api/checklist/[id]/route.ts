import { ChecklistHandlerV2 } from '@/lib/api/handlers/checklist-handler-v2'

const handler = new ChecklistHandlerV2()

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return handler.update(request, params.id)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return handler.delete(request, params.id)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return handler.toggleComplete(request, params.id)
}