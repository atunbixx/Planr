import { DashboardTasksHandler } from '@/lib/api/handlers/analytics-handler'

const handler = new DashboardTasksHandler()

export async function GET(request: Request) {
  return handler.handle(request as any)
}