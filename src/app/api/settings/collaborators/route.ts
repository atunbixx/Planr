import { SettingsHandlerV2 } from '@/lib/api/handlers/settings-handler-v2'

const handler = new SettingsHandlerV2()

export async function GET(request: Request) {
  return handler.listCollaborators(request)
}

export async function POST(request: Request) {
  return handler.inviteCollaborator(request)
}