import { NotificationStreamHandler } from '@/lib/api/handlers/notifications-handler'

const handler = new NotificationStreamHandler()

export async function GET(request: Request) {
  return handler.handle(request as any)
}