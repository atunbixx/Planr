import { NotificationsHandler } from '@/lib/api/handlers/notifications-handler'

const handler = new NotificationsHandler()

export async function GET(request: Request) {
  return handler.handle(request as any)
}

export async function POST(request: Request) {
  return handler.handle(request as any)
}