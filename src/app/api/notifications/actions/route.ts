import { NotificationActionsHandler } from '@/lib/api/handlers/notifications-handler'

const handler = new NotificationActionsHandler()

export async function POST(request: Request) {
  return handler.handle(request as any)
}