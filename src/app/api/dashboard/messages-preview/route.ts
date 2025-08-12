import { DashboardMessagesPreviewHandler } from '@/lib/api/handlers/analytics-handler'

const handler = new DashboardMessagesPreviewHandler()

export async function GET(request: Request) {
  return handler.handle(request as any)
}