import { NotificationPreferencesHandler } from '@/lib/api/handlers/notifications-handler'

const handler = new NotificationPreferencesHandler()

export async function GET(request: Request) {
  return handler.handle(request as any)
}

export async function PUT(request: Request) {
  return handler.handle(request as any)
}

export async function PATCH(request: Request) {
  return handler.handle(request as any)
}