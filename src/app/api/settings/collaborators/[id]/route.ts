import { SettingsHandlerV2 } from '@/lib/api/handlers/settings-handler-v2'

const handler = new SettingsHandlerV2()

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return handler.updateCollaborator(request, params.id)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return handler.removeCollaborator(request, params.id)
}